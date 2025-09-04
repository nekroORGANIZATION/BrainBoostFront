'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

/* =========================
   Конфіг / хелпери
========================= */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';
const COURSES_URL = `${API_BASE}/courses/`;
const CATEGORIES_URL = `${API_BASE}/courses/categories/`;

type Category = { id: number; name: string };

const getToken = () =>
  (typeof window !== 'undefined' && (localStorage.getItem('access') || localStorage.getItem('accessToken'))) || '';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');

const LANG_SUGGEST = ['Ukrainian', 'English', 'Polish', 'German', 'Spanish'];
const TOPIC_SUGGEST = ['Програмування', 'UI/UX', 'Data Science', 'Маркетинг', 'Проджект-менеджмент'];

export default function CreateCoursePage() {
  const router = useRouter();

  // form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(''); // текстове поле з маскою
  const [language, setLanguage] = useState('');
  const [topic, setTopic] = useState('');
  const [categoryId, setCategoryId] = useState<number | 'new' | ''>('');
  const [newCategory, setNewCategory] = useState(''); // показується, якщо обрано "Нова категорія"

  // media
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // meta
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [okMsg, setOkMsg] = useState<string>('');

  const dropRef = useRef<HTMLLabelElement | null>(null);
  const token = useMemo(getToken, []);

  /* ---------------- load categories ---------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get(CATEGORIES_URL, { params: { page_size: 500 } });
        const data: Category[] = Array.isArray(r.data) ? r.data : r.data.results ?? [];
        if (!cancelled) setCategories(data);
      } catch (e) {
        // тихо ігноруємо — можна створити без категорії
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- slug auto ---------------- */
  useEffect(() => {
    // якщо користувач не редагував slug вручну — генеруємо з title
    setSlug((s) => {
      const generated = slugify(title);
      // якщо slug порожній або збігається з попередньою автогенерацією — апдейтимо
      if (!s || s === slugify(s)) return generated;
      return s; // користувач уже щось писав — не чіпаємо
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  /* ---------------- image handlers ---------------- */
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    dropRef.current?.classList.remove('ring-[#7c3aed]');
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dropRef.current?.classList.add('ring-[#7c3aed]');
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dropRef.current?.classList.remove('ring-[#7c3aed]');
  };

  /* ---------------- validation ---------------- */
  const priceNumber = useMemo(() => {
    const cleaned = price.replace(',', '.').replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? Math.max(0, num) : NaN;
  }, [price]);

  const canSubmit =
    title.trim().length >= 3 &&
    description.trim().length >= 30 &&
    !Number.isNaN(priceNumber) &&
    language.trim().length > 0 &&
    topic.trim().length > 0;

  /* ---------------- submit ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOkMsg('');

    if (!token) {
      setError('Потрібна авторизація.');
      return;
    }
    if (!canSubmit) {
      setError('Заповніть обовʼязкові поля коректно.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      if (slug.trim()) fd.append('slug', slugify(slug));
      fd.append('description', description.trim());
      fd.append('price', priceNumber.toFixed(2));
      fd.append('language', language.trim());
      fd.append('topic', topic.trim());

      // категорія (якщо вибрана)
      let finalCategoryId: number | null = null;
      if (categoryId && categoryId !== 'new') {
        finalCategoryId = Number(categoryId);
      } else if (categoryId === 'new' && newCategory.trim()) {
        // швидке створення локально: бек у тебе не приймає створення категорії тут,
        // тому просто відправимо її назву як текст у полі "category_name" — бек може ігнорити;
        // якщо потрібно — пізніше зробимо окремий POST /categories/.
        fd.append('category_name', newCategory.trim());
      }
      if (finalCategoryId) {
        fd.append('category', String(finalCategoryId));     // варіант 1
        fd.append('category_id', String(finalCategoryId));  // варіант 2 (на випадок іншого серіалізатора)
      }

      // рейтинг — не обовʼязково (в нас він з відгуків), але бек допускає — поставимо 0.0
      fd.append('rating', '0.0');

      if (image) fd.append('image', image);

      const res = await axios.post(COURSES_URL, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setOkMsg('Курс створено!');
      const created = res.data || {};
      // редірект на деталі (через slug якщо повернувся)
      const to = created.slug ? `/courses/${created.slug}` : `/courses/${created.id}/details`;
      router.push(to);
    } catch (err: any) {
      console.error('Error creating course:', err?.response?.data || err);
      const detail =
        err?.response?.data?.detail ||
        (typeof err?.response?.data === 'string' ? err.response.data : '') ||
        'Помилка при створенні курсу.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F7FAFF] to-[#F3E8FF] py-8">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="rounded-2xl bg-white/70 backdrop-blur ring-1 ring-violet-200 shadow-[0_12px_40px_rgba(124,58,237,0.15)] px-6 py-5 mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-violet-800">Створення курсу</h1>
          <p className="text-violet-700/80 mt-1">
            Заповніть основні дані, додайте обкладинку і натисніть <span className="font-semibold">Створити</span>.
          </p>
        </div>

        {/* Alert */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-800 ring-1 ring-red-200 px-4 py-3">
            {error}
          </div>
        )}
        {okMsg && (
          <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 px-4 py-3">
            {okMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Basic */}
          <section className="lg:col-span-2 rounded-2xl bg-white ring-1 ring-violet-100 p-5 shadow-sm">
            <h2 className="text-violet-900 font-extrabold mb-4">Основна інформація</h2>

            {/* Title + Slug */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="md:col-span-2 block">
                <span className="text-sm font-semibold text-violet-900">Назва курсу *</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Напр.: Frontend з нуля"
                  className="mt-1 w-full rounded-xl ring-1 ring-violet-200 px-3 py-2 outline-none focus:ring-violet-500"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-violet-900">Slug</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="frontend-z-nulya"
                  className="mt-1 w-full rounded-xl ring-1 ring-violet-200 px-3 py-2 outline-none focus:ring-violet-500"
                />
                <span className="text-xs text-violet-600">URL: /courses/{slug || '...'} </span>
              </label>
            </div>

            {/* Description */}
            <label className="block mt-4">
              <span className="text-sm font-semibold text-violet-900">Опис *</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Коротко опишіть програму, формат, для кого курс і що буде в результаті…"
                rows={8}
                className="mt-1 w-full rounded-xl ring-1 ring-violet-200 px-3 py-2 outline-none focus:ring-violet-500"
                required
              />
              <div className="text-xs text-violet-600 mt-1">
                Символів: {description.length} (мінімум 30 для відправки)
              </div>
            </label>

            {/* Lang / Topic / Price */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-sm font-semibold text-violet-900">Мова *</span>
                <input
                  list="langs"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="Ukrainian"
                  className="mt-1 w-full rounded-xl ring-1 ring-violet-200 px-3 py-2 outline-none focus:ring-violet-500"
                  required
                />
                <datalist id="langs">
                  {LANG_SUGGEST.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-violet-900">Тема *</span>
                <input
                  list="topics"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Програмування"
                  className="mt-1 w-full rounded-xl ring-1 ring-violet-200 px-3 py-2 outline-none focus:ring-violet-500"
                  required
                />
                <datalist id="topics">
                  {TOPIC_SUGGEST.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-violet-900">Ціна (USD) *</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="49.99"
                  className="mt-1 w-full rounded-xl ring-1 ring-violet-200 px-3 py-2 outline-none focus:ring-violet-500"
                  required
                />
                <span className="text-xs text-violet-600">
                  {Number.isNaN(priceNumber) ? 'Невірний формат' : `До відправки: $${priceNumber.toFixed(2)}`}
                </span>
              </label>
            </div>
          </section>

          {/* RIGHT: Media & Meta */}
          <aside className="space-y-6">
            {/* Image */}
            <section className="rounded-2xl bg-white ring-1 ring-violet-100 p-5 shadow-sm">
              <h3 className="text-violet-900 font-extrabold mb-3">Обкладинка</h3>

              <label
                ref={dropRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className="flex flex-col items-center justify-center gap-2 rounded-xl ring-2 ring-dashed ring-violet-200 p-6 cursor-pointer hover:ring-violet-400 transition"
              >
                <input type="file" accept="image/*" onChange={onPickFile} className="hidden" />
                <div className="text-violet-700 font-semibold">Перетягніть або натисніть, щоб вибрати</div>
                <div className="text-xs text-violet-600">JPG/PNG, до 5 МБ</div>
              </label>

              {preview && (
                <div className="mt-3 rounded-xl overflow-hidden ring-1 ring-violet-100">
                  <img src={preview} alt="Превʼю" className="w-full h-48 object-cover" />
                </div>
              )}
            </section>

            {/* Category */}
            <section className="rounded-2xl bg-white ring-1 ring-violet-100 p-5 shadow-sm">
              <h3 className="text-violet-900 font-extrabold mb-3">Категорія</h3>
              <label className="block">
                <span className="text-sm font-semibold text-violet-900">Оберіть категорію</span>
                <select
                  value={String(categoryId)}
                  onChange={(e) => {
                    const v = e.target.value === '' ? '' : (e.target.value as any);
                    setCategoryId(v === 'new' ? 'new' : v === '' ? '' : Number(v));
                  }}
                  className="mt-1 w-full rounded-xl ring-1 ring-violet-200 px-3 py-2 outline-none focus:ring-violet-500"
                >
                  <option value="">— Без категорії —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="new">+ Нова категорія…</option>
                </select>
              </label>

              {categoryId === 'new' && (
                <label className="block mt-3">
                  <span className="text-sm font-semibold text-violet-900">Назва нової категорії</span>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Напр.: Дизайн"
                    className="mt-1 w-full rounded-xl ring-1 ring-violet-200 px-3 py-2 outline-none focus:ring-violet-500"
                  />
                  <div className="text-xs text-violet-600 mt-1">
                    (Категорія буде збережена разом із курсом, якщо бек це підтримує; інакше її можна буде створити в адмінці.)
                  </div>
                </label>
              )}
            </section>

            {/* Actions */}
            <section className="rounded-2xl bg-white ring-1 ring-violet-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-violet-700 mb-3">
                <span className="px-2 py-0.5 rounded-full bg-violet-50 ring-1 ring-violet-200">
                  Підказка: Ctrl/⌘ + Enter — відправити
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="flex-1 rounded-xl bg-violet-600 text-white font-semibold py-2.5 hover:bg-violet-700 disabled:opacity-50"
                >
                  {submitting ? 'Створюємо…' : 'Створити курс'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitle('');
                    setSlug('');
                    setDescription('');
                    setPrice('');
                    setLanguage('');
                    setTopic('');
                    setCategoryId('');
                    setNewCategory('');
                    setImage(null);
                    setPreview(null);
                    setError('');
                    setOkMsg('');
                  }}
                  className="rounded-xl bg-white ring-1 ring-violet-200 text-violet-700 font-semibold py-2.5 hover:bg-violet-50"
                >
                  Очистити
                </button>
              </div>
              <div className="text-xs text-violet-600 mt-2">
                Після створення ви автоматично перейдете на сторінку курсу.
              </div>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}
