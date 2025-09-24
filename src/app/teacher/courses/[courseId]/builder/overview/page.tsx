'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import http, { API_BASE, setAuthHeader } from '@/lib/http';
import { GraduationCap } from 'lucide-react';

/* ===================== TYPES ===================== */
type Course = {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  price?: number | string | null;
  language?: string | null;
  topic?: string | null;
  category?: number | { id: number; name?: string } | string | null;
  status?: 'draft' | 'pending' | 'published';
  rating?: number | string | null;
  students_count?: number | string | null;
  created_at?: string | null;
};

type LessonLite = {
  id: number;
  title: string;
  order?: number;
  is_published?: boolean;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  contents_count?: number;
  duration_min?: number | null;
  cover_image?: string | null;
};

type FetchState = 'idle' | 'loading' | 'done' | 'error';

/* ===================== HELPERS ===================== */
function asArray<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw?.results && Array.isArray(raw.results)) return raw.results as T[];
  if (raw?.data && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}
function n(v: unknown, d = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
}
function mediaUrl(u?: string | null) {
  if (!u) return '';
  if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:')) return u;
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`;
}
function fmt(num: number) {
  return new Intl.NumberFormat('uk-UA').format(num);
}
function moneyUSD(num: number) {
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'USD' }).format(num);
}
function formatDate(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('uk-UA', { year: 'numeric', month: 'short', day: '2-digit' });
}

/* ===================== UI PRIMITIVES ===================== */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-5 shadow-[0_10px_30px_rgba(2,28,78,0.08)] ${className}`}>
      {children}
    </div>
  );
}
function Pill({ tone = 'slate', children }: { tone?: 'slate'|'blue'|'green'|'amber'; children: React.ReactNode }) {
  const map = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-[#EEF3FF] text-[#1345DE]',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
  } as const;
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[tone]}`}>{children}</span>;
}
function StatusPill({ status }: { status?: Course['status'] }) {
  const s = status || 'draft';
  return s === 'published'
    ? <Pill tone="green">Опубліковано</Pill>
    : s === 'pending'
    ? <Pill tone="amber">На модерації</Pill>
    : <Pill>Чернетка</Pill>;
}
function RowSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 items-center py-2">
      <div className="h-4 bg-slate-200 rounded animate-pulse" />
      <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
    </div>
  );
}
function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`px-3 py-2 rounded-lg ring-1 ${ok ? 'ring-emerald-200 bg-emerald-50 text-emerald-700' : 'ring-red-200 bg-red-50 text-red-700'}`}>
      {ok ? '✅' : '⛔'} {children}
    </li>
  );
}

/* ===================== PAGE ===================== */
export default function BuilderOverviewPage() {
  const params = useParams() as { courseId?: string | string[] };
  const courseId = Number(Array.isArray(params?.courseId) ? params!.courseId[0] : params?.courseId);
  const { accessToken } = useAuth();
  const router = useRouter();

  const [state, setState] = useState<FetchState>('idle');
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<LessonLite[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyCreate, setBusyCreate] = useState(false);
  const [notFound, setNotFound] = useState(false); // 404 guard

  // важливо: прокинути токен у axios-інстанс (щоб спрацював refresh)
  useEffect(() => {
    if (accessToken) setAuthHeader(accessToken);
  }, [accessToken]);

  /* ---------- safe loaders з фолбеками шляхів ---------- */
  async function loadCourse(cid: number) {
    const paths = [
      `/courses/${cid}/`,
      `/api/courses/${cid}/`,
      `/course/${cid}/`,
    ];
    for (const p of paths) {
      try {
        const r = await http.get(p);
        return r.data as Course;
      } catch (e: any) {
        if (e?.response?.status === 404) continue;
      }
    }
    const err = new Error('COURSE_NOT_FOUND');
    // @ts-ignore
    err.code = 404;
    throw err;
  }

  async function loadLessons(cid: number) {
    const variants = [
      ['/lesson/admin/lessons/', { course: cid, ordering: 'order' }],
      ['/api/lesson/admin/lessons/', { course: cid, ordering: 'order' }],
      ['/lesson/lessons/', { course: cid, ordering: 'order' }],
      ['/lesson/public/lessons/', { course: cid, ordering: 'order' }],
    ] as const;

    for (const [url, params] of variants) {
      try {
        const r = await http.get(url, { params });
        return asArray<LessonLite>(r.data);
      } catch {
        // пробуємо наступний
      }
    }
    return [] as LessonLite[];
  }

  useEffect(() => {
    if (!courseId || !accessToken) return;
    let cancelled = false;

    (async () => {
      setState('loading');
      setErr(null);
      setNotFound(false);
      try {
        // 1) курс
        const courseData = await loadCourse(courseId);
        if (cancelled) return;
        setCourse({
          ...courseData,
          image: courseData?.image ? mediaUrl(courseData.image) : null,
          status: (courseData?.status || 'draft') as Course['status'],
          rating: n(courseData?.rating, 0),
          students_count: n(courseData?.students_count, 0),
        });

        // 2) уроки
        const listRaw = await loadLessons(courseId);
        if (cancelled) return;
        const list = listRaw.map((l: any) => ({
          id: l.id,
          title: l.title,
          order: l.order ?? 0,
          is_published:
            typeof l.is_published === 'boolean'
              ? l.is_published
              : (l.status ? String(l.status).toLowerCase() === 'published' : false),
          status: (l.status || (l.is_published ? 'published' : 'draft')) as LessonLite['status'],
          contents_count: typeof l.contents_count === 'number'
            ? l.contents_count
            : Array.isArray(l.contents)
            ? l.contents.length
            : undefined,
          duration_min: typeof l.duration_min === 'number' ? l.duration_min : null,
          cover_image: l.cover_image ? mediaUrl(l.cover_image) : null,
        }));
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setLessons(list);

        setState('done');
      } catch (e: any) {
        if (cancelled) return;
        if (e?.code === 404 || e?.response?.status === 404) {
          setNotFound(true);
          setState('error');
          return;
        }
        const status = e?.response?.status;
        const detail = e?.response?.data?.detail || e?.message || 'Не вдалося завантажити дані.';
        setErr(status ? `${status}: ${detail}` : String(detail));
        setState('error');
      }
    })();

    return () => { cancelled = true; };
  }, [courseId, accessToken]);

  /* ---------- Створити перший урок (з фолбеками) ---------- */
  async function createFirstLesson() {
    if (!courseId || busyCreate) return;
    setBusyCreate(true);
    setErr(null);

    // наступний порядковий номер + назва
    const nextOrder = (lessons.reduce((m, l) => Math.max(m, l.order || 0), 0) || 0) + 1;
    const title = lessons.length === 0 ? 'Перший урок' : `Урок ${nextOrder}`;

    const candidates = [
      '/lesson/admin/lessons/',
      '/api/lesson/admin/lessons/',
      '/lesson/lessons/',
    ];
    const payload: any = { course: courseId, title, order: nextOrder, status: 'draft' };

    let createdId: number | null = null;
    for (const url of candidates) {
      try {
        const r = await http.post(url, payload);
        createdId = r?.data?.id ?? r?.data?.pk ?? null;
        if (createdId) break;
      } catch { /* try next */ }
    }

    setBusyCreate(false);

    if (!createdId) {
      setErr('Не вдалося створити урок. Перевір API-шляхи для створення.');
      return;
    }

    // За замовчуванням ведемо у НОВИЙ редактор
    router.push(`/teacher/courses/${courseId}/builder/lessons/${createdId}/new`);
  }

  const stats = useMemo(() => {
    const total = lessons.length;
    const published = lessons.filter((l) => l.is_published || l.status === 'published').length;
    const withContent = lessons.filter((l) => (l.contents_count ?? 0) > 0).length;
    const duration = lessons.reduce((s, l) => s + (l.duration_min || 0), 0);
    return { total, published, withContent, duration };
  }, [lessons]);

  const readiness = useMemo(() => {
    const title = !!course?.title && course.title.trim().length >= 4;
    const desc = !!course?.description && (course.description || '').trim().length >= 40;
    const cover = !!course?.image;
    const priceOK = Number.isFinite(n(course?.price, 0)) && n(course?.price, 0) >= 0;
    const langOK = !!course?.language && String(course?.language || '').trim().length > 0;
    const topicOK = !!course?.topic && String(course?.topic || '').trim().length > 0;
    const categoryOK = !!course?.category;
    const hasLessons = stats.total > 0;
    const lessonsHaveContent = stats.withContent === stats.total && stats.total > 0;

    const readyForPublish =
      title && desc && cover && priceOK && langOK && topicOK && categoryOK && hasLessons && lessonsHaveContent;

    return { title, desc, cover, priceOK, langOK, topicOK, categoryOK, hasLessons, lessonsHaveContent, readyForPublish };
  }, [course, stats]);

  const isDraft = (course?.status || 'draft') === 'draft';
  const isPending = course?.status === 'pending';
  const isPublished = course?.status === 'published';

  /* ---------- Guards ---------- */
  if (!accessToken) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top grid place-items-center px-6">
        <Card className="max-w-xl text-center">
          <h1 className="text-2xl font-extrabold text-[#0F2E64]">Потрібен вхід</h1>
          <p className="text-slate-700 mt-1">Щоб керувати курсом — увійди.</p>
          <div className="mt-4">
            <Link href="/login" className="inline-flex items-center px-5 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">
              Увійти
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top grid place-items-center px-6">
        <Card className="max-w-xl text-center">
          <h1 className="text-2xl font-extrabold text-[#0F2E64]">Курс не знайдено (404)</h1>
          <p className="text-slate-700 mt-1">Можливо, курс видалено або у тебе немає доступу.</p>
          <div className="mt-4 flex gap-3 justify-center">
            <Link href="/teacher/courses" className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">
              ← До списку курсів
            </Link>
            <Link href="/teacher/courses/new" className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">
              + Створити новий
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  /* ---------- UI ---------- */
  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-20">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-slate-600">Конструктор курсу</div>
            <h1 className="text-[28px] sm:text-[36px] font-extrabold text-[#0F2E64] truncate">
              {course?.title || 'Курс'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={course?.status} />
              <Pill tone="slate">Створено: {formatDate(course?.created_at)}</Pill>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* FIX 404: використовуємо /builder/program, а не /builder/lessons */}
            <Link href={`/teacher/courses/${courseId}/builder/program`} className="px-4 py-2 rounded-xl bg-[#1345DE] text-white font-semibold">
              Перейти до розділів
            </Link>
            <Link
              href="/teacher"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition text-[#0F2E64]"
              title="Teacher Hub"
            >
              <GraduationCap className="w-4 h-4" />
              Teacher Hub
            </Link>
          </div>
        </div>

        {/* ERRORS */}
        {err && (
          <div className="mt-4 rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 break-words">
            {err}
          </div>
        )}

        {/* GRID */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Course hero card */}
            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-4">
                <div className="rounded-xl overflow-hidden ring-1 ring-[#E5ECFF] bg-slate-100 aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {state === 'loading' ? (
                    <div className="w-full h-full animate-pulse bg-slate-200" />
                  ) : course?.image ? (
                    <img src={course.image} alt={course.title || 'cover'} className="w-full h-full object-cover" />
                  ) : null}
                </div>

                <div className="min-w-0">
                  <div className="text-sm text-slate-600">Стан курсу</div>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusPill status={course?.status} />
                    <span className="text-sm text-slate-600">
                      {isDraft ? 'Чернетка — додайте уроки та контент.' :
                       isPending ? 'На модерації — очікуйте перевірку.' :
                       'Опубліковано — курс доступний студентам.'}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <KPI label="Уроків" value={fmt(stats.total)} />
                    <KPI label="Опубліковані" value={fmt(stats.published)} />
                    <KPI label="З контентом" value={fmt(stats.withContent)} />
                    <KPI label="Тривалість" value={`${fmt(stats.duration)} хв`} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-slate-500">Ціна</div>
                      <div className="font-semibold">{n(course?.price, 0) === 0 ? 'Безкоштовно' : moneyUSD(n(course?.price, 0))}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Рейтинг</div>
                      <div className="font-semibold">{n(course?.rating, 0).toFixed(1)} ★</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Студентів</div>
                      <div className="font-semibold">{fmt(n(course?.students_count, 0))}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Мова</div>
                      <div className="font-semibold">{course?.language || '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Checklist */}
            <Card>
              <h3 className="text-[#0F2E64] font-extrabold text-[18px]">Готовність до публікації</h3>
              {state === 'loading' ? (
                <div className="mt-3">
                  <RowSkeleton /><RowSkeleton /><RowSkeleton /><RowSkeleton />
                </div>
              ) : (
                <>
                  {/* прогрес */}
                  <div className="mt-3">
                    {(() => {
                      const items = [
                        readiness.title, readiness.desc, readiness.cover, readiness.priceOK,
                        readiness.langOK, readiness.topicOK, readiness.categoryOK,
                        readiness.hasLessons, readiness.lessonsHaveContent,
                      ];
                      const done = items.filter(Boolean).length;
                      const pc = Math.round((done / items.length) * 100);
                      return (
                        <div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1345DE]" style={{ width: `${pc}%` }} />
                          </div>
                          <div className="mt-1 text-xs text-slate-600">{pc}% завершено</div>
                        </div>
                      );
                    })()}
                  </div>

                  <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
                    <Check ok={readiness.title}>Назва (мін. 4 символи)</Check>
                    <Check ok={readiness.desc}>Опис (мін. 40 символів)</Check>
                    <Check ok={readiness.cover}>Обкладинка завантажена</Check>
                    <Check ok={readiness.priceOK}>Ціна валідна (або 0 для безкоштовного)</Check>
                    <Check ok={readiness.langOK}>Вказана мова</Check>
                    <Check ok={readiness.topicOK}>Вказана тема</Check>
                    <Check ok={readiness.categoryOK}>Обрана категорія</Check>
                    <Check ok={readiness.hasLessons}>Є хоча б один урок</Check>
                    <Check ok={readiness.lessonsHaveContent}>Усі уроки мають контент</Check>
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* FIX 404: ведемо у /builder/program */}
                    <Link
                      href={`/teacher/courses/${courseId}/builder/publish`}
                      className={`px-4 py-2 rounded-xl ${readiness.readyForPublish ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600 cursor-not-allowed'}`}
                    >
                      Перейти до публікації
                    </Link>
                  </div>

                  {/* якщо уроків ще немає — швидке створення */}
                  {!readiness.hasLessons && (
                    <div className="mt-3">
                      <button
                        onClick={createFirstLesson}
                        disabled={busyCreate}
                        className="px-4 py-2 rounded-xl bg-[#1345DE] text-white font-semibold disabled:opacity-60"
                      >
                        {busyCreate ? 'Створюємо…' : '+ Додати перший урок і перейти до редагування'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Recent lessons preview */}
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-[#0F2E64] font-extrabold text-[18px]">Останні уроки</h3>
                {/* FIX 404 */}
                <Link href={`/teacher/courses/${courseId}/builder/program`} className="text-[#1345DE] hover:underline text-sm">
                  Вся програма →
                </Link>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {state === 'loading' && (
                  <>
                    <div className="h-24 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="h-24 rounded-xl bg-slate-200 animate-pulse" />
                  </>
                )}
                {state !== 'loading' && lessons.length === 0 && (
                  <div className="col-span-full text-slate-600 text-sm">
                    Уроків ще немає.
                  </div>
                )}
                {lessons.slice(0, 6).map((l) => (
                  <Link
                    key={l.id}
                    href={`/teacher/courses/${courseId}/builder/lessons/${l.id}/new`}
                    className="rounded-xl ring-1 ring-[#E5ECFF] p-3 bg-white hover:shadow transition"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-12 rounded-lg overflow-hidden ring-1 ring-[#E5ECFF] bg-slate-100 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {l.cover_image ? <img src={l.cover_image} alt={l.title} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{l.title}</div>
                        <div className="text-xs text-slate-600">
                          {(l.is_published || l.status === 'published') ? 'Опубліковано' : 'Чернетка'} · Контент: {l.contents_count ?? '—'}
                          {typeof l.duration_min === 'number' ? ` · ${l.duration_min} хв` : ''}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* RIGHT */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Quick actions */}
            <Card>
              <h3 className="text-[#0F2E64] font-extrabold text-[18px]">Швидкі дії</h3>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <button
                  onClick={createFirstLesson}
                  disabled={busyCreate}
                  className="rounded-xl ring-1 ring-[#E5ECFF] p-3 hover:ring-[#1345DE] transition text-left disabled:opacity-60"
                >
                  + Додати урок
                </button>
                {/* FIX 404 */}
                <Link href={`/teacher/courses/${courseId}/builder/assessments`} className="rounded-xl ring-1 ring-[#E5ECFF] p-3 hover:ring-[#1345DE] transition">
                  Налаштувати тести
                </Link>
                <Link href={`/teacher/courses/${courseId}/builder/students`} className="rounded-xl ring-1 ring-[#E5ECFF] p-3 hover:ring-[#1345DE] transition">
                  Студенти
                </Link>
                <Link href={`/teacher/courses/${courseId}/builder/danger`} className="rounded-xl ring-1 ring-red-200 p-3 hover:bg-red-50 transition text-red-700">
                  Видалити курс
                </Link>
              </div>
            </Card>

            {/* Course card preview */}
            <Card>
              <h3 className="text-[#0F2E64] font-extrabold text-[18px]">Превʼю картки</h3>
              <div className="mt-3 rounded-lg overflow-hidden ring-1 ring-[#E5ECFF]">
                <div className="aspect-video bg-slate-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {course?.image ? <img src={course.image} alt={course?.title || 'preview'} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="p-3">
                  <div className="font-semibold truncate">{course?.title || '—'}</div>
                  <div className="text-xs text-slate-600 line-clamp-2">{course?.description || '—'}</div>
                  <div className="mt-2 text-sm font-semibold">
                    {n(course?.price, 0) === 0 ? 'Безкоштовно' : moneyUSD(n(course?.price, 0))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ===================== SMALL KPI ===================== */
function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F7F9FF] ring-1 ring-[#E5ECFF] p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-extrabold text-[#0F2E64] leading-tight">{value}</div>
    </div>
  );
}
