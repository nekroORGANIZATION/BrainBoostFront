'use client';

import React, { useEffect, useMemo, useRef as _useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/* ===== Types ===== */
type LessonTheory = {
  id: number;
  title: string;
  duration_min?: number;
  theory: string[];
  theory_id?: number;
  content_id?: number;
};

type CourseLite = {
  id: number;
  author?: number | { id: number; username?: string; full_name?: string };
  author_username?: string;
};

type Profile = { id: number; username: string };

type AiMsg = { role: 'user' | 'assistant'; text: string; ts: number };

type ChatMsgRaw = { id: number; sender: number; text: string; created_at: string };
type ChatUiMsg = { key: string; who: 'me' | 'teacher'; text: string; ts: number };

/* ===== API ===== */
const API_BASE = 'https://brainboost.pp.ua/api';

// Теорія
const THEORY_URL = (lessonId: number) => `${API_BASE}/api/lesson/lessons/${lessonId}/theory/`;
// Курс → автор
const COURSE_URL = (courseId: string) => `${API_BASE}/courses/${courseId}/`;
// Профіль → current user id
const PROFILE_URL = `${API_BASE}/accounts/api/profile/`;

// AI
const AI_ASK_URL = `${API_BASE}/api/ai/ask/`;

// Teacher chat
const CHAT_BASE = `${API_BASE}/api/chat`;
const CHAT_START_URL = `${CHAT_BASE}/start/`;
const CHAT_MESSAGES_URL = `${CHAT_BASE}/messages/`;
const CHAT_READ_URL = `${CHAT_BASE}/read/`;

/* ===== Helpers ===== */
const now = () => Date.now();
const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ===== Page ===== */
export default function LessonTheoryPage() {
  const params = useParams() as { lessonId: string; courseId: string };
  const lessonId = Number(params.lessonId);
  const courseId = params.courseId;

  // токен з localStorage
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('accessToken'));
    }
  }, []);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token],
  );

  // дані
  const [lesson, setLesson] = useState<LessonTheory | null>(null);
  const [course, setCourse] = useState<CourseLite | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // AI chat
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiMsgs, setAiMsgs] = useState<AiMsg[]>([]);
  const [aiInput, setAiInput] = useState('');
  const aiEndRef = useRef<HTMLDivElement | null>(null);

  // Teacher chat
  const [isTeacherChatOpen, setIsTeacherChatOpen] = useState(false);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [teacherName, setTeacherName] = useState('Викладач');
  const [theoryId, setTheoryId] = useState<number | null>(null);

  const [chatId, setChatId] = useState<number | null>(null);
  const [tMsgs, setTMsgs] = useState<ChatUiMsg[]>([]);
  const [tInput, setTInput] = useState('');
  const tEndRef = useRef<HTMLDivElement | null>(null);

  /* ---- load basic data ---- */
  useEffect(() => {
    (async () => {
      try {
        const [resTheory, resCourse, resProfile] = await Promise.allSettled([
          fetch(THEORY_URL(lessonId), { headers: authHeaders, cache: 'no-store' }),
          fetch(COURSE_URL(courseId), { headers: authHeaders, cache: 'no-store' }),
          fetch(PROFILE_URL, { headers: authHeaders, cache: 'no-store' }),
        ]);

        if (resTheory.status === 'fulfilled' && resTheory.value.ok) {
          const data = (await resTheory.value.json()) as LessonTheory;
          setLesson(data);
          const tId = (data as unknown)?.theory_id ?? (data as unknown)?.content_id ?? (data as unknown)?.id ?? null;
          setTheoryId(typeof tId === 'number' ? tId : null);
        } else {
          setLesson(null);
        }

        if (resCourse.status === 'fulfilled' && resCourse.value.ok) {
          const data = (await resCourse.value.json()) as CourseLite;
          setCourse(data);
          let tId: number | null = null;
          let tName = 'Викладач';
          if (data?.author && typeof data.author === 'object') {
            tId = (data.author as unknown).id ?? null;
            tName = (data.author as unknown).full_name || (data.author as unknown).username || tName;
          } else if (typeof data?.author === 'number') {
            tId = data.author;
          } else if (data?.author_username) {
            tName = data.author_username;
          }
          setTeacherId(tId);
          setTeacherName(tName);
        }

        if (resProfile.status === 'fulfilled' && resProfile.value.ok) {
          const data = (await resProfile.value.json()) as Profile;
          setMe({ id: data.id, username: data.username });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [lessonId, courseId, authHeaders]);

  /* ---- autoscroll ---- */
  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMsgs, isAIChatOpen]);
  useEffect(() => {
    tEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tMsgs, isTeacherChatOpen]);

  /* ===== AI chat actions ===== */
  async function askAI() {
    const text = aiInput.trim();
    if (!text) return;
    setAiMsgs((p) => [...p, { role: 'user', text, ts: now() }]);
    setAiInput('');
    try {
      const res = await fetch(AI_ASK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
        body: JSON.stringify({ lesson_id: lessonId, question: text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as unknown));
        const msg = err?.error || err?.detail || 'Помилка з боку ШІ.';
        setAiMsgs((p) => [...p, { role: 'assistant', text: `❌ ${msg}`, ts: now() }]);
        return;
      }
      const data = await res.json();
      const answer: string = data.answer ?? 'Відповідь відсутня.';
      setAiMsgs((p) => [...p, { role: 'assistant', text: answer, ts: now() }]);
    } catch {
      setAiMsgs((p) => [...p, { role: 'assistant', text: '❌ Помилка мережі.', ts: now() }]);
    }
  }

  /* ===== Teacher chat actions ===== */
  async function toggleTeacherChat() {
    if (!isTeacherChatOpen && !chatId && teacherId && theoryId) {
      try {
        const resStart = await fetch(CHAT_START_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
          body: JSON.stringify({ peer: teacherId, theory_id: theoryId }),
        });
        if (resStart.ok) {
          const chat = await resStart.json();
          const newChatId: number = chat.id;
          setChatId(newChatId);

          const resList = await fetch(`${CHAT_MESSAGES_URL}?chat=${newChatId}`, {
            headers: { ...(authHeaders || {}) },
            cache: 'no-store',
          });
          if (resList.ok) {
            const list = (await resList.json()) as ChatMsgRaw[];
            setTMsgs(
              list.map((m) => {
                const ts = m.created_at ? Date.parse(m.created_at) : Date.now();
                const who: 'me' | 'teacher' = me && m.sender === me.id ? 'me' : 'teacher';
                return { key: `m${m.id}`, who, text: m.text ?? '', ts };
              }),
            );

            if (list.length) {
              const lastId = list[list.length - 1].id;
              if (lastId) {
                fetch(CHAT_READ_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
                  body: JSON.stringify({ chat: newChatId, last_read_message_id: lastId }),
                }).catch(() => {});
              }
            }
          }
        }
      } catch {}
    }
    setIsTeacherChatOpen((v) => !v);
  }

  async function sendToTeacher() {
    const text = tInput.trim();
    if (!text) return;
    setTMsgs((p) => [...p, { key: `tmp-${now()}`, who: 'me', text, ts: now() }]);
    setTInput('');
    try {
      if (!chatId) return;
      await fetch(CHAT_MESSAGES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
        body: JSON.stringify({ chat: chatId, text }),
      });
    } catch {
      setTMsgs((p) => [
        ...p,
        { key: `err-${now()}`, who: 'teacher', text: '❌ Помилка мережі.', ts: now() },
      ]);
    }
  }

  /* ===== UI ===== */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-600">Завантаження…</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-500">Теорія не знайдена або ще недоступна.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-2xl p-6 relative">
        <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>
        {typeof lesson.duration_min === 'number' && (
          <p className="text-gray-500 mb-4">Тривалість: {lesson.duration_min} хв.</p>
        )}
        <div className="bg-gray-50 border rounded-lg p-4 mb-6 shadow-inner">
          {lesson.theory.map((block, index) => (
            <div key={index} className="mb-4" dangerouslySetInnerHTML={{ __html: block }} />
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Link
            href={`/student/courses/${courseId}/lessons/${params.lessonId}/test`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Перейти до тесту
          </Link>
          <button
            type="button"
            onClick={() => setIsAIChatOpen((v) => !v)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            Звернутися до ШІ
          </button>
          <button
            type="button"
            onClick={toggleTeacherChat}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
          >
            Написати викладачу
          </button>
        </div>
      </div>

      {/* FABs */}
      <button
        onClick={() => setIsAIChatOpen((v) => !v)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700"
      >
        💬
      </button>
      <button
        onClick={toggleTeacherChat}
        className="fixed bottom-6 right-20 bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700"
      >
        👨‍🏫
      </button>

      {/* AI Chat */}
      {isAIChatOpen && (
        <div className="fixed bottom-20 right-6 w-[28rem] bg-white shadow-lg rounded-lg border flex flex-col h-[36rem]">
          <div className="p-3 bg-purple-600 text-white font-semibold flex justify-between">
            <span>💬 Чат з ШІ</span>
            <button onClick={() => setIsAIChatOpen(false)}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {aiMsgs.length === 0 ? (
              <p className="text-sm text-gray-500">Постав запитання по темі уроку…</p>
            ) : (
              aiMsgs.map((m, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg max-w-[80%] break-words ${
                    m.role === 'user'
                      ? 'bg-purple-100 self-end text-right ml-auto'
                      : 'bg-gray-100 text-left mr-auto'
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">{fmtTime(m.ts)}</div>
                  {m.text}
                </div>
              ))
            )}
            <div ref={aiEndRef} />
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="flex-1 border rounded p-2"
              placeholder="Напишіть повідомлення…"
              onKeyDown={(e) => e.key === 'Enter' && askAI()}
            />
            <button onClick={askAI} className="bg-purple-600 text-white px-4 rounded">
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Teacher Chat */}
      {isTeacherChatOpen && (
        <div className="fixed bottom-20 right-[30rem] w-[28rem] bg-white shadow-lg rounded-lg border flex flex-col h-[36rem]">
          <div className="p-3 bg-emerald-600 text-white font-semibold flex justify-between">
            <span>👨‍🏫 {teacherName}</span>
            <button onClick={() => setIsTeacherChatOpen(false)}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tMsgs.length === 0 ? (
              <p className="text-sm text-gray-500">Напишіть повідомлення викладачу…</p>
            ) : (
              tMsgs.map((m) => (
                <div
                  key={m.key}
                  className={`p-2 rounded-lg max-w-[80%] break-words ${
                    m.who === 'me'
                      ? 'bg-emerald-100 self-end text-right ml-auto'
                      : 'bg-gray-100 text-left mr-auto'
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">{fmtTime(m.ts)}</div>
                  {m.text}
                </div>
              ))
            )}
            <div ref={tEndRef} />
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={tInput}
              onChange={(e) => setTInput(e.target.value)}
              className="flex-1 border rounded p-2"
              placeholder={chatId ? 'Напишіть повідомлення…' : 'Створюємо чат…'}
              disabled={!chatId}
              onKeyDown={(e) => e.key === 'Enter' && sendToTeacher()}
            />
            <button
              onClick={sendToTeacher}
              className="bg-emerald-600 text-white px-4 rounded disabled:opacity-50"
              disabled={!chatId}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
