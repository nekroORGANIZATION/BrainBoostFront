'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

type CourseTheory = {
  id: number;
  theory_text: string;
  image?: string | null;
};

type Lesson = {
  id: number;
  title: string;
  description: string;
  course: number;
  theories: CourseTheory[];
};

type Test = {
  id: number;
  title: string;
};

const getToken = (): string | null => {
  return (
    localStorage.getItem('access') ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('access') ||
    sessionStorage.getItem('accessToken') ||
    null
  );
};

export default function LessonDetailsPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    const token = getToken();
    if (!token) {
      setError('Користувач не авторизований');
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    setLoading(true);

    // 1️⃣ Завантажуємо сам урок
    const lessonReq = axios.get(`http://127.0.0.1:8000/api/lesson/admin/lessons/${id}/`, { headers });

    // 2️⃣ Завантажуємо теорії окремо
    const theoriesReq = axios.get(`http://127.0.0.1:8000/api/lesson/lesson/theories/${id}/`, { headers });

    Promise.all([lessonReq, theoriesReq])
      .then(([lessonRes, theoriesRes]) => {
        const lessonData = lessonRes.data;
        const theories: CourseTheory[] = theoriesRes.data || [];
        setLesson({ ...lessonData, theories });
      })
      .catch((err) => {
        console.error('Помилка завантаження уроку або теорії:', err);
        if (err.response?.status === 404) setError('Урок або теорія не знайдені');
        else if (err.response?.status === 401) setError('Неавторизований');
        else setError('Помилка завантаження уроку');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!lesson) return;
    const token = getToken();
    if (!token) return;

    axios
      .get(`http://127.0.0.1:8000/api/tests/?lesson_id=${lesson.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const tests = res.data.results || res.data;
        setTest(tests.length > 0 ? tests[0] : null);
      })
      .catch((err) => {
        console.error('Помилка завантаження тестів:', err);
        setTest(null);
      });
  }, [lesson]);

  if (loading) return <p className="text-center text-lg text-gray-400">Завантаження...</p>;
  if (error) return <p className="text-center text-lg text-red-500">{error}</p>;
  if (!lesson) return null;

  return (
    <main className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-xl rounded-xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{lesson.title}</h1>
      <p className="text-gray-600 mb-2">{lesson.description}</p>
      <div className="text-sm text-gray-500 mb-6">
        <p><span className="font-semibold">ID:</span> {lesson.id}</p>
        <p><span className="font-semibold">Course ID:</span> {lesson.course}</p>
      </div>

      {lesson.theories && lesson.theories.length > 0 ? (
        <div className="prose max-w-none mt-6">
          <h2 className="text-xl font-semibold mb-2">Теорія</h2>
          <div
            dangerouslySetInnerHTML={{
              __html: lesson.theories[lesson.theories.length - 1].theory_text,
            }}
          />
          {lesson.theories[lesson.theories.length - 1].image && (
            <img
              src={`http://127.0.0.1:8000${lesson.theories[lesson.theories.length - 1].image}`}
              alt="Ілюстрація до теорії"
              className="mt-4 rounded shadow"
            />
          )}
        </div>
      ) : (
        <p className="mt-6 text-gray-400 italic">Теорія ще не додана</p>
      )}

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => router.push(`/lessons/${lesson.id}/theory`)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
        >
          Переглянути теорію
        </button>

        <button
          onClick={() => test ? router.push(`/tests/${test.id}/random`) : null}
          disabled={!test}
          className={`font-semibold py-2 px-4 rounded transition ${
            test ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {test ? 'Розпочати тест' : 'Тест не знайдено'}
        </button>
      </div>
    </main>
  );
}
