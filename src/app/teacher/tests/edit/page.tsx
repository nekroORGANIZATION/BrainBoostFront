"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Lesson = { id: number; title: string };
type QuestionType = "single" | "multiple" | "true_false" | "short" | "long";
type ChoiceUI = { uid: string; text: string; isCorrect?: boolean; order?: number };
type QuestionUI = {
  id: number;
  type: QuestionType;
  text: string;
  points: number;
  order: number;
  options: ChoiceUI[];
  trueFalseAnswer?: "true" | "false";
  correctTextAnswer?: string;
};
type TestStatus = "draft" | "published" | "closed";
type TestDTO = {
  id?: number;
  lesson: number;
  title: string;
  description: string;
  status: TestStatus;
  time_limit_sec: number | null;
  attempts_allowed: number | null;
  pass_mark: number;
  questions: Array<{
    text: string;
    type: QuestionType;
    points: number;
    order: number;
    choices: Array<{ text: string; order: number; is_correct: boolean }>;
  }>;
};

const API = process.env.NEXT_PUBLIC_API_BASE || "https://brainboost.pp.ua/api";
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const makeEmptyQuestion = (seq: number): QuestionUI => ({
  id: seq,
  type: "single",
  text: "",
  points: 1,
  order: seq,
  options: [
    { uid: uid(), text: "", isCorrect: false, order: 1 },
    { uid: uid(), text: "", isCorrect: false, order: 2 },
  ],
  correctTextAnswer: "",
});

export default function EditTestPage() {
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<number | "">("");
  const [testId, setTestId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TestStatus>("draft");
  const [timeLimitMin, setTimeLimitMin] = useState<number | "">("");
  const [attemptsAllowed, setAttemptsAllowed] = useState<number | "">("");
  const [passMark, setPassMark] = useState<number | "">(60);
  const [questions, setQuestions] = useState<QuestionUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`${API}/api/lesson/lessons/mine/`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await r.json();
        setLessons(Array.isArray(data?.results) ? data.results : []);
      } catch (e) {
        console.error("Помилка при завантаженні уроків:", e);
      }
    })();
  }, [token]);

  useEffect(() => {
    setErr(null);
    setOk(null);
    if (!token || !selectedLessonId) return;

    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API}/api/tests/lessons/${selectedLessonId}/test/`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (r.status === 404) {
          setTestId(null);
          setTitle("");
          setDescription("");
          setStatus("draft");
          setTimeLimitMin("");
          setAttemptsAllowed("");
          setPassMark(60);
          setQuestions([makeEmptyQuestion(1)]);
          setOk("Тест для цього уроку ще не створений — заповніть форму і збережіть.");
          return;
        }
        if (!r.ok) throw new Error("Помилка при завантаженні тесту");

        const data = await r.json();
        setTestId(data.id ?? null);
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setStatus((data.status as TestStatus) ?? "draft");
        setTimeLimitMin(data.time_limit_sec ? Math.round(Number(data.time_limit_sec) / 60) : "");
        setAttemptsAllowed(typeof data.attempts_allowed === "number" ? data.attempts_allowed : "");
        setPassMark(typeof data.pass_mark === "number" ? Math.round(data.pass_mark) : 60);

        const qs: QuestionUI[] = Array.isArray(data.questions)
          ? data.questions.map((q: any, i: number) => {
              const base: QuestionUI = {
                id: i + 1,
                type: q.type as QuestionType,
                text: q.text ?? "",
                points: Number(q.points ?? 1),
                order: Number(q.order ?? i + 1),
                options: [],
                correctTextAnswer: "",
              };

              if (q.type === "single" || q.type === "multiple") {
                if (Array.isArray(q.choices)) {
                  base.options = q.choices.map((c: any, idx: number) => ({
                    uid: uid(),
                    text: c.text ?? "",
                    isCorrect: !!c.is_correct,
                    order: Number(c.order ?? idx + 1),
                  }));
                }
              } else if (q.type === "true_false") {
                if (Array.isArray(q.choices)) {
                  const t = q.choices.find((c: any) => String(c.text).toLowerCase() === "true");
                  const f = q.choices.find((c: any) => String(c.text).toLowerCase() === "false");
                  base.trueFalseAnswer = t?.is_correct ? "true" : f?.is_correct ? "false" : "true";
                }
              } else if (q.type === "short" || q.type === "long") {
                if (Array.isArray(q.choices) && q.choices.length) {
                  base.correctTextAnswer = q.choices[0].text ?? "";
                }
              }

              return base;
            })
          : [makeEmptyQuestion(1)];

        setQuestions(qs.length ? qs : [makeEmptyQuestion(1)]);
        setOk("Дані тесту завантажені.");
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || "Помилка при завантаженні тесту");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, selectedLessonId]);

  const addQuestion = () => {
    setQuestions((prev) => {
      const seq = prev.length ? Math.max(...prev.map((q) => q.id)) + 1 : 1;
      return [...prev, makeEmptyQuestion(seq)];
    });
  };
  const removeQuestion = (qid: number) => setQuestions((prev) => prev.filter((q) => q.id !== qid));
  const updateQuestion = (qid: number, patch: Partial<QuestionUI>) =>
    setQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, ...patch } : q)));
  const addOption = (qid: number) =>
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qid) return q;
        const nextOrder = (q.options?.length || 0) + 1;
        return {
          ...q,
          options: [...(q.options || []), { uid: uid(), text: "", isCorrect: false, order: nextOrder }],
        };
      })
    );
  const removeOption = (qid: number, optUid: string) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid ? { ...q, options: (q.options || []).filter((o) => o.uid !== optUid) } : q
      )
    );

  const handleSubmit = async () => {
    if (!token || !selectedLessonId) return;
    setSaving(true);
    setErr(null);
    setOk(null);

    try {
      const questionsDTO: TestDTO["questions"] = questions.map((q, idx) => {
        let choices: TestDTO["questions"][number]["choices"] = [];

        if (q.type === "single" || q.type === "multiple") {
          choices = (q.options || []).map((c, i) => ({
            text: c.text ?? "",
            order: Number(c.order ?? i + 1),
            is_correct: !!c.isCorrect,
          }));
        } else if (q.type === "true_false") {
          const ans = q.trueFalseAnswer === "false" ? "false" : "true";
          choices = [
            { text: "True", order: 1, is_correct: ans === "true" },
            { text: "False", order: 2, is_correct: ans === "false" },
          ];
        } else if (q.type === "short" || q.type === "long") {
          choices = [{ text: q.correctTextAnswer ?? "", order: 1, is_correct: true }];
        }

        return {
          text: q.text ?? "",
          type: q.type,
          points: Number(q.points ?? 1),
          order: Number(q.order ?? idx + 1),
          choices,
        };
      });

      const body: TestDTO = {
        id: testId ?? undefined,
        lesson: Number(selectedLessonId),
        title,
        description,
        status,
        time_limit_sec: timeLimitMin === "" ? null : Number(timeLimitMin) * 60,
        attempts_allowed: attemptsAllowed === "" ? null : Number(attemptsAllowed),
        pass_mark: passMark === "" ? 0 : Number(passMark),
        questions: questionsDTO,
      };

      const isUpdate = !!testId;
      const url = isUpdate ? `${API}/api/tests/${testId}/` : `${API}/api/tests/create/`;
      const method = isUpdate ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const msg = await r.text().catch(() => "");
        throw new Error(`Помилка при збереженні тесту. ${msg || ""}`.trim());
      }

      const saved = await r.json();
      if (!isUpdate && saved?.id) setTestId(saved.id);
      setOk(isUpdate ? "Зміни збережено." : "Тест створено.");
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Помилка при збереженні тесту");
    } finally {
      setSaving(false);
    }
  };

  const formDisabled = !selectedLessonId || saving;

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-4xl mx-auto p-6 font-sans">
        <h1 className="text-2xl font-bold text-center mb-6">Редагування тесту</h1>
        {/* Вибір уроку */}
        <div className="mb-6">
          <label className="block font-medium">Оберіть урок:</label>
          <select
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value ? Number(e.target.value) : "")}
            className="w-full border rounded-md p-2 mt-1"
          >
            <option value="">-- Оберіть урок --</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
          {loading && <div className="mt-2 text-sm text-slate-500">Завантаження тесту…</div>}
          {ok && (
            <div className="mt-2 rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-3 py-2">
              {ok}
            </div>
          )}
          {err && (
            <div className="mt-2 rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2">{err}</div>
          )}
        </div>

        {/* Форма редагування */}
        {selectedLessonId && (
          <div className="bg-white shadow-md rounded-xl p-6 space-y-5">
            {/* Загальні поля */}
            <div>
              <label className="block font-medium">Назва тесту</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-md p-2 mt-1"
                disabled={formDisabled}
              />
            </div>

            <div>
              <label className="block font-medium">Опис</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-md p-2 mt-1"
                disabled={formDisabled}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium">Статус</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TestStatus)}
                  className="w-full border rounded-md p-2 mt-1"
                  disabled={formDisabled}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-medium">Ліміт часу (хв)</label>
                <input
                  type="number"
                  min={0}
                  value={timeLimitMin}
                  onChange={(e) =>
                    setTimeLimitMin(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))
                  }
                  className="w-full border rounded-md p-2 mt-1"
                  disabled={formDisabled}
                />
              </div>

              <div>
                <label className="block font-medium">К-сть спроб</label>
                <input
                  type="number"
                  min={0}
                  value={attemptsAllowed}
                  onChange={(e) =>
                    setAttemptsAllowed(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))
                  }
                  className="w-full border rounded-md p-2 mt-1"
                  disabled={formDisabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium">Порог балів (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={passMark}
                  onChange={(e) =>
                    setPassMark(e.target.value === "" ? "" : Math.min(100, Math.max(0, Number(e.target.value))))
                  }
                  className="w-full border rounded-md p-2 mt-1"
                  disabled={formDisabled}
                />
              </div>
            </div>

            {/* Питання */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Питання</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg"
                  disabled={formDisabled}
                >
                  + Додати питання
                </button>
              </div>

              {questions.map((q) => (
                <div key={q.id} className="mt-4 border rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium">Текст питання</label>
                      <input
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                        className="w-full border rounded-md p-2 mt-1"
                        disabled={formDisabled}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Тип</label>
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const nextType = e.target.value as QuestionType;
                          updateQuestion(q.id, {
                            type: nextType,
                            options:
                              nextType === "single" || nextType === "multiple"
                                ? q.options.length
                                  ? q.options
                                  : [
                                      { uid: uid(), text: "", isCorrect: false, order: 1 },
                                      { uid: uid(), text: "", isCorrect: false, order: 2 },
                                    ]
                                : [],
                            trueFalseAnswer:
                              nextType === "true_false" ? q.trueFalseAnswer || "true" : undefined,
                            correctTextAnswer:
                              nextType === "short" || nextType === "long"
                                ? q.correctTextAnswer || ""
                                : undefined,
                          });
                        }}
                        className="w-full border rounded-md p-2 mt-1"
                        disabled={formDisabled}
                      >
                        <option value="single">Один варіант</option>
                        <option value="multiple">Кілька варіантів</option>
                        <option value="true_false">Правда / Брехня</option>
                        <option value="short">Коротка відповідь</option>
                        <option value="long">Розгорнута відповідь</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Бали</label>
                      <input
                        type="number"
                        min={1}
                        value={q.points}
                        onChange={(e) =>
                          updateQuestion(q.id, { points: Number(e.target.value) || 1 })
                        }
                        className="w-full border rounded-md p-2 mt-1"
                        disabled={formDisabled}
                      />
                    </div>

                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg"
                        disabled={formDisabled}
                      >
                        Видалити
                      </button>
                    </div>
                  </div>

                  {/* Опції */}
                  {(q.type === "single" || q.type === "multiple") && (
                    <div className="mt-3">
                      {q.options.map((opt) => (
                        <div key={opt.uid} className="flex items-center gap-2 mt-2">
                          <input
                            type={q.type === "single" ? "radio" : "checkbox"}
                            checked={!!opt.isCorrect}
                            onChange={(e) =>
                              updateQuestion(q.id, {
                                options: q.options.map((o) =>
                                  o.uid === opt.uid
                                    ? { ...o, isCorrect: e.target.checked }
                                    : q.type === "single"
                                    ? { ...o, isCorrect: false }
                                    : o
                                ),
                              })
                            }
                            disabled={formDisabled}
                          />
                          <input
                            value={opt.text}
                            onChange={(e) =>
                              updateQuestion(q.id, {
                                options: q.options.map((o) =>
                                  o.uid === opt.uid ? { ...o, text: e.target.value } : o
                                ),
                              })
                            }
                            className="border rounded-md p-1 flex-1"
                            disabled={formDisabled}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(q.id, opt.uid)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-lg"
                            disabled={formDisabled}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(q.id)}
                        className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg"
                        disabled={formDisabled}
                      >
                        + Додати опцію
                      </button>
                    </div>
                  )}

                  {/* True/False */}
                  {q.type === "true_false" && (
                    <div className="mt-3 flex items-center gap-4">
                      <label>
                        <input
                          type="radio"
                          checked={q.trueFalseAnswer === "true"}
                          onChange={() => updateQuestion(q.id, { trueFalseAnswer: "true" })}
                          disabled={formDisabled}
                        />{" "}
                        True
                      </label>
                      <label>
                        <input
                          type="radio"
                          checked={q.trueFalseAnswer === "false"}
                          onChange={() => updateQuestion(q.id, { trueFalseAnswer: "false" })}
                          disabled={formDisabled}
                        />{" "}
                        False
                      </label>
                    </div>
                  )}

                  {/* Short / Long */}
                  {(q.type === "short" || q.type === "long") && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium">Правильна відповідь</label>
                      <input
                        value={q.correctTextAnswer}
                        onChange={(e) => updateQuestion(q.id, { correctTextAnswer: e.target.value })}
                        className="border rounded-md p-2 w-full mt-1"
                        disabled={formDisabled}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-center space-x-4">
              {/* Кнопка повернення */}
              <button
                type="button"
                onClick={() => router.push("/teacher")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                ← Повернутись
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-lg"
                disabled={formDisabled}
              >
                Зберегти тест
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
