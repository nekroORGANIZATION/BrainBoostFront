'use client';

import React from "react";
import Image from "next/image";
import Link from 'next/link';

const founders = [
  {
    name: "Анна Мельник",
    title: "CEO",
    image: "/images/founder1.png",
    quote:
      "«Змінювати країну — це процес, у якому кожен крок важливий: нові знання та можливості, вищий рівень життя».",
    instagram: "#",
    linkedin: "#",
  },
  {
    name: "Павло Гончар",
    title: "CGO",
    image: "/images/founder2.png",
    quote:
      "«Випускники Brainboost відкривають бізнеси, працюють у топових компаніях, формують нову інтелектуальну еліту».",
    instagram: "#",
    linkedin: "#",
  },
  {
    name: "Сергій Ткаченко",
    title: "CSO",
    image: "/images/founder3.png",
    quote:
      "«Найбільше мотивує бачити, як люди змінюють своє життя на краще. Читаю відгуки наших студентів — і всі вони надихають».",
    instagram: "#",
    linkedin: "#",
  },
];

const imageGrid = [
  "/images/hero1.png",
  "/images/hero2.png",
  "/images/hero3.png",
  "/images/hero4.png",
];

export default function Home() {
  return (
    <div className="page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <h1 className="brand">Brainboost</h1>
          <p className="tagline">
            Простір для тих, хто хоче увійти в ІТ або прокачати свої навички.
          </p>
          <Link href="/courses" className="cta">Хочу вчитись в Brainboost</Link>
        </div>

        <div className="hero-right">
          <div className="grid-2x2">
            {imageGrid.map((src, i) => (
              <div
                key={i}
                className={
                  i === 0 ? "cell rect" :
                  i === 1 ? "cell square" :
                  i === 2 ? "cell square" :
                  "cell rect"
                }
              >
                <div className="media">
                  <Image
                    src={src}
                    alt={`Hero image ${i + 1}`}
                    fill
                    sizes="(max-width: 1200px) 45vw, 520px"
                    className="img"
                    priority={i === 0}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDERS */}
      <section className="founders-section">
        <p className="subheading">Знайомся ближче</p>
        <h2>Засновники Brainboost</h2>

        <div className="founders-row">
          {founders.map((f, i) => (
            <div className="founder-card" key={i}>
              <Image
                src={f.image}
                alt={f.name}
                width={278}
                height={202}
                className="founder-image"
              />

              <div className="card-head">
                <div className="name-title">
                  <h3>{f.name}</h3>
                  <p className="title">{f.title}</p>
                </div>

                <div className="socials">
                  <a href={f.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="social-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z" stroke="#1345DE" strokeWidth="1.6"/>
                      <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#1345DE" strokeWidth="1.6"/>
                      <circle cx="18" cy="6" r="1.2" fill="#1345DE"/>
                    </svg>
                  </a>
                  <a href={f.linkedin} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="social-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5Z" fill="#1345DE"/>
                      <path d="M3.5 9h3v12h-3V9Zm6 0h2.8v1.7h.04c.39-.74 1.35-1.52 2.78-1.52 2.97 0 3.88 1.79 3.88 4.12V21h-3v-6.1c0-1.45-.03-3.32-2.02-3.32-2.02 0-2.33 1.58-2.33 3.22V21h-3V9Z" fill="#1345DE"/>
                    </svg>
                  </a>
                </div>
              </div>

              <p className="quote">{f.quote}</p>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .page {
        min-height: 100vh;
        background-image: url('/images/back.png');
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
        padding: 40px 20px;
        box-sizing: border-box;
        font-family: 'Mulish', sans-serif;
        }

        .hero {
        max-width: 1046px;
        margin: 0 auto 60px auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        align-items: start;
        }

        .hero-left {
        padding-top: 140px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        }

        .brand {
        font-family: 'Afacad', sans-serif;
        font-weight: 700;
        font-size: 64px;
        line-height: 1.1;
        color: #021C4E;
        margin: 0;
        }

        .tagline {
        font-size: 20px;
        color: #000;
        max-width: 480px;
        margin: 0;
        }

        .cta {
        display: inline-block;
        background: #1345DE;
        color: #fff;
        padding: 14px 24px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 600;
        transition: transform 0.1s ease, box-shadow 0.2s ease;
        width: fit-content;
        }
        .cta:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(19,69,222,0.24);
        }

        .hero-right {
        display: flex;
        justify-content: flex-end;
        }

        .grid-2x2 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px; /* трохи збільшено для легкості */
        width: 100%;
        max-width: 520px;
        justify-items: stretch;
        align-items: stretch;
        }

        .cell {
        border: 2px solid #1345DE;
        border-radius: 20px;
        overflow: hidden;
        display: block;
        box-sizing: border-box;
        background: #fff;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        height: 0;
        padding-bottom: 75%; /* співвідношення 4:3 */
        position: relative;
        }

        .cell:hover {
        transform: translateY(-4px) scale(1.03);
        box-shadow: 0 8px 20px rgba(0,0,0,0.18);
        }

        .cell .img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        border-radius: 20px;
        transition: transform 0.4s ease;
        }

        .cell:hover .img {
        transform: scale(1.07);
        }

        /* Для квадратних карток, якщо потрібно */
        .cell.square {
        padding-bottom: 100%; /* 1:1 */
        }

        /* Для прямокутних карток 4:3 */
        .cell.rect {
        padding-bottom: 75%; /* 4:3 */
        }

        .founders-section {
        max-width: 1046px;
        margin: 0 auto 80px auto;
        text-align: center;
        }

        .subheading {
        font-size: 16px;
        color: #1345DE;
        font-weight: 500;
        margin: 0 0 8px 0;
        }

        .founders-section h2 {
        font-size: 36px;
        color: #021C4E;
        font-weight: 700;
        margin: 0 0 32px 0;
        }

        .founders-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 30px;
        align-items: start;
        }

        .founder-card {
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        width: 100%;
        padding: 20px;
        text-align: left;
        box-sizing: border-box;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .founder-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }

        .founder-image {
        width: 100%;
        height: auto;
        border-radius: 20px;
        object-fit: cover;
        display: block;
        transition: transform 0.4s ease;
        }
        .founder-card:hover .founder-image {
        transform: scale(1.03);
        }

        .card-head {
        margin-top: 12px;
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 12px;
        }

        .name-title h3 {
        font-size: 22px;
        color: #021C4E;
        margin: 0 0 4px 0;
        }

        .name-title .title {
        font-size: 16px;
        color: #1345DE;
        margin: 0;
        }

        .socials {
        display: inline-flex;
        gap: 8px;
        flex-shrink: 0;
        padding-top: 2px;
        }

        .social-link {
        display: inline-flex;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: #ffffff;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        transition: transform 0.1s ease, box-shadow 0.2s ease;
        }
        .social-link:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .quote {
        font-size: 15px;
        line-height: 1.6;
        color: #000;
        margin: 12px 0 0 0;
        }

        @media (max-width: 1024px) {
        .hero {
            grid-template-columns: 1fr;
        }
        .hero-right {
            justify-content: center;
        }
        .grid-2x2 {
            max-width: 520px;
            margin: 0 auto;
        }
        .founders-row {
            grid-template-columns: repeat(2, 1fr);
        }
        }

        @media (max-width: 640px) {
        .brand {
            font-size: 42px;
        }
        .founders-row {
            grid-template-columns: 1fr;
        }
        }

      `}</style>
    </div>
  );
}
// check
