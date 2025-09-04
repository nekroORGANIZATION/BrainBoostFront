'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import http, { API_BASE } from '@/lib/http';

/* =========================================================
   Утіліти та стилі
========================================================= */
const isAbs = (u?: string) =>
  !!u && (/^https?:\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:'));
const murl = (u?: string) => (!u ? '' : isAbs(u) ? u : `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`);

const CONTAINER = 'mx-auto max-w-[1160px] px-6 md:px-[118px]';
const CARD20 = 'rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)]';
const CARD16 = 'rounded-[16px] bg-white ring-1 ring-[#E5ECFF] p-4 shadow-[0_6px_22px_rgba(2,28,78,0.08)]';
const INPUT = 'rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]';
const BTN_PRIMARY = 'px-5 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold disabled:opacity-60';
const BTN_GHOST = 'px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white';

function Star({ filled = false, size = 18 }: { filled?: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}
      className={filled ? 'fill-[#FFC107]' : 'fill-none stroke-[#FFC107]'} strokeWidth={filled ? 0 : 1.6} aria-hidden="true">
      <path d="M12 2l2.9 6.2 6.8.8-5 4.7 1.4 6.7L12 17.8 5.9 20.4 7.3 13.7 2.3 9l6.8-.8L12 2z" />
    </svg>
  );
}
function RatingStars({ value, size = 18 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  return (
    <div className="flex items-center gap-[2px]" aria-label={`Рейтинг ${value} з 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <Star key={i} filled size={size} />;
        if (i === full && hasHalf)
          return (
            <div key={i} className="relative" style={{ width: size, height: size }}>
              <div className="absolute inset-0 overflow-hidden" style={{ width: size / 2 }}>
                <Star filled size={size} />
              </div>
              <Star size={size} />
            </div>
          );
        return <Star key={i} size={size} />;
      })}
    </div>
  );
}
const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-[999px] bg-[#EEF3FF] text-[#1345DE] px-3 py-1 text-xs font-semibold ring-1 ring-[#E5ECFF]">
    {children}
  </span>
);

/* =========================================================
   Типи під твій бек
========================================================= */
type ReviewApi = {
  id: number;
  course: number;
  rating: number;
  text: string;
  video_url: string;
  user_name: string;          // snapshot
  user_avatar: string;        // snapshot
  images: { id: number; image: string }[];
  created_at: string;
};
type CourseApi = { id: number; title: string };

type ReviewUI = {
  id: number;
  name: string;
  courseId: number;
  courseTitle?: string;
  rating: number;
  date: string;
  text: string;
  avatar?: string;
  images?: string[];
  video?: string;
};

type PurchaseApi = {
  id: number;
  course: { id: number; title?: string } | number;
  is_active?: boolean;
  purchased_at?: string;
};

/* =========================================================
   Хелпери
========================================================= */
const safeGetArray = <T,>(raw: any): T[] =>
  Array.isArray(raw) ? raw as T[] : (raw?.results && Array.isArray(raw.results) ? (raw.results as T[]) : []);

const ytToEmbed = (url: string) =>
  !url ? '' :
  url.includes('youtube.com/watch?v=') ? url.replace('watch?v=', 'embed/') :
  url.includes('youtu.be/') ? url.replace('youtu.be/', 'www.youtube.com/embed/') : url;

const toUI = (r: ReviewApi, courseTitle?: string): ReviewUI => ({
  id: r.id,
  name: r.user_name || 'Користувач',
  courseId: r.course,
  courseTitle,
  rating: Number(r.rating) || 0,
  date: r.created_at,
  text: r.text,
  avatar: r.user_avatar ? murl(r.user_avatar) : undefined,
  images: (r.images || []).map((i) => murl(i.image)).filter(Boolean),
  video: r.video_url || undefined,
});

/* =========================================================
   Сторінка
========================================================= */
export default function ReviewsPage() {
  // дані
  const [reviews, setReviews] = useState<ReviewUI[]>([]);
  const [courses, setCourses] = useState<CourseApi[]>([]);
  const [purchasedCourses, setPurchasedCourses] = useState<CourseApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // фільтри
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<number | 'all'>('all');
  const [sort, setSort] = useState<'new' | 'top'>('new');
  const [onlyWithMedia, setOnlyWithMedia] = useState(false);

  // пагінація
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // модалка
  const [openModal, setOpenModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    courseId: 0,
    rating: 5,
    text: '',
    video_url: '',
    consent: false,
  });

  // sticky
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  /* ---------- Завантаження ---------- */
  async function fetchPurchases(): Promise<CourseApi[]> {
    try {
      const res = await http.get('/courses/me/purchased/', { params: { is_active: true }, validateStatus: () => true });
      if (res.status < 200 || res.status >= 300) return [];
      const arr = safeGetArray<PurchaseApi>(res.data);
      const out = arr.map((p) => {
        const c = p.course as any;
        if (!c) return null;
        if (typeof c === 'number') return { id: c, title: `Курс #${c}` } as CourseApi;
        return { id: Number(c.id), title: String(c.title || `Курс #${c.id}`) } as CourseApi;
      }).filter(Boolean) as CourseApi[];
      return Array.from(new Map(out.map((c) => [c.id, c])).values());
    } catch {
      return [];
    }
  }

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const [revRes, courseRes, myPurchases] = await Promise.all([
        http.get('/api/reviews/', { params: { page_size: 200 }, validateStatus: () => true }),
        http.get('/courses/', { params: { page_size: 500 }, validateStatus: () => true }).catch(() => null),
        fetchPurchases(),
      ]);

      if (courseRes && courseRes.status >= 200 && courseRes.status < 300) {
        setCourses(safeGetArray<CourseApi>(courseRes.data));
      }
      setPurchasedCourses(myPurchases);

      if (revRes.status < 200 || revRes.status >= 300) {
        throw new Error(`Failed to load reviews: ${revRes.status}`);
      }
      const revData = safeGetArray<ReviewApi>(revRes.data);

      const cmap = new Map<number, string>();
      (courseRes && courseRes.status === 200 ? safeGetArray<CourseApi>(courseRes.data) : []).forEach((c) => cmap.set(c.id, c.title));
      myPurchases.forEach((c) => cmap.set(c.id, c.title));

      setReviews(revData.map((r) => toUI(r, cmap.get(r.course))));
    } catch (e: any) {
      setErr(e?.message || 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([ent]) => setStuck(!ent.isIntersecting), { threshold: 1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ---------- Обчислення ---------- */
  const courseOptions = useMemo(
    () => [{ id: 'all' as const, label: 'Всі курси' }, ...courses.map((c) => ({ id: c.id, label: c.title }))],
    [courses]
  );

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (cat !== 'all') list = list.filter((r) => r.courseId === cat);

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.text.toLowerCase().includes(q) ||
          (r.courseTitle || `Курс #${r.courseId}`).toLowerCase().includes(q)
      );
    }

    if (onlyWithMedia) list = list.filter((r) => (r.images && r.images.length > 0) || !!r.video);

    (sort === 'new'
      ? list.sort((a, b) => +new Date(b.date) - +new Date(a.date))
      : list.sort((a, b) => b.rating - a.rating));

    return list;
  }, [reviews, cat, query, onlyWithMedia, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const avgRating =
    filtered.length > 0
      ? Math.round((filtered.reduce((acc, r) => acc + r.rating, 0) / filtered.length) * 10) / 10
      : 0;

  const distribution = useMemo(() => {
    const base = new Map<number, number>([[1,0],[2,0],[3,0],[4,0],[5,0]]);
    filtered.forEach((r) => {
      const k = Math.round(r.rating) as 1|2|3|4|5;
      base.set(k, (base.get(k) || 0) + 1);
    });
    return [5,4,3,2,1].map((s) => ({ stars: s, count: base.get(s) || 0 }));
  }, [filtered]);
  const totalCount = filtered.length;
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  /* ---------- Сабміт відгуку (POST /api/reviews/create/) ---------- */
  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!form.courseId) return alert('Оберіть курс.');
    if (!form.consent) return alert('Підтвердіть згоду з політикою конфіденційності.');
    if (!purchasedCourses.some((c) => c.id === form.courseId)) {
      return alert('Ви можете залишити відгук лише для купленого курсу.');
    }

    try {
      setCreating(true);
      const res: any = await http.post('/api/reviews/create/', {
        course: form.courseId,
        rating: form.rating,
        text: form.text,
        video_url: form.video_url || '',
      }, { validateStatus: () => true });

      if (res.status < 200 || res.status >= 300) {
        // Поширені кейси: 400 (already reviewed / bad rating), 401 (unauth), 409 (unique)
        const t = typeof res.data === 'string' ? res.data : JSON.stringify(res.data || {});
        alert(`Не вдалося надіслати (${res.status}): ${t}`);
        setCreating(false);
        return;
      }

      alert('Дякуємо! Ваш відгук відправлено на модерацію.');
      setOpenModal(false);
      setForm({ courseId: 0, rating: 5, text: '', video_url: '', consent: false });
      await loadAll();
    } catch (e: any) {
      alert(e?.message || 'Сталася помилка під час надсилання');
    } finally {
      setCreating(false);
    }
  }

  /* =========================================================
     Рендер
  ========================================================= */
  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      {/* HERO */}
      <section className="w-[1280px] mx-auto pt-[159px]">
        <div className="w-[1047px] mx-auto grid" style={{ gridTemplateColumns: '461px 564px', columnGap: '22px', alignItems: 'start' }}>
          {/* Ліва колонка */}
          <div className="w-[461px]">
            <h1 className="m-0 w-[423px] font-[Afacad] font-bold text-[96px] leading-[128px] text-[#021C4E]">Відгуки</h1>

            <p className="w-[461px] font-[Mulish] font-medium text-[24px] leading-[30px] text-black" style={{ marginTop: `${207 - 81 - 128}px` }}>
              Реальні історії студентів: прогрес, перша робота, апгрейд навичок.
            </p>

            <div className="mt-[22px] flex gap-3">
              <button onClick={() => setOpenModal(true)} className="inline-flex items-center justify-center w-[258px] h-[55px] bg-[#1345DE] text-white rounded-[10px] font-[Mulish] font-semibold text-[14px]">
                Залишити відгук
              </button>
              <Link href="/courses" className="inline-flex items-center gap-2 px-4 h-[55px] rounded-[10px] border border-[#1345DE] text-[#1345DE] font-[Mulish] font-semibold text-[14px]">
                Переглянути курси
              </Link>
            </div>

            {/* Зведення рейтингу */}
            <div className={CARD16 + ' mt-6'}>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[40px] font-extrabold text-[#0F2E64] leading-none">{avgRating.toFixed(1)}</div>
                  <RatingStars value={avgRating} size={18} />
                  <div className="text-sm text-slate-600 mt-1">{totalCount} відгуків</div>
                </div>
                <div className="flex-1 space-y-2">
                  {distribution.map((row) => (
                    <div key={row.stars} className="flex items-center gap-2">
                      <div className="w-8 text-sm text-[#0F2E64] font-semibold">{row.stars}★</div>
                      <div className="h-2 flex-1 rounded bg-[#EEF3FF] ring-1 ring-[#E5ECFF] overflow-hidden">
                        <div className="h-full bg-[#1345DE]" style={{ width: `${(row.count / maxCount) * 100 || 0}%` }} />
                      </div>
                      <div className="w-6 text-right text-sm text-slate-600">{row.count}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>Перевірені профілі</Badge>
                <Badge>Фото/відео докази</Badge>
                <Badge>Менторська підтримка</Badge>
              </div>
            </div>
          </div>

          {/* Права колонка */}
          <div className="w-[564px] grid" style={{ gridTemplateColumns: '1fr', rowGap: '16px' }}>
            <div className={CARD20}>
              <div className="text-[#0F2E64] font-extrabold">Відео-відгук: перша робота в IT</div>
              <div className="relative w-full mt-3 rounded-[12px] overflow-hidden ring-1 ring-[#E5ECFF]">
                <div className="relative w-full aspect-[16/9]">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="Video testimonial"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              </div>
              <p className="mt-3 text-slate-700 text-sm">Коротка історія студента: що вивчив, як складав портфоліо, і як отримав офер.</p>
            </div>

            <div className={CARD20}>
              <div className="text-[#0F2E64] font-extrabold">Цифри й довіра</div>
              <div className="mt-3 grid grid-cols-3 gap-4">
                <KPI title="98%" sub="задоволених" />
                <KPI title="15 хв" sub="середній SLA" />
                <KPI title={`${reviews.length}`} sub="відгуків" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Стік-спостерігач */}
      <div ref={stickyRef} className="h-0" />

      {/* Фільтри/пошук */}
      <section className={`mt-10 ${stuck ? 'sticky top-0 z-40' : ''}`}>
        <div className={CONTAINER}>
          <div className={`${CARD16} ${stuck ? 'shadow-[0_10px_30px_rgba(2,28,78,0.12)] backdrop-blur' : ''}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                value={query}
                onChange={(e) => { setPage(1); setQuery(e.target.value); }}
                placeholder="Пошук за іменем, курсом…"
                className={`flex-1 ${INPUT}`}
              />

              <div className="flex gap-2 flex-wrap">
                <select
                  value={String(cat)}
                  onChange={(e) => {
                    const v = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setPage(1);
                    setCat(v as any);
                  }}
                  className={INPUT}
                >
                  {courseOptions.map((c) => (
                    <option key={`c-${c.id}`} value={String(c.id)}>{c.label}</option>
                  ))}
                </select>

                <select value={sort} onChange={(e) => setSort(e.target.value as any)} className={INPUT}>
                  <option value="new">Спочатку нові</option>
                  <option value="top">Найвищий рейтинг</option>
                </select>

                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyWithMedia}
                    onChange={(e) => { setPage(1); setOnlyWithMedia((e.target as HTMLInputElement).checked); }}
                    className="accent-[#1345DE]"
                  />
                  Лише з фото/відео
                </label>
              </div>
            </div>
          </div>

          {err && <div className="mt-3 rounded-[12px] bg-red-50 text-red-700 ring-1 ring-red-200 p-3">Помилка: {err}</div>}
        </div>
      </section>

      {/* Факти */}
      <section className="mt-8">
        <div className={`${CONTAINER} grid grid-cols-1 md:grid-cols-3 gap-6`}>
          <FactCard kpi="82%" label="закрили перше ТЗ" desc="за 4–6 тижнів навчання" />
          <FactCard kpi="150+" label="менторів" desc="практики з актуальних компаній" />
          <FactCard kpi="24/7" label="чат-бот" desc="базові питання — миттєво" />
        </div>
      </section>

      {/* Список відгуків */}
      <section className="py-10">
        <div className={`${CONTAINER} grid grid-cols-1 md:grid-cols-2 gap-6`}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : pageItems.map((r) => <ReviewCard key={r.id} r={r} />)}

          {!loading && pageItems.length === 0 && (
            <EmptyState title="Нічого не знайдено" hint="Спробуйте змінити фільтри або пошуковий запит." />
          )}
        </div>

        {/* Пагінація */}
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={`${BTN_GHOST} disabled:opacity-50`}>
            ← Назад
          </button>
          <div className="px-3 py-2 text-[#0F2E64] font-semibold">
            {page} / {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`${BTN_GHOST} disabled:opacity-50`}
          >
            Далі →
          </button>
        </div>
      </section>

      {/* Довіра */}
      <section className="pb-16">
        <div className={`${CONTAINER} grid grid-cols-1 md:grid-cols-3 gap-6`}>
          <TrustCard title="Перевіряємо справжність" text="Вибірково просимо підтвердити особу або факт участі у курсі." />
          <TrustCard title="Публікуємо як є" text="Редагуємо тільки граматику — без зміни сенсу." />
          <TrustCard title="Реагуємо на критику" text="Кожен кейс розбираємо і покращуємо програми." />
        </div>
      </section>

      {/* Модалка створення */}
      {openModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-[720px] rounded-[16px] bg-white ring-1 ring-[#E5ECFF] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[#0F2E64] font-extrabold text-[22px]">Залишити відгук</h3>
              <button onClick={() => setOpenModal(false)} className="text-[#1345DE] font-semibold">Закрити</button>
            </div>

            <form className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submitReview}>
              <label className="block md:col-span-2">
                <span className="block text-sm font-semibold text-[#0F2E64]">Курс</span>
                <select
                  value={form.courseId || 0}
                  onChange={(e) => setForm((f) => ({ ...f, courseId: Number(e.target.value) }))}
                  required
                  className={`${INPUT} mt-1 w-full`}
                >
                  <option value={0} disabled>Оберіть курс</option>
                  {purchasedCourses.length === 0 ? (
                    <option value={0} disabled>Немає куплених курсів</option>
                  ) : (
                    purchasedCourses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title ? c.title : `Курс #${c.id}`}</option>
                    ))
                  )}
                </select>
              </label>

              <label className="block">
                <span className="block text_sm font-semibold text-[#0F2E64]">Оцінка</span>
                <div className="mt-2 flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const v = i + 1;
                    return (
                      <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, rating: v }))} className="p-1" aria-label={`Оцінка ${v}`}>
                        <Star filled={v <= form.rating} size={22} />
                      </button>
                    );
                  })}
                </div>
              </label>

              <label className="block md:col-span-2">
                <span className="block text-sm font-semibold text-[#0F2E64]">Ваш відгук</span>
                <textarea
                  value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  required
                  rows={5}
                  placeholder="Опишіть досвід: програма, ментори, результат…"
                  className={`${INPUT} mt-1 w-full`}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="block text-sm font-semibold text-[#0F2E64]">YouTube-відео (опц.)</span>
                <input
                  value={form.video_url}
                  onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`${INPUT} mt-1 w-full`}
                />
              </label>

              <label className="inline-flex items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setForm((f) => ({ ...f, consent: (e.target as HTMLInputElement).checked }))}
                  className="accent-[#1345DE]"
                  required
                />
                <span className="text-sm text-slate-700">Погоджуюсь з політикою конфіденційності</span>
              </label>

              <div className="pt-2 md:col-span-2 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setOpenModal(false)} className={BTN_GHOST}>Скасувати</button>
                <button type="submit" disabled={creating || purchasedCourses.length === 0} className={BTN_PRIMARY}>
                  {creating ? 'Надсилаємо…' : 'Надіслати'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Brainboost Courses',
            aggregateRating: { '@type': 'AggregateRating', ratingValue: avgRating || 0, reviewCount: totalCount },
            review: filtered.slice(0, 3).map((r) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.name },
              reviewRating: { '@type': 'Rating', ratingValue: r.rating },
              datePublished: r.date,
              reviewBody: r.text,
            })),
          }),
        }}
      />
    </main>
  );
}

/* =========================================================
   Дрібні картки / елементи
========================================================= */
const SkeletonCard = () => (
  <div className={CARD20 + ' animate-pulse'}>
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-full bg-slate-200" />
      <div className="flex-1">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="h-3 w-24 bg-slate-200 rounded mt-2" />
        <div className="h-3 w-full bg-slate-200 rounded mt-4" />
        <div className="h-3 w-2/3 bg-slate-200 rounded mt-2" />
      </div>
    </div>
  </div>
);

const KPI = ({ title, sub }: { title: string; sub: string }) => (
  <div className="rounded-[16px] ring-1 ring-[#E5ECFF] p-4 bg-white text-center shadow-[0_6px_18px_rgba(2,28,78,0.06)]">
    <div className="text-[#1345DE] font-extrabold text-[22px] leading-tight">{title}</div>
    <div className="text-[#0F2E64] text-sm">{sub}</div>
  </div>
);

const FactCard = ({ kpi, label, desc }: { kpi: string; label: string; desc: string }) => (
  <div className={CARD20}>
    <div className="text-[#1345DE] font-extrabold text-3xl leading-none">{kpi}</div>
    <div className="text-[#0F2E64] mt-1 font-semibold">{label}</div>
    <div className="text-slate-700">{desc}</div>
  </div>
);

const TrustCard = ({ title, text }: { title: string; text: string }) => (
  <div className="rounded-[16px] bg-white ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)]">
    <div className="text-[#0F2E64] font-extrabold">{title}</div>
    <div className="text-slate-700 mt-1">{text}</div>
  </div>
);

const EmptyState = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="col-span-full rounded-[16px] bg-white ring-1 ring-[#E5ECFF] p-8 text-center">
    <div className="text-[#0F2E64] font-extrabold text-xl">{title}</div>
    {hint ? <div className="text-slate-600 mt-1">{hint}</div> : null}
    <div className="mt-4 flex justify-center gap-2">
      <Badge>Змініть фільтри</Badge>
      <Badge>Спробуйте інший запит</Badge>
    </div>
  </div>
);

function ReviewCard({ r }: { r: ReviewUI }) {
  const [liked, setLiked] = useState(false);
  return (
    <article className={CARD20}>
      <div className="flex items-start gap-4">
        <img src={murl(r.avatar) || '/images/avatar1.png'} alt={r.name} className="w-12 h-12 rounded-full ring-2 ring-white object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[#0F2E64] font-extrabold">{r.name}</div>
            <Badge>{r.courseTitle || `Курс #${r.courseId}`}</Badge>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <RatingStars value={r.rating} />
            <span className="text-xs text-slate-600">{new Date(r.date).toLocaleDateString()}</span>
          </div>

          <p className="mt-3 text-slate-800 whitespace-pre-line">{r.text}</p>

          {(r.images?.length || r.video) && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {r.images?.map((src, i) => (
                <div key={i} className="rounded-[12px] overflow-hidden ring-1 ring-[#E5ECFF]">
                  <img src={murl(src)} alt="" className="w-full h-32 object-cover" loading="lazy" />
                </div>
              ))}
              {r.video && (
                <div className="col-span-2 rounded-[12px] overflow-hidden ring-1 ring-[#E5ECFF]">
                  <div className="relative w-full aspect-[16/9]">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={ytToEmbed(r.video)}
                      title="Video"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <footer className="flex items-center justify-between mt-4 text-sm text-slate-600">
            <button
              type="button"
              onClick={() => setLiked((v) => !v)}
              className={`px-3 py-1 rounded-[10px] ring-1 transition ${liked ? 'bg-[#EEF3FF] text-[#1345DE] ring-[#1345DE]' : 'bg-white ring-[#E5ECFF]'}`}
              aria-pressed={liked}
            >
              {liked ? 'Дякую за відгук 💙' : 'Це корисно'}
            </button>
          </footer>
        </div>
      </div>
    </article>
  );
}
