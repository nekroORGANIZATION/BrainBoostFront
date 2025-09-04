'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import http from '@/lib/http';
import { mediaUrl, isAbsUrl } from '@/lib/api';
import { API_BASE } from '@/lib/http';
import { useAuth } from '@/context/AuthContext';

type Course = {
  id: number;
  slug?: string;
  title: string;
  description?: string;
  image?: string | null;
  price?: number | string | null;
  rating?: number | string | null;
  author: number | { id: number; username?: string };
};

export default function CourseDeletePage() {
  const params = useParams();
  const router = useRouter();
  const { user, accessToken } = useAuth();

  const idParam = Array.isArray(params?.id) ? params.id[0] : String(params?.id || '');
  const isNumericId = /^\d+$/.test(idParam);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const authorId = useMemo(() => {
    if (!course) return null;
    return typeof course.author === 'object' ? course.author?.id : course.author;
  }, [course]);

  const canDelete = !!user && (user.is_superuser || (authorId && user.id === authorId));

  /* --------- load course --------- */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!idParam) return setLoading(false);

      setLoading(true);
      setErr(null);
      try {
        // 1) Якщо це число — спробувати detail за id
        if (isNumericId) {
          const r = await http.get(`${API_BASE}/courses/${idParam}/`);
          const c = r.data;
          const normalized: Course = {
            id: c.id,
            slug: c.slug,
            title: c.title,
            description: c.description,
            image: c.image ? mediaUrl(c.image) : null,
            price: c.price,
            rating: c.rating,
            author: typeof c.author === 'object' ? c.author : c.author,
          };
          if (!cancelled) setCourse(normalized);
        } else {
          // 2) by-slug або фолбек
          // Спершу пробуємо canonical by-slug:
          let c: any = null;
          const resp = await fetch(`${API_BASE}/courses/by-slug/${encodeURIComponent(idParam)}/`, { cache: 'no-store' });
          if (resp.ok) {
            c = await resp.json();
          } else {
            // фолбек: список і пошук по slug
            const listResp = await fetch(`${API_BASE}/courses/?page_size=200`, { cache: 'no-store' });
            const list = await listResp.json();
            const arr = Array.isArray(list) ? list : (list?.results || []);
            c = arr.find((it: any) => it.slug === idParam) || null;
            if (!c) throw new Error('No Course matches the given query.');
          }

          const normalized: Course = {
            id: c.id,
            slug: c.slug,
            title: c.title,
            description: c.description,
            image: c.image ? mediaUrl(c.image) : null,
            price: c.price,
            rating: c.rating,
            author: typeof c.author === 'object' ? c.author : c.author,
          };
          if (!cancelled) setCourse(normalized);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Не вдалося завантажити курс.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam]);

  /* --------- deletion with fallbacks --------- */
  async function tryDelete(url: string) {
    // http має інтерсептор з токеном і рефрешем
    const res = await http.delete(url);
    // успіх: 204 або 200
    if (res.status === 204 || res.status === 200) return true;
    return false;
  }

  async function handleDelete() {
    if (!accessToken) {
      alert('Увійдіть у свій акаунт.');
      router.push('/login');
      return;
    }
    if (!course) return;

    setBusy(true);
    setErr(null);
    try {
      // Найімовірніше — REST: DELETE /courses/<id>/
      const urlsToTry = [
        `${API_BASE}/courses/${course.id}/`,
        `${API_BASE}/courses/${course.id}/delete/`,
        `${API_BASE}/courses/all/${course.id}/delete/`, // старий шлях, якщо лишився
      ];

      let ok = false;
      let lastErr: any = null;
      for (const url of urlsToTry) {
        try {
          ok = await tryDelete(url);
          if (ok) break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!ok) {
        throw lastErr || new Error('Сервер відхилив запит на видалення.');
      }

      // назад до списку
      router.push('/courses');
    } catch (e: any) {
      // показати більш дружнє повідомлення
      const msg = e?.response?.data?.detail
        || e?.response?.data?.error
        || e?.message
        || 'Не вдалося видалити курс.';
      setErr(String(msg));
    } finally {
      setBusy(false);
    }
  }

  /* --------- UI helpers --------- */
  const courseImg = course?.image
    ? (isAbsUrl(course.image) ? course.image : mediaUrl(course.image))
    : '/images/course-placeholder.png';

  const detailsHref = course
    ? `/courses/${course.slug ?? course.id}/details`
    : '/courses';

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-xl mx-auto px-6 pt-24 pb-16">
        <div className="rounded-2xl bg-white/95 backdrop-blur shadow-xl ring-1 ring-[#E5ECFF] p-6">
          <h1 className="text-2xl font-extrabold text-center text-[#b22222]">Підтвердження видалення</h1>

          {loading ? (
            <div className="mt-8 animate-pulse">
              <div className="h-40 w-full rounded-xl bg-slate-200" />
              <div className="h-4 w-2/3 bg-slate-200 rounded mt-4" />
              <div className="h-3 w-1/2 bg-slate-200 rounded mt-2" />
            </div>
          ) : err ? (
            <div className="mt-6 rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 p-3 text-center">
              {err}
            </div>
          ) : course ? (
            <>
              <div className="mt-6 flex items-center gap-4">
                <img
                  src={courseImg}
                  alt={course.title}
                  className="w-24 h-24 rounded-lg object-cover ring-1 ring-[#E5ECFF]"
                />
                <div className="min-w-0">
                  <div className="text-[#0F2E64] font-extrabold text-lg truncate">{course.title}</div>
                  {course.price != null && (
                    <div className="text-slate-600 text-sm">Ціна: ${Number(course.price ?? 0).toFixed(2)}</div>
                  )}
                  {course.rating != null && (
                    <div className="text-slate-600 text-sm">Рейтинг: {Number(course.rating ?? 0).toFixed(1)} / 5</div>
                  )}
                </div>
              </div>

              <p className="mt-6 text-center text-slate-800">
                Ви дійсно хочете <b className="text-[#b22222]">видалити</b> цей курс?
              </p>

              {!canDelete && (
                <div className="mt-4 rounded-lg bg-yellow-50 text-yellow-900 ring-1 ring-yellow-200 p-3 text-sm">
                  У вас немає прав на видалення цього курсу. Спробуйте увійти як автор або адміністратор.
                </div>
              )}

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={!canDelete || busy}
                  className="px-4 py-2 rounded-lg bg-[#b22222] text-white font-semibold disabled:opacity-50"
                >
                  {busy ? 'Видаляємо…' : 'Так, видалити'}
                </button>

                <Link
                  href={detailsHref}
                  className="px-4 py-2 rounded-lg bg-white ring-1 ring-[#E5ECFF] text-slate-700 hover:bg-slate-50"
                >
                  Скасувати
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link href="/courses" className="text-[#1345DE] hover:underline">
                  ← Повернутися до списку курсів
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-6 text-center text-slate-700">
              Курс не знайдено.
              <div className="mt-3">
                <Link href="/courses" className="text-[#1345DE] hover:underline">
                  ← До списку курсів
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
