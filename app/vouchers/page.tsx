'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Receipt, 
  ArrowLeft, 
  PlusCircle, 
  Printer, 
  X, 
  Ban, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  RotateCcw, 
  HardHat, 
  Link2, 
  Truck,
  Layers, 
  FileSpreadsheet, 
  PieChart, 
  Package, 
  User, 
  Coins, 
  Building, 
  Boxes, 
  Users, 
  Eye, 
  Info, 
  Calendar, 
  CreditCard, 
  Languages, 
  Lock,
  Home,
  Sparkles,
  Globe,
  MapPin,
  Phone
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';
import { useBranch } from '@/context/BranchContext';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

function numberToArabicWords(num: number, currency = 'IQD'): string {
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

  const words = parts.join(' و');
  const unit = currency === 'USD' ? 'دولار أمريكي' : 'دينار عراقي';
  return `فقط ${words} ${unit} لا غير`;
}

function numberToEnglishWords(num: number, currency = 'IQD'): string {
  if (isNaN(num) || num === 0) return '';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 === 0 ? '' : ' and ' + inWords(n % 100));
    if (n < 1000000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 === 0 ? '' : ' ' + inWords(n % 1000));
    if (n < 1000000000) return inWords(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 === 0 ? '' : ' ' + inWords(n % 1000000));
    return inWords(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 === 0 ? '' : ' ' + inWords(n % 1000000000));
  }

  const unit = currency === 'USD' ? 'US Dollars' : 'Iraqi Dinars';
  return `Only ${inWords(Math.floor(num))} ${unit}`;
}

function autoTransliterateArabicName(name: string): string {
  if (!name) return '';
  const namesDict: Record<string, string> = {
    'احمد': 'Ahmed', 'أحمد': 'Ahmed', 'ناجي': 'Naji', 'رسول': 'Rasool',
    'علي': 'Ali', 'محمد': 'Mohammed', 'حسن': 'Hassan', 'حسين': 'Hussein',
    'جاسم': 'Jasim', 'حيدر': 'Haider', 'عبد': 'Abd', 'الله': 'Allah',
    'عباس': 'Abbas', 'مصطفى': 'Mustafa', 'كرار': 'Karrar', 'سجاد': 'Sajjad',
    'كاظم': 'Kadhim', 'صادق': 'Sadiq', 'مهدي': 'Mahdi', 'رضا': 'Redha',
    'سمير': 'Samir', 'فاخر': 'Fakhir', 'نورس': 'Nawras', 'رقية': 'Rqyah',
    'الجبوري': 'Al-Jubouri', 'الطرفي': 'Al-Tarafy', 'خالد': 'Khaled', 'سيد': 'Sayed'
  };

  const words = name.trim().split(/\s+/);
  const translated = words.map(w => {
    if (namesDict[w]) return namesDict[w];
    const map: Record<string, string> = {
      'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th',
      'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
      'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'dh', 'ط': 't', 'ظ': 'z', 'ع': 'a',
      'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
      'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': ''
    };
    const chars = w.split('').map(c => map[c] !== undefined ? map[c] : c).join('');
    return chars.charAt(0).toUpperCase() + chars.slice(1);
  });

  return translated.join(' ');
}

function cleanPurposeText(text: string): { ar: string; en: string } {
  if (!text) return { ar: '', en: '' };
  
  let arClean = text
    .replace(/\[TRM-[^\]]+\]/gi, '')
    .replace(/\(alw\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  let en = arClean;
  const dictionary: [RegExp, string][] = [
    [/قبض دفعة تعاقدية/gi, 'Contractual payment receipt'],
    [/دفعة تعاقدية/gi, 'Contract payment'],
    [/دفعة لمقاول الباطن/gi, 'Subcontractor payment'],
    [/عن أعمال مقاول بناء/gi, 'for contractor building works'],
    [/لمشروع/gi, 'for project'],
    [/بناء بيت/gi, 'house construction'],
    [/بنسبة/gi, 'at the rate of'],
    [/الدفعة الاولى|الدفعة الأولى/gi, 'First payment'],
    [/الدفعة الثانية/gi, 'Second payment'],
    [/الدفعة الثالثة/gi, 'Third payment'],
    [/الدفعة الاخيرة|الدفعة الأخيرة/gi, 'Final payment'],
    [/دفعة ثانية/gi, 'Second installment'],
    [/دفعة اولى|دفعة أولى/gi, 'First installment'],
    [/دفعة مقدمة|دفعة مقدمه/gi, 'Advance payment'],
    [/دفعة مستحقة/gi, 'Due payment'],
    [/لبناء منزل|بناء منزل/gi, 'for house construction'],
    [/لبناء دار|بناء دار/gi, 'for residential building construction'],
    [/بناء مجمع|مجمع سكني/gi, 'residential compound construction'],
    [/صب سقف|صب الاساس|صب الأساس/gi, 'concrete pouring'],
    [/ادخال مواد/gi, 'Import of materials'],
    [/توريد مواد/gi, 'Materials supply'],
    [/شراء مواد/gi, 'Purchase of materials'],
    [/حديد تسليح/gi, 'reinforcing steel rebar'],
    [/سمنت مقاوم|اسمنت مقاوم/gi, 'sulfate resistant cement'],
    [/طابوق|طابوق جمهوري/gi, 'bricks'],
    [/اجور نقل|أجور نقل/gi, 'Transportation fees'],
    [/أجور عمالة|اجور عمل/gi, 'Labor fees'],
    [/من الامارات/gi, 'from the UAE'],
    [/ميناء البصرة/gi, 'Basra Port'],
    [/ميناء ام قصر/gi, 'Umm Qasr Port'],
    [/حجز عقار/gi, 'Real estate booking'],
    [/شراء عقار/gi, 'Real estate purchase'],
    [/دفعة عقد/gi, 'Contract payment'],
    [/سلفة تشغيلية/gi, 'Operational advance'],
    [/صيانة شاحنة/gi, 'Truck maintenance'],
    [/دفعة مستحقات/gi, 'Settlement payment'],
    [/سلفة/gi, 'Advance payment'],
    [/قسط/gi, 'Installment'],
    [/نقد|نقدا|نقداً/gi, 'Cash'],
    [/دفعة للمورد/gi, 'Payment to supplier'],
    [/عن توريد سمنت/gi, 'for cement supply'],
    [/لمشروع بناء بيت/gi, 'for house construction project'],
  ];

  for (const [pattern, replacement] of dictionary) {
    en = en.replace(pattern, replacement);
  }

  if (/[\u0600-\u06FF]/.test(en)) {
    en = autoTransliterateArabicName(en);
  }

  return { ar: arClean, en };
}

export default function VouchersPage() {
  const { selectedBranchId } = useBranch();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [companySettings, setCompanySettings] = useState<any>({
    company_name: 'شركة البرج المتألق',
    tagline: 'للمقاولات العامة والاستثمارات العقارية والتجارة العامة والنقل العام',
    phone_primary: '07868006699',
    phone_secondary: '07738006699',
    email: '',
    website: '',
    address: 'العراق - النجف الأشرف - حي الفرات',
    logo_url: '',
    letterhead_url: '',
    primary_color: '#d97706',
    secondary_color: '#ea580c'
  });

  const [branches, setBranches] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [branchId, setBranchId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [voucherType, setVoucherType] = useState<'RECEIPT' | 'PAYMENT'>('PAYMENT');
  const [sectorType, setSectorType] = useState<'PROJECTS' | 'FLEET' | 'INVENTORY' | 'REAL_ESTATE' | 'HR' | 'GENERAL'>('PROJECTS');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('IQD');
  const [partyNameAr, setPartyNameAr] = useState('');
  const [partyNameEn, setPartyNameEn] = useState('');
  const [notesAr, setNotesAr] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CHEQUE'>('CASH');
  const [chequeNo, setChequeNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [message, setMessage] = useState('');

  const [linkedSubId, setLinkedSubId] = useState<string | null>(null);
  const [linkedMatId, setLinkedMatId] = useState<string | null>(null);
  const [linkedExpId, setLinkedExpId] = useState<string | null>(null);

  const [filterSearch, setFilterSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterSector, setFilterSector] = useState<'ALL' | 'PROJECTS' | 'FLEET' | 'INVENTORY' | 'REAL_ESTATE' | 'HR'>('ALL');

  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [detailsModalVoucher, setDetailsModalVoucher] = useState<any | null>(null);
  const [cancelModalVoucher, setCancelModalVoucher] = useState<any | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [assignModalVoucher, setAssignModalVoucher] = useState<any | null>(null);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);

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
        ? `/api/vouchers?branch_id=${encodeURIComponent(activeBranch)}` 
        : '/api/vouchers';

      const resV = await fetch(url, { cache: 'no-store' });
      const dataV = await resV.json();
      if (dataV.vouchers) setVouchers(dataV.vouchers);

      const resB = await fetch('/api/branches', { cache: 'no-store' });
      const dataB = await resB.json();
      if (dataB.branches && dataB.branches.length > 0) {
        setBranches(dataB.branches);
        if (isRestrictedBranch && currentUser?.assigned_branch_id) {
          setBranchId(currentUser.assigned_branch_id);
        } else if (!branchId) {
          if (activeBranch && activeBranch !== 'ALL') {
            setBranchId(activeBranch);
          } else {
            setBranchId(dataB.branches[0].branch_id);
          }
        }
      }

      const resP = await fetch('/api/projects', { cache: 'no-store' });
      const dataP = await resP.json();
      if (dataP.projects) {
        setProjectsList(dataP.projects);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSettings();

    const raw = localStorage.getItem('erp_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setCurrentUser(u);
        if (u.assigned_branch_id && u.assigned_branch_id !== 'ALL' && !u.is_super_admin && u.role !== 'ADMIN') {
          setBranchId(u.assigned_branch_id);
        }
      } catch {}
    }

    const rawDraft = localStorage.getItem('quick_voucher_draft');
    if (rawDraft) {
      try {
        const parsed = JSON.parse(rawDraft);

        if (parsed.voucher_type === 'RECEIPT' || parsed.type === 'RECEIPT') {
          setVoucherType('RECEIPT');
        } else {
          setVoucherType('PAYMENT');
        }

        if (parsed.party) {
          setPartyNameAr(parsed.party);
          setPartyNameEn(autoTransliterateArabicName(parsed.party));
        }
        if (parsed.amount !== undefined && parsed.amount !== null && parsed.amount !== 0) {
          setAmount(String(parsed.amount));
        }
        if (parsed.project_id) {
          setProjectId(parsed.project_id);
          setSectorType('PROJECTS');
        }
        if (parsed.reason) {
          setNotesAr(parsed.reason);
          setNotesEn(cleanPurposeText(parsed.reason).en);
        }

        setLinkedSubId(parsed.subcontractor_id || null);
        setLinkedMatId(parsed.material_id || null);
        setLinkedExpId(parsed.expense_id || null);

        localStorage.removeItem('quick_voucher_draft');
      } catch (err) {
        console.error('Draft parsing error:', err);
      }
    }
  }, []);

  useEffect(() => {
    loadData(selectedBranchId);
    if (!isRestrictedBranch && selectedBranchId && selectedBranchId !== 'ALL') {
      setBranchId(selectedBranchId);
    }
  }, [selectedBranchId, isRestrictedBranch]);

  const canAdd = useMemo(() => {
    return hasPermission(currentUser, 'vouchers', 'add');
  }, [currentUser]);

  const canEdit = useMemo(() => {
    return hasPermission(currentUser, 'vouchers', 'edit');
  }, [currentUser]);

  const canDelete = useMemo(() => {
    return hasPermission(currentUser, 'vouchers', 'delete');
  }, [currentUser]);

  const handlePartyArChange = (val: string) => {
    setPartyNameAr(val);
    setPartyNameEn(autoTransliterateArabicName(val));
  };

  const handleNotesArChange = (val: string) => {
    setNotesAr(val);
    const cleaned = cleanPurposeText(val);
    setNotesEn(cleaned.en);
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      alert('ليس لديك صلاحية تسجيل واعتماد سندات جديدة');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setMessage('يرجى إدخال مبلغ صحيح');
      return;
    }

    setLoading(true);
    setMessage('');

    let targetBranch = branchId;
    if (isRestrictedBranch && currentUser?.assigned_branch_id) {
      targetBranch = currentUser.assigned_branch_id;
    } else if (!targetBranch || targetBranch === 'ALL') {
      targetBranch = branches[0]?.branch_id || 'BR-HQ-01';
    }

    const fullNotes = JSON.stringify({
      partyAr: partyNameAr.trim(),
      partyEn: partyNameEn.trim() || autoTransliterateArabicName(partyNameAr.trim()),
      forReasonAr: notesAr.trim(),
      forReasonEn: notesEn.trim() || cleanPurposeText(notesAr.trim()).en,
      method: paymentMethod,
      chequeNo: chequeNo,
      bank: bankName,
      sector: sectorType,
      subcontractor_id: linkedSubId || undefined,
      material_id: linkedMatId || undefined,
      expense_id: linkedExpId || undefined
    });

    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: targetBranch,
          project_id: (sectorType === 'PROJECTS' && projectId) ? projectId : null,
          voucher_type: voucherType,
          amount,
          currency,
          notes: fullNotes,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        setMessage(`تم اعتماد السند بنجاح برقم: ${resData.voucher_number}`);
        setAmount('');
        setPartyNameAr('');
        setPartyNameEn('');
        setNotesAr('');
        setNotesEn('');
        setChequeNo('');
        setBankName('');
        setLinkedSubId(null);
        setLinkedMatId(null);
        setLinkedExpId(null);
        await loadData(targetBranch);
      } else {
        setMessage(`خطأ: ${resData.error}`);
      }
    } catch (error: any) {
      setMessage(`خطأ: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProject = async () => {
    if (!canEdit) {
      alert('ليس لديك صلاحية ربط أو تعديل السندات');
      return;
    }
    if (!assignModalVoucher) return;
    setSavingAssign(true);
    try {
      const res = await fetch('/api/vouchers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher_id: assignModalVoucher.voucher_id,
          assign_project_id: targetProjectId || null,
        }),
      });
      if (res.ok) {
        setAssignModalVoucher(null);
        await loadData();
      } else {
        alert('حدث خطأ أثناء ربط المشروع');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingAssign(false);
    }
  };

  const handleCancelVoucher = async () => {
    if (!canEdit && !canDelete) {
      alert('ليس لديك صلاحية إلغاء السندات');
      return;
    }
    if (!cancelModalVoucher) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/vouchers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher_id: cancelModalVoucher.voucher_id,
          cancel_reason: cancelReasonInput || 'إلغاء بناءً على طلب الإدارة وتصفير القيد',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`تم إلغاء السند ${cancelModalVoucher.voucher_number} بنجاح`);
        setCancelModalVoucher(null);
        setCancelReasonInput('');
        await loadData();
      } else {
        alert(data.error || 'حدث خطأ أثناء الإلغاء');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const parseVoucherData = (v: any) => {
    if (!v.notes) {
      return { 
        partyAr: '—', partyEn: '—', forReasonAr: '—', forReasonEn: '—', 
        method: 'CASH', chequeNo: '', bank: '', sector: 'GENERAL',
        subcontractor_id: '', material_id: '', expense_id: ''
      };
    }

    try {
      const p = JSON.parse(v.notes);
      const pAr = p.partyAr || p.party || '';
      const pEn = p.partyEn || autoTransliterateArabicName(pAr) || '—';
      const rawReason = p.forReasonAr || p.forReason || '';
      const cleaned = cleanPurposeText(rawReason);
      const rEn = p.forReasonEn && !p.forReasonEn.includes('TRM-') ? p.forReasonEn : cleaned.en || '—';
      const sector = p.sector || (v.project_id ? 'PROJECTS' : 'GENERAL');

      return {
        partyAr: pAr || '—',
        partyEn: pEn,
        forReasonAr: cleaned.ar || '—',
        forReasonEn: rEn,
        method: p.method || 'CASH',
        chequeNo: p.chequeNo || '',
        bank: p.bank || '',
        sector,
        subcontractor_id: p.subcontractor_id || '',
        material_id: p.material_id || '',
        expense_id: p.expense_id || '',
        isCancelled: p.isCancelled || v.status === 'CANCELLED' || v.status === 'VOID',
      };
    } catch {
      const cleaned = cleanPurposeText(v.notes);
      return {
        partyAr: '—',
        partyEn: '—',
        forReasonAr: cleaned.ar,
        forReasonEn: cleaned.en,
        method: 'CASH',
        chequeNo: '',
        bank: '',
        sector: v.project_id ? 'PROJECTS' : 'GENERAL',
        subcontractor_id: '',
        material_id: '',
        expense_id: '',
        isCancelled: v.status === 'CANCELLED' || v.status === 'VOID',
      };
    }
  };

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const details = parseVoucherData(v);
      const isCancelled = v.status === 'CANCELLED' || v.status === 'VOID';

      if (filterSearch.trim()) {
        const query = filterSearch.toLowerCase().trim();
        const matchNumber = v.voucher_number?.toLowerCase().includes(query);
        const matchPartyAr = details.partyAr?.toLowerCase().includes(query);
        const matchReason = details.forReasonAr?.toLowerCase().includes(query);
        const matchProject = v.project_name?.toLowerCase().includes(query);
        if (!matchNumber && !matchPartyAr && !matchReason && !matchProject) {
          return false;
        }
      }

      if (filterBranch !== 'ALL' && v.branch_id !== filterBranch && v.branch_name !== filterBranch) {
        return false;
      }

      if (filterStatus === 'ACTIVE' && isCancelled) return false;
      if (filterStatus === 'VOID' && !isCancelled) return false;
      if (filterType !== 'ALL' && v.voucher_type !== filterType) return false;

      if (filterSector !== 'ALL') {
        const sec = String(details.sector || '').toUpperCase();
        if (filterSector === 'PROJECTS') {
          if (!v.project_id && sec !== 'PROJECTS') return false;
        } else if (filterSector === 'FLEET') {
          if (sec !== 'FLEET' && sec !== 'TRANSPORT_LOGISTICS' && !String(v.notes).includes('TRANSPORT_LOGISTICS')) return false;
        } else if (filterSector === 'INVENTORY') {
          if (sec !== 'INVENTORY' && !String(v.notes).includes('INVENTORY')) return false;
        } else if (filterSector === 'REAL_ESTATE') {
          if (sec !== 'REAL_ESTATE' && !String(v.notes).includes('REAL_ESTATE')) return false;
        } else if (filterSector === 'HR') {
          if (sec !== 'HR' && !String(v.notes).includes('HR')) return false;
        }
      }

      return true;
    });
  }, [vouchers, filterSearch, filterBranch, filterStatus, filterType, filterSector]);

  const resetFilters = () => {
    setFilterSearch('');
    setFilterBranch('ALL');
    setFilterStatus('ALL');
    setFilterType('ALL');
    setFilterSector('ALL');
  };

  const exportCSV = () => {
    if (filteredVouchers.length === 0) {
      alert('لا توجد بيانات لتصديرها');
      return;
    }

    const escapeXml = (unsafe: any) => {
      if (unsafe === null || unsafe === undefined) return '';
      return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const headers = [
      'رقم السند',
      'تاريخ السند',
      'نوع السند',
      'المبلغ المحرر',
      'العملة',
      'المستفيد / الطرف',
      'الفرع التابع له',
      'القطاع / المشروع',
      'طريقة الدفع',
      'البيان والغرض من الصرف',
      'حالة السند'
    ];

    let rowsXml = '';

    filteredVouchers.forEach((v) => {
      const d = parseVoucherData(v);
      const isCancelled = v.status === 'CANCELLED' || v.status === 'VOID' || d.isCancelled;
      const isReceipt = String(v.voucher_type || '').toUpperCase() === 'RECEIPT';

      const sec = String(d.sector || '').toUpperCase();
      const sectorTitle = 
        sec === 'FLEET' || sec === 'TRANSPORT_LOGISTICS' ? 'أسطول النقل اللوجستي' : 
        sec === 'INVENTORY' ? 'المخزن والتجارة العامة' :
        sec === 'REAL_ESTATE' ? 'العقارات والاستثمار' :
        sec === 'HR' ? 'الموارد البشرية والرواتب' :
        v.project_name ? `مشروع: ${v.project_name}` : 'مصروفات وإيرادات عامة';

      const payMethodStr = d.method === 'CHEQUE' 
        ? `شيك (${d.chequeNo || 'بدون رقم'}) - ${d.bank || 'المصرف'}` 
        : 'نقداً (Cash)';

      const statusTitle = isCancelled ? 'ملغي (VOID)' : 'جاري (ACTIVE)';
      const rowBg = isCancelled ? '#fee2e2' : '#ffffff';
      const textColor = isCancelled ? '#991b1b' : '#0f172a';
      const numStrike = isCancelled ? 'text-decoration: line-through;' : '';
      const statusBadgeBg = isCancelled ? '#f87171' : (isReceipt ? '#34d399' : '#fb7185');
      const statusBadgeText = isCancelled ? '#7f1d1d' : (isReceipt ? '#064e3b' : '#881337');

      const matchedB = branches.find(b => b.branch_id === v.branch_id || b.branch_code === v.branch_id);
      const bNameTitle = matchedB?.name_ar || v.branch_name || 'المقر الرئيسي (النجف الأشرف)';

      rowsXml += `
        <tr style="background-color: ${rowBg}; color: ${textColor}; height: 38px;">
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; font-weight: bold; color: ${isCancelled ? '#b91c1c' : (companySettings.primary_color || '#b45309')}; ${numStrike}">
            ${escapeXml(v.voucher_number)}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; font-family: monospace;">
            ${escapeXml(String(v.issue_date || v.created_at || '').split('T')[0])}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; font-weight: bold; color: ${isReceipt ? '#059669' : '#dc2626'};">
            ${isReceipt ? 'وصل قبض' : 'سند صرف'}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: bold; font-family: monospace; ${numStrike}">
            ${escapeXml(formatNum(v.total_amount || v.amount))}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center;">
            ${escapeXml(v.currency)}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; font-weight: bold;">
            ${escapeXml(d.partyAr)}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; font-weight: bold; color: #0284c7;">
            ${escapeXml(bNameTitle)}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right;">
            ${escapeXml(sectorTitle)}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right;">
            ${escapeXml(payMethodStr)}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right;">
            ${escapeXml(d.forReasonAr)}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; font-weight: bold; background-color: ${statusBadgeBg}; color: ${statusBadgeText};">
            ${escapeXml(statusTitle)}
          </td>
        </tr>
      `;
    });

    const fullHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Cairo, Arial, sans-serif;
            font-size: 14pt;
            direction: rtl;
          }
        </style>
      </head>
      <body>
        <div style="direction: rtl; font-family: 'Segoe UI', Tahoma, Cairo, Arial, sans-serif; padding: 20px;">
          <table style="width: 100%; border-bottom: 3px solid ${companySettings.primary_color || '#d97706'}; margin-bottom: 15px;">
            <tr>
              <td style="text-align: right; vertical-align: middle; width: 65%;">
                <h1 style="color: ${companySettings.primary_color || '#d97706'}; margin: 0; font-size: 20pt; font-weight: 900;">${escapeXml(companySettings.company_name)}</h1>
                <p style="color: #0f172a; margin: 4px 0 0 0; font-size: 12pt; font-weight: bold;">${escapeXml(companySettings.tagline)}</p>
                <p style="color: #64748b; margin: 2px 0 0 0; font-size: 10pt;">${escapeXml(companySettings.address)} | هاتف: ${escapeXml(companySettings.phone_primary)}</p>
              </td>
            </tr>
          </table>
          <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a; font-size: 14pt;">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff; text-align: center; font-weight: bold; height: 42px;">
                ${headers.map(h => `<th style="border: 1px solid #334155; padding: 10px; background-color: #0f172a; color: #f8fafc;">${escapeXml(h)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rowsXml}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + fullHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `سجل_السندات_المالية_${companySettings.company_name.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenPrintModal = async (v: any) => {
    await loadSettings();
    setSelectedVoucher(v);
  };

  const primaryCol = companySettings.primary_color || '#d97706';
  const secondaryCol = companySettings.secondary_color || '#ea580c';
  const hasLogo = Boolean(companySettings.logo_url && companySettings.logo_url.trim().length > 10);
  const hasLetterhead = Boolean(companySettings.letterhead_url && companySettings.letterhead_url.trim().length > 10);

  return (
    <AuthGuard moduleName="vouchers" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-[#070b14] print:bg-white print:min-h-0 text-slate-100 print:text-black p-3 md:p-6 print:p-0 font-cairo text-[14px]">
        
        {/* عزل الطباعة بالكامل وإجبار الصفحة على أن تكون بيضاء نقية 100% بدون أي مساحة سوداء */}
        <style jsx global>{`
          @media screen and (max-width: 768px) {
            .preview-scroll-container {
              width: 100% !important;
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch !important;
            }
            #printable-voucher-card {
              min-width: 720px !important;
              margin: 0 auto !important;
            }
          }
          @media print {
            @page {
              size: A4 portrait !important;
              margin: 6mm auto !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background: #ffffff !important;
              background-color: #ffffff !important;
              color: #000000 !important;
              width: 100% !important;
              height: 100% !important;
              min-height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            /* إزالة أي خلفيات داكنة وتصفير الحاويات تماماً */
            div[class*="min-h-screen"],
            .main-content-vouchers-page,
            .voucher-modal-overlay,
            .preview-scroll-container {
              background: #ffffff !important;
              background-color: #ffffff !important;
              min-height: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
            }
            /* إخفاء الواجهة ومكونات الموقع أثناء الطباعة */
            .main-content-vouchers-page,
            header, nav, aside, footer,
            .print-hidden-element,
            div[class*="backdrop-blur"],
            .voucher-modal-overlay > div:first-child {
              display: none !important;
              visibility: hidden !important;
            }
            .voucher-modal-overlay {
              position: static !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              height: auto !important;
              min-height: 100% !important;
              overflow: visible !important;
              display: block !important;
            }
            .preview-scroll-container {
              background: #ffffff !important;
              background-color: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              height: 100% !important;
              display: block !important;
            }
            #printable-voucher-card {
              box-sizing: border-box !important;
              box-shadow: none !important;
              border: 1.5px solid #cbd5e1 !important;
              border-radius: 6px !important;
              margin: 0 auto !important;
              width: 100% !important;
              max-width: 195mm !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              padding: 0 !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: flex-start !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
            }
          }
        `}</style>

        {/* 1. قسم إدارة السندات */}
        <div className="main-content-vouchers-page space-y-5 print:hidden">
          
          {/* الترويسة الرئيسية */}
          <div className="max-w-7xl mx-auto pb-3 border-b border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-3xl backdrop-blur-md shadow-2xl">
              
              <div className="flex items-center gap-3.5">
                <div 
                  className="w-12 h-12 relative rounded-2xl overflow-hidden bg-slate-950 border flex items-center justify-center shrink-0 p-1.5 shadow-xl"
                  style={{ borderColor: `${primaryCol}50` }}
                >
                  {hasLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={companySettings.logo_url} alt={companySettings.company_name} className="w-full h-full object-contain" />
                  ) : (
                    <Image src="/logo.png" alt="شركة البرج المتألق" width={42} height={42} className="object-contain" priority />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg md:text-xl font-black text-white tracking-wide">
                      إدارة السندات والقيود المالية المركزية
                    </h1>
                    <span 
                      className="inline-flex items-center gap-1 border text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono whitespace-nowrap"
                      style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}40` }}
                    >
                      <Sparkles className="w-3 h-3" />
                      Financial Vouchers Ledger
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-400 font-medium">
                    {companySettings.company_name} • نظام السندات الدفتري والمالي لجميع قطاعات وفروع الشركة
                  </p>
                </div>
              </div>

              {/* زر الرئيسية فقط */}
              <div className="shrink-0 self-end sm:self-auto">
                <Link 
                  href="/" 
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-[13px] font-black transition flex items-center gap-1.5 shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Home className="w-4 h-4" /> الرئيسية
                </Link>
              </div>

            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* نموذج إدخال السند */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl h-fit space-y-3.5 shadow-2xl relative overflow-hidden">
              {!canAdd && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <Lock className="w-8 h-8 text-amber-400" />
                  <p className="text-[14px] font-bold text-white">إصدار السندات مقيد بالصلاحيات</p>
                  <p className="text-xs text-slate-400">حسابك لا يمتلك صلاحية إضافة سندات مالية جديدة. راجع المدير المفوض لمنحك إذن الإضافة.</p>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" style={{ color: primaryCol }} /> تسجيل قيد مالي جديد
                </h2>
                {(linkedSubId || linkedMatId || linkedExpId) && (
                  <span 
                    className="text-[10px] border px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                    style={{ backgroundColor: `${primaryCol}20`, color: primaryCol, borderColor: `${primaryCol}40` }}
                  >
                    مقترن ببند مشروع ✓
                  </span>
                )}
              </div>

              {message && (
                <div className={`p-2.5 rounded-xl text-[13px] font-semibold ${message.includes('خطأ') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleCreateVoucher} className="space-y-3 text-[14px]">
                
                {/* 1. نوع السند والقطاع */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[13px]">نوع السند المالي *</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setVoucherType('RECEIPT')}
                        className={`py-1.5 text-center rounded-xl font-bold border transition text-[13px] cursor-pointer ${voucherType === 'RECEIPT' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                      >
                        قبض
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoucherType('PAYMENT')}
                        className={`py-1.5 text-center rounded-xl font-bold border transition text-[13px] cursor-pointer ${voucherType === 'PAYMENT' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                      >
                        صرف
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[13px]">القطاع المعني *</label>
                    <select
                      value={sectorType}
                      onChange={(e: any) => setSectorType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none text-[13px] cursor-pointer"
                    >
                      <option value="PROJECTS">المقاولات والمشاريع</option>
                      <option value="FLEET">أسطول النقل اللوجستي</option>
                      <option value="INVENTORY">التجارة العامة والمخزن</option>
                      <option value="REAL_ESTATE">العقارات والاستثمار</option>
                      <option value="HR">الموارد البشرية والرواتب</option>
                      <option value="GENERAL">مصاريف وإيرادات عامة</option>
                    </select>
                  </div>
                </div>

                {/* 2. الفرع المحدد والمشروع */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[13px]">الفرع المالي *</label>
                    {isRestrictedBranch ? (
                      <div className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2 text-amber-300 font-bold text-xs flex items-center justify-between">
                        <span className="truncate">
                          📍 {branches.find(b => b.branch_id === currentUser.assigned_branch_id)?.name_ar || 'فرعك المخصص'}
                        </span>
                        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                      </div>
                    ) : (
                      <select 
                        value={branchId} 
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-amber-300 font-bold outline-none text-[13px] cursor-pointer"
                      >
                        {branches.map((b) => (
                          <option key={b.branch_id} value={b.branch_id}>
                            {b.name_ar}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[13px]">المشروع المرتبط:</label>
                    <select 
                      value={projectId} 
                      disabled={sectorType !== 'PROJECTS'}
                      onChange={(e) => setProjectId(e.target.value)}
                      className={`w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none text-[13px] cursor-pointer ${sectorType !== 'PROJECTS' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <option value="">-- عام (بدون مشروع) --</option>
                      {projectsList.map((p) => (
                        <option key={p.project_id} value={p.project_id}>
                          {p.project_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. اسم الطرف والمستفيد */}
                <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block mb-1 font-bold text-[13px]" style={{ color: primaryCol }}>
                      {voucherType === 'RECEIPT' ? 'استلمت من (بالعربية) *:' : 'سلمت الى (بالعربية) *:'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="اسم المستلم أو العميل"
                      value={partyNameAr}
                      onChange={(e) => handlePartyArChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-bold text-[14px] focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">
                      {voucherType === 'RECEIPT' ? 'Received From (English):' : 'Delivered To (English):'}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="Party Name"
                      value={partyNameEn}
                      onChange={(e) => setPartyNameEn(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-sky-300 font-mono text-[12px] outline-none"
                    />
                  </div>
                </div>

                {/* 4. المبلغ والعملة */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[13px]">المبلغ رقماً *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-mono font-bold text-[14px] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[13px]">العملة</label>
                    <select 
                      value={currency} 
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white outline-none text-[13px] cursor-pointer"
                    >
                      <option value="IQD">دينار عراقي (IQD)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                    </select>
                  </div>
                </div>

                {amount && Number(amount) > 0 && (
                  <div className="p-2 bg-slate-950 rounded-xl text-[12px] text-amber-300 font-semibold border border-slate-800 space-y-0.5">
                    <div>{numberToArabicWords(parseFloat(amount), currency)}</div>
                    <div className="text-slate-400 font-serif text-[11px]">{numberToEnglishWords(parseFloat(amount), currency)}</div>
                  </div>
                )}

                {/* 5. البيان والغرض من الصرف */}
                <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold text-[13px]">وذلك عن (بالعربية) *:</label>
                    <input
                      type="text"
                      required
                      placeholder="البيان وسبب الصرف بالتفصيل"
                      value={notesAr}
                      onChange={(e) => handleNotesArChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-amber-500 text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">
                      For (English Purpose):
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="Payment Purpose"
                      value={notesEn}
                      onChange={(e) => setNotesEn(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-sky-300 font-mono text-[12px] outline-none"
                    />
                  </div>
                </div>

                {/* 6. طريقة الدفع */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold text-[13px]">طريقة السداد</label>
                  <div className="flex gap-4 mb-1 text-[13px]">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="pay_type" 
                        checked={paymentMethod === 'CASH'} 
                        onChange={() => setPaymentMethod('CASH')} 
                        className="cursor-pointer"
                      />
                      نقداً (Cash)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="pay_type" 
                        checked={paymentMethod === 'CHEQUE'} 
                        onChange={() => setPaymentMethod('CHEQUE')} 
                        className="cursor-pointer"
                      />
                      شيك (Cheque)
                    </label>
                  </div>

                  {paymentMethod === 'CHEQUE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="شيك رقم"
                        value={chequeNo}
                        onChange={(e) => setChequeNo(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-1.5 text-white text-[13px] outline-none"
                      />
                      <input
                        type="text"
                        placeholder="المصرف المسحوب عليه"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-1.5 text-white text-[13px] outline-none"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !canAdd}
                  className="w-full py-2.5 text-slate-950 font-bold rounded-xl transition text-[14px] mt-1 shadow-lg cursor-pointer whitespace-nowrap"
                  style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                >
                  {loading ? 'جاري الاعتماد...' : 'اعتماد وترحيل السند المالي'}
                </button>
              </form>
            </div>

            {/* جدول السندات المسجلة */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl flex flex-col gap-3.5 shadow-2xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" /> السندات المالية المسجلة
                  <span className="text-[12px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-normal">
                    ({filteredVouchers.length} من {vouchers.length})
                  </span>
                </h2>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={exportCSV}
                    className="text-[12px] bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-1.5 rounded-xl border border-slate-700 transition flex items-center gap-1 font-bold cursor-pointer whitespace-nowrap"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> تصدير Excel
                  </button>
                  {(filterSearch || filterBranch !== 'ALL' || filterStatus !== 'ALL' || filterType !== 'ALL' || filterSector !== 'ALL') && (
                    <button
                      onClick={resetFilters}
                      className="text-[12px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> إعادة ضبط
                    </button>
                  )}
                </div>
              </div>

              {/* أزرار التصفية لجميع قطاعات الشركة */}
              <div className="flex gap-1.5 flex-wrap text-[13px]">
                <button
                  onClick={() => setFilterSector('ALL')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    filterSector === 'ALL' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" /> جميع القطاعات
                </button>
                <button
                  onClick={() => setFilterSector('PROJECTS')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    filterSector === 'PROJECTS' ? 'text-slate-950 font-black shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  style={filterSector === 'PROJECTS' ? { backgroundColor: primaryCol } : {}}
                >
                  <HardHat className="w-3 h-3 text-amber-400" /> المقاولات والمشاريع
                </button>
                <button
                  onClick={() => setFilterSector('FLEET')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    filterSector === 'FLEET' ? 'bg-emerald-500 text-slate-950 font-black shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Truck className="w-3 h-3 text-emerald-400" /> أسطول النقل
                </button>
                <button
                  onClick={() => setFilterSector('INVENTORY')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    filterSector === 'INVENTORY' ? 'bg-sky-500 text-slate-950 font-black shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Boxes className="w-3 h-3 text-sky-400" /> المخزن والتجارة
                </button>
                <button
                  onClick={() => setFilterSector('REAL_ESTATE')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    filterSector === 'REAL_ESTATE' ? 'bg-purple-500 text-white font-black shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building className="w-3 h-3 text-purple-400" /> العقارات والاستثمار
                </button>
                <button
                  onClick={() => setFilterSector('HR')}
                  className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    filterSector === 'HR' ? 'bg-rose-500 text-white font-black shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3 h-3 text-rose-400" /> الموارد البشرية والرواتب
                </button>
              </div>

              {/* شريط الفلترة والبحث */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[13px]">
                <div>
                  <input
                    type="text"
                    placeholder="ابحث برقم، اسم، أو بيان..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500 focus:border-amber-500 outline-none text-[13px]"
                  />
                </div>

                <div>
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    disabled={isRestrictedBranch}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white focus:border-sky-500 outline-none text-[13px] cursor-pointer"
                  >
                    <option value="ALL">كل الفروع</option>
                    {branches.map((b) => (
                      <option key={b.branch_id} value={b.branch_id}>{b.name_ar}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white focus:border-emerald-500 outline-none text-[13px] cursor-pointer"
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="ACTIVE">الجارية (ACTIVE)</option>
                    <option value="VOID">الملغية (VOID)</option>
                  </select>
                </div>

                <div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white focus:border-rose-500 outline-none text-[13px] cursor-pointer"
                  >
                    <option value="ALL">جميع الأنواع</option>
                    <option value="RECEIPT">وصل قبض (استلام)</option>
                    <option value="PAYMENT">سند صرف (دفع)</option>
                  </select>
                </div>
              </div>

              {/* جدول السندات مع التمرير المحمي للموبايل */}
              <div className="w-full overflow-x-auto pb-2 rounded-2xl border border-slate-800">
                <table className="w-full min-w-[760px] text-right text-[14px]">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[13px]">
                    <tr>
                      <th className="p-3 text-center whitespace-nowrap">الرقم</th>
                      <th className="p-3 whitespace-nowrap">الطرف / المستفيد</th>
                      <th className="p-3 whitespace-nowrap">الفرع</th>
                      <th className="p-3 whitespace-nowrap">القطاع / المشروع</th>
                      <th className="p-3 text-center whitespace-nowrap">النوع</th>
                      <th className="p-3 whitespace-nowrap">المبلغ</th>
                      <th className="p-3 text-center whitespace-nowrap">الحالة</th>
                      <th className="p-3 text-center whitespace-nowrap">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/20">
                    {filteredVouchers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500 text-[14px]">
                          لا توجد سندات مطابقة للبحث.
                        </td>
                      </tr>
                    ) : (
                      filteredVouchers.map((v) => {
                        const details = parseVoucherData(v);
                        const isCancelled = v.status === 'CANCELLED' || v.status === 'VOID';
                        const isReceiptType = String(v.voucher_type || '').toUpperCase() === 'RECEIPT';
                        const sec = String(details.sector || '').toUpperCase();

                        const matchedBranch = branches.find(b => b.branch_id === v.branch_id || b.branch_code === v.branch_id);
                        const displayBranchName = matchedBranch?.name_ar || v.branch_name || 'المقر الرئيسي (النجف الأشرف)';

                        return (
                          <tr key={v.voucher_id} className={`transition text-[14px] ${isCancelled ? 'bg-rose-950/25 opacity-75' : 'hover:bg-slate-800/40'}`}>
                            
                            {/* رقم السند */}
                            <td className="p-3 text-center font-mono font-bold whitespace-nowrap">
                              <span 
                                className={isCancelled ? 'line-through text-slate-400' : ''}
                                style={!isCancelled ? { color: primaryCol } : {}}
                              >
                                {v.voucher_number}
                              </span>
                            </td>

                            {/* الطرف / المستفيد */}
                            <td className="p-3 font-bold text-white max-w-[160px] truncate">
                              <div className="flex flex-col">
                                <span className="truncate">{details.partyAr || '—'}</span>
                                {details.subcontractor_id && (
                                  <span className="text-[10px] text-sky-400 flex items-center gap-0.5 mt-0.5 font-sans whitespace-nowrap">
                                    <User className="w-2.5 h-2.5" /> مقاول باطن
                                  </span>
                                )}
                                {details.material_id && (
                                  <span className="text-[10px] text-amber-400 flex items-center gap-0.5 mt-0.5 font-sans whitespace-nowrap">
                                    <Package className="w-2.5 h-2.5" /> توريد مادة
                                  </span>
                                )}
                                {details.expense_id && (
                                  <span className="text-[10px] text-rose-400 flex items-center gap-0.5 mt-0.5 font-sans whitespace-nowrap">
                                    <Coins className="w-2.5 h-2.5" /> مصروف تشغيلي
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* الفرع */}
                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-slate-950 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                                📍 {displayBranchName}
                              </span>
                            </td>

                            {/* القطاع أو المشروع */}
                            <td className="p-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {sec === 'FLEET' || sec === 'TRANSPORT_LOGISTICS' ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[12px] whitespace-nowrap">
                                    <Truck className="w-3 h-3" /> أسطول النقل
                                  </span>
                                ) : sec === 'INVENTORY' ? (
                                  <span className="inline-flex items-center gap-1 text-sky-400 font-bold bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full text-[12px] whitespace-nowrap">
                                    <Boxes className="w-3 h-3" /> المخزن والتجارة
                                  </span>
                                ) : sec === 'REAL_ESTATE' ? (
                                  <span className="inline-flex items-center gap-1 text-purple-400 font-bold bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-[12px] whitespace-nowrap">
                                    <Building className="w-3 h-3" /> العقارات
                                  </span>
                                ) : sec === 'HR' ? (
                                  <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-[12px] whitespace-nowrap">
                                    <Users className="w-3 h-3" /> الرواتب
                                  </span>
                                ) : v.project_name ? (
                                  <span className="inline-flex items-center gap-1 font-bold text-[13px] whitespace-nowrap" style={{ color: primaryCol }}>
                                    <HardHat className="w-3.5 h-3.5" /> {v.project_name}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-[12px] whitespace-nowrap">عام (بدون مشروع)</span>
                                )}
                                {!isCancelled && !v.project_id && canEdit && (
                                  <button
                                    onClick={() => {
                                      setAssignModalVoucher(v);
                                      setTargetProjectId(v.project_id || '');
                                    }}
                                    className="text-slate-400 hover:text-amber-300 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                                    title="ربط السند بمشروع"
                                  >
                                    <Link2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* نوع السند */}
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-xl text-[12px] font-bold border ${
                                isReceiptType 
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              }`}>
                                {isReceiptType ? 'وصل قبض' : 'سند صرف'}
                              </span>
                            </td>

                            {/* المبلغ */}
                            <td className={`p-3 font-black font-mono whitespace-nowrap ${isCancelled ? 'line-through text-slate-500' : 'text-white'}`}>
                              {Number(v.total_amount).toLocaleString()} <span className="text-[11px] font-sans text-slate-400">{v.currency}</span>
                            </td>

                            {/* حالة الوصل */}
                            <td className="p-3 text-center whitespace-nowrap">
                              {isCancelled ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold text-[11px] whitespace-nowrap">
                                  <Ban className="w-3 h-3" /> ملغي
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-[11px] whitespace-nowrap">
                                  <CheckCircle2 className="w-3 h-3" /> جاري
                                </span>
                              )}
                            </td>

                            {/* الإجراءات */}
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setDetailsModalVoucher(v)}
                                  className="bg-sky-500/20 hover:bg-sky-500 text-sky-400 hover:text-slate-950 font-bold p-1.5 rounded-lg border border-sky-500/30 transition cursor-pointer"
                                  title="عرض تفاصيل هذا الوصل"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleOpenPrintModal(v)}
                                  className="text-slate-950 font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 text-[12px] cursor-pointer shadow whitespace-nowrap"
                                  style={{ backgroundColor: primaryCol }}
                                  title="طباعة السند"
                                >
                                  <Printer className="w-3.5 h-3.5" /> طباعة
                                </button>
                                
                                {!isCancelled && (canEdit || canDelete) && (
                                  <button
                                    onClick={() => setCancelModalVoucher(v)}
                                    className="bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white px-2 py-1 rounded-lg transition flex items-center gap-1 text-[12px] border border-rose-500/30 cursor-pointer whitespace-nowrap"
                                    title="إلغاء السند"
                                  >
                                    <Ban className="w-3.5 h-3.5" /> إلغاء
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        </div>

        {/* نافذة تفاصيل السند الكاملة */}
        {detailsModalVoucher && (() => {
          const d = parseVoucherData(detailsModalVoucher);
          const isReceiptType = String(detailsModalVoucher.voucher_type || '').toUpperCase() === 'RECEIPT';
          const sec = String(d.sector || '').toUpperCase();
          const sectorName = 
            sec === 'FLEET' || sec === 'TRANSPORT_LOGISTICS' ? 'أسطول النقل اللوجستي' :
            sec === 'INVENTORY' ? 'التجارة العامة والمخزن المركزي' :
            sec === 'REAL_ESTATE' ? 'العقارات والاستثمارات' :
            sec === 'HR' ? 'الموارد البشرية والرواتب' :
            detailsModalVoucher.project_name ? 'قطاع المقاولات والمشاريع' : 'المصروفات والإيرادات العامة';

          const matchedB = branches.find(b => b.branch_id === detailsModalVoucher.branch_id || b.branch_code === detailsModalVoucher.branch_id);
          const modalBranchName = matchedB?.name_ar || detailsModalVoucher.branch_name || 'المقر الرئيسي (النجف الأشرف)';

          return (
            <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl text-right flex flex-col max-h-[90vh] overflow-y-auto text-[14px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-sky-400 shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-white">بطاقة التدقيق المالي للسند</h3>
                      <p className="text-xs font-mono font-bold" style={{ color: primaryCol }}>{detailsModalVoucher.voucher_number}</p>
                    </div>
                  </div>
                  <button onClick={() => setDetailsModalVoucher(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[12px]">نوع السند</span>
                      <strong className={`font-bold ${isReceiptType ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isReceiptType ? 'وصل قبض (تحصيل إيراد)' : 'سند صرف (نفقة ومستحقات)'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[12px]">المبلغ المقيد</span>
                      <strong className="text-white font-mono text-base">
                        {formatNum(detailsModalVoucher.total_amount || detailsModalVoucher.amount)} {detailsModalVoucher.currency}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 font-semibold">الفرع المقيد به:</span>
                      <span className="text-amber-300 font-bold font-mono">📍 {modalBranchName}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 font-semibold">القطاع التابع له:</span>
                      <span className="text-amber-300 font-bold">{sectorName}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 font-semibold">المشروع الإنشائي:</span>
                      <span className="font-bold font-mono" style={{ color: primaryCol }}>
                        {detailsModalVoucher.project_name || 'غير مرتبط بمشروع إنشائي'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 font-semibold">البند الفرعي المحدد:</span>
                      <span className="text-white font-bold">
                        {d.subcontractor_id ? 'عقد مقاول باطن' :
                         d.material_id ? 'توريد مواد ومعدات' :
                         d.expense_id ? 'مصروف تشغيلي وميداني' : 'قيد عام مباشر'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 font-semibold">المستفيد / الطرف:</span>
                      <span className="text-white font-bold truncate max-w-[200px]">{d.partyAr}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400 font-semibold">طريقة الدفع:</span>
                      <span className="text-slate-200 font-mono text-xs">
                        {d.method === 'CHEQUE' ? `شيك رقم (${d.chequeNo || '—'}) على بنك (${d.bank || '—'})` : 'نقداً (Cash)'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">تاريخ التحرير:</span>
                      <span className="text-slate-200 font-mono">
                        {String(detailsModalVoucher.issue_date || detailsModalVoucher.created_at || '').split('T')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block font-semibold text-[12px]">البيان والغرض من السند (وذلك عن):</span>
                    <p className="text-slate-100 font-bold leading-relaxed text-xs sm:text-sm">{d.forReasonAr}</p>
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row justify-end gap-2 border-t border-slate-800 mt-auto">
                  <button
                    onClick={() => {
                      setDetailsModalVoucher(null);
                      handleOpenPrintModal(detailsModalVoucher);
                    }}
                    className="px-4 py-2 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md"
                    style={{ backgroundColor: primaryCol }}
                  >
                    <Printer className="w-3.5 h-3.5" /> معاينة وطباعة السند
                  </button>
                  <button
                    onClick={() => setDetailsModalVoucher(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition text-center"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* نافذة ربط السند بمشروع */}
        {assignModalVoucher && canEdit && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4" style={{ color: primaryCol }} /> ربط السند بمشروع مقاولة
                </h3>
                <button onClick={() => setAssignModalVoucher(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[14px] text-slate-300">
                ربط السند رقم <span className="font-mono font-bold" style={{ color: primaryCol }}>{assignModalVoucher.voucher_number}</span> بمشروع لاحتساب تكلفته أو مقبوضاته تلقائياً:
              </p>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">اختر المشروع:</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-[14px] text-white outline-none cursor-pointer"
                >
                  <option value="">-- فك الربط (عام بدون مشروع) --</option>
                  {projectsList.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.project_name} ({p.client_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button onClick={() => setAssignModalVoucher(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer">
                  إلغاء
                </button>
                <button 
                  onClick={handleAssignProject} 
                  disabled={savingAssign} 
                  className="px-4 py-2 text-slate-950 font-bold rounded-xl text-xs cursor-pointer whitespace-nowrap"
                  style={{ backgroundColor: primaryCol }}
                >
                  {savingAssign ? 'جاري الحفظ...' : 'تأكيد الربط'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تأكيد الإلغاء */}
        {cancelModalVoucher && (canEdit || canDelete) && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl text-right max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 text-rose-400 mb-3 border-b border-slate-800 pb-3">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">تأكيد إلغاء السند المالي</h3>
              </div>
              <p className="text-[14px] text-slate-300 leading-relaxed mb-4">
                أنت على وشك تحويل السند رقم <span className="font-mono font-bold" style={{ color: primaryCol }}>{cancelModalVoucher.voucher_number}</span> إلى حالة <span className="text-rose-400 font-bold">ملغي (VOID)</span> وتصفير أثره المالي.
              </p>
              <div className="mb-4">
                <label className="block text-xs text-slate-400 mb-1 font-semibold">سبب الإلغاء (للتوثيق):</label>
                <input 
                  type="text"
                  placeholder="مثال: خطأ في المبلغ أو اسم المستلم"
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-[14px] text-white outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button onClick={() => setCancelModalVoucher(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer">
                  تراجع
                </button>
                <button onClick={handleCancelVoucher} disabled={cancelling} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer whitespace-nowrap">
                  {cancelling ? 'جاري الإلغاء...' : 'تأكيد إلغاء السند'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. قالب السند الورقي الدفتري الرسمي المطبوع المعزول كلياً بحجم السند الطبيعي والترويسة المطابقة للكتب الرسمية */}
        {selectedVoucher && (() => {
          const details = parseVoucherData(selectedVoucher);
          const isReceipt = String(selectedVoucher.voucher_type || '').toUpperCase() === 'RECEIPT';
          const formattedDate = new Date(selectedVoucher.issue_date || selectedVoucher.created_at || Date.now()).toISOString().split('T')[0];
          const numOnly = selectedVoucher.voucher_number.replace(/\D/g, '').padStart(6, '0');
          const numVal = parseFloat(selectedVoucher.total_amount) || 0;
          const isCancelled = selectedVoucher.status === 'CANCELLED' || selectedVoucher.status === 'VOID' || details.isCancelled;

          const arabicWords = numberToArabicWords(numVal, selectedVoucher.currency);
          const englishWords = numberToEnglishWords(numVal, selectedVoucher.currency);

          const matchedBranch = branches.find(b => b.branch_id === selectedVoucher.branch_id || b.branch_code === selectedVoucher.branch_id);
          const printedBranchName = matchedBranch?.name_ar || selectedVoucher.branch_name || 'المقر الرئيسي (عرض المنظومة الموحدة)';

          const activeOrigin = typeof window !== 'undefined' && window.location.origin
            ? window.location.origin
            : (companySettings.website || 'https://rtco2025.netlify.app');

          const verificationUrl = `${activeOrigin}/verify?type=voucher&no=${encodeURIComponent(selectedVoucher.voucher_number)}`;
          const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verificationUrl)}`;

          return (
            <div className="voucher-modal-overlay fixed inset-0 bg-slate-950/90 z-50 overflow-y-auto flex flex-col items-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible print:block print:w-full">
              
              {/* شريط أزرار الطباعة في الشاشة فقط */}
              <div className="sticky top-0 z-50 w-full max-w-[200mm] bg-slate-900/95 border-b border-slate-700 backdrop-blur px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl rounded-2xl mb-4 print:hidden">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 sm:px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg transition cursor-pointer flex-1 sm:flex-none whitespace-nowrap">
                    <Printer className="w-4 h-4" /> أمر الطباعة الآن (Print)
                  </button>
                  <span className="text-xs text-slate-300 font-semibold hidden md:inline whitespace-nowrap">
                    معاينة السند: <span className="font-mono font-bold" style={{ color: primaryCol }}>{selectedVoucher.voucher_number}</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${isCancelled ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                    {isCancelled ? 'ملغي (VOID)' : 'جاري (ACTIVE)'}
                  </span>
                </div>
                <button onClick={() => setSelectedVoucher(null)} className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white p-2 rounded-xl border border-slate-700 transition cursor-pointer shrink-0 self-end sm:self-auto">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* بطاقة السند الرسمية المجهزة بمقاس السند الطبيعي وخلفية بيضاء بالكامل دون أي قص للتذييل وبشكل محكم */}
              <div className="preview-scroll-container pb-6 print:pb-0 print:overflow-visible print:w-full print:max-w-none flex justify-center">
                <div 
                  id="printable-voucher-card"
                  className="bg-white text-slate-950 w-full max-w-[200mm] rounded-xl shadow-2xl print:shadow-none p-0 border-2 border-slate-300 relative overflow-hidden font-sans flex flex-col justify-start"
                >
                  {/* العلامة المائية للشركة */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="w-[320px] h-[320px] rounded-full border-[4px] border-[#e2e8f0] flex flex-col items-center justify-center opacity-15 relative p-4">
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {hasLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={companySettings.logo_url} 
                            alt="العلامة المائية للشركة" 
                            className="w-[170px] h-[170px] object-contain grayscale opacity-60" 
                          />
                        ) : (
                          <Image 
                            src="/logo.png" 
                            alt="شركة البرج المتألق" 
                            width={170} 
                            height={170} 
                            className="object-contain grayscale opacity-60" 
                            priority 
                          />
                        )}
                      </div>
                      <div className="text-center mt-32 text-[#64748b] text-[9px] font-bold tracking-wider">
                        {companySettings.company_name}
                      </div>
                    </div>
                  </div>

                  {isCancelled && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <div className="border-8 border-rose-600/30 text-rose-600/30 font-black text-6xl md:text-7xl tracking-widest uppercase rotate-[-25deg] px-10 py-3 rounded-2xl select-none">
                        VOID / ملغي
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col w-full">
                    
                    {/* 1. الترويسة الرسمية المطابقة للكتب الرسمية تماماً */}
                    {hasLetterhead ? (
                      <div className="w-full border-b border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={companySettings.letterhead_url} 
                          alt="ترويسة الشركة الرسمية" 
                          className="w-full max-h-[100px] object-contain"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="h-3 w-full" style={{ backgroundColor: secondaryCol }}></div>
                        <div className="px-6 sm:px-8 pt-2 pb-1.5 flex items-center justify-between border-b border-slate-200">
                          <div className="text-right flex-1 font-sans">
                            <h1 className="text-base sm:text-lg font-black tracking-wide leading-none" style={{ color: primaryCol }}>
                              {companySettings.company_name}
                            </h1>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-900 tracking-wide mt-0.5 leading-snug whitespace-pre-line">
                              {companySettings.tagline || 'للمقاولات العامة والاستثمارات العقارية\nوالتجارة العامة والنقل العام'}
                            </p>
                          </div>

                          <div className="w-14 h-14 relative flex items-center justify-center shrink-0 mx-2">
                            {hasLogo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={companySettings.logo_url} 
                                alt="شعار الشركة" 
                                className="w-[50px] h-[50px] object-contain" 
                              />
                            ) : (
                              <Image 
                                src="/logo.png" 
                                alt="شعار شركة البرج المتألق" 
                                width={50} 
                                height={50} 
                                className="object-contain" 
                                priority 
                              />
                            )}
                          </div>

                          <div className="text-left flex-1 font-sans text-[9px] sm:text-[10px] text-slate-700 leading-tight space-y-0.5" dir="ltr">
                            <p className="font-bold text-slate-900 text-[10px] sm:text-[11px]">Resplendently Tower Co</p>
                            <p className="font-semibold" style={{ color: primaryCol }}>General Contracting</p>
                            <p className="font-semibold" style={{ color: primaryCol }}>General Trading</p>
                            <p className="font-semibold" style={{ color: primaryCol }}>General Transport</p>
                            <p className="font-semibold" style={{ color: primaryCol }}>Real Estate Investments</p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* 2. شريط السند المالي الرسمي المطابق للكتب مع اسم الفرع والنوع */}
                    <div className="mx-6 sm:mx-8 mt-1.5 bg-[#e4e4e7] px-4 py-1 rounded-sm flex items-center justify-between font-black text-xs text-slate-900 border border-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-bold">التاريخ :</span>
                        <span className="font-mono text-xs tracking-widest">{formattedDate}</span>
                      </div>

                      <div className="border bg-white px-2.5 py-0.5 rounded text-[10px] font-black" style={{ borderColor: primaryCol, color: primaryCol }}>
                        <span>{isReceipt ? 'وصل قبض رسمي (Receipt)' : 'سند صرف رسمي (Payment)'}</span>
                        <span className="mx-1.5 text-slate-400">|</span>
                        <span className="text-slate-800 font-bold">{printedBranchName}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-bold">رقم السند :</span>
                        <span className="font-mono text-xs tracking-wider" style={{ color: primaryCol }}>{selectedVoucher.voucher_number}</span>
                      </div>
                    </div>

                    {/* 3. صندوق المبلغ المحرر */}
                    <div className="mx-6 sm:mx-8 mt-1.5 flex justify-between items-center bg-slate-50 border-2 p-1.5 px-3 rounded-lg" style={{ borderColor: primaryCol }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">المبلغ رقماً (Amount):</span>
                        <span className="font-mono text-base font-black px-2.5 py-0.5 bg-white border rounded text-slate-950 shadow-inner" style={{ borderColor: `${primaryCol}80` }}>
                          {Number(selectedVoucher.total_amount).toLocaleString()}
                        </span>
                        <span className="font-black text-xs text-slate-800">
                          {selectedVoucher.currency === 'USD' ? 'دولار أمريكي ($)' : 'دينار عراقي (IQD)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-600">الرقم الدفتري:</span>
                        <span className="text-red-600 font-mono font-black text-sm">No: {numOnly}</span>
                      </div>
                    </div>

                    {/* 4. بيانات السند المنظمة هندسياً ومحكمة بدون أي خروج خارج الورقة */}
                    <div className="px-6 sm:px-8 py-2.5 space-y-2.5 text-slate-900 text-[13px] sm:text-[14px]">
                      
                      {/* السطر الأول: الطرف / المستفيد - محكم ومنظم عمودياً كباقي الأسطر لمنع خروجه */}
                      <div className="flex items-start">
                        <span className="min-w-[140px] text-slate-950 font-black text-[13px] sm:text-[14px] pt-0.5 shrink-0 whitespace-nowrap">
                          {isReceipt ? 'استلمت من السيد / السادة:' : 'سلمت إلى السيد / السادة:'}
                        </span>
                        <div className="flex-1 min-w-0 border-b-2 border-dotted border-slate-400 mx-2 flex flex-col px-2 pb-0.5">
                          <span className="font-black text-slate-950 text-[14px] sm:text-[15px] leading-relaxed truncate">{details.partyAr}</span>
                          {details.partyEn && details.partyEn !== '—' && (
                            <span className="font-serif font-bold text-slate-700 text-xs text-left leading-relaxed mt-0.5 truncate" dir="ltr">{details.partyEn}</span>
                          )}
                        </div>
                        <span className="font-serif text-slate-600 text-xs min-w-[105px] text-left pt-0.5 shrink-0 whitespace-nowrap" dir="ltr">
                          {isReceipt ? 'Received From:' : 'Delivered To:'}
                        </span>
                      </div>

                      {/* السطر الثاني: المبلغ كتابةً وتفقيطاً */}
                      <div className="flex items-start">
                        <span className="min-w-[140px] text-slate-950 font-black text-[13px] sm:text-[14px] pt-0.5 shrink-0 whitespace-nowrap">مبلغ وقدره (كتابةً):</span>
                        <div className="flex-1 min-w-0 border-b-2 border-dotted border-slate-400 mx-2 flex flex-col px-2 pb-0.5">
                          <span className="font-black text-slate-950 text-[13px] sm:text-[14px] leading-relaxed">{arabicWords}</span>
                          <span className="font-serif text-slate-700 text-[11px] text-left leading-relaxed mt-0.5 font-bold" dir="ltr">{englishWords}</span>
                        </div>
                        <span className="font-serif text-slate-600 text-xs min-w-[105px] text-left pt-0.5 shrink-0 whitespace-nowrap" dir="ltr">Amount of:</span>
                      </div>

                      {/* السطر الثالث: البيان وسبب الصرف */}
                      <div className="flex items-start">
                        <span className="min-w-[140px] text-slate-950 font-black text-[13px] sm:text-[14px] pt-0.5 shrink-0 whitespace-nowrap">وذلك عن (البيان):</span>
                        <div className="flex-1 min-w-0 border-b-2 border-dotted border-slate-400 mx-2 flex flex-col px-2 pb-0.5">
                          <span className="font-black text-slate-950 text-[13px] sm:text-[14px] leading-relaxed">{details.forReasonAr}</span>
                          <span className="font-serif text-slate-700 text-[11px] text-left leading-relaxed mt-0.5 font-bold" dir="ltr">{details.forReasonEn}</span>
                        </div>
                        <span className="font-serif text-slate-600 text-xs min-w-[105px] text-left pt-0.5 shrink-0 whitespace-nowrap" dir="ltr">For Purpose:</span>
                      </div>

                      {/* السطر الرابع: طريقة الدفع والشيك */}
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <span className="text-slate-950 font-black text-xs">طريقة السداد:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-900 font-bold text-xs">نقداً (Cash)</span>
                              <span className="border border-slate-800 w-3.5 h-3.5 inline-flex items-center justify-center font-black text-[10px] bg-white">
                                {details.method === 'CASH' ? '✓' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-900 font-bold text-xs">شيك (Cheque)</span>
                              <span className="border border-slate-800 w-3.5 h-3.5 inline-flex items-center justify-center font-black text-[10px] bg-white">
                                {details.method === 'CHEQUE' ? '✓' : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 font-bold text-[11px]">شيك رقم:</span>
                            <span className="font-mono font-bold text-slate-950 min-w-[70px] border-b border-slate-400 text-center text-xs">
                              {details.chequeNo || '-------'}
                            </span>
                          </div>
                        </div>

                        {details.method === 'CHEQUE' && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px] font-bold text-slate-800">
                            <div>
                              <span>على مصرف: </span>
                              <strong className="text-slate-950">{details.bank || '---'}</strong>
                            </div>
                            <div>
                              <span>بتاريخ: </span>
                              <strong className="font-mono text-slate-950">{formattedDate}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* التواقيع الرسمية */}
                      <div className="grid grid-cols-3 gap-4 pt-1.5 text-center">
                        <div className="space-y-0.5">
                          <p className="font-black text-slate-950 text-xs">توقيع المستلم (Receiver)</p>
                          <div className="h-6"></div>
                          <div className="border-b-2 border-slate-400 w-24 sm:w-28 mx-auto"></div>
                        </div>

                        <div className="space-y-0.5">
                          <p className="font-black text-slate-950 text-xs">المحاسب المالي (Accountant)</p>
                          <div className="h-6"></div>
                          <div className="border-b-2 border-slate-400 w-24 sm:w-28 mx-auto"></div>
                        </div>

                        <div className="space-y-0.5">
                          <p className="font-black text-slate-950 text-xs">المدير المفوض (Manager)</p>
                          <div className="h-6"></div>
                          <div className="border-b-2 border-slate-400 w-24 sm:w-28 mx-auto"></div>
                        </div>
                      </div>

                      {/* الباركود والختم الرقمي */}
                      <div className="flex justify-between items-end pt-1 px-1 border-t border-slate-200">
                        <div className="flex flex-col items-center">
                          <div className="w-11 h-11 border border-slate-300 rounded p-0.5 bg-white flex items-center justify-center shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrCodeApiUrl} alt="باركود التحقق من السند" className="w-full h-full object-contain" />
                          </div>
                          <span className="font-mono text-[7px] text-slate-500 mt-0.5">VOUCHER VERIFIED</span>
                        </div>

                        <div className="text-center space-y-0.5 min-w-[170px]">
                          <p className="font-black text-xs text-slate-950">{companySettings.company_name}</p>
                          <p className="text-[9px] text-slate-600 font-bold">{printedBranchName}</p>
                          
                          <div className="h-7 flex items-center justify-center relative">
                            <div 
                              className="border-2 border-dashed rounded-full w-11 h-11 flex flex-col items-center justify-center rotate-[-12deg] p-0.5 pointer-events-none absolute"
                              style={{ borderColor: primaryCol, color: primaryCol }}
                            >
                              <span className="text-[5px] font-black">{companySettings.company_name}</span>
                              <span className="text-[5px] font-bold">مصادق مالياً</span>
                              <span className="text-[5px] font-mono">{formattedDate}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* 5. التذييل الرسمي المطابق للكتب الرسمية في الأسفل مع ظهور كامل التفاصيل */}
                  <div className="relative z-10 w-full bg-white mt-1">
                    <div className="px-6 sm:px-8 pb-1 flex items-center justify-between text-[10px] font-bold text-slate-800 border-t border-slate-200 pt-1">
                      <div className="flex items-center gap-1 font-mono text-[9px] text-slate-700 dir-ltr">
                        <div className="w-4 h-4 rounded bg-[#27272a] text-white flex items-center justify-center shrink-0">
                          <Globe className="w-2.5 h-2.5" />
                        </div>
                        <span className="hover:underline">{companySettings.website || activeOrigin}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-800">
                        <div className="w-4 h-4 rounded bg-[#27272a] text-white flex items-center justify-center shrink-0">
                          <MapPin className="w-2.5 h-2.5" />
                        </div>
                        <span>{companySettings.address}</span>
                      </div>

                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-800">
                        <div className="w-4 h-4 rounded bg-[#27272a] text-white flex items-center justify-center shrink-0">
                          <Phone className="w-2.5 h-2.5" />
                        </div>
                        <span className="font-bold">
                          {companySettings.phone_primary}
                          {companySettings.phone_secondary && ` - ${companySettings.phone_secondary}`}
                        </span>
                      </div>
                    </div>

                    <div className="h-1 w-full mb-0.5" style={{ backgroundColor: primaryCol }}></div>

                    {/* الزخرفة السفلية المزدوجة الظاهرة بالكامل */}
                    <div className="relative h-5 w-full">
                      <div 
                        className="absolute bottom-0 left-0 w-24 h-4 rounded-tr-[30px] opacity-90 transition-colors"
                        style={{ backgroundColor: secondaryCol }}
                      ></div>
                      <div 
                        className="absolute bottom-0 right-0 w-28 h-5 rounded-tl-[45px] transition-colors"
                        style={{ backgroundColor: primaryCol }}
                      ></div>
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