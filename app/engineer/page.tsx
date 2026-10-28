'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  ClipboardList, 
  Package, 
  Coins, 
  TrendingUp,
  Paperclip,
  LogOut,
  MapPin,
  Calculator
} from 'lucide-react';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

export default function EngineerDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState<any>({});
  
  const [activeTab, setActiveTab] = useState<'LOGS' | 'MATERIALS' | 'SUBS' | 'EXPENSES' | 'MILESTONES' | 'DOCS'>('LOGS');

  const [logDate, setLogDate] = useState('');
  const [logWorkers, setLogWorkers] = useState('');
  const [logWeather, setLogWeather] = useState('صحو');
  const [logNotes, setLogNotes] = useState('');

  const [matName, setMatName] = useState('');
  const [matUnit, setMatUnit] = useState('طن');
  const [matSupplier, setMatSupplier] = useState('');
  const [matRec, setMatRec] = useState('');
  const [matPrice, setMatPrice] = useState('');

  const [subName, setSubName] = useState('');
  const [subTrade, setSubTrade] = useState('أعمال بناء');
  const [subValue, setSubValue] = useState('');
  const [subNotes, setSubNotes] = useState('');

  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('نقل وآليات');
  const [expAmount, setExpAmount] = useState('');
  const [expNotes, setExpNotes] = useState('');

  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');

  useEffect(() => {
    setMounted(true);
    setLogDate(new Date().toISOString().split('T')[0]);

    const savedUser = localStorage.getItem('erp_user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    
    try {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      loadSettings();
      loadEngineerProjects(user);
    } catch {
      router.push('/login');
    }
  }, [router]);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data?.settings) setCompanySettings(data.settings);
      }
    } catch (e) {}
  };

  const loadEngineerProjects = async (user: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.projects) {
          const ongoing = data.projects.filter((p: any) => p.status !== 'COMPLETED');

          setProjects(ongoing);
          if (ongoing.length > 0 && !activeProjectId) {
            setActiveProjectId(ongoing[0].project_id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeProject = useMemo(() => projects.find(p => p.project_id === activeProjectId) || null, [projects, activeProjectId]);
  const handleLogout = () => { localStorage.removeItem('erp_user'); router.push('/login'); };
  const refreshData = () => { if (currentUser) loadEngineerProjects(currentUser); };

  const handleAddSiteLog = async (e: React.FormEvent) => {
    e.preventDefault(); if (!logNotes || !activeProject) return;
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ADD_SITE_LOG', project_id: activeProject.project_id, log_date: logDate, workers_count: Number(logWorkers) || 0, weather: logWeather, notes: logNotes }) });
    setLogNotes(''); setLogWorkers(''); refreshData();
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault(); if (!matName || !activeProject) return;
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ADD_MATERIAL', project_id: activeProject.project_id, material_name: matName.trim(), unit: matUnit, quantity_required: Number(matRec), quantity_received: Number(matRec), unit_price: Number(matPrice), supplier_name: matSupplier.trim() || 'عام' }) });
    setMatName(''); setMatRec(''); setMatPrice(''); refreshData();
  };

  const handleAddSubcontractor = async (e: React.FormEvent) => {
    e.preventDefault(); if (!subName || !activeProject) return;
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ADD_SUBCONTRACTOR', project_id: activeProject.project_id, name: subName.trim(), trade: subTrade, contract_value: Number(subValue), paid_amount: 0, notes: subNotes }) });
    setSubName(''); setSubValue(''); refreshData();
  };

  const handleAddOperatingExpense = async (e: React.FormEvent) => {
    e.preventDefault(); if (!expTitle || !activeProject) return;
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ADD_OPERATING_EXPENSE', project_id: activeProject.project_id, title: expTitle.trim(), category: expCategory, amount: Number(expAmount), notes: expNotes }) });
    setExpTitle(''); setExpAmount(''); refreshData();
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault(); if (!docTitle || !docUrl || !activeProject) return;
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ADD_DOCUMENT', project_id: activeProject.project_id, title: docTitle, file_url: docUrl }) });
    setDocTitle(''); setDocUrl(''); refreshData();
  };

  const handleUpdateMilestone = async (milestoneId: string, percentage: number) => {
    await fetch('/api/projects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'UPDATE_MILESTONE_PROGRESS', milestone_id: milestoneId, completion_percentage: percentage }) });
    refreshData();
  };

  if (!mounted || !currentUser) return null;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 font-cairo pb-20">
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30">
              <User className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{currentUser.full_name}</p>
              <p className="text-[10px] text-amber-400">المهندس الميداني</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition cursor-pointer">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {projects.length > 0 && (
          <select value={activeProjectId} onChange={(e) => setActiveProjectId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-amber-400 text-sm font-bold rounded-xl p-3 outline-none cursor-pointer">
            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 animate-pulse">جاري تحميل بيانات الموقع...</div>
      ) : !activeProject ? (
        <div className="p-8 text-center text-slate-400">لا توجد مشاريع مسندة إليك حالياً.</div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-black text-lg text-white">{activeProject.project_name}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {activeProject.location}
                </p>
              </div>
              <div className="text-left">
                <span className="text-emerald-400 font-bold text-xl block">{activeProject.completion_rate}%</span>
                <span className="text-[9px] text-slate-500">الإنجاز الكلي</span>
              </div>
            </div>
            <button 
              onClick={() => {
                if (activeProject && activeProject.project_id) {
                  window.open(`/verify?type=project&no=${activeProject.project_id}`, '_blank');
                }
              }} 
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
            >
              <Calculator className="w-5 h-5" /> استعراض صفحة التحقق والموقف المالي للمشروع
            </button>
          </div>

          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            <button onClick={() => setActiveTab('LOGS')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === 'LOGS' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>يوميات الموقع</button>
            <button onClick={() => setActiveTab('MATERIALS')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === 'MATERIALS' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>المواد والتوريد</button>
            <button onClick={() => setActiveTab('SUBS')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === 'SUBS' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>مقاولو الباطن</button>
            <button onClick={() => setActiveTab('EXPENSES')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === 'EXPENSES' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>مصاريف تشغيلية</button>
            <button onClick={() => setActiveTab('MILESTONES')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === 'MILESTONES' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>مراحل التنفيذ</button>
          </div>

          {/* تبويب يوميات الموقع والسجلات السابقة */}
          {activeTab === 'LOGS' && (
            <div className="space-y-4">
              <form onSubmit={handleAddSiteLog} className="bg-slate-900 border border-slate-700 p-4 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-amber-400 mb-2">إضافة تقرير يومي</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white" required />
                  <input type="number" placeholder="عدد العمال" value={logWorkers} onChange={(e) => setLogWorkers(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white" required />
                </div>
                <select value={logWeather} onChange={(e) => setLogWeather(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white cursor-pointer">
                  <option value="صحو">صحو</option><option value="ممطر">ممطر</option><option value="عاصف">عاصف / ترابي</option>
                </select>
                <textarea placeholder="الأعمال المنجزة والملاحظات..." value={logNotes} onChange={(e) => setLogNotes(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white h-20" required />
                <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold py-2.5 rounded-lg text-xs cursor-pointer">حفظ التقرير</button>
              </form>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400">السجلات والتقارير اليومية السابقة:</h4>
                {activeProject.site_logs && activeProject.site_logs.length > 0 ? (
                  activeProject.site_logs.map((log: any) => (
                    <div key={log.log_id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2 text-xs shadow">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 text-amber-400 font-bold">
                        <span>📅 {String(log.log_date).split('T')[0]}</span>
                        <span className="text-slate-400 font-mono">العمال: {log.workers_count} | الطقس: {log.weather}</span>
                      </div>
                      <p className="text-slate-200 whitespace-pre-line leading-relaxed">{log.notes}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 text-xs py-4">لا توجد تقارير يومية سجّلت بعد.</p>
                )}
              </div>
            </div>
          )}

          {/* تبويب المواد والتوريدات والسجلات السابقة */}
          {activeTab === 'MATERIALS' && (
            <div className="space-y-4">
              <form onSubmit={handleAddMaterial} className="bg-slate-900 border border-slate-700 p-4 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-sky-400 mb-2">تسجيل استلام مواد</h3>
                <input type="text" placeholder="اسم المادة (مثال: سمنت)" value={matName} onChange={(e) => setMatName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white" required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="الكمية المستلمة" value={matRec} onChange={(e) => setMatRec(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white" required />
                  <input type="text" placeholder="الوحدة (طن، متر...)" value={matUnit} onChange={(e) => setMatUnit(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white" required />
                </div>
                <input type="number" placeholder="سعر الوحدة الافرادي" value={matPrice} onChange={(e) => setMatPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white" required />
                <button type="submit" className="w-full bg-sky-500 text-slate-950 font-bold py-2.5 rounded-lg text-xs cursor-pointer">تسجيل التوريد</button>
              </form>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400">سجلات المواد والتوريدات السابقة:</h4>
                {activeProject.materials && activeProject.materials.length > 0 ? (
                  activeProject.materials.map((mat: any, idx: number) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white text-sm">{mat.material_name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">المورد: {mat.supplier_name || 'عام'}</p>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-emerald-400 font-bold text-sm block">{mat.quantity_received} {mat.unit}</span>
                        <span className="text-[10px] text-slate-400">السعر: {Number(mat.unit_price || 0).toLocaleString()} د.ع</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 text-xs py-4">لا توجد مواد مسجلة سابقة.</p>
                )}
              </div>
            </div>
          )}

          {/* تبويب مقاولي الباطن والسجلات السابقة */}
          {activeTab === 'SUBS' && (
            <div className="space-y-4">
              <form onSubmit={handleAddSubcontractor} className="bg-slate-900 border border-slate-700 p-4 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-emerald-400 mb-2">إضافة مقاول باطن</h3>
                <input type="text" placeholder="اسم المقاول" value={subName} onChange={(e) => setSubName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white" required />
                <input type="text" placeholder="نوع العمل (بناء، سيراميك...)" value={subTrade} onChange={(e) => setSubTrade(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white" required />
                <input type="number" placeholder="قيمة العقد" value={subValue} onChange={(e) => setSubValue(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white" required />
                <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-lg text-xs cursor-pointer">حفظ المقاول</button>
              </form>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400">عقود مقاولي الباطن السابقة:</h4>
                {activeProject.subcontractors && activeProject.subcontractors.length > 0 ? (
                  activeProject.subcontractors.map((sub: any, idx: number) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white text-sm">{sub.name}</p>
                        <p className="text-[10px] text-amber-300 mt-0.5">التخصص: {sub.trade}</p>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-amber-400 font-bold text-sm block">{Number(sub.total_contract || sub.contract_value || 0).toLocaleString()} د.ع</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 text-xs py-4">لا توجد عقود مقاولي باطن مسجلة سابقة.</p>
                )}
              </div>
            </div>
          )}

          {/* تبويب المصاريف التشغيلية والسجلات السابقة */}
          {activeTab === 'EXPENSES' && (
            <div className="space-y-4">
              <form onSubmit={handleAddOperatingExpense} className="bg-slate-900 border border-slate-700 p-4 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-rose-400 mb-2">إضافة مصروف تشغيلي</h3>
                <input type="text" placeholder="البند (إيجار آلية، نثرية...)" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white" required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="التصنيف" value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white" required />
                  <input type="number" placeholder="المبلغ (د.ع)" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono" required />
                </div>
                <button type="submit" className="w-full bg-rose-500 text-slate-950 font-bold py-2.5 rounded-lg text-xs cursor-pointer">حفظ المصروف</button>
              </form>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400">سجلات المصاريف التشغيلية السابقة:</h4>
                {activeProject.operating_expenses && activeProject.operating_expenses.length > 0 ? (
                  activeProject.operating_expenses.map((exp: any, idx: number) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white text-sm">{exp.title}</p>
                        <p className="text-[10px] text-rose-300 mt-0.5">التصنيف: {exp.category}</p>
                      </div>
                      <div className="text-left font-mono font-bold text-rose-400 text-sm">
                        {Number(exp.amount || 0).toLocaleString()} د.ع
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 text-xs py-4">لا توجد مصاريف تشغيلية مسجلة سابقة.</p>
                )}
              </div>
            </div>
          )}

          {/* تبويب مراحل التنفيذ */}
          {activeTab === 'MILESTONES' && (
            <div className="space-y-4">
              {activeProject.milestones?.map((m: any) => (
                <div key={m.milestone_id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <p className="font-bold text-white">{m.name}</p>
                    <span className="font-mono text-amber-400 font-bold">{m.completion_percentage}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={m.completion_percentage} onChange={(e) => handleUpdateMilestone(m.milestone_id, Number(e.target.value))} className="w-full accent-amber-500 cursor-pointer" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}