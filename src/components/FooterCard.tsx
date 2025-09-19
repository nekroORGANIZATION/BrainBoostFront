import Link from "next/link";

export default function FooterCard() {
  return (
    <>
      <footer className="site-footer">
        <div className="sf-wrap">
          <div className="sf-top">
            <div className="sf-brand">
              <div className="sf-logo">BrainBoost</div>
              <p className="sf-addr">
                Ukraine, Kyiv, vul. Bohdana Khmelnytskoho, 25А
              </p>

              <div className="sf-actions">
                <Link href="/contacts" className="sf-btn sf-btn--primary">
                  Підібрати навчання
                </Link>
              </div>
            </div>

            <nav className="sf-cols">
              <div className="sf-col">
                <div className="sf-title">Курси</div>
                <ul>
                  <li>
                    <Link href="/courses?category=Маркетинг">Маркетинг</Link>
                  </li>
                  <li>
                    <Link href="/courses?category=Дизайн">Дизайн</Link>
                  </li>
                  <li>
                    <Link href="/courses?category=Бізнес">Бізнес</Link>
                  </li>
                  <li>
                    <Link href="/courses?category=IT">IT</Link>
                  </li>
                  <li>
                    <Link href="/courses?category=Фінанси">Фінанси</Link>
                  </li>
                </ul>
              </div>

              <div className="sf-col">
                <div className="sf-title">Більше</div>
                <ul>
                  <li>
                    <Link href="/reviews">Відгуки</Link>
                  </li>
                  <li>
                    <Link href="/faq">Питання та відповіді</Link>
                  </li>
                  <li>
                    <Link href="/about">Про нас</Link>
                  </li>
                </ul>
              </div>
            </nav>
          </div>

          <div className="sf-bottom">
            <span>© {new Date().getFullYear()} BrainBoost. Всі права захищено.</span>
            <div className="sf-legal">
              <Link href="/policy">Політика конфіденційності</Link>
              <span>•</span>
              <Link href="/terms">Умови використання</Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .site-footer {
          margin-top: 48px;
          background: #021c4e;
          color: #fff;
        }
        .sf-wrap {
          max-width: 1120px;
          margin: 0 auto;
          padding: 28px 16px 20px;
        }
        .sf-top {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 28px;
          align-items: start;
        }

        /* Адаптив для мобільних */
        @media (max-width: 768px) {
          .sf-top {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .sf-actions {
            justify-content: flex-start;
            margin-top: 10px;
          }
          .sf-cols {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .sf-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .sf-legal {
            gap: 5px;
          }
        }

        .sf-brand .sf-logo {
          font-family: Afacad, system-ui, sans-serif;
          font-weight: 800;
          font-size: clamp(24px, 3.6vw, 36px);
          line-height: 1.2;
        }
        .sf-addr {
          margin: 8px 0 16px;
          color: #e9eeff;
          font: 500 16px/1.45 Mulish, system-ui, sans-serif;
        }
        .sf-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 14px;
          border-radius: 10px;
          font-weight: 800;
          text-decoration: none;
          font-size: 13px;
        }
        .sf-btn--primary {
          background: #1345de;
          color: #fff;
          box-shadow: 0 8px 18px rgba(19, 69, 222, 0.25);
        }
        .sf-cols {
          display: grid;
          grid-template-columns: repeat(2, minmax(160px, 1fr));
          gap: 22px;
        }
        .sf-title {
          font: 800 16px/1.2 Mulish, system-ui, sans-serif;
          margin-bottom: 10px;
        }
        .sf-col ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 8px;
        }
        .sf-col a {
          color: #fff;
          text-decoration: none;
          opacity: 0.95;
          font: 600 14px/1.4 Mulish, system-ui, sans-serif;
        }
        .sf-col a:hover {
          text-decoration: underline;
        }
        .sf-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          margin-top: 22px;
          padding-top: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .sf-legal {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sf-legal a {
          color: #fff;
          text-decoration: none;
          opacity: 0.9;
        }
        .sf-legal a:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}
