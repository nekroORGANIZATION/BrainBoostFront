import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";

interface LessonDetail {
  id: number;
  title: string;
  content: string;
  duration_min?: number;
  published_at?: string; // <-- заміна на published_at
}

const API_BASE_URL = "https://brainboost.pp.ua/api/api/lesson";

async function getLessonDetail(id: number): Promise<LessonDetail | null> {
  const token = (await cookies()).get("access_token")?.value;

  try {
    const res = await fetch(`${API_BASE_URL}/public/lessons/${id}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("Error fetching lesson detail:", err);
    return null;
  }
}

export default async function LessonDetailPage({
  params,
}: {
  params: { lessonId: string; courseId: string };
}) {
  const lesson = await getLessonDetail(Number(params.lessonId));
  const courseId = params.courseId;

  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-500">
          Урок не знайдено або він ще недоступний.
        </p>
      </div>
    );
  }

  const isFuture = lesson.published_at
    ? new Date(lesson.published_at) > new Date()
    : false;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>

        {lesson.duration_min && (
          <p className="text-gray-500 mb-2">
            Тривалість: {lesson.duration_min} хв.
          </p>
        )}

        {/* Блок із датою публікації */}
        {lesson.published_at && (
          <div className="bg-gray-50 border rounded-lg p-4 mb-4 shadow-inner">
            <p className="text-gray-700 font-medium">
              Дата публікації:{" "}
              <span className="text-blue-600 font-semibold">
                {new Date(lesson.published_at).toLocaleString()}
              </span>
            </p>
          </div>
        )}

        <div
          className="prose mb-6"
          dangerouslySetInnerHTML={{ __html: lesson.content || "" }}
        />

        <div className="flex mt-4">
          {isFuture ? (
            <button
              disabled
              className="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
            >
              Теорія стане доступною пізніше
            </button>
          ) : (
            <Link
              href={`/student/courses/${courseId}/lessons/${lesson.id}/theory`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Перейти до теорії
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
