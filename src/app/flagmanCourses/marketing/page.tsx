'use client';

export const revalidate = 0; // или: export const dynamic = 'force-dynamic';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, Calendar, Clock, Video, ChevronDown, BookOpen, CheckSquare, Users, Award,
  BarChart, Youtube, MonitorCheck, Search, Target, Mail, Puzzle, Megaphone, Lightbulb
} from 'lucide-react';
import { FaFacebookF, FaYoutube, FaTelegramPlane, FaInstagram, FaTiktok } from 'react-icons/fa';
import FooterCard from '@/components/FooterCard';

/* ---------- Animations ---------- */
const fadeUp: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } };
const fadeIn: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } } };
const staggerContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } };

/* ---------- Helpers ---------- */
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, [query]);
  return matches;
}

/* ---------- Types ---------- */
type TextAlign = 'left' | 'center' | 'right' | 'justify' | 'start' | 'end';

interface CardProps {
  title: string;
  description: string;
  width?: string; // CSS width token for desktop (e.g., "641px")
}

/* ---------- Reusable UI ---------- */
function CourseCard({ title, description, width = 'auto' }: CardProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  return (
    <motion.div variants={fadeUp} className="flex flex-col md:flex-row items-start gap-6 w-full">
      <div
        className="rounded-lg flex items-center justify-center px-4 py-3 w-full md:w-auto"
        style={{
          background: 'linear-gradient(90deg, rgba(10, 37, 120, 0.6) 42.24%, rgba(255, 255, 255, 0.6) 98.51%)',
          color: '#1345DE',
          minWidth: isDesktop ? width : undefined,
        }}
      >
        <span className="font-[Mulish] font-bold text-lg sm:text-xl md:text-2xl text-center break-words">
          {title}
        </span>
      </div>

      <div className="p-4 sm:p-6 w-full max-w-[800px]" style={{ color: 'black', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <p className="font-[Mulish] font-medium text-base sm:text-lg md:text-xl leading-relaxed break-words whitespace-normal">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

function WhoIsThisCourseFor() {
  const cards: CardProps[] = [
    { title: 'Усім, хто хоче опанувати нову професію', description: 'Ви у пошуках себе. Думаєте, як поєднати фінансову стабільність із справою, яка буде надихати щодня. Або ж прагнете радикальних змін — нового етапу життя, нових можливостей і нових цілей.', width: '641px' },
    { title: 'Керівникам та власникам бізнесу', description: 'Шукаєте ефективні курси та програми для підвищення кваліфікації ваших менеджерів і команди в інтернет-маркетингу, щоб більше часу приділяти розвитку та масштабуванню бізнесу.', width: '535px' },
    { title: 'Підприємцям', description: 'Вам необхідні комплексні знання з інтернет-маркетингу, щоб вибудувати стабільний потік онлайн-продажів, контролювати роботу підрядників і розуміти, які конкретні результати має приносити команда.', width: '334px' },
    { title: 'Маркетологам', description: 'Бажаєте стати експертом у сфері інтернет-просування, залучати більше клієнтів у бізнес, розвиватися професійно та зростати у доходах.', width: '334px' },
  ];

  return (
    <section className="relative w-full backdrop-blur-sm pt-16 sm:pt-24 lg:pt-32 px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 lg:pb-32 rounded-xl shadow-lg">
      <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="font-[Afacad] font-bold text-2xl sm:text-3xl lg:text-[42px] text-center mb-10 sm:mb-16 lg:mb-25" style={{ maxWidth: '389px', margin: '0 auto' }}>
        <span className="text-[#1345DE]">Кому</span> <span className="text-black">підходить курс</span>
      </motion.h2>

      <div className="mt-8 sm:mt-12 lg:mt-70">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex flex-col gap-8 sm:gap-12">
          {cards.map((card, idx) => <CourseCard key={idx} {...card} />)}
        </motion.div>
      </div>
    </section>
  );
}

function WhoTeaches() {
  return (
    <section className="relative w-full backdrop-blur-sm shadow-lg pt-10 pb-40">
      <h2 className="font-[Afacad] font-bold text-[40px] text-center mb-6">
        <span className="text-[#1345DE]">Хто</span> <span className="text-black">проводить навчання?</span>
      </h2>
      <p className="font-[Mulish] font-medium text-[24px] text-center max-w-[600px] mx-auto">
        Ці люди будуть вашими менторами та наставниками <span className="text-[#1345DE] font-bold">протягом 4 місяців</span>
      </p>
    </section>
  );
}

const mentors = [
  { name: 'Анастасія Марчук', role: 'Digital-стратег', image: '/images/mentors/image1.jpg' },
  { name: 'Дмитро Сидоренко', role: 'PPC-спеціаліст', image: '/images/mentors/image2.jpg' },
  { name: 'Ярослав Гаврилюк', role: 'SMM-стратег, креатор, лектор, СЕО SMM бюро', image: '/images/mentors/image3.jpg' },
  { name: 'Мирослава Данилюк', role: 'Digital-стратег', image: '/images/mentors/image4.jpg' },
  { name: 'Артем Кравченко', role: 'Аналітік, маркетолог', image: '/images/mentors/image5.jpg' },
  { name: 'Злата Мельник', role: 'Head of SEO Departament в Netpeak', image: '/images/mentors/image6.jpg' },
  { name: 'Вікторія Марченко', role: 'Digital-маркетолог, product manager, product owner', image: '/images/mentors/image7.jpg' },
];

export function MentorsGallery() {
  return (
    <div className="relative z-10 -mt-10 overflow-hidden backdrop-blur-sm py-10 shadow-lg">
      <motion.div className="flex gap-6 px-6 w-max" animate={{ x: [-0, -2000] }} transition={{ repeat: Infinity, repeatType: 'loop', duration: 40, ease: 'linear' }}>
        {mentors.map((mentor, i) => (
          <div key={i} className="w-[298px] h-[396px] relative flex-shrink-0 rounded-md overflow-hidden">
            <Image src={mentor.image} alt={mentor.name} fill className="object-cover" />
            <div className="absolute bottom-4 left-4 right-4 text-center text-white p-2 rounded bg-black/50">
              <h3 className="font-[Mulish] font-bold text-[20px]">{mentor.name}</h3>
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
    <section className="relative min-h-screen flex items-start overflow-hidden shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start pt-16 sm:pt-24 md:pt-28">
          <motion.div variants={fadeUp} className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="font-[Afacad] font-bold text-3xl sm:text-4xl md:text-[56px] leading-snug md:leading-[120%] text-slate-900 mt-12 sm:mt-16 md:mt-32 mb-6 sm:mb-10 md:mb-12">
              Комплексний <span className="text-black whitespace-nowrap">інтернет-маркетинг</span>
            </h1>

            <div className="flex justify-center md:justify-start items-center gap-2 sm:gap-3 mb-8 sm:mb-10 md:mb-12">
              {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 fill-[#EBDB25] text-[#EBDB25]" />))}
            </div>

            <p className="font-[Mulish] font-medium text-base sm:text-lg md:text-[24px] text-black mb-8 sm:mb-10 md:mb-12 max-w-full md:max-w-[530px]">
              Опануйте найпопулярніші digital-інструменти та запустіть першу рекламну кампанію.
            </p>

            <div className="flex justify-center md:justify-start items-center gap-4">
              <a
                href="#signup"
                onClick={(e) => {
                  e.preventDefault();
                  const link = e.currentTarget;
                  link.classList.add('scale-95');
                  setTimeout(() => link.classList.remove('scale-95'), 150);
                  if (typeof document !== 'undefined') document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 sm:px-8 py-2 sm:py-3 rounded-[44px] border-[3px] border-[#1345DE] bg-white text-[#1345DE] font-semibold transition duration-300 hover:bg-[#1345DE] hover:text-white transform"
              >
                Записатися на курс
              </a>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="relative flex justify-center md:justify-end mt-10 md:mt-0">
            <img src="/images/hero-illustration.png.png" alt="Hero" className="rounded-[20px] sm:rounded-[24px] md:rounded-[30px] object-cover w-full max-w-[400px] sm:max-w-[500px] md:max-w-[630px]" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function WhatYouLearn() {
  return (
    <section className="w-full px-4 sm:px-6 mt-16 sm:mt-24 lg:mt-36 py-12 sm:py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-start gap-12 md:gap-24">
        <h2 className="font-[Afacad] font-bold text-4xl sm:text-4xl lg:text-[56px] leading-snug lg:leading-[110%] w-full md:max-w-[419px] text-center md:text-left mx-auto md:mx-0">
          Чому конкретно <br /> ви навчитеся <span className="text-[#1345DE]">за</span> <br /> <span className="text-[#1345DE]">4 місяці</span>
        </h2>

        <div className="flex flex-col gap-4 sm:gap-6 max-w-full md:max-w-[508px] md:mt-6 text-center md:text-left">
          <p className="font-[Mulish] font-medium text-base sm:text-lg lg:text-[24px] leading-relaxed text-black">
            Ви отримаєте структуровані знання, тотальну практику та досвід кращих спікерів в своїх напрямках діяльності.
          </p>
          <p className="font-[Mulish] font-bold text-xl sm:text-2xl lg:text-[40px] leading-snug lg:leading-[120%] text-black break-words">
            <span className="text-[#1345DE]">15</span> модулів <span className="text-[#1345DE]">98</span> занять <span className="text-[#1345DE]">17</span> спікерів
          </p>
        </div>
      </div>
    </section>
  );
}

function PreStartBlock() {
  const items = [
    { text: 'Знайомство зі студентами, продактом, ментором, координаторами', side: 'left' },
    { text: 'Як навчатися на курсі', side: 'right' },
    { text: 'Огляд платформи, лекції, тести, домашні завдання', side: 'left' },
    { text: 'Отримання практики на воркшопах', side: 'right' },
    { text: 'Як оцінюється навчання, мотивація дійти до кінця, бонуси по завершенню курса', side: 'left' },
    { text: 'Маркетингова стратегія для реального бізнесу як головне завдання курсу', side: 'right' },
  ] as const;

  return (
    <section className="w-full max-w-[1200px] mx-auto bg-white rounded-xl shadow-lg border border-gray-200 px-4 sm:px-6 lg:px-12 py-6 sm:py-12 lg:py-16">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-4 sm:mb-6">
        <button className="w-full sm:w-[248px] h-[52px] sm:h-[68px] bg-[#1345DE] rounded-xl font-bold text-base sm:text-[20px] text-white">
          Заняття PRE-START
        </button>
        <p className="text-lg sm:text-[32px] font-bold text-black text-center md:text-left">Продакт курсу, ментор, координатори</p>
      </div>

      <hr className="border-t-2 border-[#82A1FF99] w-full sm:w-[87%] mx-auto my-4 sm:my-6" />

      <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
        {items.map((item, i) => {
          const isLeft = item.side === 'left';
          const gradient = isLeft ? 'bg-gradient-to-l' : 'bg-gradient-to-r';
          const justifyContent = isLeft ? 'justify-start md:justify-start' : 'justify-end md:justify-end';
          return (
            <div key={i} className={`${gradient} from-[#FFFFFF99] to-[#0A257899] w-full h-[72px] sm:h-[92px] flex items-center ${justifyContent} px-4 sm:px-6 rounded-xl`}>
              <p className="font-medium text-base sm:text-[20px] text-black text-center md:text-left break-words">{item.text}</p>
            </div>
          );
        })}
      </div>

      <div className="w-full bg-[#82A1FF99] flex justify-center mb-4 sm:mb-8">
        <div className="p-4 sm:p-12 flex flex-col gap-2 text-center md:text-left max-w-full md:max-w-[800px]">
          <h3 className="font-bold text-lg sm:text-[24px] mb-2">В результаті</h3>
          <p className="font-medium text-sm sm:text-[17px]">В результаті участі в організаційному зідзвоні та подальшому вивченні матеріалів</p>
          <p className="font-medium text-sm sm:text-[17px]">модулю 0 студенти краще розуміють процес навчання, отримують відповіді на свої</p>
          <p className="font-medium text-sm sm:text-[18px]">запитання, знайомляться, адаптуються</p>
        </div>
      </div>

      <div className="flex justify-center mb-4 sm:mb-0">
        <button className="w-full sm:w-[424px] h-[52px] sm:h-[68px] bg-[#1345DE] rounded-xl font-bold text-base sm:text-[20px] text-white">
          Хочу стати інтернет-маркетологом
        </button>
      </div>
    </section>
  );
}

function MarketingTopicsSection() {
  const topics = [
    'Основи інтернет-маркетингу', 'Аналіз ринку, конкурентів і цільової аудиторії', 'Контент-маркетинг',
    'Email-маркетинг', 'Таргетована реклама', 'SMM-просування', 'Контекстна реклама', 'SEO-просування',
    'LinkedIn', 'YouTube-просування', 'WEB-аналітика', 'Чат-боти та квізи', 'Стратегія', 'Продаж стратегії та робота з замовником',
  ];

  return (
    <section className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row gap-6 sm:gap-8 mt-12 sm:mt-20 md:mt-40 px-4 sm:px-6">
      <ol className="w-full md:w-[494px] flex flex-col gap-4 sm:gap-6 md:gap-10 font-bold text-base sm:text-[20px] text-black list-decimal list-inside">
        {topics.map((topic, index) => (<li key={index} className="leading-snug sm:leading-tight">{topic}</li>))}
      </ol>

      <div className="w-full md:w-[616px] h-auto mt-6 md:mt-0">
        <img src="/images/img.png" alt="Marketing" className="w-full h-auto rounded-lg" />
      </div>
    </section>
  );
}

function CoursePreview() {
  const items = [
    { title: 'Практичні домашні завдання', text: 'Ви одразу відточуєте отримані знання на практиці. Вже на курсі ви отримаєте досвід, необхідний для роботи з першими клієнтами.' },
    { title: 'Викладачі-практики', text: 'Ви навчаєтесь у людей з багаторічним досвідом, які працюють з великими компаніями, відстежують тренди професії та сортують знання у зрозумілий алгоритм для вас.' },
    { title: 'Навчання у зручний для вас час', text: 'Уроки знаходяться на освітній платформі. Ви можете самостійно налаштувати навчання під свій графік.' },
    { title: 'Диплом або сертифікат', text: 'Після закінчення навчання ви отримуєте диплом або сертифікат, що збільшить ваші шанси на успішне працевлаштування.' },
    { title: 'Можливість вчитися з нуля', text: 'Курс буде корисним і спеціалістам, і новачкам. Ви можете стартувати вже після проходження курсу.' },
    { title: 'Ментор та координатори', text: 'На курсі є команда підтримки, яка допомагає вам з усіх питань – від навчання до аналізу матеріалу.' },
  ];

  const [index, setIndex] = React.useState(0);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const [slideWidth, setSlideWidth] = React.useState(412);

  React.useEffect(() => {
    const measure = () => {
      const viewport = trackRef.current?.parentElement;
      const vw = viewport ? viewport.clientWidth : 412;
      setSlideWidth(vw <= 640 ? Math.max(280, vw - 32) : 412);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  React.useEffect(() => {
    const id = setInterval(() => setIndex((p) => (p + 1) % items.length), 3000);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <section className="w-full max-w-[1200px] mx-auto flex flex-col items-center gap-8 sm:gap-12 py-12 sm:py-20">
      <div className="text-center mb-6 sm:mb-12 px-4">
        <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-black mb-1 sm:mb-2">Що чекає на вас на курсі</h2>
        <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-[#1345DE]">“Комплексний інтернет-маркетинг”</h2>
      </div>

      <div className="relative w-full overflow-hidden px-4 sm:px-0">
        <div ref={trackRef} className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${index * slideWidth}px)` }}>
          {items.map((item, i) => (
            <div key={i} className="flex-shrink-0 h-auto sm:h-[406px] flex flex-col justify-center items-center bg-white rounded-xl shadow-md p-4 sm:p-6 mx-2 text-center" style={{ width: slideWidth }}>
              <h3 className="font-bold text-lg sm:text-[20px] mb-2 sm:mb-4 text-black">{item.title}</h3>
              <p className="font-medium text-sm sm:text-[16px] text-gray-700 break-words">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 sm:mt-12">
        <button className="w-full sm:w-[424px] h-[52px] sm:h-[68px] bg-[#1345DE] rounded-xl font-bold text-base sm:text-[20px] text-white">
          Хочу стати інтернет-маркетологом
        </button>
      </div>
    </section>
  );
}

function WorkshopBlock() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-6 py-8 sm:py-12">
      <div className="text-center mb-6 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">Додаткова практика з топовими експертами</h2>
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mt-2">10 занять (Workshop)</h3>
      </div>

      <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-black mb-6 sm:mb-10 text-center sm:text-left">Воркшопи: більше 40 годин прокачки навичок</p>

      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-4 sm:gap-16 mb-8 sm:mb-12 text-black">
        <div className="flex items-center gap-2"><Calendar className="w-6 h-6 sm:w-8 sm:h-8" /><span className="text-base sm:text-2xl font-medium">Субота</span></div>
        <div className="flex items-center gap-2"><Clock className="w-6 h-6 sm:w-8 sm:h-8" /><span className="text-base sm:text-2xl font-medium">11:00 - 15:00</span></div>
      </div>

      <div className="text-center sm:text-left mb-6 sm:mb-10">
        <p className="text-lg sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-10">10 занять Workshop</p>
        <p className="text-base sm:text-2xl lg:text-3xl font-medium text-gray-800 mb-1">Кількість місць обмежена. Можливість участі</p>
        <p className="text-base sm:text-2xl lg:text-3xl font-medium text-gray-800">уточнюйте у менеджера.</p>
      </div>

      <div className="mt-6 sm:mt-8 w-full max-w-[298px] h-[60px] flex items-center gap-3 sm:gap-4 rounded-[10px] bg-[#82A1FF99] px-4 mx-auto sm:mx-0">
        <Video className="w-8 h-8 sm:w-10 sm:h-10 text-[#0A2578]" />
        <span className="text-sm sm:text-[19px] font-bold leading-none text-[#0A2578]">ПРОХОДИТЬ У ZOOM</span>
      </div>

      <p className="mt-6 sm:mt-8 w-full sm:max-w-[656px] text-base sm:text-[20px] font-medium leading-relaxed text-black mx-auto sm:mx-0">
        Учасники працюють у групах над власними завданнями під керівництвом викладача. Ви отримуєте практичний досвід і цінний зворотний зв’язок від експерта. Завдання максимально наближені до реальних професійних ситуацій.
      </p>
    </section>
  );
}

function SkillsSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-6 py-8 sm:py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-12 lg:gap-20 justify-items-center mb-8 sm:mb-12 lg:mb-20">
        <div className="flex flex-col items-center"><div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center rounded-full bg-[#82A1FF99]"><BarChart className="w-20 h-20 sm:w-24 sm:h-24 text-[#0A2578]" /></div><p className="mt-2 sm:mt-4 text-base sm:text-lg font-bold text-black text-center">Аналітика</p></div>
        <div className="flex flex-col items-center"><div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center rounded-full bg-[#82A1FF99]"><Youtube className="w-20 h-20 sm:w-24 sm:h-24 text-[#0A2578]" /></div><p className="mt-2 sm:mt-4 text-base sm:text-lg font-bold text-black text-center">YouTube</p></div>
        <div className="flex flex-col items-center"><div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center rounded-full bg-[#82A1FF99]"><Search className="w-20 h-20 sm:w-24 sm:h-24 text-[#0A2578]" /></div><p className="mt-2 sm:mt-4 text-base sm:text-lg font-bold text-black text-center">SEO-просування</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 justify-items-center mb-8 sm:mb-12">
        <div className="flex flex-col items-center"><div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center rounded-full bg-[#82A1FF99]"><Lightbulb className="w-20 h-20 sm:w-24 sm:h-24 text-[#0A2578]" /></div><p className="mt-2 sm:mt-4 text-base sm:text-lg font-bold text-black text-center">Контекстна реклама</p></div>
        <div className="flex flex-col items-center"><div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center rounded-full bg-[#82A1FF99]"><Target className="w-20 h-20 sm:w-24 sm:h-24 text-[#0A2578]" /></div><p className="mt-2 sm:mt-4 text-base sm:text-lg font-bold text-black text-center">Аналіз ринку, конкурентів та ЦА</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-12 lg:gap-20 justify-items-center mb-8 sm:mb-12 lg:mb-20">
        <div className="flex flex-col items-center"><div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center rounded-full bg-[#82A1FF99]"><MonitorCheck className="w-20 h-20 sm:w-24 sm:h-24 text-[#0A2578]" /></div><p className="mt-2 sm:mt-4 text-base sm:text-lg font-bold text-black text-center">Таргетована реклама</p></div>
        <div className="flex flex-col items-center"><div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center rounded-full bg-[#82A1FF99]"><Mail className="w-20 h-20 sm:w-24 sm:h-24 text-[#0A2578]" /></div><p className="mt-2 sm:mt-4 text-base sm:text-lg font-bold text-black text-center">Email-маркетинг</p></div>
        <div className="flex flex-col items-center"><div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center rounded-full bg-[#82A1FF99]"><Puzzle className="w-20 h-20 sm:w-24 sm:h-24 text-[#0A2578]" /></div><p className="mt-2 sm:mt-4 text-base sm:text-lg font-bold text-black text-center">Стратегія</p></div>
      </div>

      <div className="flex justify-center mb-8 sm:mb-12">
        <div className="flex flex-col items-center">
          <div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center rounded-full bg-[#82A1FF99]"><Megaphone className="w-20 h-20 sm:w-24 sm:h-24 text-[#0A2578]" /></div>
          <p className="mt-2 sm:mt-4 text-base sm:text-lg font-bold text-black text-center">SMM</p>
        </div>
      </div>
    </section>
  );
}

function LearningProcess() {
  const items = [
    { icon: <BookOpen className="w-[100px] h-[100px] text-[#0A2578]" />, title: 'Теорія + практика:', text: 'Спочатку перегляд відеоуроків, потім виконання завдань за матеріалом уроку з готовими шаблонами для ефективного засвоєння.' },
    { icon: <CheckSquare className="w-[100px] h-[100px] text-[#0A2578]" />, title: 'Домашні завдання та тестування:', text: 'Протягом курсу спікери перевіряють ваші роботи, відповідають на всі запитання, а куратор супроводжує навчання, підтримує та мотивує.' },
    { icon: <Users className="w-[100px] h-[100px] text-[#0A2578]" />, title: 'Живі Q&A-сесії:', text: 'Спікери проводять онлайн-сесії «Питання–Відповідь», де ви можете отримати розгорнуті відповіді на свої запитання в реальному часі.' },
    { icon: <Award className="w-[100px] h-[100px] text-[#0A2578]" />, title: 'Диплом:', text: 'Після завершення курсу ви проходите підсумкове тестування та отримуєте офіційний диплом, що підтверджує ваші навички професійного інтернет-маркетолога.' },
  ];

  return (
    <section className="w-full py-30 px-6">
      <h2 className="text-center font-[Afacad] font-bold text-[40px] mb-40">Як <span className="text-[#1345DE]">проходить</span> навчання?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-40 max-w-[1100px] mx-auto">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-20">
            <div className="w-[330px] h-[140px] flex items-center justify-center rounded-[100px] bg-[#82A1FF99] -rotate-45"><div className="rotate-45">{item.icon}</div></div>
            <div className="max-w-[400px]">
              <h3 className="font-[Mulish] font-bold text-[22px] mb-2 text-black">{item.title}</h3>
              <p className="font-[Mulish] font-medium text-[20px] text-black leading-snug">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SalarySection() {
  const [animate, setAnimate] = React.useState(false);
  React.useEffect(() => { setAnimate(true); }, []);
  const chartData = [47, 98, 83, 64, 121, 47, 70];
  const cities = [
    { city: 'Вся Україна', salary: '35 000грн', change: '+17%' },
    { city: 'Київ', salary: '40 000грн', change: '+33%' },
    { city: 'Дніпро', salary: '32 500грн', change: '+18%' },
    { city: 'Львів', salary: '35 000грн', change: '+17%' },
    { city: 'Одеса', salary: '34 000грн', change: '+13%' },
    { city: 'Харків', salary: '26 000грн', change: '+16%' },
    { city: 'Віддалено', salary: '40 000грн', change: '+23%' },
  ];

  return (
    <section className="w-full py-12 flex flex-col items-center">
      <h2 className="text-5xl font-bold font-[Afacad] text-center mb-10">Скільки можна <span className="text-blue-600">заробляти</span></h2>

      <div className="bg-white border border-black/30 rounded-2xl shadow-lg p-10 w-[1100px] max-w-full flex flex-col gap-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-black/20 rounded-xl p-6 flex flex-col items-center justify-center">
            <p className="text-5xl font-bold font-[Mulish] text-black mb-3">35 000грн</p>
            <p className="text-base font-medium font-[Mulish] text-black">на серпень 2025</p>
          </div>

          <div className="border border-black/20 rounded-xl p-6 flex flex-col items-center">
            <p className="text-xl font-bold font-[Mulish] text-black mb-6">Розподіл зарплат</p>
            <div className="flex items-end h-[130px] w-full justify-between">
              {chartData.map((h, i) => (
                <div key={i} className="flex-1 bg-[#82A1FF99] rounded-t-lg mx-[1px]" style={{ height: animate ? `${h}px` : '0px', transition: `height 0.6s ease ${i * 0.1}s` }} />
              ))}
            </div>
            <div className="flex justify-between w-full mt-4 px-2">
              <span className="text-sm font-[Mulish] text-black">19 000грн</span>
              <span className="text-sm font-[Mulish] text-black">60 000грн</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/20 p-6">
          <div className="grid grid-cols-3 text-center font-medium font-[Mulish] text-lg text-black mb-3">
            <p>Міста</p><p>Зарплата</p><p>Зміна за рік</p>
          </div>
          <hr className="border border-black/70 mb-4" />
          {cities.map((row, i) => (
            <div key={i}>
              <div className="grid grid-cols-3 text-center items-center py-3">
                <p className="text-lg font-bold text-black">{row.city}</p>
                <p className="text-lg font-bold text-black">{row.salary}</p>
                <p className="text-lg font-medium text-green-600">{row.change}</p>
              </div>
              {i !== cities.length - 1 && <hr className="border border-black/30" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EmploymentHelp() {
  const steps = [
    { number: '1', text: (<><p>Ви отримуєте завірений диплом від <b>BrainBoost</b>,</p><p>це збільшить ваші шанси на успішне працевлаштування.</p></>) },
    { number: '2', text: (<><p>Кожен диплом оснащений <b>QR-кодом</b>: роботодавець може швидко</p><p>перевірити його справжність та ознайомитися з вашою статистикою</p><p>навчання — пройдені уроки, прослухані години, набрані бали тощо.</p></>) },
    { number: '3', text: (<><p>Усі учасники отримують доступ до закритого курсу з</p><p>працевлаштування <b>“BrainBoost Talents”</b>. Ви навчитеся ефективно</p><p>презентувати себе на всіх етапах відбору, підготовлятися до</p><p>співбесід і отримувати роботу мрії в топових ІТ-компаніях.</p></>) },
  ];

  return (
    <section className="w-full bg-[#82A1FF99] py-30 px-6 flex justify-center">
      <div className="max-w-[1280px] w-full">
        <h2 className="text-white text-5xl md:text-4xl font-bold font-[Afacad] text-center mb-20">Ми допомагаємо з працевлаштуванням</h2>
        <div className="flex flex-col gap-20">
          {steps.map((step, i) => (
            <motion.div key={i} className="flex items-start gap-6" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: i * 0.2 }} viewport={{ once: true }}>
              <div className="flex items-center justify-center w-[86px] h-[86px] rounded-full bg-[#0A2578] shrink-0">
                <span className="text-white text-4xl font-bold font-[Mulish]">{step.number}</span>
              </div>
              <div className="text-black text-lg md:text-xl font-[Mulish] leading-snug">{step.text}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrainingSection() {
  const imagesRow1 = ['/images/img1.png', '/images/img2.png', '/images/img3.png', '/images/img4.png'];
  const imagesRow2 = ['/images/img5.png', '/images/img6.png', '/images/img7.png', '/images/img8.png'];

  return (
    <section className="w-full flex flex-col items-center py-20 px-4 sm:px-6">
      <div className="text-center mb-20">
        <p className="font-[Afacad] font-bold text-[64px] leading-[100%] text-black">Наші навчальні</p>
        <p className="font-[Afacad] font-bold text-[64px] leading-[100%] text-[#82A1FF] mb-10">програми проходять</p>
        <p className="font-[Afacad] font-bold text-[23px] leading-[100%] text-black">власники, керівники та співробітники провідних компаній</p>
      </div>

      <div className="grid grid-cols-4 gap-4 sm:gap-6 mb-15 w-full max-w-[1200px]">
        {imagesRow1.map((src, i) => (<img key={i} src={src} alt={`img${i + 1}`} className="w-[250px] h-[163px] object-contain mx-auto" />))}
      </div>

      <div className="grid grid-cols-4 gap-4 sm:gap-6 mb-15 w-full max-w-[1200px]">
        {imagesRow2.map((src, i) => (<img key={i} src={src} alt={`img${i + 5}`} className="w-[250px] h-[163px] object-contain mx-auto" />))}
      </div>
    </section>
  );
}

function InstallmentSection() {
  const steps = [
    'Залишіть заявку на участь та переходьте до оплати',
    'Виберіть спосіб оплати частинами',
    'Оплачуйте частинами без переплат через Monobank або PrivatBank',
  ];

  return (
    <section className="w-full flex flex-col items-center py-10 px-4 sm:px-6">
      <h2 className="font-[Afacad] font-bold text-3xl sm:text-5xl lg:text-[64px] leading-snug sm:leading-tight lg:leading-[100%] text-black text-center mb-6">
        Розстрочка без переплат
      </h2>

      <p className="font-[Mulish] font-medium text-sm sm:text-lg lg:text-[24px] leading-snug text-center mb-6 sm:mb-10">
        Почніть навчатися вже зараз, а оплату вносьте частинами. Комфортний формат <span className="text-[#82A1FF]">до 5 місяців*</span>
      </p>

      <button className="font-[Afacad] font-bold text-lg sm:text-2xl lg:text-[40px] text-white text-center py-3 px-6 sm:px-10 rounded-[10px] mt-4 sm:mt-6 bg-[#1345DE] w-full max-w-[400px] sm:max-w-[582px]">
        Як сплатити частинами?
      </button>

      <ul className="mt-10 sm:mt-20 space-y-3 sm:space-y-4 w-full max-w-[95%] sm:max-w-[800px] text-left">
        {steps.map((step, i) => (
          <li key={i} className="font-[Mulish] font-bold text-sm sm:text-lg lg:text-[24px] leading-snug text-black flex items-start gap-3 sm:gap-5">
            <span className="w-2 h-2 mt-2 sm:mt-3 bg-black rounded-full flex-shrink-0"></span>
            {step}
          </li>
        ))}
      </ul>

      <div className="mt-10 sm:mt-40 w-full max-w-[95%] sm:max-w-[1040px] border-t border-black"></div>
    </section>
  );
}

function BookingSection() {
  const API_URL = process.env.NEXT_PUBLIC_CONTACTS_API || 'http://127.0.0.1:8000/api/contacts/';
  const [form, setForm] = React.useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!form.name.trim() || (!form.email.trim() && !form.phone.trim())) {
      setStatus({ type: 'error', message: 'Вкажіть ім’я та щонайменше email або телефон.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone,
          topic: 'Заявка: Курс (BookingSection)',
          message: 'Заявка з форми "Записатися на курс". Користувач хоче забронювати місце/отримати консультацію.',
        }),
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'Дякуємо! Ми зв’яжемось із вами найближчим часом.' });
        setForm({ name: '', email: '', phone: '' });
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus({ type: 'error', message: 'Помилка відправки: ' + ((data as any)?.error || res.status) });
      }
    } catch {
      setStatus({ type: 'error', message: 'Помилка з’єднання з сервером. Спробуйте ще раз.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="signup" className="booking-section flex flex-col items-center py-10 px-4 sm:px-6">
      <h2 className="text-2xl sm:text-4xl lg:text-[48px] font-bold font-[Afacad] leading-snug sm:leading-tight lg:leading-tight text-center mb-6 sm:mb-12 max-w-full">
        Щоб <span className="text-[#1345DE]">забронювати ціну зі знижкою</span><br />та підключитися до лімітованої групи,<br />заповніть форму
      </h2>

      <div className="relative mt-6 sm:mt-10 w-full max-w-[95%] sm:max-w=[850px] max-w-[850px] rounded-[30px] bg-[#82A1FF] shadow-[9px_-9px_10px_rgba(0,0,0,0.25),-9px_9px_10px_rgba(0,0,0,0.25)] flex flex-col sm:flex-row gap-6 sm:gap-10 p-6 sm:p-16 justify-center">
        <div className="absolute w-36 h-20 border border-[#0A25784A] rounded-[48px] rotate-[-30deg] -top-4 left-12 sm:left-[200px]" />
        <div className="absolute w-36 h-20 border border-[#0A25784A] rounded-[48px] rotate-[45deg] bottom-2 right-4 sm:right-8" />

        <div className="flex flex-col max-w-full sm:max-w-[320px] relative z-30 pt-4 sm:pt-12">
          <div className="w-full sm:w-[320px] h-[100px] bg-[#0A2578] text-white font-[Afacad] font-bold text-lg sm:text-[32px] rounded-[10px] flex items-center justify-center text-left mb-4 p-2 sm:p-0">
            Забронювати<br />місце на курсі
          </div>
          <p className="text-white font-[Mulish] font-medium text-[16px] sm:text-[18px] mb-2">Або отримати безкоштовну консультацію</p>
          <p className="font-[Mulish] font-medium text-[16px] sm:text-[18px] text-[#D4E3FF] mb-1">Заповнюй форму і отримай демо урок:</p>
          <p className="text-white font-[Mulish] font-medium text-[16px] sm:text-[18px]">Що таке ІМ, напрямки та що потребує ринок зараз?</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6 w-full sm:w-[400px] relative z-10" noValidate>
          <input name="name" type="text" placeholder="Імʼя та прізвище" value={form.name} onChange={handleChange} className="h-[50px] rounded-[10px] px-4 font-[Mulish] text-[16px] sm:text-[18px] border border-gray-300 bg-white w-full" autoComplete="name" />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="h-[50px] rounded-[10px] px-4 font-[Mulish] text-[16px] sm:text-[18px] border border-gray-300 bg-white w-full" autoComplete="email" />
          <input name="phone" type="tel" placeholder="Телефон" value={form.phone} onChange={handleChange} className="h-[50px] rounded-[10px] px-4 font-[Mulish] text-[16px] sm:text-[18px] border border-gray-300 bg-white w-full" autoComplete="tel" />
          <button type="submit" disabled={loading} className="w-full sm:w-[220px] h-[50px] sm:h-[65px] rounded-[10px] bg-white border-[3px] border-[#1345DE] text-[#1345DE] font-[Mulish] font-bold text-[16px] sm:text-[16px] text-center hover:bg-[#1345DE] hover:text-white transition-colors duration-300">
            {loading ? 'Надсилаю…' : 'Записатися на курс'}
          </button>

          {status && (
            <p className={`text-[14px] sm:text-[14px] font-[Mulish] font-semibold px-2 sm:px-3 py-2 rounded-md ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} role="status" aria-live="polite">
              {status.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

type FAQ = { question: string; answer: string };

function FAQSection() {
  const faqs: FAQ[] = [
    { question: 'Чому digital-маркетологи такі популярні?', answer: 'Пандемія 2020 року показала, що без онлайн-присутності бізнесу ніяк. Підприємці усвідомили це, але якісних digital-маркетологів на ринку майже немає.' },
    { question: 'Я зовсім новачок. Курс підходить мені?', answer: 'Так. Два перші блоки програми розраховані на те, щоб дати розуміння та перспективи професії для новачка. Фахівці з досвідом можуть структурувати свої знання та заповнити прогалини.' },
    { question: 'Як довго буде доступний курс?', answer: 'Ви отримуєте доступ рівно на рік. Цього часу точно вистачить, щоб пройти всі уроки.' },
    { question: 'Я гарантовано отримаю сертифікат, якщо я буду на курсі?', answer: 'Набравши 265 балів за підсумками всього навчання, ви отримаєте диплом. Якщо набираєте менше – отримаєте сертифікат про те, що курс прослухано.' },
  ];

  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const toggleFAQ = (index: number) => setOpenIndex(openIndex === index ? null : index);

  return (
    <section className="px-4 sm:px-6 py-10 sm:py-16">
      <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-center mb-6 sm:mb-12 leading-snug sm:leading-tight">
        Відповіді на<br /><span className="text-blue-600">поширені запитання</span>
      </h2>

      <div className="max-w-full sm:max-w-4xl mx-auto flex flex-col gap-3 sm:gap-4 mb-10 sm:mb-20">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-4 sm:p-5 cursor-pointer transition hover:shadow-lg" onClick={() => toggleFAQ(index)}>
            <div className="flex justify-between items-center">
              <p className="text-base sm:text-lg font-bold">{faq.question}</p>
              <ChevronDown className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />
            </div>
            {openIndex === index && <p className="mt-2 sm:mt-3 text-gray-700 text-sm sm:text-base">{faq.answer}</p>}
          </div>
        ))}
      </div>

      <div className="text-center mb-10 sm:mb-20">
        <p className="text-2xl sm:text-4xl lg:text-6xl font-bold text-black leading-snug sm:leading-tight">
          Опануйте <br /> <span className="text-blue-600">високооплачувану</span> <br /> digital-професію з нуля
        </p>
        <button
          onClick={() => { if (typeof document !== 'undefined') document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' }); }}
          className="mt-4 sm:mt-6 font-semibold text-blue-800 hover:bg-[#1345DE] hover:text-white transition px-4 sm:px-6 py-2 sm:py-3 rounded-[10px] border-2 sm:border-3 border-[#1345DE]"
        >
          Стань інтернет-маркетологом
        </button>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */
export default function MarketingPage() {
  return (
    <main
      className="relative w-full"
      style={{ backgroundImage: 'url("/images/back.png")', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'top center' }}
    >
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
      <FooterCard />
    </main>
  );
}
