'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import http from '@/lib/http';

type Profile = {
  id: number;
  username: string;
  is_superuser: boolean;
  is_teacher: boolean;
};

type Lesson = {
  id: number;
  title: string;
  description?: string;
  course?: number | { id: number; title?: string; name?: string };
  theories_count?: number;      // приходит из DRF-сериализатора
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
};

const pageSize = 10;

export default function TeacherLessonsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL -> initial
  const initialSearch   = searchParams.get('search')   ?? '';
  const initialOrdering = searchParams.get('ordering') ?? '-created_at';
  const initialStatus   = searchParams.get('status')   ?? 'all'; // all | published | draft
  const initialPage     = Number(searchParams.get('page') ?? '1') || 1;

  // state
  const [me, setMe] = useState<Profile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [ordering, setOrdering]     = useState(initialOrdering);
  const [status, setStatus]         = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const canUse = me?.is_teacher || me?.is_superuser;

  // sync URL
  const updateUrl = () => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (ordering && ordering !== '-created_at') params.set('ordering', ordering);
    if (status !== 'all') params.set('status', status);
    if (currentPage > 1) params.set('page', String(currentPage));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // load profile (у тебя аккаунты смонтированы на /accounts/)
  useEffect(() => {
    let cancelled = false;
    http
      .get('/accounts/api/profile/')
      .then((r) => !cancelled && setMe(r.data as Profile))
      .catch(() => !cancelled && setMe(null));
    return () => { cancelled = true; };
  }, []);

  // load my lessons — НОВЫЙ URL: /api/lesson/lessons/mine/
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Формируем DRF-параметры (без mine)
    const params: Record<string, string | number | boolean | undefined> = {
      page: currentPage,
      page_size: pageSize,
      ordering,
      search: searchTerm.trim() || undefined,
    };
    if (status === 'published') params['status'] = 'published';
    if (status === 'draft')     params['status'] = 'draft';
    if (status === 'all')       params['status'] = 'all';

    http
      .get('/api/lesson/lessons/mine/', { params })
      .then((r) => {
        if (cancelled) return;
        const list: Lesson[] = r.data?.results ?? r.data ?? [];
        setLessons(list);
        const count = Number(r.data?.count ?? list.length);
        setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
      })
      .catch(() => {
        if (!cancelled) setError('Не вдалося завантажити уроки');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    updateUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, ordering, status, currentPage]);

  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '—');
  const getCourseTitle = (c?: Lesson['course']) => {
    if (!c) return '—';
    if (typeof c === 'number') return `#${c}`;
    return c.title || c.name || `#${c.id}`;
  };

  return (
    <div className="container">
      <h1 className="page-title">Мої уроки</h1>

      {!me ? (
        <p className="muted">Щоб переглядати власні уроки, увійдіть у систему.</p>
      ) : !canUse ? (
        <p className="muted">Ця сторінка доступна лише для викладачів або адміністраторів.</p>
      ) : (
        <>
          {/* Toolbar */}
          <div className="toolbar">
            <div className="filters">
              <input
                type="text"
                placeholder="Пошук за назвою…"
                value={searchTerm}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSearchTerm(e.target.value);
                }}
              />
              <select
                value={status}
                onChange={(e) => {
                  setCurrentPage(1);
                  setStatus(e.target.value);
                }}
                aria-label="Статус"
              >
                <option value="all">Усі статуси</option>
                <option value="published">Опубліковані</option>
                <option value="draft">Чернетки</option>
              </select>
              <select
                value={ordering}
                onChange={(e) => {
                  setCurrentPage(1);
                  setOrdering(e.target.value);
                }}
                aria-label="Сортування"
              >
                <option value="-created_at">Новіші</option>
                <option value="created_at">Старіші</option>
                <option value="title">Назва (А→Я)</option>
                <option value="-title">Назва (Я→А)</option>
                <option value="-updated_at">Недавно змінені</option>
              </select>
            </div>

            <div className="actions">
              <Link href="/lessons/create" className="btn primary">➕ Створити урок</Link>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="loader">Завантаження…</div>
          ) : error ? (
            <p className="error">{error}</p>
          ) : lessons.length === 0 ? (
            <div className="empty">
              <p>У вас поки що немає уроків.</p>
              <Link href="/lessons/create" className="btn ghost">Створити перший урок</Link>
            </div>
          ) : (
            <ul className="grid">
              {lessons.map((l) => (
                <li key={l.id} className="card">
                  <div className="cardHead">
                    <span className={`badge ${l.is_published ? 'pub' : 'draft'}`}>
                      {l.is_published ? 'Опубліковано' : 'Чернетка'}
                    </span>
                    <span className="muted small">ID: {l.id}</span>
                  </div>

                  <h2 className="title">{l.title}</h2>

                  {l.description && (
                    <p className="desc">
                      {l.description.slice(0, 180)}
                      {l.description.length > 180 ? '…' : ''}
                    </p>
                  )}

                  <div className="meta">
                    <span>Курс: <b>{getCourseTitle(l.course)}</b></span>
                    <span>Теорій: <b>{l.theories_count ?? 0}</b></span>
                  </div>

                  <div className="dates">
                    <span>Створено: {fmt(l.created_at)}</span>
                    <span>Оновлено: {fmt(l.updated_at)}</span>
                  </div>

                  <div className="btnRow">
                    <Link href={`/lessons/${l.id}`} className="btn">Переглянути</Link>
                    <Link href={`/lessons/${l.id}/edit`} className="btn">Редагувати</Link>
                    <Link href={`/lessons/${l.id}/theories`} className="btn">Теорії</Link>
                    <Link href={`/lessons/${l.id}/questions`} className="btn">Питання</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          <section className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Попередня сторінка"
            >
              ←
            </button>
            <span>
              Сторінка {currentPage} з {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Наступна сторінка"
            >
              →
            </button>
          </section>
        </>
      )}

      <style jsx>{`
        .container {
          max-width: 1100px;
          margin: 2rem auto;
          padding: 1rem 2rem;
          background: #f8f5ff;
          border-radius: 16px;
          box-shadow: 0 0 40px rgba(201, 132, 216, 0.2);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        .page-title {
          text-align: center;
          font-size: 2.2rem;
          color: #5b21b6;
          margin-bottom: 1.2rem;
        }
        .muted { color: #6b7280; }
        .small { font-size: 0.85rem; }

        .toolbar {
          display: flex;
          gap: 1rem;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .filters {
          display: flex;
          gap: 0.6rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .filters input, .filters select {
          padding: 0.55rem 0.9rem;
          border: 1px solid #ddd;
          border-radius: 10px;
          font-weight: 600;
          outline-color: #a855f7;
          background: #fff;
        }
        .actions .btn.primary {
          background: linear-gradient(45deg, #db2777, #9333ea);
          color: #fff;
          padding: 0.6rem 1rem;
          border-radius: 10px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 15px #db277769;
        }

        .loader { text-align: center; color: #6b21a8; }
        .error { color: #ef4444; text-align: center; }
        .empty { text-align: center; margin: 2rem 0; }
        .btn.ghost {
          border: 1px dashed #a855f7;
          color: #6b21a8;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          text-decoration: none;
        }

        .grid {
          list-style: none;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        .card {
          background: #fff;
          border-radius: 16px;
          padding: 1rem 1.2rem;
          box-shadow: 0 0 14px rgba(168, 85, 247, 0.35), 0 0 26px rgba(236, 72, 153, 0.3);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .cardHead {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .badge.pub { background: #dcfce7; color: #065f46; }
        .badge.draft { background: #fee2e2; color: #991b1b; }

        .title {
          font-size: 1.2rem;
          color: #6b21a8;
          font-weight: 800;
        }
        .desc { color: #7c3aed; opacity: 0.95; min-height: 2.2em; }
        .meta, .dates {
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
          color: #4c1d95;
          font-weight: 600;
        }
        .btnRow {
          margin-top: 0.4rem;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .btnRow .btn {
          background: #9333ea;
          color: #fff;
          padding: 0.5rem 0.9rem;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 1.4rem;
          font-weight: 700;
          color: #5b21b6;
        }
        .pagination button {
          background: #9333ea;
          border: none;
          border-radius: 10px;
          padding: 0.5rem 1rem;
          color: #fff;
          cursor: pointer;
        }
        .pagination button:disabled { background: #c7c7c7; }

        @media (max-width: 900px) {
          .toolbar { flex-direction: column; align-items: stretch; }
          .filters { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
