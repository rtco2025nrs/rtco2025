'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  ArrowLeft, 
  CheckCheck, 
  Trash2, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Home, 
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  User,
  FileText,
  FileCheck,
  CreditCard,
  HardHat,
  Truck,
  Boxes,
  Building,
  Users,
  Wallet,
  PieChart,
  Calendar
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    primary_color: '#d97706',
    secondary_color: '#ea580c'
  });

  // دالة تحديد الأيقونة ولون الشارة المخصصة لكل قطاع
  const getSectorMeta = (sector: string) => {
    const s = String(sector || '').toUpperCase();
    if (s.includes('CONTRACTS') || s.includes('عقد')) {
      return { 
        icon: <FileCheck className="w-4 h-4 text-indigo-400 shrink-0" />, 
        color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', 
        label: 'العقود الرسمية' 
      };
    }
    if (s.includes('ADMIN') || s.includes('DOC') || s.includes('كتاب') || s.includes('إداري')) {
      return { 
        icon: <FileText className="w-4 h-4 text-amber-400 shrink-0" />, 
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', 
        label: 'الكتب والوثائق' 
      };
    }
    if (s.includes('INSTALLMENT') || s.includes('قسط')) {
      return { 
        icon: <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />, 
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', 
        label: 'الأقساط المدمجة' 
      };
    }
    if (s.includes('CONTRACTING') || s.includes('PROJ') || s.includes('مشاريع')) {
      return { 
        icon: <HardHat className="w-4 h-4 text-amber-500 shrink-0" />, 
        color: 'bg-amber-500/10 text-amber-500 border-amber-500/30', 
        label: 'المقاولات والإعمار' 
      };
    }
    if (s.includes('FLEET') || s.includes('TRANS') || s.includes('نقل')) {
      return { 
        icon: <Truck className="w-4 h-4 text-sky-400 shrink-0" />, 
        color: 'bg-sky-500/10 text-sky-400 border-sky-500/30', 
        label: 'أسطول النقل' 
      };
    }
    if (s.includes('INVENT') || s.includes('TRADE') || s.includes('مخزن')) {
      return { 
        icon: <Boxes className="w-4 h-4 text-teal-400 shrink-0" />, 
        color: 'bg-teal-500/10 text-teal-400 border-teal-500/30', 
        label: 'المخزن والتجارة' 
      };
    }
    if (s.includes('ESTATE') || s.includes('عقار')) {
      return { 
        icon: <Building className="w-4 h-4 text-purple-400 shrink-0" />, 
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', 
        label: 'الاستثمار العقاري' 
      };
    }
    if (s.includes('HR') || s.includes('PAYROLL') || s.includes('راتب')) {
      return { 
        icon: <Users className="w-4 h-4 text-rose-400 shrink-0" />, 
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', 
        label: 'الموارد البشرية' 
      };
    }
    if (s.includes('VOUCHER') || s.includes('سند') || s.includes('FINANCE')) {
      return { 
        icon: <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />, 
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', 
        label: 'المالية والسندات' 
      };
    }
    return { 
      icon: <Bell className="w-4 h-4 text-amber-400 shrink-0" />, 
      color: 'bg-slate-800 text-slate-300 border-slate-700', 
      label: 'إشعار عام' 
    };
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.settings) {
          setCompanySettings(data.settings);
        }
      }
    } catch {}
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('erp_user') || '{}') : {};
      const uname = u?.username || 'admin';
      const bId = u?.assigned_branch_id || 'ALL';
      const role = u?.role || '';

      const res = await fetch(`/api/notifications?username=${encodeURIComponent(uname)}&branch_id=${encodeURIComponent(bId)}&role=${encodeURIComponent(role)}`, { 
        cache: 'no-store' 
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setNotifications(data.notifications || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('erp_user') || '{}') : {};
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_AS_READ', username: u?.username || 'admin' })
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const markSingleAsRead = async (notifId: string) => {
    try {
      const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('erp_user') || '{}') : {};
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notifId, username: u?.username || 'admin' })
      });
      setNotifications(prev => prev.map(n => (n.notification_id === notifId || n.id === notifId) ? { ...n, is_read: true } : n));
    } catch {}
  };

  const deleteNotification = async (notifId: string) => {
    try {
      const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('erp_user') || '{}') : {};
      await fetch(`/api/notifications?id=${notifId}&username=${encodeURIComponent(u?.username || 'admin')}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.notification_id !== notifId && n.id !== notifId));
    } catch {}
  };

  const clearAllNotifications = async () => {
    if (!confirm('هل أنت متأكد من تفريغ ومسح كافة الإشعارات؟')) return;
    try {
      const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('erp_user') || '{}') : {};
      await fetch(`/api/notifications?username=${encodeURIComponent(u?.username || 'admin')}`, { method: 'DELETE' });
      setNotifications([]);
    } catch {}
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        String(n.title || '').toLowerCase().includes(q) || 
        String(n.message || '').toLowerCase().includes(q) ||
        String(n.sector || '').toLowerCase().includes(q) ||
        String(n.created_by || n.user_name || n.username || n.sender || n.author || '').toLowerCase().includes(q);

      const matchSector = sectorFilter === 'ALL' || String(n.sector).toUpperCase() === sectorFilter;
      const matchStatus = statusFilter === 'ALL' || (statusFilter === 'UNREAD' ? !n.is_read : n.is_read);

      return matchSearch && matchSector && matchStatus;
    });
  }, [notifications, searchQuery, sectorFilter, statusFilter]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  const primaryCol = companySettings.primary_color || '#d97706';
  const secondaryCol = companySettings.secondary_color || '#ea580c';

  return (
    <AuthGuard>
      <div dir="rtl" className="min-h-screen bg-[#06080e] text-slate-100 p-4 md:p-8 font-cairo text-xs">
        
        {/* الترويسة الرئيسية */}
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${primaryCol}, ${secondaryCol})` }}
            >
              <Bell className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black text-white">مركز وسجل إشعارات المنظومة</h1>
                {unreadCount > 0 && (
                  <span className="bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                    {unreadCount} غير مقروء
                  </span>
                )}
              </div>
              <p className="text-slate-400 mt-0.5">
                {companySettings.company_name} • تتبع كافة القيود، العقود، السندات، وحركات الأقسام المباشرة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            <button
              onClick={fetchNotifications}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              title="تحديث الإشعارات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link 
              href="/finance/reports" 
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <PieChart className="w-4 h-4 text-sky-400" /> صفحة التقارير العامة
            </Link>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" /> تعليم الكل كمقروء
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> تفريغ السجل
              </button>
            )}
            <Link href="/" className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-slate-300 hover:text-white flex items-center gap-1.5 font-bold transition">
              <Home className="w-4 h-4" /> الرئيسية
            </Link>
          </div>
        </div>

        {/* أدوات البحث والتصفية */}
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                placeholder="ابحث بالعنوان، الموظف، النص، أو نوع القطاع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0b101d] border border-slate-800 rounded-2xl pr-10 pl-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-[#0b101d] border border-slate-800 rounded-2xl p-2 text-white outline-none text-xs cursor-pointer"
            >
              <option value="ALL">كافة القطاعات</option>
              <option value="CONTRACTING">المقاولات والمشاريع</option>
              <option value="FINANCE">المالية والسندات</option>
              <option value="INVENTORY">المخزن والتجارة</option>
              <option value="REAL_ESTATE">العقارات والاستثمار</option>
              <option value="FLEET">أسطول النقل</option>
              <option value="HR">الموارد البشرية</option>
              <option value="ADMIN_DOCS">الكتب والوثائق</option>
              <option value="CONTRACTS">العقود الرسمية</option>
              <option value="INSTALLMENTS">المبيعات بالأقساط</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0b101d] border border-slate-800 rounded-2xl p-2 text-white outline-none text-xs cursor-pointer"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="UNREAD">غير المقروءة فقط</option>
              <option value="READ">المقروءة فقط</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            عدد النتائج: <strong className="text-white">{filteredNotifications.length}</strong> من أصل {notifications.length}
          </span>
        </div>

        {/* قائمة بطاقات الإشعارات بتصميم متكامل الأيقونات واليوزر والتاريخ */}
        <div className="max-w-6xl mx-auto space-y-3 mt-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-[#0b101d] border border-slate-800 p-12 rounded-3xl text-center text-slate-500">
              لا توجد إشعارات مطابقة لمعايير البحث حالياً ✓
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isUnread = !n.is_read;
              const nId = n.notification_id || n.id;
              const meta = getSectorMeta(n.sector);
              
              // قراءة اسم المستخدم من الإشعار أو من جلسة المستخدم الحالي المسجل دخوله
              const currentSessionUser = typeof window !== 'undefined' ? (() => {
                try {
                  const parsed = JSON.parse(localStorage.getItem('erp_user') || '{}');
                  return parsed?.full_name || parsed?.name || parsed?.username;
                } catch {
                  return null;
                }
              })() : null;

              const userAuthor = n.created_by || n.user_name || n.username || n.sender || n.author || n.executed_by || currentSessionUser || 'الإدارة المركزية';
              const formattedTime = n.created_at ? String(n.created_at).replace('T', ' ').slice(0, 16) : 'الآن';

              return (
                <div
                  key={nId}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md ${
                    isUnread
                      ? 'bg-slate-900/95 border-amber-500/40 hover:border-amber-500/70 shadow-amber-500/5'
                      : 'bg-[#0b101d]/80 border-slate-800 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {meta.icon}
                        <h3 className="text-sm font-bold text-white">{n.title}</h3>
                      </div>
                      
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-ping"></span>
                      )}

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border font-sans ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pr-6">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 pr-6 flex-wrap font-mono">
                      <span className="flex items-center gap-1.5 font-sans text-slate-300 bg-slate-950/70 px-2.5 py-0.5 rounded-lg border border-slate-800/80">
                        <User className="w-3 h-3 text-amber-400" />
                        منفّذ الإجراء: <strong className="text-white">{userAuthor}</strong>
                      </span>

                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-sky-400" />
                        التاريخ والوقت: <strong className="text-slate-300">{formattedTime}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {n.link && (
                      <button
                        onClick={() => {
                          if (isUnread) markSingleAsRead(nId);
                          router.push(n.link);
                        }}
                        className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-amber-300 font-bold transition flex items-center gap-1.5 text-xs cursor-pointer shadow-sm"
                      >
                        فتح السجل <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => markSingleAsRead(nId)}
                        className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                        title="تعليم كمقروء"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => deleteNotification(nId)}
                      className="p-2 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 rounded-xl text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      title="حذف الإشعار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </AuthGuard>
  );
}