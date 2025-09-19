'use client';

import React from 'react';
import Link from 'next/link';
import { FixedImg } from './FixedImg';

export type CourseItem = {
  id: number;
  title: string;
  image?: string | null;
  description?: string;
};

export function ProgramsRibbon({ courses }: { courses: CourseItem[] }) {
  const items = (courses || []).slice(0, 6);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const GAP_DESKTOP = 40;
  const CARD_W_DESKTOP = 308;
  const CARD_H_DESKTOP = 260;

  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const CARD_W = isMobile ? CARD_W_DESKTOP * 0.7 : CARD_W_DESKTOP;
  const CARD_H = isMobile ? CARD_H_DESKTOP * 0.7 : CARD_H_DESKTOP;
  const GAP = isMobile ? GAP_DESKTOP * 0.5 : GAP_DESKTOP;
  const ITEM_W = CARD_W + GAP;
  const CONTAINER_H = CARD_H + 48;

  // Автопрокрутка (десктоп)
  React.useEffect(() => {
    if (isMobile) return; 
    const el = wrapRef.current;
    if (!el || items.length < 2) return;

    const id = setInterval(() => {
      if (paused) return;
      const next = (index + 1) % items.length;
      el.scrollTo({ left: next * ITEM_W, behavior: 'smooth' });
      setIndex(next);
    }, 3600);

    return () => clearInterval(id);
  }, [index, items.length, paused, ITEM_W, isMobile]);

  const goTo = (i: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const next = (i + items.length) % items.length;
    setIndex(next);
    el.scrollTo({ left: next * ITEM_W, behavior: 'smooth' });
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Карусель */}
      <div
        ref={wrapRef}
        className="no-scrollbar"
        style={{
          width: '100%',
          height: CONTAINER_H,
          overflowX: 'auto',
          overflowY: 'hidden',
          display: 'flex',
          gap: GAP,
          scrollSnapType: 'x mandatory',
          padding: isMobile ? '0 16px' : '0',
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {items.map((c, i) => (
          <Link
            key={`${c.id}-${i}`}
            href={`/courses/${c.id}/details`}
            className="program-card-link"
            prefetch={false}
            style={{ flex: '0 0 auto', scrollSnapAlign: 'center' }}
          >
            <div
              className={`program-card ${i === index ? 'is-active' : ''}`}
              style={{ width: CARD_W, height: CARD_H }}
            >
              <FixedImg
                src={c.image || '/images/placeholder.png'}
                alt={c.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div
              style={{
                textAlign: 'center',
                marginTop: 6,
                fontWeight: 600,
                fontSize: isMobile ? 14 : 16,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {c.title}
            </div>
          </Link>
        ))}
      </div>

      {/* Кнопки каруселі (десктоп) */}
      {!isMobile && (
        <>
          <button
            type="button"
            className="carousel-btn"
            style={{ position: 'absolute', left: -54, top: '50%', transform: 'translateY(-50%)' }}
            onClick={() => goTo(index - 1)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-btn"
            style={{ position: 'absolute', right: -54, top: '50%', transform: 'translateY(-50%)' }}
            onClick={() => goTo(index + 1)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            ›
          </button>
        </>
      )}

      {/* ===== Кнопка "Всі курси" під карусель ===== */}
      <div style={{ textAlign: 'center', marginTop: isMobile ? 16 : 32 }}>
        <Link
          href="/courses"
          style={{
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: isMobile ? 180 : 232,
            height: 60,
            border: '3px solid #1345DE',
            borderRadius: 10,
            background: '#fff',
            fontFamily: 'Mulish, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: isMobile ? 14 : 16,
            color: '#1345DE',
            textDecoration: 'none',
            boxShadow: '0 6px 16px rgba(19,69,222,.16)',
            transition: 'transform .15s ease, box-shadow .15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(19,69,222,.25)';
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(19,69,222,.16)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          Всі курси
        </Link>
      </div>
    </div>
  );
}
