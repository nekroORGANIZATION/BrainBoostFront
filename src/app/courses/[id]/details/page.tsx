'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import http from '@/lib/http';
import { mediaUrl } from '@/lib/api';
import { API_BASE } from '@/lib/http';

type Course = {
  id: number;
  slug?: string;
  title: string;
  description?: string;
  image?: string | null;
  author: number | { id: number; username: string };
  author_username?: string;
  language?: string;
  topic?: string;
  price?: number | string | null;
  rating?: number | string | null;
};

type Me = { id: number; username: string; is_superuser: boolean; is_teacher: boolean };

type Comment = {
  id: number;
  text: string;
  author_username: string;
  created_at: string;
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const raw = Array.isArray(params?.id) ? params?.id[0] : String(params?.id || '');
  const isNumeric = /^\d+$/.test(raw);

  const [me, setMe] = useState<Me | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  // ----- helpers
  async function loadCourseByIdOrSlug(idOrSlug: string) {
    // 1) /courses/<id>/
    try {
      const r = await http.get(`/courses/${idOrSlug}/`);
      return r.data as Course;
    } catch (e: any) {
      // 2) /courses/all/<id>/
      try {
        const r2 = await http.get(`/courses/all/${idOrSlug}/`);
        return r2.data as Course;
      } catch {
        // 3) by-slug ендпоїнт (якщо додано)
        try {
          const r3 = await fetch(`${API_BASE}/courses/by-slug/${encodeURIComponent(idOrSlug)}/`, { cache: 'no-store' });
          if (r3.ok) return (await r3.json()) as Course;
        } catch {}

        // 4) фолбек: тягнемо список і шукаємо по slug
        const r4 = await fetch(`${API_BASE}/courses/?page_size=200`, { cache: 'no-store' });
        const j = await r4.json();
        const arr: Course[] = Array.isArray(j) ? j : (j?.results || []);
        const found = arr.find((c) => c.slug === idOrSlug);
        if (!found) throw new Error('Курс не знайдено.');
        return found;
      }
    }
  }

  async function loadComments(courseId: number) {
    setLoadingComments(true);
    try {
      const r = await http.get(`/courses/${courseId}/comments/`);
      const list = Array.isArray(r.data?.results) ? r.data.results : r.data || [];
      setComments(list);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }

  function isOwner(c: Course): boolean {
    const authorId = typeof c.author === 'number' ? c.author : c.author?.id;
    return !!me && !!authorId && me.id === authorId;
  }

  // ----- load me + course
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // профіль
        try {
          const meRes = await http.get('/accounts/api/profile/');
          if (!cancelled) setMe(meRes.data as Me);
        } catch {
          if (!cancelled) setMe(null);
        }

        // курс
        const data = await loadCourseByIdOrSlug(raw);
        const normalized: Course = {
          ...data,
          image: data.image ? mediaUrl(data.image) : null,
        };
        if (!cancelled) {
          setCourse(normalized);
          // коментарі
          await loadComments(normalized.id);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Не вдалося завантажити курс');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [raw]);

  // ----- comments actions
  async function saveComment() {
    if (!course) return;
    if (!commentText.trim()) return alert('Введіть текст коментаря');

    try {
      if (editId) {
        await http.put(`/courses/${course.id}/comments/${editId}/`, { text: commentText });
        setEditId(null);
      } else {
        await http.post(`/courses/${course.id}/comments/`, { text: commentText });
      }
      setCommentText('');
      await loadComments(course.id);
    } catch {
      alert('Помилка при збереженні коментаря');
    }
  }

  async function deleteComment(cid: number) {
    if (!course) return;
    if (!confirm('Видалити коментар?')) return;
    try {
      await http.delete(`/courses/${course.id}/comments/${cid}/`);
      await loadComments(course.id);
    } catch {
      alert('Помилка при видаленні коментаря');
    }
  }

  const canEditCourse = useMemo(() => {
    if (!course) return false;
    return !!me && (me.is_superuser || isOwner(course));
  }, [me, course]);

  if (loading) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Завантаження…</p>;
  if (err) return <p style={{ textAlign: 'center', marginTop: '2rem', color: 'red' }}>{err}</p>;
  if (!course) return null;

  return (
    <>
      <main className="container">
        <h1 className="title">{course.title}</h1>

        {!!course.image && (
          <div className="image-wrapper">
            <img src={String(course.image)} alt={course.title} />
          </div>
        )}

        <div className="info">
          <p className="description">{course.description}</p>
          <ul className="details-list">
            <li><strong>Автор:</strong> {course.author_username || (typeof course.author === 'object' ? course.author?.username : '—')}</li>
            {course.language && <li><strong>Мова:</strong> {course.language}</li>}
            {course.topic && <li><strong>Тема:</strong> {course.topic}</li>}
            {course.price != null && <li><strong>Ціна:</strong> ${Number(course.price).toFixed(2)}</li>}
            {course.rating != null && <li><strong>Рейтинг:</strong> {Number(course.rating).toFixed(2)}</li>}
          </ul>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {canEditCourse && (
              <>
                <Link href={`/courses/${course.id}/edit`} className="btn btn-edit-course">✏️ Редагувати</Link>
                <Link href={`/courses/${course.id}/delete`} className="btn btn-delete-course">🗑️ Видалити</Link>
                <Link href="/lessons/create" className="btn btn-add-lesson">+ Додати урок</Link>
              </>
            )}
            <Link href={`/checkout/${course.id}`} className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              💳 Перейти до оформлення
            </Link>
          </div>
        </div>

        <section className="comments-section">
          <h2>Коментарі</h2>

          {me ? (
            <div className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                placeholder="Напишіть коментар"
              />
              <div style={{ marginTop: '0.5rem' }}>
                <button onClick={saveComment} className="btn-submit">
                  {editId ? 'Оновити' : 'Додати'}
                </button>
                {editId && (
                  <button onClick={() => { setEditId(null); setCommentText(''); }} className="btn-cancel">
                    Скасувати
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p>Щоб додати коментар — <Link href="/login" className="login-link">Увійдіть</Link>.</p>
          )}

          {loadingComments ? (
            <p>Завантаження коментарів…</p>
          ) : comments.length === 0 ? (
            <p>Коментарів поки немає.</p>
          ) : (
            <ul className="comments-list">
              {comments.map((c) => {
                const can = !!me && (me.is_superuser || me.username?.toLowerCase() === c.author_username.toLowerCase());
                return (
                  <li key={c.id} className="comment-item">
                    <div className="comment-header">
                      <strong>{c.author_username}</strong>
                      <span className="comment-date">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className="comment-content">{c.text}</p>
                    {can && (
                      <div className="comment-actions">
                        <button className="btn-edit" onClick={() => { setEditId(c.id); setCommentText(c.text); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>✏️ Редагувати</button>
                        <button className="btn-delete" onClick={() => deleteComment(c.id)}>🗑️ Видалити</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <style jsx>{`
        .container {
          max-width: 860px;
          margin: 3rem auto;
          padding: 2rem 2.5rem;
          background-color: #f0f4f8;
          border-radius: 20px;
          box-shadow: 0 8px 20px rgba(100, 100, 150, 0.1), 0 4px 10px rgba(100, 100, 150, 0.05);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          color: #334155;
        }
        .title { font-size: 2.8rem; font-weight: 700; color: #3b82f6; margin-bottom: 1.5rem; text-align: center; }
        .image-wrapper { width: 100%; max-height: 360px; overflow: hidden; border-radius: 18px; margin-bottom: 2rem; background: white; display:flex; align-items:center; justify-content:center; }
        .image-wrapper img { max-width:100%; max-height:100%; object-fit:contain; }
        .info { font-size: 1.1rem; line-height: 1.6; }
        .description { margin-bottom: 1.6rem; color: #475569; }
        .details-list { list-style: none; padding: 0; display:grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 10px 16px; }
        .details-list li { background:white; padding:0.8rem 1.2rem; border-radius:12px; box-shadow:0 2px 8px rgba(59,130,246,0.1); }
        .comments-section { margin-top: 2.2rem; }
        .comments-section h2 { font-size: 1.8rem; margin-bottom: 0.8rem; color:#2563eb; border-bottom:2px solid #2563eb; padding-bottom:4px; }
        .comment-form textarea { width:100%; border-radius:10px; border:1px solid #94a3b8; padding:0.8rem 1rem; font-size:1rem; resize:vertical; }
        .btn-submit, .btn-cancel { padding: 0.5rem 1rem; margin-right: 0.5rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; font-size: 1rem; }
        .btn-submit { background:#2563eb; color:#fff; } .btn-submit:hover{ background:#1e40af; }
        .btn-cancel { background:#9ca3af; color:#fff; } .btn-cancel:hover{ background:#6b7280; }
        .login-link { color:#2563eb; font-weight:600; text-decoration:underline; }
        .comments-list { list-style:none; padding:0; margin-top:1rem; display:flex; flex-direction:column; gap:1rem; }
        .comment-item { position:relative; padding:1.25rem; background:#f8fafc; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.05); padding-top:3.2rem; }
        .comment-header { display:flex; justify-content:space-between; color:#334155; font-weight:600; }
        .comment-date { color:#94a3b8; font-weight:400; }
        .comment-actions { position:absolute; top:0.6rem; right:0.6rem; display:flex; gap:0.4rem; }
        .btn-edit, .btn-delete { padding:6px 12px; border-radius:6px; font-weight:600; border:1.5px solid transparent; cursor:pointer; }
        .btn-edit { background:#fbbf24; color:#92400e; border-color:#fbbf24; } .btn-edit:hover{ background:#f59e0b; color:#fff; }
        .btn-delete { background:#ef4444; color:#fff; border-color:#ef4444; } .btn-delete:hover{ background:#dc2626; }
        .btn { display:inline-block; padding:0.5rem 1.2rem; border-radius:8px; font-weight:700; text-decoration:none; }
        .btn-edit-course { background:#fbbf24; color:#92400e; border:1.5px solid #fbbf24; }
        .btn-delete-course { background:#ef4444; color:#fff; border:1.5px solid #ef4444; }
        .btn-add-lesson { background:#3b82f6; color:#fff; border:1.5px solid #3b82f6; }
      `}</style>
    </>
  );
}
