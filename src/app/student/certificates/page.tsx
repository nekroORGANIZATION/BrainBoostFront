'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/* ===== API ===== */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, '') ||
  'https://brainboost.pp.ua/api'; // <- ВАЖНО: тут есть /api

const ENDPOINT_LIST   = `${API_BASE}/accounts/certificates/my-completed-courses/`;
const ENDPOINT_ISSUE  = (courseId: number) => `${API_BASE}/accounts/certificates/issue/${courseId}/`;

/* ===== Types ===== */
type CompletedCourseItem = {
  id: number;
  title: string;
  certificate_exists: boolean;
  certificate_serial?: string | null;
};
type ApiCompletedCoursesResponse =
  | { results: CompletedCourseItem[] }
  | CompletedCourseItem[];

/* ===== Token helpers ===== */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
  );
  return m ? decodeURIComponent(m[1]) : null;
}
function getAccessToken(): string | null {
  // пробуем несколько возможных имён
  return (
    readCookie('access_token') ||
    readCookie('access') ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('access') : null)
  );
}

/* ===== Page ===== */
export default function CertificatesPage() {
  const token = useMemo(getAccessToken, []);
  const [items, setItems]   = useState<CompletedCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState<number | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [info, setInfo]     = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(ENDPOINT_LIST, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Потрібна авторизація.');
        throw new Error('Не вдалося завантажити завершені курси.');
      }
      const data: ApiCompletedCoursesResponse = await res.json();
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      setError(e?.message || 'Помилка завантаження.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function issue(courseId: number) {
    const t = getAccessToken();
    if (!t) {
      setError('Потрібна авторизація.');
      return;
    }
    setPosting(courseId);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(ENDPOINT_ISSUE(courseId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`, // обязательно Bearer
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || 'Не вдалося згенерувати сертифікат.');
      }
      setInfo('Сертифікат надіслано на вашу пошту.');
      await load();
    } catch (e) {
      setError(e?.message || 'Помилка.');
    } finally {
      setPosting(null);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6F7FF_0%,#F3F5FF_40%,#EFF3FF_100%)]">
      <div className="max-w-6xl mx-auto px-5 py-8 md:py-12 space-y-8">
        {/* Header */}
        <section className="rounded-3xl p-6 md:p-10 text-white shadow-[0_18px_40px_rgba(54,76,232,0.25)]"
                 style={{background: 'linear-gradient(90deg,#364CE8 0%,#7B68EE 100%)'}}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Мої сертифікати</h1>
              <p className="mt-2 text-white/90">
                Тут відображаються курси, які ви завершили. Згенеруйте сертифікат або надішліть його повторно.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/student" className="inline-block">
                <span className="rounded-2xl px-4 py-2 bg-white text-slate-900 shadow hover:shadow-md transition">
                  Кабінет студента
                </span>
              </Link>
              <Link href="/courses" className="inline-block">
                <span className="rounded-2xl px-4 py-2 bg-white/15 text-white backdrop-blur shadow hover:shadow-md transition">
                  Знайти нові курси
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Counters */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Завершених курсів" value={loading ? '…' : items.length} />
          <StatCard title="Сертифікати створено" value={loading ? '…' : items.filter(i => i.certificate_exists).length} />
          <StatCard title="Очікує генерації" value={loading ? '…' : items.filter(i => !i.certificate_exists).length} />
          <StatCard title="Повторних відправок" value="∞" />
        </section>

        {/* Content */}
        <section className="space-y-4">
          {error && (
            <div className="rounded-2xl bg-red-50 text-red-700 px-4 py-3 border border-red-200">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-2xl bg-emerald-50 text-emerald-700 px-4 py-3 border border-emerald-200">
              {info}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow">
              Поки немає завершених курсів.
              <div className="mt-3">
                <Link href="/courses" className="text-indigo-600 underline">
                  Перейти до курсів
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((c) => (
                <CourseCertCard
                  key={c.id}
                  item={c}
                  issuing={posting === c.id}
                  onIssue={() => issue(c.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================
   Компоненти
========================= */
function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-white shadow-[0_12px_28px_rgba(0,0,0,0.06)] p-5">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function CourseCertCard({
  item,
  issuing,
  onIssue,
}: {
  item: CompletedCourseItem;
  issuing: boolean;
  onIssue: () => void;
}) {
  return (
    <article className="rounded-3xl bg-white h-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 flex flex-col overflow-hidden">
      {/* Banner */}
      <div className="h-24 w-full bg-[linear-gradient(90deg,#4169E1,#7B68EE)] relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/95 font-semibold tracking-wide">
            {item.title}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`text-xs px-2 py-1 rounded-xl ${item.certificate_exists ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {item.certificate_exists ? 'Сертифікат створено' : 'Очікує генерації'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Info badge="Курс" value={item.title} />
          <Info badge="Серія" value={item.certificate_serial || '—'} />
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          <button
            onClick={onIssue}
            disabled={issuing}
            className={`px-4 py-2 rounded-xl text-white shadow
              ${item.certificate_exists ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}
              disabled:opacity-60`}
            title={item.certificate_exists ? 'Надіслати ще раз' : 'Згенерувати сертифікат'}
          >
            {issuing ? 'Обробка…' : item.certificate_exists ? 'Надіслати ще раз' : 'Згенерувати'}
          </button>

          <Link
            href={`/courses/${item.id}`}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 shadow"
          >
            До курсу
          </Link>
        </div>
      </div>
    </article>
  );
}

function Info({ badge, value }: { badge: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500">{badge}</div>
      <div className="text-sm font-medium text-slate-900 line-clamp-2">{value}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-white h-[220px] shadow animate-pulse" />
  );
}
