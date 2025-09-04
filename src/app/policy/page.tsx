'use client';

import Link from "next/link";

export default function PrivacyPage() {
  const updatedAt = "23 серпня 2025";

  return (
    <main className="wrap">
      {/* Hero */}
      <section className="hero">
        <div className="heroText">
          <h1>Політика конфіденційності</h1>
          <p>
            Ми поважаємо вашу приватність та дбаємо про безпеку персональних
            даних. На цій сторінці пояснюємо, які відомості ми збираємо, навіщо
            це робимо, як зберігаємо та якими правами ви володієте.
          </p>
          <div className="heroMeta">
            <span className="pill">Оновлено: {updatedAt}</span>
            <span className="pill pillSecondary">Версія 1.0</span>
          </div>

          <div className="heroCta">
            <Link className="btnPrimary" href="/">
              На головну
            </Link>
            <a className="btnGhost" href="#contacts">
              Зв’язатися з нами
            </a>
          </div>
        </div>

        <div className="heroArt">
          <img
            src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=1400&auto=format&fit=crop"
            alt="Абстрактна ілюстрація захисту даних"
          />
          <figcaption>Ми проєктуємо безпеку за принципом privacy-by-design.</figcaption>
        </div>
      </section>

      {/* Зміст */}
      <nav className="toc">
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

      {/* Хто ми */}
      <section id="who-we-are" className="section">
        <div className="grid">
          <div>
            <h2>1. Хто ми</h2>
            <p>
              Ця політика стосується онлайн-платформи <b>BrainBoost</b> (далі — «Платформа»),
              що належить та/або керується компанією <b>BrainBoost LLC</b>
              (далі — «ми», «нас», «наш»). Ми виступаємо як <i>контролер</i> персональних
              даних у значенні Регламенту (ЄС) 2016/679 (<b>GDPR</b>) та відповідного
              українського законодавства.
            </p>
            <p>
              Якщо ви маєте питання щодо обробки персональних даних, зв’яжіться з нами —
              контактні дані наведені нижче у розділі «Контакти».
            </p>
          </div>
          <figure className="photoCard">
            <img
              src="https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1200&auto=format&fit=crop"
              alt="Команда, що працює над безпекою даних"
            />
            <figcaption>Наша команда дотримується принципів мінімізації даних.</figcaption>
          </figure>
        </div>
      </section>

      {/* Які дані ми збираємо */}
      <section id="what-we-collect" className="section">
        <h2>2. Які дані ми збираємо</h2>
        <div className="cards">
          <article className="card">
            <h3>Облікові дані</h3>
            <p>
              Ім’я користувача, e-mail, пароль (у хешованому вигляді), роль (учень/викладач),
              налаштування профілю. За потреби — підтвердження e-mail.
            </p>
          </article>
          <article className="card">
            <h3>Навчальна активність</h3>
            <p>
              Прогрес у курсах, уроках та тестах, результати спроб, час проходження,
              завантажені файли/відповіді, коментарі.
            </p>
          </article>
          <article className="card">
            <h3>Платіжні дані</h3>
            <p>
              Обробляються через платіжних провайдерів (наприклад, платіжні шлюзи). Ми не зберігаємо повні дані карток.
            </p>
          </article>
          <article className="card">
            <h3>Технічні дані</h3>
            <p>
              IP-адреса, тип пристрою та браузера, файли cookie, дані логів, приблизне місцезнаходження,
              параметри сеансу для безпеки та аналітики.
            </p>
          </article>
        </div>
      </section>

      {/* Як ми використовуємо дані */}
      <section id="how-we-use" className="section">
        <h2>3. Як ми використовуємо дані</h2>
        <ul className="list">
          <li><b>Надання сервісу:</b> створення та ведення облікового запису, доступ до курсів/уроків/тестів, виставлення оцінок, сертифікація.</li>
          <li><b>Персоналізація:</b> збереження налаштувань, рекомендації контенту.</li>
          <li><b>Комунікації:</b> сервісні повідомлення, нотифікації про завдання, результати, важливі зміни.</li>
          <li><b>Безпека:</b> виявлення шахрайства, запобігання зловживанням, аудит доступів.</li>
          <li><b>Аналітика та покращення:</b> вимірювання ефективності, діагностика проблем, A/B тести.</li>
          <li><b>Виконання юридичних обов’язків:</b> дотримання податкових, фінансових та інших норм.</li>
        </ul>
      </section>

      {/* Правові підстави */}
      <section id="legal-basis" className="section">
        <h2>4. Правові підстави (GDPR)</h2>
        <p>Ми обробляємо персональні дані на таких підставах:</p>
        <ul className="list">
          <li><b>Виконання договору</b> (Art. 6(1)(b)): надання доступу до Платформи та її функцій.</li>
          <li><b>Законні інтереси</b> (Art. 6(1)(f)): безпека, запобігання зловживанням, аналітика та розвиток продукту.</li>
          <li><b>Згода</b> (Art. 6(1)(a)): опціональні повідомлення, маркетингові розсилки, певні cookie.</li>
          <li><b>Юридичні обов’язки</b> (Art. 6(1)(c)): бухгалтерія, податкові та інші вимоги.</li>
        </ul>
      </section>

      {/* Cookies */}
      <section id="cookies" className="section">
        <h2>5. Cookie та локальне сховище</h2>
        <p>
          Ми використовуємо cookie та локальне сховище для автентифікації, збереження налаштувань, стабільності сесій
          та аналітики. Ви можете керувати cookie у налаштуваннях браузера. Деякі cookie є необхідними для роботи сайту.
        </p>
      </section>

      {/* Аналітика */}
      <section id="analytics" className="section">
        <div className="grid">
          <div>
            <h2>6. Аналітика та сторонні сервіси</h2>
            <p>
              Ми можемо використовувати інструменти аналітики (наприклад, для вимірювання відвідуваності, виявлення помилок,
              розуміння взаємодії з інтерфейсом). Ці сервіси отримують мінімально необхідні дані та діють згідно з власними політиками.
            </p>
            <p>
              Передавання даних стороннім здійснюється за договорами обробки даних (DPA) та з урахуванням вимог GDPR.
            </p>
          </div>
          <figure className="photoCard">
            <img
              src="https://images.unsplash.com/photo-1518186233392-c232efbf2373?q=80&w=1200&auto=format&fit=crop"
              alt="Дошка з графіками та показниками"
            />
            <figcaption>Аналітика допомагає покращувати навчальний досвід.</figcaption>
          </figure>
        </div>
      </section>

      {/* Період зберігання */}
      <section id="retention" className="section">
        <h2>7. Період зберігання</h2>
        <p>
          Ми зберігаємо персональні дані лише стільки, скільки це необхідно для цілей, описаних у цій політиці:
          облікові дані — поки існує акаунт; дані транзакцій — відповідно до фінансових вимог; журнали безпеки —
          протягом розумного терміну для запобігання зловживанням.
        </p>
        <p>
          Після закінчення необхідного періоду дані видаляються або анонімізуються у безпечний спосіб.
        </p>
      </section>

      {/* Неповнолітні */}
      <section id="minors" className="section">
        <h2>8. Неповнолітні</h2>
        <p>
          Наші сервіси не призначені для дітей молодше 16 років без згоди батьків або законних представників.
          Якщо ви вважаєте, що дитина надала нам персональні дані без такої згоди, повідомте нас — ми вживемо заходів.
        </p>
      </section>

      {/* Міжнародні передавання */}
      <section id="international" className="section">
        <h2>9. Міжнародні передавання</h2>
        <p>
          Якщо обробка включає передачу даних за межі ЄЕЗ/України, ми забезпечуємо належні гарантії (наприклад,
          Стандартні договірні положення ЄС) та перевіряємо рівень захисту у країнах одержувачів.
        </p>
      </section>

      {/* Ваші права */}
      <section id="your-rights" className="section">
        <h2>10. Ваші права</h2>
        <ul className="list">
          <li><b>Доступ</b> до ваших даних та отримання копії.</li>
          <li><b>Виправлення</b> неточних або неповних даних.</li>
          <li><b>Видалення</b> («право бути забутим») у передбачених законом випадках.</li>
          <li><b>Обмеження обробки</b> та <b>заперечення</b> проти обробки.</li>
          <li><b>Портативність</b> даних у зручному машиночитному форматі.</li>
          <li><b>Відкликання згоди</b> (якщо обробка базується на згоді).</li>
          <li><b>Скарга</b> до наглядового органу (Україна/ЄС).</li>
        </ul>
        <p>
          Щоб реалізувати права, скористайтесь контактами нижче. Ми відповімо у розумний строк, зазвичай — протягом 30 днів.
        </p>
      </section>

      {/* Безпека */}
      <section id="security" className="section">
        <h2>11. Безпека</h2>
        <p>
          Ми застосовуємо технічні та організаційні заходи (шифрування у транзиті, контроль доступів, журналювання,
          резервні копії, принцип найменших привілеїв) для захисту даних від несанкціонованого доступу, втрати чи знищення.
          Водночас жодна система не гарантує абсолютної безпеки.
        </p>
      </section>

      {/* Зміни */}
      <section id="changes" className="section">
        <h2>12. Зміни до політики</h2>
        <p>
          Ми можемо періодично оновлювати цю політику. Істотні зміни публікуємо на цій сторінці з новою датою оновлення,
          а за потреби — надсилаємо повідомлення у ваш акаунт або e-mail.
        </p>
      </section>

      {/* Контакти */}
      <section id="contacts" className="section contacts">
        <h2>13. Контакти</h2>
        <div className="contactGrid">
          <div className="contactCard">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
              <path d="M2 6l10 7L22 6v12H2z" fill="currentColor" opacity="0.2"/>
              <path d="M22 6l-10 7L2 6" fill="none" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M2 6h20v12H2z" fill="none" stroke="currentColor" strokeWidth="1.6"/>
            </svg>
            <div>
              <b>E-mail:</b><br />
              <a href="mailto:support@your-domain.com">support@your-domain.com</a>
            </div>
          </div>
          <div className="contactCard">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.2"/>
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="none" stroke="currentColor" strokeWidth="1.6"/>
            </svg>
            <div>
              <b>Оператор даних:</b><br />
              BrainBoost LLC<br />
              Київ, Україна
            </div>
          </div>
        </div>
        <p className="muted">
          Якщо ви вважаєте, що ваші права порушено, ви також можете звернутися до наглядового органу з питань захисту персональних даних.
        </p>
      </section>

      {/* Стилі */}
      <style jsx>{`
        .wrap {
          max-width: 1100px;
          margin: 2rem auto 4rem;
          padding: 0 1.2rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
            Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 2rem;
          align-items: center;
          background: linear-gradient(135deg, #f5e7ff 0%, #ffe7f1 100%);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 0 40px rgba(201, 132, 216, 0.25);
        }
        .heroText h1 {
          font-size: 2.6rem;
          color: #5b21b6;
          margin: 0 0 0.6rem;
          text-shadow: 0 0 8px #db277733;
        }
        .heroText p {
          font-size: 1.06rem;
          color: #4c1d95;
          line-height: 1.55;
          margin: 0 0 1rem;
        }
        .heroMeta {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .pill {
          background: #ffffffaa;
          color: #6b21a8;
          border: 1px solid #e9d5ff;
          border-radius: 999px;
          padding: 0.35rem 0.8rem;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .pillSecondary { background: #fff0f7aa; color: #be185d; }
        .heroCta { display: flex; gap: 0.8rem; flex-wrap: wrap; }
        .btnPrimary, .btnGhost {
          text-decoration: none;
          border-radius: 12px;
          padding: 0.65rem 1.1rem;
          font-weight: 800;
          display: inline-block;
        }
        .btnPrimary {
          color: white;
          background: linear-gradient(45deg, #db2777, #9333ea);
          box-shadow: 0 6px 20px #db277766;
        }
        .btnGhost {
          color: #6b21a8;
          background: #fff;
          border: 1px dashed #a855f7;
        }
        .heroArt img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 16px;
          box-shadow: 0 0 25px #a855f755, 0 0 50px #ec489955;
        }
        .heroArt figcaption {
          margin-top: 0.5rem;
          color: #6b21a8;
          font-size: 0.9rem;
          text-align: center;
        }

        .toc {
          margin: 2rem 0 1rem;
          background: #fff;
          border-radius: 14px;
          padding: 1rem 1.2rem;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.2);
        }
        .toc h2 {
          margin: 0 0 0.6rem;
          color: #6b21a8;
        }
        .toc ol {
          margin: 0;
          padding-left: 1.2rem;
          line-height: 1.8;
          color: #4c1d95;
          font-weight: 600;
        }
        .toc a { color: #6b21a8; }

        .section { margin: 2rem 0; }
        .section h2 {
          color: #6b21a8;
          margin-bottom: 0.6rem;
          font-size: 1.6rem;
          text-shadow: 0 0 4px #db277722;
        }
        .section p { color: #4c1d95; line-height: 1.6; }
        .list { color: #4c1d95; line-height: 1.7; }
        .list li { margin: 0.25rem 0; }

        .grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 1.6rem;
          align-items: start;
        }
        .photoCard img {
          width: 100%;
          border-radius: 14px;
          box-shadow: 0 0 16px #a855f744, 0 0 30px #ec489944;
        }
        .photoCard figcaption {
          text-align: center;
          margin-top: 0.5rem;
          color: #7c3aed;
          font-size: 0.92rem;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
        }
        .card {
          background: #fff;
          padding: 1rem;
          border-radius: 14px;
          box-shadow: 0 0 16px rgba(168, 85, 247, 0.25), 0 0 26px rgba(236, 72, 153, 0.2);
        }
        .card h3 { margin: 0 0 0.35rem; color: #6b21a8; }
        .card p { margin: 0; color: #4c1d95; }

        .contacts .contactGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 0.9rem;
        }
        .contactCard {
          display: flex;
          gap: 0.8rem;
          align-items: center;
          background: #fff;
          border-radius: 12px;
          padding: 0.8rem 1rem;
          color: #6b21a8;
          box-shadow: 0 0 14px rgba(168, 85, 247, 0.25);
        }
        .contactCard svg { color: #6b21a8; }
        .muted { color: #6b7280; margin-top: 0.6rem; }

        @media (max-width: 980px) {
          .hero, .grid { grid-template-columns: 1fr; }
          .hero { padding: 1.2rem; }
        }
      `}</style>
    </main>
  );
}
