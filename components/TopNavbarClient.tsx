'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutGrid, 
  ShieldCheck, 
  Bell, 
  FileText, 
  FileCheck, 
  CreditCard, 
  HardHat, 
  Truck, 
  Boxes, 
  Building, 
  Users, 
  Wallet, 
  Settings, 
  Clock, 
  LogOut, 
  User, 
  ChevronDown, 
  Menu, 
  X,
  Lock,
  PieChart,
  CheckCheck,
  Trash2,
  ExternalLink,
  Database,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useBranch } from '@/context/BranchContext';

export default function TopNavbarClient() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedBranchId, setSelectedBranchId, branches } = useBranch();

  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    logo_url: '',
    primary_color: '#d97706',
  });

  const [showModulesMenu, setShowModulesMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [timeHoursMins, setTimeHoursMins] = useState('');
  const [timePeriod, setTimePeriod] = useState('');

  const isFetchingNotifs = useRef(false);

  // دالة تحديد الأيقونة واللون الخاص بكل قطاع لضمان المظهر التفاعلي الفاخر
  const getSectorMeta = (sector: string) => {
    const s = String(sector || '').toUpperCase();
    if (s.includes('CONTRACT') || s.includes('عقد')) {
      return { icon: <FileCheck className="w-4 h-4 text-indigo-400 shrink-0" />, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', label: 'العقود' };
    }
    if (s.includes('ADMIN') || s.includes('DOC') || s.includes('كتاب') || s.includes('إداري')) {
      return { icon: <FileText className="w-4 h-4 text-amber-400 shrink-0" />, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'الكتب والوثائق' };
    }
    if (s.includes('INSTALLMENT') || s.includes('قسط')) {
      return { icon: <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'الأقساط' };
    }
    if (s.includes('PROJ') || s.includes('CONST') || s.includes('مشاريع')) {
      return { icon: <HardHat className="w-4 h-4 text-amber-500 shrink-0" />, color: 'bg-amber-500/10 text-amber-500 border-amber-500/30', label: 'المقاولات' };
    }
    if (s.includes('FLEET') || s.includes('TRANS') || s.includes('نقل')) {
      return { icon: <Truck className="w-4 h-4 text-sky-400 shrink-0" />, color: 'bg-sky-500/10 text-sky-400 border-sky-500/30', label: 'الأسطول' };
    }
    if (s.includes('INVENT') || s.includes('TRADE') || s.includes('مخزن')) {
      return { icon: <Boxes className="w-4 h-4 text-teal-400 shrink-0" />, color: 'bg-teal-500/10 text-teal-400 border-teal-500/30', label: 'التجارة والمخزن' };
    }
    if (s.includes('ESTATE') || s.includes('عقار')) {
      return { icon: <Building className="w-4 h-4 text-purple-400 shrink-0" />, color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', label: 'العقارات' };
    }
    if (s.includes('HR') || s.includes('PAYROLL') || s.includes('راتب')) {
      return { icon: <Users className="w-4 h-4 text-rose-400 shrink-0" />, color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', label: 'الموارد البشرية' };
    }
    if (s.includes('VOUCHER') || s.includes('سند') || s.includes('FINANCE')) {
      return { icon: <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'المالية والسندات' };
    }
    return { icon: <Bell className="w-4 h-4 text-amber-400 shrink-0" />, color: 'bg-slate-800 text-slate-300 border-slate-700', label: 'إشعار عام' };
  };

  const syncUser = () => {
    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try { 
        const u = JSON.parse(raw);
        setCurrentUser(u);
      } catch {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    syncUser();

    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.settings) {
            setCompanySettings(data.settings);
          }
        }
      } catch {
        // كتم أخطاء انقطاع الاتصال المؤقتة أثناء التنقل
      }
    };
    loadSettings();

    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      const period = hours >= 12 ? 'م' : 'ص';
      hours = hours % 12 || 12;
      const formattedHours = hours.toString().padStart(2, '0');

      setTimeHoursMins(`${formattedHours}:${mins}`);
      setTimePeriod(period);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [pathname]);

  const fetchNotifications = async () => {
    if (isFetchingNotifs.current) return;
    isFetchingNotifs.current = true;
    try {
      const u = currentUser || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('erp_user') || '{}'));
      const uname = u?.username || '';
      const bId = u?.assigned_branch_id || selectedBranchId || 'ALL';
      const role = u?.role || '';

      const res = await fetch(`/api/notifications?username=${encodeURIComponent(uname)}&branch_id=${encodeURIComponent(bId)}&role=${encodeURIComponent(role)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          const apiNotifs = data.notifications || [];
          setNotifications(apiNotifs);
          setUnreadCount(apiNotifs.filter((n: any) => !n.is_read).length);
        }
      }
    } catch {
      // كتم الأخطاء المؤقتة للشبكة
    } finally {
      isFetchingNotifs.current = false;
    }
  };

  useEffect(() => {
    fetchNotifications();
    const notifTimer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(notifTimer);
  }, [selectedBranchId]);

  const markAllAsRead = async () => {
    try {
      const uname = currentUser?.username || '';
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_AS_READ', username: uname })
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const markSingleAsRead = async (notifId: string) => {
    try {
      const uname = currentUser?.username || '';
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notifId, username: uname })
      });
      setNotifications(prev => prev.map(n => (n.notification_id === notifId || n.id === notifId) ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const clearAllNotifications = async () => {
    if (!confirm('هل تريد مسح كافة الإشعارات من حسابك؟')) return;
    try {
      const uname = currentUser?.username || '';
      await fetch(`/api/notifications?username=${encodeURIComponent(uname)}`, { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    document.cookie = 'rtco_selected_branch_id=; path=/; max-age=0';
    document.cookie = 'rtco_secure_session=; path=/; max-age=0';
    window.location.href = '/login';
  };

  if (pathname === '/login') {
    return null;
  }

  const isSuperAdmin = Boolean(
    currentUser?.is_super_admin || 
    currentUser?.role === 'ADMIN' || 
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.username === 'admin' ||
    currentUser?.username === 'pro'
  );

  const isBranchRestricted = Boolean(!isSuperAdmin && currentUser?.assigned_branch_id && currentUser.assigned_branch_id !== 'ALL');

  const canAccess = (moduleKey: string) => {
    if (isSuperAdmin) return true;
    if (!currentUser?.permissions) return false;
    const p = currentUser.permissions[moduleKey];
    if (typeof p === 'object' && p !== null) {
      return Boolean(p.view);
    }
    if (Array.isArray(p)) {
      return p.includes('view');
    }
    return false;
  };

  const roleTitle = isSuperAdmin ? 'المدير المفوض' : (currentUser?.job_title || 'موظف مصرح');
  const primaryCol = companySettings.primary_color || '#d97706';
  const hasLogo = Boolean(companySettings.logo_url && companySettings.logo_url.trim().length > 10);

  const currentBranchName = () => {
    if (isBranchRestricted) {
      const b = (branches || []).find((x: any) => x.branch_id === currentUser.assigned_branch_id);
      return b ? b.name_ar : 'فرع التجارة العامة والمخازن';
    }
    const cur = (branches || []).find((x: any) => x.branch_id === selectedBranchId);
    return cur ? cur.name_ar : 'المقر الرئيسي (عرض المنظومة الموحدة)';
  };

  return (
    <header className="sticky top-0 z-50 bg-[#090e18]/95 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl px-3 md:px-6 py-2.5 print:hidden font-cairo text-[14px]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* 1. الجانب الأيمن: شعار الشركة ونطاق العمل المخصص */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group transition">
            <div 
              className="w-10 h-10 relative rounded-2xl overflow-hidden bg-slate-950 p-1 border flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition"
              style={{ borderColor: `${primaryCol}50` }}
            >
              {hasLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={companySettings.logo_url} alt={companySettings.company_name} className="w-full h-full object-contain" />
              ) : (
                <Image src="/logo.png" alt={companySettings.company_name} width={36} height={36} className="object-contain" priority />
              )}
            </div>
            <div className="text-right">
              <h1 className="text-xs sm:text-sm md:text-base font-black text-white leading-tight tracking-wide group-hover:text-amber-400 transition">
                {companySettings.company_name}
              </h1>
              <p className="text-[9px] sm:text-[10px] font-mono font-bold" style={{ color: primaryCol }}>
                Enterprise ERP • النجف الأشرف
              </p>
            </div>
          </Link>

          {/* محوّل الفروع للشاشات الكبيرة */}
          <div className="hidden lg:block">
            {isBranchRestricted ? (
              <div className="flex items-center gap-2 bg-[#0c1424] border border-amber-500/40 rounded-2xl px-3 py-1.5 shadow-md">
                <span className="text-amber-400 text-sm">🏢</span>
                <span className="text-xs font-bold text-amber-300">
                  📍 {currentBranchName()}
                </span>
                <span className="text-[10px] bg-slate-900 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono font-bold">
                  <Lock className="w-2.5 h-2.5 text-amber-400" /> مقيد
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#0c1424] hover:bg-[#101b30] border border-slate-700/80 hover:border-amber-500/50 rounded-2xl px-3 py-1.5 shadow-lg transition">
                <span className="text-amber-400 text-sm">🏢</span>
                <label className="text-xs text-slate-400 font-bold whitespace-nowrap">نطاق العمل:</label>
                <select
                  value={selectedBranchId || 'ALL'}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-xs font-black text-amber-300 focus:outline-none cursor-pointer py-0.5 dir-rtl"
                >
                  <option value="ALL" className="bg-[#0c1424] text-amber-400 font-bold">
                    🌐 المقر الرئيسي (عرض المنظومة الموحدة)
                  </option>
                  {(branches || [])
                    .filter((b: any) => b.branch_id !== 'ALL')
                    .map((b: any) => (
                      <option key={b.branch_id} value={b.branch_id} className="bg-[#0c1424] text-slate-100 font-bold">
                        📍 {b.name_ar} {b.city ? `(${b.city})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 2. الجانب الأيسر (للشاشات الكبيرة) */}
        <div className="hidden xl:flex items-center gap-2.5">
          
          {/* الساعة الرقمية */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-[#0c1424] to-[#121c32] border border-amber-500/40 px-3.5 py-1.5 rounded-2xl shadow-lg">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1 font-mono" dir="ltr">
              <span className="text-sm font-black text-amber-300 tracking-wider">
                {timeHoursMins || '12:00'}
              </span>
              <span className="text-[10px] font-black text-amber-500 font-sans">
                {timePeriod || 'م'}
              </span>
            </div>
          </div>

          {/* قائمة قطاعات المنظومة */}
          <div className="relative">
            <button
              onClick={() => { setShowModulesMenu(!showModulesMenu); setShowAdminMenu(false); setShowNotifMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-bold transition cursor-pointer whitespace-nowrap"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span>قطاعات المنظومة</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showModulesMenu ? 'rotate-180' : ''}`} />
            </button>

            {showModulesMenu && (
              <div className="absolute right-0 mt-2 w-72 max-h-[80vh] overflow-y-auto bg-[#0c1220] border border-slate-700/80 rounded-2xl p-2 shadow-2xl grid grid-cols-1 gap-1 z-50 text-right animate-in fade-in slide-in-from-top-2">
                {canAccess('admin_docs') && (
                  <Link href="/admin/documents" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <FileText className="w-3.5 h-3.5 text-amber-400" /> الإدارة والكتب الرسمية
                  </Link>
                )}
                {canAccess('contracts') && (
                  <Link href="/real-estate/contracts" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <FileCheck className="w-3.5 h-3.5 text-indigo-400" /> العقود الإلكترونية الرسمية
                  </Link>
                )}
                {canAccess('installments') && (
                  <Link href="/inventory/installments" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> المبيعات بالأقساط المدمجة
                  </Link>
                )}
                {canAccess('contracting') && (
                  <Link href="/projects" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <HardHat className="w-3.5 h-3.5 text-amber-400" /> قطاع المقاولات والمشاريع
                  </Link>
                )}
                {canAccess('fleet') && (
                  <Link href="/fleet" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <Truck className="w-3.5 h-3.5 text-sky-400" /> أسطول النقل واللوجستيات
                  </Link>
                )}
                {canAccess('inventory') && (
                  <Link href="/inventory" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <Boxes className="w-3.5 h-3.5 text-amber-500" /> التجارة والمخزن المركزي
                  </Link>
                )}
                {canAccess('realestate') && (
                  <Link href="/real-estate" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <Building className="w-3.5 h-3.5 text-purple-400" /> العقارات والاستثمار
                  </Link>
                )}
                {canAccess('hr') && (
                  <Link href="/hr" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <Users className="w-3.5 h-3.5 text-rose-400" /> الموارد البشرية والرواتب
                  </Link>
                )}
                {canAccess('vouchers') && (
                  <Link href="/vouchers" onClick={() => setShowModulesMenu(false)} className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white">
                    <Wallet className="w-3.5 h-3.5 text-purple-400" /> السندات والقيود المحاسبية
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* أدوات الإدارة العليا */}
          {isSuperAdmin && (
            <div className="relative">
              <button
                onClick={() => { setShowAdminMenu(!showAdminMenu); setShowModulesMenu(false); setShowNotifMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>أدوات الإدارة العليا</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
              </button>

              {showAdminMenu && (
                <div className="absolute right-0 mt-2 w-72 max-h-[80vh] overflow-y-auto bg-[#0c1220] border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl space-y-1.5 z-50 text-right animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-800">
                    الإعدادات والرقابة العامة
                  </div>
                  <Link href="/admin/settings" onClick={() => setShowAdminMenu(false)} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-xl text-xs font-bold text-amber-400 transition">
                    <Settings className="w-3.5 h-3.5" /> إعدادات الشركة وترويسة الطباعة
                  </Link>
                  <Link href="/admin/users" onClick={() => setShowAdminMenu(false)} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-xl text-xs font-bold text-emerald-400 transition">
                    <ShieldCheck className="w-3.5 h-3.5" /> إدارة صلاحيات الموظفين
                  </Link>
                  <Link href="/finance/reports" onClick={() => setShowAdminMenu(false)} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-xl text-xs font-bold text-purple-400 transition">
                    <PieChart className="w-3.5 h-3.5" /> التقارير وقائمة الدخل
                  </Link>

                  <div className="px-2 pt-2 pb-1 text-[11px] font-bold text-slate-400 border-b border-t border-slate-800">
                    النسخ الاحتياطي والحوكمة
                  </div>

                  <Link 
                    href="/admin/backup" 
                    onClick={() => setShowAdminMenu(false)} 
                    className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-xl text-xs font-black text-amber-300 bg-amber-500/10 border border-amber-500/20 transition"
                  >
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    <span>فتح صفحة النسخة الاحتياطية المستقلة</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* الإشعارات المحدثة بالتصميم الفاخر */}
          <div className="relative">
            <button
              onClick={() => { 
                const next = !showNotifMenu;
                setShowNotifMenu(next); 
                setShowModulesMenu(false); 
                setShowAdminMenu(false);
                if (next) fetchNotifications();
              }}
              className={`relative p-2 rounded-xl transition cursor-pointer border ${
                showNotifMenu 
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                  : 'bg-slate-900 border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white'
              }`}
              title="الإشعارات"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* قائمة الإشعارات الغنية بالتفاصيل والألوان الفاخرة */}
            {showNotifMenu && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 md:w-[420px] bg-[#0c1220] border border-slate-700/90 rounded-3xl p-3.5 shadow-2xl z-50 text-right animate-in fade-in slide-in-from-top-2 origin-top-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-white">إشعارات النظام المركزية</span>
                    {unreadCount > 0 && (
                      <span className="bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold px-2 py-0.2 rounded-full font-mono">
                        {unreadCount} غير مقروء
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer"
                        title="تعليم الكل كمقروء"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px]">قراءة الكل</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="تفريغ السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 py-2.5 pr-0.5">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      لا توجد إشعارات جديدة حالياً ✓
                    </div>
                  ) : (
                    notifications.map((n: any) => {
                      const isUnread = !n.is_read;
                      const meta = getSectorMeta(n.sector);
                      const formattedTime = n.created_at ? String(n.created_at).replace('T', ' ').slice(0, 16) : '';
                      
                      // اعتماد اسم المستخدم الحقيقي من حقول الإشعار أو من جلسة المستخدم الحالي
                      const userAuthor = n.created_by_user || n.created_by || n.user_name || n.username || n.sender || currentUser?.full_name || currentUser?.username || 'الإدارة المركزية';

                      return (
                        <div
                          key={n.notification_id || n.id}
                          className={`p-3 rounded-2xl border transition flex flex-col gap-1.5 cursor-pointer ${
                            isUnread 
                              ? 'bg-slate-900/95 border-amber-500/40 hover:border-amber-400 shadow-sm' 
                              : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/50'
                          }`}
                          onClick={() => {
                            if (isUnread) markSingleAsRead(n.notification_id || n.id);
                            if (n.link) {
                              setShowNotifMenu(false);
                              router.push(n.link);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate">
                              {meta.icon}
                              <span className="text-xs font-bold text-white truncate">
                                {n.title}
                              </span>
                            </div>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-ping"></span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-300 leading-relaxed pr-6">
                            {n.message}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60 mt-0.5 flex-wrap gap-2">
                            <div className="flex items-center gap-2 font-mono">
                              <span className={`px-2 py-0.5 rounded-md border font-sans font-bold text-[9px] ${meta.color}`}>
                                {meta.label}
                              </span>
                              <span className="text-slate-400 flex items-center gap-1 font-sans">
                                <User className="w-2.5 h-2.5 text-slate-500" />
                                {userAuthor}
                              </span>
                              <span className="text-slate-500">
                                {formattedTime}
                              </span>
                            </div>

                            {n.link && (
                              <span className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 font-sans">
                                فتح السجل <ExternalLink className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between px-2 text-xs">
                  <Link
                    href="/finance/reports"
                    onClick={() => setShowNotifMenu(false)}
                    className="font-bold text-sky-400 hover:text-sky-300 transition flex items-center gap-1"
                  >
                    <PieChart className="w-3.5 h-3.5 text-sky-400" />
                    <span>صفحة التقارير العامة</span>
                  </Link>

                  <button
                    onClick={() => { setShowNotifMenu(false); router.push('/admin/notifications'); }}
                    className="font-bold text-amber-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>أرشيف الإشعارات</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* بطاقة المستخدم الحالي */}
          {currentUser && (
            <div className="flex items-center gap-2 bg-[#0c1220] border border-slate-800 px-2.5 py-1 rounded-2xl shadow-inner shrink-0">
              <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 transition cursor-pointer p-0.5" title="تسجيل الخروج">
                <LogOut className="w-3.5 h-3.5" />
              </button>
              <div className="text-right">
                <p className="text-xs font-black text-white leading-tight">
                  {currentUser.full_name || currentUser.username}
                </p>
                <span className="text-[9px] font-bold text-amber-500 block">
                  {roleTitle}
                </span>
              </div>
              <div className="w-7 h-7 rounded-xl bg-slate-900 border flex items-center justify-center shrink-0" style={{ borderColor: `${primaryCol}50`, color: primaryCol }}>
                <User className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

        </div>

        {/* 3. الجانب الأيسر لشاشات الموبايل والتابلت */}
        <div className="flex xl:hidden items-center gap-2">
          {/* زر الإشعارات في الموبايل */}
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowMobileMenu(false);
              if (!showNotifMenu) fetchNotifications();
            }}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="الإشعارات"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {currentUser && (
            <span className="text-xs font-bold text-white px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 truncate max-w-[100px]">
              {currentUser.full_name?.split(' ')[0] || currentUser.username}
            </span>
          )}
          <button
            onClick={() => { setShowMobileMenu(!showMobileMenu); setShowNotifMenu(false); }}
            className="p-2 bg-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center shadow-lg cursor-pointer"
          >
            {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* قائمة الإشعارات الغنية والملونة عند فتحها من شاشات الموبايل */}
      {showNotifMenu && (
        <div className="xl:hidden mt-2 bg-[#0c1220] border border-slate-700/90 rounded-2xl p-3 shadow-2xl z-50 text-right animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" /> إشعارات النظام المركزية ({unreadCount})
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[10px] text-emerald-400 font-bold cursor-pointer">
                  قراءة الكل
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAllNotifications} className="text-[10px] text-rose-400 font-bold cursor-pointer">
                  تفريغ
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 py-2">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">لا توجد إشعارات حالياً ✓</div>
            ) : (
              notifications.map((n: any) => {
                const isUnread = !n.is_read;
                const meta = getSectorMeta(n.sector);
                
                // اعتماد اسم المستخدم الحقيقي في شاشات الموبايل أيضاً
                const userAuthor = n.created_by_user || n.created_by || n.user_name || n.username || n.sender || currentUser?.full_name || currentUser?.username || 'الإدارة المركزية';

                return (
                  <div
                    key={n.notification_id || n.id}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex flex-col gap-1.5 ${
                      isUnread 
                        ? 'bg-slate-900 border-amber-500/40 shadow-sm' 
                        : 'bg-slate-950 border-slate-800'
                    }`}
                    onClick={() => {
                      markSingleAsRead(n.notification_id || n.id);
                      if (n.link) {
                        setShowNotifMenu(false);
                        router.push(n.link);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        {meta.icon}
                        <p className="font-bold text-white text-[11px] truncate">{n.title}</p>
                      </div>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-300 leading-snug">{n.message}</p>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                      <span className="flex items-center gap-1 font-sans text-slate-300">
                        <User className="w-2.5 h-2.5 text-slate-500" /> {userAuthor}
                      </span>
                      <span>{n.created_at ? String(n.created_at).slice(5, 16) : ''}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between px-1 text-[11px]">
            <Link
              href="/finance/reports"
              onClick={() => setShowNotifMenu(false)}
              className="font-bold text-sky-400 flex items-center gap-1"
            >
              <PieChart className="w-3 h-3 text-sky-400" />
              <span>التقارير العامة</span>
            </Link>

            <button
              onClick={() => { setShowNotifMenu(false); router.push('/admin/notifications'); }}
              className="font-bold text-amber-400 flex items-center gap-1 cursor-pointer"
            >
              <span>أرشيف الإشعارات ←</span>
            </button>
          </div>
        </div>
      )}

      {/* قائمة الموبايل المنسدلة النظيفة الخالية من أزرار الباك أب وقفل الشهر المكررة */}
      {showMobileMenu && (
        <div className="xl:hidden mt-2 bg-[#0c1220] border border-slate-700 rounded-2xl p-4 shadow-2xl text-right space-y-4 animate-in fade-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto">
          
          {/* نطاق الفرع بالموبايل */}
          <div className="pb-3 border-b border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold block mb-1.5">نطاق عمل الفرع:</span>
            {isBranchRestricted ? (
              <div className="p-2.5 bg-slate-950 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-bold flex items-center justify-between">
                <span>📍 {currentBranchName()}</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">مقيد</span>
              </div>
            ) : (
              <select
                value={selectedBranchId || 'ALL'}
                onChange={(e) => { setSelectedBranchId(e.target.value); setShowMobileMenu(false); }}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 text-xs font-bold cursor-pointer"
              >
                <option value="ALL">🌐 المقر الرئيسي (عرض المنظومة الموحدة)</option>
                {(branches || [])
                  .filter((b: any) => b.branch_id !== 'ALL')
                  .map((b: any) => (
                    <option key={b.branch_id} value={b.branch_id}>📍 {b.name_ar}</option>
                  ))}
              </select>
            )}
          </div>

          {/* القطاعات الكاملة المصرح بها على الموبايل */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <LayoutGrid className="w-3.5 h-3.5" /> قطاعات المنظومة الشاملة:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {canAccess('contracting') && (
                <Link href="/projects" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-amber-300 font-bold flex items-center gap-1.5 hover:border-amber-500/40">
                  <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">المقاولات والمشاريع</span>
                </Link>
              )}
              {canAccess('inventory') && (
                <Link href="/inventory" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold flex items-center gap-1.5 hover:border-amber-500/40">
                  <Boxes className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">المخزن والتجارة</span>
                </Link>
              )}
              {canAccess('contracts') && (
                <Link href="/real-estate/contracts" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold flex items-center gap-1.5 hover:border-indigo-500/40">
                  <FileCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">العقود الرسمية</span>
                </Link>
              )}
              {canAccess('installments') && (
                <Link href="/inventory/installments" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold flex items-center gap-1.5 hover:border-emerald-500/40">
                  <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">المبيعات بالأقساط</span>
                </Link>
              )}
              {canAccess('fleet') && (
                <Link href="/fleet" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold flex items-center gap-1.5 hover:border-sky-500/40">
                  <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate">أسطول النقل</span>
                </Link>
              )}
              {canAccess('realestate') && (
                <Link href="/real-estate" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold flex items-center gap-1.5 hover:border-purple-500/40">
                  <Building className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="truncate">الاستثمار العقاري</span>
                </Link>
              )}
              {canAccess('hr') && (
                <Link href="/hr" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold flex items-center gap-1.5 hover:border-rose-500/40">
                  <Users className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">الكوادر والرواتب</span>
                </Link>
              )}
              {canAccess('vouchers') && (
                <Link href="/vouchers" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold flex items-center gap-1.5 hover:border-purple-500/40">
                  <Wallet className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="truncate">السندات المالية</span>
                </Link>
              )}
              {canAccess('admin_docs') && (
                <Link href="/admin/documents" onClick={() => setShowMobileMenu(false)} className="col-span-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold flex items-center justify-center gap-2 hover:border-amber-500/40">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>الكتب والمخاطبات الرسمية</span>
                </Link>
              )}
            </div>
          </div>

          {/* أدوات الإدارة العليا للموبايل (مخصصة ومنظمة) */}
          {isSuperAdmin && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> أدوات الإدارة العليا والرقابة:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link href="/admin/settings" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 font-bold flex items-center gap-1.5">
                  <Settings className="w-4 h-4 shrink-0" />
                  <span className="truncate">إعدادات الشركة</span>
                </Link>
                <Link href="/admin/users" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="truncate">الصلاحيات</span>
                </Link>
                <Link href="/finance/reports" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-purple-400 font-bold flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 shrink-0" />
                  <span className="truncate">التقارير المالية</span>
                </Link>
                <Link href="/admin/backup" onClick={() => setShowMobileMenu(false)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-amber-300 font-bold flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">صفحة الباك أب</span>
                </Link>
              </div>
            </div>
          )}

          {/* تسجيل الخروج */}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-300 font-bold truncate max-w-[200px]">
              {currentUser?.full_name || currentUser?.username} ({roleTitle})
            </span>
            <button 
              onClick={handleLogout} 
              className="px-3.5 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 hover:bg-rose-600 hover:text-white transition"
            >
              <LogOut className="w-3.5 h-3.5" /> خروج
            </button>
          </div>

        </div>
      )}

    </header>
  );
}