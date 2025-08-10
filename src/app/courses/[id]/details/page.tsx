'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Course = {
  id: number;
  title: string;
  description: string;
  author_username: string;
  language: string;
  topic?: string;
  price: number | string;
  rating: number | string;
  image?: string | null;
};

type User = {
  id: number | null;
  isAdmin: boolean;
  username: string | null;
};

type Comment = {
  id: number;
  text: string;
  author_username: string;
  created_at: string;
};

export default function CourseDetail() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<User>({
    id: null,
    isAdmin: false,
    username: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  
  const [commentText, setCommentText] = useState('');
  const [editCommentId, setEditCommentId] = useState<number | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  // Отримуємо користувача через API
  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://172.17.10.22:8000/courses/all/users/me/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser({
        id: res.data.id,
        isAdmin: res.data.is_admin,
        username: res.data.username,
      });
    } catch (err) {
      console.error('Помилка отримання користувача:', err);
      setUser({ id: null, isAdmin: false, username: null });
    }
  };

  useEffect(() => {
    if (!courseId) return;

    setLoading(true);

    Promise.all([
      axios.get(`http://127.0.0.1:8000/courses/${courseId}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
      fetchUser(),
    ])
      .then(([courseRes]) => {
        setCourse(courseRes.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Не вдалося завантажити курс');
        setLoading(false);
      });
  }, [courseId, token]);

  const loadComments = () => {
    if (!courseId) return;
    setLoadingComments(true);
    axios
      .get(`http://127.0.0.1:8000/courses/${courseId}/comments/`)
      .then(res => {
        setComments(Array.isArray(res.data.results) ? res.data.results : []);
      })
      .catch(err => {
        console.error('Помилка завантаження коментарів:', err);
        setComments([]);
      })
      .finally(() => setLoadingComments(false));
  };

  useEffect(() => {
    loadComments();
  }, [courseId]);

  // Перевірка прав на редагування курсу
  const canEditCourse =
    user.isAdmin ||
    (user.username?.trim().toLowerCase() === course?.author_username?.trim().toLowerCase());

  // Перевірка прав на редагування/видалення коментаря
  const canModifyComment = (comment: Comment) => {
    return (
      user.isAdmin ||
      user.username?.trim().toLowerCase() === comment.author_username.trim().toLowerCase()
    );
  };

  // Додавання або оновлення коментаря
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return alert('Введіть текст коментаря');
    if (!token) return router.push('/login');

    try {
      if (editCommentId) {
        // Оновлення коментаря
        await axios.put(
          `http://127.0.0.1:8000/courses/${courseId}/comments/${editCommentId}/`,
          { text: commentText },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEditCommentId(null);
      } else {
        // Додавання нового коментаря
        await axios.post(
          `http://127.0.0.1:8000/courses/${courseId}/comments/`,
          { text: commentText },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }
      setCommentText('');
      loadComments();
    } catch {
      alert('Помилка при збереженні коментаря');
    }
  };

  // Почати редагування коментаря
  const startEditComment = (comment: Comment) => {
    setEditCommentId(comment.id);
    setCommentText(comment.text);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Прокрутка до форми
  };

  // Скасувати редагування коментаря
  const cancelEdit = () => {
    setEditCommentId(null);
    setCommentText('');
  };

  // Видалити коментар
  const handleDeleteComment = async (commentId: number) => {
    if (!token) return router.push('/login');
    if (!confirm('Ви впевнені, що хочете видалити цей коментар?')) return;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/courses/${courseId}/comments/${commentId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadComments();
    } catch {
      alert('Помилка при видаленні коментаря');
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Завантаження...</p>;
  if (error) return <p style={{ textAlign: 'center', marginTop: '2rem', color: 'red' }}>{error}</p>;
  if (!course) return null;

  const canEdit =
    user.isAdmin ||
    (user.username?.trim().toLowerCase() === course.author_username?.trim().toLowerCase());

  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (!token) {
      e.preventDefault();
      router.push('/login');
    }
  };

  return (
    <>
      <main className="container">
        <h1 className="title">{course.title}</h1>

        {course.image && (
          <div className="image-wrapper">
            <img src={course.image} alt={course.title} />
          </div>
        )}

        <div className="info">
          <p className="description">{course.description}</p>

          <ul className="details-list">
            <li><strong>Автор:</strong> {course.author_username || 'Невідомий'}</li>
            <li><strong>Мова:</strong> {course.language}</li>
            {course.topic && <li><strong>Тема:</strong> {course.topic}</li>}
            <li><strong>Ціна:</strong> ${Number(course.price).toFixed(2)}</li>
            <li><strong>Рейтинг:</strong> {Number(course.rating).toFixed(2)}</li>
          </ul>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {canEdit && (
              <>
                <Link
                  href={`/courses/${course.id}/edit`}
                  className="btn btn-edit-course"
                >
                  ✏️ Редагувати
                </Link>
                <Link
                  href={`/courses/${course.id}/delete`}
                  className="btn btn-delete-course"
                >
                  🗑️ Видалити
                </Link>
                <Link
                  href="/lessons/create"
                  className="btn btn-add-lesson"
                >
                  + Додати урок
                </Link>
              </>
            )}
            <Link
              href={`/checkout/${course.id}`}
              onClick={handleCheckoutClick}
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              💳 Перейти до оформлення
            </Link>
          </div>
        </div>

        <section className="comments-section">
          <h2>Коментарі</h2>

          {user.id ? (
            <div className="comment-form">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={4}
                placeholder="Напишіть коментар"
              />
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  onClick={handleSubmitComment}
                  className="btn-submit"
                >
                  {editCommentId ? 'Оновити' : 'Додати'}
                </button>
                {editCommentId && (
                  <button onClick={cancelEdit} className="btn-cancel">
                    Скасувати
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p>
              <Link href="/login" className="login-link">
                Увійдіть
              </Link>{' '}
              щоб додати коментар.
            </p>
          )}

          {loadingComments ? (
            <p>Завантаження коментарів...</p>
          ) : comments.length === 0 ? (
            <p>Коментарі відсутні.</p>
          ) : (
            <ul className="comments-list">
              {comments.map(comment => (
                <li key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <strong>{comment.author_username}</strong>{' '}
                    <span className="comment-date">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="comment-content">{comment.text}</p>
                  <br/>
                  {canModifyComment(comment) && (
                    <div className="comment-actions">
                      <button
                        onClick={() => startEditComment(comment)}
                        className="btn-edit"
                        aria-label="Редагувати коментар"
                        type="button"
                      >
                        ✏️ Редагувати
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="btn-delete"
                        aria-label="Видалити коментар"
                        type="button"
                      >
                        🗑️ Видалити
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 3rem auto;
          padding: 2rem 2.5rem;
          background-color: #f0f4f8;
          border-radius: 20px;
          box-shadow: 0 8px 20px rgba(100, 100, 150, 0.1),
            0 4px 10px rgba(100, 100, 150, 0.05);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          color: #334155;
        }

        .title {
          font-size: 2.8rem;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 1.5rem;
          text-align: center;
          text-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
        }

        .image-wrapper {
          width: 100%;
          max-height: 350px;
          overflow: hidden;
          border-radius: 18px;
          margin-bottom: 2rem;
          box-shadow: 0 8px 16px rgba(75, 85, 99, 0.15);
          display: flex;
          justify-content: center;
          align-items: center;
          background: white;
        }

        .image-wrapper img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 18px;
        }

        .info {
          font-size: 1.1rem;
          line-height: 1.6;
        }

        .description {
          margin-bottom: 2rem;
          color: #475569;
        }

        .details-list {
          list-style: none;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem 2rem;
          font-weight: 600;
          color: #334155;
        }

        .details-list li {
          background: white;
          padding: 0.8rem 1.2rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
          transition: box-shadow 0.3s ease;
        }

        .details-list li:hover {
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
        }

        /* Коментарі */

        .comments-section {
          margin-top: 4rem;
        }

        .comments-section h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #2563eb;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 0.3rem;
        }

        .comment-form textarea {
          width: 100%;
          border-radius: 10px;
          border: 1px solid #94a3b8;
          padding: 0.8rem 1rem;
          font-size: 1rem;
          resize: vertical;
          font-family: inherit;
          color: #334155;
        }

        .btn-submit,
        .btn-cancel {
          padding: 0.5rem 1rem;
          margin-right: 0.5rem;
          border-radius: 8px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.2s ease;
        }

        .btn-submit {
          background-color: #2563eb;
          color: white;
        }
        .btn-submit:hover {
          background-color: #1e40af;
        }

        .btn-cancel {
          background-color: #9ca3af;
          color: white;
        }
        .btn-cancel:hover {
          background-color: #6b7280;
        }

        .login-link {
          color: #2563eb;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
        }

        .comments-list {
          list-style: none;
          padding: 0;
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .comment-item {
          position: relative;
          padding: 1.5rem 1.5rem 1.5rem 1.5rem;
          background-color: #f8fafc;
          border-radius: 0.75rem;
          margin-bottom: 1rem;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          padding-top: 3.5rem; /* більший верхній відступ — щоб кнопки не перекривали */
        }

        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          font-size: 0.95rem;
          color: #334155;
          margin-bottom: 0.4rem;
        }

        .comment-date {
          font-weight: 400;
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .comment-content {
          font-size: 1rem;
          color: #1e293b;
          white-space: pre-wrap;
        }

        .comment-actions {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.5rem;
          z-index: 10;
        }

        .btn {
          display: inline-block;
          padding: 0.5rem 1.2rem;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          transition: background-color 0.2s ease;
          user-select: none;
          cursor: pointer;
          font-size: 1rem;
        }

        /* Редагування курсу */
        .btn-edit-course {
          background-color: #fbbf24;
          color: #92400e;
          border: 1.5px solid #fbbf24;
        }
        .btn-edit-course:hover {
          background-color: #f59e0b;
          color: white;
          border-color: #d97706;
        }

        /* Видалення курсу */
        .btn-delete-course {
          background-color: #ef4444;
          color: white;
          border: 1.5px solid #ef4444;
        }
        .btn-delete-course:hover {
          background-color: #dc2626;
          border-color: #b91c1c;
          color: white;
        }

        /* Додавання уроку */
        .btn-add-lesson {
          background-color: #3b82f6;
          color: white;
          border: 1.5px solid #3b82f6;
        }
        .btn-add-lesson:hover {
          background-color: #2563eb;
          border-color: #1d4ed8;
          color: white;
        }

        /* Кнопки редагування/видалення коментарів */
        .btn-edit,
        .btn-delete {
          padding: 6px 12px;
          font-size: 0.9rem;
          border-radius: 6px;
          border: 1.5px solid transparent;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
          user-select: none;
          background-color: transparent;
          color: #334155;
          border-color: transparent;
        }

        /* Редагування коментаря */
        .btn-edit {
          background-color: #fbbf24;
          color: #92400e;
          border-color: #fbbf24;
        }
        .btn-edit:hover {
          background-color: #f59e0b;
          color: white;
          border-color: #d97706;
        }

        /* Видалення коментаря */
        .btn-delete {
          background-color: #ef4444;
          color: white;
          border-color: #ef4444;
        }
        .btn-delete:hover {
          background-color: #dc2626;
          border-color: #b91c1c;
          color: white;
        }

      `}</style>
    </>
  );
}
