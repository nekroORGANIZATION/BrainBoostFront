'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MessageSquare, Bot, Send, TestTubes, ChevronLeft,
  BookOpen, Clock3, Sparkles
} from 'lucide-react';
import http, { API_BASE } from '@/lib/http';
import { useAuth } from '@/context/AuthContext';

/* ===================== Types ===================== */
type LessonTheory = {
  id: number;                 // ID уроку (НЕ theory)
  title: string;
  duration_min?: number | null;
  theory: string[];
  theory_id?: number | null;  // якщо бек таке повертає
  content_id?: number | null; // пріоритетний ідентифікатор LessonContent!
};

type CourseLite = {
  id: number;
  title?: string;
  author?: number | { id: number; username?: string; full_name?: string };
  author_username?: string;
};

type Profile = { id: number; username: string };

type AiMsg = { role: 'user' | 'assistant'; text: string; ts: number };
type ChatMsgRaw = { id: number; sender: number; text: string; created_at: string };
type ChatUiMsg = { key: string; who: 'me' | 'teacher'; text: string; ts: number };

/* ===================== API ===================== */
const THEORY_URL    = (lessonId: number) => `/api/lesson/lessons/${lessonId}/theory/`;
const COURSE_URL    = (courseId: string | number) => `/courses/${courseId}/`;
const PROFILE_URL   = `/accounts/api/profile/`;

const AI_ASK_URL    = `/api/ai/ask/`;
const CHAT_BASE     = `/api/chat`;
const CHAT_START    = `${CHAT_BASE}/start/`;
const CHAT_MESSAGES = `${CHAT_BASE}/messages/`;
const CHAT_READ     = `${CHAT_BASE}/read/`;

/* ===================== Helpers ===================== */
const now = () => Date.now();
const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function resolvePeerId(basePeer: number | null, currentUserId?: number | null) {
  if (!basePeer) return null;
  if (currentUserId && basePeer === currentUserId) return null; // блокуємо self
  return basePeer;
}

export default function LessonPage() {
  const params = useParams<{ courseId: string; sectionId: string; lessonId: string }>();
  const courseId  = Array.isArray(params.courseId)  ? params.courseId[0]  : params.courseId;
  const sectionId = Array.isArray(params.sectionId) ? params.sectionId[0] : params.sectionId;
  const lessonId  = Number(Array.isArray(params.lessonId) ? params.lessonId[0] : params.lessonId);

  const { accessToken } = useAuth();

  const [lesson, setLesson] = useState<LessonTheory | null>(null);
  const [course, setCourse] = useState<CourseLite | null>(null);
  const [me, setMe]         = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Reader UI
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [serif, setSerif] = useState(false);

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
  const [isChatLoading, setIsChatLoading] = useState(false);
  const tEndRef = useRef<HTMLDivElement | null>(null);
  const chatInitRef = useRef(false); // guard від подвійного init у StrictMode
  const [selfChatBlocked, setSelfChatBlocked] = useState(false);
  const [manualPeer, setManualPeer] = useState<number | ''>('');

  /* ---- Load data ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!lessonId) return;
      setLoading(true);
      setErr(null);
      try {
        const [r1, r2, r3] = await Promise.allSettled([
          http.get(THEORY_URL(lessonId), { withCredentials: false }),
          http.get(COURSE_URL(courseId), { withCredentials: false }),
          http.get(PROFILE_URL, { withCredentials: false }),
        ]);

        if (!cancelled) {
          if (r1.status === 'fulfilled') {
            const data = r1.value.data as LessonTheory;
            setLesson(data);

            // ВАЖЛИВО: беремо тільки content_id або theory_id (жодних lesson.id!)
            const tRaw = (data as any)?.content_id ?? (data as any)?.theory_id ?? null;
            const tParsed =
              typeof tRaw === 'string' ? Number(tRaw) :
              typeof tRaw === 'number' ? tRaw : null;
            setTheoryId(Number.isFinite(tParsed as number) ? (tParsed as number) : null);
          } else {
            const status = (r1 as any)?.reason?.response?.status;
            setErr(`Не вдалося завантажити урок. ${status ? `HTTP ${status}` : ''}`);
            setLesson(null);
          }

          if (r2.status === 'fulfilled') {
            const data = r2.value.data as CourseLite;
            setCourse(data);
            let tid: number | null = null;
            let tname = 'Викладач';
            if (data?.author && typeof data.author === 'object') {
              tid = (data.author as any).id ?? null;
              tname = (data.author as any).full_name || (data.author as any).username || tname;
            } else if (typeof data?.author === 'number') {
              tid = data.author;
            } else if (data?.author_username) {
              tname = data.author_username;
            }
            setTeacherId(tid);
            setTeacherName(tname);
          }

          if (r3.status === 'fulfilled') {
            const data = r3.value.data as Profile;
            setMe({ id: data.id, username: data.username });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [courseId, lessonId, accessToken]);

  /* ---- reading progress ---- */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const total = el.scrollHeight - viewport * 0.5;
      const scrolled = window.scrollY + viewport - (el.offsetTop || 0);
      const pct = Math.max(0, Math.min(100, (scrolled / total) * 100));
      setProgress(Number.isFinite(pct) ? pct : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ---- keyboard: Ctrl + / − ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setFontSize((s) => Math.min(26, s + 1));
      }
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        setFontSize((s) => Math.max(14, s - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ---- autoscroll chats ---- */
  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMsgs, isAIChatOpen]);
  useEffect(() => { tEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [tMsgs, isTeacherChatOpen]);

  const authorName = useMemo(() => {
    if (!course) return 'Викладач';
    if (course.author && typeof course.author === 'object') {
      return (course.author as any).full_name || (course.author as any).username || 'Викладач';
    }
    return course?.author_username || 'Викладач';
  }, [course]);

  /* ===================== AI chat ===================== */
  async function askAI() {
    const text = aiInput.trim();
    if (!text) return;
    setAiMsgs((p) => [...p, { role: 'user', text, ts: now() }]);
    setAiInput('');
    try {
      const res = await http.post(AI_ASK_URL, { lesson_id: lessonId, question: text });
      const answer: string = res.data?.answer ?? 'Відповідь відсутня.';
      setAiMsgs((p) => [...p, { role: 'assistant', text: answer, ts: now() }]);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.response?.data?.detail || 'Помилка з боку ШІ.';
      setAiMsgs((p) => [...p, { role: 'assistant', text: `❌ ${msg}`, ts: now() }]);
    }
  }

  /* ===================== Teacher chat ===================== */
  async function ensureTeacherChat(overridePeer?: number) {
    if (chatId || isChatLoading) return;

    // peer (teacher)
    const basePeer = typeof overridePeer === 'number' ? overridePeer : teacherId;
    const peer = resolvePeerId(basePeer, me?.id);
    if (!peer) {
      if (basePeer && me?.id && basePeer === me.id) setSelfChatBlocked(true); // показати ручний ввід peer
      return;
    }

    try {
      setIsChatLoading(true);

      // ВАЖЛИВО: якщо є theoryId — шлемо його.
      // Якщо theoryId немає — шлемо lesson_id (фолбек у бекенді).
      const payload: any = theoryId
        ? { peer, theory_id: theoryId }
        : { peer, lesson_id: lessonId };

      const startRes = await http.post(CHAT_START, payload);
      const createdChat = startRes.data as { id: number };
      if (!createdChat?.id) throw new Error('Сервер повернув невалідну відповідь: немає id чату.');

      setChatId(createdChat.id);

      // Messages
      const msgsRes = await http.get(CHAT_MESSAGES, { params: { chat: createdChat.id } });
      const rawList = (Array.isArray(msgsRes.data) ? msgsRes.data : []) as ChatMsgRaw[];
      setTMsgs(rawList.map((m) => ({
        key: `m${m.id}`,
        who: me && m.sender === me.id ? 'me' : 'teacher',
        text: m.text ?? '',
        ts: m.created_at ? Date.parse(m.created_at) : Date.now(),
      })));

      // Read marker
      if (rawList.length) {
        const lastId = rawList[rawList.length - 1].id;
        if (lastId) http.post(CHAT_READ, { chat: createdChat.id, last_read_message_id: lastId }).catch(() => {});
      }
    } catch (e: any) {
      const data = e?.response?.data;
      const detail =
        (typeof data === 'string' && data) ||
        data?.detail ||
        Object.entries(data || {})
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
          .join(' | ') ||
        e.message ||
        'Не вдалося створити чат.';
      // одна коротка помітка
      setTMsgs((p) => [...p, { key: `err-${Date.now()}`, who: 'teacher', text: `❌ ${detail}`, ts: Date.now() }]);
      console.error('chat/start failed:', e?.response?.status, data || e);
    } finally {
      setIsChatLoading(false);
    }
  }

  async function sendToTeacher() {
    const text = tInput.trim();
    if (!text || !chatId) return;
    const ts = now();
    const tempKey = `tmp-${ts}`;
    setTMsgs((p) => [...p, { key: tempKey, who: 'me', text, ts }]);
    setTInput('');
    try {
      await http.post(CHAT_MESSAGES, { chat: chatId, text });
    } catch (e: any) {
      const data = e?.response?.data;
      const detail =
        data?.detail ||
        Object.entries(data || {})
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
          .join(' | ') ||
        'Помилка мережі.';
      setTMsgs((p) => [...p, { key: `err-${now()}`, who: 'teacher', text: `❌ ${detail}`, ts: now() }]);
    }
  }

  // Авто-ініт чату, коли панель відкрита і дані готові
  useEffect(() => {
    if (isTeacherChatOpen && !chatId && !isChatLoading && (teacherId || manualPeer)) {
      void ensureTeacherChat(typeof manualPeer === 'number' ? manualPeer : undefined);
    }
  }, [isTeacherChatOpen, chatId, isChatLoading, teacherId, manualPeer]);

  /* ===================== UI: states ===================== */
  if (loading) {
    return (
      <main className="min-h-screen relative">
        <Backdrop />
        <div className="relative max-w-6xl mx-auto px-6 py-10">
          <div className="animate-pulse grid gap-5">
            <div className="h-14 rounded-2xl bg-white/70 ring-1 ring-black/5" />
            <div className="h-52 rounded-2xl bg-white/70 ring-1 ring-black/5" />
            <div className="h-4 w-1/2 rounded-lg bg-white/70 ring-1 ring-black/5" />
          </div>
        </div>
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="min-h-screen relative grid place-items-center px-6">
        <Backdrop />
        <div className="max-w-lg w-full rounded-2xl bg-white/95 ring-1 ring-black/5 p-6 shadow-[0_16px_44px_rgba(2,28,78,.14)]">
          <p className="text-lg font-semibold text-slate-800 mb-2">
            Урок не знайдено або ще недоступний.
          </p>
          {err && <p className="text-slate-600">{err}</p>}
          <div className="mt-4 flex gap-2">
            <Link
              href={`/student/courses/${courseId}/sections`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl ring-1 ring-slate-200 bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
              До розділів
            </Link>
          </div>
          <div className="mt-3 text-xs text-slate-500">Base API: {API_BASE}</div>
        </div>
      </main>
    );
  }

  return (
    <main className={`${serif ? 'font-serif' : 'font-sans'} min-h-screen relative`}>
      <Backdrop />

      {/* Sticky progress */}
      <div className="sticky top-0 z-50 h-[6px] bg-transparent">
        <div className="h-[6px] rounded-full neon-track transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* HERO */}
      <section className="relative z-10">
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-10 md:pt-14">
          <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur ring-1 ring-white/40 shadow">
            <div className="grid gap-6 p-6 sm:p-9 lg:grid-cols-[1.2fr_.8fr] items-start">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Link href={`/student/courses/${courseId}`} className="hover:underline">Курс</Link>
                  <span className="text-slate-400">/</span>
                  <Link href={`/student/courses/${courseId}/sections`} className="hover:underline">Розділи</Link>
                </div>

                <h1 className="mt-2 text-[30px] sm:text-[38px] md:[text-44px] font-black leading-[1.05] tracking-tight text-slate-900">
                  {lesson.title}
                </h1>

                <div className="mt-3 text-sm text-slate-700 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1"><BookOpen className="w-4 h-4" /> Урок</span>
                  {typeof lesson.duration_min === 'number' && (
                    <span className="inline-flex items-center gap-1"><Clock3 className="w-4 h-4" /> {lesson.duration_min} хв</span>
                  )}
                  <span className="inline-flex items-center gap-1"><Sparkles className="w-4 h-4" /> Автор: {authorName}</span>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAIChatOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-600 text-white hover:brightness-110 shadow-sm"
                  >
                    <Bot className="w-4 h-4" />
                    Запитати ШІ
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsTeacherChatOpen(true);
                      if (!chatInitRef.current) {
                        chatInitRef.current = true;
                        await ensureTeacherChat(typeof manualPeer === 'number' ? manualPeer : undefined);
                        if (!chatId) chatInitRef.current = false;
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white hover:brightness-110 shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Написати викладачу
                  </button>
                </div>
              </div>

              <aside className="w-full max-w-sm lg:justify-self-end">
                <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 shadow-sm text-slate-800">
                  <div className="text-sm text-slate-700">
                    Порада: <Kbd>Ctrl</Kbd> + <Kbd>+</Kbd>/<Kbd>−</Kbd> змінює розмір шрифту.
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <ControlTile title="Шрифт">
                      <button onClick={() => setSerif((s) => !s)} className="btn-mini"> {serif ? 'Serif' : 'Sans'} </button>
                    </ControlTile>
                    <ControlTile title="Розмір">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setFontSize((s) => Math.max(14, s - 1))} className="btn-mini">A−</button>
                        <span className="text-xs w-8 text-center">{fontSize}</span>
                        <button onClick={() => setFontSize((s) => Math.min(26, s + 1))} className="btn-mini">A+</button>
                      </div>
                    </ControlTile>
                    <ControlTile title="Інтерл.">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setLineHeight((h) => Math.max(1.4, Number((h - 0.1).toFixed(1))))} className="btn-mini">−</button>
                        <span className="text-xs w-8 text-center">{lineHeight.toFixed(1)}</span>
                        <button onClick={() => setLineHeight((h) => Math.min(2.2, Number((h + 0.1).toFixed(1))))} className="btn-mini">+</button>
                      </div>
                    </ControlTile>
                  </div>

                  <div className="mt-3">
                    <Link href={`/student/courses/${courseId}/sections`} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ring-slate-200 bg-white hover:bg-slate-50">
                      <ChevronLeft className="w-4 h-4" /> До розділів
                    </Link>
                  </div>
                </div>
              </aside>
            </div>

            <div className="h-px bg-slate-200" />
          </div>

          <p className="mt-3 text-sm text-slate-700">Завершуй урок → проходь тест → наступний відкриється автоматично.</p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 pb-24" ref={contentRef}>
          <div className="rounded-2xl overflow-hidden bg-white ring-1 ring-slate-200 shadow">
            <div className="bg-slate-50 p-5 border-b border-slate-200 text-sm text-slate-700">
              Порада: <Kbd>Ctrl</Kbd> + <Kbd>+</Kbd>/<Kbd>−</Kbd> — швидке масштабування тексту.
            </div>
            <div
              className="p-6 sm:p-9 prose max-w-none prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow"
              style={{ fontSize: `${fontSize}px`, lineHeight }}
            >
              {lesson.theory.map((html, i) => (
                <div key={i} className="mb-8" dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Link href={`/student/courses/${courseId}/sections`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl ring-1 ring-slate-200 bg-white hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
              До розділів
            </Link>
            <Link
              href={`/student/courses/${courseId}/sections/${sectionId}/lessons/${lesson.id}/test`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white bg-indigo-600 shadow hover:brightness-110"
            >
              <TestTubes className="w-5 h-5" />
              Пройти тест
            </Link>
          </div>
        </div>
      </section>

      {/* FABs */}
      <div className="fixed bottom-6 right-6 flex flex-col sm:flex-row gap-3 z-50">
        <button
          onClick={() => setIsAIChatOpen(true)}
          className="bg-sky-600 hover:brightness-110 text-white p-3 rounded-full shadow active:scale-95 inline-flex"
          title="Чат з ШІ"
        >
          <Bot className="w-5 h-5" />
        </button>
        <button
          onClick={async () => {
            setIsTeacherChatOpen(true);
            if (!chatInitRef.current) {
              chatInitRef.current = true;
              await ensureTeacherChat(typeof manualPeer === 'number' ? manualPeer : undefined);
              if (!chatId) chatInitRef.current = false;
            }
          }}
          className="bg-emerald-600 hover:brightness-110 text-white p-3 rounded-full shadow active:scale-95 inline-flex"
          title="Чат з викладачем"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Teacher Chat */}
      {isTeacherChatOpen && (
        <ChatPanel title={teacherName} tone="emerald" onClose={() => setIsTeacherChatOpen(false)}>
          {/* Якщо self-chat заблоковано — запропонувати вручну вказати peer */}
          {selfChatBlocked && !chatId && (
            <div className="p-3 border-b bg-amber-50 text-amber-800 text-sm">
              Ви є автором цього курсу, тож чат із самим собою недоступний.
              Вкажіть ID викладача (peer), з яким хочете говорити:
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  value={manualPeer}
                  onChange={(e) => setManualPeer(e.target.value === '' ? '' : Number(e.target.value))}
                  className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring focus:ring-amber-200"
                  placeholder="Напр.: 45"
                />
                <button
                  onClick={async () => {
                    if (manualPeer === '' || Number.isNaN(Number(manualPeer))) return;
                    setSelfChatBlocked(false);
                    chatInitRef.current = true;
                    await ensureTeacherChat(Number(manualPeer));
                    if (!chatId) chatInitRef.current = false;
                  }}
                  className="inline-flex items-center gap-1 bg-emerald-600 text-white px-4 rounded-2xl hover:brightness-110"
                >
                  Почати чат
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-emerald-50">
            {tMsgs.length === 0 ? (
              <p className="text-sm text-slate-600">{isChatLoading ? 'Створюємо чат…' : 'Напишіть повідомлення викладачу…'}</p>
            ) : (
              tMsgs.map((m) => (
                <Bubble key={m.key} role={m.who === 'me' ? 'user' : 'assistant'} ts={m.ts} text={m.text} />
              ))
            )}
            <div ref={tEndRef} />
          </div>
          <div className="p-3 border-t bg-white flex gap-2">
            <input
              type="text"
              value={tInput}
              onChange={(e) => setTInput(e.target.value)}
              className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring focus:ring-emerald-200"
              placeholder={isChatLoading ? 'Створюємо чат…' : chatId ? 'Напишіть повідомлення…' : 'Готуємо чат…'}
              disabled={isChatLoading || !chatId}
              onKeyDown={(e) => e.key === 'Enter' && sendToTeacher()}
            />
            <button
              onClick={sendToTeacher}
              disabled={isChatLoading || !chatId}
              className="inline-flex items-center gap-1 bg-emerald-600 text-white px-4 rounded-2xl disabled:opacity-50 hover:brightness-110"
            >
              <Send className="w-4 h-4" />
              Надіслати
            </button>
          </div>
        </ChatPanel>
      )}

      {/* AI Chat */}
      {isAIChatOpen && (
        <ChatPanel title="Чат з ШІ" tone="sky" onClose={() => setIsAIChatOpen(false)}>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-sky-50">
            {aiMsgs.length === 0 ? (
              <p className="text-sm text-slate-600">Поставте запитання по темі уроку…</p>
            ) : (
              aiMsgs.map((m, i) => <Bubble key={i} role={m.role} ts={m.ts} text={m.text} />)
            )}
            <div ref={aiEndRef} />
          </div>
          <div className="p-3 border-t bg-white flex gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring focus:ring-sky-200"
              placeholder="Напишіть повідомлення…"
              onKeyDown={(e) => e.key === 'Enter' && askAI()}
            />
            <button onClick={askAI} className="inline-flex items-center gap-1 bg-sky-600 text-white px-4 rounded-2xl hover:brightness-110">
              <Send className="w-4 h-4" />
              Надіслати
            </button>
          </div>
        </ChatPanel>
      )}

      {/* ==== styles ==== */}
      <style jsx global>{`
        .neon-track {
          background: linear-gradient(90deg, dodgerblue, mediumseagreen);
          box-shadow: 0 0 18px rgba(30, 144, 255, 0.35), 0 0 28px rgba(60, 179, 113, 0.25);
        }
        .btn-mini {
          padding: .25rem .5rem;
          border-radius: .5rem;
          border: 1px solid rgba(0,0,0,.1);
          background: rgba(0,0,0,.04);
        }
      `}</style>
    </main>
  );
}

/* ===================== Backdrop & Small UI ===================== */
function Backdrop() {
  return (
    <div
      className="absolute inset-0 -z-40"
      style={{
        background:
          'radial-gradient(1200px 800px at 10% -10%, rgba(255,255,255,1) 0%, transparent 55%), radial-gradient(1200px 800px at 110% 10%, rgba(176,196,222,1) 0%, transparent 55%), linear-gradient(180deg, lavender 0%, aliceblue 55%, lavender 100%)',
      }}
    />
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-slate-100 text-slate-800">{children}</kbd>;
}

function ControlTile({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-800">
      <div className="text-[11px] font-medium text-slate-600 mb-1">{title}</div>
      {children}
    </div>
  );
}

function ChatPanel({
  title,
  tone,
  onClose,
  children,
}: {
  title: string;
  tone: 'sky' | 'emerald';
  onClose: () => void;
  children: React.ReactNode;
}) {
  const grad = tone === 'sky' ? 'from-sky-600 to-indigo-600' : 'from-emerald-600 to-teal-600';
  return (
    <div className="fixed bottom-24 right-6 sm:w-[28rem] w-[92vw] bg-white shadow-2xl rounded-2xl border ring-1 ring-slate-200 flex flex-col h-[32rem] sm:h-[36rem] z-50 overflow-hidden">
      <div className={`p-3 bg-gradient-to-r ${grad} text-white font-semibold flex items-center justify-between`}>
        <div className="inline-flex items-center gap-2">
          {tone === 'sky' ? <Bot className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          <span>{title}</span>
        </div>
        <button onClick={onClose} className="px-2 py-1 rounded hover:opacity-85" aria-label="Закрити">✕</button>
      </div>
      {children}
    </div>
  );
}

function Bubble({ role, ts, text }: { role: 'user' | 'assistant'; ts: number; text: string }) {
  const mine = role === 'user';
  return (
    <div className={`p-2 rounded-xl max-w-[80%] break-words ${mine ? 'bg-sky-100 self-end text-right ml-auto shadow-sm' : 'bg-gray-100 text-left mr-auto shadow-sm'}`}>
      <div className="text-[10px] text-gray-500 mb-1">{fmtTime(ts)}</div>
      {text}
    </div>
  );
}
