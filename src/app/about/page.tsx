'use client';

import Link from 'next/link';

/* ======================== Типи ======================== */
type Founder = {
  name: string;
  title: string;
  image: string;
  quote: string;
  fb?: string;
  ig?: string;
  tg?: string;
};

/* ======================== Дані ======================== */
const founders: Founder[] = [
  {
    name: 'Анна Мельник',
    title: 'CEO',
    image: '/images/founder1.png',
    quote: '«Змінювати країну — це процес, у якому кожен крок важливий: нові знання — нові можливості.»',
    fb: '#',
    ig: '#',
    tg: '#',
  },
  {
    name: 'Павло Гончар',
    title: 'CTO',
    image: '/images/founder2.png',
    quote: '«Освіта — головний інструмент розвитку. Технології мають бути доступними кожному.»',
    fb: '#',
    ig: '#',
    tg: '#',
  },
  {
    name: 'Сергій Ткаченко',
    title: 'COO',
    image: '/images/founder3.png',
    quote: '«Ми створюємо середовище, де студент швидко бачить результат своєї праці.»',
    fb: '#',
    ig: '#',
    tg: '#',
  },
];

/* ======================== Стилі (DRY) ======================== */
const WRAP_1200 = 'mx-auto max-w-[1200px] px-6 md:px-[118px]';
const CARD_WHITE_20 =
  'rounded-[20px] bg-white shadow-[0_8px_24px_rgba(2,28,78,0.08)] ring-1 ring-[#E5ECFF] p-4 hover:shadow-[0_10px_28px_rgba(2,28,78,0.12)] transition';
const SOCIAL_TILE =
  'grid h-16 w-16 place-items-center rounded-[15px] bg-white ring-1 ring-[#E5ECFF] shadow-[0_8px_24px_rgba(2,28,78,0.06)] hover:ring-[#1345DE] transition';
const CTA_BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-[14px] bg-[#1345DE] px-6 py-3 text-white font-semibold hover:bg-[#0e2db9] transition text-lg';
const CTA_BTN_OUTLINE =
  'inline-flex items-center justify-center rounded-[14px] border border-[#1345DE] px-6 py-3 text-[#1345DE] font-semibold hover:bg-[#EEF3FF] transition text-lg';

/* ======================== Дрібні компоненти ======================== */
function Tile({ src, alt = '' }: { src: string; alt?: string }) {
  return (
    <div className="w-full h-full border-[1.4px] border-[#1345DE] rounded-[20px] overflow-hidden box-border">
      <img src={src} alt={alt} className="w-full h-full object-cover block" />
    </div>
  );
}

function FounderCard({ f }: { f: Founder }) {
  return (
    <article className={CARD_WHITE_20}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[#0F2E64] font-extrabold text-[18px] truncate">{f.name}</h3>
          <p className="text-[#5A78B4] text-[12px] font-semibold">{f.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {f.fb ? (
            <a href={f.fb} aria-label="Facebook" className="hover:opacity-80" rel="noopener">
              <FbIcon />
            </a>
          ) : null}
          {f.ig ? (
            <a href={f.ig} aria-label="Instagram" className="hover:opacity-80" rel="noopener">
              <IgIcon />
            </a>
          ) : null}
          {f.tg ? (
            <a href={f.tg} aria-label="Telegram" className="hover:opacity-80" rel="noopener">
              <TgIcon />
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-[16px] overflow-hidden">
        <div className="relative w-full aspect-[4/3]">
          <img src={f.image} alt={f.name} className="absolute inset-0 h-full w-full object-cover" />
        </div>
      </div>

      <p className="mt-3 text-slate-700 text-[17px] leading-[22px]">{f.quote}</p>
    </article>
  );
}

function SocialIconBtn({ Icon }: { Icon: React.ComponentType }) {
  return (
    <div className={SOCIAL_TILE}>
      <Icon />
    </div>
  );
}

/* ======================== Сторінка ======================== */
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      {/* === HERO (точний, як у вас) === */}
      <section className="w-[1280px] mx-auto pt-[159px]">
        <div
          className="w-[1047px] mx-auto grid"
          style={{ gridTemplateColumns: '461px 564px', columnGap: '22px', alignItems: 'start' }}
        >
          {/* ЛІВА КОЛОНКА */}
          <div className="w-[461px]">
            <h1 className="m-0 w-[423px] font-[Afacad] font-bold text-[96px] leading-[128px] text-[#021C4E]">
              Brainboost
            </h1>

            <p
              className="w-[461px] font-[Mulish] font-medium text-[24px] leading-[30px] text-black"
              style={{ marginTop: `${207 - 81 - 128}px` }}
            >
              Простір для тих, хто хоче увійти в ІТ або прокачати свої навички.
            </p>

            <Link
              href="/courses"
              className="inline-flex items-center justify-center w-[258px] h-[55px] bg-[#1345DE] text-white rounded-[10px] font-[Mulish] font-semibold text-[14px] no-underline"
              style={{ marginTop: `${310 - 207 - 60}px` }}
            >
              Хочу вчитись в Brainboost
            </Link>

            {/* 2000+ задоволенних відгуків */}
            <div className="flex items-center gap-4" style={{ marginTop: `${400 - 292 - 55}px` }}>
              <div className="flex items-center">
                <img src="/images/ava1.png" alt="" className="w-[70px] h-[70px] rounded-full block" />
                <img src="/images/ava2.png" alt="" className="w-[70px] h-[70px] rounded-full block -ml-[25px]" />
                <img src="/images/ava3.png" alt="" className="w-[70px] h-[70px] rounded-full block -ml-[25px]" />
              </div>
              <div className="font-[Mulish] text-black">
                <div className="font-bold text-[24px] leading-[30px]">2000+ Задоволенних</div>
                <div className="font-bold text-[24px] leading-[30px]">відгуків від учнів</div>
              </div>
            </div>
          </div>

          {/* ПРАВА КОЛОНКА — фотосітка */}
          <div
            className="w-[564px] h-[473px] grid"
            style={{
              gridTemplateColumns: '308px 239px', // 308 + 239 + 17 = 564
              gridAutoRows: '227px', // 227 + 227 + 19 = 473
              columnGap: '17px',
              rowGap: '19px',
            }}
          >
            <Tile src="/images/hero-1.png" alt="Комʼюніті Brainboost — фото 1" />
            <Tile src="/images/hero-2.png" alt="Комʼюніті Brainboost — фото 2" />
            <Tile src="/images/hero-3.png" alt="Комʼюніті Brainboost — фото 3" />
            <Tile src="/images/hero-4.png" alt="Комʼюніті Brainboost — фото 4" />
          </div>
        </div>
      </section>
      {/* === /HERO === */}

      {/* Засновники */}
      <section>
        <div className={`${WRAP_1200} pt-10 md:pt-12 pb-10 md:pb-12`}>
          <p className="text-center text-[#5A78B4] text-[16px]">Знайомся ближче</p>
          <h2 className="mt-2 text-center text-[#0F2E64] font-extrabold text-[32px] md:text-[36px] leading-[1.25]">
            Засновники Brainboost
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {founders.map((f) => (
              <FounderCard key={f.name} f={f} />
            ))}
          </div>
        </div>
      </section>

      {/* Коротка історія */}
      <section className="pb-12">
        <div className={WRAP_1200}>
          <div className="rounded-[24px] bg-[#0D2B6B] text-white p-6 md:p-8 shadow-[0_12px_30px_rgba(2,28,78,0.18)]">
            <h3 className="text-[22px] md:text-[24px] font-extrabold">Коротка історія Brainboost</h3>
            <p className="mt-3 text-blue-100 leading-relaxed">
              BrainBoost було засновано у 2016 році як хаб і центр онлайн-курсів для дорослих і студентів. Ми робимо
              практичні навчальні програми з фокусом на результат. За цей час створили десятки курсів, провели сотні
              інтенсивів і допомогли тисячам студентів отримати першу роботу в актуальних напрямках. Наша мета — навчання без води,
              з чіткими кроками й підтримкою ментора.
            </p>

            <div className="mt-5 rounded-[16px] overflow-hidden ring-2 ring-blue-700 shadow-md">
              <div className="relative w-full aspect-[16/9]">
                <img
                  src="/images/history.png"
                  alt="Історія Brainboost"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Промо-картка */}
      <section className="py-20">
        <div className="mx-auto max-w-[1300px] px-6 md:px-[118px]">
          <div className="rounded-[24px] bg-white shadow-[0_10px_30px_rgba(2,28,78,0.1)] ring-1 ring-[#E5ECFF] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
            {/* Ліва частина */}
            <div className="flex-1">
              <h4 className="text-[24px] md:text-[28px] font-bold text-[#0F2E64]">Шукаєш ефективні курси?</h4>
              <p className="mt-4 text-lg text-slate-700 leading-relaxed">
                У нас — практичні програми, живі заняття та мобільний доступ.
                Підвищуй кваліфікацію або знаходь першу роботу після курсу.
              </p>
              <div className="mt-6 flex gap-4">
                <Link href="/courses" className={CTA_BTN_PRIMARY}>
                  Дивитися курси
                </Link>
                <Link href="/about" className={CTA_BTN_OUTLINE}>
                  Дізнатись більше
                </Link>
              </div>
            </div>

            {/* Права частина */}
            <div className="relative w-full md:w-[300px] rounded-[20px] overflow-hidden ring-2 ring-blue-700 shadow-md bg-white">
              <img src="/images/promo.png" alt="Промо" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* Соцмережі */}
      <section className="py-10">
        <div className={WRAP_1200}>
          <h5 className="text-center text-[#0F2E64] font-extrabold text-[23px] md:text-[27px]">
            Слідкуй за нами у соцмережах
          </h5>
          <div className="mt-6 flex justify-center gap-4 md:gap-6">
            {[LinkedInIcon, FacebookIcon, YouTubeIcon, InstagramIcon, TelegramIcon].map((Icon, i) => (
              <SocialIconBtn key={i} Icon={Icon} />
            ))}
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="pb-10 pt-6">
        <div className={WRAP_1200}>
          <div className="rounded-[24px] bg-[#0D2B6B] text-white p-6 md:p-8 shadow-[0_12px_30px_rgba(2,28,78,0.18)]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-2xl font-extrabold">Brainboost</div>
                <p className="mt-2 text-blue-100">
                  Київ, вулиця Балтійська<br />Мистецький простір, 23А
                </p>
              </div>

              <div>
                <h6 className="font-bold">Курси</h6>
                <ul className="mt-2 space-y-1 text-blue-100">
                  <li><Link href="/courses" className="hover:underline">Каталог курсів</Link></li>
                  <li><Link href="/faq" className="hover:underline">Питання та відповіді</Link></li>
                  <li><Link href="/reviews" className="hover:underline">Відгуки</Link></li>
                </ul>
              </div>

              <div>
                <h6 className="font-bold">Компанія</h6>
                <ul className="mt-2 space-y-1 text-blue-100">
                  <li><Link href="/about" className="hover:underline">Про нас</Link></li>
                  <li><Link href="/contacts" className="hover:underline">Контакти</Link></li>
                  <li><Link href="/policy" className="hover:underline">Політика конфіденційності</Link></li>
                </ul>
              </div>
            </div>

            <div className="mt-6 border-t border-[#2550A8] pt-4 text-blue-200 text-sm">
              © {new Date().getFullYear()} Brainboost. Всі права захищені.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ======================== SVG-іконки ======================== */
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-11 w-11 fill-[#1345DE]" aria-hidden="true">
      <path d="M4.98 3.5A2.5 2.5 0 1 1 2.48 6 2.5 2.5 0 0 1 4.98 3.5zM3 8h4v12H3zM9 8h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V20h-4v-5.3c0-1.26-.02-2.88-1.76-2.88-1.77 0-2.04 1.38-2.04 2.79V20H9z" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-11 w-11 fill-[#1345DE]" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.3V12h2.3V9.8c0-2.3 1.3-3.6 3.4-3.6.99 0 2.02.18 2.02.18v2.2h-1.14c-1.12 0-1.47.7-1.47 1.42V12h2.5l-.4 2.9h-2.1v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-11 w-11 fill-[#E11D48]" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.7 3.5 12 3.5 12 3.5s-7.7 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.7.6 9.4.6 9.4.6s7.7 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.8 15.5v-7l6.4 3.5-6.4 3.5z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-11 w-11 fill-[#E1306C]" aria-hidden="true">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm6-1a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
    </svg>
  );
}
function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-11 w-11 fill-[#0EA5E9]" aria-hidden="true">
      <path d="M9.04 15.29 8.8 19.2c.43 0 .62-.18.84-.4l2.02-1.94 4.19 3.07c.77.43 1.31.2 1.52-.71l2.76-12.97h0c.24-1.12-.41-1.56-1.16-1.29L3.32 9.9c-1.09.43-1.07 1.06-.19 1.34l4.76 1.49 11.07-6.98c.52-.32 1-.14.61.2" />
    </svg>
  );
}

/* маленькі іконки для карток-засновників */
type IconProps = {
  size?: number;
  className?: string;  // керуй кольором через text-*, наприклад text-[#1345DE]
  title?: string;      // якщо треба a11y-титул
};

/* Facebook */
export function FbIcon({ size = 20, className = 'text-[#1345DE]', title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden={title ? 'false' : 'true'}
      role={title ? 'img' : 'presentation'}
      focusable="false"
      shapeRendering="geometricPrecision"
    >
      {title ? <title>{title}</title> : null}
      {/* логотип Facebook у колі */}
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H8.078V12h2.36V9.797c0-2.33 1.39-3.616 3.52-3.616.99 0 2.027.177 2.027.177v2.23h-1.142c-1.126 0-1.478.699-1.478 1.416V12h2.517l-.402 2.891h-2.115v6.987C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

/* Instagram */
export function IgIcon({ size = 20, className = 'text-[#1345DE]', title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden={title ? 'false' : 'true'}
      role={title ? 'img' : 'presentation'}
      focusable="false"
      shapeRendering="geometricPrecision"
    >
      {title ? <title>{title}</title> : null}
      {/* обвідний квадрат із радіусом + об'єктив + індикатор */}
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Z" />
      <path d="M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
      <circle cx="18" cy="6.5" r="1" />
    </svg>
  );
}

/* Telegram */
export function TgIcon({ size = 20, className = 'text-[#1345DE]', title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden={title ? 'false' : 'true'}
      role={title ? 'img' : 'presentation'}
      focusable="false"
      shapeRendering="geometricPrecision"
    >
      {title ? <title>{title}</title> : null}
      {/* “паперовий літак” Telegram, добре читається на 16–20px */}
      <path d="M21.543 2.478a.9.9 0 0 0-.94-.07L2.43 10.77a.9.9 0 0 0 .05 1.67l4.88 1.74 1.86 5.64a.9.9 0 0 0 1.45.4l2.66-2.39 4.62 3.37a.9.9 0 0 0 1.4-.55l3.19-15.05a.9.9 0 0 0-.98-1.11ZM9.32 14.54l8.45-7.86a.3.3 0 0 1 .46.31l-2.26 10.63a.3.3 0 0 1-.46.17l-3.64-2.67-2.29 1.99a.7.7 0 0 1-1.14-.35l-.9-3.4a.7.7 0 0 1 .48-.82Z" />
    </svg>
  );
}

