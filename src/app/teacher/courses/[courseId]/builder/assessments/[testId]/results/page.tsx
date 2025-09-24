'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import http, { setAuthHeader } from '@/lib/http';
import {
  ChevronLeft, Loader2, BarChart3, Award, CalendarClock, Timer, User2,
  Search, Filter, CheckCircle2, XCircle, Clock, Percent, AlertTriangle,
  Eye, Download, RefreshCw
} from 'lucide-react';

/* ================= Types ================ */
type TestStatus = 'draft'|'published'|'closed';

type TestDTO = {
  id:number;
  title:string;
  description?:string;
  status: TestStatus;
  time_limit_sec: number|null;
  attempts_allowed: number|null;
  pass_mark: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_feedback_mode: 'none'|'immediate'|'after_close';
  questions: Array<{ id:number; points:number }>;
};

type AttemptDTO = {
  id:number;
  test:number;
  user:number;                      // на беку серіалізатор повертає user id
  attempt_no:number;
  status:'started'|'submitted'|'graded';
  started_at:string;
  finished_at?:string|null;
  duration_sec?:number|null;
  score:number;                     // decimal
  max_score:number;                 // decimal
  pass_mark:number;                 // snapshot
};

/* ====== util ====== */
const API = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
const fmt = (n:number, d=0)=> Number.isFinite(n)? n.toFixed(d) : '—';
const dt = (iso?:string|null)=> iso ? new Date(iso).toLocaleString('uk-UA') : '—';
const secToMin = (s?:number|null)=> (s ?? 0) > 0 ? Math.round((s as number)/60) : 0;

function asArray<T=any>(raw:any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw?.results && Array.isArray(raw.results)) return raw.results as T[];
  if (raw?.data && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}

/* ================ Page ================ */
export default function TestResultsPage(){
  const params = useParams() as { courseId?: string|string[]; testId?: string|string[] };
  const courseId = Number(Array.isArray(params.courseId)?params.courseId[0]:params.courseId);
  const testId   = Number(Array.isArray(params.testId)?params.testId[0]:params.testId);

  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<TestDTO | null>(null);
  const [attempts, setAttempts] = useState<AttemptDTO[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all'|'started'|'submitted'|'graded'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

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

        // спроби — намагаємось знайти доступний маршрут (жодних змін бекенду не потрібно, просто використає перший що існує)
        const candidates = [
          `${API}/api/tests/${testId}/attempts/`,               // варіант 1 (бажаний)
          `${API}/api/tests/${testId}/attempts/list/`,          // варіант 2
          `${API}/api/analytics/tests/${testId}/attempts/`,     // варіант 3
        ];

        let loaded: AttemptDTO[] = [];
        for (const url of candidates){
          try {
            const r = await http.get(url);
            loaded = asArray<AttemptDTO>(r.data);
            if (loaded.length || r.status < 500) break; // якщо 200/204 — приймаємо йдемо далі
          } catch { /* ідемо до наступного кандидата */ }
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
    let list = attempts.slice().sort((a,b)=> new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    if (status!=='all') list = list.filter(a=> a.status===status);
    if (q.trim()){
      const term = q.trim().toLowerCase();
      list = list.filter(a => String(a.user).includes(term) || String(a.attempt_no).includes(term));
    }
    return list;
  },[attempts, status, q]);

  const stats = useMemo(()=>{
    if (!attempts.length) return null;
    const done = attempts.filter(a=> a.status!=='started');
    const cnt = attempts.length;
    const avg = done.length ? done.reduce((s,a)=> s + (Number(a.score)||0), 0) / done.length : 0;
    const maxScore = attempts[0]?.max_score ?? test?.questions?.reduce((s,q)=> s+Number(q.points||0), 0) ?? 0;
    const passMark = test?.pass_mark ?? (attempts[0]?.pass_mark ?? 0);
    const passed = done.filter(a=> ((Number(a.score)||0) / (Number(a.max_score)||1) * 100) >= passMark).length;
    const passRate = done.length ? Math.round(passed / done.length * 100) : 0;
    const avgPct = maxScore ? Math.round(avg / Number(maxScore) * 100) : 0;
    return { cnt, done: done.length, avg, avgPct, passRate, maxScore: Number(maxScore), passMark: Number(passMark) };
  },[attempts, test]);

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
                <span> / Результати</span>
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
              <Link href={`/teacher/courses/${courseId}/builder/assessments`} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2">
                <ChevronLeft className="w-4 h-4"/> До списку
              </Link>
              <button onClick={()=>setRefreshKey(x=>x+1)} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4"/> Оновити
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="mt-4 rounded-xl bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 whitespace-pre-wrap">
            <div className="flex items-start gap-2"><AlertTriangle className="w-5 h-5 mt-0.5"/> <span>{err}</span></div>
          </div>
        )}

        {/* Content */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: attempts / empty */}
          <div className="rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 ring-1 ring-[#E5ECFF] rounded-xl bg-white px-2 py-1.5 flex-1">
                  <Search className="w-4 h-4"/>
                  <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Пошук за User ID або № спроби…" className="flex-1 outline-none bg-transparent"/>
                </div>
                <div className="ring-1 ring-[#E5ECFF] rounded-xl bg-white px-2 py-1.5">
                  <select value={status} onChange={e=> setStatus(e.target.value as any)} className="bg-transparent outline-none">
                    <option value="all">Статус: всі</option>
                    <option value="started">Started</option>
                    <option value="submitted">Submitted</option>
                    <option value="graded">Graded</option>
                  </select>
                </div>
              </div>
              <div className="text-sm text-slate-500">{filtered.length} з {attempts.length}</div>
            </div>

            {/* Table / Empty */}
            {loading ? (
              <div className="grid place-items-center h-[220px] text-slate-500"><Loader2 className="w-5 h-5 animate-spin"/></div>
            ) : attempts.length ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600">
                      <th className="py-2 pr-3">Користувач</th>
                      <th className="py-2 pr-3">Спроба</th>
                      <th className="py-2 pr-3">Статус</th>
                      <th className="py-2 pr-3">Бали</th>
                      <th className="py-2 pr-3">Початок</th>
                      <th className="py-2 pr-3">Тривалість</th>
                      <th className="py-2 pr-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a=> {
                      const pct = a.max_score ? Math.round(Number(a.score)/Number(a.max_score)*100) : 0;
                      const passed = pct >= (test?.pass_mark ?? a.pass_mark ?? 0);
                      return (
                        <tr key={a.id} className="border-t border-slate-100">
                          <td className="py-2 pr-3"><div className="inline-flex items-center gap-2"><User2 className="w-4 h-4"/>{a.user}</div></td>
                          <td className="py-2 pr-3">#{a.attempt_no}</td>
                          <td className="py-2 pr-3">
                            <span className={`px-2 py-1 rounded-full text-xs ring-1 ${chip(a.status)}`}>{a.status}</span>
                          </td>
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${passed?'bg-emerald-500':'bg-amber-500'}`} style={{ width:`${pct}%` }}/>
                              </div>
                              <div className="tabular-nums">{fmt(Number(a.score), 2)} / {fmt(Number(a.max_score), 2)} ({pct}%)</div>
                            </div>
                          </td>
                          <td className="py-2 pr-3">{dt(a.started_at)}</td>
                          <td className="py-2 pr-3">{secToMin(a.duration_sec)} хв</td>
                          <td className="py-2 pr-3 text-right">
                            {/* Перегляд спроби — очікує ендпоінт detail; якщо його ще нема — кнопка вимкнена */}
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
            ) : (
              <EmptyAttemptsHint test={test}/>
            )}
          </div>

          {/* Right: stats */}
          <aside className="space-y-4">
            <Panel title="Загальна статистика">
              {stats ? (
                <div className="grid grid-cols-2 gap-3">
                  <Kpi icon={<BarChart3 className="w-4 h-4"/>} label="Спроб (усього)" value={String(stats.cnt)} />
                  <Kpi icon={<CalendarClock className="w-4 h-4"/>} label="Завершених" value={String(stats.done)} />
                  <Kpi icon={<Award className="w-4 h-4"/>} label="Середній бал" value={`${fmt(stats.avg,2)} / ${fmt(stats.maxScore,2)}`} />
                  <Kpi icon={<Percent className="w-4 h-4"/>} label="Середній %" value={`${stats.avgPct}%`} />
                  <Kpi icon={<CheckCircle2 className="w-4 h-4"/>} label="Pass rate" value={`${stats.passRate}%`} />
                  <Kpi icon={<AlertTriangle className="w-4 h-4"/>} label="Поріг (pass)" value={`${fmt(stats.passMark)}%`} />
                </div>
              ) : (
                <div className="text-sm text-slate-500">Ще немає завершених спроб.</div>
              )}
            </Panel>

            <Panel title="Параметри тесту">
              <ul className="text-sm text-slate-600 space-y-1">
                <li className="flex items-center gap-2"><Timer className="w-4 h-4"/> Ліміт часу: <b className="ml-1">{test?.time_limit_sec ? `${Math.round(Number(test.time_limit_sec)/60)} хв` : 'без ліміту'}</b></li>
                <li className="flex items-center gap-2"><CalendarClock className="w-4 h-4"/> Спроб дозволено: <b className="ml-1">{test?.attempts_allowed ?? 'без ліміту'}</b></li>
                <li className="flex items-center gap-2"><Percent className="w-4 h-4"/> Поріг: <b className="ml-1">{test?.pass_mark ?? 0}%</b></li>
              </ul>
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ================= helpers UI ================ */
function Panel({ title, children }:{ title:string; children:React.ReactNode }){
  return (
    <div className="rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4 shadow-[0_10px_30px_rgba(2,28,78,0.05)]">
      <div className="text-sm font-semibold text-[#0F2E64] mb-2">{title}</div>
      {children}
    </div>
  );
}
function Kpi({ icon, label, value }:{ icon:React.ReactNode; label:string; value:string }){
  return (
    <div className="rounded-xl ring-1 ring-[#E5ECFF] p-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-indigo-700">{icon}</div>
      </div>
      <div className="mt-1 text-lg font-semibold text-[#021C4E]">{value}</div>
    </div>
  );
}
function chip(st:'started'|'submitted'|'graded'){
  if (st==='graded') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (st==='submitted') return 'bg-indigo-50 text-indigo-700 ring-indigo-200';
  return 'bg-amber-50 text-amber-800 ring-amber-200';
}
function prettyError(e:any){
  const d = e?.response?.data; const s = e?.response?.status;
  if (typeof d === 'string') return d;
  if (!d) return e?.message || 'Сталася помилка.';
  if (d.detail) return String(d.detail);
  try { return Object.entries(d).map(([k,v])=> Array.isArray(v)? `${k}: ${v.join(', ')}`: `${k}: ${JSON.stringify(v)}`).join('\n'); }
  catch{ return s?`HTTP ${s}`:'Сталася помилка.'; }
}

function EmptyAttemptsHint({ test }:{ test: TestDTO | null }){
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-[#E5ECFF] p-6 text-center bg-slate-50/40">
      <div className="text-[#0F2E64] font-semibold text-lg">Поки що немає спроб</div>
      <p className="text-slate-600 mt-1">Опублікуйте урок із тестом або надішліть студентам посилання — тут зʼявляться результати.</p>
      <div className="mt-4 text-left text-sm bg-white rounded-xl ring-1 ring-[#E5ECFF] p-3">
        <div className="font-semibold mb-1">Очікуваний API для цієї сторінки (без обовʼязкових змін з вашого боку):</div>
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li><code>GET /api/tests/&lt;test_id&gt;/attempts/</code> → масив <i>TestAttemptSerializer</i></li>
          <li>опційно: <code>GET /api/tests/&lt;test_id&gt;/attempts/&lt;attempt_id&gt;/</code> → деталізація з відповідями</li>
        </ul>
        <p className="mt-2 text-slate-500">Сторінка вже вміє підхоплювати й <code>/attempts/list</code> або <code>/analytics/.../attempts</code>, якщо вони є.</p>
      </div>
      <div className="mt-4 text-xs text-slate-500">Статус тесту: <b>{test?.status || '—'}</b>, поріг: <b>{test?.pass_mark ?? 0}%</b></div>
    </div>
  );
}
