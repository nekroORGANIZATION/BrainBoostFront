'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function RoleSelection({ onNext, updateData }: any) {
  const [selectedRole, setSelectedRole] = useState('');

  const handleSelect = (role: string) => {
    setSelectedRole(role);
    updateData({ role });
  };

  const handleNext = () => {
    if (selectedRole) {
      onNext();
    } else {
      alert('Будь ласка, оберіть роль');
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen px-4 bg-white overflow-hidden">

      {/* Логотип */}
      <div className="absolute top-6 left-6 text-blue-900 font-bold text-lg">LOGO</div>

      {/* Синие фигуры */}
      <div className="absolute bottom-0 left-0 w-[326px] h-[280px] bg-blue-600"
        style={{ clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }}></div>
      <div className="absolute -top-38 -right-8 w-[326px] h-[280px] bg-blue-600 rotate-38"></div>

      {/* Выбор роли */}
      <div className="flex gap-20 mb-12 z-10">
        <div
          className={`flex flex-col items-center p-6 rounded-2xl cursor-pointer transition 
            ${selectedRole === 'teacher' ? 'bg-gray-200 shadow-lg' : 'bg-transparent'}`}
          onClick={() => handleSelect('teacher')}
        >
          <Image src="/images/teacher.png" alt="Вчитель" width={290} height={291} />
          <p className="mt-4 text-xl font-bold" style={{ fontWeight: 'bold', fontSize: '40px'}}>Вчитель</p>
        </div>

        <div
          className={`flex flex-col items-center p-6 rounded-2xl cursor-pointer transition 
            ${selectedRole === 'student' ? 'bg-gray-200 shadow-lg' : 'bg-transparent'}`}
          onClick={() => handleSelect('student')}
        >
          <Image src="/images/student.png" alt="Школяр" width={290} height={291} />
          <p className="mt-4 text-xl" style={{ fontWeight: 'bold', fontSize: '40px'}}>Школяр/студент</p>
        </div>
      </div>

      {/* Кнопка далі */}
      <button
        className="bg-blue-700 hover:bg-blue-800 text-white text-lg rounded-xl transition z-10"
        style={{ width: '407px', height: '58px', fontSize: '20px', font: 'Afacad' }}
        onClick={handleNext}
      >
        Далі
      </button>
    </div>
  );
}
