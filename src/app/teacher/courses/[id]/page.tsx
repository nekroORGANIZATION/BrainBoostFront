'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import http from '@/lib/http';
import { mediaUrl, isAbsUrl } from '@/lib/media';

/** ---- API endpoints (бек працює по SLUG) ---- */
const READ_BY_SLUG   = (slug: string) => `/courses/${slug}/`;
const EDIT_BY_SLUG   = (slug: string) => `/courses/${slug}/edit/`;
const CATS_URL       = `/courses/categories/`;
const PROFILE_URL    = `/accounts/api/profile/`;

type Cat = { id: number; name: string };

type Author = number | { id: number; username?: string };
type Course = {
  id: number;
  slug: string;
  title: string;
  description: string;
  language: string;
  topic?: string|null;
  price?: string|number|null;
  category?: number | { id:number; name:string } | null;
  image?: string|null;
  author?: Author;
  status?: 'draft'|'pending'|'published';
};

type Me = {
  id: number;
  username: string;
  is_superuser: boolean;
  is_teacher: boolean;
};

export default function MetaTab() {
  /** -------- read param safely -------- */
  const params = useParams() as { id?: string | string[] };
  const routeParam = Array.isArray(params?.id) ? params.id[0] : (params?.id || '');

  /** -------- local state -------- */
  const [me, setMe] = useState<Me | null>(null);
  const [canEdit, setCanEdit] = useState<boolean>(false);

  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  const [form, setForm] = useState({
    title: '', description: '', language: '', topic: '', price: '', category: '',
  });
  const [status, setStatus] = useState<Course['status']>('draft');

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Головний: тут ми зберігаємо коректний SLUG для цього курсу
  const [slug, setSlug] = useState<string>('');

  const img = useMemo(() => {
    if (preview) return preview;
    if (!currentImage) return null;
    return isAbsUrl(currentImage) ? currentImage : mediaUrl(currentImage);
  }, [preview, currentImage]);

  const isNumericId = /^\d+$/.test(routeParam || '');

  function authorId(a?: Author) {
    return typeof a === 'number' ? a : a?.id;
  }

  /** -------- helpers: завантажити курс і визначити slug -------- */
  async function resolveSlugAndLoad(): Promise<Course> {
    // якщо в URL уже slug
    if (!isNumericId && routeParam) {
      const r = await http.get(READ_BY_SLUG(routeParam));
      setSlug(routeParam);
      return r.data as Course;
    }

    // якщо прийшов ID: витягаємо зі списку курс з цим id і беремо slug
    // (на беку фільтра по id немає, тож беремо великий page_size і фільтруємо на фронті)
    const listRes = await http.get('/courses/', { params: { page_size: 500 } });
    const list: Course[] = (listRes.data?.results || listRes.data || []) as Course[];
    const found = list.find(c => String(c.id) === String(routeParam));
    if (!found || !found.slug) {
      throw new Error('Курс не знайдено (за ID). Переконайтесь, що посилання використовує slug.');
    }
    setSlug(found.slug);

    const r2 = await http.get(READ_BY_SLUG(found.slug));
    return r2.data as Course;
  }

  /** -------- LOAD: profile + course -------- */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setErr(null);
      try {
        // 1) профіль
        let meData: Me | null = null;
        try {
          const r = await http.get(PROFILE_URL);
          meData = r.data as Me;
          if (!cancelled) setMe(meData);
        } catch {
          if (!cancelled) setMe(null);
        }

        // 2) курс (через slug; якщо прийшов id — резолвимо slug і підвантажуємо)
        const data = await resolveSlugAndLoad();

        if (!cancelled) {
          // форма
          setForm({
            title: data.title || '',
            description: data.description || '',
            language: data.language || '',
            topic: data.topic || '',
            price: String(data.price ?? ''),
            category:
              typeof data.category === 'number'
                ? String(data.category)
                : data.category?.id
                ? String(data.category.id)
                : '',
          });
          setCurrentImage(data.image || null);
          setStatus(data.status || 'draft');

          // права
          const owner = authorId(data.author);
          const allowed =
            !!meData &&
            (meData.is_superuser || (meData.is_teacher && !!owner && meData.id === owner));
          setCanEdit(!!allowed);

          if (!allowed) {
            setErr('У вас немає прав редагувати цей курс (ви не автор і не адміністратор).');
          }
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Не вдалося завантажити курс');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeParam]);

  /** -------- LOAD: categories -------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await http.get(CATS_URL);
        const arr = Array.isArray(r.data?.results) ? r.data.results : r.data;
        setCats(arr || []);
      } catch {
        // optional
      }
    })();
  }, []);

  /** -------- FORM HANDLERS -------- */
  function onChange(e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(s => ({ ...s, [name]: value }));
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function save() {
    if (!canEdit) {
      setErr('Немає прав для редагування.');
      return;
    }
    setErr(null);
    if (!form.title.trim()) return setErr('Вкажіть назву.');
    if (!form.description.trim()) return setErr('Додайте опис.');
    if (!form.language.trim()) return setErr('Вкажіть мову.');
    if (!form.topic.trim()) return setErr('Вкажіть тему.');
    if (!form.category) return setErr('Оберіть категорію.');

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('language', form.language);
      fd.append('topic', form.topic);
      if (form.price !== '') fd.append('price', form.price);
      if (form.category) fd.append('category', form.category);
      // статус не чіпаємо тут
      if (file) fd.append('image', file);

      if (!slug) throw new Error('Не визначено slug для курсу.');
      await http.patch(EDIT_BY_SLUG(slug), fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setErr(null);
      if (file) setCurrentImage(preview); // показати нове
      alert('Збережено ✅');
    } catch (e: any) {
      setErr(e?.response?.data ? JSON.stringify(e.response.data) : 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  }

  /** -------- UI -------- */
  if (loading) return <p>Завантаження…</p>;

  return (
    <div className="grid gap-4">
      {/* статус + навігація */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <span className="text-[#0F2E64] font-semibold">Статус:</span>{' '}
          <span
            className={
              status === 'published'
                ? 'text-emerald-700'
                : status === 'pending'
                ? 'text-amber-700'
                : 'text-slate-600'
            }
          >
            {status === 'published'
              ? 'Опубліковано'
              : status === 'pending'
              ? 'На модерації'
              : 'Чернетка'}
          </span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/teacher/courses/${slug || routeParam}/lessons`}
            className="px-3 py-2 rounded ring-1 ring-[#E5ECFF]"
          >
            Перейти до «Програма»
          </Link>
          <Link
            href={`/teacher/courses/${slug || routeParam}/publish`}
            className="px-3 py-2 rounded bg-[#1345DE] text-white"
          >
            Перейти до «Публікація»
          </Link>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 rounded">
          {err}
        </div>
      )}

      <fieldset disabled={!canEdit} className={canEdit ? '' : 'opacity-60'}>
        <label className="block">
          <span className="text-sm text-[#0F2E64]">Назва</span>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2"
          />
        </label>

        <label className="block mt-3">
          <span className="text-sm text-[#0F2E64]">Опис</span>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={6}
            className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2"
          />
        </label>

        <div className="grid md:grid-cols-3 gap-4 mt-3">
          <label className="block">
            <span className="text-sm text-[#0F2E64]">Мова</span>
            <input
              name="language"
              value={form.language}
              onChange={onChange}
              className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm text-[#0F2E64]">Тема</span>
            <input
              name="topic"
              value={form.topic}
              onChange={onChange}
              className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm text-[#0F2E64]">Ціна</span>
            <input
              type="number"
              step="0.01"
              min="0"
              name="price"
              value={form.price}
              onChange={onChange}
              className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2"
            />
          </label>
        </div>

        <label className="block mt-3">
          <span className="text-sm text-[#0F2E64]">Категорія</span>
          <select
            name="category"
            value={form.category}
            onChange={onChange}
            className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2 bg-white"
          >
            <option value="" disabled>
              Оберіть категорію…
            </option>
            {cats.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start mt-3">
          <label className="block">
            <span className="text-sm text-[#0F2E64]">Обкладинка</span>
            <input
              type="file"
              accept="image/*"
              onChange={onFile}
              className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2 file:bg-[#1345DE] file:text-white file:border-0 file:rounded-md"
            />
            <span className="text-xs text-slate-500">JPG/PNG до 10MB</span>
          </label>

          {img && (
            <div className="rounded-xl overflow-hidden ring-1 ring-[#E5ECFF] bg-white w-full max-w-[220px]">
              <div className="w-full aspect-[4/3] grid place-items-center bg-slate-50">
                <img src={img} alt="Preview" className="max-h-full object-contain" />
              </div>
              <div className="px-2 py-1 text-center text-xs text-slate-600">
                Поточне зображення
              </div>
            </div>
          )}
        </div>
      </fieldset>

      <div className="flex items-center justify-between mt-2">
        {!canEdit ? (
          <div className="text-sm text-slate-600">
            Редагування недоступне: ви не автор і не адміністратор.
          </div>
        ) : (
          <div className="text-sm text-slate-600">
            Публікація виконується на вкладці <b>«Публікація»</b>.
          </div>
        )}

        <div className="flex gap-2">
          <Link
            href={`/teacher/courses/${slug || routeParam}/publish`}
            className="px-4 py-2 rounded ring-1 ring-[#E5ECFF]"
          >
            До публікації
          </Link>
          <button
            onClick={save}
            disabled={saving || !canEdit}
            className="px-5 py-2 rounded bg-[#1345DE] text-white disabled:opacity-60"
          >
            {saving ? 'Збереження…' : 'Зберегти'}
          </button>
        </div>
      </div>
    </div>
  );
}
