'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { href: "/courses", label: "Всі курси" },
    { href: "/reviews", label: "Відгуки" },
    { href: "/faq", label: "Питання та відповіді" },
    { href: "/about", label: "Про нас" },
    { href: "/contacts", label: "Контакти" },
  ];

  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"
         strokeWidth="2" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"/>
    </svg>
  );

  const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"
         strokeWidth="2" viewBox="0 0 24 24" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12"/>
    </svg>
  );

  return (
    <header className="relative w-full bg-white bg-[url('/images/back.png')] bg-cover bg-center shadow-sm">
      {/* Верхня навігація */}
      <nav className="max-w-[1440px] mx-auto flex items-center justify-between px-[118px] h-[72px]">
        {/* Лого */}
        <Link href="/" className="font-[700] text-[34px] text-[#021C4E] leading-[36px]">
          Brainboost
        </Link>

        {/* Меню */}
        <div className="flex items-center gap-[48px] text-[18px] font-[500] text-black">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${pathname === item.href ? "text-[#1345DE]" : "hover:text-[#1345DE]"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Мова + кнопки */}
        <div className="flex items-center gap-[16px]">
          <div className="flex gap-2 text-[15px] font-[500]">
            <span className="text-[#1345DE] cursor-pointer">UA</span>
            <span>ENG</span>
          </div>
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="bg-[#1345DE] hover:bg-[#0e2db9] text-white rounded-[8px] px-[20px] py-[8px] text-[14px] font-[600] transition"
            >
              Увійти
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-[#1345DE] hover:opacity-80">
                <UserIcon />
              </Link>
              <button onClick={logout} className="text-[#1345DE] hover:opacity-80">
                <LogoutIcon />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Нижній breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-[118px] py-[8px] text-[14px]">
        <Link href="/" className="text-[#021C4E] hover:underline">Головна</Link>
        {pathname !== "/" && (
          <>
            <span className="mx-1">/</span>
            <span className="text-[#1345DE]">
              {menuItems.find((item) => item.href === pathname)?.label || ""}
            </span>
          </>
        )}
      </div>
    </header>
  );
}
