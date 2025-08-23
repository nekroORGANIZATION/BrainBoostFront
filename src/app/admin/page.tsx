'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

/** ===================== CONFIG ===================== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

/** ===================== TYPES ===================== */
type Course = {
  id: number;
  title: string;
  author?: { username: string };
  students_count?: number;
  status?: 'draft' | 'pending' | 'published';
  created_at?: string;
};

type User = {
  id: number;
  username: string;
  email?: string;
  is_teacher?: boolean;
  is_superuser?: boolean;
  is_email_verified?: boolean;
};

type Summary = {
  total_users: number;
  total_courses: number;
  total_teachers: number;
  pending_reviews: number;
};

/** ===================== HELPERS ===================== */
function n(v: unknown, d = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
}
function fmt(n: number) {
  return new Intl.NumberFormat('uk-UA').format(n);
}

/** ===================== UI SMALL ===================== */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)] ${className}`}>
      {children}
    </div>
  );
}
function KPI({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="text-[#0F2E64] text-sm font-semibold">{label}</div>
      <div className="text-[#1345DE] text-3xl font-extrabold leading-tight">{value}</div>
    </Card>
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

/** ===================== PAGE ===================== */
export default function AdminDashboardPage() {
  const { isAuthenticated, user, accessToken } = useAuth() as {
    isAuthenticated: boolean;
    accessToken: string | null;
    user?: { username?: string; is_superuser?: boolean; profile_picture?: string | null } | null;
  };

  const [summary, setSummary] = useState<Summary>({
    total_users: 0,
    total_courses: 0,
    total_teachers: 0,
    pending_reviews: 0,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const notLoggedIn = !isAuthenticated || !accessToken;
  const notAdmin = !!user && !user.is_superuser;

  useEffect(() => {
    if (notLoggedIn || notAdmin) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${accessToken}` };

        // Courses
        try {
          const res = await fetch(`${API_BASE}/api/courses/`, { headers });
          if (res.ok) {
            const raw = await res.json();
            setCourses(Array.isArray(raw) ? raw : raw.results || []);
          }
        } catch {}

        // Users
        try {
          const res = await fetch(`${API_BASE}/api/users/`, { headers });
          if (res.ok) {
            const raw = await res.json();
            setUsers(Array.isArray(raw) ? raw : raw.results || []);
          }
        } catch {}

        // Summary stub
        setSummary({
          total_users: 245, // тут можна підтягнути з бекенду
          total_courses: 31,
          total_teachers: 12,
          pending_reviews: 7,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken, notLoggedIn, notAdmin]);

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
      {/* HERO */}
      <section className="w-[1280px] max-w-[95vw] mx-auto pt-[120px]">
        <div className="rounded-[24px] bg-white/90 ring-1 ring-[#E5ECFF] p-8 shadow">
          <h1 className="text-[40px] font-bold text-[#021C4E]">Адмін панель</h1>
          <p className="text-slate-600 mt-2">Керування всією платформою: курси, користувачі, відгуки, заявки.</p>
          <div className="mt-4 flex gap-3 flex-wrap">
            <Link href="/admin/courses" className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">Курси</Link>
            <Link href="/admin/users" className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">Користувачі</Link>
            <Link href="/admin/reviews" className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">Відгуки</Link>
            <Link href="/admin/teachers" className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">Заявки викладачів</Link>
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="w-[1280px] max-w-[95vw] mx-auto mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPI label="Користувачів" value={fmt(summary.total_users)} />
          <KPI label="Курсів" value={fmt(summary.total_courses)} />
          <KPI label="Викладачів" value={fmt(summary.total_teachers)} />
          <KPI label="Відгуків на модерації" value={fmt(summary.pending_reviews)} />
        </div>
      </section>

      {/* TABLES */}
      <section className="w-[1280px] max-w-[95vw] mx-auto mt-8 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 pb-16">
        {/* Courses */}
        <Card>
          <h2 className="text-[#0F2E64] font-bold text-lg">Останні курси</h2>
          <div className="divide-y mt-3">
            {courses.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-sm text-slate-600">Автор: {c.author?.username}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <StatusPill status={c.status} />
                  <Link href={`/courses/${c.id}/details`} className="text-[#1345DE] text-sm">Переглянути</Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/admin/courses" className="text-[#1345DE] hover:underline text-sm">Всі курси →</Link>
          </div>
        </Card>

        {/* Users */}
        <Card>
          <h2 className="text-[#0F2E64] font-bold text-lg">Останні користувачі</h2>
          <div className="divide-y mt-3">
            {users.slice(0, 5).map(u => (
              <div key={u.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-semibold">{u.username}</div>
                  <div className="text-sm text-slate-600">{u.email}</div>
                </div>
                {u.is_teacher ? <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">Викладач</span> : null}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/admin/users" className="text-[#1345DE] hover:underline text-sm">Всі користувачі →</Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
