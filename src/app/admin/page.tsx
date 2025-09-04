'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, GraduationCap, UserCheck, ShieldCheck, LinkIcon, Clock, BookOpenText } from 'lucide-react';

/** ===================== CONFIG ===================== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';

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
function fmt(num: number) {
  return new Intl.NumberFormat('uk-UA').format(num);
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/** ===================== REUSABLE UI ===================== */
function Card(
  { children, className = '', tone = 'surface' }: { children: React.ReactNode; className?: string; tone?: 'surface' | 'indigo' | 'violet' | 'emerald' | 'amber' },
) {
  const toneMap: Record<string, string> = {
    surface: 'bg-white/80 backdrop-blur ring-1 ring-[#E5ECFF] shadow-[0_8px_24px_rgba(2,28,78,0.06)]',
    indigo:
      'bg-gradient-to-br from-indigo-50 to-indigo-100/70 ring-1 ring-indigo-100 shadow-[0_12px_28px_rgba(31,41,255,0.12)]',
    violet:
      'bg-gradient-to-br from-violet-50 to-fuchsia-100/60 ring-1 ring-fuchsia-100 shadow-[0_12px_28px_rgba(168,85,247,0.12)]',
    emerald:
      'bg-gradient-to-br from-emerald-50 to-teal-100/60 ring-1 ring-emerald-100 shadow-[0_12px_28px_rgba(16,185,129,0.12)]',
    amber:
      'bg-gradient-to-br from-amber-50 to-orange-100/60 ring-1 ring-amber-100 shadow-[0_12px_28px_rgba(245,158,11,0.12)]',
  };
  return (
    <div className={cn('rounded-2xl transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(2,28,78,0.10)]', toneMap[tone], className)}>
      {children}
    </div>
  );
}

function Button(
  {
    children,
    href,
    onClick,
    size = 'md',
    variant = 'primary',
    className = '',
    disabled,
  }: {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    className?: string;
    disabled?: boolean;
  },
) {
  const base =
    'inline-flex items-center gap-2 font-semibold rounded-xl transition-all active:scale-[.98] focus:outline-none focus:ring-4 ring-[#DDE7FF]';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5' } as const;
  const variants = {
    primary: 'bg-[#1345DE] text-white hover:bg-[#0f3ac0]',
    secondary: 'bg-[#EEF3FF] text-[#1345DE] hover:bg-[#E2EBFF]',
    outline: 'bg-white text-[#0F2E64] ring-1 ring-[#E5ECFF] hover:bg-[#F9FBFF] hover:ring-[#d7e3ff]',
    ghost: 'text-[#2B50ED] hover:bg-[#F1F5FF] hover:text-[#1f3dc0]',
  } as const;
  const cls = cn(base, sizes[size], variants[variant], disabled && 'opacity-60', className);
  return href ? (
    <Link href={href} className={cls} onClick={onClick} aria-disabled={disabled}>
      {children}
    </Link>
  ) : (
    <button className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function StatusPill({ status }: { status?: Course['status'] }) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    pending: 'bg-amber-100 text-amber-800',
    published: 'bg-emerald-100 text-emerald-800',
  };
  const label = status === 'published' ? 'Опубліковано' : status === 'pending' ? 'На модерації' : 'Чернетка';
  return <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', map[status || 'draft'])}>{label}</span>;
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="w-56 h-3 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-[shimmer_1.8s_infinite]" />
      <div className="w-24 h-6 rounded-full bg-slate-200" />
      <style jsx>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        div[class*='animate-[shimmer'] { background-size: 200% 100%; }
      `}</style>
    </div>
  );
}

function KPI({ label, value, Icon, tone = 'surface' }: { label: string; value: string; Icon: React.ElementType; tone?: 'surface' | 'indigo' | 'violet' | 'emerald' | 'amber' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
      <Card className="p-5 overflow-hidden relative" tone={tone}>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl bg-white" />
        <div className="flex items-center gap-3 text-[#0F2E64] text-sm font-semibold">
          <Icon className="h-4 w-4" /> {label}
        </div>
        <div className="text-[#1345DE] text-3xl font-extrabold leading-tight mt-1">{value}</div>
      </Card>
    </motion.div>
  );
}

/** ===================== PAGE ===================== */
export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<Summary>({ total_users: 0, total_courses: 0, total_teachers: 0, pending_reviews: 0 });
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingTeacherApps, setPendingTeacherApps] = useState<number>(0);

  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = { Accept: 'application/json' };
        const cRes = await fetch(`${API_BASE}/courses/`, { headers, cache: 'no-store', signal: ctrl.signal });
        if (cRes.ok) {
          const raw = await cRes.json();
          const list: Course[] = Array.isArray(raw) ? raw : raw.results || [];
          setCourses(list);
          setSummary((s) => ({ ...s, total_courses: list.length }));
        }
        const uRes = await fetch(`${API_BASE}/admin_panel/api/users/all/`, { headers, cache: 'no-store', signal: ctrl.signal });
        if (uRes.ok) {
          const raw = await uRes.json();
          const list: User[] = Array.isArray(raw) ? raw : raw.results || [];
          setUsers(list);
          setSummary((s) => ({ ...s, total_users: list.length, total_teachers: list.filter((u) => u.is_teacher).length }));
        }
        const tRes = await fetch(`${API_BASE}/admin_panel/api/teacher-applications/?status=pending`, { headers, cache: 'no-store', signal: ctrl.signal });
        if (tRes.ok) {
          const raw = await tRes.json();
          const count = typeof raw?.count === 'number' ? raw.count : Array.isArray(raw) ? raw.length : Array.isArray(raw?.results) ? raw.results.length : 0;
          setPendingTeacherApps(count);
        } else {
          setPendingTeacherApps(0);
        }
        setSummary((s) => ({ ...s, pending_reviews: 7 }));
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e?.message || 'Не вдалося завантажити дані');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => ctrl.abort();
  }, []);

  return (
    <main className="min-h-screen relative bg-[radial-gradient(60%_50%_at_50%_-20%,#EAF0FF_0%,#FFFFFF_60%)] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.9),rgba(0,0,0,1))]">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-fuchsia-200/40 blur-3xl" />

      {/* HERO */}
      <section className="w-[1280px] max-w-[95vw] mx-auto pt-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-8 md:p-10 bg-gradient-to-br from-white/80 to-indigo-50/70 backdrop-blur ring-1 ring-[#E5ECFF] shadow-[0_8px_24px_rgba(2,28,78,0.06)]"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-[34px] md:text-[40px] font-extrabold text-[#021C4E] tracking-tight">Адмін панель</h1>
              <p className="text-slate-600 mt-1">Керування платформою: курси, користувачі, відгуки, заявки.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button href="/admin/courses" variant="primary"><BookOpenText className="h-4 w-4" /> Курси</Button>
              <Button href="/admin/users" variant="outline"><Users className="h-4 w-4" /> Користувачі</Button>
              <Button href="/admin/reviews" variant="outline"><Clock className="h-4 w-4" /> Відгуки</Button>
              <div className="relative">
                <Button href="/admin/teachers" variant="secondary"><UserCheck className="h-4 w-4" /> Заявки викладачів</Button>
                {pendingTeacherApps > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                    title={`${pendingTeacherApps} нових заявок`}
                    className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button href="/admin/categories" variant="ghost"><LinkIcon className="h-4 w-4" /> Категорії</Button>
            <Button href="/admin/languages" variant="ghost"><LinkIcon className="h-4 w-4" /> Мови</Button>
          </div>
        </motion.div>
      </section>

      {/* KPI (colored) */}
      <section className="w-[1280px] max-w-[95vw] mx-auto mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Користувачів" value={fmt(summary.total_users)} Icon={Users} tone="indigo" />
          <KPI label="Курсів" value={fmt(summary.total_courses)} Icon={GraduationCap} tone="violet" />
          <KPI label="Викладачів" value={fmt(summary.total_teachers)} Icon={ShieldCheck} tone="emerald" />
          <KPI label="Відгуків на модерації" value={fmt(summary.pending_reviews)} Icon={Clock} tone="amber" />
        </div>
      </section>

      {/* TABLES */}
      <section className="w-[1280px] max-w-[95vw] mx-auto mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-16">
        {/* Courses */}
        <Card className="p-5 bg-white/90" tone="surface">
          <div className="flex items-center justify-between">
            <h2 className="text-[#0F2E64] font-bold text-lg">Останні курси</h2>
            <Button href="/admin/courses" variant="ghost" size="sm">Всі курси →</Button>
          </div>
          <div className="divide-y mt-2">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : courses.length ? (
              courses.slice(0, 5).map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-sm text-slate-600">Автор: {c.author?.username || '—'}</div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <StatusPill status={c.status} />
                    <Button href={`/courses/${c.id}/details`} variant="ghost" size="sm">Переглянути</Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-sm text-slate-500 py-4">Поки що немає курсів</div>
            )}
          </div>
        </Card>

        {/* Users */}
        <Card className="p-5 bg-white/90" tone="surface">
          <div className="flex items-center justify-between">
            <h2 className="text-[#0F2E64] font-bold text-lg">Останні користувачі</h2>
            <Button href="/admin/users" variant="ghost" size="sm">Всі користувачі →</Button>
          </div>
          <div className="divide-y mt-2">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : users.length ? (
              users.slice(0, 5).map((u, i) => (
                <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-semibold">{u.username}</div>
                    <div className="text-sm text-slate-600">{u.email || '—'}</div>
                  </div>
                  {u.is_teacher ? <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">Викладач</span> : null}
                </motion.div>
              ))
            ) : (
              <div className="text-sm text-slate-500 py-4">Поки що немає користувачів</div>
            )}
          </div>
        </Card>
      </section>

      {error ? (
        <section className="w-[1280px] max-w-[95vw] mx-auto pb-12">
          <Card className="p-5 bg-red-50 ring-red-100">
            <div className="text-red-700 text-sm">{error}</div>
          </Card>
        </section>
      ) : null}

      <style jsx global>{`
        .btn-wiggle:hover { transform: translateY(-1px); }
      `}</style>
    </main>
  );
}
