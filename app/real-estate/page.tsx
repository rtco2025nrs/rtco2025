'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Building, 
  PlusCircle, 
  Search, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  User, 
  X, 
  RefreshCw, 
  Trash2, 
  Coins, 
  Wallet, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  Building2, 
  FileSpreadsheet, 
  FileCheck, 
  Home, 
  Sparkles, 
  Phone, 
  Printer, 
  BadgeDollarSign, 
  AlertCircle, 
  Landmark, 
  Camera, 
  Image as ImageIcon,
  Clock,
  Layers,
  Receipt
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';
import { useBranch } from '@/context/BranchContext';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

export default function RealEstatePage() {
  const router = useRouter();
  const { selectedBranchId } = useBranch();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    tagline: 'للمقاولات العامة والاستثمارات العقارية والتجارة العامة والنقل العام',
    primary_color: '#d97706',
    secondary_color: '#ea580c',
    phone_primary: '07868006699',
    phone_secondary: '07738006699'
  });

  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [printingScheduleUnit, setPrintingScheduleUnit] = useState<any | null>(null);

  // نموذج إضافة وحدة
  const [showAddModal, setShowAddModal] = useState(false);
  const [unitCode, setUnitCode] = useState('');
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('شقة سكنية فاخرة');
  const [areaSqm, setAreaSqm] = useState('180');
  const [price, setPrice] = useState('120000000');
  const [city, setCity] = useState('النجف الأشرف');
  const [location, setLocation] = useState('حي الفرات');
  const [notes, setNotes] = useState('');
  const [imagesText, setImagesText] = useState('');

  // نموذج بيع وحدة
  const [sellingUnit, setSellingUnit] = useState<any | null>(null);
  const [saleType, setSaleType] = useState<'CASH' | 'INSTALLMENTS'>('INSTALLMENTS');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [downPayment, setDownPayment] = useState('30000000');
  const [installmentsCount, setInstallmentsCount] = useState('12');
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().substring(0, 10));

  const isRestrictedBranch = useMemo(() => {
    return Boolean(
      currentUser && 
      !currentUser.is_super_admin && 
      currentUser.role !== 'ADMIN' && 
      currentUser.username !== 'admin' && 
      currentUser.assigned_branch_id && 
      currentUser.assigned_branch_id !== 'ALL'
    );
  }, [currentUser]);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.settings) {
          setCompanySettings(data.settings);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async (branchFilterId?: string) => {
    try {
      let activeBranch = branchFilterId !== undefined ? branchFilterId : selectedBranchId;
      if (isRestrictedBranch && currentUser?.assigned_branch_id) {
        activeBranch = currentUser.assigned_branch_id;
      }

      const url = activeBranch && activeBranch !== 'ALL'
        ? `/api/real-estate?branch_id=${encodeURIComponent(activeBranch)}`
        : '/api/real-estate';

      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data.units) setUnits(data.units);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSettings();
    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    loadData(selectedBranchId);
  }, [selectedBranchId, isRestrictedBranch]);

  const canAdd = useMemo(() => hasPermission(currentUser, 'realestate', 'add'), [currentUser]);
  const canEdit = useMemo(() => hasPermission(currentUser, 'realestate', 'edit'), [currentUser]);
  const canDelete = useMemo(() => hasPermission(currentUser, 'realestate', 'delete'), [currentUser]);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية إضافة وحدات عقارية جديدة');
      return;
    }
    setLoading(true);
    try {
      let finalBranch = 'BR-RE-05';
      if (isRestrictedBranch && currentUser?.assigned_branch_id) {
        finalBranch = currentUser.assigned_branch_id;
      } else if (selectedBranchId && selectedBranchId !== 'ALL') {
        finalBranch = selectedBranchId;
      }

      const parsedImages = imagesText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 5);

      const res = await fetch('/api/real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_UNIT',
          branch_id: finalBranch,
          unit_code: unitCode,
          title,
          property_type: propertyType,
          area_sqm: areaSqm,
          price,
          city,
          location,
          notes,
          images: parsedImages
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        setUnitCode('');
        setTitle('');
        setImagesText('');
        await loadData(finalBranch);
      } else {
        alert(data.error || 'فشلت إضافة الوحدة');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSellUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit && !canAdd) {
      alert('ليس لديك صلاحية تسجيل بيع الوحدات العقارية');
      return;
    }
    if (!sellingUnit) return;
    setLoading(true);
    try {
      const isCash = saleType === 'CASH';
      const res = await fetch('/api/real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SELL_UNIT',
          unit_id: sellingUnit.unit_id,
          sale_type: saleType,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          down_payment: isCash ? sellingUnit.price : downPayment,
          installments_count: isCash ? 0 : installmentsCount,
          first_due_date: firstDueDate,
          total_price: sellingUnit.price
        })
      });

      if (res.ok) {
        alert(isCash ? 'تم البيع المباشر النقدي وتوليد سند قبض بالقيمة الكاملة بنجاح!' : 'تم تثبيت البيع بالتقسيط وجدولة الأقساط وتوليد سند المقدمة بنجاح!');
        setSellingUnit(null);
        setBuyerName('');
        setBuyerPhone('');
        await loadData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstallment = async (inst: any, unit: any) => {
    if (!canEdit && !canAdd) {
      alert('ليس لديك صلاحية تسجيل وقبض الأقساط');
      return;
    }
    if (!confirm(`تأكيد قبض (${inst.installment_title}) بمبلغ (${formatNum(inst.amount)} د.ع) وتوليد سند قبض رسمي؟`)) return;
    try {
      const res = await fetch('/api/real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PAY_INSTALLMENT',
          installment_id: inst.installment_id,
          unit_id: unit.unit_id,
          amount: inst.amount,
          buyer_name: unit.buyer_name,
          installment_title: inst.installment_title
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`تم قيد القسط بنجاح وتوليد سند قبض رسمي برقم (${data.voucher_number || 'سند قبض'})!`);
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUnit = async (unit: any) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية حذف الوحدات العقارية');
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف الوحدة العقارية (${unit.title})؟ سيتم إلغاء كافة سندات القبض التابعة لها تلقائياً.`)) return;
    try {
      const res = await fetch(`/api/real-estate?id=${unit.unit_id}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const exportExcel = () => {
    if (units.length === 0) return alert('لا توجد بيانات لتصديرها');
    const headers = ['رمز العقار', 'عنوان الوحدة', 'نوع العقار', 'المساحة م²', 'السعر الكلي', 'المسدد', 'المتبقي', 'الحالة', 'اسم المشتري', 'رقم الهاتف'];
    const rows = units.map(u => [
      u.unit_code,
      u.title,
      u.property_type,
      u.area_sqm,
      u.price,
      u.totalPaid || 0,
      u.totalRemaining || 0,
      u.status === 'SOLD' ? (u.totalRemaining === 0 ? 'مباع نقداً' : 'مباع أقساط') : 'متاح للبيع',
      u.buyer_name || '—',
      u.buyer_phone || '—'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `سجل_الاستثمارات_العقارية_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        String(u.title).toLowerCase().includes(q) || 
        String(u.unit_code).toLowerCase().includes(q) || 
        String(u.buyer_name || '').toLowerCase().includes(q) ||
        String(u.location || '').toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || 
        (statusFilter === 'AVAILABLE' && u.status === 'AVAILABLE') ||
        (statusFilter === 'CASH_SOLD' && u.status === 'SOLD' && Number(u.totalRemaining || 0) === 0) ||
        (statusFilter === 'INSTALLMENT_SOLD' && u.status === 'SOLD' && Number(u.totalRemaining || 0) > 0);

      const matchType = typeFilter === 'ALL' || String(u.property_type).includes(typeFilter);
      return matchSearch && matchStatus && matchType;
    });
  }, [units, searchQuery, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const totalCount = units.length;
    const soldUnits = units.filter(u => u.status === 'SOLD').length;
    const availableUnits = units.filter(u => u.status === 'AVAILABLE').length;
    const totalPortfolioValue = units.reduce((acc, u) => acc + Number(u.price || 0), 0);
    const totalCollected = units.reduce((acc, u) => acc + Number(u.totalPaid || 0), 0);
    const totalPending = units.reduce((acc, u) => acc + Number(u.totalRemaining || 0), 0);

    return { totalCount, soldUnits, availableUnits, totalPortfolioValue, totalCollected, totalPending };
  }, [units]);

  const primaryCol = companySettings.primary_color || '#d97706';
  const secondaryCol = companySettings.secondary_color || '#ea580c';

  if (!currentUser) return null;

  return (
    <AuthGuard moduleName="realestate" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-[#070b14] text-slate-100 p-3 md:p-8 font-sans">
        
        {/* تنسيق الطباعة الصارم لاستمارة جدول الأقساط */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-installment-sheet, #printable-installment-sheet * {
              visibility: visible;
            }
            #printable-installment-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              margin: 0 !important;
              padding: 15mm !important;
              background: #ffffff !important;
              color: #000000 !important;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `}</style>

        {/* 1. الترويسة الرئيسية */}
        <div className="max-w-7xl mx-auto pb-5 border-b border-slate-800/80 print:hidden">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md shadow-2xl">
            
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 p-3 rounded-2xl text-slate-950 font-black shadow-xl shrink-0 flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryCol}, ${secondaryCol})`,
                  boxShadow: `0 10px 25px -5px ${primaryCol}40`
                }}
              >
                <Building className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                    منظومة الاستثمار والتطوير العقاري الشاملة
                  </h1>
                  <span 
                    className="inline-flex items-center gap-1.5 border text-[11px] font-bold px-3 py-0.5 rounded-full font-mono whitespace-nowrap"
                    style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}30` }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Real Estate Portfolio & Installments
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {companySettings.company_name} • تسويق وتطوير العقارات، البيع المباشر وبالتقسيط، وجدولة وتوثيق الأقساط والسندات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-end xl:self-auto">
              <button
                onClick={exportExcel}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
              </button>

              <Link
                href="/real-estate/contracts"
                className="px-4 py-2.5 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition shadow-lg whitespace-nowrap active:scale-95 cursor-pointer"
                style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
              >
                <FileCheck className="w-4 h-4" /> برنامج العقود الإلكترونية
              </Link>

              <button 
                onClick={() => {
                  loadSettings();
                  loadData(selectedBranchId);
                }} 
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer active:scale-95"
                title="تحديث البيانات"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <Link 
                href="/" 
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-purple-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" /> الرئيسية
              </Link>
            </div>

          </div>
        </div>

        {/* 2. كروت المؤشرات الكلية */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 print:hidden">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-center relative overflow-hidden shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">إجمالي القيمة السوقية للمحفظة</span>
            <div className="text-xl font-black font-mono mt-2" style={{ color: primaryCol }}>
              {formatNum(stats.totalPortfolioValue)} <span className="text-xs font-sans text-slate-500">د.ع</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">لعدد {stats.totalCount} أصول وعقارات مسجلة</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-center shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">المقبوض والمحصل الفعلي</span>
            <div className="text-xl font-black font-mono text-emerald-400 mt-2">
              {formatNum(stats.totalCollected)} <span className="text-xs font-sans text-slate-500">د.ع</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">مرحّلة بالكامل لسندات القبض في الصندوق</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-center shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">المتبقي قيد التحصيل (أقساط جارية)</span>
            <div className="text-xl font-black font-mono text-rose-400 mt-2">
              {formatNum(stats.totalPending)} <span className="text-xs font-sans text-slate-500">د.ع</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ذمة مجدولة للمشترين والمستثمرين</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-center shadow-xl">
            <span className="text-xs text-slate-400 font-semibold block">جاهزية العقارات</span>
            <div className="flex items-center gap-3 mt-2 font-mono">
              <span className="text-lg font-bold text-sky-400">{stats.soldUnits} مباع</span>
              <span className="text-slate-600">/</span>
              <span className="text-lg font-bold text-amber-400">{stats.availableUnits} متاح</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">نسبة الإشغال والاستثمار: {stats.totalCount > 0 ? Math.round((stats.soldUnits / stats.totalCount) * 100) : 0}%</p>
          </div>
        </div>

        {/* 3. شريط الأدوات والبحث والتصفية */}
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 mt-6 print:hidden">
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input 
                type="text" 
                placeholder="ابحث بالاسم، الرمز، المشتري، أو الموقع..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="AVAILABLE">متاح للبيع والشراء</option>
              <option value="INSTALLMENT_SOLD">مباع (أقساط مجدولة)</option>
              <option value="CASH_SOLD">مباع بالكامل (نقداً)</option>
            </select>

            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="ALL">كافة أنواع العقارات</option>
              <option value="شقة">شقق سكنية</option>
              <option value="دار">دور وفلل</option>
              <option value="أرض">أراضي استثمارية</option>
              <option value="محل">محلات وتجاري</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            {canAdd && (
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg cursor-pointer whitespace-nowrap active:scale-95"
                style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
              >
                <PlusCircle className="w-4 h-4" /> إضافة عقار / وحدة استثمارية جديدة
              </button>
            )}
          </div>
        </div>

        {/* 4. كروت العقارات المعروضة بصورها الاحترافية وجدول أقساطها */}
        <div className="max-w-7xl mx-auto space-y-5 mt-6 print:hidden">
          {filteredUnits.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-3xl text-slate-500 text-xs space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-slate-600" />
              <p>لا توجد وحدات أو عقارات استثمارية مطابقة للمعايير المحددة.</p>
            </div>
          ) : (
            filteredUnits.map((u) => {
              const isExpanded = expandedUnitId === u.unit_id;
              const isSold = u.status === 'SOLD';
              const isCashFullyPaid = isSold && Number(u.totalRemaining || 0) === 0;
              const progressPct = u.price > 0 ? Math.min(100, Math.round((Number(u.totalPaid || 0) / Number(u.price)) * 100)) : 0;
              const hasImages = Array.isArray(u.images) && u.images.length > 0;
              const mainImage = hasImages ? u.images[0] : null;

              return (
                <div key={u.unit_id} className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-3xl overflow-hidden transition shadow-xl flex flex-col">
                  
                  {/* البطاقة الرئيسية مع صورة العقار والمعلومات */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                    
                    {/* الطرف الأيمن: صورة العقار والمعلومات */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                      
                      {/* صورة العقار البارزة */}
                      <div className="w-full sm:w-36 h-28 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative shrink-0 flex items-center justify-center group shadow-md">
                        {mainImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={mainImage} 
                            alt={u.title} 
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-600 p-2 text-center">
                            <Camera className="w-6 h-6 mb-1 text-slate-700" />
                            <span className="text-[10px]">بدون صورة</span>
                          </div>
                        )}
                        {hasImages && u.images.length > 1 && (
                          <span className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                            +{u.images.length - 1} صور
                          </span>
                        )}
                      </div>

                      {/* معلومات العقار */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg border shadow-inner"
                            style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}30` }}
                          >
                            {u.unit_code}
                          </span>
                          
                          <h3 className="text-base font-black text-white">{u.title}</h3>
                          
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                            🏢 {u.branch_name || 'فرع الاستثمارات العقارية'}
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                            !isSold 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                              : isCashFullyPaid 
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                          }`}>
                            {!isSold ? 'متاح للبيع والشراء' : isCashFullyPaid ? 'مباع بالكامل (نقداً)' : 'مباع (أقساط مجدولة)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                          <span>النوع: <strong className="text-slate-200">{u.property_type}</strong></span>
                          <span>المساحة: <strong className="text-slate-200">{u.area_sqm} م²</strong></span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            <strong className="text-slate-200">{u.city} - {u.location}</strong>
                          </span>
                        </div>

                        {isSold && (
                          <div className="flex items-center gap-3 pt-1 text-xs">
                            <span className="text-sky-300 flex items-center gap-1">
                              <User className="w-3.5 h-3.5" /> المشتري: <strong>{u.buyer_name}</strong>
                            </span>
                            {u.buyer_phone && (
                              <span className="text-slate-400 flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3" /> {u.buyer_phone}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* الطرف الأيسر: الحسابات المالية والأزرار */}
                    <div className="flex flex-wrap items-center gap-5 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                      <div className="text-right sm:text-center font-mono">
                        <span className="text-[10px] text-slate-500 block font-sans">قيمة العقار الكلية</span>
                        <span className="text-sm font-black whitespace-nowrap" style={{ color: primaryCol }}>
                          {formatNum(u.price)} <span className="text-[10px] text-slate-400 font-sans">د.ع</span>
                        </span>
                      </div>

                      {isSold && (
                        <div className="text-right sm:text-center font-mono min-w-[130px]">
                          <div className="flex justify-between text-[10px] text-slate-500 font-sans mb-1">
                            <span>المسدد: {progressPct}%</span>
                            <span className="text-emerald-400 font-bold">{formatNum(u.totalPaid)}</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progressPct}%` }}></div>
                          </div>
                          <span className="text-[10px] text-rose-400 font-bold mt-1 block">
                            المتبقي: {formatNum(u.totalRemaining)} د.ع
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mr-auto lg:mr-0">
                        {!isSold ? (
                          (canEdit || canAdd) && (
                            <button
                              onClick={() => {
                                setSellingUnit(u);
                                setSaleType('INSTALLMENTS');
                                setDownPayment(String(Math.round(Number(u.price) * 0.25)));
                              }}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow cursor-pointer whitespace-nowrap active:scale-95"
                            >
                              <BadgeDollarSign className="w-4 h-4" /> بيع العقار
                            </button>
                          )
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setExpandedUnitId(isExpanded ? null : u.unit_id)}
                              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              style={{ color: primaryCol }}
                            >
                              <span>{isExpanded ? 'إخفاء الأقساط' : 'جدول سداد الأقساط'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => setPrintingScheduleUnit(u)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
                              title="طباعة استمارة وجدول الأقساط للعميل"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteUnit(u)}
                            className="p-2 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-rose-500/20 transition cursor-pointer shrink-0"
                            title="حذف العقار"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* الجزء الموسع: جدول الأقساط الشهرية التفصيلي المتكامل */}
                  {isExpanded && isSold && (
                    <div className="bg-slate-950/70 p-5 border-t border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-white">جدول سداد الدفعات والأقساط الشهرية المسجلة</h4>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPrintingScheduleUnit(u)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30 flex items-center gap-1 transition"
                          >
                            <Printer className="w-3.5 h-3.5" /> طباعة جدول الأقساط للعميل
                          </button>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            المسدد: {formatNum(u.totalPaid)} د.ع • المتبقي: {formatNum(u.totalRemaining)} د.ع
                          </span>
                        </div>
                      </div>

                      <div className="w-full overflow-x-auto pb-2 border border-slate-800 rounded-2xl">
                        <table className="w-full min-w-[720px] text-right text-xs">
                          <thead className="bg-slate-900 text-slate-400 text-[11px]">
                            <tr>
                              <th className="p-3 text-center whitespace-nowrap">ت</th>
                              <th className="p-3 whitespace-nowrap">عنوان الدفعة / القسط</th>
                              <th className="p-3 whitespace-nowrap">المبلغ المستحق</th>
                              <th className="p-3 whitespace-nowrap">تاريخ الاستحقاق</th>
                              <th className="p-3 text-center whitespace-nowrap">حالة السداد</th>
                              <th className="p-3 text-center whitespace-nowrap">رقم سند القبض</th>
                              <th className="p-3 text-center whitespace-nowrap">الإجراء المالي</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 font-mono">
                            {(!u.installments || u.installments.length === 0) ? (
                              <tr>
                                <td colSpan={7} className="p-6 text-center text-slate-500 font-sans">
                                  تم سداد كامل قيمة الوحدة نقداً ومباشرة بدون أقساط مجدولة.
                                </td>
                              </tr>
                            ) : (
                              u.installments.map((inst: any, idx: number) => {
                                const isPaid = inst.is_paid;
                                const isDueOverdue = !isPaid && new Date(inst.due_date) < new Date();

                                return (
                                  <tr key={inst.installment_id} className={`transition ${isPaid ? 'bg-emerald-950/10' : isDueOverdue ? 'bg-rose-950/15' : 'hover:bg-slate-900/40'}`}>
                                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                    
                                    <td className="p-3 font-bold text-white font-sans whitespace-nowrap">
                                      {inst.installment_title}
                                    </td>
                                    
                                    <td className="p-3 font-black text-white whitespace-nowrap">
                                      {formatNum(inst.amount)} <span className="text-[10px] text-slate-400 font-sans">د.ع</span>
                                    </td>

                                    <td className="p-3 text-slate-300 whitespace-nowrap font-sans">
                                      <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{String(inst.due_date || '').split('T')[0]}</span>
                                      </div>
                                    </td>

                                    <td className="p-3 text-center font-sans whitespace-nowrap">
                                      {isPaid ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                          <CheckCircle2 className="w-3 h-3" /> تم القبض بنجاح
                                        </span>
                                      ) : isDueOverdue ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 whitespace-nowrap">
                                          <AlertCircle className="w-3 h-3" /> مستحق السداد
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                                          <Clock className="w-3 h-3" /> قيد الانتظار
                                        </span>
                                      )}
                                    </td>

                                    <td className="p-3 text-center font-sans whitespace-nowrap">
                                      {inst.voucher_number ? (
                                        <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded">
                                          {inst.voucher_number}
                                        </span>
                                      ) : (
                                        <span className="text-slate-600">—</span>
                                      )}
                                    </td>

                                    <td className="p-3 text-center font-sans whitespace-nowrap">
                                      {!isPaid && (canEdit || canAdd) ? (
                                        <button
                                          onClick={() => handlePayInstallment(inst, u)}
                                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-[11px] transition shadow cursor-pointer whitespace-nowrap active:scale-95"
                                        >
                                          تسجيل وقبض القسط
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 font-mono">
                                          {inst.paid_at ? String(inst.paid_at).split('T')[0] : '—'}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* 5. نافذة تسجيل عقار جديد مع روابط الصور */}
        {showAddModal && canAdd && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl text-right flex flex-col max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5" style={{ color: primaryCol }} /> تسجيل أصل أو وحدة استثمارية جديدة
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddUnit} className="space-y-3.5 text-xs flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رمز الأصل / الوحدة *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: APT-101 أو VIL-02"
                      value={unitCode}
                      onChange={(e) => setUnitCode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono uppercase outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">نوع الاستثمار العقاري</label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                    >
                      <option value="شقة سكنية فاخرة">شقة سكنية فاخرة</option>
                      <option value="دار سكن / فيلا مستقلة">دار سكن / فيلا مستقلة</option>
                      <option value="مجمع تجاري / محلات">مجمع تجاري / محلات</option>
                      <option value="قطعة أرض استثمارية">قطعة أرض استثمارية</option>
                      <option value="مستودع / مخزن عقاري">مستودع / مخزن عقاري</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">اسم العقار / العنوان التعريفي *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: فيلا حي الفرات - واجهة 12م إطلالة حدائق"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المساحة (م²) *</label>
                    <input
                      type="number"
                      required
                      value={areaSqm}
                      onChange={(e) => setAreaSqm(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">السعر الكلي (د.ع) *</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">المحافظة / المدينة</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">الموقع التفصيلي / الحي</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>روابط صور العقار (رابط واحد في كل سطر للواجهة والتصميم الداخلي):</span>
                  </label>
                  <textarea
                    rows={2}
                    value={imagesText}
                    onChange={(e) => setImagesText(e.target.value)}
                    placeholder="https://example.com/property1.jpg&#10;https://example.com/property2.jpg"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[11px] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ملاحظات ومواصفات إضافية</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="رقم الطابق، الخدمات، حالة السند أو الطابو..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 mt-auto">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">إلغاء</button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="px-6 py-2.5 text-slate-950 font-black rounded-xl cursor-pointer shadow-md whitespace-nowrap active:scale-95"
                    style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ وتسجيل الأصل'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 6. نافذة بيع العقار (مباشر نقدي أو بأقساط استثمارية) */}
        {sellingUnit && (canEdit || canAdd) && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl text-right flex flex-col max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 truncate">
                  <BadgeDollarSign className="w-5 h-5 text-emerald-400 shrink-0" /> تسجيل بيع: <span className="truncate">{sellingUnit.title}</span>
                </h3>
                <button onClick={() => setSellingUnit(null)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSellUnit} className="space-y-4 text-xs flex-1">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">القيمة التعاقدية الكاملة:</span>
                  <span className="font-mono font-black text-base" style={{ color: primaryCol }}>
                    {formatNum(sellingUnit.price)} د.ع
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-bold">طريقة الاستثمار والبيع *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSaleType('INSTALLMENTS')}
                      className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                        saleType === 'INSTALLMENTS' 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-inner' 
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      بيع بالتقسيط المجدول
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaleType('CASH')}
                      className={`py-2 rounded-xl font-bold border transition cursor-pointer ${
                        saleType === 'CASH' 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-inner' 
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      بيع مباشر (نقداً كامل)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">اسم المشتري / العميل *</label>
                    <input
                      type="text"
                      required
                      placeholder="الاسم الثلاثي أو الشركة"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">رقم هاتف المشتري</label>
                    <input
                      type="text"
                      placeholder="078..."
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                </div>

                {saleType === 'INSTALLMENTS' && (
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">الدفعة الأولى (المقدمة) د.ع *</label>
                        <input
                          type="number"
                          required
                          value={downPayment}
                          onChange={(e) => setDownPayment(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">عدد الأقساط الشهرية</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={installmentsCount}
                          onChange={(e) => setInstallmentsCount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">تاريخ استحقاق أول قسط شهري</label>
                      <input
                        type="date"
                        value={firstDueDate}
                        onChange={(e) => setFirstDueDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none"
                      />
                    </div>

                    {Number(installmentsCount) > 0 && (
                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800 text-slate-400">
                        <span>قيمة القسط الشهري المحسوبة:</span>
                        <strong className="text-amber-300 font-mono text-xs">
                          {formatNum(Math.round(Math.max(0, Number(sellingUnit.price) - Number(downPayment)) / Number(installmentsCount)))} د.ع / شهر
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                <div className={`p-3 rounded-2xl border text-[11px] leading-relaxed ${
                  saleType === 'CASH' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}>
                  {saleType === 'CASH' 
                    ? 'سيتم توليد وصل قبض مالي بقيمة العقار كاملة وترحيله لحسابات الشركة مباشرة.' 
                    : 'سيتم توليد وصل قبض للدفعة المقدمة فوراً، وإنشاء جدول زمني آلي بكافة الأقساط الشهرية.'}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 mt-auto">
                  <button type="button" onClick={() => setSellingUnit(null)} className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">إلغاء</button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    {loading ? 'جاري التنفيذ...' : 'اعتماد البيع وتوليد السند'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 7. قالب طباعة استمارة وجدول الأقساط للعميل (A4 رسمي) */}
        {printingScheduleUnit && (
          <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-4">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 p-4 rounded-2xl flex items-center justify-between mb-4 print:hidden">
              <span className="text-white font-bold text-sm">استمارة جدول الأقساط: {printingScheduleUnit.title}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-4 h-4" /> أمر الطباعة الآن
                </button>
                <button
                  onClick={() => setPrintingScheduleUnit(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div 
              id="printable-installment-sheet"
              className="w-full max-w-4xl bg-white text-slate-950 p-8 rounded-2xl shadow-2xl border font-sans"
            >
              {/* ترويسة الاستمارة الرسمية */}
              <div className="flex justify-between items-center border-b-2 pb-4 mb-4" style={{ borderColor: primaryCol }}>
                <div className="text-right">
                  <h2 className="text-xl font-black" style={{ color: primaryCol }}>{companySettings.company_name}</h2>
                  <p className="text-xs text-slate-700 font-bold mt-0.5">{companySettings.tagline}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">قسم الاستثمار والتطوير العقاري • سجل الأقساط والتحصيلات</p>
                </div>
                <div className="text-left font-mono text-xs">
                  <p>التاريخ: {new Date().toISOString().substring(0, 10)}</p>
                  <p className="font-bold text-amber-700">رمز العقار: {printingScheduleUnit.unit_code}</p>
                </div>
              </div>

              {/* بيانات العقد والوحدة */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-5">
                <div>
                  <p className="text-slate-600">اسم المشتري / العميل: <strong className="text-slate-950 text-sm">{printingScheduleUnit.buyer_name}</strong></p>
                  <p className="text-slate-600 mt-1">رقم الهاتف: <strong className="text-slate-950 font-mono">{printingScheduleUnit.buyer_phone || '—'}</strong></p>
                  <p className="text-slate-600 mt-1">العقار: <strong className="text-slate-950">{printingScheduleUnit.title}</strong></p>
                </div>
                <div>
                  <p className="text-slate-600">القيمة التعاقدية: <strong className="text-slate-950 font-mono">{formatNum(printingScheduleUnit.price)} د.ع</strong></p>
                  <p className="text-slate-600 mt-1">إجمالي المسدد: <strong className="text-emerald-700 font-mono">{formatNum(printingScheduleUnit.totalPaid)} د.ع</strong></p>
                  <p className="text-slate-600 mt-1">المتبقي ذمة: <strong className="text-rose-700 font-mono">{formatNum(printingScheduleUnit.totalRemaining)} د.ع</strong></p>
                </div>
              </div>

              {/* جدول الأقساط المطبوع */}
              <table className="w-full text-right text-xs border-collapse border border-slate-300 mb-6">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
                    <th className="border border-slate-300 p-2 text-center">ت</th>
                    <th className="border border-slate-300 p-2">عنوان الدفعة / القسط</th>
                    <th className="border border-slate-300 p-2">المبلغ المستحق</th>
                    <th className="border border-slate-300 p-2">تاريخ الاستحقاق</th>
                    <th className="border border-slate-300 p-2 text-center">حالة السداد</th>
                    <th className="border border-slate-300 p-2 text-center">رقم سند القبض</th>
                  </tr>
                </thead>
                <tbody>
                  {(printingScheduleUnit.installments || []).map((inst: any, idx: number) => (
                    <tr key={inst.installment_id} className="border-b border-slate-200">
                      <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 font-bold">{inst.installment_title}</td>
                      <td className="border border-slate-300 p-2 font-mono font-bold">{formatNum(inst.amount)} د.ع</td>
                      <td className="border border-slate-300 p-2 font-mono">{String(inst.due_date || '').split('T')[0]}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        {inst.is_paid ? 'مسدد ✓' : 'مستحق وغير مسدد'}
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono font-bold text-slate-700">
                        {inst.voucher_number || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* التواقيع الرسمية */}
              <div className="grid grid-cols-3 gap-6 text-center text-xs pt-4 border-t border-slate-200">
                <div>
                  <p className="font-bold">توقيع المشتري</p>
                  <div className="h-10"></div>
                  <div className="border-b border-slate-400 w-32 mx-auto"></div>
                </div>
                <div>
                  <p className="font-bold">مدير الاستثمار العقاري</p>
                  <div className="h-10"></div>
                  <div className="border-b border-slate-400 w-32 mx-auto"></div>
                </div>
                <div>
                  <p className="font-bold">المدير المفوض / الختم</p>
                  <div className="h-10"></div>
                  <div className="border-b border-slate-400 w-32 mx-auto"></div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}