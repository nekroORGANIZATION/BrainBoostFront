'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

const API_BASE = 'http://localhost:8000';

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-6 shadow-[0_8px_24px_rgba(2,28,78,0.06)] ${className}`}>
      {children}
    </div>
  );
}

type Course = { id: number; title: string };

export default function LessonCreatePage() {
  const router = useRouter();

  // === SSR-safe: читаем токен только на клиенте ===
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null;
      setToken(t);
    } catch {
      setToken(null);
    }
  }, []);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [lesson, setLesson] = useState({
    title: '',
    summary: '',
    status: 'draft',
    duration_min: '',
    order: '',
    type: 'TEXT' as 'TEXT' | 'VIDEO' | 'LINK',
    content_text: '',
    content_url: '',
    cover_image: null as File | null,
    course: '',
  });

  const [message, setMessage] = useState<string | null>(null);

  // === Превью обложки без обращений к URL на сервере ===
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!lesson.cover_image) {
      setCoverPreview(null);
      return;
    }
    // создаём objectURL только в браузере
    if (typeof window !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const url = URL.createObjectURL(lesson.cover_image);
      setCoverPreview(url);
      return () => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      };
    } else {
      setCoverPreview(null);
    }
  }, [lesson.cover_image]);

  // === Загрузка курсов после того, как токен стал известен ===
  useEffect(() => {
    if (!token) {
      setLoadingCourses(false);
      return;
    }
    let ignore = false;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}courses/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!ignore) {
          // бэкенд, вероятно, отдаёт { results: [...] }
          const list: Course[] = Array.isArray(res.data?.results) ? res.data.results : res.data;
          setCourses(list || []);
        }
      } catch {
        // проглатываем, просто не показываем курсы
      } finally {
        if (!ignore) setLoadingCourses(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [token]);

  const handleFieldChange = (field: keyof typeof lesson, value: any) =>
    setLesson(prev => ({ ...prev, [field]: value }));

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setLesson(prev => ({ ...prev, cover_image: e.target.files![0] }));
    }
  };

  const removeCover = () => setLesson(prev => ({ ...prev, cover_image: null }));

  const handleSubmit = async () => {
    if (!token) {
      setMessage('Треба увійти в систему');
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    if (!lesson.title || !lesson.type || !lesson.course) {
      setMessage('Заповніть назву, тип та курс');
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    const formData = new FormData();
    formData.append('course', lesson.course);
    formData.append('title', lesson.title);
    formData.append('summary', lesson.summary);
    formData.append('status', lesson.status);
    formData.append('duration_min', lesson.duration_min);
    formData.append('order', lesson.order);
    formData.append('type', lesson.type);

    if (lesson.type === 'TEXT' && lesson.content_text) {
      formData.append('content_text', lesson.content_text);
    }
    if ((lesson.type === 'VIDEO' || lesson.type === 'LINK') && lesson.content_url) {
      formData.append('content_url', lesson.content_url);
    }
    if (lesson.cover_image) {
      formData.append('cover_image', lesson.cover_image);
    }

    try {
      // оставляю исходный путь, чтобы не ломать API (заметь, без двойного "//")
      const res = await axios.post(`${API_BASE}api/lesson/lessons/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setMessage('🎉 Урок створено!');
      setLesson({
        title: '',
        summary: '',
        status: 'draft',
        duration_min: '',
        order: '',
        type: 'TEXT',
        content_text: '',
        content_url: '',
        cover_image: null,
        course: '',
      });
      // при желании можно редиректить:
      // router.push('/teacher/lessons');
    } catch {
      setMessage('❌ Помилка при створенні уроку');
    }
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top grid place-items-center px-6 py-12">
      <Card className="w-full max-w-3xl space-y-6">
        <h2 className="text-3xl font-bold text-[#021C4E]">Створити урок</h2>

        {message && (
          <div className="p-3 rounded-md bg-green-100 text-green-800 font-semibold">{message}</div>
        )}

        <div className="grid gap-4">
          {/* Курс */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Курс</label>
            {loadingCourses ? (
              <p>Завантаження курсів...</p>
            ) : (
              <select
                value={lesson.course}
                onChange={e => handleFieldChange('course', e.target.value)}
                className="w-full rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
              >
                <option value="">-- Оберіть курс --</option>
                {courses.map(c => (
                  <option key={c.id} value={String(c.id)}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Назва */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Назва уроку</label>
            <input
              type="text"
              value={lesson.title}
              onChange={e => handleFieldChange('title', e.target.value)}
              className="w-full rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 focus:ring-[#1345DE] outline-none"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Опис (summary)</label>
            <textarea
              value={lesson.summary}
              onChange={e => handleFieldChange('summary', e.target.value)}
              className="w-full rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 focus:ring-[#1345DE] outline-none"
            />
          </div>

          {/* Тип уроку, статус, тривалість, порядок */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Тип уроку</label>
              <select
                value={lesson.type}
                onChange={e => handleFieldChange('type', e.target.value as 'TEXT' | 'VIDEO' | 'LINK')}
                className="w-full rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
              >
                <option value="TEXT">Текст</option>
                <option value="VIDEO">Відео</option>
                <option value="LINK">Посилання</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Статус</label>
              <select
                value={lesson.status}
                onChange={e => handleFieldChange('status', e.target.value)}
                className="w-full rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
              >
                <option value="draft">Чернетка</option>
                <option value="scheduled">Заплановано</option>
                <option value="published">Опубліковано</option>
                <option value="archived">Архів</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Тривалість (хв)</label>
              <input
                type="number"
                value={lesson.duration_min}
                onChange={e => handleFieldChange('duration_min', e.target.value)}
                className="w-full rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 focus:ring-[#1345DE] outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Порядок</label>
              <input
                type="number"
                value={lesson.order}
                onChange={e => handleFieldChange('order', e.target.value)}
                className="w-full rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 focus:ring-[#1345DE] outline-none"
              />
            </div>
          </div>

          {/* Контент */}
          {lesson.type === 'TEXT' && (
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Текст уроку</label>
              <textarea
                value={lesson.content_text}
                onChange={e => handleFieldChange('content_text', e.target.value)}
                className="w-full rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
              />
            </div>
          )}
          {(lesson.type === 'VIDEO' || lesson.type === 'LINK') && (
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Посилання</label>
              <input
                type="text"
                value={lesson.content_url}
                onChange={e => handleFieldChange('content_url', e.target.value)}
                className="w-full rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
              />
            </div>
          )}

          {/* Обкладинка */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Обкладинка</label>
            <div className="flex items-center gap-4">
              <input type="file" onChange={handleCoverChange} className="rounded-[10px] ring-1 ring-[#E5ECFF] px-3 py-2" />
              {lesson.cover_image && coverPreview && (
                <div className="flex items-center gap-2">
                  <img src={coverPreview} alt="Preview" className="w-32 h-20 object-cover rounded-md" />
                  <button onClick={removeCover} className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600">
                    Видалити
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Кнопки */}
          <div className="pt-4 flex flex-col md:flex-row gap-4">
            <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-[10px] font-semibold hover:bg-blue-700">
              Створити урок
            </button>
            <Link href="/teacher/lessons" className="bg-blue-100 text-blue-700 px-6 py-2 rounded-[10px] font-semibold hover:bg-blue-200">
              Перейти до списку уроків
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
