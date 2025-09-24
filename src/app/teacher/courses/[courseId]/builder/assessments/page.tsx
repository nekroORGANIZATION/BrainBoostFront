'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import http, { setAuthHeader } from '@/lib/http';
import {
  Plus, RefreshCw, Loader2, Clock, Repeat, Percent, Shuffle,
  BookOpen, Check, ChevronLeft, Users, Eye, Inbox
} from 'lucide-react';

/* ============ types ============ */
type TestStatus = 'draft' | 'published' | 'closed';
type Lesson = { id:number; title:string };
type TestListItem = {
  id:number; lesson:number; title:string; description?:string; status:TestStatus;
  time_limit_sec:number|null; attempts_allowed:number|null; pass_mark:number;
  shuffle_questions?:boolean; shuffle_options?:boolean;
  updated_at?:string; created_at?:string;
};
type Paged<T> = { count:number; next:string|null; previous:string|null; results:T[] } | T[];

/* ============ helpers ============ */
const asArray = <T,>(raw:Paged<T>): T[] => Array.isArray(raw) ? raw : (raw?.results ?? []);
const fmtMin = (sec:number|null|undefined) => sec==null ? '—' : `${Math.round(sec/60)} хв`;
const fmtAttempts = (n:number|null|undefined) => n==null ? '∞' : String(n);
const statusBadge = (s:TestStatus) =>
  s==='published' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  : s==='closed' ? 'bg-slate-100 text-slate-700 ring-slate-200'
  : 'bg-amber-50 text-amber-700 ring-amber-200';

const cardTint = (s: TestStatus) => {
  if (s === 'published') return { ring: 'ring-emerald-200', stripe: 'bg-emerald-500', glow: 'shadow-[0_14px_40px_rgba(16,185,129,0.15)]' };
  if (s === 'closed')    return { ring: 'ring-slate-200',   stripe: 'bg-slate-500',   glow: 'shadow-[0_14px_38px_rgba(100,116,139,0.16)]' };
  return { ring: 'ring-amber-200', stripe: 'bg-amber-500', glow: 'shadow-[0_14px_40px_rgba(245,158,11,0.16)]' };
};

/* ============ page ============ */
export default function AssessmentsIndexPage(){
  const params = useParams() as { courseId?: string|string[] };
  const courseId = Number(Array.isArray(params.courseId)? params.courseId[0] : params.courseId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();

  // данные
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoaded, setLessonsLoaded] = useState(false);
  const [items, setItems] = useState<TestListItem[]>([]);
  const [count, setCount] = useState(0);

  // фильтры
  const [lessonId, setLessonId] = useState<string>(searchParams.get('lesson') || '');
  const [page, setPage] = useState<number>(Number(searchParams.get('page') || 1));
  const pageSize = 10;

  const debounceRef = useRef<number | null>(null);

  /* -------- авторизация в axios (фикс для 401) -------- */
  useEffect(()=>{ if(accessToken) setAuthHeader(accessToken); },[accessToken]);

  /* -------- тянуть уроки только этого курса -------- */
  useEffect(()=>{
    if (!courseId) return;
    let stop = false;
    setLessonsLoaded(false);
    (async()=>{
      try{
        const r = await http.get('/lesson/admin/lessons/', {
          params:{ course: courseId, ordering:'id', page_size: 200 }
        });
        const arr = Array.isArray(r.data?.results) ? r.data.results : Array.isArray(r.data) ? r.data : [];
        if (!stop){
          setLessons(arr.map((x:any)=>({ id:x.id, title:x.title })));
          setLessonsLoaded(true);
        }
      }catch{
        if (!stop){ setLessons([]); setLessonsLoaded(true); }
      }
    })();
    return ()=>{ stop = true; };
  },[courseId]);

  /* -------- параметры запроса к /api/tests/ -------- */
  const buildParams = () => {
    const params: Record<string, any> = {
      page,
      page_size: pageSize,
      ordering: '-updated_at',
    };
    if (lessonId) {
      params.lesson_id = lessonId;     // основной фильтр, который понимает бек
      // подстраховка (если бек поддерживает разные варианты имен):
      params.lesson = lessonId;
      params['lesson__id'] = lessonId;
    } else {
      // если урок не выбран — фильтруем по курсу (если бек поддерживает)
      params['lesson__course'] = courseId;
      params['lesson__course_id'] = courseId;
    }
    return params;
  };

  /* -------- тянуть список тестов, когда есть токен И уроки курса -------- */
  const fetchList = async () => {
    if (!lessonsLoaded) return;
    setLoading(true);
    try{
      const r = await http.get('/api/tests/', { params: buildParams() });
      let arr = asArray<TestListItem>(r.data);

      // 1) жёстко ограничим тесты уроками текущего курса
      const lessonIdsOfCourse = new Set(lessons.map(l => l.id));
      arr = arr.filter(t => lessonIdsOfCourse.has(t.lesson));

      // 2) если выбран урок — ещё раз фильтранём на клиенте
      if (lessonId) {
        arr = arr.filter(t => String(t.lesson) === String(lessonId));
      }

      // 3) пагинацию считаем сами на клиенте, если бек прислал "лишнее"
      setItems(arr.slice(0, pageSize));
      setCount(arr.length);
    } finally {
      setLoading(false);
    }
  };

  // старт/страница
  useEffect(()=>{ if(lessonsLoaded) fetchList(); /* eslint-disable-next-line */ }, [accessToken, lessonsLoaded, page]);

  // debounce на смену урока
  useEffect(()=>{
    if (!lessonsLoaded) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => { setPage(1); fetchList(); }, 250);
    return ()=> { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, lessonsLoaded]);

  // синхронизация URL
  useEffect(()=>{
    const sp = new URLSearchParams();
    if (lessonId) sp.set('lesson', lessonId);
    if (page !== 1) sp.set('page', String(page));
    router.replace(`?${sp.toString()}`);
  }, [lessonId, page, router]);

  const resetFilters = () => { setLessonId(''); setPage(1); };

  const totalPages = useMemo(()=> Math.max(1, Math.ceil(count/pageSize)), [count]);

  if (!accessToken){
    return (
      <main className="min-h-screen grid place-items-center bg-[url('/images/back.png')] bg-cover px-6">
        <div className="max-w-md bg-white/90 backdrop-blur ring-1 ring-[#E5ECFF] p-6 rounded-2xl text-center shadow-[0_18px_50px_rgba(2,28,78,0.12)]">
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
        <div className="rounded-[24px] bg-white/80 backdrop-blur ring-1 ring-[#E5ECFF] p-4 md:p-6 shadow-[0_18px_50px_rgba(2,28,78,0.12)] sticky top-16 z-10">
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
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white inline-flex items-center gap-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4"/> Створити тест
              </Link>
              <Link
                href={`/teacher/courses/${courseId}/builder/overview`}
                className="px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2 w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4"/> До Hub
              </Link>
            </div>
          </div>
        </div>

        {/* filters — тільки урок */}
        <div className="mt-4 rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4 shadow-[0_10px_30px_rgba(2,28,78,0.08)]">
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-3 items-stretch">
            <div className="md:justify-self-start">
              <label className="text-sm text-slate-600 block mb-1">Урок</label>
              <select
                value={lessonId}
                onChange={(e)=>{ setLessonId(e.target.value); }}
                className="w-full px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white"
                disabled={!lessonsLoaded}
              >
                <option value="">Усі уроки</option>
                {lessons.map(l => <option key={l.id} value={l.id}>#{l.id} — {l.title}</option>)}
              </select>
            </div>

            <div className="flex gap-2 justify-stretch md:justify-end items-end">
              <button
                onClick={fetchList}
                disabled={!lessonsLoaded}
                className="flex-1 md:flex-none px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center justify-center gap-2 hover:bg-[#F7F9FF] min-w-[120px]"
              >
                <RefreshCw className="w-4 h-4"/> Оновити
              </button>
              <button
                onClick={resetFilters}
                className="flex-1 md:flex-none px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:bg-[#F7F9FF] min-w-[110px]"
              >
                Скинути
              </button>
            </div>
          </div>
        </div>

        {/* list */}
        <div className="mt-4 rounded-2xl bg-white/90 ring-1 ring-[#E5ECFF] p-2">
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
            <ul className="space-y-3">
              {items.map(t => {
                const tint = cardTint(t.status);
                return (
                  <li key={t.id} className={`relative overflow-hidden rounded-2xl ring-1 ${tint.ring} bg-white p-3 sm:p-4 transition-transform hover:-translate-y-[2px] hover:${tint.glow}`}>
                    {/* stripe */}
                    <span className={`absolute left-0 top-0 h-full w-1.5 ${tint.stripe} rounded-l-2xl`} />
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/teacher/courses/${courseId}/builder/assessments/${t.id}/attempts`}
                            className="text-[17px] sm:text-lg font-semibold text-[#0F2E64] hover:underline truncate"
                          >
                            {t.title || '(без назви)'}
                          </Link>
                          <span className={`text-[11px] sm:text-xs px-2 py-0.5 rounded-full ring-1 ${statusBadge(t.status)}`}>{t.status}</span>
                        </div>

                        <div className="mt-1 text-[12px] sm:text-sm text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                          <span className="inline-flex items-center gap-1"><BookOpen className="w-4 h-4"/>{lessons.find(l=>l.id===t.lesson)?.title || `Lesson #${t.lesson}`}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4"/>{fmtMin(t.time_limit_sec)}</span>
                          <span className="inline-flex items-center gap-1"><Repeat className="w-4 h-4"/>{fmtAttempts(t.attempts_allowed)} спроб</span>
                          <span className="inline-flex items-center gap-1"><Percent className="w-4 h-4"/>{Math.round(t.pass_mark)}%</span>
                          {t.shuffle_questions ? <span className="inline-flex items-center gap-1"><Shuffle className="w-4 h-4"/>shuffle Q</span> : null}
                          {t.shuffle_options ? <span className="inline-flex items-center gap-1"><Shuffle className="w-4 h-4 rotate-180"/>shuffle A</span> : null}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                        <Link
                          href={`/teacher/courses/${courseId}/builder/assessments/${t.id}/attempts`}
                          className="w-full sm:w-auto px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center justify-center gap-2 hover:bg-[#F7F9FF]">
                          <Users className="w-4 h-4"/> Спроби
                        </Link>
                        <Link href={`/teacher/courses/${courseId}/builder/assessments/${t.id}/results`} className="w-full sm:w-auto px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center justify-center gap-2 hover:bg-[#F7F9FF]">
                          <Check className="w-4 h-4"/> Результати
                        </Link>
                        <Link href={`/teacher/courses/${courseId}/builder/assessments/new?lesson=${t.lesson}`} className="w-full sm:w-auto px-3 py-2 rounded-xl bg-indigo-600 text-white inline-flex items-center justify-center gap-2 hover:brightness-110" title="Швидко відкрити редактор цього уроку">
                          <Eye className="w-4 h-4"/> Відкрити в конструкторі
                        </Link>
                      </div>
                    </div>
                    <div className="pointer-events-none absolute -right-24 -top-24 w-64 h-64 rounded-full bg-[#EEF3FF] blur-3xl opacity-40" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* pagination */}
        {items.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-slate-600">Сторінка {page} з {totalPages}</div>
            <div className="flex items-center gap-2">
              <button onClick={()=> setPage(p => Math.max(1, p-1))} disabled={page<=1} className="px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white disabled:opacity-50 hover:bg-[#F7F9FF]">
                ← Попередня
              </button>
              <button onClick={()=> setPage(p => Math.min(totalPages, p+1))} disabled={page>=totalPages} className="px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white disabled:opacity-50 hover:bg-[#F7F9FF]">
                Наступна →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
