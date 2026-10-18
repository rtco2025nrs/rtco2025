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
  Camera, 
  Image as ImageIcon,
  Clock,
  RotateCcw,
  MessageSquareShare,
  Globe,
  Lock,
  Edit3,
  Video,
  Play,
  FileText,
  Download,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Paperclip,
  Film,
  ExternalLink
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';
import { useBranch } from '@/context/BranchContext';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

function numberToArabicWords(num: number): string {
  if (isNaN(num) || num === 0) return '';
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
      if (rem >= 10 && rem <= 19) {
        out += teens[rem - 10];
      } else {
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

interface MediaItem {
  type: 'image' | 'video' | 'doc';
  url: string;
  title?: string;
}

function normalizeMediaItem(item: any): MediaItem {
  if (typeof item === 'string') {
    const isVid = item.match(/\.(mp4|webm|ogg|mov)($|\?)/i) || item.includes('youtube.com') || item.includes('youtu.be');
    const isDoc = item.match(/\.(pdf|doc|docx|dwg)($|\?)/i);
    return {
      type: isVid ? 'video' : isDoc ? 'doc' : 'image',
      url: item,
      title: isVid ? 'فيديو العقار' : isDoc ? 'مستند مرفق' : 'صورة العقار'
    };
  }
  return {
    type: item.type || (item.url?.match(/\.(mp4|webm|mov)/i) ? 'video' : 'image'),
    url: item.url || '',
    title: item.title || (item.type === 'video' ? 'فيديو العقار' : item.type === 'doc' ? 'مستند مرفق' : 'صورة العقار')
  };
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/').split('&')[0];
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  return null;
}

export default function RealEstatePage() {
  const router = useRouter();
  const { selectedBranchId, branches } = useBranch();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    tagline: 'للمقاولات العامة والاستثمارات العقارية والتجارة العامة والنقل العام',
    primary_color: '#d97706',
    secondary_color: '#ea580c',
    phone_primary: '07868006699',
    phone_secondary: '07738006699',
    address: 'العراق - النجف الأشرف - حي الفرات',
    logo_url: '',
    letterhead_url: '',
    website: ''
  });

  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [selectedUnitForPrint, setSelectedUnitForPrint] = useState<any | null>(null);
  const [receiptVoucherForPrint, setReceiptVoucherForPrint] = useState<any | null>(null);

  // حالة معرض الصور والفيديوهات (Lightbox Gallery)
  const [activeGalleryUnit, setActiveGalleryUnit] = useState<any | null>(null);
  const [galleryActiveIndex, setGalleryActiveIndex] = useState(0);
  const [galleryFilter, setGalleryFilter] = useState<'ALL' | 'image' | 'video' | 'doc'>('ALL');

  // نافذة إضافة / تعديل بيانات العقار
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitCode, setUnitCode] = useState('');
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('شقة سكنية فاخرة');
  const [areaSqm, setAreaSqm] = useState('180');
  const [price, setPrice] = useState('120000000');
  const [city, setCity] = useState('النجف الأشرف');
  const [location, setLocation] = useState('حي الفرات');
  const [notes, setNotes] = useState('');
  const [mediaItemsList, setMediaItemsList] = useState<MediaItem[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video' | 'doc'>('image');

  // نافذة بيع / تعديل عقد البيع والأقساط
  const [sellingUnit, setSellingUnit] = useState<any | null>(null);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [saleType, setSaleType] = useState<'CASH' | 'INSTALLMENTS'>('INSTALLMENTS');
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'MERCHANT'>('INDIVIDUAL');
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

  const handleOpenEditUnit = (u: any) => {
    if (!canEdit) return alert('ليس لديك صلاحية لتعديل بيانات العقار');
    setEditingUnitId(u.unit_id);
    setUnitCode(u.unit_code || '');
    setTitle(u.title || '');
    setPropertyType(u.property_type || 'شقة سكنية فاخرة');
    setAreaSqm(String(u.area_sqm || '180'));
    setPrice(String(u.price || '120000000'));
    setCity(u.city || 'النجف الأشرف');
    setLocation(u.location || 'حي الفرات');
    setNotes(u.notes || '');

    const normalized = Array.isArray(u.images) ? u.images.map(normalizeMediaItem) : [];
    setMediaItemsList(normalized);
    setNewMediaUrl('');
    setNewMediaTitle('');
    setNewMediaType('image');
    setShowUnitModal(true);
  };

  const handleOpenEditContract = (u: any) => {
    if (!canEdit) return alert('ليس لديك صلاحية لتعديل عقود البيع والأقساط');
    setSellingUnit(u);
    setIsEditingContract(true);
    setSaleType(u.sale_type || 'INSTALLMENTS');
    setCustomerType(u.customer_type || 'INDIVIDUAL');
    setBuyerName(u.buyer_name || '');
    setBuyerPhone(u.buyer_phone || '');
    setDownPayment(String(u.totalPaid || Math.round(Number(u.price) * 0.25)));
    setInstallmentsCount(String(u.installments?.length || '12'));
    if (u.installments && u.installments.length > 0) {
      setFirstDueDate(String(u.installments[0].due_date || '').split('T')[0]);
    } else {
      setFirstDueDate(new Date().toISOString().substring(0, 10));
    }
  };

  const handleAddMediaItem = () => {
    if (!newMediaUrl.trim()) return alert('يرجى كتابة أو لصق رابط الصورة أو الفيديو أو المستند');
    const item: MediaItem = {
      type: newMediaType,
      url: newMediaUrl.trim(),
      title: newMediaTitle.trim() || (newMediaType === 'video' ? 'فيديو توضيحي' : newMediaType === 'doc' ? 'مخطط / مستند' : 'صورة العقار')
    };
    setMediaItemsList(prev => [...prev, item]);
    setNewMediaUrl('');
    setNewMediaTitle('');
  };

  const handleRemoveMediaItem = (idx: number) => {
    setMediaItemsList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalBranch = 'BR-RE-05';
      if (isRestrictedBranch && currentUser?.assigned_branch_id) {
        finalBranch = currentUser.assigned_branch_id;
      } else if (selectedBranchId && selectedBranchId !== 'ALL') {
        finalBranch = selectedBranchId;
      }

      const action = editingUnitId ? 'UPDATE_UNIT' : 'ADD_UNIT';

      const res = await fetch('/api/real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          unit_id: editingUnitId || undefined,
          branch_id: finalBranch,
          unit_code: unitCode,
          title,
          property_type: propertyType,
          area_sqm: areaSqm,
          price,
          city,
          location,
          notes,
          images: mediaItemsList
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowUnitModal(false);
        setEditingUnitId(null);
        await loadData(finalBranch);
      } else {
        alert(data.error || 'فشلت العملية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSaleContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingUnit) return;
    setLoading(true);
    try {
      const isCash = saleType === 'CASH';
      const res = await fetch('/api/real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEditingContract ? 'UPDATE_SALE' : 'SELL_UNIT',
          unit_id: sellingUnit.unit_id,
          sale_type: saleType,
          customer_type: customerType,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          down_payment: isCash ? sellingUnit.price : downPayment,
          installments_count: isCash ? 0 : installmentsCount,
          first_due_date: firstDueDate,
          total_price: sellingUnit.price
        })
      });

      if (res.ok) {
        alert(isEditingContract ? 'تم تعديل وتحديث عقد الأقساط بنجاح!' : 'تم تثبيت البيع وجدولة الأقساط بنجاح!');
        setSellingUnit(null);
        setIsEditingContract(false);
        await loadData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstallment = async (inst: any, unit: any) => {
    if (!canEdit && !canAdd) return alert('ليس لديك صلاحية تسجيل وقبض الأقساط');
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
        const remainingAfter = Math.max(0, (Number(unit.totalRemaining) || 0) - Number(inst.amount));
        setReceiptVoucherForPrint({
          voucherNo: data.voucher_number || `V-INST-${Date.now().toString().slice(-5)}`,
          customerName: unit.buyer_name,
          branchName: unit.branch_name || 'فرع الاستثمارات العقارية',
          amount: inst.amount,
          amountWords: numberToArabicWords(inst.amount),
          goodsDescription: `العقار: ${unit.title} (${unit.unit_code})`,
          installmentNumber: inst.installment_title,
          date: data.paid_at || new Date().toISOString().substring(0, 10),
          remainingAfterPayment: remainingAfter
        });

        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRollbackInstallment = async (inst: any, unit: any) => {
    if (!canEdit && !canDelete) return alert('ليس لديك صلاحية التراجع عن السداد');
    if (!confirm(`تأكيد الرجوع عن تسديد (${inst.installment_title})؟ سيتم إلغاء سند القبض المالي (${inst.voucher_number || '---'}) وتعديل الذمة تلقائياً.`)) return;

    try {
      const res = await fetch('/api/real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ROLLBACK_INSTALLMENT',
          installment_id: inst.installment_id,
          unit_id: unit.unit_id
        })
      });

      if (res.ok) {
        alert('تم التراجع عن السداد وإلغاء السند المالي بنجاح!');
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUnit = async (unit: any) => {
    if (!canDelete) return alert('ليس لديك صلاحية حذف العقار');
    if (!confirm(`تحذير: هل أنت متأكد من حذف العقار (${unit.title})؟ سيتم إلغاء كافة سندات القبض التابعة له تلقائياً.`)) return;
    try {
      const res = await fetch(`/api/real-estate?id=${unit.unit_id}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendWhatsApp = (unit: any) => {
    const phone = unit.buyer_phone;
    if (!phone) return alert('رقم هاتف المشتري غير مسجل!');

    const message = `عزيزنا العميل / ${unit.buyer_name} المحترم،\n\nتذكركم ${companySettings.company_name} بخصوص حسابكم المالي للعقار (${unit.title} - ${unit.unit_code}):\n\n💰 القيمة التعاقدية: ${formatNum(unit.price)} د.ع\n💵 الواصل المسدد: ${formatNum(unit.totalPaid)} د.ع\n🚨 المتبقي بذمتكم حالياً: ${formatNum(unit.totalRemaining)} د.ع\n\nشاكرين ومقدرين حسن تعاونكم معنا.`;
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/964${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
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

  const galleryMedia = useMemo(() => {
    if (!activeGalleryUnit || !Array.isArray(activeGalleryUnit.images)) return [];
    const normalized = activeGalleryUnit.images.map(normalizeMediaItem);
    if (galleryFilter === 'ALL') return normalized;
    return normalized.filter((m: MediaItem) => m.type === galleryFilter);
  }, [activeGalleryUnit, galleryFilter]);

  const primaryCol = companySettings.primary_color || '#d97706';
  const secondaryCol = companySettings.secondary_color || '#ea580c';
  const hasLogo = Boolean(companySettings.logo_url && companySettings.logo_url.trim().length > 10);
  const hasLetterhead = Boolean(companySettings.letterhead_url && companySettings.letterhead_url.trim().length > 10);

  if (!currentUser) return null;

  return (
    <AuthGuard moduleName="realestate" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-4 md:p-8 font-cairo text-[14px] print:bg-white print:p-0">
        
        {/* تنسيقات الطباعة */}
        <style jsx global>{`
          @media screen and (max-width: 768px) {
            .preview-scroll-container {
              width: 100% !important;
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch !important;
            }
            .print-paper-sheet,
            .print-voucher-sheet {
              min-width: 760px !important;
              margin: 0 auto !important;
            }
          }
          @media print {
            @page {
              size: A4 portrait !important;
              margin: 8mm auto !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body, html {
              background-color: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
            }
            header, nav, aside, .print-hidden-element, div[class*="backdrop-blur"], div[class*="fixed inset-0 bg-black/90"] > div:first-child {
              display: none !important;
              visibility: hidden !important;
            }
            .print-paper-sheet,
            .print-voucher-sheet {
              box-sizing: border-box !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              margin: 0 auto !important;
              width: 100% !important;
              max-width: 200mm !important;
              height: auto !important;
              overflow: visible !important;
              page-break-after: auto !important;
              break-after: auto !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: flex-start !important;
            }
          }
        `}</style>

        {/* 1. الترويسة الرئيسية */}
        <div className="max-w-7xl mx-auto pb-5 sm:pb-6 border-b border-slate-800/80 print:hidden print-hidden-element">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 bg-slate-900/60 border border-slate-800/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-md shadow-2xl">
            
            <div className="flex items-center gap-3 sm:gap-4">
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 p-2.5 sm:p-3 rounded-2xl text-slate-950 font-black shadow-xl shrink-0 flex items-center justify-center transition-all"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryCol}, ${secondaryCol})`,
                  boxShadow: `0 10px 25px -5px ${primaryCol}40`
                }}
              >
                <Building className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-lg md:text-2xl font-black text-white tracking-wide">
                    منظومة الاستثمار والتطوير العقاري والأقساط
                  </h1>
                  <span 
                    className="inline-flex items-center gap-1 border text-[10px] sm:text-[11px] font-bold px-2 sm:px-3 py-0.5 rounded-full shadow-inner font-mono whitespace-nowrap"
                    style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}30` }}
                  >
                    <Sparkles className="w-3 h-3" />
                    معرض وسائط 360° • عقود استثمار
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                  {companySettings.company_name} • إدارة المحفظة العقارية والبيع بالأقساط وجدولتها
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 self-end sm:self-auto">
              <button
                onClick={exportExcel}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>

              {canAdd && (
                <button
                  onClick={() => {
                    setEditingUnitId(null);
                    setUnitCode('');
                    setTitle('');
                    setMediaItemsList([]);
                    setNewMediaUrl('');
                    setNewMediaTitle('');
                    setShowUnitModal(true);
                  }}
                  className="px-3.5 py-2 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg cursor-pointer whitespace-nowrap active:scale-95"
                  style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                >
                  <PlusCircle className="w-3.5 h-3.5" /> إضافة عقار +
                </button>
              )}

              <Link 
                href="/" 
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-purple-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" /> الرئيسية
              </Link>
            </div>

          </div>
        </div>

        {/* 2. كروت المؤشرات الكلية */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-5 print:hidden print-hidden-element">
          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-center shadow-xl">
            <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block">إجمالي قيمة المحفظة</span>
            <div className="text-base sm:text-xl font-black font-mono mt-1.5" style={{ color: primaryCol }}>
              {formatNum(stats.totalPortfolioValue)} <span className="text-[10px] font-sans text-slate-500">د.ع</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">{stats.totalCount} عقار مسجل</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-center shadow-xl">
            <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block">المقبوض والمحصل</span>
            <div className="text-base sm:text-xl font-black font-mono text-emerald-400 mt-1.5">
              {formatNum(stats.totalCollected)} <span className="text-[10px] font-sans text-slate-500">د.ع</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">مرحّلة لسندات الصندوق</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-center shadow-xl">
            <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block">المتبقي قيد التحصيل</span>
            <div className="text-base sm:text-xl font-black font-mono text-rose-400 mt-1.5">
              {formatNum(stats.totalPending)} <span className="text-[10px] font-sans text-slate-500">د.ع</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">أقساط جارية بذمة المشترين</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-center shadow-xl">
            <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block">جاهزية العقارات</span>
            <div className="flex items-center gap-2 mt-1.5 font-mono">
              <span className="text-sm sm:text-lg font-bold text-sky-400">{stats.soldUnits} مباع</span>
              <span className="text-slate-600">/</span>
              <span className="text-sm sm:text-lg font-bold text-amber-400">{stats.availableUnits} متاح</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">نسبة الإشغال: {stats.totalCount > 0 ? Math.round((stats.soldUnits / stats.totalCount) * 100) : 0}%</p>
          </div>
        </div>

        {/* 3. شريط الأدوات والبحث والتصفية */}
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 print:hidden print-hidden-element">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input 
                type="text" 
                placeholder="ابحث بالاسم، الرمز، المشتري، أو الموقع..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="AVAILABLE">متاح للبيع والشراء</option>
              <option value="INSTALLMENT_SOLD">مباع (أقساط مجدولة)</option>
              <option value="CASH_SOLD">مباع بالكامل (نقداً)</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            إجمالي العقارات المعروضة: <strong className="text-white">{filteredUnits.length}</strong>
          </span>
        </div>

        {/* 4. كروت العقارات المعروضة - معالجة الترتيب بدقة على الموبايل والكمبيوتر بدون أي تداخل */}
        <div className="max-w-7xl mx-auto space-y-6 mt-5 print:hidden print-hidden-element">
          {filteredUnits.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-3xl text-slate-500 text-xs space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-slate-600" />
              <p>لا توجد عقارات مسجلة مطابقة للبحث.</p>
            </div>
          ) : (
            filteredUnits.map((u) => {
              const isSold = u.status === 'SOLD';
              const isAllPaid = isSold && Number(u.totalRemaining || 0) <= 0;
              const isExpanded = expandedUnitId === u.unit_id || (!isSold);
              const paidCount = (u.installments || []).filter((i: any) => i.is_paid).length;
              const totalInstCount = u.installments?.length || 0;
              const monthlyInst = totalInstCount > 0 ? (u.installments[0]?.amount || 0) : 0;
              
              const mediaList: MediaItem[] = Array.isArray(u.images) ? u.images.map(normalizeMediaItem) : [];
              const imagesOnly = mediaList.filter(m => m.type === 'image');
              const videosOnly = mediaList.filter(m => m.type === 'video');
              const docsOnly = mediaList.filter(m => m.type === 'doc');
              
              const coverMedia = mediaList.find(m => m.type === 'image') || mediaList[0];

              return (
                <div 
                  key={u.unit_id} 
                  className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0 transition hover:border-slate-700"
                >
                  
                  {/* الرأس التوضيحي للعقار قبل الصورة لضمان عدم تداخل النصوص إطلاقاً على الموبايل */}
                  <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg border shadow-xs"
                          style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}40` }}
                        >
                          {u.unit_code}
                        </span>

                        <h2 className="text-sm sm:text-lg font-black text-white truncate">
                          {u.title}
                        </h2>

                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                          {u.property_type}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-amber-300">
                          {u.area_sqm} م²
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                          !isSold 
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : isAllPaid 
                              ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' 
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {!isSold ? 'متاح للبيع' : isAllPaid ? 'مكتمل السداد ✓' : 'أقساط جارية'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{u.city} - {u.location}</span>
                        <span className="text-slate-600">•</span>
                        <span>{u.branch_name || 'فرع الاستثمارات العقارية'}</span>
                      </div>
                    </div>

                    {/* زر المعرض السريع */}
                    <div className="flex items-center gap-2 shrink-0">
                      {mediaList.length > 0 && (
                        <button
                          onClick={() => { setActiveGalleryUnit(u); setGalleryActiveIndex(0); setGalleryFilter('ALL'); }}
                          className="w-full sm:w-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                        >
                          <Camera className="w-4 h-4 text-amber-400" />
                          <span>معرض الوسائط ({mediaList.length})</span>
                          {videosOnly.length > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-md font-mono flex items-center gap-0.5">
                              <Play className="w-2.5 h-2.5 fill-current" /> {videosOnly.length}
                            </span>
                          )}
                          {docsOnly.length > 0 && (
                            <span className="bg-sky-500 text-white text-[10px] px-1.5 py-0.2 rounded-md font-mono flex items-center gap-0.5">
                              <FileText className="w-2.5 h-2.5" /> {docsOnly.length}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* قسم الصورة الكبيرة للواجهة (Hero Showcase) بدون نصوص متراكمة فوقها */}
                  <div className="relative w-full h-56 sm:h-72 md:h-80 bg-slate-950 overflow-hidden group">
                    {coverMedia && coverMedia.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={coverMedia.url} 
                        alt={u.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700 cursor-pointer"
                        onClick={() => { setActiveGalleryUnit(u); setGalleryActiveIndex(0); setGalleryFilter('ALL'); }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-600 space-y-2">
                        <Building2 className="w-16 h-16 text-slate-700" />
                        <span className="text-xs font-semibold text-slate-500">لا توجد صورة رئيسية محددة</span>
                      </div>
                    )}
                  </div>

                  {/* شريط مصغرات الصور المرفقة السريع أسفل الغلاف */}
                  {mediaList.length > 1 && (
                    <div className="px-4 sm:px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2.5 overflow-x-auto">
                      <span className="text-[11px] font-bold text-slate-400 shrink-0">معاينة سريعة:</span>
                      {mediaList.slice(0, 8).map((m, mIdx) => (
                        <div
                          key={mIdx}
                          onClick={() => { setActiveGalleryUnit(u); setGalleryActiveIndex(mIdx); setGalleryFilter('ALL'); }}
                          className="relative w-14 h-10 rounded-xl overflow-hidden border border-slate-800 hover:border-amber-400 shrink-0 cursor-pointer transition hover:scale-105 bg-slate-900 flex items-center justify-center group"
                          title={m.title || `عنصر ${mIdx + 1}`}
                        >
                          {m.type === 'image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.url} alt="" className="w-full h-full object-cover" />
                          ) : m.type === 'video' ? (
                            <div className="w-full h-full bg-slate-950 flex items-center justify-center text-rose-400">
                              <Play className="w-4 h-4 fill-current" />
                            </div>
                          ) : (
                            <div className="w-full h-full bg-slate-950 flex items-center justify-center text-sky-400">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ))}
                      {mediaList.length > 8 && (
                        <button
                          onClick={() => { setActiveGalleryUnit(u); setGalleryActiveIndex(8); setGalleryFilter('ALL'); }}
                          className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-amber-400 hover:text-white shrink-0"
                        >
                          +{mediaList.length - 8} المزيد
                        </button>
                      )}
                    </div>
                  )}

                  {/* تفاصيل العقار والبيانات المالية والأقساط */}
                  <div className="p-4 sm:p-6 space-y-4">
                    
                    {/* معلومات المشتري والإجراءات */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-sm sm:text-base font-black text-white">
                            {isSold ? `المشتري: ${u.buyer_name || 'عميل غير مسجل'}` : 'العقار متاح للبيع والاستثمار الفوري'}
                          </h3>

                          {isSold && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${
                              u.customer_type === 'MERCHANT' 
                                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' 
                                : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                            }`}>
                              {u.customer_type === 'MERCHANT' ? 'تاجر / استثمار' : 'مواطن / أفراد'}
                            </span>
                          )}
                        </div>

                        {isSold && u.buyer_phone && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
                            <span>هاتف المشتري: <strong className="font-mono text-slate-200">{u.buyer_phone}</strong></span>
                            <span className="text-slate-500">•</span>
                            <span>طريقة البيع: <strong className="text-amber-400">{u.sale_type === 'CASH' ? 'نقداً كامل' : 'أقساط شهرية مجدولة'}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* أزرار الإجراءات السريعة */}
                      <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
                        {isSold ? (
                          <>
                            <button
                              onClick={() => handleSendWhatsApp(u)}
                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-emerald-500/30 cursor-pointer shadow-sm whitespace-nowrap"
                              title="إرسال تفاصيل الحساب الكاملة للمشتري بالواتساب"
                            >
                              <MessageSquareShare className="w-3.5 h-3.5" /> تنبيه بالواتساب
                            </button>

                            <button
                              onClick={() => setExpandedUnitId(expandedUnitId === u.unit_id ? null : u.unit_id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-slate-700 cursor-pointer whitespace-nowrap"
                            >
                              <span>{expandedUnitId === u.unit_id ? 'طي الأقساط' : 'جدول الأقساط'}</span>
                              {expandedUnitId === u.unit_id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        ) : (
                          canAdd && (
                            <button
                              onClick={() => {
                                setSellingUnit(u);
                                setIsEditingContract(false);
                                setSaleType('INSTALLMENTS');
                                setDownPayment(String(Math.round(Number(u.price) * 0.25)));
                              }}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow cursor-pointer whitespace-nowrap active:scale-95"
                            >
                              <BadgeDollarSign className="w-4 h-4" /> بيع العقار الآن
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* شريط الأرقام المالية الثلاثي */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs font-mono">
                      <div className="text-right">
                        <span className="text-slate-500 font-sans block text-[11px]">مجموع القيمة التعاقدية</span>
                        <strong className="text-sm sm:text-base font-black" style={{ color: primaryCol }}>{formatNum(u.price)} د.ع</strong>
                      </div>
                      <div className="text-right border-y sm:border-y-0 sm:border-x border-slate-800 py-1.5 sm:py-0 sm:px-3">
                        <span className="text-slate-500 font-sans block text-[11px]">المسدد الكلي</span>
                        <strong className="text-sky-400 text-sm sm:text-base font-black">{formatNum(u.totalPaid)} د.ع</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 font-sans block text-[11px]">المتبقي بذمته</span>
                        <strong className="text-rose-400 text-sm sm:text-base font-black">{formatNum(u.totalRemaining)} د.ع</strong>
                      </div>
                    </div>

                    {/* تفاصيل العقار والأقساط عند التوسيع */}
                    {isExpanded && (
                      <div className="space-y-4 pt-1">
                        <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 space-y-3">
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span 
                                className="font-mono text-xs font-black px-2 py-0.5 rounded border"
                                style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}30` }}
                              >
                                {u.unit_code}
                              </span>
                              
                              <h4 className="font-bold text-white text-xs">
                                العقار: <span style={{ color: primaryCol }}>{u.title}</span>
                              </h4>

                              {isSold && totalInstCount > 0 && (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  (القسط: {formatNum(monthlyInst)} د.ع | المسدد: {paidCount}/{totalInstCount})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {isSold && (
                                <button
                                  onClick={() => setSelectedUnitForPrint(u)}
                                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-slate-700 cursor-pointer whitespace-nowrap"
                                  style={{ color: primaryCol }}
                                >
                                  <Printer className="w-3.5 h-3.5" /> طباعة العقد A4
                                </button>
                              )}

                              {canEdit && (
                                <button
                                  onClick={() => isSold ? handleOpenEditContract(u) : handleOpenEditUnit(u)}
                                  className="p-1 bg-slate-800 hover:bg-sky-600 text-sky-400 hover:text-white rounded-lg transition cursor-pointer"
                                  title={isSold ? "تعديل عقد البيع والأقساط" : "تعديل بيانات العقار"}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {canEdit && isSold && (
                                <button
                                  onClick={() => handleOpenEditUnit(u)}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                                  title="تعديل مواصفات العقار ومعرض وسائطه"
                                >
                                  تعديل العقار والوسائط
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteUnit(u)}
                                  className="p-1 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition cursor-pointer"
                                  title="حذف هذا العقار وإلغاء سنداته"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* شبكة كروت الأقساط */}
                          {isSold && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
                              {(!u.installments || u.installments.length === 0) ? (
                                <div className="col-span-full p-4 text-center text-slate-500 font-sans text-xs">
                                  تم سداد كامل قيمة الوحدة نقداً ومباشرة بدون أقساط مجدولة.
                                </div>
                              ) : (
                                u.installments.map((inst: any, idx: number) => {
                                  const isPaid = inst.is_paid;
                                  return (
                                    <div 
                                      key={inst.installment_id || idx} 
                                      className={`p-3 rounded-2xl border transition text-xs space-y-2 flex flex-col justify-between ${
                                        isPaid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-300'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex justify-between items-center text-[11px]">
                                          <span className="font-bold">قسط #{idx + 1}</span>
                                          <span className="font-mono text-[10px] text-slate-400">{String(inst.due_date || '').split('T')[0]}</span>
                                        </div>
                                        
                                        <div className="text-sm font-black font-mono mt-1 text-white">
                                          {formatNum(inst.amount)} د.ع
                                        </div>

                                        {isPaid && (
                                          <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                                            سدد بتاريخ: {inst.paid_at ? String(inst.paid_at).split('T')[0] : '—'}
                                          </div>
                                        )}
                                      </div>

                                      <div className="pt-2 border-t border-slate-800/80">
                                        {isPaid ? (
                                          <div className="flex items-center justify-between w-full">
                                            <button
                                              onClick={() => handleRollbackInstallment(inst, u)}
                                              className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded border border-rose-500/30 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                              title="إلغاء تسديد هذا القسط وإلغاء سنده المالي"
                                            >
                                              <RotateCcw className="w-2.5 h-2.5" /> تراجع
                                            </button>

                                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                              <CheckCircle2 className="w-3 h-3" /> تم السداد
                                            </span>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => handlePayInstallment(inst, u)}
                                            className="w-full py-1.5 text-slate-950 font-black rounded-xl text-[11px] transition shadow cursor-pointer whitespace-nowrap active:scale-95"
                                            style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                                          >
                                            تسديد وطباعة الوصل
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 5. معرض الوسائط الكامل (Lightbox Media Gallery Modal) المتجاوب بدقة مع الموبايل */}
        {activeGalleryUnit && (
          <div className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between p-3 sm:p-6 print:hidden animate-in fade-in">
            
            {/* الشريط العلوي للمعرض */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2.5">
              
              <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-base font-black text-white truncate">
                      {activeGalleryUnit.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-mono truncate">
                      الرمز: {activeGalleryUnit.unit_code} • {activeGalleryUnit.city} - {activeGalleryUnit.location}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveGalleryUnit(null)} 
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700 cursor-pointer shrink-0"
                  title="إغلاق المعرض"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl overflow-x-auto w-full sm:w-auto justify-start sm:justify-end">
                <button
                  onClick={() => { setGalleryFilter('ALL'); setGalleryActiveIndex(0); }}
                  className={`px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition whitespace-nowrap shrink-0 ${galleryFilter === 'ALL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  الكل ({Array.isArray(activeGalleryUnit.images) ? activeGalleryUnit.images.length : 0})
                </button>
                <button
                  onClick={() => { setGalleryFilter('image'); setGalleryActiveIndex(0); }}
                  className={`px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1 whitespace-nowrap shrink-0 ${galleryFilter === 'image' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  <ImageIcon className="w-3.5 h-3.5" /> صور
                </button>
                <button
                  onClick={() => { setGalleryFilter('video'); setGalleryActiveIndex(0); }}
                  className={`px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1 whitespace-nowrap shrink-0 ${galleryFilter === 'video' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  <Video className="w-3.5 h-3.5" /> فيديو
                </button>
                <button
                  onClick={() => { setGalleryFilter('doc'); setGalleryActiveIndex(0); }}
                  className={`px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1 whitespace-nowrap shrink-0 ${galleryFilter === 'doc' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  <FileText className="w-3.5 h-3.5" /> مخططات ومستندات
                </button>
              </div>

            </div>

            {/* منطقة العرض الرئيسية للوسائط */}
            <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden my-auto">
              {galleryMedia.length === 0 ? (
                <div className="text-center text-slate-500 space-y-2">
                  <AlertCircle className="w-12 h-12 mx-auto text-slate-600" />
                  <p>لا توجد وسائط مضافة مطابقة للفلتر المحدد.</p>
                </div>
              ) : (() => {
                const current = galleryMedia[galleryActiveIndex] || galleryMedia[0];
                const embedUrl = current.type === 'video' ? getEmbedUrl(current.url) : null;

                return (
                  <div className="relative max-w-5xl max-h-[70vh] w-full h-full flex flex-col items-center justify-center">
                    
                    {current.type === 'image' && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={current.url} 
                        alt={current.title || 'صورة العقار'} 
                        className="max-h-[68vh] max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl border border-slate-800"
                      />
                    )}

                    {current.type === 'video' && (
                      <div className="w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
                        {embedUrl ? (
                          <iframe 
                            src={embedUrl} 
                            title={current.title || 'فيديو العقار'} 
                            className="w-full h-full" 
                            allowFullScreen 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        ) : (
                          <video 
                            src={current.url} 
                            controls 
                            autoPlay 
                            className="w-full h-full object-contain"
                          >
                            متصفحك لا يدعم تشغيل هذا الفيديو مباشرة.
                          </video>
                        )}
                      </div>
                    )}

                    {current.type === 'doc' && (
                      <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-lg w-full text-center space-y-4 shadow-2xl">
                        <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-2xl flex items-center justify-center mx-auto">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white">{current.title || 'مستند أو مخطط هندسي'}</h4>
                          <p className="text-xs text-slate-400 font-mono mt-1 truncate">{current.url}</p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <a 
                            href={current.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition"
                          >
                            <ExternalLink className="w-4 h-4" /> فتح المستند بالحجم الكامل
                          </a>
                        </div>
                      </div>
                    )}

                    {galleryMedia.length > 1 && (
                      <>
                        <button
                          onClick={() => setGalleryActiveIndex(prev => (prev === 0 ? galleryMedia.length - 1 : prev - 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black text-white rounded-full transition cursor-pointer backdrop-blur-md shadow-lg"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => setGalleryActiveIndex(prev => (prev === galleryMedia.length - 1 ? 0 : prev + 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black text-white rounded-full transition cursor-pointer backdrop-blur-md shadow-lg"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                      </>
                    )}

                    {current.title && (
                      <div className="mt-3 px-4 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-200">
                        {current.title} ({galleryActiveIndex + 1} من {galleryMedia.length})
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* المصغرات */}
            {galleryMedia.length > 1 && (
              <div className="border-t border-slate-800 pt-3 flex items-center justify-center gap-2 overflow-x-auto max-w-5xl mx-auto w-full">
                {galleryMedia.map((m: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setGalleryActiveIndex(idx)}
                    className={`relative w-16 h-12 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                      galleryActiveIndex === idx ? 'border-amber-400 scale-105 shadow-lg shadow-amber-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {m.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    ) : m.type === 'video' ? (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-rose-400">
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-sky-400">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

          </div>
        )}

        {/* 6. نافذة إضافة أو تعديل بيانات العقار */}
        {showUnitModal && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 shadow-2xl text-right flex flex-col max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5" style={{ color: primaryCol }} /> 
                  <span>{editingUnitId ? 'تعديل بيانات العقار والوسائط' : 'تسجيل أصل أو وحدة استثمارية جديدة'}</span>
                </h3>
                <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUnit} className="space-y-4 text-xs flex-1">
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

                {/* قسم إضافة وإدارة معرض الوسائط */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    معرض الصور والفيديوهات والمرفقات الهندسية ({mediaItemsList.length}):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] text-slate-400 mb-1">النوع</label>
                      <select
                        value={newMediaType}
                        onChange={(e: any) => setNewMediaType(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none"
                      >
                        <option value="image">صورة</option>
                        <option value="video">فيديو (MP4 / YouTube)</option>
                        <option value="doc">مستند / مخطط (PDF)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-[11px] text-slate-400 mb-1">رابط الملف / الرابط المباشر *</label>
                      <input
                        type="text"
                        placeholder="https://...jpg أو فيديو أو مستند"
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-[11px] outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] text-slate-400 mb-1">الوصف / العنوان</label>
                      <input
                        type="text"
                        placeholder="مثال: الواجهة، المخطط"
                        value={newMediaTitle}
                        onChange={(e) => setNewMediaTitle(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-[11px] outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddMediaItem}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center cursor-pointer transition shadow"
                        title="إضافة إلى المعرض"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {mediaItemsList.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 max-h-48 overflow-y-auto">
                      {mediaItemsList.map((m, idx) => (
                        <div key={idx} className="relative bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center group">
                          <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center mb-1">
                            {m.type === 'image' ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.url} alt="" className="w-full h-full object-cover" />
                            ) : m.type === 'video' ? (
                              <Video className="w-6 h-6 text-rose-400" />
                            ) : (
                              <FileText className="w-6 h-6 text-sky-400" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-300 truncate w-full text-center font-semibold">
                            {m.title || (m.type === 'video' ? 'فيديو' : m.type === 'doc' ? 'مستند' : 'صورة')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMediaItem(idx)}
                            className="absolute top-1 left-1 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-full shadow cursor-pointer transition"
                            title="حذف هذا العنصر"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <button type="button" onClick={() => setShowUnitModal(false)} className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">إلغاء</button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="px-6 py-2.5 text-slate-950 font-black rounded-xl cursor-pointer shadow-md whitespace-nowrap active:scale-95"
                    style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                  >
                    {loading ? 'جاري الحفظ...' : editingUnitId ? 'حفظ التعديلات' : 'حفظ وتسجيل الأصل'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 7. نافذة بيع أو تعديل عقد الأقساط */}
        {sellingUnit && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl text-right flex flex-col max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2 truncate">
                  <BadgeDollarSign className="w-5 h-5 text-emerald-400 shrink-0" /> 
                  <span>{isEditingContract ? 'تعديل عقد البيع والأقساط:' : 'تسجيل بيع عقار:'} <strong className="text-amber-400">{sellingUnit.title}</strong></span>
                </h3>
                <button onClick={() => setSellingUnit(null)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSaleContract} className="space-y-4 text-xs flex-1">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                    customerType === 'INDIVIDUAL' ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <input type="radio" name="custType" checked={customerType === 'INDIVIDUAL'} onChange={() => setCustomerType('INDIVIDUAL')} className="accent-emerald-500" />
                    <span>مواطن / أفراد</span>
                  </label>
                  <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                    customerType === 'MERCHANT' ? 'bg-purple-500/15 border-purple-500/50 text-purple-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <input type="radio" name="custType" checked={customerType === 'MERCHANT'} onChange={() => setCustomerType('MERCHANT')} className="accent-purple-500" />
                    <span>تاجر / استثمار عقاري</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">اسم المشتري / العميل *</label>
                    <input
                      type="text"
                      required
                      placeholder="الاسم الكامل"
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

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 mt-auto">
                  <button type="button" onClick={() => setSellingUnit(null)} className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl cursor-pointer">إلغاء</button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    {loading ? 'جاري الحفظ...' : isEditingContract ? 'حفظ تعديلات العقد' : 'اعتماد البيع وتوليد السند'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 8. سند قبض القسط العقاري A4 الفوري المنفصل */}
        {receiptVoucherForPrint && (
          <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible print:block print:w-full">
            <div className="sticky top-0 z-50 w-full max-w-[210mm] flex items-center justify-between bg-slate-900 border border-slate-700 p-3 sm:px-5 sm:py-3 rounded-2xl mb-4 print:hidden print-hidden-element shadow-xl">
              <button
                onClick={() => window.print()}
                className="text-slate-950 font-black px-6 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg whitespace-nowrap"
                style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
              >
                <Printer className="w-4 h-4" /> طباعة سند قبض القسط (A4)
              </button>
              <button onClick={() => setReceiptVoucherForPrint(null)} className="text-slate-400 hover:text-white p-2 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="preview-scroll-container pb-6 print:pb-0 print:overflow-visible print:w-full print:max-w-none">
              <div 
                className="print-voucher-sheet w-full bg-white text-slate-950 rounded-3xl p-6 sm:p-8 md:p-12 border-2 shadow-2xl print:border-none print:shadow-none print:p-0 space-y-4 font-sans flex flex-col justify-between min-h-[900px] print:min-h-0 print:max-h-none"
                style={{ borderColor: primaryCol }}
              >
                <div className="space-y-4 flex-1">
                  {hasLetterhead ? (
                    <div className="w-full border-b pb-3 mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={companySettings.letterhead_url} alt="ترويسة الشركة" className="w-full max-h-28 object-contain" />
                      <div className="text-left font-mono text-xs mt-1">
                        <span className="font-bold text-slate-900 font-sans">الفرع المعتمد: </span>
                        <strong className="text-amber-800 font-sans">{receiptVoucherForPrint.branchName}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center border-b-2 pb-4" style={{ borderColor: primaryCol }}>
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 relative flex items-center justify-center p-1 bg-slate-50 rounded-2xl border border-slate-200">
                          {hasLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={companySettings.logo_url} alt={companySettings.company_name} className="w-full h-full object-contain" />
                          ) : (
                            <Image src="/logo.png" alt="شركة البرج المتألق" width={52} height={52} className="object-contain" priority />
                          )}
                        </div>
                        <div>
                          <h1 className="text-xl font-black" style={{ color: primaryCol }}>{companySettings.company_name}</h1>
                          <p className="text-xs text-slate-600 font-bold">{companySettings.tagline}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{companySettings.address} | {companySettings.phone_primary}</p>
                        </div>
                      </div>
                      <div className="text-left font-mono text-xs">
                        <div 
                          className="border-2 px-3 py-1 font-black text-slate-950 rounded-lg inline-block"
                          style={{ backgroundColor: `${primaryCol}20`, borderColor: primaryCol }}
                        >
                          سند قبض قسط عقاري
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 mt-1 font-mono">رقم الوصل: <span style={{ color: primaryCol }}>{receiptVoucherForPrint.voucherNo}</span></p>
                        <p className="text-[10px] text-slate-500">التاريخ: {receiptVoucherForPrint.date}</p>
                        <p className="text-[11px] font-black text-amber-900 mt-0.5 font-sans">الفرع: {receiptVoucherForPrint.branchName}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 text-xs">
                    <p>استلمنا من السيد/ة: <strong className="text-slate-950 text-sm">{receiptVoucherForPrint.customerName}</strong></p>
                    <p>مبلغاً وقدره: <strong className="font-mono text-base font-black" style={{ color: primaryCol }}>{formatNum(receiptVoucherForPrint.amount)} د.ع</strong></p>
                    <p className="font-bold text-slate-700">{receiptVoucherForPrint.amountWords}</p>
                    <p className="pt-2 border-t border-slate-200">
                      وذلك عن: <strong>سداد {receiptVoucherForPrint.installmentNumber} عن {receiptVoucherForPrint.goodsDescription}.</strong>
                    </p>
                    <p className="text-[11px] font-mono text-slate-600">
                      المتبقي بذمة المشتري بعد هذا السداد: <strong className="text-rose-700">{formatNum(receiptVoucherForPrint.remainingAfterPayment)} د.ع</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs border-t border-slate-200">
                    <div>
                      <p className="font-bold text-slate-700">المستلم / المحاسب</p>
                      <div className="border-b border-dashed border-slate-400 w-28 sm:w-32 mx-auto mt-6"></div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">المسدد / المشتري</p>
                      <div className="border-b border-dashed border-slate-400 w-28 sm:w-32 mx-auto mt-6"></div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">ختم فرع الاستثمار العقاري</p>
                      <div className="border-b border-dashed border-slate-400 w-28 sm:w-32 mx-auto mt-6"></div>
                    </div>
                  </div>

                  <div className="border-t border-slate-300 pt-2 text-center text-[10px] text-slate-500 font-mono mt-4">
                    {companySettings.company_name} - {receiptVoucherForPrint.branchName} • هاتف: {companySettings.phone_primary}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. وثيقة جدول الأقساط والعقد العقاري الرسمي (A4) */}
        {selectedUnitForPrint && (() => {
          const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : (companySettings.website || 'https://rtco2025.netlify.app');
          const verificationUrl = `${origin}/verify?type=real_estate&no=${encodeURIComponent(selectedUnitForPrint.unit_code)}`;
          const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verificationUrl)}`;

          return (
            <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-2 sm:p-4 md:p-8 print:p-0 print:bg-white print:static">
              <div className="w-full max-w-[210mm] flex items-center justify-between bg-slate-900 border border-slate-700 p-3 sm:px-5 sm:py-3 rounded-2xl mb-4 print:hidden print-hidden-element shadow-xl">
                <button
                  onClick={() => window.print()}
                  className="text-slate-950 font-black px-6 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg whitespace-nowrap"
                  style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                >
                  <Printer className="w-4 h-4" /> طباعة جدول الأقساط والعقد العقاري (A4)
                </button>
                <button onClick={() => setSelectedUnitForPrint(null)} className="text-slate-400 hover:text-white p-2 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="preview-scroll-container pb-6 print:pb-0 print:overflow-visible print:w-full print:max-w-none">
                <div 
                  className="print-paper-sheet w-full bg-white text-slate-950 rounded-3xl p-6 sm:p-8 border-2 shadow-2xl print:border-none print:shadow-none print:p-0 space-y-3 font-sans flex flex-col justify-between min-h-[900px] print:min-h-0 print:max-h-none"
                  style={{ borderColor: primaryCol }}
                >
                  <div className="space-y-3 flex-1">
                    {hasLetterhead ? (
                      <div className="w-full border-b pb-2 mb-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={companySettings.letterhead_url} alt="ترويسة الشركة" className="w-full max-h-24 print:max-h-20 object-contain" />
                      </div>
                    ) : (
                      <div className="flex justify-between items-center border-b-2 pb-2.5" style={{ borderColor: primaryCol }}>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 relative flex items-center justify-center p-1 bg-slate-50 rounded-2xl border border-slate-200">
                            {hasLogo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={companySettings.logo_url} alt={companySettings.company_name} className="w-full h-full object-contain" />
                            ) : (
                              <Image src="/logo.png" alt="شركة البرج المتألق" width={52} height={52} className="object-contain" priority />
                            )}
                          </div>
                          <div>
                            <span 
                              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border inline-block mb-0.5"
                              style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}30` }}
                            >
                              قسم الاستثمار والتطوير العقاري • جدول السداد
                            </span>
                            <h1 className="text-lg font-black" style={{ color: primaryCol }}>{companySettings.company_name}</h1>
                            <p className="text-[10px] text-slate-600 font-bold">{companySettings.tagline}</p>
                          </div>
                        </div>
                        <div className="text-left font-mono text-xs">
                          <div 
                            className="border-2 px-3 py-1 font-black rounded-lg inline-block text-white text-[11px]"
                            style={{ backgroundColor: primaryCol, borderColor: primaryCol }}
                          >
                            عقد عقار: {selectedUnitForPrint.unit_code}
                          </div>
                          <p className="text-[10px] text-slate-600 mt-1">التاريخ: {new Date().toISOString().substring(0, 10)}</p>
                        </div>
                      </div>
                    )}

                    {/* شريط توثيق العقد والفرع */}
                    <div className="flex items-center justify-between bg-slate-100/90 border border-slate-300 rounded-xl px-4 py-1.5 font-cairo shadow-xs text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-1.5" dir="rtl">
                        <span className="text-slate-500 font-medium text-[11px]">العدد :</span>
                        <span className="font-mono text-slate-950 text-xs tracking-wide">
                          ع/ {selectedUnitForPrint.unit_code} / 2026
                        </span>
                      </div>

                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-lg bg-white border border-slate-300 text-slate-950 font-black text-xs shadow-xs">
                          {selectedUnitForPrint.branch_name || 'فرع الاستثمارات العقارية (النجف الأشرف)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5" dir="rtl">
                        <span className="text-slate-500 font-medium text-[11px]">التاريخ :</span>
                        <span className="font-mono text-slate-950 text-xs tracking-wider">{new Date().toISOString().substring(0, 10)}</span>
                      </div>
                    </div>

                    {/* بيانات المشتري والعقار */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                      <div className="space-y-0.5">
                        <strong className="block border-b border-slate-200 pb-0.5 text-[11px]" style={{ color: primaryCol }}>معلومات المشتري والتعاقد:</strong>
                        <p>اسم المشتري: <strong className="text-slate-950">{selectedUnitForPrint.buyer_name}</strong></p>
                        <p>رقم الهاتف: <span className="font-mono">{selectedUnitForPrint.buyer_phone || '---'}</span></p>
                        <p>العقار: <strong>{selectedUnitForPrint.title}</strong></p>
                        <p>الموقع: {selectedUnitForPrint.city} - {selectedUnitForPrint.location}</p>
                      </div>
                      <div className="space-y-0.5">
                        <strong className="block border-b border-slate-200 pb-0.5 text-[11px]" style={{ color: primaryCol }}>الملخص المالي للعقار:</strong>
                        <p>القيمة التعاقدية الكاملة: <strong className="font-mono" style={{ color: primaryCol }}>{formatNum(selectedUnitForPrint.price)} د.ع</strong></p>
                        <p>إجمالي المسدد الفعلي: <strong className="font-mono text-emerald-700">{formatNum(selectedUnitForPrint.totalPaid)} د.ع</strong></p>
                        <p>المتبقي بذمة المشتري: <strong className="font-mono text-rose-700">{formatNum(selectedUnitForPrint.totalRemaining)} د.ع</strong></p>
                        <p>المساحة: <strong className="font-mono">{selectedUnitForPrint.area_sqm} م²</strong> ({selectedUnitForPrint.property_type})</p>
                      </div>
                    </div>

                    {/* جدول الأقساط الشهرية الرسمية */}
                    <div>
                      <strong className="text-[11px] font-bold block mb-1" style={{ color: primaryCol }}>جدول استحقاق الدفعات والأقساط الشهرية:</strong>
                      <div className="border border-slate-300 rounded-xl overflow-hidden">
                        <table className="w-full text-right text-xs font-mono">
                          <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[10px]">
                            <tr>
                              <th className="p-1.5 text-center">ت</th>
                              <th className="p-1.5">عنوان الدفعة / القسط</th>
                              <th className="p-1.5">المبلغ المطلوب</th>
                              <th className="p-1.5">تاريخ الاستحقاق</th>
                              <th className="p-1.5 text-center">حالة السداد</th>
                              <th className="p-1.5 text-center">تاريخ السداد / رقم الوصل</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-[10px]">
                            {(selectedUnitForPrint.installments || []).map((inst: any, idx: number) => (
                              <tr key={inst.installment_id || idx}>
                                <td className="p-1 text-center font-bold">#{idx + 1}</td>
                                <td className="p-1 font-bold text-slate-900 font-sans">{inst.installment_title}</td>
                                <td className="p-1 font-black text-slate-900">{formatNum(inst.amount)} د.ع</td>
                                <td className="p-1 text-slate-600">{String(inst.due_date || '').split('T')[0]}</td>
                                <td className="p-1 text-center font-sans">
                                  {inst.is_paid ? (
                                    <span className="text-emerald-700 font-bold">تم السداد ✓</span>
                                  ) : (
                                    <span className="font-bold" style={{ color: primaryCol }}>مستحق</span>
                                  )}
                                </td>
                                <td className="p-1 text-center text-slate-500 text-[9px]">
                                  {inst.voucher_number ? `${inst.voucher_number} (${inst.paid_at ? String(inst.paid_at).split('T')[0] : ''})` : '---'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* منطقة التواقيع والباركود الذكي */}
                  <div className="space-y-2 pt-2 mt-auto">
                    <div className="grid grid-cols-4 gap-3 pt-2 text-center text-xs items-end border-t border-slate-200">
                      <div>
                        <p className="font-bold text-slate-950 text-xs">توقيع المشتري</p>
                        <div className="border-b-2 border-dashed border-slate-400 w-20 mx-auto mt-4"></div>
                      </div>

                      <div>
                        <p className="font-bold text-slate-950 text-xs">مدير الاستثمار العقاري</p>
                        <div className="border-b-2 border-dashed border-slate-400 w-20 mx-auto mt-4"></div>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <div className="w-13 h-13 border border-slate-300 rounded-xl p-0.5 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={qrCodeApiUrl} 
                            alt="باركود التحقق الإلكتروني وسجل الأقساط" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="font-mono text-[7px] font-bold mt-0.5 flex items-center gap-0.5" style={{ color: primaryCol }}>
                          <Globe className="w-2 h-2" /> امسح للتحقق أونلاين
                        </span>
                      </div>

                      <div>
                        <p className="font-bold text-slate-950 text-xs">المدير المفوض / الختم</p>
                        <div className="border-b-2 border-dashed border-slate-400 w-20 mx-auto mt-4"></div>
                      </div>
                    </div>

                    <div className="text-center text-[8.5px] text-slate-600 font-semibold border-t border-slate-200 pt-1 flex items-center justify-between font-mono">
                      <span>{companySettings.company_name} - {selectedUnitForPrint.branch_name || 'فرع الاستثمارات العقارية'}</span>
                      <span>هاتف الإدارة: {companySettings.phone_primary} {companySettings.phone_secondary && `| ${companySettings.phone_secondary}`}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </AuthGuard>
  );
}