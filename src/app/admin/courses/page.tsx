'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import {
  Search, ArrowLeft, ArrowRight, Trash2, Edit3, ExternalLink,
  ShieldAlert, LockKeyhole, ChevronUp, ChevronDown
} from 'lucide-react';

/** ===================== CONFIG ===================== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api/';

/** ===================== TYPES ===================== */
type Course = {
  id: number;
  title: string;
  slug?: string | null;
  image?: string | null;
  author?: { username?: string | null } | null;
  status?: 'draft' | 'published' | 'archived' | string | null;
  created_at?: string | null;
};

/** ===================== UI PRIMITIVES ===================== */
function Frame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={['p-[1px] rounded-3xl bg-gradient-to-br from-blue-500/20 via-fuchsia-500/10 to-emerald-500/20', className].join(' ')}>
      <div className="rounded-[22px] bg-white/90 backdrop-blur-md ring-1 ring-white/70 shadow-[0_16px_64px_rgba(2,28,78,0.14)]">
        {children}
      </div>
    </div>
  );
}

function Button({
  children, className = '', onClick, disabled, variant = 'plain', href, size = 'md', type,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'plain' | 'primary' | 'danger' | 'soft' | 'ghost';
  href?: string;
  size?: 'sm' | 'md';
  type?: 'button' | 'submit' | 'reset';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 active:scale-[0.98]';
  const sizes: Record<string, string> = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  const variants: Record<string, string> = {
    plain: 'bg-white ring-1 ring-slate-200 hover:bg-slate-50 active:bg-slate-100',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm hover:shadow',
    soft: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300',
    ghost: 'bg-transparent hover:bg-white/60 ring-1 ring-transparent hover:ring-slate-200',
  };
  const cls = [base, sizes[size], variants[variant], className].join(' ');
  if (href) return <Link href={href} className={cls} aria-disabled={disabled} onClick={(e) => disabled && e.preventDefault()}>{children}</Link>;
  return <button className={cls} onClick={onClick} disabled={disabled} type={type || 'button'}>{children}</button>;
}

function Input({
  value, onChange, placeholder, className = '', leftIcon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  leftIcon?: React.ReactNode;
}) {
  return (
    <label className={['group relative inline-flex w-full items-center rounded-xl ring-1 ring-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-300 transition-all duration-150', className].join(' ')}>
      {leftIcon ? <span className="pl-3 pr-1 text-slate-500">{leftIcon}</span> : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
      />
    </label>
  );
}

function Segmented<T extends string>({
  value, onChange, options, className = '',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div className={['inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200 shadow-inner', className].join(' ')}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={['px-3 py-1.5 text-sm rounded-lg transition-all', value === o.value ? 'bg-white shadow ring-1 ring-slate-200 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status?: Course['status'] }) {
  const s = (status || 'draft') as 'draft' | 'published' | 'archived';
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-emerald-100 text-emerald-900',
    archived: 'bg-zinc-200 text-zinc-800',
  };
  const label = s === 'published' ? 'Опубліковано' : s === 'archived' ? 'Архів' : 'Чернетка';
  return (
    <span className={['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', map[s]].join(' ')}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function Cover({ src, alt, newBadge }: { src?: string | null; alt: string; newBadge?: boolean }) {
  const url = src || '/images/placeholder-course.jpg';
  return (
    <span className="relative inline-flex items-center justify-center rounded-xl p-[1px] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/placeholder-course.jpg'; }}
        alt={alt}
        className="h-14 w-14 object-cover rounded-[10px] ring-1 ring-slate-200 shadow-[0_6px_18px_rgba(2,28,78,0.10)]"
      />
      {newBadge ? (
        <span className="absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white shadow">NEW</span>
      ) : null}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-4"><div className="h-9 w-9 bg-slate-200 rounded-xl" /></td>
      <td className="px-4 py-4"><div className="h-3 w-64 bg-slate-200 rounded" /></td>
      <td className="px-4 py-4"><div className="h-3 w-24 bg-slate-200 rounded" /></td>
      <td className="px-4 py-4"><div className="h-3 w-24 bg-slate-200 rounded" /></td>
      <td className="px-4 py-4"><div className="h-8 w-40 bg-slate-200 rounded" /></td>
    </tr>
  );
}

/** Mobile card (instead of table) */
function MobileCourseCard({
  c, checked, onToggle, onDelete,
}: {
  c: Course; checked: boolean; onToggle: (id: number) => void; onDelete: (id: number) => void;
}) {
  const isNew = c.created_at ? (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 7 : false;
  return (
    <div className="rounded-2xl ring-1 ring-slate-200 bg-white/90 p-4 flex gap-3">
      <input type="checkbox" className="mt-1 h-4 w-4" checked={checked} onChange={() => onToggle(c.id)} />
      <Cover src={c.image} alt={c.title || 'course'} newBadge={isNew} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-slate-900 truncate">{c.title}</div>
          <StatusPill status={c.status as any} />
        </div>
        <div className="text-xs text-slate-500 truncate">{c.author?.username || '—'}</div>
        <div className="text-xs text-slate-400 truncate">{c.slug || '—'}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button href={`/courses/${c.id}/details`} variant="plain" size="sm"><ExternalLink className="h-4 w-4" />Відкрити</Button>
          <Button href={`/admin/courses/${c.id}/edit`} variant="soft" size="sm"><Edit3 className="h-4 w-4" />Редагувати</Button>
          <Button variant="danger" size="sm" onClick={() => onDelete(c.id)}><Trash2 className="h-4 w-4" />Видалити</Button>
        </div>
      </div>
    </div>
  );
}

/** ===================== PAGE ===================== */
export default function AdminCoursesPage() {
  const { isAuthenticated, user, accessToken } = useAuth() as {
    isAuthenticated: boolean;
    accessToken: string | null;
    user?: { username?: string; is_superuser?: boolean } | null;
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  // filters
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all');

  // sorting
  type SortKey = 'id' | 'title' | 'author' | 'status' | 'created_at';
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // selection (batch)
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const notLoggedIn = !isAuthenticated || !accessToken;
  const notAdmin = !!user && !user.is_superuser;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (notLoggedIn || notAdmin) { setLoading(false); return; }
      setLoading(true);
      setError(null);

      try {
        let list: Course[] = [];

        const pubUrl = new URL(`${API_BASE}/courses/`);
        pubUrl.searchParams.set('page_size', '1000');
        const r1 = await fetch(pubUrl.toString(), { headers: { Accept: 'application/json' }, cache: 'no-store' });

        if (r1.ok) {
          const raw = await r1.json();
          list = Array.isArray(raw) ? raw : (raw.results || raw.data || []);
        } else if (accessToken) {
          const r2 = await fetch(pubUrl.toString(), {
            headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
          });
          if (r2.ok) {
            const raw2 = await r2.json();
            list = Array.isArray(raw2) ? raw2 : (raw2.results || raw2.data || []);
          }
        }

        if (!cancelled) {
          setCourses(list || []);
          if (!list?.length) setError('Курси не знайдено.');
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Не вдалося завантажити курси');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [accessToken, notLoggedIn, notAdmin]);

  // helpers
  const isNew = (d?: string | null) => d ? ((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24) <= 7) : false;

  // filter
  const filtered = useMemo(() => {
    let list = courses;
    if (status !== 'all') list = list.filter((c) => ((c.status as any) || 'draft') === status);
    if (q.trim()) {
      const query = q.trim().toLowerCase();
      list = list.filter((c) => (c.title || '').toLowerCase().includes(query));
    }
    return list;
  }, [courses, status, q]);

  // sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const aAuthor = (a.author?.username || '').toLowerCase();
      const bAuthor = (b.author?.username || '').toLowerCase();
      const statusOrder = (s?: string | null) => (s === 'published' ? 2 : s === 'draft' ? 1 : 0);
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (sortKey === 'id') return (a.id - b.id) * dir;
      if (sortKey === 'title') return a.title.localeCompare(b.title) * dir;
      if (sortKey === 'author') return aAuthor.localeCompare(bAuthor) * dir;
      if (sortKey === 'status') return (statusOrder(a.status || '') - statusOrder(b.status || '')) * dir;
      if (sortKey === 'created_at') return (aDate - bDate) * dir;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  useEffect(() => { setPage(1); }, [status, q, sortKey, sortDir]);

  function toggleAllOnPage() {
    const ids = paged.map((c) => c.id);
    const next = new Set(selected);
    const allSelected = ids.every((id) => next.has(id));
    if (allSelected) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    setSelected(next);
  }
  function toggleOne(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }
  const allCheckedOnPage = paged.length > 0 && paged.every((c) => selected.has(c.id));
  const anySelected = selected.size > 0;

  function onSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('asc'); }
  }

  async function onDelete(id: number) {
    if (!accessToken) { alert('Немає токена доступу.'); return; }
    if (!confirm('Видалити курс? Цю дію не можна скасувати.')) return;
    try {
      const res = await fetch(`${API_BASE}/courses/${id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok || res.status === 204) {
        setCourses((prev) => prev.filter((c) => c.id !== id));
        setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      } else {
        const text = await res.text().catch(() => '');
        alert(`Не вдалося видалити. ${res.status} ${text}`);
      }
    } catch (e: any) {
      alert(`Помилка: ${e?.message || e}`);
    }
  }

  async function onDeleteSelected() {
    if (!accessToken) { alert('Немає токена доступу.'); return; }
    if (!selected.size) return;
    if (!confirm(`Видалити обрані (${selected.size}) курси?`)) return;
    try {
      const ids = Array.from(selected);
      await Promise.all(ids.map(id =>
        fetch(`${API_BASE}/courses/${id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } })
      ));
      setCourses((prev) => prev.filter((c) => !selected.has(c.id)));
      setSelected(new Set());
      // підчистити сторінку якщо спорожніла
      setPage((p) => Math.min(p, Math.max(1, Math.ceil((sorted.length - ids.length) / pageSize))));
    } catch (e: any) {
      alert('Не всі курси вдалося видалити.');
    }
  }

  /** ------- GUARDS UI ------- */
  if (notLoggedIn) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-center bg-no-repeat">
        <div className="mx-auto grid min-h-screen max-w-2xl place-items-center p-6">
          <Frame>
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-slate-100">
                <LockKeyhole className="h-6 w-6 text-slate-600" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Потрібен вхід</h1>
              <p className="mt-1 text-sm text-slate-600">Увійдіть у систему, щоб переглянути адмін-панель.</p>
              <div className="mt-6"><Button href="/login" variant="primary">Увійти</Button></div>
            </div>
          </Frame>
        </div>
      </main>
    );
  }

  if (notAdmin) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-center bg-no-repeat">
        <div className="mx-auto grid min-h-screen max-w-2xl place-items-center p-6">
          <Frame>
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-amber-100">
                <ShieldAlert className="h-6 w-6 text-amber-900" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Доступ обмежено</h1>
              <p className="mt-1 text-sm text-slate-600">Цей розділ доступний лише адміністраторам.</p>
              <div className="mt-6"><Button href="/" variant="plain">На головну</Button></div>
            </div>
          </Frame>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-center bg-no-repeat">
      {/* HEADER — чиста картинка */}
      <header className="sticky top-0 z-20 bg-transparent">
        <div className="mx-auto flex w-[1280px] max-w-[95vw] items-center justify-between gap-4 px-3 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white font-semibold">BB</div>
            <div>
              <div className="text-sm font-semibold text-[#0F2E64]">Адмін-панель</div>
              <div className="text-xs text-slate-600">Курси</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Button href="/admin" variant="ghost"><ArrowLeft className="h-4 w-4" />Назад</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-[1280px] max-w-[95vw] px-3 pt-6 pb-24">
        <Frame>
          <div className="p-6 sm:p-8">
            {/* Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#0F2E64]">Курси</h1>
                <p className="mt-1 text-sm text-slate-600">Повний список курсів на платформі</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <Input value={q} onChange={setQ} placeholder="Пошук за назвою" className="w-full sm:w-72" leftIcon={<Search className="h-4 w-4" />} />
                <Segmented
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: 'all', label: 'Усі' },
                    { value: 'draft', label: 'Чернетки' },
                    { value: 'published', label: 'Опубліковано' },
                    { value: 'archived', label: 'Архів' },
                  ]}
                />
                <div className="hidden sm:block">
                  <Button href="/admin" variant="ghost"><ArrowLeft className="h-4 w-4" />Назад</Button>
                </div>
              </div>
            </div>

            {/* Desktop TABLE */}
            <div className="mt-6 overflow-hidden rounded-xl ring-1 ring-slate-200 hidden sm:block">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white/85 backdrop-blur">
                    <tr className="text-left text-slate-600">
                      <th className="px-4 py-3 w-[48px]">
                        <input type="checkbox" checked={allCheckedOnPage} onChange={toggleAllOnPage} />
                      </th>
                      <th className="px-4 py-3 w-[72px]">
                        <button className="inline-flex items-center gap-1 hover:underline" onClick={() => onSort('id')}>
                          #
                          {sortKey === 'id' ? (sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : null}
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button className="inline-flex items-center gap-1 hover:underline" onClick={() => onSort('title')}>
                          Курс
                          {sortKey === 'title' ? (sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : null}
                        </button>
                      </th>
                      <th className="px-4 py-3 w-[200px]">
                        <button className="inline-flex items-center gap-1 hover:underline" onClick={() => onSort('author')}>
                          Автор
                          {sortKey === 'author' ? (sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : null}
                        </button>
                      </th>
                      <th className="px-4 py-3 w-[160px]">
                        <button className="inline-flex items-center gap-1 hover:underline" onClick={() => onSort('status')}>
                          Статус
                          {sortKey === 'status' ? (sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : null}
                        </button>
                      </th>
                      <th className="px-4 py-3 w-[180px]">
                        <button className="inline-flex items-center gap-1 hover:underline" onClick={() => onSort('created_at')}>
                          Додано
                          {sortKey === 'created_at' ? (sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : null}
                        </button>
                      </th>
                      <th className="px-4 py-3 w-[260px] text-right">Дії</th>
                    </tr>
                    <tr><td colSpan={7}><div className="h-px w-full bg-slate-200" /></td></tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {loading ? (
                      <>
                        <SkeletonRow /><SkeletonRow /><SkeletonRow />
                      </>
                    ) : paged.length ? (
                      paged.map((c, i) => {
                        const newFlag = isNew(c.created_at);
                        return (
                          <motion.tr
                            key={c.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: i * 0.02 }}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-4 py-4 align-top">
                              <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} />
                            </td>
                            <td className="px-4 py-4 align-top text-slate-700">{c.id}</td>
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-start gap-3">
                                <Cover src={c.image} alt={c.title || 'course'} newBadge={newFlag} />
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 truncate">{c.title}</div>
                                  <div className="text-xs text-slate-500 truncate">{c.slug || '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-slate-700">{c.author?.username || '—'}</td>
                            <td className="px-4 py-4 align-top"><StatusPill status={c.status as any} /></td>
                            <td className="px-4 py-4 align-top text-slate-700">
                              {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                <Button href={`/courses/${c.id}/details`} variant="plain"><ExternalLink className="h-4 w-4" />Відкрити</Button>
                                <Button href={`/admin/courses/${c.id}/edit`} variant="soft"><Edit3 className="h-4 w-4" />Редагувати</Button>
                                <Button variant="danger" onClick={() => onDelete(c.id)}><Trash2 className="h-4 w-4" />Видалити</Button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center">
                          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-slate-100" />
                          <div className="text-sm text-slate-600">Нічого не знайдено</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden mt-6 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-24 rounded-2xl bg-white/80 ring-1 ring-slate-200 animate-pulse" />
                  <div className="h-24 rounded-2xl bg-white/80 ring-1 ring-slate-200 animate-pulse" />
                </div>
              ) : (
                paged.map((c) => (
                  <MobileCourseCard key={c.id} c={c} checked={selected.has(c.id)} onToggle={toggleOne} onDelete={onDelete} />
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600">Всього: {filtered.length}</div>
              <div className="flex items-center gap-2">
                <Button variant="plain" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ArrowLeft className="h-4 w-4" /> Назад
                </Button>
                <div className="px-2 py-1 text-sm text-slate-700 whitespace-nowrap">
                  {page} / {totalPages}
                </div>
                <Button variant="plain" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Далі <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {error ? <div className="mt-4 text-rose-600 text-sm">{error}</div> : null}
          </div>
        </Frame>
      </section>

      {/* Batch actions bar */}
      {anySelected ? (
        <div className="fixed bottom-4 left-0 right-0 z-30">
          <div className="mx-auto w-[1280px] max-w-[95vw]">
            <div className="rounded-2xl bg-white/90 backdrop-blur ring-1 ring-slate-200 shadow-2xl p-3 flex items-center justify-between">
              <div className="text-sm text-slate-700">
                Обрано: <span className="font-semibold">{selected.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="soft" onClick={() => setSelected(new Set())}>Скасувати</Button>
                <Button variant="danger" onClick={onDeleteSelected}><Trash2 className="h-4 w-4" /> Видалити обрані</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* FOOTER — чиста картинка */}
      <footer className="py-10">
        <div className="mx-auto w-[1280px] max-w-[95vw] px-3 text-xs text-slate-600">© BrainBoost Admin</div>
      </footer>
    </main>
  );
}
