"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Lesson = {
  id: number;
  title: string;
};

type QuestionType = "single" | "multiple" | "true_false" | "short" | "long";

type Choice = {
  text: string;
  is_correct?: boolean;
  order: number;
};

type Question = {
  id: number;
  type: QuestionType;
  text: string;
  points: number;
  order: number;
  choices: Choice[];
  correctTextAnswer?: string; // замість correctAnswers
};

type TestStatus = "draft" | "published" | "closed";

export default function AddTestPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [testExists, setTestExists] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TestStatus>("draft");
  const [timeLimitMin, setTimeLimitMin] = useState<number | null>(null);
  const [attemptsAllowed, setAttemptsAllowed] = useState<number | null>(null);
  const [passMark, setPassMark] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    if (!token) return;
    fetch("https://brainboost.pp.ua/api/api/lesson/lessons/mine/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setLessons(data.results || []))
      .catch((err) => console.error("Помилка при завантаженні уроків:", err));
  }, [token]);

  useEffect(() => {
    if (!selectedLesson || !token) return;
    fetch(`https://brainboost.pp.ua/api/api/tests/check/${selectedLesson}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTestExists(data.exists))
      .catch((err) => console.error("Помилка при перевірці тесту:", err));
  }, [selectedLesson, token]);

  const handleSubmit = () => {
    if (!selectedLesson) return alert("Оберіть урок!");

    // Перетворюємо питання для бекенду
    const payloadQuestions = questions.map((q) => {
      let choices: Choice[] = [];

      if (q.type === "single" || q.type === "multiple") {
        choices = q.choices.map((c, idx) => ({
          text: c.text,
          is_correct: !!c.is_correct,
          order: idx + 1,
        }));
      } else if (q.type === "true_false") {
        choices = [
          { text: "True", order: 1, is_correct: q.correctTextAnswer === "true" },
          { text: "False", order: 2, is_correct: q.correctTextAnswer === "false" },
        ];
      } else if (q.type === "short" || q.type === "long") {
        choices = [{ text: q.correctTextAnswer || "", order: 1, is_correct: true }];
      }

      return {
        text: q.text,
        type: q.type,
        points: q.points,
        order: q.order,
        choices,
      };
    });

    const payload = {
      lesson: selectedLesson,
      title,
      description,
      status,
      time_limit_sec: timeLimitMin ? timeLimitMin * 60 : null,
      attempts_allowed: attemptsAllowed,
      pass_mark: passMark,
      questions: payloadQuestions,
    };

    console.log("TEST PAYLOAD:", payload);

    fetch("https://brainboost.pp.ua/api/api/tests/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(() => alert("Тест створено!"))
      .catch((err) => console.error("Помилка при створенні тесту:", err));
  };

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-4xl mx-auto p-6 font-sans">
        <h1 className="text-2xl font-bold text-center mb-6">Створення тесту</h1>

        {/* Основна форма */}
        <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
          <div>
            <label className="block font-medium">Оберіть урок:</label>
            <select
              value={selectedLesson ?? ""}
              onChange={(e) => setSelectedLesson(Number(e.target.value))}
              className="w-full border rounded-md p-2 mt-1"
            >
              <option value="">-- оберіть урок --</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            {testExists && selectedLesson && (
              <p className="text-red-500 mt-1">
                Для цього уроку вже є тест. Ви можете його редагувати.
              </p>
            )}
          </div>

          <div>
            <label className="block font-medium">Назва тесту:</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md p-2 mt-1"
            />
          </div>

          <div>
            <label className="block font-medium">Опис:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-md p-2 mt-1"
            />
          </div>

          <div>
            <label className="block font-medium">Статус:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TestStatus)}
              className="w-full border rounded-md p-2 mt-1"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Час (хв):</label>
              <input
                type="number"
                value={timeLimitMin ?? ""}
                onChange={(e) => setTimeLimitMin(Number(e.target.value))}
                className="w-full border rounded-md p-2 mt-1"
              />
            </div>

            <div>
              <label className="block font-medium">Кількість спроб:</label>
              <input
                type="number"
                value={attemptsAllowed ?? ""}
                onChange={(e) => setAttemptsAllowed(Number(e.target.value))}
                className="w-full border rounded-md p-2 mt-1"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium">Мінімальна оцінка (%):</label>
            <input
              type="number"
              value={passMark}
              onChange={(e) => setPassMark(Number(e.target.value))}
              className="w-full border rounded-md p-2 mt-1"
            />
          </div>
        </div>

        {/* Питання */}
        <div className="mt-8 bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Питання</h2>

          {questions.map((q) => (
            <div
              key={q.id}
              className="border rounded-lg p-4 mb-4 bg-gray-50 space-y-3"
            >
              <div>
                <label className="block text-sm font-medium">Тип питання:</label>
                <select
                  value={q.type}
                  onChange={(e) =>
                    setQuestions((prev) =>
                      prev.map((item) =>
                        item.id === q.id
                          ? { ...item, type: e.target.value as QuestionType }
                          : item
                      )
                    )
                  }
                  className="w-full border rounded-md p-2 mt-1"
                >
                  <option value="single">Одновибіркове</option>
                  <option value="multiple">Мультивибір</option>
                  <option value="true_false">Правда/Неправда</option>
                  <option value="short">Коротка відповідь</option>
                  <option value="long">Довга відповідь</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Текст питання:</label>
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) =>
                    setQuestions((prev) =>
                      prev.map((item) =>
                        item.id === q.id ? { ...item, text: e.target.value } : item
                      )
                    )
                  }
                  className="w-full border rounded-md p-2 mt-1"
                />
              </div>

              {(q.type === "single" ||
                q.type === "multiple" ||
                q.type === "true_false") && (
                <div>
                  <label className="block text-sm font-medium">Варіанти:</label>
                  {q.choices.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        placeholder={`Варіант ${idx + 1}`}
                        value={opt.text}
                        onChange={(e) =>
                          setQuestions((prev) =>
                            prev.map((item) => {
                              if (item.id === q.id) {
                                const newChoices = [...item.choices];
                                newChoices[idx].text = e.target.value;
                                return { ...item, choices: newChoices };
                              }
                              return item;
                            })
                          )
                        }
                        className="flex-1 border rounded-md p-2"
                      />
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={opt.is_correct || false}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((item) => {
                                if (item.id === q.id) {
                                  const newChoices = [...item.choices];
                                  newChoices[idx].is_correct = e.target.checked;
                                  return { ...item, choices: newChoices };
                                }
                                return item;
                              })
                            )
                          }
                        />
                        Правильна
                      </label>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setQuestions((prev) =>
                        prev.map((item) =>
                          item.id === q.id
                            ? {
                                ...item,
                                choices: [
                                  ...item.choices,
                                  { text: "", is_correct: false, order: item.choices.length + 1 },
                                ],
                              }
                            : item
                        )
                      )
                    }
                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                  >
                    Додати варіант
                  </button>
                </div>
              )}

              {(q.type === "short" || q.type === "long") && (
                <div>
                  <label className="block text-sm font-medium">
                    Правильна відповідь:
                  </label>
                  <input
                    type="text"
                    value={q.correctTextAnswer || ""}
                    onChange={(e) =>
                      setQuestions((prev) =>
                        prev.map((item) =>
                          item.id === q.id
                            ? { ...item, correctTextAnswer: e.target.value }
                            : item
                        )
                      )
                    }
                    className="w-full border rounded-md p-2 mt-1"
                  />
                </div>
              )}

              <button
                onClick={() => setQuestions((prev) => prev.filter((item) => item.id !== q.id))}
                className="bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md mt-3"
              >
                Видалити питання
              </button>
            </div>
          ))}

          <div className="text-center">
            <button
              onClick={() =>
                setQuestions((prev) => [
                  ...prev,
                  {
                    id: prev.length + 1,
                    type: "single",
                    text: "",
                    points: 1,
                    order: prev.length + 1,
                    choices: [],
                    correctTextAnswer: "",
                  },
                ])
              }
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg mt-4"
            >
              Додати питання
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/teacher")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-lg"
          >
            ← Повернутися на сторінку Вчителя
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-lg"
          >
            Створити тест
          </button>
        </div>
      </div>
    </main>
  );
}
