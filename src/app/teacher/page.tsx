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
  description?: string;
  image?: string | null;
  price?: number | string | null;
  rating?: number | string | null;
  students_count?: number | null;
  status?: 'draft' | 'pending' | 'published';
  created_at?: string;
};

type ReviewSummary = {
  pending_count: number;
  today_count: number;
};

type Summary = {
  revenue_month: number;
  students_total: number;
  courses_total: number;
  pending_reviews: number;
};

/** ===================== HELPERS ===================== */
function safeGetArray<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && Array.isArray(raw.results)) return raw.results as T[];
  return [];
}
function n(v: unknown, d = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
}
function fmt(n: number) {
  return new Intl.NumberFormat('uk-UA').format(n);
}
function money(n: number) {
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'USD' }).format(n);
}

/** ===================== SMALL UI ===================== */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)] ${className}`}>
      {children}
    </div>
  );
}
function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <div className="text-[#0F2E64] text-sm font-semibold">{label}</div>
      <div className="text-[#1345DE] text-3xl font-extrabold leading-tight">{value}</div>
      {sub ? <div className="text-slate-600 mt-1 text-sm">{sub}</div> : null}
    </Card>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[999px] bg-[#EEF3FF] text-[#1345DE] px-2.5 py-1 text-xs font-semibold ring-1 ring-[#E5ECFF]">
      {children}
    </span>
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
    <div className="grid grid-cols-[56px_1fr_120px_120px_120px] gap-4 items-center py-3">
      <div className="w-14 h-10 bg-slate-200 rounded-md animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="h-3 w-56 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
      <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
      <div className="h-8 w-28 bg-slate-200 rounded animate-pulse" />
    </div>
  );
}

/** ===================== PAGE ===================== */
export default function TeacherDashboardPage() {
  const { isAuthenticated, user, accessToken } = useAuth() as {
    isAuthenticated: boolean;
    accessToken: string | null;
    user?: {
      username?: string;
      first_name?: string | null;
      profile_picture?: string | null;
      is_teacher?: boolean;
      is_superuser?: boolean;
    } | null;
  };

  /** ------- guards ------- */
  const notLoggedIn = !isAuthenticated || !accessToken;
  const notTeacher = !!user && !user.is_teacher && !user.is_superuser;

  /** ------- state ------- */
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [summary, setSummary] = useState<Summary>({
    revenue_month: 0,
    students_total: 0,
    courses_total: 0,
    pending_reviews: 0,
  });
  const [reviewSm, setReviewSm] = useState<ReviewSummary>({ pending_count: 0, today_count: 0 });

  /** ------- effects: fetch teacher data ------- */
  useEffect(() => {
    if (notLoggedIn || notTeacher) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${accessToken}` };

        /** 1) мої курси як автора (могли назвати інакше — підстрахуємось) */
        // спроба 1: /courses/my/ (якщо ти додаси endpoint)
        let myCourses: Course[] = [];
        try {
          const res = await fetch(`${API_BASE}/courses/my/`, { headers, cache: 'no-store' });
          if (res.ok) {
            const raw = await res.json();
            myCourses = safeGetArray<Course>(raw);
          }
        } catch {_/* ignore */ }

        // спроба 2: /api/courses/?author=me (якщо фільтри)
        if (myCourses.length === 0) {
          try {
            const res = await fetch(`${API_BASE}/api/courses/?author=me`, { headers, cache: 'no-store' });
            if (res.ok) {
              const raw = await res.json();
              myCourses = safeGetArray<Course>(raw);
            }
          } catch {_/* ignore */ }
        }

        // нормалізація картинок
        myCourses = myCourses.map(c => ({
          ...c,
          image: c.image ? (c.image.startsWith('http') ? c.image : `${API_BASE}${c.image}`) : null,
        }));

        /** 2) ревʼю/модерація (якщо додаси endpoint) */
        let rs: ReviewSummary = { pending_count: 0, today_count: 0 };
        try {
          const res = await fetch(`${API_BASE}/api/reviews/summary/`, { headers, cache: 'no-store' });
          if (res.ok) rs = await res.json();
        } catch {_/* ignore */ }

        /** 3) зібрати summary з того, що маємо (або фолбек) */
        const studentsTotal = myCourses.reduce((acc, c) => acc + n(c.students_count), 0);
        const revenueMonth = Math.round(studentsTotal * 49); // умовно: $49 середній чек/міс
        const coursesTotal = myCourses.length;
        const pendingReviews = rs.pending_count;

        if (!cancelled) {
          setCourses(myCourses);
          setReviewSm(rs);
          setSummary({
            revenue_month: revenueMonth,
            students_total: studentsTotal,
            courses_total: coursesTotal,
            pending_reviews: pendingReviews,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [accessToken, notLoggedIn, notTeacher]);

  /** ------- derived ------- */
  const recentCourses = useMemo(() => {
    const list = [...courses];
    list.sort((a, b) => +new Date(b.created_at || 0) - +new Date(a.created_at || 0));
    return list.slice(0, 6);
  }, [courses]);

  /** ------- guards UI ------- */
  if (notLoggedIn) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top grid place-items-center px-6">
        <Card className="max-w-xl text-center">
          <h1 className="text-2xl font-extrabold text-[#0F2E64]">Потрібен вхід</h1>
          <p className="text-slate-700 mt-1">Щоб відкрити викладацький простір, спершу увійди.</p>
          <div className="mt-4">
            <Link href="/login" className="inline-flex items-center px-5 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">
              Увійти
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  if (notTeacher) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top grid place-items-center px-6">
        <Card className="max-w-2xl">
          <h1 className="text-2xl font-extrabold text-[#0F2E64]">Ти ще не викладач</h1>
          <p className="text-slate-700 mt-1">
            Подай заявку на статус викладача та почни створювати свої курси. Після схвалення — тут зʼявиться панель.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/profile" className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">
              Перейти в профіль
            </Link>
            <Link href="/teacher/apply" className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">
              Подати заявку
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  /** ------- main UI ------- */
  const avatar = user?.profile_picture
    ? (user.profile_picture.startsWith('http') ? user.profile_picture : `${API_BASE}${user.profile_picture}`)
    : '/images/avatar1.png';

  const name = user?.first_name ? `${user.first_name}` : (user?.username || 'Викладач');

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      {/* HERO */}
      <section className="w-[1280px] max-w-[95vw] mx-auto pt-[120px]">
        <div className="rounded-[24px] bg-white/90 ring-1 ring-[#E5ECFF] p-6 md:p-8 shadow-[0_10px_30px_rgba(2,28,78,0.10)] grid md:grid-cols-[auto_1fr] gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white shrink-0">
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-sm text-slate-600">Вітаємо у викладацькому просторі</div>
            <h1 className="m-0 font-[Afacad] font-bold text-[40px] md:text-[56px] leading-[1.1] text-[#021C4E]">
              {name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>Verified Teacher</Badge>
              {user?.is_superuser ? <Badge>Admin access</Badge> : null}
            </div>

            {/* Швидкі дії */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/courses/create" className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">
                + Створити курс
              </Link>
              <Link href="/teacher/courses" className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">
                Мої курси
              </Link>
              <Link href="/teacher/tests" className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">
                Тести
              </Link>
              <Link href="/teacher/settings" className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">
                Налаштування
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="w-[1280px] max-w-[95vw] mx-auto mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPI label="Дохід за місяць" value={money(summary.revenue_month)} sub="Орієнтовно" />
          <KPI label="Студентів" value={fmt(summary.students_total)} />
          <KPI label="Курсів" value={fmt(summary.courses_total)} />
          <KPI label="Відгуки, на модерації" value={fmt(summary.pending_reviews)} sub={reviewSm.today_count ? `+${fmt(reviewSm.today_count)} за сьогодні` : undefined} />
        </div>
      </section>

      {/* CONTENT GRID */}
      <section className="w-[1280px] max-w-[95vw] mx-auto mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 pb-16">
        {/* LEFT: courses table */}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-[#0F2E64] font-extrabold text-[20px]">Останні курси</h2>
            <Link href="/teacher/courses" className="text-[#1345DE] hover:underline text-sm">Всі курси →</Link>
          </div>

          <div className="mt-4">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[56px_1fr_120px_120px_120px] gap-4 text-xs font-semibold text-slate-600 pb-2 border-b">
              <div>Обкладинка</div>
              <div>Курс</div>
              <div>Студентів</div>
              <div>Рейтинг</div>
              <div>Дії</div>
            </div>

            {/* Rows */}
            <div className="divide-y">
              {loading && (
                <>
                  <SkeletonRow /><SkeletonRow /><SkeletonRow />
                </>
              )}
              {!loading && recentCourses.length === 0 && (
                <div className="py-8 text-center text-slate-600">
                  Поки що немає курсів. Почнемо з першого?
                  <div className="mt-3">
                    <Link href="/teacher/courses/new" className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">
                      + Створити курс
                    </Link>
                  </div>
                </div>
              )}
              {!loading && recentCourses.map((c) => (
                <div key={c.id} className="grid grid-cols-1 md:grid-cols-[56px_1fr_120px_120px_120px] gap-4 items-center py-3">
                  {/* cover */}
                  <div className="w-14 h-10 rounded-md ring-1 ring-[#E5ECFF] overflow-hidden bg-slate-100">
                    {c.image ? <img src={c.image} alt={c.title} className="w-full h-full object-cover" /> : null}
                  </div>
                  {/* title/desc */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-semibold text-[#0F2E64]">{c.title}</div>
                      <StatusPill status={c.status} />
                    </div>
                    {c.description ? (
                      <div className="text-slate-600 text-sm truncate">
                        {c.description.length > 120 ? c.description.slice(0, 120) + '…' : c.description}
                      </div>
                    ) : null}
                  </div>
                  {/* students */}
                  <div className="text-sm text-[#0F2E64]">{fmt(n(c.students_count))}</div>
                  {/* rating */}
                  <div className="text-sm text-[#0F2E64]">{n(c.rating, 0).toFixed(1)} ★</div>
                  {/* actions */}
                  <div className="flex gap-2">
                    <Link href={`/teacher/courses/${c.id}`} className="px-3 py-1.5 rounded-[10px] ring-1 ring-[#E5ECFF] text-sm">
                      Редагувати
                    </Link>
                    <Link href={`/courses/${c.id}/details`} className="px-3 py-1.5 rounded-[10px] bg-[#1345DE] text-white text-sm">
                      Переглянути
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* RIGHT: reviews & quick links */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-[#0F2E64] font-extrabold text-[18px]">Модерація відгуків</h3>
              <Badge>beta</Badge>
            </div>
            <p className="text-slate-700 mt-2 text-sm">
              Керуйте відгуками студентів: схвалюйте, відхиляйте та відповідайте.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-[12px] ring-1 ring-[#E5ECFF] p-3">
                <div className="text-2xl font-extrabold text-[#1345DE]">{fmt(reviewSm.pending_count)}</div>
                <div className="text-xs text-slate-600 mt-1">На модерації</div>
              </div>
              <div className="rounded-[12px] ring-1 ring-[#E5ECFF] p-3">
                <div className="text-2xl font-extrabold text-[#1345DE]">{fmt(summary.courses_total)}</div>
                <div className="text-xs text-slate-600 mt-1">Курсів</div>
              </div>
              <div className="rounded-[12px] ring-1 ring-[#E5ECFF] p-3">
                <div className="text-2xl font-extrabold text-[#1345DE]">{fmt(summary.students_total)}</div>
                <div className="text-xs text-slate-600 mt-1">Студентів</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/teacher/reviews" className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">
                Відкрити модерацію
              </Link>
              <Link href="/reviews" className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">
                Подивитись публічні
              </Link>
            </div>
          </Card>

          <Card>
            <h3 className="text-[#0F2E64] font-extrabold text-[18px]">Швидкі дії</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/teacher/courses/new" className="rounded-[12px] ring-1 ring-[#E5ECFF] p-3 hover:ring-[#1345DE] transition">
                + Новий курс
              </Link>
              <Link href="/teacher/tests" className="rounded-[12px] ring-1 ring-[#E5ECFF] p-3 hover:ring-[#1345DE] transition">
                Тести
              </Link>
              <Link href="/teacher/courses" className="rounded-[12px] ring-1 ring-[#E5ECFF] p-3 hover:ring-[#1345DE] transition">
                Мої курси
              </Link>
              <Link href="/teacher/settings" className="rounded-[12px] ring-1 ring-[#E5ECFF] p-3 hover:ring-[#1345DE] transition">
                Налаштування
              </Link>
            </div>
          </Card>

          <Card>
            <h3 className="text-[#0F2E64] font-extrabold text-[18px]">Підказка</h3>
            <p className="text-sm text-slate-700 mt-1">
              Додавай у програму більше практики та домашніх — це найсильніше впливає на конверсію в покупку і рейтинг курсу.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
