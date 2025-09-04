'use client';

import React from 'react';
import Link from 'next/link';
import http from '@/lib/http';
import { mediaUrl } from '@/lib/media';

/* =========================
   Утиліти
========================= */
function FixedImg({
  src,
  alt,
  style,
  className,
}: {
  src?: string;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [err, setErr] = React.useState(false);
  const s = src && !err ? src : '/images/placeholder.png';
  return (
    <img
      src={s}
      alt={alt || ''}
      style={style}
      className={className}
      onError={() => setErr(true)}
    />
  );
}

function Abs({
  x,
  y,
  children,
}: {
  x: number | string;
  y: number | string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x as any,
        top: y as any,
      }}
    >
      {children}
    </div>
  );
}

function Text({
  text,
  fz,
  lh,
  fw,
  color = '#000',
  width,
  height,
  align = 'left',
  family = 'Mulish, system-ui, sans-serif',
  shadow,
}: {
  text: string;
  fz: number;
  lh: number | string;
  fw: number;
  color?: string;
  width?: number | string;
  height?: number | string;
  align?: 'left' | 'center' | 'right';
  family?: string;
  shadow?: string;
}) {
  return (
    <div
      style={{
        fontFamily: family,
        fontWeight: fw,
        fontSize: fz,
        lineHeight: typeof lh === 'number' ? `${lh}px` : lh,
        color,
        width,
        height,
        textAlign: align,
        textShadow: shadow,
      }}
    >
      {text}
    </div>
  );
}

function Tile({ src }: { src: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: '1.4px solid #1345DE',
        borderRadius: 20,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <FixedImg
        src={src}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}

/* =========================
   Тип для курсів у каруселі
========================= */
type CourseItem = {
  id: number;
  title: string;
  image?: string | null;
  description?: string;
};

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
      style={{
        minHeight: '100vh',
        backgroundImage: 'url("/images/back.png")',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
      }}
    >
      {/* HERO */}
      <section
        style={{
          maxWidth: 1440,
          width: '100%',
          margin: '0 auto',
          padding: '159px 20px 0',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(280px,480px) minmax(300px,600px)',
            columnGap: 28,
            rowGap: 24,
            alignItems: 'start',
          }}
        >
          <div style={{ width: '100%', maxWidth: 480 }}>
            <h1
              style={{
                margin: 0,
                width: '100%',
                maxWidth: 460,
                fontFamily: 'Afacad, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: 96,
                lineHeight: '128px',
                color: '#021C4E',
              }}
            >
              Brainboost
            </h1>

            <p
              style={{
                marginTop: 207 - 81 - 128,
                width: '100%',
                maxWidth: 480,
                fontFamily: 'Mulish, system-ui, sans-serif',
                fontWeight: 500,
                fontSize: 24,
                lineHeight: '30px',
                color: '#000',
              }}
            >
              Простір для тих, хто хоче увійти в ІТ або прокачати свої навички.
            </p>

            <Link
              href="/courses"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 310 - 207 - 60,
                width: 258,
                height: 55,
                background: '#1345DE',
                color: '#fff',
                borderRadius: 10,
                fontFamily: 'Mulish, system-ui, sans-serif',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Хочу вчитись в Brainboost
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 400 - 292 - 55 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FixedImg src="/images/ava1.png" style={av} alt="" />
                <FixedImg src="/images/ava2.png" style={{ ...av, marginLeft: -25 }} alt="" />
                <FixedImg src="/images/ava3.png" style={{ ...av, marginLeft: -25 }} alt="" />
              </div>
              <div style={{ fontFamily: 'Mulish', color: '#000' }}>
                <div style={{ fontWeight: 700, fontSize: 24, lineHeight: '30px' }}>2000+ Задоволенних</div>
                <div style={{ fontWeight: 700, fontSize: 24, lineHeight: '30px' }}>відгуків від учнів</div>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: 600, height: 'auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(220px,308px) minmax(200px,239px)',
                gridAutoRows: '227px',
                columnGap: 17,
                rowGap: 19,
              }}
            >
              <Tile src="/images/hero-1.png" />
              <Tile src="/images/hero-2.png" />
              <Tile src="/images/hero-3.png" />
              <Tile src="/images/hero-4.png" />
            </div>
          </div>
        </div>

        {/* Навігація категорій */}
        <nav style={{ width: '100%', maxWidth: 1120, margin: '0 auto', marginTop: 595 - 159 - 227 }}>
          <ul
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 0,
              margin: 0,
              listStyle: 'none',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Всі курси', cat: '' },
              { label: 'Маркетинг', cat: 'Маркетинг' },
              { label: 'Дизайн', cat: 'Дизайн' },
              { label: 'Бізнес', cat: 'Бізнес' },
              { label: 'IT', cat: 'IT' },
              { label: 'Фінанси', cat: 'Фінанси' },
            ].map(({ label, cat }) => (
              <li key={label} style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
                <Link
                  href={cat ? `/courses?category=${encodeURIComponent(cat)}` : '/courses'}
                  style={{
                    display: 'inline-block',
                    width: '100%',
                    fontFamily: 'Mulish',
                    fontWeight: 700,
                    fontSize: 26,
                    lineHeight: '30px',
                    textDecoration: 'none',
                    color: '#000',
                    padding: '6px 0',
                  }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Центрований блок тексту */}
        <section
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            marginTop: 742 - 595,
            textAlign: 'center',
            padding: '0 20px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'Mulish, system-ui, sans-serif',
              fontWeight: 700,
              fontSize: 48,
              lineHeight: '56px',
              color: '#000',
            }}
          >
            Наші програми навчання
          </h2>

          <p
            style={{
              maxWidth: 980,
              margin: '20px auto 0',
              fontFamily: 'Mulish, system-ui, sans-serif',
              fontWeight: 500,
              fontSize: 26,
              lineHeight: '36px',
              color: '#000',
            }}
          >
            Світ змінюється — і ми разом із ним. Ми створюємо навчальні програми, які відповідають реальним потребам
            ринку, щоб люди могли здобути професію майбутнього й заробляти онлайн звідусіль. <strong>Наша мета</strong> — відкрити двері до свободи та фінансової незалежності для десятків тисяч людей.
          </p>
        </section>
      </section>

      {/* «Абсолютне» полотно — тепер авто-адаптив через масштаб */}
      <HomeContinuation courses={courses} />
      <FooterCard />

      <style jsx global>{GLOBAL_CSS}</style>
    </main>
  );
}

const av: React.CSSProperties = { width: 70, height: 70, borderRadius: '50%', display: 'block' };

/* =========================
   Продовження: абсолютні секції
========================= */
function HomeContinuation({ courses }: { courses: CourseItem[] }) {
  const CTA_TOP = 7750; // де починається CTA
  const CTA_H = 481;
  const CANVAS_H = CTA_TOP + CTA_H + 60;

  return (
    <section
      className="abs-canvas"
      style={{
        position: 'relative',
        width: 1280, // фіксована логічна ширина полотна
        height: CANVAS_H,
        margin: '0 auto',
      }}
    >
      <ProgramsRibbon x={114} y={60} courses={courses} />
      <CenteredButton y={360} text="Дивитися всі курси" href="/courses" />
      <CenteredHeading y={580} text="Найближчі заходи" />

      <EventsBlock
        y={790}
        date="Завтра"
        cityTime="Київ, 16:00"
        online="Онлайн участь"
        title="Товарний бізнес 2025: як продавати на Prom, Rozetka, AliExpress, eBay"
        desc="Ознайомтесь із практичними стратегіями продажів на популярних маркетплейсах та дізнайтесь, як збільшити прибуток і масштабувати свій бізнес."
        tags={[{ text: 'Digital Marketing' }, { text: 'Business' }, { text: 'Вебінар', filled: true }]}
        avatar="/images/events-01.png"
      />
      <EventsBlock
        y={1209}
        date="10 серпня"
        cityTime="Суми, 19:00"
        online="Онлайн участь"
        title="Мапа Онлайн-Бізнесу"
        desc="Крок за кроком розберіться, як створити власний онлайн-бізнес, вибрати нішу та застосувати ефективні digital-інструменти для просування."
        tags={[{ text: 'Digital Marketing' }, { text: 'Онлайн курс', filled: true }]}
        avatar="/images/events-02.jpg"
      />
      <EventsBlock
        y={1603}
        date="12 серпня,"
        cityTime="Львів, 17:00"
        online="Онлайн участь"
        title="Метод"
        desc="Вивчіть перевірені техніки підвищення продуктивності, тайм-менеджменту та організації робочих процесів для досягнення максимальних результатів."
        tags={[{ text: 'Business' }, { text: 'Онлайн курс', filled: true }]}
        avatar="/images/events-03.png"
      />
      <EventsBlock
        y={2007}
        date="15 серпня"
        cityTime="Харків, 20:00"
        online="Онлайн участь"
        title="AI у бізнесі та повсякденній роботі: від створення креативів до автоматизації роботи відділу продажів"
        desc="Дізнайтеся, як штучний інтелект допомагає автоматизувати бізнес-процеси, генерувати креативні ідеї і підвищувати ефективність команд."
        tags={[{ text: 'Digital Marketing' }, { text: 'Вебінар', filled: true }]}
        avatar="/images/events-04.png"
      />
      <EventsBlock
        y={2476}
        date="20 серпня,"
        cityTime="Херсон, 21:00"
        online="Онлайн участь"
        title="Українська візуальна айдентика: як працювати з культурним кодом"
        desc="Ознайомтесь з принципами створення дизайну, який відображає українську культурну спадщину і допомагає брендам стати впізнаваними."
        tags={[{ text: 'Design' }, { text: 'Вебінар', filled: true }]}
        avatar="/images/events-05.png"
      />
      <EventsBlock
        y={2900}
        date="22 серпня"
        cityTime="Київ, 20:00"
        online="Онлайн участь"
        title="Чому тестувальник ПЗ — професія майбутнього (і вже сьогодення)"
        desc="Розкриємо перспективи та основні навички тестувальника програмного забезпечення, а також чому ця спеціальність є затребуваною на ринку праці."
        tags={[{ text: 'IT' }, { text: 'Вебінар', filled: true }]}
        avatar="/images/events-06.png"
      />
      <EventsBlock
        y={3369}
        date="Сьогодні"
        cityTime="Харків, 15:00"
        online="Онлайн участь"
        title="Як почати професію інтернет-маркетолога"
        desc="Отримайте базові знання та практичні навички для старту кар’єри в digital marketing, включно з SEO, контекстною рекламою та аналітикою."
        tags={[{ text: 'Digital Marketing' }, { text: 'Онлайн курс', filled: true }]}
        avatar="/images/events-07.png"
      />
      <EventsBlock
        y={3807}
        date="Сьогодні"
        cityTime="Львів, 15:00"
        online="Онлайн участь"
        title="Як почати професію SMM спеціаліста"
        desc="Дізнайтесь, як ефективно просувати бренди в соціальних мережах та залучати цільову аудиторію через різноманітні платформи."
        tags={[{ text: 'SMM' }, { text: 'Онлайн курс', filled: true }]}
        avatar="/images/events-08.png"
      />
      <EventsBlock
        y={4251}
        date="Завтра"
        cityTime="Київ, 13:00"
        online="Онлайн участь"
        title="Як стати графічним дизайнером та заробляти від $3000 на місяць"
        desc="Вивчіть основи графічного дизайну, роботу з популярними програмами та способи побудови успішної кар’єри з високим доходом."
        tags={[{ text: 'Design' }, { text: 'Вебінар', filled: true }]}
        avatar="/images/events-09.png"
      />

      <BigCounterBlock />
      <StoriesRibbon y={5750} x={120} />
      <StatsAndPartners />
      <PickCourseCTA y={CTA_TOP} />
    </section>
  );
}

/* =========================
   Допоміжні компоненти
========================= */
function CenteredHeading({ y, text }: { y: number; text: string }) {
  return (
    <Abs x="calc(50% - 354px/2)" y={y}>
      <Text text={text} fz={36} lh={48} fw={700} color="#000" width={354} height={48} family="Afacad, system-ui" />
    </Abs>
  );
}

function CenteredButton({ y, text, href }: { y: number; text: string; href: string }) {
  const BTN_W = 232;
  const SAFE_GAP = 44;
  const [hover, setHover] = React.useState(false);

  return (
    <Abs x={`calc(50% - ${BTN_W / 2}px)`} y={y + SAFE_GAP}>
      <Link
        href={href}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: BTN_W,
          height: 73,
          border: '3px solid #1345DE',
          borderRadius: 10,
          background: '#fff',
          fontFamily: 'Mulish, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: '#1345DE',
          textAlign: 'center',
          textDecoration: 'none',
          boxShadow: hover ? '0 12px 24px rgba(19,69,222,.25)' : '0 6px 16px rgba(19,69,222,.16)',
          transform: hover ? 'translateY(-1px) scale(1.02)' : 'translateY(0)',
          transition: 'transform .15s ease, box-shadow .15s ease',
        }}
      >
        {text}
      </Link>
    </Abs>
  );
}

/* =========================
   Стрічка програм (карусель)
========================= */
function ProgramsRibbon({ x, y, courses }: { x: number; y: number; courses: CourseItem[] }) {
  const items = (courses || []).slice(0, 6);

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const CARD_W = 308;
  const CARD_H = 260;
  const GAP = 40;
  const ITEM_W = CARD_W + GAP;

  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onScroll = () => setIndex(Math.round(el.scrollLeft / ITEM_W));
    el.addEventListener('scroll', onScroll as any, { passive: true } as any);

    const id = window.setInterval(() => {
      if (paused || !el || items.length < 2) return;
      const next = (index + 1) % items.length;
      el.scrollTo({ left: next * ITEM_W, behavior: 'smooth' });
      setIndex(next);
    }, 3600);

    return () => {
      el.removeEventListener('scroll', onScroll as any);
      window.clearInterval(id);
    };
  }, [index, items.length, paused]);

  const goTo = (i: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const next = (i + items.length) % items.length;
    setIndex(next);
    el.scrollTo({ left: next * ITEM_W, behavior: 'smooth' });
  };

  return (
    <Abs x={x} y={y}>
      <div style={{ width: 1177, height: CARD_H + 90, position: 'relative' }}>
        <div
          ref={wrapRef}
          className="no-scrollbar"
          style={{
            width: '100%',
            height: CARD_H + 10 + 48,
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            scrollSnapType: 'x mandatory' as any,
            scrollBehavior: 'smooth',
            padding: '0 8px',
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div style={{ position: 'relative', height: CARD_H + 48, width: items.length * ITEM_W + 8 }}>
            {items.map((c, i) => {
              const isActive = i === index;
              const href = `/courses/${c.id}/details`;
              return (
                <div
                  key={`${c.id}-${i}`}
                  style={{
                    position: 'absolute',
                    left: i * ITEM_W,
                    top: 0,
                    width: CARD_W,
                    height: CARD_H + 48,
                    scrollSnapAlign: 'start',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {/* Тайтл ЗВЕРХУ */}
                  <div
                    style={{
                      width: '100%',
                      minHeight: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px 10px',
                      borderRadius: 10,
                      background: 'linear-gradient(90deg,#1345DE,#82A1FF)',
                      color: '#fff',
                      fontFamily: 'Mulish, system-ui, sans-serif',
                      fontWeight: 800,
                      fontSize: 16,
                      textAlign: 'center',
                      lineHeight: '22px',
                    }}
                    title={c.title}
                  >
                    <span style={{ display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </span>
                  </div>

                  <Link href={href} className="program-card-link" prefetch={false}>
                    <div className={`program-card ${isActive ? 'is-active' : ''}`} style={{ height: CARD_H }}>
                      <FixedImg
                        src={c.image || '/images/placeholder.png'}
                        alt={c.title}
                        className="program-img"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          aria-label="Попередня"
          className="carousel-btn"
          style={{ position: 'absolute', left: -54, top: '50%', transform: 'translateY(-50%)' }}
          onClick={() => goTo(index - 1)}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <span className="chev">‹</span>
        </button>
        <button
          type="button"
          aria-label="Наступна"
          className="carousel-btn"
          style={{ position: 'absolute', right: -54, top: '50%', transform: 'translateY(-50%)' }}
          onClick={() => goTo(index + 1)}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <span className="chev">›</span>
        </button>
      </div>
    </Abs>
  );
}

/* =========================
   Події
========================= */
type Tag = { text: string; filled?: boolean };

function VLine({ h = 24, opacity = 0.7 }: { h?: number; opacity?: number }) {
  return <span style={{ display: 'inline-block', width: 1, height: h, background: `rgba(0,0,0,${opacity})` }} />;
}

function Hr({ y, x = 120, width = 1039 }: { y: number; x?: number | string; width?: number }) {
  return (
    <Abs x={x} y={y}>
      <div style={{ width, borderTop: '2px solid rgba(130,161,255,0.6)' }} />
    </Abs>
  );
}

function EventsBlock({
  y,
  date,
  cityTime,
  online,
  title,
  desc,
  tags,
  avatar,
  withBottomLine = true,
}: {
  y: number;
  date: string;
  cityTime: string;
  online: string;
  title: string;
  desc: string;
  tags: Tag[];
  avatar: string;
  withBottomLine?: boolean;
}) {
  const BOTTOM_DIVIDER_OFFSET = 348;

  const clampStyle: React.CSSProperties = {
    width: 610,
    height: 60,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical' as any,
    WebkitLineClamp: 2,
    overflow: 'hidden',
  };

  return (
    <>
      <Abs x={120} y={y}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', maxWidth: 740 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Text text={date} fz={32} lh={43} fw={700} color="#1345DE" family="Afacad, system-ui" />
            <VLine />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Text text={cityTime} fz={24} lh={30} fw={600} color="#000" />
            <VLine />
          </div>
          <Text text={online} fz={20} lh={30} fw={400} color="#000" />
        </div>
      </Abs>

      <Abs x={120} y={y + 67}>
        <div style={clampStyle}>
          <Text text={title} fz={24} lh={30} fw={700} color="#000" />
        </div>
      </Abs>

      <Abs x={120} y={y + 131}>
        <Text text={desc} fz={20} lh={30} fw={600} color="#000" width={600} height={90} />
      </Abs>

      <Abs x={120} y={y + 284}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', maxWidth: 640 }}>
          {tags.map((t, i) => (
            <div
              key={i}
              style={{
                height: 40,
                padding: '0 20px',
                borderRadius: 10,
                border: t.filled ? 'none' : '2px solid #1345DE',
                background: t.filled ? '#1345DE' : '#82A1FF',
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'Mulish',
                fontWeight: 600,
                fontSize: 16,
                lineHeight: '30px',
                color: t.filled ? '#fff' : '#000',
                whiteSpace: 'nowrap',
              }}
            >
              {t.text}
            </div>
          ))}
        </div>
      </Abs>

      <Abs x={710} y={y + 97}>
        <div style={{ width: 148, height: 148, borderRadius: '50%', overflow: 'hidden', background: '#D9D9D9' }}>
          <FixedImg src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </Abs>

      <Abs x={968} y={y + 145}>
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
          }}
        >
          Детальніше
        </Link>
      </Abs>

      {withBottomLine && <Hr y={y + BOTTOM_DIVIDER_OFFSET} />}
    </>
  );
}

/* =========================
   Лічильник + телефон/відгуки
========================= */
function BigCounterBlock() {
  const AFTER_EVENTS_Y = 5397;
  const numberTop = AFTER_EVENTS_Y - 600;

  return (
    <>
      <Abs x={`calc(50% - 437px/2 - 220px)`} y={numberTop - 31}>
        <div
          style={{
            width: 182,
            height: 182,
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
      </Abs>

      <Abs x="calc(50% - 437px/2 + 0.5px)" y={numberTop}>
        <Text text="200.000+" fz={96} lh={120} fw={700} color="#021C4E" width={437} height={120} />
      </Abs>

      <Abs x="calc(50% - 429px/2 + 0.5px)" y={numberTop + 165}>
        <Text text="людей вже з BrainBoost" fz={36} lh={45} fw={700} color="#000" width={429} height={45} align="center" />
      </Abs>

      <Abs x="calc(50% - 1061px/2 + 0.5px)" y={numberTop + 249}>
        <Text
          text="Приєднуйтесь до BrainBoost! Опануйте нову професію, заробляйте з перших тижнів, розвивайтеся та надихайте інших."
          fz={24}
          lh={30}
          fw={500}
          color="#000"
          width={1061}
          height={60}
          align="center"
        />
      </Abs>

      <Abs x={-8} y={numberTop + 369}>
        <div style={{ width: 532, height: 413, filter: 'drop-shadow(-16px -7px 10px rgba(0,0,0,.25))' }}>
          <FixedImg src="/images/phone.png" alt="phone" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      </Abs>

      {[
        { user: '@Anastasia', text: 'UI/UX курс допоміг змінити професію. Тепер працюю фрілансеркою з дому.', offset: 362 },
        { user: '@Katya', text: 'Курс з тестування — супер! Отримала базу, пройшла співбесіду й знайшла роботу.', offset: 526 },
        { user: '@Vlad', text: 'Дуже доступне пояснення! З нуля вивчив HTML і CSS, вже створюю власні проєкти.', offset: 690 },
      ].map((b, i) => (
        <Abs key={i} x={553} y={numberTop + b.offset}>
          <div
            style={{
              width: 736,
              height: 92,
              borderRadius: 10,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.6) 42.24%, rgba(10,37,120,0.6) 98.51%)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px',
              gap: 24,
            }}
          >
            <div style={{ fontFamily: 'Mulish', fontWeight: 700, fontSize: 36, lineHeight: '45px', color: '#000' }}>{b.user}</div>
            <div style={{ fontFamily: 'Mulish', fontWeight: 500, fontSize: 20, lineHeight: '25px', color: '#000' }}>{b.text}</div>
          </div>
        </Abs>
      ))}

      <Abs x="calc(50% - 280px/2)" y={numberTop + 820}>
        <Link
          href="/reviews"
          style={{
            display: 'block',
            width: 280,
            height: 64,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #1345DE 0%, #0A2578 100%)',
            boxShadow: '0 10px 20px rgba(19,69,222,.3)',
            color: '#fff',
            textDecoration: 'none',
            fontFamily: 'Mulish',
            fontWeight: 700,
            fontSize: 18,
            lineHeight: '64px',
            textAlign: 'center',
            letterSpacing: 0.2,
          }}
        >
          Дивитись всі відгуки
        </Link>
      </Abs>
    </>
  );
}

/* =========================
   Стрічка «Історії»
========================= */
function StoriesRibbon({ y, x }: { y: number; x: number }) {
  const CARD_W = 616;
  const CARD_H = 440;
  const GAP = 24;
  const VISIBLE = 2;

  type StoryItem = { id: number; title: string; cover: string | null };

  const [items, setItems] = React.useState<StoryItem[]>([]);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('https://brainboost.pp.ua/api/api/stories/?limit=6');
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

    return () => {
      cancelled = true;
    };
  }, []);

  const maxIdx = Math.max(0, Math.max(0, items.length - VISIBLE));
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
    <Abs x={x} y={y}>
      <div style={{ width: 1040 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              gap: 10,
              margin: '0 auto 22px',
              marginTop: 8,
              textAlign: 'center',
              maxWidth: 1040,
            }}
          >
            <div
              style={{
                fontFamily: 'Afacad, system-ui, sans-serif',
                fontWeight: 800,
                fontSize: 40,
                lineHeight: '52px',
                letterSpacing: '-.2px',
                color: '#0A2578',
                maxWidth: 700,
              }}
            >
              Неймовірні історії наших студентів
            </div>
            <div
              style={{
                fontFamily: 'Mulish, system-ui, sans-serif',
                fontWeight: 500,
                fontSize: 22,
                lineHeight: '32px',
                color: '#1B1B1B',
                opacity: 0.9,
                maxWidth: 780,
              }}
            >
              Дізнайтесь як змінилося життя учнів BrainBoost після проходження курсів
            </div>
            <div style={{ width: 96, height: 4, borderRadius: 9999, background: 'linear-gradient(90deg,#1345DE,#82A1FF)', marginTop: 4 }} />
          </div>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              width: 1040,
              height: 140,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 14,
              background: 'rgba(130,161,255,.15)',
              color: '#0A2578',
              fontFamily: 'Mulish',
              fontWeight: 700,
            }}
          >
            Наразі немає доступних історій
          </div>
        ) : (
          <div style={{ position: 'relative', height: CARD_H + 20 }}>
            <div style={{ width: 1040, height: CARD_H, overflow: 'hidden', borderRadius: 20 }}>
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
                  <div
                    key={it.id}
                    className="story-card"
                    style={{
                      position: 'relative',
                      width: CARD_W,
                      height: CARD_H,
                      borderRadius: 20,
                      overflow: 'hidden',
                      flex: '0 0 auto',
                    }}
                  >
                    <FixedImg
                      src={it.cover || '/images/placeholder.png'}
                      alt={it.title}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(10,37,120,0) 40%, rgba(10,37,120,.55) 100%)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: 24,
                        top: 24,
                        padding: '6px 12px',
                        borderRadius: 34,
                        border: '1px solid #fff',
                        color: '#fff',
                        fontFamily: 'Mulish',
                        fontSize: 13,
                      }}
                    >
                      Історії
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        left: 24,
                        bottom: 64,
                        width: CARD_W - 48,
                        color: '#fff',
                        fontFamily: 'Mulish',
                        fontWeight: 700,
                        fontSize: 20,
                        lineHeight: '25px',
                        textShadow: '0 2px 8px rgba(0,0,0,.35)',
                      }}
                    >
                      {it.title}
                    </div>
                    <Link
                      href={`/stories/${it.id}`}
                      style={{
                        position: 'absolute',
                        left: 24,
                        bottom: 20,
                        width: 162,
                        height: 36,
                        borderRadius: 34,
                        background: '#82A1FF',
                        color: '#fff',
                        fontFamily: 'Mulish',
                        fontWeight: 600,
                        fontSize: 14,
                        lineHeight: '36px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        boxShadow: '0 8px 20px rgba(130,161,255,.35)',
                      }}
                    >
                      Читати історію
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={prev}
              aria-label="Попередні"
              style={{
                position: 'absolute',
                left: -60,
                top: CARD_H / 2 - 24,
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 0,
                background: 'linear-gradient(135deg,#1345DE,#0A2578)',
                color: '#fff',
                boxShadow: '0 10px 20px rgba(19,69,222,.35)',
                cursor: 'pointer',
              }}
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Наступні"
              style={{
                position: 'absolute',
                right: -60,
                top: CARD_H / 2 - 24,
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 0,
                background: 'linear-gradient(135deg,#1345DE,#0A2578)',
                color: '#fff',
                boxShadow: '0 10px 20px rgba(19,69,222,.35)',
                cursor: 'pointer',
              }}
            >
              ›
            </button>

            <div style={{ position: 'absolute', left: 0, right: 0, bottom: -28, display: 'flex', gap: 8, justifyContent: 'center' }}>
              {Array.from({ length: pageCount }).map((_, p) => (
                <div key={p} className={`carousel-dot ${p === idx ? 'active' : ''}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Abs>
  );
}

/* =========================
   Статистика + партнери
========================= */
function StatsAndPartners() {
  const statsTop = 6600;
  const partnersBaseTop = statsTop + 642;

  return (
    <>
      <Abs x={120} y={statsTop}>
        <div style={{ width: 1040 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', columnGap: 24, alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <div style={{ fontFamily: 'Afacad, system-ui, sans-serif', fontWeight: 700, fontSize: 48, color: '#0A2578' }}>60.000+</div>
                <div style={{ fontFamily: 'Mulish, system-ui, sans-serif', fontWeight: 700, fontSize: 36, color: '#000' }}>Випускників з усього світу</div>
              </div>
              <div style={{ marginTop: 6, fontFamily: 'Afacad, system-ui, sans-serif', fontWeight: 700, fontSize: 56, lineHeight: '64px', color: '#0A2578' }}>
                BrainBoost
              </div>
            </div>

            <FixedImg src="/images/memoji.png" alt="emoji" style={{ width: 200, height: 200, objectFit: 'contain', transform: 'translateX(-16px)' }} />
          </div>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 80, rowGap: 28 }}>
            <div>
              <div style={{ fontFamily: 'Afacad, system-ui, sans-serif', fontWeight: 700, fontSize: 38, color: '#000' }}>92 країни</div>
              <div style={{ marginTop: 6, fontFamily: 'Mulish, system-ui, sans-serif', fontSize: 26, lineHeight: '24px', color: '#000' }}>Навчаються в BrainBoost</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Afacad, system-ui, sans-serif', fontWeight: 700, fontSize: 38, color: '#000' }}>500K люд.</div>
              <div style={{ marginTop: 6, fontFamily: 'Mulish, system-ui, sans-serif', fontSize: 26, lineHeight: '24px', color: '#000' }}>
                Дистанційно використовують знання
                <br />
                Genius.Space
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'Afacad, system-ui, sans-serif', fontWeight: 700, fontSize: 38, color: '#000' }}>102 512 люд.</div>
              <div style={{ marginTop: 6, fontFamily: 'Mulish, system-ui, sans-serif', fontSize: 26, lineHeight: '24px', color: '#000' }}>Пройшли платні навчальні курси</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Afacad, system-ui, sans-serif', fontWeight: 700, fontSize: 38, color: '#000' }}>35 381 людей</div>
              <div style={{ marginTop: 6, fontFamily: 'Mulish, system-ui, sans-serif', fontSize: 26, lineHeight: '24px', color: '#000' }}>Відвідали наші офлайн івенти</div>
            </div>
          </div>
        </div>
      </Abs>

      {[
        { x: 120, dy: 36, w: 190, h: 63, src: '/images/partner-01.png' },
        { x: 418, dy: 0, w: 126, h: 126, src: '/images/partner-02.png' },
        { x: 630, dy: 0, w: 126, h: 126, src: '/images/partner-03.png' },
        { x: 843, dy: 31, w: 317, h: 63, src: '/images/partner-04.png' },
        { x: 120, dy: 204, w: 190, h: 71, src: '/images/partner-05.png' },
        { x: 418, dy: 168, w: 126, h: 126, src: '/images/partner-06.png' },
        { x: 630, dy: 193, w: 230, h: 59, src: '/images/partner-07.png' },
        { x: 923, dy: 160, w: 244, h: 100, src: '/images/partner-08.png' },
      ].map((p, i) => (
        <Abs key={i} x={p.x} y={partnersBaseTop + p.dy}>
          <FixedImg src={p.src} alt="" style={{ width: p.w, height: p.h, objectFit: 'contain' }} />
        </Abs>
      ))}
    </>
  );
}

/* =========================
   CTA «Підберемо курс»
========================= */
function PickCourseCTA({ y }: { y: number }) {
  // Виправлено баг: раніше було `const baseTop = top;`
  const baseTop = y;
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
      const res = await fetch('https://brainboost.pp.ua/api/api/contacts/', {
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
    <>
      <Abs x={206} y={baseTop}>
        <div
          style={{
            width: 868,
            height: 481,
            background: '#82A1FF',
            borderRadius: 30,
            boxShadow: '-9px 9px 10px rgba(0,0,0,.25), 9px -9px 10px rgba(0,0,0,.25)',
          }}
        />
      </Abs>

      <Abs x={241} y={baseTop + 132}>
        <Text text="Підберемо курс для Вас" fz={36} lh={48} fw={700} color="#fff" family="Afacad, system-ui" width={300} height={100} />
      </Abs>
      <Abs x={243} y={baseTop + 249}>
        <Text
          text="Важко визначитись із вибором? Ми допоможемо! Просто залиште свій номер, і наш менеджер проконсультує вас з будь-яких питань."
          fz={20}
          lh={25}
          fw={700}
          color="#0A2578"
          width={337}
          height={125}
        />
      </Abs>

      <Abs x={650} y={baseTop + 84}>
        <form onSubmit={handleSubmit} style={{ position: 'relative', width: 382 }}>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Імʼя"
            required
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 382,
              height: 51,
              background: '#fff',
              borderRadius: 10,
              padding: '13px 18px',
              fontFamily: 'Mulish',
              fontSize: 20,
              color: '#000',
              outline: 'none',
              border: '1px solid transparent',
            }}
            onFocus={(e) => (e.currentTarget.style.border = '1px solid #1345DE')}
            onBlur={(e) => (e.currentTarget.style.border = '1px solid transparent')}
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            style={{
              position: 'absolute',
              left: 0,
              top: 88,
              width: 382,
              height: 51,
              background: '#fff',
              borderRadius: 10,
              padding: '13px 18px',
              fontFamily: 'Mulish',
              fontSize: 20,
              color: '#000',
              outline: 'none',
              border: '1px solid transparent',
            }}
            onFocus={(e) => (e.currentTarget.style.border = '1px solid #1345DE')}
            onBlur={(e) => (e.currentTarget.style.border = '1px solid transparent')}
          />
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="Телефон"
            style={{
              position: 'absolute',
              left: 0,
              top: 176,
              width: 382,
              height: 51,
              background: '#fff',
              borderRadius: 10,
              padding: '13px 18px',
              fontFamily: 'Mulish',
              fontSize: 20,
              color: '#000',
              outline: 'none',
              border: '1px solid transparent',
            }}
            onFocus={(e) => (e.currentTarget.style.border = '1px solid #1345DE')}
            onBlur={(e) => (e.currentTarget.style.border = '1px solid transparent')}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              position: 'absolute',
              left: 150,
              top: 264,
              width: 232,
              height: 73,
              border: '3px solid #1345DE',
              borderRadius: 10,
              background: '#fff',
              color: '#1345DE',
              fontFamily: 'Mulish',
              fontWeight: 700,
              fontSize: 16,
              lineHeight: '73px',
              textAlign: 'center',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Надсилаю…' : 'Надіслати заявку'}
          </button>

          {status ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 352,
                width: 382,
                minHeight: 40,
                borderRadius: 10,
                padding: '10px 12px',
                fontFamily: 'Mulish',
                fontSize: 14,
                background: status.type === 'success' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)',
                color: status.type === 'success' ? '#065f46' : '#7f1d1d',
              }}
            >
              {status.message}
            </div>
          ) : null}
        </form>
      </Abs>
    </>
  );
}

/* ==== Footer ==== */
function FooterCard() {
  return (
    <footer className="site-footer">
      <div className="sf-wrap">
        <div className="sf-top">
          <div className="sf-brand">
            <div className="sf-logo">BrainBoost</div>
            <p className="sf-addr">Ukraine, Kyiv, vul. Bohdana Khmelnytskoho, 25А</p>

            <div className="sf-actions">
              <Link href="/contacts" className="sf-btn sf-btn--primary">Підібрати навчання</Link>
              <Link href="/login" className="sf-btn sf-btn--ghost">Увійти на платформу</Link>
            </div>
          </div>

          <nav className="sf-cols">
            <div className="sf-col">
              <div className="sf-title">Курси</div>
              <ul>
                <li><Link href="/courses?category=Маркетинг">Маркетинг</Link></li>
                <li><Link href="/courses?category=Дизайн">Дизайн</Link></li>
                <li><Link href="/courses?category=Бізнес">Бізнес</Link></li>
                <li><Link href="/courses?category=IT">IT</Link></li>
                <li><Link href="/courses?category=Фінанси">Фінанси</Link></li>
              </ul>
            </div>

            <div className="sf-col">
              <div className="sf-title">Більше</div>
              <ul>
                <li><Link href="/reviews">Відгуки</Link></li>
                <li><Link href="/faq">Питання та відповіді</Link></li>
                <li><Link href="/about">Про нас</Link></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="sf-bottom">
          <span>© {new Date().getFullYear()} BrainBoost. Всі права захищено.</span>
          <div className="sf-legal">
            <Link href="/privacy">Політика конфіденційності</Link>
            <span>•</span>
            <Link href="/terms">Умови використання</Link>
          </div>
        </div>
      </div>
    </footer>
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

