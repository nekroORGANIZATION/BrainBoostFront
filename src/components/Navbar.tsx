'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type NavbarProps = { hideOn?: string[] };

export default function Navbar({ hideOn = [] }: NavbarProps) {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Закривати моб-меню при навігації
  useEffect(() => { setOpen(false); }, [pathname]);

  // Пункти меню
  const menuItems = [
    { href: '/courses',  label: 'Всі курси' },
    { href: '/reviews',  label: 'Відгуки' },
    { href: '/faq',      label: 'Питання та відповіді' },
    { href: '/about',    label: 'Про нас' },
    { href: '/contacts', label: 'Контакти' },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const matched = menuItems.find((i) => isActive(i.href));
  const crumbCurrent =
    matched?.label || decodeURIComponent(pathname.split('/').filter(Boolean).slice(-1)[0] || '');

  // Приховати хедер на певних сторінках
  const shouldHide = hideOn.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (shouldHide) return null;

  // Широкий контейнер
  const Wrap = 'mx-auto w-full max-w-[1680px] px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28';

  return (
    <header className="sticky top-0 z-[9999] w-full bg-transparent bg-[url('/images/back.png')] bg-cover bg-fixed bg-center/cover backdrop-blur-sm">
      {/* Один контейнер у 2 рядки: 1) topbar  2) breadcrumb */}
      <div className={`${Wrap} grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] items-center gap-x-4 pt-2 pb-2`}>
        {/* ЛОГО (картинка) */}
        <Link
          href="/"
          aria-label="На головну"
          className="relative row-start-1 col-start-1 shrink-0 block h-[52px] w-[210px] md:h-[58px] md:w-[240px] lg:h-[64px] lg:w-[270px]"
        >
          <Image
            src="/images/logo.png"        // змінюй шлях за потреби
            alt="Brainboost"
            fill
            priority
            sizes="(max-width:768px) 210px, (max-width:1024px) 240px, 270px"
            className="object-contain select-none"
          />
        </Link>

        {/* Центр-меню (desktop) */}
        <div
          className="row-start-1 col-start-2 hidden md:flex min-w-0 justify-center overflow-x-auto whitespace-nowrap
                     items-center gap-8 lg:gap-10 text-[18px] lg:text-[20px] font-semibold text-[#0B1437]
                     [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative inline-block px-1 transition-colors ${
                  active ? 'text-[#1345DE]' : 'hover:text-[#1345DE]'
                }`}
              >
                {item.label}
                <span
                  className={`pointer-events-none absolute -bottom-2 left-1/2 h-[2px] -translate-x-1/2 rounded bg-[#1345DE] transition-all
                    ${active ? 'w-7 opacity-100' : 'w-0 opacity-0 group-hover:w-7 group-hover:opacity-100'}`}
                />
              </Link>
            );
          })}
        </div>

        {/* Правий блок (desktop) */}
        <div className="row-start-1 col-start-3 hidden md:flex shrink-0 justify-self-end items-center gap-5 lg:gap-7">
          

          {!isAuthenticated ? (
            <Link
              href="/login"
              className="rounded-2xl bg-[#1345DE] px-5 py-2.5 text-[15px] font-bold text-white transition hover:bg-[#0e2fbe]"
            >
              Увійти
            </Link>
          ) : (
            <div className="flex items-center gap-3 lg:gap-4">
              <Link href="/teacher" className="text-[15px] font-bold text-[#1345DE] hover:underline">
                Викладач
              </Link>
              <Link
                href="/profile"
                className="grid h-11 w-11 place-items-center rounded-full ring-1 ring-[#E5ECFF] bg-white text-[#1345DE] hover:ring-[#1345DE]"
                aria-label="Профіль"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"/>
                </svg>
              </Link>
              <button
                onClick={logout}
                className="grid h-11 w-11 place-items-center rounded-full ring-1 ring-[#E5ECFF] bg-white text-[#1345DE] hover:ring-[#1345DE]"
                aria-label="Вийти"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* BREADCRUMB — фіксовано під логотипом, без JS-обчислень */}
        {pathname !== '/' && (
          <div className="row-start-2 col-start-1 justify-self-start">
            <nav
              className="mt-2 md:mt-2.5 ml-10 md:ml-14 inline-flex items-center gap-2
                        text-[14px] text-slate-600 rounded-lg px-2.5 py-1 ring-1 ring-black/5"
            >
              <Link href="/" className="text-[#021C4E] hover:underline">Головна</Link>
              <span className="text-slate-400">/</span>
              <span className="text-[#1345DE]">{crumbCurrent}</span>
            </nav>
          </div>
        )}

        {/* Бургер (mobile) */}
        <button
          className="row-start-1 col-start-3 md:hidden justify-self-end grid h-11 w-11 place-items-center rounded-2xl ring-1 ring-[#E5ECFF] bg-white/95 backdrop-blur text-[#1345DE]"
          aria-label="Меню"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <div className="relative h-5 w-6">
            <span className={`absolute left-0 h-0.5 w-6 rounded bg-current transition-transform ${open ? 'top-2.5 rotate-45' : 'top-0'}`} />
            <span className={`absolute left-0 h-0.5 w-6 rounded bg-current transition-opacity ${open ? 'top-2.5 opacity-0' : 'top-[10px] opacity-100'}`} />
            <span className={`absolute left-0 h-0.5 w-6 rounded bg-current transition-transform ${open ? 'top-2.5 -rotate-45' : 'top-[20px]'}`} />
          </div>
        </button>
      </div>

      {/* Мобільний дроуер */}
      <div
        className={`md:hidden overflow-hidden border-t border-slate-200 transition-[max-height] duration-300 ease-in-out ${open ? 'max-h-[80vh]' : 'max-h-0'}`}
      >
        <div className={`${Wrap} px-4 py-4`}>
          <div className="grid gap-3">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-4 py-3 text-[17px] font-semibold ring-1 ring-[#E5ECFF] bg-white/95 backdrop-blur active:scale-[0.99] transition
                  ${isActive(item.href) ? 'text-[#1345DE] ring-[#1345DE]' : 'text-[#0B1437]'}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            

            {!isAuthenticated ? (
              <Link
                href="/login"
                className="rounded-2xl bg-[#1345DE] px-6 py-3 text-[16px] font-bold text-white transition hover:bg-[#0e2fbe]"
              >
                Увійти
              </Link>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/profile"
                  className="rounded-2xl bg-white px-5 py-3 text-[16px] font-bold text-[#1345DE] ring-1 ring-[#E5ECFF]"
                >
                  Профіль
                </Link>
                <button
                  onClick={logout}
                  className="rounded-2xl bg-white px-5 py-3 text-[16px] font-bold text-[#1345DE] ring-1 ring-[#E5ECFF]"
                >
                  Вийти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
