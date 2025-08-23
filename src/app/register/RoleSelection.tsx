'use client';

import Image from 'next/image';

type Props = {
  onNext: () => void;
  updateData: (patch: { role: 'student' | 'teacher' }) => void;
  currentRole: 'student' | 'teacher' | '';
};

export default function RoleSelection({ onNext, updateData, currentRole }: Props) {
  const selectRole = (role: 'student' | 'teacher') => updateData({ role });

  return (
    <div className="relative flex flex-col items-center justify-center h-screen px-4 bg-white overflow-hidden">
      <div className="absolute top-6 left-6 text-blue-900 font-bold text-lg">LOGO</div>

      <div className="absolute bottom-0 left-0 w-[326px] h-[280px] bg-blue-600"
           style={{ clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }} />
      <div className="absolute -top-20 -right-8 w-[326px] h-[280px] bg-blue-600 rotate-12" />

      <div className="flex gap-12 md:gap-20 mb-12 z-10">
        <button
          type="button"
          className={`flex flex-col items-center p-6 rounded-2xl transition border
            ${currentRole === 'teacher' ? 'bg-gray-100 shadow-lg border-blue-600' : 'bg-white border-gray-200'}`}
          onClick={() => selectRole('teacher')}
        >
          <Image src="/images/teacher.png" alt="Вчитель" width={260} height={260} />
          <p className="mt-4 font-bold text-2xl md:text-3xl">Вчитель</p>
        </button>

        <button
          type="button"
          className={`flex flex-col items-center p-6 rounded-2xl transition border
            ${currentRole === 'student' ? 'bg-gray-100 shadow-lg border-blue-600' : 'bg-white border-gray-200'}`}
          onClick={() => selectRole('student')}
        >
          <Image src="/images/student.png" alt="Школяр/студент" width={260} height={260} />
          <p className="mt-4 font-bold text-2xl md:text-3xl">Школяр/студент</p>
        </button>
      </div>

      <button
        className="bg-blue-700 hover:bg-blue-800 text-white text-lg rounded-xl transition z-10 px-10 py-3 disabled:opacity-50"
        style={{ minWidth: 260 }}
        onClick={onNext}
        disabled={!currentRole}
      >
        Далі
      </button>
    </div>
  );
}
