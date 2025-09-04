'use client';

import { useEffect, useState } from 'react';
import http from '@/lib/http';

const LIST1 = (courseId: string|number) => `/lessons/?course=${courseId}`;
const LIST2 = (courseId: string|number) => `/courses/${courseId}/lessons/`;  // фолбек якщо є
const CREATE = `/lessons/`;
const ITEM   = (lessonId: number|string) => `/lessons/${lessonId}/`;

type Lesson = { id: number; title: string; content?: string; order?: number };

async function fetchLessons(courseId: string) {
  try {
    const r = await http.get(LIST1(courseId));
    return Array.isArray(r.data?.results) ? r.data.results : r.data;
  } catch {
    try {
      const r2 = await http.get(LIST2(courseId));
      return Array.isArray(r2.data?.results) ? r2.data.results : r2.data;
    } catch {
      return [];
    }
  }
}

export default function LessonsTab({ params }: { params: { id: string } }) {
  const { id } = params;
  const [list, setList] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({ title: '', content: '', order: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    const arr = await fetchLessons(id);
    setList(Array.isArray(arr) ? arr : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  function startCreate() {
    setEditId(null);
    setForm({ title: '', content: '', order: String((list[list.length-1]?.order || list.length) + 1) });
  }
  function startEdit(l: Lesson) {
    setEditId(l.id);
    setForm({ title: l.title || '', content: l.content || '', order: String(l.order ?? '') });
  }
  function cancel() {
    setEditId(null);
    setForm({ title: '', content: '', order: '' });
  }

  async function submit() {
    if (!form.title.trim()) return alert('Вкажіть назву уроку.');
    setSaving(true);
    try {
      const payload = {
        course: Number(id),
        title: form.title,
        content: form.content,
        order: form.order ? Number(form.order) : undefined,
      };
      if (editId) {
        await http.patch(ITEM(editId), payload);
      } else {
        await http.post(CREATE, payload);
      }
      await load();
      cancel();
    } catch (e: any) {
      alert(e?.response?.data ? JSON.stringify(e.response.data) : 'Помилка збереження');
    } finally { setSaving(false); }
  }

  async function remove(lessonId: number) {
    if (!confirm('Видалити урок?')) return;
    try {
      await http.delete(ITEM(lessonId));
      await load();
    } catch {
      alert('Не вдалося видалити');
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-[#0F2E64]">Програма курсу</h2>
        <button onClick={startCreate} className="px-4 py-2 rounded bg-[#1345DE] text-white">+ Додати урок</button>
      </div>

      {loading ? <p>Завантаження…</p> : (
        list.length === 0
          ? <div className="rounded bg-slate-50 ring-1 ring-[#E5ECFF] p-4">Поки немає уроків.</div>
          : <ul className="divide-y">
              {list
                .slice()
                .sort((a,b)=> (a.order ?? a.id) - (b.order ?? b.id))
                .map(l => (
                <li key={l.id} className="py-3 flex items-start gap-3">
                  <div className="w-10 text-center font-semibold text-slate-600">{l.order ?? '—'}</div>
                  <div className="flex-1">
                    <div className="font-semibold">{l.title}</div>
                    {l.content ? <div className="text-sm text-slate-600 whitespace-pre-line mt-1">{l.content}</div> : null}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(l)} className="px-3 py-1 rounded ring-1 ring-[#E5ECFF]">Редагувати</button>
                    <button onClick={() => remove(l.id)} className="px-3 py-1 rounded bg-red-500 text-white">Видалити</button>
                  </div>
                </li>
              ))}
            </ul>
      )}

      {/* Форма створення/редагування */}
      {(editId !== null || form.title || form.content) && (
        <div className="rounded-2xl ring-1 ring-[#E5ECFF] p-4 bg-white">
          <h3 className="font-semibold mb-3">{editId ? 'Редагувати урок' : 'Новий урок'}</h3>
          <div className="grid md:grid-cols-4 gap-3">
            <label className="md:col-span-3 block">
              <span className="text-sm">Назва</span>
              <input value={form.title} onChange={e=>setForm(f=>({...f, title:e.target.value}))}
                className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm">Порядок</span>
              <input type="number" min={1} value={form.order}
                onChange={e=>setForm(f=>({...f, order:e.target.value}))}
                className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2" />
            </label>
          </div>
          <label className="block mt-3">
            <span className="text-sm">Зміст</span>
            <textarea rows={6} value={form.content} onChange={e=>setForm(f=>({...f, content:e.target.value}))}
              className="w-full rounded ring-1 ring-[#E5ECFF] px-3 py-2" />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={cancel} className="px-4 py-2 rounded ring-1 ring-[#E5ECFF]">Скасувати</button>
            <button onClick={submit} disabled={saving} className="px-4 py-2 rounded bg-[#1345DE] text-white disabled:opacity-60">
              {saving ? 'Збереження…' : (editId ? 'Зберегти' : 'Створити')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
