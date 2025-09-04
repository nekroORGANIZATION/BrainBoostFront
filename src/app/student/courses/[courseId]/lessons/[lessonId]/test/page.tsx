"use client";

import React, { useEffect, useState, useRef as _useRef } from 'react';
import { useParams, useRouter } from "next/navigation";

interface Choice {
  id: number;
  text: string;
}

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

  useEffect(() => {
    if (!lessonId || !token) {
      setError("Не вдалося отримати тест: користувач не авторизований.");
      setLoading(false);
      return;
    }

    async function fetchTestAndStartAttempt() {
      try {
        const resTest = await fetch(`https://brainboost.pp.ua/api/api/tests/lessons/${lessonId}/test/`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
        if (!resTest.ok) {
          setError("Не вдалося завантажити тест.");
          return;
        }

        const data: TestDTO = await resTest.json();
        setTest(data);

        const resAttempt = await fetch(
          `https://brainboost.pp.ua/api/api/tests/${data.id}/attempts/start/`,
          { method: "POST", headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
        );
        if (!resAttempt.ok) {
          setError("Не вдалося почати спробу тесту.");
          return;
        }
        const attemptData = await resAttempt.json();
        setAttemptId(attemptData.id);

        if (data.time_limit_sec) {
          setTimeLeft(data.time_limit_sec);
          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev === null) return null;
              if (prev <= 1) {
                clearInterval(timerRef.current!);
                handleSubmit(true); // автозавершення
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lessonId, token]);

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
      } else {
        return { ...prev, [questionId]: choiceId };
      }
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
      const res = await fetch(
        `https://brainboost.pp.ua/api/api/tests/${test.id}/attempts/${attemptId}/submit/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            answers: Object.entries(answers)
              .map(([question, selected]) => {
                const q = test.questions?.find((q) => q.id === Number(question));
                if (!q) return null;
                if (["short", "long", "code"].includes(q.type)) {
                  return { question: Number(question), text: selected };
                }
                return { question: Number(question), selected };
              })
              .filter(Boolean),
          }),
        }
      );

      if (!res.ok) {
        setResult("Помилка при відправленні тесту.");
        return;
      }

      const data = await res.json();
      setBreakdown(data.breakdown || null);
      setResult(
        auto
          ? `⏰ Час вичерпано. Ваш результат: ${data.score} із ${data.max_score}`
          : `Ваш результат: ${data.score} із ${data.max_score}`
      );
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

  if (loading) return <div className="max-w-4xl mx-auto p-6"><p>Завантаження тесту...</p></div>;
  if (error) return <div className="max-w-4xl mx-auto p-6 text-red-500"><p>{error}</p></div>;
  if (!test) return <div className="max-w-4xl mx-auto p-6"><p className="text-red-500">Тест не знайдено або він ще недоступний.</p></div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        className="bg-white p-6 rounded-lg shadow space-y-6"
      >
        <h1 className="text-3xl font-bold mb-2">{test.title}</h1>
        {test.description && <p className="mb-6 text-gray-600">{test.description}</p>}

        {timeLeft !== null && !result && (
          <div className="mb-4">
            <p className="text-lg font-semibold text-center mb-2">⏳ {formatTime(timeLeft)}</p>
            <div className="w-full bg-gray-200 rounded h-4">
              <div
                className="bg-blue-500 h-4 rounded transition-all"
                style={{ width: `${(timeLeft / (test.time_limit_sec || 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {test.questions?.map((q, i) => {
          const breakdownItem = breakdown?.find((b) => b.question === q.id);
          const correctIds = breakdownItem?.correct_option_ids || [];
          const selectedAnswer = answers[q.id];

          const isTextCorrect = breakdownItem?.is_correct && typeof selectedAnswer === "string";
          const isSingleCorrect = breakdownItem?.is_correct && typeof selectedAnswer === "number";
          const isMultipleCorrect = breakdownItem?.is_correct && Array.isArray(selectedAnswer);

          return (
            <div key={q.id} className="mb-6 p-4 border rounded-lg">
              <p className="font-semibold mb-3">{i + 1}. {q.text || "Текст питання відсутній"}</p>

              {(q.type === "short" || q.type === "long" || q.type === "code") ? (
                <input
                  type="text"
                  disabled={!!result || timeLeft === 0}
                  className={`border p-1 rounded w-full ${
                    result
                      ? isTextCorrect
                        ? "bg-green-200"
                        : "bg-red-200"
                      : ""
                  }`}
                  value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                />
              ) : q.choices?.length ? (
                <ul className="space-y-2">
                  {q.choices.map((c) => {
                    const selected = Array.isArray(selectedAnswer)
                      ? (selectedAnswer as number[]).includes(c.id)
                      : selectedAnswer === c.id;
                    const isCorrect = correctIds.includes(c.id);
                    const showGreen = result && isCorrect;
                    const showRed = result && selected && !isCorrect;

                    return (
                      <li
                        key={c.id}
                        className={`flex items-center space-x-2 p-1 rounded
                          ${!result && selected ? "bg-blue-200" : ""}
                          ${showGreen ? "bg-green-200" : ""}
                          ${showRed ? "bg-red-200" : ""}`}
                      >
                        <input
                          type={q.type === "multiple" ? "checkbox" : "radio"}
                          name={`question-${q.id}`}
                          value={c.id}
                          checked={selected}
                          disabled={!!result || timeLeft === 0}
                          onChange={() => handleAnswerChange(q.id, c.id)}
                        />
                        <label>{c.text}</label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Немає варіантів відповіді для цього питання.</p>
              )}
            </div>
          );
        })}

        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => router.push(`/student/courses/${courseId}/lessons`)}
            className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded"
          >
            Повернутися до уроків
          </button>

          {!result && (
            <button
              type="submit"
              disabled={timeLeft === 0}
              className={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded ${timeLeft === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Завершити тест
            </button>
          )}
        </div>

        {result && <p className="mt-4 font-semibold text-lg">{result}</p>}
      </form>
    </div>
  );
}
