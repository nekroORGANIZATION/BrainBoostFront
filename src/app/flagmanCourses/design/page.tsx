'use client';

import React, { useState, useEffect } from "react";
import FooterCard from '@/components/FooterCard';

// ===================== IMAGE CONSTANTS (replace with your files) =====================
const IMAGES = {
  hero: "/images/designphoto.png",
  who1: "/images/who1.png",
  who2: "/images/who2.png",
  who3: "/images/who3.png",
  who4: "/images/who4.png",
  who5: "/images/who5.png",
  who6: "/images/who6.png",
  mentor1: "/images/mentor1.png",
  mentor2: "/images/mentor2.png",
};

// --- Small inline icons (no external libs) ---
const IconStar = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="m12 2 2.955 6.249 6.884.62-5.15 4.49 1.56 6.84L12 16.97 5.75 20.2l1.56-6.84-5.15-4.49 6.884-.62L12 2z" />
  </svg>
);
const IconCalendar = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconArrowRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default function Page() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const chartData = [39, 52.5, 40]; // висоти стовпчиків пропорційно до зарплат
  const cities = [
    { city: "Вся Україна", salary: "39 000 грн", change: "+17%" },
    { city: "Київ", salary: "52 500 грн", change: "+33%" },
    { city: "Віддалено", salary: "40 000 грн", change: "+23%" },
  ];

  const maxHeight = Math.max(...chartData);

  return (
    <main className="min-h-dvh bg-[url('/images/back.png')] bg-top bg-cover text-slate-900">
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_10%_10%,rgba(67,97,238,0.15),transparent_60%),radial-gradient(50%_60%_at_90%_20%,rgba(67,97,238,0.12),transparent_60%)]" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 pb-14 pt-10 md:grid-cols-2 md:gap-12 sm:pt-16">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                <IconCalendar className="h-4 w-4" /> Старт після оплати
              </span>
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              Професія UX/UI<br />дизайнер з нуля до<br />професіонала
            </h1>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (<IconStar key={i} className="h-6 w-6" />))}
              </div>
            </div>
            <p className="mt-4 max-w-xl text-slate-600">
              Навчіться створювати сучасні інтерфейси та працюй на міжнародних проєктах з доходом від 2000 $/міс.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a href="#form" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">
                Записатися на курс <IconArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(40%_40%_at_70%_30%,rgba(67,97,238,0.20),transparent_60%)] blur" />
            <img className="mx-auto max-h-[360px] w-full max-w-[520px] object-contain" src={IMAGES.hero} alt="UI/UX illustration" />
          </div>
        </div>
      </section>

      {/* ===================== WHO THIS COURSE IS FOR (2 columns) ===================== */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight sm:mb-10 sm:text-3xl">Цей курс точно для вас, якщо ви:</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            { title: "Мрієте стати IT-фахівцем", text: "Хочеш заробляти від 2000 $ у дизайні, але не знаєш, з чого почати?", img: IMAGES.who1 },
            { title: "Бажаєте стати UX/UI дизайнером", text: "Хочеш розпочати, та не знаєш, як зупинити сумніви і зробити перший крок?", img: IMAGES.who2 },
            { title: "Мама у декреті", text: "Який шлях додаткового заробітку, який дозволяє поєднувати це із сімʼєю", img: IMAGES.who3 },
            { title: "Творча людина", text: "Освоїш перспективну професію, отримаєш корисну навичку дизайну і працюватимеш там, де любиш.", img: IMAGES.who4 },
            { title: "Офісний співробітник", text: "Втомився від рутини? Хочеш свободи, творчості та фінансового росту?", img: IMAGES.who5 },
            { title: "Студент", text: "Знайди себе і справу, в якій зможеш реалізувати свій потенціал та отримувати прибуток.", img: IMAGES.who6 },
          ].map((c) => (
            <div key={c.title} className="relative overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#2347F5_0%,#1D3FDB_100%)] p-5 text-white shadow-[0_16px_40px_rgba(29,63,219,0.3)] ring-1 ring-white/10">
              <div className="mb-2 text-base font-semibold leading-tight">{c.title}</div>
              <p className="max-w-[46ch] text-sm text-indigo-100">{c.text}</p>
              <img src={c.img} alt="" className="absolute -right-2 -bottom-2 h-32 w-32 opacity-90" />
            </div>
          ))}
        </div>
      </section>

      {/* ===================== MENTORS (EXACT 2 COLS) ===================== */}
        <section id="mentors" className="relative">
            {/* верхняя голубая плашка как на макете */}
            <div className="absolute inset-x-0 top-0 -z-10 h-[140px] bg-gradient-to-b from-indigo-200/60 to-transparent" />
            <div className="mx-auto max-w-7xl px-4 py-12">
                <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
                <span className="text-indigo-700">Хто </span>проводить навчання?
                </h2>
                <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">
                Якщо вчитися – то лише у найкращих! Ці люди – лідери на ринку web-дизайну – будуть передавати вам свій досвід та знання протягом 3 місяців!
                </p>

                {/* ровно 2 карточки в ряд */}
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {[
                    { name: "Юрій Лопішук", role: "UI Designer", img: IMAGES.mentor1 },
                    { name: "Тарас Мельник", role: "UX Designer", img: IMAGES.mentor2 },
                ].map((m) => (
                    <figure key={m.name} className="relative overflow-hidden rounded-[18px] shadow-sm ring-1 ring-black/5">
                    <img src={m.img} alt={m.name} className="h-72 w-full object-cover" />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-white text-left">
                        <div className="text-lg font-semibold">{m.name}</div>
                        <div className="text-sm text-white/80">{m.role}</div>
                    </figcaption>
                    </figure>
                ))}
                </div>
            </div>
        </section>

        {/* ===================== PROGRAM (LIST) ===================== */}
        <section id="program" className="mx-auto max-w-7xl px-4 py-12">
            <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
                Чому конкретно ви навчитеся
            </h2>
            <p className="mt-2 text-center text-slate-600">
                Дивіться повну програму курсу
            </p>
            <ol className="mx-auto mt-6 max-w-2xl space-y-4">
                {[
                "Хто такий UX/UI дизайнер",
                "Методології / Human centered design process. UX методології",
                "Збір даних від замовника",
                "Дослідницька стратегія",
                "Аналіз конкурентів",
                "Інтервʼю з користувачами",
                "Опитування",
                "Персонажі",
                "Мапа шляху користувача",
                "Інформаційна архітектура",
                "Інструменти дизайнера. Як змінювався софт",
                "Принципи роботи з Figma. Основи інтерфейсів. Організація макетів",
                "Елементи сайту. Стилі, сітки та автолейаути",
                "Прототипування",
                "Тестування інтерфейсів",
                "Референси та мудборди",
                ].map((item, idx) => (
                <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-slate-800"
                >
                    <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {idx + 1}
                    </span>
                    <span>{item}</span>
                </li>
                ))}
            </ol>
        </section>

      {/* ===================== BENEFITS ===================== */}
        <section className="mx-auto max-w-7xl px-4 py-12">
            <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
                Що чекає на вас на курсі <br className="hidden sm:block" />
                <span className="text-indigo-700">
                “Професія UX/UI дизайнер з нуля до професіонала”?
                </span>
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {[
                {
                    t: "Практичні домашні завдання",
                    d: "Ми зробили усе, щоб ви легко і ефективно освоїли нову професію та відчували навчання на практиці.",
                },
                {
                    t: "Викладачі-практики",
                    d: "Три місяці навчання з експертами, які знають, як подавати матеріал, співпрацюють з топовими компаніями.",
                },
                {
                    t: "Навчання у зручний для вас час",
                    d: "Ви самостійно формуєте графік і переглядаєте уроки будь-коли – платформа доступна 24/7.",
                },
                {
                    t: "Диплом",
                    d: "Диплом після курсу підтверджує ваші навички та підвищить шанси знайти роботу.",
                },
                {
                    t: "Можливість вчитися з нуля",
                    d: "Навчання підійде всім: від новачків до досвідчених дизайнерів. Процес максимально простий і практичний.",
                },
                {
                    t: "Персональний куратор",
                    d: "У вас буде постійно допомога менторів упродовж курсу: наставник відповідатиме на будь-які питання.",
                },
                {
                    t: "Дипломна робота для портфоліо",
                    d: "Створіть та захистіть свій перший проєкт перед кураторами — він одразу стане частиною вашого портфоліо.",
                },
                ].map((b, i) => (
                <div
                    key={i}
                    className="rounded-2xl bg-[linear-gradient(180deg,#2347F5_0%,#1D3FDB_100%)] p-6 text-white shadow-[0_16px_40px_rgba(29,63,219,0.3)]"
                >
                    <h3 className="text-base font-semibold">{b.t}</h3>
                    <p className="mt-2 text-sm text-indigo-100">{b.d}</p>
                </div>
                ))}
            </div>
        </section>

      {/* ===================== HOW IT WORKS (2 columns) ===================== */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">Як <span className="text-indigo-700">проходить</span> навчання?</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {[
            { t: "Теорія + практика", d: "Спочатку перегляд відеоуроків, потім виконання завдань за матеріалом уроку з готовими шаблонами для ефективного засвоєння." },
            { t: "Домашні завдання та тестування", d: "Протягом курсу спікери перевіряють ваші роботи, відповідають на всі запитання, а куратор супроводжує навчання, підтримує та мотивує." },
            { t: "Живі Q&A‑сесії", d: "Спікери проводять онлайн‑сесії «Питання‑Відповіді», де ви можете отримати розгорнуті відповіді на свої запитання в реальному часі." },
            { t: "Диплом", d: "Після завершення курсу ви проходите підсумкове тестування та отримуєте офіційний диплом, що підтверджує ваші навички професійного інтернет‑маркетолога." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="mt-1 inline-flex h-16 w-16 flex-none items-center justify-center rounded-full bg-indigo-200/60"><span className="text-2xl">{["🧩","❓","👥","📜"][i]}</span></div>
              <div>
                <h3 className="text-base font-semibold">{item.t}</h3>
                <p className="mt-2 text-sm text-slate-700">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== SALARY ===================== */}
      <section className="w-full py-12 flex flex-col items-center">
        <h2 className="text-5xl font-bold font-[Afacad] text-center mb-10">
          Скільки можна <span className="text-blue-600">заробляти</span>
        </h2>

        <div className="bg-white border border-black/30 rounded-2xl shadow-lg p-10 w-[800px] max-w-full flex flex-col gap-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-black/20 rounded-xl p-6 flex flex-col items-center justify-center">
              <p className="text-5xl font-bold font-[Mulish] text-black mb-3">
                43 833 грн
              </p>
              <p className="text-base font-medium font-[Mulish] text-black">
                Середня зарплатня
              </p>
            </div>

            <div className="border border-black/20 rounded-xl p-6 flex flex-col items-center">
              <p className="text-xl font-bold font-[Mulish] text-black mb-6">
                Розподіл зарплат
              </p>
              <div className="flex items-end h-[130px] w-full justify-between">
                {chartData.map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#82A1FF99] rounded-t-lg mx-[2px]"
                    style={{
                      height: animate ? `${(val / maxHeight) * 100}%` : "0%",
                      transition: `height 0.6s ease ${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between w-full mt-4 px-2">
                <span className="text-sm font-[Mulish] text-black">&lt; 30 000</span>
                <span className="text-sm font-[Mulish] text-black">50 000+</span>
              </div>
              <div className="flex justify-between w-full mt-2 px-2 text-sm font-[Mulish] text-black">
                <span>Вся Україна</span>
                <span>Київ</span>
                <span>Віддалено</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/20 p-6">
            <div className="grid grid-cols-3 text-center font-medium font-[Mulish] text-lg text-black mb-3">
              <p>Місто</p>
              <p>Зарплата</p>
              <p>Зміна за рік</p>
            </div>
            <hr className="border border-black/70 mb-4" />

            {cities.map((row, i) => (
              <div key={i}>
                <div className="grid grid-cols-3 text-center items-center py-3">
                  <p className="text-lg font-bold text-black">{row.city}</p>
                  <p className="text-lg font-bold text-black">{row.salary}</p>
                  <p className="text-lg font-medium text-green-600">{row.change}</p>
                </div>
                {i !== cities.length - 1 && <hr className="border border-black/30" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== JOB HELP ===================== */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 -z-10 h-[160px] bg-gradient-to-b from-indigo-200/60 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">Ми допомагаємо з працевлаштуванням</h2>
          <div className="mx-auto mt-8 max-w-4xl space-y-6">
            {[
              "Ви отримаєте заповнений диплом від BrainBoost, що збільшить ваші шанси на успішне працевлаштування.",
              "Кожен диплом оснащений QR‑кодом: роботодавець може швидко перевірити правдивість та ознайомитися з вашими основними навичками – портфоліо проєктів, пройдені гілки, набори навичок тощо.",
              "Усі учасники отримують доступ до закритого курсу з працевлаштування «BrainBoost Talent». Це навчання ефективного просування себе як фахівця: блог/портфоліо, підготовка до співбесіди, тестові завдання, пошук роботи на топових IT‑платформах.",
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-4 rounded-2xl bg-white/70 p-4 ring-1 ring-slate-200">
                <div className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{idx + 1}</div>
                <p className="text-sm text-slate-700">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PARTNERS ===================== */}
      <section className="w-full flex flex-col items-center py-20">
  {/* Заголовок */}
  <div className="text-center mb-20 px-4">
    <p className="font-[Afacad] font-bold text-[64px] leading-[100%] text-black">
      Наші навчальні
    </p>
    <p className="font-[Afacad] font-bold text-[64px] leading-[100%] text-[#82A1FF] mb-10">
      програми проходять
    </p>
    <p className="font-[Afacad] font-bold text-[23px] leading-[100%] text-black">
      власники, керівники та співробітники провідних компаній
    </p>
  </div>

  {/* Лого компаній */}
  <div className="grid grid-cols-4 gap-10 w-full max-w-5xl px-4 sm:px-0">
    {[
      "/images/partner-01.png",
      "/images/partner-02.png",
      "/images/partner-03.png",
      "/images/partner-04.png",
      "/images/partner-05.png",
      "/images/img6.png",
      "/images/partner-07.png",
      "/images/partner-08.png",
    ].map((src, i) => (
      <img
        key={i}
        src={src}
        alt={`partner-logo-${i + 1}`}
        className="w-full max-w-[200px] h-[120px] object-contain mx-auto"
      />
    ))}
  </div>
</section>


      {/* ===================== INSTALLMENT CTA ===================== */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-2xl bg-gradient-to-b from-white to-indigo-50 p-6 ring-1 ring-slate-200">
          <h3 className="text-center text-xl font-extrabold">Розстрочка без переплат від BrainBoost</h3>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">Гнучкі налаштування плюс зручна оплата частинами. Комфортний формат розстрочки: до 24 місяців.</p>
          <div className="mt-4 text-center"><a href="#form" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700">Як оплатити частинами? <IconArrowRight className="h-4 w-4" /></a></div>
        </div>
      </section>

      {/* ===================== FORM ===================== */}
      <section id="form" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_10%_10%,rgba(67,97,238,0.15),transparent_60%),radial-gradient(50%_60%_at_90%_80%,rgba(67,97,238,0.12),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 pb-14">
          <div className="mx-auto max-w-4xl border-t border-slate-200/80 pt-10">
            <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">Щоб забронювати ціну зі знижкою та підключитися до лімітованої групи, заповніть форму</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-lg font-bold">Старт практичного курсу UX/UI дизайнера до професіонала!</h3>
                <p className="mt-2 text-sm text-slate-600">Ми звʼяжемося з вами і підкажемо всі деталі. Підтвердимо знижку, розповімо про програму, терміни навчання, умови та оплату.</p>
              </div>
              <form className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="grid gap-4">
                  <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring" placeholder="Імʼя" />
                  <input type="email" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring" placeholder="Email" />
                  <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring" placeholder="Телефон" />
                  <button type="submit" className="mt-2 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700">Записатися на курс</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <FooterCard/>
    </main>
  );
}
