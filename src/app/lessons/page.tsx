'use client';

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';

/* ---------- Types ---------- */
interface Lesson {
  id: number;
  title: string;
  summary: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  duration_min: number;
  cover_image?: string | null;
}

/* ---------- UI Helpers ---------- */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: Lesson['status'] }) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    scheduled: 'bg-amber-100 text-amber-800',
    published: 'bg-emerald-100 text-emerald-800',
    archived: 'bg-red-100 text-red-700',
  };
  const label =
    status === 'published'
      ? 'Опубліковано'
      : status === 'scheduled'
      ? 'Заплановано'
      : status === 'archived'
      ? 'В архіві'
      : 'Чернетка';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>{label}</span>;
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[56px_1fr_120px_100px_150px] gap-4 items-center py-3">
      <div className="w-14 h-10 bg-slate-200 rounded-md animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="h-3 w-56 bg-slate-200 rounded animate-pulse" />
      </div>
      <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
      <div className="h-6 w-14 bg-slate-200 rounded animate-pulse" />
      <div className="h-8 w-28 bg-slate-200 rounded animate-pulse" />
    </div>
  );
}

/* ---------- Page ---------- */
export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const pageSize = 8;
  const [page, setPage] = useState(1);

  const getToken = (): string | null => {
    return (
      localStorage.getItem('access') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('access') ||
      sessionStorage.getItem('accessToken') ||
      null
    );
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Користувач не авторизований');
      setLoading(false);
      return;
    }

    const fetchLessons = async () => {
      try {
        const res = await axios.get('https://brainboost.pp.ua/api/api/lesson/admin/lessons/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLessons(res.data.results || []);
      } catch (err: any) {
        console.error(err);
        if (err.response?.status === 401) {
          setError('Неавторизований. Будь ласка, увійдіть у систему.');
        } else {
          setError('Помилка завантаження уроків');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  const totalPages = Math.max(1, Math.ceil(lessons.length / pageSize));
  const pageItems = useMemo(() => lessons.slice((page - 1) * pageSize, page * pageSize), [lessons, page]);

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top grid place-items-center">
        <Card className="w-[800px] max-w-[95vw]">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen grid place-items-center">
        <Card className="max-w-xl text-center">
          <h1 className="text-xl font-bold text-red-600">{error}</h1>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <section className="w-[1280px] max-w-[95vw] mx-auto pt-[100px] pb-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-bold text-[40px] md:text-[48px] text-[#021C4E]">Список уроків</h1>
          <Link
            href="/lessons/create"
            className="px-4 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold"
          >
            + Додати урок
          </Link>
        </div>

        <Card>
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[56px_1fr_120px_100px_150px] gap-4 text-xs font-semibold text-slate-600 pb-2 border-b">
            <div>Обкладинка</div>
            <div>Урок</div>
            <div>Статус</div>
            <div>Тривалість</div>
            <div>Дії</div>
          </div>

          {/* Rows */}
          <div className="divide-y">
            {pageItems.length === 0 ? (
              <div className="py-10 text-center text-slate-600">Немає уроків</div>
            ) : (
              pageItems.map((lesson) => (
                <div
                  key={lesson.id}
                  className="grid grid-cols-1 md:grid-cols-[56px_1fr_120px_100px_150px] gap-4 items-center py-3"
                >
                  <div className="w-14 h-10 rounded-md ring-1 ring-[#E5ECFF] bg-slate-100 overflow-hidden">
                    {lesson.cover_image ? (
                      <img
                        src={lesson.cover_image}
                        alt={lesson.title}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold text-[#0F2E64] truncate">{lesson.title}</div>
                    {lesson.summary && (
                      <div className="text-slate-600 text-sm truncate">
                        {lesson.summary.length > 100
                          ? lesson.summary.slice(0, 100) + '…'
                          : lesson.summary}
                      </div>
                    )}
                  </div>

                  <div>
                    <StatusPill status={lesson.status} />
                  </div>

                  <div className="text-sm text-[#0F2E64]">{lesson.duration_min} хв</div>

                  <div className="flex gap-2 flex-wrap">
                    <Link
                      href={`/lessons/${lesson.id}/details`}
                      className="px-3 py-1.5 rounded-[10px] bg-[#1345DE] text-white text-sm hover:bg-[#0F2E64]"
                    >
                      Деталі
                    </Link>
                    <Link
                      href={`/teacher/lessons/${lesson.id}/edit`}
                      className="px-3 py-1.5 rounded-[10px] bg-[#1345DE] text-white text-sm hover:bg-[#0F2E64]"
                    >
                      Редагувати
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
