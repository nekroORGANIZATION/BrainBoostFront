"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/* ===================== Types ===================== */
interface Choice { id: number; text: string }
interface Question {
  id: number;
  text: string;
  type: string; // single, multiple, true_false, short, long, code
  choices?: Choice[];
}
interface TestDTO {
  id: number;
  title: string;
  description: string;
  questions?: Question[];
  time_limit_sec?: number;
}
interface AnswerBreakdown {
  question: number;
  is_correct?: boolean;
  correct_option_ids?: number[];
  selected_option_ids?: number[];
  free_text?: string;
}

/* ===================== Component ===================== */
export default function LessonTestPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();

  const lessonId = Number(Array.isArray(params.lessonId) ? params.lessonId[0] : params.lessonId);
  const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId;

  const [test, setTest] = useState<TestDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string | number | number[] }>({});
  const [result, setResult] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<AnswerBreakdown[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  /* ===================== Effects ===================== */
  useEffect(() => {
    if (!lessonId || !token) {
      setError("Не вдалося отримати тест: користувач не авторизований.");
      setLoading(false);
      return;
    }

    async function fetchTestAndStartAttempt() {
      try {
        // 1) Load test
        const resTest = await fetch(`https://brainboost.pp.ua/api/api/tests/lessons/${lessonId}/test/`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!resTest.ok) {
          setError("Не вдалося завантажити тест.");
          return;
        }
        const data: TestDTO = await resTest.json();
        setTest(data);

        // 2) Start attempt
        const resAttempt = await fetch(`https://brainboost.pp.ua/api/api/tests/${data.id}/attempts/start/`, {
          method: "POST",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
        if (!resAttempt.ok) {
          setError("Не вдалося почати спробу тесту.");
          return;
        }
        const attemptData = await resAttempt.json();
        setAttemptId(attemptData.id);

        // 3) Timer start
        if (data.time_limit_sec) {
          setTimeLeft(data.time_limit_sec);
          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev === null) return null;
              if (prev <= 1) {
                clearInterval(timerRef.current!);
                handleSubmit(true); // авто-завершення
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } catch (e) {
        console.error("Error fetching or starting attempt:", e);
        setError("Помилка при завантаженні тесту або старті спроби.");
      } finally {
        setLoading(false);
      }
    }

    fetchTestAndStartAttempt();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lessonId, token]);

  /* ===================== Handlers ===================== */
  const handleAnswerChange = (questionId: number, choiceId: number) => {
    if (result || timeLeft === 0) return;
    setAnswers((prev) => {
      const q = test?.questions?.find((q) => q.id === questionId);
      if (!q) return prev;
      if (q.type === "multiple") {
        const current = Array.isArray(prev[questionId]) ? (prev[questionId] as number[]) : [];
        const exists = current.includes(choiceId);
        const updated = exists ? current.filter((c) => c !== choiceId) : [...current, choiceId];
        return { ...prev, [questionId]: updated };
      }
      return { ...prev, [questionId]: choiceId };
    });
  };

  const handleTextChange = (questionId: number, value: string) => {
    if (result || timeLeft === 0) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (auto = false) => {
    if (!test || !attemptId || !token || result) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setTimeLeft(null);
    }

    try {
      const res = await fetch(`https://brainboost.pp.ua/api/api/tests/${test.id}/attempts/${attemptId}/submit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          answers: Object.entries(answers)
            .map(([question, selected]) => {
              const q = test!.questions?.find((qq) => qq.id === Number(question));
              if (!q) return null;
              if (["short", "long", "code"].includes(q.type)) {
                return { question: Number(question), text: selected };
              }
              return { question: Number(question), selected };
            })
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        setResult("Помилка при відправленні тесту.");
        return;
      }

      const data = await res.json();
      setBreakdown(data.breakdown || null);
      setResult(auto ? `⏰ Час вичерпано. Ваш результат: ${data.score} із ${data.max_score}` : `Ваш результат: ${data.score} із ${data.max_score}`);
    } catch (e) {
      console.error("Error submitting test:", e);
      setResult("Помилка при відправленні тесту.");
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  /* ===================== UI ===================== */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="h-2 w-48 bg-sky-100 rounded-full overflow-hidden">
          <div className="h-full w-1/3 animate-pulse bg-gradient-to-r from-sky-200 via-sky-100 to-sky-200" />
        </div>
        <p className="text-sky-700 mt-4">Завантаження тесту…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl">Тест не знайдено або він ще недоступний.</div>
      </div>
    );
  }

  return (
    <div className="relative font-serif">
      {/* Header */}
      <header className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-sky-50 via-white to-blue-50" />
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-sky-900">{test.title}</h1>
            {test.description && <p className="text-sky-700 mt-2 max-w-2xl">{test.description}</p>}
          </div>
          {typeof test.time_limit_sec === "number" && timeLeft !== null && !result && (
            <div className="min-w-[220px]">
              <div className="text-sm text-sky-700 font-medium mb-1 text-right">⏳ Залишилось: {formatTime(timeLeft)}</div>
              <div className="w-full bg-sky-100 rounded-full h-2 overflow-hidden">
                <div className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 transition-all" style={{ width: `${(timeLeft / (test.time_limit_sec || 1)) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* Questions */}
        <div className="grid gap-6">
          {test.questions?.map((q, i) => {
            const breakdownItem = breakdown?.find((b) => b.question === q.id);
            const correctIds = breakdownItem?.correct_option_ids || [];
            const selectedAnswer = answers[q.id];
            const isAnswered = selectedAnswer !== undefined && selectedAnswer !== null && (typeof selectedAnswer === "string" ? selectedAnswer.trim().length > 0 : true);
            const afterSubmit = Boolean(result);
            const questionState = afterSubmit ? (breakdownItem?.is_correct ? "correct" : "wrong") : isAnswered ? "answered" : "neutral";

            return (
              <div
                key={q.id}
                className={
                  `rounded-2xl border bg-white shadow-sm ring-1 ring-black/5 overflow-hidden transition-colors ` +
                  (questionState === "correct" ? "border-green-300" : questionState === "wrong" ? "border-red-300" : "border-gray-200")
                }
              >
                <div className={`px-5 py-4 border-b bg-gradient-to-r from-white to-sky-50/60 flex items-center justify-between ${questionState === "correct" ? "border-green-200" : questionState === "wrong" ? "border-red-200" : ""}`}>
                  <div>
                    <p className="font-semibold text-sky-900">
                      {i + 1}. {q.text || "Текст питання відсутній"}
                    </p>
                    <p className="text-xs text-sky-700/70 mt-1">Тип: {q.type}</p>
                  </div>

                  {afterSubmit && (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${questionState === "correct" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                      {questionState === "correct" ? "✔ Правильно" : "✖ Неправильно"}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  {(q.type === "short" || q.type === "long" || q.type === "code") ? (
                    (q.type === "long" || q.type === "code") ? (
                      <textarea
                        rows={q.type === "code" ? 6 : 4}
                        disabled={afterSubmit || timeLeft === 0}
                        className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-sky-200 ${afterSubmit ? (breakdownItem?.is_correct ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300") : "bg-white"} ${q.type === "code" ? "font-mono" : ""}`}
                        placeholder={q.type === "code" ? "Вставте код…" : "Ваша відповідь…"}
                        value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                      />
                    ) : (
                      <input
                        type="text"
                        disabled={afterSubmit || timeLeft === 0}
                        className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-sky-200 ${afterSubmit ? (breakdownItem?.is_correct ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300") : "bg-white"}`}
                        placeholder="Коротка відповідь…"
                        value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                      />
                    )
                  ) : q.choices?.length ? (
                    <ul className="space-y-2">
                      {q.choices.map((c) => {
                        const selected = Array.isArray(selectedAnswer) ? (selectedAnswer as number[]).includes(c.id) : selectedAnswer === c.id;
                        const isCorrect = correctIds.includes(c.id);
                        const showGreen = afterSubmit && isCorrect; // правильний варіант — зелений
                        const showRed = afterSubmit && selected && !isCorrect; // обраний, але неправильний — червоний

                        return (
                          <li key={c.id}>
                            <label
                              className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-colors select-none 
                                ${!afterSubmit && selected ? "bg-sky-50 border-sky-300" : "bg-white"}
                                ${showGreen ? "bg-green-100 border-green-400" : ""}
                                ${showRed ? "bg-red-100 border-red-400" : ""}`}
                            >
                              <input
                                type={q.type === "multiple" ? "checkbox" : "radio"}
                                name={`question-${q.id}`}
                                value={c.id}
                                checked={selected}
                                disabled={afterSubmit || timeLeft === 0}
                                onChange={() => handleAnswerChange(q.id, c.id)}
                                className="h-4 w-4"
                              />
                              <span className={`${showGreen ? "text-green-800 font-medium" : ""} ${showRed ? "text-red-800" : ""}`}>{c.text}</span>
                              {afterSubmit && (
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${showGreen ? "bg-green-50 text-green-700 border-green-200" : showRed ? "bg-red-50 text-red-700 border-red-200" : "hidden"}`}>
                                  {showGreen ? "✔" : showRed ? "✖" : ""}
                                </span>
                              )}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">Немає варіантів відповіді для цього питання.</p>
                  )}

                  {/* Підсказка правильних варіантів, якщо відповідь неправильна */}
                  {afterSubmit && !breakdownItem?.is_correct && correctIds.length > 0 && q.choices?.length ? (
                    <div className="mt-3 text-sm">
                      <span className="text-sky-800">Правильна відповідь:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {q.choices.filter((c) => correctIds.includes(c.id)).map((c) => (
                          <span key={c.id} className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs">{c.text}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 z-30">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-2xl border bg-white/90 backdrop-blur shadow-lg ring-1 ring-black/5 px-4 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push(`/student/courses/${courseId}/lessons`)}
                className="px-4 py-2 rounded-xl border bg-sky-50 text-sky-900 hover:bg-sky-100"
              >
                ← Повернутися до уроків
              </button>

              <div className="flex items-center gap-3">
                {timeLeft !== null && !result && (
                  <span className="text-sm text-sky-700">⏳ {formatTime(timeLeft)}</span>
                )}
                {!result ? (
                  <button
                    type="submit"
                    disabled={timeLeft === 0}
                    className={`px-5 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition ${timeLeft === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Завершити тест
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.refresh()}
                    className="px-5 py-2 rounded-xl text-blue-700 bg-sky-50 hover:bg-sky-100 border"
                  >
                    Пройти ще раз
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div className="mx-auto max-w-5xl">
            <div className="mt-6 rounded-2xl border bg-gradient-to-r from-sky-50 to-blue-50 p-5 text-sky-900">
              <p className="text-lg font-semibold">{result}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
