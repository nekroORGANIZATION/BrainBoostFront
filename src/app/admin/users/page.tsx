'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';

/** ===================== Types ===================== */
type User = {
  id: number;
  username: string;
  email?: string;
  is_teacher?: boolean;
  is_superuser?: boolean;
  is_email_verified?: boolean;
  date_joined?: string;
};

type AuthShape = {
  isAuthenticated: boolean;
  accessToken: string | null;
  user?: { username?: string; is_superuser?: boolean } | null;
};

type BadgeTone = 'slate' | 'emerald' | 'rose' | 'amber';

/** ===================== UI small ===================== */
function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)] ${className}`}>
      {children}
    </div>
  );
}

function Badge({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  const map: Record<BadgeTone, string> = {
    slate: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[tone]}`}>
      {children}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-3"><div className="h-3 w-16 bg-slate-200 rounded" /></td>
      <td className="py-3"><div className="h-3 w-40 bg-slate-200 rounded" /></td>
      <td className="py-3"><div className="h-3 w-48 bg-slate-200 rounded" /></td>
      <td className="py-3"><div className="h-6 w-20 bg-slate-200 rounded-full" /></td>
      <td className="py-3"><div className="h-6 w-20 bg-slate-200 rounded-full" /></td>
      <td className="py-3"><div className="h-3 w-24 bg-slate-200 rounded" /></td>
    </tr>
  );
}

/** ===================== Page ===================== */
export default function AdminUsersPage() {
  const { isAuthenticated, user, accessToken } = useAuth() as AuthShape;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [count, setCount] = useState<number | null>(null);

  // filters
  const [q, setQ] = useState('');
  const [onlyTeachers, setOnlyTeachers] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const notLoggedIn = !isAuthenticated || !accessToken;
  const notAdmin = !!user && !user.is_superuser;

  useEffect(() => {
    let cancelled = false;
    if (notLoggedIn || notAdmin) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        };

        // 1) Адмінський ендпоінт з пагінацією
        const url = new URL(`${API_BASE}/admin_panel/api/users/all/`);
        url.searchParams.set('page', String(page));
        url.searchParams.set('page_size', String(pageSize));
        const res = await fetch(url.toString(), { headers, cache: 'no-store' });

        if (res.ok) {
          // очікуємо або { results, count } або масив
          const raw: unknown = await res.json();
          const list = Array.isArray(raw) ? (raw as User[]) : ((raw as { results?: User[] }).results ?? []);
          if (!cancelled) {
            setUsers(list);
            const maybeCount = (raw as { count?: number }).count;
            setCount(typeof maybeCount === 'number' ? maybeCount : list.length);
          }
        } else {
          // 2) Фолбек: публічний список
          const res2 = await fetch(`${API_BASE}/api/users/`, { headers, cache: 'no-store' });
          if (res2.ok) {
            const raw2: unknown = await res2.json();
            const list = Array.isArray(raw2) ? (raw2 as User[]) : ((raw2 as { results?: User[] }).results ?? []);
            if (!cancelled) {
              setUsers(list);
              setCount(list.length);
            }
          } else {
            throw new Error(`HTTP ${res.status}`);
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Не вдалося завантажити користувачів';
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, notLoggedIn, notAdmin, page]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = users;
    if (ql) {
      list = list.filter(
        (u) =>
          (u.username || '').toLowerCase().includes(ql) ||
          (u.email || '').toLowerCase().includes(ql),
      );
    }
    if (onlyTeachers) list = list.filter((u) => !!u.is_teacher);
    return list;
  }, [users, q, onlyTeachers]);

  const totalPages = useMemo(() => {
    const c = count ?? filtered.length;
    return Math.max(1, Math.ceil(c / pageSize));
  }, [count, filtered.length]);

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
              <h1 className="text-xl font-bold text-[#0F2E64]">Користувачі</h1>
              <p className="text-slate-600 text-sm">Перелік зареєстрованих користувачів платформи</p>
            </div>
            <div className="flex gap-2 items-center">
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Пошук за ім'ям або email"
                className="h-10 px-3 rounded-lg ring-1 ring-[#E5ECFF] focus:outline-none"
              />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyTeachers}
                  onChange={(e) => { setOnlyTeachers(e.target.checked); setPage(1); }}
                />
                Лише викладачі
              </label>
            </div>
          </div>

          <div className="overflow-x-auto mt-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-3">ID</th>
                  <th className="py-3">Користувач</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Роль</th>
                  <th className="py-3">Статус</th>
                  <th className="py-3">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : filtered.length ? (
                  filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="py-3">{u.id}</td>
                      <td className="py-3">
                        <div className="font-semibold text-[#0F2E64]">{u.username}</div>
                      </td>
                      <td className="py-3">{u.email || '—'}</td>
                      <td className="py-3">
                        {u.is_superuser ? (
                          <Badge tone="rose">Адмін</Badge>
                        ) : u.is_teacher ? (
                          <Badge tone="emerald">Викладач</Badge>
                        ) : (
                          <Badge>Користувач</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        {u.is_email_verified ? (
                          <Badge tone="emerald">Пошта підтверджена</Badge>
                        ) : (
                          <Badge tone="amber">Очікує підтвердження</Badge>
                        )}
                      </td>
                      <td className="py-3 text-slate-500">
                        {u.date_joined ? new Date(u.date_joined).toLocaleDateString('uk-UA') : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">Нічого не знайдено</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-5">
            <div className="text-xs text-slate-500">
              Всього: {count ?? filtered.length}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg ring-1 ring-[#E5ECFF] disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </button>
              <div className="px-2 py-1 text-sm text-slate-600">
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

          <div className="mt-6">
            <Link href="/admin" className="text-[#1345DE] hover:underline text-sm">← Повернутись назад</Link>
          </div>

          {error ? <div className="mt-4 text-red-600 text-sm">{error}</div> : null}
        </Card>
      </section>
    </main>
  );
}
