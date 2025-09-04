'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type LessonDraft = {
  id: string;
  title: string;
  type: 'video' | 'text' | 'link' | 'file';
  content_text?: string;
  content_url?: string;
  duration_min?: number | null;
  order: number;
};

const LESSON_INBOX_KEY = 'course_builder_inbox_lessons';

function uid() { return Math.random().toString(36).slice(2, 10); }

export default function LessonStandaloneDraftPage() {
  const [l, setL] = useState<LessonDraft>({
    id: uid(),
    title: '',
    type: 'text',
    content_text: '',
    content_url: '',
    duration_min: null,
    order: 1,
  });
  const [saved, setSaved] = useState(false);

  function set<K extends keyof LessonDraft>(k: K, v: LessonDraft[K]) {
    setL((s) => ({ ...s, [k]: v }));
  }

  function sendToCourseBuilder() {
    const inboxRaw = localStorage.getItem(LESSON_INBOX_KEY);
    const list: LessonDraft[] = inboxRaw ? (JSON.parse(inboxRaw) || []) : [];
    list.push(l);
    localStorage.setItem(LESSON_INBOX_KEY, JSON.stringify(list));
    setSaved(true);
  }

  const valid =
    l.title.trim().length >= 3 &&
    ((l.type === 'text' && (l.content_text || '').trim().length >= 20) ||
      (l.type !== 'text' && (l.content_url || '').trim().length > 0));

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-[900px] mx-auto px-6 pt-28 pb-16">
        <div className="rounded-[24px] bg-white/95 ring-1 ring-[#E5ECFF] shadow-[0_12px_40px_rgba(2,28,78,0.08)] p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F2E64] m-0">Чернетка уроку</h1>
          <p className="text-slate-600 mt-1">Окремі уроки не публікуються. Додай їх у конструктор курсу — і опублікуємо разом.</p>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm text-[#0F2E64] mb-1">Назва</span>
              <input
                value={l.title}
                onChange={(e) => set('title', e.target.value)}
                className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                placeholder="Напр.: Вступ"
              />
            </label>

            <label className="block">
              <span className="block text-sm text-[#0F2E64] mb-1">Тип</span>
              <select
                value={l.type}
                onChange={(e) => set('type', e.target.value as LessonDraft['type'])}
                className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2"
              >
                <option value="text">Текст</option>
                <option value="video">Відео</option>
                <option value="link">Посилання</option>
                <option value="file" disabled>Файл (пізніше)</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-sm text-[#0F2E64] mb-1">Тривалість, хв (опц.)</span>
              <input
                type="number" min={0} step={1}
                value={l.duration_min || ''}
                onChange={(e) => set('duration_min', e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2"
              />
            </label>
          </div>

          {l.type === 'text' ? (
            <label className="block mt-3">
              <span className="block text-sm text-[#0F2E64] mb-1">Контент (мін. 20 символів)</span>
              <textarea
                rows={6}
                value={l.content_text}
                onChange={(e) => set('content_text', e.target.value)}
                className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2"
                placeholder="Теорія, конспект, завдання…"
              />
            </label>
          ) : (
            <label className="block mt-3">
              <span className="block text-sm text-[#0F2E64] mb-1">{l.type === 'video' ? 'Посилання на відео' : 'Посилання'}</span>
              <input
                value={l.content_url || ''}
                onChange={(e) => set('content_url', e.target.value)}
                className="w-full rounded-lg ring-1 ring-[#E5ECFF] px-3 py-2"
                placeholder="https://…"
              />
            </label>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={sendToCourseBuilder}
              disabled={!valid}
              className="px-5 py-2 rounded-[10px] bg-[#1345DE] text-white font-semibold disabled:opacity-60"
            >
              Відправити у конструктор курсу
            </button>
            <Link href="/teacher/courses/new" className="px-4 py-2 rounded-[10px] ring-1 ring-[#E5ECFF] bg-white">
              Відкрити конструктор
            </Link>
          </div>

          <div className="mt-3 text-sm text-slate-600">
            Після додавання в конструктор зможеш зібрати повний курс і опублікувати.
          </div>

          {saved && (
            <div className="mt-4 rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-3 py-2">
              Урок додано до конструктора. Відкрий <Link href="/teacher/courses/new" className="underline">Конструктор курсу</Link>.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
