'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import http, { API_BASE } from '@/lib/http'; // ← використовуємо твій клієнт (токени + refresh)

type Props = { courseId: string };

// Візуальні плани (НЕ впливають на ціну — чисто UI)
const PLANS = [
  { id: 'basic',  title: 'Basic',  features: ['Доступ до курсу', 'Домашні завдання'] },
  { id: 'pro',    title: 'Pro',    features: ['Все з Basic', 'Q&A-сесії', 'Перевірка портфоліо'] },
  { id: 'mentor', title: 'Mentor', features: ['Все з Pro', '1:1 менторинг', 'Допомога з працевлаштуванням'] },
] as const;

const CURRENCY: 'USD' = 'USD';

type CourseLike = {
  id?: number | string;
  title?: string;        // бажане поле з бекенду
  name?: string;         // іноді так
  course_title?: string; // або так
  price?: number | string;
  final_price?: number | string;
  discount_price?: number | string;
  currency?: string;
};

export default function CheckoutClient({ courseId }: Props) {
  const [plan, setPlan] = useState<typeof PLANS[number]['id']>('pro');
  const [promo, setPromo] = useState('');
  const [submitting, setSubmitting] = useState<'paypal' | 'crypto' | null>(null);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const [course, setCourse] = useState<CourseLike | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  // 1) Підтягнути дані курсу з БЕКУ (через http → автоматично підставить токен і оновить при 401)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCourse(true);
      setStatus(null);
      try {
        // приклад: /courses/<id>/
        const res = await http.get(`/courses/${courseId}/`);
        if (!cancelled) setCourse(res.data as CourseLike);
      } catch (e: any) {
        if (!cancelled)
          setStatus({
            type: 'err',
            msg:
              e?.response?.data?.detail ||
              e?.message ||
              'Не вдалося завантажити дані курсу',
          });
      } finally {
        if (!cancelled) setLoadingCourse(false);
      }
    })();
    return () => { cancelled = true; };
  }, [courseId]);

  // Визначаємо назву та ціну з того, що прислав бек
  const courseTitle =
    course?.title || course?.name || course?.course_title || `Курс #${courseId}`;

  const rawPrice =
    toNum(course?.final_price) ??
    toNum(course?.discount_price) ??
    toNum(course?.price);

  // Якщо бек ще не віддав ціну — тимчасово $0 (або можна приховати кнопку)
  const coursePrice = typeof rawPrice === 'number' ? rawPrice : 0;
  const currency = (course?.currency as string) || CURRENCY;

  // Проста знижка з промокодом (локально)
  const discount = useMemo(() => {
    const p = promo.trim().toUpperCase();
    if (!p) return 0;
    if (p === 'BB10') return 0.1;
    if (p === 'BB20') return 0.2;
    return 0;
  }, [promo]);

  const discountAmount = round2(coursePrice * discount);
  const fees = 0;
  const total = Math.max(0, round2(coursePrice - discountAmount + fees));

  async function payViaPayPal() {
    setStatus(null);
    setSubmitting('paypal');
    try {
      // Дзеркалимо бек-ендпоінт (з твоїх urls.py):
      // path('paypal/create/', PayPalCreatePaymentView.as_view())
      const { data } = await http.post('/api/payments/paypal/create/', {
        amount: total,
        currency,
        description: `Оплата курсу: ${courseTitle}`,
      });

      // Підтримуємо обидва варіанти відповіді:
      // 1) { approval_url }
      // 2) { links: [ { rel: 'approve', href }, ... ] }  (PayPal v2)
      const approvalUrl =
        data?.approval_url ||
        (Array.isArray(data?.links)
          ? data.links.find((l: any) => /approve|payer-action/i.test(l?.rel))?.href
          : null);

      if (!approvalUrl) {
        throw new Error('Не отримали approval URL від PayPal.');
      }
      window.location.href = approvalUrl;
    } catch (e: any) {
      setStatus({
        type: 'err',
        msg:
          e?.response?.data?.error ||
          e?.message ||
          'Помилка оплати через PayPal',
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function payViaCoinbase() {
    setStatus(null);
    setSubmitting('crypto');
    try {
      // path('create-crypto-payment/', CoinbasePaymentView.as_view())
      const { data } = await http.post('/payments/create-crypto-payment/', {
        name: courseTitle,
        description: `Crypto оплата курсу: ${courseTitle}`,
        amount: total,
        currency,
      });

      if (!data?.hosted_url) {
        throw new Error('Не отримали hosted_url від Coinbase.');
      }
      window.location.href = data.hosted_url as string;
    } catch (e: any) {
      setStatus({
        type: 'err',
        msg:
          e?.response?.data?.error ||
          e?.message ||
          'Помилка оплати криптовалютою',
      });
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <section className="w-[1280px] mx-auto pt-[120px] pb-12">
        <div className="w-[1047px] mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
            <div>
              <h1 className="font-[Afacad] text-[64px] leading-[72px] font-bold text-[#021C4E] m-0">
                Оформлення замовлення
              </h1>
              <p className="mt-2 font-[Mulish] text-[18px] text-black">
                {loadingCourse ? 'Завантажуємо курс…' : (
                  <>Курс: <span className="font-bold">{courseTitle}</span></>
                )}
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center h-[46px] px-4 rounded-[10px] border border-[#1345DE] text-[#1345DE] font-[Mulish] font-semibold"
            >
              ← Повернутись до курсів
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 mt-8">
            {/* LEFT */}
            <div className="space-y-6">
              {/* Візуальні плани */}
              <div className="rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)]">
                <div className="text-[#0F2E64] font-extrabold text-[22px]">Оберіть план (візуально)</div>
                <p className="text-slate-600 text-sm mt-1">
                  Ціна береться з курсу; плани — для вибору формату (для вас/ментора/про).
                </p>
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  {PLANS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlan(p.id)}
                      className={`text-left rounded-[14px] p-4 ring-1 transition ${
                        plan === p.id
                          ? 'bg-[#EEF3FF] ring-[#1345DE]'
                          : 'bg-white ring-[#E5ECFF] hover:ring-[#1345DE]'
                      }`}
                    >
                      <div className="text-[#0F2E64] font-extrabold">{p.title}</div>
                      <ul className="mt-2 text-sm text-slate-700 space-y-1">
                        {p.features.map((f) => (
                          <li key={f}>• {f}</li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>

              {/* Промокод */}
              <div className="rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)]">
                <div className="text-[#0F2E64] font-extrabold">Промокод</div>
                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  <input
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    placeholder="Напр.: BB10"
                    className="flex-1 rounded-[12px] ring-1 ring-[#E5ECFF] px-3 py-2 outline-none focus:ring-[#1345DE]"
                  />
                  <div className="grid place-items-center px-3 py-2 rounded-[12px] bg-[#EEF3FF] text-[#1345DE] ring-1 ring-[#E5ECFF]">
                    {discount > 0 ? `Знижка ${(discount * 100).toFixed(0)}%` : 'Без знижки'}
                  </div>
                </div>
              </div>

              {/* Методи оплати */}
              <div className="rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5 shadow-[0_8px_24px_rgba(2,28,78,0.06)]">
                <div className="text-[#0F2E64] font-extrabold">Оплата</div>
                <p className="text-slate-700 text-sm mt-1">
                  Після успішної оплати доступ відкриється автоматично або ми надішлемо інструкції на email.
                </p>

                {status && (
                  <div
                    className={`mt-3 p-3 rounded ${
                      status.type === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {status.msg}
                  </div>
                )}

                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <button
                    onClick={payViaPayPal}
                    disabled={submitting !== null || loadingCourse || total <= 0}
                    className="inline-flex items-center justify-center gap-2 h-[50px] rounded-[12px] bg-[#1345DE] text-white font-semibold hover:bg-[#0e2db9] transition disabled:opacity-60"
                  >
                    {submitting === 'paypal' ? 'Зачекайте…' : 'Оплатити через PayPal'}
                  </button>

                  <button
                    onClick={payViaCoinbase}
                    disabled={submitting !== null || loadingCourse || total <= 0}
                    className="inline-flex items-center justify-center gap-2 h-[50px] rounded-[12px] border border-[#1345DE] text-[#1345DE] font-semibold hover:bg-[#EEF3FF] transition disabled:opacity-60"
                  >
                    {submitting === 'crypto' ? 'Зачекайте…' : '💸 Оплатити в криптовалюті'}
                  </button>
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  Натискаючи «Оплатити», ви погоджуєтесь з{' '}
                  <Link href="/policy" className="text-[#1345DE] underline">
                    політикою конфіденційності
                  </Link>{' '}
                  та умовами оферти.
                </div>
              </div>

              {/* Гарантія/довіра */}
              <div className="grid md:grid-cols-3 gap-4">
                <InfoCard title="14 днів гарантії" text="Повернення коштів за умовами політики." />
                <InfoCard title="Захищена оплата" text="Шифрування та 3-D Secure на платіжних шлюзах." />
                <InfoCard title="Миттєвий доступ" text="Одразу після підтвердження платежу." />
              </div>
            </div>

            {/* RIGHT: Order Summary */}
            <aside className="rounded-[20px] bg-white ring-1 ring-[#E5ECFF] p-5 h-max shadow-[0_8px_24px_rgba(2,28,78,0.06)]">
              <div className="text-[#0F2E64] font-extrabold text-[22px]">Ваше замовлення</div>
              <div className="mt-4 space-y-3">
                <Row k="Курс" v={loadingCourse ? '…' : courseTitle} />
                <Row k="План" v={PLANS.find((p) => p.id === plan)?.title || '—'} />
                <Row k="Валюта" v={currency} />
              </div>

              <hr className="my-4 border-[#E5ECFF]" />

              <div className="space-y-2">
                <Row k="Проміжний підсумок" v={fmt(currency, coursePrice)} />
                <Row k="Знижка" v={`− ${fmt(currency, discountAmount)}`} />
                {fees > 0 ? <Row k="Збори" v={fmt(currency, fees)} /> : null}
              </div>

              <div className="mt-4 p-3 rounded-[12px] bg-[#EEF3FF] ring-1 ring-[#E5ECFF]">
                <div className="text-[#0F2E64] text-sm">До сплати</div>
                <div className="text-[#1345DE] font-extrabold text-3xl leading-none mt-1">
                  {fmt(currency, total)}
                </div>
              </div>

              <ul className="mt-4 text-sm text-slate-700 list-disc pl-5 space-y-1">
                <li>Після оплати на email прийдуть інструкції.</li>
                <li>Надсилаємо чек та договір-оферту.</li>
                <li>Питання? Напишіть у <a href="https://t.me/brainboost" className="text-[#1345DE] underline">Telegram</a>.</li>
              </ul>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ——— дрібні підкомпоненти / утиліти ——— */
function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[16px] bg-white ring-1 ring-[#E5ECFF] p-4 shadow-[0_6px_18px_rgba(2,28,78,0.06)]">
      <div className="text-[#0F2E64] font-extrabold">{title}</div>
      <div className="text-slate-700 mt-1">{text}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{k}</span>
      <span className="text-[#0F2E64] font-semibold">{v}</span>
    </div>
  );
}
function toNum(x: unknown): number | null {
  if (x == null) return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function fmt(curr: string, n: number) {
  return `${curr === 'USD' ? '$' : ''}${n.toFixed(2)}${curr !== 'USD' ? ` ${curr}` : ''}`;
}
