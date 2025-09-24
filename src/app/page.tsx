'use client';

import React from 'react';
import Link from 'next/link';
import http from '@/lib/http';
import { mediaUrl } from '@/lib/media';
import FooterCard from '@/components/FooterCard';
import { ProgramsRibbon, CourseItem } from '@/components/ProgramsRibbon';
import { Tile } from '@/components/Tile';
import { FixedImg } from '@/components/FixedImg';
import { Abs } from '@/components/Abs';
import { Text } from '@/components/Text';

/* =========================
   Головна сторінка
========================= */
export default function HomePage() {
  const [courses, setCourses] = React.useState<CourseItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const r = await http.get('/courses/', {
          params: { page_size: 6, ordering: '-created_at' },
          signal: controller.signal as any,
        });
        const arr = Array.isArray(r.data?.results) ? r.data.results : r.data;
        const normalized: CourseItem[] = (arr || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          image: c.image ? mediaUrl(c.image) : null,
          description: c.description,
        }));
        if (!cancelled) setCourses(normalized);
      } catch {
        if (!cancelled) setCourses([]);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <main
      className="min-h-screen bg-top bg-no-repeat bg-cover"
      style={{ backgroundImage: 'url("/images/back.png")' }}
    >
      {/* HERO */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-[480px_600px] gap-6 md:gap-8 items-start">
          {/* Ліва колонка */}
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl sm:text-5xl md:text-[96px] font-[Afacad] font-bold text-[#021C4E] leading-snug">
              Brainboost
            </h1>
            <p className="text-base sm:text-lg md:text-[24px] font-[Mulish] font-medium text-black">
              Простір для тих, хто хоче увійти в ІТ або прокачати свої навички.
            </p>
            <Link
              href="/courses"
              className="mt-4 w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-3 bg-[#1345DE] text-white font-[Mulish] font-semibold text-sm sm:text-base md:text-[14px] rounded-lg text-center"
            >
              Хочу вчитись в Brainboost
            </Link>

            {/* Аватари та відгуки */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 sm:mt-6">
              <div className="flex -space-x-3">
                <FixedImg src="/images/ava1.png" style={{ width: 40, height: 40, borderRadius: '50%' }} alt="" />
                <FixedImg src="/images/ava2.png" style={{ width: 40, height: 40, borderRadius: '50%' }} alt="" />
                <FixedImg src="/images/ava3.png" style={{ width: 40, height: 40, borderRadius: '50%' }} alt="" />
              </div>
              <div className="mt-2 sm:mt-0">
                <div className="font-[Mulish] font-bold text-base sm:text-lg md:text-[24px] text-black">
                  2000+ Задоволенних
                </div>
                <div className="font-[Mulish] font-bold text-base sm:text-lg md:text-[24px] text-black">
                  відгуків від учнів
                </div>
              </div>
            </div>
          </div>

          {/* Права колонка — плитки */}
          <div className="w-full md:w-auto">
            <div className="flex md:grid md:grid-cols-[308px_239px] md:grid-rows-[227px_227px] md:gap-4 gap-4 overflow-x-auto md:overflow-visible">
              {["hero-1", "hero-2", "hero-3", "hero-4"].map((src) => (
                <Tile key={src} src={`/images/${src}.png`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Навігація категорій */}
      <nav className="max-w-[1120px] mx-auto mt-6 px-4 sm:px-6">
        <ul className="flex flex-wrap justify-between gap-2">
          {[
            { label: "Всі курси", cat: "" },
            { label: "Маркетинг", cat: "Маркетинг" },
            { label: "Дизайн", cat: "Дизайн" },
            { label: "Бізнес", cat: "Бізнес" },
            { label: "IT", cat: "IT" },
            { label: "Фінанси", cat: "Фінанси" },
          ].map(({ label, cat }) => (
            <li key={label} className="flex-1 min-w-[120px] text-center">
              <Link
                href={cat ? `/courses?category=${encodeURIComponent(cat)}` : "/courses"}
                className="inline-block w-full font-[Mulish] font-bold text-lg sm:text-xl text-black py-2"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Центрований блок тексту */}
      <section className="max-w-[1320px] mx-auto mt-6 px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-[48px] font-[Mulish] font-bold text-black leading-snug">
          Наші програми навчання
        </h2>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-[26px] font-[Mulish] font-medium text-black max-w-[980px] mx-auto">
          Світ змінюється — і ми разом із ним. Ми створюємо навчальні програми, які відповідають реальним потребам ринку, щоб люди могли здобути професію майбутнього й заробляти онлайн звідусіль. <strong>Наша мета</strong> — відкрити двері до свободи та фінансової незалежності для десятків тисяч людей.
        </p>
      </section>

      {/* Карусель програм*/}
      <section className="max-w-[1320px] mx-auto mt-6 px-4 sm:px-6 relative">
        <ProgramsRibbon courses={courses} />
      </section>

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
        <EventsBlock events={events} />
      </div>

      {/* Лічильник + телефон + відгуки */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-12">
        <BigCounterBlock />
      </div>

      {/* StoriesRibbon */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-24 relative">
        {/* Використовуємо y=0 та x=0, оскільки padding і margin вирівнюють компонент */}
        <StoriesRibbon y={0} x={0} />
      </div>

      {/* StatsAndPartners */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-24 relative">
        <StatsAndPartners />
      </div>

      <div className="mt-24 relative">
        {/* Використовуємо y=0 та x=0, оскільки блок сам по собі адаптивний */}
        <PickCourseCTA />
      </div>

      <FooterCard />
      <style jsx global>{GLOBAL_CSS}</style>
    </main>
  );
}

const av: React.CSSProperties = { width: 70, height: 70, borderRadius: '50%', display: 'block' };

type Tag = { text: string; filled?: boolean };

type EventItem = {
  date: string;
  cityTime: string;
  online: string;
  title: string;
  desc: string;
  tags: Tag[];
  avatar: string;
};

const events: EventItem[] = [
  {
    date: "Завтра",
    cityTime: "Київ, 16:00",
    online: "Онлайн участь",
    title: "Товарний бізнес 2025: як продавати на Prom, Rozetka, AliExpress, eBay",
    desc: "Ознайомтесь із практичними стратегіями продажів на популярних маркетплейсах та дізнайтесь, як збільшити прибуток і масштабувати свій бізнес.",
    tags: [{ text: 'Digital Marketing' }, { text: 'Business' }, { text: 'Вебінар', filled: true }],
    avatar: "/images/events-01.png",
  },
  {
    date: "10 серпня",
    cityTime: "Суми, 19:00",
    online: "Онлайн участь",
    title: "Мапа Онлайн-Бізнесу",
    desc: "Крок за кроком розберіться, як створити власний онлайн-бізнес, вибрати нішу та застосувати ефективні digital-інструменти для просування.",
    tags: [{ text: 'Digital Marketing' }, { text: 'Онлайн курс', filled: true }],
    avatar: "/images/events-02.jpg",
  },
  {
    date: "12 серпня",
    cityTime: "Львів, 17:00",
    online: "Онлайн участь",
    title: "Метод",
    desc: "Вивчіть перевірені техніки підвищення продуктивності, тайм-менеджменту та організації робочих процесів для досягнення максимальних результатів.",
    tags: [{ text: 'Business' }, { text: 'Онлайн курс', filled: true }],
    avatar: "/images/events-03.png",
  },
  {
    date: "15 серпня",
    cityTime: "Харків, 20:00",
    online: "Онлайн участь",
    title: "AI у бізнесі та повсякденній роботі: від створення креативів до автоматизації роботи відділу продажів",
    desc: "Дізнайтеся, як штучний інтелект допомагає автоматизувати бізнес-процеси, генерувати креативні ідеї і підвищувати ефективність команд.",
    tags: [{ text: 'Digital Marketing' }, { text: 'Вебінар', filled: true }],
    avatar: "/images/events-04.png",
  },
  {
    date: "20 серпня",
    cityTime: "Херсон, 21:00",
    online: "Онлайн участь",
    title: "Українська візуальна айдентика: як працювати з культурним кодом",
    desc: "Ознайомтесь з принципами створення дизайну, який відображає українську культурну спадщину і допомагає брендам стати впізнаваними.",
    tags: [{ text: 'Design' }, { text: 'Вебінар', filled: true }],
    avatar: "/images/events-05.png",
  },
  {
    date: "22 серпня",
    cityTime: "Київ, 20:00",
    online: "Онлайн участь",
    title: "Чому тестувальник ПЗ — професія майбутнього (і вже сьогодення)",
    desc: "Розкриємо перспективи та основні навички тестувальника програмного забезпечення, а також чому ця спеціальність є затребуваною на ринку праці.",
    tags: [{ text: 'IT' }, { text: 'Вебінар', filled: true }],
    avatar: "/images/events-06.png",
  },
  {
    date: "Сьогодні",
    cityTime: "Харків, 15:00",
    online: "Онлайн участь",
    title: "Як почати професію інтернет-маркетолога",
    desc: "Отримайте базові знання та практичні навички для старту кар’єри в digital marketing, включно з SEO, контекстною рекламою та аналітикою.",
    tags: [{ text: 'Digital Marketing' }, { text: 'Онлайн курс', filled: true }],
    avatar: "/images/events-07.png",
  },
  {
    date: "Сьогодні",
    cityTime: "Львів, 15:00",
    online: "Онлайн участь",
    title: "Як почати професію SMM спеціаліста",
    desc: "Дізнайтесь, як ефективно просувати бренди в соціальних мережах та залучати цільову аудиторію через різноманітні платформи.",
    tags: [{ text: 'SMM' }, { text: 'Онлайн курс', filled: true }],
    avatar: "/images/events-08.png",
  },
  {
    date: "Завтра",
    cityTime: "Київ, 13:00",
    online: "Онлайн участь",
    title: "Як стати графічним дизайнером та заробляти від $3000 на місяць",
    desc: "Вивчіть основи графічного дизайну, роботу з популярними програмами та способи побудови успішної кар’єри з високим доходом.",
    tags: [{ text: 'Design' }, { text: 'Вебінар', filled: true }],
    avatar: "/images/events-09.png",
  },
];

function EventsBlock({ events }: { events: EventItem[] }) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const BOTTOM_DIVIDER_OFFSET = isMobile ? 24 : 40;

  const clampStyle: React.CSSProperties = {
    width: '100%',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical' as any,
    WebkitLineClamp: 2,
    overflow: 'hidden',
  };

  const VLine = ({ h = 24, opacity = 0.7 }: { h?: number; opacity?: number }) => (
    <span style={{ display: 'inline-block', width: 1, height: h, background: `rgba(0,0,0,${opacity})` }} />
  );

  const Hr = () => (
    <div style={{ width: '100%', borderTop: '2px solid rgba(130,161,255,0.6)', margin: '40px 0' }} />
  );

  return (
    <div style={{ marginTop: 40, marginBottom: 60, maxWidth: 1320, marginLeft: 'auto', marginRight: 'auto' }}>
      {/* Заголовок всіх подій */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
        <Text
          text="Найближчі заходи"
          fz={isMobile ? 24 : 36}
          lh={isMobile ? 32 : 48}
          fw={700}
          color="#000"
          family="Afacad, system-ui"
        />
      </div>

      {events.map((event, index) => (
        <div key={index} style={{ marginBottom: 60 }}>
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center' }}>
                <Text text={event.date} fz={20} lh={28} fw={700} color="#1345DE" family="Afacad, system-ui" />
                <Text text={event.cityTime} fz={16} lh={22} fw={600} color="#000" />
                <Text text={event.online} fz={14} lh={20} fw={400} color="#000" />
              </div>
              <div style={clampStyle}>
                <Text text={event.title} fz={18} lh={24} fw={700} color="#000" />
              </div>
              <Text text={event.desc} fz={14} lh={20} fw={600} color="#000" />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {event.tags.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      height: 36,
                      padding: '0 16px',
                      borderRadius: 10,
                      border: t.filled ? 'none' : '2px solid #1345DE',
                      background: t.filled ? '#1345DE' : '#82A1FF',
                      display: 'flex',
                      alignItems: 'center',
                      fontFamily: 'Mulish',
                      fontWeight: 600,
                      fontSize: 14,
                      lineHeight: '24px',
                      color: t.filled ? '#fff' : '#000',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.text}
                  </div>
                ))}
              </div>
              <div
                style={{
                  width: 148,
                  height: 148,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#D9D9D9',
                  margin: '16px auto',
                }}
              >
                <FixedImg src={event.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <Link
                href="/events"
                style={{
                  display: 'block',
                  width: 192,
                  height: 53,
                  borderRadius: 10,
                  background: '#1345DE',
                  color: '#fff',
                  textDecoration: 'none',
                  fontFamily: 'Mulish',
                  fontWeight: 600,
                  fontSize: 16,
                  lineHeight: '53px',
                  textAlign: 'center',
                  margin: '0 auto',
                }}
              >
                Детальніше
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Text text={event.date} fz={32} lh={43} fw={700} color="#1345DE" family="Afacad, system-ui" />
                  <VLine h={32} />
                  <Text text={event.cityTime} fz={24} lh={30} fw={600} color="#000" />
                  <VLine h={24} />
                  <Text text={event.online} fz={20} lh={30} fw={400} color="#000" />
                </div>
                <div style={{ marginTop: 16, ...clampStyle }}>
                  <Text text={event.title} fz={24} lh={30} fw={700} color="#000" />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text text={event.desc} fz={20} lh={30} fw={600} color="#000" width={600} />
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                  {event.tags.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        height: 36,
                        padding: '0 16px',
                        borderRadius: 10,
                        border: t.filled ? 'none' : '2px solid #1345DE',
                        background: t.filled ? '#1345DE' : '#82A1FF',
                        display: 'flex',
                        alignItems: 'center',
                        fontFamily: 'Mulish',
                        fontWeight: 600,
                        fontSize: 14,
                        lineHeight: '24px',
                        color: t.filled ? '#fff' : '#000',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.text}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: 148, height: 148, borderRadius: '50%', overflow: 'hidden' }}>
                <FixedImg src={event.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <Link
                href="/events"
                style={{
                  display: 'block',
                  width: 192,
                  height: 53,
                  borderRadius: 10,
                  background: '#1345DE',
                  color: '#fff',
                  textDecoration: 'none',
                  fontFamily: 'Mulish',
                  fontWeight: 600,
                  fontSize: 20,
                  lineHeight: '53px',
                  textAlign: 'center',
                  alignSelf: 'center',
                }}
              >
                Детальніше
              </Link>
            </div>
          )}
          <Hr />
        </div>
      ))}
    </div>
  );
}

/* =========================
   Лічильник + телефон/відгуки
========================= */
function BigCounterBlock() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Стилі адаптивні
  const counterSize = isMobile ? 120 : 182;
  const counterFont = isMobile ? 64 : 96;
  const counterLineHeight = isMobile ? 80 : 120;

  const titleFont = isMobile ? 24 : 36;
  const titleLineHeight = isMobile ? 30 : 45;

  const descFont = isMobile ? 16 : 24;
  const descLineHeight = isMobile ? 22 : 30;

  const reviewFontUser = isMobile ? 20 : 36;
  const reviewFontText = isMobile ? 16 : 20;

  const reviewGap = isMobile ? 16 : 24;

  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center gap-12">
      {/* Круг з emoji */}
      <div
        style={{
          width: counterSize,
          height: counterSize,
          borderRadius: '50%',
          background: '#b5c7fa',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(19,69,222,.25)',
          overflow: 'hidden',
        }}
      >
        <FixedImg
          src="/images/people-burst.png"
          alt=""
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.2, objectFit: 'cover' }}
        />
        <FixedImg
          src="/images/emoji-surprised.png"
          alt="emoji"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, padding: 24, objectFit: 'contain' }}
        />
      </div>

      {/* Лічильник */}
      <Text
        text="200.000+"
        fz={counterFont}
        lh={counterLineHeight}
        fw={700}
        color="#021C4E"
        width="auto"
        height={counterLineHeight}
        align="center"
      />

      {/* Підпис */}
      <Text
        text="людей вже з BrainBoost"
        fz={titleFont}
        lh={titleLineHeight}
        fw={700}
        color="#000"
        width="100%"
        height={titleLineHeight}
        align="center"
      />

      {/* Опис */}
      <Text
        text="Приєднуйтесь до BrainBoost! Опануйте нову професію, заробляйте з перших тижнів, розвивайтеся та надихайте інших."
        fz={descFont}
        lh={descLineHeight}
        fw={500}
        color="#000"
        width="100%"
        height={descLineHeight * 3}
        align="center"
      />

      {/* Телефон */}
      <div style={{ width: isMobile ? 200 : 532, height: isMobile ? 156 : 413 }}>
        <FixedImg src="/images/phone.png" alt="phone" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>

      {/* Відгуки */}
      <div className="flex flex-col items-center gap-6 w-full">
        {[
          { user: '@Anastasia', text: 'UI/UX курс допоміг змінити професію. Тепер працюю фрілансеркою з дому.' },
          { user: '@Katya', text: 'Курс з тестування — супер! Отримала базу, пройшла співбесіду й знайшла роботу.' },
          { user: '@Vlad', text: 'Дуже доступне пояснення! З нуля вивчив HTML і CSS, вже створюю власні проєкти.' },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              width: isMobile ? '90%' : 736,
              borderRadius: 10,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.6) 42.24%, rgba(10,37,120,0.6) 98.51%)',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              padding: '16px',
              gap: reviewGap,
            }}
          >
            <div style={{ fontFamily: 'Mulish', fontWeight: 700, fontSize: reviewFontUser, lineHeight: '1.25', color: '#000' }}>
              {b.user}
            </div>
            <div style={{ fontFamily: 'Mulish', fontWeight: 500, fontSize: reviewFontText, lineHeight: '1.25', color: '#000' }}>
              {b.text}
            </div>
          </div>
        ))}
      </div>

      {/* Кнопка "Дивитись всі відгуки" */}
      <Link
        href="/reviews"
        className="inline-block mt-8 px-6 py-3 rounded-lg bg-gradient-to-r from-[#1345DE] to-[#0A2578] text-white font-[Mulish] font-bold text-lg text-center shadow-md"
      >
        Дивитись всі відгуки
      </Link>
    </section>
  );
}

/* =========================
   Стрічка «Історії»
========================= */
function StoriesRibbon({ y, x }: { y: number; x: number }) {
  const CARD_W_DESKTOP = 616;
  const CARD_H_DESKTOP = 440;
  const CARD_W_MOBILE = 280;
  const CARD_H_MOBILE = 200;
  const GAP_DESKTOP = 24;
  const GAP_MOBILE = 16;
  const VISIBLE_DESKTOP = 2;
  const VISIBLE_MOBILE = 1;

  type StoryItem = { id: number; title: string; cover: string | null };
  const [items, setItems] = React.useState<StoryItem[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/stories/?limit=6');
        const data = await res.json();
        const raw = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        const normalized: StoryItem[] = raw.map((s: any) => ({
          id: Number(s.id),
          title: String(s.title || ''),
          cover: s.cover || null,
        }));
        if (!cancelled) setItems(normalized);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const CARD_W = isMobile ? CARD_W_MOBILE : CARD_W_DESKTOP;
  const CARD_H = isMobile ? CARD_H_MOBILE : CARD_H_DESKTOP;
  const GAP = isMobile ? GAP_MOBILE : GAP_DESKTOP;
  const VISIBLE = isMobile ? VISIBLE_MOBILE : VISIBLE_DESKTOP;

  const maxIdx = Math.max(0, items.length - VISIBLE);
  const clamp = (n: number) => Math.max(0, Math.min(n, maxIdx));
  const prev = () => setIdx((n) => clamp(n - 1));
  const next = () => setIdx((n) => clamp(n + 1));

  React.useEffect(() => {
    if (items.length === 0) return;
    const t = window.setInterval(() => setIdx((n) => (n >= maxIdx ? 0 : n + 1)), 5000);
    return () => window.clearInterval(t);
  }, [items.length, maxIdx]);

  const pageCount = maxIdx + 1;

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden', margin: '0 auto', padding: isMobile ? '0 16px' : '0 0' }}>
      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontFamily: 'Afacad, system-ui', fontWeight: 800, fontSize: isMobile ? 24 : 40, lineHeight: isMobile ? '32px' : '52px', color: '#0A2578', marginBottom: 8 }}>
          Неймовірні історії наших студентів
        </div>
        <div style={{ fontFamily: 'Mulish, system-ui', fontWeight: 500, fontSize: isMobile ? 14 : 22, lineHeight: isMobile ? '20px' : '32px', color: '#1B1B1B', opacity: 0.9, maxWidth: 780, margin: '0 auto' }}>
          Дізнайтесь як змінилося життя учнів BrainBoost після проходження курсів
        </div>
        <div style={{ width: 96, height: 4, borderRadius: 9999, background: 'linear-gradient(90deg,#1345DE,#82A1FF)', margin: '8px auto 0' }} />
      </div>

      {items.length === 0 ? (
        <div style={{
          width: '100%',
          height: isMobile ? 120 : 140,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 14,
          background: 'rgba(130,161,255,.15)',
          color: '#0A2578',
          fontFamily: 'Mulish',
          fontWeight: 700,
        }}>
          Наразі немає доступних історій
        </div>
      ) : (
        <div style={{ position: 'relative', height: CARD_H + 20 }}>
          <div style={{ overflow: 'hidden', borderRadius: 20 }}>
            <div
              style={{
                display: 'flex',
                gap: GAP,
                width: items.length * (CARD_W + GAP),
                transform: `translateX(${-(CARD_W + GAP) * idx}px)`,
                transition: 'transform 600ms cubic-bezier(.22,.8,.22,1)',
                willChange: 'transform',
                paddingBottom: 2,
              }}
            >
              {items.map((it) => (
                <div key={it.id} style={{ position: 'relative', width: CARD_W, height: CARD_H, borderRadius: 20, overflow: 'hidden', flex: '0 0 auto' }}>
                  <FixedImg src={it.cover || '/images/placeholder.png'} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,37,120,0) 40%, rgba(10,37,120,.55) 100%)' }} />
                  <div style={{ position: 'absolute', left: 16, top: 16, padding: '4px 8px', borderRadius: 34, border: '1px solid #fff', color: '#fff', fontFamily: 'Mulish', fontSize: 12 }}>
                    Історії
                  </div>
                  <div style={{ position: 'absolute', left: 16, bottom: 48, width: CARD_W - 32, color: '#fff', fontFamily: 'Mulish', fontWeight: 700, fontSize: isMobile ? 14 : 20, lineHeight: '25px', textShadow: '0 2px 8px rgba(0,0,0,.35)' }}>
                    {it.title}
                  </div>
                  <Link href={`/stories/${it.id}`} style={{
                    position: 'absolute',
                    left: 16,
                    bottom: 16,
                    width: 120,
                    height: 32,
                    borderRadius: 34,
                    background: '#82A1FF',
                    color: '#fff',
                    fontFamily: 'Mulish',
                    fontWeight: 600,
                    fontSize: isMobile ? 12 : 14,
                    lineHeight: isMobile ? '32px' : '36px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    boxShadow: '0 8px 20px rgba(130,161,255,.35)',
                  }}>
                    Читати історію
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Кнопки навігації */}
          {!isMobile && (
            <>
              <button onClick={prev} aria-label="Попередні" style={{
                position: 'absolute', left: -60, top: CARD_H / 2 - 24,
                width: 44, height: 44, borderRadius: '50%', border: 0,
                background: 'linear-gradient(135deg,#1345DE,#0A2578)', color: '#fff',
                boxShadow: '0 10px 20px rgba(19,69,222,.35)', cursor: 'pointer'
              }}>‹</button>
              <button onClick={next} aria-label="Наступні" style={{
                position: 'absolute', right: -60, top: CARD_H / 2 - 24,
                width: 44, height: 44, borderRadius: '50%', border: 0,
                background: 'linear-gradient(135deg,#1345DE,#0A2578)', color: '#fff',
                boxShadow: '0 10px 20px rgba(19,69,222,.35)', cursor: 'pointer'
              }}>›</button>
            </>
          )}

          {/* Дот-індикатори */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: -28, display: 'flex', gap: 8, justifyContent: 'center' }}>
            {Array.from({ length: pageCount }).map((_, p) => (
              <div key={p} className={`carousel-dot ${p === idx ? 'active' : ''}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Статистика + партнери
========================= */
function StatsAndPartners() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 1024); // <=1024 для мобільних та планшетів
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const statsWidth = 1040;
  const partnerData = [
    { src: '/images/partner-01.png' },
    { src: '/images/partner-02.png' },
    { src: '/images/partner-03.png' },
    { src: '/images/partner-04.png' },
    { src: '/images/partner-05.png' },
    { src: '/images/img6.png' },
    { src: '/images/partner-07.png' },
    { src: '/images/partner-08.png' },
  ];

  return (
    <div className="w-full flex flex-col items-center mt-24">
      {/* Статистика */}
      <div className={`w-full max-w-[${statsWidth}px]`}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 md:gap-24 items-start">
          <div>
            <div className="flex items-baseline gap-4 md:gap-14">
              <div className="text-[#0A2578] font-[Afacad] font-bold text-3xl md:text-5xl">60.000+</div>
              <div className="text-black font-[Mulish] font-bold text-xl md:text-3xl">Випускників з усього світу</div>
            </div>
            <div className="mt-2 md:mt-6 text-[#0A2578] font-[Afacad] font-bold text-4xl md:text-[56px] leading-tight">BrainBoost</div>
          </div>
          <div className="flex justify-center md:justify-start">
            <FixedImg src="/images/memoji.png" alt="emoji" style={{ width: isMobile ? 120 : 200, height: isMobile ? 120 : 200, objectFit: 'contain' }} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 md:gap-x-20 md:gap-y-7">
          <div>
            <div className="text-black font-[Afacad] font-bold text-2xl md:text-[38px]">92 країни</div>
            <div className="mt-1 text-black font-[Mulish] text-base md:text-[26px] leading-tight">Навчаються в BrainBoost</div>
          </div>
          <div>
            <div className="text-black font-[Afacad] font-bold text-2xl md:text-[38px]">500K люд.</div>
            <div className="mt-1 text-black font-[Mulish] text-base md:text-[26px] leading-tight">
              Дистанційно використовують знання
              <br />
              Genius.Space
            </div>
          </div>
          <div>
            <div className="text-black font-[Afacad] font-bold text-2xl md:text-[38px]">102 512 люд.</div>
            <div className="mt-1 text-black font-[Mulish] text-base md:text-[26px] leading-tight">Пройшли платні навчальні курси</div>
          </div>
          <div>
            <div className="text-black font-[Afacad] font-bold text-2xl md:text-[38px]">35 381 людей</div>
            <div className="mt-1 text-black font-[Mulish] text-base md:text-[26px] leading-tight">Відвідали наші офлайн івенти</div>
          </div>
        </div>
      </div>

      {/* Партнери */}
      <div className={`w-full max-w-[${statsWidth}px] mt-20 grid grid-cols-4 grid-rows-2 gap-x-10 gap-y-10`}>
        {partnerData.map((p, i) => (
          <FixedImg
            key={i}
            src={p.src}
            alt={`partner-${i}`}
            style={{ width: '100%', height: isMobile ? 60 : 100, objectFit: 'contain' }}
          />
        ))}
      </div>
    </div>
  );
}

/* =========================
   CTA «Підберемо курс»
========================= */
function PickCourseCTA() {
  const [form, setForm] = React.useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatus(null);
    if (!form.name.trim() || (!form.email.trim() && !form.phone.trim())) {
      setStatus({ type: 'error', message: 'Вкажіть імʼя та щонайменше email або телефон.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/contacts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          topic: 'Підбір курсу (CTA, головна сторінка)',
          phone: form.phone,
          message: 'Заявка з блоку "Підберемо курс" на головній',
        }),
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'Дякуємо! Ми зв’яжемось із вами найближчим часом.' });
        setForm({ name: '', email: '', phone: '' });
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus({ type: 'error', message: 'Помилка відправки: ' + ((data as any)?.error || res.status) });
      }
    } catch {
      setStatus({ type: 'error', message: 'Помилка з’єднання з сервером.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center mt-24 px-4 sm:px-6">
      <div className="bg-[#82A1FF] rounded-[30px] shadow-[-9px_9px_10px_rgba(0,0,0,0.25),9px_-9px_10px_rgba(0,0,0,0.25)] max-w-[1100px] w-full p-8 md:p-12">
        
        {/* Дві колонки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          
          {/* Ліва частина (заголовок + опис) */}
          <div className="text-left">
            <h2 className="text-[36px] md:text-[44px] font-bold leading-[48px] text-white">
              Підберемо <br /> Курс для Вас
            </h2>
            <p className="mt-6 text-[20px] md:text-[22px] font-bold leading-[28px]">
              <span className="text-[#0A2578]">Важко визначитись із вибором?</span>
              <br />
              <span className="text-white font-medium">
                Ми допоможемо! Просто залиште свій номер, і наш менеджер проконсультує вас з будь-яких питань.
              </span>
            </p>
          </div>

          {/* Права частина (форма) */}
          <form onSubmit={handleSubmit} className="flex flex-col items-center md:items-start gap-6">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Імʼя"
              required
              className="w-full md:w-[420px] h-[60px] px-5 rounded-[10px] border border-transparent focus:border-[#1345DE] outline-none text-[20px] font-[Mulish] bg-white text-black placeholder-black"
            />
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full md:w-[420px] h-[60px] px-5 rounded-[10px] border border-transparent focus:border-[#1345DE] outline-none text-[20px] font-[Mulish] bg-white text-black placeholder-black"
            />
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="Телефон"
              className="w-full md:w-[420px] h-[60px] px-5 rounded-[10px] border border-transparent focus:border-[#1345DE] outline-none text-[20px] font-[Mulish] bg-white text-black placeholder-black"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-[420px] h-[73px] border-[3px] border-[#1345DE] rounded-[10px] bg-white text-[#1345DE] font-bold text-[18px] hover:opacity-90 transition"
            >
              {loading ? 'Надсилаю…' : 'Надіслати заявку'}
            </button>

            {status && (
              <div
                className={`w-full md:w-[420px] p-3 rounded-lg text-sm ${
                  status.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {status.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Глобальний CSS (оновлено)
========================= */
const GLOBAL_CSS = `
/* базові дрібниці */
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }

.program-card-link { text-decoration: none; color: inherit; display: block; }

/* картка в каруселі курсів */
.program-card {
  position: relative;
  width: 308px; height: 260px;
  border-radius: 12px; overflow: hidden; background: #d9d9d9;
  box-shadow: 0 4px 14px rgba(10, 37, 120, 0.08);
  transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s;
  will-change: transform;
}
.program-card.is-active { transform: translateY(-4px) scale(1.03); box-shadow: 0 16px 36px rgba(10, 37, 120, 0.18); }
.program-img { transition: transform .6s cubic-bezier(.19,1,.22,1); will-change: transform; }
.program-card:hover .program-img, .program-card.is-active .program-img { transform: scale(1.06); }

.carousel-btn {
  width: 44px; height: 44px; border-radius: 9999px;
  background: #1345DE; color: #fff; border: none; cursor: pointer;
  display: grid; place-items: center;
  box-shadow: 0 6px 16px rgba(19,69,222,.28);
}
.carousel-btn .chev{ font-size: 26px; line-height: 1; }

.dot{ width: 7px; height: 7px; border-radius: 9999px; background: rgba(19,69,222,.25); cursor: pointer; transition: transform .2s, background-color .2s; }
.dot--active{ background: #1345DE; transform: scale(1.25); }

/* Історії */
.story-card { transition: transform .25s ease; will-change: transform; }
.story-card:hover { transform: translateY(-4px); }
.carousel-dot { width: 7px; height: 7px; border-radius: 9999px; background: rgba(19,69,222,.25); transition: transform .2s, background-color .2s; }
.carousel-dot.active { background: #1345DE; transform: scale(1.25); }

/* ==== Site footer ==== */
.site-footer{
  margin-top: 48px;
  background: #021C4E;
  color: #fff;
}
.sf-wrap{
  max-width: 1120px;
  margin: 0 auto;
  padding: 28px 16px 20px;
}
.sf-top{
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 28px;
  align-items: start;
}
.sf-brand .sf-logo{
  font-family: Afacad, system-ui, sans-serif;
  font-weight: 800;
  font-size: clamp(24px, 3.6vw, 36px);
  line-height: 1.2;
}
.sf-addr{
  margin: 8px 0 16px;
  color: #E9EEFF;
  font: 500 16px/1.45 Mulish, system-ui, sans-serif;
}
.sf-actions{
  display: flex; gap: 10px; flex-wrap: wrap;
}
.sf-btn{
  display: inline-flex; align-items: center; justify-content: center;
  height: 44px; padding: 0 14px; border-radius: 10px; font-weight: 800;
  text-decoration: none; font-size: 13px;
}
.sf-btn--primary{ background:#1345DE; color:#fff; box-shadow:0 8px 18px rgba(19,69,222,.25); }
.sf-btn--ghost{ background:#E9EEFF; color:#1D3FDB; }

.sf-cols{
  display: grid;
  grid-template-columns: repeat(2, minmax(160px, 1fr));
  gap: 22px;
}
.sf-title{
  font: 800 16px/1.2 Mulish, system-ui, sans-serif;
  margin-bottom: 10px;
}
.sf-col ul{ list-style:none; margin:0; padding:0; display:grid; gap:8px; }
.sf-col a{ color:#fff; text-decoration:none; opacity:.95; font: 600 14px/1.4 Mulish, system-ui, sans-serif; }
.sf-col a:hover{ text-decoration:underline; }

.sf-bottom{
  border-top: 1px solid rgba(255,255,255,.12);
  margin-top: 22px; padding-top: 14px;
  display:flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
}
.sf-legal{ display:flex; align-items:center; gap: 8px; }
.sf-legal a{ color:#fff; text-decoration:none; opacity:.9; }
.sf-legal a:hover{ text-decoration:underline; }

/* ==== Адаптив HERO ==== */
@media (max-width: 920px){
  h1 { font-size: 64px !important; line-height: 84px !important; }
}
@media (max-width: 640px){
  h1 { font-size: 48px !important; line-height: 64px !important; }
}

/* ==== Авто-адаптив полотна з абсолютним позиціюванням ==== */
/* Одна формула масштабу: 1280 — логічна ширина */
:root { --canvas-scale: 1; }
@media (max-width: 1280px){
  :root { --canvas-scale: calc(100vw / 1280); }
}
.abs-canvas{
  transform-origin: top center;
  transform: scale(var(--canvas-scale));
  width: 1280px; /* важливо: ширина полотна залишається сталою */
  margin: 0 auto;
}

/* Менше анімацій при reduce motion */
@media (prefers-reduced-motion: reduce){
  .program-card, .program-img, .dot, .carousel-dot, .story-card { transition: none !important; }
}
`;

