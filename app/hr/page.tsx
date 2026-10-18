'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  ArrowLeft, 
  PlusCircle, 
  Search, 
  RefreshCw, 
  Trash2, 
  Wallet, 
  Coins, 
  Phone, 
  X, 
  Printer, 
  Sparkles, 
  User, 
  Scissors, 
  FileSpreadsheet, 
  Clock, 
  Send, 
  Palmtree, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Award,
  FileCheck,
  Briefcase,
  GraduationCap,
  Paperclip,
  ExternalLink,
  BookOpen,
  Camera,
  Upload,
  Edit3,
  Home,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import AuthGuard, { hasPermission } from '@/components/AuthGuard';
import { useBranch } from '@/context/BranchContext';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

function formatDateOnly(val: string | null | undefined): string {
  if (!val) return '---';
  return String(val).split('T')[0];
}

function getArabicMonthName(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return '';
  const [, m] = monthStr.split('-');
  const months: { [key: string]: string } = {
    '01': 'كانون الثاني',
    '02': 'شباط',
    '03': 'آذار',
    '04': 'نيسان',
    '05': 'أيار',
    '06': 'حزيران',
    '07': 'تموز',
    '08': 'آب',
    '09': 'أيلول',
    '10': 'تشرين الأول',
    '11': 'تشرين الثاني',
    '12': 'كانون الأول'
  };
  return months[m] || '';
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

export default function HRManagementPage() {
  const { selectedBranchId, branches } = useBranch();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
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

  const [employees, setEmployees] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [penaltiesAppraisals, setPenaltiesAppraisals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'EMPLOYEES_HUB' | 'PAYROLL_SHEET' | 'LEDGER' | 'APPRAISALS'>('EMPLOYEES_HUB');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empCode, setEmpCode] = useState('');
  const [department, setDepartment] = useState('المقاولات والمشاريع');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [hireDate, setHireDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [contractType, setContractType] = useState<'PERMANENT' | 'FIXED'>('PERMANENT');
  const [contractEndDate, setContractEndDate] = useState('');
  const [baseSalary, setBaseSalary] = useState('500000');
  const [allowances, setAllowances] = useState('150000');
  const [phone, setPhone] = useState('');
  const [leaveBalance, setLeaveBalance] = useState('21');
  const [bankAccount, setBankAccount] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [editEmpCode, setEditEmpCode] = useState('');
  const [editDepartment, setEditDepartment] = useState('المقاولات والمشاريع');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editHireDate, setEditHireDate] = useState('');
  const [editContractType, setEditContractType] = useState<'PERMANENT' | 'FIXED'>('PERMANENT');
  const [editContractEndDate, setEditContractEndDate] = useState('');
  const [editBaseSalary, setEditBaseSalary] = useState('');
  const [editAllowances, setEditAllowances] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLeaveBalance, setEditLeaveBalance] = useState('');

  const [cvModalEmp, setCvModalEmp] = useState<any | null>(null);
  const [cvPrintEmp, setCvPrintEmp] = useState<any | null>(null);
  const [cvAvatar, setCvAvatar] = useState('');
  const [education, setEducation] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [documentsList, setDocumentsList] = useState<any[]>([]);

  const [showAdjModal, setShowAdjModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [adjType, setAdjType] = useState<'DEDUCTION' | 'LOAN' | 'BONUS' | 'OVERTIME'>('DEDUCTION');
  const [adjAmount, setAdjAmount] = useState('33333');
  const [overtimeHours, setOvertimeHours] = useState('5');
  const [installmentsCount, setInstallmentsCount] = useState('1');
  const [adjReason, setAdjReason] = useState('');

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveEmpId, setLeaveEmpId] = useState('');
  const [leaveType, setLeaveType] = useState<'UNPAID' | 'ANNUAL' | 'SICK'>('UNPAID');
  const [leaveDays, setLeaveDays] = useState('2');
  const [leaveStartDate, setLeaveStartDate] = useState(`${filterMonth}-01`);
  const [leaveEndDate, setLeaveEndDate] = useState(`${filterMonth}-02`);
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    if (filterMonth) {
      setLeaveStartDate(`${filterMonth}-01`);
      const dt = new Date(`${filterMonth}-01`);
      dt.setDate(dt.getDate() + Math.max(0, parseInt(leaveDays || '1') - 1));
      setLeaveEndDate(dt.toISOString().substring(0, 10));
    }
  }, [filterMonth, leaveDays]);

  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  const [appraisalEmpId, setAppraisalEmpId] = useState('');
  const [recordType, setRecordType] = useState<'APPRAISAL' | 'PENALTY'>('APPRAISAL');
  const [recordTitle, setRecordTitle] = useState('');
  const [recordDetails, setRecordDetails] = useState('');
  const [ratingScore, setRatingScore] = useState('5');

  const [targetDestinationPrompt, setTargetDestinationPrompt] = useState<{ emp: any; net: number } | null>(null);
  const [certificateDestination, setCertificateDestination] = useState('إلى من يهمه الأمر');
  const [salaryCertEmp, setSalaryCertEmp] = useState<any | null>(null);

  const [processingPayroll, setProcessingPayroll] = useState(false);

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

  const resolveBranchName = (bId?: string): string => {
    if (!bId || bId === 'ALL' || bId === 'BR-HQ-01') {
      return 'المقر الرئيسي (النجف الأشرف)';
    }
    const cleanId = String(bId).trim().toUpperCase();
    if (cleanId === 'TRD-01' || cleanId === 'BR-TRADE-03' || cleanId.includes('TRD') || cleanId.includes('TRADE')) {
      return 'فرع التجارة العامة';
    }
    if (cleanId === 'CNT-01' || cleanId === 'BR-CONST-02' || cleanId.includes('CNT') || cleanId.includes('CONST')) {
      return 'فرع المقاولات العامة';
    }
    if (cleanId === 'FLT-01' || cleanId === 'BR-TRANS-04' || cleanId.includes('FLT') || cleanId.includes('TRANS')) {
      return 'فرع النقل العام';
    }
    if (cleanId === 'EST-01' || cleanId === 'BR-RE-05' || cleanId.includes('EST') || cleanId.includes('RE')) {
      return 'فرع الاستثمارات العقارية';
    }
    if (cleanId === 'STR-01' || cleanId.includes('STR') || cleanId.includes('WAREHOUSE')) {
      return 'فرع المخازن';
    }
    if (cleanId === 'HQ-01' || cleanId === 'BR-HQ-01') {
      return 'المقر الرئيسي';
    }

    const found = (branches || []).find((b: any) => 
      String(b.branch_id).trim().toUpperCase() === cleanId || 
      String(b.branch_code).trim().toUpperCase() === cleanId
    );
    return found?.name_ar || `فرع ${bId}`;
  };

  const currentActiveBranchName = useMemo(() => {
    if (isRestrictedBranch && currentUser?.assigned_branch_id) {
      return resolveBranchName(currentUser.assigned_branch_id);
    }
    return resolveBranchName(selectedBranchId);
  }, [selectedBranchId, branches, isRestrictedBranch, currentUser]);

  const canAdd = useMemo(() => hasPermission(currentUser, 'hr', 'add'), [currentUser]);
  const canEdit = useMemo(() => hasPermission(currentUser, 'hr', 'edit'), [currentUser]);
  const canDelete = useMemo(() => hasPermission(currentUser, 'hr', 'delete'), [currentUser]);

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
    setLoading(true);
    try {
      let activeBranch = branchFilterId !== undefined ? branchFilterId : selectedBranchId;
      if (isRestrictedBranch && currentUser?.assigned_branch_id) {
        activeBranch = currentUser.assigned_branch_id;
      }

      const url = activeBranch && activeBranch !== 'ALL'
        ? `/api/hr?branch_id=${encodeURIComponent(activeBranch)}`
        : '/api/hr';

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data && data.success) {
        setEmployees(data.employees || []);
        setAdjustments(data.adjustments || []);
        setPayrollRuns(data.payrollRuns || []);
        setLeaves(data.leaves || []);
        setPenaltiesAppraisals(data.penaltiesAppraisals || []);
        if (data.employees?.length > 0 && !expandedEmpId) {
          setExpandedEmpId(data.employees[0].employee_id);
        }
      }
    } catch (err) {
      console.warn("HR Data loading warm-up...");
    } finally {
      setLoading(false);
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

  // إزالة أي قواعد سابقة في المتصفح كانت تفرض الوضع الطولي Portrait وإلزام الطباعة بالعرض Landscape
  useEffect(() => {
    const applyLandscapePrintRule = () => {
      document.querySelectorAll('style').forEach((st) => {
        if (st.innerHTML && (st.innerHTML.includes('portrait') || st.innerHTML.includes('PORTRAIT'))) {
          st.innerHTML = st.innerHTML
            .replace(/size:\s*A4\s*portrait\s*!important/gi, 'size: A4 landscape !important')
            .replace(/size:\s*A4\s*portrait/gi, 'size: A4 landscape')
            .replace(/size:\s*portrait\s*!important/gi, 'size: landscape !important')
            .replace(/size:\s*portrait/gi, 'size: landscape');
        }
      });

      let el = document.getElementById('hr-payroll-force-landscape');
      if (!el) {
        el = document.createElement('style');
        el.id = 'hr-payroll-force-landscape';
        document.head.appendChild(el);
      }
      el.innerHTML = `
        @page {
          size: A4 landscape !important;
          margin: 4mm 5mm !important;
        }
      `;
    };

    applyLandscapePrintRule();
    window.addEventListener('beforeprint', applyLandscapePrintRule);

    return () => {
      window.removeEventListener('beforeprint', applyLandscapePrintRule);
      const el = document.getElementById('hr-payroll-force-landscape');
      if (el) el.remove();
    };
  }, [filterMonth]);

  const handlePrintPayrollLandscape = async () => {
    await loadSettings();

    document.querySelectorAll('style').forEach((st) => {
      if (st.innerHTML && (st.innerHTML.includes('portrait') || st.innerHTML.includes('PORTRAIT'))) {
        st.innerHTML = st.innerHTML
          .replace(/size:\s*A4\s*portrait\s*!important/gi, 'size: A4 landscape !important')
          .replace(/size:\s*A4\s*portrait/gi, 'size: A4 landscape')
          .replace(/size:\s*portrait\s*!important/gi, 'size: landscape !important')
          .replace(/size:\s*portrait/gi, 'size: landscape');
      }
    });

    let el = document.getElementById('hr-payroll-force-landscape');
    if (!el) {
      el = document.createElement('style');
      el.id = 'hr-payroll-force-landscape';
      document.head.appendChild(el);
    }
    el.innerHTML = `
      @page {
        size: A4 landscape !important;
        margin: 4mm 5mm !important;
      }
    `;

    setTimeout(() => {
      window.print();
    }, 80);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return alert('ليس لديك صلاحية إضافة موظفين جدد');
    setLoading(true);
    try {
      const combinedFullName = lastName.trim() ? `${firstName.trim()} ${lastName.trim()}` : firstName.trim();
      
      let finalBranch = 'BR-HQ-01';
      if (isRestrictedBranch && currentUser?.assigned_branch_id) {
        finalBranch = currentUser.assigned_branch_id;
      } else if (selectedBranchId && selectedBranchId !== 'ALL') {
        finalBranch = selectedBranchId;
      }

      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_EMPLOYEE',
          branch_id: finalBranch,
          emp_code: empCode,
          full_name: combinedFullName,
          job_title: jobTitle,
          department,
          hire_date: hireDate || null,
          contract_end_date: contractType === 'FIXED' ? contractEndDate : null,
          base_salary: baseSalary,
          allowances,
          phone,
          avatar_url: avatarUrl,
          annual_leave_balance: leaveBalance,
          bank_account: bankAccount
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddEmpModal(false);
        setEmpCode('');
        setFirstName('');
        setLastName('');
        setJobTitle('');
        setContractEndDate('');
        setContractType('PERMANENT');
        await loadData(finalBranch);
      } else {
        alert(data.error || 'فشلت إضافة الموظف');
      }
    } finally {
      setLoading(false);
    }
  };

  const openEditEmployeeModal = (emp: any) => {
    if (!canEdit) return alert('ليس لديك صلاحية تعديل بيانات الموظفين');
    setEditingEmployee(emp);
    setEditEmpCode(emp.emp_code || '');
    setEditDepartment(emp.department || 'المقاولات والمشاريع');
    
    const parts = (emp.full_name || '').trim().split(' ');
    if (parts.length > 3) {
      setEditFirstName(parts.slice(0, 3).join(' '));
      setEditLastName(parts.slice(3).join(' '));
    } else {
      setEditFirstName(emp.full_name || '');
      setEditLastName('');
    }

    setEditJobTitle(emp.job_title || '');
    setEditHireDate(formatDateOnly(emp.hire_date) || `${filterMonth}-01`);
    setEditContractType(emp.contract_end_date ? 'FIXED' : 'PERMANENT');
    setEditContractEndDate(formatDateOnly(emp.contract_end_date) || '');
    setEditBaseSalary(String(emp.base_salary || 0));
    setEditAllowances(String(emp.allowances || 0));
    setEditPhone(emp.phone || '');
    setEditLeaveBalance(String(emp.annual_leave_balance || 21));
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return alert('ليس لديك صلاحية تعديل بيانات الموظفين');
    if (!editingEmployee) return;
    setLoading(true);
    try {
      const combinedFullName = editLastName.trim() ? `${editFirstName.trim()} ${editLastName.trim()}` : editFirstName.trim();

      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_EMPLOYEE',
          employee_id: editingEmployee.employee_id,
          emp_code: editEmpCode,
          full_name: combinedFullName,
          job_title: editJobTitle,
          department: editDepartment,
          hire_date: editHireDate || null,
          contract_end_date: editContractType === 'FIXED' ? editContractEndDate : null,
          base_salary: editBaseSalary,
          allowances: editAllowances,
          phone: editPhone,
          annual_leave_balance: editLeaveBalance
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('تم تعديل وحفظ بيانات الموظف بنجاح!');
        setEditingEmployee(null);
        await loadData();
      } else {
        alert(data.error || 'فشل تعديل الموظف');
      }
    } finally {
      setLoading(false);
    }
  };

  const openCvModal = (emp: any) => {
    setCvModalEmp(emp);
    const cv = emp.cv_data || {};
    setCvAvatar(emp.avatar_url || '');
    setEducation(cv.education || '');
    setExperienceYears(cv.experienceYears || '');
    setSkills(cv.skills || '');
    setBio(cv.bio || '');
    setDocumentsList(cv.documents || []);
    setDocTitle('');
    setDocUrl('');
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCvAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDocToCv = () => {
    if (!docTitle || !docUrl) return alert('يرجى كتابة عنوان الوثيقة ورابطها (URL)');
    setDocumentsList([...documentsList, { title: docTitle, url: docUrl, date: new Date().toISOString().substring(0, 10) }]);
    setDocTitle('');
    setDocUrl('');
  };

  const handleRemoveDocFromCv = (index: number) => {
    setDocumentsList(documentsList.filter((_, i) => i !== index));
  };

  const handleSaveCv = async () => {
    if (!canEdit) return alert('ليس لديك صلاحية تعديل السيرة الذاتية');
    if (!cvModalEmp) return;
    setLoading(true);
    try {
      const cv_data = { education, experienceYears, skills, bio, documents: documentsList };
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_EMPLOYEE_CV',
          employee_id: cvModalEmp.employee_id,
          avatar_url: cvAvatar,
          cv_data
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('تم حفظ وتحديث السيرة الذاتية والصورة الشخصية بنجاح!');
        setEmployees(prev => prev.map(e => e.employee_id === cvModalEmp.employee_id ? { ...e, cv_data, avatar_url: cvAvatar } : e));
        setCvModalEmp(null);
        await loadData();
      } else {
        alert(data.error || 'فشل حفظ السيرة الذاتية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return alert('ليس لديك صلاحية قيد الاستقطاعات أو السلف');
    if (!selectedEmpId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_ADJUSTMENT',
          employee_id: selectedEmpId,
          adj_type: adjType,
          amount: adjAmount,
          hours_count: adjType === 'OVERTIME' ? overtimeHours : 0,
          installments_count: adjType === 'LOAN' ? installmentsCount : 1,
          reason: adjReason,
          effective_month: filterMonth
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(adjType === 'LOAN' && Number(installmentsCount) > 1 ? `تم قيد السلفة وتوزيعها على ${installmentsCount} أشهر بنجاح!` : 'تم قيد الحركة بنجاح!');
        setShowAdjModal(false);
        setSelectedEmpId('');
        setAdjReason('');
        setInstallmentsCount('1');
        await loadData();
      } else {
        alert(data.error || 'فشلت العملية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecordLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return alert('ليس لديك صلاحية تسجيل الإجازات');
    if (!leaveEmpId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_LEAVE',
          employee_id: leaveEmpId,
          leave_type: leaveType,
          days_count: leaveDays,
          start_date: leaveStartDate,
          end_date: leaveEndDate,
          reason: leaveReason
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(leaveType === 'UNPAID' ? 'تم تسجيل الإجازة وخصمها من الرصيد وقيد الاستقطاع المالي لهذا الشهر!' : 'تم تسجيل الإجازة بنجاح!');
        setShowLeaveModal(false);
        setLeaveEmpId('');
        setLeaveReason('');
        await loadData();
      } else {
        alert(data.error || 'فشلت إضافة الإجازة');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return alert('ليس لديك صلاحية إضافة التقييمات أو العقوبات');
    if (!appraisalEmpId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_PENALTY_APPRAISAL',
          employee_id: appraisalEmpId,
          record_type: recordType,
          title: recordTitle,
          details: recordDetails,
          rating_score: ratingScore,
          record_date: `${filterMonth}-01`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('تم تسجيل القيد الإداري بنجاح!');
        setShowAppraisalModal(false);
        setRecordTitle('');
        setRecordDetails('');
        await loadData();
      } else {
        alert(data.error || 'فشلت العملية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    if (!canDelete) return alert('ليس لديك صلاحية حذف الإجازات');
    if (!confirm('هل أنت متأكد من حذف هذه الإجازة مع استرجاع رصيد الأيام المخصومة؟')) return;
    try {
      const res = await fetch(`/api/hr?leave_id=${leaveId}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAdjustment = async (adjId: string) => {
    if (!canDelete) return alert('ليس لديك صلاحية حذف الحركات أو السلف');
    if (!confirm('هل أنت متأكد من حذف حركة الاستقطاع أو السلفة؟')) return;
    try {
      const res = await fetch(`/api/hr?adj_id=${adjId}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRecord = async (recId: string) => {
    if (!canDelete) return alert('ليس لديك صلاحية حذف السجلات الإدارية');
    if (!confirm('هل أنت متأكد من حذف هذا السجل الإداري؟')) return;
    try {
      const res = await fetch(`/api/hr?rec_id=${recId}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPayroll = async () => {
    if (!canEdit) return alert('ليس لديك صلاحية تصفير أو تعديل مسير الرواتب');
    if (!confirm(`تأكيد استرجاع وتصفير بودرة شهر (${filterMonth}) لإعادة التعديل من جديد؟`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_PAYROLL',
          month: filterMonth
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`تم تصفير واسترجاع بودرة شهر ${filterMonth} بنجاح!`);
        setPayrollRuns(prev => prev.filter(r => r.payroll_month !== filterMonth));
        await loadData();
      } else {
        alert(data.error || 'فشلت العملية');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!canEdit) return alert('ليس لديك صلاحية اعتماد وترحيل مسير الرواتب');
    if (!confirm(`تأكيد احتساب وترحيل مسير رواتب شهر (${filterMonth}) مع تطبيق استقطاعات الإجازات وأقساط السلف وتوليد سندات الصرف؟`)) return;
    setProcessingPayroll(true);
    try {
      let finalBranch = selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : 'ALL';
      if (isRestrictedBranch && currentUser?.assigned_branch_id) {
        finalBranch = currentUser.assigned_branch_id;
      }

      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PROCESS_PAYROLL',
          month: filterMonth,
          branch_id: finalBranch
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`تم ترحيل مسير شهر ${filterMonth} بنجاح!`);
        await loadData();
      }
    } finally {
      setProcessingPayroll(false);
    }
  };

  const sendWhatsAppPayslip = (run: any) => {
    const rawPhone = String(run.phone || '').trim().replace(/[^0-9]/g, '');
    if (!rawPhone) return alert('لم يتم تسجيل رقم هاتف لهذا الموظف!');

    let phoneWithCountry = rawPhone;
    if (phoneWithCountry.startsWith('0')) {
      phoneWithCountry = '964' + phoneWithCountry.substring(1);
    } else if (!phoneWithCountry.startsWith('964')) {
      phoneWithCountry = '964' + phoneWithCountry;
    }

    const message = `*${companySettings.company_name}*\nإشعار صرف راتب شهر: ${run.payroll_month}\n----------------------------------------\nالسيد/ة: *${run.full_name}* (${run.job_title})\nالرقم الوظيفي: ${run.emp_code}\n\n* الراتب الأساسي: ${formatNum(run.base_salary)} د.ع\n* البدلات والحوافز: +${formatNum(Number(run.allowances) + Number(run.bonuses))} د.ع\n* الساعات الإضافية: +${formatNum(run.overtime_amount)} د.ع\n* الاستقطاعات وأقساط السلف: -${formatNum(Number(run.loans_deducted) + Number(run.penalties))} د.ع\n${run.deduction_reasons ? `* بيان الاستقطاع: ${run.deduction_reasons}\n` : ''}----------------------------------------\n*صافي الراتب المستلم: ${formatNum(run.net_salary)} د.ع*\n\nتم الصرف والترحيل من الإدارة المالية.`;

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDeleteEmployee = async (emp: any) => {
    if (!canDelete) return alert('ليس لديك صلاحية حذف الموظفين');
    if (!confirm(`هل أنت متأكد من حذف الموظف "${emp.full_name}" وسجلاته؟`)) return;
    try {
      const res = await fetch(`/api/hr?id=${emp.employee_id}`, { method: 'DELETE' });
      if (res.ok) await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        String(e.full_name).toLowerCase().includes(q) || 
        String(e.emp_code).toLowerCase().includes(q) || 
        String(e.job_title).toLowerCase().includes(q);

      const matchDept = selectedDept === 'ALL' || e.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [employees, searchQuery, selectedDept]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const sDate = formatDateOnly(l.start_date);
      return sDate.startsWith(filterMonth);
    });
  }, [leaves, filterMonth]);

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter(a => {
      const eff = String(a.effective_month || '');
      return eff.startsWith(filterMonth);
    });
  }, [adjustments, filterMonth]);

  const currentMonthRuns = useMemo(() => {
    return payrollRuns.filter(r => r.payroll_month === filterMonth);
  }, [payrollRuns, filterMonth]);

  const sheetTotals = useMemo(() => {
    const totalBase = currentMonthRuns.reduce((acc, r) => acc + Number(r.base_salary || 0), 0);
    const totalAllowancesBonuses = currentMonthRuns.reduce((acc, r) => acc + Number(r.allowances || 0) + Number(r.bonuses || 0), 0);
    const totalOvertime = currentMonthRuns.reduce((acc, r) => acc + Number(r.overtime_amount || 0), 0);
    const totalGross = totalBase + totalAllowancesBonuses + totalOvertime;
    const totalDeductions = currentMonthRuns.reduce((acc, r) => acc + Number(r.loans_deducted || 0) + Number(r.penalties || 0), 0);
    const totalNet = currentMonthRuns.reduce((acc, r) => acc + Number(r.net_salary || 0), 0);

    return { totalBase, totalAllowancesBonuses, totalOvertime, totalGross, totalDeductions, totalNet };
  }, [currentMonthRuns]);

  const currentMonthArabic = useMemo(() => {
    return getArabicMonthName(filterMonth);
  }, [filterMonth]);

  const topCardsData = useMemo(() => {
    const activeEmps = employees.filter(e => e.status === 'ACTIVE');
    const totalEmployeesCount = activeEmps.length;

    const totalMonthlyPayroll = activeEmps.reduce((acc, e) => {
      return acc + (Number(e.base_salary || 0) + Number(e.allowances || 0));
    }, 0);

    const totalActualNetPayroll = activeEmps.reduce((acc, emp) => {
      const base = Number(emp.base_salary) || 0;
      const allow = Number(emp.allowances) || 0;
      const empAdjs = adjustments.filter(a => {
        const matchEmp = String(a.employee_id) === String(emp.employee_id);
        const eff = String(a.effective_month || '');
        return matchEmp && eff.startsWith(filterMonth);
      });
      
      const adds = empAdjs.filter(a => a.adj_type === 'BONUS' || a.adj_type === 'OVERTIME').reduce((sum, a) => sum + Number(a.amount || 0), 0);
      const deds = empAdjs.filter(a => a.adj_type === 'DEDUCTION' || a.adj_type === 'LOAN').reduce((sum, a) => sum + ((a.adj_type === 'LOAN' && Number(a.monthly_installment) > 0) ? Number(a.monthly_installment) : Number(a.amount || 0)), 0);
      
      const netEmp = Math.max(0, (base + allow + adds) - deds);
      return acc + netEmp;
    }, 0);

    const monthLoans = adjustments
      .filter(a => a.adj_type === 'LOAN' && String(a.effective_month || '').startsWith(filterMonth))
      .reduce((acc, a) => acc + (Number(a.monthly_installment) || Number(a.amount) || 0), 0);

    const monthLeavesCount = leaves
      .filter(l => formatDateOnly(l.start_date).startsWith(filterMonth))
      .length;

    return {
      totalEmployeesCount,
      totalMonthlyPayroll,
      totalActualNetPayroll,
      monthLoans,
      monthLeavesCount
    };
  }, [employees, adjustments, leaves, filterMonth]);

  const primaryCol = companySettings.primary_color || '#d97706';
  const secondaryCol = companySettings.secondary_color || '#ea580c';
  const hasLogo = Boolean(companySettings.logo_url && companySettings.logo_url.trim().length > 10);
  const hasLetterhead = Boolean(companySettings.letterhead_url && companySettings.letterhead_url.trim().length > 10);

  const activeOrigin = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : (companySettings?.website || 'https://rtcoapp.netlify.app');

  const payrollVerificationUrl = `${activeOrigin}/verify?type=payroll&month=${encodeURIComponent(filterMonth)}`;
  const qrCodePayrollUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(payrollVerificationUrl)}`;

  if (!currentUser) return null;

  return (
    <AuthGuard moduleName="hr" requiredAction="view">
      <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-4 md:p-8 font-cairo text-[14px] print:bg-white print:p-0">
        
        {/* حقن CSS نقي ومباشر لفرض العرض Landscape في المتصفح ومنع تقطيع النصوص */}
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: landscape;
            margin: 4mm 5mm;
          }
          @media screen and (max-width: 1024px) {
            .preview-scroll-container {
              width: 100% !important;
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch !important;
              padding-bottom: 2rem !important;
            }
            .print-landscape-sheet {
              min-width: 1100px !important;
              margin: 0 !important;
            }
          }
          @media print {
            @page {
              size: landscape;
              margin: 4mm 5mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
              font-family: var(--font-cairo), 'Cairo', system-ui, -apple-system, sans-serif !important;
            }
            body, html {
              background-color: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 297mm !important;
              height: 202mm !important;
              max-height: 202mm !important;
              overflow: hidden !important;
              visibility: visible !important;
            }
            header, nav, aside, .print-hidden-element, button {
              display: none !important;
              visibility: hidden !important;
            }
            .preview-scroll-container {
              overflow: visible !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
            }
            .print-landscape-sheet {
              box-sizing: border-box !important;
              box-shadow: none !important;
              border: 1.5px solid #ea580c !important;
              border-radius: 4px !important;
              margin: 0 auto !important;
              width: 287mm !important;
              max-width: 287mm !important;
              height: 198mm !important;
              max-height: 198mm !important;
              min-height: 198mm !important;
              background: #ffffff !important;
              padding: 3mm 5mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              overflow: hidden !important;
            }
            .print-landscape-sheet table {
              width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
            }
            .print-landscape-sheet th,
            .print-landscape-sheet td {
              padding: 2.5px 3px !important;
              font-size: 9.5px !important;
              line-height: 1.25 !important;
            }
            .print-landscape-sheet th {
              font-size: 10px !important;
              font-weight: 800 !important;
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
        `}} />

        {/* الترويسة الرئيسية المنظمة والمتجاوبة مع الموبايل */}
        <div className="max-w-7xl mx-auto pb-5 sm:pb-6 border-b border-slate-800/80 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 bg-slate-900/60 border border-slate-800/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-md shadow-2xl">
            
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 relative rounded-2xl overflow-hidden bg-slate-950 border flex items-center justify-center shrink-0 p-2 shadow-xl mt-0.5 sm:mt-0"
                style={{ borderColor: `${primaryCol}50`, boxShadow: `0 10px 25px -5px ${primaryCol}30` }}
              >
                {hasLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={companySettings.logo_url} 
                    alt={companySettings.company_name} 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <Image 
                    src="/logo.png" 
                    alt="شركة البرج المتألق" 
                    width={48} 
                    height={48} 
                    className="object-contain" 
                    priority 
                  />
                )}
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-lg md:text-2xl font-black text-white tracking-wide leading-tight">
                    منظومة الموارد البشرية والرواتب وبودرة المسير
                  </h1>
                  <span 
                    className="inline-flex items-center gap-1 border text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-inner font-mono whitespace-nowrap"
                    style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}40` }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Enterprise HR
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                  {companySettings.company_name} • بطاقات الكوادر، السير الذاتية (CV)، السلف المقسطة، وتأييد الرواتب
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto">
              <button 
                onClick={() => loadData(selectedBranchId)} 
                className="p-2 sm:p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-amber-400 transition cursor-pointer active:scale-95 shadow-sm"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <Link 
                href="/" 
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-purple-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> الرئيسية
              </Link>
            </div>

          </div>
        </div>

        {/* المؤشرات العامة العلوية */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5 mt-5 sm:mt-6 print:hidden">
          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col justify-center">
            <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block">كادر الشركة النشط</span>
            <div className="text-base sm:text-xl font-black font-mono text-white mt-1 sm:mt-2">
              {topCardsData.totalEmployeesCount} <span className="text-[10px] font-sans text-slate-500">موظف</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col justify-center">
            <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block">
              كتلة الرواتب الأساسية ({currentMonthArabic})
            </span>
            <div className="text-base sm:text-xl font-black font-mono mt-1 sm:mt-2" style={{ color: primaryCol }}>
              {formatNum(topCardsData.totalMonthlyPayroll)} <span className="text-[10px] font-sans text-slate-500">د.ع</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col justify-center">
            <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block">
              صافي الرواتب ({currentMonthArabic})
            </span>
            <div className="text-base sm:text-xl font-black font-mono mt-1 sm:mt-2" style={{ color: secondaryCol }}>
              {formatNum(topCardsData.totalActualNetPayroll)} <span className="text-[10px] font-sans text-slate-500">د.ع</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col justify-center">
            <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block">
              سلف شهر {currentMonthArabic}
            </span>
            <div className="text-base sm:text-xl font-black font-mono text-amber-400 mt-1 sm:mt-2">
              {formatNum(topCardsData.monthLoans)} <span className="text-[10px] font-sans text-slate-500">د.ع</span>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col justify-center">
            <span className="text-[11px] sm:text-xs text-slate-400 font-semibold block">
              إجازات شهر {currentMonthArabic}
            </span>
            <div className="text-base sm:text-xl font-black font-mono text-sky-400 mt-1 sm:mt-2">
              {topCardsData.monthLeavesCount} <span className="text-[10px] font-sans text-slate-500">إجازة</span>
            </div>
          </div>
        </div>

        {/* شريط التحكم الموحد */}
        <div className="max-w-7xl mx-auto mt-5 sm:mt-6 print:hidden space-y-3">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
              <button
                onClick={() => setActiveTab('EMPLOYEES_HUB')}
                className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'EMPLOYEES_HUB' ? 'text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white bg-slate-800/40'
                }`}
                style={activeTab === 'EMPLOYEES_HUB' ? { backgroundColor: primaryCol } : {}}
              >
                <Users className="w-3.5 h-3.5" /> بطاقات الكوادر ({employees.length})
              </button>
              <button
                onClick={() => setActiveTab('PAYROLL_SHEET')}
                className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'PAYROLL_SHEET' ? 'text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white bg-slate-800/40'
                }`}
                style={activeTab === 'PAYROLL_SHEET' ? { backgroundColor: primaryCol } : {}}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" /> مسير الرواتب والبودرة A4 بالعرض
              </button>
              <button
                onClick={() => setActiveTab('LEDGER')}
                className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'LEDGER' ? 'text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white bg-slate-800/40'
                }`}
                style={activeTab === 'LEDGER' ? { backgroundColor: primaryCol } : {}}
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" /> سجل الحركات والإجازات
              </button>
              <button
                onClick={() => setActiveTab('APPRAISALS')}
                className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'APPRAISALS' ? 'text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white bg-slate-800/40'
                }`}
                style={activeTab === 'APPRAISALS' ? { backgroundColor: primaryCol } : {}}
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" /> التقييمات والجزاءات ({penaltiesAppraisals.length})
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" style={{ color: primaryCol }} />
                <span className="text-xs text-slate-400 font-semibold">شهر التتبع:</span>
                <span className="text-xs font-bold font-sans" style={{ color: primaryCol }}>{currentMonthArabic}</span>
              </div>
              <input 
                type="month" 
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-white font-mono text-xs outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-start gap-2 overflow-x-auto bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-2xl">
            {canAdd && (
              <>
                <button
                  onClick={() => setShowAddEmpModal(true)}
                  className="text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm whitespace-nowrap cursor-pointer"
                  style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                >
                  <PlusCircle className="w-3.5 h-3.5" /> إضافة موظف جديد
                </button>
                <button
                  onClick={() => {
                    setAdjType('DEDUCTION');
                    setShowAdjModal(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700 whitespace-nowrap cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5 text-rose-400" /> قيد قطع / خصم
                </button>
                <button
                  onClick={() => {
                    setAdjType('LOAN');
                    setShowAdjModal(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700 whitespace-nowrap cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> قيد سلفة مقسطة
                </button>
                <button
                  onClick={() => {
                    setAdjType('OVERTIME');
                    setShowAdjModal(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700 whitespace-nowrap cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> قيد ساعات إضافية
                </button>
                <button
                  onClick={() => {
                    setLeaveStartDate(`${filterMonth}-01`);
                    const dt = new Date(`${filterMonth}-01`);
                    dt.setDate(dt.getDate() + Math.max(0, parseInt(leaveDays || '1') - 1));
                    setLeaveEndDate(dt.toISOString().substring(0, 10));
                    setShowLeaveModal(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700 whitespace-nowrap cursor-pointer"
                >
                  <Palmtree className="w-3.5 h-3.5 text-sky-400" /> قيد إجازة
                </button>
                <button
                  onClick={() => setShowAppraisalModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700 whitespace-nowrap cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-purple-400" /> تقييم أداء / إنذار
                </button>
              </>
            )}
          </div>
        </div>

        {/* 1. تبويب بطاقات الكوادر */}
        {activeTab === 'EMPLOYEES_HUB' && (
          <div className="max-w-7xl mx-auto mt-5 space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input 
                    type="text" 
                    placeholder="ابحث بالاسم، الرمز، أو العنوان..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
                <select 
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="ALL">كافة الأقسام والقطاعات</option>
                  <option value="المقاولات والمشاريع">المقاولات والمشاريع</option>
                  <option value="أسطول النقل العام">أسطول النقل العام</option>
                  <option value="التجارة والمخزن المركزي">التجارة والمخزن المركزي</option>
                  <option value="الإدارة المالية والمحاسبة">الإدارة المالية والمحاسبة</option>
                  <option value="العقارات والاستثمار">العقارات والاستثمار</option>
                  <option value="الإدارة المركزية">الإدارة المركزية</option>
                </select>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                حركات شهر: <strong className="font-sans font-bold" style={{ color: primaryCol }}>{currentMonthArabic} ({filterMonth})</strong>
              </span>
            </div>

            <div className="space-y-3">
              {filteredEmployees.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
                  لا يوجد موظفون مسجلون مطابقون للبحث.
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isExpanded = expandedEmpId === emp.employee_id;
                  
                  const empLeaves = leaves.filter(l => {
                    const matchEmp = String(l.employee_id) === String(emp.employee_id);
                    const sDate = formatDateOnly(l.start_date);
                    return matchEmp && sDate.startsWith(filterMonth);
                  });

                  const empAdjustments = adjustments.filter(a => {
                    const matchEmp = String(a.employee_id) === String(emp.employee_id);
                    const eff = String(a.effective_month || '');
                    return matchEmp && eff.startsWith(filterMonth);
                  });
                  
                  const base = Number(emp.base_salary) || 0;
                  const allow = Number(emp.allowances) || 0;
                  const adds = empAdjustments.filter(a => a.adj_type === 'BONUS' || a.adj_type === 'OVERTIME').reduce((acc, a) => acc + Number(a.amount || 0), 0);
                  const deds = empAdjustments.filter(a => a.adj_type === 'DEDUCTION' || a.adj_type === 'LOAN').reduce((acc, a) => acc + ((a.adj_type === 'LOAN' && Number(a.monthly_installment) > 0) ? Number(a.monthly_installment) : Number(a.amount || 0)), 0);
                  const netCalculated = Math.max(0, (base + allow + adds) - deds);

                  const isContractExpiring = emp.contract_end_date && new Date(emp.contract_end_date).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;

                  return (
                    <div key={emp.employee_id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition shadow-sm">
                      <div 
                        onClick={() => setExpandedEmpId(isExpanded ? null : emp.employee_id)}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
                            {emp.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={emp.avatar_url} alt={emp.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-white">{emp.full_name}</h3>
                              <span 
                                className="font-mono text-[11px] px-2 py-0.5 rounded border font-bold"
                                style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}30` }}
                              >
                                {emp.emp_code}
                              </span>

                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 font-sans">
                                🏢 {emp.branch_name || 'الموارد البشرية والرواتب'}
                              </span>

                              {isContractExpiring && (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded font-bold">
                                  قرب انتهاء العقد ({formatDateOnly(emp.contract_end_date)})
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{emp.job_title} • <span style={{ color: primaryCol }}>{emp.department}</span></p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono w-full md:w-auto mt-3 md:mt-0">
                          <div className="text-right flex-1 md:flex-none">
                            <span className="text-slate-500 block text-[10px] font-sans">الأساسي</span>
                            <span className="font-bold text-slate-200">{formatNum(emp.base_salary)}</span>
                          </div>
                          <div className="text-right flex-1 md:flex-none">
                            <span className="text-slate-500 block text-[10px] font-sans">البدلات</span>
                            <span className="font-bold text-slate-300">+{formatNum(emp.allowances)}</span>
                          </div>
                          <div className="text-right flex-1 md:flex-none">
                            <span className="text-slate-500 block text-[10px] font-sans">الإجازات</span>
                            <span className="font-bold text-sky-400">{emp.annual_leave_balance || 0}يوم</span>
                          </div>
                          <div className="text-right bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
                            <span className="text-emerald-400 block text-[10px] font-sans font-bold">الصافي</span>
                            <span className="font-black text-sm text-emerald-400">{formatNum(netCalculated)} د.ع</span>
                          </div>
                          <div className="p-1 text-slate-400 self-center">
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" style={{ color: primaryCol }} /> حركات شهر {currentMonthArabic} ({filterMonth})
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap text-xs">
                              {canEdit && (
                                <button
                                  onClick={() => openEditEmployeeModal(emp)}
                                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" /> تعديل الموظف
                                </button>
                              )}

                              {canEdit && (
                                <button
                                  onClick={() => openCvModal(emp)}
                                  className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                                >
                                  <BookOpen className="w-3 h-3" /> CV
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  await loadSettings();
                                  setCvPrintEmp(emp);
                                }}
                                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" /> طباعة CV
                              </button>
                              <button
                                onClick={() => {
                                  setCertificateDestination('إلى من يهمه الأمر');
                                  setTargetDestinationPrompt({ emp, net: netCalculated });
                                }}
                                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <FileCheck className="w-3.5 h-3.5" /> تأييد راتب
                              </button>

                              {canAdd && (
                                <>
                                  <button
                                    onClick={() => {
                                      setLeaveEmpId(emp.employee_id);
                                      setLeaveStartDate(`${filterMonth}-01`);
                                      const dt = new Date(`${filterMonth}-01`);
                                      dt.setDate(dt.getDate() + Math.max(0, parseInt(leaveDays || '1') - 1));
                                      setLeaveEndDate(dt.toISOString().substring(0, 10));
                                      setShowLeaveModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                                  >
                                    <Palmtree className="w-3.5 h-3.5" /> إجازة
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedEmpId(emp.employee_id);
                                      setAdjType('DEDUCTION');
                                      setShowAdjModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                                  >
                                    <Scissors className="w-3.5 h-3.5" /> خصم
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedEmpId(emp.employee_id);
                                      setAdjType('OVERTIME');
                                      setShowAdjModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5" /> إضافي
                                  </button>
                                </>
                              )}

                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteEmployee(emp)}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                                  title="حذف الموظف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                              <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                                <Palmtree className="w-3.5 h-3.5" /> إجازات شهر {currentMonthArabic} ({empLeaves.length})
                              </h4>
                              {empLeaves.length === 0 ? (
                                <p className="text-slate-500 text-[11px] py-3 text-center">لا توجد إجازات في هذا الشهر.</p>
                              ) : (
                                <div className="w-full overflow-x-auto pb-2">
                                  <table className="w-full min-w-[300px] text-xs text-right font-mono">
                                    <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                                      <tr>
                                        <th className="pb-1 whitespace-nowrap">النوع</th>
                                        <th className="pb-1 whitespace-nowrap">الأيام</th>
                                        <th className="pb-1 whitespace-nowrap">التاريخ</th>
                                        {canDelete && <th className="pb-1 text-center whitespace-nowrap">حذف</th>}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                      {empLeaves.map(l => {
                                        const rawType = String(l.leave_type || '').toUpperCase();
                                        const isUnpaid = rawType === 'UNPAID' || rawType.includes('بدون');
                                        const isSick = rawType === 'SICK' || rawType.includes('مرض');

                                        return (
                                          <tr key={l.leave_id}>
                                            <td className="py-1.5 font-sans whitespace-nowrap">
                                              {isUnpaid ? (
                                                <span className="text-rose-400 font-bold">بدون راتب</span>
                                              ) : isSick ? (
                                                <span className="text-amber-400 font-bold">مرضية معتمدة</span>
                                              ) : (
                                                <span className="text-sky-400 font-bold">اعتيادية</span>
                                              )}
                                            </td>
                                            <td className="py-1.5 text-white font-bold whitespace-nowrap">{l.days_count} يوم</td>
                                            <td className="py-1.5 text-slate-400 whitespace-nowrap">{formatDateOnly(l.start_date)}</td>
                                            {canDelete && (
                                              <td className="py-1.5 text-center whitespace-nowrap">
                                                <button onClick={() => handleDeleteLeave(l.leave_id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer">
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </td>
                                            )}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                <Scissors className="w-3.5 h-3.5" /> حركات شهر {currentMonthArabic} ({empAdjustments.length})
                              </h4>
                              {empAdjustments.length === 0 ? (
                                <p className="text-slate-500 text-[11px] py-3 text-center">لا توجد حركات في هذا الشهر.</p>
                              ) : (
                                <div className="w-full overflow-x-auto pb-2">
                                  <table className="w-full min-w-[300px] text-xs text-right font-mono">
                                    <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                                      <tr>
                                        <th className="pb-1 whitespace-nowrap">النوع</th>
                                        <th className="pb-1 whitespace-nowrap">المبلغ</th>
                                        <th className="pb-1 whitespace-nowrap">البيان</th>
                                        {canDelete && <th className="pb-1 text-center whitespace-nowrap">حذف</th>}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                      {empAdjustments.map(a => (
                                        <tr key={a.adj_id}>
                                          <td className="py-1.5 font-sans whitespace-nowrap">
                                            {a.adj_type === 'DEDUCTION' ? (
                                              <span className="text-rose-400 font-bold">قطع</span>
                                            ) : a.adj_type === 'OVERTIME' ? (
                                              <span className="text-emerald-400 font-bold">إضافي ({a.hours_count}س)</span>
                                            ) : a.adj_type === 'LOAN' ? (
                                              <span className="text-amber-400 font-bold">سلفة</span>
                                            ) : (
                                              <span className="text-sky-400 font-bold">مكافأة</span>
                                            )}
                                          </td>
                                          <td className="py-1.5 text-white font-bold whitespace-nowrap">
                                            {formatNum((a.adj_type === 'LOAN' && Number(a.monthly_installment) > 0) ? a.monthly_installment : a.amount)} د.ع
                                          </td>
                                          <td className="py-1.5 text-slate-300 font-sans leading-relaxed whitespace-nowrap max-w-[120px] truncate" title={a.reason}>{a.reason || '---'}</td>
                                          {canDelete && (
                                            <td className="py-1.5 text-center whitespace-nowrap">
                                              <button onClick={() => handleDeleteAdjustment(a.adj_id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer">
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 2. تبويب مسير الرواتب والبودرة A4 بالعرض (Landscape) */}
        {activeTab === 'PAYROLL_SHEET' && (
          <div className="max-w-7xl mx-auto mt-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 print:hidden shadow-md">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" style={{ color: primaryCol }} />
                  مسير رواتب شهر {currentMonthArabic} ({filterMonth}) — عرض أفقي معتمد (Landscape A4)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">جدول كامل ودقيق بجميع الاستحقاقات والخصومات مع سطر التفقيط والمصادقات</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                {canEdit && (
                  <>
                    <button
                      onClick={handleResetPayroll}
                      disabled={loading}
                      className="bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/30 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> تصفير وإرجاع البودرة
                    </button>

                    <button
                      onClick={handleProcessPayroll}
                      disabled={processingPayroll}
                      className="text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm whitespace-nowrap cursor-pointer"
                      style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      {processingPayroll ? 'جاري الترحيل...' : `اعتماد وترحيل رواتب شهر ${currentMonthArabic}`}
                    </button>
                  </>
                )}

                <button
                  onClick={handlePrintPayrollLandscape}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> طباعة البودرة (Landscape A4)
                </button>
              </div>
            </div>

            <div className="preview-scroll-container print:overflow-visible print:w-full print:max-w-none">
              <div className="print-landscape-sheet relative w-full bg-white text-slate-900 rounded-3xl p-6 md:p-8 border-2 shadow-2xl print:shadow-none space-y-4 font-sans flex flex-col justify-between overflow-hidden" style={{ borderColor: '#ea580c' }}>
                
                {/* علامة مائية ناعمة في خلفية البودرة */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] z-0 select-none">
                  {hasLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={companySettings.logo_url} alt="شعار الشركة" className="w-[480px] h-[480px] object-contain" />
                  ) : (
                    <Image src="/logo.png" alt="شركة البرج المتألق" width={480} height={480} className="object-contain" priority />
                  )}
                </div>

                <div className="relative z-10 space-y-3.5 flex-1">
                  
                  {/* ترويسة البودرة الرسمية */}
                  {hasLetterhead ? (
                    <div className="w-full border-b pb-2.5 mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={companySettings.letterhead_url} alt="ترويسة الشركة" className="w-full max-h-24 object-contain" />
                    </div>
                  ) : (
                    <div className="flex justify-between items-center border-b-2 pb-3" style={{ borderColor: primaryCol }}>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 relative flex items-center justify-center p-1 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                          {hasLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={companySettings.logo_url} alt={companySettings.company_name} className="w-full h-full object-contain" />
                          ) : (
                            <Image 
                              src="/logo.png" 
                              alt="شركة البرج المتألق" 
                              width={50} 
                              height={50} 
                              className="object-contain" 
                              priority 
                            />
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-900 leading-tight" style={{ color: primaryCol }}>{companySettings.company_name}</h2>
                          <p className="text-xs text-slate-700 font-bold">{companySettings.tagline}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{companySettings.address} • هاتف: {companySettings.phone_primary}</p>
                        </div>
                      </div>
                      <div className="text-left font-mono">
                        <span 
                          className="border px-3 py-1 font-black text-xs text-slate-950 rounded-lg inline-block shadow-xs"
                          style={{ backgroundColor: `${primaryCol}20`, borderColor: primaryCol }}
                        >
                          مسير رواتب الكوادر (بودرة)
                        </span>
                        <p className="text-[11.5px] text-slate-800 font-black mt-1 font-sans">شهر: {currentMonthArabic} ({filterMonth})</p>
                      </div>
                    </div>
                  )}

                  {/* شريط التوثيق الرسمي تحت الترويسة */}
                  <div className="flex items-center justify-between bg-slate-100/95 border border-slate-300 rounded-xl px-5 py-1.5 font-cairo shadow-xs text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-1.5" dir="rtl">
                      <span className="text-slate-600 font-black">العدد :</span>
                      <span className="font-mono text-slate-950 text-xs tracking-wider">
                        ر / {filterMonth} / 2026
                      </span>
                    </div>

                    <div className="flex items-center justify-center">
                      <span className="inline-flex items-center px-4 py-0.5 rounded-lg bg-white border border-[#ea580c]/60 text-slate-950 font-black text-xs shadow-xs">
                        {currentActiveBranchName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" dir="rtl">
                      <span className="text-slate-600 font-black">التاريخ :</span>
                      <span className="font-mono text-slate-950 text-xs tracking-wider">
                        {new Date().toISOString().substring(0, 10)}
                      </span>
                    </div>
                  </div>

                  {/* عنوان الوثيقة */}
                  <div className="text-center py-0.5">
                    <h3 className="text-base font-black text-slate-900 inline-block border-b-2 border-[#ea580c] pb-1 px-8">
                      كشف مسير الرواتب والأجور الشهرية المعتمد (بودرة) لشهر {currentMonthArabic} {filterMonth.split('-')[0]}
                    </h3>
                  </div>

                  {/* جدول البودرة العريض المتكامل بكافة الأعمدة بدون اقتطاع نصي أو قص أرقام */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden w-full overflow-x-auto pb-1 print:overflow-visible print:pb-0">
                    <table className="w-full text-right text-xs border-collapse font-cairo">
                      <thead className="bg-[#f4f4f5] text-slate-900 font-black border-b-2 border-slate-300 text-[11px]">
                        <tr>
                          <th className="p-1.5 text-center w-[3%] border-l border-slate-300">ت</th>
                          <th className="p-1.5 border-l border-slate-300 w-[15%]">اسم الموظف الثلاثي</th>
                          <th className="p-1.5 text-center border-l border-slate-300 w-[6%]">الرمز</th>
                          <th className="p-1.5 border-l border-slate-300 w-[14%]">المسمى الوظيفي والقسم</th>
                          <th className="p-1.5 text-center border-l border-slate-300 w-[9%] whitespace-nowrap">الأساسي (د.ع)</th>
                          <th className="p-1.5 text-center border-l border-slate-300 w-[8.5%] whitespace-nowrap">البدلات والحوافز</th>
                          <th className="p-1.5 text-center border-l border-slate-300 w-[6.5%] whitespace-nowrap">الإضافي</th>
                          <th className="p-1.5 text-center border-l border-slate-300 w-[9%] whitespace-nowrap bg-slate-200/50">إجمالي الاستحقاق</th>
                          <th className="p-1.5 text-center border-l border-slate-300 w-[8.5%] whitespace-nowrap text-rose-700">الاستقطاعات والسلف</th>
                          <th className="p-1.5 border-l border-slate-300 w-[13.5%]">بيان ومبرر الخصم</th>
                          <th className="p-1.5 text-center border-l border-slate-300 w-[10%] whitespace-nowrap bg-amber-500/10 font-black">صافي المستحق</th>
                          <th className="p-1 text-center print:hidden border-l border-slate-300 w-[50px]">إشعار</th>
                          <th className="p-1.5 text-center w-[8%]">التوقيع وبصمة الاستلام</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-sans text-xs">
                        {currentMonthRuns.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="text-center py-8 text-slate-500 text-xs font-sans">
                              البودرة غير مرحلة لشهر {currentMonthArabic} ({filterMonth}) حالياً. اضغط على زر <strong className="text-emerald-700">«اعتماد وترحيل رواتب شهر {currentMonthArabic}»</strong> في الأعلى لتنزيل المسير فوراً.
                            </td>
                          </tr>
                        ) : (
                          currentMonthRuns.map((run, idx) => {
                            const allowancesBonuses = Number(run.allowances || 0) + Number(run.bonuses || 0);
                            const overtimeAmt = Number(run.overtime_amount || 0);
                            const grossTotal = Number(run.base_salary || 0) + allowancesBonuses + overtimeAmt;
                            const totalDeducted = Number(run.loans_deducted || 0) + Number(run.penalties || 0);

                            return (
                              <tr key={run.run_id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-1.5 text-center font-mono font-bold text-slate-600 border-l border-slate-200">{idx + 1}</td>
                                <td className="p-1.5 font-bold text-slate-950 border-l border-slate-200 text-[11.5px] whitespace-nowrap">
                                  {run.full_name}
                                </td>
                                <td className="p-1.5 text-center font-mono font-bold text-slate-700 border-l border-slate-200 text-[10.5px] whitespace-nowrap">
                                  {run.emp_code}
                                </td>
                                <td className="p-1.5 text-slate-700 border-l border-slate-200 text-[10.5px] leading-tight">
                                  <span className="font-bold block text-slate-900">{run.job_title}</span>
                                  <span className="text-slate-500 text-[9.5px] block">{run.department}</span>
                                </td>
                                <td className="p-1.5 text-center font-mono text-slate-900 border-l border-slate-200 whitespace-nowrap">{formatNum(run.base_salary)}</td>
                                <td className="p-1.5 text-center font-mono text-emerald-700 font-bold border-l border-slate-200 whitespace-nowrap">
                                  +{formatNum(allowancesBonuses)}
                                </td>
                                <td className="p-1.5 text-center font-mono text-emerald-600 font-bold border-l border-slate-200 whitespace-nowrap">
                                  +{formatNum(overtimeAmt)}
                                </td>
                                <td className="p-1.5 text-center font-mono font-bold text-slate-900 border-l border-slate-200 whitespace-nowrap bg-slate-100/60">
                                  {formatNum(grossTotal)}
                                </td>
                                <td className="p-1.5 text-center font-mono text-rose-700 font-bold border-l border-slate-200 whitespace-nowrap">
                                  -{formatNum(totalDeducted)}
                                </td>
                                <td className="p-1.5 text-slate-800 text-[10px] print:text-[9.5px] leading-tight border-l border-slate-200 whitespace-normal break-words">
                                  {run.deduction_reasons || '---'}
                                </td>
                                <td className="p-1.5 text-center font-mono font-black text-slate-950 text-[11.5px] border-l border-slate-200 whitespace-nowrap bg-amber-500/10">
                                  {formatNum(run.net_salary)} <span className="text-[9px] font-sans font-normal text-slate-600">د.ع</span>
                                </td>
                                <td className="p-1 text-center print:hidden border-l border-slate-200 whitespace-nowrap">
                                  <button
                                    onClick={() => sendWhatsAppPayslip(run)}
                                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-300 transition inline-flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                                    title="إرسال إشعار الراتب عبر واتساب"
                                  >
                                    <Send className="w-3 h-3 text-emerald-600" /> واتساب
                                  </button>
                                </td>
                                <td className="p-1.5 text-center whitespace-nowrap">
                                  <div className="border-b border-dashed border-slate-400 w-16 mx-auto mt-2"></div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {currentMonthRuns.length > 0 && (
                        <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                          <tr>
                            <td colSpan={4} className="p-2 text-slate-950 font-black border-l border-slate-300 text-right text-xs print:text-[10.5px]">
                              المجموع الكلي لمسير شهر {currentMonthArabic} ({currentMonthRuns.length} موظف):
                            </td>
                            <td className="p-1.5 text-center font-mono border-l border-slate-300 whitespace-nowrap print:text-[10px]">{formatNum(sheetTotals.totalBase)}</td>
                            <td className="p-1.5 text-center font-mono text-emerald-700 border-l border-slate-300 whitespace-nowrap print:text-[10px]">+{formatNum(sheetTotals.totalAllowancesBonuses)}</td>
                            <td className="p-1.5 text-center font-mono text-emerald-600 border-l border-slate-300 whitespace-nowrap print:text-[10px]">+{formatNum(sheetTotals.totalOvertime)}</td>
                            <td className="p-1.5 text-center font-mono font-black text-slate-900 border-l border-slate-300 whitespace-nowrap bg-slate-200/60 print:text-[10px]">{formatNum(sheetTotals.totalGross)}</td>
                            <td className="p-1.5 text-center font-mono text-rose-700 border-l border-slate-300 whitespace-nowrap print:text-[10px]">-{formatNum(sheetTotals.totalDeductions)}</td>
                            <td className="p-1.5 border-l border-slate-300 text-center text-slate-500 font-sans text-[10px] print:text-[9px]">صافي بعد الحسميات</td>
                            <td className="p-1.5 text-center font-mono font-black text-xs border-l border-slate-300 whitespace-nowrap bg-amber-500/20 text-[#ea580c]">
                              {formatNum(sheetTotals.totalNet)} <span className="text-[9.5px] font-sans font-normal text-slate-950">د.ع</span>
                            </td>
                            <td className="print:hidden border-l border-slate-300"></td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* التفقيط والإقرار المالي المنظم */}
                  {currentMonthRuns.length > 0 && (
                    <div className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 space-y-1 font-cairo">
                      <div className="flex items-center justify-between font-bold border-b border-slate-200 pb-1">
                        <span>المجموع الكلي الصافي المصروف لكافة الموظفين كتابةً وتفقيطاً:</span>
                        <strong className="text-slate-950 font-black text-xs font-sans">{numberToArabicWords(sheetTotals.totalNet)}</strong>
                      </div>
                      <p className="text-[10.5px] text-slate-600 pt-0.5">
                        <strong>إقرار اللجنة المالية:</strong> نؤيد بصحة ودقة الاستحقاقات والاستقطاعات الموضحة أعلاه، وأن الصافي المبين يمثل الاستحقاق الفعلي للكوادر عن شهر {currentMonthArabic} {filterMonth.split('-')[0]} بعد تدقيق الحضور وساعات العمل والغياب والسلف أصولياً[cite: 23].
                      </p>
                    </div>
                  )}

                </div>

                {/* منطقة التواقيع والاعتماد الرباعية مع ختم الشركة والباركود الذكي */}
                <div className="mt-auto pt-2.5 border-t-2 border-slate-300">
                  <div className="grid grid-cols-5 gap-3 text-center text-xs items-end">
                    
                    <div>
                      <p className="font-bold text-slate-900 text-xs">إعداد وتنظيم الرواتب</p>
                      <span className="text-[9.5px] text-slate-500 block mb-2.5">مسؤول الموارد البشرية</span>
                      <div className="border-b-2 border-dashed border-slate-400 w-24 mx-auto"></div>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 text-xs">التدقيق المالي والحسابي</p>
                      <span className="text-[9.5px] text-slate-500 block mb-2.5">رئيس الحسابات</span>
                      <div className="border-b-2 border-dashed border-slate-400 w-24 mx-auto"></div>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 text-xs">اعتماد وتدقيق الإدارة</p>
                      <span className="text-[9.5px] text-slate-500 block mb-2.5">المدير المالي والإداري</span>
                      <div className="border-b-2 border-dashed border-slate-400 w-24 mx-auto"></div>
                    </div>

                    {/* ختم الشركة الدائري المعتمد */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-18 h-18 rounded-full border-2 border-dashed border-[#ea580c] flex flex-col items-center justify-center text-[#ea580c] font-black text-[9px] leading-tight rotate-[-6deg] bg-[#ea580c]/5 shadow-2xs">
                        <span>★ البرج المتألق ★</span>
                        <span className="text-[10px] font-extrabold my-0.5">مصادق رسمياً</span>
                        <span className="font-mono text-[8px]">{filterMonth}</span>
                      </div>
                      <p className="font-bold text-slate-900 text-[11px] mt-1">المدير المفوض</p>
                    </div>

                    {/* رمز QR للتحقق السحابي */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 border border-slate-300 rounded-xl p-0.5 bg-white shadow-2xs flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={qrCodePayrollUrl} 
                          alt="باركود التحقق الإلكتروني من مسير الرواتب" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="font-mono text-[8px] font-bold text-slate-600 mt-0.5">
                        DOC VERIFIED
                      </span>
                    </div>

                  </div>

                  <div className="border-t border-slate-200 pt-1.5 text-center text-[10px] text-slate-500 font-mono mt-2.5 flex items-center justify-between">
                    <span>{companySettings.company_name} - {currentActiveBranchName} • نظام الموارد البشرية والرواتب المركزي</span>
                    <span>تاريخ التقرير وطباعة البودرة: {new Date().toISOString().substring(0, 10)}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 3. تبويب سجل الحركات والإجازات */}
        {activeTab === 'LEDGER' && (
          <div className="max-w-7xl mx-auto mt-5 space-y-4 print:hidden">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" /> السجل العام لحركات وإجازات شهر {currentMonthArabic} ({filterMonth})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">متابعة كافة الخصومات، السلف المقسطة، وساعات الإضافي المسجلة للموظفين</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Palmtree className="w-4 h-4" /> سجل الإجازات ({filteredLeaves.length})
                </h4>
                <div className="w-full overflow-x-auto pb-2">
                  <table className="w-full min-w-[400px] text-xs text-right font-mono">
                    <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="pb-1 whitespace-nowrap">الموظف</th>
                        <th className="pb-1 whitespace-nowrap">النوع</th>
                        <th className="pb-1 whitespace-nowrap">الأيام</th>
                        <th className="pb-1 whitespace-nowrap">التاريخ</th>
                        {canDelete && <th className="pb-1 text-center whitespace-nowrap">حذف</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLeaves.length === 0 ? (
                        <tr><td colSpan={5} className="py-4 text-center text-slate-500 font-sans">لا توجد إجازات في هذا الشهر.</td></tr>
                      ) : (
                        filteredLeaves.map(l => {
                          const rawType = String(l.leave_type || '').toUpperCase();
                          const isUnpaid = rawType === 'UNPAID' || rawType.includes('بدون');
                          const isSick = rawType === 'SICK' || rawType.includes('مرض');

                          return (
                            <tr key={l.leave_id}>
                              <td className="py-2 font-sans font-bold text-slate-200 whitespace-nowrap">{l.full_name}</td>
                              <td className="py-2 font-sans whitespace-nowrap">
                                {isUnpaid ? (
                                  <span className="text-rose-400 font-bold">بدون راتب</span>
                                ) : isSick ? (
                                  <span className="text-amber-400 font-bold">مرضية معتمدة</span>
                                ) : (
                                  <span className="text-sky-400 font-bold">اعتيادية</span>
                                )}
                              </td>
                              <td className="py-2 text-white font-bold whitespace-nowrap">{l.days_count} يوم</td>
                              <td className="py-2 text-slate-400 whitespace-nowrap">{formatDateOnly(l.start_date)}</td>
                              {canDelete && (
                                <td className="py-2 text-center whitespace-nowrap">
                                  <button onClick={() => handleDeleteLeave(l.leave_id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Scissors className="w-4 h-4" /> سجل الحركات والسلف ({filteredAdjustments.length})
                </h4>
                <div className="w-full overflow-x-auto pb-2">
                  <table className="w-full min-w-[500px] text-xs text-right font-mono">
                    <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="pb-1 whitespace-nowrap">الموظف</th>
                        <th className="pb-1 whitespace-nowrap">النوع</th>
                        <th className="pb-1 whitespace-nowrap">المبلغ</th>
                        <th className="pb-1 whitespace-nowrap">البيان</th>
                        {canDelete && <th className="pb-1 text-center whitespace-nowrap">حذف</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredAdjustments.map(a => (
                        <tr key={a.adj_id}>
                          <td className="py-2 font-sans font-bold text-slate-200 whitespace-nowrap">{a.full_name}</td>
                          <td className="py-2 font-sans whitespace-nowrap">
                            {a.adj_type === 'DEDUCTION' ? (
                              <span className="text-rose-400 font-bold">قطع</span>
                            ) : a.adj_type === 'OVERTIME' ? (
                              <span className="text-emerald-400 font-bold">إضافي</span>
                            ) : a.adj_type === 'LOAN' ? (
                              <span className="text-amber-400 font-bold">سلفة</span>
                            ) : (
                              <span className="text-sky-400 font-bold">مكافأة</span>
                            )}
                          </td>
                          <td className="py-2 text-white font-bold whitespace-nowrap">
                            {formatNum((a.adj_type === 'LOAN' && Number(a.monthly_installment) > 0) ? a.monthly_installment : a.amount)} د.ع
                          </td>
                          <td className="py-2 text-slate-300 font-sans leading-relaxed whitespace-nowrap max-w-[150px] truncate" title={a.reason}>{a.reason || '---'}</td>
                          {canDelete && (
                            <td className="py-2 text-center whitespace-nowrap">
                              <button onClick={() => handleDeleteAdjustment(a.adj_id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. تبويب التقييمات والجزاءات */}
        {activeTab === 'APPRAISALS' && (
          <div className="max-w-7xl mx-auto mt-5 space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" /> سجل تقييمات الأداء والجزاءات الإدارية
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">توثيق مستويات الالتزام والتكريمات والإنذارات الرسمية</p>
              </div>
              {canAdd && (
                <button
                  onClick={() => setShowAppraisalModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> إضافة تقييم أو إنذار
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {penaltiesAppraisals.length === 0 ? (
                <div className="col-span-full bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
                  لا توجد سجلات تقييم أو إنذارات مسجلة.
                </div>
              ) : (
                penaltiesAppraisals.map((item) => (
                  <div key={item.record_id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                        item.record_type === 'APPRAISAL' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {item.record_type === 'APPRAISAL' ? 'تقييم أداء' : 'إنذار إداري'}
                      </span>
                      {canDelete && (
                        <button onClick={() => handleDeleteRecord(item.record_id)} className="text-slate-500 hover:text-rose-400 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      <p className="text-xs text-rose-400 mt-0.5">{item.full_name} ({item.emp_code})</p>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{item.details || 'لا توجد تفاصيل إضافية.'}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
                      <span>الدرجة: <strong className="text-amber-400">{item.rating_score} / 5</strong></span>
                      <span>{formatDateOnly(item.record_date)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* نافذة السؤال وتحديد جهة توجيه تأييد الراتب */}
        {targetDestinationPrompt && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-right space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4" style={{ color: primaryCol }} /> توجيه كتاب تأييد الراتب
                </h3>
                <button onClick={() => setTargetDestinationPrompt(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-300 font-semibold">إلى أي جهة ترغب بتوجيه كتاب التأييد؟</p>
                <p className="text-slate-500 text-[11px]">اكتب اسم الدائرة أو المصرف أو الجهة المعنية (أو اتركها كما هي):</p>
                <input
                  type="text"
                  value={certificateDestination}
                  onChange={(e) => setCertificateDestination(e.target.value)}
                  placeholder="مثال: مصرف الرشيد / فرع النجف..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none font-bold"
                  style={{ borderColor: primaryCol }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTargetDestinationPrompt(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await loadSettings();
                    setSalaryCertEmp({ ...targetDestinationPrompt.emp, net: targetDestinationPrompt.net });
                    setTargetDestinationPrompt(null);
                  }}
                  className="px-5 py-2 text-slate-950 font-bold rounded-xl text-xs shadow-md cursor-pointer whitespace-nowrap"
                  style={{ backgroundColor: primaryCol }}
                >
                  عرض وطباعة التأييد
                </button>
              </div>
            </div>
          </div>
        )}

        {/* مستند السيرة الذاتية والأرشيف للطباعة A4 */}
        {cvPrintEmp && (() => {
          const empBranchDisplay = resolveBranchName(cvPrintEmp.branch_id);

          return (
            <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-4 print:p-0 print:bg-white print:static print:overflow-visible print:block print:w-full">
              <div className="sticky top-0 z-50 w-full max-w-[210mm] flex flex-col sm:flex-row items-center justify-between bg-slate-900 border border-slate-700 p-3 sm:px-5 sm:py-3 rounded-2xl mb-4 print:hidden shadow-xl gap-3">
                <button 
                  onClick={() => window.print()} 
                  className="text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg w-full sm:w-auto whitespace-nowrap"
                  style={{ background: `linear-gradient(90deg, ${primaryCol}, ${secondaryCol})` }}
                >
                  <Printer className="w-4 h-4" /> طباعة السيرة الذاتية (A4)
                </button>
                <button onClick={() => setCvPrintEmp(null)} className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white p-2 rounded-xl transition border border-slate-700 cursor-pointer shrink-0 self-end sm:self-auto">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="preview-scroll-container pb-6 print:pb-0 print:overflow-visible print:w-full print:max-w-none">
                <div className="print-official-sheet w-full bg-white text-slate-900 rounded-2xl p-6 sm:p-8 md:p-10 border border-slate-200 shadow-2xl print:border-none print:shadow-none print:p-0 space-y-4 flex flex-col justify-between min-h-[1080px] max-h-[1115px] print:min-h-0">
                  
                  <div>
                    {hasLetterhead ? (
                      <div className="w-full border-b pb-3 mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={companySettings.letterhead_url} alt="ترويسة الشركة" className="w-full max-h-32 object-contain" />
                      </div>
                    ) : (
                      <div className="flex justify-between items-center border-b-2 pb-4" style={{ borderColor: primaryCol }}>
                        <div className="flex items-center gap-3.5">
                          <div className="w-16 h-16 relative flex items-center justify-center p-1 bg-slate-50 rounded-xl border border-slate-200">
                            {hasLogo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={companySettings.logo_url} alt={companySettings.company_name} className="w-full h-full object-contain" />
                            ) : (
                              <Image 
                                src="/logo.png" 
                                alt="شركة البرج المتألق" 
                                width={56} 
                                height={56} 
                                className="object-contain" 
                                priority 
                              />
                            )}
                          </div>
                          <div>
                            <h1 className="text-xl font-black" style={{ color: primaryCol }}>{companySettings.company_name}</h1>
                            <p className="text-xs text-slate-700 font-bold">{companySettings.tagline}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{companySettings.address}</p>
                          </div>
                        </div>
                        <div className="text-left font-mono hidden sm:block">
                          <div 
                            className="border-2 px-3 py-1 font-black text-xs uppercase text-slate-950 rounded-lg inline-block"
                            style={{ backgroundColor: `${primaryCol}20`, borderColor: primaryCol }}
                          >
                            السيرة الذاتية الرسمية
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between bg-slate-100/90 border border-slate-300 rounded-xl px-4 py-2 font-cairo shadow-xs text-xs font-bold text-slate-800 mt-2">
                      <div className="flex items-center gap-1.5" dir="rtl">
                        <span className="text-slate-500 font-bold">العدد :</span>
                        <span className="font-mono text-slate-950 text-sm tracking-wide">
                          ذ/ {cvPrintEmp.emp_code} / 2026
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center px-4 py-1 rounded-lg bg-white border border-amber-600/60 text-slate-950 font-black text-xs shadow-xs">
                          {empBranchDisplay}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5" dir="rtl">
                        <span className="text-slate-500 font-bold">التاريخ :</span>
                        <span className="font-mono text-slate-950 text-sm tracking-wider">
                          {new Date().toISOString().substring(0, 10)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 border border-slate-200 p-5 rounded-2xl mt-4">
                      <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-300 bg-slate-200 flex items-center justify-center shrink-0">
                        {cvPrintEmp.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cvPrintEmp.avatar_url} alt={cvPrintEmp.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-right space-y-1 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h2 className="text-lg font-black text-slate-950">{cvPrintEmp.full_name}</h2>
                          <span 
                            className="font-mono text-xs font-bold px-2 py-0.5 rounded border inline-block w-max mx-auto sm:mx-0"
                            style={{ backgroundColor: `${primaryCol}15`, color: primaryCol, borderColor: `${primaryCol}30` }}
                          >
                            {cvPrintEmp.emp_code}
                          </span>
                        </div>
                        <p className="text-xs font-bold" style={{ color: primaryCol }}>{cvPrintEmp.job_title} - <span className="text-slate-700">{cvPrintEmp.department}</span></p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs text-slate-600 font-mono">
                          <div>الهاتف: <strong className="text-slate-900 font-sans">{cvPrintEmp.phone || 'غير مسجل'}</strong></div>
                          <div>تاريخ التعيين: <strong className="text-slate-900">{formatDateOnly(cvPrintEmp.hire_date)}</strong></div>
                          <div>الحالة: <strong className="text-emerald-700 font-sans">على رأس العمل ✓</strong></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs leading-relaxed mt-4">
                      <div className="border border-slate-200 p-4 rounded-xl bg-white space-y-1.5 text-right">
                        <h3 className="font-bold text-slate-950 flex items-center gap-1.5 text-sm">
                          <User className="w-4 h-4" style={{ color: primaryCol }} /> النبذة المهنية الموجزة
                        </h3>
                        <p className="text-slate-800 font-sans text-xs leading-relaxed whitespace-pre-line">
                          {cvPrintEmp.cv_data?.bio ? cvPrintEmp.cv_data.bio : 'لا توجد نبذة مهنية مسجلة حتى الآن.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="border border-slate-200 p-3.5 rounded-xl bg-white space-y-1">
                          <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-sky-600" /> المؤهل العلمي
                          </h3>
                          <p className="text-slate-700 font-bold">{cvPrintEmp.cv_data?.education || 'مؤهل أكاديمي معتمد'}</p>
                        </div>
                        <div className="border border-slate-200 p-3.5 rounded-xl bg-white space-y-1">
                          <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-amber-600" /> سنوات الخبرة
                          </h3>
                          <p className="text-slate-700 font-bold">{cvPrintEmp.cv_data?.experienceYears || 'خبرة عملية موثقة'}</p>
                        </div>
                      </div>

                      <div className="border border-slate-200 p-3.5 rounded-xl bg-white space-y-1">
                        <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-emerald-600" /> المهارات والاختصاصات
                        </h3>
                        <p className="text-slate-700 font-bold">{cvPrintEmp.cv_data?.skills || 'الالتزام ببرامج العمل، الكفاءة في تنفيذ المهام، والعمل الجماعي.'}</p>
                      </div>

                      <div className="border border-slate-200 p-3.5 rounded-xl bg-white space-y-2">
                        <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5" style={{ color: primaryCol }} /> المستمسكات والشهادات الرسمية
                        </h3>
                        {cvPrintEmp.cv_data?.documents && cvPrintEmp.cv_data.documents.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
                            {cvPrintEmp.cv_data.documents.map((d: any, idx: number) => (
                              <div key={idx} className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px] flex items-center justify-between">
                                <span className="font-bold text-slate-900 font-sans truncate pr-1">{d.title}</span>
                                <span className="text-emerald-700 font-bold whitespace-nowrap">مؤرشف ✓</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-[11px]">مستمسكات الموظف محفوظة في الملف الإداري المركزي.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-6 text-center border-t border-slate-200 text-xs mt-6">
                    <div>
                      <p className="font-bold text-slate-700">مسؤول شؤون الموظفين</p>
                      <div className="border-b border-dashed border-slate-400 w-28 mx-auto mt-6"></div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">مصادقة إدارة الشركة / الختم</p>
                      <div className="border-b border-dashed border-slate-400 w-28 mx-auto mt-6"></div>
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