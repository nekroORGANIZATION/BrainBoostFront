'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import http, { API_BASE } from '@/lib/http';
import { mediaUrl } from '@/lib/media';
import { motion, AnimatePresence } from 'framer-motion';

/* ===================== TYPES ===================== */
type Course = {
  id: number;
  slug?: string;
  title: string;
  description?: string;
  image?: string | null;
  author: number | { id: number; username: string };
  author_username?: string;
  language?: number | string | { id: number; name?: string; title?: string; code?: string; slug?: string };
  topic?: string;
  price?: number | string | null;
  rating?: number | string | null;
  is_purchased?: boolean;
};

type Me = { id: number; username: string; is_superuser: boolean; is_teacher: boolean };

type Comment = {
  id: number;
  text: string;
  author: number;
  author_username: string;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
};

type WishlistItem = { id: number; course: { id: number }; created_at: string };
type Language = { id: number; name?: string; title?: string; code?: string; slug?: string };
type LanguagesMap = Record<number, string>;

/* ===================== PAGE ===================== */
export default function CourseDetailPage() {
  const params = useParams();
  const rawParam = ((): string => {
    const v = (params as any)?.slug ?? (params as any)?.id ?? '';
    return Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');
  })();

  const [me, setMe] = useState<Me | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [savingComment, setSavingComment] = useState(false);

  // wishlist
  const [isFav, setIsFav] = useState(false);
  const [addingFav, setAddingFav] = useState(false);

  // languages
  const [languagesMap, setLanguagesMap] = useState<LanguagesMap>({});

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* ===================== HELPERS ===================== */
  function getAuthorId(c: Course): number | null {
    return typeof c.author === 'number' ? c.author : c.author?.id ?? null;
  }
  function resolveSlug(c: Course | null, fallback: string): string | null {
    return (c?.slug && String(c.slug)) || (fallback ? String(fallback) : null);
  }
  function isOwner(c: Course): boolean {
    const aid = getAuthorId(c);
    return !!me && !!aid && me.id === aid;
  }
  function formatDate(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString();
  }
  function initials(name?: string): string {
    const n = (name || '').trim();
    if (!n) return 'U';
    const parts = n.split(/\s+/);
    const a = parts[0]?.[0] || '';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase();
  }
  function ratingNum(v: Course['rating']): number {
    const n = Number(v ?? 0);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(5, n));
  }
  function stars(v: number) {
    const full = Math.floor(v);
    const half = v - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return '★'.repeat(full) + (half ? '⯪' : '') + '☆'.repeat(empty);
  }
  function money(p?: number | string | null) {
    const n = Number(p ?? 0);
    if (Number.isNaN(n)) return '—';
    return n === 0 ? 'Безкоштовно' : `$${n.toFixed(2)}`;
  }

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
        const found = arr.find((c) => (c as any).slug === idOrSlug || String(c.id) === String(idOrSlug));
        if (!found) throw new Error('Курс не знайдено.');
        return found;
      }
    }
  }

  async function loadLanguagesDict(): Promise<LanguagesMap> {
    const endpoints = ['/courses/languages/', '/api/languages/', '/courses/language/', '/course/languages/'];
    for (const ep of endpoints) {
      try {
        const r = await http.get(ep);
        const raw = Array.isArray(r.data?.results) ? r.data.results : r.data;
        const arr: Language[] = Array.isArray(raw) ? raw : [];
        if (!arr.length) continue;
        const map: LanguagesMap = {};
        for (const it of arr) {
          if (typeof it?.id === 'number') {
            map[it.id] = (it.name || it.title || it.code || it.slug || String(it.id)).toString();
          }
        }
        if (Object.keys(map).length) return map;
      } catch {}
    }
    return {};
  }

  function extractLanguageLabel(lang: Course['language']): string {
    if (lang == null) return '—';
    if (typeof lang === 'object') {
      const obj = lang as any;
      return (
        obj.name ||
        obj.title ||
        obj.code ||
        obj.slug ||
        (typeof obj.id === 'number' ? languagesMap[obj.id] || `#${obj.id}` : '—')
      ) as string;
    }
    if (typeof lang === 'number') return languagesMap[lang] || `#${lang}`;
    const asNum = Number(lang);
    if (!Number.isNaN(asNum) && String(asNum) === String(lang)) return languagesMap[asNum] || `#${asNum}`;
    return lang;
  }

  /* ===================== COMMENTS API ===================== */
  async function fetchComments(slug: string) {
    setLoadingComments(true);
    try {
      const r = await http.get(`/courses/${encodeURIComponent(slug)}/comments/`);
      const list = Array.isArray(r.data?.results) ? r.data.results : r.data || [];
      setComments(list);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }

  async function createComment(slug: string, courseId: number, text: string) {
    await http.post(`/courses/${encodeURIComponent(slug)}/comments/`, {
      course: courseId,
      text: text.trim(),
    });
  }

  async function updateComment(slug: string, id: number, text: string) {
    await http.patch(`/courses/${encodeURIComponent(slug)}/comments/${id}/`, { text: text.trim() });
  }

  async function removeComment(slug: string, id: number) {
    await http.delete(`/courses/${encodeURIComponent(slug)}/comments/${id}/`);
  }

  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function enrollCourse() {
    if (!course) return;
    if (!me) return alert('Щоб додати курс — увійдіть у профіль.');
    try {
      setPurchasing(true);
      const res = await http.post(`/courses/${course.id}/enroll/`);
      if (res?.data?.is_active) {
        setIsPurchased(true);
        setNotice('Курс додано до ваших курсів!');
        setTimeout(() => setNotice(null), 3000);
      }
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Не вдалося додати курс');
    } finally {
      setPurchasing(false);
    }
  }

  useEffect(() => {
    if (course) {
      setIsPurchased(!!course.is_purchased);
    }
  }, [course]);


  /* ===================== INIT ===================== */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        try {
          const meRes = await http.get('/accounts/api/profile/');
          if (!cancelled) setMe(meRes.data as Me);
        } catch {
          if (!cancelled) setMe(null);
        }

        const [data, langDict] = await Promise.all([
          loadCourseByIdOrSlug(rawParam),
          loadLanguagesDict().catch(() => ({})),
        ]);
        if (!cancelled && langDict) setLanguagesMap(langDict);

        const normalized: Course = { ...data, image: data.image ? mediaUrl(data.image) : null };
        const slug = resolveSlug(normalized, rawParam);
        if (!slug) throw new Error('Не вдалося визначити slug курсу.');

        if (!cancelled) {
          setCourse(normalized);

          try {
            const w = await http.get('/courses/me/wishlist/');
            const items: WishlistItem[] = Array.isArray(w.data?.results) ? w.data.results : w.data || [];
            const exists = items.some((it) => it?.course?.id === normalized.id);
            setIsFav(exists);
          } catch {}

          await fetchComments(slug);
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
  }, [rawParam]);

  /* ===================== MEMOS ===================== */
  const languageLabel = useMemo(() => extractLanguageLabel(course?.language), [course?.language, languagesMap]);
  const canEditCourse = useMemo(() => (!!course && !!me && (me.is_superuser || isOwner(course))), [me, course]);

  const learnBullets = useMemo(() => {
    const base = (course?.description || '').replace(/\s+/g, ' ').trim();
    const seeds = [
      'Розберете фундаментальні принципи теми',
      'Зробите міні-проєкт власними руками',
      'Навчитеся працювати з інструментами',
      'Побачите кращі практики на прикладах',
      'Отримаєте перевірені чек-листи',
      'Побудуєте особистий план розвитку',
    ];
    if (base.length > 120) seeds.unshift('Структуровано опануєте матеріал');
    return seeds.slice(0, 6);
  }, [course?.description]);

  /* ===================== ACTIONS ===================== */
  async function toggleFavorite() {
    if (!course) return;
    if (!me) return alert('Щоб керувати обраним — увійдіть у профіль.');
    try {
      setAddingFav(true);
      if (isFav) {
        await http.delete(`/courses/me/wishlist/${course.id}/`);
        setIsFav(false);
      } else {
        await http.post('/courses/me/wishlist/', { course_id: course.id });
        setIsFav(true);
      }
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Не вдалося оновити обране');
    } finally {
      setAddingFav(false);
    }
  }

  async function saveComment() {
    if (!course) return;
    const slug = resolveSlug(course, rawParam);
    if (!slug) return alert('Невірний slug курсу.');

    const text = commentText.trim();
    if (!text) return alert('Введіть текст коментаря');

    try {
      setSavingComment(true);
      if (editId) {
        await updateComment(slug, editId, text);
        setEditId(null);
      } else {
        await createComment(slug, course.id, text);
      }
      setCommentText('');
      await fetchComments(slug);
      setTimeout(() => textareaRef.current?.focus(), 0);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Помилка при збереженні коментаря');
    } finally {
      setSavingComment(false);
    }
  }

  async function deleteComment(cid: number) {
    if (!course) return;
    const slug = resolveSlug(course, rawParam);
    if (!slug) return;
    if (!confirm('Видалити коментар?')) return;
    try {
      await removeComment(slug, cid);
      await fetchComments(slug);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Помилка при видаленні коментаря');
    }
  }

  function copyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;
    navigator.clipboard?.writeText(url).then(
      () => alert('Посилання скопійовано!'),
      () => alert('Не вдалося скопіювати посилання'),
    );
  }

  /* ===================== RENDER ===================== */
  if (loading) {
    return (
      <div className="page">
        <div className="bgImage" />
        <div className="shell">
          <div className="skHero" />
          <div className="skGrid">
            <div className="skPill" /><div className="skPill" /><div className="skPill" />
          </div>
          <div className="skPara" />
        </div>
        <style jsx>{`
          .page{min-height:100dvh;position:relative}
          .bgImage{position:fixed;inset:0;background:url('/images/back.png') center/cover no-repeat;filter:saturate(1) contrast(1.05)}
          .shell{position:relative;max-width:1160px;margin:0 auto;padding:28px 16px 80px}
          .skHero{height:280px;border-radius:24px;background:linear-gradient(90deg,#f1f5ff,#ffffff,#f1f5ff);background-size:200% 100%;animation:sh 1.2s infinite;box-shadow:0 10px 30px rgba(2,28,78,.08)}
          .skGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
          .skPill{height:44px;border-radius:12px;background:linear-gradient(90deg,#eef2ff,#ffffff,#eef2ff);background-size:200% 100%;animation:sh 1.2s infinite}
          .skPara{height:140px;border-radius:12px;background:linear-gradient(90deg,#eef2ff,#ffffff,#eef2ff);background-size:200% 100%;animation:sh 1.2s infinite;margin-top:12px}
          @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
          @media(max-width:760px){.skGrid{grid-template-columns:1fr}}
        `}</style>
      </div>
    );
  }
  if (err) return <p style={{ textAlign: 'center', marginTop: '2rem', color: 'red' }}>{err}</p>;
  if (!course) return null;

  const authorName =
    course.author_username || (typeof course.author === 'object' ? course.author?.username : '—');
  const r = ratingNum(course.rating);
  const priceLabel = money(course.price);
  const slug = resolveSlug(course, rawParam) || String(course.id);

  return (
    <>
      <div className="page">
        {/* фон */}
        <div className="bgImage" />

        {/* HERO */}
        <header className="hero">
          <div className="heroContent">
            <div className="crumbs" aria-label="Breadcrumb">
              <Link href="/courses">Курси</Link>
              <span>›</span>
              <span className="current" title={course.title}>{course.title}</span>
            </div>

            <motion.h1
              className="h1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {course.title}
            </motion.h1>

            <div className="badges">
              <span className="pill">{stars(r)} <b>{r.toFixed(1)}</b></span>
              <span className="pill">{languageLabel || '—'}</span>
              <span className="pill pill--price">{priceLabel}</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="wrap">
          {/* Ліва колонка */}
          <section className="left">
            {/* Обкладинка */}
            <div className="glass media">
              {course.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={String(course.image)} alt={course.title} />
              ) : (
                <div className="ph">Без зображення</div>
              )}
            </div>

            {/* Опис */}
            <section className="glass section">
              <h2 className="h2">Опис</h2>
              <p className="lead">{course.description?.trim() || 'Короткий опис курсу буде тут.'}</p>

              <div className="kv">
                <div><span>Автор</span><b>{authorName}</b></div>
                <div><span>Мова</span><b>{languageLabel || '—'}</b></div>
                <div><span>Рейтинг</span><b>{r.toFixed(1)} / 5</b></div>
                <div><span>Ціна</span><b>{priceLabel}</b></div>
              </div>

              {/* Кнопка додати в куплені курси */}
              <button
                className="btnPrimary block"
                onClick={enrollCourse}
                disabled={isPurchased || purchasing}
                style={{ marginTop: '16px' }}
              >
                {purchasing ? 'Обробка…' : isPurchased ? 'Курс у вас' : 'Додати в мої курси'}
              </button>
            </section>

            {notice && (
              <div className="notice">{notice}</div>
            )}

            {/* Що вивчите */}
            <section className="glass section">
              <h2 className="h2">Що ви вивчите</h2>
              <ul className="ul">
                {learnBullets.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </section>

            {/* FAQ */}
            <section className="glass section">
              <h2 className="h2">FAQ</h2>
              <details className="faq"><summary>Чи потрібні базові знання?</summary><p>Буде корисно, але не обовʼязково: є вступні блоки.</p></details>
              <details className="faq"><summary>Чи буде сертифікат?</summary><p>Так, після фінального проєкту.</p></details>
              <details className="faq"><summary>Доступ до матеріалів?</summary><p>Так, безстроково у профілі.</p></details>
            </section>

            {/* Коментарі */}
            <section className="glass section" id="comments">
              <div className="rowHead">
                <h2 className="h2 m0">Коментарі</h2>
                <div className="count">{comments.length}</div>
              </div>

              {me ? (
                <div className="composer">
                  <div className="me">
                    <div className="avatar">{initials(me.username)}</div>
                    <div className="meta">
                      <b>{me.username}</b>
                      <span className="muted">{editId ? 'Редагування коментаря' : 'Поділіться враженнями'}</span>
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={5}
                    placeholder="Напишіть коментар…"
                  />
                  <div className="composerActions">
                    <button className="btnPrimary" onClick={saveComment} disabled={savingComment}>
                      {savingComment ? 'Зберігаємо…' : editId ? 'Оновити' : 'Додати'}
                    </button>
                    {editId && (
                      <button
                        className="btnGhost"
                        onClick={() => { setEditId(null); setCommentText(''); textareaRef.current?.focus(); }}
                        disabled={savingComment}
                      >
                        Скасувати
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="loginHint">Щоб додати коментар — <Link href="/login" className="a">Увійдіть</Link>.</p>
              )}

              <div className="cList">
                {loadingComments ? (
                  <div className="skeletonList">
                    {Array.from({ length: 3 }).map((_, i) => <div className="sk" key={i} />)}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="empty">
                    <div className="ico">💬</div>
                    <b>Тут поки тихо</b>
                    <span className="muted">Будьте першим, хто залишить відгук.</span>
                  </div>
                ) : (
                  <ul className="list">
                    <AnimatePresence initial={false}>
                      {comments.map((c) => {
                        const can = !!me && (me.is_superuser || me.username?.toLowerCase() === c.author_username?.toLowerCase());
                        return (
                          <motion.li
                            key={c.id}
                            className="item"
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.22 }}
                          >
                            <div className="ava">{initials(c.author_username)}</div>
                            <div className="body">
                              <div className="top">
                                <div className="who">
                                  <b>{c.author_username}</b>
                                  {c.is_edited ? <span className="tag">редаговано</span> : null}
                                </div>
                                <time className="time" dateTime={c.created_at}>{formatDate(c.created_at)}</time>
                              </div>
                              <p className="txt">{c.text}</p>
                              {can && (
                                <div className="btns">
                                  <button
                                    className="mini edit"
                                    onClick={() => {
                                      setEditId(c.id);
                                      setCommentText(c.text);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                      setTimeout(() => textareaRef.current?.focus(), 220);
                                    }}
                                  >✏️ Редагувати</button>
                                  <button className="mini del" onClick={() => deleteComment(c.id)}>🗑️ Видалити</button>
                                </div>
                              )}
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                )}
              </div>
            </section>
          </section>

          {/* Права колонка */}
          <aside className="right">
            <div className="glass sideCard">
              <div className="priceRow">
                <div className="price">{priceLabel}</div>
                <div className="rate">★ {r.toFixed(1)}</div>
              </div>
              <Link href={`/checkout/${course.id}`} className="btnPrimary block">Придбати</Link>
              <button className="btnGhost block" onClick={toggleFavorite} disabled={addingFav} aria-pressed={isFav}>
                {addingFav ? 'Оновлюємо…' : isFav ? '✓ В обраному' : 'Додати в обране'}
              </button>
              <div className="trust">
                <span>🔒 Безпечна оплата</span>
                <span>♻️ 7 днів повернення</span>
              </div>
            </div>

            <div className="glass sideCard">
              <h3 className="h3">Автор</h3>
              <div className="author">
                <div className="avatar big">{initials(authorName)}</div>
                <div className="meta">
                  <b className="name">{authorName}</b>
                  <span className="muted">Викладач курсу</span>
                </div>
              </div>
            </div>

            <div className="glass sideCard">
              <h3 className="h3">Поділитися</h3>
              <div className="share">
                <button className="chip" onClick={copyLink}>Копіювати лінк</button>
                <a className="chip" target="_blank" href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(course.title)}`}>Telegram</a>
                <a className="chip" target="_blank" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}>Facebook</a>
              </div>
            </div>
          </aside>
        </main>

        {/* Mobile sticky CTA */}
        <div className="mobBar">
          <div className="mobPrice">{priceLabel}</div>
          <Link href={`/checkout/${course.id}`} className="mobBuy">Придбати</Link>
        </div>
      </div>

      <style jsx>{`
        /* ===== PAGE BACKGROUND ===== */
        .page{min-height:100dvh;position:relative}
        .bgImage{position:fixed;inset:0;background:url('/images/back.png') center/cover no-repeat;z-index:-2}
        :global(body){background:#0000} /* чистий фон, все кладе бекграунд сторінки */

        /* ===== HERO ===== */
        .hero{position:relative}
        .hero::before{
          content:""; position:absolute; inset:0;
          background:linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,.45) 40%, rgba(255,255,255,0) 100%);
          backdrop-filter: blur(2px);
          z-index:-1;
        }
        .heroContent{max-width:1160px;margin:0 auto;padding:34px 20px 10px}
        .crumbs{display:flex;align-items:center;gap:8px;color:#2a3667;font-weight:800}
        .crumbs a{color:#1b2d8b;text-decoration:none}
        .current{color:#0b1437;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60vw}
        .h1{margin:6px 0 10px;font-size:clamp(24px,3.2vw,40px);line-height:1.2;font-weight:900;color:#0b1437;text-shadow:0 1px 0 #fff}
        .badges{display:flex;gap:8px;flex-wrap:wrap}
        .pill{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:#ffffffc9;border:1px solid #e5ecff;font-weight:900;color:#0f172a;backdrop-filter:blur(6px)}
        .pill--price{background:#ecfdf5c9;border-color:#bbf7d0;color:#065f46}

        /* ===== LAYOUT ===== */
        .wrap {
          max-width: 1380px;
          margin: 0 auto;
          padding: 18px 16px 96px;

          display: grid;
          grid-template-columns: 270px 1.3fr; /* ширина колонок */
          gap: 32px;
          align-items: start;
        }

        /* відступи між блоками всередині колонок */
          .left > .glass,
          .left > section,
          .right > .glass {
            margin-bottom: 24px; /* трохи більше відстані між блоками */
          }

        /* міняємо місцями колонки */
        .right {
          order: 1; /* права колонка перша */
          justify-self: start;
        }

        .left {
          order: 2; /* ліва колонка друга */
          justify-self: center;
          width: 100%;
        }

        /* ===== GLASS CARD ===== */
        .glass{
          background:linear-gradient(180deg, rgba(255,255,255,.86), rgba(255,255,255,.78));
          border:1px solid rgba(229,236,255,.9);
          border-radius:18px;
          box-shadow:0 12px 36px rgba(2,28,78,.12);
          backdrop-filter: blur(8px);
        }
        .section{padding:16px}
        .media{overflow:hidden;padding:0}
        .media img{display:block;width:100%;height:auto;object-fit:cover;max-height:460px}
        .ph{height:220px;display:grid;place-items:center;color:#64748b}

        .h2{margin:0 0 8px;font-size:20px;font-weight:900;color:#0b1437}
        .h2.m0{margin:0}
        .h3{margin:0 0 8px;font-size:16px;font-weight:900;color:#0b1437}
        .lead{color:#2b3354;font-size:16px;line-height:1.7;margin:4px 0 12px}

        .kv{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
        .kv > div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px}
        .kv span{display:block;color:#64748b;font-size:12px;font-weight:800}
        .kv b{color:#0f172a}

        .ul{list-style:none;padding:0;margin:6px 0 0;display:grid;gap:10px}
        .ul li{position:relative;padding-left:26px;color:#0f172a;font-weight:700;line-height:1.55}
        .ul li::before{content:'✔';position:absolute;left:0;top:0;color:#10b981;font-weight:900}

        .faq{border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;margin:8px 0;background:#f9fbff}
        .faq summary{cursor:pointer;font-weight:900;color:#0b1437}
        .faq p{margin:8px 0 0;color:#374151}

        /* ===== COMMENTS ===== */
        .rowHead{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #1f3fb8;padding-bottom:8px;margin-bottom:10px}
        .count{min-width:34px;height:28px;padding:0 8px;border-radius:999px;display:grid;place-items:center;background:#1f3fb8;color:#fff;font-weight:900;font-size:13px;box-shadow:0 6px 14px rgba(31,63,184,.2)}
        .composer{border:1px solid rgba(2,6,23,.06);border-radius:14px;padding:12px;background:#fff;margin-bottom:10px}
        .me{display:flex;gap:10px;align-items:center;margin-bottom:8px}
        .avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:900;color:#fff;background:linear-gradient(135deg,#3b82f6,#9333ea);box-shadow:0 6px 14px rgba(59,130,246,.25)}
        .avatar.big{width:56px;height:56px}
        .meta{display:flex;flex-direction:column}
        .muted{color:#64748b;font-size:13px}
        .composer textarea{width:100%;border:1px solid #b6ccff;border-radius:12px;padding:12px 14px;min-height:120px;resize:vertical;outline:none;transition:box-shadow .15s,border-color .15s}
        .composer textarea:focus{border-color:#1345de;box-shadow:0 0 0 4px rgba(19,69,222,.15)}
        .composerActions{display:flex;gap:10px;margin-top:10px}

        .cList{margin-top:10px}
        .list{list-style:none;padding:0;margin:0;display:grid;gap:10px}
        .item{display:grid;grid-template-columns:44px 1fr;gap:10px;background:#fff;border:1px solid rgba(2,6,23,.06);border-radius:14px;padding:12px}
        .ava{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:900;color:#fff;background:linear-gradient(135deg,#6366f1,#a855f7)}
        .top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
        .who{display:flex;align-items:center;gap:8px}
        .tag{padding:2px 6px;border-radius:999px;background:#f1f5f9;color:#334155;border:1px solid rgba(2,6,23,.06);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.02em}
        .time{color:#64748b;font-size:12px;white-space:nowrap}
        .txt {
          margin: 8px 0;
          color: #111827;
          font-size: 15px;
          line-height: 1.6;

          background: #f5f7ff;          /* світлий фон */
          border: 1px solid #dbe6ff;    /* рамка */
          border-radius: 12px;           /* заокруглення кутів */
          padding: 12px 14px;            /* відступ всередині */
          word-break: break-word;        /* щоб текст не виходив за рамки */
        }
        .btns{display:flex;gap:8px}
        .mini{padding:8px 12px;border-radius:8px;font-weight:800;font-size:13px;border:none;color:#fff;cursor:pointer}
        .mini.edit,
        .mini.del {
          background: linear-gradient(45deg,#1345de,#2563eb);
          color: #fff;
          border: none;
          cursor: pointer;
          border-radius: 12px;
          font-weight: 900;
          font-size: 13px;
          padding: 8px 12px;
          transition: all 0.2s ease;
        }

        .mini.edit:hover,
        .mini.del:hover {
          filter: saturate(1.05);
          transform: translateY(-1px);
        }
        .skeletonList{display:grid;gap:10px}
        .sk{height:86px;border-radius:12px;background:linear-gradient(90deg,#eef2ff,#ffffff,#eef2ff);background-size:200% 100%;animation:sh 1.2s infinite}
        .empty{display:grid;place-items:center;padding:14px 8px;text-align:center}
        .ico{font-size:24px;margin-bottom:4px}
        @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}

        /* ===== SIDEBAR ===== */
        .sideCard{padding:14px;position:sticky;top:14px}
        .priceRow{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
        .price{font-weight:900;color:#065f46;background:#ecfdf5;border:1px solid #bbf7d0;padding:8px 12px;border-radius:999px}
        .rate{font-weight:900;color:#0f172a;background:#eef2ff;border:1px solid #dbe6ff;padding:8px 12px;border-radius:999px}
        .trust{display:flex;flex-direction:column;gap:4px;color:#475569;font-weight:700;margin-top:10px}
        .author{display:flex;gap:12px;align-items:center}
        .name{font-weight:900;color:#0f172a}
        .share{display:flex;flex-wrap:wrap;gap:8px}
        .chip{flex:1 0 auto;padding:10px 12px;border-radius:12px;border:1px solid #e5ecff;background:#f8fafc;font-weight:800;color:#0f172a;text-align:center;text-decoration:none}

        /* ===== BUTTONS ===== */
        .btnPrimary{display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border-radius:12px;font-weight:900;color:#fff;text-decoration:none;background:linear-gradient(45deg,#1345de,#2563eb);box-shadow:0 10px 22px rgba(19,69,222,.28);border:none;cursor:pointer}
        .btnPrimary.block{width:100%}
        .btnPrimary:hover{filter:saturate(1.05);transform:translateY(-1px)}
        .btnGhost{display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border-radius:12px;font-weight:900;border:1px solid #dbe6ff;background:#eef3ff;color:#1345de;cursor:pointer}
        .btnGhost.block{width:100%;margin-top:8px}
        .btnGhost[aria-pressed="true"]{background:#e2e8f0;color:#0f172a}

        .a{color:#1b2d8b;text-decoration:underline;font-weight:900}
        .a.small{display:inline-block;margin-top:6px}

        /* ===== MOBILE STICKY BAR ===== */
        .mobBar{position:fixed;left:0;right:0;bottom:0;display:none;background:#ffffffcc;border-top:1px solid #e5ecff;padding:10px 12px;align-items:center;justify-content:space-between;gap:10px;backdrop-filter:blur(8px);box-shadow:0 -12px 36px rgba(2,28,78,.12);z-index:40}
        .mobPrice{font-weight:900;color:#065f46;background:#ecfdf5;border:1px solid #bbf7d0;padding:8px 12px;border-radius:12px}
        .mobBuy{flex:1;text-align:center;padding:12px 16px;border-radius:12px;font-weight:900;color:#fff;text-decoration:none;background:linear-gradient(45deg,#1345de,#2563eb)}

        /* ===== RESPONSIVE ===== */
        @media (max-width:1080px){
          .wrap{grid-template-columns:1fr 320px}
        }
        @media (max-width:920px){
          .wrap{grid-template-columns:1fr}
          .right{order:-1}
          .sideCard{position:relative;top:0}
          .kv{grid-template-columns:repeat(2,minmax(0,1fr))}
        }
        @media (max-width:760px){
          .kv{grid-template-columns:1fr}
          .media img{max-height:340px}
        }
        @media (max-width:600px){
          .mobBar{display:flex}
          .wrap{padding-bottom:140px}
          .badges .pill:nth-child(n+4){display:none} /* ховаємо зайві бейджі на дуже вузьких екранах */
        }
        .notice {
          margin-top: 12px;
          padding: 12px 16px;
          background: #1345de;
          color: #fff;
          border-radius: 12px;
          font-weight: 700;
          text-align: center;
          animation: fadein 0.3s, fadeout 0.3s 2.7s;
        }

        @keyframes fadein { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeout { from { opacity: 1; } to { opacity: 0; } }
      `}</style>
    </>
  );
}
