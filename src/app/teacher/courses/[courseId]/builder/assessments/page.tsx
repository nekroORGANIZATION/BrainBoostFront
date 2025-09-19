'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import http, { setAuthHeader } from '@/lib/http';
import {
  Plus, Filter, Search, RefreshCw, Loader2, Clock, Repeat, Percent, Shuffle,
  BookOpen, Check, AlertCircle, ChevronLeft, ArrowRight, Pencil, Trash2, Users, Eye, Inbox
} from 'lucide-react';

/* ================= types ================ */
type TestStatus = 'draft' | 'published' | 'closed';

type Lesson = { id:number; title:string };
type TestListItem = {
  id:number;
  lesson:number;
  title:string;
  description?:string;
  status:TestStatus;
  time_limit_sec:number|null;
  attempts_allowed:number|null;
  pass_mark:number;
  shuffle_questions?:boolean;
  shuffle_options?:boolean;
  updated_at?:string;
  created_at?:string;
};

type Paged<T> = { count:number; next:string|null; previous:string|null; results:T[] } | T[];

/* ============== helpers ============== */
const API = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';

const asArray = <T,>(raw:Paged<T>): T[] => Array.isArray(raw) ? raw : (raw?.results ?? []);
const totalCount = <T,>(raw:Paged<T>): number => Array.isArray(raw) ? raw.length : (raw?.count ?? 0);

const fmtMin = (sec:number|null|undefined) => sec==null ? '—' : `${Math.round(sec/60)} хв`;
const fmtAttempts = (n:number|null|undefined) => n==null ? '∞' : String(n);
const statusBadge = (s:TestStatus) =>
  s==='published' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  : s==='closed' ? 'bg-slate-100 text-slate-700 ring-slate-200'
  : 'bg-amber-50 text-amber-700 ring-amber-200';

/* ============== page ============== */
export default function AssessmentsIndexPage(){
  const params = useParams() as { courseId?: string|string[] };
  const courseId = Number(Array.isArray(params.courseId)? params.courseId[0] : params.courseId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();

  // state
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [items, setItems] = useState<TestListItem[]>([]);
  const [count, setCount] = useState(0);

  // filters (from URL)
  const [q, setQ] = useState<string>(searchParams.get('q') || '');
  const [status, setStatus] = useState<string>(searchParams.get('status') || '');
  const [lessonId, setLessonId] = useState<string>(searchParams.get('lesson') || '');
  const [page, setPage] = useState<number>(Number(searchParams.get('page') || 1));

  // auth → axios
  useEffect(()=>{ if(accessToken) setAuthHeader(accessToken); },[accessToken]);

  // load lessons (for filter)
  useEffect(()=>{
    if (!accessToken || !courseId) return;
    (async()=>{
      try{
        const r = await http.get(`/lesson/admin/lessons/`, { params:{ course:courseId, ordering:'id', page_size: 100 }});
        const arr = Array.isArray(r.data?.results) ? r.data.results : Array.isArray(r.data) ? r.data : [];
        setLessons(arr.map((x:any)=>({ id:x.id, title:x.title })));
      }catch(e){ /* ignore */ }
    })();
  },[accessToken, courseId]);

  // load tests
  const fetchList = async () => {
    if (!accessToken) return;
    setLoading(true);
    try{
      const r = await http.get(`${API}/api/tests/`, {
        params: {
          page,
          search: q || undefined,          // якщо на беку підключений SearchFilter
          lesson_id: lessonId || undefined,
          status: status || undefined,
          ordering: '-updated_at',
        }
      });
      setItems(asArray<TestListItem>(r.data));
      setCount(totalCount<TestListItem>(r.data));
    }catch(e){ /* can show toast if потрібно */ }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ fetchList(); /* eslint-disable-next-line */ }, [accessToken, page]);

  // синхронізація фільтрів з URL
  useEffect(()=>{
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (status) sp.set('status', status);
    if (lessonId) sp.set('lesson', lessonId);
    if (page !== 1) sp.set('page', String(page));
    router.replace(`?${sp.toString()}`);
  }, [q, status, lessonId, page, router]);

  const resetFilters = () => { setQ(''); setStatus(''); setLessonId(''); setPage(1); };

  const totalPages = useMemo(()=> Math.max(1, Math.ceil(count/10)), [count]); // якщо DRF page_size=10

  if (!accessToken){
    return (
      <main className="min-h-screen grid place-items-center bg-[url('/images/back.png')] bg-cover px-6">
        <div className="max-w-md bg-white/95 ring-1 ring-[#E5ECFF] p-6 rounded-2xl text-center">
          <h1 className="text-2xl font-extrabold text-[#021C4E]">Потрібен вхід</h1>
          <p className="text-slate-600 mt-1">Щоб керувати тестами — увійди.</p>
          <div className="mt-4">
            <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold">Увійти</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pt-[90px] pb-24">
        {/* header */}
        <div className="rounded-[24px] bg-white/90 ring-1 ring-[#E5ECFF] p-4 md:p-6 shadow-[0_10px_30px_rgba(2,28,78,0.10)] sticky top-16 z-10 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-slate-600">
                <Link href={`/teacher/courses/${courseId}/builder/overview`} className="text-indigo-600 hover:underline">Builder</Link>
                <span> / Оцінювання</span>
              </div>
              <h1 className="text-[26px] md:text-[32px] font-extrabold text-[#021C4E] leading-tight">Тести курсу</h1>
              <div className="text-xs text-slate-600">Разом: <b>{count}</b></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/teacher/courses/${courseId}/builder/assessments/new`}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4"/> Створити тест
              </Link>
              <Link
                href={`/teacher/courses/${courseId}/builder/overview`}
                className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4"/> До Hub
              </Link>
            </div>
          </div>
        </div>

        {/* filters */}
        <div className="mt-4 rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_220px_120px] gap-3">
            <div className="flex items-center gap-2 ring-1 ring-[#E5ECFF] rounded-xl px-3 py-2 bg-white">
              <Search className="w-4 h-4 text-slate-500"/>
              <input
                value={q}
                onChange={(e)=>{ setQ(e.target.value); setPage(1); }}
                placeholder="Пошук за назвою/описом…"
                className="w-full outline-none bg-transparent"
              />
            </div>
            <select
              value={lessonId}
              onChange={(e)=>{ setLessonId(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white"
            >
              <option value="">Усі уроки</option>
              {lessons.map(l => <option key={l.id} value={l.id}>#{l.id} — {l.title}</option>)}
            </select>
            <select
              value={status}
              onChange={(e)=>{ setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white"
            >
              <option value="">Будь-який статус</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
            <div className="flex gap-2">
              <button onClick={fetchList} className="flex-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4"/> Оновити
              </button>
              <button onClick={resetFilters} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white">Скинути</button>
            </div>
          </div>
        </div>

        {/* list */}
        <div className="mt-4 rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-2">
          {loading ? (
            <div className="p-8 text-slate-600 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin"/> Завантаження…
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-slate-600">
              <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-400"/>
              Поки що немає тестів. Створіть перший!
              <div className="mt-3">
                <Link href={`/teacher/courses/${courseId}/builder/assessments/new`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white">
                  <Plus className="w-4 h-4"/> Новий тест
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-[#E5ECFF]">
              {items.map(t => (
                <li key={t.id} className="p-3 md:p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/teacher/courses/${courseId}/builder/assessments/${t.id}/attempts`} className="text-lg font-semibold text-[#0F2E64] hover:underline">
                          {t.title || '(без назви)'}
                        </Link>
                        <span className={`text-xs px-2 py-1 rounded-full ring-1 ${statusBadge(t.status)}`}>{t.status}</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="inline-flex items-center gap-1"><BookOpen className="w-4 h-4"/>{lessons.find(l=>l.id===t.lesson)?.title || `Lesson #${t.lesson}`}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4"/>{fmtMin(t.time_limit_sec)}</span>
                        <span className="inline-flex items-center gap-1"><Repeat className="w-4 h-4"/>{fmtAttempts(t.attempts_allowed)} спроб</span>
                        <span className="inline-flex items-center gap-1"><Percent className="w-4 h-4"/>{Math.round(t.pass_mark)}%</span>
                        {t.shuffle_questions ? <span className="inline-flex items-center gap-1"><Shuffle className="w-4 h-4"/>shuffle Q</span> : null}
                        {t.shuffle_options ? <span className="inline-flex items-center gap-1"><Shuffle className="w-4 h-4 rotate-180"/>shuffle A</span> : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/teacher/courses/${courseId}/builder/assessments/${t.id}/edit`}
                        className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4"/> Редагувати
                      </Link>
                      <Link
                        href={`/teacher/courses/${courseId}/builder/assessments/${t.id}/attempts`}
                        className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2"
                      >
                        <Users className="w-4 h-4"/> Спроби
                      </Link>
                      <Link
                        href={`/teacher/courses/${courseId}/builder/assessments/${t.id}/results`}
                        className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2"
                      >
                        <Check className="w-4 h-4"/> Результати
                      </Link>
                      <Link
                        href={`/teacher/courses/${courseId}/builder/assessments/new?lesson=${t.lesson}`}
                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white inline-flex items-center gap-2"
                        title="Швидко відкрити редактор цього уроку"
                      >
                        <Eye className="w-4 h-4"/> Відкрити в конструкторі
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* pagination */}
        {items.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-slate-600">Сторінка {page} з {totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={()=> setPage(p => Math.max(1, p-1))}
                disabled={page<=1}
                className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white disabled:opacity-50"
              >
                ← Попередня
              </button>
              <button
                onClick={()=> setPage(p => Math.min(totalPages, p+1))}
                disabled={page>=totalPages}
                className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white disabled:opacity-50"
              >
                Наступна →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
