'use client';

import { useEffect, useState } from 'react';
import http from '@/lib/http';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Lesson = { id: number; title: string; order?: number; is_draft?: boolean };
type Section = { id: number; title: string; order?: number; lessons: Lesson[] };

export default function SyllabusPage() {
  const { id } = useParams() as { id: string };
  const [list, setList] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [newSection, setNewSection] = useState('');
  const [newLessonTitles, setNewLessonTitles] = useState<Record<number, string>>({});

  async function load() {
    setLoading(true); setErr(null);
    try {
      const r = await http.get(`/courses/${id}/syllabus/`);
      const arr: Section[] = Array.isArray(r.data?.results) ? r.data.results : r.data || [];
      setList(arr);
    } catch (e) {
      setErr(e?.message || 'Не вдалося завантажити програму');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function addSection() {
    if (!newSection.trim()) return;
    try {
      await http.post(`/courses/${id}/sections/`, { title: newSection.trim() });
      setNewSection('');
      await load();
    } catch (e) {
      alert(e?.response?.data ? JSON.stringify(e.response.data) : 'Помилка створення розділу');
    }
  }
  async function renameSection(s: Section, title: string) {
    try {
      await http.patch(`/courses/${id}/sections/${s.id}/`, { title });
      await load();
    } catch { alert('Не вдалося перейменувати'); }
  }
  async function deleteSection(s: Section) {
    if (!confirm('Видалити розділ з усіма уроками?')) return;
    try {
      await http.delete(`/courses/${id}/sections/${s.id}/`);
      await load();
    } catch { alert('Не вдалося видалити'); }
  }

  async function addLesson(sectionId: number) {
    const title = (newLessonTitles[sectionId] || '').trim();
    if (!title) return;
    try {
      const r = await http.post(`/courses/${id}/lessons/`, { section: sectionId, title });
      setNewLessonTitles(s => ({ ...s, [sectionId]: '' }));
      // відразу перейти в редактор уроку:
      const lessonId = r.data?.id;
      if (lessonId) window.location.href = `/teacher/courses/${id}/lessons/${lessonId}`;
      else await load();
    } catch (e) {
      alert(e?.response?.data ? JSON.stringify(e.response.data) : 'Помилка створення уроку');
    }
  }
  async function renameLesson(sectionId: number, lesson: Lesson, title: string) {
    try {
      await http.patch(`/courses/${id}/lessons/${lesson.id}/`, { title });
      await load();
    } catch { alert('Не вдалося перейменувати урок'); }
  }
  async function deleteLesson(lesson: Lesson) {
    if (!confirm('Видалити урок?')) return;
    try {
      await http.delete(`/courses/${id}/lessons/${lesson.id}/`);
      await load();
    } catch { alert('Не вдалося видалити урок'); }
  }

  if (loading) return <p>Завантаження…</p>;

  return (
    <div className="grid gap-6">
      {err && <div className="bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 rounded">{err}</div>}

      {/* Додати розділ */}
      <div className="flex gap-2">
        <input
          value={newSection}
          onChange={(e) => setNewSection(e.target.value)}
          placeholder="Назва нового розділу…"
          className="flex-1 rounded ring-1 ring-[#E5ECFF] px-3 py-2"
        />
        <button onClick={addSection} className="px-4 py-2 rounded bg-[#1345DE] text-white">+ Додати розділ</button>
      </div>

      {/* Секції */}
      <div className="grid gap-4">
        {list.map(sec => (
          <div key={sec.id} className="rounded-[12px] ring-1 ring-[#E5ECFF] p-4 bg-white">
            <div className="flex items-center gap-2">
              <input
                defaultValue={sec.title}
                onBlur={(e) => {
                  const v = e.currentTarget.value.trim();
                  if (v && v !== sec.title) renameSection(sec, v);
                }}
                className="flex-1 font-semibold text-[#0F2E64] bg-transparent outline-none"
              />
              <button onClick={() => deleteSection(sec)} className="px-2 py-1 rounded bg-red-50 text-red-700 ring-1 ring-red-200">
                Видалити
              </button>
            </div>

            {/* Уроки */}
            <ul className="mt-3 grid gap-2">
              {sec.lessons.map(lsn => (
                <li key={lsn.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                  <Link
                    href={`/teacher/courses/${id}/lessons/${lsn.id}`}
                    className="truncate text-[#1345DE] hover:underline"
                  >
                    {lsn.title}
                  </Link>
                  <input
                    defaultValue={lsn.title}
                    onBlur={(e) => {
                      const v = e.currentTarget.value.trim();
                      if (v && v !== lsn.title) renameLesson(sec.id, lsn, v);
                    }}
                    className="hidden md:block rounded ring-1 ring-[#E5ECFF] px-2 py-1 text-sm"
                  />
                  <button onClick={() => deleteLesson(lsn)} className="px-2 py-1 rounded bg-red-50 text-red-700 ring-1 ring-red-200">
                    ×
                  </button>
                </li>
              ))}
            </ul>

            {/* Додати урок у секцію */}
            <div className="mt-3 flex gap-2">
              <input
                value={newLessonTitles[sec.id] || ''}
                onChange={(e) => setNewLessonTitles(s => ({ ...s, [sec.id]: e.target.value }))}
                placeholder="Назва нового уроку…"
                className="flex-1 rounded ring-1 ring-[#E5ECFF] px-3 py-2"
              />
              <button onClick={() => addLesson(sec.id)} className="px-4 py-2 rounded bg-emerald-600 text-white">
                + Додати урок
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="text-slate-600">Поки що немає розділів. Додайте перший вище.</div>
        )}
      </div>
    </div>
  );
}
