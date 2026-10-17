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

// خريطة مسميات الفروع الرسمية المعتمدة
const BRANCH_NAMES_MAP: Record<string, string> = {
  'BR-HQ-01': 'المقر الرئيسي (النجف الأشرف)',
  'BR-CONST-02': 'فرع المقاولات والمشاريع الهندسية',
  'BR-TRADE-03': 'فرع التجارة العامة والمخازن',
  'BR-TRANS-04': 'فرع النقل العام واللوجستيات',
  'BR-RE-05': 'فرع الاستثمارات والتطوير العقاري',
  'ALL': 'كافة الفروع (عرض المنظومة الموحدة)'
};

async function initVoucherTables() {
  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // التأكد من وجود هيكل جدول الفروع فقط دون زرع أي بيانات قسرية
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
    await query(`ALTER TABLE branches ALTER COLUMN branch_code DROP NOT NULL;`).catch(() => {});

    await query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS project_id VARCHAR(50);`).catch(() => {});
    await query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;`).catch(() => {});
    await query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;`).catch(() => {});
    await query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);`).catch(() => {});
    await query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50);`).catch(() => {});
  } catch (e) {
    console.error('Voucher Tables Init Error:', e);
  }
}

// جلب قائمة السندات مع اسم المشروع والفرع مع دعم الفلترة المستقلة والعرض الموحد
export async function GET(req: Request) {
  try {
    await initVoucherTables();

    const { searchParams } = new URL(req.url);
    const branchFilter = searchParams.get('branch_id');

    const isSpecificBranch = branchFilter && branchFilter !== 'ALL' && branchFilter.trim() !== '';

    let sql = `
      SELECT 
        v.voucher_id::text AS voucher_id, 
        v.voucher_number, 
        v.voucher_type, 
        to_char(v.issue_date, 'YYYY-MM-DD') AS issue_date, 
        COALESCE(v.currency, 'IQD') AS currency, 
        COALESCE(v.status, 'POSTED') AS status, 
        COALESCE(v.notes, '') AS notes, 
        COALESCE(v.project_id::text, '') AS project_id,
        v.branch_id::text AS branch_id,
        COALESCE(b.name_ar, 'فرع الشركة') AS branch_name,
        COALESCE(p.project_name, '') AS project_name,
        COALESCE(v.total_amount, v.amount, 0) AS total_amount,
        COALESCE(v.amount, v.total_amount, 0) AS amount
      FROM vouchers v
      LEFT JOIN branches b ON TRIM(v.branch_id::text) = TRIM(b.branch_id::text)
      LEFT JOIN projects p ON TRIM(v.project_id::text) = TRIM(p.project_id::text)
    `;

    const params: any[] = [];
    if (isSpecificBranch) {
      sql += ` WHERE TRIM(v.branch_id::text) = TRIM($1)`;
      params.push(String(branchFilter));
    }

    sql += ` ORDER BY v.created_at DESC LIMIT 300`;

    const res = await query(sql, params).catch(async () => {
      let fallbackSql = `
        SELECT 
          voucher_id::text AS voucher_id,
          voucher_number,
          voucher_type,
          to_char(issue_date, 'YYYY-MM-DD') AS issue_date,
          COALESCE(currency, 'IQD') AS currency,
          COALESCE(status, 'POSTED') AS status,
          COALESCE(notes, '') AS notes,
          COALESCE(project_id::text, '') AS project_id,
          branch_id::text AS branch_id,
          COALESCE(total_amount, amount, 0) AS total_amount,
          COALESCE(amount, 0) AS amount
        FROM vouchers
      `;
      const fallbackParams: any[] = [];
      if (isSpecificBranch) {
        fallbackSql += ` WHERE TRIM(branch_id::text) = TRIM($1)`;
        fallbackParams.push(String(branchFilter));
      }
      fallbackSql += ` ORDER BY created_at DESC LIMIT 300`;
      return await query(fallbackSql, fallbackParams);
    });

    const enriched = (res.rows || []).map((v: any) => {
      const mapped = v.branch_name || BRANCH_NAMES_MAP[v.branch_id];
      return {
        ...v,
        branch_name: mapped || 'فرع الشركة'
      };
    });

    return NextResponse.json({ vouchers: enriched });
  } catch (error: any) {
    console.error('GET Vouchers Error:', error);
    return NextResponse.json({ vouchers: [] });
  }
}

// إنشاء سند جديد وربطه بالفرع والمشروع مع التحقق من إقفال الفترة
export async function POST(req: Request) {
  try {
    await initVoucherTables();

    const body = await req.json();
    const { branch_id, project_id, voucher_type, amount, currency, notes, created_by, voucher_number, voucher_id } = body;

    const issueMonth = new Date().toISOString().slice(0, 7);
    const lockCheck = await query(
      `SELECT * FROM closed_financial_periods WHERE period_month = $1`,
      [issueMonth]
    ).catch(() => ({ rows: [] }));

    if (lockCheck.rows.length > 0) {
      return NextResponse.json(
        { error: `الفترة المالية لشهر (${issueMonth}) مقفلة رقابياً ولا يمكن إضافة سندات جديدة بها.` },
        { status: 403 }
      );
    }

    // اعتماد رقم السند المرسل إن وجد لضمان تطابق الأرقام مع الأقساط
    const vNum = (voucher_number && String(voucher_number).trim() !== '') 
      ? String(voucher_number).trim() 
      : `VCH-${Date.now().toString().slice(-6)}`;

    const finalVoucherId = (voucher_id && String(voucher_id).trim() !== '') 
      ? String(voucher_id).trim() 
      : `VOUCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let userId = null;
    try {
      const userRes = await query('SELECT user_id FROM system_users LIMIT 1');
      userId = userRes.rows[0]?.user_id || null;
    } catch {}

    let cashAccId = null;
    let revAccId = null;
    try {
      const cashAccRes = await query("SELECT account_id FROM chart_of_accounts WHERE account_code = '111001' LIMIT 1");
      const revAccRes = await query("SELECT account_id FROM chart_of_accounts WHERE account_code = '410001' LIMIT 1");
      cashAccId = cashAccRes.rows[0]?.account_id || null;
      revAccId = revAccRes.rows[0]?.account_id || null;
    } catch {}

    const numAmount = parseFloat(amount) || 0;
    const finalCreatedBy = created_by ? String(created_by) : (userId ? String(userId) : 'مدير النظام');
    
    // التحقق من تعيين الفرع وفق مدخل المستخدم
    const finalBranchId = branch_id && String(branch_id).trim() !== '' && String(branch_id).trim() !== 'ALL'
      ? String(branch_id).trim() 
      : null;

    const vRes = await query(`
      INSERT INTO vouchers (
        voucher_id,
        branch_id, 
        project_id, 
        voucher_number, 
        voucher_type, 
        amount,
        total_amount,
        issue_date, 
        currency, 
        status, 
        notes, 
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $6, CURRENT_DATE, $7, 'POSTED', $8, $9)
      RETURNING voucher_id::text AS voucher_id, voucher_number
    `, [
      finalVoucherId,
      finalBranchId, 
      project_id ? String(project_id) : null, 
      vNum, 
      voucher_type, 
      numAmount, 
      currency || 'IQD', 
      notes || '', 
      finalCreatedBy
    ]);

    const createdVoucherId = vRes.rows[0]?.voucher_id || finalVoucherId;
    const createdVoucherNum = vRes.rows[0]?.voucher_number || vNum;

    if (cashAccId && revAccId) {
      if (voucher_type === 'RECEIPT') {
        await query(`
          INSERT INTO journal_lines (voucher_id, account_id, debit, credit, line_order, description)
          VALUES 
            ($1, $2, $3, 0, 1, 'قبض نقدية'),
            ($1, $4, 0, $3, 2, 'إيراد / دفعة مستلمة')
        `, [createdVoucherId, cashAccId, numAmount, revAccId]).catch(() => {});
      } else {
        await query(`
          INSERT INTO journal_lines (voucher_id, account_id, debit, credit, line_order, description)
          VALUES 
            ($1, $4, $3, 0, 1, 'صرف مستحقات ومواد مشروع'),
            ($1, $2, 0, $3, 2, 'صرف نقدية من الصندوق')
        `, [createdVoucherId, cashAccId, numAmount, revAccId]).catch(() => {});
      }
    }

    let partyTitle = 'غير محدد';
    let reasonTitle = '';
    try {
      const parsedNotes = JSON.parse(notes || '{}');
      if (parsedNotes.partyAr) partyTitle = parsedNotes.partyAr;
      if (parsedNotes.forReasonAr) reasonTitle = ` - البيان: ${parsedNotes.forReasonAr}`;
    } catch {
      if (notes) reasonTitle = ` - ${notes}`;
    }

    const bRes = finalBranchId ? await query(`SELECT name_ar FROM branches WHERE branch_id::text = $1`, [finalBranchId]) : { rows: [] };
    const branchNameStr = bRes.rows[0]?.name_ar || 'فرع الشركة';
    const typeTitle = voucher_type === 'RECEIPT' ? 'وصل قبض مالي' : 'سند صرف مالي';

    await logNotification(
      'FINANCE',
      'ADD',
      `${typeTitle}: ${createdVoucherNum} (${branchNameStr})`,
      `تم قيد ${typeTitle} بمبلغ ${numAmount.toLocaleString('en-US')} ${currency || 'IQD'} لصالح (${partyTitle}) في (${branchNameStr})${reasonTitle}`,
      '/vouchers'
    );

    return NextResponse.json({ success: true, voucher_id: createdVoucherId, voucher_number: createdVoucherNum });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// تعديل ربط السند بمشروع أو إلغاء السند المالي الشامل (بالمعرف، برقم السند، أو برقم العقد)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { voucher_id, voucher_number, plan_id, cancel_reason, assign_project_id } = body;

    // 1. ربط السند بمشروع إنشائي
    if (assign_project_id !== undefined && voucher_id) {
      await query(
        `UPDATE vouchers SET project_id = $1 WHERE voucher_id::text = $2::text`,
        [assign_project_id ? String(assign_project_id) : null, String(voucher_id)]
      );

      const vInfo = await query(`SELECT voucher_number FROM vouchers WHERE voucher_id::text = $1::text`, [String(voucher_id)]);
      const vNum = vInfo.rows[0]?.voucher_number || 'سند';

      let pName = 'فك الارتباط';
      if (assign_project_id) {
        const pInfo = await query(`SELECT project_name FROM projects WHERE project_id::text = $1::text`, [String(assign_project_id)]);
        pName = pInfo.rows[0]?.project_name || 'مشروع';
      }

      await logNotification(
        'FINANCE',
        'UPDATE',
        `ربط سند بمشروع: ${vNum}`,
        `تم تحديث ربط السند رقم (${vNum}) بحساب (${pName})`,
        '/vouchers'
      );

      return NextResponse.json({ success: true, message: 'تم تحديث ربط المشروع بنجاح' });
    }

    // 2. إلغاء السند (VOID / CANCELLED)
    if (!voucher_id && !voucher_number && !plan_id) {
      return NextResponse.json({ error: 'معرّف السند أو رقم السند أو رقم العقد مطلوب للإلغاء' }, { status: 400 });
    }

    const reason = cancel_reason || 'تم الإلغاء وتصفير القيد المالي';

    // البحث عن كافة السندات المطابقة بغض النظر عن طريقة الاستدعاء
    const targetVouchers = await query(`
      SELECT voucher_id::text AS voucher_id, voucher_number, total_amount, amount, notes, issue_date 
      FROM vouchers 
      WHERE status NOT IN ('VOID', 'CANCELLED')
        AND (
          ($1::text IS NOT NULL AND voucher_id::text = $1::text)
          OR ($2::text IS NOT NULL AND voucher_number::text = $2::text)
          OR ($3::text IS NOT NULL AND (notes::text LIKE '%' || $3::text || '%' OR voucher_number::text LIKE '%' || $3::text || '%'))
        )
    `, [
      voucher_id ? String(voucher_id) : null,
      voucher_number ? String(voucher_number) : null,
      plan_id ? String(plan_id) : null
    ]);

    if (targetVouchers.rows.length === 0) {
      return NextResponse.json({ success: true, message: 'لا توجد سندات نشطة مطابقة للإلغاء' });
    }

    for (const v of targetVouchers.rows) {
      let notesData: any = {};
      try {
        notesData = JSON.parse(v.notes || '{}');
      } catch {
        notesData = { forReasonAr: v.notes || '' };
      }
      notesData.isCancelled = true;
      notesData.cancelReason = reason;

      await query(`
        UPDATE vouchers 
        SET status = 'CANCELLED', notes = $1 
        WHERE voucher_id::text = $2::text
      `, [JSON.stringify(notesData), String(v.voucher_id)]);

      try {
        await query(`
          UPDATE journal_lines 
          SET description = description || ' (ملغي)' 
          WHERE voucher_id::text = $1::text
        `, [String(v.voucher_id)]);
      } catch {}

      const vNum = v.voucher_number || 'سند';
      const vAmt = Number(v.total_amount || v.amount || 0);

      await logNotification(
        'FINANCE',
        'DELETE',
        `إلغاء سند مالي: ${vNum}`,
        `تم إلغاء السند المالي رقم (${vNum}) بمبلغ ${vAmt.toLocaleString('en-US')} د.ع - السبب: ${reason}`,
        '/vouchers'
      );
    }

    return NextResponse.json({ 
      success: true, 
      cancelledCount: targetVouchers.rows.length, 
      message: 'تم إلغاء السندات المالية وتصفير قيودها بنجاح' 
    });
  } catch (error: any) {
    console.error('PATCH Voucher Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// دعم الإلغاء عبر DELETE
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const voucher_id = searchParams.get('id') || searchParams.get('voucher_id');
    const voucher_number = searchParams.get('no') || searchParams.get('voucher_number');
    const plan_id = searchParams.get('plan_id');

    if (!voucher_id && !voucher_number && !plan_id) {
      return NextResponse.json({ error: 'المعرف مطلوب للحذف' }, { status: 400 });
    }

    const reason = 'تم إلغاء السند عبر أمر الحذف';

    const targetVouchers = await query(`
      SELECT voucher_id::text AS voucher_id, voucher_number, notes 
      FROM vouchers 
      WHERE status NOT IN ('VOID', 'CANCELLED')
        AND (
          ($1::text IS NOT NULL AND voucher_id::text = $1::text)
          OR ($2::text IS NOT NULL AND voucher_number::text = $2::text)
          OR ($3::text IS NOT NULL AND (notes::text LIKE '%' || $3::text || '%' OR voucher_number::text LIKE '%' || $3::text || '%'))
        )
    `, [
      voucher_id ? String(voucher_id) : null,
      voucher_number ? String(voucher_number) : null,
      plan_id ? String(plan_id) : null
    ]);

    for (const v of targetVouchers.rows) {
      let notesData: any = {};
      try {
        notesData = JSON.parse(v.notes || '{}');
      } catch {
        notesData = { forReasonAr: v.notes || '' };
      }
      notesData.isCancelled = true;
      notesData.cancelReason = reason;

      await query(`
        UPDATE vouchers 
        SET status = 'CANCELLED', notes = $1 
        WHERE voucher_id::text = $2::text
      `, [JSON.stringify(notesData), String(v.voucher_id)]);
    }

    return NextResponse.json({ success: true, message: 'تم إلغاء السندات بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}