// src/app/courses/page.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import http from '@/lib/http';
import { mediaUrl } from '@/lib/media';
import FooterCard from "@/components/FooterCard";

/* =========================================
   Types
========================================= */
type Course = {
  id: number;
  title: string;
  description?: string;
  image?: string | null;
  author: number | { id: number; username: string };
  rating?: number | string | null;
  price?: number | string | null;
  language?: number | string | { id?: number; name?: string; title?: string; code?: string; slug?: string };
  category?: number | { id: number; name: string } | null;
  total_lessons?: number;
  created_at?: string;
};
type Profile = { id: number; username: string; is_superuser: boolean; is_teacher: boolean };
type Category = { id: number; name: string };
type LangOption = { value: string; label: string; id?: number };
type LanguagesMap = Record<number, string>;

const PAGE_SIZE = 9;

/* =========================================
   Static featured
========================================= */
const FEATURED = [
  { href: '/flagmanCourses/design',      title: 'Графічний дизайн', image: '/images/graphicdesigncard.png', desc: 'Graphic Design, Photoshop, Illustrator…' },
  { href: '/flagmanCourses/marketing',   title: 'Маркетинг',        image: '/images/marketingcard.png',     desc: 'Бренд-стратегія, аналітика, ЦА…' },
  { href: '/flagmanCourses/programming', title: 'HTML/CSS',           image: '/images/programmingcard.png',    desc: 'HTML/CSS, середовище, налагодження…' },
] as const;

/* =========================================
   Helpers (pure)
========================================= */
function Stars({ value }: { value: number | string | null | undefined }) {
  const rating = Number(value) || 0;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="stars">
      {'★'.repeat(full)}{half && '⯪'}{'☆'.repeat(empty)}
      <style jsx>{`
        .stars { color: #f59e0b; user-select: none; }
      `}</style>
    </span>
  );
}

/* =========================================
   Section: FeaturedHero
========================================= */
function FeaturedHero() {
  return (
    <section className="featuredHero">
      <div className="heroHead heroHead--center">
        <div className="heroBadge">
          <h2 className="heroTitle">Курси від нас</h2>
        </div>
        <p className="heroSub">
          Добірка наших флагманських програм — практичні курси з дизайну, маркетингу та програмування
        </p>
      </div>

      <ul className="cards heroGrid">
        {FEATURED.map(f => (
          <li key={f.href} className="card card--hero">
            <Link href={f.href} className="cardLink" prefetch={false}>
              <div className="imgBox imgBox--hero">
                {f.image && <img src={f.image} alt={f.title} loading="lazy" />}
              </div>
              <div className="cardBody">
                <div className="textCol">
                  <h3 className="cardTitle">{f.title}</h3>
                  <p className="cardDesc">{f.desc}</p>
                </div>
                <div className="footerRow">
                  <span className="chip chipSoft">Топ вибір</span>
                  <span className="btnPrimary">Деталі</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <style jsx>{`
        /* ---- wrapper ---- */
        .featuredHero { max-width: 1280px; margin: 0 auto 44px; padding: 0 12px; }

        /* ---- head ---- */
        .heroHead { display: flex; flex-direction: column; align-items: center; gap: 12px; margin: 0 0 30px; }
        .heroBadge { position: relative; padding: 14px 24px; border-radius: 18px; background: linear-gradient(180deg, #ffffffcc, #f7faffcc); border: 1.5px solid #b6ccff; box-shadow: 0 10px 24px rgba(19, 69, 222, 0.15), 0 0 0 6px hsl(225 100% 94%) inset; }
        .heroBadge::after { content: ""; position: absolute; left: 50%; top: 50%; width: 90px; height: 110px; transform: translate(-50%, -50%) rotate(74deg); z-index: -2; border-radius: 14px; background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%); box-shadow: 0 12px 36px rgba(37, 99, 235, 0.25); }
        .heroBadge::before { content: ""; position: absolute; z-index: -3; left: 50%; top: 50%; width: 240px; height: 170px; transform: translate(-50%, -50%); background: radial-gradient(40% 60% at 30% 30%, #7c3aed1f 0%, transparent 70%), radial-gradient(50% 70% at 70% 60%, #2563eb1f 0%, transparent 75%); }
        .heroTitle { margin: 0; font-weight: 800; line-height: 1.2; text-align: center; color: #021c4e; font-size: clamp(22px, 2.8vw, 34px); }
        .heroSub { margin-top: 18px; text-align: center; max-width: 720px; font-weight: 600; color: #0b1437; opacity: 0.92; font-size: clamp(18px, 2.2vw, 20px); line-height: 1.5; }

        /* ---- grid ---- */
        .heroGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; list-style: none; padding: 0; margin: 0; }

        /* ---- cards ---- */
        .card { position: relative; background: linear-gradient(180deg, #ffffff, #f9fbff); border-radius: 16px; border: 1px solid rgba(2, 28, 78, 0.1); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.18s ease, box-shadow 0.22s ease, border-color 0.2s ease, filter 0.2s ease; box-shadow: 0 2px 6px rgba(2, 28, 78, 0.06), 0 10px 24px rgba(2, 28, 78, 0.11), 0 24px 48px rgba(2, 28, 78, 0.10), inset 0 0 0 1px rgba(19, 69, 222, 0.05); }
        .card:hover { transform: translateY(-6px); border-color: rgba(19, 69, 222, 0.22); filter: saturate(1.02); box-shadow: 0 4px 10px rgba(2, 28, 78, 0.08), 0 16px 36px rgba(2, 28, 78, 0.14), 0 34px 68px rgba(2, 28, 78, 0.16), 0 0 0 8px rgba(19, 69, 222, 0.06); }
        .cardLink { display: block; color: inherit; text-decoration: none; }
        .imgBox { height: 188px; background: #eef2ff; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
        .imgBox::after{ content:""; position:absolute; inset:0; background: linear-gradient(180deg, rgba(19,69,222,.06), transparent 35%); pointer-events:none; }
        .imgBox img { width: 100%; height: 100%; object-fit: cover; }
        .cardBody { padding: 16px; flex: 1; display: grid; grid-template-rows: 1fr auto; gap: 12px; }
        .textCol { min-height: 0; }
        .cardTitle { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px; letter-spacing: .1px; }
        .cardDesc { font-size: 14px; color: #475569; line-height: 1.55; margin: 0; }
        .footerRow{ display:flex; align-items:center; justify-content:space-between; gap: 10px; margin-top: 4px; }
        .chip{ display:inline-flex; align-items:center; gap:8px; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; border: 1px solid #dbe6ff; }
        .chipSoft{ background:#eef3ff; color:#1345de; }
        .btnPrimary { display: inline-flex; align-items:center; justify-content:center; padding: 9px 14px; border-radius: 12px; font-size: 14px; font-weight: 800; text-decoration: none; color: #fff; background: linear-gradient(45deg, #1345de, #2563eb); box-shadow: 0 2px 6px rgba(19, 69, 222, 0.25), 0 8px 22px rgba(19, 69, 222, 0.28); transition: transform .15s ease, box-shadow .2s ease, filter .2s ease; cursor: pointer; }
        .btnPrimary:hover { transform: translateY(-1px); background: linear-gradient(45deg, #0f36ba, #1e40af); box-shadow: 0 3px 8px rgba(19, 69, 222, 0.3), 0 12px 28px rgba(19, 69, 222, 0.35); filter: saturate(1.05); }

        @media (max-width: 860px) {
          .heroGrid { grid-template-columns: 1fr; gap: 16px; }
          .heroHead--center { padding: 0; }
          .heroSub { margin-top: 16px; }
        }
      `}</style>
    </section>
  );
}

/* =========================================
   Section: Header + Toolbar (All Courses)
========================================= */
function Toolbar({
  searchTerm, setSearchTerm,
  sortBy, setSortBy,
  filtersOpen, setFiltersOpen,
  onlyNew, setOnlyNew,
}: {
  searchTerm: string; setSearchTerm: (v: string)=>void;
  sortBy: string; setSortBy: (v: string)=>void;
  filtersOpen: boolean; setFiltersOpen: (v: (p:boolean)=>boolean) => void;
  onlyNew: boolean; setOnlyNew: (b:boolean)=>void;
}) {
  return (
    <div className="headerWrap">
      <div className="sectionHead">
        <h2 className="title">Всі курси</h2>
      </div>

      <div className="toolbar">
        <div className="left">
          <button
            className="mobFilters"
            onClick={() => setFiltersOpen(v => !v)}
            aria-expanded={filtersOpen}
          >
            ☰ Фільтри
          </button>

          <div className="searchWrap">
            <span className="icon">🔍</span>
            <input
              className="search"
              type="text"
              placeholder="Пошук курсу…"
              value={searchTerm}
              onChange={(e)=> setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="right">
          <label className="newToggle">
            <input
              type="checkbox"
              checked={onlyNew}
              onChange={(e)=> setOnlyNew(e.target.checked)}
            />
            <span>Нові</span>
          </label>

          <label>
            <span className="lbl">Сортування</span>
            <select value={sortBy} onChange={(e)=> setSortBy(e.target.value)}>
              <option value="-created_at">Новіші</option>
              <option value="created_at">Старіші</option>
              <option value="title">Назва (А-Я)</option>
              <option value="-rating">Рейтинг ↓</option>
              <option value="rating">Рейтинг ↑</option>
              <option value="-price">Ціна ↓</option>
              <option value="price">Ціна ↑</option>
            </select>
          </label>
        </div>
      </div>

      <style jsx>{`
        .headerWrap { max-width:1280px; margin:60px auto 40px; padding:0 20px; }
        .sectionHead { text-align:center; margin-bottom:26px; position:relative; }
        .title { margin:0; font-size:clamp(26px,3vw,34px); font-weight:900; color:#021c4e; text-shadow:0 1px 0 #fff, 0 3px 8px rgba(19,69,222,.15); }
        .title::after { content:""; display:block; width:120px; height:4px; margin:12px auto 0; border-radius:999px; background:linear-gradient(90deg,#1345de,#2563eb); box-shadow:0 4px 12px rgba(19,69,222,.35); animation: slideLine 3s infinite ease-in-out; }
        @keyframes slideLine { 0%,100% { transform:scaleX(0.7); opacity:.7; } 50% { transform:scaleX(1.1); opacity:1; } }

        .toolbar{ display:flex;align-items:center;justify-content:space-between;gap:16px; background:rgba(255,255,255,.65); border-radius:16px; padding:14px 18px; border:1px solid rgba(19,69,222,.14); box-shadow:0 8px 24px rgba(2,28,78,.08); }
        .left{display:flex;align-items:center;gap:14px;flex:1}
        .mobFilters{ display:none;border:none;border-radius:12px;padding:10px 14px; font-weight:800;background:linear-gradient(45deg,#1345de,#2563eb);color:#fff; box-shadow:0 4px 12px rgba(19,69,222,.25);cursor:pointer; }

        .searchWrap{position:relative;flex:1}
        .icon{ position:absolute;left:12px;top:50%; transform:translateY(-50%); opacity:0.6; transition: transform .3s; }
        .search:focus + .icon, .searchWrap:focus-within .icon { transform:translateY(-50%) scale(1.2); }
        .search{ width:100%; border:1px solid #e3e8ff; border-radius:12px; padding:10px 12px 10px 34px; background:#fff; font-size:15px; transition:border-color .2s, box-shadow .2s; }
        .search:focus{ outline:none; border-color:#1345de; box-shadow:0 0 0 4px rgba(19,69,222,.12); }

        .right{display:flex;align-items:center;gap:12px}
        .newToggle{display:flex;align-items:center;gap:6px;font-weight:800;color:#0f172a}
        .lbl{font-size:14px}
        select{ border:1px solid #dbe6ff;border-radius:12px;padding:8px 12px;background:#fff;font-weight:600; transition:border-color .15s, box-shadow .15s; }
        select:focus{ outline:none;border-color:#1345de; box-shadow:0 0 0 3px rgba(19,69,222,.12); }

        @media (max-width:640px){
          .toolbar{flex-direction:column;align-items:flex-start}
          .mobFilters{display:inline-block}
          .search{min-width:0;width:100%}
        }
      `}</style>
    </div>
  );
}

/* =========================================
   Section: AIStrip (grid 4-per-row)
========================================= */
/* =========================================
   Section: AIStrip — STATIC FLAGSHIP CARDS
   (показує FEATURED, без AI логіки)
========================================= */
function AIStrip({
  show, setShow,
}: {
  show: boolean; setShow: (v:(p:boolean)=>boolean)=>void;
}) {
  return (
    <div className="aiWrap aiWrap--roomy">
      <div className="aiRow">
        <span className="aiBadge">★</span>
        <div className="aiText">
          <strong>Рекомендації від ШІ*</strong>
        </div>
        <button className="aiBtn" onClick={()=>setShow(v=>!v)} aria-expanded={show}>
          {show ? 'Сховати' : 'Показати'}
        </button>
      </div>

      {show && (
        <div className="gridWrap">
          <ul className="cards heroGrid" aria-label="Флагманські курси">
            {FEATURED.map(f => (
              <li key={`flag-${f.href}`} className="card card--hero">
                <Link href={f.href} className="cardLink" prefetch={false}>
                  <div className="imgBox imgBox--hero">
                    {f.image && <img src={f.image} alt={f.title} loading="lazy" />}
                  </div>
                  <div className="cardBody">
                    <div className="textCol">
                      <h3 className="cardTitle">{f.title}</h3>
                      <p className="cardDesc">{f.desc}</p>
                    </div>
                    <div className="footerRow">
                      <span className="chip chipSoft">Топ вибір</span>
                      <span className="btnPrimary">Деталі</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .aiWrap{ max-width:1280px; margin:32px auto 24px; padding:18px; border-radius:18px;
          background:linear-gradient(90deg, rgba(124,58,237,.10), rgba(37,99,235,.08));
          border:1px solid rgba(124,58,237,.22); box-shadow:0 10px 28px rgba(2,28,78,.10); position:relative; }
        .aiWrap--roomy{ padding:22px 22px 24px; }
        .aiRow{ display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .aiBadge{ display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:999px; background: purple; color: white; font-weight:900; box-shadow:0 6px 16px rgba(128,0,128,.35); }
        .aiText{ flex:1; color:#0b1437; font-size:15px; }
        .muted{ opacity:.75; }
        .aiBtn{ border:0; border-radius:999px; padding:9px 16px; color:white; background: linear-gradient(45deg, purple, blue); font-weight:900; box-shadow:0 10px 24px rgba(37,99,235,.28); cursor:pointer; transition:transform .15s ease, filter .2s ease; }
        .aiBtn:hover{ transform:translateY(-1px); filter:saturate(1.05); }

        .gridWrap{ margin-top:12px; }

        /* стилі карток як у FeaturedHero, але локально для цієї секції */
        .heroGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; list-style: none; padding: 0; margin: 0; }
        .card { position: relative; background: linear-gradient(180deg, #ffffff, #f9fbff); border-radius: 16px; border: 1px solid rgba(2, 28, 78, 0.1); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.18s ease, box-shadow 0.22s ease, border-color 0.2s ease, filter 0.2s ease; box-shadow: 0 2px 6px rgba(2, 28, 78, 0.06), 0 10px 24px rgba(2, 28, 78, 0.11), 0 24px 48px rgba(2, 28, 78, 0.10), inset 0 0 0 1px rgba(19, 69, 222, 0.05); }
        .card:hover { transform: translateY(-6px); border-color: rgba(19, 69, 222, 0.22); filter: saturate(1.02); box-shadow: 0 4px 10px rgba(2, 28, 78, 0.08), 0 16px 36px rgba(2, 28, 78, 0.14), 0 34px 68px rgba(2, 28, 78, 0.16), 0 0 0 8px rgba(19, 69, 222, 0.06); }
        .cardLink { display: block; color: inherit; text-decoration: none; }
        .imgBox { height: 188px; background: #eef2ff; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
        .imgBox::after{ content:""; position:absolute; inset:0; background: linear-gradient(180deg, rgba(19,69,222,.06), transparent 35%); pointer-events:none; }
        .imgBox img { width: 100%; height: 100%; object-fit: cover; }
        .cardBody { padding: 16px; flex: 1; display: grid; grid-template-rows: 1fr auto; gap: 12px; }
        .textCol { min-height: 0; }
        .cardTitle { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px; letter-spacing: .1px; }
        .cardDesc { font-size: 14px; color: #475569; line-height: 1.55; margin: 0; }
        .footerRow{ display:flex; align-items:center; justify-content:space-between; gap: 10px; margin-top: 4px; }
        .chip{ display:inline-flex; align-items:center; gap:8px; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; border: 1px solid #dbe6ff; }
        .chipSoft{ background:#eef3ff; color:#1345de; }
        .btnPrimary { display: inline-flex; align-items:center; justify-content:center; padding: 9px 14px; border-radius: 12px; font-size: 14px; font-weight: 800; text-decoration: none; color: #fff; background: linear-gradient(45deg, #1345de, #2563eb); box-shadow: 0 2px 6px rgba(19, 69, 222, 0.25), 0 8px 22px rgba(19, 69, 222, 0.28); transition: transform .15s ease, box-shadow .2s ease, filter .2s ease; cursor: pointer; }
        .btnPrimary:hover { transform: translateY(-1px); background: linear-gradient(45deg, #0f36ba, #1e40af); box-shadow: 0 3px 8px rgba(19, 69, 222, 0.3), 0 12px 28px rgba(19, 69, 222, 0.35); filter: saturate(1.05); }

        @media (max-width: 1100px){ .heroGrid{ grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 720px){ .heroGrid{ grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}


/* =========================================
   Section: ChipsRow (active filters)
========================================= */
function ChipsRow({
  searchTerm, onClearAll,
  catMulti, catNameById, onToggleCat,
  langMulti, langLabelById, onToggleLang,
  priceMin, priceMax, maxCap, onResetPrice,
  minRating, setMinRating,
  minLessons, setMinLessons,
  onlyFree, setOnlyFree,
}: {
  searchTerm: string; onClearAll: ()=>void;
  catMulti: string[]; catNameById: Map<number,string>; onToggleCat: (id:string)=>void;
  langMulti: string[]; langLabelById: Map<string,string>; onToggleLang: (id:string)=>void;
  priceMin: number; priceMax: number; maxCap: number; onResetPrice: ()=>void;
  minRating: number; setMinRating: (n:number)=>void;
  minLessons: number; setMinLessons: (n:number)=>void;
  onlyFree: boolean; setOnlyFree: (b:boolean)=>void;
}) {
  const hasPrice = priceMin>0 || priceMax<maxCap;
  const hasSomething = searchTerm || catMulti.length || langMulti.length || hasPrice || onlyFree || minRating>0 || minLessons>0;
  if (!hasSomething) return null;

  return (
    <div className="chipsRow">
      {searchTerm && <span className="chip chip--muted">Пошук: “{searchTerm}”</span>}

      {catMulti.map(id=>{
        const label = catNameById.get(Number(id)) ?? `#${id}`;
        return <button key={`c-${id}`} className="chip" onClick={()=>onToggleCat(id)}>{label} ✕</button>;
      })}

      {langMulti.map(id=>{
        const label = langLabelById.get(String(id)) ?? `#${id}`;
        return <button key={`l-${id}`} className="chip" onClick={()=>onToggleLang(id)}>{label} ✕</button>;
      })}

      {hasPrice && (
        <button className="chip" onClick={onResetPrice}>Ціна: {priceMin}–{priceMax} ✕</button>
      )}
      {onlyFree && (
        <button className="chip" onClick={()=>setOnlyFree(false)}>Лише безкоштовні ✕</button>
      )}
      {minRating>0 && (
        <button className="chip" onClick={()=>setMinRating(0)}>Рейтинг {minRating}★+ ✕</button>
      )}
      {minLessons>0 && (
        <button className="chip" onClick={()=>setMinLessons(0)}>Уроків ≥ {minLessons} ✕</button>
      )}

      <button className="chip chip--clear" onClick={onClearAll}>Очистити</button>

      <style jsx>{`
        .chipsRow{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}
        .chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;border:1px solid #dbe6ff;background:#eef3ff;color:#1345de;font-weight:800;cursor:pointer}
        .chip--muted{background:#fff;color:#475569;border:1px solid #e5ecff;cursor:default}
        .chip--clear{background:#fff;color:#0f172a;border:1px dashed #cbd5e1}
      `}</style>
    </div>
  );
}

/* =========================================
   CoursesGrid (cards styled like AI)
========================================= */
function CoursesGrid({
  courses, getLangLabel,
}: {
  courses: Course[];
  getLangLabel: (c: Course)=>string;
}) {
  return (
    <>
      <ul className="cardsGrid">
        {courses.map(c=>{
          const price = Number(c.price ?? 0);
          const rating = Number(c.rating ?? 0);
          return (
            <li key={c.id} className="card card--elevated">
              <div className="media">
                {c.image ? <img src={String(c.image)} alt={c.title} loading="lazy" /> : <div className="ph">Без зображення</div>}
                <div className="topBadges" aria-hidden>
                  <span className="priceBadge">{price>0 ? `${price} грн` : 'Безкоштовно'}</span>
                  <span className="aiPick">Hot</span>
                </div>
                <span className="ratePill">★ {rating.toFixed(1)}</span>
              </div>

              <div className="body">
                <div className="text">
                  <h3 className="title" title={c.title}>{c.title}</h3>
                  <p className="subtitle">
                    {c.description?.slice(0, 120)}
                    {c.description && c.description.length > 120 ? '…' : ''}
                  </p>
                </div>

                <div className="metaRow">
                  <span className="langPill"><span className="dot" aria-hidden />{getLangLabel(c)}</span>
                  <Link href={`/courses/${c.id}/details`} className="noUnderline"><span className="btnPrimary">Деталі</span></Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <style jsx>{`
        .cardsGrid{ list-style:none; padding:0; margin:0; display:grid; gap:16px; grid-template-columns: repeat(3, minmax(0, 1fr)); }

        .card{ position:relative; display:grid; grid-template-rows:60% 40%; min-height:360px; background:linear-gradient(180deg,#fff,#f8faff);
          border-radius:18px; border:1px solid rgba(0,0,0,.06); box-shadow:0 3px 8px rgba(0,0,0,.07),0 14px 30px rgba(0,0,0,.12),inset 0 0 0 1px rgba(19,69,222,.05);
          transition:transform .2s ease, box-shadow .25s ease, border-color .2s ease; overflow:hidden; }
        .card--elevated:hover{ transform:translateY(-6px); border-color:rgba(19,69,222,.25); box-shadow:0 8px 16px rgba(0,0,0,.10),0 26px 52px rgba(0,0,0,.18),0 0 0 10px rgba(19,69,222,.10); }

        .media{ position:relative; width:100%; height:100%; overflow:hidden; }
        .media img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; display:block; }
        .ph{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:#e6eeff; color:#64748b; }

        .topBadges{ position:absolute; top:10px; left:10px; right:10px; display:flex; justify-content:space-between; gap:8px; z-index:2; }
        .priceBadge{ display:inline-flex; align-items:center; justify-content:center; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:900; color:#1345de; background:#eef3ff; border:1px solid #dbe6ff; box-shadow:0 6px 14px rgba(19,69,222,.18); }
        .aiPick{ padding:6px 10px; border-radius:999px; font-size:12px; font-weight:900; color:purple; background:#f2e8ff; border:1px solid #e6d6ff; box-shadow:0 6px 14px rgba(128,0,128,.20); }
        .ratePill{ position:absolute; bottom:10px; left:50%; transform:translateX(-50%); background:black; color:white; font-weight:800; font-size:12px; padding:6px 10px; border-radius:999px; box-shadow:0 12px 24px rgba(0,0,0,.28); z-index:2; }

        .body{ display:grid; grid-template-rows:auto 1fr auto; row-gap:10px; min-height:0; padding:14px 16px 16px;
          background: radial-gradient(120px 100px at 40% 0%, rgba(219,192,255,.55), transparent 80%), radial-gradient(160px 80px at 95% 0%, rgba(210,173,255,.50), transparent 60%), linear-gradient(180deg, white, #dcd2ff 60%, #ddd0ff);
          border-top:1px solid #e8c5ff; }
        .text{ min-height:0; display:grid; gap:6px; }
        .title{ margin:0; font-size:18px; font-weight:900; line-height:1.25; color:#0f172a; letter-spacing:.1px; }
        .subtitle{ margin:0; font-size:14px; line-height:1.55; color:#475569; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }

        .metaRow{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .langPill{ display:inline-flex; align-items:center; gap:8px; padding:9px 12px; border-radius:999px; background:#eef3ff; border:1px solid #dbe6ff; color:#1345de; font-weight:800; font-size:12px; box-shadow:0 6px 14px rgba(19,69,222,.08); }
        .langPill .dot{ width:8px; height:8px; border-radius:999px; background:deepskyblue; box-shadow:0 0 0 4px #dbe6ff; }

        .noUnderline{ text-decoration:none; }
        .btnPrimary{ display:inline-flex; align-items:center; justify-content:center; padding:12px 18px; border-radius:14px; font-weight:900; font-size:14px; line-height:1; color:white; background:linear-gradient(45deg,royalblue,blue);
          box-shadow:0 10px 22px rgba(0,0,255,.28), 0 2px 0 navy, inset 0 0 0 1px lightblue; transition:transform .15s ease, box-shadow .2s ease, filter .2s ease; user-select:none; }
        .btnPrimary:hover{ transform:translateY(-1px); box-shadow:0 14px 28px rgba(0,0,255,.33), 0 4px 0 navy, inset 0 0 0 1px lightblue; filter:saturate(1.05); }
        .btnPrimary:active{ transform:translateY(0); box-shadow:0 8px 16px rgba(0,0,255,.26), 0 1px 0 navy, inset 0 0 0 1px lightblue; }

        @media (max-width:1100px){ .cardsGrid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width:640px){ .cardsGrid{ grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}

/* =========================================
   Pagination
========================================= */
function Pagination({ currentPage, totalPages, onPrev, onNext }:{
  currentPage: number; totalPages: number;
  onPrev: ()=>void; onNext: ()=>void;
}) {
  return (
    <div className="pagination" aria-label="Пагінація">
      <button disabled={currentPage===1} onClick={onPrev}>←</button>
      <span>Сторінка {currentPage} з {totalPages}</span>
      <button disabled={currentPage===totalPages} onClick={onNext}>→</button>

      <style jsx>{`
        .pagination{display:flex;justify-content:center;align-items:center;gap:12px;margin:20px 0 6px;color:#0f172a;font-weight:800}
        .pagination button{background:#1345de;color:#fff;border:none;border-radius:10px;padding:8px 14px;cursor:pointer}
        .pagination button:disabled{opacity:.5;cursor:default}
      `}</style>
    </div>
  );
}

/* =========================================
   Layout: TwoColumn (Sidebar + Content)
========================================= */
function TwoColumn({
  filtersOpen,
  sidebar,
  children,
}: {
  filtersOpen: boolean;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`container grid ${filtersOpen ? 'grid--open' : ''}`}>
      {sidebar}
      <section className="content">{children}</section>

      <style jsx>{`
        .container{max-width:1280px;margin:0 auto 20px;padding:14px 18px;border-radius:18px;background:rgba(218, 229, 241, 1);backdrop-filter:blur(6px);border:1px solid rgba(19,69,222,.14);box-shadow:0 8px 28px rgba(2,28,78,.1);}
        .grid{display:grid;grid-template-columns:320px 1fr;gap:18px}
        .grid--open .sidebar{display:block}
        .content{min-width:0}
        @media (max-width:860px){
          .grid{grid-template-columns:1fr}
          :global(.sidebar){display:none}
          .grid--open :global(.sidebar){display:block}
        }
      `}</style>
    </div>
  );
}

/* =========================================
   PriceRange (custom, no deps)
========================================= */
function PriceRange({
  min, max, cap, disabled, onChange,
}: {
  min: number; max: number; cap: number;
  disabled?: boolean;
  onChange: (vals: [number, number]) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<null | 'lo' | 'hi'>(null);

  const [lo, hi] = useMemo<[number, number]>(() => {
    let a = Math.max(0, Math.min(min, max));
    let b = Math.min(cap, Math.max(min, max));
    if (!disabled && a === b) b = Math.min(cap, a + 1);
    return [a, b];
  }, [min, max, cap, disabled]);

  const valueToPct = (v: number) => (v / cap) * 100;
  const pctToValue = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    return Math.round((clamped / 100) * cap);
  };

  const startDrag = (which: 'lo' | 'hi') => (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setDragging(which);
    e.preventDefault();
  };

  useEffect(() => {
    if (!dragging) return;
    const el = trackRef.current;
    if (!el) return;

    const rect = () => el.getBoundingClientRect();

    const move = (clientX: number) => {
      const r = rect();
      const rel = ((clientX - r.left) / r.width) * 100;
      const val = pctToValue(rel);

      if (dragging === 'lo') {
        const nextLo = Math.min(val, hi - 1);
        onChange([Math.max(0, nextLo), hi]);
      } else {
        const nextHi = Math.max(val, lo + 1);
        onChange([lo, Math.min(cap, nextHi)]);
      }
    };

    const onMouseMove = (e: MouseEvent) => move(e.clientX);
    const onTouchMove = (e: TouchEvent) => move(e.touches[0].clientX);
    const stop = () => setDragging(null);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('mouseup', stop, { once: true });
    window.addEventListener('touchend', stop, { once: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
    };
  }, [dragging, lo, hi, cap, onChange, disabled]);

  const onKey = (which: 'lo' | 'hi') => (e: React.KeyboardEvent) => {
    if (disabled) return;
    const step = e.shiftKey ? 10 : 1;
    if (which === 'lo') {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); onChange([Math.max(0, lo - step), hi]); }
      if (e.key === 'ArrowRight') { e.preventDefault(); onChange([Math.min(hi - 1, lo + step), hi]); }
    } else {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); onChange([lo, Math.max(lo + 1, hi - step)]); }
      if (e.key === 'ArrowRight') { e.preventDefault(); onChange([lo, Math.min(cap, hi + step)]); }
    }
  };

  const leftPct  = (lo / cap) * 100;
  const rightPct = 100 - (hi / cap) * 100;

  return (
    <div className="rangeOuter" ref={trackRef} aria-disabled={disabled} style={disabled ? { opacity:.5, pointerEvents:'none' } : undefined}>
      <div className="track" />
      <div className="trackFill" style={{ left: `${leftPct}%`, right: `${rightPct}%` }} />

      <button
        type="button"
        className={`thumb ${dragging === 'lo' ? 'thumb--active' : ''}`}
        style={{ left: `calc(${leftPct}% - 9px)` }}
        aria-label="Мінімальна ціна"
        aria-valuemin={0}
        aria-valuemax={hi - 1}
        aria-valuenow={lo}
        onMouseDown={startDrag('lo')}
        onTouchStart={startDrag('lo')}
        onKeyDown={onKey('lo')}
      />
      <button
        type="button"
        className={`thumb ${dragging === 'hi' ? 'thumb--active' : ''}`}
        style={{ left: `calc(${100 - rightPct}% - 9px)` }}
        aria-label="Максимальна ціна"
        aria-valuemin={lo + 1}
        aria-valuemax={cap}
        aria-valuenow={hi}
        onMouseDown={startDrag('hi')}
        onTouchStart={startDrag('hi')}
        onKeyDown={onKey('hi')}
      />

      <style jsx>{`
        .rangeOuter{ position:relative; height:36px; padding:8px 2px 14px; user-select:none; }
        .track{ position:absolute; left:0; right:0; top:50%; transform:translateY(-50%); height:6px; border-radius:999px; background: linear-gradient(90deg, #eef2ff, #e0e7ff); box-shadow: inset 0 0 0 1px rgba(124,58,237,.08); }
        .trackFill{ position:absolute; top:50%; transform:translateY(-50%); height:6px; border-radius:999px; background: linear-gradient(90deg, #c084fc, #7c3aed); box-shadow: 0 1px 4px rgba(124,58,237,.25); }
        .thumb{ position:absolute; top:50%; transform:translate(-50%, -50%); height:18px; width:18px; border-radius:50%; background:#7c3aed; border:2px solid #fff; box-shadow:0 0 0 3px rgba(124,58,237,.20); outline:none; cursor:grab; }
        .thumb--active{ cursor:grabbing; }
        .thumb::after{ content:""; width:4px; height:4px; border-radius:50%; background:#fff; display:block; margin:auto; }
      `}</style>
    </div>
  );
}

/* =========================================
   Sidebar (filters) — final polished UI + custom PriceRange
========================================= */
type TCategory = { id:number; name:string };
type TLangOpt = { id?: number; value: string; label: string };

function Sidebar({
  categories, languageOptions,
  catMulti, setCatMulti,
  langMulti, setLangMulti,
  priceMin, priceMax, maxCap,
  setPriceMin, setPriceMax,
  minRating, setMinRating,
  minLessons, setMinLessons,
  onlyFree, setOnlyFree,
  clearAll,
}: {
  categories: TCategory[];
  languageOptions: TLangOpt[];
  catMulti: string[]; setCatMulti: (v:string[])=>void;
  langMulti: string[]; setLangMulti: (v:string[])=>void;
  priceMin: number; priceMax: number; maxCap: number;
  setPriceMin: (n:number)=>void; setPriceMax: (n:number)=>void;
  minRating: number; setMinRating: (n:number)=>void;
  minLessons: number; setMinLessons: (n:number)=>void;
  onlyFree: boolean; setOnlyFree: (b:boolean)=>void;
  clearAll: ()=>void;
}) {
  const toKey = (v: unknown) => String(v ?? '').trim();
  const toggleIn = (arr: string[], raw: unknown, set: (v:string[])=>void) => {
    const key = toKey(raw);
    set(arr.includes(key) ? arr.filter(x=>x!==key) : [...arr, key]);
  };

  const priceVals = useMemo<[number,number]>(
    () => [Math.min(priceMin, priceMax), Math.max(priceMin, priceMax)],
    [priceMin, priceMax]
  );

  return (
    <aside className="sidebar" aria-label="Фільтри">
      <div className="sideHead">
        <h3 className="sideTitle">Фільтри</h3>
        <button className="resetAll" onClick={clearAll} aria-label="Скинути всі фільтри">
          Скинути
        </button>
      </div>

      {/* Категорії */}
      <div className="group">
        <h4>Категорії</h4>
        <div className="chips">
          {categories.map(c=>{
            const key = toKey(c.id);
            const active = catMulti.includes(key);
            return (
              <button
                key={c.id}
                type="button"
                className={`chip ${active ? 'chip--on' : ''}`}
                aria-pressed={active}
                onClick={()=>toggleIn(catMulti, c.id, setCatMulti)}
              >
                <span className="dot dot--cat" aria-hidden />
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Мови */}
      <div className="group">
        <h4>Мови</h4>
        <div className="chips">
          {languageOptions.filter(o=>toKey(o.value)!=='all').map(o=>{
            const key = toKey(o.id ?? o.value);
            const active = langMulti.includes(key);
            return (
              <button
                key={key}
                type="button"
                className={`chip ${active ? 'chip--on' : ''}`}
                aria-pressed={active}
                onClick={()=>toggleIn(langMulti, key, setLangMulti)}
              >
                <span className="dot dot--lang" aria-hidden />
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ціна */}
      <div className="group">
        <div className="groupHead">
          <h4>Ціна</h4>
          <span className="badge badge--soft">{priceVals[0]} — {priceVals[1]}</span>
        </div>

        <PriceRange
          min={priceVals[0]}
          max={priceVals[1]}
          cap={maxCap}
          disabled={onlyFree}
          onChange={([a,b]) => { setPriceMin(a); setPriceMax(b); }}
        />

        <div className="rangeLabels">
          <span>від <strong>{priceVals[0]}</strong></span>
          <button className="miniReset" onClick={()=>{ setPriceMin(0); setPriceMax(maxCap); }}>
            Очистити ціну
          </button>
          <span>до <strong>{priceVals[1]}</strong></span>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={onlyFree}
            onChange={e=>{
              const on = e.target.checked;
              setOnlyFree(on);
              if (on) { setPriceMin(0); setPriceMax(0); }
            }}
          />
          <span>Лише безкоштовні</span>
        </label>
      </div>

      {/* Мін. рейтинг */}
      <div className="group">
        <div className="groupHead">
          <h4>Мінімальний рейтинг</h4>
          <span className="badge">{minRating.toFixed(1)}★+</span>
        </div>
        <div className="ratingRow">
          <input
            type="range" min={0} max={5} step={0.5}
            value={minRating}
            onChange={e=>setMinRating(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Мін. уроків */}
      <div className="group">
        <div className="groupHead">
          <h4>Мін. кількість уроків</h4>
        </div>
        <div className="numRow">
          <input
            className="numInput"
            type="number" min={0} value={minLessons}
            onChange={e=>setMinLessons(Math.max(0, Number(e.target.value)))}
          />
          <span className="hint">шт.</span>
        </div>
      </div>

      <style jsx>{`
        .sidebar{
          position:relative; border-radius:18px; padding:16px;
          background: linear-gradient(180deg, #c7ccfcff, #f3e8ff),
            radial-gradient(260px 160px at 14% 18%, rgba(255,255,255,.65), transparent 70%),
            radial-gradient(260px 160px at 86% 24%, rgba(255,210,255,.45), transparent 70%),
            radial-gradient(360px 240px at 12% 78%, rgba(234,200,255,.35), transparent 70%);
          border:1px solid #e9d5ff;
          box-shadow: 0 8px 22px rgba(91,33,182,.08), inset 0 0 0 1px rgba(124,58,237,.06);
          backdrop-filter:blur(8px);
        }
        .sideHead{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px; }
        .sideTitle{ margin:0; font-size:18px; font-weight:900; color:#021c4e; }
        .resetAll{ border:1px solid #d8b4fe; background:#f5f3ff; color:#5b21b6; padding:8px 10px; border-radius:12px; font-weight:800; cursor:pointer; box-shadow:0 4px 12px rgba(91,33,182,.12); }
        .resetAll:hover{ filter:saturate(1.05); }

        .group{ margin:14px 0; }
        .group h4{ margin:0; font-size:14px; font-weight:900; color:#0b1437; }
        .groupHead{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }

        .badge{ display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:900; color:#5b21b6; background:#ede9fe; border:1px solid #d8b4fe; box-shadow:0 6px 14px rgba(91,33,182,.14); }
        .badge--soft{ color:#1345de; background:#eef3ff; border:1px solid #dbe6ff; box-shadow:0 6px 14px rgba(19,69,222,.14); }

        .chips{ display:flex; flex-wrap:wrap; gap:8px; }
        .chip{ display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; background:white; color:#0f172a; border:1px solid #e5e7eb; font-weight:800; font-size:12px; cursor:pointer; transition:transform .12s ease, filter .15s ease, box-shadow .2s ease; }
        .chip:hover{ transform:translateY(-1px); filter:saturate(1.06); }
        .chip--on{ background:#ede9fe; color:#5b21b6; border-color:#d8b4fe; box-shadow:0 8px 16px rgba(91,33,182,.18), inset 0 0 0 1px #e9d5ff; }
        .dot{ width:8px; height:8px; border-radius:999px; }
        .dot--cat{ background:#7c3aed; box-shadow:0 0 0 4px #e9d5ff; }
        .dot--lang{ background:#2563eb; box-shadow:0 0 0 4px #dbeafe; }

        .rangeLabels{ display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:13px; color:#0b1437; margin-top:8px; }
        .miniReset{ border:1px dashed #94a3b8; background:white; border-radius:10px; padding:6px 10px; font-weight:800; color:#0f172a; cursor:pointer; }
        .miniReset:hover{ filter:saturate(1.05); }

        .check{display:flex; align-items:center; gap:8px; margin-top:10px; font-weight:800; color:#0f172a}
        .check input{ width:16px; height:16px; accent-color:#7c3aed; }

        .ratingRow input[type="range"]{ width:100%; appearance:none; height:6px; border-radius:999px; background:linear-gradient(90deg,#eef2ff,#e0e7ff); }
        .ratingRow input[type="range"]::-webkit-slider-thumb{ appearance:none; width:16px; height:16px; border-radius:50%; background:#5b21b6; border:2px solid #fff; box-shadow:0 0 0 3px rgba(91,33,182,.18); }

        .numRow{ display:flex; align-items:center; gap:8px; }
        .numInput{ flex:1; border:1px solid #e5e7eb; border-radius:12px; padding:8px 10px; background:#fff; font-weight:700; box-shadow: inset 0 1px 0 rgba(2,28,78,.03); }
        .hint{ color:#64748b; font-weight:800; }
      `}</style>
    </aside>
  );
}

/* =========================================
   PAGE (state + data + composition)
========================================= */
export default function CoursesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  // URL → initial
  const initialOrdering = search.get('ordering') ?? '-created_at';
  const initialSearch   = search.get('search') ?? '';
  const initialPage     = Number(search.get('page') ?? '1') || 1;
  const initialCatsCsv  = search.get('categories') ?? '';
  const initialLangCsv  = search.get('langs') ?? '';
  const initialPMin     = Number(search.get('pmin') ?? '0') || 0;
  const initialPMax     = Number(search.get('pmax') ?? '0') || 0;
  const initialOnlyFree = search.get('free') === '1';
  const initialMinRate  = Number(search.get('rmin') ?? '0') || 0;
  const initialMinLes   = Number(search.get('lmin') ?? '0') || 0;

  // state
  const [me, setMe] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [error, setError] = useState<string | null>(null);

  // довідники
  const [categories, setCategories] = useState<Category[]>([]);
  const [languagesMap, setLanguagesMap] = useState<LanguagesMap>({});
  const [languageOptions, setLanguageOptions] = useState<LangOption[]>([{ value: 'all', label: 'Усі мови' }]);

  // фільтри/сортування
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sortBy, setSortBy] = useState(initialOrdering);
  const [catMulti, setCatMulti] = useState<string[]>(initialCatsCsv ? initialCatsCsv.split(',').filter(Boolean) : []);
  const [langMulti, setLangMulti] = useState<string[]>(initialLangCsv ? initialLangCsv.split(',').filter(Boolean) : []);
  const [priceMin, setPriceMin] = useState<number>(initialPMin);
  const [priceMax, setPriceMax] = useState<number>(initialPMax);
  const [maxCap, setMaxCap] = useState<number>(5000);
  const [onlyFree, setOnlyFree] = useState<boolean>(initialOnlyFree);
  const [minRating, setMinRating] = useState<number>(initialMinRate);
  const [minLessons, setMinLessons] = useState<number>(initialMinLes);
  const [onlyNew, setOnlyNew] = useState<boolean>(sortBy === '-created_at');

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // helpers using state
  const extractLanguageLabel = (lang: Course['language']): string => {
    if (lang == null) return '—';
    if (typeof lang === 'object') {
      const any = lang as any;
      const label = any.name || any.title || any.code || any.slug;
      if (label) return String(label);
      if (typeof any.id === 'number') return languagesMap[any.id] || `#${any.id}`;
      return '—';
    }
    if (typeof lang === 'number') return languagesMap[lang] || `#${lang}`;
    const asNum = Number(lang);
    if (!Number.isNaN(asNum) && String(asNum) === String(lang)) return languagesMap[asNum] || `#${asNum}`;
    return String(lang);
  };
  const getLangLabel = (c: Course) => extractLanguageLabel(c.language);

  // мапи для ChipsRow
  const catNameById = useMemo(()=>{
    const m = new Map<number,string>();
    categories.forEach(c=>m.set(c.id, c.name));
    return m;
  }, [categories]);
  const langLabelById = useMemo(()=>{
    const m = new Map<string,string>();
    Object.entries(languagesMap).forEach(([id,label])=>m.set(String(id), label));
    return m;
  }, [languagesMap]);

  const updateUrl = () => {
    const p = new URLSearchParams();
    if (sortBy && sortBy !== '-created_at') p.set('ordering', sortBy);
    if (searchTerm.trim()) p.set('search', searchTerm.trim());
    if (currentPage > 1) p.set('page', String(currentPage));
    if (catMulti.length) p.set('categories', catMulti.join(','));
    if (langMulti.length) p.set('langs', langMulti.join(','));
    if (priceMin > 0) p.set('pmin', String(priceMin));
    if (priceMax > 0) p.set('pmax', String(priceMax));
    if (onlyFree) p.set('free', '1');
    if (minRating > 0) p.set('rmin', String(minRating));
    if (minLessons > 0) p.set('lmin', String(minLessons));
    router.replace(p.toString() ? `${pathname}?${p}` : pathname, { scroll: false });
  };

  // bootstrap
  useEffect(() => {
    (async () => {
      try { const r = await http.get('/accounts/api/profile/'); setMe(r.data as Profile); } catch { setMe(null); }
      try {
        const rc = await http.get('/courses/categories/');
        const arr = Array.isArray(rc.data?.results) ? rc.data.results : rc.data;
        setCategories(arr || []);
      } catch {}

      // languages
      try {
        const eps = ['/courses/languages/','/api/languages/','/courses/language/','/course/languages/'];
        let dict: LanguagesMap = {};
        for (const ep of eps) {
          try {
            const r = await http.get(ep);
            const raw = Array.isArray(r.data?.results) ? r.data.results : r.data;
            if (!Array.isArray(raw) || !raw.length) continue;
            dict = Object.fromEntries(raw.map((x: any) => [x.id, (x.name||x.title||x.code||x.slug||String(x.id)).toString()]));
            break;
          } catch {}
        }
        setLanguagesMap(dict);
        const opts = Object.entries(dict).sort((a,b)=>a[1].localeCompare(b[1],'uk')).map(([id,label])=>({value:String(id),label}));
        setLanguageOptions([{value:'all',label:'Усі мови'}, ...opts]);
      } catch { setLanguageOptions([{value:'all',label:'Усі мови'}]); }

      // price range probe
      try {
        const r = await http.get('/courses/', { params: { page_size: 200 } });
        const list: Course[] = r.data?.results ?? r.data ?? [];
        const prices = list.map(c => Number(c.price ?? 0)).filter(n => !Number.isNaN(n));
        if (prices.length) {
          const max = Math.max(...prices);
          const cap = Math.ceil(max / 10) * 10;
          setMaxCap(cap);
          if (initialPMax === 0) setPriceMax(cap);
        } else {
          setMaxCap(5000);
          if (initialPMax === 0) setPriceMax(5000);
        }
      } catch {
        setMaxCap(5000);
        if (initialPMax === 0) setPriceMax(5000);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync "Нові" тумблер із sortBy
  useEffect(()=>{
    if (onlyNew) setSortBy('-created_at');
  }, [onlyNew]);

  // fetch courses (серверні фільтри по ID + ціні + пошук + сортування + пагінація)
  useEffect(() => {
    let cancelled = false;
    setError(null);

    const params: Record<string, any> = {
      ordering: sortBy,
      page: currentPage,
      page_size: PAGE_SIZE,
      search: searchTerm.trim() || undefined,
    };

    if (catMulti.length) params['category__in'] = catMulti.join(',');   // бек приймає __in
    if (langMulti.length) params['language__in'] = langMulti.join(','); // бек приймає __in
    if (priceMin > 0) params['price__gte'] = priceMin;
    if (priceMax > 0) params['price__lte'] = priceMax;
    if (onlyFree) params['price__lte'] = 0;          // free override
    if (minRating > 0) params['rating__gte'] = minRating;

    http.get('/courses/', { params })
      .then((r) => {
        if (cancelled) return;
        const list: Course[] = r.data?.results ?? r.data ?? [];
        const normalized = list.map((c) => ({ ...c, image: c.image ? mediaUrl(c.image) : null }));
        setCourses(normalized);
        const count = Number(r.data?.count ?? normalized.length);
        setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
      })
      .catch(() => !cancelled && setError('Не вдалося завантажити курси'));

    updateUrl();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, currentPage, searchTerm, catMulti.join(','), langMulti.join(','), priceMin, priceMax, onlyFree, minRating]);

  // client-side додаткові фільтри (мін. рейтинг, мін. уроків)
  const viewCourses = useMemo(()=>{
    return courses
      .filter(c => Number(c.rating ?? 0) >= minRating)
      .filter(c => Number(c.total_lessons ?? 0) >= minLessons);
  }, [courses, minRating, minLessons]);

  // derived
  const recommended = useMemo(() => courses.slice(0, 6), [courses]);

  // chips handlers
  const toggleCat = (id: string) => setCatMulti(arr => arr.includes(id) ? arr.filter(v=>v!==id) : [...arr, id]);
  const toggleLang = (id: string) => setLangMulti(arr => arr.includes(id) ? arr.filter(v=>v!==id) : [...arr, id]);
  const resetPrice = () => { setPriceMin(0); setPriceMax(maxCap); };
  const clearAll = () => {
    setCatMulti([]); setLangMulti([]); setPriceMin(0); setPriceMax(maxCap);
    setSearchTerm(''); setCurrentPage(1);
    setOnlyFree(false); setMinRating(0); setMinLessons(0); setOnlyNew(false); setSortBy('-created_at');
  };

  return (
    <div className="page">
      <div className="wrap">
        <FeaturedHero />

        <Toolbar
          searchTerm={searchTerm} setSearchTerm={(v)=>{ setCurrentPage(1); setSearchTerm(v); }}
          sortBy={sortBy} setSortBy={(v)=>{ setOnlyNew(v==='-created_at'); setCurrentPage(1); setSortBy(v); }}
          filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen}
          onlyNew={onlyNew} setOnlyNew={(b)=>{ setOnlyNew(b); if (b) setSortBy('-created_at'); }}
        />

        <AIStrip
  show={showRecommendations}
  setShow={setShowRecommendations}
/>


        <TwoColumn
          filtersOpen={filtersOpen}
          sidebar={
            <Sidebar
              categories={categories}
              languageOptions={languageOptions}
              catMulti={catMulti} setCatMulti={(v)=>{ setCurrentPage(1); setCatMulti(v); }}
              langMulti={langMulti} setLangMulti={(v)=>{ setCurrentPage(1); setLangMulti(v); }}
              priceMin={priceMin} priceMax={priceMax} maxCap={maxCap}
              setPriceMin={(n)=>{ setCurrentPage(1); setPriceMin(n); }}
              setPriceMax={(n)=>{ setCurrentPage(1); setPriceMax(n); }}
              minRating={minRating} setMinRating={(n)=>{ setCurrentPage(1); setMinRating(n); }}
              minLessons={minLessons} setMinLessons={(n)=>{ setCurrentPage(1); setMinLessons(n); }}
              onlyFree={onlyFree} setOnlyFree={(b)=>{ setCurrentPage(1); setOnlyFree(b); }}
              clearAll={clearAll}
            />
          }
        >
          <ChipsRow
            searchTerm={searchTerm} onClearAll={clearAll}
            catMulti={catMulti} catNameById={catNameById} onToggleCat={(id)=>{ setCurrentPage(1); toggleCat(id); }}
            langMulti={langMulti} langLabelById={langLabelById} onToggleLang={(id)=>{ setCurrentPage(1); toggleLang(id); }}
            priceMin={priceMin} priceMax={priceMax} maxCap={maxCap} onResetPrice={()=>{ setCurrentPage(1); resetPrice(); }}
            minRating={minRating} setMinRating={(n)=>{ setCurrentPage(1); setMinRating(n); }}
            minLessons={minLessons} setMinLessons={(n)=>{ setCurrentPage(1); setMinLessons(n); }}
            onlyFree={onlyFree} setOnlyFree={(b)=>{ setCurrentPage(1); setOnlyFree(b); }}
          />

          
          {error && <p className="error">{error}</p>}

          <CoursesGrid courses={viewCourses} getLangLabel={(c)=>extractLanguageLabel(c.language)} />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={()=>setCurrentPage(p=>Math.max(1,p-1))}
            onNext={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}
          />
        </TwoColumn>
      </div>
      <style jsx>{`
        .page {
         min-height: 100dvh;
         background-image: url('/images/BackPage.png'), url('/images/back.png');
          background-repeat: no-repeat, no-repeat;
          background-size: cover, cover;
          background-position: top center, top center;
        }
        .wrap{
          padding:18px 0 56px;
        }
        .sectionTitle{margin:6px 2px 10px;font-size:24px;font-weight:900;color:#021c4e}
        .error{color:red;text-align:center}
      `}</style>
            <FooterCard/>
    </div>
  );
}
