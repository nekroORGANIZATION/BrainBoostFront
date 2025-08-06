'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Course {
  id: number;
  title: string;
  image: string;
  author: number;
  rating: number;
  price: number;
  description?: string;
  category?: string;
  language?: string;
}

interface User {
  id: number;
  isAdmin: boolean;
}

interface Category {
  id: number;
  name: string;
}

const pageSize = 6;

const CourseList = () => {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [sortBy, setSortBy] = useState<string>('title');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;

  const axiosConfig = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://127.0.0.1:8000/courses/all/users/me/', axiosConfig);
      setUser({
        id: res.data.id,
        isAdmin: res.data.is_admin,
      });
    } catch (err) {
      console.error('Помилка отримання користувача:', err);
      setUser(null);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/courses/all/categories/');
      setCategories(res.data.results);
    } catch (err) {
      console.error('Не вдалося завантажити категорії:', err);
    }
  };

  const fetchLanguages = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/courses/all/?page=1&page_size=1000');
      const allCourses: Course[] = res.data.results;
      const langs = Array.from(new Set(allCourses.map(c => c.language).filter(Boolean))) as string[];
      setLanguages(langs);
    } catch (err) {
      console.error('Помилка отримання мов:', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const params: any = {
        ordering: sortBy,
        page: currentPage,
        search: searchTerm.trim() || undefined,
      };
      if (categoryFilter !== 'all') params['category__name'] = categoryFilter;
      if (languageFilter !== 'all') params['language'] = languageFilter;

      const res = await axios.get('http://127.0.0.1:8000/courses/all/', {
        params,
        ...axiosConfig,
      });

      setCourses(res.data.results);
      setTotalPages(Math.ceil(res.data.count / pageSize));
      setError(null);
    } catch (err) {
      console.error('Помилка при завантаженні курсів:', err);
      setError('Не вдалося завантажити курси');
    }
  };

  const handleDelete = async (courseId: number) => {
    if (!token) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/courses/${courseId}/`, axiosConfig);
      fetchCourses();
    } catch (err) {
      console.error('Помилка видалення курсу:', err);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <span className="text-yellow-500">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '⯪'}
        {'☆'.repeat(emptyStars)}
      </span>
    );
  };

  useEffect(() => {
    fetchUser();
    fetchCategories();
    fetchLanguages();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchCourses();
  }, [sortBy, categoryFilter, languageFilter, searchTerm]);

  useEffect(() => {
    fetchCourses();
  }, [currentPage]);

  return (
    <div className="container">
      <h1 className="page-title">Курси</h1>

      <div className="content-wrapper">
        <aside className="sidebar">
          <h2>Фільтри</h2>

          <div className="filter-group">
            <label htmlFor="search">Пошук за назвою:</label>
            <input
              type="text"
              id="search"
              placeholder="Введіть назву..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="filter-group">
            <label>Категорія:</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">Усі категорії</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Мова:</label>
            <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}>
              <option value="all">Усі мови</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Сортувати:</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="title">Назва</option>
              <option value="price">Ціна (зростання)</option>
              <option value="-price">Ціна (спадання)</option>
              <option value="rating">Рейтинг (зростання)</option>
              <option value="-rating">Рейтинг (спадання)</option>
            </select>
          </div>
        </aside>

        <main className="main-content">
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

          <ul className="course-list">
            {courses.map(course => (
              <li key={course.id} className="course-item">
                {course.image && (
                  <div className="image-wrapper">
                    <img src={course.image} alt={course.title} />
                  </div>
                )}

                <h2 className="course-title">{course.title}</h2>
                <p className="course-description">{course.description?.slice(0, 120)}...</p>
                <div className="course-meta">
                  <span className="price">${Number(course.price).toFixed(2)}</span>
                  <span className="rating">
                    {renderStars(course.rating)} ({course.rating})
                  </span>
                </div>

                <div className="btn-group">
                  <Link href={`/courses/${course.id}/details`} className="btn-details">
                    Деталі
                  </Link>

                  {(user?.isAdmin || user?.id === course.author) && (
                    <Link href={`/courses/${course.id}/edit`} className="btn-details text-blue-600">
                      Редагувати
                    </Link>
                  )}

                  {user?.isAdmin && (
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="btn-details text-red-600"
                    >
                      Видалити
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/courses/create" className="btn btn-add-course">
              ➕ Додати курс
            </Link>
          </div>

          <section className="pagination">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
              ←
            </button>
            <span>
              Сторінка {currentPage} з {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              →
            </button>
          </section>
        </main>
      </div>

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
          cursor: pointer;
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
          margin-bottom: 1.5rem;
          font-size: 1rem;
          line-height: 1.4;
          opacity: 0.85;
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

        /* Адаптивність */
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
};

export default CourseList;
