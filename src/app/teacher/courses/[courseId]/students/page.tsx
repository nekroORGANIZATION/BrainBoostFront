'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import http, { setAuthHeader } from '@/lib/http';
import {
  UserPlus, Users, Search, Download, Upload, Loader2, Mail, CheckCircle2, XCircle,
  ChevronLeft, ArrowLeftRight, Filter, Trash2, Eye, BarChart3, Shield, RefreshCcw,
  MoreHorizontal, Sparkles, AlertTriangle
} from 'lucide-react';

/* ===================== endpoints (підігнати під свій бек) ===================== */
const API_LIST = (courseId:number)=> `/course/admin/courses/${courseId}/students/`;                  // GET
const API_INVITE = (courseId:number)=> `/course/admin/courses/${courseId}/students/invite/`;         // POST {email}
const API_DELETE = (courseId:number, enrollmentId:number)=> `/course/admin/courses/${courseId}/students/${enrollmentId}/`; // DELETE
const API_EXPORT = (courseId:number)=> `/course/admin/courses/${courseId}/students/export/`;         // (optional) GET csv

/* ===================== types ===================== */
type EnrollmentStatus = 'active'|'invited'|'completed'|'blocked';
type StudentRow = {
  id: number;                        // enrollment id
  user_id: number;
  full_name: string;
  email: string;
  status: EnrollmentStatus;
  progress_pct?: number;             // 0..100
  avg_score?: number | null;         // 0..100
  attempts_total?: number;
  last_seen?: string | null;
};

type ListResp = {
  count: number;
  next?: string|null;
  previous?: string|null;
  results: StudentRow[];
};

/* ===================== helpers ===================== */
function asArray<T=any>(raw:any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw?.results && Array.isArray(raw.results)) return raw.results as T[];
  return [];
}
function prettyError(e:any){
  const d = e?.response?.data; const s = e?.response?.status;
  if (typeof d === 'string') return d;
  if (!d) return e?.message || 'Сталася помилка.';
  if (d.detail) return String(d.detail);
  try { return Object.entries(d).map(([k,v])=> Array.isArray(v)? `${k}: ${v.join(', ')}`: `${k}: ${JSON.stringify(v)}`).join('\n'); }
  catch{ return s?`HTTP ${s}`:'Сталася помилка.'; }
}
function toCSV(rows: StudentRow[]): string {
  const head = ['id','user_id','full_name','email','status','progress_pct','avg_score','attempts_total','last_seen'];
  const esc = (v:any)=> `"${String(v??'').replace(/"/g,'""')}"`;
  const body = rows.map(r => [r.id,r.user_id,r.full_name,r.email,r.status,r.progress_pct??'',r.avg_score??'',r.attempts_total??'',r.last_seen??''].map(esc).join(','));
  return [head.join(','), ...body].join('\n');
}
function download(filename:string, content:string, type='text/csv;charset=utf-8'){
  const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

/* ===================== page ===================== */
export default function StudentsPage(){
  const params = useParams() as { courseId?: string|string[] };
  const courseId = Number(Array.isArray(params.courseId)? params.courseId[0] : params.courseId);
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState<string|null>(null);

  // list state
  const [items, setItems] = useState<StudentRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<''|EnrollmentStatus>('');
  const [ordering, setOrdering] = useState<'name'|'progress'|'last'|'score'>('name');

  // selection for bulk actions
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const fileRef = useRef<HTMLInputElement|null>(null);

  useEffect(()=>{ if(accessToken) setAuthHeader(accessToken); }, [accessToken]);

  // fetch list
  useEffect(()=>{
    if (!courseId || !accessToken) return;
    (async()=>{
      try{
        setLoading(true); setErr(null);
        const r = await http.get(API_LIST(courseId), {
          params: {
            page, page_size: pageSize,
            search: (search||undefined),
            status: (status||undefined),
            ordering: (
              ordering === 'name' ? 'full_name'
              : ordering === 'progress' ? '-progress_pct'
              : ordering === 'score' ? '-avg_score'
              : '-last_seen'
            )
          }
        });
        const data: ListResp = r.data?.results ? r.data : { count: r.data?.count ?? asArray(r.data).length, results: asArray(r.data) };
        setItems(data.results || []);
        setCount(data.count || (data.results?.length ?? 0));
        setSelected(new Set());
      }catch(e:any){
        setErr(prettyError(e));
      }finally{
        setLoading(false);
      }
    })();
  }, [courseId, accessToken, page, pageSize, search, status, ordering]);

  const pages = Math.max(1, Math.ceil(count / pageSize));
  const allSelected = items.length>0 && items.every(i => selected.has(i.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map(i=>i.id)));
  };
  const toggleOne = (id:number) => {
    const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); setSelected(next);
  };

  async function inviteOne(email:string){
    if (!email.trim()) return;
    try{
      setBusy(true); setErr(null); setOk(null);
      await http.post(API_INVITE(courseId), { email: email.trim() });
      setOk(`Запрошення надіслано: ${email.trim()}`);
      setInviteEmail('');
      setShowInvite(false);
      // refresh
      setPage(1);
    }catch(e:any){ setErr(prettyError(e)); }
    finally{ setBusy(false); }
  }

  async function bulkDelete(){
    if (!selected.size) return;
    if (!confirm(`Видалити ${selected.size} запис(ів) зі списку студентів?`)) return;
    try{
      setBusy(true); setErr(null); setOk(null);
      for (const id of selected){
        await http.delete(API_DELETE(courseId, id)).catch(()=>{ /* не валимо весь процес */ });
      }
      setOk(`Видалено: ${selected.size}`);
      setPage(1);
    }catch(e:any){ setErr(prettyError(e)); }
    finally{ setBusy(false); }
  }

  async function exportCsv(){
    try{
      setBusy(true); setErr(null); setOk(null);
      // Якщо є серверний експорт — спробувати його
      try{
        const r = await http.get(API_EXPORT(courseId), { responseType: 'blob' });
        const blob = new Blob([r.data], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = `students_${courseId}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        setBusy(false); return;
      }catch{ /* fallback нижче */ }
      // fallback — генеруємо самі з поточного набору (краще робити запит без пагінації)
      const csv = toCSV(items);
      download(`students_page${page}.csv`, csv);
      setOk('Експортовано CSV (поточна сторінка).');
    }catch(e:any){ setErr(prettyError(e)); }
    finally{ setBusy(false); }
  }

  function importCsvLocal(file: File){
    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result || '');
      const emails = Array.from(new Set(
        text.split(/[\n,;\t]+/g).map(s=>s.trim()).filter(s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
      ));
      if (!emails.length){ setErr('У CSV не знайдено валідних email.'); return; }
      if (!confirm(`Надіслати ${emails.length} запрошень?`)) return;
      setBusy(true); setErr(null); setOk(null);
      try{
        for (const em of emails){
          await http.post(API_INVITE(courseId), { email: em }).catch(()=>{ /* пропускаємо падіння одиночного інвайту */ });
        }
        setOk(`Надіслано запрошень: ${emails.length}`);
        setPage(1);
      }catch(e:any){ setErr(prettyError(e)); }
      finally{ setBusy(false); }
    };
    reader.readAsText(file);
  }

  /* ===================== UI ===================== */
  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pt-20 pb-24">

        {/* Header */}
        <div className="rounded-[24px] bg-white/90 ring-1 ring-[#E5ECFF] p-4 md:p-6 shadow-[0_10px_30px_rgba(2,28,78,0.10)] sticky top-16 z-10 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-slate-600">
                <Link href={`/teacher/courses/${courseId}/builder/overview`} className="text-indigo-600 hover:underline">Builder</Link>
                <span> / Студенти</span>
              </div>
              <h1 className="text-[26px] md:text-[32px] font-extrabold text-[#021C4E] leading-tight mt-1">
                Студенти курсу
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {ok && <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">{ok}</span>}
                {err && <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 whitespace-pre-wrap">{err}</span>}
                {busy && <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Обробка…</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/teacher/courses/${courseId}/builder/overview`} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2">
                <ChevronLeft className="w-4 h-4"/> До Hub
              </Link>
              <button onClick={()=>setShowInvite(true)} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm inline-flex items-center gap-2">
                <UserPlus className="w-4 h-4"/> Запросити
              </button>
              <button onClick={exportCsv} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2">
                <Download className="w-4 h-4"/> Експорт CSV
              </button>
              <label className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4"/> Імпорт CSV
                <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e)=>{ const f=e.target.files?.[0]; if (f) importCsvLocal(f); if (fileRef.current) fileRef.current.value=''; }} />
              </label>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4 shadow-[0_8px_22px_rgba(2,28,78,0.08)]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_160px] gap-3">
            <div className="flex items-center gap-2 ring-1 ring-[#E5ECFF] rounded-xl bg-white px-3 py-2">
              <Search className="w-4 h-4 text-slate-500"/>
              <input
                value={search}
                onChange={(e)=>{ setSearch(e.target.value); setPage(1); }}
                placeholder="Пошук за іменем або email…"
                className="flex-1 outline-none bg-transparent"
              />
              {search && (
                <button onClick={()=>{ setSearch(''); setPage(1); }} className="text-slate-500 hover:text-slate-700">×</button>
              )}
            </div>
            <select
              value={status}
              onChange={(e)=>{ setStatus((e.target.value || '') as any); setPage(1); }}
              className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white"
            >
              <option value="">Статус: всі</option>
              <option value="active">Активні</option>
              <option value="invited">Запрошені</option>
              <option value="completed">Завершили</option>
              <option value="blocked">Заблоковані</option>
            </select>
            <select
              value={ordering}
              onChange={(e)=> setOrdering(e.target.value as any)}
              className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white"
            >
              <option value="name">Сортувати: Імʼя</option>
              <option value="progress">Сортувати: Прогрес</option>
              <option value="score">Сортувати: Оцінка</option>
              <option value="last">Сортувати: Активність</option>
            </select>
          </div>

          {/* Bulk actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-600">Знайдено: <b>{count}</b></span>
            {selected.size>0 && (
              <>
                <span className="text-sm text-slate-600">Вибрано: <b>{selected.size}</b></span>
                <button onClick={bulkDelete} className="px-3 py-1.5 rounded-xl ring-1 ring-red-200 text-red-700 bg-white inline-flex items-center gap-2">
                  <Trash2 className="w-4 h-4"/> Видалити вибрані
                </button>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-0 overflow-hidden shadow-[0_12px_34px_rgba(2,28,78,0.10)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F7FAFF] text-[#0F2E64]">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}/>
                  </th>
                  <th className="p-3 text-left">Студент</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Статус</th>
                  <th className="p-3 text-left">Прогрес</th>
                  <th className="p-3 text-left">Середній бал</th>
                  <th className="p-3 text-left">Спроб</th>
                  <th className="p-3 text-left">Остання активність</th>
                  <th className="p-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({length:6}).map((_,i)=>(
                    <tr key={i} className="border-t border-[#E5ECFF]">
                      <td className="p-3"><div className="h-4 w-4 bg-slate-100 rounded animate-pulse"/></td>
                      <td className="p-3"><div className="h-4 w-40 bg-slate-100 rounded animate-pulse"/></td>
                      <td className="p-3"><div className="h-4 w-48 bg-slate-100 rounded animate-pulse"/></td>
                      <td className="p-3"><div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse"/></td>
                      <td className="p-3"><div className="h-2 w-40 bg-slate-100 rounded animate-pulse"/></td>
                      <td className="p-3"><div className="h-4 w-16 bg-slate-100 rounded animate-pulse"/></td>
                      <td className="p-3"><div className="h-4 w-10 bg-slate-100 rounded animate-pulse"/></td>
                      <td className="p-3"><div className="h-4 w-28 bg-slate-100 rounded animate-pulse"/></td>
                      <td className="p-3"></td>
                    </tr>
                  ))
                ) : items.length ? (
                  items.map(row=>(
                    <tr key={row.id} className="border-t border-[#E5ECFF] hover:bg-indigo-50/30 transition-colors">
                      <td className="p-3 text-center">
                        <input type="checkbox" checked={selected.has(row.id)} onChange={()=>toggleOne(row.id)}/>
                      </td>
                      <td className="p-3 font-medium text-[#0F2E64]">{row.full_name || '—'}</td>
                      <td className="p-3 text-slate-600">{row.email}</td>
                      <td className="p-3">
                        <StatusBadge status={row.status}/>
                      </td>
                      <td className="p-3">
                        <ProgressBar value={Math.round(row.progress_pct ?? 0)}/>
                      </td>
                      <td className="p-3">{row.avg_score!=null ? `${Math.round(row.avg_score)}%` : '—'}</td>
                      <td className="p-3">{row.attempts_total ?? 0}</td>
                      <td className="p-3 text-slate-500">{row.last_seen ? new Date(row.last_seen).toLocaleString('uk-UA') : '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/teacher/courses/${courseId}/builder/assessments/attempts?user=${row.user_id}`} className="px-2 py-1 rounded-lg ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-1 text-xs">
                            <BarChart3 className="w-4 h-4"/> Cпроби
                          </Link>
                          <button title="Видалити" onClick={async()=>{ if(!confirm(`Видалити ${row.full_name || row.email}?`)) return; try{ await http.delete(API_DELETE(courseId, row.id)); setItems(prev=>prev.filter(x=>x.id!==row.id)); setCount(c=>Math.max(0,c-1)); }catch(e:any){ setErr(prettyError(e)); } }} className="px-2 py-1 rounded-lg ring-1 ring-red-200 text-red-700 bg-white inline-flex items-center gap-1 text-xs">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-500">
                      Немає студентів. <button onClick={()=>setShowInvite(true)} className="text-indigo-600 underline inline-flex items-center gap-1"><UserPlus className="w-4 h-4"/> запросити перших</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer: pagination */}
          <div className="px-4 py-3 border-t border-[#E5ECFF] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-slate-600">Сторінка <b>{page}</b> з <b>{pages}</b> • Всього <b>{count}</b></div>
            <div className="flex items-center gap-2">
              <button disabled={page<=1} onClick={()=>setPage(1)} className="px-3 py-1.5 rounded-lg ring-1 ring-[#E5ECFF] bg-white disabled:opacity-50">« Перша</button>
              <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1.5 rounded-lg ring-1 ring-[#E5ECFF] bg-white disabled:opacity-50">‹ Назад</button>
              <button disabled={page>=pages} onClick={()=>setPage(p=>Math.min(p+1,pages))} className="px-3 py-1.5 rounded-lg ring-1 ring-[#E5ECFF] bg-white disabled:opacity-50">Вперед ›</button>
              <button disabled={page>=pages} onClick={()=>setPage(pages)} className="px-3 py-1.5 rounded-lg ring-1 ring-[#E5ECFF] bg-white disabled:opacity-50">Остання »</button>
              <select value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)||20); setPage(1); }} className="ml-2 px-2 py-1.5 rounded-lg ring-1 ring-[#E5ECFF] bg-white">
                {[10,20,30,50].map(n=><option key={n} value={n}>{n}/стор</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Invite dialog */}
        {showInvite && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm">
            <div className="w-[92vw] max-w-md rounded-2xl bg-white p-5 ring-1 ring-[#E5ECFF] shadow-[0_18px_48px_rgba(2,28,78,0.18)] animate-in fade-in zoom-in-95">
              <div className="text-lg font-semibold text-[#0F2E64] mb-1 flex items-center gap-2">
                <UserPlus className="w-5 h-5"/> Запросити студента
              </div>
              <p className="text-sm text-slate-600 mb-3">Надішлемо email-запрошення приєднатися до курсу.</p>
              <div className="ring-1 ring-[#E5ECFF] rounded-xl bg-white px-3 py-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500"/>
                <input value={inviteEmail} onChange={(e)=>setInviteEmail(e.target.value)} placeholder="email@student.com" className="flex-1 outline-none bg-transparent"/>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button onClick={()=>setShowInvite(false)} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white">Скасувати</button>
                <button onClick={()=>inviteOne(inviteEmail)} disabled={busy || !inviteEmail} className="px-3 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin inline-block"/> : 'Надіслати'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

/* ===================== small UI bits ===================== */
function StatusBadge({ status }:{ status: EnrollmentStatus }){
  const map: Record<EnrollmentStatus,{cls:string; label:string}> = {
    active:    { cls:'bg-emerald-50 text-emerald-700 ring-emerald-200', label:'Активний' },
    invited:   { cls:'bg-sky-50 text-sky-700 ring-sky-200', label:'Запрошений' },
    completed: { cls:'bg-indigo-50 text-indigo-700 ring-indigo-200', label:'Завершив' },
    blocked:   { cls:'bg-rose-50 text-rose-700 ring-rose-200', label:'Заблок.' },
  };
  const v = map[status] || map.active;
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ring-1 ${v.cls}`}>{v.label}</span>;
}
function ProgressBar({ value }:{ value:number }){
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-2 bg-[#1345DE] transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, value))}%` }}/>
    </div>
  );
}
