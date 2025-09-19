'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import http, { ME_URL } from '@/lib/http';
import { mediaUrl } from '@/lib/media';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

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

function VerifiedBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span
      className="inline-flex items-center gap-2 rounded-xl px-3 py-1 text-sm
                 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    >
      <ShieldCheck className="h-4 w-4" />
      Email підтверджено
    </span>
  ) : (
    <Link
      href="/student/settings"
      className="inline-flex items-center gap-2 rounded-xl px-3 py-1 text-sm
                 bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:ring-amber-300 transition"
    >
      <ShieldAlert className="h-4 w-4" />
      Підтвердити email
    </Link>
  );
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [me, setMe] = useState<ProfileData | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  useEffect(() => {
    if (typeof isAuthenticated === 'undefined') return;
    if (isAuthenticated === false) {
      router.replace(`/login?next=/student`);
      return;
    }
    http
      .get(ME_URL)
      .then((r) => setMe(r.data as ProfileData))
      .catch(() => setMe(null))
      .finally(() => setMeLoading(false));
  }, [isAuthenticated, router]);

  const nav = useMemo(() => [
    { href: '/student', label: 'Огляд', match: /^\/student\/?$/ },
    { href: '/student/courses', label: 'Придбані курси', match: /^\/student\/courses/ },
    { href: '/student/certificates', label: 'Сертифікати', match: /^\/student\/certificates/ },
    { href: '/student/orders', label: 'Історія замовлень', match: /^\/student\/orders/ },
    { href: '/student/wishlist', label: 'Список бажаного', match: /^\/student\/wishlist/ },
    { href: '/student/reviews', label: 'Мої відгуки', match: /^\/student\/reviews/ },
    { href: '/student/notifications', label: 'Сповіщення', match: /^\/student\/notifications/ },
    { href: '/student/settings', label: 'Налаштування', match: /^\/student\/settings/ },
  ], []);
  const isActive = (rx: RegExp) => rx.test(pathname || '');

  if (typeof isAuthenticated === 'undefined' || meLoading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="rounded-3xl bg-white px-8 py-6 shadow-xl">Завантаження кабінета…</div>
      </main>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/images/back.png')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {/* декоративні «плями» */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 0.8, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(124,165,255,.35), transparent)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 0.7, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(175,208,255,.35), transparent)' }}
      />

      {/* контентна сітка */}
      <div
        className="
          mx-auto max-w-7xl
          px-4 md:px-6 py-6
          grid grid-cols-12
          gap-8 lg:gap-10 xl:gap-14
        "
      >
        {/* Сайдбар — зсув лівіше + більший відступ до контенту */}
        <aside
          className="
            col-span-12 md:col-span-5 lg:col-span-3
            md:-ml-6 lg:-ml-10 xl:-ml-14
            md:mr-6 lg:mr-10 xl:mr-14
            lg:sticky lg:top-6
            transition-[margin] duration-200
          "
        >
          <div className="rounded-3xl overflow-hidden bg-white shadow-2xl ring-1 ring-[#E5ECFF]">
            <div className="p-6 bg-gradient-to-r from-[#2441e6] to-[#7aa2ff] text-white">
              <div className="flex items-center gap-4">
                {me?.profile_picture ? (
                  <Image
                    src={mediaUrl(me.profile_picture)}
                    alt="avatar"
                    width={56}
                    height={56}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="rounded-full grid place-items-center bg-white/90 text-[#2441e6]"
                    style={{ width: 56, height: 56 }}
                  >
                    {(me?.username || 'U').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold">{me?.first_name || me?.username || 'Студент'}</div>
                  <div className="text-xs/5 opacity-90">{me?.email}</div>
                </div>
              </div>
            </div>

            <nav className="p-3">
              {nav.map((n) => {
                const active = isActive(n.match);
                return (
                  <Link key={n.href} href={n.href} className="block">
                    <div
                      className={[
                        'rounded-2xl px-4 py-3 my-1 transition-all ring-1',
                        active
                          ? 'translate-x-1 bg-[#EEF3FF] ring-[#1345DE] shadow-md'
                          : 'bg-white ring-[#E5ECFF] hover:bg-[#F7FAFF]',
                      ].join(' ')}
                    >
                      {n.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-6 grid gap-3">
            <Link href="/student/courses" className="block">
              <div className="rounded-3xl px-5 py-4 bg-[aliceblue] shadow-lg hover:shadow-xl transition-shadow">Продовжити навчання</div>
            </Link>
            <Link href="/student" className="block">
              <div className="rounded-3xl px-5 py-4 bg-[honeydew] shadow-lg hover:shadow-xl transition-shadow">Оновити профіль</div>
            </Link>
          </div>
        </aside>

        {/* Основний контент */}
        <main className="col-span-12 md:col-span-8 lg:col-span-9">
          <div className="rounded-3xl p-6 md:p-7 mb-5 shadow-xl ring-1 ring-[#E5ECFF] bg-white/70 backdrop-blur">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-lg font-semibold text-[#0F2E64]">Кабінет студента</div>
              <VerifiedBadge ok={!!me?.is_email_verified} />
            </div>
          </div>

          {children}
        </main>
      </div>

      <footer className="mt-8 pb-10">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm opacity-70">
          © {new Date().getFullYear()} Brainboost
        </div>
      </footer>
    </div>
  );
}
