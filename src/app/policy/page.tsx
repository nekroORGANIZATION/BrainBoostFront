'use client';

import Link from "next/link";

export default function PrivacyPage() {
  const updatedAt = "23 серпня 2025";

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <main className="wrap" id="top">
          {/* Hero */}
          <section className="hero">
            <div className="heroText">
              <h1>Політика конфіденційності</h1>
              <p>
                У BrainBoost ми створюємо безпечне навчальне середовище: пояснюємо, які дані збираємо,
                як і навіщо їх обробляємо, як довго зберігаємо та якими правами ви володієте.
              </p>
              <div className="heroMeta">
                <span className="pill">Оновлено: {updatedAt}</span>
                <span className="pill pillSecondary">Версія 1.0</span>
              </div>

              <div className="heroCta">
                <Link className="btnPrimary" href="/">На головну</Link>
                <a className="btnGhost" href="#contacts">Зв’язатися з нами</a>
              </div>
            </div>

            <div className="heroArt">
              <img
                src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=1400&auto=format&fit=crop"
                alt="Абстрактна ілюстрація захисту даних"
                loading="lazy"
              />
              <figcaption>Безпека за принципом privacy-by-design.</figcaption>
            </div>
          </section>

          {/* Зміст */}
          <nav className="toc" aria-label="Зміст сторінки">
            <h2>Зміст</h2>
            <ol>
              <li><a href="#who-we-are">1. Хто ми</a></li>
              <li><a href="#what-we-collect">2. Які дані ми збираємо</a></li>
              <li><a href="#how-we-use">3. Як ми використовуємо дані</a></li>
              <li><a href="#legal-basis">4. Правові підстави (GDPR)</a></li>
              <li><a href="#cookies">5. Cookie та локальне сховище</a></li>
              <li><a href="#analytics">6. Аналітика та сторонні сервіси</a></li>
              <li><a href="#retention">7. Період зберігання</a></li>
              <li><a href="#minors">8. Неповнолітні</a></li>
              <li><a href="#international">9. Міжнародні передавання</a></li>
              <li><a href="#your-rights">10. Ваші права</a></li>
              <li><a href="#security">11. Безпека</a></li>
              <li><a href="#changes">12. Зміни до політики</a></li>
              <li><a href="#contacts">13. Контакти</a></li>
            </ol>
          </nav>

          {/* 1. Хто ми */}
          <section id="who-we-are" className="section">
            <div className="grid">
              <div>
                <h2>1. Хто ми</h2>
                <p>
                  <b>BrainBoost</b> — освітня онлайн-платформа, що належить/керується <b>BrainBoost LLC</b>
                  (далі — «ми», «нас», «наш»). Ми виступаємо як <i>контролер</i> персональних даних у розумінні
                  Регламенту (ЄС) 2016/679 (<b>GDPR</b>) та відповідного законодавства України.
                </p>
                <p>
                  Наша місія — надати інструменти для навчання (курси, тести, сертифікація, трекінг прогресу),
                  зберігаючи конфіденційність і безпеку кожного користувача.
                </p>
              </div>
              <figure className="photoCard">
                <img
                  src="https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1200&auto=format&fit=crop"
                  alt="Команда BrainBoost"
                  loading="lazy"
                />
                <figcaption>Мінімізація даних і прозорість — наш стандарт.</figcaption>
              </figure>
            </div>
          </section>

          {/* 2. Які дані ми збираємо */}
          <section id="what-we-collect" className="section">
            <h2>2. Які дані ми збираємо</h2>
            <div className="cards">
              <article className="card">
                <h3>Облікові дані</h3>
                <ul className="list">
                  <li>Ім’я/нікнейм, e-mail (підтвердження e-mail за потреби)</li>
                  <li>Хешований пароль (ми не зберігаємо відкриті паролі)</li>
                  <li>Роль (учень/викладач/адмін), налаштування профілю</li>
                </ul>
              </article>
              <article className="card">
                <h3>Навчальна активність</h3>
                <ul className="list">
                  <li>Прогрес у курсах/модулях/уроках</li>
                  <li>Результати тестів, кількість спроб, час проходження</li>
                  <li>Домашні завдання, завантажені файли, коментарі</li>
                </ul>
              </article>
              <article className="card">
                <h3>Платіжні дані</h3>
                <p>Платежі обробляють сертифіковані провайдери. Ми не зберігаємо повні дані платіжних карток.</p>
              </article>
              <article className="card">
                <h3>Технічні дані</h3>
                <ul className="list">
                  <li>IP-адреса, тип пристрою/браузера, ОС, мова</li>
                  <li>Cookie/LocalStorage для сесій і налаштувань</li>
                  <li>Логи подій (автентифікація, помилки) для безпеки</li>
                  <li>Приблизне місцезнаходження (місто/країна з IP)</li>
                </ul>
              </article>
            </div>
          </section>

          {/* 3. Як ми використовуємо дані */}
          <section id="how-we-use" className="section">
            <h2>3. Як ми використовуємо дані</h2>
            <ul className="list">
              <li><b>Надання сервісу:</b> створення акаунта, доступ до курсів, залік тестів, видання сертифікатів.</li>
              <li><b>Персоналізація:</b> збереження налаштувань, рекомендації курсів/уроків.</li>
              <li><b>Комунікації:</b> сервісні листи (підтвердження, нотифікації, важливі зміни), за окремою згодою — маркетинг.</li>
              <li><b>Безпека та відповідність:</b> виявлення шахрайства, аудит доступів, журналювання інцидентів.</li>
              <li><b>Аналітика та покращення:</b> вимірювання ефективності курсів, A/B тести, UX-покращення.</li>
              <li><b>Юридичні обов’язки:</b> бухгалтерські/податкові вимоги, відповіді на запити органів влади у межах закону.</li>
            </ul>
          </section>

          {/* 4. Правові підстави */}
          <section id="legal-basis" className="section">
            <h2>4. Правові підстави (GDPR)</h2>
            <ul className="list">
              <li><b>Виконання договору</b> (Art. 6(1)(b)): доступ до Платформи та освітніх функцій.</li>
              <li><b>Законні інтереси</b> (Art. 6(1)(f)): безпека, запобігання зловживанням, розвиток продукту.</li>
              <li><b>Згода</b> (Art. 6(1)(a)): опціональні розсилки/пуші, небазові cookie.</li>
              <li><b>Юридичні обов’язки</b> (Art. 6(1)(c)): фінансова звітність, запити органів влади.</li>
            </ul>
          </section>

          {/* 5. Cookie та локальне сховище */}
          <section id="cookies" className="section">
            <h2>5. Cookie та локальне сховище</h2>
            <p>
              Ми використовуємо cookie та LocalStorage для автентифікації, збереження налаштувань,
              підтримки сесій, а також для аналітики. Налаштовувати cookie можна у своєму браузері.
              Деякі cookie є необхідними для роботи сайту (strictly necessary).
            </p>
          </section>

          {/* 6. Аналітика та сторонні сервіси */}
          <section id="analytics" className="section">
            <div className="grid">
              <div>
                <h2>6. Аналітика та сторонні сервіси</h2>
                <p>
                  Для вимірювання відвідуваності та стабільності ми можемо використовувати інструменти аналітики
                  та моніторингу продуктивності (наприклад, агреговані метрики, відстеження збоїв).
                  Обмін даними відбувається на підставі угод обробки даних (DPA) та принципу мінімізації.
                </p>
                <ul className="list">
                  <li>Передаємо лише необхідні технічні дані (агреговано/псевдонімізовано, де це можливо)</li>
                  <li>Постачальники зобов’язані дотримуватися стандартів безпеки та GDPR</li>
                  <li>Повний перелік субпроцесорів надаємо на запит</li>
                </ul>
              </div>
              <figure className="photoCard">
                <img
                  src="https://images.unsplash.com/photo-1518186233392-c232efbf2373?q=80&w=1200&auto=format&fit=crop"
                  alt="Аналітика"
                  loading="lazy"
                />
                <figcaption>Аналітика допомагає покращувати навчальний досвід.</figcaption>
              </figure>
            </div>
          </section>

          {/* 7. Період зберігання */}
          <section id="retention" className="section">
            <h2>7. Період зберігання</h2>
            <ul className="list">
              <li><b>Облікові дані:</b> поки існує акаунт + період для закриття фінзвітності/спорів.</li>
              <li><b>Дані навчальної активності:</b> поки потрібні для функціонування профілю та статистики.</li>
              <li><b>Технічні логи:</b> обмежений період (напр., 90–180 днів) для безпеки та розслідувань інцидентів.</li>
              <li><b>Транзакційні дані:</b> за вимогами законодавства (бухгалтерія/податки).</li>
            </ul>
            <p>Після закінчення термінів дані видаляються або анонімізуються безпечно.</p>
          </section>

          {/* 8. Неповнолітні */}
          <section id="minors" className="section">
            <h2>8. Неповнолітні</h2>
            <p>
              Платформа не призначена для дітей до 16 років без згоди батьків/законних представників.
              Якщо ви вважаєте, що дитина надала нам дані без такої згоди — повідомте нас, і ми вживемо заходів.
            </p>
          </section>

          {/* 9. Міжнародні передавання */}
          <section id="international" className="section">
            <h2>9. Міжнародні передавання</h2>
            <p>
              Якщо дані передаються за межі ЄЕЗ/України, ми застосовуємо належні гарантії (напр.,
              Стандартні договірні положення ЄС — SCCs) та оцінюємо рівень захисту в країнах-одержувачах.
            </p>
          </section>

          {/* 10. Ваші права */}
          <section id="your-rights" className="section">
            <h2>10. Ваші права</h2>
            <ul className="list">
              <li><b>Доступ:</b> отримати копію ваших персональних даних.</li>
              <li><b>Виправлення:</b> оновити неточні/неповні дані.</li>
              <li><b>Видалення:</b> «право бути забутим» у передбачених законом випадках.</li>
              <li><b>Обмеження/заперечення:</b> проти певних видів обробки.</li>
              <li><b>Портативність:</b> отримати дані у машиночитному форматі.</li>
              <li><b>Відкликання згоди:</b> якщо обробка базується на згоді.</li>
              <li><b>Скарга:</b> до наглядового органу з питань захисту даних (Україна/ЄС).</li>
            </ul>
            <p>Зверніться за контактами нижче — зазвичай відповідаємо впродовж 30 днів.</p>
          </section>

          {/* 11. Безпека */}
          <section id="security" className="section">
            <h2>11. Безпека</h2>
            <ul className="list">
              <li>Шифрування в транзиті (HTTPS/TLS)</li>
              <li>Контроль доступів, принцип найменших привілеїв</li>
              <li>Журналювання подій, моніторинг інцидентів</li>
              <li>Резервні копії та відновлення</li>
              <li>Періодичні перевірки безпеки та навчання персоналу</li>
            </ul>
            <p>Жодна система не гарантує абсолютної безпеки, але ми працюємо над постійним удосконаленням захисту.</p>
          </section>

          {/* 12. Зміни */}
          <section id="changes" className="section">
            <h2>12. Зміни до політики</h2>
            <p>
              Ми можемо час від часу оновлювати політику. Важливі зміни публікуємо на цій сторінці
              (із новою датою), а за потреби — повідомляємо в акаунті або e-mail.
            </p>
          </section>

          {/* 13. Контакти */}
          <section id="contacts" className="section contacts">
            <h2>13. Контакти</h2>
            <div className="contactGrid">
              <div className="contactCard">
                <b>E-mail:</b>&nbsp;
                <a href="mailto:support@your-domain.com">support@your-domain.com</a>
              </div>
              <div className="contactCard">
                <b>Оператор даних:</b>&nbsp;BrainBoost LLC, Київ, Україна
              </div>
              <div className="contactCard">
                <b>Пошта для прав суб’єктів:</b>&nbsp;
                <a href="mailto:privacy@your-domain.com">privacy@your-domain.com</a>
              </div>
            </div>
            <p className="muted">
              За запитом надаємо перелік субпроцесорів і додаткові відомості щодо міжнародних передавань.
            </p>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} BrainBoost. Всі права захищено.</p>
        <a href="#top" className="toTop" aria-label="Повернутися угору">↑ Угору</a>
      </footer>

      {/* СТИЛІ */}
      <style jsx>{`
        /* ФОН на всю сторінку */
        .page-wrapper {
          min-height: 100svh;
          background: url("/images/back.png") no-repeat center top;
          background-size: cover;
          background-attachment: fixed;
          display: flex;
          flex-direction: column;
        }
        .page-content { flex: 1; }
        .wrap {
          max-width: 1100px;
          margin: 2rem auto 4rem;
          padding: 0 1.2rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        }

        /* HERO */
        .hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 2rem;
          align-items: center;
          background: linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 6px 28px rgba(15, 23, 42, 0.08);
          border: 1px solid rgba(2, 132, 199, 0.08);
        }
        .heroText h1 { font-size: 2.4rem; color: #075985; margin: 0 0 .6rem; }
        .heroText p { color: #0f172a; line-height: 1.55; margin: 0 0 1rem; max-width: 60ch; }
        .heroMeta { display:flex; gap:.6rem; flex-wrap:wrap; margin: 1rem 0; }
        .pill {
          background: #fff;
          color: #0369a1;
          border: 1px solid #bae6fd;
          border-radius: 999px;
          padding: .3rem .8rem;
          font-weight: 600;
        }
        .pillSecondary { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
        .heroCta { display:flex; gap:.8rem; flex-wrap:wrap; }
        .btnPrimary, .btnGhost {
          text-decoration: none;
          border-radius: 12px;
          padding: .65rem 1.1rem;
          font-weight: 700;
          display: inline-block;
        }
        .btnPrimary {
          background: linear-gradient(45deg, #0284c7, #10b981);
          color: #fff;
          box-shadow: 0 6px 20px rgba(2, 132, 199, 0.18);
        }
        .btnGhost {
          color: #0284c7; background: #fff; border: 1px dashed #0284c7;
        }
        .heroArt img { width: 100%; border-radius: 16px; box-shadow: 0 8px 24px rgba(15,23,42,.08); }
        .heroArt figcaption { margin-top: .5rem; color: #0369a1; font-size:.9rem; text-align:center; }

        /* TOC */
        .toc {
          margin: 2rem 0 1rem;
          background: rgba(255,255,255,0.9);
          border-radius: 14px;
          padding: 1rem 1.2rem;
          box-shadow: 0 6px 16px rgba(15,23,42,0.05);
        }
        .toc h2 { margin: 0 0 .6rem; color: #0f766e; }
        .toc ol { margin: 0; padding-left: 1.2rem; line-height: 1.8; color: #0f172a; font-weight: 600; }
        .toc a { color: #0284c7; text-decoration: none; }
        .toc a:hover { text-decoration: underline; }

        /* Секції */
        .section { margin: 2rem 0; }
        .section h2 { color: #0f766e; margin-bottom: .6rem; font-size: 1.6rem; }
        .section p, .list { color: #0f172a; }
        .list { line-height: 1.7; }
        .list li { margin: .25rem 0; }

        /* Grid + cards */
        .grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 1.6rem; align-items: start; }
        .photoCard img { width: 100%; border-radius: 14px; box-shadow: 0 8px 22px rgba(15,23,42,.07); }
        .photoCard figcaption { text-align:center; margin-top:.5rem; color:#0369a1; font-size:.92rem; }
        .cards { display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
        .card { background: #fff; padding: 1rem; border-radius: 14px; box-shadow: 0 6px 14px rgba(15,23,42,.05); }

        /* Контакти */
        .contactGrid { display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
        .contactCard { background:#fff; border-radius:12px; padding:1rem; box-shadow: 0 6px 14px rgba(15,23,42,.05); }
        .muted { color:#475569; margin-top:.6rem; }

        /* Footer */
        .footer {
          background: rgba(255,255,255,0.9);
          padding: 1rem;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .toTop { display:inline-block; margin-top:.5rem; color:#0284c7; text-decoration:none; font-weight:600; }

        /* Адаптивність */
        @media (max-width: 1080px) {
          .wrap { padding: 0 1rem; }
        }
        @media (max-width: 980px) {
          .hero, .grid { grid-template-columns: 1fr; }
          .hero { padding: 1.2rem; }
          .page-wrapper { background-attachment: scroll; } /* мобільні браузери краще поводяться */
        }
        @media (max-width: 480px) {
          .heroText h1 { font-size: 1.6rem; }
          .card, .toc, .section { border-radius: 12px; }
        }
      `}</style>
    </div>
  );
}
