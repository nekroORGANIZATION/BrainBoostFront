'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { mediaUrl } from '@/lib/api';

/* =========================
   Типи
========================= */
interface ProfileData {
  id: number;
  username: string;
  email: string;
  is_email_verified: boolean;
  is_teacher: boolean;
  is_certified_teacher: boolean;
  is_superuser?: boolean;
  profile_picture: string | null;
  first_name: string | null;
  last_name: string | null;
}

type Course = {
  id: number;
  slug?: string;                   // ← додано
  title: string;
  description: string;
  image: string | null;
  price: number | string | null;
  rating: number | string | null;
  author: number;
};

/* =========================
   Компонент
========================= */
export default function ProfilePage() {
  const { accessToken } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    is_certified_teacher: false,
    profile_picture: null as File | null,
  });

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Профіль
        const p = await axios.get('http://127.0.0.1:8000/accounts/api/profile/', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (cancelled) return;
        const prof: ProfileData = p.data;
        setProfile(prof);
        setFormData({
          username: prof.username,
          email: prof.email,
          first_name: prof.first_name || '',
          last_name: prof.last_name || '',
          is_certified_teacher: !!prof.is_certified_teacher,
          profile_picture: null,
        });

        // Придбані курси
        const pc = await axios.get('http://127.0.0.1:8000/courses/purchased-courses/', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const raw = Array.isArray(pc.data) ? pc.data : (pc.data?.results ?? []);
        const mapped: Course[] = raw.map((row: any) => {
          const c = row.course || row;
          return {
            id: c.id,
            slug: c.slug, // ← беремо slug, якщо бек його віддає
            title: c.title,
            description: c.description,
            image: c.image ? mediaUrl(c.image) : null,
            price: c.price,
            rating: c.rating,
            author: typeof c.author === 'object' ? c.author?.id : c.author,
          };
        });

        if (!cancelled) setCourses(mapped);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Не вдалося завантажити дані профілю.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [accessToken]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, profile_picture: e.target.files![0] }));
    }
  }

  async function handleUpdate() {
    if (!accessToken) return;
    setSaving(true);
    setError(null);

    const data = new FormData();
    data.append('username', formData.username);
    data.append('email', formData.email);
    data.append('first_name', formData.first_name);
    data.append('last_name', formData.last_name);
    data.append('is_certified_teacher', formData.is_certified_teacher ? 'true' : 'false');
    if (formData.profile_picture) {
      data.append('profile_picture', formData.profile_picture);
    }

    try {
      const res = await axios.put('http://127.0.0.1:8000/accounts/api/profile/', data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setProfile(res.data);
      setEditMode(false);
    } catch (e: any) {
      setError(e?.message || 'Не вдалося оновити профіль.');
    } finally {
      setSaving(false);
    }
  }

  function renderStars(rating: number | string | null) {
    const rate = Number(rating) || 0;
    const full = Math.floor(rate);
    const hasHalf = rate - full >= 0.5;
    const empty = 5 - full - (hasHalf ? 1 : 0);

    return (
      <span className="text-yellow-500 select-none">
        {'★'.repeat(full)}
        {hasHalf && '⯪'}
        {'☆'.repeat(empty)}
      </span>
    );
  }

  if (!accessToken) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
        <div className="max-w-5xl mx-auto p-6">
          <div className="rounded-2xl bg-white/95 backdrop-blur-sm shadow p-6 text-center">
            <h1 className="text-2xl font-bold text-[#021C4E]">Для перегляду профілю увійдіть</h1>
            <p className="mt-2">
              <Link href="/login" className="text-[#1345DE] underline">Перейти до входу →</Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="p-6 max-w-5xl mx-auto bg-white/95 rounded-2xl shadow-xl backdrop-blur-sm space-y-8">
        <h1 className="text-3xl font-bold text-center text-[#021C4E]">
          Твій профіль на BrainBoost 🚀
        </h1>

        {loading && <p className="text-center">Завантаження…</p>}
        {error && (
          <div className="rounded-lg bg-red-50 ring-1 ring-red-200 text-red-700 p-3 text-center">
            {error}
          </div>
        )}

        {profile && (
          <>
            {/* Профіль */}
            <section className="flex items-start gap-6">
              <div className="relative">
                <img
                  src={
                    profile.profile_picture
                      ? mediaUrl(profile.profile_picture)
                      : '/default-avatar.png'
                  }
                  alt="Аватар"
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#1345DE] shadow"
                />
                {profile.is_teacher && (
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 text-xs rounded-full bg-[#1345DE] text-white">
                    Teacher
                  </span>
                )}
              </div>

              <div className="flex-1">
                {editMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-sm text-slate-700">Ім’я користувача</span>
                      <input
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="mt-1 w-full p-2 border rounded"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-slate-700">Email</span>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 w-full p-2 border rounded"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-slate-700">Ім’я</span>
                      <input
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="mt-1 w-full p-2 border rounded"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-slate-700">Прізвище</span>
                      <input
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="mt-1 w-full p-2 border rounded"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm text-slate-700">Аватар</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1 w-full" />
                    </label>

                    <label className="inline-flex items-center gap-2 md:col-span-2">
                      <input
                        type="checkbox"
                        name="is_certified_teacher"
                        checked={formData.is_certified_teacher}
                        onChange={handleInputChange}
                        className="accent-[#1345DE]"
                      />
                      <span className="text-sm text-slate-700">Підтверджений викладач</span>
                    </label>

                    <div className="md:col-span-2 flex gap-3">
                      <button
                        onClick={handleUpdate}
                        disabled={saving}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
                      >
                        {saving ? 'Зберігаємо…' : 'Зберегти'}
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                      >
                        Скасувати
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl font-semibold">{profile.username}</p>
                    <p className="text-gray-600">{profile.email}</p>
                    <p>
                      Ім’я: <b>{profile.first_name || '-'}</b>
                    </p>
                    <p>
                      Прізвище: <b>{profile.last_name || '-'}</b>
                    </p>
                    <p className="text-sm mt-1">
                      Email підтверджено: {profile.is_email_verified ? '✅' : '❌'}
                    </p>
                    <p>
                      Роль:{' '}
                      {profile.is_superuser
                        ? 'Адміністратор'
                        : profile.is_teacher
                        ? 'Викладач'
                        : 'Студент'}
                    </p>
                    <button
                      onClick={() => setEditMode(true)}
                      className="mt-3 text-[#1345DE] hover:underline text-sm"
                    >
                      ✏️ Редагувати
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Доступи */}
            {(profile.is_teacher || profile.is_superuser) && (
              <section className="bg-blue-50 p-6 rounded-xl shadow-inner">
                <h2 className="text-xl font-semibold mb-4 text-[#021C4E]">🔑 Ваші доступи</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {(profile.is_teacher || profile.is_superuser) && (
                    <Link
                      href="/teacher"
                      className="p-6 bg-[#1345DE] text-white rounded-xl shadow hover:bg-[#0e2db9] transition flex flex-col items-center text-center"
                    >
                      <span className="text-2xl mb-2">📘</span>
                      <span className="font-bold">Вчительський простір</span>
                    </Link>
                  )}
                  {profile.is_superuser && (
                    <Link
                      href="/admin"
                      className="p-6 bg-[#021C4E] text-white rounded-xl shadow hover:bg-[#1345DE] transition flex flex-col items-center text-center"
                    >
                      <span className="text-2xl mb-2">🛠️</span>
                      <span className="font-bold">Адмін-панель</span>
                    </Link>
                  )}
                </div>
              </section>
            )}

            {/* Придбані курси */}
            <section className="bg-blue-50 p-6 rounded-xl shadow-inner">
              <h2 className="text-xl font-semibold mb-4 text-[#021C4E]">🎓 Придбані курси</h2>
              {courses.length === 0 ? (
                <p className="text-gray-600">
                  Ти ще не придбав жодного курсу. Почни навчання вже сьогодні!
                </p>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 list-none p-0">
                  {courses.map((course) => (
                    <li
                      key={course.id}
                      className="border border-blue-200 rounded-lg shadow-sm hover:shadow-md p-4 flex flex-col bg-white"
                    >
                      {course.image && (
                        <div className="mb-3 h-40 overflow-hidden rounded">
                          <img
                            src={course.image}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                      <p className="text-gray-700 mb-4">
                        {course.description?.length && course.description.length > 140
                          ? course.description.slice(0, 140) + '…'
                          : course.description || ''}
                      </p>
                      <div className="mt-auto flex justify-between items-center font-semibold text-lg text-blue-800">
                        <span>${Number(course.price ?? 0).toFixed(2)}</span>
                        <span>
                          {renderStars(course.rating)} ({Number(course.rating ?? 0).toFixed(1)})
                        </span>
                      </div>
                      <Link
                        href={`/courses/${course.slug ?? course.id}/details`}  // ← тепер з slug
                        className="mt-4 inline-block text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Деталі курсу
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Футер-мотивація */}
            <div className="bg-yellow-100 p-6 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-yellow-800">
                🌟 Підвищуй свої навички разом з BrainBoost!
              </h3>
              <p className="text-yellow-700">Вчися. Розвивайся. Досягай більшого 💡</p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
