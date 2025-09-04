'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

/** ===================== CONFIG ===================== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';

/** ===================== TYPES ===================== */
type Course = {
  id: number;
  title: string;
  slug?: string;
  author?: { username: string } | null;
  status?: 'draft' | 'pending' | 'published';
  created_at?: string;
};

/** ===================== UI SMALL ===================== */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)] ${className}`}>
      {children}
    </div>
  );
}
function StatusPill({ status }: { status?: Course['status'] }) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    pending: 'bg-amber-100 text-amber-800',
    published: 'bg-emerald-100 text-emerald-800',
  };
  const cls = status ? map[status] || map['draft'] : map['draft'];
  const label =
    status === 'published' ? 'Опубліковано' :
    status === 'pending' ? 'На модерації' : 'Чернетка';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
}
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-3"><div className="h-3 w-10 bg-slate-200 rounded" /></td>
      <td className="py-3"><div className="h-3 w-64 bg-slate-200 rounded" /></td>
      <td className="py-3"><div className="h-3 w-24 bg-slate-200 rounded" /></td>
      <td className="py-3"><div className="h-3 w-24 bg-slate-200 rounded" /></td>
      <td className="py-3"><div className="h-8 w-40 bg-slate-200 rounded" /></td>
    </tr>
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

  // filters (КЛИЕНТСКИЕ)
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'draft' | 'pending' | 'published'>('all');

  // client pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const notLoggedIn = !isAuthenticated || !accessToken;
  const notAdmin = !!user && !user.is_superuser;

  useEffect(() => {
    let cancelled = false;
    if (notLoggedIn || notAdmin) { setLoading(false); return; }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };

        // Пытаемся получить «все» за раз (для фронт-фильтрации):
        // сначала админский список с большим page_size, иначе — общий список
        let list: Course[] = [];
        try {
          const url = new URL(`${API_BASE}/admin_panel/api/courses/`);
          url.searchParams.set('page_size', '1000');
          const res = await fetch(url.toString(), { headers, cache: 'no-store' });
          if (res.ok) {
            const raw = await res.json();
            list = Array.isArray(raw) ? raw : (raw.results || []);
          }
        } catch {}

        if (!list.length) {
          const res2 = await fetch(`${API_BASE}/courses/`, { headers, cache: 'no-store' });
          if (res2.ok) {
            const raw2 = await res2.json();
            list = Array.isArray(raw2) ? raw2 : (raw2.results || []);
          }
        }

        if (!cancelled) {
          setCourses(list);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Не вдалося завантажити курси');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [accessToken, notLoggedIn, notAdmin]);

  // ===== КЛИЕНТСКАЯ ФИЛЬТРАЦИЯ =====
  const visibleCourses = useMemo(() => {
    let list = courses;
    if (status !== 'all') list = list.filter(c => c.status === status);
    if (q.trim()) {
      const query = q.trim().toLowerCase();
      list = list.filter(c => (c.title || '').toLowerCase().includes(query));
    }
    return list;
  }, [courses, status, q]);

  // клиентская пагинация по отфильтрованному списку
  const totalPages = Math.max(1, Math.ceil(visibleCourses.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return visibleCourses.slice(start, start + pageSize);
  }, [visibleCourses, page]);

  // сбрасываем страницу при смене фильтров
  useEffect(() => { setPage(1); }, [status, q]);

  async function onDelete(id: number) {
    if (!confirm('Видалити курс? Цю дію не можна скасувати.')) return;
    try {
      const headers: HeadersInit = { Authorization: `Bearer ${accessToken}` };

      // основной DELETE
      let ok = false;
      const res = await fetch(`${API_BASE}/courses/${id}/`, { method: 'DELETE', headers });
      if (res.ok || res.status === 204) ok = true;

      // резервный DELETE (админский)
      if (!ok) {
        const res2 = await fetch(`${API_BASE}/admin_panel/api/courses/${id}/`, { method: 'DELETE', headers });
        if (res2.ok || res2.status === 204) ok = true;
      }

      if (ok) {
        setCourses(prev => prev.filter(c => c.id !== id));
      } else {
        alert('Не вдалося видалити курс');
      }
    } catch {
      alert('Сталася помилка при видаленні');
    }
  }

  /** ------- guards UI ------- */
  if (notLoggedIn) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Card><h1>Потрібен вхід</h1></Card>
      </main>
    );
  }
  if (notAdmin) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Card><h1>Тільки для адмінів</h1></Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <section className="w-[1280px] max-w-[95vw] mx-auto pt-[120px] pb-16">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#0F2E64]">Курси</h1>
              <p className="text-slate-600 text-sm">Повний список курсів на платформі</p>
            </div>
            <div className="flex gap-2 items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Пошук за назвою"
                className="h-10 px-3 rounded-lg ring-1 ring-[#E5ECFF] focus:outline-none"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as unknown)}
                className="h-10 px-3 rounded-lg ring-1 ring-[#E5ECFF]"
              >
                <option value="all">Усі статуси</option>
                <option value="draft">Чернетка</option>
                <option value="pending">На модерації</option>
                <option value="published">Опубліковано</option>
              </select>
              <Link href="/admin" className="text-[#1345DE] hover:underline text-sm">← Повернутись назад</Link>
            </div>
          </div>

          <div className="overflow-x-auto mt-5">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-3 w-[60px]">ID</th>
                  <th className="py-3">Назва</th>
                  <th className="py-3 w-[160px]">Автор</th>
                  <th className="py-3 w-[140px]">Статус</th>
                  <th className="py-3 w-[240px] text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : paged.length ? (
                  paged.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="py-3">{c.id}</td>
                      <td className="py-3">
                        <div className="font-semibold text-[#0F2E64] truncate max-w-[520px]">{c.title}</div>
                        <div className="text-xs text-slate-500 truncate">{c.slug}</div>
                      </td>
                      <td className="py-3">{c.author?.username || '—'}</td>
                      <td className="py-3"><StatusPill status={c.status} /></td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                          <Link href={`/courses/${c.id}/details`} className="px-3 py-1.5 rounded-lg ring-1 ring-[#E5ECFF]">
                            Відкрити
                          </Link>
                          <Link href={`/courses/${c.id}/edit`} className="px-3 py-1.5 rounded-lg ring-1 ring-[#E5ECFF]">
                            Редагувати
                          </Link>
                          <button onClick={() => onDelete(c.id)} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white">
                            Видалити
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">Нічого не знайдено</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination (клиентская) */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
            <div className="text-xs text-slate-500">Всього: {visibleCourses.length}</div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded-lg ring-1 ring-[#E5ECFF] disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </button>
              <div className="px-2 py-1 text-sm text-slate-600 whitespace-nowrap">
                {page} / {totalPages}
              </div>
              <button
                className="px-3 py-1.5 rounded-lg ring-1 ring-[#E5ECFF] disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Далі
              </button>
            </div>
          </div>

          {error ? <div className="mt-4 text-red-600 text-sm">{error}</div> : null}
        </Card>
      </section>
    </main>
  );
}
