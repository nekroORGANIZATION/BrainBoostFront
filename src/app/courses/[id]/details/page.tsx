'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import http, { API_BASE } from '@/lib/http';
import { mediaUrl } from '@/lib/media';

type Course = {
  id: number;
  slug?: string;
  title: string;
  description?: string;
  image?: string | null;
  author: number | { id: number; username: string };
  author_username?: string;

  // === NEW: язык может приходить как id | строка | объект ===
  language?: number | string | { id: number; name?: string; title?: string; code?: string; slug?: string };

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

type WishlistItem = {
  id: number;
  course: { id: number };
  created_at: string;
};

// === NEW: тип языка + мапа ===
type Language = { id: number; name?: string; title?: string; code?: string; slug?: string };
type LanguagesMap = Record<number, string>;

export default function CourseDetailPage() {
  const params = useParams();
  const raw = Array.isArray(params?.id) ? params?.id[0] : String(params?.id || '');

  const [me, setMe] = useState<Me | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  // wishlist
  const [isFav, setIsFav] = useState(false);
  const [addingFav, setAddingFav] = useState(false);

  // === NEW: кэш словаря языков ===
  const [languagesMap, setLanguagesMap] = useState<LanguagesMap>({});

  // --- helpers ---
  async function loadCourseByIdOrSlug(idOrSlug: string) {
    try {
      const r = await http.get(`/courses/${idOrSlug}/`);
      return r.data as Course;
    } catch {
      try {
        const r2 = await http.get(`/courses/all/${idOrSlug}/`);
        return r2.data as Course;
      } catch {
        try {
          const r3 = await fetch(`${API_BASE}/courses/by-slug/${encodeURIComponent(idOrSlug)}/`, { cache: 'no-store' });
          if (r3.ok) return (await r3.json()) as Course;
        } catch {}
        const r4 = await fetch(`${API_BASE}/courses/?page_size=200`, { cache: 'no-store' });
        const j = await r4.json();
        const arr: Course[] = Array.isArray(j) ? j : j?.results || [];
        const found = arr.find((c) => (c as unknown).slug === idOrSlug);
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

  // === NEW: загрузка словаря языков с возможных эндпоинтов ===
  async function loadLanguagesDict(): Promise<LanguagesMap> {
    // Пробуем несколько путей — подстройся под свой бэкенд:
    const endpoints = [
      '/courses/languages/',            // вариант 1
      '/api/languages/',                // вариант 2
      '/courses/language/',             // вариант 3
      '/course/languages/',             // вариант 4
    ];

    for (const ep of endpoints) {
      try {
        const r = await http.get(ep);
        const raw = Array.isArray(r.data?.results) ? r.data.results : r.data;
        if (!raw) continue;
        const arr: Language[] = Array.isArray(raw) ? raw : [];
        if (!arr.length) continue;

        const map: LanguagesMap = {};
        for (const it of arr) {
          if (typeof it?.id === 'number') {
            map[it.id] = (it.name || it.title || it.code || it.slug || String(it.id)).toString();
          }
        }
        if (Object.keys(map).length) return map;
      } catch {
        // пробуем следующий
      }
    }
    return {};
  }

  // --- init ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // profile (optional)
        try {
          const meRes = await http.get('/accounts/api/profile/');
          if (!cancelled) setMe(meRes.data as Me);
        } catch {
          if (!cancelled) setMe(null);
        }

        // === NEW: параллельно грузим словарь языков, чтобы к моменту рендера он уже был ===
        const [data, langDict] = await Promise.all([
          loadCourseByIdOrSlug(raw),
          loadLanguagesDict().catch(() => ({})),
        ]);

        if (!cancelled && langDict) setLanguagesMap(langDict);

        const normalized: Course = { ...data, image: data.image ? mediaUrl(data.image) : null };
        if (!cancelled) {
          setCourse(normalized);
          await loadComments(normalized.id);

          // check wishlist
          try {
            const w = await http.get('/courses/me/wishlist/');
            const items: WishlistItem[] = Array.isArray(w.data?.results) ? w.data.results : w.data || [];
            const exists = items.some((it) => it?.course?.id === normalized.id);
            setIsFav(exists);
          } catch {
            // ignore wishlist error
          }
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Не вдалося завантажити курс');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [raw]);

  // === NEW: функция извлечения красивого отображения языка ===
  function extractLanguageLabel(lang: Course['language']): string {
    if (lang == null) return '—';

    // Если объект: берем name > title > code > slug > id
    if (typeof lang === 'object') {
      const obj = lang as unknown;
      return (
        obj.name ||
        obj.title ||
        obj.code ||
        obj.slug ||
        (typeof obj.id === 'number' ? languagesMap[obj.id] || `#${obj.id}` : '—')
      ) as string;
    }

    // Если число: ищем в словаре языков
    if (typeof lang === 'number') {
      return languagesMap[lang] || `#${lang}`;
    }

    // Если строка: возможно это уже имя или код; если это число в строке — попробуем словарь
    const asNum = Number(lang);
    if (!Number.isNaN(asNum) && String(asNum) === String(lang)) {
      return languagesMap[asNum] || `#${asNum}`;
    }
    return lang; // уже человекочитаемое значение
  }

  // === NEW: мемоизированная "красивая" метка языка ===
  const languageLabel = useMemo(() => extractLanguageLabel(course?.language), [course?.language, languagesMap]);

  // --- wishlist toggle ---
  async function toggleFavorite() {
    if (!course) return;
    if (!me) {
      return alert('Щоб керувати обраним — увійдіть у профіль.');
    }
    try {
      setAddingFav(true);
      if (isFav) {
        await http.delete(`/courses/me/wishlist/${course.id}/`);
        setIsFav(false);
      } else {
        await http.post('/courses/me/wishlist/', { course_id: course.id });
        setIsFav(true);
      }
    } catch (e) {
      alert(e?.response?.data?.detail || 'Не вдалося оновити обране');
    } finally {
      setAddingFav(false);
    }
  }

  // --- comments actions ---
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
      <main className="page">
        <div className="card">
          <h1 className="title">{course.title}</h1>

          {!!course.image && (
            <div className="image">
              <img src={String(course.image)} alt={course.title} />
            </div>
          )}

          <p className="lead">
            Якщо вам подобається creating visually appealing designs, using advanced design software
            та співпраця з іншими креаторами — ця спеціальність вам підійде.
          </p>

          <div className="infoRow">
            <div className="pill">
              <span className="pillLabel">Автор:</span>
              <span className="pillValue">
                {course.author_username || (typeof course.author === 'object' ? course.author?.username : '—')}
              </span>
            </div>
            <div className="pill">
              <span className="pillLabel">Мова:</span>
              {/* === NEW: показываем красивое имя языка === */}
              <span className="pillValue">{languageLabel || '—'}</span>
            </div>
            <div className="pill">
              <span className="pillLabel">Тема:</span>
              <span className="pillValue">{course.topic || '—'}</span>
            </div>
          </div>

          {course.price != null && (
            <div className="pricePill">
              <span className="pillLabel">Ціна:</span>
              <span className="pillValue">${Number(course.price).toFixed(2)}</span>
            </div>
          )}

          {/* actions */}
          <div className="actions">
            <Link href={`/checkout/${course.id}`} className="payBtn">Перейти до оформлення</Link>

            <button
              onClick={toggleFavorite}
              className="favBtn"
              disabled={addingFav}
              title={isFav ? 'Прибрати з обраного' : 'Додати в обране'}
              aria-pressed={isFav}
            >
              {addingFav ? 'Оновлюємо…' : isFav ? '✓ В обраному' : 'Додати в обране'}
            </button>
          </div>

          {/* comments */}
          <div className="commentsWrap">
            <div className="commentsTitle">Коментарі</div>

            {me ? (
              <div className="commentForm">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={6}
                  placeholder="Напишіть коментар"
                />
                <div className="commentActions">
                  <button onClick={saveComment} className="blueBtn">{editId ? 'Оновити' : 'Додати'}</button>
                  {editId && (
                    <button onClick={() => { setEditId(null); setCommentText(''); }} className="grayBtn">
                      Скасувати
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="loginHint">
                Щоб додати коментар — <Link href="/login" className="loginLink">Увійдіть</Link>.
              </p>
            )}

            {loadingComments ? (
              <p>Завантаження коментарів…</p>
            ) : comments.length === 0 ? (
              <p>Коментарів поки немає.</p>
            ) : (
              <ul className="commentsList">
                {comments.map((c) => {
                  const can = !!me && (me.is_superuser || me.username?.toLowerCase() === c.author_username.toLowerCase());
                  return (
                    <li key={c.id} className="commentItem">
                      <div className="commentHead">
                        <strong>{c.author_username}</strong>
                        <span className="commentDate">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <p className="commentBody">{c.text}</p>
                      {can && (
                        <div className="commentBtns">
                          <button
                            className="miniBtn edit"
                            onClick={() => { setEditId(c.id); setCommentText(c.text); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          >
                            ✏️ Редагувати
                          </button>
                          <button className="miniBtn del" onClick={() => deleteComment(c.id)}>🗑️ Видалити</button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          padding: 40px 20px 56px;
          background: linear-gradient(180deg, #e8f2ff 0%, #e9f1ff 55%, #eef5ff 100%);
        }
        .card {
          max-width: 1140px;
          margin: 0 auto;
          background: #cfe0ff4d;
          border-radius: 20px;
          padding: 28px 28px 32px;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.14);
          border: 1px solid rgba(59, 130, 246, 0.28);
        }
        .title {
          font-weight: 800;
          font-size: 34px;
          line-height: 1.2;
          text-align: center;
          color: #0f172a;
          margin-bottom: 20px;
        }
        .image {
          background: #e8d6ff;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
          width: 100%;
          max-height: 420px;
        }
        .image img { width: 100%; height: auto; object-fit: contain; }
        .lead { color: #374151; font-size: 16px; line-height: 1.7; margin: 10px 0 18px; }
        .infoRow { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
        .pill { background: #ffffff; border-radius: 12px; padding: 14px 18px; font-size: 16px; box-shadow: 0 3px 10px rgba(0,0,0,0.06); }
        .pillLabel { color: #0f172a; font-weight: 800; margin-right: 8px; }
        .pillValue { color: #111827; font-weight: 600; }
        .pricePill {
          display: inline-flex; background: #ffffff; border-radius: 12px; padding: 14px 18px; font-size: 16px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.06); margin: 2px 0 22px;
        }
        .actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 22px; }
        .payBtn {
          display: inline-block; padding: 10px 18px; background: #16a34a; color: #fff; border-radius: 10px;
          font-weight: 800; font-size: 16px; box-shadow: 0 6px 14px rgba(22,163,74,0.28);
        }
        .payBtn:hover { background: #15803d; }

        /* wishlist button */
        .favBtn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          border: 1px solid #CBD5E1;
          background: #EEF2FF; color: #1f2a44; font-weight: 800; font-size: 16px;
          box-shadow: 0 3px 8px rgba(31, 41, 255, 0.08);
        }
        .favBtn:hover { background: #E0E7FF; }
        .favBtn[aria-pressed="true"] {
          background: #E5E7EB; color: #0f172a; border-color: #cbd5e1;
        }
        .favBtn:disabled { opacity: .75; cursor: not-allowed; }

        .commentsWrap { margin-top: 8px; }
        .commentsTitle { font-size: 18px; font-weight: 800; color: #0f172a; padding-bottom: 8px; border-bottom: 3px solid #2563eb; margin-bottom: 12px; }
        .commentForm textarea {
          width: 100%; border-radius: 12px; border: 1px solid #a5b4fc; background: #fff; padding: 14px 16px; font-size: 16px; resize: vertical; min-height: 140px;
        }
        .commentActions { margin-top: 12px; display: flex; gap: 10px; }
        .blueBtn, .grayBtn { padding: 12px 20px; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 16px; }
        .blueBtn { background: #2563eb; color: #fff; } .blueBtn:hover { background: #1e40af; }
        .grayBtn { background: #9ca3af; color: #fff; } .grayBtn:hover { background: #6b7280; }
        .loginHint { color: #374151; font-size: 15px; }
        .loginLink { color: #2563eb; text-decoration: underline; font-weight: 800; }
        .commentsList { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 14px; }
        .commentItem { background: #ffffff; border: 1px solid rgba(2, 6, 23, 0.06); border-radius: 14px; padding: 14px 16px; box-shadow: 0 3px 10px rgba(0,0,0,0.05); }
        .commentHead { display: flex; justify-content: space-between; color: #0f172a; font-size: 15px; }
        .commentDate { color: #6b7280; font-size: 13px; }
        .commentBody { margin: 8px 0 10px; color: #111827; font-size: 15px; }
        .commentBtns { display: flex; gap: 10px; }
        .miniBtn { padding: 8px 12px; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer; border: none; color: #fff; }
        .miniBtn.edit { background: #f59e0b; } .miniBtn.edit:hover { background: #d97706; }
        .miniBtn.del { background: #ef4444; } .miniBtn.del:hover { background: #dc2626; }

        @media (max-width: 980px) {
          .card { padding: 22px 18px 26px; }
          .infoRow { grid-template-columns: 1fr; }
          .payBtn { margin-left: 0; }
        }
      `}</style>
    </>
  );
}
