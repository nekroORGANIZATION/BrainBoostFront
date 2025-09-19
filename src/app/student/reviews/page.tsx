'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import http, { setAuthHeader } from '@/lib/http';
import { mediaUrl } from '@/lib/media';
import { useAuth } from '@/context/AuthContext';

type Review = {
  id: number | string;
  rating: number;
  text?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  course?:
    | { id: number; slug?: string; title?: string; image?: string | null }
    | number
    | null;
  likes?: number | string | null;
  replies_count?: number | string | null;
  media?: string[] | null;
};

type SortKey = 'date' | 'rating';
type SortDir = 'asc' | 'desc';

function useDebounced<T>(value: T, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function pickPayload(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (payload?.results && Array.isArray(payload.results)) return payload.results;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (payload?.items && Array.isArray(payload.items)) return payload.items;
  return [];
}

function toAbs(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return mediaUrl(url);
}

function normalizeNum(n: number | string | null | undefined): number | null {
  if (n === null || n === undefined) return null;
  if (typeof n === 'number') return Number.isFinite(n) ? n : null;
  const parsed = parseFloat(String(n).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function mapRowToReview(row: any): Review {
  const r = row?.review ?? row;

  const course =
    r?.course && typeof r.course === 'object'
      ? {
          id: r.course.id,
          slug: r.course.slug,
          title: r.course.title,
          image: r.course.image ? toAbs(r.course.image) : null,
        }
      : typeof r?.course === 'number'
      ? { id: r.course }
      : null;

  let media: string[] | null = null;
  if (Array.isArray(r?.media)) {
    media = r.media.map((m: any) => toAbs(String(m))).filter(Boolean) as string[];
  } else if (r?.media) {
    media = [toAbs(String(r.media))!].filter(Boolean);
  }

  const rating = normalizeNum(r?.rating) ?? 0;

  return {
    id: r?.id ?? Math.random().toString(36).slice(2),
    rating,
    text: r?.text ?? r?.comment ?? r?.review_text ?? '',
    created_at: r?.created_at ?? r?.created ?? null,
    updated_at: r?.updated_at ?? r?.updated ?? null,
    course,
    likes: r?.likes ?? r?.upvotes ?? null,
    replies_count: r?.replies_count ?? r?.replies ?? null,
    media,
  };
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('uk-UA', { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function MyReviewsPage() {
  const { accessToken } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [withMedia, setWithMedia] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedQuery = useDebounced(query, 350);

  useEffect(() => {
    setAuthHeader(accessToken || null);
  }, [accessToken]);

  const fetchReviews = useCallback(async () => {
    if (!accessToken) {
      setError('Потрібна авторизація для перегляду відгуків.');
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await http.get('/api/reviews/mine/'); // <-- ПРАВИЛЬНИЙ ШЛЯХ
      const raw = pickPayload(res.data);
      const mapped = raw.map(mapRowToReview);
      setReviews(mapped);
    } catch (e: any) {
      const status = e?.response?.status;
      setError(
        status === 401
          ? 'Потрібна авторизація для перегляду відгуків.'
          : `Не вдалося завантажити відгуки${status ? ` (HTTP ${status})` : ''}.`
      );
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg =
      total === 0
        ? 0
        : Math.round((reviews.reduce((s, r) => s + (r.rating || 0), 0) / total) * 10) / 10;
    const withPics = reviews.filter((r) => (r.media?.length || 0) > 0).length;
    const high = reviews.filter((r) => r.rating >= 4).length;
    return { total, avg, withPics, high };
  }, [reviews]);

  const filtered = useMemo(() => {
    let arr = reviews.slice();

    const q = debouncedQuery.trim().toLowerCase();
    if (q) {
      arr = arr.filter((r) => {
        const txt = (r.text ?? '').toLowerCase();
        const courseTitle =
          typeof r.course === 'object' ? (r.course?.title ?? '').toLowerCase() : '';
        return txt.includes(q) || courseTitle.includes(q);
      });
    }

    if (minRating !== null) {
      arr = arr.filter((r) => r.rating >= minRating);
    }

    if (withMedia) {
      arr = arr.filter((r) => (r.media?.length || 0) > 0);
    }

    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'date') {
        const aa = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return (aa - bb) * dir;
      }
      return (a.rating - b.rating) * dir;
    });

    return arr;
  }, [reviews, debouncedQuery, minRating, withMedia, sortKey, sortDir]);

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="min-h-screen bg-white/60">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
          <section
            className="rounded-3xl p-6 md:p-8"
            style={{
              background: 'linear-gradient(to right, royalblue, mediumslateblue)',
              color: 'white',
              boxShadow: '0 18px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold">Мої відгуки</h1>
                <p className="mt-2 opacity-95">
                  Ваші оцінки курсів із пошуком, фільтрами, сортуванням і швидкими діями.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                <Link href="/student">
                  <span className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 bg-white text-slate-900 font-medium shadow hover:shadow-md transition w-full sm:w-auto">
                    Кабінет студента
                  </span>
                </Link>
                <Link href="/courses">
                  <span className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition w-full sm:w-auto">
                    Знайти нові курси
                  </span>
                </Link>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard title="Всього" value={stats.total} bg="aliceblue" />
              <StatCard title="Середня" value={stats.avg.toFixed(1)} bg="honeydew" />
              <StatCard title="З медіа" value={stats.withPics} bg="oldlace" />
              <StatCard title="Оцінка 4–5" value={stats.high} bg="mintcream" />
            </div>
          </section>

          <section className="rounded-3xl bg-white shadow-xl p-4 sm:p-5">
            <div className="flex items-center justify-between sm:justify-start sm:gap-4">
              <div className="sm:flex-1">
                <label className="text-sm opacity-80">Пошук</label>
                <input
                  type="text"
                  placeholder="Курс або текст відгуку…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="mt-1 w-full rounded-2xl px-4 py-3 bg-[whitesmoke] outline-none"
                />
              </div>

              <button
                className="sm:hidden ml-3 mt-6 rounded-2xl px-4 py-3 bg-[aliceblue] shadow"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                aria-controls="filters-panel"
              >
                {filtersOpen ? 'Сховати фільтри' : 'Фільтри'}
              </button>
            </div>

            <div
              id="filters-panel"
              className={[
                'grid grid-cols-1 sm:grid-cols-12 gap-4 items-end mt-4',
                filtersOpen ? '' : 'hidden sm:grid',
              ].join(' ')}
            >
              <div className="sm:col-span-3">
                <label className="text-sm opacity-80">Мін. оцінка</label>
                <select
                  className="mt-1 w-full rounded-2xl px-4 py-3 bg-[whitesmoke] outline-none"
                  value={minRating === null ? '' : String(minRating)}
                  onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Без фільтра</option>
                  <option value="1">Від 1</option>
                  <option value="2">Від 2</option>
                  <option value="3">Від 3</option>
                  <option value="4">Від 4</option>
                  <option value="5">Лише 5</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm opacity-80">Медіа</label>
                <button
                  className={[
                    'mt-1 w-full rounded-2xl px-4 py-3 shadow transition',
                    withMedia ? 'bg-[honeydew]' : 'bg-[whitesmoke]',
                  ].join(' ')}
                  onClick={() => setWithMedia((v) => !v)}
                >
                  {withMedia ? 'Лише з медіа' : 'Усі'}
                </button>
              </div>

              <div className="sm:col-span-3">
                <label className="text-sm opacity-80">Сортування</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    className={[
                      'rounded-2xl px-3 py-2 bg-[aliceblue] shadow',
                      sortKey === 'date' ? 'ring-2 ring-[mediumslateblue]' : '',
                    ].join(' ')}
                    onClick={() => setSortKey('date')}
                  >
                    За датою
                  </button>
                  <button
                    className={[
                      'rounded-2xl px-3 py-2 bg-[aliceblue] shadow',
                      sortKey === 'rating' ? 'ring-2 ring-[mediumslateblue]' : '',
                    ].join(' ')}
                    onClick={() => setSortKey('rating')}
                  >
                    За оцінкою
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm opacity-80">Напрямок</label>
                <button
                  className="mt-1 w-full rounded-2xl px-3 py-3 bg-[aliceblue] shadow"
                  onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                >
                  {sortDir === 'asc' ? 'Зростання ↑' : 'Спадання ↓'}
                </button>
              </div>
            </div>
          </section>

          <div className="opacity-80 text-sm px-1">
            Знайдено: <span className="font-semibold">{loading ? '…' : filtered.length}</span>
            {!loading && reviews.length !== filtered.length ? (
              <span className="opacity-70"> (усього {reviews.length})</span>
            ) : null}
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
            {loading
              ? Array.from({ length: 6 }, (_, i) => <SkeletonReview key={i} />)
              : filtered.length > 0
              ? filtered.map((r) => <ReviewCard key={String(r.id)} review={r} />)
              : (
                <div className="col-span-full rounded-3xl p-10 text-center bg-white shadow">
                  {error ? (
                    <div>
                      {error}
                      <div className="mt-3">
                        <button
                          onClick={fetchReviews}
                          className="rounded-2xl px-4 py-2 mt-2 bg-[lavender] shadow"
                        >
                          Спробувати ще раз
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      У вас ще немає відгуків.
                      <div className="mt-3">
                        <Link href="/courses" className="underline">
                          Перейти до курсів
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  bg,
}: {
  title: string;
  value: number | string;
  bg: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 md:p-5 text-black"
      style={{ background: bg, boxShadow: '0 12px 28px rgba(0,0,0,0.08)' }}
    >
      <div className="text-sm opacity-80">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const courseTitle =
    typeof review.course === 'object' ? review.course?.title : undefined;
  const courseSlug =
    typeof review.course === 'object' ? review.course?.slug : undefined;
  const courseId =
    typeof review.course === 'object'
      ? review.course?.id
      : typeof review.course === 'number'
      ? review.course
      : undefined;
  const courseImage =
    typeof review.course === 'object' ? review.course?.image : null;

  const likes = normalizeNum(review.likes) ?? 0;
  const replies = normalizeNum(review.replies_count) ?? 0;

  const href = courseSlug ? `/courses/${courseSlug}` : courseId ? `/courses/${courseId}` : '#';

  return (
    <article className="rounded-3xl overflow-hidden h-full bg-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 flex flex-col">
      <div className="relative w-full h-36 bg-gradient-to-r from-blue-600 to-indigo-500">
        {courseImage ? (
          <Image
            src={courseImage}
            alt={courseTitle || 'Курс'}
            fill
            sizes="400px"
            className="object-cover opacity-70"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-white/90 px-4 text-center">
            {courseTitle || 'Курс'}
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="rounded-xl px-2 py-1 text-xs bg-white/90 text-black font-medium">
            ★ {review.rating.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold line-clamp-2">{courseTitle || 'Відгук'}</h3>
        <div className="text-xs opacity-70 mt-0.5">
          Опубліковано: {formatDate(review.created_at)}
        </div>

        {review.text ? (
          <p className="mt-3 text-sm opacity-90 whitespace-pre-wrap">
            {review.text.length > 260 ? review.text.slice(0, 260) + '…' : review.text}
          </p>
        ) : (
          <p className="mt-3 text-sm opacity-60 italic">Без тексту</p>
        )}

        {review.media && review.media.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {review.media.slice(0, 3).map((m, i) => (
              <a
                key={i}
                href={m}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg overflow-hidden bg-[whitesmoke]"
              >
                <Image
                  src={m}
                  alt={`media-${i}`}
                  width={300}
                  height={200}
                  className="object-cover w-full h-24"
                  unoptimized
                />
              </a>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 flex flex-wrap gap-2 items-center">
          {href !== '#' ? (
            <Link
              href={href}
              className="rounded-xl px-3 py-2 bg-[aliceblue] shadow hover:shadow-md"
            >
              Перейти до курсу
            </Link>
          ) : null}

          <button
            type="button"
            disabled
            className="rounded-xl px-3 py-2 bg-white border shadow opacity-60 cursor-not-allowed"
            title="Потрібен ендпойнт PUT/PATCH"
          >
            Редагувати
          </button>
          <button
            type="button"
            disabled
            className="rounded-xl px-3 py-2 bg-white border shadow opacity-60 cursor-not-allowed"
            title="Потрібен ендпойнт DELETE"
          >
            Видалити
          </button>

          <div className="ml-auto text-xs opacity-70 flex items-center gap-3">
            <span>👍 {likes}</span>
            <span>💬 {replies}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function SkeletonReview() {
  return (
    <div className="rounded-3xl bg-white shadow-xl h-[320px] animate-pulse" aria-label="loading" />
  );
}
