'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import http, { setAuthHeader } from '@/lib/http';
import { mediaUrl } from '@/lib/media';

type WishlistItem = {
  id: number; // ID елемента вішлиста
  created_at: string;
  course: {
    id: number;
    title: string;
    image?: string | null;     // может прийти: абсолютный URL, '/media/...', 'media/...', 'course_image/...'
    price?: number | string | null;
    rating?: number | string | null;
    slug?: string;
  };
};

export default function WishlistPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Прокидываем токен в axios
  useEffect(() => {
    setAuthHeader(accessToken || null);
  }, [accessToken]);

  const fetchWishlist = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await http.get('/courses/wishlist/');
      const data = res.data;
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || e?.message || 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const removeFromWishlist = async (wishlistItemId: number) => {
    if (!accessToken) return;
    try {
      await http.delete(`/courses/wishlist/${wishlistItemId}/`);
      setItems(prev => prev.filter(x => x.id !== wishlistItemId));
    } catch (e) {
      console.error(e);
      alert('Не вдалося видалити з обраного');
    }
  };

  const formatPriceUAH = (p?: number | string | null) => {
    if (p === null || p === undefined || p === '') return '';
    const num = typeof p === 'string' ? Number(p) : p;
    if (Number.isNaN(num)) return String(p);
    return new Intl.NumberFormat('uk-UA').format(num) + ' ₴';
  };

  const formatRating = (r?: number | string | null) => {
    if (r === null || r === undefined || r === '') return '';
    const num = typeof r === 'string' ? Number(r) : r;
    if (Number.isNaN(num)) return String(r);
    return num.toFixed(1);
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
      {error && <p className="text-red-600">{String(error)}</p>}

      {!loading && !error && (
        items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-600">
              Поки що порожньо. Додайте курси до обраного з їх сторінок.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(({ id, course }) => {
              const courseHref = course.slug ? `/courses/${course.slug}` : `/courses/${course.id}`;
              const imgSrc = mediaUrl(course.image || ''); // Сформирует абсолютный URL (включая /media/course_image/..)
              const showRating = course.rating !== null && course.rating !== undefined && course.rating !== '';
              const showPrice  = course.price  !== null && course.price  !== undefined && course.price  !== '';

              return (
                <div
                  key={id}
                  className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden"
                >
                  <Link href={courseHref} className="block">
                    <div className="relative aspect-video bg-slate-100">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={course.title}
                          fill
                          className="object-cover"
                          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                          priority={false}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                          No image
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4 space-y-2">
                    <Link
                      href={courseHref}
                      className="block font-semibold text-lg hover:underline line-clamp-2"
                    >
                      {course.title}
                    </Link>

                    <div className="text-sm text-slate-500 flex items-center gap-3">
                      {showRating && <span>★ {formatRating(course.rating)}</span>}
                      {showPrice  && <span>{formatPriceUAH(course.price)}</span>}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => removeFromWishlist(id)}
                        className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-300 hover:bg-slate-50"
                      >
                        Видалити з обраного
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
