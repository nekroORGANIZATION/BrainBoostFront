'use client';

import React from "react";
import Image from "next/image";

// Ти можеш замінити ці шляхи на свої файли у /public/images
const founders = [
  {
    name: "Анна Мельник",
    title: "CEO",
    image: "/images/founder1.png",
    quote:
      "«Змінювати країну — це процес, у якому кожен крок важливий: нові знання та можливості, вищий рівень життя».",
  },
  {
    name: "Павло Гончар",
    title: "CGO",
    image: "/images/founder2.png",
    quote:
      "«Випускники Brainboost відкривають бізнеси, працюють у топових компаніях, формують нову інтелектуальну еліту».",
  },
  {
    name: "Сергій Ткаченко",
    title: "CSO",
    image: "/images/founder3.png",
    quote:
      "«Найбільше мотивує бачити, як люди змінюють своє життя на краще. Читаю відгуки наших студентів — і всі вони надихають».",
  },
];

const imageGrid = [
  "/images/hero1.png",
  "/images/hero2.png",
  "/images/hero3.png",
  "/images/hero4.png",
];

export default function Box() {
  return (
    <div className="box">
        <div className="box-container">
        <header className="header">
            <h1>Brainboost</h1>
            <p>
            Простір для тих, хто хоче увійти в ІТ або прокачати свої навички.
            </p>
            <a href="#" className="cta">
            Хочу вчитись в Brainboost
            </a>
        </header>

        <div className="image-grid">
            {imageGrid.map((src, i) => (
            <Image
                key={i}
                src={src}
                alt={`Image ${i}`}
                width={280}
                height={180}
                className="grid-image"
            />
            ))}
        </div>

        <section className="founders-section">
            <p className="subheading">Знайомся ближче</p>
            <h2>Засновники Brainboost</h2>

            <div className="founders">
            {founders.map((f, i) => (
                <div className="founder-card" key={i}>
                <Image
                    src={f.image}
                    alt={f.name}
                    width={278}
                    height={202}
                    className="founder-image"
                />
                <h3>{f.name}</h3>
                <p className="title">{f.title}</p>
                <p className="quote">{f.quote}</p>
                </div>
            ))}
            </div>
        </section>
    </div>

      <style jsx>{`
        .box-container {
          max-width: 1046px;
          margin: 0 auto;
          padding: 40px 20px;
          font-family: 'Mulish', sans-serif;
        }

        .box {
            background-image: url('/images/back.png');
        }

        .header {
          text-align: left;
          margin-bottom: 40px;
        }

        .header h1 {
          font-size: 48px;
          font-weight: 700;
          color: #021c4e;
        }

        .header p {
          font-size: 20px;
          margin-top: 20px;
          margin-bottom: 30px;
          color: #000;
          max-width: 480px;
        }

        .cta {
          display: inline-block;
          background: #1345de;
          color: #fff;
          padding: 14px 24px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 600;
        }

        .image-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          justify-content: center;
          margin: 60px 0;
        }

        .grid-image {
          border-radius: 12px;
          object-fit: cover;
        }

        .founders-section {
          text-align: center;
        }

        .founders-section .subheading {
          font-size: 16px;
          color: #1345de;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .founders-section h2 {
          font-size: 32px;
          color: #021c4e;
          font-weight: 700;
          margin-bottom: 40px;
        }

        .founders {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 30px;
        }

        .founder-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          width: 318px;
          padding: 20px;
          text-align: left;
        }

        .founder-card h3 {
          font-size: 22px;
          color: #021c4e;
          margin-top: 10px;
          margin-bottom: 4px;
        }

        .founder-card .title {
          font-size: 16px;
          color: #1345de;
          margin-bottom: 12px;
        }

        .founder-card .quote {
          font-size: 15px;
          line-height: 1.6;
          color: #000;
        }

        @media (max-width: 768px) {
          .image-grid {
            flex-direction: column;
            align-items: center;
          }

          .founders {
            flex-direction: column;
            align-items: center;
          }

          .header h1 {
            font-size: 36px;
          }

          .header p {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}
