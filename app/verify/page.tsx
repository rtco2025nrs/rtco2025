'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Calendar, 
  Building2, 
  AlertCircle, 
  UserCheck, 
  Hash, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Coins,
  HardHat,
  TrendingUp,
  Calculator,
  Sparkles,
  ClipboardList,
  FileSpreadsheet,
  PieChart
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

function numberToArabicWords(num: number): string {
  if (isNaN(num) || num === 0) return 'صفر دينار عراقي';
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertGroup(n: number): string {
    let out = '';
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const t = Math.floor(rem / 10);
    const o = rem % 10;
    if (h > 0) out += hundreds[h];
    if (rem > 0) {
      if (out !== '') out += ' و';
      if (rem >= 10 && rem <= 19) out += teens[rem - 10];
      else {
        if (o > 0) out += ones[o];
        if (o > 0 && t > 0) out += ' و';
        if (t > 0) out += tens[t];
      }
    }
    return out;
  }

  const intNum = Math.floor(num);
  const billions = Math.floor(intNum / 1000000000);
  const millions = Math.floor((intNum % 1000000000) / 1000000);
  const thousands = Math.floor((intNum % 1000000) / 1000);
  const remainder = intNum % 1000;

  const parts: string[] = [];
  if (billions > 0) parts.push(billions === 1 ? 'مليار' : billions === 2 ? 'ملياران' : convertGroup(billions) + ' مليار');
  if (millions > 0) parts.push(millions === 1 ? 'مليون' : millions === 2 ? 'مليونان' : convertGroup(millions) + ' مليون');
  if (thousands > 0) parts.push(thousands === 1 ? 'ألف' : thousands === 2 ? 'ألفان' : convertGroup(thousands) + ' ألف');
  if (remainder > 0) parts.push(convertGroup(remainder));

  return `فقط ${parts.join(' و')} دينار عراقي لا غير`;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const type = searchParams ? searchParams.get('type') || 'doc' : 'doc';
  const no = searchParams ? searchParams.get('no') || '' : '';

  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    tagline: 'للمقاولات العامة والاستثمارات العقارية والتجارة العامة والنقل العام',
    phone_primary: '07868006699',
    phone_secondary: '07737006699',
    email: '',
    website: '',
    address: 'العراق - النجف الأشرف - حي الفرات',
    logo_url: '',
    letterhead_url: '',
    primary_color: '#d97706',
    secondary_color: '#ea580c'
  });

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // تبويبات المشروع في صفحة التحقق
  const [projectVerifyTab, setProjectVerifyTab] = useState<'OVERVIEW' | 'TENDER' | 'LOGS'>('OVERVIEW');

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.settings) {
          setCompanySettings(json.settings);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSettings();

    if (!no) {
      setError('رقم الوثيقة أو القيد غير محدد في الرابط');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        if (type === 'contract') {
          const res = await fetch('/api/admin/system?action=GET_CONTRACTS', { cache: 'no-store' });
          const json = await res.json();
          if (json.success && Array.isArray(json.contracts)) {
            const found = json.contracts.find((c: any) => c.contractNo === no || c.id === no);
            if (found) {
              setData(found);
            } else {
              setError(`لم يتم العثور على عقد مسجل بالرقم: ${no}`);
            }
          } else {
            setError('تعذر التحقق من سجل العقود السحابي');
          }
        } else if (type === 'installment') {
          const res = await fetch('/api/admin/system?action=GET_INSTALLMENTS', { cache: 'no-store' });
          const json = await res.json();
          if (json.success && Array.isArray(json.installments)) {
            const found = json.installments.find((inst: any) => inst.id === no || inst.customerIdCard === no || inst.customerPhone === no);
            if (found) {
              setData(found);
            } else {
              setError(`لم يتم العثور على خطة تقسيط مسجلة برقم المعرف: ${no}`);
            }
          } else {
            setError('تعذر التحقق من سجل الأقساط السحابي');
          }
        } else if (type === 'project' || type === 'tender') {
          let foundProject: any = null;
          const cleanNo = String(no).trim().toLowerCase();

          try {
            const [resProj, resVouch] = await Promise.all([
              fetch('/api/projects', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
              fetch('/api/vouchers', { cache: 'no-store' }).then(r => r.json()).catch(() => null)
            ]);

            const list = resProj?.projects || (Array.isArray(resProj) ? resProj : []);
            foundProject = list.find((p: any) => 
              String(p.project_id || '').toLowerCase() === cleanNo ||
              String(p.id || '').toLowerCase() === cleanNo ||
              String(p.project_name || '').toLowerCase() === cleanNo ||
              String(p.project_id || '').slice(-4) === cleanNo
            );

            // احتساب الواصل الحقيقي المعتمد من واقع السندات المالية الصادرة للمشروع
            if (foundProject && resVouch?.vouchers) {
              const pId = String(foundProject.project_id || foundProject.id || '');
              const pName = String(foundProject.project_name || '').trim().toLowerCase();
              
              let totalRecVouchers = 0;
              resVouch.vouchers.forEach((v: any) => {
                if (v.status === 'VOID' || v.status === 'CANCELLED' || v.voucher_type !== 'RECEIPT') return;
                const vProjId = String(v.project_id || '');
                const vNotes = String(v.notes || '').toLowerCase();
                if ((vProjId && vProjId === pId) || (pName && vNotes.includes(pName))) {
                  totalRecVouchers += Number(v.amount || v.total_amount || 0);
                }
              });

              if (totalRecVouchers > 0) {
                foundProject.calculated_received = totalRecVouchers;
              }
            }
          } catch {}

          if (!foundProject) {
            try {
              const resSys = await fetch('/api/admin/system?action=GET_PROJECTS', { cache: 'no-store' });
              if (resSys.ok) {
                const jsonSys = await resSys.json();
                const listSys = jsonSys?.projects || (Array.isArray(jsonSys) ? jsonSys : []);
                foundProject = listSys.find((p: any) => 
                  String(p.project_id || '').toLowerCase() === cleanNo ||
                  String(p.id || '').toLowerCase() === cleanNo ||
                  String(p.project_name || '').toLowerCase() === cleanNo ||
                  String(p.project_id || '').slice(-4) === cleanNo
                );
              }
            } catch {}
          }

          if (foundProject) {
            setData(foundProject);
          } else {
            setError(`لم يتم العثور على مشروع أو وثيقة تندر مسجلة بالرمز: ${no}`);
          }
        } else {
          const res = await fetch('/api/admin/system?action=GET_OFFICIAL_DOCS', { cache: 'no-store' });
          const json = await res.json();
          if (json.success && Array.isArray(json.documents)) {
            const found = json.documents.find((d: any) => d.docNumber === no || d.id === no);
            if (found) {
              setData(found);
            } else {
              setError(`لم يتم العثور على كتاب رسمي مسجل بالعدد: ${no}`);
            }
          } else {
            setError('تعذر التحقق من سجل الوثائق السحابي');
          }
        }
      } catch {
        setError('حدث خطأ أثناء الاتصال بقاعدة البيانات المركزية');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, no]);

  const primaryCol = companySettings.primary_color || '#d97706';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryCol, borderTopColor: 'transparent' }}></div>
        <p className="text-sm font-bold text-slate-300">جاري التحقق من السجل الرقمي المعتمد...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-4 max-w-lg mx-auto shadow-2xl">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-white">تعذر إثبات صحة الصدور</h2>
        <p className="text-xs text-rose-300 leading-relaxed font-semibold">{error}</p>
        <p className="text-[11px] text-slate-500">
          يرجى مراجعة إدارة {companySettings.company_name} للتأكد من تسجيل البيانات في السجل العام.
        </p>
      </div>
    );
  }

  const isContract = type === 'contract';
  const isInstallment = type === 'installment';
  const isProject = type === 'project' || type === 'tender';

  // معالجة الأرقام المالية بدقة لضمان مطابقتها مع السندات الفعلية
  const contractVal = Number(data.contract_value || 0);
  const totalReceived = Number(data.calculated_received ?? data.total_received ?? 0);
  const remainingVal = Math.max(0, contractVal - totalReceived);
  const completionRate = Number(data.completion_rate || 0);
  const tenderItems = Array.isArray(data.tender_data?.items) ? data.tender_data.items : [];
  const totalTenderCost = Number(data.tender_data?.total_estimated_cost || 0);
  const siteLogs = Array.isArray(data.site_logs) ? data.site_logs : [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl space-y-5 max-w-3xl mx-auto w-full">
      
      {/* شارة التوثيق الرسمية */}
      <div className="flex flex-col items-center text-center space-y-2 pb-3 border-b border-slate-800">
        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-1">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] sm:text-xs px-3 py-1 rounded-full font-bold">
          {isProject 
            ? 'وثيقة مشروع ومناقصة معتمدة ومسجلة بالسجل العام'
            : isInstallment 
              ? 'خطة بيع بالتقسيط معتمدة ومسجلة بالسجل العام' 
              : 'وثيقة رسمية معتمدة ومسجلة بالسجل العام'}
        </span>
        <h2 className="text-base sm:text-lg font-black text-white pt-1">
          {isProject
            ? `مشروع: ${data.project_name}`
            : isInstallment 
              ? `سجل حساب الأقساط: ${data.customerName}` 
              : isContract 
                ? data.title 
                : data.subject}
        </h2>
        <p className="text-xs text-slate-400">
          صادرة عن منظومة {companySettings.company_name}
        </p>
      </div>

      {/* في حالة وثيقة المشروع: شريط التبويبات العلوي للتنقل */}
      {isProject && (
        <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setProjectVerifyTab('OVERVIEW')}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              projectVerifyTab === 'OVERVIEW' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>الموقف المالي</span>
          </button>

          <button
            type="button"
            onClick={() => setProjectVerifyTab('TENDER')}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              projectVerifyTab === 'TENDER' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>التندر ({tenderItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setProjectVerifyTab('LOGS')}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              projectVerifyTab === 'LOGS' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>اليوميات ({siteLogs.length})</span>
          </button>
        </div>
      )}

      {/* محتوى المشروع بحسب التبويب المختار */}
      {isProject ? (
        <div className="space-y-4 text-xs">
          
          {/* التبويب 1: الموقف المالي ونسبة الإنجاز */}
          {projectVerifyTab === 'OVERVIEW' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">رقم المشروع التعريفي:</span>
                  <strong className="text-amber-400 font-mono text-xs font-bold">{data.project_id || 'PRJ-2026'}</strong>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">صاحب العمل / الجهة المستفيدة:</span>
                  <strong className="text-white text-xs font-bold">{data.client_name}</strong>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">موقع المشروع:</span>
                  <strong className="text-slate-200 text-xs">{data.location || 'النجف الأشرف'}</strong>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-500 text-[11px] block">الفرع المسؤول:</span>
                  <strong className="text-amber-300 text-xs">{data.branch_name || 'قسم المقاولات العامة'}</strong>
                </div>
              </div>

              {/* نسبة الإنجاز الميداني الفعلي */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-sky-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-sky-400" /> نسبة الإنجاز الميداني الفعلي المصادقة:
                  </span>
                  <strong className="text-base font-black text-sky-400 font-mono">{completionRate}%</strong>
                </div>
                
                <div className="w-full bg-slate-900 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-slate-400 pt-1">
                  <span>حالة التنفيذ: <strong className="text-white font-bold">{data.status === 'COMPLETED' ? 'منجز ومسلّم ✓' : data.status === 'SUSPENDED' ? 'متوقف مؤقتاً' : 'قيد التنفيذ الميداني'}</strong></span>
                  <span>تاريخ المباشرة: <strong className="font-mono text-slate-300">{data.start_date ? String(data.start_date).split('T')[0] : '---'}</strong></span>
                </div>
              </div>

              {/* الموقف المالي: العقد، الأموال الواصلة، والمتبقي */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-semibold">مبلغ العقد الإجمالي</span>
                  <strong className="text-xs font-mono text-white font-bold">{formatNum(contractVal)} د.ع</strong>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/5">
                  <span className="text-[11px] text-emerald-400 block font-black">الواصل من صاحب العمل</span>
                  <strong className="text-sm font-mono text-emerald-400 font-black">{formatNum(totalReceived)} د.ع</strong>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-rose-500/30">
                  <span className="text-[11px] text-rose-400 block font-semibold">المتبقي بذمة العميل</span>
                  <strong className="text-xs font-mono text-rose-400 font-bold">{formatNum(remainingVal)} د.ع</strong>
                </div>
              </div>
            </div>
          )}

          {/* التبويب 2: التندر كامل (جدول الكميات الـ 41 فقرة) */}
          {projectVerifyTab === 'TENDER' && (
            <div className="bg-slate-950 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-amber-400" /> وثيقة التندر وجدول الكميات الكامل (BOQ):
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold">
                  ({tenderItems.length} فقرة معتمدة)
                </span>
              </div>

              {tenderItems.length === 0 ? (
                <div className="text-center py-6 text-slate-500 space-y-1">
                  <p>تم اعتماد كلفة العطاء التخمينية للمشروع بقيمة {formatNum(contractVal)} د.ع</p>
                  <p className="text-[11px]">مواصفات التندر الموقعي محفوظة في ملف المشروع المركزي.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900 text-slate-300 text-[11px] border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="p-2 text-center w-10">ت</th>
                          <th className="p-2 min-w-[220px]">الفقرات والمواصفات الفنية</th>
                          <th className="p-2 text-center w-14">الوحدة</th>
                          <th className="p-2 text-center w-14">الكمية</th>
                          <th className="p-2 text-center w-24">السعر (د.ع)</th>
                          <th className="p-2 text-left w-28">المبلغ الكلي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 font-mono text-[11px]">
                        {tenderItems.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            <td className="p-2 text-center text-slate-400 font-bold">#{item.seq || (idx + 1)}</td>
                            <td className="p-2 text-slate-200 font-sans leading-relaxed">{item.name}</td>
                            <td className="p-2 text-center text-slate-400 font-sans">{item.unit}</td>
                            <td className="p-2 text-center text-white font-bold">{formatNum(item.qty)}</td>
                            <td className="p-2 text-center text-amber-300">{formatNum(item.unitPrice)}</td>
                            <td className="p-2 text-left text-white font-bold">{formatNum(item.total)} د.ع</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalTenderCost > 0 && (
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">المجموع الكلي للتندر كتابةً:</span>
                        <strong className="text-slate-200 font-sans">{numberToArabicWords(totalTenderCost)}</strong>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-slate-400 block text-[10px]">الكلفة التخمينية الكلية:</span>
                        <strong className="text-amber-400 font-mono font-black text-sm">{formatNum(totalTenderCost)} د.ع</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* التبويب 3: يوميات وسجل الموقع */}
          {projectVerifyTab === 'LOGS' && (
            <div className="bg-slate-950 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-sky-400" /> تقارير ويوميات الموقع الميدانية:
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold">
                  ({siteLogs.length} تقرير مسجل)
                </span>
              </div>

              {siteLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  لا توجد تقارير يومية مسجلة لهذا المشروع حالياً.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-0.5">
                  {siteLogs.map((log: any, lIdx: number) => (
                    <div key={lIdx} className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-1.5">
                        <span className="font-bold text-amber-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {String(log.log_date || '').split('T')[0]}
                        </span>
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                          <span>العمال: <strong className="text-white">{log.workers_count || 0}</strong></span>
                          <span>•</span>
                          <span>الطقس: <strong className="text-white">{log.weather || 'صحو'}</strong></span>
                        </div>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line font-sans">
                        {log.notes}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      ) : isInstallment ? (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[11px] block">اسم المشتري:</span>
              <strong className="text-white text-xs font-bold">{data.customerName}</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[11px] block">رقم الهاتف:</span>
              <strong className="text-slate-200 font-mono text-xs">{data.customerPhone || '---'}</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[11px] block">اسم الكفيل الضامن:</span>
              <strong className="text-amber-400 text-xs">{data.guarantorName || 'بدون كفيل'}</strong>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-slate-500 text-[11px] block mb-1">المبيع / المواد المقسطة:</span>
            <strong className="text-amber-300 text-xs">{data.goodsDescription || 'بضاعة عامة'}</strong>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">السعر الكلي</span>
              <strong className="text-xs font-mono text-white font-bold">{formatNum(data.totalInstallmentPrice)} د.ع</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">المقدمة (الواصل)</span>
              <strong className="text-xs font-mono text-emerald-400 font-bold">{formatNum(data.downPayment)} د.ع</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">المسدد من الأقساط</span>
              <strong className="text-xs font-mono text-sky-400 font-bold">{formatNum(data.totalPaid)} د.ع</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">المتبقي الكلي</span>
              <strong className="text-xs font-mono text-rose-400 font-bold">{formatNum(data.remainingBalance)} د.ع</strong>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" /> كشف الأقساط الشهرية وتواريخ التسديد:
            </span>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-slate-400 text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">تاريخ الاستحقاق</th>
                    <th className="p-2">مبلغ القسط</th>
                    <th className="p-2 text-center">حالة السداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {Array.isArray(data.installments) && data.installments.length > 0 ? (
                    data.installments.map((inst: any, idx: number) => {
                      const isPaid = inst.is_paid || inst.status === 'PAID';
                      return (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-2 font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-2 text-slate-300">{inst.due_date || inst.dueDate || '---'}</td>
                          <td className="p-2 text-white font-bold">{formatNum(inst.amount)} د.ع</td>
                          <td className="p-2 text-center">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> تم التسديد
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                <Clock className="w-3 h-3" /> متبقي بذمة المشتري
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500 font-sans">
                        تمت جدولة الأقساط بمعدل قسط شهري بقيمة {formatNum(data.monthlyInstallment)} د.ع
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[11px] flex items-center gap-1 font-bold">
              <Hash className="w-3.5 h-3.5 text-amber-400" />
              {isContract ? 'رقم وثيقة العقد' : 'العدد الإداري'}
            </span>
            <p className="font-mono font-bold text-sm" style={{ color: primaryCol }}>
              {isContract ? data.contractNo : data.docNumber}
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[11px] flex items-center gap-1 font-bold">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              تاريخ التوثيق الرسمي
            </span>
            <p className="font-mono font-bold text-slate-200 text-sm">
              {isContract ? data.contractDate : data.docDate}
            </p>
          </div>

          {isContract ? (
            <>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] flex items-center gap-1 font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  الطرف الأول ({data.isRent ? 'المؤجر' : 'البائع'})
                </span>
                <p className="font-bold text-white text-xs">{data.sellerName}</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] flex items-center gap-1 font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  الطرف الثاني ({data.isRent ? 'المستأجر' : 'المشتري'})
                </span>
                <p className="font-bold text-white text-xs">{data.buyerName}</p>
              </div>

              <div className="sm:col-span-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] font-bold">المبيع المتفق عليه:</span>
                <p className="font-bold text-amber-300 text-xs">
                  {data.isVehicle 
                    ? `${data.vehicleBrand || ''} - موديل ${data.vehicleModel || ''} (${data.vehiclePlate || ''})`
                    : `${data.propertyTitle || ''} - ${data.propertyLocation || ''}`}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="sm:col-span-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] flex items-center gap-1 font-bold">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  {data.type === 'INCOMING' ? 'من / الجهة الوارد منها' : 'إلى / الجهة المعنية'}
                </span>
                <p className="font-bold text-white text-xs">{data.partyName}</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] font-bold">نوع الوثيقة:</span>
                <p className="font-bold text-amber-400">
                  {data.type === 'OUTGOING' ? 'كتاب صادر رسمي' : data.type === 'INCOMING' ? 'كتاب وارد' : 'أمر إداري داخلي'}
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[11px] font-bold">المصادقة والتوقيع:</span>
                <p className="font-bold text-white">
                  {data.signatoryName || 'إدارة الشركة'} ({data.signatoryTitle || 'المدير المفوض'})
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {!isContract && !isInstallment && !isProject && data.mainLetterUrl && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-center">
          <span className="text-xs font-bold text-sky-400 block text-right">نسخة الكتاب المؤرشفة:</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.mainLetterUrl} alt="الكتاب الرسمي" className="max-h-80 mx-auto rounded-xl border border-slate-800 object-contain" />
        </div>
      )}

      {/* ذيل الصفحة والمعلومات الاتصالية */}
      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="flex items-center gap-1 font-mono">
          <Phone className="w-3.5 h-3.5 text-slate-400" /> {companySettings.phone_primary}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {companySettings.address}
        </span>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    primary_color: '#d97706',
    secondary_color: '#ea580c'
  });

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.settings) {
          setCompanySettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  const primaryCol = companySettings.primary_color || '#d97706';

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 flex flex-col justify-between font-sans">
      
      {/* إخفاء شريط التنقل العلوي للنظام بالكامل في صفحة الفيري فاي */}
      <style jsx global>{`
        header:not(.verify-header),
        nav,
        aside,
        .top-navbar-container {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
        }
      `}</style>

      <header className="verify-header max-w-2xl mx-auto w-full flex items-center justify-between pb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 relative bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center p-1.5 shadow">
            <Image src="/logo.png" alt="البرج المتألق" width={38} height={38} className="object-contain" priority />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">{companySettings.company_name}</h1>
            <p className="text-[10px] text-slate-400">بوابة التحقق الإلكتروني العام من صحة الصدور والتعاقد</p>
          </div>
        </div>
        <span className="text-[10px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full font-mono font-bold" style={{ color: primaryCol }}>
          E-VERIFY PORTAL
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center py-4">
        <Suspense fallback={<div className="text-xs text-slate-400 text-center">جاري التحميل...</div>}>
          <VerifyContent />
        </Suspense>
      </main>

      <footer className="max-w-2xl mx-auto w-full text-center text-[10px] text-slate-600 pt-6">
        جميع الحقوق محفوظة © {companySettings.company_name} للتجارة والاستثمار العقاري {new Date().getFullYear()}
      </footer>
    </div>
  );
}