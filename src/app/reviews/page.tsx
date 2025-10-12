'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import http, { API_BASE } from '@/lib/http';
import FooterCard from "@/components/FooterCard";

/* =========================================================
   УТИЛІТИ ДЛЯ URL
========================================================= */
// Абсолютні URL (http/https, data:, blob:, protocol-relative)
const isAbs = (u?: string) =>
  !!u && (/^https?:\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('//'));

// База бекенда (БЕЗ кінцевого /). ORIGIN = домен без суфікса /api
const RAW_BASE = (API_BASE || '').replace(/\/+$/, '');
const CONF_ORIGIN = RAW_BASE.replace(/\/api$/i, '');

// Отримати origin у рантаймі (для локалки, коли API_BASE не вказаний)
const getOrigin = () => (CONF_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : ''));

// Нормалізація одного рядка URL:
const murl = (u?: string) => {
  if (!u) return '';
  if (isAbs(u)) return u;                        // вже абсолютний
  if (u.startsWith('//')) return `https:${u}`;   // protocol-relative → https

  // фронтові файли з /public — віддає сам Next
  if (u.startsWith('/images/') || u.startsWith('/course_image/') || u.startsWith('/favicon') || u.startsWith('/icons/')) {
    return u;
  }

  const ORIGIN = getOrigin();

  // backend media/static — додаємо ORIGIN
  if (u.startsWith('/media/') || u.startsWith('/static/')) {
    return `${ORIGIN}${u}`;
  }
  if (u.startsWith('media/') || u.startsWith('static/')) {
    return `${ORIGIN}/${u}`;
  }

  // інше — лишаємо як є
  return u;
};

/* =========================================================
   КОНСТАНТИ СТИЛЮ
========================================================= */
const CONTAINER = 'mx-auto w-full max-w-[1160px] px-4 sm:px-6 md:px-[118px]';
const CARD20 = 'rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)]';
const CARD16 = 'rounded-[16px] bg-white ring-1 ring-[#E5ECFF] p-4 shadow-[0_6px_22px_rgba(2,28,78,0.08)]';
const INPUT = 'rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]';
const BTN_PRIMARY = 'px-5 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold disabled:opacity-60';
const BTN_GHOST = 'px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white';

/* =========================================================
   ДРІБНІ КОМПОНЕНТИ
========================================================= */
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
   ТИПИ
========================================================= */
type ReviewApi = {
  id: number;
  course: number;
  rating: number;
  text: string;
  video_url: string;
  user_name: string;
  user_avatar: string;
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
  avatar: string;     // завжди рядок (з дефолтом)
  images: string[];   // завжди масив
  video?: string;
};

type PurchaseApi = {
  id: number;
  course: { id: number; title?: string } | number;
  is_active?: boolean;
  purchased_at?: string;
};

/* =========================================================
   ХЕЛПЕРИ
========================================================= */
const safeGetArray = <T,>(raw: any): T[] =>
  Array.isArray(raw) ? (raw as T[]) : (raw?.results && Array.isArray(raw.results) ? (raw.results as T[]) : []);

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
  avatar: r.user_avatar ? murl(r.user_avatar) : '/images/defuser.png',
  images: Array.isArray(r.images) ? r.images.map((i) => murl(i.image)).filter(Boolean) : [],
  video: r.video_url || undefined,
});

/* =========================================================
   ГОЛОВНИЙ КОМПОНЕНТ
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
      const out = arr
        .map((p) => {
          const c = p.course as any;
          if (!c) return null;
          if (typeof c === 'number') return { id: c, title: `Курс #${c}` } as CourseApi;
          return { id: Number(c.id), title: String(c.title || `Курс #${c.id}`) } as CourseApi;
        })
        .filter(Boolean) as CourseApi[];
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
      (courseRes && courseRes.status === 200 ? safeGetArray<CourseApi>(courseRes.data) : []).forEach((c) =>
        cmap.set(c.id, c.title),
      );
      myPurchases.forEach((c) => cmap.set(c.id, c.title));

      setReviews(revData.map((r) => toUI(r, cmap.get(r.course))));
    } catch (e: any) {
      setErr(e?.message || 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

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
    [courses],
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
          (r.courseTitle || `Курс #${r.courseId}`).toLowerCase().includes(q),
      );
    }

    if (onlyWithMedia) list = list.filter((r) => (r.images && r.images.length > 0) || !!r.video);

    sort === 'new'
      ? list.sort((a, b) => +new Date(b.date) - +new Date(a.date))
      : list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [reviews, cat, query, onlyWithMedia, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const avgRating =
    filtered.length > 0
      ? Math.round((filtered.reduce((acc, r) => acc + r.rating, 0) / filtered.length) * 10) / 10
      : 0;

  const distribution = useMemo(() => {
    const base = new Map<number, number>([
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
    ]);
    filtered.forEach((r) => {
      const k = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
      base.set(k, (base.get(k) || 0) + 1);
    });
    return [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: base.get(s) || 0 }));
  }, [filtered]);
  const totalCount = filtered.length;
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  /* ---------- Сабміт відгуку ---------- */
  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!form.courseId) return alert('Оберіть курс.');
    if (!form.consent) return alert('Підтвердіть згоду з політикою конфіденційності.');
    if (!purchasedCourses.some((c) => c.id === form.courseId)) {
      return alert('Ви можете залишити відгук лише для купленого курсу.');
    }

    try {
      setCreating(true);
      const res: any = await http.post(
        '/api/reviews/create/',
        {
          course: form.courseId,
          rating: form.rating,
          text: form.text,
          video_url: form.video_url || '',
        },
        { validateStatus: () => true },
      );

      if (res.status < 200 || res.status >= 300) {
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
     РЕНДЕР
  ========================================================= */
  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-top bg-cover">
      {/* HERO */}
      <section className="pt-24 sm:pt-32 lg:pt-40">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-6">
            {/* Ліва колонка */}
            <div className="max-w-xl lg:max-w-none">
              <h1
                className="m-0 font-[Afacad] font-bold leading-[1.05] text-[#021C4E]
                           text-[clamp(48px,10vw,96px)]"
              >
                Відгуки
              </h1>

              <p className="mt-4 max-w-[52ch] font-[Mulish] text-[18px] leading-[1.4] text-black sm:text-[20px] lg:text-[24px]">
                Реальні історії студентів: прогрес, перша робота, апгрейд навичок.
              </p>

              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setOpenModal(true)}
                  className="inline-flex h-[55px] items-center justify-center rounded-[10px] bg-[#1345DE] px-6 font-[Mulish] text-[14px] font-semibold text-white hover:bg-[#0e2db9] transition sm:w-auto"
                >
                  Залишити відгук
                </button>
                <Link
                  href="/courses"
                  className="inline-flex h-[55px] items-center justify-center gap-2 rounded-[10px] border border-[#1345DE] px-4 font-[Mulish] text-[14px] font-semibold text-[#1345DE] sm:w-auto"
                >
                  Переглянути курси
                </Link>
              </div>

              {/* Зведення рейтингу */}
              <div className={CARD16 + ' mt-6'}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="leading-none text-[40px] font-extrabold text-[#0F2E64]">
                      {avgRating.toFixed(1)}
                    </div>
                    <RatingStars value={avgRating} size={18} />
                    <div className="mt-1 text-sm text-slate-600">{totalCount} відгуків</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {distribution.map((row) => (
                      <div key={row.stars} className="flex items-center gap-2">
                        <div className="w-8 text-sm font-semibold text-[#0F2E64]">{row.stars}★</div>
                        <div className="h-2 flex-1 overflow-hidden rounded bg-[#EEF3FF] ring-1 ring-[#E5ECFF]">
                          <div
                            className="h-full bg-[#1345DE]"
                            style={{ width: `${(row.count / maxCount) * 100 || 0}%` }}
                          />
                        </div>
                        <div className="w-6 text-right text-sm text-slate-600">{row.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Права колонка */}
            <div className="mx-auto w-full max-w-[600px] space-y-4">
              <div className={CARD20}>
                <div className="font-extrabold text-[#0F2E64]">
                  Робота в інтернеті - ТОП-5 професій на дому для новачків в 2025 році
                </div>
                <div className="relative mt-3 w-full overflow-hidden rounded-[12px] ring-1 ring-[#E5ECFF]">
                  <div className="relative aspect-video w-full">
                    <iframe
                      className="absolute inset-0 h-full w-full rounded-xl"
                      src="https://www.youtube-nocookie.com/embed/FCkyRrXMSiw?rel=0&modestbranding=1"
                      title="Video testimonial"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  Коротка історія студента: що вивчив, як складав портфоліо, і як отримав офер.
                </p>
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
          <div className={`${CARD16} ${stuck ? 'backdrop-blur shadow-[0_10px_30px_rgba(2,28,78,0.12)]' : ''}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                value={query}
                onChange={(e) => {
                  setPage(1);
                  setQuery(e.target.value);
                }}
                placeholder="Пошук за іменем, курсом…"
                className={`flex-1 ${INPUT}`}
              />

              <div className="flex flex-wrap gap-2">
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
                    <option key={`c-${c.id}`} value={String(c.id)}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <select value={sort} onChange={(e) => setSort(e.target.value as any)} className={INPUT}>
                  <option value="new">Спочатку нові</option>
                  <option value="top">Найвищий рейтинг</option>
                </select>

                <label className="inline-flex cursor-pointer select-none items-center gap-2 rounded-[10px] px-3 py-2 ring-1 ring-[#E5ECFF]">
                  <input
                    type="checkbox"
                    checked={onlyWithMedia}
                    onChange={(e) => {
                      setPage(1);
                      setOnlyWithMedia((e.target as HTMLInputElement).checked);
                    }}
                    className="accent-[#1345DE]"
                  />
                  Лише з фото/відео
                </label>
              </div>
            </div>
          </div>

          {err && (
            <div className="mt-3 rounded-[12px] bg-red-50 p-3 text-red-700 ring-1 ring-red-200">
              Помилка: {err}
            </div>
          )}
        </div>
      </section>

      {/* Факти */}
      <section className="mt-8">
        <div className={`${CONTAINER} grid grid-cols-1 gap-6 md:grid-cols-3`}>
          <FactCard kpi="82%" label="закрили перше ТЗ" desc="за 4–6 тижнів навчання*" />
          <FactCard kpi="150+" label="менторів" desc="практики з актуальних компаній*" />
          <FactCard kpi="24/7" label="чат-бот" desc="базові питання — миттєво*" />
        </div>
      </section>

      {/* Список відгуків */}
      <section className="py-10">
        <div className={`${CONTAINER} grid grid-cols-1 gap-6 md:grid-cols-2`}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : pageItems.map((r) => <ReviewCard key={r.id} r={r} />)}

          {!loading && pageItems.length === 0 && (
            <EmptyState title="Нічого не знайдено" hint="Спробуйте змінити фільтри або пошуковий запит." />
          )}
        </div>

        {/* Пагінація */}
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`${BTN_GHOST} disabled:opacity-50`}
          >
            ← Назад
          </button>
          <div className="px-3 py-2 font-semibold text-[#0F2E64]">
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
        <div className={`${CONTAINER} grid grid-cols-1 gap-6 md:grid-cols-3`}>
          <TrustCard title="Перевіряємо справжність" text="Вибірково просимо підтвердити особу або факт участі у курсі." />
          <TrustCard title="Публікуємо як є" text="Редагуємо тільки граматику — без зміни сенсу." />
          <TrustCard title="Реагуємо на критику" text="Кожен кейс розбираємо і покращуємо програми." />
        </div>
      </section>

      {/* Модалка створення */}
      {openModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-[720px] rounded-[16px] bg-white p-6 ring-1 ring-[#E5ECFF] shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[22px] font-extrabold text-[#0F2E64]">Залишити відгук</h3>
              <button onClick={() => setOpenModal(false)} className="font-semibold text-[#1345DE]">
                Закрити
              </button>
            </div>

            <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submitReview}>
              <label className="block md:col-span-2">
                <span className="block text-sm font-semibold text-[#0F2E64]">Курс</span>
                <select
                  value={form.courseId || 0}
                  onChange={(e) => setForm((f) => ({ ...f, courseId: Number(e.target.value) }))}
                  required
                  className={`${INPUT} mt-1 w-full`}
                >
                  <option value={0} disabled>
                    Оберіть курс
                  </option>
                  {purchasedCourses.length === 0 ? (
                    <option value={0} disabled>
                      Немає куплених курсів
                    </option>
                  ) : (
                    purchasedCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title ? c.title : `Курс #${c.id}`}
                      </option>
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
                      <button
                        key={v}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, rating: v }))}
                        className="p-1"
                        aria-label={`Оцінка ${v}`}
                      >
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

              <label className="md:col-span-2 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setForm((f) => ({ ...f, consent: (e.target as HTMLInputElement).checked }))}
                  className="accent-[#1345DE]"
                  required
                />
                <span className="text-sm text-slate-700">Погоджуюсь з політикою конфіденційності</span>
              </label>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setOpenModal(false)} className={BTN_GHOST}>
                  Скасувати
                </button>
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
      <FooterCard />
    </main>
  );
}

/* =========================================================
   ДРІБНІ КАРТКИ / ЕЛЕМЕНТИ
========================================================= */
const SkeletonCard = () => (
  <div className={CARD20 + ' animate-pulse'}>
    <div className="flex gap-4">
      <div className="h-12 w-12 rounded-full bg-slate-200" />
      <div className="flex-1">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-24 rounded bg-slate-200" />
        <div className="mt-4 h-3 w-full rounded bg-slate-200" />
        <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
      </div>
    </div>
  </div>
);

const KPI = ({ title, sub }: { title: string; sub: string }) => (
  <div className="rounded-[16px] bg-white p-4 text-center ring-1 ring-[#E5ECFF] shadow-[0_6px_18px_rgba(2,28,78,0.06)]">
    <div className="text-[22px] font-extrabold leading-tight text-[#1345DE]">{title}</div>
    <div className="text-sm text-[#0F2E64]">{sub}</div>
  </div>
);

const FactCard = ({ kpi, label, desc }: { kpi: string; label: string; desc: string }) => (
  <div className={CARD20}>
    <div className="text-3xl font-extrabold leading-none text-[#1345DE]">{kpi}</div>
    <div className="mt-1 font-semibold text-[#0F2E64]">{label}</div>
    <div className="text-slate-700">{desc}</div>
  </div>
);

const TrustCard = ({ title, text }: { title: string; text: string }) => (
  <div className="rounded-[16px] bg-white p-5 ring-1 ring-[#E5ECFF] shadow-[0_8px_24px_rgba(2,28,78,0.06)]">
    <div className="font-extrabold text-[#0F2E64]">{title}</div>
    <div className="mt-1 text-slate-700">{text}</div>
  </div>
);

const EmptyState = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="col-span-full rounded-[16px] bg-white p-8 text-center ring-1 ring-[#E5ECFF]">
    <div className="text-xl font-extrabold text-[#0F2E64]">{title}</div>
    {hint ? <div className="mt-1 text-slate-600">{hint}</div> : null}
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
        <img
          src={r.avatar || '/images/defuser.png'}
          alt={r.name}
          className="h-12 w-12 rounded-full ring-2 ring-white object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/defuser.png'; }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-extrabold text-[#0F2E64]">{r.name}</div>
            <Badge>{r.courseTitle || `Курс #${r.courseId}`}</Badge>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <RatingStars value={r.rating} />
            <span className="text-xs text-slate-600">{new Date(r.date).toLocaleDateString()}</span>
          </div>

          <p className="mt-3 whitespace-pre-line text-slate-800">{r.text}</p>

          {(r.images.length > 0 || r.video) && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {r.images.map((src, i) => (
                <div key={i} className="overflow-hidden rounded-[12px] ring-1 ring-[#E5ECFF]">
                  <img
                    src={src}
                    alt=""
                    className="h-40 w-full object-cover sm:h-32"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/placeholder.jpg'; }}
                  />
                </div>
              ))}
              {r.video && (
                <div className="col-span-1 sm:col-span-2 overflow-hidden rounded-[12px] ring-1 ring-[#E5ECFF]">
                  <div className="relative aspect-[16/9] w-full">
                    <iframe
                      className="absolute inset-0 h-full w-full"
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

          <footer className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <button
              type="button"
              onClick={() => setLiked((v) => !v)}
              className={`rounded-[10px] px-3 py-1 ring-1 transition ${
                liked ? 'bg-[#EEF3FF] text-[#1345DE] ring-[#1345DE]' : 'bg-white ring-[#E5ECFF]'
              }`}
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
