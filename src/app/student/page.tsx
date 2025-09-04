'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import http, { ME_URL } from '@/lib/http';
import { mediaUrl } from '@/lib/api';

/* ===== API endpoints ===== */
const PURCHASED_URL = '/courses/me/purchased/';
const CERTS_URL = '/accounts/certificates/my-completed-courses/';

/* ===== Types ===== */
type ProfileData = {
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
};

type Course = {
  id: number;
  slug?: string;
  title: string;
  description?: string;
  image?: string | null;
  author: number | { id: number; username: string };
  price?: number | string | null;
  rating?: number | string | null;
};

type CompletedCourseItem = {
  id: number;
  title: string;
  certificate_exists: boolean;
  certificate_serial?: string | null;
};

/* ===== Helpers ===== */
function normalizePurchased(payload: any): Course[] {
  const raw = Array.isArray(payload)
    ? payload
    : payload?.results || payload?.data || payload?.items || [];

  return raw.map((row: any) => {
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
}

/* ===== Page ===== */
export default function StudentHomePage() {
  const [me, setMe] = useState<ProfileData | null>(null);
  const [purchased, setPurchased] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<CompletedCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, pcRes, certRes] = await Promise.allSettled([
        http.get(ME_URL),
        http.get(PURCHASED_URL),
        http.get(CERTS_URL),
      ]);

      if (meRes.status === 'fulfilled') setMe(meRes.value.data as ProfileData);

      if (pcRes.status === 'fulfilled') {
        setPurchased(normalizePurchased(pcRes.value.data));
      }

      if (certRes.status === 'fulfilled') {
        const payload = certRes.value.data;
        const rows = Array.isArray(payload) ? payload : payload?.results;
        setCertificates(Array.isArray(rows) ? (rows as CompletedCourseItem[]) : []);
      }

      if (
        meRes.status === 'rejected' &&
        pcRes.status === 'rejected' &&
        certRes.status === 'rejected'
      ) {
        setError('Не вдалося завантажити дані. Спробуйте ще раз.');
      }
    } catch (e: any) {
      setError(e?.message || 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const firstName = useMemo(
    () => (me?.first_name || me?.username || 'Студент').toString().split(' ')[0],
    [me]
  );

  const purchasedCount = purchased.length;
  const certificatesCount = certificates.filter((c) => c.certificate_exists).length;

  return (
    <div className="space-y-6">
      {/* welcome */}
      <section
        className="rounded-3xl p-6 md:p-8 shadow-2xl"
        style={{ background: 'linear-gradient(to right, royalblue, mediumslateblue)', color: 'white' }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Привіт, {firstName}! 👋</h1>
            <p className="mt-2 opacity-90">Огляд навчання: останні курси, прогрес і швидкі дії.</p>
            <div className="mt-4 flex gap-3">
              <Link href="/student/courses" className="inline-block">
                <span className="rounded-2xl px-5 py-3 bg-white text-black shadow hover:shadow-md transition-shadow">
                  Продовжити навчання
                </span>
              </Link>
              <Link href="/courses" className="inline-block">
                <span className="rounded-2xl px-5 py-3 bg-[lavender] text-black shadow hover:shadow-md transition-shadow">
                  Знайти нові курси
                </span>
              </Link>
            </div>
          </div>

          {/* mini profile */}
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-3 backdrop-blur">
            {me?.profile_picture ? (
              <Image
                src={mediaUrl(me.profile_picture)}
                alt="avatar"
                width={56}
                height={56}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="rounded-full grid place-items-center bg-white text-black" style={{ width: 56, height: 56 }}>
                {(me?.username || 'U').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold">{me?.first_name || me?.username || 'Студент'}</div>
              <div className="text-xs opacity-90">{me?.email}</div>
            </div>
          </div>
        </div>
      </section>

      {/* error / reload */}
      <div className="flex items-center justify-between">
        <button
          onClick={loadAll}
          className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-300 hover:bg-slate-50"
        >
          Оновити
        </button>
        {error ? <div className="text-red-600 text-sm">{error}</div> : null}
      </div>

      {/* statistics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Придбані курси" value={purchasedCount} bg="aliceblue" />
        <StatCard title="Сертифікати" value={certificatesCount} bg="honeydew" />
        <StatCard title="Відгуки" value="—" bg="oldlace" hint="Ще немає" />
        <StatCard
          title="Сповіщення"
          value="—"
          bg="mintcream"
          hint={<Link href="/student/notifications">Переглянути</Link>}
        />
      </section>

      {/* purchased courses */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ваші курси</h2>
          <Link href="/student/courses" className="text-sm underline">
            Усі придбані
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-fr">
          {loading ? (
            Array.from({ length: 3 }, (_, i) => <SkeletonCourseCard key={i} />)
          ) : purchased.length > 0 ? (
            purchased.slice(0, 6).map((c) => <CourseCard key={c.id} course={c} />)
          ) : (
            <div className="rounded-3xl p-8 text-center bg-white shadow">
              У вас ще немає придбаних курсів.
              <div className="mt-3">
                <Link href="/courses" className="underline">
                  Перейти до каталогу
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* quick links */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickLink
          title="Налаштувати профіль"
          desc="Фото, ім’я, мова — зробіть акаунт зручнішим."
          href="/student/settings"
          bg="lavenderblush"
        />
        <QuickLink
          title="Список бажаного"
          desc="Збережені курси — щоб не загубити."
          href="/student/wishlist"
          bg="azure"
        />
        <QuickLink title="Історія замовлень" desc="Чеки та статуси платежів." href="/student/orders" bg="seashell" />
      </section>
    </div>
  );
}

/* ===== Components ===== */
function StatCard({
  title,
  value,
  bg,
  hint,
}: {
  title: string;
  value: number | string;
  bg: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl p-5 bg-white shadow-xl">
      <div className="rounded-2xl p-4" style={{ background: bg }}>
        <div className="text-sm opacity-80">{title}</div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
        {hint ? <div className="mt-1 text-sm opacity-70">{hint}</div> : null}
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const authorName = typeof course.author === 'object' ? (course.author.username as string) : undefined;

  return (
    <Link href={course.slug ? `/courses/${course.slug}/details` : `/courses/${course.id}/details`} className="block h-full">
      <article className="rounded-3xl overflow-hidden h-full bg-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          {course.image ? (
            <Image
              src={mediaUrl(course.image)}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center" style={{ background: 'gainsboro', color: 'black' }}>
              Без зображення
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="font-semibold line-clamp-2">{course.title}</h3>
          {authorName ? <div className="text-sm opacity-70 mt-1">Автор: {authorName}</div> : null}
          <div className="mt-4 flex items-center justify-between text-sm opacity-80">
            <span>Рейтинг: {course.rating ?? '—'}</span>
            <span>Ціна: {course.price ?? '—'}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function SkeletonCourseCard() {
  return <div className="rounded-3xl bg-white shadow-xl h-[300px] animate-pulse" aria-label="loading" />;
}

function QuickLink({ title, desc, href, bg }: { title: string; desc: string; href: string; bg: string }) {
  return (
    <Link href={href} className="block">
      <div className="rounded-3xl p-6 h-full bg-white shadow-xl hover:shadow-2xl transition-shadow">
        <div className="rounded-2xl p-5" style={{ background: bg }}>
          <div className="font-semibold">{title}</div>
          <div className="opacity-80 mt-1 text-sm">{desc}</div>
          <div className="mt-4 underline">Перейти</div>
        </div>
      </div>
    </Link>
  );
}
