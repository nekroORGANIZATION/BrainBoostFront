'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import http, { ME_URL } from '@/lib/http';
import { useAuth } from '@/context/AuthContext';
import { mediaUrl } from '@/lib/media';
import { motion, AnimatePresence, type Variants, type Transition } from 'framer-motion';
import {
  PencilLine, Check, X, Upload, Crown, ShieldCheck,
  GraduationCap, BookOpen, LogIn, Star
} from 'lucide-react';

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
  slug?: string;
  title: string;
  description: string;
  image: string | null;
  price: number | string | null;
  rating: number | string | null;
  author: number;
};

/* =========================
   Константи API
========================= */
const PURCHASED_URL = '/courses/me/purchased/';

/* =========================
   Анімаційні варіанти
========================= */
const EASE_OUT: Transition['ease'] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

const listStagger: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE_OUT },
  },
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
    // важливо: чекаємо ініціалізації провайдера.
    // null означає "не залогінений", тоді нижче покажемо екран входу.
    if (accessToken === null) {
      setLoading(false);
      return;
    }
    // якщо токен є — вантажимо дані
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1) Профіль
        const p = await http.get(ME_URL);
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

        // 2) Придбані курси
        const pc = await http.get(PURCHASED_URL);
        const rawList = Array.isArray(pc.data)
          ? pc.data
          : pc.data?.results || pc.data?.data || pc.data?.items || [];

        const mapped: Course[] = rawList.map((row: any) => {
          const c = row?.course ?? row;
          return {
            id: c?.id,
            slug: c?.slug,
            title: c?.title ?? '',
            description: c?.description ?? '',
            image: c?.image ? mediaUrl(c.image) : null,
            price: c?.price ?? null,
            rating: c?.rating ?? null,
            author: typeof c?.author === 'object' ? c.author?.id : c?.author,
          };
        });

        if (!cancelled) setCourses(mapped);
      } catch (e: any) {
        if (!cancelled) {
          // показуємо мʼяку помилку (401/403/інші)
          const msg =
            e?.response?.status
              ? `${e.response.status}: ${typeof e.response.data === 'string' ? e.response.data : 'Помилка завантаження'}`
              : (e?.message || 'Не вдалося завантажити дані профілю.');
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // Хендлери форми
  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }
  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  }
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, profile_picture: f }));
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
    if (formData.profile_picture) data.append('profile_picture', formData.profile_picture);

    try {
      const res = await http.patch(ME_URL, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(res.data);
      setEditMode(false);
    } catch (e: any) {
      setError(e?.response?.data ? JSON.stringify(e.response.data) : 'Не вдалося оновити профіль.');
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

  // Екран "потрібен вхід"
  if (accessToken === null) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
        <motion.div
          className="max-w-[1100px] mx-auto p-6"
          initial="hidden"
          animate="show"
          variants={fadeUp}
        >
          <div className="rounded-3xl bg-white/90 backdrop-blur-md shadow-[0_12px_40px_rgba(2,28,78,0.08)] p-8 text-center">
            <LogIn className="mx-auto mb-3 text-[#1345DE]" />
            <h1 className="text-2xl font-bold text-[#021C4E]">Для перегляду профілю увійдіть</h1>
            <p className="mt-3">
              <Link href="/login" className="text-[#1345DE] font-semibold underline">Перейти до входу →</Link>
            </p>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="p-6 max-w-[1100px] mx-auto">
        {/* HEADER */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="rounded-3xl bg-gradient-to-br from-indigo-50 to-sky-50 ring-1 ring-slate-200/60 p-6 md:p-8 shadow-[0_10px_30px_rgba(2,28,78,0.06)] mb-6"
        >
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div>
              <h1 className="text-[26px] font-semibold text-[#021C4E]">Твій профіль на BrainBoost</h1>
              <p className="text-slate-600 mt-1">Керуй обліковими даними та навчанням</p>
            </div>
            <div className="flex items-center gap-2">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                >
                  <PencilLine className="h-4 w-4" /> Редагувати
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" /> {saving ? 'Зберігаємо…' : 'Зберегти'}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                  >
                    <X className="h-4 w-4" /> Скасувати
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* CONTENT CARD */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-md ring-1 ring-slate-200/70 shadow-[0_12px_40px_rgba(2,28,78,0.06)] p-6 space-y-8">
          {loading && <ProfileSkeleton />}

          {error && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-xl bg-red-50 ring-1 ring-red-200 text-red-700 p-3 text-center">
              {error}
            </motion.div>
          )}

          {profile && (
            <>
              {/* Профіль */}
              <motion.section
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="flex flex-col md:flex-row items-start gap-6"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="relative"
                >
                  <div className="p-1 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400">
                    <img
                      src={profile.profile_picture ? mediaUrl(profile.profile_picture) : '/default-avatar.png'}
                      alt="Аватар"
                      className="w-28 h-28 rounded-full object-cover ring-8 ring-white"
                    />
                  </div>
                  {profile.is_teacher && (
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 text-xs rounded-full bg-[#1345DE] text-white shadow">
                      Teacher
                    </span>
                  )}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <AnimatePresence initial={false} mode="wait">
                    {!editMode ? (
                      <motion.div
                        key="view"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                          <InfoRow label="Нікнейм" value={profile.username} />
                          <InfoRow label="Email" value={profile.email} />
                          <InfoRow label="Ім’я" value={profile.first_name || '—'} />
                          <InfoRow label="Прізвище" value={profile.last_name || '—'} />
                          <InfoRow label="Email підтверджено" value={profile.is_email_verified ? '✅ Так' : '❌ Ні'} />
                          <InfoRow
                            label="Роль"
                            value={
                              profile.is_superuser
                                ? 'Адміністратор'
                                : profile.is_teacher
                                ? 'Викладач'
                                : 'Студент'
                            }
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {profile.is_certified_teacher && (
                            <Badge tone="success">
                              <ShieldCheck className="h-3.5 w-3.5" /> Підтверджений викладач
                            </Badge>
                          )}
                          {profile.is_teacher && (
                            <Badge>
                              <GraduationCap className="h-3.5 w-3.5" /> Викладач
                            </Badge>
                          )}
                          {profile.is_superuser && (
                            <Badge tone="dark">
                              <Crown className="h-3.5 w-3.5" /> Admin
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="edit"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        <Field label="Ім’я користувача">
                          <input
                            name="username"
                            value={formData.username}
                            onChange={handleTextChange}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100"
                          />
                        </Field>
                        <Field label="Email">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleTextChange}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100"
                          />
                        </Field>
                        <Field label="Ім’я">
                          <input
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleTextChange}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100"
                          />
                        </Field>
                        <Field label="Прізвище">
                          <input
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleTextChange}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100"
                          />
                        </Field>
                        <Field label="Аватар" className="md:col-span-2">
                          <label className="mt-1 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 cursor-pointer hover:bg-slate-50">
                            <Upload className="h-4 w-4 text-slate-600" />
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            Завантажити файл
                          </label>
                        </Field>

                        <label className="inline-flex items-center gap-2 md:col-span-2 select-none">
                          <input
                            type="checkbox"
                            name="is_certified_teacher"
                            checked={formData.is_certified_teacher}
                            onChange={handleCheckboxChange}
                            className="accent-[#1345DE]"
                          />
                          <span className="text-sm text-slate-700">Підтверджений викладач</span>
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.section>

              {/* Доступи */}
              {(profile.is_teacher || profile.is_superuser) && (
                <motion.section variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl bg-indigo-50/60 ring-1 ring-indigo-100 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-[#021C4E]">🔑 Ваші доступи</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <GlassLink href="/student" icon={<BookOpen />} title="Кабінет студента" />
                    <GlassLink href="/teacher" icon={<GraduationCap />} title="Вчительський простір" primary />
                    {profile.is_superuser && (
                      <GlassLink href="/admin" icon={<Crown />} title="Адмін-панель" dark />
                    )}
                  </div>
                </motion.section>
              )}

              {/* Придбані курси */}
              <motion.section variants={fadeUp} initial="hidden" animate="show">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold text-[#021C4E]">🎓 Придбані курси</h2>
                  {courses.length > 0 && (
                    <div className="text-sm text-slate-500">Усього: <span className="text-slate-800 font-medium">{courses.length}</span></div>
                  )}
                </div>

                {courses.length === 0 ? (
                  <p className="text-gray-600">Ти ще не придбав жодного курсу. Почни навчання вже сьогодні!</p>
                ) : (
                  <motion.ul
                    variants={listStagger}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 list-none p-0"
                  >
                    {courses.map((course) => (
                      <motion.li key={course.id} variants={listItem}>
                        <CourseCard course={course} renderStars={renderStars} />
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </motion.section>

              {/* Футер-мотивація */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl bg-amber-50 ring-1 ring-amber-100 p-6 text-center">
                <h3 className="text-lg font-semibold text-amber-900">
                  🌟 Підвищуй свої навички разом з BrainBoost!
                </h3>
                <p className="text-amber-700">Вчися. Розвивайся. Досягай більшого 💡</p>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

/* =========================
   Дрібні компоненти
========================= */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-44 shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Badge({
  children,
  tone = 'indigo',
}: {
  children: React.ReactNode;
  tone?: 'indigo' | 'success' | 'dark';
}) {
  const styles =
    tone === 'success'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : tone === 'dark'
      ? 'bg-slate-800 text-white ring-slate-800'
      : 'bg-indigo-50 text-indigo-700 ring-indigo-200';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ${styles}`}>
      {children}
    </span>
  );
}

function GlassLink({
  href,
  icon,
  title,
  primary,
  dark,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  primary?: boolean;
  dark?: boolean;
}) {
  const base =
    'group rounded-2xl p-5 ring-1 transition shadow-sm flex flex-col items-center text-center backdrop-blur';
  const tone = dark
    ? 'bg-slate-900 text-white ring-slate-800 hover:bg-slate-800'
    : primary
    ? 'bg-indigo-600 text-white ring-indigo-500 hover:bg-indigo-700'
    : 'bg-white/70 ring-slate-200 hover:bg-white';
  return (
    <Link href={href} className={`${base} ${tone}`}>
      <div className="mb-2 grid place-items-center rounded-xl bg-white/20 backdrop-blur-sm p-3">
        <span className="opacity-90">{icon}</span>
      </div>
      <span className="font-semibold">{title}</span>
    </Link>
  );
}

function CourseCard({
  course,
  renderStars,
}: {
  course: Course;
  renderStars: (rating: number | string | null) => React.ReactNode;
}) {
  const price = Number(course.price ?? 0);
  const hrefDetails = `/courses/${course.slug ?? course.id}/details`;
  const hrefStudy = `/student/courses/${course.id}`;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="h-full border border-blue-100 rounded-2xl bg-white shadow-[0_10px_24px_rgba(2,28,78,0.06)] overflow-hidden"
    >
      {course.image && (
        <div className="h-44 overflow-hidden">
          <motion.img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.35 }}
          />
        </div>
      )}

      <div className="p-5 space-y-3">
        <h3 className="text-lg font-bold text-[#021C4E] line-clamp-2">{course.title}</h3>
        <p className="text-slate-700 min-h-[44px]">
          {course.description?.length && course.description.length > 140
            ? course.description.slice(0, 140) + '…'
            : course.description || ''}
        </p>

        <div className="flex items-center justify-between">
          <div className="text-blue-800 font-semibold">${price.toFixed(2)}</div>
          <div className="text-sm text-slate-700 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>{renderStars(course.rating)} ({Number(course.rating ?? 0).toFixed(1)})</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Link
            href={hrefDetails}
            className="flex-1 text-center rounded-xl bg-indigo-50 text-indigo-700 px-4 py-2 hover:bg-indigo-100"
          >
            Деталі курсу
          </Link>
          <Link
            href={hrefStudy}
            className="flex-1 text-center rounded-xl bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700"
          >
            До навчання
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================
   Skeletons
========================= */
function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-start gap-6">
        <div className="w-28 h-28 rounded-full bg-slate-200" />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-40 bg-slate-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
