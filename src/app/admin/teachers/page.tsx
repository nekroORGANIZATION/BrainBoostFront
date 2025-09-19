'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

/** ===================== CONFIG ===================== */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? 'https://brainboost.pp.ua/api')
  .replace(/\/+$/, ''); // прибираємо кінцеві слеші

/** ===================== TYPES ===================== */
type TeacherApplication = {
  id: number;
  user: { id: number; username: string; email?: string | null };
  status: 'pending' | 'approved' | 'rejected';
  selfie_photo?: string | null;
  id_photo?: string | null;
  diploma_photo?: string | null;
  note?: string | null;
  created_at: string;
};

type StatusFilter = 'pending' | 'approved' | 'rejected';

/** ===================== UI PRIMITIVES ===================== */
type CardProps = { children: React.ReactNode; className?: string };
function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={[
        'rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5',
        'shadow-[0_8px_24px_rgba(2,28,78,0.06)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

type BadgeTone = 'amber' | 'emerald' | 'rose' | 'slate';
type BadgeProps = { children: React.ReactNode; tone?: BadgeTone };
function Badge({ children, tone = 'amber' }: BadgeProps) {
  const map: Record<BadgeTone, string> = {
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[tone]}`}>
      {children}
    </span>
  );
}

/** ===================== HELPERS ===================== */
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
  }
  return res.json();
}

function joinUrl(...parts: string[]) {
  return parts
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, '') : p.replace(/^\/+/, '')))
    .join('/');
}

/** ===================== PAGE ===================== */
export default function AdminTeacherApplicationsPage() {
  const { isAuthenticated, user, accessToken } = useAuth() as {
    isAuthenticated: boolean;
    user: { id: number; username: string; is_superuser?: boolean } | null;
    accessToken?: string | null;
  };

  const [apps, setApps] = useState<TeacherApplication[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notLoggedIn = !isAuthenticated || !accessToken;
  const notAdmin = !!user && !user.is_superuser;

  /** ---- data load ---- */
  useEffect(() => {
    if (notLoggedIn || notAdmin) {
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    const url = joinUrl(
      API_BASE,
      'admin_panel/api/teacher-applications/',
    ) + `?status=${encodeURIComponent(filter)}`;

    fetchJSON<TeacherApplication[]>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: ctrl.signal,
    })
      .then((list) => setApps(Array.isArray(list) ? list : []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Помилка завантаження'))
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [accessToken, filter, notAdmin, notLoggedIn]);

  /** ---- actions ---- */
  async function approve(id: number) {
    if (!accessToken) return;
    const prev = apps;
    setApps((s) => s.filter((a) => a.id !== id)); // оптимістично

    try {
      const url = joinUrl(API_BASE, `admin_panel/api/teacher-applications/${id}/approve/`);
      await fetchJSON(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      // відкат якщо помилка
      setApps(prev);
      setError(e instanceof Error ? e.message : 'Не вдалося підтвердити заявку');
    }
  }

  async function reject(id: number) {
    if (!accessToken) return;
    const prev = apps;
    setApps((s) => s.filter((a) => a.id !== id)); // оптимістично

    try {
      const url = joinUrl(API_BASE, `admin_panel/api/teacher-applications/${id}/reject/`);
      await fetchJSON(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Not enough documents' }),
      });
    } catch (e) {
      setApps(prev);
      setError(e instanceof Error ? e.message : 'Не вдалося відхилити заявку');
    }
  }

  /** ---- derived ui ---- */
  const headerSubtitle = useMemo(() => {
    const m: Record<StatusFilter, string> = {
      pending: 'Перевіряйте документи та підтверджуйте профілі викладачів',
      approved: 'Список підтверджених викладачів',
      rejected: 'Відхилені заявки (перевірте причини)',
    };
    return m[filter];
  }, [filter]);

  /** ---- guards ---- */
  if (notLoggedIn) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Card>
          <h1 className="text-lg font-bold text-[#0F2E64]">Потрібен вхід</h1>
          <p className="text-sm text-slate-600 mt-1">
            Увійдіть у свій акаунт, щоб переглядати заявки викладачів.
          </p>
        </Card>
      </main>
    );
  }
  if (notAdmin) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Card>
          <h1 className="text-lg font-bold text-[#0F2E64]">Тільки для адмінів</h1>
          <p className="text-sm text-slate-600 mt-1">
            У вас немає прав для перегляду цієї сторінки.
          </p>
          <div className="mt-3">
            <Link href="/" className="text-[#1345DE] hover:underline text-sm">
              ← На головну
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  /** ---- page ---- */
  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <section className="w-[1280px] max-w-[95vw] mx-auto pt-[120px] pb-16">
        <Card>
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#0F2E64]">Заявки викладачів</h1>
              <p className="text-slate-600 text-sm">{headerSubtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as StatusFilter)}
                className="h-10 px-3 rounded-lg ring-1 ring-[#E5ECFF] bg-white text-sm"
              >
                <option value="pending">В очікуванні</option>
                <option value="approved">Підтверджені</option>
                <option value="rejected">Відхилені</option>
              </select>
              <Link href="/admin" className="text-[#1345DE] hover:underline text-sm">
                ← Повернутись назад
              </Link>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />
                ))
              : apps.length > 0
              ? apps.map((a) => (
                  <div key={a.id} className="rounded-xl ring-1 ring-[#E5ECFF] p-4 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[#0F2E64]">{a.user.username}</div>
                        <div className="text-xs text-slate-500">{a.user.email || '—'}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Створено: {new Date(a.created_at).toLocaleString()}
                        </div>
                      </div>
                      {a.status === 'pending' ? (
                        <Badge>Очікує</Badge>
                      ) : a.status === 'approved' ? (
                        <Badge tone="emerald">Підтверджено</Badge>
                      ) : (
                        <Badge tone="rose">Відхилено</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {a.selfie_photo ? (
                        <Image
                          src={a.selfie_photo}
                          alt="selfie"
                          width={300}
                          height={200}
                          className="rounded-lg object-cover w-full h-24"
                        />
                      ) : (
                        <div className="h-24 rounded bg-slate-100" />
                      )}
                      {a.id_photo ? (
                        <Image
                          src={a.id_photo}
                          alt="id"
                          width={300}
                          height={200}
                          className="rounded-lg object-cover w-full h-24"
                        />
                      ) : (
                        <div className="h-24 rounded bg-slate-100" />
                      )}
                      {a.diploma_photo ? (
                        <Image
                          src={a.diploma_photo}
                          alt="diploma"
                          width={300}
                          height={200}
                          className="rounded-lg object-cover w-full h-24"
                        />
                      ) : (
                        <div className="h-24 rounded bg-slate-100" />
                      )}
                    </div>

                    {a.note ? (
                      <p className="text-xs text-slate-600 mt-3 line-clamp-3">
                        <span className="font-medium text-slate-700">Нотатка: </span>
                        {a.note}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => approve(a.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 active:scale-[.99]"
                      >
                        Підтвердити
                      </button>
                      <button
                        onClick={() => reject(a.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700 active:scale-[.99]"
                      >
                        Відхилити
                      </button>
                    </div>
                  </div>
                ))
              : !error && (
                  <div className="text-sm text-slate-500">Немає заявок для цього фільтра</div>
                )}
          </div>

          {/* Error */}
          {error ? <div className="mt-4 text-red-600 text-sm">{error}</div> : null}
        </Card>
      </section>
    </main>
  );
}
