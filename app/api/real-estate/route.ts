import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function logNotification(sector: string, action_type: string, title: string, message: string, link: string) {
  try {
    const notifId = `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await query(`
      INSERT INTO system_notifications (notification_id, sector, action_type, title, message, link, is_read)
      VALUES ($1, $2, $3, $4, $5, $6, FALSE)
    `, [notifId, sector, action_type, title, message, link]);
  } catch (e) {
    try {
      await query(`
        INSERT INTO system_notifications (sector, action_type, title, message, link)
        VALUES ($1, $2, $3, $4, $5)
      `, [sector, action_type, title, message, link]);
    } catch {}
  }
}

const BRANCH_NAMES_MAP: Record<string, string> = {
  'BR-HQ-01': 'المقر الرئيسي (النجف الأشرف)',
  'BR-CONST-02': 'فرع المقاولات والمشاريع الهندسية',
  'BR-TRADE-03': 'فرع التجارة العامة والمخازن',
  'BR-TRANS-04': 'فرع النقل العام واللوجستيات',
  'BR-RE-05': 'فرع الاستثمارات والتطوير العقاري',
  'ALL': 'كافة الفروع (عرض المنظومة الموحدة)'
};

async function initRealEstateTables() {
  await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  await query(`
    CREATE TABLE IF NOT EXISTS branches (
      branch_id VARCHAR(50) PRIMARY KEY,
      branch_code VARCHAR(50),
      name_ar VARCHAR(255) NOT NULL,
      branch_type VARCHAR(100),
      manager_name VARCHAR(150),
      phone VARCHAR(50),
      city VARCHAR(100) DEFAULT 'النجف الأشرف',
      address VARCHAR(255),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS real_estate_units (
      unit_id VARCHAR(50) PRIMARY KEY,
      branch_id VARCHAR(50) DEFAULT 'BR-RE-05',
      unit_code VARCHAR(50),
      title VARCHAR(255),
      unit_name VARCHAR(255),
      property_type VARCHAR(100) DEFAULT 'شقة سكنية فاخرة',
      unit_type VARCHAR(100) DEFAULT 'شقة سكنية فاخرة',
      area_sqm NUMERIC DEFAULT 0,
      area NUMERIC DEFAULT 0,
      price NUMERIC DEFAULT 0,
      base_price NUMERIC DEFAULT 0,
      city VARCHAR(100) DEFAULT 'النجف الأشرف',
      location VARCHAR(255),
      status VARCHAR(50) DEFAULT 'AVAILABLE',
      sale_type VARCHAR(50) DEFAULT 'INSTALLMENTS',
      customer_type VARCHAR(50) DEFAULT 'INDIVIDUAL',
      buyer_name VARCHAR(150),
      buyer_phone VARCHAR(50),
      total_paid NUMERIC DEFAULT 0,
      total_remaining NUMERIC DEFAULT 0,
      images JSONB DEFAULT '[]',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS sale_type VARCHAR(50) DEFAULT 'INSTALLMENTS';
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50) DEFAULT 'INDIVIDUAL';
    ALTER TABLE real_estate_units ADD COLUMN IF NOT EXISTS notes TEXT;
  `).catch(() => {});

  await query(`
    CREATE TABLE IF NOT EXISTS real_estate_installments (
      installment_id VARCHAR(50) PRIMARY KEY,
      unit_id VARCHAR(50),
      installment_title VARCHAR(150) NOT NULL,
      amount NUMERIC NOT NULL DEFAULT 0,
      due_date DATE,
      is_paid BOOLEAN DEFAULT FALSE,
      paid_at TIMESTAMP,
      voucher_number VARCHAR(100),
      voucher_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    ALTER TABLE real_estate_installments ADD COLUMN IF NOT EXISTS voucher_number VARCHAR(100);
    ALTER TABLE real_estate_installments ADD COLUMN IF NOT EXISTS voucher_id VARCHAR(100);
  `).catch(() => {});
}

export async function GET(req: Request) {
  try {
    await initRealEstateTables();

    const { searchParams } = new URL(req.url);
    const branchFilter = searchParams.get('branch_id');
    const isSpecificBranch = branchFilter && branchFilter !== 'ALL' && branchFilter.trim() !== '';

    let unitsSql = `
      SELECT 
        u.*, 
        u.unit_id::text AS unit_id,
        u.branch_id::text AS branch_id,
        COALESCE(b.name_ar, 'فرع الشركة') AS branch_name
      FROM real_estate_units u
      LEFT JOIN branches b ON TRIM(u.branch_id::text) = TRIM(b.branch_id::text)
    `;
    const unitsParams: any[] = [];
    if (isSpecificBranch) {
      unitsSql += ` WHERE TRIM(u.branch_id::text) = TRIM($1)`;
      unitsParams.push(String(branchFilter));
    }
    unitsSql += ` ORDER BY u.created_at DESC`;

    const [unitsRes, instRes] = await Promise.all([
      query(unitsSql, unitsParams),
      query(`SELECT *, installment_id::text AS installment_id, unit_id::text AS unit_id FROM real_estate_installments ORDER BY due_date ASC, created_at ASC`)
    ]);

    const units = unitsRes.rows || [];
    const installments = instRes.rows || [];

    const enrichedUnits = units.map((u: any) => {
      const uInst = installments.filter((i: any) => String(i.unit_id) === String(u.unit_id));
      
      // ترتيب ظهور الأقساط: الدفعة الأولى (المقدمة) أولاً ثم بقية الأقساط بحسب التواريخ
      uInst.sort((a: any, b: any) => {
        const isDownA = a.installment_title?.includes('مقدمة') || a.installment_id?.includes('DP');
        const isDownB = b.installment_title?.includes('مقدمة') || b.installment_id?.includes('DP');
        if (isDownA && !isDownB) return -1;
        if (!isDownA && isDownB) return 1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      const totalPaid = uInst.filter((i: any) => i.is_paid).reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
      const totalRemaining = uInst.filter((i: any) => !i.is_paid).reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
      const mappedBranchName = u.branch_name || BRANCH_NAMES_MAP[u.branch_id] || 'فرع الاستثمارات العقارية';

      let parsedImages: string[] = [];
      try {
        if (Array.isArray(u.images)) parsedImages = u.images;
        else if (typeof u.images === 'string' && u.images.startsWith('[')) parsedImages = JSON.parse(u.images);
        else if (typeof u.images === 'string' && u.images.trim()) parsedImages = [u.images.trim()];
      } catch {
        parsedImages = [];
      }

      return {
        ...u,
        images: parsedImages,
        branch_name: mappedBranchName,
        title: u.title || u.unit_name || 'وحدة عقارية',
        property_type: u.property_type || u.unit_type || 'شقة سكنية',
        area_sqm: u.area_sqm || u.area || 0,
        price: u.price || u.base_price || 0,
        installments: uInst,
        totalPaid: totalPaid || Number(u.total_paid || 0),
        totalRemaining: totalRemaining || Number(u.total_remaining || 0)
      };
    });

    return NextResponse.json({ success: true, units: enrichedUnits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initRealEstateTables();
    const body = await req.json();
    const { action } = body;

    // 1. إضافة عقار جديد
    if (action === 'ADD_UNIT') {
      const { unit_id, id, branch_id, unit_code, title, property_type, area_sqm, price, city, location, notes, images } = body;
      const finalUnitId = String(unit_id || id || `UNT-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
      const finalBranchId = branch_id && String(branch_id).trim() !== '' && String(branch_id).trim() !== 'ALL' ? String(branch_id).trim() : 'BR-RE-05';
      const code = String(unit_code || `UNIT-${Date.now().toString().slice(-4)}`).trim().toUpperCase();

      const res = await query(`
        INSERT INTO real_estate_units (
          unit_id, branch_id, unit_code, title, unit_name, property_type, unit_type,
          area_sqm, area, price, base_price, city, location, notes, images, status, total_paid, total_remaining
        )
        VALUES ($1, $2, $3, $4, $4, $5, $5, $6, $6, $7, $7, $8, $9, $10, $11, 'AVAILABLE', 0, $7)
        RETURNING *
      `, [
        finalUnitId, finalBranchId, code, title || 'وحدة جديدة', property_type || 'شقة سكنية فاخرة',
        Number(area_sqm) || 0, Number(price) || 0, city || 'النجف الأشرف', location || 'حي الفرات',
        notes || '', JSON.stringify(images || [])
      ]);

      const bRes = await query(`SELECT name_ar FROM branches WHERE branch_id::text = $1`, [finalBranchId]).catch(() => ({ rows: [] }));
      const bName = bRes.rows[0]?.name_ar || 'فرع الاستثمارات العقارية';

      await logNotification(
        'REAL_ESTATE',
        'ADD',
        `إدراج عقار جديد: ${title} (${bName})`,
        `تم تسجيل عقار (${title}) برمز (${code}) بقيمة ${Number(price).toLocaleString('en-US')} د.ع`,
        '/real-estate'
      );

      return NextResponse.json({ success: true, unit: { ...res.rows[0], branch_name: bName } });
    }

    // 2. تعديل مواصفات العقار
    if (action === 'UPDATE_UNIT') {
      const { unit_id, unit_code, title, property_type, area_sqm, price, city, location, notes, images } = body;
      await query(`
        UPDATE real_estate_units
        SET unit_code = COALESCE($1, unit_code),
            title = COALESCE($2, title),
            unit_name = COALESCE($2, unit_name),
            property_type = COALESCE($3, property_type),
            unit_type = COALESCE($3, unit_type),
            area_sqm = COALESCE($4, area_sqm),
            area = COALESCE($4, area),
            price = COALESCE($5, price),
            city = COALESCE($6, city),
            location = COALESCE($7, location),
            notes = COALESCE($8, notes),
            images = COALESCE($9, images)
        WHERE unit_id::text = $10::text
      `, [
        unit_code, title, property_type, Number(area_sqm) || 0, Number(price) || 0,
        city, location, notes, JSON.stringify(images || []), String(unit_id)
      ]);

      return NextResponse.json({ success: true, message: 'تم تحديث بيانات العقار بنجاح' });
    }

    // 3. بيع العقار أو تعديل العقد وتوليد جميع الأقساط دفعة واحدة دون أي نقص
    if (action === 'SELL_UNIT' || action === 'UPDATE_SALE') {
      const { unit_id, sale_type, customer_type, buyer_name, buyer_phone, down_payment, installments_count, first_due_date, total_price } = body;

      const isCash = sale_type === 'CASH';
      const tPrice = Number(total_price) || 0;
      const downPay = isCash ? tPrice : (Number(down_payment) || 0);
      const remainingPrice = isCash ? 0 : Math.max(0, tPrice - downPay);
      const count = isCash ? 0 : Math.max(1, Number(installments_count) || 1);
      const instAmount = count > 0 ? Math.round(remainingPrice / count) : 0;

      await query(`
        UPDATE real_estate_units
        SET status = 'SOLD',
            sale_type = $1,
            customer_type = $2,
            buyer_name = $3,
            buyer_phone = $4,
            total_paid = $5,
            total_remaining = $6
        WHERE unit_id::text = $7::text
      `, [sale_type || 'INSTALLMENTS', customer_type || 'INDIVIDUAL', buyer_name, buyer_phone, downPay, remainingPrice, String(unit_id)]);

      const unitInfo = await query(`SELECT title, unit_name, unit_code, branch_id FROM real_estate_units WHERE unit_id::text = $1::text`, [String(unit_id)]);
      const uName = unitInfo.rows[0]?.title || unitInfo.rows[0]?.unit_name || unitInfo.rows[0]?.unit_code || 'عقار استثماري';
      const uBranchId = unitInfo.rows[0]?.branch_id || 'BR-RE-05';

      // إلغاء السندات القديمة وجدول الأقساط السابق قبل الجدولة الكاملة
      await query(`
        UPDATE vouchers
        SET status = 'CANCELLED'
        WHERE status NOT IN ('CANCELLED', 'VOID')
          AND notes ILIKE '%"unit_id":"' || $1 || '"%'
      `, [String(unit_id)]).catch(() => {});

      await query(`DELETE FROM real_estate_installments WHERE unit_id::text = $1::text`, [String(unit_id)]);

      // إدراج الدفعة المقدمة وسند قبضها
      if (downPay > 0) {
        const firstInstId = `INST-DP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const titleStr = isCash ? 'سداد كامل القيمة (نقداً)' : 'الدفعة الأولى (المقدمة)';
        const vNum = `V-EST-${Date.now().toString().slice(-5)}`;
        const vId = `VOUCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        await query(`
          INSERT INTO real_estate_installments (installment_id, unit_id, installment_title, amount, due_date, is_paid, paid_at, voucher_number, voucher_id)
          VALUES ($1, $2, $3, $4, CURRENT_DATE, TRUE, CURRENT_TIMESTAMP, $5, $6)
        `, [firstInstId, String(unit_id), titleStr, downPay, vNum, vId]);

        try {
          const voucherNotes = JSON.stringify({
            sector: 'REAL_ESTATE',
            unit_id: String(unit_id),
            installment_id: firstInstId,
            partyAr: buyer_name,
            forReasonAr: isCash ? `سداد قيمة شراء عقار بالكامل (${uName})` : `دفعة مقدمة لشراء وحدة عقارية (${uName})`,
            method: 'CASH'
          });

          await query(`
            INSERT INTO vouchers (voucher_id, branch_id, voucher_number, voucher_type, amount, total_amount, notes, status, created_by, issue_date)
            VALUES ($1, $2, $3, 'RECEIPT', $4, $4, $5, 'POSTED', 'قسم الاستثمار العقاري', CURRENT_DATE)
          `, [vId, uBranchId, vNum, downPay, voucherNotes]);
        } catch (vErr) {
          console.error('Voucher creation notice:', vErr);
        }
      }

      // إدراج كافة الأقساط الشهرية الـ N دفعة واحدة في قاعدة البيانات (تم تصحيح الاستعلام والمتغيرات بالكامل)
      if (!isCash && count > 0) {
        const baseDate = first_due_date ? new Date(first_due_date) : new Date();
        for (let i = 1; i <= count; i++) {
          const instId = `INST-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
          const dueDate = new Date(baseDate);
          dueDate.setMonth(dueDate.getMonth() + (i - 1));
          const dueDateStr = dueDate.toISOString().substring(0, 10);

          await query(`
            INSERT INTO real_estate_installments (
              installment_id, unit_id, installment_title, amount, due_date, is_paid
            )
            VALUES ($1, $2, $3, $4, $5::date, FALSE)
          `, [instId, String(unit_id), `قسط #${i}`, instAmount, dueDateStr]);
        }
      }

      await logNotification(
        'REAL_ESTATE',
        'UPDATE',
        `تثبيت/تعديل بيع عقار: ${uName}`,
        isCash 
          ? `تم بيع (${uName}) للمشتري (${buyer_name}) نقداً بمبلغ ${tPrice.toLocaleString('en-US')} د.ع` 
          : `تم بيع/تعديل عقد (${uName}) للمشتري (${buyer_name}) بإجمالي ${count} أقساط مجدولة بالكامل`,
        '/real-estate'
      );

      return NextResponse.json({ success: true, message: 'تم تثبيت البيع وجدولة كافة الأقساط بنجاح' });
    }

    // 4. تسديد أي قسط وتوليد سند قبض رسمي في الصندوق
    if (action === 'PAY_INSTALLMENT') {
      const { installment_id, unit_id, amount, buyer_name, installment_title } = body;
      const vNum = `V-INST-${Date.now().toString().slice(-5)}`;
      const vId = `VOUCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await query(`
        UPDATE real_estate_installments
        SET is_paid = TRUE,
            paid_at = CURRENT_TIMESTAMP,
            voucher_number = $1,
            voucher_id = $2
        WHERE installment_id::text = $3::text
      `, [vNum, vId, String(installment_id)]);

      let uBranchId = 'BR-RE-05';
      if (unit_id) {
        await query(`
          UPDATE real_estate_units
          SET total_paid = COALESCE(total_paid, 0) + $1,
              total_remaining = GREATEST(0, COALESCE(total_remaining, 0) - $1)
          WHERE unit_id::text = $2::text
        `, [Number(amount) || 0, String(unit_id)]);

        const uData = await query(`SELECT branch_id FROM real_estate_units WHERE unit_id::text = $1::text`, [String(unit_id)]).catch(() => ({ rows: [] }));
        if (uData.rows[0]?.branch_id) uBranchId = uData.rows[0].branch_id;
      }

      try {
        const voucherNotes = JSON.stringify({
          sector: 'REAL_ESTATE',
          unit_id: unit_id ? String(unit_id) : undefined,
          installment_id: String(installment_id),
          partyAr: buyer_name || 'مشتري الوحدة العقارية',
          forReasonAr: `سداد ${installment_title || 'قسط عقاري'}`,
          method: 'CASH'
        });

        await query(`
          INSERT INTO vouchers (voucher_id, branch_id, voucher_number, voucher_type, amount, total_amount, notes, status, created_by, issue_date)
          VALUES ($1, $2, $3, 'RECEIPT', $4, $4, $5, 'POSTED', 'قسم الاستثمار العقاري', CURRENT_DATE)
        `, [vId, uBranchId, vNum, Number(amount) || 0, voucherNotes]);
      } catch (vErr) {
        console.error('Voucher creation notice:', vErr);
      }

      return NextResponse.json({ 
        success: true, 
        voucher_id: vId, 
        voucher_number: vNum, 
        paid_at: new Date().toISOString().substring(0, 10),
        message: 'تم تسديد القسط بنجاح' 
      });
    }

    // 5. التراجع عن سداد أي قسط وإلغاء سنده المالي تلقائياً
    if (action === 'ROLLBACK_INSTALLMENT') {
      const { installment_id, unit_id } = body;
      const instRes = await query(`SELECT * FROM real_estate_installments WHERE installment_id::text = $1::text`, [String(installment_id)]);
      
      if (instRes.rows.length === 0) return NextResponse.json({ error: 'القسط غير موجود' }, { status: 404 });

      const inst = instRes.rows[0];
      if (!inst.is_paid) return NextResponse.json({ error: 'القسط غير مسدد' }, { status: 400 });

      const vId = inst.voucher_id;
      const vNum = inst.voucher_number;
      const instAmt = Number(inst.amount) || 0;

      // إلغاء السند المالي التابع له وتصفير القيد
      await query(`
        UPDATE vouchers
        SET status = 'CANCELLED',
            notes = jsonb_set(COALESCE(notes::jsonb, '{}'::jsonb), '{cancel_reason}', to_jsonb('تراجع عن سداد القسط العقاري'::text))::text
        WHERE status NOT IN ('CANCELLED', 'VOID')
          AND (
            ($1::text IS NOT NULL AND voucher_id::text = $1::text)
            OR ($2::text IS NOT NULL AND voucher_number::text = $2::text)
          )
      `, [vId ? String(vId) : null, vNum ? String(vNum) : null]).catch(() => {});

      await query(`
        UPDATE real_estate_installments
        SET is_paid = FALSE,
            paid_at = NULL,
            voucher_number = NULL,
            voucher_id = NULL
        WHERE installment_id::text = $1::text
      `, [String(installment_id)]);

      if (unit_id) {
        await query(`
          UPDATE real_estate_units
          SET total_paid = GREATEST(0, COALESCE(total_paid, 0) - $1),
              total_remaining = COALESCE(total_remaining, 0) + $1
          WHERE unit_id::text = $2::text
        `, [instAmt, String(unit_id)]);
      }

      return NextResponse.json({ success: true, message: 'تم التراجع عن السداد وإلغاء السند بنجاح' });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (err: any) {
    console.error('Real Estate API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get('id');

    if (!unitId) return NextResponse.json({ error: 'معرف الوحدة مطلوب' }, { status: 400 });

    const unitInfo = await query(`SELECT title, unit_name, unit_code FROM real_estate_units WHERE unit_id::text = $1::text`, [String(unitId)]);
    const uName = unitInfo.rows[0]?.title || unitInfo.rows[0]?.unit_name || unitInfo.rows[0]?.unit_code || 'عقار استثماري';

    // إلغاء كافة السندات المقترنة بهذا العقار تلقائياً
    await query(`
      UPDATE vouchers
      SET status = 'CANCELLED'
      WHERE status NOT IN ('CANCELLED', 'VOID')
        AND notes ILIKE '%"unit_id":"' || $1 || '"%'
    `, [String(unitId)]).catch(() => {});

    await query(`DELETE FROM real_estate_installments WHERE unit_id::text = $1::text`, [String(unitId)]);
    await query(`DELETE FROM real_estate_units WHERE unit_id::text = $1::text`, [String(unitId)]);

    await logNotification(
      'REAL_ESTATE',
      'DELETE',
      `حذف عقار استثماري: ${uName}`,
      `تم حذف العقار (${uName}) وكافة جداول أقساطه وإلغاء كافة سندات القبض المالية التابعة له تلقائياً`,
      '/real-estate'
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}