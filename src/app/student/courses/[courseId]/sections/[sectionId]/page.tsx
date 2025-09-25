'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  BookOpen,
  Clock3,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

/* ========= types (узгоджені з беком) ========= */
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
type Decorated = CourseLessonItem & { state: 'done' | 'next' | 'locked'; locked: boolean };

/* ========= API ========= */
const API = {
  course: (id: string | number) => `http://127.0.0.1:8000/api/courses/${id}/`,
  lessonsOfCourse: (cid: string | number) => `http://127.0.0.1:8000/api/lesson/courses/${cid}/lessons/`,
  modulesOfCourse: (cid: string | number) =>
    `http://127.0.0.1:8000/api/lesson/public/courses/${cid}/modules/`, // може не існувати
};

/* ========= helpers ========= */
const asArray = <T,>(raw: any): T[] => (Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []);
async function fetchJSON<T>(url: string, tryBearer = true): Promise<T> {
  let res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'include', cache: 'no-store' });
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
const EASE = [0.16, 1, 0.3, 1] as const;

/* ========= tiny ui ========= */
type PillProps = React.PropsWithChildren<{ className?: string }>;
function Pill({ children, className = '' }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-white/20 bg-white/10 text-white backdrop-blur ${className}`}
      style={{ textShadow: '0 1px 6px rgba(0,0,0,.25)' }}
    >
      {children}
    </span>
  );
}
function Ring({ value, size = 120 }: { value: number; size?: number }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const off = c - (c * Math.min(100, Math.max(0, value))) / 100;
  const mid = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <circle cx={mid} cy={mid} r={r} stroke="rgba(255,255,255,.28)" strokeWidth="10" fill="none" />
      <circle
        cx={mid}
        cy={mid}
        r={r}
        stroke="url(#grad)"
        strokeWidth="10"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform={`rotate(-90 ${mid} ${mid})`}
      />
      <text x={mid} y={mid + 6} textAnchor="middle" fontSize={20} fontWeight={800} fill="#0b1220">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

/* ========= page ========= */
export default function SectionPage() {
  const params = useParams<{ courseId: string; sectionId: string }>();
  const search = useSearchParams();
  const debug = search?.get('debug') === '1';

  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId;
  const sectionId = Array.isArray(params.sectionId) ? params.sectionId[0] : params.sectionId; // "root" | number-like

  const [course, setCourse] = React.useState<Course | null>(null);
  const [lessonsAll, setLessonsAll] = React.useState<CourseLessonItem[]>([]);
  const [modules, setModules] = React.useState<ModuleLite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [diag, setDiag] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setDiag(null);

        const [c, lesRaw] = await Promise.all([
          fetchJSON<Course>(API.course(courseId)),
          fetchJSON<any>(API.lessonsOfCourse(courseId)),
        ]);
        if (cancelled) return;

        const lessons = asArray<CourseLessonItem>(lesRaw).slice();
        lessons.sort((a, b) => {
          const ma = a.module?.order ?? 0,
            mb = b.module?.order ?? 0;
          if (ma !== mb) return ma - mb;
          if (a.order !== b.order) return a.order - b.order;
          return a.id - b.id;
        });

        // modules from API or fallback from lessons
        let mods: ModuleLite[] = [];
        try {
          const modsRaw = await fetchJSON<any>(API.modulesOfCourse(courseId)).catch(() => null);
          mods = asArray<ModuleLite>(modsRaw);
        } catch {}
        if (!Array.isArray(mods) || mods.length === 0) {
          const uniq = new Map<number, ModuleLite>();
          for (const l of lessons) {
            if (l.module && typeof l.module.id === 'number' && !uniq.has(l.module.id)) uniq.set(l.module.id, l.module);
          }
          mods = Array.from(uniq.values());
        }
        mods.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);

        setCourse(c);
        setLessonsAll(lessons);
        setModules(mods);

        setDiag(
          [
            `courseId=${courseId} sectionId=${sectionId}`,
            `modules=${mods.length} [${mods.map((m) => `${m.id}:${m.title}`).join(' | ')}]`,
            `lessons=${lessons.length} [${lessons
              .slice(0, 8)
              .map((l) => `${l.id}->m:${l.module?.id ?? 'root'}`)
              .join(', ')}${lessons.length > 8 ? ', ...' : ''}]`,
          ].join('\n'),
        );
      } catch (e: any) {
        if (!cancelled) {
          setErr('Не вдалося завантажити розділ.');
          setCourse(null);
          setLessonsAll([]);
          setModules([]);
          setDiag(String(e?.message || e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, sectionId]);

  /* —— фільтруємо уроки поточної секції та робимо послідовність (done → next → locked) —— */
  const { sectionTitle, decorated, total, done, pct, nextLesson } = React.useMemo(() => {
    const isRoot = sectionId === 'root';
    let title = isRoot ? 'Без розділу' : 'Розділ';

    if (!isRoot) {
      const sidNum = Number(sectionId);
      const m = modules.find((x) => x.id === sidNum);
      if (m) title = m.title;
      else {
        const l = lessonsAll.find((x) => x.module?.id === sidNum);
        if (l?.module?.title) title = l.module.title;
      }
    }

    const ls = lessonsAll.filter((l) => (sectionId === 'root' ? !l.module : l.module?.id === Number(sectionId)));
    ls.sort((a, b) => a.order - b.order || a.id - b.id);

    const firstUndoneIdx = ls.findIndex((x) => !x.completed);
    const decorated: Decorated[] = ls.map((l, idx) => {
      if (l.completed) return { ...l, state: 'done', locked: false };
      if (idx === firstUndoneIdx || firstUndoneIdx === -1) return { ...l, state: 'next', locked: false };
      return { ...l, state: 'locked', locked: true };
    });

    const total = ls.length;
    const done = ls.filter((x) => !!x.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const next = total === 0 ? null : ls.find((x) => !x.completed) ?? ls[ls.length - 1] ?? null;

    return { sectionTitle: title, decorated, total, done, pct, nextLesson: next };
  }, [lessonsAll, modules, sectionId]);

  const continueHref =
    nextLesson && `/student/courses/${courseId}/sections/${sectionId}/lessons/${nextLesson.id}`;

  /* ========= skeleton ========= */
  if (loading) {
    return (
      <main className="min-h-screen relative" style={darkVars()}>
        <Backdrop />
        <div className="relative max-w-6xl mx-auto p-6">
          <div className="animate-pulse grid gap-6">
            <div className="h-56 rounded-3xl bg-white/15 ring-1 ring-white/20 backdrop-blur" />
            <div className="h-40 rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur" />
          </div>
        </div>
      </main>
    );
  }

  /* ========= render ========= */
  return (
    <main className="min-h-screen relative" style={darkVars()}>
      <Backdrop />

      {/* HERO (glass, без дублю контенту) */}
      <section className="relative z-10">
        <div className="relative max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-8 sm:pt-14">
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/15 bg-white/10 backdrop-blur-xl shadow-[0_40px_100px_rgba(0,0,0,.35)]">
            {course?.image && (
              <div className="absolute inset-0 -z-10">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  unoptimized
                  className="object-cover opacity-[.16] [mask-image:linear-gradient(120deg,rgba(0,0,0,.9),rgba(0,0,0,.6)_45%,transparent_70%)]"
                />
              </div>
            )}

            <div className="grid gap-8 p-6 sm:p-8 md:p-10 lg:grid-cols-[1.1fr_.9fr]">
              {/* left */}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white/80 inline-flex items-center gap-2">
                  <Link href={`/student/courses/${courseId}`} className="underline underline-offset-2">
                    Курс
                  </Link>
                  <span className="opacity-60">/</span>
                  <Link href={`/student/courses/${courseId}/sections`} className="underline underline-offset-2">
                    Розділи
                  </Link>
                </div>

                <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white [text-shadow:_0_4px_16px_rgba(0,0,0,.45)]">
                  {sectionTitle}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Pill className="bg-emerald-500/20 ring-emerald-300/40 text-emerald-100">✔ Завершено</Pill>
                  <Pill className="bg-sky-500/20 ring-sky-300/40 text-sky-100">▶ Наступний</Pill>
                  <Pill className="bg-slate-500/25 ring-slate-300/40 text-slate-100">🔒 Заблоковано</Pill>
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="flex items-center justify-between text-sm text-slate-200/90">
                    <span>Прогрес розділу</span>
                    <span className="font-semibold text-white">
                      {done}/{total} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden ring-1 ring-white/20">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: EASE }}
                    />
                  </div>

                  <div className="hidden sm:flex">
                    {continueHref ? (
                      <Link
                        href={continueHref}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow hover:brightness-110"
                      >
                        <Play className="w-5 h-5" />
                        {done === 0 ? 'Почати розділ' : done < total ? 'Продовжити' : 'Повторити'}
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 text-white/60 ring-1 ring-white/20 cursor-not-allowed"
                      >
                        <Play className="w-5 h-5" />
                        Немає уроків у розділі
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* right */}
              <div className="flex flex-col items-center lg:items-end gap-5">
                <div className="relative grid place-items-center">
                  <Ring value={pct} />
                  <span className="absolute -bottom-3 text-xs text-slate-200/90">
                    {done}/{total} завершено
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-white/20 bg-white/10 text-slate-100 backdrop-blur">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">Уроки відкриваються послідовно</span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-white/70">
            Після завершення уроку автоматично відкриється наступний у цьому розділі.
          </p>
        </div>
      </section>

      {/* Лист уроків секції: компактні glass-карти з переходами */}
      <section className="relative z-10 pb-20 pt-6 sm:pt-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
          {decorated.length === 0 ? (
            <div className="rounded-2xl ring-1 ring-white/20 bg-white/10 backdrop-blur p-6 text-white">
              У цьому розділі поки що немає уроків.
              <div className="mt-4">
                <Link
                  href={`/student/courses/${courseId}/sections`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl ring-1 ring-white/25 bg-white/15 text-white/90 hover:bg-white/20"
                >
                  <ArrowLeft className="w-4 h-4" />
                  До розділів
                </Link>
              </div>
            </div>
          ) : (
            <ul className="grid gap-3">
              {decorated.map((l) => {
                const href = `/student/courses/${courseId}/sections/${sectionId}/lessons/${l.id}`;
                const isDone = l.state === 'done';
                const isNext = l.state === 'next';
                const isLocked = l.state === 'locked';

                const accent =
                  isDone
                    ? 'from-emerald-500/18 to-emerald-500/8'
                    : isNext
                    ? 'from-sky-500/22 to-violet-500/12'
                    : 'from-slate-400/15 to-slate-400/6';

                return (
                  <motion.li
                    key={l.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className={`rounded-2xl overflow-hidden ring-1 ring-white/20 bg-white/10 backdrop-blur shadow-[0_16px_44px_rgba(0,0,0,.25)]`}
                  >
                    <div className={`p-4 sm:p-5 bg-gradient-to-br ${accent}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-white">
                            {isDone && (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-4 h-4" />
                              </span>
                            )}
                            {isLocked && (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700">
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <h4 className="font-semibold text-white/95 truncate">{l.title}</h4>
                          </div>
                          <div className="mt-1 text-xs text-slate-200/90 flex flex-wrap items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5" />
                            Урок #{l.order}
                            <span className="opacity-60">•</span>
                            <Clock3 className="w-3.5 h-3.5" />
                            {l.duration_min ? `${l.duration_min} хв` : 'Тривалість: —'}
                            {typeof l.result_percent === 'number' && (
                              <>
                                <span className="opacity-60">•</span>
                                Результат: {Math.round(l.result_percent)}%
                              </>
                            )}
                          </div>
                        </div>

                        {/* CTA */}
                        {isLocked ? (
                          <button
                            disabled
                            className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-white/60 ring-1 ring-white/20 cursor-not-allowed text-sm"
                            title="Цей урок відкриється після проходження попередніх"
                          >
                            Заблоковано
                          </button>
                        ) : (
                          <Link
                            href={href}
                            className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm ring-1 ring-white/30 backdrop-blur ${
                              isNext
                                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:brightness-110'
                                : 'bg-white/15 text-white hover:bg-white/20'
                            }`}
                          >
                            {isNext ? <Play className="w-4 h-4" /> : null}
                            {isNext ? 'Пройти' : isDone ? 'Переглянути' : 'Відкрити'}
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>

        {/* діагностика за потреби */}
        {(debug || (!!err && decorated.length === 0)) && (
          <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 mt-4">
            <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-3 text-amber-900 text-sm whitespace-pre-wrap">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <b>Діагностика</b>
                  {'\n'}
                  {err ? `error: ${err}\n` : ''}
                  {diag}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* sticky CTA для мобільних */}
        <div className="sm:hidden fixed bottom-3 left-0 right-0 px-4 z-40">
          <div
            className="rounded-2xl shadow-[0_14px_38px_rgba(0,0,0,.35)] ring-1 ring-white/20 bg-white/15 backdrop-blur flex items-center justify-between px-4 py-2.5"
            style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
          >
            <div className="text-sm">
              <div className="text-slate-200/90">Розділ</div>
              <div className="font-semibold text-white truncate max-w-[52vw]">{sectionTitle}</div>
            </div>
            {continueHref ? (
              <Link
                href={continueHref}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2"
              >
                <Play className="w-4 h-4" />
                Далі
              </Link>
            ) : (
              <button className="inline-flex items-center gap-2 rounded-xl bg-white/10 text-white/60 px-4 py-2 ring-1 ring-white/20" disabled>
                <Play className="w-4 h-4" />
                Немає уроків
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ========= backdrop ========= */
function Backdrop() {
  return (
    <>
      <div
        className="absolute inset-0 -z-30"
        style={{
          background: `linear-gradient(160deg,
            var(--scene-from) 0%,
            var(--scene-mid) 55%,
            var(--scene-to) 100%)`,
        }}
      />
      {/* noise */}
      <div
        className="absolute inset-0 -z-20 opacity-[0.06] mix-blend-soft-light"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,.4) 1px, transparent 1px), radial-gradient(rgba(255,255,255,.25) 1px, transparent 1px)',
          backgroundPosition: '0 0, 12px 12px',
          backgroundSize: '24px 24px',
        }}
      />
      {/* corner glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-60"
          style={{ background: 'radial-gradient(closest-side, rgba(124,58,237,.18), transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -right-24 h-[26rem] w-[26rem] rounded-full blur-3xl opacity-60"
          style={{ background: 'radial-gradient(closest-side, rgba(6,182,212,.16), transparent 70%)' }}
        />
      </div>
    </>
  );
}

/* ========= theme vars ========= */
function darkVars(): React.CSSProperties {
  return {
    ['--scene-from' as any]: '#9fbcffff',
    ['--scene-mid' as any]: '#cccbddef',
    ['--scene-to' as any]: '#8686b6ff',
  } as React.CSSProperties;
}
