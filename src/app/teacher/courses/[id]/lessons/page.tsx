'use client';

import { useEffect, useState } from 'react';
import http from '@/lib/http';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Lesson = {
  id: number;
  title: string;
  content?: string | null;
  video_url?: string | null;
  duration_sec?: number | null;
  is_preview?: boolean;
};

export default function LessonEditPage() {
  const { id, lessonId } = useParams() as { id: string; lessonId: string };
  const router = useRouter();

  const [form, setForm] = useState<Lesson>({ id: Number(lessonId), title: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await http.get(`/courses/${id}/lessons/${lessonId}/`);
        if (!cancel) setForm(r.data);
      } catch (e) {
        if (!cancel) setErr(e?.message || 'Не вдалося завантажити урок');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id, lessonId]);

  // -------- fixed handlers (жодних помилок із "checked") --------
  function onTextChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.currentTarget;
    setForm(s => ({ ...s, [name]: value } as Lesson));
  }
  function onNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.currentTarget;
    const num = value === '' ? null : Number(value);
    setForm(s => ({ ...s, [name]: (Number.isNaN(num) ? null : num) } as Lesson));
  }
  function onCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.currentTarget;
    setForm(s => ({ ...s, [name]: checked } as Lesson));
  }

  async function save() {
    setErr(null);
    if (!form.title?.trim()) return setErr('Назва обов’язкова.');

    try {
      setSaving(true);
      const payload = {
        title: form.title,
        video_url: form.video_url || null,
        duration_sec: form.duration_sec ?? null,
        is_preview: !!form.is_preview,
        content: form.content ?? '',
      };

      await http.patch(`/courses/${id}/lessons/${lessonId}/`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      alert('Збережено ✅');
    } catch (e) {
      setErr(e?.response?.data ? JSON.stringify(e.response.data) : 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Видалити урок?')) return;
    try {
      await http.delete(`/courses/${id}/lessons/${lessonId}/`);
      router.push(`/teacher/courses/${id}/syllabus`);
    } catch {
      alert('Не вдалося видалити');
    }
  }

  if (loading) return <p>Завантаження…</p>;

  return (
    <div className="grid gap-4">
      {err && <div className="bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 rounded">{err}</div>}

      <div className="flex items-center justify-between">
        <h2 className="text-[#0F2E64] font-extrabold text-[20px]">Редагування уроку</h2>
        <div className="flex gap-2">
          <Link href={`/teacher/courses/${id}/lessons/${lessonId}/materials`} className="px-3 py-2 rounded ring-1 ring-[#E5ECFF]">
            Матеріали
          </Link>
          <Link href={`/teacher/courses/${id}/lessons/${lessonId}/quiz`} className="px-3 py-2 rounded ring-1 ring-[#E5ECFF]">
            Тест
          </Link>
        </div>
      </div>

      <label className="block">
        <span className="text-sm text-[#0F2E64]">Назва</span>
        <input
          name="title"
          value={form.title || ''}
          onChange={onTextChange}
          className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2"
        />
      </label>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-[#0F2E64]">Відео URL (YouTube/Vimeo/файл)</span>
          <input
            name="video_url"
            value={form.video_url || ''}
            onChange={onTextChange}
            placeholder="https://..."
            className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-[#0F2E64]">Тривалість, сек</span>
          <input
            name="duration_sec"
            type="number"
            min={0}
            value={form.duration_sec ?? ''}
            onChange={onNumberChange}
            className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm text-[#0F2E64]">Контент уроку</span>
        <textarea
          name="content"
          value={form.content || ''}
          onChange={onTextChange}
          rows={10}
          className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2"
          placeholder="Текст/нотатки/markdown…"
        />
      </label>

      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          name="is_preview"
          checked={!!form.is_preview}
          onChange={onCheckboxChange}
          className="accent-[#1345DE]"
        />
        <span className="text-sm text-slate-700">Зробити урок доступним у прев’ю курсу</span>
      </label>

      <div className="flex justify-between">
        <button onClick={remove} className="px-4 py-2 rounded bg-red-50 text-red-700 ring-1 ring-red-200">
          Видалити урок
        </button>
        <button onClick={save} disabled={saving} className="px-5 py-2 rounded bg-[#1345DE] text-white disabled:opacity-60">
          {saving ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>
    </div>
  );
}
