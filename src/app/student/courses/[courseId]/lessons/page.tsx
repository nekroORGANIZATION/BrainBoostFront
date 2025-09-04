import Link from "next/link";
import { cookies } from "next/headers";

interface Lesson {
  id: number;
  title: string;
  summary?: string;
  duration_min?: number;
  // приходят с бэка (после наших правок во вьюхе)
  completed?: boolean | null;
  result_percent?: number | null;
}

interface LessonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Lesson[];
}

const API_BASE_URL = "https://brainboost.pp.ua/api/api/lesson";

async function getLessons(courseId: string, token: string | null): Promise<Lesson[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons/`, {
      cache: "no-store",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });
    if (!res.ok) return [];
    const data: LessonListResponse | Lesson[] = await res.json();
    // эндпоинт может быть пагинированным или отдавать массив
    const list = Array.isArray(data) ? data : (data.results ?? []);
    return list;
  } catch (err) {
    console.error("Failed to fetch lessons:", err);
    return [];
  }
}

export default async function CourseLessonsPage({
  params,
}: {
  params: { courseId: string };
}) {
  const { courseId } = params;
  const token = (await cookies()).get("access_token")?.value ?? null;

  const lessons = await getLessons(courseId, token);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 rounded-lg">
      <h1 className="text-3xl font-bold mb-4">Уроки курсу</h1>

      <div className="p-4 bg-white rounded-lg shadow">
        {lessons.length === 0 ? (
          <p className="text-gray-500">У цьому курсі поки що немає уроків.</p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((lesson) => {
              const isCompleted = !!lesson.completed;

              const inner = (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{lesson.title}</h2>
                    {isCompleted && (
                      <span className="text-green-600 font-bold text-sm">
                        ✔ Пройдено
                        {typeof lesson.result_percent === "number"
                          ? ` (${lesson.result_percent}%)`
                          : ""}
                      </span>
                    )}
                  </div>

                  {lesson.summary && (
                    <p className="text-gray-600 mt-1">{lesson.summary}</p>
                  )}

                  {typeof lesson.duration_min === "number" && (
                    <p className="text-sm text-gray-500 mt-1">
                      Тривалість: {lesson.duration_min} хв.
                    </p>
                  )}
                </>
              );

              // стили карточки (как у тебя) + «засерить», если пройдено
              const baseCard =
                "border p-4 rounded-lg transition relative";
              const enabledHover = "hover:bg-gray-50";
              const completedMask =
                "bg-gray-100 opacity-60 grayscale cursor-not-allowed";

              return (
                <li
                  key={lesson.id}
                  className={`${baseCard} ${
                    isCompleted ? completedMask : enabledHover
                  }`}
                >
                  {isCompleted ? (
                    // без ссылки, клик отключён
                    <div aria-disabled className="block select-none">
                      {inner}
                    </div>
                  ) : (
                    <Link
                      href={`/student/courses/${courseId}/lessons/${lesson.id}`}
                      className="block"
                      prefetch={false}
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
