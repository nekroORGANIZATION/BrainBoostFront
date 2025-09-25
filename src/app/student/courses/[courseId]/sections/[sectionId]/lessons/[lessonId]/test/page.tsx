'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Hourglass,
  TimerReset,
  ChevronLeft,
  BookOpenCheck,
  PartyPopper,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ===================== Types ===================== */
interface Choice { id: number; text: string }
interface Question {
  id: number;
  text: string;
  type: 'single' | 'multiple' | 'true_false' | 'short' | 'long' | 'code';
  choices?: Choice[];
}
interface TestDTO {
  id: number;
  title: string;
  description?: string;
  time_limit_sec?: number | null;
  pass_mark?: number | null; // %
  questions?: Question[];
}
interface AnswerBreakdown {
  question: number;
  is_correct?: boolean;
  correct_option_ids?: number[];
  selected_option_ids?: number[];
  free_text?: string;
}
type AnswersMap = Record<number, string | number | number[]>;

/* ===================== API ===================== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

const API = {
  lessonTest    : (lessonId: number) => `${API_BASE}/api/tests/lessons/${lessonId}/test/`,
  startAttempt  : (testId: number)   => `${API_BASE}/api/tests/${testId}/attempts/start/`,
  submitAttempt : (testId: number, attemptId: number) => `${API_BASE}/api/tests/${testId}/attempts/${attemptId}/submit/`,
  progress      : (lessonId: number) => `${API_BASE}/api/lesson/progress/${lessonId}/`,
};

function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    sessionStorage.getItem('access') ||
    localStorage.getItem('access') ||
    localStorage.getItem('accessToken') ||
    null
  );
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = readToken();
  const h: Record<string, string> = { Accept: 'application/json', ...(extra || {}) };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

const formatTime = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

/* ===================== Small UI ===================== */
function Backdrop() {
  return (
    <>
      {/* м’який світлий градієнт */}
      <div
        className="absolute inset-0 -z-40"
        style={{
          background:
            'linear-gradient(180deg, #eef3ff 0%, #f4f7ff 55%, #ffffff 100%)',
        }}
      />
      {/* делікатні плями */}
      <div className="pointer-events-none absolute inset-0 -z-30">
        <div
          className="absolute -top-28 -left-32 h-[26rem] w-[26rem] rounded-full blur-[120px] opacity-60"
          style={{ background: 'radial-gradient(closest-side, rgba(99,102,241,.16), transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -right-28 h-[24rem] w-[24rem] rounded-full blur-[120px] opacity-55"
          style={{ background: 'radial-gradient(closest-side, rgba(56,189,248,.14), transparent 70%)' }}
        />
      </div>
      {/* легка зернистість */}
      <div
        className="absolute inset-0 -z-20 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(2,6,23,.12) 1px, transparent 1px), radial-gradient(rgba(2,6,23,.06) 1px, transparent 1px)',
          backgroundPosition: '0 0, 14px 14px',
          backgroundSize: '28px 28px',
        }}
      />
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="px-1.5 py-0.5 border rounded text-xs bg-slate-100">{children}</kbd>;
}

function RingProgress({ value }: { value: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const off = c - (c * Math.min(100, Math.max(0, value))) / 100;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0">
      <circle cx="24" cy="24" r={r} stroke="rgba(2,6,23,.1)" strokeWidth="6" fill="none" />
      <circle
        cx="24" cy="24" r={r}
        stroke="url(#grad)" strokeWidth="6" fill="none"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <text x="24" y="26" textAnchor="middle" fontSize="12" fill="#0b1220" fontWeight={700}>
        {Math.round(value)}%
      </text>
    </svg>
  );
}

/* ===================== Page ===================== */
export default function LessonTestPage() {
  const params = useParams<{ courseId: string; sectionId: string; lessonId: string }>();
  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId;
  const sectionId = Array.isArray(params.sectionId) ? params.sectionId[0] : params.sectionId;
  const lessonId = Number(Array.isArray(params.lessonId) ? params.lessonId[0] : params.lessonId);
  const router = useRouter();

  // base state
  const [test, setTest] = useState<TestDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // attempt state
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const autoSubmittedRef = useRef(false);

  // result
  const [result, setResult] = useState<{ passed: boolean; score: number; maxScore: number; percent: number } | null>(null);
  const [breakdown, setBreakdown] = useState<AnswerBreakdown[] | null>(null);

  // reveal animation
  const [revealed, setRevealed] = useState<number[]>([]);
  const revealIntervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // question anchors (для навігації)
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
    };
  }, []);

  /* ===================== Load test & start attempt ===================== */
  useEffect(() => {
    if (!lessonId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) get test
        const rTest = await fetch(API.lessonTest(lessonId), { headers: buildHeaders(), cache: 'no-store' });
        if (!rTest.ok) {
          const txt = await rTest.text().catch(() => '');
          if (rTest.status === 404) throw new Error('Тест для цього уроку не знайдено або ще не опублікований.');
          if (rTest.status === 403) throw new Error('Тест тимчасово недоступний (вікно доступу або права).');
          if (rTest.status === 401) throw new Error('Потрібен вхід. Спробуй оновити сторінку або увійти заново.');
          throw new Error(`Не вдалося завантажити тест. HTTP ${rTest.status} ${txt}`);
        }
        const data: TestDTO = await rTest.json();
        if (!mountedRef.current) return;
        setTest(data);

        // 2) start attempt
        const rStart = await fetch(API.startAttempt(data.id), { method: 'POST', headers: buildHeaders() });
        if (!rStart.ok) {
          const txt = await rStart.text().catch(() => '');
          throw new Error(`Не вдалося почати спробу тесту. ${rStart.status} ${txt}`);
        }
        const at = await rStart.json();
        if (!mountedRef.current) return;
        setAttemptId(at.id);

        // 3) progress → started
        fetch(API.progress(lessonId), {
          method: 'POST',
          headers: buildHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ state: 'started' }),
        }).catch(() => {});

        // 4) timer
        const limit = data.time_limit_sec ?? null;
        if (limit && limit > 0) {
          setTimeLeft(limit);
          timerRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
              if (prev === null) return null;
              if (prev <= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                if (!autoSubmittedRef.current) {
                  autoSubmittedRef.current = true;
                  void onSubmit(true);
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setTimeLeft(null);
        }
      } catch (e: any) {
        if (!mountedRef.current) return;
        setError(e?.message || 'Помилка завантаження тесту.');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lessonId]);

  /* ===================== Derived values ===================== */
  const totalQ = useMemo(() => test?.questions?.length ?? 0, [test]);
  const answeredCount = useMemo(() => {
    if (!test?.questions) return 0;
    return test.questions.reduce((acc, q) => {
      const v = answers[q.id];
      if (q.type === 'multiple') return acc + (Array.isArray(v) && v.length ? 1 : 0);
      return acc + (v !== undefined && v !== null && String(v).length > 0 ? 1 : 0);
    }, 0);
  }, [answers, test?.questions]);
  const progressPct = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;

  /* ===================== Handlers ===================== */
  const changeOption = (qid: number, optId: number) => {
    if (result || timeLeft === 0) return;
    setAnswers(prev => {
      const q = test?.questions?.find(x => x.id === qid);
      if (!q) return prev;
      if (q.type === 'multiple') {
        const curr = Array.isArray(prev[qid]) ? (prev[qid] as number[]) : [];
        const updated = curr.includes(optId) ? curr.filter(i => i !== optId) : [...curr, optId];
        return { ...prev, [qid]: updated };
      }
      return { ...prev, [qid]: optId };
    });
  };

  const changeText = (qid: number, val: string) => {
    if (result || timeLeft === 0) return;
    setAnswers(prev => ({ ...prev, [qid]: val }));
  };

  const scrollToQuestion = (qid: number) => {
    const node = questionRefs.current[qid];
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ===================== Submit ===================== */
  const onSubmit = async (auto = false) => {
    if (!test || !attemptId || result) return;

    // stop timers
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTimeLeft(null);
    if (revealIntervalRef.current) { clearInterval(revealIntervalRef.current); revealIntervalRef.current = null; }
    setRevealed([]);

    try {
      // build payload
      const payload: any[] = [];
      const qMap = new Map<number, Question>();
      (test.questions || []).forEach(q => qMap.set(q.id, q));

      for (const [qidStr, val] of Object.entries(answers)) {
        const qid = Number(qidStr);
        const q = qMap.get(qid);
        if (!q) continue;

        if (['short', 'long', 'code'].includes(q.type)) {
          payload.push({ question: qid, text: String(val ?? '') });
        } else if (q.type === 'multiple') {
          const arr = Array.isArray(val) ? (val as number[]) : (val ? [Number(val)] : []);
          payload.push({ question: qid, selected: arr });
        } else {
          const sel = Array.isArray(val) ? (val[0] ?? null) : (val ?? null);
          if (sel !== null) payload.push({ question: qid, selected: Number(sel) });
          else payload.push({ question: qid });
        }
      }

      // submit
      const r = await fetch(API.submitAttempt(test.id, attemptId), {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ answers: payload }),
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        throw new Error(`Помилка надсилання. ${r.status} ${txt}`);
      }
      const data = await r.json();

      const score = Number(data.score ?? 0);
      const maxScore = Number(data.max_score ?? test.questions?.length ?? 0);
      const percent = maxScore > 0 ? (score / maxScore) * 100 : 0;
      const passed = percent >= (test.pass_mark ?? 0);

      if (!mountedRef.current) return;
      setBreakdown((data.breakdown ?? null) as AnswerBreakdown[] | null);
      setResult({ passed, score, maxScore, percent });

      // progress → completed
      fetch(API.progress(lessonId), {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ state: 'completed', result_percent: Math.round(percent) }),
      }).catch(() => {});

      // smooth reveal
      const ids = Array.isArray(test.questions)
        ? (test.questions.map(q => q?.id).filter(Boolean) as number[])
        : [];
      let i = 0;
      revealIntervalRef.current = window.setInterval(() => {
        if (!mountedRef.current) {
          if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
          return;
        }
        if (i >= ids.length) {
          if (revealIntervalRef.current) {
            clearInterval(revealIntervalRef.current);
            revealIntervalRef.current = null;
          }
          return;
        }
        const id = ids[i++];
        setRevealed(prev => (prev.includes(id) ? prev : [...prev, id]));
      }, 220);
    } catch (e: any) {
      if (!mountedRef.current) return;
      setError(e?.message || 'Помилка при відправленні тесту.');
      setResult({ passed: false, score: 0, maxScore: test?.questions?.length ?? 0, percent: 0 });
    }
  };

  /* ===================== UI: states ===================== */
  if (loading) {
    return (
      <main className="min-h-screen relative">
        <Backdrop />
        <div className="relative max-w-6xl mx-auto px-6 py-10">
          <div className="animate-pulse grid gap-5">
            <div className="h-14 rounded-2xl bg-white/70 ring-1 ring-black/5" />
            <div className="h-20 rounded-2xl bg-white/70 ring-1 ring-black/5" />
            <div className="h-4 w-1/2 rounded-lg bg-white/70 ring-1 ring-black/5" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen relative grid place-items-center px-6">
        <Backdrop />
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-lg w-full rounded-2xl bg-white/95 ring-1 ring-slate-200 p-6 shadow-[0_16px_44px_rgba(2,28,78,.12)]"
        >
          <div className="flex items-center gap-2 text-rose-700 font-semibold mb-2">
            <AlertTriangle className="w-5 h-5" />
            Помилка
          </div>
          <p className="text-slate-700 whitespace-pre-wrap">{error}</p>
          <div className="mt-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl ring-1 ring-slate-200 bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </button>
          </div>
        </motion.div>
      </main>
    );
  }

  if (!test || !test.questions?.length) {
    return (
      <main className="min-h-screen relative grid place-items-center px-6">
        <Backdrop />
        <div className="max-w-lg w-full rounded-2xl bg-white/95 ring-1 ring-slate-200 p-6 shadow">
          <p className="text-slate-700">Тест не знайдено.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      <Backdrop />

      {/* Sticky top progress (answered %) */}
      <div className="sticky top-0 z-50 h-[6px] bg-transparent">
        <motion.div
          key={progressPct}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ type: 'spring', stiffness: 160, damping: 22 }}
          className="h-[6px] rounded-full"
          style={{
            background:
              'linear-gradient(90deg, #8b5cf6 0%, #22d3ee 50%, #10b981 100%)',
            boxShadow: '0 0 12px rgba(34,211,238,.25), 0 0 18px rgba(139,92,246,.18)',
          }}
        />
      </div>

      {/* HERO / meta */}
      <section className="relative z-10">
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-8 md:pt-12">
          <motion.div
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-3xl bg-white/70 backdrop-blur-xl ring-1 ring-white/60 shadow-[0_24px_60px_rgba(2,28,78,.12)] p-6 md:p-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-6 lg:gap-10 items-start">
              {/* title / desc */}
              <div className="min-w-0">
                <h1 className="text-[30px] sm:text-[38px] md:text-[44px] font-black leading-[1.05] tracking-tight text-[#0f1f3d] flex items-center gap-3">
                  {test.title}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                    <Trophy className="w-3.5 h-3.5" /> Тест
                  </span>
                </h1>
                {test.description && (
                  <p className="text-slate-600 mt-2 max-w-2xl">{test.description}</p>
                )}

                <div className="mt-4 text-sm text-slate-600">
                  Порада: <Kbd>Ctrl</Kbd> + <Kbd>+</Kbd>/<Kbd>−</Kbd> — швидке масштабування сторінки.
                </div>
              </div>

              {/* meta card */}
              <div className="w-full max-w-xl lg:max-w-none">
                <div className="rounded-2xl ring-1 ring-slate-200 bg-white/80 backdrop-blur p-4 sm:p-5 shadow">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <RingProgress value={progressPct} />
                      <div>
                        <div className="text-xs text-slate-500">Прогрес</div>
                        <div className="text-sm font-semibold text-[#0b1220]">
                          {answeredCount}/{totalQ} • {progressPct}%
                        </div>
                      </div>
                    </div>

                    {typeof test.time_limit_sec === 'number' && timeLeft !== null && !result && (
                      <div className="flex items-center gap-3 justify-start sm:justify-end">
                        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ring-slate-200 bg-white">
                          <Hourglass className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold text-[#0F2E64]">{formatTime(timeLeft)}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {!result && (
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => setAnswers({})}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ring-1 ring-slate-200 bg-white text-sm hover:bg-slate-50"
                        title="Очистити всі відповіді"
                      >
                        <TimerReset className="w-4 h-4" />
                        Очистити
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* навігація по питаннях (чіпи) */}
          <div className="mt-4 overflow-x-auto">
            <div className="inline-flex gap-2 p-2 rounded-2xl bg-white/70 backdrop-blur ring-1 ring-slate-200 shadow">
              {test.questions.map((q, idx) => {
                const v = answers[q.id];
                const answered =
                  q.type === 'multiple'
                    ? Array.isArray(v) && v.length > 0
                    : v !== undefined && v !== null && String(v).length > 0;
                return (
                  <button
                    key={q.id}
                    onClick={() => scrollToQuestion(q.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm ring-1 transition ${
                      answered
                        ? 'bg-emerald-50 ring-emerald-200 text-emerald-700'
                        : 'bg-white ring-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title={`Питання ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* QUESTIONS */}
      <form
        onSubmit={(e) => { e.preventDefault(); void onSubmit(false); }}
        className="max-w-6xl mx-auto px-4 md:px-6 pb-28 pt-6 grid grid-cols-1 lg:grid-cols-[1fr] gap-6"
      >
        <AnimatePresence initial={false}>
          {test.questions.map((q, i) => {
            const br = breakdown?.find(b => b.question === q.id);
            const isOpen = !!result && revealed.includes(q.id);
            const correctIds = br?.correct_option_ids ?? [];
            const v = answers[q.id];

            return (
              <motion.div
                key={q.id}
                ref={(el) => { questionRefs.current[q.id] = el; }}  // ← блок із фігурними дужками
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 140, damping: 16 }}
                className="rounded-2xl border bg-white/90 backdrop-blur ring-1 ring-slate-200 shadow-[0_12px_36px_rgba(2,28,78,.10)] overflow-hidden"
              >

                <div className="px-5 py-4 border-b flex items-center justify-between gap-4">
                  <p className="font-semibold text-[#0F2E64] flex-1">
                    {i + 1}. {q.text}
                  </p>

                  <AnimatePresence mode="popLayout">
                    {!!result && isOpen && typeof br?.is_correct !== 'undefined' && (
                      <motion.span
                        initial={{ y: -8, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -8, opacity: 0, scale: 0.95 }}
                        className={`inline-flex items-center gap-1 text-sm font-semibold ${
                          br.is_correct ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {br.is_correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {br.is_correct ? 'Правильно' : 'Неправильно'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {['short', 'long', 'code'].includes(q.type) ? (
                  <div className="p-5">
                    <textarea
                      className={`w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 min-h-[120px] transition-colors ${
                        !!result && isOpen ? (br?.is_correct ? 'bg-emerald-50' : 'bg-rose-50') : ''
                      }`}
                      value={(v as string) || ''}
                      onChange={(e) => changeText(q.id, e.target.value)}
                      disabled={!!result || timeLeft === 0}
                      placeholder="Ваша відповідь…"
                    />
                    {!!result && isOpen && br?.free_text && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm text-slate-600">
                        Еталонна відповідь:{' '}
                        <span className="font-medium text-slate-800">{br.free_text}</span>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 sm:p-5 grid gap-2">
                    {q.choices?.map((c) => {
                      const userSelected =
                        q.type === 'multiple'
                          ? Array.isArray(v) && (v as number[]).includes(c.id)
                          : v === c.id;

                      const revealHighlight =
                        !!result && isOpen
                          ? correctIds.includes(c.id)
                            ? 'bg-emerald-50 ring-emerald-200'
                            : userSelected
                              ? 'bg-rose-50 ring-rose-200'
                              : ''
                          : '';

                      return (
                        <motion.label
                          key={c.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`flex items-center gap-3 p-3 rounded-xl ring-1 ring-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ${revealHighlight}`}
                        >
                          <input
                            type={q.type === 'multiple' ? 'checkbox' : 'radio'}
                            name={`q-${q.id}`}
                            className="w-4 h-4"
                            checked={!!userSelected}
                            onChange={() => changeOption(q.id, c.id)}
                            disabled={!!result || timeLeft === 0}
                          />
                          <span>{c.text}</span>
                        </motion.label>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!result && (
          <div className="sticky bottom-4 z-30">
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-6xl mx-auto">
              <div className="rounded-2xl bg-white/90 backdrop-blur ring-1 ring-slate-200 p-3 shadow-[0_16px_44px_rgba(2,28,78,.18)] flex items-center justify-between">
                <div className="text-sm text-slate-700">
                  Відповіли: <b>{answeredCount}</b> з <b>{totalQ}</b>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white hover:brightness-110 shadow"
                >
                  <BookOpenCheck className="w-5 h-5" />
                  Завершити тест
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </form>

      {/* RESULT MODAL */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 160, damping: 18 }}
              className="w-[min(96vw,560px)] rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-center mb-3">
                {result.passed ? (
                  <PartyPopper className="w-10 h-10 text-emerald-600" />
                ) : (
                  <XCircle className="w-10 h-10 text-rose-600" />
                )}
              </div>
              <h2 className="text-xl font-bold text-center">
                {result.passed ? 'Тест пройдено!' : 'Результат недостатній'}
              </h2>
              <p className="text-center text-slate-700 mt-2">
                {Math.round(result.percent)}% ({result.score} / {result.maxScore})
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => router.push(`/student/courses/${courseId}/sections`)}
                  className="px-4 py-2 rounded-xl ring-1 ring-slate-200 bg-white"
                >
                  До розділів
                </button>
                <button
                  onClick={() => router.push(`/student/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`)}
                  className="px-4 py-2 rounded-2xl bg-indigo-600 text-white hover:brightness-110"
                >
                  Повернутися до теорії
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
