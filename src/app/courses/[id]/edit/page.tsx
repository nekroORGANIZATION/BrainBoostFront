'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import http from '@/lib/http';
import { mediaUrl, isAbsUrl } from '@/lib/api';
import { API_BASE } from '@/lib/http';

type Category = { id: number; name: string; slug?: string };

type CourseDTO = {
  id: number;
  slug?: string;
  title: string;
  description: string;
  price: string | number;
  language: string;
  topic?: string | null;
  image?: string | null;
  // category може бути id або об'єкт
  category?: number | { id: number; name: string } | null;
};

export default function CourseEditPage() {
  const router = useRouter();
  const params = useParams();

  const idParam = Array.isArray(params?.id) ? params.id[0] : String(params?.id || '');
  const isNumericId = /^\d+$/.test(idParam);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    language: '',
    topic: '',
    category: '', // string id
  });

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  /* ---------- helpers ---------- */
  const imgToShow = useMemo(() => {
    if (preview) return preview;
    if (!currentImage) return null;
    return isAbsUrl(currentImage) ? currentImage : mediaUrl(currentImage);
  }, [preview, currentImage]);

  function onFieldChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function validate(): string | null {
    if (!form.title.trim()) return 'Вкажіть назву.';
    if (!form.description.trim()) return 'Додайте опис.';
    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) return 'Ціна має бути не від’ємним числом.';
    if (!form.language.trim()) return 'Вкажіть мову.';
    if (!form.topic.trim()) return 'Вкажіть тему.';
    if (!form.category) return 'Оберіть категорію.';
    return null;
  }

  /* ---------- load course ---------- */
  useEffect(() => {
    let cancelled = false;

    async function loadCourse() {
      if (!idParam) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        let data: CourseDTO | null = null;

        if (isNumericId) {
          try {
            const r = await http.get(`/courses/${idParam}/`);
            data = r.data;
          } catch {}
        }

        if (!data && isNumericId) {
          try {
            const r = await http.get(`/courses/all/${idParam}/`);
            data = r.data;
          } catch {}
        }

        if (!data && !isNumericId) {
          try {
            const res = await fetch(`${API_BASE}/courses/by-slug/${encodeURIComponent(idParam)}/`, {
              cache: 'no-store',
            });
            if (res.ok) data = await res.json();
          } catch {}
        }

        if (!data) {
          try {
            const listRes = await fetch(`${API_BASE}/courses/?page_size=200`, { cache: 'no-store' });
            const listJson = await listRes.json();
            const arr: CourseDTO[] = Array.isArray(listJson) ? listJson : (listJson?.results || []);
            data =
              arr.find((c) => (isNumericId ? String(c.id) === String(idParam) : c.slug === idParam)) ||
              null;
          } catch {}
        }

        if (!data) throw new Error('Курс не знайдено.');

        const catId =
          typeof data.category === 'number'
            ? String(data.category)
            : data.category?.id
            ? String(data.category.id)
            : '';

        if (!cancelled) {
          setForm({
            title: data.title || '',
            description: data.description || '',
            price: String(data.price ?? ''),
            language: data.language || '',
            topic: data.topic || '',
            category: catId,
          });
          setCurrentImage(data.image || null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Не вдалося завантажити курс');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCourse();
    return () => {
      cancelled = true;
    };
  }, [idParam, isNumericId]);

  /* ---------- load categories ---------- */
  useEffect(() => {
    let cancelled = false;
    async function loadCats() {
      try {
        let arr: Category[] | null = null;
        try {
          const r = await http.get('/courses/all/categories/');
          arr = Array.isArray(r.data?.results) ? r.data.results : r.data;
        } catch {}
        if (!arr) {
          const r2 = await http.get('/courses/categories/');
          arr = Array.isArray(r2.data?.results) ? r2.data.results : r2.data;
        }
        if (!cancelled) setCategories(arr || []);
      } catch {
        // no-op
      }
    }
    loadCats();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- submit (reordered fallbacks) ---------- */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setSaving(true);

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('language', form.language);
    fd.append('topic', form.topic);
    if (form.category) fd.append('category', form.category);
    if (file) fd.append('image', file);

    // Ланцюжок ендпоінтів, які ми вже бачили у вашому бекенді:
    const attempts: Array<{ method: 'patch' | 'put'; url: string }> = [
      // 1) ваш старий ендпоінт редагування
      { method: 'patch', url: `/courses/all/${idParam}/edit/` },
      // 2) оновлення за новою логікою (UpdateAPIView на /all/:id/)
      { method: 'patch', url: `/courses/all/${idParam}/` },
      // 3) класичний update для старої версії
      { method: 'patch', url: `/courses/${idParam}/update/` },
      // 4) якщо все ще ні — спробуємо PATCH детальної адреси (раптом дозволений)
      { method: 'patch', url: `/courses/${idParam}/` },
      // 5) крайній фолбек — PUT детальної адреси (хоч у вас і 405)
      { method: 'put', url: `/courses/${idParam}/` },
    ];

    let lastErr: any = null;

    for (const step of attempts) {
      try {
        console.warn(`[edit] Try ${step.method.toUpperCase()} ${step.url}`);
        await http[step.method](step.url, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.warn(`[edit] Success at ${step.method.toUpperCase()} ${step.url}`);
        router.push('/courses');
        return;
      } catch (e: any) {
        lastErr = e;
        const st = e?.response?.status;
        console.warn(`[edit] Failed ${step.method.toUpperCase()} ${step.url} (${st || 'no-status'})`);
        // 404/405/403/400 — переходимо до наступного варіанту
      }
    }

    setSaving(false);
    setError(
      lastErr?.response?.data
        ? typeof lastErr.response.data === 'string'
          ? lastErr.response.data
          : JSON.stringify(lastErr.response.data)
        : 'Не вдалося зберегти зміни.'
    );
  }

  /* ---------- render ---------- */
  if (loading) return <p style={{ textAlign: 'center', marginTop: '3rem' }}>Завантаження…</p>;

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundImage: "url('/images/back.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'top',
      }}
    >
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        <div className="rounded-2xl bg-white/95 backdrop-blur ring-1 ring-[#E5ECFF] shadow-[0_12px_40px_rgba(2,28,78,0.08)] p-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-center text-[#0F2E64]">
            Редагування курсу
          </h1>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            {/* Назва */}
            <label className="block">
              <span className="block text-sm text-[#0F2E64] mb-1">Назва курсу</span>
              <input
                name="title"
                value={form.title}
                onChange={onFieldChange}
                required
                className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                placeholder="Введіть назву…"
              />
            </label>

            {/* Опис */}
            <label className="block">
              <span className="block text-sm text-[#0F2E64] mb-1">Опис</span>
              <textarea
                name="description"
                value={form.description}
                onChange={onFieldChange}
                required
                rows={6}
                className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE] resize-vertical"
                placeholder="Коротко опишіть курс…"
              />
            </label>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Ціна */}
              <label className="block">
                <span className="block text-sm text-[#0F2E64] mb-1">Ціна</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={form.price}
                  onChange={onFieldChange}
                  required
                  className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                />
              </label>

              {/* Мова */}
              <label className="block">
                <span className="block text-sm text-[#0F2E64] mb-1">Мова</span>
                <input
                  name="language"
                  value={form.language}
                  onChange={onFieldChange}
                  required
                  className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                  placeholder="Напр.: Українська"
                />
              </label>

              {/* Тема */}
              <label className="block">
                <span className="block text-sm text-[#0F2E64] mb-1">Тема</span>
                <input
                  name="topic"
                  value={form.topic}
                  onChange={onFieldChange}
                  required
                  className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                  placeholder="Напр.: Програмування"
                />
              </label>
            </div>

            {/* Категорія */}
            <label className="block">
              <span className="block text-sm text-[#0F2E64] mb-1">Категорія</span>
              <select
                name="category"
                value={form.category}
                onChange={onFieldChange}
                required
                className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE] bg-white"
              >
                <option value="" disabled>
                  Оберіть категорію…
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Зображення */}
            <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
              <label className="block">
                <span className="block text-sm text-[#0F2E64] mb-1">Зображення</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-[#1345DE] file:text-white"
                />
                <span className="block mt-1 text-xs text-slate-500">
                  JPG/PNG до 10MB
                </span>
              </label>

              {imgToShow && (
                <div className="rounded-xl overflow-hidden ring-1 ring-[#E5ECFF] bg-white w-full max-w-[220px]">
                  <div className="w-full aspect-[4/3] grid place-items-center bg-slate-50">
                    <img src={imgToShow} alt="Preview" className="max-h-full object-contain" />
                  </div>
                  <div className="px-2 py-1 text-center text-xs text-slate-600">Поточне зображення</div>
                </div>
              )}
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => router.push('/courses')}
                className="px-4 py-2 rounded-lg bg-white ring-1 ring-[#E5ECFF]"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#1345DE] text-white disabled:opacity-60"
              >
                {saving ? 'Збереження…' : 'Зберегти зміни'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
