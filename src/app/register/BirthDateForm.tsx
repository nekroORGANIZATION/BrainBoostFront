'use client';

import { useState, useEffect } from 'react';
import { register } from '@/services/AuthService';

interface BirthDateFormProps {
  updateData: (data: { birthDate: string }) => void;
  values: {
    role: string;
    name: string;
    email: string;
    password: string;
    birthDate?: string;
  };
}

export default function BirthDateForm({ updateData, values }: BirthDateFormProps) {
  // Дефолтная дата
  const [day, setDay] = useState('31');
  const [month, setMonth] = useState('12');
  const [year, setYear] = useState('2005');
  const [age, setAge] = useState<number | null>(null);
  const [formattedDate, setFormattedDate] = useState('');

  const months = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
  ];

  // Считаем возраст и форматируем дату
  useEffect(() => {
    if (day && month && year) {
      const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
      const today = new Date();
      let userAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        userAge--;
      }
      setAge(userAge);
      setFormattedDate(`${day} ${months[Number(month) - 1]} ${year} р.`);
      updateData({ birthDate: `${year}-${month}-${day}` });
    }
  }, [day, month, year]);

  const handleSubmit = async () => {
    try {
      await register(values.role, values.name, values.email, values.password, values.birthDate ?? '');
      alert('Реєстрація успішна!');
    } catch (err) {
      console.error(err);
      alert('Помилка реєстрації');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-white">
        {/* Лого */}
        <div className="absolute top-6 left-6 text-lg font-bold text-blue-900">LOGO</div>

        {/* Синие фигуры */}
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-700 clip-triangle"></div>
        <div className="absolute top-1/2 right-0 w-[350px] h-[300px] bg-blue-700 clip-right-triangle transform -translate-y-1/2"></div>

        <div
            className="bg-white flex flex-col items-center justify-between"
            style={{ width: '652px', height: '450px' }}
        >
            {/* Заголовок */}
            <h2 className="text-2xl font-bold mt-10 mb-6 text-center" style={{ fontSize: '34px' }}>Напиши свій день народження</h2>

            {/* Поля даты */}
            <div className="flex gap-14 mb-6">
            {/* День */}
            <div className="flex flex-col items-center">
                <div className="w-20 border-t border-gray-400 mb-2"></div>
                <input
                type="string"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="text-center text-xl w-20 focus:outline-none"
                />
                <div className="w-20 border-b border-gray-400 mt-2"></div>
            </div>

            {/* Месяц */}
            <div className="flex flex-col items-center">
                <div className="w-20 border-t border-gray-400 mb-2"></div>
                <input
                type="string"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="text-center text-xl w-20 focus:outline-none"
                />
                <div className="w-20 border-b border-gray-400 mt-2"></div>
            </div>

            {/* Год */}
            <div className="flex flex-col items-center">
                <div className="w-24 border-t border-gray-400 mb-2"></div>
                <input
                type="string"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="text-center text-xl w-24 focus:outline-none"
                />
                <div className="w-24 border-b border-gray-400 mt-2"></div>
            </div>
            </div>

            {/* Форматированная дата + возраст */}
            <div className="flex justify-between items-center border rounded px-6 py-3 mb-6 w-[480px] text-gray-700 text-lg" style={{padding: '20px 20px'}}>
            <span>{formattedDate}</span>
            <span>{age !== null ? `${age} років` : ''}</span>
            </div>

            {/* Кнопка */}
            <button
            onClick={handleSubmit}
            className="bg-blue-700 text-white w-[350px] py-3 rounded-lg text-lg hover:bg-blue-800 transition mb-10"
            >
            Реєстрація
            </button>
        </div>
        {/* CSS для фигур */}
       <style jsx>{`
            .clip-triangle {
                clip-path: polygon(0 100%, 0 0, 100% 100%);
            }
            .clip-right-triangle {
                clip-path: polygon(0 0, 100% 50%, 0 100%);
            }
        `}</style>
        </div>
    );
}
