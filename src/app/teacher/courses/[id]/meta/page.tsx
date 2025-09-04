'use client';

import { useEffect, useMemo, useState } from 'react';
import http from '@/lib/http';

const READ_URL   = (id: string|number) => `/courses/${id}/`;
const EDIT_URL   = (id: string|number) => `/courses/all/${id}/edit/`;
const CATS_URL   = `/courses/all/categories/`;

type Cat = { id: number; name: string };
type Course = {
  id: number; title: string; description: string; language: string; topic?: string|null;
  price?: string|number|null; category?: number | { id:number; name:string } | null;
  image?: string|null;
};

function isAbsUrl(u?: string|null) {
  if (!u) return false;
  return /^https?:\/\//i.test(u) || u.startsWith('data:') || u.startsWith('blob:');
}
function mediaUrl(u?: string|null) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://brainboost.pp.ua/api';
  if (!u) return '';
  return isAbsUrl(u) ? u : `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`;
}

export default function MetaPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  const [form, setForm] = useState({
    title: '', description: '', language: '', topic: '', price: '', category: '',
  });
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const img = useMemo(() => {
    if (preview) return preview;
    if (!currentImage) return null;
    return isAbsUrl(currentImage) ? currentImage : mediaUrl(currentImage);
  }, [preview, currentImage]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const r = await http.get(READ_URL(id));
        const data = r.data as Course;
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
      } catch (e) {
        setErr(e?.message || 'Не вдалося завантажити курс');
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => { c = true; };
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const r = await http.get(CATS_URL);
        const arr = Array.isArray(r.data?.results) ? r.data.results : r.data;
        setCats(arr || []);
      } catch { /* optional */ }
    })();
  }, []);

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
      if (form.price) fd.append('price', form.price);
      if (form.category) fd.append('category', form.category);
      if (file) fd.append('image', file);

      await http.patch(EDIT_URL(id), fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (file && preview) setCurrentImage(preview);
      alert('Збережено ✅');
    } catch (e) {
      setErr(e?.response?.data ? JSON.stringify(e.response.data) : 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Завантаження…</p>;

  return (
    <div className="grid gap-4">
      {err && <div className="bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 rounded">{err}</div>}

      <label className="block">
        <span className="text-sm text-[#0F2E64]">Назва</span>
        <input name="title" value={form.title} onChange={onChange}
          className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2" />
      </label>

      <label className="block">
        <span className="text-sm text-[#0F2E64]">Опис</span>
        <textarea name="description" value={form.description} onChange={onChange}
          rows={6} className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2" />
      </label>

      <div className="grid md:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm text-[#0F2E64]">Мова</span>
          <input name="language" value={form.language} onChange={onChange}
            className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2" />
        </label>

        <label className="block">
          <span className="text-sm text-[#0F2E64]">Тема</span>
          <input name="topic" value={form.topic} onChange={onChange}
            className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2" />
        </label>

        <label className="block">
          <span className="text-sm text-[#0F2E64]">Ціна</span>
          <input type="number" step="0.01" min="0" name="price" value={form.price} onChange={onChange}
            className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2" />
        </label>
      </div>

      <label className="block">
        <span className="text-sm text-[#0F2E64]">Категорія</span>
        <select name="category" value={form.category} onChange={onChange}
          className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2 bg-white">
          <option value="" disabled>Оберіть категорію…</option>
          {cats.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
      </label>

      <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
        <label className="block">
          <span className="text-sm text-[#0F2E64]">Обкладинка</span>
          <input type="file" accept="image/*" onChange={onFile}
            className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2 file:bg-[#1345DE] file:text-white file:border-0 file:rounded-md"/>
          <span className="text-xs text-slate-500">JPG/PNG до 10MB</span>
        </label>

        {img && (
          <div className="rounded-xl overflow-hidden ring-1 ring-[#E5ECFF] bg-white w-full max-w-[220px]">
            <div className="w-full aspect-[4/3] grid place-items-center bg-slate-50">
              <img src={img} alt="Preview" className="max-h-full object-contain" />
            </div>
            <div className="px-2 py-1 text-center text-xs text-slate-600">Поточне зображення</div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={save} disabled={saving}
          className="px-5 py-2 rounded bg-[#1345DE] text-white disabled:opacity-60">
          {saving ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>
    </div>
  );
}
