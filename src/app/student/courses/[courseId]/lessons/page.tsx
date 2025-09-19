'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import CourseLessonsSections, { Lesson, ModuleLite } from '@/components/CourseLessonsSections';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE
  ? `${process.env.NEXT_PUBLIC_API_BASE}/api/lesson`
  : 'https://brainboost.pp.ua/api/api/lesson';

const modOrder = (m?: ModuleLite | null) =>
  typeof m?.order === 'number' ? m!.order! : Number.MAX_SAFE_INTEGER;

const isCompleted = (l: Lesson) =>
  typeof l.completed === 'boolean'
    ? l.completed
    : typeof l.result_percent === 'number' && l.result_percent >= 100;

export default function CourseLessonsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!courseId) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null; // 👈 берем из LS
      const res = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Lesson[] = Array.isArray(data) ? data : data.results ?? [];
      setLessons(list);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? 'Fetch error');
      setLessons([]);
    }
  }, [courseId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // рефетчим, если токен появился/сменился (логин на другой вкладке и т.п.)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'access') fetchLessons();
    };
    const onFocus = () => fetchLessons();
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchLessons]);

  const { groups, lockAfterIndex } = useMemo(() => {
    const list = [...(lessons ?? [])].sort((a, b) => {
      const mo = modOrder(a.module) - modOrder(b.module);
      if (mo !== 0) return mo;
      const midA = a.module?.id ?? 0;
      const midB = b.module?.id ?? 0;
      if (midA !== midB) return midA - midB;
      const lo = (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
      if (lo !== 0) return lo;
      return a.id - b.id;
    });

    const firstIncompleteIdx = list.findIndex((l) => !isCompleted(l));
    const lockIdx = firstIncompleteIdx === -1 ? Number.POSITIVE_INFINITY : firstIncompleteIdx;

    const map = new Map<number, { module: ModuleLite | null; items: { lesson: Lesson; idx: number }[] }>();
    list.forEach((lesson, idx) => {
      const key = lesson.module?.id ?? 0;
      if (!map.has(key)) map.set(key, { module: lesson.module ?? null, items: [] });
      map.get(key)!.items.push({ lesson, idx });
    });

    const groups = [...map.values()].sort((a, b) => {
      const mo = modOrder(a.module) - modOrder(b.module);
      if (mo !== 0) return mo;
      const idA = a.module?.id ?? 0;
      const idB = b.module?.id ?? 0;
      return idA - idB;
    });

    return { groups, lockAfterIndex: lockIdx };
  }, [lessons]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 rounded-lg">
      <h1 className="text-3xl font-bold mb-4">Уроки курсу</h1>

      {err && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
          Не вдалося завантажити уроки: {err}
        </div>
      )}

      {lessons === null ? (
        <div className="p-4 bg-white rounded-lg shadow text-gray-500">Завантаження…</div>
      ) : lessons.length === 0 ? (
        <div className="p-4 bg-white rounded-lg shadow">
          <p className="text-gray-500">У цьому курсі поки що немає уроків.</p>
        </div>
      ) : (
        <CourseLessonsSections courseId={String(courseId)} groups={groups} lockAfterIndex={lockAfterIndex} />
      )}
    </div>
  );
}
