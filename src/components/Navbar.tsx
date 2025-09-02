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

          {!isAuthenticated ? (
            <>
              <Link href="/login" className="btn btn-primary">Вхід</Link>
              <Link href="/register" className="btn btn-outline">Реєстрація</Link>
            </>
          ) : (
            <>
              <Link href="/profile" className="btn btn-icon" aria-label="Профіль">
                {/* Іконка профілю (SVG) */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#1345DE" strokeWidth="2" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
                </svg>
              </Link>

              <button onClick={logout} className="btn btn-logout" aria-label="Вийти">
                Вийти
                {/* Іконка виходу */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18" style={{marginLeft: '6px'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </>
          )}
        </div>
      </nav>

      <style jsx>{`
        nav.navbar {
          position: relative;
          height: 56px;
          display: flex;
          align-items: center;
          padding: 0 20px;
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          font-family: 'Mulish', sans-serif;
          user-select: none;
          background-image: url('/images/back.png');
        }

        .logo {
          position: absolute;
          left: 118px;
          top: 8px;
          font-family: 'Afacad', sans-serif;
          font-weight: 700;
          font-size: 36px;
          line-height: 40px;
          color: #021C4E;
        }

        .nav-links {
          position: absolute;
          left: 369px;
          top: 22px;
          display: flex;
          gap: 24px;
          font-weight: 600;
          font-size: 13px;
          line-height: 16px;
          color: #000000;
          align-items: center;
          height: 16px;
        }

        .nav-links .link {
          color: inherit;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.3s ease;
          padding: 4px 0;
          border-bottom: 2px solid transparent;
        }
        .nav-links .link:hover {
          color: #1345DE;
          border-bottom-color: #1345DE;
        }
        .nav-links .active {
          color: #1345DE;
          border-bottom-color: #1345DE;
        }

        .lang-auth {
          position: absolute;
          right: 118px;
          top: 22px;
          display: flex;
          align-items: center;
          gap: 20px;
          font-weight: 500;
          font-size: 13px;
          line-height: 16px;
          color: #1345DE;
          height: 16px;
        }

        .lang-switch {
          cursor: pointer;
          user-select: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }
        .lang-switch:hover {
          color: #0e2db9;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 16px;
          border-radius: 10px;
          font-family: 'Mulish', sans-serif;
          font-weight: 600;
          font-size: 13px;
          line-height: 16px;
          cursor: pointer;
          user-select: none;
          transition: background-color 0.3s ease, color 0.3s ease;
          text-decoration: none;
          border: none;
        }

        .btn-primary {
          background-color: #1345DE;
          color: #fff;
        }
        .btn-primary:hover {
          background-color: #0e2db9;
        }

        .btn-outline {
          background-color: transparent;
          color: #1345DE;
          border: 2px solid #1345DE;
        }
        .btn-outline:hover {
          background-color: #1345DE;
          color: #fff;
        }

        .btn-outline.small {
          padding: 4px 12px;
          font-size: 11px;
        }

        .btn-icon {
          background: transparent;
          border: none;
          padding: 4px;
          cursor: pointer;
          transition: transform 0.2s ease;
          color: #1345DE;
        }
        .btn-icon:hover {
          transform: scale(1.1);
          color: #0e2db9;
        }

        .btn-logout {
          background: #1345DE;
          color: white;
          border-radius: 10px;
          padding: 6px 14px;
          font-weight: 600;
          font-size: 13px;
          line-height: 16px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.3s ease;
          user-select: none;
        }
        .btn-logout:hover {
          background: #0e2db9;
        }

        /* Адаптив */
        @media (max-width: 1024px) {
          nav.navbar {
            height: auto;
            flex-wrap: wrap;
            padding: 10px 20px;
          }
          .logo {
            position: static;
            margin-bottom: 10px;
          }
          .nav-links {
            position: static;
            margin-bottom: 10px;
            gap: 16px;
            font-size: 12px;
          }
          .lang-auth {
            position: static;
            gap: 12px;
            font-size: 12px;
            justify-content: center;
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .logo {
            font-size: 28px;
          }
          .nav-links {
            flex-wrap: wrap;
            justify-content: center;
            font-size: 11px;
          }
          .lang-auth {
            font-size: 11px;
          }
          .btn, .btn-logout {
            font-size: 12px;
            padding: 5px 12px;
          }
        }
      `}</style>
    </>
  );
}
