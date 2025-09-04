'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import http from '@/lib/http';
import { mediaUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

/* =========================
   Типи
========================= */
type Course = {
  id: number;
  slug?: string;
  title: string;
  description?: string;
  image?: string | null; // може бути вже абсолютним URL
  author: number | { id: number; username: string };
  language?: string;
  topic?: string;
  price?: number | string | null;
  rating?: number | string | null;
};

type SortKey = 'title' | 'price' | 'rating';
type SortDir = 'asc' | 'desc';

/* =========================
   Константи API
========================= */
const PURCHASED_URL = '/courses/me/purchased/';

/* =========================
   Хелпери
========================= */
function useDebounced<T>(value: T, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function normalizeNumber(n?: number | string | null): number | null {
  if (n === null || n === undefined) return null;
  if (typeof n === 'number') return n;
  const parsed = parseFloat(String(n).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

/** дістаємо масив незалежно від формату відповіді */
function pickCoursesPayload(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

/** нормалізуємо ряд у Course (враховуємо row.course) */
function mapRowToCourse(row: any): Course {
  const c = row?.course ?? row;
  return {
    id: c?.id,
    slug: c?.slug,
    title: c?.title ?? '',
    description: c?.description ?? '',
    // перетворюємо на абсолютний медіа-URL
    image: c?.image ? mediaUrl(c.image) : null,
    price: c?.price ?? null,
    rating: c?.rating ?? null,
    author:
      typeof c?.author === 'object' && c?.author
        ? { id: c.author.id, username: c.author.username }
        : c?.author ?? 0,
    language: c?.language,
    topic: c?.topic,
  } as Course;
}

/* =========================
   Анімаційні варіанти
========================= */
const fadeIn: any = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};
const listStagger: any = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

/* =========================
   Компоненти-утиліти
========================= */
function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-[2px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: i * 0.03 }}
          className={i < full ? 'text-yellow-400' : 'text-gray-300'}
        >
          <Star size={16} className={i < full ? 'fill-yellow-400' : ''} />
        </motion.span>
      ))}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#F2F6FF] text-[#1345DE] ring-1 ring-[#E5ECFF] px-2 py-0.5 text-xs font-semibold">
      {children}
    </span>
  );
}

function Shimmer() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-[#E5ECFF]">
      <div className="h-40 w-full bg-slate-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 bg-slate-200 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 rounded" />
        <div className="h-3 w-2/3 bg-slate-200 rounded" />
      </div>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

/* =========================
   Сторінка
========================= */
export default function PurchasedCoursesPage() {
  const { accessToken } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // локальні фільтри
  const [query, setQuery] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // пагінація (клієнтська)
  const pageSize = 9;
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebounced(query, 400);
  const initialized = useRef(false);

  // завантаження куплених курсів — лише після появи токена
  const loadCourses = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    http
      .get(PURCHASED_URL)
      .then((res) => {
        const raw = pickCoursesPayload(res.data);
        const mapped = raw.map(mapRowToCourse);
        setCourses(mapped);
      })
      .catch((err) => {
        setError(
          err?.response?.status === 401
            ? 'Потрібна авторизація для перегляду придбаних курсів.'
            : 'Не вдалося завантажити придбані курси.'
        );
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    loadCourses();
    initialized.current = true;
  }, [loadCourses]);

  // підрахунок простих метрик з реальних даних
  const metrics = useMemo(() => {
    const ratings = courses
      .map((c) => normalizeNumber(c.rating))
      .filter((n): n is number => n !== null);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    const freeCount = courses.filter((c) => (normalizeNumber(c.price) ?? 0) === 0).length;
    return { avgRating: avg, total: courses.length, freeCount };
  }, [courses]);

  // відфільтрований + відсортований список
  const filtered = useMemo(() => {
    let arr = courses.slice();

    // пошук по назві / темі / мові / автору
    const q = debouncedQuery.trim().toLowerCase();
    if (q) {
      arr = arr.filter((c) => {
        const title = c.title?.toLowerCase() || '';
        const topic = c.topic?.toLowerCase() || '';
        const lang = c.language?.toLowerCase() || '';
        const author =
          typeof c.author === 'object' ? (c.author.username?.toLowerCase() || '') : '';
        return title.includes(q) || topic.includes(q) || lang.includes(q) || author.includes(q);
      });
    }

    // фільтр за рейтингом
    if (minRating !== null) {
      arr = arr.filter((c) => {
        const r = normalizeNumber(c.rating);
        return r !== null && r >= minRating;
      });
    }

    // лише безкоштовні
    if (freeOnly) {
      arr = arr.filter((c) => {
        const p = normalizeNumber(c.price);
        return p !== null ? p === 0 : false;
      });
    }

    // сортування
    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;

      if (sortKey === 'title') {
        const aa = (a.title || '').toLowerCase();
        const bb = (b.title || '').toLowerCase();
        return aa.localeCompare(bb) * dir;
      }
      if (sortKey === 'price') {
        const aa = normalizeNumber(a.price) ?? Number.POSITIVE_INFINITY;
        const bb = normalizeNumber(b.price) ?? Number.POSITIVE_INFINITY;
        return (aa - bb) * dir;
      }
      // rating
      const aa = normalizeNumber(a.rating) ?? -1;
      const bb = normalizeNumber(b.rating) ?? -1;
      return (aa - bb) * dir;
    });

    return arr;
  }, [courses, debouncedQuery, minRating, freeOnly, sortKey, sortDir]);

  // пагінація
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(page, 1), totalPages);
  const pageItems = filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  useEffect(() => {
    if (initialized.current) setPage(1);
  }, [debouncedQuery, minRating, freeOnly]);

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey]
  );

  return (
    <div className="space-y-6">
      {/* HERO з анімованими плямами та метриками */}
      <section className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl ring-1 ring-[#E5ECFF] bg-gradient-to-tr from-[#2441e6] via-[#4d71ff] to-[#7aa2ff] text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.75, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,.25), transparent)' }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.65, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,.18), transparent)' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2"
            >
              <Sparkles className="h-6 w-6" /> Придбані курси
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="mt-2 text-white/90"
            >
              Ваші оплачені курси з пошуком, фільтрами, рейтингами та швидким стартом.
            </motion.p>
          </div>

          {/* Метрики з реальних даних */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur ring-1 ring-white/25">
              <div className="text-xs uppercase tracking-wide opacity-90">Усього</div>
              <div className="text-2xl font-extrabold">{metrics.total}</div>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur ring-1 ring-white/25">
              <div className="text-xs uppercase tracking-wide opacity-90">Середній рейтинг</div>
              <div className="text-2xl font-extrabold">
                {metrics.avgRating ? metrics.avgRating.toFixed(1) : '—'}
              </div>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur ring-1 ring-white/25">
              <div className="text-xs uppercase tracking-wide opacity-90">Безкоштовних</div>
              <div className="text-2xl font-extrabold">{metrics.freeCount}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Панель керування */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="rounded-3xl bg-white shadow-xl ring-1 ring-[#E5ECFF] p-4 md:p-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 items-end">
          {/* Пошук */}
          <div className="md:col-span-5">
            <label className="text-sm opacity-80">Пошук</label>
            <div className="mt-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Назва, тема, мова або автор…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-0 w-full rounded-2xl pl-9 pr-3 py-3 bg-[whitesmoke] outline-none focus:ring-2 focus:ring-[#1345DE] transition"
              />
            </div>
          </div>

          {/* Рейтинг */}
          <div className="md:col-span-3">
            <label className="text-sm opacity-80">Мін. рейтинг</label>
            <select
              className="mt-1 w-full rounded-2xl px-4 py-3 bg-[whitesmoke] outline-none focus:ring-2 focus:ring-[#1345DE] transition"
              value={minRating === null ? '' : String(minRating)}
              onChange={(e) => {
                const val = e.target.value;
                setMinRating(val ? Number(val) : null);
              }}
            >
              <option value="">Без фільтра</option>
              <option value="3">Від 3</option>
              <option value="3.5">Від 3.5</option>
              <option value="4">Від 4</option>
              <option value="4.5">Від 4.5</option>
            </select>
          </div>

          {/* Безкоштовні */}
          <div className="md:col-span-2">
            <label className="text-sm opacity-80">Ціна</label>
            <button
              type="button"
              onClick={() => setFreeOnly((v) => !v)}
              className={[
                'mt-1 w-full rounded-2xl px-4 py-3 shadow transition-all ring-1',
                freeOnly
                  ? 'bg-[honeydew] ring-emerald-200 text-emerald-700'
                  : 'bg-[whitesmoke] ring-transparent',
              ].join(' ')}
            >
              {freeOnly ? 'Лише безкоштовні' : 'Усі'}
            </button>
          </div>

          {/* Сортування — сегменти */}
          <div className="md:col-span-2">
            <label className="text-sm opacity-80 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Сортувати
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                className={[
                  'rounded-2xl px-3 py-2 bg-[aliceblue] shadow ring-1 transition',
                  sortKey === 'title' ? 'ring-[mediumslateblue]' : 'ring-transparent',
                ].join(' ')}
                onClick={() => toggleSort('title')}
              >
                Назва {sortKey === 'title' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button
                className={[
                  'rounded-2xl px-3 py-2 bg-[aliceblue] shadow ring-1 transition',
                  sortKey === 'price' ? 'ring-[mediumslateblue]' : 'ring-transparent',
                ].join(' ')}
                onClick={() => toggleSort('price')}
              >
                Ціна {sortKey === 'price' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button
                className={[
                  'rounded-2xl px-3 py-2 bg-[aliceblue] shadow col-span-2 ring-1 transition',
                  sortKey === 'rating' ? 'ring-[mediumslateblue]' : 'ring-transparent',
                ].join(' ')}
                onClick={() => toggleSort('rating')}
              >
                Рейтинг {sortKey === 'rating' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Результати */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="opacity-80 text-sm">
            Знайдено: <span className="font-semibold">{loading ? '…' : total}</span>
            {!loading && courses.length !== filtered.length ? (
              <span className="opacity-70"> (усього {courses.length})</span>
            ) : null}
          </div>
          <div className="opacity-70 text-sm">
            Сторінка {clampedPage} з {totalPages}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${clampedPage}-${debouncedQuery}-${minRating}-${freeOnly}-${sortKey}-${sortDir}`}
            variants={listStagger}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-fr"
          >
            {loading
              ? Array.from({ length: 9 }, (_, i) => <Shimmer key={`s-${i}`} />)
              : pageItems.length > 0
              ? pageItems.map((c) => (
                  <motion.div key={c.id} variants={fadeIn}>
                    <CourseCard course={c} />
                  </motion.div>
                ))
              : (
                <div className="col-span-full rounded-3xl p-10 text-center bg-white shadow ring-1 ring-[#E5ECFF]">
                  {error ? (
                    <div>
                      <div className="font-semibold mb-2">Упс! {error}</div>
                      <div className="mt-3">
                        <button
                          onClick={loadCourses}
                          className="rounded-2xl px-4 py-2 mt-2 bg-[#EEF3FF] text-[#1345DE] ring-1 ring-[#E5ECFF] hover:ring-[#1345DE] transition"
                        >
                          Спробувати ще раз
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      У вас ще немає придбаних курсів.
                      <div className="mt-3">
                        <Link href="/courses" className="text-[#1345DE] underline">Перейти до каталогу</Link>
                      </div>
                    </>
                  )}
                </div>
              )}
          </motion.div>
        </AnimatePresence>

        {/* Пагінація */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              className="inline-flex items-center gap-1 rounded-2xl px-4 py-2 bg-white ring-1 ring-[#E5ECFF] shadow hover:ring-[#1345DE] transition disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={clampedPage === 1}
            >
              <ChevronLeft className="h-4 w-4" /> Попередня
            </button>
            <div className="rounded-2xl px-4 py-2 bg-[#EEF3FF] ring-1 ring-[#E5ECFF] text-[#0F2E64] font-semibold">
              {clampedPage} / {totalPages}
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-2xl px-4 py-2 bg-white ring-1 ring-[#E5ECFF] shadow hover:ring-[#1345DE] transition disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={clampedPage === totalPages}
            >
              Наступна <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================
   Картка курсу
========================= */
function CourseCard({ course }: { course: Course }) {
  const authorName = typeof course.author === 'object' ? (course.author.username as string) : undefined;
  const ratingValue = normalizeNumber(course.rating);
  const priceValue = normalizeNumber(course.price);

  const DetailsLink = (
    <Link
      href={`/courses/${course.slug ?? course.id}/details`}
      className="absolute inset-0"
      aria-label={`Відкрити ${course.title}`}
      tabIndex={-1}
    />
  );

  return (
    <article className="group relative rounded-3xl overflow-hidden h-full bg-white shadow-xl ring-1 ring-[#E5ECFF] transition-all hover:shadow-2xl hover:-translate-y-1">
      {/* клікабельний оверлей на всю картку для переходу в деталі */}
      {DetailsLink}

      {/* медіа */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        {course.image ? (
          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm" style={{ background: 'gainsboro', color: 'black' }}>
            Без зображення
          </div>
        )}
        {/* градієнт зверху для контрасту бейджів */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/20 to-transparent" />
      </div>

      {/* контент */}
      <div className="p-5 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold line-clamp-2 text-[#0F2E64]">{course.title}</h3>
          {typeof ratingValue === 'number' && (
            <span className="shrink-0 rounded-xl px-2 py-1 text-xs bg-[#FFF7DB] text-amber-700 ring-1 ring-amber-200">
              {ratingValue.toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {course.topic ? <Chip>{course.topic}</Chip> : null}
          {course.language ? <Chip>{course.language}</Chip> : null}
          {authorName ? <span className="text-xs text-slate-500">Автор: {authorName}</span> : null}
        </div>

        {typeof ratingValue === 'number' ? <Stars value={ratingValue} /> : null}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-slate-700">
            Ціна:{' '}
            <strong className="text-[#0F2E64]">
              {priceValue === null ? '—' : priceValue === 0 ? 'Безкоштовно' : priceValue}
            </strong>
          </span>

          {/* Кнопка навчання — окреме посилання, НЕ вкладене в Link зверху */}
          <Link
            href={`/student/courses/${course.id}`}
            className="relative z-10 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-white text-sm font-semibold shadow hover:bg-emerald-700 transition"
          >
            До навчання
          </Link>
        </div>
      </div>
    </article>
  );
}
