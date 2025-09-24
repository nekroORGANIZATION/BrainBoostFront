'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import FooterCard from '@/components/FooterCard';

/* ================= ROOT STYLES (токени + утиліти + фон сторінки) ================= */
function RootStyles() {
  return (
    <style jsx global>{`
      :root {
        --bg: aliceblue;
        --paper: #fff;
        --ink: #0f1115;
        --muted: #6b7280;
        --accent: #2b63ff;        /* royalblue близький до макету */
        --accentDark: #1d3db2;    /* midnightblue */
        --line: #e5ecff;          /* lightsteelblue near */
        --panel: ghostwhite;
        --card: #fff;
        --pill: lavender;
        --shadow: rgba(16, 24, 40, .14);
      }

      .page {
        background-image: url('/images/back.png');
        background-size: cover;
        background-position: center top;
        background-repeat: no-repeat;
      }

      /* Контейнери */
      .container { width: 100%; max-width: 1160px; margin: 0 auto; padding: 0 24px; }
      .container--narrow { max-width: 1100px; padding: 0 16px; }

      /* Утиліти */
      .sectionTitle { font-size: 30px; line-height: 1.2; margin: 0 0 18px; color: var(--ink); text-align: center; }
      .accent { color: var(--accent); }
      .highlight { color: var(--accent); }
      .muted { color: var(--muted); }
      .small { font-size: 12px; opacity: .9; }
      .btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 20px; border-radius: 12px; font-weight: 700; text-decoration: none; border: 2px solid transparent; }
      .btn--primary { background: var(--accent); color: #fff; box-shadow: 0 10px 24px var(--shadow); }
      .btn--primary:hover { background: var(--accentDark); }

      /* Аксесибіліті */
      .srOnly { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0; }
    `}</style>
  );
}

/* ================= 1) HERO ================= */
function HeroSection() {
  return (
    <section className="hero">
      <div className="container hero__wrap">
        {/* LEFT */}
        <div className="hero__left">
          <div className="crumb">Старт після заявки</div>

          <h1 className="title">
            HTML/CSS-фахівець
            <br /> з допомогою
            <br /> працевлаштування
          </h1>

          <div className="rating">
            <div className="stars" aria-label="Рейтинг 4.85">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
          </div>

          <p className="lead">
            Опануйте сучасну IT-професію, отримайте масу цінних навичок та почніть заробляти вже через 2 місяці
            на крутих проєктах та улюбленій справі.
          </p>

          <div className="hero__cta">
            <Link href="#form" className="btn btn--primary">Записатися на курс</Link>
          </div>

          {/* Переваги */}
          <div className="benefits">
            {[
              { icon: '/images/ic1.png', text: 'Шаблони виконання практичних завдань' },
              { icon: '/images/ic2.png', text: 'Покроковий план розвитку до отримання першого проєкту' },
              { icon: '/images/ic3.png', text: '20 модулів' },
              { icon: '/images/ic4.png', text: 'Практична робота з професіоналом' },
              { icon: '/images/ic5.png', text: 'Іменний диплом після завершення навчання' },
            ].map((b, i) => (
              <div className={`benefit b${i + 1}`} key={i}>
                <div className="benefit__icon">
                  <Image src={b.icon} alt="" width={44} height={44} style={{ objectFit: 'contain' }} />
                </div>
                <div className="benefit__text">{b.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="hero__right">
          <Image
            src="/images/course_ava.png"
            alt="Ілюстрація курсу"
            width={440}
            height={330}
            priority
            className="hero__img"
          />
        </div>
      </div>

      <style jsx>{`
        .hero { padding: 72px 0 40px; position: relative; }

        .hero__wrap{
          display:grid;
          grid-template-columns: 640px 460px;
          gap: 56px;
          align-items:start;
        }
        .hero__left{ padding-top:4px; }
        .hero__right{ display:flex; align-items:flex-start; justify-content:center; transform: translate(10px, 6px); }

        .crumb{ color:#6b7b8d; font-size:18px; margin-bottom:12px; }
        .title{ font-size:46px; font-weight:700; line-height:1.06; letter-spacing:-0.01em; margin:6px 0 16px; color:var(--ink); max-width:620px; }
        .rating{ display:flex; align-items:center; gap:18px; margin: 4px 0 14px; }
        .stars{ display:inline-flex; gap:8px; font-size:50px; color:#f7b500; }
        .rating__text{ color:#6b7b8d; font-size:16px; }
        .lead{ max-width: 600px; color: var(--ink); opacity:.9; font-size:20px; line-height:1.58; margin: 2px 0 18px; }
        .hero__cta{ margin: 6px 0 22px; }

        .benefits{
          display:grid;
          grid-template-columns: 360px 360px 220px;
          grid-template-rows:auto auto;
          gap: 22px 36px;
          align-items:start;
          margin-top: 8px;
          grid-template-areas:
            "b1 b2 b3"
            "b4 .  b5";
        }
        .benefit{ display:grid; grid-template-columns: 48px 1fr; gap:16px; align-items:center; }
        .benefit__icon{ height:80px; display:grid; place-items:center; background:transparent; box-shadow:none; border-radius:0; }
        .benefit__text{ font-size:16px; line-height:1.3; color:#0f1720; max-width: 300px; }
        .benefit.b1{ grid-area:b1; } .benefit.b2{ grid-area:b2; } .benefit.b3{ grid-area:b3; } .benefit.b4{ grid-area:b4; } .benefit.b5{ grid-area:b5; }

        .hero__img{ width:440px; height:auto; max-width:100%; border-radius:18px; background: var(--paper); box-shadow: 0 14px 28px var(--shadow); }

        @media (max-width: 1100px){ .hero__wrap{ grid-template-columns: 1.08fr .92fr; gap:44px; } }
        @media (max-width: 980px){
          .hero__wrap{ grid-template-columns:1fr; gap:30px; }
          .hero__right{ order:-1; transform:none; }
          .benefits{
            grid-template-columns: repeat(2, minmax(0,1fr));
            grid-template-areas: "b1 b2" "b3 b4" "b5 b5";
          }
        }
        @media (max-width: 560px){
          .benefits{ grid-template-columns: 1fr; grid-template-areas: "b1" "b2" "b3" "b4" "b5"; gap:16px; }
          .benefit{ grid-template-columns: 46px 1fr; }
        }
      `}</style>
    </section>
  );
}

/* ================= 2) WHO ================= */
function WhoSection() {
  return (
    <section className="who">
      <div className="container">
        <h2 className="who__title">
          Хто такий <span className="who__accent">HTML/CSS-фахівець</span>?
        </h2>

        <div className="who__card">
          <p className="who__text">
            <strong>HTML-верстальник</strong>
            це той, хто перетворює намальований дизайнером макет у живий сайт,
            переводить картинку-макет на мову, зрозумілу будь-якому браузеру.
          </p>
        </div>
      </div>

      <style jsx>{`
        .who { padding-top: 130px; padding-bottom:180px; }
        .who__title { margin: 0 0 22px; text-align: center; font-weight: 800; font-size: 36px; line-height: 1.18; color: #0f1115; letter-spacing: -0.01em; margin-bottom: 64px; }
        .who__accent { color: #2f6bff; font-weight: 800; }

        .who__card { width: 700px; max-width: 100%; margin: 0 auto; background: #6a7fff; border-radius: 14px; padding: 22px 26px; box-shadow: 0 18px 40px rgba(20, 32, 70, 0.18); }
        .who__text { margin: 0; color: #070707; font-size: 20px; line-height: 1.72; }
        .who__text strong { display: block; margin-bottom: 8px; font-weight: 800; }

        @media (max-width: 1024px) { .who { padding-top: 56px; padding-bottom: 64px; } .who__title { font-size: 34px; } }
        @media (max-width: 640px) { .who { padding-top: 48px; padding-bottom: 56px; } .who__title { font-size: 30px; } .who__card { width: 100%; border-radius: 12px; padding: 20px 22px; } }
      `}</style>
    </section>
  );
}

/* ================= 3) FOR YOU ================= */
function ForYouSection() {
  const items = [
    { icon: '/images/y1.png', title: 'Мрієш стати IT-фахівцем', sub: 'Але не маєш технічної освіти' },
    { icon: '/images/y2.png', title: 'Бажаєш освоїти нову професію', sub: 'І заробляти від 1000$, подорожувати та працювати з будь-якої точки світу' },
    { icon: '/images/y3.png', title: 'Хочеш стати HTML/CSS верстальником', sub: 'Але не розумієш, як почати свій шлях, щоб швидше отримати результат' },
    { icon: '/images/y4.png', title: 'Мама у декреті', sub: 'Яка шукає додатковий заробіток, який зможе поєднувати із сім’єю' },
    { icon: '/images/y5.png', title: 'Офісний співробітник', sub: 'Який втомився від рутинної роботи, хоче свободи, розвитку та фінансового зростання' },
    { icon: '/images/y6.png', title: 'Студент', sub: 'Який шукає себе і справу, в якій зможе реалізувати свій потенціал та отримувати прибуток' },
  ];

  return (
    <section className="forYou">
      <div className="container">
        <h2 className="forYou__title">
          Цей <span className="accent">курс точно для тебе</span>, якщо ти
        </h2>

        <div className="forYou__grid">
          {items.map((it, i) => (
            <div className="fyItem" key={i}>
              <div className="fyItem__icon">
                <Image src={it.icon} alt="" width={64} height={64} />
              </div>
              <div className="fyItem__title">{it.title}</div>
              <div className="fyItem__sub">{it.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .forYou { padding: 64px 0 76px; }
        .forYou__title { margin: 0 0 34px; text-align: center; font-weight: 800; font-size: 36px; line-height: 1.2; letter-spacing: -0.01em; color: #0f1115; }
        .forYou__title .accent { color: var(--accent); }

        .forYou__grid{
          --tileW: 420px; --gapX: 120px;
          display: grid;
          grid-template-columns: repeat(2, var(--tileW));
          column-gap: var(--gapX); row-gap: 56px;
          width: calc(var(--tileW) * 2 + var(--gapX));
          max-width: 100%;
          margin-left: auto; margin-right: auto;
          justify-items: start;
        }

        .fyItem{ width: 100%; max-width: 420px; }
        .fyItem__icon { width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; margin: 0 0 14px; }
        .fyItem__icon :global(img) { width: 64px; height: 64px; object-fit: contain; }
        .fyItem__title { font-weight: 700; font-size: 28px; line-height: 1.25; margin: 4px 0 8px; color: #0f1115; }
        .fyItem__sub { color: #4a5568; font-size: 20px; line-height: 1.45; max-width: 360px; }

        @media (max-width: 1180px) { .forYou__grid { column-gap: 72px; } .forYou__title { font-size: 34px; } }
        @media (max-width: 820px) { .forYou { padding: 56px 0 64px; } .forYou__grid { grid-template-columns: 1fr; row-gap: 38px; } .fyItem { margin: 0 auto; } }
      `}</style>
    </section>
  );
}

/* ================= 4) INSTRUCTOR ================= */
function InstructorSection() {
  return (
    <section className="instructor">
      <div className="container container--narrow">
        <div className="band">
          <h2 className="title">
            Хто веде <span className="accent">навчання</span>?
          </h2>
          <p className="desc">
            Вчитися варто лише у найкращих! Наш експерт — визнаний ТОП-фахівець у сфері
            HTML/CSS-верстки, який ділитиметься з вами своїм досвідом і знаннями протягом 8 тижнів.
          </p>
        </div>

        <div className="card">
          <div className="photo"><Image src="/images/teacher2.png" alt="Викладач" fill priority /></div>
          <div className="name">Богдан Савчук</div>
          <div className="badge">HTML/SMM викладач</div>
        </div>
      </div>

      <style jsx>{`
        .instructor { position: relative; padding: 42px 0 80px; }

        .band {
          width: 100%;
          border-radius: 16px;
          padding: 40px 20px 120px;
          background: linear-gradient(180deg, #cfe0ff 0%, #bcd1ff 100%);
          box-shadow: 0 8px 24px rgba(46, 84, 255, 0.18) inset;
          text-align: center;
        }
        .title { margin: 0 0 14px; font-weight: 800; font-size: 38px; line-height: 1.2; letter-spacing: -0.01em; color: #0f1115; }
        .title .accent { color: var(--accent); }
        .desc { max-width: 640px; margin: 0 auto; font-size: 20px; line-height: 1.85; color: #1f2937; opacity: 0.95; }

        .card { position: relative; width: 340px; height: 370px; margin: -95px auto 0; border-radius: 14px; border: 4px solid #5c75ff; box-shadow: 0 16px 36px rgba(17, 24, 39, 0.25), 0 0 0 6px rgba(92, 117, 255, 0.18) inset; background: #0b0f1a; overflow: hidden; }
        .photo{ position:absolute; inset:0; }
        .photo :global(img){ object-fit: cover; }
        .name { position: absolute; left: 22px; bottom: 56px; color: #fff; font-weight: 800; font-size: 18px; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45); }
        .badge { position: absolute; left: 22px; bottom: 18px; padding: 6px 12px; font-size: 12px; color: #fff; border-radius: 10px; border: 1px solid rgba(255,255,255,.55); background: rgba(255,255,255,.16); backdrop-filter: blur(4px); text-shadow: 0 1px 6px rgba(0,0,0,.35); }

        @media (max-width: 760px) { .band { padding: 34px 16px 110px; } .title { font-size: 32px; } .desc { max-width: 520px; font-size: 15px; } .card { width: 300px; height: 330px; margin-top: -88px; } }
        @media (max-width: 480px) { .title { font-size: 28px; } .desc { font-size: 14px; } .card { width: 280px; height: 310px; margin-top: -82px; } }
      `}</style>
    </section>
  );
}

/* ================= 5) PROGRAM ================= */
function ProgramSection() {
  const program = [
    'Вступ до HTML','Семантична розмітка','Вступ до CSS','Шрифти та іконки','Блокова модель і розміри',
    'Flexbox від А до Я','CSS Grid-розкладки','Декор та візуальні ефекти','Графіка й оптимізація зображень',
    'Позиціонування елементів','Анімації та переходи','Форми: створення та UX-дрібниці',
    'Форми: валідація та доступність','Препроцесори (Sass)','Методології CSS (BEM)',
    'Адаптивність і responsive-графіка','ФІНАЛЬНИЙ ПРОЄКТ',
  ];

  return (
    <section className="program">
      <div className="container program__wrap">
        <ol className="program__list">
          {program.map((text, i) => (
            <li className="program__item" key={i}>
              <span className="program__num">{i + 1}.</span>
              <span className="program__text">{text}</span>
            </li>
          ))}
        </ol>

        <div className="program__art">
          <Image src="/images/program.png" alt="Ілюстрація навчальної програми" width={603} height={634} className="program__img" priority />
        </div>
      </div>

      <style jsx>{`
        .program { padding: 72px 0 88px; }
        .program__wrap { display: grid; grid-template-columns: 560px 603px; gap: 56px; align-items: start; }

        .program__list { margin: 0; padding: 0; list-style: none; display: grid; row-gap: 20px; }
        .program__item { display: flex; align-items: baseline; gap: 12px; color: #0f1115; }
        .program__num { min-width: 38px; text-align: right; font-weight: 700; font-size: 18px; line-height: 1.35; }
        .program__text { font-weight: 600; font-size: 21px; line-height: 1.35; letter-spacing: .1px; }

        .program__art { display: flex; justify-content: center; }
        .program__img { width: 603px; height: auto; max-width: 100%; display: block; }

        @media (max-width: 1180px) {
          .program { padding: 56px 0 72px; }
          .program__wrap { grid-template-columns: 1fr; gap: 32px; }
          .program__art { order: 2; }
          .program__list { row-gap: 20px; }
          .program__num { font-size: 18px; min-width: 36px; }
          .program__text { font-size: 20px; }
        }
        @media (max-width: 560px) { .program { padding: 44px 0 56px; } .program__list { row-gap: 18px; } .program__num { font-size: 17px; min-width: 34px; } .program__text { font-size: 19px; } }
      `}</style>
    </section>
  );
}

/* ================= 6) AWAITS ================= */
function AwaitsSection() {
  const items = [
    { icon: '/images/what1.png', title: 'Практичні домашні завдання', text: 'Ми подбали про те, щоб ви якомога легше та продуктивніше освоїли нову професію і відточували навички на практиці.' },
    { icon: '/images/what2.png', title: 'Куратори, ментори-практики', text: 'Навчатиметеся у фахівців із великих IT-компаній та отримуєте постійну підтримку куратора.' },
    { icon: '/images/what3.png', title: 'Навчання у зручний час', text: 'Уроки проходять наживо 2–3 рази на тиждень. Після кожного — запис, який буде доступний у кабінеті 24/7.' },
    { icon: '/images/what4.png', title: 'Працевлаштування', text: 'Виконуй завдання, проходь коучинг і дотримуйся порад експертів — і вже за 3 місяці після курсу зможеш отримати роботу.' },
  ];

  return (
    <section className="awaitsNew">
      <div className="container">
        <h2 className="awaitsNew__title"><span className="accent">Що на тебе чекає в курсі</span></h2>
        <div className="awaitsNew__sub">“HTML/CSS верстальник з можливістю працевлаштування”?</div>

        <div className="awaitsNew__grid">
          {items.map((it, i) => (
            <div className="aCard" key={i}>
              <div className="aCard__icon"><Image src={it.icon} alt="" width={120} height={120} /></div>
              <div className="aCard__title">{it.title}</div>
              <p className="aCard__text">{it.text}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .awaitsNew { padding: 56px 0 64px; }
        .awaitsNew__title { text-align: center; font-size: 36px; font-weight: 800; line-height: 1.15; margin: 0 0 26px; letter-spacing: -0.01em; }
        .awaitsNew__sub { text-align: center; font-size: 28px; font-weight: 800; line-height: 1.2; color: var(--ink); margin-bottom: 72px; }

        .awaitsNew__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px; align-items: stretch; }
        .aCard { background: var(--paper); border-radius: 16px; padding: 28px 20px 26px; text-align: center; box-shadow: 0 10px 26px var(--shadow), inset 0 0 0 2px var(--line); }
        .aCard__icon { display: grid; place-items: center; margin: 18px 0 24px; }
        .aCard__title { font-weight: 750; font-size: 22px; margin: 6px 0 15px; color: var(--ink); }
        .aCard__text { color: var(--muted); font-size: 17px; line-height: 1.45; max-width: 420px; margin: 0 auto 52px; }

        @media (max-width: 960px) { .awaitsNew__title { font-size: 32px; } .awaitsNew__sub { font-size: 24px; } .awaitsNew__grid { grid-template-columns: 1fr; } }
        @media (max-width: 560px) { .awaitsNew { padding: 44px 0 48px; } .awaitsNew__title { font-size: 28px; } .awaitsNew__sub { font-size: 20px; } }
      `}</style>
    </section>
  );
}

/* ================= 6b) HOW ================= */
function StudyFlowSection() {
  const items = [
    { icon: '/images/st1.png', title: 'Теорія + практика:', text: 'Спочатку перегляд відеоуроків, потім виконання завдань за матеріалом уроку з готовими шаблонами для ефективного засвоєння.' },
    { icon: '/images/st2.png', title: 'Домашні завдання та тестування:', text: 'Протягом курсу спікери перевіряють ваші роботи, відповідають на всі запитання, а куратор супроводжує навчання, підтримує та мотивує.' },
    { icon: '/images/st3.png', title: 'Живі Q&A-сесії:', text: 'Спікери проводять онлайн-сесії «Питання–Відповіді», де ви можете отримати розгорнуті відповіді на свої запитання в реальному часі.' },
    { icon: '/images/st4.png', title: 'Диплом:', text: 'Після завершення курсу ви проходите підсумкове тестування та отримуєте офіційний диплом, що підтверджує здобуті навички.' },
  ];

  return (
    <section className="howV2">
      <div className="container">
        <h2 className="howV2__title">Як <span className="accent">проходить</span> навчання?</h2>

        <div className="howV2__grid">
          {items.map((it, i) => (
            <div className="hItem" key={i}>
              <div className="hItem__pill"><div className="hItem__icon"><Image src={it.icon} alt="" width={64} height={64} /></div></div>
              <div className="hItem__title">{it.title}</div>
              <p className="hItem__text">{it.text}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .howV2 { padding: 64px 0 72px; }
        .howV2__title { text-align: center; font-weight: 700; font-size: 38px; line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 130px; color: var(--ink); }
        .howV2__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 90px; row-gap: 72px; align-items: start; justify-items: center; }
        .hItem { max-width: 360px; text-align: center; }
        .hItem__pill { position: relative; width: 300px; height: 120px; border-radius: 999px; background: #a2bffc; margin: 0 auto 18px; transform: rotate(-39deg); box-shadow: 0 10px 22px rgba(0,0,0,0.06); margin-bottom:100px; }
        .hItem__icon { position: absolute; inset: 0; display: grid; place-items: center; transform: rotate(39deg); }
        .hItem__title { font-weight: 800; font-size: 20px; line-height: 1.25; color: #0f1115; margin-bottom: 19px; }
        .hItem__text { color: #4a5568; font-size: 17px; line-height: 1.55; font-weight: 470; }

        @media (max-width: 1100px) { .howV2__grid { column-gap: 56px; } }
        @media (max-width: 900px) { .howV2 { padding: 56px 0 64px; } .howV2__grid { grid-template-columns: 1fr; row-gap: 52px; } .hItem { max-width: 420px; } }
        @media (max-width: 520px) { .howV2__title { font-size: 28px; } .hItem__pill { width: 190px; height: 110px; } .hItem__title { font-size: 15px; } .hItem__text { font-size: 14px; } }
      `}</style>
    </section>
  );
}

/* ================= 7) SALARY ================= */
/* ================= 7) SALARY ================= */
function SalaryAndJobHelpSection() {
  const chartHeights = [88, 132, 108, 124, 102, 140];

  return (
    <section className="salary">
      <div className="container salary__container">
        <h2 className="salary__title">
          Скільки можна <span>заробляти?</span>
        </h2>

        <div className="salaryCard">
          <div className="salaryTop">
            <div className="panel panel--num">
              <div className="salaryNum">45&nbsp;000грн</div>
            </div>

            <div className="panel panel--chart">
              <div className="chartTitle">Розподіл зарплат</div>
              <div
                className="chart"
                role="img"
                aria-label="Гістограма розподілу зарплат"
              >
                {chartHeights.map((h, i) => (
                  <div className="sBar" style={{ height: h }} key={i} />
                ))}
              </div>
              <div className="axis">
                <span>20&nbsp;000грн</span>
                <span>132&nbsp;000грн</span>
              </div>
            </div>
          </div>

          <div className="tblWrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Місто</th>
                  <th>Зарплата</th>
                  <th className="right">Зміни за рік</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Вся Україна</td>
                  <td>45&nbsp;000грн</td>
                  <td className="right neg">−16%</td>
                </tr>
                <tr>
                  <td>Дистанційно</td>
                  <td>62&nbsp;500грн</td>
                  <td className="right pos">+4%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .salary {
          --card: #fff;
          --outline: #dadbdd;
          --rowline: #eef1f6;
          --ink: #1e1e1f;
          --muted: #6b7280;
          --shadow: 0 24px 56px rgba(16, 24, 40, 0.12);
          --barTop: #6f8cff;
          --barBottom: #aebfff;
          --pos: #19c37d;
          --neg: #ef4444;
          padding: 64px 0 74px;
        }
        .salary__container {
          max-width: 1100px;
        }
        .salary__title {
          text-align: center;
          font-size: clamp(26px, 2.6vw, 34px);
          font-weight: 900;
          letter-spacing: -0.01em;
          color: var(--ink);
          margin: 0 0 26px;
        }
        .salary__title span {
          color: var(--accent);
        }
        .salaryCard {
          background: var(--card);
          border-radius: 22px;
          box-shadow: var(--shadow);
          padding: 28px;
        }
        .salaryTop {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 26px;
          margin-bottom: 26px;
        }
        .panel {
          background: #fff;
          border: 2px solid var(--outline);
          border-radius: 20px;
          padding: 28px 26px;
        }
        .panel--num {
          display: grid;
          place-items: center;
          min-height: 240px;
        }
        .salaryNum {
          font-size: clamp(48px, 5.6vw, 64px);
          line-height: 1;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--ink);
        }
        .panel--chart {
          padding-top: 20px;
        }
        .chartTitle {
          text-align: center;
          font-weight: 900;
          font-size: 18px;
          color: var(--ink);
          margin-bottom: 14px;
        }
        .chart {
          height: 188px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          padding: 16px 18px 12px;
          background: #eef3ff;
          border: 2px solid var(--outline);
          border-radius: 14px;
        }
        .sBar {
          width: 44px;
          border-radius: 12px;
          background: linear-gradient(180deg, var(--barTop), var(--barBottom));
          box-shadow: 0 8px 16px rgba(109, 137, 255, 0.22),
            inset 0 -4px 0 rgba(255, 255, 255, 0.65);
        }
        .axis {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #5b6b8a;
          margin-top: 8px;
          padding: 0 2px;
        }
        .tblWrap {
          border: 2px solid var(--outline);
          border-radius: 20px;
          overflow-x: auto; /* ✅ прокрутка на мобільних */
          background: #fff;
        }
        .tbl {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-variant-numeric: tabular-nums;
          min-width: 420px; /* ✅ щоб таблиця не ламалась */
        }
        .tbl thead th {
          text-align: left;
          font-weight: 900;
          font-size: 17px;
          padding: 18px 22px;
          color: var(--ink);
          background: #fff;
          border-bottom: 2px solid var(--outline);
        }
        .tbl .right {
          text-align: right;
        }
        .tbl tbody td {
          padding: 22px 22px;
          color: var(--ink);
          background: #fff;
          border-bottom: 1.5px solid var(--rowline);
        }
        .tbl tbody tr:last-child td {
          border-bottom: 0;
        }
        .tbl tbody td.pos {
          color: var(--pos);
          font-weight: 900;
        }
        .tbl tbody td.neg {
          color: var(--neg);
          font-weight: 900;
        }
        .tbl tbody tr:hover td {
          background: #fafbff;
        }

        /* ✅ адаптивність */
        @media (max-width: 980px) {
          .salaryTop {
            grid-template-columns: 1fr;
          }
          .panel--num {
            min-height: 180px;
          }
          .chart {
            height: 150px;
          }
        }

        @media (max-width: 640px) {
          .salaryCard {
            padding: 20px;
          }
          .panel {
            padding: 20px 18px;
          }
          .salaryNum {
            font-size: 36px;
          }
          .chartTitle {
            font-size: 16px;
          }
          .sBar {
            width: 28px;
          }
          .axis {
            font-size: 12px;
          }
          .tbl thead th,
          .tbl tbody td {
            padding: 14px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </section>
  );
}

/* ================= 8) JOB HELP BAND ================= */
function JobHelpBand() {
  return (
    <section className="jobHelpBand">
      <div className="jobHelpBand__inner container container--narrow">
        <h2 className="jobHelpBand__title">Ми допомагаємо з працевлаштуванням</h2>

        <ul className="jobHelpBand__list">
          <li className="jobHelpBand__item">
            <span className="jobHelpBand__num">1</span>
            <p className="jobHelpBand__text">Ви отримаєте завірений диплом від <strong>BrainBoost</strong>, це збільшить ваші шанси на успішне працевлаштування.</p>
          </li>
          <li className="jobHelpBand__item">
            <span className="jobHelpBand__num">2</span>
            <p className="jobHelpBand__text">Кожен диплом оснащений <strong>QR-кодом</strong>: роботодавець може швидко перевірити справжність та ознайомитися з вашою статистикою навчання — пройдені уроки, прослухані години, набрані бали тощо.</p>
          </li>
          <li className="jobHelpBand__item">
            <span className="jobHelpBand__num">3</span>
            <p className="jobHelpBand__text">Усі учасники отримують доступ до закритого курсу з працевлаштування <strong>“BrainBoost Talents”</strong>. Ви навчитеся ефективно презентувати себе на всіх етапах відбору, готуватися до співбесід і отримувати роботу мрії в топових IT-компаніях.</p>
          </li>
        </ul>
      </div>

      <span aria-hidden className="jobHelpBand__blob" />

      <style jsx>{`
        .jobHelpBand{ position:relative; overflow:hidden; padding: 186px 0 148px; background: linear-gradient(180deg,#bcd0ff 0%,#b6c9ff 50%,#afc2ff 100%); }
        .jobHelpBand__inner{ position:relative; z-index:2; }
        .jobHelpBand__title{ margin:0 0 66px; font-size: clamp(30px,2.6vw,38px); font-weight: 750; color:#fff; line-height:1.22; text-align:center; }
        .jobHelpBand__list{ display:grid; gap:28px; max-width: 1100px; }
        .jobHelpBand__item{ display:grid; grid-template-columns: 64px 1fr; gap:20px; align-items:start; }
        .jobHelpBand__num{ width:64px; height:64px; border-radius:50%; display:grid; place-items:center; font-weight:900; font-size:24px; color:#fff; background:#1f5fff; }
        .jobHelpBand__text{ color:#0f1115; font-size:22px; line-height:1.65; }
        .jobHelpBand__blob{ position:absolute; right:-420px; bottom:-520px; width:1200px; height:1200px; transform:rotate(-18deg); background: radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,.55) 0%, rgba(255,255,255,.18) 45%, rgba(255,255,255,0) 72%); pointer-events:none; z-index:1; }
        @media (max-width: 820px){ .jobHelpBand{ padding:72px 0 84px; } .jobHelpBand__item{ grid-template-columns:52px 1fr; gap:16px; } .jobHelpBand__num{ width:52px; height:52px; font-size:20px; } .jobHelpBand__text{ font-size:16px; } }
      `}</style>
    </section>
  );
}

/* ================= 9) PARTNERS ================= */
function PartnersSection() {
  return (
    <section className="ps">
      <div className="container container--narrow ps__wrap">
        <h2 className="ps__title">
          Наші навчальні <span>програми проходять</span>
        </h2>
        <p className="ps__sub">
          власники, керівники та співробітники провідних компаній
        </p>

        <div className="ps__logos">
          <div className="lg"><Image src="/images/partner-01.png" alt="" fill sizes="180px" /></div>
          <div className="lg"><Image src="/images/partner-02.png" alt="" fill sizes="126px" /></div>
          <div className="lg"><Image src="/images/partner-03.png" alt="" fill sizes="126px" /></div>
          <div className="lg"><Image src="/images/partner-04.png" alt="" fill sizes="320px" /></div>
          <div className="lg"><Image src="/images/partner-05.png" alt="" fill sizes="190px" /></div>
          <div className="lg"><Image src="/images/img6.png" alt="" fill sizes="126px" /></div>
          <div className="lg"><Image src="/images/partner-07.png" alt="" fill sizes="230px" /></div>
          <div className="lg"><Image src="/images/partner-08.png" alt="" fill sizes="244px" /></div>
        </div>
      </div>

      <style jsx>{`
        .ps { padding: 56px 0 48px; }
        .ps__wrap { max-width: 1100px; margin: 0 auto; }
        .ps__title { 
          text-align: center; 
          font-weight: 900; 
          letter-spacing: -0.01em; 
          color: #0f1115; 
          margin: 0 0 30px; 
          font-size: clamp(28px, 3.2vw, 44px); 
          line-height: 1.12; 
        }
        .ps__title span { color: var(--accent); }
        .ps__sub { 
          text-align: center; 
          color: #1f2937; 
          opacity: 0.85; 
          margin: 0 0 72px; 
          font-size: clamp(14px, 1.6vw, 16px); 
        }

        /* Сітка 2×4 */
        .ps__logos {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(2, auto);
          gap: 28px 24px;
          align-items: center;
          justify-items: center;
        }

        .lg {
          position: relative;
          width: 100%;
          max-width: 200px;
          height: 100px;
        }
        .lg :global(img) { object-fit: contain; }

        @media (max-width: 720px) {
          .ps { padding: 44px 0 40px; }
          .ps__sub { margin-bottom: 40px; }
          .ps__logos {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(4, auto);
            gap: 20px 16px;
          }
          .lg { max-width: 160px; height: 80px; }
        }
      `}</style>
    </section>
  );
}

/* ================= 10) INSTALLMENT ================= */
function InstallmentSection() {
  return (
    <section className="inst">
      <div className="container container--narrow">
        <h2 className="inst__title">Розстрочка без переплат від</h2>
        <div className="inst__brand">BrainBoost</div>

        <p className="inst__lead">
          Почніть навчатися вже зараз, а оплату вносіть частинами. Комфортний формат розстрочки:
          <a href="#installments" className="inst__link"> до 2 до 6 місяців*</a>
        </p>

        <div className="inst__cta"><a href="#how-to-pay" className="inst__btn">Як сплатити частинами?</a></div>

        <ul className="inst__list">
          <li>Залишіть заявку на участь та переходьте до оплати</li>
          <li>Виберіть спосіб оплати частинами</li>
          <li>Оплачуйте частинами без переплат через Monobank або PrivatBank</li>
        </ul>

        <hr className="inst__hr" />
      </div>

      <style jsx>{`
        .inst { padding: 52px 0; color: var(--ink); }
        .inst__title { text-align: center; font-weight: 800; font-size: clamp(28px, 4vw, 46px); letter-spacing: -0.01em; margin: 0 0 8px; }
        .inst__brand { text-align: center; font-weight: 800; font-size: clamp(30px, 3vw, 42px); margin-bottom: 50px; color: rgb(28,65,167); }
        .inst__lead { text-align: center; max-width: 820px; margin: 0 auto 50px; opacity: 0.95; line-height: 1.45; font-size: clamp(14px, 1.6vw, 26px); }
        .inst__link { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
        .inst__cta { display: flex; justify-content: center; margin: 6px 0 18px; }
        .inst__btn { display: inline-block; padding: 12px 22px; border-radius: 12px; background: var(--accent); color: #fff; font-weight: 700; font-size: 24px; line-height: 1; text-decoration: none; box-shadow: 0 10px 22px rgba(43, 99, 255, 0.22); transition: transform .06s ease, box-shadow .12s ease; margin-bottom: 36px; }
        .inst__btn:hover { transform: translateY(-1px); }
        .inst__btn:active { transform: translateY(0); box-shadow: 0 6px 14px rgba(43,99,255,.18); }

        .inst__list{ max-width: 820px; margin: 0 auto 22px; list-style: none; padding: 0; display: grid; row-gap: 12px; }
        .inst__list li{ position: relative; padding: 10px 12px 10px 38px; background: rgba(15,17,21,.03); border-radius: 12px; line-height: 1.5; font-size: clamp(15px, 1.7vw, 18px); }
        .inst__list li::before{ content: ""; position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px rgba(43,99,255,.18); }

        .inst__hr{ margin: 26px auto 0; max-width: 980px; height: 1px; border: 0; background: rgba(15,17,21,.16); }

        @media (max-width: 560px){ .inst{ padding: 44px 0; } .inst__btn{ width: 100%; text-align: center; } .inst__list li{ padding-left: 36px; } }
      `}</style>
    </section>
  );
}

/* ================= 11) CTA FORM ================= */
function CTASection() {
  const API_URL = process.env.NEXT_PUBLIC_CONTACTS_API || 'http://127.0.0.1:8000/api/contacts/';
  const [form, setForm] = React.useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target; setForm((s) => ({ ...s, [name]: value })); setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setStatus(null);
    if (!form.name.trim() || (!form.email.trim() && !form.phone.trim())) {
      setStatus({ type: 'error', message: 'Вкажіть ім’я та щонайменше email або телефон.' }); return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone,
          topic: 'Заявка: HTML/CSS (CTA форма на сторінці курсу)',
          message: 'Заявка з форми "Записатися на курс" (CTA). Користувач хоче забронювати місце/отримати консультацію.',
        }),
      });
      if (res.ok) { setStatus({ type: 'success', message: 'Дякуємо! Ми зв’яжемось із вами найближчим часом.' }); setForm({ name: '', email: '', phone: '' }); }
      else { const data = await res.json().catch(() => ({})); setStatus({ type: 'error', message: 'Помилка відправки: ' + ((data as any)?.error || res.status) }); }
    } catch { setStatus({ type: 'error', message: 'Помилка з’єднання з сервером. Спробуйте ще раз.' }); }
    finally { setLoading(false); }
  };

  return (
    <section className="cta" id="form">
      <div className="container container--narrow">
        <h2 className="cta__title">
          Щоб <span className="accent">забронювати ціну зі знижкою</span> та підключитися до лімітованої групи, <br />
          заповніть форму
        </h2>

        <div className="cta__grid">
          <div className="cta__left">
            <h3 className="cta__leftTitle">Старт практичного курсу “HTML/CSS спеціаліст з допомогою працевлаштування”</h3>
            <p className="cta__leftP">Щоб першим забронювати участь <span className="accent">та підключитися до лімітованої групи на кращих умовах</span>, заповніть форму.</p>
          </div>

          <div className="cta__card">
            <form className="form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="name" className="srOnly">Ім’я та прізвище</label>
              <input id="name" name="name" placeholder="Ім’я та прізвище" value={form.name} onChange={handleChange} autoComplete="name" />
              <label htmlFor="email" className="srOnly">Email</label>
              <input id="email" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} autoComplete="email" />
              <label htmlFor="phone" className="srOnly">Телефон</label>
              <input id="phone" name="phone" type="tel" placeholder="Телефон" value={form.phone} onChange={handleChange} autoComplete="tel" />
              <button type="submit" disabled={loading}>{loading ? 'Надсилаю…' : 'Записатися на курс'}</button>
              {status && <p className={`form__status ${status.type === 'success' ? 'ok' : 'err'}`} role="status" aria-live="polite">{status.message}</p>}
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cta { padding: 56px 0 64px; }
        .cta__title { text-align: center; font-weight: 900; letter-spacing: -0.01em; color: #0f1115; margin: 0 0 86px; font-size: clamp(22px, 3.2vw, 38px); line-height: 1.25; }
        .cta__grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 36px; align-items: start; }
        .cta__leftTitle { font-weight: 800; font-size: clamp(18px, 2vw, 28px); line-height: 1.25; margin: 0 0 10px; color: #0f1115; }
        .cta__leftP { margin: 0; font-size: clamp(14px, 1.6vw, 18px); line-height: 1.55; color: rgba(15, 17, 21, 0.9); max-width: 520px; }

        .cta__card { background: #7fa0ff; border-radius: 18px; padding: 18px; box-shadow: 0 18px 34px rgba(10, 20, 60, 0.18); }
        .form { background: #7fa0ff; border-radius: 16px; padding: 16px; display: grid; gap: 12px; }
        .form input { height: 48px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.0); outline: none; background: #fff; color: #0f1115; font-size: 16px; padding: 12px 14px; transition: border-color .12s ease, box-shadow .12s ease; }
        .form input:focus { border-color: #1f46ff; box-shadow: 0 0 0 3px rgba(32, 70, 255, 0.18); }
        .form button { margin-top: 6px; height: 46px; border-radius: 10px; border: none; background: #2b63ff; color: #fff; font-weight: 800; font-size: 15px; letter-spacing: 0.01em; cursor: pointer; transition: transform .06s ease, box-shadow .15s ease; box-shadow: 0 12px 26px rgba(43, 99, 255, 0.25); }
        .form button:hover { transform: translateY(-1px); }
        .form button:active { transform: translateY(0); box-shadow: 0 8px 16px rgba(43, 99, 255, 0.2); }
        .form button:disabled { opacity: .7; cursor: default; transform: none; }
        .form__status { margin: 2px 2px 0; padding: 10px 12px; border-radius: 10px; font-size: 13px; line-height: 1.35; background: rgba(255,255,255,.65); }
        .form__status.ok { background: rgba(16,185,129,.15); color: #065f46; }
        .form__status.err { background: rgba(239,68,68,.15); color: #7f1d1d; }

        @media (max-width: 980px) { .cta__grid { grid-template-columns: 1fr; gap: 22px; } .cta__leftP { max-width: 620px; } }
      `}</style>
    </section>
  );
}

/* ================= PAGE COMPOSITION ================= */
export default function CourseProgrammingPage() {
  return (
    <main className="page">
      <RootStyles />
      <HeroSection />
      <WhoSection />
      <ForYouSection />
      <InstructorSection />
      <ProgramSection />
      <AwaitsSection />
      <StudyFlowSection />
      <SalaryAndJobHelpSection />
      <JobHelpBand />
      <PartnersSection />
      <InstallmentSection />
      <CTASection />
      <FooterCard/>
    </main>
  );
}
