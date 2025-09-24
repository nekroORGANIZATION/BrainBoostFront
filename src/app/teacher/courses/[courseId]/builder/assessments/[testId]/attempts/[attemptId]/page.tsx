'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import http, { setAuthHeader } from '@/lib/http';
import {
  ChevronLeft, Loader2, RefreshCw, Search, Filter, CalendarClock, Percent, Timer,
  User2, Eye, Download, ArrowUpDown, AlertTriangle, CheckCircle2, XCircle, BarChart3
} from 'lucide-react';

/* ================= Types ================ */
type TestStatus = 'draft'|'published'|'closed';
type AttemptStatus = 'started'|'submitted'|'graded';

type TestDTO = {
  id:number; title:string; status: TestStatus;
  pass_mark:number; time_limit_sec:number|null; attempts_allowed:number|null;
  questions: Array<{ id:number; points:number }>;
};

type AttemptDTO = {
  id:number; test:number; user:number; attempt_no:number;
  status: AttemptStatus;
  started_at:string; finished_at?:string|null; duration_sec?:number|null;
  score:number; max_score:number; pass_mark:number;
};

/* ====== util ====== */
const API = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';
const fmt = (n:number, d=0)=> Number.isFinite(n)? n.toFixed(d) : '—';
const dt = (iso?:string|null)=> iso ? new Date(iso).toLocaleString('uk-UA') : '—';
const ymd = (iso?:string|null)=> iso ? new Date(iso).toISOString().slice(0,10) : '';
const secToMin = (s?:number|null)=> (s ?? 0) > 0 ? Math.round((s as number)/60) : 0;

function asArray<T=any>(raw:any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw?.results && Array.isArray(raw.results)) return raw.results as T[];
  if (raw?.data && Array.isArray(raw.data)) return raw.data as T[];
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
function chip(st:AttemptStatus){
  if (st==='graded') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (st==='submitted') return 'bg-indigo-50 text-indigo-700 ring-indigo-200';
  return 'bg-amber-50 text-amber-800 ring-amber-200';
}

/* ================ Page ================ */
export default function TestAttemptsPage(){
  const params = useParams() as { courseId?: string|string[]; testId?: string|string[] };
  const courseId = Number(Array.isArray(params.courseId)?params.courseId[0]:params.courseId);
  const testId   = Number(Array.isArray(params.testId)?params.testId[0]:params.testId);

  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<TestDTO | null>(null);
  const [attempts, setAttempts] = useState<AttemptDTO[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // filters
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all'|AttemptStatus>('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [pctMin, setPctMin] = useState<string>('');
  const [pctMax, setPctMax] = useState<string>('');
  const [sortKey, setSortKey] = useState<'date'|'score'|'duration'|'attempt'>('date');
  const [sortDir, setSortDir] = useState<'desc'|'asc'>('desc');

  // pagination (client)
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(()=>{ if(accessToken) setAuthHeader(accessToken); },[accessToken]);

  // load test + attempts
  useEffect(()=>{
    let cancel = false;
    (async()=>{
      try{
        setErr(null); setLoading(true);

        // тест
        const t = await http.get(`${API}/api/tests/${testId}/`);
        if (cancel) return;
        setTest(t.data as TestDTO);

        // спроби — кілька кандидатів
        const candidates = [
          `${API}/api/tests/${testId}/attempts/`,
          `${API}/api/tests/${testId}/attempts/list/`,
          `${API}/api/analytics/tests/${testId}/attempts/`,
        ];

        let loaded: AttemptDTO[] = [];
        for (const url of candidates){
          try {
            const r = await http.get(url);
            loaded = asArray<AttemptDTO>(r.data);
            if (loaded || r.status < 500) break;
          } catch { /* next */ }
        }
        if (cancel) return;
        setAttempts(loaded);
      } catch(e:any){
        setErr(prettyError(e));
      } finally{
        if (!cancel) setLoading(false);
      }
    })();
    return ()=>{ cancel = true; };
  },[testId, refreshKey]);

  const filtered = useMemo(()=>{
    let list = attempts.slice();

    if (status!=='all') list = list.filter(a=> a.status===status);
    if (q.trim()){
      const term = q.trim().toLowerCase();
      list = list.filter(a => String(a.user).includes(term) || String(a.attempt_no).includes(term));
    }
    if (from) list = list.filter(a => ymd(a.started_at) >= from);
    if (to)   list = list.filter(a => ymd(a.started_at) <= to);

    // % bounds
    if (pctMin || pctMax){
      const lo = pctMin==='' ? -Infinity : Number(pctMin);
      const hi = pctMax==='' ?  Infinity : Number(pctMax);
      list = list.filter(a=>{
        const pct = a.max_score ? (Number(a.score)/Number(a.max_score))*100 : 0;
        return pct >= lo && pct <= hi;
      });
    }

    // sort
    list.sort((a,b)=>{
      const pctA = a.max_score ? Number(a.score)/Number(a.max_score) : 0;
      const pctB = b.max_score ? Number(b.score)/Number(b.max_score) : 0;
      let v = 0;
      if (sortKey==='date') v = new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
      if (sortKey==='score') v = pctA - pctB;
      if (sortKey==='duration') v = (a.duration_sec ?? 0) - (b.duration_sec ?? 0);
      if (sortKey==='attempt') v = a.attempt_no - b.attempt_no;
      return sortDir==='asc' ? v : -v;
    });

    return list;
  },[attempts, status, q, from, to, pctMin, pctMax, sortKey, sortDir]);

  const paged = useMemo(()=>{
    const start = (page-1)*pageSize;
    return filtered.slice(start, start+pageSize);
  },[filtered, page]);

  const stats = useMemo(()=>{
    if (!attempts.length) return null;
    const done = attempts.filter(a=> a.status!=='started');
    const pass = (a:AttemptDTO)=> {
      const pct = a.max_score ? (Number(a.score)/Number(a.max_score))*100 : 0;
      return pct >= (test?.pass_mark ?? a.pass_mark ?? 0);
    };
    const passRate = done.length ? Math.round(done.filter(pass).length / done.length * 100) : 0;
    const avgPct = done.length ? Math.round(done.reduce((s,a)=> s + ((Number(a.score)/Number(a.max_score))*100 || 0), 0) / done.length) : 0;
    const avgDur = done.length ? Math.round(done.reduce((s,a)=> s + (a.duration_sec ?? 0), 0) / done.length) : 0;
    return { total: attempts.length, done: done.length, passRate, avgPct, avgDurMin: Math.round(avgDur/60) };
  },[attempts, test]);

  // csv export (client-side)
  const exportCSV = () => {
    const rows = [['id','user','attempt_no','status','started_at','finished_at','duration_sec','score','max_score','percent','pass_mark']];
    filtered.forEach(a=>{
      const pct = a.max_score ? Math.round((Number(a.score)/Number(a.max_score))*100) : 0;
      rows.push([a.id, a.user, a.attempt_no, a.status, a.started_at, a.finished_at ?? '', a.duration_sec ?? '', String(a.score), String(a.max_score), pct, a.pass_mark] as any);
    });
    const csv = rows.map(r=> r.map(x=> `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `test-${testId}-attempts.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey===key) setSortDir(d=> d==='desc'?'asc':'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(()=>{ setPage(1); }, [filtered.length, sortKey, sortDir]);

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pt-20 pb-24">
        {/* Header */}
        <div className="rounded-[24px] bg-white/90 ring-1 ring-[#E5ECFF] p-4 md:p-6 shadow-[0_10px_30px_rgba(2,28,78,0.10)] sticky top-12 z-10 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-slate-600">
                <Link href={`/teacher/courses/${courseId}/builder/overview`} className="text-indigo-600 hover:underline">Builder</Link>
                <span> / </span>
                <Link href={`/teacher/courses/${courseId}/builder/assessments`} className="text-indigo-600 hover:underline">Оцінювання</Link>
                <span> / Спроби</span>
              </div>
              <h1 className="text-[26px] md:text-[32px] font-extrabold text-[#021C4E] leading-tight">
                {test?.title || 'Тест'}
              </h1>
              <div className="mt-1 text-xs text-slate-600 flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-slate-100">
                  {test?.status==='draft'?'Чернетка':test?.status==='published'?'Опубліковано':'Закрито'}
                </span>
                {loading && <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Завантаження…</span>}
                {attempts.length ? <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">{attempts.length} спроб</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/teacher/courses/${courseId}/builder/assessments/${testId}/results`} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2">
                <BarChart3 className="w-4 h-4"/> Результати
              </Link>
              <button onClick={()=>setRefreshKey(x=>x+1)} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4"/> Оновити
              </button>
              <button onClick={exportCSV} disabled={!filtered.length} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm inline-flex items-center gap-2 disabled:opacity-60">
                <Download className="w-4 h-4"/> Експорт CSV
              </button>
              <Link href={`/teacher/courses/${courseId}/builder/assessments`} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2">
                <ChevronLeft className="w-4 h-4"/> Назад
              </Link>
            </div>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mt-4 rounded-xl bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 whitespace-pre-wrap">
            <div className="flex items-start gap-2"><AlertTriangle className="w-5 h-5 mt-0.5"/> <span>{err}</span></div>
          </div>
        )}

        {/* Top KPIs */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi icon={<CalendarClock className="w-4 h-4"/>} label="Спроб (усього)" value={String(attempts.length)} />
          <Kpi icon={<CheckCircle2 className="w-4 h-4"/>} label="Завершених" value={String(stats?.done ?? 0)} />
          <Kpi icon={<Percent className="w-4 h-4"/>} label="Середній %" value={`${stats?.avgPct ?? 0}%`} />
          <Kpi icon={<Timer className="w-4 h-4"/>} label="Сер. тривалість" value={`${stats?.avgDurMin ?? 0} хв`} />
        </div>

        {/* Filters */}
        <div className="mt-4 rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4 shadow-[0_8px_24px_rgba(2,28,78,0.06)]">
          <div className="text-sm font-semibold text-[#0F2E64] mb-2 flex items-center gap-2">
            <Filter className="w-4 h-4"/> Фільтри
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 ring-1 ring-[#E5ECFF] rounded-xl bg-white px-2 py-1.5">
                <Search className="w-4 h-4"/>
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="User ID або № спроби…" className="flex-1 outline-none bg-transparent"/>
              </div>
            </div>
            <div>
              <select value={status} onChange={e=> setStatus(e.target.value as any)} className="w-full px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white">
                <option value="all">Статус: всі</option>
                <option value="started">Started</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
              </select>
            </div>
            <div>
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white" />
            </div>
            <div>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="w-full px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={100} placeholder="% від" value={pctMin} onChange={e=>setPctMin(e.target.value)} className="w-full px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white"/>
              <span className="text-slate-400">—</span>
              <input type="number" min={0} max={100} placeholder="% до" value={pctMax} onChange={e=>setPctMax(e.target.value)} className="w-full px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white"/>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={()=>{ setQ(''); setStatus('all'); setFrom(''); setTo(''); setPctMin(''); setPctMax(''); }} className="px-3 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm">Скинути</button>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={()=>toggleSort('date')} className="px-3 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4"/> Дата {sortKey==='date' ? (sortDir==='desc'?'↓':'↑') : ''}
              </button>
              <button onClick={()=>toggleSort('score')} className="px-3 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4"/> % {sortKey==='score' ? (sortDir==='desc'?'↓':'↑') : ''}
              </button>
              <button onClick={()=>toggleSort('duration')} className="px-3 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4"/> Тривалість {sortKey==='duration' ? (sortDir==='desc'?'↓':'↑') : ''}
              </button>
              <button onClick={()=>toggleSort('attempt')} className="px-3 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4"/> № спроби {sortKey==='attempt' ? (sortDir==='desc'?'↓':'↑') : ''}
              </button>
            </div>
          </div>
        </div>

        {/* Table / Empty */}
        <div className="mt-4 rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4">
          {loading ? (
            <div className="grid place-items-center h-[220px] text-slate-500"><Loader2 className="w-5 h-5 animate-spin"/></div>
          ) : filtered.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600">
                      <th className="py-2 pr-3">Користувач</th>
                      <th className="py-2 pr-3">Спроба</th>
                      <th className="py-2 pr-3">Статус</th>
                      <th className="py-2 pr-3">Результат</th>
                      <th className="py-2 pr-3">Початок</th>
                      <th className="py-2 pr-3">Тривалість</th>
                      <th className="py-2 pr-3 text-right">Дія</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(a=>{
                      const pct = a.max_score ? Math.round(Number(a.score)/Number(a.max_score)*100) : 0;
                      const passed = pct >= (test?.pass_mark ?? a.pass_mark ?? 0);
                      return (
                        <tr key={a.id} className="border-t border-slate-100 hover:bg-indigo-50/30 transition-colors">
                          <td className="py-2 pr-3"><div className="inline-flex items-center gap-2"><User2 className="w-4 h-4"/>{a.user}</div></td>
                          <td className="py-2 pr-3">#{a.attempt_no}</td>
                          <td className="py-2 pr-3">
                            <span className={`px-2 py-1 rounded-full text-xs ring-1 ${chip(a.status)}`}>{a.status}</span>
                          </td>
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${passed?'bg-emerald-500':'bg-amber-500'}`} style={{ width:`${pct}%` }}/>
                              </div>
                              <div className="tabular-nums">{fmt(Number(a.score), 2)} / {fmt(Number(a.max_score), 2)} ({pct}%)</div>
                            </div>
                          </td>
                          <td className="py-2 pr-3">{dt(a.started_at)}</td>
                          <td className="py-2 pr-3">{secToMin(a.duration_sec)} хв</td>
                          <td className="py-2 pl-3 text-right">
                            {/* Кнопка перегляду може бути активована, якщо зʼявиться detail ендпойнт */}
                            <button
                              title="Деталі спроби"
                              disabled
                              className="px-2 py-1 rounded-lg ring-1 ring-[#E5ECFF] text-slate-400 inline-flex items-center gap-1 cursor-not-allowed"
                            >
                              <Eye className="w-4 h-4"/> Перегляд
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Показано {((page-1)*pageSize)+1}–{Math.min(page*pageSize, filtered.length)} з {filtered.length}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>setPage(p=> Math.max(1, p-1))} disabled={page===1} className="px-3 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white disabled:opacity-50">Назад</button>
                  <span className="text-sm">Стор. {page} / {totalPages}</span>
                  <button onClick={()=>setPage(p=> Math.min(totalPages, p+1))} disabled={page===totalPages} className="px-3 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white disabled:opacity-50">Далі</button>
                </div>
              </div>
            </>
          ) : (
            <EmptyAttemptsHint test={test}/>
          )}
        </div>
      </div>
    </main>
  );
}

/* ================= helpers UI ================ */
function Kpi({ icon, label, value }:{ icon:React.ReactNode; label:string; value:string }){
  return (
    <div className="rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4 shadow-[0_10px_30px_rgba(2,28,78,0.05)] animate-[fadeIn_.4s_ease]">
      <style>{`@keyframes fadeIn{from{opacity:.0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-indigo-700">{icon}</div>
      </div>
      <div className="mt-1 text-lg font-semibold text-[#021C4E]">{value}</div>
    </div>
  );
}
function EmptyAttemptsHint({ test }:{ test: TestDTO | null }){
  return (
    <div className="mt-2 rounded-2xl border border-dashed border-[#E5ECFF] p-6 text-center bg-slate-50/40">
      <div className="text-[#0F2E64] font-semibold text-lg">Спроб поки немає</div>
      <p className="text-slate-600 mt-1">Опублікуйте курс/урок із тестом — і тут зʼявляться записи.</p>
      <div className="mt-4 text-left text-sm bg-white rounded-xl ring-1 ring-[#E5ECFF] p-3">
        <div className="font-semibold mb-1">Який API очікується (але не обовʼязковий):</div>
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li><code>GET /api/tests/&lt;test_id&gt;/attempts/</code> → масив <i>TestAttemptSerializer</i></li>
          <li>опційно: <code>GET /api/tests/&lt;test_id&gt;/attempts/&lt;attempt_id&gt;/</code> → деталізація</li>
        </ul>
        <p className="mt-2 text-slate-500">Сторінка також пробує <code>/attempts/list</code> чи <code>/analytics/.../attempts</code>.</p>
      </div>
      <div className="mt-4 text-xs text-slate-500">Статус тесту: <b>{test?.status || '—'}</b>, поріг: <b>{test?.pass_mark ?? 0}%</b></div>
    </div>
  );
}
