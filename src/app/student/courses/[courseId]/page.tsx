'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Globe2,
  Layers3,
  Star,
  Trophy,
  Target,
  Clock3,
  Sparkles,
  BookOpen,
} from 'lucide-react';

/* ========= types ========= */
type Course = {
  id: number;
  title: string;
  description: string;
  image?: string | null;
  price?: number | null;
  language?: string | null;
  language_name?: string | null;
  topic?: string | null;
  category_name?: string | null;
  total_lessons?: number | null;
  rating?: string | number | null;
};

type ModuleLite = { id: number; title: string; order: number };

type CourseLessonItem = {
  id: number;
  title: string;
  duration_min?: number | null;
  order: number;
  module?: ModuleLite | null;
  completed?: boolean;
  result_percent?: number | null;
};

type DecoratedLesson = CourseLessonItem & {
  state: 'done' | 'next' | 'locked';
  locked: boolean;
};

/* ========= API ========= */
const API = {
  course: (id: string | number) => `http://127.0.0.1:8000/api/courses/${id}/`,
  lessonsOfCourse: (cid: string | number) => `http://127.0.0.1:8000/api/lesson/courses/${cid}/lessons/`,
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
const sectionIdOf = (l?: CourseLessonItem | null) => (l?.module?.id != null ? String(l.module.id) : 'root');

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < rounded ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'} />
      ))}
    </div>
  );
}

function Ring({ value, size = 130 }: { value: number; size?: number }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const off = c - (c * Math.min(100, Math.max(0, value))) / 100;
  const mid = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <circle cx={mid} cy={mid} r={r} stroke="rgba(255,255,255,.35)" strokeWidth="10" fill="none" />
      <circle
        cx={mid}
        cy={mid}
        r={r}
        stroke="url(#g)"
        strokeWidth="10"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform={`rotate(-90 ${mid} ${mid})`}
      />
      <text x={mid} y={mid + 6} textAnchor="middle" fontSize={22} fontWeight={800} fill="#0b1220">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

/* ========= PAGE ========= */
export default function CoursePage() {
  const router = useRouter();
  const params = useParams<{ courseId: string }>();
  const search = useSearchParams();
  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId;

  const [course, setCourse] = React.useState<Course | null>(null);
  const [lessons, setLessons] = React.useState<CourseLessonItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<'lesson' | 'test' | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [c, lesRaw] = await Promise.all([
          fetchJSON<Course>(API.course(courseId)),
          fetchJSON<CourseLessonItem[]>(API.lessonsOfCourse(courseId)),
        ]);
        if (cancelled) return;

        const sorted = asArray<CourseLessonItem>(lesRaw)
          .slice()
          .sort((a, b) => {
            const ma = a.module?.order ?? 0,
              mb = b.module?.order ?? 0;
            if (ma !== mb) return ma - mb;
            if (a.order !== b.order) return a.order - b.order;
            return a.id - b.id;
          });

        setCourse(c);
        setLessons(sorted);
        setErr(null);
      } catch {
        if (!cancelled) {
          setErr('Не вдалося завантажити курс або уроки.');
          setCourse(null);
          setLessons([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  // toast із ?just=lesson|test
  React.useEffect(() => {
    const j = search.get('just');
    if (j === 'lesson' || j === 'test') {
      setToast(j);
      const sp = new URLSearchParams(search.toString());
      sp.delete('just');
      router.replace(`?${sp.toString()}`, { scroll: false });
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [search, router]);

  // послідовність і progress
  const seq = React.useMemo(() => {
    const ordered = lessons.slice();
    const firstUndoneIdx = ordered.findIndex((l) => !l.completed);
    const next = firstUndoneIdx >= 0 ? ordered[firstUndoneIdx] : ordered[ordered.length - 1] ?? null;

    const decorated: DecoratedLesson[] = ordered.map((l, idx) => {
      if (l.completed) return { ...l, state: 'done', locked: false };
      if (idx === firstUndoneIdx || firstUndoneIdx === -1) return { ...l, state: 'next', locked: false };
      return { ...l, state: 'locked', locked: true };
    });

    const done = ordered.filter((l) => !!l.completed).length;
    const pct = ordered.length ? Math.round((done / ordered.length) * 100) : 0;

    return { ordered: decorated, next, pct, done, total: ordered.length };
  }, [lessons]);

  const ratingNumber = React.useMemo(() => {
    const v = typeof course?.rating === 'string' ? parseFloat(course.rating) : course?.rating ?? 0;
    return Number.isFinite(v) ? Number(v) : 0;
  }, [course?.rating]);

  const startHref = `/student/courses/${courseId}/sections`;
  const continueHref = seq.next
    ? `/student/courses/${courseId}/sections/${sectionIdOf(seq.next)}/lessons/${seq.next.id}`
    : startHref;

  /* ========= loading / error ========= */
  if (loading) {
    return (
      <main className="min-h-screen relative">
        <Backdrop />
        <div className="relative max-w-6xl mx-auto p-6">
          <div className="animate-pulse grid gap-6">
            <div className="h-64 rounded-3xl bg-white/15 backdrop-blur ring-1 ring-white/20" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/15 ring-1 ring-white/20" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (err || !course) {
    return (
      <main className="min-h-screen relative grid place-items-center p-6">
        <Backdrop />
        <div className="relative max-w-lg w-full rounded-2xl bg-white/95 backdrop-blur ring-1 ring-slate-200 p-6 text-center shadow-[0_16px_44px_rgba(2,28,78,.12)]">
          <p className="text-lg font-semibold text-slate-800 mb-2">Помилка</p>
          <p className="text-slate-600">{err || 'Курс не знайдено.'}</p>
        </div>
      </main>
    );
  }

  /* ========= THEME SHARED VARIABLES =========
     Змінюй сміливо — решта авто-підлаштується.
     TUNE: базові кольори градієнта (менш контрастні, ніж було)
  */
  const THEME = {
    // TUNE: градієнтні точки (від світлішого до темнішого)
    sceneFrom: '#A6B3CF', // було #78839B
    sceneMid: '#4B6AA8',  // було #2D4479
    sceneTo:  '#0F1F2D',  // було #0A0F1C

    // TUNE: декоративні акценти для карток
    accentA: 'rgba(177,132,255,0.22)',
    accentB: 'rgba(180,179,255,0.90)',

    // TUNE: інтенсивність "білої вуалі" (0..1)
    veilTop: 0.14,
    veilMid: 0.10,
    veilBottom: 0.06,

    // TUNE: зернистість (0..1) і розмір «крапок»
    noiseOpacity: 0.05,
    noiseStep: 24, // px

    // TUNE: «рамка» (центральна капсула) — радіус і прозора тінь
    frameRadius: 32,     // px
    frameInnerOpacity: 0.02, // інтенсивність внутрішньої вуалі
  };

  /* ========= render ========= */
  return (
    <main
      className="min-h-screen relative"
      style={
        {
          // робимо їх доступними всередині Backdrop через CSS vars
          ['--scene-from' as any]: THEME.sceneFrom,
          ['--scene-mid' as any]: THEME.sceneMid,
          ['--scene-to' as any]: THEME.sceneTo,
          ['--accent-a' as any]: THEME.accentA,
          ['--accent-b' as any]: THEME.accentB,
          ['--veil-top' as any]: THEME.veilTop,
          ['--veil-mid' as any]: THEME.veilMid,
          ['--veil-bot' as any]: THEME.veilBottom,
          ['--noise-opacity' as any]: THEME.noiseOpacity,
          ['--noise-step' as any]: `${THEME.noiseStep}px`,
          ['--frame-radius' as any]: `${THEME.frameRadius}px`,
          ['--frame-inner' as any]: THEME.frameInnerOpacity,
        } as React.CSSProperties
      }
    >
      <Backdrop />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-white shadow-[0_16px_44px_rgba(2,28,78,.18)] ring-1 ring-slate-200 px-4 py-2 text-sm"
          >
            {toast === 'lesson' ? 'Урок завершено! ' : 'Тест пройдено! '}
            <Link href={continueHref} className="text-indigo-700 font-semibold underline underline-offset-2">
              Перейти до наступного →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section className="relative z-10">
        <div className="relative max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-8 sm:pt-14">
          <div className="relative overflow-hidden rounded-[var(--frame-radius)] ring-1 ring-white/15 bg-white/10 backdrop-blur-xl shadow-[0_40px_100px_rgba(0,0,0,.35)]">
            {/* diagonal cover */}
            {course.image && (
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
              {/* Left */}
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-white/80">
                  <Layers3 className="w-4 h-4" />
                  {fmt(course.category_name)}
                  <span className="mx-1 opacity-60">•</span>
                  <Globe2 className="w-4 h-4" />
                  {fmt(course.language_name || course.language)}
                </div>

                <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white [text-shadow:_0_4px_16px_rgba(0,0,0,.45)]">
                  {course.title}
                </h1>

                <p className="mt-3 text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-2xl">
                  {course.description || 'Короткий опис курсу з ключовими цілями та очікуваними результатами.'}
                </p>

                {/* KPI row */}
                <div className="mt-6 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                  <KPI icon={<BookOpen className="w-5 h-5" />} label="Уроків" value={course.total_lessons ?? lessons.length ?? 0} />
                  <KPI icon={<Clock3 className="w-5 h-5" />} label="Заг. тривалість" value={estimateTotalMins(lessons)} />
                  <KPI
                    icon={<Star className="w-5 h-5" />}
                    label="Рейтинг"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <Stars value={ratingNumber} />
                        <span className="font-semibold">{ratingNumber > 0 ? ratingNumber.toFixed(1) : '—'}</span>
                      </span>
                    }
                  />
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={seq.pct === 0 ? startHref : continueHref}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow hover:brightness-110"
                  >
                    <Play className="w-5 h-5" />
                    {seq.pct === 0 ? 'Почати навчання' : 'Продовжити'}
                  </Link>
                  <Link
                    href={`/student/courses/${courseId}/sections`}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl ring-1 ring-white/25 bg-white/15 text-white/90 hover:bg-white/20 backdrop-blur"
                  >
                    Переглянути розділи
                  </Link>
                </div>
              </div>

              {/* Right */}
              <div className="flex flex-col items-center lg:items-end gap-5">
                <div className="relative grid place-items-center">
                  <Ring value={seq.pct} />
                  <span className="absolute -bottom-3 text-xs text-slate-200/90">
                    {seq.done}/{seq.total} завершено
                  </span>
                </div>

                <div className="w-full grid gap-3">
                  <BadgeLine
                    icon={<Trophy className="w-4 h-4" />}
                    text={seq.pct >= 50 ? 'Впевнений прогрес — тримай темп!' : 'Починай — і все вийде!'}
                  />
                  <BadgeLine
                    icon={<Target className="w-4 h-4" />}
                    text={seq.pct === 100 ? 'Курс завершено — можна повторити для закріплення.' : 'Ціль: пройти всі уроки послідовно.'}
                  />
                  <BadgeLine icon={<Sparkles className="w-4 h-4" />} text="Після кожного уроку відкривається наступний." />
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-white/70">
            Уроки відкриваються послідовно. Після завершення — автоматично запропонуємо наступний.
          </p>
        </div>
      </section>

      {/* Бенто без дублю розділів/уроків */}
      <section className="relative z-10 py-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card tone="a">
            <h3 className="font-semibold text-white mb-2">Що далі?</h3>
            <p className="text-slate-200/90 text-sm">
              Натисни&nbsp;
              <Link href={continueHref} className="underline underline-offset-2 text-white">
                «Продовжити»
              </Link>
              , щоб перейти до наступного незавершеного уроку. Усі розділи — на окремій сторінці.
            </p>
            <div className="mt-3">
              <Link
                href={continueHref}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
              >
                <Play className="w-4 h-4" />
                До наступного уроку
              </Link>
            </div>
          </Card>

          <Card tone="b">
            <h3 className="font-semibold text-white mb-2">Розділи курсу</h3>
            <p className="text-slate-200/90 text-sm">
              Хочеш вибрати конкретний розділ? Відкрий структуру курсу та переглянь прогрес у кожному.
            </p>
            <div className="mt-3">
              <Link
                href={`/student/courses/${courseId}/sections`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl ring-1 ring-white/25 bg-white/15 text-white/90 hover:bg-white/20 backdrop-blur"
              >
                Перейти до розділів
              </Link>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-2">Порада</h3>
            <p className="text-slate-200/90 text-sm">
              Якщо повернувся з уроку чи тесту — внизу зʼявляється повідомлення з кнопкою «до наступного».
            </p>
          </Card>
        </div>

        {/* мобільний липкий CTA */}
        <div className="sm:hidden fixed bottom-3 left-0 right-0 px-4 z-40">
          <div
            className="rounded-2xl shadow-[0_14px_38px_rgba(2,28,78,.35)] ring-1 ring-white/20 bg-white/15 backdrop-blur flex items-center justify-between px-4 py-2.5"
            style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
          >
            <div className="text-sm">
              <div className="text-slate-200/90">Курс</div>
              <div className="font-semibold text-white truncate max-w-[52vw]">{course.title}</div>
            </div>
            <Link
              href={seq.pct === 0 ? startHref : continueHref}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2"
            >
              <Play className="w-4 h-4" />
              {seq.pct === 0 ? 'Старт' : 'Далі'}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ========= tiny UI ========= */
function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl ring-1 ring-white/20 bg-white/10 backdrop-blur p-3 text-white">
      <div className="flex items-center gap-2 text-slate-200/90">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function BadgeLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-white/20 bg-white/10 text-slate-100 backdrop-blur">
      {icon}
      <span className="text-sm">{text}</span>
    </div>
  );
}

function Card({ children, tone }: { children: React.ReactNode; tone?: 'a' | 'b' }) {
  const bg =
    tone === 'a'
      ? 'bg-[radial-gradient(120%_120%_at_0%_0%,var(--accent-a),transparent_55%)]'
      : tone === 'b'
      ? 'bg-[radial-gradient(120%_120%_at_100%_0%,var(--accent-b),transparent_55%)]'
      : 'bg-white/10';
  return <div className={`rounded-2xl ring-1 ring-white/20 ${bg} backdrop-blur p-5 sm:p-6 text-white`}>{children}</div>;
}

/* ========= Backdrop (плавний + «рамка») ========= */
function Backdrop() {
  return (
    <>
      {/* базовий плавний градієнт з мʼякшими зупинками */}
      <div
        className="absolute inset-0 -z-40"
        style={{
          background: `linear-gradient(
            160deg,
            var(--scene-from) 0%,
            color-mix(in oklab, var(--scene-from) 70%, white) 18%,
            var(--scene-mid) 48%,
            color-mix(in oklab, var(--scene-mid) 85%, black) 70%,
            var(--scene-to) 100%
          )`,
          filter: 'saturate(.92) brightness(1.02)', // TUNE: глобальний софт
        }}
      />

      {/* мʼяка біла вуаль (згладжує контраст) */}
      <div
        className="absolute inset-0 -z-35 pointer-events-none"
        style={{
          background: `linear-gradient(
            180deg,
            rgba(255,255,255,var(--veil-top)) 0%,
            rgba(255,255,255,var(--veil-mid)) 45%,
            rgba(255,255,255,var(--veil-bot)) 100%
          )`,
        }}
      />

      {/* декоративна заокруглена «рамка» по центру */}
      <div className="absolute inset-0 -z-30 px-4 sm:px-6">
        <div
          className="h-full max-w-6xl mx-auto rounded-[var(--frame-radius)] ring-1 ring-white/14"
          style={{
            boxShadow: `inset 0 0 0 9999px rgba(255,255,255,var(--frame-inner))`, // TUNE: щільність inner veil
          }}
        />
      </div>

      {/* легка зернистість */}
      <div
        className="absolute inset-0 -z-20 mix-blend-soft-light"
        style={{
          opacity: 'var(--noise-opacity)',
          backgroundImage:
            'radial-gradient(rgba(255,255,255,.4) 1px, transparent 1px), radial-gradient(rgba(255,255,255,.25) 1px, transparent 1px)',
          backgroundPosition: '0 0, calc(var(--noise-step)/2) calc(var(--noise-step)/2)',
          backgroundSize: 'var(--noise-step) var(--noise-step), var(--noise-step) var(--noise-step)',
        }}
      />

      {/* кути-glow (делікатно) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-28 -left-28 h-[28rem] w-[28rem] rounded-full blur-[120px] opacity-55"
          style={{ background: 'radial-gradient(closest-side, rgba(124,58,237,.14), transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -right-24 h-[26rem] w-[26rem] rounded-full blur-[120px] opacity-55"
          style={{ background: 'radial-gradient(closest-side, rgba(6,182,212,.12), transparent 70%)' }}
        />
      </div>
    </>
  );
}

/* ========= utils ========= */
function estimateTotalMins(lessons: CourseLessonItem[]) {
  const sum = lessons.reduce((acc, l) => acc + (Number(l.duration_min) || 0), 0);
  if (!sum) return '—';
  return `${sum} хв`;
}
