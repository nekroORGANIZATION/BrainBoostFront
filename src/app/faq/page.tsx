'use client';

import { useState } from 'react';
import Link from 'next/link';

type FAQItem = {
  question: string;
  answer: string;
  category: string;
};

const faqs: FAQItem[] = [
  {
    category: 'Курси',
    question: 'Як записатись на курс?',
    answer:
      'Щоб записатись на курс, відкрийте сторінку курсу та натисніть кнопку "Записатись". Після цього оформіть оплату та чекайте лист з деталями.',
  },
  {
    category: 'Курси',
    question: 'Чи є пробні заняття?',
    answer: 'Так, у більшості курсів є безкоштовні пробні уроки. Це вказано у картці курсу.',
  },
  {
    category: 'Оплата',
    question: 'Які способи оплати доступні?',
    answer:
      'Ми приймаємо оплату банківськими картками, Apple Pay, Google Pay, PayPal, а також через безготівковий рахунок.',
  },
  {
    category: 'Оплата',
    question: 'Чи можна повернути кошти?',
    answer:
      'Так, ми повертаємо кошти, якщо ви не почали навчання, або в перші 14 днів після старту курсу. Деталі в Політиці повернень.',
  },
  {
    category: 'Технічні питання',
    question: 'Чому відео не завантажується?',
    answer:
      'Переконайтесь, що у вас стабільне інтернет-з’єднання. Якщо проблема залишається — зверніться до підтримки.',
  },
  {
    category: 'Технічні питання',
    question: 'Як змінити пароль?',
    answer:
      'Зайдіть у свій профіль, оберіть "Налаштування", потім "Змінити пароль" та дотримуйтесь інструкцій.',
  },
];

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Всі');

  const categories = ['Всі', ...Array.from(new Set(faqs.map((f) => f.category)))];

  const toggleFAQ = (index: number) => {
    setOpenIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const filteredFAQs = faqs.filter(
    (faq) =>
      (activeCategory === 'Всі' || faq.category === activeCategory) &&
      (faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-center pb-20">
      {/* HERO */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1000px] px-6 text-center">
          <h1 className="text-[#021C4E] font-extrabold text-[44px] md:text-[56px] leading-tight">
            Часті питання
          </h1>
          <p className="mt-4 text-slate-700 text-lg">
            Тут ми зібрали відповіді на найпопулярніші питання від студентів.
          </p>

          {/* Пошук */}
          <div className="mt-8">
            <input
              type="text"
              placeholder="Пошук по питаннях..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-[500px] rounded-[14px] border border-[#E5ECFF] px-5 py-3 text-lg shadow-sm focus:outline-none focus:border-[#1345DE]"
            />
          </div>
        </div>
      </section>

      {/* Категорії */}
      <section className="mb-10">
        <div className="mx-auto max-w-[1000px] px-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-[12px] text-sm font-semibold transition ${
                  activeCategory === cat
                    ? 'bg-[#1345DE] text-white'
                    : 'bg-white border border-[#E5ECFF] text-[#1345DE] hover:bg-[#EEF3FF]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Список */}
      <section>
        <div className="mx-auto max-w-[1000px] px-6 space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-[16px] bg-white shadow-[0_4px_12px_rgba(2,28,78,0.08)] border border-[#E5ECFF]"
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex justify-between items-center px-5 py-4 text-left"
                >
                  <span className="font-semibold text-[#0F2E64] text-lg">{faq.question}</span>
                  <span
                    className={`transition-transform ${
                      openIndexes.includes(idx) ? 'rotate-45' : ''
                    } text-[#1345DE] text-2xl`}
                  >
                    +
                  </span>
                </button>
                {openIndexes.includes(idx) && (
                  <div className="px-5 pb-4 text-slate-700 border-t border-[#E5ECFF]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500">Нічого не знайдено</p>
          )}
        </div>
      </section>

      {/* Блок "не знайшли відповідь?" */}
      <section className="mt-16">
        <div className="mx-auto max-w-[800px] px-6 text-center">
          <div className="rounded-[20px] bg-[#0D2B6B] p-10 text-white shadow-lg">
            <h3 className="text-[24px] font-bold">Не знайшли відповідь?</h3>
            <p className="mt-3 text-blue-100">
              Напишіть нам у підтримку, і ми допоможемо вам вирішити будь-яке питання.
            </p>
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
