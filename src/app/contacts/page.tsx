'use client';

import React, { useState } from 'react';
import Link from 'next/link';

/* =========================================================
   УТИЛІТИ / КОНСТАНТИ
========================================================= */
const CARD = 'rounded-[20px] bg-white ring-1 ring-[#E5ECFF] shadow-[0_8px_24px_rgba(2,28,78,0.06)]';
const CARD_PAD = `${CARD} p-5`;
const CARD_PAD_SM = `${CARD} p-4`;
const API_URL = process.env.NEXT_PUBLIC_CONTACTS_API || 'https://brainboost.pp.ua/api/api/contacts/';

/* =========================================================
   ІКОНИ (currentColor, доступність, чисті path-и)
========================================================= */
type IconProps = { size?: number; className?: string; title?: string };

const Svg = ({
  viewBox = '0 0 24 24',
  size = 24,
  className,
  title,
  children,
}: IconProps & { viewBox?: string; children: React.ReactNode }) => (
  <svg
    viewBox={viewBox}
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
    {children}
  </svg>
);

const PhoneIcon = ({ size = 24, className = 'w-6 h-6 text-[#1345DE]', title }: IconProps) => (
  <Svg size={size} className={className} title={title}>
    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.13.38 2.33.57 3.56.57a1 1 0 0 1 1 1v3.59a1 1 0 0 1-1 1A17 17 0 0 1 3 5a1 1 0 0 1 1-1h3.59a1 1 0 0 1 1 1c0 1.21.19 2.43.57 3.56a1 1 0 0 1-.24 1.02l-2.3 2.21Z" />
  </Svg>
);

const MailIcon = ({ size = 24, className = 'w-6 h-6 text-[#1345DE]', title }: IconProps) => (
  <Svg size={size} className={className} title={title}>
    <path d="M20 4H4a2 2 0 0 0-2 2v.4l10 6.25L22 6.4V6a2 2 0 0 0-2-2Zm0 4.8-8 5-8-5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.8Z" />
  </Svg>
);

const MapPinIcon = ({ size = 24, className = 'w-6 h-6 text-[#1345DE]', title }: IconProps) => (
  <Svg size={size} className={className} title={title}>
    <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 9.5 9 2.5 2.5 0 0 1 12 11.5Z" />
  </Svg>
);

const ClockIcon = ({ size = 24, className = 'w-6 h-6 text-[#1345DE]', title }: IconProps) => (
  <Svg size={size} className={className} title={title}>
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 10.41 3.29 3.3-1.42 1.41L11 13V7h2Z" />
  </Svg>
);

const TelegramIcon = ({ size = 24, className = 'w-6 h-6 text-[#0EA5E9]', title }: IconProps) => (
  <Svg size={size} className={className} title={title}>
    <path d="M21.543 2.478a.9.9 0 0 0-.94-.07L2.43 10.77a.9.9 0 0 0 .05 1.67l4.88 1.74 1.86 5.64a.9.9 0 0 0 1.45.4l2.66-2.39 4.62 3.37a.9.9 0 0 0 1.4-.55l3.19-15.05a.9.9 0 0 0-.98-1.11ZM9.32 14.54l8.45-7.86a.3.3 0 0 1 .46.31l-2.26 10.63a.3.3 0 0 1-.46.17l-3.64-2.67-2.29 1.99a.7.7 0 0 1-1.14-.35l-.9-3.4a.7.7 0 0 1 .48-.82Z" />
  </Svg>
);

const WhatsAppIcon = ({ size = 24, className = 'w-6 h-6 text-[#16A34A]', title }: IconProps) => (
  <Svg size={size} className={className} title={title}>
    <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1 3.7 3.8-1a9.9 9.9 0 0 0 4.7 1.2h.01A9.9 9.9 0 1 0 12.04 2Zm5.8 14.2c-.25.7-1.5 1.3-2.1 1.4-.55.1-1.25.2-4.3-1.4-3.6-1.9-5.9-5-6-5.2-.2-.2-1.4-1.9-1.4-3.7 0-1.9 1-2.8 1.4-3.2.4-.4.9-.5 1.2-.5h.9c.3 0 .7 0 1 .8.4 1 1.3 3.5 1.4 3.8.1.3.2.6 0 .9-.1.3-.2.5-.4.7-.2.2-.4.5-.6.7-.2.2-.4.5-.2.9.2.4 1 1.6 2.2 2.6 1.5 1.3 2.7 1.7 3.1 1.9.4.2.7.2 1-.1.3-.4 1.1-1.2 1.4-1.7.3-.5.6-.4 1-.2.4.2 2.5 1.2 2.9 1.4.4.2.7.3.8.5.1.2.1.7 0 1Z" />
  </Svg>
);

/* =========================================================
   БАЗОВІ КОМПОНЕНТИ
========================================================= */
const Field = ({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) => (
  <label className="block">
    <span className="block text-sm font-semibold text-[#0F2E64]">{label}</span>
    <div className="mt-1">{children}</div>
    {hint ? <span className="mt-1 block text-xs text-[#5A78B4]">{hint}</span> : null}
  </label>
);

function ContactCard({
  title,
  subtitle,
  icon,
  items,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  items: { label: string; href: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className={`${CARD_PAD_SM} flex flex-col gap-3`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-[#0F2E64] font-extrabold">{title}</div>
          {subtitle ? <div className="text-[#5A78B4] text-sm">{subtitle}</div> : null}
        </div>
      </div>
      <div className="flex flex-col">
        {items.map((it, idx) => {
          const isExternal = /^https?:|^mailto:|^tel:/i.test(it.href);
          const cls =
            'inline-flex items-center gap-2 py-1 text-[#1345DE] hover:underline';
          return isExternal ? (
            <a
              key={idx}
              href={it.href}
              className={cls}
              target={it.href.startsWith('http') ? '_blank' : undefined}
              rel={it.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {it.icon ?? null}
              {it.label}
            </a>
          ) : (
            <Link key={idx} href={it.href} className={cls}>
              {it.icon ?? null}
              {it.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <div className={CARD_PAD}>
      <div className="text-[#0F2E64] text-sm">{v}</div>
      <div className="text-[#1345DE] font-extrabold text-3xl leading-tight">{k}</div>
      <div className="text-slate-700 mt-1">{d}</div>
    </div>
  );
}

function TrustItem({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div className="text-[#0F2E64] font-extrabold">{title}</div>
      <div className="text-slate-700 mt-1">{text}</div>
    </div>
  );
}

/* =========================================================
   ДАНІ
========================================================= */
const faqData = [
  {
    q: 'Як швидко ви відповідаєте?',
    a: 'У робочі години — зазвичай протягом 15–30 хвилин. У вихідні — у месенджерах упродовж дня.',
  },
  {
    q: 'Чи можу я повернути кошти за курс?',
    a: 'Так, у межах політики повернення. Напишіть у підтримку — підкажемо деталі саме по вашому кейсу.',
  },
  { q: 'Чи видаєте сертифікати?', a: 'Так, після успішного завершення програми видаємо іменний сертифікат.' },
];

/* =========================================================
   СТОРІНКА
========================================================= */
export default function ContactsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'Питання щодо курсів',
    phone: '',
    message: '',
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if ((e.target as HTMLInputElement).type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((s) => ({ ...s, [name]: checked }));
    } else {
      setFormData((s) => ({ ...s, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!formData.agree) {
      setStatus({ type: 'error', message: 'Потрібно погодитись з політикою конфіденційності.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          topic: formData.topic,
          phone: formData.phone,
          message: formData.message,
        }),
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Ваше повідомлення успішно надіслано!' });
        setFormData({
          name: '',
          email: '',
          topic: 'Питання щодо курсів',
          phone: '',
          message: '',
          agree: false,
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus({
          type: 'error',
          message: 'Помилка відправки: ' + ((data as any)?.error || res.status),
        });
      }
    } catch {
      setStatus({ type: 'error', message: 'Помилка з’єднання з сервером.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      {/* HERO */}
      <section className="w-[1280px] mx-auto pt-[159px]">
        <div
          className="w-[1047px] mx-auto grid"
          style={{ gridTemplateColumns: '461px 564px', columnGap: '22px', alignItems: 'start' }}
        >
          {/* Ліва колонка — заголовок + підзаголовок + CTA */}
          <div className="w-[461px]">
            <h1 className="m-0 w-[423px] font-[Afacad] font-bold text-[96px] leading-[128px] text-[#021C4E]">
              Контакти
            </h1>

            <p
              className="w-[461px] font-[Mulish] font-medium text-[24px] leading-[30px] text-black"
              style={{ marginTop: `${207 - 81 - 128}px` }}
            >
              Ми на зв’язку: обери зручний спосіб і напиши нам — відповімо протягом робочих годин.
            </p>

            <div className="mt-[22px] flex gap-3">
              <Link
                href="#contact-form"
                className="inline-flex items-center justify-center w-[258px] h-[55px] bg-[#1345DE] text-white rounded-[10px] font-[Mulish] font-semibold text-[14px]"
              >
                Написати нам
              </Link>
              <a
                href="tel:+380441234567"
                className="inline-flex items-center gap-2 px-4 h-[55px] rounded-[10px] border border-[#1345DE] text-[#1345DE] font-[Mulish] font-semibold text-[14px]"
                aria-label="Подзвонити нам"
              >
                <PhoneIcon /> +380 (44) 123-45-67
              </a>
            </div>

            {/* Плашка — години роботи */}
            <div
              className="mt-6 flex items-center gap-3 rounded-[14px] bg-white/80 ring-1 ring-[#E5ECFF] p-3 shadow-[0_6px_22px_rgba(2,28,78,0.08)]"
              aria-label="Графік роботи"
            >
              <ClockIcon />
              <div className="text-[#0F2E64] text-sm">
                <div className="font-bold">Графік: Пн–Пт, 09:00–18:00</div>
                <div className="opacity-80">Сб–Нд — відповідаємо у месенджерах</div>
              </div>
            </div>
          </div>

          {/* Права колонка — картки контактних каналів */}
          <div
            className="w-[564px] h-auto grid"
            style={{
              gridTemplateColumns: '308px 239px',
              gridAutoRows: 'auto',
              columnGap: '17px',
              rowGap: '19px',
            }}
          >
            <ContactCard
              title="Email"
              subtitle="Відповідь до 1 роб. дня"
              icon={<MailIcon />}
              items={[
                { label: 'Підтримка', href: 'mailto:support@brainboost.ua' },
                { label: 'Партнерства', href: 'mailto:partners@brainboost.ua' },
              ]}
            />
            <ContactCard
              title="Месенджери"
              subtitle="Швидкий зв’язок"
              icon={<TelegramIcon />}
              items={[
                { label: 'Telegram', href: 'https://t.me/brainboost' },
                { label: 'WhatsApp', href: 'https://wa.me/380441234567', icon: <WhatsAppIcon /> },
              ]}
            />
            <ContactCard
              title="Телефон"
              subtitle="Пн–Пт, 09:00–18:00"
              icon={<PhoneIcon />}
              items={[
                { label: '+380 (44) 123-45-67', href: 'tel:+380441234567' },
                { label: '+380 (67) 987-65-43', href: 'tel:+380679876543' },
              ]}
            />
            <ContactCard
              title="Офіс"
              subtitle="Київ, Балтійська, 23А"
              icon={<MapPinIcon />}
              items={[{ label: 'Побудувати маршрут', href: '#map' }]}
            />
          </div>
        </div>
      </section>

      {/* Швидкі контакти */}
      <section className="mt-12">
        <div className="mx-auto max-w-[1200px] px-6 md:px-[118px] grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard k="24/7" v="чат-бот" d="Базові питання вирішуємо миттєво" />
          <StatCard k="~15 хв" v="середній SLA" d="В робочий час відповідаємо дуже швидко" />
          <StatCard k="98%" v="задоволених" d="За результатами опитувань студентів" />
        </div>
      </section>

      {/* Форма */}
      <section id="contact-form" className="py-12">
        <div className="mx-auto max-w-[1160px] px-6 md:px-[118px]">
          <div className="rounded-[24px] bg-white ring-1 ring-[#E5ECFF] shadow-[0_10px_30px_rgba(2,28,78,0.08)] p-6 md:p-8">
            <h2 className="text-[#0F2E64] font-extrabold text-[28px] md:text-[32px]">Напишіть нам</h2>
            <p className="text-slate-700 mt-1">Заповніть форму — ми відповімо протягом робочого дня.</p>

            {status && (
              <div
                className={`mt-4 p-3 rounded ${
                  status.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
                role="status"
                aria-live="polite"
              >
                {status.message}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5"
              noValidate
            >
              <Field label="Ім’я">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ваше ім’я"
                  className="w-full rounded-[12px] ring-1 ring-[#E5ECFF] p-3 outline-none focus:ring-[#1345DE]"
                />
              </Field>
              <Field label="Email" hint="На цю адресу ми надішлемо відповідь">
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@mail.com"
                  className="w-full rounded-[12px] ring-1 ring-[#E5ECFF] p-3 outline-none focus:ring-[#1345DE]"
                />
              </Field>
              <Field label="Тема звернення">
                <select
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className="w-full rounded-[12px] ring-1 ring-[#E5ECFF] p-3 outline-none focus:ring-[#1345DE]"
                >
                  <option>Питання щодо курсів</option>
                  <option>Оплата та рахунки</option>
                  <option>Партнерство</option>
                  <option>Преса/ЗМІ</option>
                  <option>Інше</option>
                </select>
              </Field>
              <Field label="Телефон (необов’язково)">
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                  placeholder="+380…"
                  className="w-full rounded-[12px] ring-1 ring-[#E5ECFF] p-3 outline-none focus:ring-[#1345DE]"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Повідомлення">
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Коротко опишіть питання"
                    className="w-full rounded-[12px] ring-1 ring-[#E5ECFF] p-3 outline-none focus:ring-[#1345DE]"
                  />
                </Field>
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    name="agree"
                    type="checkbox"
                    checked={formData.agree}
                    onChange={handleChange}
                    className="accent-[#1345DE]"
                  />
                  Згоден з політикою конфіденційності
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-[12px] bg-[#1345DE] px-6 py-3 text-white font-semibold hover:bg-[#0e2db9] transition"
                >
                  {loading ? 'Надсилаю…' : 'Надіслати'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Офіс / Карта */}
      <section id="map" className="pb-12">
        <div className="mx-auto max-w-[1160px] px-6 md:px-[118px] grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6">
          <div className={CARD_PAD}>
            <h3 className="text-[#0F2E64] font-extrabold text-[22px]">Наш офіс</h3>
            <p className="mt-2 text-slate-700">Київ, вулиця Балтійська, 23А</p>
            <div className="mt-3 text-sm text-slate-600 space-y-1">
              <div>Пн–Пт: 09:00–18:00</div>
              <div>Сб–Нд: вихідні</div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <a
                className="text-[#1345DE] font-semibold hover:underline"
                href="https://maps.google.com/?q=Київ,Балтійська,23А"
                target="_blank"
                rel="noopener noreferrer"
              >
                Відкрити в Картах Google
              </a>
              <a
                className="text-[#1345DE] hover:underline"
                href="https://maps.apple.com/?q=Київ,Балтійська,23А"
                target="_blank"
                rel="noopener noreferrer"
              >
                Відкрити в Apple Maps
              </a>
            </div>
          </div>
          <div className="rounded-[20px] overflow-hidden ring-1 ring-[#E5ECFF] shadow-[0_8px_24px_rgba(2,28,78,0.06)] bg-white">
            <iframe
              title="Карта офісу Brainboost"
              src={`https://www.google.com/maps?q=${encodeURIComponent('Київ, Балтійська 23А')}&output=embed`}
              className="w-full min-h-[300px] md:h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-14">
        <div className="mx-auto max-w-[1160px] px-6 md:px-[118px]">
          <h3 className="text-[#0F2E64] font-extrabold text-[28px] md:text-[32px]">Поширені питання</h3>
          <div className="mt-6 space-y-3">
            {faqData.map((f, i) => (
              <div key={i} className="rounded-[16px] bg-white ring-1 ring-[#E5ECFF] overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-panel-${i}`}
                >
                  <span className="font-semibold text-[#0F2E64]">{f.q}</span>
                  <span className="text-[#1345DE] font-bold">{openFaq === i ? '−' : '+'}</span>
                </button>
                <div
                  id={`faq-panel-${i}`}
                  className={`px-4 pb-4 text-slate-700 ${openFaq === i ? 'block' : 'hidden'}`}
                >
                  {f.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA месенджери */}
      <section className="pb-16">
        <div className="mx-auto max-w-[1160px] px-6 md:px-[118px] grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="https://t.me/brainboost"
            target="_blank"
            rel="noopener noreferrer"
            className={`${CARD_PAD} flex items-center gap-4 hover:ring-[#1345DE] transition`}
          >
            <TelegramIcon />
            <div>
              <div className="text-[#0F2E64] font-extrabold">Telegram</div>
              <div className="text-slate-700 text-sm">
                Швидкі відповіді менеджера, статус замовлення, консультації
              </div>
            </div>
          </a>
          <a
            href="https://wa.me/380441234567"
            target="_blank"
            rel="noopener noreferrer"
            className={`${CARD_PAD} flex items-center gap-4 hover:ring-[#1345DE] transition`}
          >
            <WhatsAppIcon />
            <div>
              <div className="text-[#0F2E64] font-extrabold">WhatsApp</div>
              <div className="text-slate-700 text-sm">
                Питання щодо курсів та оплат, швидка допомога
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Довіра */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1160px] px-6 md:px-[118px]">
          <div className="rounded-[24px] bg-white ring-1 ring-[#E5ECFF] p-6 md:p-8 shadow-[0_10px_30px_rgba(2,28,78,0.08)] grid grid-cols-1 md:grid-cols-3 gap-6">
            <TrustItem title="Офіційний договір" text="Робимо та надсилаємо документи на запит" />
            <TrustItem title="Захист персональних даних" text="Дотримуємось GDPR та локального законодавства" />
            <TrustItem title="Безпечна оплата" text="Платежі через захищені платіжні шлюзи" />
          </div>
        </div>
      </section>
    </main>
  );
}
