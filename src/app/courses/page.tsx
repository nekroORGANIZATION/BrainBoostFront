'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import http from '@/lib/http';
import { mediaUrl } from '@/lib/api';

type Course = {
  id: number;
  slug?: string;
  title: string;
  description?: string;
  image?: string | null;
  author: number | { id: number; username: string };
  author_username?: string;
  rating?: number | string | null;
  price?: number | string | null;
  language?: string;
  topic?: string;
  category?: number | { id: number; name: string } | null;
};

type Profile = {
  id: number;
  username: string;
  is_superuser: boolean;
  is_teacher: boolean;
};

type Category = { id: number; name: string };

const pageSize = 6;

export default function CourseListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL → початкові стейти
  const initialCategory = searchParams.get('category') ?? 'all';
  const initialLanguage = searchParams.get('language') ?? 'all';
  const initialOrdering = searchParams.get('ordering') ?? 'title';
  const initialSearch = searchParams.get('search') ?? '';
  const initialPage = Number(searchParams.get('page') ?? '1') || 1;

  // стейти
  const [me, setMe] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  const [sortBy, setSortBy] = useState(initialOrdering);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [languageFilter, setLanguageFilter] = useState(initialLanguage);
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const [error, setError] = useState<string | null>(null);

  // helper: чи я власник курсу
  function isOwner(course: Course) {
    const authorId =
      typeof course.author === 'number' ? course.author : course.author?.id;
    return !!me && !!authorId && me.id === authorId;
  }

  // URL синх
  const updateUrl = () => {
    const params = new URLSearchParams();
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (languageFilter !== 'all') params.set('language', languageFilter);
    if (sortBy && sortBy !== 'title') params.set('ordering', sortBy);
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (currentPage > 1) params.set('page', String(currentPage));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // профіль (новий коректний ендпоїнт)
  useEffect(() => {
    let cancelled = false;
    http
      .get('/accounts/api/profile/')
      .then((r) => {
        if (!cancelled) setMe(r.data as Profile);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // категорії (пробуємо /courses/all/categories/ → фолбек /courses/categories/)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await http.get('/courses/all/categories/');
        if (!cancelled) {
          const arr = Array.isArray(r.data?.results) ? r.data.results : r.data;
          setCategories(arr || []);
        }
      } catch {
        try {
          const r2 = await http.get('/courses/categories/');
          if (!cancelled) {
            const arr = Array.isArray(r2.data?.results) ? r2.data.results : r2.data;
            setCategories(arr || []);
          }
        } catch {
          // не критично
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // мови (простий спосіб — витягнути багато курсів і зібрати унікальні)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await http.get('/courses/', { params: { page_size: 200 } });
        const list: Course[] = (r.data?.results || r.data || []) as Course[];
        const langs = Array.from(
          new Set(list.map((c) => c.language).filter(Boolean))
        ) as string[];
        if (!cancelled) setLanguages(langs);
      } catch {
        // опціонально
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // курси
  useEffect(() => {
    let cancelled = false;
    setError(null);

    const params: Record<string, string | number | undefined> = {
      ordering: sortBy,
      page: currentPage,
      page_size: pageSize,
      search: searchTerm.trim() || undefined,
    };
    if (categoryFilter !== 'all') params['category__name'] = categoryFilter;
    if (languageFilter !== 'all') params['language'] = languageFilter;

    http
      .get('/courses/', { params })
      .then((r) => {
        if (cancelled) return;
        const list: Course[] = r.data?.results ?? r.data ?? [];
        // нормалізуємо медіа
        const normalized = list.map((c) => ({
          ...c,
          image: c.image ? mediaUrl(c.image) : null,
        }));
        setCourses(normalized);
        const count = Number(r.data?.count ?? normalized.length);
        setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
      })
      .catch(() => {
        if (!cancelled) setError('Не вдалося завантажити курси');
      });

    updateUrl();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, categoryFilter, languageFilter, searchTerm, currentPage]);

  // UI
  const renderStars = (ratingVal: number | string | null | undefined) => {
    const rating = Number(ratingVal) || 0;
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <span className="text-yellow-500 select-none">
        {'★'.repeat(full)}
        {half && '⯪'}
        {'☆'.repeat(empty)}
      </span>
    );
  };

  return (
    <div className="container">
      <h1 className="page-title">Курси</h1>

      <div className="content-wrapper">
        <aside className="sidebar">
          <h2>Фільтри</h2>

          <div className="filter-group">
            <label htmlFor="search">Пошук за назвою:</label>
            <input
              id="search"
              type="text"
              placeholder="Введіть назву…"
              value={searchTerm}
              onChange={(e) => {
                setCurrentPage(1);
                setSearchTerm(e.target.value);
              }}
              autoComplete="off"
            />
          </div>

          <div className="filter-group">
            <label>Категорія:</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCurrentPage(1);
                setCategoryFilter(e.target.value);
              }}
            >
              <option value="all">Усі категорії</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Мова:</label>
            <select
              value={languageFilter}
              onChange={(e) => {
                setCurrentPage(1);
                setLanguageFilter(e.target.value);
              }}
            >
              <option value="all">Усі мови</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Сортувати:</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setCurrentPage(1);
                setSortBy(e.target.value);
              }}
            >
              <option value="title">Назва</option>
              <option value="price">Ціна (зростання)</option>
              <option value="-price">Ціна (спадання)</option>
              <option value="rating">Рейтинг (зростання)</option>
              <option value="-rating">Рейтинг (спадання)</option>
              <option value="-created_at">Новіші</option>
              <option value="created_at">Старіші</option>
            </select>
          </div>
        </aside>

        <main className="main-content">
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

          <ul className="course-list">
            {courses.map((c) => {
              const price = Number(c.price ?? 0);
              const rating = Number(c.rating ?? 0);

              const canEdit = !!me && (me.is_superuser || isOwner(c));

              return (
                <li key={c.id} className="course-item">
                  {c.image && (
                    <div className="image-wrapper">
                      <img src={String(c.image)} alt={c.title} />
                    </div>
                  )}

                  <h2 className="course-title">{c.title}</h2>
                  <p className="course-description">
                    {c.description?.slice(0, 130)}
                    {c.description && c.description.length > 130 ? '…' : ''}
                  </p>

                  <div className="course-meta">
                    <span className="price">${price.toFixed(2)}</span>
                    <span className="rating">
                      {renderStars(rating)} ({rating.toFixed(1)})
                    </span>
                  </div>

                  <div className="btn-group">
                    <Link href={`/courses/${c.id}/details`} className="btn-details">
                      Деталі
                    </Link>

                    {canEdit && (
                      <>
                        <Link
                          href={`/courses/${c.id}/edit`}
                          className="btn-details"
                          style={{ background: 'linear-gradient(45deg, #f59e0b, #d97706)' }}
                        >
                          Редагувати
                        </Link>
                        <Link
                          href={`/courses/${c.id}/delete`}
                          className="btn-details"
                          style={{ background: 'linear-gradient(45deg, #ef4444, #b91c1c)' }}
                        >
                          Видалити
                        </Link>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/courses/create" className="btn btn-add-course">
              ➕ Додати курс
            </Link>
          </div>

          <section className="pagination">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              ←
            </button>
            <span>
              Сторінка {currentPage} з {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              →
            </button>
          </section>
        </main>
      </div>

      {/* стиль (твій базовий + трохи поліру) */}
      <style jsx>{`
        .container {
          max-width: 1100px;
          margin: 2rem auto;
          padding: 1rem 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: #eee3ffff;
          border-radius: 16px;
          box-shadow: 0 0 40px rgba(201, 132, 216, 0.25);
        }
        .page-title {
          text-align: center;
          font-size: 2.8rem;
          color: #5b21b6;
          margin-bottom: 3rem;
          text-shadow: 0 0 8px #db2777;
        }

        .content-wrapper {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .sidebar {
          flex: 0 0 280px;
          background: white;
          padding: 1.5rem 2rem;
          border-radius: 20px;
          box-shadow: 0 0 15px #a855f7, 0 0 30px #ec4899;
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          font-weight: 600;
          color: #4c1d95;
          height: fit-content;
          min-height: 300px;
        }
        .sidebar h2 {
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
          text-align: center;
          color: #7c3aed;
          text-shadow: 0 0 5px #db2777aa;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .filter-group label {
          font-weight: 700;
          font-size: 1rem;
          color: #6b21a8;
        }
        .filter-group select,
        .filter-group input[type='text'] {
          padding: 0.6rem 1rem;
          border-radius: 12px;
          border: 1px solid #ccc;
          font-size: 1rem;
          font-weight: 600;
          outline-color: #a855f7;
          transition: box-shadow 0.3s ease;
        }
        .filter-group select:hover,
        .filter-group input[type='text']:hover,
        .filter-group select:focus,
        .filter-group input[type='text']:focus {
          box-shadow: 0 0 8px #a855f7;
        }

        .main-content {
          flex: 1 1 auto;
        }

        .course-list {
          list-style: none;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
        }
        .course-item {
          background: white;
          border-radius: 20px;
          padding: 1.8rem 2rem;
          box-shadow: 0 0 15px #a855f7, 0 0 30px #ec4899;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .course-item:hover {
          transform: translateY(-8px);
          box-shadow: 0 0 30px #8b5cf6, 0 0 60px #f43f5e;
        }
        .image-wrapper {
          width: 100%;
          height: 160px;
          overflow: hidden;
          border-radius: 16px;
          margin-bottom: 1rem;
          background: #f3f4f6;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .image-wrapper img {
          max-width: 100%;
          max-height: 100%;
          object-fit: cover;
        }
        .course-title {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          color: #6b21a8;
          font-weight: 700;
        }
        .course-description {
          flex-grow: 1;
          color: #7c3aed;
          margin-bottom: 1.2rem;
          font-size: 1rem;
          line-height: 1.45;
          opacity: 0.9;
        }
        .course-meta {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 1.1rem;
          color: #5b21b6;
          margin-bottom: 1rem;
        }
        .price {
          color: #db2777;
        }
        .rating {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          color: #fbbf24;
          font-weight: 600;
        }
        .btn-details {
          align-self: flex-start;
          padding: 0.6rem 1.4rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          text-decoration: none;
          color: white;
          background: linear-gradient(45deg, #db2777, #9333ea);
          box-shadow: 0 4px 15px #db2777aa;
          user-select: none;
          transition: background-color 0.35s ease, box-shadow 0.35s ease;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .btn-details:hover {
          background: linear-gradient(45deg, #9333ea, #db2777);
          box-shadow: 0 6px 20px #f43f5ecc;
        }
        .btn-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: auto;
        }
        .btn.btn-add-course {
          background: #10b981;
          color: white;
          padding: 0.7rem 1.2rem;
          border-radius: 12px;
          font-weight: 700;
        }
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 3rem;
          font-weight: 600;
          color: #5b21b6;
        }
        .pagination button {
          background: #9333ea;
          border: none;
          border-radius: 12px;
          padding: 0.6rem 1.4rem;
          color: white;
          cursor: pointer;
          transition: background-color 0.3s ease;
          user-select: none;
        }
        .pagination button:disabled {
          background: #ccc;
          cursor: default;
        }

        @media (max-width: 900px) {
          .content-wrapper {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
}
