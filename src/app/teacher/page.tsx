'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import TipOfDayCard from '@/components/TipOfDayCard';

/** ===================== CONFIG ===================== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';

/** ===================== TYPES ===================== */
type Course = {
  id: number;
  title: string;
  description?: string;
  image?: string | null;
  price?: number | string | null;
  rating?: number | string | null;
  students_count?: number | string | null;
  status?: 'draft' | 'pending' | 'published';
  author?: number | { id: number; username?: string } | string | null;
  author_username?: string;
  created_at?: string;
};

type Summary = {
  revenue_month: number;
  students_total: number;
  courses_total: number;
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
function fmt(num: number) {
  return new Intl.NumberFormat('uk-UA').format(num);
}
function money(num: number) {
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'USD' }).format(num);
}
function mediaUrl(u?: string | null) {
  if (!u) return '';
  return /^https?:\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:')
    ? u
    : `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`;
}

/** ===================== SMALL UI ===================== */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/90 ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)] ${className}`}>
      {children}
    </div>
  );
}
function KPI({ label, value, sub, delay = 0 }: { label: string; value: string; sub?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut', delay }}
    >
      <Card>
        <div className="text-[#0F2E64] text-sm font-semibold">{label}</div>
        <div className="text-[#1345DE] text-3xl font-extrabold leading-tight">{value}</div>
        {sub ? <div className="text-slate-600 mt-1 text-sm">{sub}</div> : null}
      </Card>
    </motion.div>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#EEF3FF] text-[#1345DE] px-2.5 py-1 text-xs font-semibold ring-1 ring-[#E5ECFF]">
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
    <div className="grid grid-cols-1 md:grid-cols-[56px_1fr_100px_100px_180px] gap-4 items-center py-3">
      <div className="w-14 h-10 bg-slate-200 rounded-md animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="h-3 w-56 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
      <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
      <div className="h-9 w-40 bg-slate-200 rounded animate-pulse" />
    </div>
  );
}

/** ===================== PAGE ===================== */
export default function TeacherDashboardPage() {
  const { isAuthenticated, user, accessToken } = useAuth() as {
    isAuthenticated: boolean;
    accessToken: string | null;
    user?: {
      id?: number;
      username?: string;
      first_name?: string | null;
      profile_picture?: string | null;
      is_teacher?: boolean;
      is_superuser?: boolean;
    } | null;
  };

  const notLoggedIn = !isAuthenticated || !accessToken;
  const notTeacher = !!user && !user.is_teacher && !user.is_superuser;

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [summary, setSummary] = useState<Summary>({
    revenue_month: 0,
    students_total: 0,
    courses_total: 0,
  });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (notLoggedIn || notTeacher) {
      setLoading(false);
      return;
    }
    // ждём, пока будет известен user (id/username), чтобы корректно фильтровать
    if (!user?.id && !user?.username) return;

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        // ОДИН запрос ко всем курсам, без author-параметров
        const url = `${API_BASE}/courses/?page_size=200`;
        const r = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken!}` },
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!r.ok) {
          throw new Error(`Помилка завантаження курсів: ${r.status}`);
        }

        const raw = await r.json();
        const allCourses = safeGetArray<Course>(raw);

        const uid = user?.id;
        const uname = (user?.username || '').toLowerCase();

        // Фронтовая фильтрация: по id автора или по author_username
        const myCourses = allCourses
          .filter((c) => {
            const a = c.author;
            const byId =
              typeof a === 'number'
                ? uid && a === uid
                : typeof a === 'object' && a && 'id' in a
                ? uid && (a as any).id === uid
                : false;

            const byName =
              c.author_username &&
              String(c.author_username).toLowerCase() === uname;

            return byId || byName;
          })
          .map((c) => ({
            ...c,
            image: c.image ? mediaUrl(c.image) : null,
            rating: n(c.rating, 0),
            students_count: n(c.students_count, 0),
            status: c.status || 'draft',
          }));

        const studentsTotal = myCourses.reduce((acc, c) => acc + n(c.students_count), 0);
        const revenueMonth = Math.round(studentsTotal * 49);
        const coursesTotal = myCourses.length;

        setCourses(myCourses);
        setSummary({
          revenue_month: revenueMonth,
          students_total: studentsTotal,
          courses_total: coursesTotal,
        });
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setErr(e?.message || 'Сталася помилка');
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [accessToken, notLoggedIn, notTeacher, user?.id, user?.username]);

  const recentCourses = useMemo(() => {
    const list = [...courses];
    list.sort((a, b) => +new Date(b.created_at || 0) - +new Date(a.created_at || 0));
    return list.slice(0, 6);
  }, [courses]);

  if (notLoggedIn) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top grid place-items-center px-6">
        <Card className="max-w-xl text-center">
          <h1 className="text-2xl font-extrabold text-[#0F2E64]">Потрібен вхід</h1>
          <p className="text-slate-700 mt-1">Щоб відкрити викладацький простір, спершу увійди.</p>
          <div className="mt-4">
            <Link href="/login" className="inline-flex items-center px-5 py-2 rounded-xl bg-[#1345DE] text-white font-semibold hover:translate-y-[-1px] transition">
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
            <Link href="/profile" className="px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition">
              Перейти в профіль
            </Link>
            <Link href="/teacher/apply" className="px-4 py-2 rounded-xl bg-[#1345DE] text-white font-semibold hover:translate-y-[-1px] transition">
              Подати заявку
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  const avatar = user?.profile_picture ? mediaUrl(user.profile_picture) : '/images/defuser.png';
  const name = user?.first_name ? `${user.first_name}` : (user?.username || 'Викладач');

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      {/* HERO */}
      <section className="w-full max-w-screen-xl mx-auto px-4 md:px-6 pt-[92px] md:pt-[112px]">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-[24px] bg-white/90 ring-1 ring-[#E5ECFF] p-6 md:p-8 shadow-[0_10px_30px_rgba(2,28,78,0.10)] grid md:grid-cols-[auto_1fr] gap-6"
        >
          <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white shrink-0">
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-sm text-slate-600">Вітаємо у викладацькому просторі</div>
            <h1 className="m-0 font-[Afacad] font-bold text-[36px] md:text-[56px] leading-[1.1] text-[#021C4E]">
              {name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>Verified Teacher</Badge>
              {user?.is_superuser ? <Badge>Admin access</Badge> : null}
            </div>

            {/* Швидкі дії */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/teacher/courses/new"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#1345DE] text-white font-semibold shadow-[0_6px_14px_rgba(19,69,222,0.25)] hover:shadow-[0_8px_20px_rgba(19,69,222,0.35)] active:translate-y-[1px] transition"
              >
                + Створити курс
              </Link>
              <Link href="/teacher/courses" className="inline-flex items-center justify-center px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition">
                Мої курси
              </Link>
              <Link href="/teacher/chats" className="inline-flex items-center justify-center px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition">
                Мої чати
              </Link>
              <Link href="/teacher/lessons" className="inline-flex items-center justify-center px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition">
                Уроки
              </Link>
              <Link href="/teacher/settings" className="inline-flex items-center justify-center px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition">
                Налаштування
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* KPI */}
      <section className="w-full max-w-screen-xl mx-auto px-4 md:px-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPI label="Дохід за місяць" value={money(summary.revenue_month)} sub="Орієнтовно" delay={0.05} />
          <KPI label="Студентів" value={fmt(summary.students_total)} delay={0.1} />
          <KPI label="Курсів" value={fmt(summary.courses_total)} delay={0.15} />
        </div>
      </section>

      {/* CONTENT GRID */}
      <section className="w-full max-w-screen-xl mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 pb-20">
        {/* LEFT: courses table */}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-[#0F2E64] font-extrabold text-[20px]">Останні курси</h2>
            <Link href="/teacher/courses" className="text-[#1345DE] hover:underline text-sm">Всі курси →</Link>
          </div>

          {err && (
            <div className="mt-3 rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2">
              {err}
            </div>
          )}

          <div className="mt-4">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[56px_1fr_100px_100px_180px] gap-4 text-xs font-semibold text-slate-600 pb-2 border-b border-slate-100">
              <div>Обкладинка</div>
              <div>Курс</div>
              <div className="text-center">Студентів</div>
              <div className="text-center">Рейтинг</div>
              <div className="text-right">Дії</div>
            </div>

            {/* Rows */}
            <div className="divide-y">
              {loading && (<><SkeletonRow /><SkeletonRow /><SkeletonRow /></>)}

              {!loading && recentCourses.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-8 text-center text-slate-600"
                >
                  Поки що немає курсів. Почнемо з першого?
                  <div className="mt-3">
                    <Link href="/teacher/courses/new" className="inline-flex items-center px-4 py-2 rounded-xl bg-[#1345DE] text-white font-semibold hover:translate-y-[-1px] transition">
                      + Створити курс
                    </Link>
                  </div>
                </motion.div>
              )}

              <AnimatePresence initial={false}>
                {!loading && recentCourses.map((c, idx) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: 'easeOut', delay: idx * 0.03 }}
                    className="grid grid-cols-1 md:grid-cols-[56px_1fr_100px_100px_180px] gap-4 items-center py-3"
                  >
                    {/* cover */}
                    <div className="w-14 h-10 rounded-md ring-1 ring-[#E5ECFF] overflow-hidden bg-slate-100">
                      {c.image ? <img src={String(c.image)} alt={c.title} className="w-full h-full object-cover" /> : null}
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
                    <div className="text-sm text-[#0F2E64] md:text-center">{fmt(n(c.students_count))}</div>

                    {/* rating */}
                    <div className="text-sm text-[#0F2E64] md:text-center">{n(c.rating, 0).toFixed(1)} ★</div>

                    {/* actions */}
                    <div className="flex md:justify-end items-center gap-2 flex-nowrap whitespace-nowrap">
                      <Link
                        href={`/teacher/courses/${c.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] text-sm bg-white hover:ring-[#1345DE] active:translate-y-[1px] transition"
                      >
                        Редагувати
                      </Link>
                      <Link
                        href={`/courses/${c.id}/details`}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#1345DE] text-white text-sm shadow-[0_4px_12px_rgba(19,69,222,0.25)] hover:shadow-[0_6px_16px_rgba(19,69,222,0.35)] active:translate-y-[1px] transition"
                      >
                        Переглянути
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </Card>

        {/* RIGHT: інформаційні блоки */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card>
              <h3 className="text-[#0F2E64] font-extrabold text-[18px]">План дій</h3>
              <ul className="list-disc pl-5 mt-2 text-sm text-slate-700 space-y-1">
                <li>Створи або доповни програму курсу (розділи, уроки, тести).</li>
                <li>Додай практичні завдання — це піднімає рейтинг.</li>
                <li>Оформи гарний прев’ю-банер і короткий опис.</li>
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/teacher/courses/new" className="px-4 py-2 rounded-xl bg-[#1345DE] text-white font-semibold hover:translate-y-[-1px] transition">
                  + Новий курс
                </Link>
                <Link href="/teacher/tests" className="px-4 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition">
                  Конструктор тестів
                </Link>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
            <Card>
              <h3 className="text-[#0F2E64] font-extrabold text-[18px]">Швидкі посилання</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link href="/teacher/courses" className="rounded-2xl ring-1 ring-[#E5ECFF] p-3 hover:ring-[#1345DE] hover:translate-y-[-1px] transition">
                  Мої курси
                </Link>
                <Link href="/teacher/settings" className="rounded-2xl ring-1 ring-[#E5ECFF] p-3 hover:ring-[#1345DE] hover:translate-y-[-1px] transition">
                  Налаштування
                </Link>
                <Link href="/reviews" className="rounded-2xl ring-1 ring-[#E5ECFF] p-3 hover:ring-[#1345DE] hover:translate-y-[-1px] transition">
                  Публічні відгуки
                </Link>
                <Link href="/profile" className="rounded-2xl ring-1 ring-[#E5ECFF] p-3 hover:ring-[#1345DE] hover:translate-y-[-1px] transition">
                  Профіль
                </Link>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <TipOfDayCard />
          </motion.div>
        </div>
      </section>
    </main>
  );
}
