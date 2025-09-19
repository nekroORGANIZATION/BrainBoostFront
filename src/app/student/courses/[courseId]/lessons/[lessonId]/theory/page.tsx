"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

/* ===================== Types ===================== */
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

type AiMsg = { role: "user" | "assistant"; text: string; ts: number };

type ChatMsgRaw = { id: number; sender: number; text: string; created_at: string };
type ChatUiMsg = { key: string; who: "me" | "teacher"; text: string; ts: number };

/* ===================== API ===================== */
const API_BASE = "https://brainboost.pp.ua/api";

const THEORY_URL = (lessonId: number) => `${API_BASE}/api/lesson/lessons/${lessonId}/theory/`;
const COURSE_URL = (courseId: string) => `${API_BASE}/courses/${courseId}/`;
const PROFILE_URL = `${API_BASE}/accounts/api/profile/`;

const AI_ASK_URL = `${API_BASE}/api/ai/ask/`;

const CHAT_BASE = `${API_BASE}/api/chat`;
const CHAT_START_URL = `${CHAT_BASE}/start/`;
const CHAT_MESSAGES_URL = `${CHAT_BASE}/messages/`;
const CHAT_READ_URL = `${CHAT_BASE}/read/`;

/* ===================== Helpers ===================== */
const now = () => Date.now();
const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* ===================== Page ===================== */
export default function LessonTheoryPage() {
  const params = useParams() as { lessonId: string; courseId: string };
  const lessonId = Number(params.lessonId);
  const courseId = params.courseId;

  // Token
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("accessToken"));
    }
  }, []);
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  // Data
  const [lesson, setLesson] = useState<LessonTheory | null>(null);
  const [course, setCourse] = useState<CourseLite | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0); // 0..100
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineHeight, setLineHeight] = useState<number>(1.8);
  const [serif, setSerif] = useState<boolean>(true);

  // AI chat
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiMsgs, setAiMsgs] = useState<AiMsg[]>([]);
  const [aiInput, setAiInput] = useState("");
  const aiEndRef = useRef<HTMLDivElement | null>(null);

  // Teacher chat
  const [isTeacherChatOpen, setIsTeacherChatOpen] = useState(false);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [teacherName, setTeacherName] = useState("Викладач");
  const [theoryId, setTheoryId] = useState<number | null>(null);

  const [chatId, setChatId] = useState<number | null>(null);
  const [tMsgs, setTMsgs] = useState<ChatUiMsg[]>([]);
  const [tInput, setTInput] = useState("");
  const tEndRef = useRef<HTMLDivElement | null>(null);

  /* ---- load basic data ---- */
  useEffect(() => {
    (async () => {
      try {
        const [resTheory, resCourse, resProfile] = await Promise.allSettled([
          fetch(THEORY_URL(lessonId), { headers: authHeaders, cache: "no-store" }),
          fetch(COURSE_URL(courseId), { headers: authHeaders, cache: "no-store" }),
          fetch(PROFILE_URL, { headers: authHeaders, cache: "no-store" }),
        ]);

        if (resTheory.status === "fulfilled" && resTheory.value.ok) {
          const data = (await resTheory.value.json()) as LessonTheory;
          setLesson(data);
          const tId = (data as any)?.theory_id ?? (data as any)?.content_id ?? (data as any)?.id ?? null;
          setTheoryId(typeof tId === "number" ? tId : null);
        } else {
          setLesson(null);
        }

        if (resCourse.status === "fulfilled" && resCourse.value.ok) {
          const data = (await resCourse.value.json()) as CourseLite;
          setCourse(data);
          let tId: number | null = null;
          let tName = "Викладач";
          if (data?.author && typeof data.author === "object") {
            tId = (data.author as any).id ?? null;
            tName = (data.author as any).full_name || (data.author as any).username || tName;
          } else if (typeof data?.author === "number") {
            tId = data.author;
          } else if (data?.author_username) {
            tName = data.author_username;
          }
          setTeacherId(tId);
          setTeacherName(tName);
        }

        if (resProfile.status === "fulfilled" && resProfile.value.ok) {
          const data = (await resProfile.value.json()) as Profile;
          setMe({ id: data.id, username: data.username });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [lessonId, courseId, authHeaders]);

  /* ---- reading progress ---- */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const total = el.scrollHeight - viewportH * 0.5;
      const scrolled = window.scrollY + viewportH - (el.offsetTop || 0);
      const pct = Math.max(0, Math.min(100, (scrolled / total) * 100));
      setProgress(Number.isFinite(pct) ? pct : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---- keyboard: Ctrl +/− ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setFontSize((s) => Math.min(26, s + 1));
      }
      if (e.ctrlKey && e.key === "-") {
        e.preventDefault();
        setFontSize((s) => Math.max(14, s - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---- autoscroll chats ---- */
  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMsgs, isAIChatOpen]);
  useEffect(() => { tEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [tMsgs, isTeacherChatOpen]);

  /* ===================== AI chat actions ===================== */
  async function askAI() {
    const text = aiInput.trim();
    if (!text) return;
    setAiMsgs((p) => [...p, { role: "user", text, ts: now() }]);
    setAiInput("");
    try {
      const res = await fetch(AI_ASK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeaders || {}) },
        body: JSON.stringify({ lesson_id: lessonId, question: text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        const msg = err?.error || err?.detail || "Помилка з боку ШІ.";
        setAiMsgs((p) => [...p, { role: "assistant", text: `❌ ${msg}`, ts: now() }]);
        return;
      }
      const data = await res.json();
      const answer: string = data.answer ?? "Відповідь відсутня.";
      setAiMsgs((p) => [...p, { role: "assistant", text: answer, ts: now() }]);
    } catch {
      setAiMsgs((p) => [...p, { role: "assistant", text: "❌ Помилка мережі.", ts: now() }]);
    }
  }

  /* ===================== Teacher chat actions ===================== */
  async function toggleTeacherChat() {
    if (!isTeacherChatOpen && !chatId && teacherId && theoryId) {
      try {
        const resStart = await fetch(CHAT_START_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(authHeaders || {}) },
          body: JSON.stringify({ peer: teacherId, theory_id: theoryId }),
        });
        if (resStart.ok) {
          const chat = await resStart.json();
          const newChatId: number = chat.id;
          setChatId(newChatId);
          const resList = await fetch(`${CHAT_MESSAGES_URL}?chat=${newChatId}`, { headers: { ...(authHeaders || {}) }, cache: "no-store" });
          if (resList.ok) {
            const list = (await resList.json()) as ChatMsgRaw[];
            setTMsgs(list.map((m) => ({ key: `m${m.id}`, who: me && m.sender === me.id ? "me" : "teacher", text: m.text ?? "", ts: m.created_at ? Date.parse(m.created_at) : Date.now() })));
            if (list.length) {
              const lastId = list[list.length - 1].id;
              if (lastId) {
                fetch(CHAT_READ_URL, { method: "POST", headers: { "Content-Type": "application/json", ...(authHeaders || {}) }, body: JSON.stringify({ chat: newChatId, last_read_message_id: lastId }) }).catch(() => {});
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
    setTMsgs((p) => [...p, { key: `tmp-${now()}`, who: "me", text, ts: now() }]);
    setTInput("");
    try {
      if (!chatId) return;
      await fetch(CHAT_MESSAGES_URL, { method: "POST", headers: { "Content-Type": "application/json", ...(authHeaders || {}) }, body: JSON.stringify({ chat: chatId, text }) });
    } catch {
      setTMsgs((p) => [...p, { key: `err-${now()}`, who: "teacher", text: "❌ Помилка мережі.", ts: now() }]);
    }
  }

  /* ===================== UI ===================== */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="h-2 w-48 bg-sky-100 rounded-full overflow-hidden">
          <div className="h-full w-1/3 animate-pulse bg-gradient-to-r from-sky-200 via-sky-100 to-sky-200" />
        </div>
        <p className="text-sky-700 mt-4">Завантаження…</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          <p className="font-medium">Теорія не знайдена або ще недоступна.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${serif ? "font-serif" : "font-sans"}`}>
      {/* Top progress bar */}
      <div className="sticky top-0 z-40 h-1.5 bg-transparent">
        <div className="h-1.5 bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-400 transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-sky-50 via-white to-blue-50" />
        <div className="mx-auto max-w-6xl px-6 pt-10 pb-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-sky-900">{lesson.title}</h1>
              {typeof lesson.duration_min === "number" && (
                <p className="text-sky-700 mt-2">Тривалість: {lesson.duration_min} хв.</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-2 rounded-xl shadow border">
                <span className="text-sm text-sky-700">Автор:</span>
                <span className="text-sm font-medium text-sky-900">
                  {course?.author && typeof course.author === "object"
                    ? course.author.full_name || course.author.username || "Викладач"
                    : course?.author_username || "Викладач"}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href={`/student/courses/${courseId}/lessons/${params.lessonId}/test`} className="px-4 py-2 rounded-2xl shadow-sm border bg-blue-500 text-white hover:bg-blue-600 transition">Перейти до тесту</Link>
                <button type="button" onClick={() => setIsAIChatOpen((v) => !v)} className="px-4 py-2 rounded-2xl shadow-sm border bg-sky-500 text-white hover:bg-sky-600 transition">Звернутися до ШІ</button>
                <button type="button" onClick={toggleTeacherChat} className="px-4 py-2 rounded-2xl shadow-sm border bg-emerald-500 text-white hover:bg-emerald-600 transition">Написати викладачу</button>
              </div>
            </div>
          </div>

          {/* Reader toolbar */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border rounded-2xl px-3 py-2 shadow-sm">
              <span className="text-sm text-sky-700">Шрифт</span>
              <button onClick={() => setSerif((s) => !s)} className="px-2 py-1 text-sm rounded-lg border hover:bg-sky-50 active:scale-95">{serif ? "Serif" : "Sans"}</button>
            </div>
            <div className="flex items-center gap-2 bg-white border rounded-2xl px-3 py-2 shadow-sm">
              <span className="text-sm text-sky-700">Розмір</span>
              <button onClick={() => setFontSize((s) => Math.max(14, s - 1))} className="px-2 py-1 rounded-lg border hover:bg-sky-50">A−</button>
              <div className="w-28"><input type="range" min={14} max={26} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full" /></div>
              <button onClick={() => setFontSize((s) => Math.min(26, s + 1))} className="px-2 py-1 rounded-lg border hover:bg-sky-50">A+</button>
            </div>
            <div className="flex items-center gap-2 bg-white border rounded-2xl px-3 py-2 shadow-sm">
              <span className="text-sm text-sky-700">Міжряддя</span>
              <button onClick={() => setLineHeight((h) => Math.max(1.4, Number((h - 0.1).toFixed(1))))} className="px-2 py-1 rounded-lg border hover:bg-sky-50">−</button>
              <span className="text-sm w-10 text-center">{lineHeight.toFixed(1)}</span>
              <button onClick={() => setLineHeight((h) => Math.min(2.2, Number((h + 0.1).toFixed(1))))} className="px-2 py-1 rounded-lg border hover:bg-sky-50">+</button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 pb-24" ref={contentRef}>
        <div className="rounded-2xl border bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-6 border-b">
            <p className="text-sm text-sky-700">
              Порада: натискайте <kbd className="px-1 py-0.5 border rounded text-xs bg-sky-100">Ctrl</kbd> + <kbd className="px-1 py-0.5 border rounded text-xs bg-sky-100">+</kbd>/<kbd className="px-1 py-0.5 border rounded text-xs bg-sky-100">−</kbd> щоб змінити розмір шрифту
            </p>
          </div>
          <div className="p-6 sm:p-8 prose max-w-none prose-p:leading-relaxed prose-headings:scroll-mt-20 prose-img:rounded-xl prose-img:shadow-sm prose-pre:bg-sky-900 prose-pre:text-sky-50" style={{ fontSize: `${fontSize}px`, lineHeight }}>
            {lesson.theory.map((block, index) => (
              <div key={index} className="mb-8" dangerouslySetInnerHTML={{ __html: block }} />
            ))}
          </div>
        </div>
      </div>

      {/* FABs */}
      <div className="fixed bottom-6 right-6 flex gap-3">
        <button onClick={() => setIsAIChatOpen((v) => !v)} className="bg-sky-500 text-white p-3 rounded-full shadow-lg hover:bg-sky-600 active:scale-95" title="Чат з ШІ">💬</button>
        <button onClick={toggleTeacherChat} className="bg-emerald-500 text-white p-3 rounded-full shadow-lg hover:bg-emerald-600 active:scale-95" title="Чат з викладачем">👨‍🏫</button>
      </div>

      {/* AI Chat */}
      {isAIChatOpen && (
        <div className="fixed bottom-24 right-6 w-[28rem] bg-white shadow-2xl rounded-2xl border flex flex-col h-[36rem]">
          <div className="p-3 bg-sky-500 text-white font-semibold flex justify-between rounded-t-2xl">
            <span>💬 Чат з ШІ</span>
            <button onClick={() => setIsAIChatOpen(false)} className="hover:opacity-80">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {aiMsgs.length === 0 ? (
              <p className="text-sm text-gray-500">Постав запитання по темі уроку…</p>
            ) : (
              aiMsgs.map((m, i) => (
                <div key={i} className={`p-2 rounded-xl max-w-[80%] break-words ${m.role === "user" ? "bg-sky-100 self-end text-right ml-auto" : "bg-gray-100 text-left mr-auto"}`}>
                  <div className="text-[10px] text-gray-500 mb-1">{fmtTime(m.ts)}</div>
                  {m.text}
                </div>
              ))
            )}
            <div ref={aiEndRef} />
          </div>
          <div className="p-3 border-t flex gap-2">
            <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring focus:ring-sky-200" placeholder="Напишіть повідомлення…" onKeyDown={(e) => e.key === "Enter" && askAI()} />
            <button onClick={askAI} className="bg-sky-500 text-white px-4 rounded-xl hover:bg-sky-600">➤</button>
          </div>
        </div>
      )}

      {/* Teacher Chat */}
      {isTeacherChatOpen && (
        <div className="fixed bottom-24 right-[30rem] w-[28rem] bg-white shadow-2xl rounded-2xl border flex flex-col h-[36rem]">
          <div className="p-3 bg-emerald-500 text-white font-semibold flex justify-between rounded-t-2xl">
            <span>👨‍🏫 {teacherName}</span>
            <button onClick={() => setIsTeacherChatOpen(false)} className="hover:opacity-80">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tMsgs.length === 0 ? (
              <p className="text-sm text-gray-500">Напишіть повідомлення викладачу…</p>
            ) : (
              tMsgs.map((m) => (
                <div key={m.key} className={`p-2 rounded-xl max-w-[80%] break-words ${m.who === "me" ? "bg-emerald-100 self-end text-right ml-auto" : "bg-gray-100 text-left mr-auto"}`}>
                  <div className="text-[10px] text-gray-500 mb-1">{fmtTime(m.ts)}</div>
                  {m.text}
                </div>
              ))
            )}
            <div ref={tEndRef} />
          </div>
          <div className="p-3 border-t flex gap-2">
            <input type="text" value={tInput} onChange={(e) => setTInput(e.target.value)} className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring focus:ring-emerald-200" placeholder={chatId ? "Напишіть повідомлення…" : "Створюємо чат…"} disabled={!chatId} onKeyDown={(e) => e.key === "Enter" && sendToTeacher()} />
            <button onClick={sendToTeacher} className="bg-emerald-500 text-white px-4 rounded-xl disabled:opacity-50 hover:bg-emerald-600" disabled={!chatId}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}
