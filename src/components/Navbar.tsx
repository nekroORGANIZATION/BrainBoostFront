'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <>
      <nav className="navbar">
        <div className="logo">Brainboost</div>

        <div className="nav-links">
            <Link href="/" className="link">Головна</Link>
            <Link href="/courses" className="link">Всі курси</Link>
            <Link href="/reviews" className="link">Відгуки</Link>
            <Link href="/faq" className="link">Питання та відповіді</Link>
        </div>

        <div className="lang-auth">
          <div className="lang-switch">UA ENG</div>

          {isAuthenticated ? (
            <>
                <Link href="/profile" className="link">Профіль</Link>
            </>
            ) : (
            <>
                <Link href="/register" className="link">Реєстрація</Link>
                <Link href="/login" className="link">Вхід</Link>
                <Link href="/teacher_register" className="link">Реєстрація викладача</Link>
            </>
            )}
        </div>
      </nav>

      <style jsx>{`
        nav.navbar {
          position: relative;
          height: 48px;
          display: flex;
          align-items: center;
          padding: 0 20px;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          font-family: 'Mulish', sans-serif;
        }

        .logo {
          position: absolute;
          left: 118px;
          top: 5px;
          font-family: 'Afacad', sans-serif;
          font-weight: 700;
          font-size: 36px;
          line-height: 48px;
          color: #021C4E;
        }

        .nav-links {
          position: absolute;
          left: 369px;
          top: 21px;
          display: flex;
          gap: 20px;
          font-family: 'Mulish', sans-serif;
          font-weight: 500;
          font-size: 11px;
          line-height: 14px;
          color: #000000;
          align-items: center;
          height: 14px;
        }

        .nav-links .link {
          color: inherit;
          text-decoration: none;
          display: flex;
          align-items: center;
          height: 14px;
          cursor: pointer;
        }

        .nav-links .active {
          color: #1345DE;
        }

        .lang-auth {
          position: absolute;
          right: 118px; /* відступ від правого краю (приблизно 940px від лівого) */
          top: 21px;
          display: flex;
          align-items: center;
          gap: 15px;
          font-family: 'Mulish', sans-serif;
          font-weight: 400;
          font-size: 11px;
          line-height: 14px;
          color: #1345DE;
          height: 14px;
        }

        .lang-switch {
          cursor: pointer;
        }

        .btn-logout {
          position: absolute;
          width: 112px;
          height: 33px;
          left: 1048px;
          top: 11px;
          background: #1345DE;
          border-radius: 10px;
          color: white;
          font-family: 'Mulish', sans-serif;
          font-weight: 500;
          font-size: 12px;
          line-height: 15px;
          border: none;
          cursor: pointer;
          padding: 6px 10px;
          text-align: center;
          transition: background-color 0.3s ease;
        }

        .btn-logout:hover {
          background: #0e2db9;
        }
      `}</style>
    </>
  );
}
