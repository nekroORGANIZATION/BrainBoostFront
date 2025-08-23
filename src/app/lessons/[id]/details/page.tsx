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

export default function LessonDetailsPage() {
  const { id } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    // Завантажуємо урок
    axios
      .get(`http://127.0.0.1:8000/api/lesson/lessons/${id}/`)
      .then((res) => {
        setLesson(res.data);
      })
      .catch((err) => console.error('Помилка завантаження уроку:', err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!lesson) return;

    // Завантажуємо тест(и) для уроку
    axios
      .get(`http://127.0.0.1:8000/api/tests/?lesson_id=${lesson.id}`)
      .then((res) => {
        console.log('Tests API response:', res.data);

        // Якщо є поле results, беремо його, інакше просто res.data
        const tests = res.data.results || res.data;

        console.log('Parsed tests:', tests);

        if (tests.length > 0) {
          setTest(tests[0]);
          console.log('Selected test:', tests[0]);
        } else {
          setTest(null);
          console.log('No tests found for this lesson');
        }
      })
      .catch((err) => {
        console.error('Помилка завантаження тестів:', err);
        setTest(null);
      });
  }, [lesson]);

  console.log('Current test state:', test);

  if (loading) return <p className="text-center text-lg text-gray-400">Завантаження...</p>;
  if (!lesson) return <p className="text-center text-lg text-red-500">Урок не знайдено</p>;

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
          {lesson.theories[lesson.theories.length - 1] && (
            <>
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
            </>
          )}
        </div>
      ) : (
        <p className="mt-6 text-gray-400 italic">Теорія ще не додана</p>
      )}

      <div className="flex gap-4">
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
