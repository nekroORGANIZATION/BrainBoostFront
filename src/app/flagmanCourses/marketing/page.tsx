"use client";

import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Star, Calendar, Clock, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, BookOpen, CheckSquare, Users, Award ,BarChart, Youtube, MonitorCheck, Search, Target, Mail, Puzzle, Megaphone, Lightbulb } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

type TextAlign = "left" | "center" | "right" | "justify" | "start" | "end";

interface ItemPosition {
  text: string;
  textAlign: TextAlign;
  gradientDirection: "to-r" | "to-l";
}


function Header() {
  return (
    <header className="absolute top-0 left-0 w-full z-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex items-center justify-between py-6">
        <div className="font-[Afacad] font-bold text-[36px] leading-[100%] text-slate-900">
          Brainboost
        </div>
        <nav className="hidden md:flex items-center ml-[120px] gap-[180px]">
          <a
            href="#speakers"
            className="font-[Mulish] font-medium text-[20px] leading-[100%] text-slate-700 hover:text-indigo-600"
          >
            Спікери
          </a>
          <a
            href="#program"
            className="font-[Mulish] font-medium text-[20px] leading-[100%] text-slate-700 hover:text-indigo-600"
          >
            Програма
          </a>
          <a
            href="#reviews"
            className="font-[Mulish] font-medium text-[20px] leading-[100%] text-slate-700 hover:text-indigo-600"
          >
            Відгуки
          </a>
        </nav>
        <Link
            href="/enroll"
            className="w-[192px] h-[52px] flex items-center justify-center rounded-[44px] border-[3px] border-[#1345DE] bg-white text-[#1345DE] font-semibold transition-colors duration-300 hover:bg-[#1345DE] hover:text-white"
          >
            Записатися на курс
          </Link>
      </div>
    </header>
  );
}

interface CardProps {
  title: string;
  description: string;
  width?: string;
}

function CourseCard({ title, description, width = "full" }: CardProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col md:flex-row items-start gap-8 w-full"
    >
      <div
        className="rounded-lg flex items-center justify-center p-4"
        style={{
          background:
            "linear-gradient(90deg, rgba(10, 37, 120, 0.6) 42.24%, rgba(255, 255, 255, 0.6) 98.51%)",
          color: "#1345DE",
          minWidth: width,
        }}
      >
        <span className="font-[Mulish] font-bold text-[24px]">{title}</span>
      </div>

      <div
        className="p-6"
        style={{
          color: "black",
          width: "100%",
          maxWidth: "800px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          marginTop: "-40px",
        }}
      >
        <p className="font-[Mulish] font-medium text-[24px] leading-[140%]">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

function WhoIsThisCourseFor() {
  const cards = [
    {
      title: "Усім, хто хоче опанувати нову професію",
      description:
        "Ви у пошуках себе. Думаєте, як поєднати фінансову стабільність із справою, яка буде надихати щодня. Або ж прагнете радикальних змін — нового етапу життя, нових можливостей і нових цілей.",
      width: "641px",
    },
    {
      title: "Керівникам та власникам бізнесу",
      description:
        "Шукаєте ефективні курси та програми для підвищення кваліфікації ваших менеджерів і команди в інтернет-маркетингу, щоб більше часу приділяти розвитку та масштабуванню бізнесу.",
      width: "535px",
    },
    {
      title: "Підприємцям",
      description:
        "Вам необхідні комплексні знання з інтернет-маркетингу, щоб вибудувати стабільний потік онлайн-продажів, контролювати роботу підрядників і розуміти, які конкретні результати має приносити команда.",
      width: "334px",
    },
    {
      title: "Маркетологам",
      description:
        "Бажаєте стати експертом у сфері інтернет-просування, залучати більше клієнтів у бізнес, розвиватися професійно та зростати у доходах.",
      width: "334px",
    },
  ];

  return (
    <section className="relative w-full backdrop-blur-sm pt-32 px-6 lg:px-8 pb-32 rounded-xl shadow-lg">
      <motion.h2
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="font-[Afacad] font-bold text-[42px] text-center mb-25"
        style={{ maxWidth: "389px", margin: "0 auto" }}
      >
        <span className="text-[#1345DE]">Кому</span>{" "}
        <span className="text-black">підходить курс</span>
      </motion.h2>

      <div className="mt-70">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-col gap-12"
        >
          {cards.map((card, idx) => (
            <CourseCard
              key={idx}
              title={card.title}
              description={card.description}
              width={card.width}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function WhoTeaches() {
  return (
    <section className="relative w-full backdrop-blur-sm shadow-lg pt-10 pb-40">
      <h2 className="font-[Afacad] font-bold text-[40px] text-center mb-6">
        <span className="text-[#1345DE]">Хто</span>{" "}
        <span className="text-black">проводить навчання?</span>
      </h2>

      <p className="font-[Mulish] font-medium text-[24px] text-center max-w-[600px] mx-auto">
        Ці люди будуть вашими менторами та наставниками{" "}
        <span className="text-[#1345DE] font-bold">протягом 4 місяців</span>
      </p>
    </section>
  );
}

const mentors = [
  {
    name: "Анастасія Марчук",
    role: "Digital-стратег",
    image: "/images/mentors/image1.jpg",
  },
  {
    name: "Дмитро Сидоренко",
    role: "PPC-спеціаліст",
    image: "/images/mentors/image2.jpg",
  },
  {
    name: "Ярослав Гаврилюк",
    role: "SMM-стратег, креатор, лектор, СЕО SMM бюро",
    image: "/images/mentors/image3.jpg",
  },
  {
    name: "Мирослава Данилюк",
    role: "Digital-стратег",
    image: "/images/mentors/image4.jpg",
  },
  {
    name: "Артем Кравченко",
    role: "Аналітік, маркетолог",
    image: "/images/mentors/image5.jpg",
  },
  {
    name: "Злата Мельник",
    role: "Head of SEO Departament в Netpeak",
    image: "/images/mentors/image6.jpg",
  },
  {
    name: "Вікторія Марченко",
    role: "Digital-маркетолог, product manager, product owner",
    image: "/images/mentors/image7.jpg",
  },
];

function MentorsGallery() {
  return (
    <div className="relative z-10 -mt-10 overflow-hidden backdrop-blur-sm py-10 shadow-lg">
      <motion.div
        className="flex gap-6 px-6 w-max"
        animate={{ x: [-0, -2000] }}
        transition={{
          repeat: Infinity,
          repeatType: "loop",
          duration: 40,
          ease: "linear",
        }}
      >
        {mentors.map((mentor, i) => (
          <div
            key={i}
            className="w-[298px] h-[396px] relative flex-shrink-0 rounded-md overflow-hidden"
          >
            <Image
              src={mentor.image}
              alt={mentor.name}
              fill
              className="object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 text-center text-white p-2 rounded bg-black/50">
              <h3 className="font-[Mulish] font-bold text-[20px]">
                {mentor.name}
              </h3>
              <p className="font-[Mulish] text-[14px]">{mentor.role}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-start overflow-hidden backdrop-blur-sm shadow-md">
      <Header />
      <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start pt-28"
        >
          <motion.div variants={fadeUp}>
            <h1
              className="font-[Afacad] font-bold text-[56px] leading-[120%] text-slate-900 mt-32 mb-12"
              style={{ width: "530px", height: "128px" }}
            >
              Комплексний{" "}
              <span className="text-black whitespace-nowrap">
                інтернет-маркетинг
              </span>
            </h1>
            <div className="flex items-center gap-3 mb-12">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-12 w-12 fill-[#EBDB25] text-[#EBDB25]"
                />
              ))}
              <span className="ml-3 font-[Mulish] font-bold text-[16px] text-black whitespace-nowrap">
                4.85/5 – 57 відгуків
              </span>
            </div>
            <p
              className="font-[Mulish] font-medium text-[24px] text-black mb-12"
              style={{ width: "530px" }}
            >
              Опануйте найпопулярніші digital-інструменти та запустіть першу
              рекламну кампанію.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#signup"
                className="rounded-full bg-indigo-600 w-[192px] h-[52px] flex items-center justify-center font-semibold text-white shadow hover:bg-indigo-700 transition"
              >
                Записатися на курс
              </a>
              <a
                href="#program"
                className="rounded-full border border-black w-[192px] h-[52px] flex items-center justify-center font-semibold text-black hover:bg-black hover:text-white transition"
              >
                Переглянути програму
              </a>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="relative">
            <img
              src="images/hero-illustration.png.png"
              alt="Hero"
              className="rounded-[30px] object-cover w-full max-w-[630px]"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function WhatYouLearn() {
  return (
    <section className="w-full px-6 mt-36 py-28"> 
      {/* 👆 додав mt-32 для більшого відступу від каруселі */}
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-start gap-24">
        
        {/* Ліва частина */}
        <h2 className="font-[Afacad] font-bold text-[56px] leading-[110%] max-w-[419px]">
          Чому конкретно <br />
          ви навчитеся <span className="text-[#1345DE]">за</span> <br />
          <span className="text-[#1345DE]">4 місяці</span>
        </h2>

        {/* Права частина */}
        <div className="flex flex-col gap-6 max-w-[508px] md:mt-6">
          <p className="font-[Mulish] font-medium text-[24px] leading-[120%] text-black">
            Ви отримаєте структуровані знання, тотальну практику та досвід 
            кращих спікерів в своїх напрямках діяльності.
          </p>

          <p className="font-[Mulish] font-bold text-[40px] leading-[120%] text-black whitespace-nowrap">
            <span className="text-[#1345DE]">15</span> модулів{" "}
            <span className="text-[#1345DE]">98</span> занять{" "}
            <span className="text-[#1345DE]">17</span> спікерів
          </p>
        </div>
      </div>
    </section>
  );
}

function PreStartBlock() {
  const items = [
    { text: "Знайомство зі студентами, продактом, ментором, координаторами", side: "left" },
    { text: "Як навчатися на курсі", side: "right" },
    { text: "Огляд платформи, лекції, тести, домашні завдання", side: "left" },
    { text: "Отримання практики на воркшопах", side: "right" },
    { text: "Як оцінюється навчання, мотивація дійти до кінця, бонуси по завершенню курса", side: "left" },
    { text: "Маркетингова стратегія для реального бізнесу як головне завдання курсу", side: "right" },
  ];

  return (
    <section className="w-[1200px] mx-auto bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Верхня частина */}
      <div className="flex items-center gap-6 px-12 pt-12">
        <button className="w-[248px] h-[68px] bg-[#1345DE] rounded-xl font-bold text-[20px] text-white">
          Заняття PRE-START
        </button>
        <p className="text-[32px] font-bold text-black ml-[150px]">
          Продакт курсу, ментор, координатори
        </p>
      </div>

      {/* Лінія */}
      <hr className="border-t-2 border-[#82A1FF99] w-[87%] mx-auto my-6" />

      {/* Список пунктів */}
      <div className="flex flex-col gap-25 pb-12 mt-30">
        {items.map((item, i) => {
          const isLeft = item.side === "left";
          const gradient = isLeft ? "bg-gradient-to-l" : "bg-gradient-to-r";
          const justifyContent = isLeft ? "justify-start" : "justify-end";
          const paddingSide = "px-6"; // внутрішній відступ тексту від країв блоку

          return (
            <div
              key={i}
              className={`${gradient} from-[#FFFFFF99] to-[#0A257899] w-full h-[92px] flex items-center ${justifyContent} ${paddingSide} rounded-xl`}
            >
              <p className="font-medium text-[20px] text-black">{item.text}</p>
            </div>
          );
        })}
      </div>

      {/* Фіолетовий блок */}
      <div className="w-full bg-[#82A1FF99] flex justify-center">
        <div className="p-12 flex flex-col gap-2 text-left max-w-[800px]">
          <h3 className="font-bold text-[24px] text-black mb-2">В результаті</h3>
          <p className="font-medium text-[17px] text-black">
            В результаті участі в організаційному зідзвоні та подальшому вивченні матеріалів
          </p>
          <p className="font-medium text-[17px] text-black">
            модулю 0 студенти краще розуміють процес навчання, отримують відповіді на свої
          </p>
          <p className="font-medium text-[18px] text-black">
            запитання, знайомляться, адаптуються
          </p>
        </div>
      </div>

      {/* Кнопка під фіолетовим блоком */}
      <div className="px-15 py-20">
        <button className="w-[424px] h-[68px] bg-[#1345DE] rounded-xl font-bold text-[20px] text-white">
          Хочу стати інтернет-маркетологом
        </button>
      </div>
    </section>
  );
}

function MarketingTopicsSection() {
  const topics = [
    "Основи інтернет-маркетингу",
    "Аналіз ринку, конкурентів і цільової аудиторії",
    "Контент-маркетинг",
    "Email-маркетинг",
    "Таргетована реклама",
    "SMM-просування",
    "Контекстна реклама",
    "SEO-просування",
    "LinkedIn",
    "YouTube-просування",
    "WEB-аналітика",
    "Чат-боти та квізи",
    "Стратегія",
    "Продаж стратегії та робота з замовником",
  ];

  return (
    <section className="w-[1200px] mx-auto flex gap-8 mt-40">
      {/* Ліва колонка з пронумерованим списком */}
      <ol className="w-[494px] flex flex-col gap-10 font-bold text-[20px] text-black list-decimal list-inside">
        {topics.map((topic, index) => (
          <li key={index} className="leading-tight">
            {topic}
          </li>
        ))}
      </ol>

      {/* Права колонка з фото */}
      <div className="w-[616px] h-[441px]">
        <img
          src="images/img.png"
          alt="Marketing"
          className="w-full h-auto mt-50" 
        />
      </div>
    </section>
  );
}

function CoursePreview() {
  const items = [
    {
      title: "Практичні домашні завдання",
      text: "Ви одразу відточуєте отримані знання на практиці. Вже на курсі ви отримаєте досвід, необхідний для роботи з першими клієнтами.",
    },
    {
      title: "Викладачі-практики",
      text: "Ви навчаєтесь у людей з багаторічним досвідом, які працюють з великими компаніями, відстежують тренди професії та сортують знання у зрозумілий алгоритм для вас.",
    },
    {
      title: "Навчання у зручний для вас час",
      text: "Уроки знаходяться на освітній платформі. Ви можете самостійно налаштувати навчання під свій графік.",
    },
    {
      title: "Диплом або сертифікат",
      text: "Після закінчення навчання ви отримуєте диплом або сертифікат, що збільшить ваші шанси на успішне працевлаштування.",
    },
    {
      title: "Можливість вчитися з нуля",
      text: "Курс буде корисним і спеціалістам, і новачкам. Ви можете стартувати вже після проходження курсу.",
    },
    {
      title: "Ментор та координатори",
      text: "На курсі є команда підтримки, яка допомагає вам з усіх питань – від навчання до аналізу матеріалу.",
    },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 3000); // кожні 3с рухається
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <section className="w-[1200px] mx-auto flex flex-col items-center gap-35 py-70">
      {/* Заголовок */}
      <div className="text-center mb-12">
        <h2 className="text-[36px] font-bold text-black mb-2">
          Що чекає на вас на курсі
        </h2>
        <h2 className="text-[36px] font-bold text-[#1345DE]">
          “Комплексний інтернет-маркетинг”
        </h2>
      </div>

      {/* Карусель */}
      <div className="relative w-[1040px] overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${index * 426}px)` }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className="w-[406px] h-[406px] flex-shrink-0 flex flex-col justify-center items-center bg-white rounded-xl shadow-md p-6 mx-2 text-center"
            >
              <h3 className="font-bold text-[20px] mb-4 text-black">
                {item.title}
              </h3>
              <p className="font-medium text-[16px] text-gray-700">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Кнопка */}
      <button className="w-[424px] h-[68px] bg-[#1345DE] rounded-xl font-bold text-[20px] text-white">
        Хочу стати інтернет-маркетологом
      </button>
    </section>
  );
}

function WorkshopBlock() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-1">
      {/* Заголовок */}
      <div className="text-center mb-30">
        <h2 className="text-4xl font-bold text-black">
          Додаткова практика з топовими експертами
        </h2>
        <h3 className="text-4xl font-bold text-blue-600">
          10 занять (Workshop)
        </h3>
      </div>

      {/* Підзаголовок */}
      <p className="text-3xl font-bold text-black mb-10 text-left">
        Воркшопи: більше 40 годин прокачки навичок
      </p>

      {/* Іконки + текст */}
      <div className="flex items-center gap-38 mb-28 text-black">
        <div className="flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          <span className="text-2xl font-medium">Субота</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-8 h-8" />
          <span className="text-2xl font-medium">11:00 - 15:00</span>
        </div>
      </div>

      {/* Додатковий текст */}
      <div className="text-left">
        <p className="text-3xl font-bold mb-10">10 занять Workshop</p>
        <p className="text-3xl font-medium text-gray-800">
          Кількість місць обмежена. Можливість участі 
        </p>
        <p className="text-3xl font-medium text-gray-800">
          уточнюйте у менеджера.
        </p>
      </div>

      {/* Блок з ZOOM */}
      <div className="mt-20 w-[298px] h-[60px] flex items-center gap-4 rounded-[10px] bg-[#82A1FF99] px-4">
        <Video className="w-10 h-10 text-[#0A2578]" />
        <span className="text-[19px] font-bold leading-none text-[#0A2578]">
          ПРОХОДИТЬ У ZOOM
        </span>
      </div>

      {/* Текстовий опис під блоком */}
      <p className="mt-20 w-[656px] text-[20px] font-medium leading-tight text-black">
        Учасники працюють у групах над власними завданнями під керівництвом
        викладача. Ви отримуєте практичний досвід і цінний зворотний зв’язок від
        експерта. Завдання максимально наближені до реальних професійних
        ситуацій.
      </p>
    </section>
  );
}

function SkillsSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-30">
      {/* Перший ряд - 3 елементи */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-80 justify-items-center mb-20">
        <div className="flex flex-col items-center">
          <div className="w-[180px] h-[180px] flex items-center justify-center rounded-full bg-[#82A1FF99]">
            <BarChart className="w-[100px] h-[100px] text-[#0A2578]" />
          </div>
          <p className="mt-4 text-lg font-bold text-black text-center">Аналітика</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[180px] h-[180px] flex items-center justify-center rounded-full bg-[#82A1FF99]">
            <Youtube className="w-[100px] h-[100px] text-[#0A2578]" />
          </div>
          <p className="mt-4 text-lg font-bold text-black text-center">YouTube</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[180px] h-[180px] flex items-center justify-center rounded-full bg-[#82A1FF99]">
            <Search className="w-[100px] h-[100px] text-[#0A2578]" />
          </div>
          <p className="mt-4 text-lg font-bold text-black text-center">SEO-просування</p>
        </div>
      </div>

      {/* Другий ряд - 2 елементи */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 justify-items-center mb-20">
        <div className="flex flex-col items-center">
          <div className="w-[180px] h-[180px] flex items-center justify-center rounded-full bg-[#82A1FF99]">
            <Lightbulb className="w-[100px] h-[100px] text-[#0A2578]" />
          </div>
          <p className="mt-4 text-lg font-bold text-black text-center">Контекстна реклама</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[180px] h-[180px] flex items-center justify-center rounded-full bg-[#82A1FF99]">
            <Target className="w-[100px] h-[100px] text-[#0A2578]" />
          </div>
          <p className="mt-4 text-lg font-bold text-black text-center">Аналіз ринку, конкурентів та ЦА</p>
        </div>
      </div>

      {/* Третій ряд - 3 елементи */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-80 justify-items-center mb-20">
        <div className="flex flex-col items-center">
          <div className="w-[180px] h-[180px] flex items-center justify-center rounded-full bg-[#82A1FF99]">
            <MonitorCheck className="w-[100px] h-[100px] text-[#0A2578]" />
          </div>
          <p className="mt-4 text-lg font-bold text-black text-center">Таргетована реклама</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[180px] h-[180px] flex items-center justify-center rounded-full bg-[#82A1FF99]">
            <Mail className="w-[100px] h-[100px] text-[#0A2578]" />
          </div>
          <p className="mt-4 text-lg font-bold text-black text-center">Email-маркетинг</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-[180px] h-[180px] flex items-center justify-center rounded-full bg-[#82A1FF99]">
            <Puzzle className="w-[100px] h-[100px] text-[#0A2578]" />
          </div>
          <p className="mt-4 text-lg font-bold text-black text-center">Стратегія</p>
        </div>
      </div>

      {/* Четвертий ряд - 1 елемент */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center">
          <div className="w-[180px] h-[180px] flex items-center justify-center rounded-full bg-[#82A1FF99]">
            <Megaphone className="w-[100px] h-[100px] text-[#0A2578]" />
          </div>
          <p className="mt-4 text-lg font-bold text-black text-center">SMM</p>
        </div>
      </div>
    </section>
  );
}

function LearningProcess() {
  const items = [
    {
      icon: <BookOpen className="w-[100px] h-[100px] text-[#0A2578]" />,
      title: "Теорія + практика:",
      text: "Спочатку перегляд відеоуроків, потім виконання завдань за матеріалом уроку з готовими шаблонами для ефективного засвоєння.",
    },
    {
      icon: <CheckSquare className="w-[100px] h-[100px] text-[#0A2578]" />,
      title: "Домашні завдання та тестування:",
      text: "Протягом курсу спікери перевіряють ваші роботи, відповідають на всі запитання, а куратор супроводжує навчання, підтримує та мотивує.",
    },
    {
      icon: <Users className="w-[100px] h-[100px] text-[#0A2578]" />,
      title: "Живі Q&A-сесії:",
      text: "Спікери проводять онлайн-сесії «Питання–Відповідь», де ви можете отримати розгорнуті відповіді на свої запитання в реальному часі.",
    },
    {
      icon: <Award className="w-[100px] h-[100px] text-[#0A2578]" />,
      title: "Диплом:",
      text: "Після завершення курсу ви проходите підсумкове тестування та отримуєте офіційний диплом, що підтверджує ваші навички професійного інтернет-маркетолога.",
    },
  ];

  return (
    <section
      className="w-full py-30 px-6"
    >
      {/* Заголовок */}
      <h2 className="text-center font-[Afacad] font-bold text-[40px] mb-40">
        Як <span className="text-[#1345DE]">проходить</span> навчання?
      </h2>

      {/* Блоки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-40 max-w-[1100px] mx-auto">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-20">
            {/* Пігулка як у Figma */}
            <div
              className="w-[330px] h-[140px] flex items-center justify-center rounded-[100px] bg-[#82A1FF99] -rotate-45"
            >
              <div className="rotate-45">{item.icon}</div>
            </div>

            {/* Текст */}
            <div className="max-w-[400px]">
              <h3 className="font-[Mulish] font-bold text-[22px] mb-2 text-black">
                {item.title}
              </h3>
              <p className="font-[Mulish] font-medium text-[20px] text-black leading-snug">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SalarySection() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true); // запуск анімації після завантаження
  }, []);

  const chartData = [47, 98, 83, 64, 121, 47, 70]; // висоти стовпчиків
  const cities = [
    { city: "Вся Україна", salary: "35 000грн", change: "+17%" },
    { city: "Київ", salary: "40 000грн", change: "+33%" },
    { city: "Дніпро", salary: "32 500грн", change: "+18%" },
    { city: "Львів", salary: "35 000грн", change: "+17%" },
    { city: "Одеса", salary: "34 000грн", change: "+13%" },
    { city: "Харків", salary: "26 000грн", change: "+16%" },
    { city: "Віддалено", salary: "40 000грн", change: "+23%" },
  ];

  return (
    <section className="w-full py-12 flex flex-col items-center">
      {/* Заголовок */}
      <h2 className="text-5xl font-bold font-[Afacad] text-center mb-10">
        Скільки можна <span className="text-blue-600">заробляти</span>
      </h2>

      {/* Білий контейнер */}
      <div className="bg-white border border-black/30 rounded-2xl shadow-lg p-10 w-[1100px] max-w-full flex flex-col gap-10">
        {/* Верхні блоки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Лівий блок */}
          <div className="border border-black/20 rounded-xl p-6 flex flex-col items-center justify-center">
            <p className="text-5xl font-bold font-[Mulish] text-black mb-3">
              35 000грн
            </p>
            <p className="text-base font-medium font-[Mulish] text-black">
              на серпень 2025
            </p>
          </div>

          {/* Правий блок */}
          <div className="border border-black/20 rounded-xl p-6 flex flex-col items-center">
            <p className="text-xl font-bold font-[Mulish] text-black mb-6">
              Розподіл зарплат
            </p>
            <div className="flex items-end h-[130px] w-full justify-between">
              {chartData.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#82A1FF99] rounded-t-lg mx-[1px]"
                  style={{
                    height: animate ? `${h}px` : "0px",
                    transition: `height 0.6s ease ${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            {/* Мін і макс */}
            <div className="flex justify-between w-full mt-4 px-2">
              <span className="text-sm font-[Mulish] text-black">
                19 000грн
              </span>
              <span className="text-sm font-[Mulish] text-black">
                60 000грн
              </span>
            </div>
          </div>
        </div>

        {/* Таблиця */}
        <div className="rounded-xl border border-black/20 p-6">
          {/* Заголовки */}
          <div className="grid grid-cols-3 text-center font-medium font-[Mulish] text-lg text-black mb-3">
            <p>Міста</p>
            <p>Зарплата</p>
            <p>Зміна за рік</p>
          </div>
          <hr className="border border-black/70 mb-4" />

          {/* Рядки */}
          {cities.map((row, i) => (
            <div key={i}>
              <div className="grid grid-cols-3 text-center items-center py-3">
                <p className="text-lg font-bold text-black">{row.city}</p>
                <p className="text-lg font-bold text-black">{row.salary}</p>
                <p className="text-lg font-medium text-green-600">{row.change}</p>
              </div>
              {i !== cities.length - 1 && (
                <hr className="border border-black/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

function EmploymentHelp() {
  const steps = [
    {
      number: "1",
      text: (
        <>
          <p>Ви отримуєте завірений диплом від <b>BrainBoost</b>,</p>
          <p>це збільшить ваші шанси на успішне працевлаштування.</p>
        </>
      ),
    },
    {
      number: "2",
      text: (
        <>
          <p>Кожен диплом оснащений <b>QR-кодом</b>: роботодавець може швидко</p>
          <p>перевірити його справжність та ознайомитися з вашою статистикою</p>
          <p>навчання — пройдені уроки, прослухані години, набрані бали тощо.</p>
        </>
      ),
    },
    {
      number: "3",
      text: (
        <>
          <p>Усі учасники отримують доступ до закритого курсу з</p>
          <p>працевлаштування <b>“BrainBoost Talents”</b>. Ви навчитеся ефективно</p>
          <p>презентувати себе на всіх етапах відбору, підготовлятися до</p>
          <p>співбесід і отримувати роботу мрії в топових ІТ-компаніях.</p>
        </>
      ),
    },
  ];

  return (
    <section className="w-full bg-[#82A1FF99] py-30 px-6 flex justify-center">
      <div className="max-w-[1280px] w-full">
        {/* Заголовок */}
        <h2 className="text-white text-5xl md:text-4xl font-bold font-[Afacad] text-center mb-20">
          Ми допомагаємо з працевлаштуванням
        </h2>

        {/* Список */}
        <div className="flex flex-col gap-20">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-6"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              viewport={{ once: true }}
            >
              {/* Кружечок з номером */}
              <div className="flex items-center justify-center w-[86px] h-[86px] rounded-full bg-[#0A2578] shrink-0">
                <span className="text-white text-4xl font-bold font-[Mulish]">
                  {step.number}
                </span>
              </div>

              {/* Текст */}
              <div className="text-black text-lg md:text-xl font-[Mulish] leading-snug">
                {step.text}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrainingSection() {
  const imagesRow1 = [
    "/images/img1.png",
    "/images/img2.png",
    "/images/img3.png",
    "/images/img4.png",
  ];

  const imagesRow2 = [
    "/images/img5.png",
    "/images/img6.png",
    "/images/img7.png",
    "/images/img8.png",
  ];

  return (
    <section className="w-full flex flex-col items-center py-20">
      {/* Заголовок */}
      <div className="text-center mb-20">
        <p
          className="font-[Afacad] font-bold text-[64px] leading-[100%] text-black"
        >
          Наші навчальні
        </p>
        <p
          className="font-[Afacad] font-bold text-[64px] leading-[100%] text-[#82A1FF] mb-10"
        >
          програми проходять
        </p>
        <p className="font-[Afacad] font-bold text-[23px] leading-[100%] text-black">
          власники, керівники та співробітники провідних компаній
        </p>
      </div>

      {/* Ряд картинок */}
      <div className="grid grid-cols-4 gap-15 mb-15">
        {imagesRow1.map((src, i) => (
          <img key={i} src={src} alt={`img${i + 1}`} className="w-[250px] h-[163px] object-contain" />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-15 mb-15">
        {imagesRow2.map((src, i) => (
          <img key={i} src={src} alt={`img${i + 5}`} className="w-[250px] h-[163px] object-contain" />
        ))}
      </div>
    </section>
  );
}

function InstallmentSection() {
  const steps = [
    "Залишіть заявку на участь та переходьте до оплати",
    "Виберіть спосіб оплати частинами",
    "Оплачуйте частинами без переплат через Monobank або PrivatBank",
  ];

  return (
    <section className="w-full flex flex-col items-center py-20">
      {/* Заголовок */}
      <h2
        className="font-[Afacad] font-bold text-[64px] leading-[100%] text-black text-center mb-6"
        style={{ width: "838px", height: "85px" }}
      >
        Розстрочка без переплат
      </h2>

      {/* Основний текст */}
      <p
        className="font-[Mulish] font-medium text-[24px] leading-[100%] text-center mb-30"
        style={{ width: "976px", height: "60px" }}
      >
        Почніть навчатися вже зараз, а оплату вносьте частинами. Комфортний формат{" "}
        <span className="text-[#82A1FF]">до 5 місяців*</span>
      </p>

      {/* Кнопка */}
      <button
        className="font-[Afacad] font-bold text-[40px] text-[#FFFFFF] text-center py-1 px-10 rounded-[10px] mt-6"
        style={{ width: "582px", height: "67px", backgroundColor: "#1345DE" }}
      >
        Як сплатити частинами?
      </button>

      {/* Пункти */}
      <ul className="mt-20 space-y-4 w-[800px] ml-auto mr-auto text-left">
        {steps.map((step, i) => (
          <li
            key={i}
            className="font-[Mulish] font-bold text-[24px] leading-[100%] text-black flex items-start gap-5"
          >
            <span className="w-2 h-2 mt-3 bg-black rounded-full flex-shrink-0"></span>
            {step}
          </li>
        ))}
      </ul>

      {/* Лінія знизу */}
      <div
        className="mt-40"
        style={{
          width: "1040px",
          borderTop: "1px solid #000000",
        }}
      ></div>
    </section>
  );
}

function BookingSection() {
  return (
    <section className="booking-section flex flex-col items-center py-20">
      {/* Заголовок */}
      <h2 className="text-[48px] font-bold font-[Afacad] leading-tight max-w-[1040px] text-center mb-12">
        Щоб <span className="text-[#1345DE]">забронювати ціну зі знижкою</span><br />
        та підключитися до лімітованої групи,<br />
        заповніть форму
      </h2>

      {/* Синій блок */}
      <div className="relative mt-10 w-[850px] rounded-[30px] bg-[#82A1FF] shadow-[9px_-9px_10px_rgba(0,0,0,0.25),-9px_9px_10px_rgba(0,0,0,0.25)] flex gap-10 p-16 justify-center">
        
        {/* Пігулки */}
        <div className="absolute w-[210px] h-[89px] bg-transparent border border-[#0A25784A] rounded-[48px] rotate-[-30deg] -top-8 left-[200px]"></div>
        <div className="absolute w-[144px] h-[91px] bg-transparent border border-[#0A25784A] rounded-[48px] rotate-[45deg] bottom-4 right-8"></div>

        {/* Ліва частина */}
        <div className="flex flex-col max-w-[320px] relative z-30 pt-12">
          {/* додано pt-12 щоб опустити тексти вниз */}
          <div className="w-[320px] h-[100px] bg-[#0A2578] text-white font-[Afacad] font-bold text-[32px] rounded-[10px] flex items-center justify-center text-left mb-4">
            Забронювати<br />місце на курсі
          </div>
          <p className="text-white font-[Mulish] font-medium text-[18px] mb-3">
            Або отримати безкоштовну консультацію
          </p>
          <p className="font-[Mulish] font-medium text-[18px] text-[#D4E3FF] mb-2">
            Заповнюй форму і отримай демо урок:
          </p>
          <p className="text-white font-[Mulish] font-medium text-[18px]">
            Що таке ІМ, напрямки та що потребує ринок зараз?
          </p>
        </div>

        {/* Права частина: форма */}
        <form className="flex flex-col gap-6 w-[400px] relative z-10">
          <input
            type="text"
            placeholder="Імʼя та прізвище"
            className="h-[50px] rounded-[10px] px-4 font-[Mulish] text-[18px] border border-gray-300 bg-white"
          />
          <input
            type="email"
            placeholder="Email"
            className="h-[50px] rounded-[10px] px-4 font-[Mulish] text-[18px] border border-gray-300 bg-white"
          />
          <input
            type="tel"
            placeholder="Телефон"
            className="h-[50px] rounded-[10px] px-4 font-[Mulish] text-[18px] border border-gray-300 bg-white"
          />
          <button
            type="submit"
            className="w-[220px] h-[65px] rounded-[10px] bg-white border-[3px] border-[#1345DE] text-[#1345DE] font-[Mulish] font-bold text-[16px] text-center hover:bg-[#1345DE] hover:text-white transition-colors duration-300"
          >
            Записатися на курс
          </button>
          <span className="text-white font-[Mulish] font-bold text-[16px] mt-2">
            Залишилось 5 місць із 50
          </span>
        </form>
      </div>
    </section>
  );
}

type FAQ = {
  question: string;
  answer: string;
};

function FAQSection() {
  const faqs: FAQ[] = [
    {
      question: "Чому digital-маркетологи такі популярні?",
      answer:
        "Пандемія 2020 року показала, що без онлайн-присутності бізнесу ніяк. Підприємці усвідомили це, але якісних digital-маркетологів на ринку майже немає.",
    },
    {
      question: "Я зовсім новачок. Курс підходить мені?",
      answer:
        "Так. Два перші блоки програми розраховані на те, щоб дати розуміння та перспективи професії для новачка. Фахівці з досвідом можуть структурувати свої знання та заповнити прогалини.",
    },
    {
      question: "Як довго буде доступний курс?",
      answer:
        "Ви отримуєте доступ рівно на рік. Цього часу точно вистачить, щоб пройти всі уроки.",
    },
    {
      question: "Я гарантовано отримаю сертифікат, якщо я буду на курсі?",
      answer:
        "Набравши 265 балів за підсумками всього навчання, ви отримаєте диплом. Якщо набираєте менше – отримаєте сертифікат про те, що курс прослухано.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="px-6 py-16">
      {/* Заголовок */}
      <h2 className="text-7xl font-bold text-center mb-12 leading-tight">
        Відповіді на
        <br />
        <span className="text-blue-600">поширені запитання</span>
      </h2>

      {/* FAQ блок */}
      <div className="max-w-4xl mx-auto flex flex-col gap-4 mb-20">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-5 cursor-pointer transition hover:shadow-lg"
            onClick={() => toggleFAQ(index)}
          >
            <div className="flex justify-between items-center">
              <p className="text-lg font-bold">{faq.question}</p>
              <ChevronDown
                className={`transition-transform duration-300 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </div>
            {openIndex === index && (
              <p className="mt-3 text-gray-700 text-base">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>

      {/* Call-to-Action */}
      <div className="text-center mb-20">
        <p className="text-6xl font-bold text-black leading-tight">
          Опануйте <br />
          <span className="text-blue-600">високооплачувану</span> <br />
          digital-професію з нуля
        </p>
        <button
          className="mt-6 font-semibold text-blue-800 hover:bg-[#1345DE] hover:text-white transition"
          style={{
            width: "232px",
            height: "73px",
            border: "3px solid #1345DE",
            borderRadius: "10px",
          }}
        >
          Стань інтернет-маркетологом
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-[#0A2578] text-white py-10 px-6 rounded-t-3xl">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Лого та адреса */}
          <div>
            <h3 className="text-xl font-bold mb-3">Brainboost</h3>
            <p>Ukraine, Kyiv, вул. Bohdana Khmelnytskoho, 25А</p>
            <div className="flex gap-3 mt-4 text-xl">
              <i className="fab fa-facebook-f cursor-pointer hover:text-blue-400"></i>
              <i className="fab fa-instagram cursor-pointer hover:text-pink-400"></i>
              <i className="fab fa-youtube cursor-pointer hover:text-red-500"></i>
              <i className="fab fa-tiktok cursor-pointer hover:text-gray-300"></i>
            </div>
          </div>

          {/* Курси */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Курси</h4>
            <ul className="space-y-2">
              <li>Маркетинг</li>
              <li>Дизайн</li>
              <li>Бізнес</li>
              <li>IT</li>
              <li>Фінанси</li>
            </ul>
          </div>

          {/* Більше */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Більше</h4>
            <ul className="space-y-2">
              <li>Відгуки</li>
              <li>Питання та відповіді</li>
              <li>Про нас</li>
            </ul>
          </div>

          {/* Контакти */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Контакти</h4>
            <ul className="space-y-2">
              <li>
                Telegram:{" "}
                <a
                  href="https://t.me/BrainBoost_bot"
                  className="underline hover:text-blue-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://t.me/BrainBoost_bot
                </a>
              </li>
              <li>
                Email:{" "}
                <a
                  href="mailto:info@BrainBoost.com"
                  className="underline hover:text-blue-400"
                >
                  info@BrainBoost.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </section>
  );
}

export default function MarketingPage() {
  return (
    <main className="relative w-full" style={{
        backgroundImage: 'url("/images/back.png")',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
      }}>
      <Hero />
      <WhoIsThisCourseFor />
      <WhoTeaches />
      <MentorsGallery />
      <WhatYouLearn />
      <PreStartBlock />
      <MarketingTopicsSection />
      <CoursePreview />
      <WorkshopBlock />
      <SkillsSection />
      <LearningProcess />
      <SalarySection />
      <EmploymentHelp />
      <TrainingSection />
      <InstallmentSection />
      <BookingSection />
      <FAQSection />
    </main>
  );
}
