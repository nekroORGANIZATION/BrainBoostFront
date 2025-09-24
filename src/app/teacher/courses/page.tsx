'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import http from '@/lib/http';
import { mediaUrl } from '@/lib/media';
import { GraduationCap } from 'lucide-react';

type Course = {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  price?: number | string | null;
  rating?: number | string | null;
  students_count?: number | null;
  status?: 'draft' | 'pending' | 'published';
  author?: number | { id: number; username?: string } | string | null;
  author_username?: string;
  created_at?: string;
};

const pageSize = 8;

/* -------- UI bits -------- */
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
    <div className="grid grid-cols-[56px_1fr_110px_90px_220px] gap-4 items-center py-3">
      <div className="w-14 h-10 bg-slate-200 rounded-md animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="h-3 w-56 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
      <div className="h-6 w-14 bg-slate-200 rounded animate-pulse" />
      <div className="h-8 w-28 bg-slate-200 rounded animate-pulse" />
    </div>
  );
}

/* -------- helpers -------- */
function safeGetArray<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && Array.isArray(raw.results)) return raw.results as T[];
  return [];
}
const n = (v: unknown, d = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};

export default function TeacherMyCoursesPage() {
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

  // data
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'draft' | 'pending' | 'published'>('all');
  const [sort, setSort] = useState<'new' | 'old' | 'rating' | 'students'>('new');

  // pagination (client-side)
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (notLoggedIn || notTeacher) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadMyCourses() {
      setLoading(true);
      setErr(null);

      const tryGet = async (url: string, params?: any) => {
        try {
          const r = await http.get(url, { params });
          return safeGetArray<Course>(r.data);
        } catch (e: any) {
          if (!cancelled && e?.response?.status === 401) {
            setErr('Неавторизовано. Увійди знову.');
          }
          return [] as Course[];
        }
      };

      // 1) прямий
      let mine = await tryGet('/courses/my/', { page_size: 200 });

      // 1b) дзеркало під /api/
      if (mine.length === 0) {
        mine = await tryGet('/api/courses/my/', { page_size: 200 });
      }

      // 2) фільтрований
      if (mine.length === 0) {
        mine = await tryGet('/api/courses/', { author: 'me', page_size: 200 });
      }

      // 3) через author=id
      if (mine.length === 0 && user?.id) {
        mine = await tryGet('/courses/', { author: user.id, page_size: 200 });
      }

      // 4) усі + фільтр на фронті
      if (mine.length === 0) {
        const all = await tryGet('/courses/', { page_size: 200 });
        const uid = user?.id;
        const uname = (user?.username || '').toLowerCase();
        mine = all.filter((c) => {
          const a = c.author;
          const byId = typeof a === 'number'
            ? a === uid
            : (typeof a === 'object' && a && 'id' in a)
              ? (a as any).id === uid
              : false;
          const byName =
            (c as any).author_username &&
            String((c as any).author_username).toLowerCase() === uname;
          return byId || byName;
        });
      }

      const normalized = mine.map((c) => ({
        ...c,
        image: c.image ? mediaUrl(c.image) : null,
        rating: n(c.rating, 0),
        students_count: n(c.students_count, 0),
        status: (c.status as any) || 'draft',
      }));

      if (!cancelled) {
        setCourses(normalized);
        setLoading(false);
      }
    }

    loadMyCourses();
    return () => { cancelled = true; };
  }, [accessToken, notLoggedIn, notTeacher, user?.id, user?.username]);

  const filtered = useMemo(() => {
    let list = [...courses];

    if (status !== 'all') list = list.filter((c) => (c.status || 'draft') === status);

    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(s) ||
          (c.description || '').toLowerCase().includes(s)
      );
    }

    switch (sort) {
      case 'new': list.sort((a, b) => +new Date(b.created_at || 0) - +new Date(a.created_at || 0)); break;
      case 'old': list.sort((a, b) => +new Date(a.created_at || 0) - +new Date(b.created_at || 0)); break;
      case 'rating': list.sort((a, b) => n(b.rating, 0) - n(a.rating, 0)); break;
      case 'students': list.sort((a, b) => n(b.students_count, 0) - n(a.students_count, 0)); break;
    }
    return list;
  }, [courses, q, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // guards
  if (notLoggedIn) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top grid place-items-center px-6">
        <Card className="max-w-xl text-center">
          <h1 className="text-2xl font-extrabold text-[#0F2E64]">Потрібен вхід</h1>
          <p className="text-slate-700 mt-1">Щоб переглянути свої курси, увійди.</p>
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
        <Card className="max-w-xl text-center">
          <h1 className="text-2xl font-extrabold text-[#0F2E64]">Ти ще не викладач</h1>
          <p className="text-slate-700 mt-1">Подай заявку на статус викладача, після схвалення тут зʼявиться список твоїх курсів.</p>
          <div className="mt-4 flex gap-3 justify-center">
            <Link href="/teacher/apply" className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold">Подати заявку</Link>
            <Link href="/profile" className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">Профіль</Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <section className="w-[1280px] max-w-[95vw] mx-auto pt-[120px] pb-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h1 className="m-0 font-[Afacad] font-bold text-[40px] md:text-[52px] leading-[1.1] text-[#021C4E]">
            Мої курси
          </h1>

          <div className="flex gap-2">
            {/* ✅ Гарна кнопка → Teacher Hub */}
            <Link
              href="/teacher"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition text-[#0F2E64]"
              title="Teacher Hub"
            >
              <GraduationCap className="w-4 h-4" />
              Teacher Hub
            </Link>

            <Link
              href="/teacher/courses/new"
              className="px-4 py-2 rounded-[12px] bg-[#1345DE] text-white font-semibold hover:opacity-95 transition"
            >
              + Створити курс
            </Link>
          </div>
        </div>

        {err && (
          <div className="mb-3 rounded-xl bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2">
            {err}
          </div>
        )}

        <Card>
          {/* Controls */}
          <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-3">
            <input
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
              placeholder="Пошук за назвою або описом…"
              className="rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
            />
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value as any); }}
              className="rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2"
            >
              <option value="all">Усі статуси</option>
              <option value="draft">Чернетки</option>
              <option value="pending">На модерації</option>
              <option value="published">Опубліковані</option>
            </select>
            <select
              value={sort}
              onChange={(e) => { setPage(1); setSort(e.target.value as any); }}
              className="rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2"
            >
              <option value="new">Спочатку нові</option>
              <option value="old">Спочатку старі</option>
              <option value="rating">За рейтингом</option>
              <option value="students">За студентами</option>
            </select>
            <div className="hidden md:flex items-center text-sm text-slate-600">
              Всього: <span className="ml-1 font-semibold">{filtered.length}</span>
            </div>
          </div>

          {/* Table header */}
          <div className="hidden md:grid grid-cols-[56px_1fr_110px_90px_220px] gap-4 text-xs font-semibold text-slate-600 pb-2 mt-4 border-b">
            <div>Обкладинка</div>
            <div>Курс</div>
            <div>Студентів</div>
            <div>Рейтинг</div>
            <div>Дії</div>
          </div>

          {/* Rows */}
          <div className="divide-y">
            {loading && (<><SkeletonRow /><SkeletonRow /><SkeletonRow /></>)}

            {!loading && pageItems.length === 0 && (
              <div className="py-10 text-center text-slate-600">
                Нічого не знайдено. Спробуй змінити фільтри або створити перший курс.
              </div>
            )}

            {!loading && pageItems.map((c) => {
              const base = `/teacher/courses/${c.id}/builder`;
              return (
                <div key={c.id} className="grid grid-cols-1 md:grid-cols-[56px_1fr_110px_90px_220px] gap-4 items-center py-3">
                  <div className="w-14 h-10 rounded-md ring-1 ring-[#E5ECFF] overflow-hidden bg-slate-100">
                    {c.image ? <img src={c.image} alt={c.title} className="w-full h-full object-cover" /> : null}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`${base}/overview`} className="truncate font-semibold text-[#0F2E64] hover:underline">
                        {c.title}
                      </Link>
                      <StatusPill status={c.status} />
                    </div>
                    {c.description ? (
                      <div className="text-slate-600 text-sm truncate">
                        {c.description.length > 120 ? c.description.slice(0, 120) + '…' : c.description}
                      </div>
                    ) : null}

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <Link href={`${base}/assessments`} className="text-[#1345DE] hover:underline">Тести</Link>
                      <span className="text-slate-400">·</span>
                      <Link href={`/teacher/courses/${c.id}/students`} className="text-[#1345DE] hover:underline">
                        Студенти
                      </Link>

                      <span className="text-slate-400">·</span>
                      <Link href={`/courses/${c.id}`} className="text-[#1345DE] hover:underline">Перегляд</Link>
                      <span className="text-slate-400">·</span>
                      <Link href={`${base}/danger`} className="text-rose-700 hover:underline">Видалити</Link>
                    </div>
                  </div>

                  <div className="text-sm text-[#0F2E64]">{n(c.students_count, 0)}</div>
                  <div className="text-sm text-[#0F2E64]">{n(c.rating, 0).toFixed(1)} ★</div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`${base}/overview`} className="px-3 py-1.5 rounded-[10px] ring-1 ring-[#E5ECFF] text-sm">Керування</Link>
                    <Link href={`${base}/publish`} className="px-3 py-1.5 rounded-[10px] bg-[#1345DE] text-white text-sm">Публікація</Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white disabled:opacity-50"
              >
                ← Назад
              </button>
              <div className="px-3 py-2 text-[#0F2E64] font-semibold">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white disabled:opacity-50"
              >
                Далі →
              </button>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
