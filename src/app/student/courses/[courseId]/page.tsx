"use client";

import { use } from "react"; // <-- важливо
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Course {
  id: number;
  title: string;
  description: string;
  image?: string;
  price: string;
  language: string;
  topic: string;
  category_name?: string;
  total_lessons?: number;
  rating: string;
}

const API_BASE_URL = "https://brainboost.pp.ua/api";

function renderStars(rating: number) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <motion.div
          key={i}
          whileHover={{ scale: 1.3, rotate: 10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Star
            size={28}
            className={i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const unwrappedParams = use(params); // <-- Розпаковуємо Promise
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/courses/${unwrappedParams.courseId}/`);
        if (!res.ok) return;
        const data = await res.json();
        setCourse(data);
      } catch (err) {
        console.error("Помилка при завантаженні курсу:", err);
      }
    };

    fetchCourse();
  }, [unwrappedParams.courseId]);

  if (!course) return <div className="text-center mt-10">Завантаження...</div>;

  const ratingNumber = parseFloat(course.rating ?? "0");

  return (
    <div className="max-w-5xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200"
      >
        <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-800">{course.title}</h1>

        {course.image && (
          <div className="mb-6">
            <Image
              src={course.image}
              alt={course.title}
              width={800}
              height={400}
              className="rounded-xl shadow-lg mx-auto"
            />
          </div>
        )}

        <p className="text-gray-700 text-lg mb-8 text-center leading-relaxed">
          {course.description}
        </p>

        <div className="grid grid-cols-2 gap-6 text-lg font-medium mb-8 bg-gray-50 rounded-xl p-6 shadow-inner">
          <div><strong className="text-gray-800">Категорія:</strong> {course.category_name || "Невідомо"}</div>
          <div><strong className="text-gray-800">Мова:</strong> {course.language}</div>
          <div><strong className="text-gray-800">Тема:</strong> {course.topic}</div>
          <div><strong className="text-gray-800">Ціна:</strong> {course.price}</div>
          <div><strong className="text-gray-800">Уроків:</strong> {course.total_lessons ?? 0}</div>
          <div className="flex items-center gap-3">
            <strong className="text-gray-800">Рейтинг:</strong>
            {ratingNumber > 0 ? renderStars(ratingNumber) : <span className="text-gray-500">Немає оцінок</span>}
          </div>
        </div>

        <div className="flex justify-center">
          <Link
            href={`/student/courses/${unwrappedParams.courseId}/lessons`}
            className="px-8 py-3 rounded-full bg-blue-600 text-white text-lg font-semibold shadow-lg hover:bg-blue-700 transition"
          >
            Пройти курс
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
