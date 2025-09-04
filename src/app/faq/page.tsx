'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ===== Types =====
type FAQItem = {
  id: string; // stable anchor-friendly id
  question: string;
  answer: string;
  category: string;
  keywords?: string[]; // optional search helpers
};

// ===== Data (sample) =====
const faqs: FAQItem[] = [
  {
    id: 'enroll-course',
    category: 'Курси',
    question: 'Як записатись на курс?',
    answer:
      'Щоб записатись на курс, відкрийте сторінку курсу та натисніть кнопку «Записатись». Після цього оформіть оплату та чекайте лист з деталями.',
    keywords: ['реєстрація', 'покупка', 'запис']
  },
  {
    id: 'trial-lessons',
    category: 'Курси',
    question: 'Чи є пробні заняття?',
    answer:
      'Так, у більшості курсів є безкоштовні пробні уроки. Це вказано у картці курсу.',
    keywords: ['демо', 'free', 'trial']
  },
  {
    id: 'payment-methods',
    category: 'Оплата',
    question: 'Які способи оплати доступні?',
    answer:
      'Ми приймаємо оплату банківськими картками, Apple Pay, Google Pay, PayPal, а також через безготівковий рахунок.',
    keywords: ['card', 'apple pay', 'google pay', 'paypal']
  },
  {
    id: 'refund-policy',
    category: 'Оплата',
    question: 'Чи можна повернути кошти?',
    answer:
      'Так, ми повертаємо кошти, якщо ви не почали навчання, або в перші 14 днів після старту курсу. Деталі — у Політиці повернень.',
    keywords: ['refund', 'повернення', 'гарантія']
  },
  {
    id: 'video-doesnt-load',
    category: 'Технічні питання',
    question: 'Чому відео не завантажується?',
    answer:
      'Переконайтесь, що у вас стабільне інтернет-з’єднання. Оновіть сторінку, очистьте кеш браузера або спробуйте інший браузер. Якщо проблема залишається — зверніться до підтримки.',
    keywords: ['відео', 'програвач', 'streaming']
  },
  {
    id: 'change-password',
    category: 'Технічні питання',
    question: 'Як змінити пароль?',
    answer:
      'Зайдіть у свій профіль → «Налаштування» → «Змінити пароль» та дотримуйтесь інструкцій.',
    keywords: ['password', 'login', 'account']
  }
];

// ===== Helpers =====
const ALL = 'Всі';

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function getCategoriesWithCounts(items: FAQItem[]) {
  const counts = new Map<string, number>();
  items.forEach((f) => counts.set(f.category, (counts.get(f.category) || 0) + 1));
  return [ALL, ...Array.from(counts.keys())].map((label) => ({
    label,
    count: label === ALL ? items.length : counts.get(label) || 0
  }));
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${safe})`, 'gi');
  return text.split(re).map((part, i) =>
    re.test(part) ? (
      <mark key={i} className="rounded px-1 py-0.5 bg-yellow-200/70">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

// ===== Page =====
export default function FAQPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-synced state
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('cat') || ALL;
  const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [openIds, setOpenIds] = useState<string[]>(hash ? [hash] : []);
  const [helpful, setHelpful] = useLocalStorage<Record<string, 'yes' | 'no' | undefined>>(
    'faq_helpful_v1',
    {}
  );

  // Derived data
  const categories = useMemo(() => getCategoriesWithCounts(faqs), []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return faqs.filter((f) => {
      const inCategory = activeCategory === ALL || f.category === activeCategory;
      if (!q) return inCategory;
      const pool = [f.question, f.answer, f.category, ...(f.keywords || [])]
        .join(' ')
        .toLowerCase();
      return inCategory && pool.includes(q);
    });
  }, [query, activeCategory]);

  // Sync URL on changes (shallow)
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (activeCategory && activeCategory !== ALL) params.set('cat', activeCategory);
    const qs = params.toString();
    router.replace(`?${qs}`, { scroll: false });
  }, [query, activeCategory, router]);

  // Open from hash on load or when hash changes
  useEffect(() => {
    if (!hash) return;
    setOpenIds((prev) => (prev.includes(hash) ? prev : [...prev, hash]));
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [hash]);

  // Keyboard shortcuts: '/' focuses search, Esc clears
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') setQuery('');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggle = useCallback((id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const expandAll = useCallback(() => setOpenIds(filtered.map((f) => f.id)), [filtered]);
  const collapseAll = useCallback(() => setOpenIds([]), []);

  const copyLink = useCallback(async (id: string) => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?${searchParams.toString()}#${id}`;
      await navigator.clipboard.writeText(url);
      // Quick toast via aria-live region
      const el = document.getElementById('toast');
      if (el) {
        el.textContent = 'Посилання скопійовано';
        setTimeout(() => (el.textContent = ''), 1600);
      }
    } catch {}
  }, [searchParams]);

  const markHelpful = useCallback(
    (id: string, v: 'yes' | 'no') => setHelpful((prev) => ({ ...prev, [id]: v })),
    [setHelpful]
  );

  // SEO: JSON-LD FAQPage
  const faqJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer }
      }))
    }),
    []
  );

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-center pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* HERO */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1000px] px-6 text-center">
          <h1 className="text-[#021C4E] font-extrabold text-[44px] md:text-[56px] leading-tight">Часті питання</h1>
          <p className="mt-4 text-slate-700 text-lg">Тут ми зібрали відповіді на найпопулярніші питання від студентів.</p>

          {/* Search */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="relative w-full md:w-[560px]">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Пошук по питаннях… (натисніть / щоб швидко перейти)"
                className="w-full rounded-[14px] border border-[#E5ECFF] px-5 py-3 text-lg shadow-sm focus:outline-none focus:border-[#1345DE] pr-10"
                aria-label="Пошук по питаннях"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                  aria-label="Очистити пошук"
                >
                  Очистити
                </button>
              )}
            </div>
            <div className="text-slate-500 text-sm">Підказка: натисніть <kbd className="rounded border px-1">/</kbd> щоб швидко перейти у поле пошуку</div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-10">
        <div className="mx-auto max-w-[1000px] px-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(({ label, count }) => (
              <button
                key={label}
                onClick={() => setActiveCategory(label)}
                className={classNames(
                  'px-4 py-2 rounded-[12px] text-sm font-semibold transition flex items-center gap-2',
                  activeCategory === label
                    ? 'bg-[#1345DE] text-white shadow'
                    : 'bg-white border border-[#E5ECFF] text-[#1345DE] hover:bg-[#EEF3FF]'
                )}
                aria-pressed={activeCategory === label}
              >
                <span>{label}</span>
                <span className={classNames('inline-flex items-center justify-center rounded-full text-xs px-2', activeCategory === label ? 'bg-white/20' : 'bg-[#EEF3FF] text-[#1345DE]')}>
                  {count}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button onClick={expandAll} className="text-sm underline underline-offset-4 text-[#1345DE] hover:opacity-80">Розкрити всі</button>
            <span className="text-slate-300">•</span>
            <button onClick={collapseAll} className="text-sm underline underline-offset-4 text-[#1345DE] hover:opacity-80">Згорнути всі</button>
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section>
        <div className="mx-auto max-w-[1000px] px-6 space-y-4">
          {filtered.length > 0 ? (
            filtered.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              const vote = helpful[faq.id];
              return (
                <div key={faq.id} id={faq.id} className="rounded-[16px] bg-white shadow-[0_4px_12px_rgba(2,28,78,0.08)] border border-[#E5ECFF]">
                  <button
                    onClick={() => toggle(faq.id)}
                    className="w-full flex justify-between items-center px-5 py-4 text-left"
                    aria-expanded={isOpen}
                    aria-controls={`${faq.id}-panel`}
                  >
                    <span className="font-semibold text-[#0F2E64] text-lg">
                      {highlight(faq.question, query)}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="text-[#1345DE] text-2xl select-none"
                      aria-hidden
                    >
                      +
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        id={`${faq.id}-panel`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-[#E5ECFF]"
                      >
                        <div className="px-5 py-4 text-slate-700 space-y-4">
                          <div className="leading-relaxed">{highlight(faq.answer, query)}</div>

                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <button
                              onClick={() => copyLink(faq.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50"
                              aria-label="Скопіювати посилання на це питання"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Копіювати посилання
                            </button>

                            <span className="text-slate-300">•</span>

                            <span className="text-slate-500">Це було корисно?</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => markHelpful(faq.id, 'yes')}
                                className={classNames(
                                  'rounded-md px-3 py-1.5 border text-sm',
                                  vote === 'yes'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 hover:bg-slate-50'
                                )}
                                aria-pressed={vote === 'yes'}
                              >
                                Так
                              </button>
                              <button
                                onClick={() => markHelpful(faq.id, 'no')}
                                className={classNames(
                                  'rounded-md px-3 py-1.5 border text-sm',
                                  vote === 'no'
                                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                                    : 'border-slate-200 hover:bg-slate-50'
                                )}
                                aria-pressed={vote === 'no'}
                              >
                                Ні
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl bg-white border border-[#E5ECFF] p-8 text-center">
              <p className="text-slate-600">Нічого не знайдено за запитом «{query}».</p>
              <p className="mt-2 text-slate-500 text-sm">Спробуйте змінити формулювання або оберіть іншу категорію.</p>
            </div>
          )}

          <div id="toast" role="status" aria-live="polite" className="sr-only" />
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16">
        <div className="mx-auto max-w-[800px] px-6 text-center">
          <div className="rounded-[20px] bg-[#0D2B6B] p-10 text-white shadow-lg">
            <h3 className="text-[24px] font-bold">Не знайшли відповідь?</h3>
            <p className="mt-3 text-blue-100">Напишіть нам у підтримку, і ми допоможемо вам вирішити будь-яке питання.</p>
            <Link
              href="/contacts"
              className="mt-5 inline-flex items-center justify-center rounded-[14px] bg-[#1345DE] px-6 py-3 text-white font-semibold hover:bg-[#0e2db9] transition"
            >
              Напишіть нам
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
