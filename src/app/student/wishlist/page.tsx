'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_BASE = 'https://brainboost.pp.ua/api/courses';

type WishlistItem = {
  id: number;
  created_at: string;
  course: {
    id: number;
    title: string;
    image?: string;
    price?: number;
    rating?: number;
  };
};

// безопасный парсер ответа
async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return res.json();
  }
  const text = await res.text();
  throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
}

export default function WishlistPage() {
  const { accessToken } = useAuth(); // подгоняй под свой AuthContext
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/wishlist/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`GET /wishlist failed: ${res.status} ${res.statusText} — ${text.slice(0,150)}`);
      }
      const data = await safeJson(res);
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const removeFromWishlist = async (courseId: number) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/wishlist/${courseId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`DELETE failed: ${res.status} ${text}`);
      }
      setItems(prev => prev.filter(x => x.course.id !== courseId));
    } catch (e) {
      console.error(e);
      alert('Не вдалося видалити з обраного');
    }
  };

  if (!accessToken) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Wishlist</h1>
        <p>Увійдіть, щоб переглянути обрані курси.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Моє обране</h1>

      {loading && <p>Завантаження...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-600">
              Поки що порожньо. Додайте курси до обраного з їх сторінок.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(({ id, course }) => (
              <div
                key={id}
                className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden"
              >
                <Link href={`/courses/${course.id}`}>
                  <div className="aspect-video bg-slate-100 overflow-hidden">
                    {course.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        No image
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4 space-y-2">
                  <Link
                    href={`/courses/${course.id}`}
                    className="block font-semibold text-lg hover:underline"
                  >
                    {course.title}
                  </Link>
                  <div className="text-sm text-slate-500 flex items-center gap-3">
                    {course.rating != null && <span>★ {course.rating}</span>}
                    {course.price != null && <span>{course.price} ₴</span>}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => removeFromWishlist(course.id)}
                      className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-300 hover:bg-slate-50"
                    >
                      Видалити з обраного
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
