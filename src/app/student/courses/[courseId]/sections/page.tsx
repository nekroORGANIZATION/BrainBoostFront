'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers3,
  Play,
  ArrowLeft,
  Lock,
  Clock3,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/* ========= types ========= */
type Course = { id: number; title: string; image?: string | null; description?: string | null };
type ModuleLite = { id: number; title: string; order: number };
type CourseLessonItem = {
  id: number;
  title: string;
  order: number;
  duration_min?: number | null;
  module?: ModuleLite | null;
  completed?: boolean;
  result_percent?: number | null;
};
type DecoratedLesson = CourseLessonItem & {
  state: 'done' | 'next' | 'locked';
  locked: boolean;
};
type SectionVM = {
  key: string;
  module: ModuleLite | null;
  lessons: DecoratedLesson[];
  total: number;
  done: number;
  pct: number;
  next: DecoratedLesson | null;
};

/* ========= API ========= */
const API = {
  course: (id: string | number) => `https://brainboost.pp.ua/api/courses/${id}/`,
  lessonsOfCourse: (cid: string | number) => `https://brainboost.pp.ua/api/api/lesson/courses/${cid}/lessons/`,
  modulesOfCourse: (cid: string | number) => `https://brainboost.pp.ua/api/api/lesson/courses/${cid}/modules/`,
};

const APIProgress = {
  lesson: (lessonId: number) => `http://127.0.0.1:8000/api/lesson/progress/${lessonId}/`,
};

/* ========= helpers ========= */
const asArray = <T,>(raw: any): T[] =>
  Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];

async function fetchJSON<T>(url: string, tryBearer = true): Promise<T> {
  let res = await fetch(url, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });
  if (res.ok) return (await res.json()) as T;

  if (tryBearer && (res.status === 401 || res.status === 403)) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      res = await fetch(url, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) return (await res.json()) as T;
    }
  }
  const text = await res.text().catch(() => '');
  throw new Error(`${res.status} ${text || res.statusText}`);
}

const fmt = (v?: string | number | null) => (v == null || v === '' ? '—' : String(v));
const keyOfModule = (m: ModuleLite) => `m:${m.id}`;
const idFromKey = (key: string) => (key === 'root' ? 'root' : key.replace('m:', ''));
const EASE = [0.16, 1, 0.3, 1] as const;

/* ========= little UI ========= */
type PillProps = React.PropsWithChildren<{ className?: string }>;
function Pill({ children, className = '' }: PillProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2.5 py-1 rounded-full text-xs font-semibold
        ring-1 ring-white/20 bg-white/10 text-white backdrop-blur
        ${className}
      `}
      style={{ textShadow: '0 1px 6px rgba(0,0,0,.25)' }}
    >
      {children}
    </span>
  );
}

function RingProgress({ value }: { value: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const off = c - (c * Math.min(100, Math.max(0, value))) / 100;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0">
      <circle cx="24" cy="24" r={r} stroke="rgba(255,255,255,.25)" strokeWidth="6" fill="none" />
      <circle
        cx="24"
        cy="24"
        r={r}
        stroke="url(#grad)"
        strokeWidth="6"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <text x="24" y="26" textAnchor="middle" fontSize="12" fill="#0b1220" fontWeight={700}>
        {Math.round(value)}%
      </text>
    </svg>
  );
}

/* ========= page ========= */
export default function SectionsPage() {
  const params = useParams<{ courseId: string }>();
  useSearchParams();
  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLessonItem[]>([]);
  const [modules, setModules] = useState<ModuleLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [open, setOpen] = useState<Set<string>>(new Set());

  /* ========= Завантаження курсу, уроків, модулів ========= */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [c, lesRaw] = await Promise.all([
          fetchJSON<Course>(API.course(courseId)),
          fetchJSON<any>(API.lessonsOfCourse(courseId)),
        ]);
        if (cancelled) return;

        const lessonsData = asArray<CourseLessonItem>(lesRaw).slice();
        lessonsData.sort((a, b) => {
          const ma = a.module?.order ?? 0,
            mb = b.module?.order ?? 0;
          if (ma !== mb) return ma - mb;
          if (a.order !== b.order) return a.order - b.order;
          return a.id - b.id;
        });

        setCourse(c);
        setLessons(lessonsData);

        let mods: ModuleLite[] = [];
        try {
          const modsRaw = await fetchJSON<any>(API.modulesOfCourse(courseId)).catch(() => null);
          mods = asArray<ModuleLite>(modsRaw);
        } catch {}
        if (!mods.length) {
          const uniq = new Map<number, ModuleLite>();
          for (const l of lessonsData) {
            if (l.module && typeof l.module.id === 'number' && !uniq.has(l.module.id)) {
              uniq.set(l.module.id, l.module);
            }
          }
          mods = Array.from(uniq.values());
        }
        mods.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
        setModules(mods);

        const first = mods.find((m) => lessonsData.some((l) => l.module?.id === m.id));
        if (first) setOpen(new Set([keyOfModule(first)]));
      } catch (e: any) {
        if (!cancelled) {
          setErr('Не вдалося завантажити розділи курсу.');
          setCourse(null);
          setLessons([]);
          setModules([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  /* ========= Підтягання прогресу кожного уроку ========= */
  useEffect(() => {
    let cancelled = false;
    if (!lessons.length) return;

    const fetchProgress = async () => {
      const updated = await Promise.all(
        lessons.map(async (l) => {
          try {
            const progress = await fetchJSON<{ state: string; result_percent: number }>(APIProgress.lesson(l.id));
            return {
              ...l,
              completed: progress.state === 'completed',
              result_percent: progress.result_percent,
            };
          } catch {
            return l;
          }
        })
      );
      if (!cancelled) setLessons(updated);
    };

    fetchProgress();

    const onFocus = () => {
      if (!cancelled) fetchProgress();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [lessons]);

  /* ——— Глобальна послідовність уроків ——— */
  const seq = useMemo(() => {
    const ordered = lessons.slice();
    const firstUndoneIdx = ordered.findIndex(l => !l.completed);

    // helper для типобезпечного створення DecoratedLesson
    const decorateLesson = (l: CourseLessonItem, state: 'done' | 'next' | 'locked'): DecoratedLesson => ({
      ...l,
      state,
      locked: state === 'locked',
    });

    const decorated: DecoratedLesson[] = ordered.map((l, idx) => {
      if (l.completed) return decorateLesson(l, 'done');
      if (idx === firstUndoneIdx || firstUndoneIdx === -1) return decorateLesson(l, 'next');
      return decorateLesson(l, 'locked');
    });

    return decorated;
  }, [lessons]);

  /* ——— Групуємо в секції (модулі + root) ——— */
  const sections = useMemo<SectionVM[]>(() => {
    const byKey = new Map<string, DecoratedLesson[]>();
    for (const l of seq) {
      const key = l.module?.id != null ? keyOfModule(l.module) : 'root';
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(l); // тепер TS не свариться
    }

    const out: SectionVM[] = [];

    for (const m of modules) {
      const key = keyOfModule(m);
      const list = (byKey.get(key) ?? []).slice().sort((a, b) => a.order - b.order || a.id - b.id);
      const total = list.length;
      const done = list.filter(x => x.state === 'done').length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      const next = total === 0 ? null : list.find(x => x.state !== 'done') ?? list[list.length - 1] ?? null;
      out.push({ key, module: m, lessons: list, total, done, pct, next });
    }

    const root = (byKey.get('root') ?? []).slice();
    if (root.length || (modules.length === 0 && lessons.length > 0)) {
      root.sort((a, b) => a.order - b.order || a.id - b.id);
      const total = root.length;
      const done = root.filter(x => x.state === 'done').length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      const next = total === 0 ? null : root.find(x => x.state !== 'done') ?? root[root.length - 1] ?? null;
      out.push({ key: 'root', module: null, lessons: root, total, done, pct, next });
    }

    return out.sort((a, b) => (a.module?.order ?? -1) - (b.module?.order ?? -1));
  }, [modules, seq]);


  /* ========= skeleton ========= */
  if (loading) {
    return (
      <main className="min-h-screen relative">
        <Backdrop />
        <div className="relative max-w-6xl mx-auto p-4 sm:p-6">
          <div className="animate-pulse grid gap-4">
            <div className="h-56 rounded-3xl bg-white/15 backdrop-blur ring-1 ring-white/20" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-white/15 ring-1 ring-white/20" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ========= Весь UI ========= */
  return (
    <main className="min-h-screen relative">
      <Backdrop />
      {/* HERO */}
      <section className="relative z-10">
        <div className="relative max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-8 sm:pt-14">
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/20 bg-gradient-to-br from-white/50 via-white/30 to-white/10 backdrop-blur-xl shadow-[0_30px_80px_rgba(2,28,78,.25)] p-5 sm:p-7">
            {/* bg image mask */}
            {course?.image && (
              <Image
                src={course.image}
                alt={course.title}
                fill
                unoptimized
                className="object-cover opacity-20 [mask-image:radial-gradient(60%_80%_at_70%_30%,rgba(0,0,0,.7),transparent)]"
              />
            )}

            <div className="mt-2 flex flex-wrap items-end justify-between gap-4 relative z-10">
              <h1
                className="
                  text-2xl sm:text-4xl md:text-5xl
                  font-black tracking-tight
                  text-white
                  [text-shadow:_0_2px_12px_rgba(0,0,0,.35),_0_1px_0_rgba(0,0,0,.35)]
                "
              >
                {course?.title ?? 'Курс'}
              </h1>

              {/* легенда станів */}
              <div className="flex items-center gap-2">
                <Pill className="bg-emerald-500/20 ring-emerald-300/40 text-emerald-100">✔ Завершено</Pill>
                <Pill className="bg-sky-500/20 ring-sky-300/40 text-sky-100">▶ Наступний</Pill>
                <Pill className="bg-slate-500/25 ring-slate-300/40 text-slate-100">🔒 Заблоковано</Pill>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr_auto] items-center relative z-10">
              {/* Прогрес по курсу */}
              <div className="flex items-center gap-3 rounded-2xl bg-white/50 ring-1 ring-white/30 p-3 backdrop-blur">
                <RingProgress value={overallPercent(sections)} />
                <div>
                  <div className="text-xs text-[#334155]">Загальний прогрес</div>
                  <div className="text-sm font-semibold text-[#0b1220]">
                    {overallDone(sections)}/{overallTotal(sections)} уроків
                  </div>
                </div>
              </div>

              <div className="hidden sm:block h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/student/courses/${courseId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl ring-1 ring-white/30 bg-white/60 text-[#0b1220] hover:bg-white/80 backdrop-blur"
                >
                  <ArrowLeft className="w-4 h-4" /> До огляду курсу
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-white/70">
            Уроки відкриваються послідовно. Після завершення уроку ти автоматично перейдеш до наступного.
          </p>
        </div>
      </section>

      {/* Секції як VERTICAL TIMELINE */}
      <section className="relative z-10 pb-20 pt-6 sm:pt-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
          {sections.length === 0 ? (
            <div className="rounded-2xl bg-white/70 ring-1 ring-white/30 p-6 text-[#0b1220] backdrop-blur">
              {err || 'У цьому курсі ще немає видимих розділів або уроків.'}
            </div>
          ) : (
            <div className="relative before:absolute before:left-[23px] before:top-0 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-indigo-200/70 before:via-sky-200/70 before:to-transparent">
              <ul className="space-y-6">
                {sections.map((sec) => {
                  const sectionId = idFromKey(sec.key);
                  const isOpen = open.has(sec.key);
                  const toggle = () => {
                    const next = new Set(open);
                    if (isOpen) next.delete(sec.key);
                    else next.add(sec.key);
                    setOpen(next);
                  };

                  return (
                    <li key={sec.key} className="relative pl-14">
                      <span className="absolute left-[14px] top-2 w-5 h-5 rounded-full bg-white ring-2 ring-indigo-300 shadow" />

                      <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: EASE }}
                        className="group rounded-2xl ring-1 ring-white/30 bg-white/70 backdrop-blur-xl shadow-[0_16px_44px_rgba(2,28,78,.18)] overflow-hidden"
                      >
                        {/* header секції */}
                        <div className="p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-wider text-[#475569]/80 font-semibold">
                              {sec.module ? 'Розділ' : 'Без розділу'}
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-[#0b1220] truncate">
                              {sec.module?.title ?? 'Без розділу'}
                            </h3>

                            <div className="mt-1 text-sm text-[#475569] flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center gap-1">
                                <Layers3 className="w-4 h-4" />
                                {sec.total} уроків
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                завершено {sec.done}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="hidden sm:block">
                              <RingProgress value={sec.pct} />
                            </div>
                            <div className="grid gap-2">
                              <Link
                                href={`/student/courses/${courseId}/sections/${sectionId}`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl ring-1 ring-white/30 bg-white/80 text-[#0b1220] hover:bg-white"
                              >
                                Перейти до розділу <ChevronRight className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={toggle}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow hover:brightness-110"
                              >
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {isOpen ? 'Приховати уроки' : `Показати уроки (${sec.total})`}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* уроки секції */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: EASE }}
                              className="border-t border-white/30"
                            >
                              <ul className="divide-y divide-white/30">
                                {sec.lessons.length === 0 ? (
                                  <li className="p-5 text-sm text-[#475569]">У цьому розділі уроків ще немає.</li>
                                ) : (
                                  sec.lessons.map((l) => {
                                    const href = `/student/courses/${courseId}/sections/${sectionId}/lessons/${l.id}`;
                                    const done = l.state === 'done';
                                    const locked = l.state === 'locked';
                                    const accent =
                                      done
                                        ? 'from-emerald-500/15 to-emerald-500/5'
                                        : l.state === 'next'
                                        ? 'from-sky-500/20 to-indigo-500/10'
                                        : 'from-slate-400/15 to-slate-400/5';

                                    return (
                                      <li key={l.id} className={`relative p-4 sm:p-5 bg-gradient-to-br ${accent}`}>
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                              {done && (
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                                                  <CheckCircle2 className="w-4 h-4" />
                                                </span>
                                              )}
                                              {locked && (
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700">
                                                  <Lock className="w-3.5 h-3.5" />
                                                </span>
                                              )}
                                              <h4 className="font-semibold text-[#0b1220] truncate">{l.title}</h4>
                                            </div>
                                            <div className="mt-1 text-xs text-[#475569] flex items-center gap-2">
                                              <Clock3 className="w-3.5 h-3.5" />
                                              {l.duration_min ? `${l.duration_min} хв` : 'Тривалість: —'}
                                              {typeof l.result_percent === 'number' && (
                                                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/60 ring-1 ring-white/40 text-[#0b1220]">
                                                  результат: {Math.round(l.result_percent)}%
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {locked ? (
                                            <button
                                              disabled
                                              className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200 text-slate-600 cursor-not-allowed text-sm"
                                              title="Цей урок відкриється після проходження попередніх"
                                            >
                                              Заблоковано
                                            </button>
                                          ) : (
                                            <Link
                                              href={href}
                                              className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm ring-1 ring-white/30 backdrop-blur ${
                                                l.state === 'next'
                                                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white hover:brightness-110'
                                                  : 'bg-white/80 text-[#0b1220] hover:bg-white'
                                              }`}
                                            >
                                              {l.state === 'next' ? <Play className="w-4 h-4" /> : null}
                                              {l.state === 'next' ? 'Пройти' : 'Відкрити'}
                                            </Link>
                                          )}
                                        </div>
                                      </li>
                                    );
                                  })
                                )}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/* ========= background ========= */
function Backdrop() {
  return (
    <>
      <div className="absolute inset-0 -z-30" style={{ background: `linear-gradient(to bottom, var(--scene-from, #E9F0FF) 0%, var(--scene-mid, #F2F6FF) 45%, var(--scene-to, #FFFFFF) 100%)` }} />
      <div className="absolute inset-0 -z-25 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,.16), rgba(255,255,255,.12) 40%, rgba(255,255,255,.08))' }} />
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="absolute -top-28 -left-32 h-[26rem] w-[26rem] rounded-full blur-[110px]" style={{ background: 'radial-gradient(closest-side, rgba(59,91,219,.12), transparent 70%)' }} />
        <div className="absolute top-1/3 -right-28 h-[28rem] w-[28rem] rounded-full blur-[120px]" style={{ background: 'radial-gradient(closest-side, rgba(31,156,240,.10), transparent 70%)' }} />
      </div>
      <div className="absolute inset-0 -z-10 opacity-[0.045]" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,.22) 1px, transparent 1px), radial-gradient(rgba(0,0,0,.10) 1px, transparent 1px)', backgroundPosition: '0 0, 14px 14px', backgroundSize: '28px 28px' }} />
    </>
  );
}

/* ========= helpers ========= */
function overallDone(sections: SectionVM[]) { return sections.reduce((acc, s) => acc + s.done, 0); }
function overallTotal(sections: SectionVM[]) { return sections.reduce((acc, s) => acc + s.total, 0); }
function overallPercent(sections: SectionVM[]) { const total = overallTotal(sections); const done = overallDone(sections); return total ? (done / total) * 100 : 0; }
