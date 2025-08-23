'use client';

import React from 'react';
import Link from 'next/link';

function Tile({ src }: { src: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: '1.4px solid #1345DE',   // тонша синя рамка
        borderRadius: 20,
        overflow: 'hidden',
        boxSizing: 'border-box',        // ключ, щоб рамка не ламала розміри
      }}
    >
      <img
        src={src}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}

export default function HomePage() {
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
      {/* сцена по центру */}
      <section style={{ width: 1280, margin: '0 auto', paddingTop: 159 }}>
        {/* внутрішній кадр 461 + 22 + 564 = 1047 */}
        <div
          style={{
            width: 1047,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '461px 564px',
            columnGap: 22,
            alignItems: 'start',
          }}
        >
          {/* ліва колонка */}
          <div style={{ width: 461 }}>
            <h1
              style={{
                margin: 0,
                width: 423,
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
                marginTop: 207 - 81 - 128,    // як у макеті
                width: 461,
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

            {/* 2000+ відгуків — під заголовком/кнопкою */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 400 - 292 - 55 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src="/images/ava1.png" style={av} />
                <img src="/images/ava2.png" style={{ ...av, marginLeft: -25 }} />
                <img src="/images/ava3.png" style={{ ...av, marginLeft: -25 }} />
              </div>
              <div style={{ fontFamily: 'Mulish', color: '#000' }}>
                <div style={{ fontWeight: 700, fontSize: 24, lineHeight: '30px' }}>2000+ Задоволенних</div>
                <div style={{ fontWeight: 700, fontSize: 24, lineHeight: '30px' }}>відгуків від учнів</div>
              </div>
            </div>
          </div>

          {/* права колонка — фотосітка БЕЗ ДІРОК */}
          <div style={{ width: 564, height: 473 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '308px 239px', // 308 + 239 + 17 = 564
                gridAutoRows: '227px',              // 227 + 227 + 19 = 473
                columnGap: 17,
                rowGap: 19,
              }}
            >
              {/* 1 / 2 */}
              <Tile src="/images/hero-1.png" />
              <Tile src="/images/hero-2.png" />
              {/* 3 / 4 */}
              <Tile src="/images/hero-3.png" />
              <Tile src="/images/hero-4.png" />
            </div>
          </div>
        </div>

        {/* навігація під героєм */}
        <nav style={{ width: 1047, margin: '0 auto', marginTop: 595 - 159 - 227 }}>
          <ul
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 0,
              margin: 0,
              listStyle: 'none',
              gap: 0,
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
              <li key={label} style={{ flex: 1, textAlign: 'center' }}>
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


        {/* текстовий блок */}
        <section style={{ width: 1047, margin: '0 auto', marginTop: 742 - 595 }}>
          <h2 style={{ fontFamily: 'Mulish', fontWeight: 700, fontSize: 36, lineHeight: '30px', color: '#000' }}>
            Наші програми навчання
          </h2>
          <p
            style={{
              width: 853,
              fontFamily: 'Mulish',
              fontWeight: 500,
              fontSize: 24,
              lineHeight: '30px',
              color: '#000',
              marginTop: 20,
            }}
          >
            Світ змінюється — і ми разом із ним. Ми створюємо навчальні програми, які відповідають реальним потребам
            ринку, щоб люди могли здобути професію майбутнього й заробляти онлайн звідусіль. <strong>Наша мета</strong> —
            відкрити двері до свободи та фінансової незалежності для десятків тисяч людей.
          </p>
        </section>
      </section>
    </main>
  );
}

const av: React.CSSProperties = { width: 70, height: 70, borderRadius: '50%', display: 'block' };
