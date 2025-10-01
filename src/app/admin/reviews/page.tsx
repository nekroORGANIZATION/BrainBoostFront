'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import http, { API_BASE } from '@/lib/http';
import { CheckCircle2, XCircle, RotateCw, Trash2, ExternalLink, ChevronDown } from "lucide-react";

// 🔽 общий медиахелпер
import { mediaUrl, avatarUrl } from '@/lib/media';

/* =========================
   Конфіг
========================= */
const ADMIN_LIST = `/api/reviews/admin/`;
const MODERATE_ENDPOINT = (id: number) => `/api/reviews/${id}/moderate/`;
const DELETE_ENDPOINT = (id: number) => `/api/reviews/${id}/`;
const COURSES_ENDPOINT = `/courses/`;
const CONTAINER = 'mx-auto max-w-[1160px] px-5 md:px-8';

/* =========================
   Типи
========================= */
type ReviewAdmin = {
  id: number;
  course: number;
  rating: number;
  text: string;
  video_url: string;
  status: 'pending' | 'approved' | 'rejected';
  moderation_reason?: string;
  created_at: string;
  user_name: string;
  user_avatar: string;
  images?: { id: number; image: string }[];
};

type Course = { id: number; title: string };

/* =========================
   Медіа-хелпери локально
========================= */
function isAbsUrl(u?: string) {
  return !!u && (/^https?:\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:'));
}
// маппим картинки отзывов (не аватары)
function mapImages(items?: { id: number; image: string }[]) {
  return (items || []).map((x) => ({ ...x, image: mediaUrl(x.image) }));
}

/* =========================
   Утіліти
========================= */
function safeArr<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && Array.isArray(raw.results)) return raw.results as T[];
  return [];
}
function ytEmbed(url: string) {
  if (!url) return '';
  if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
  if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/');
  return url;
}
function cx(...s: (string | false | null | undefined)[]) {
  return s.filter(Boolean).join(' ');
}

/* =========================
   UI-дрібниці
========================= */
function Badge({
  children,
  kind = 'info',
}: {
  children: React.ReactNode;
  kind?: 'info' | 'success' | 'warning' | 'danger';
}) {
  const map = {
    info: 'bg-[#EEF3FF] text-[#1345DE] ring-[#E5ECFF]',
    success: 'bg-green-100 text-green-800 ring-green-200',
    warning: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
    danger: 'bg-red-100 text-red-800 ring-red-200',
  } as const;
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ring-1',
        map[kind]
      )}
    >
      {children}
    </span>
  );
}
function StatusBadge({ s }: { s: ReviewAdmin['status'] }) {
  if (s === 'approved') return <Badge kind="success">Схвалено</Badge>;
  if (s === 'rejected') return <Badge kind="danger">Відхилено</Badge>;
  return <Badge kind="warning">На модерації</Badge>;
}
function Star({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      className={filled ? 'fill-[#FFC107]' : 'fill-none stroke-[#FFC107]'}
      strokeWidth={filled ? 0 : 1.6}
    >
      <path d="M12 2l2.9 6.2 6.8.8-5 4.7 1.4 6.7L12 17.8 5.9 20.4 7.3 13.7 2.3 9l6.8-.8L12 2z" />
    </svg>
  );
}
function Stars({ value }: { value: number }) {
  return <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} filled={i <= value} />)}</div>;
}
function KPI({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="rounded-[16px] ring-1 ring-[#E5ECFF] p-4 bg-white/90 backdrop-blur text-center shadow-[0_6px_18px_rgba(2,28,78,0.05)]">
      <div className="text-[#1345DE] font-extrabold text-xl leading-tight">{title}</div>
      <div className="text-[#0F2E64] text-sm">{sub}</div>
    </div>
  );
}
function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'h-9 px-3 rounded-full text-sm ring-1 transition',
        active ? 'bg-[#1345DE] text-white ring-[#1345DE]' : 'bg-white text-[#1345DE] ring-[#E5ECFF] hover:ring-[#1345DE]'
      )}
    >
      {children}
    </button>
  );
}
function SkeletonCard() {
  return (
    <div className="rounded-[16px] bg-white ring-1 ring-[#E5ECFF] p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-3 w-full bg-slate-200 rounded" />
          <div className="h-3 w-2/3 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

/* =========================
   Сторінка
========================= */
export default function AdminReviewsPage() {
  const [items, setItems] = useState<ReviewAdmin[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // фільтри
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [courseId, setCourseId] = useState<number | 'all'>('all');
  const [withMedia, setWithMedia] = useState(false);
  const [ratingMin, setRatingMin] = useState<number | ''>('');
  const [ratingMax, setRatingMax] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sort, setSort] = useState<'new' | 'old' | 'rating_desc' | 'rating_asc'>('new');

  // вибір / масові дії
  const [selected, setSelected] = useState<number[]>([]);

  // пагінація
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // модалки
  const [reasonOpen, setReasonOpen] = useState<{ id: number; action: 'rejected' } | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ ids: number[] } | null>(null);

  // прилипання
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  /* завантаження */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const r = await http.get(ADMIN_LIST, { validateStatus: () => true });
        if (r.status === 401) throw new Error('401: Неавторизовано. Увійдіть.');
        if (r.status === 403) throw new Error('403: Доступ лише для адмінів.');
        if (r.status < 200 || r.status >= 300) throw new Error(`Помилка ${r.status}`);

        const arr = safeArr<ReviewAdmin>(r.data).map((x) => ({
          ...x,
          user_avatar: avatarUrl(x.user_avatar),   // 👈 аватар
          images: mapImages(x.images),
        }));
        if (!cancelled) setItems(arr);

        const c = await http.get(COURSES_ENDPOINT, { validateStatus: () => true });
        if (c.status >= 200 && c.status < 300) {
          const clist = safeArr<Course>(c.data);
          if (!cancelled) setCourses(clist);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e.message || 'Не вдалося завантажити дані');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { threshold: 1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* похідні */
  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c.title])), [courses]);

  const filtered = useMemo(() => {
    let list = [...items];

    if (status !== 'all') list = list.filter((i) => i.status === status);
    if (courseId !== 'all') list = list.filter((i) => i.course === courseId);

    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (i) =>
          (i.user_name || '').toLowerCase().includes(s) ||
          (courseMap.get(i.course) || `Курс #${i.course}`).toLowerCase().includes(s) ||
          (i.text || '').toLowerCase().includes(s)
      );
    }

    if (withMedia) list = list.filter((i) => (i.images && i.images.length > 0) || !!i.video_url);

    list = list.filter((i) => {
      const okMin = ratingMin === '' ? true : i.rating >= ratingMin;
      const okMax = ratingMax === '' ? true : i.rating <= ratingMax;
      return okMin && okMax;
    });

    if (dateFrom) list = list.filter((i) => new Date(i.created_at) >= new Date(dateFrom));
    if (dateTo) list = list.filter((i) => new Date(i.created_at) <= new Date(dateTo + 'T23:59:59'));

    list.sort((a, b) => {
      if (sort === 'new') return +new Date(b.created_at) - +new Date(a.created_at);
      if (sort === 'old') return +new Date(a.created_at) - +new Date(b.created_at);
      if (sort === 'rating_desc') return b.rating - a.rating;
      if (sort === 'rating_asc') return a.rating - b.rating;
      return 0;
    });

    return list;
  }, [items, status, courseId, q, withMedia, ratingMin, ratingMax, dateFrom, dateTo, sort, courseMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const allSelected = pageItems.length > 0 && pageItems.every((i) => selected.includes(i.id));
  const someSelected = pageItems.some((i) => selected.includes(i.id));

  /* дії */
  function toggleSelect(id: number) {
    setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));
  }
  function toggleSelectPage() {
    setSelected((sel) => {
      if (allSelected) return sel.filter((id) => !pageItems.find((p) => p.id === id));
      const toAdd = pageItems.map((p) => p.id).filter((id) => !sel.includes(id));
      return sel.concat(toAdd);
    });
  }
  function clearSelection() {
    setSelected([]);
  }

  async function moderateOne(id: number, next: 'approved' | 'rejected' | 'pending', reason?: string) {
    const res = await http.patch(MODERATE_ENDPOINT(id), {
      status: next,
      moderation_reason: reason ?? '',
    });
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Помилка ${res.status}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`);
    }
    setItems((list) => list.map((i) => (i.id === id ? { ...i, status: next, moderation_reason: reason ?? '' } : i)));
  }

  async function deleteOne(id: number) {
    const res = await http.delete(DELETE_ENDPOINT(id), { validateStatus: () => true });
    if (res.status !== 204 && (res.status < 200 || res.status >= 300)) {
      throw new Error(`Помилка ${res.status}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`);
    }
    setItems((list) => list.filter((i) => i.id !== id));
    setSelected((sel) => sel.filter((x) => x !== id));
  }

  async function bulkModerate(ids: number[], next: 'approved' | 'rejected') {
    for (const id of ids) {
      try {
        await moderateOne(id, next, next === 'rejected' ? '(bulk)' : '');
      } catch {}
    }
    clearSelection();
  }

  async function bulkDelete(ids: number[]) {
    for (const id of ids) {
      try {
        await deleteOne(id);
      } catch {}
    }
    setConfirmDelete(null);
  }

  /* рендер */
  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      {/* Хедер */}
      <header className="pt-24 pb-6 border-b border-[#E5ECFF]">
        <div className={CONTAINER}>
          <div className="flex items-end justify-between gap-6">
            <div>
              <nav className="text-sm text-slate-500 mb-2">
                <Link href="/admin" className="hover:underline">
                  Адмін
                </Link>
                <span className="mx-2">/</span>
                <span className="text-slate-700">Відгуки</span>
              </nav>
              <h1 className="m-0 font-[Afacad] font-bold text-[48px] leading-[1.05] text-[#021C4E]">Відгуки — модерація</h1>
              <p className="mt-2 text-slate-600">Фільтри, масові дії, медіа та видалення.</p>
              {err && (
                <div className="mt-3 rounded-[12px] bg-red-50 text-red-700 ring-1 ring-red-200 p-3">
                  {err}
                  {(err.startsWith('401') || err.startsWith('403')) && (
                    <div className="text-sm mt-1">
                      Переконайтесь, що ви увійшли як адмін у цьому ж браузері (Bearer токен зберігається у storage).
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <KPI title={String(items.length)} sub="усього" />
              <KPI title={String(items.filter((i) => i.status === 'pending').length)} sub="на модерації" />
              <KPI title={String(items.filter((i) => i.status === 'approved').length)} sub="схвалено" />
            </div>
          </div>
        </div>
      </header>

      {/* Липка панель фільтрів + дій */}
      <div ref={stickyRef} className="h-0" />
      <section className={cx(stuck && 'sticky top-0 z-40 shadow-[0_8px_24px_rgба(2,28,78,0.08)]')}>
        <div className={cx(CONTAINER, 'bg-white/90 backdrop-blur rounded-[15px] shadow-md p-4')}>
          <div className="grid grid-cols-12 gap-3 py-4">
            <div className="col-span-12 lg:col-span-5">
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Пошук: імʼя, текст, курс…"
                className="w-full h-10 rounded-[10px] ring-1 ring-[#E5ECFF] px-3 outline-none focus:ring-[#1345DE] bg-white"
              />
            </div>

            <div className="col-span-6 lg:col-span-2">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as any);
                  setPage(1);
                }}
                className="w-full h-10 rounded-[10px] ring-1 ring-[#E5ECFF] px-3 outline-none bg-white focus:ring-[#1345DE]"
              >
                <option value="all">Всі статуси</option>
                <option value="pending">На модерації</option>
                <option value="approved">Схвалено</option>
                <option value="rejected">Відхилено</option>
              </select>
            </div>

            <div className="col-span-6 lg:col-span-2">
              <select
                value={String(courseId)}
                onChange={(e) => {
                  const v = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setCourseId(v as any);
                  setPage(1);
                }}
                className="w-full h-10 rounded-[10px] ring-1 ring-[#E5ECFF] px-3 outline-none bg-white focus:ring-[#1345DE]"
              >
                <option value="all">Усі курси</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-6 lg:col-span-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="w-full h-10 rounded-[10px] ring-1 ring-[#E5ECFF] px-3 outline-none bg-white focus:ring-[#1345DE]"
              >
                <option value="new">Спочатку нові</option>
                <option value="old">Спочатку старі</option>
                <option value="rating_desc">Рейтинг: спадання</option>
                <option value="rating_asc">Рейтинг: зростання</option>
              </select>
            </div>

            <div className="col-span-6 lg:col-span-1 flex items-center gap-2">
              <input
                id="withMedia"
                type="checkbox"
                checked={withMedia}
                onChange={(e) => setWithMedia((e.target as HTMLInputElement).checked)}
                className="accent-[#1345DE]"
              />
              <label htmlFor="withMedia" className="text-sm text-slate-700">
                Медіа
              </label>
            </div>

            {/* ряд 2 */}
            <div className="col-span-6 lg:col-span-2">
              <input
                type="number"
                min={1}
                max={5}
                placeholder="Рейтинг від"
                value={ratingMin}
                onChange={(e) => setRatingMin(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-10 rounded-[10px] ring-1 ring-[#E5ECFF] px-3 outline-none bg-white focus:ring-[#1345DE]"
              />
            </div>
            <div className="col-span-6 lg:col-span-2">
              <input
                type="number"
                min={1}
                max={5}
                placeholder="Рейтинг до"
                value={ratingMax}
                onChange={(e) => setRatingMax(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-10 rounded-[10px] ring-1 ring-[#E5ECFF] px-3 outline-none bg-white focus:ring-[#1345DE]"
              />
            </div>
            <div className="col-span-6 lg:col-span-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-10 rounded-[10px] ring-1 ring-[#E5ECFF] px-3 outline-none bg-white focus:ring-[#1345DE]"
              />
            </div>
            <div className="col-span-6 lg:col-span-2">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-10 rounded-[10px] ring-1 ring-[#E5ECFF] px-3 outline-none bg-white focus:ring-[#1345DE]"
              />
            </div>

            {/* масові дії */}
            <div className="col-span-12 lg:col-span-4 flex gap-2 justify-end">
              <button
                onClick={toggleSelectPage}
                className={cx(
                  'h-10 px-3 rounded-[10px] ring-1 transition',
                  allSelected ? 'bg-green-600 text-white ring-green-600' : 'bg-white text-[#0F2E64] ring-[#E5ECFF]'
                )}
              >
                {allSelected ? 'Зняти виділення сторінки' : 'Виділити сторінку'}
              </button>
              {someSelected || selected.length ? (
                <>
                  <button onClick={() => bulkModerate(selected, 'approved')} className="h-10 px-3 rounded-[10px] bg-green-600 text-white">
                    Схвалити ({selected.length})
                  </button>
                  <button onClick={() => bulkModerate(selected, 'rejected')} className="h-10 px-3 rounded-[10px] bg-yellow-600 text-white">
                    Відхилити ({selected.length})
                  </button>
                  <button onClick={() => setConfirmDelete({ ids: selected })} className="h-10 px-3 rounded-[10px] bg-red-600 text-white">
                    Видалити ({selected.length})
                  </button>
                  <button onClick={clearSelection} className="h-10 px-3 rounded-[10px] bg-white ring-1 ring-[#E5ECFF]">
                    Очистити
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Контент */}
      <section className="py-6">
        <div className={cx(CONTAINER, 'grid grid-cols-1 lg:grid-cols-2 gap-5')}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : pageItems.map((it) => (
                <AdminCard
                  key={it.id}
                  it={it}
                  courseTitle={courseMap.get(it.course)}
                  checked={selected.includes(it.id)}
                  onCheck={() => toggleSelect(it.id)}
                  onApprove={() => moderateOne(it.id, 'approved').catch((e) => alert(e.message))}
                  onReject={() => setReasonOpen({ id: it.id, action: 'rejected' })}
                  onReturn={() => moderateOne(it.id, 'pending').catch((e) => alert(e.message))}
                  onDelete={() => setConfirmDelete({ ids: [it.id] })}
                />
              ))}

          {!loading && pageItems.length === 0 && (
            <div className="col-span-full rounded-[16px] bg-white ring-1 ring-[#E5ECFF] p-10 text-center">
              <div className="text-[#0F2E64] font-extrabold text-xl">Нічого не знайдено</div>
              <div className="text-slate-600 mt-1">Спробуйте змінити фільтри або запит.</div>
            </div>
          )}
        </div>

        {/* Пагінація */}
        <div className="mt-8">
          <div className={cx(CONTAINER, 'flex justify-center gap-2')}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-10 px-3 rounded-[10px] bg-white ring-1 ring-[#E5ECFF] disabled:opacity-50"
            >
              ← Назад
            </button>
            <div className="h-10 px-3 grid place-items-center text-[#0F2E64] font-semibold">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-10 px-3 rounded-[10px] bg-white ring-1 ring-[#E5ECFF] disabled:opacity-50"
            >
              Далі →
            </button>
          </div>
        </div>
      </section>

      {/* Модалка причини відхилення */}
      {reasonOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-[560px] rounded-[16px] bg-white ring-1 ring-[#E5ECFF] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[#0F2E64] font-extrabold text-lg">Причина відхилення</h3>
              <button onClick={() => setReasonOpen(null)} className="text-[#1345DE] font-semibold">
                Закрити
              </button>
            </div>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={5}
              className="mt-3 w-full rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
              placeholder="Коротко опишіть причину…"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setReasonOpen(null)} className="h-10 px-4 rounded-[10px] bg-white ring-1 ring-[#E5ECFF]">
                Скасувати
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!reasonOpen) return;
                    await moderateOne(reasonOpen.id, 'rejected', reasonText || '(reason not provided)');
                    setReasonText('');
                    setReasonOpen(null);
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
                className="h-10 px-5 rounded-[10px] bg-yellow-600 text-white"
              >
                Відхилити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка підтвердження видалення */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-[520px] rounded-[16px] bg-white ring-1 ring-[#E5ECFF] p-6 shadow-xl">
            <h3 className="text-[#0F2E64] font-extrabold text-lg">Видалити відгук{confirmDelete.ids.length > 1 ? 'и' : ''}?</h3>
            <p className="mt-2 text-slate-700">
              Цю дію неможливо скасувати. Буде видалено {confirmDelete.ids.length} запис(ів).
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="h-10 px-4 rounded-[10px] bg-white ring-1 ring-[#E5ECFF]">
                Скасувати
              </button>
              <button
                onClick={async () => {
                  try {
                    await bulkDelete(confirmDelete.ids);
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
                className="h-10 px-5 rounded-[10px] bg-red-600 text-white"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function AdminCard({
  it,
  courseTitle,
  checked,
  onCheck,
  onApprove,
  onReject,
  onReturn,
  onDelete, // залишив у сигнатурі
}: {
  it: ReviewAdmin;
  courseTitle?: string;
  checked: boolean;
  onCheck: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReturn: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const avatar = avatarUrl(it.user_avatar) || '/images/defuser.png'; // 👈 тут

  const longText = (it.text?.length || 0) > 220;

  const tone = it.status === 'approved' ? 'green' : it.status === 'rejected' ? 'red' : 'yellow';
  const topBar =
    tone === 'green'
      ? 'from-green-500/85 to-green-400/45'
      : tone === 'red'
      ? 'from-red-500/85 to-red-400/45'
      : 'from-yellow-500/85 to-yellow-400/45';
  const dot = tone === 'green' ? 'bg-green-500' : tone === 'red' ? 'bg-red-500' : 'bg-yellow-500';

  return (
    <div className="relative z-0">
      <svg aria-hidden className="pointer-events-none absolute -z-10 -inset-10" width="0" height="0" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ filter: 'blur(28px)' }}>
        <defs>
          <radialGradient id="glowA" cx="50%" cy="-10%" r="110%">
            <stop offset="0%" stopColor="rgba(56,189,248,0.35)" />
            <stop offset="70%" stopColor="rgba(56,189,248,0)" />
          </radialGradient>
          <radialGradient id="glowB" cx="100%" cy="120%" r="90%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.25)" />
            <stop offset="70%" stopColor="rgba(99,102,241,0)" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#glowA)" />
        <rect x="0" y="0" width="100%" height="100%" fill="url(#glowB)" />
      </svg>

      <article className="relative overflow-hidden rounded-3xl ring-1 ring-[#E5ECFF] shadow-[0_24px_70px_rgба(2,28,78,0.14)] hover:shadow-[0_30px_96px_rgба(2,28,78,0.18)] transition-all">
        <svg aria-hidden className="absolute inset-0 -z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cardBase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <radialGradient id="tintL" cx="0%" cy="0%" r="75%">
              <stop offset="0%" stopColor="rgba(99,102,241,0.10)" />
              <stop offset="60%" stopColor="rgba(99,102,241,0)" />
            </radialGradient>
            <radialGradient id="tintR" cx="100%" cy="120%" r="80%">
              <stop offset="0%" stopColor="rgba(16,185,129,0.10)" />
              <stop offset="60%" stopColor="rgba(16,185,129,0)" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#cardBase)" />
          <rect width="100%" height="100%" fill="url(#tintL)" />
          <rect width="100%" height="100%" fill="url(#tintR)" />
        </svg>

        <div className={`h-1.5 w-full bg-gradient-to-r ${topBar}`} />

        <header className="flex items-start gap-4 p-5">
          <input type="checkbox" checked={checked} onChange={onCheck} className="mt-1 accent-[#1345DE]" />

          {/* аватар */}
          <div className="relative shrink-0">
            <img
              src={avatar}
              alt={it.user_name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/defuser.png'; }}
            />
            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${dot}`} />
          </div>

          {/* контент */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate max-w-[56%] text-slate-900 font-extrabold">
                {it.user_name || 'Користувач'}
              </div>
              <Badge>{courseTitle || `Курс #${it.course}`}</Badge>
              <StatusBadge s={it.status} />
              <div className="ml-auto flex items-center gap-3 text-sm text-slate-600">
                <div className="inline-flex items-center gap-1">
                  <Stars value={it.rating} />
                  <span className="font-semibold">{Number(it.rating).toFixed(1)}</span>
                </div>
                <span className="hidden md:inline">•</span>
                <span>{new Date(it.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* текст */}
            <ReviewText text={it.text} />

            {/* медіа */}
            {(it.images?.length || it.video_url) && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {mapImages(it.images).map(img => (
                  <a
                    key={img.id}
                    href={img.image}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative rounded-2xl overflow-hidden ring-1 ring-[#E5ECFF]"
                  >
                    <img
                      src={img.image}
                      className="w-full aspect-[4/3] object-cover transition-transform group-hover:scale-[1.03]"
                      alt=""
                      loading="lazy"
                    />
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] ring-1 ring-[#E5ECFF]">
                      Переглянути
                    </span>
                  </a>
                ))}
                {it.video_url && (
                  <div className="col-span-2 rounded-2xl overflow-hidden ring-1 ring-[#E5ECFF]">
                    <div className="relative w-full aspect-[16/9]">
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={ytEmbed(it.video_url)}
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

            {/* розділювач */}
            <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

            {/* кнопки */}
            <CardActions
              status={it.status}
              onApprove={onApprove}
              onReject={onReject}
              onReturn={onReturn}
            />
          </div>
        </header>

        {/* стрічка статусу */}
        <Ribbon status={it.status} />
      </article>
    </div>
  );
}

function ReviewText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const longText = (text?.length || 0) > 220;
  return (
    <div className="relative mt-3">
      <p className={cx('text-slate-800 whitespace-pre-line leading-relaxed', !open && 'line-clamp-4')}>
        {text}
      </p>
      {!open && longText && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent"
        />
      )}
      {longText && (
        <button
          onClick={() => setOpen(o => !o)}
          className="mt-2 inline-flex items-center gap-1 text-[#1345DE] font-semibold
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1345DE]/50 rounded-md"
        >
          {open ? 'Згорнути' : 'Показати повністю'}
          <svg className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

function CardActions({
  status,
  onApprove,
  onReject,
  onReturn,
}: {
  status: 'pending' | 'approved' | 'rejected';
  onApprove: () => void;
  onReject: () => void;
  onReturn: () => void;
}) {
  return (
    <div className="mt-3">
      <div className="flex flex-nowrap items-center gap-2 rounded-2xl bg-white/90 backdrop-blur ring-1 ring-[#E5ECFF] px-2.5 py-2 shadow-[0_12px_28px_rgба(2,28,78,0.08)]">
        {status !== 'approved' && (
          <button
            onClick={onApprove}
            className="h-10 min-w-[132px] px-4 rounded-xl inline-flex items-center justify-center gap-2
                       bg-gradient-to-b from-emerald-500 to-emerald-600 text-white
                       shadow-[inset_0_1px_0_rgба(255,255,255,0.35),0_10px_24px_rgба(16,185,129,0.35)]
                       hover:brightness-105 active:translate-y-[1px]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            title="Схвалити"
          >
            ✓ <span>Схвалити</span>
          </button>
        )}
        {status !== 'rejected' && (
          <button
            onClick={onReject}
            className="h-10 min-w-[132px] px-4 rounded-xl inline-flex items-center justify-center gap-2
                       bg-gradient-to-b from-amber-500 to-amber-600 text-white
                       shadow-[inset_0_1px_0_rgба(255,255,255,0.35),0_10px_24px_rgба(234,179,8,0.35)]
                       hover:brightness-105 active:translate-y-[1px]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            title="Відхилити"
          >
            ✕ <span>Відхилити</span>
          </button>
        )}
        {status !== 'pending' && (
          <button
            onClick={onReturn}
            className="h-10 min-w-[132px] px-4 rounded-xl inline-flex items-center justify-center gap-2
                       bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50
                       shadow-[inset_0_1px_0_rgба(255,255,255,0.6),0_8px_18px_rgба(2,28,78,0.06)]
                       active:translate-y-[1px]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            title="Повернути на модерацію"
          >
            ⟲ <span>Повернути</span>
          </button>
        )}
      </div>
    </div>
  );
}

function Ribbon({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const tone = status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'yellow';
  return (
    <div className="pointer-events-none absolute -right-10 top-5 rotate-45">
      <div
        className={cx(
          'px-10 py-1 text-xs font-bold text-white shadow',
          tone === 'green' ? 'bg-green-600' : tone === 'red' ? 'bg-red-600' : 'bg-yellow-600'
        )}
      >
        {status === 'approved' ? 'Схвалено' : status === 'rejected' ? 'Відхилено' : 'На модерації'}
      </div>
    </div>
  );
}
