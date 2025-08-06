'use client';

import { useState } from 'react';
import { submitAnswers } from '@/services/submitAnswers';

const TestPage = () => {
  const [answers, setAnswers] = useState([]);
  const [userId] = useState(`anon_${Math.random().toString(36).substring(2, 10)}`);

  const handleSubmit = async () => {
    try {
      const result = await submitAnswers(userId, answers);
      console.log('Ответы успешно отправлены:', result);
    } catch (error) {
      alert('Ошибка при отправке ответов');
    }
  };

  return (
    <div>
      {/* Тут отображаешь тест и собираешь ответы в `answers` */}
      <button onClick={handleSubmit}>Отправить тест</button>
    </div>
  );
};

export default TestPage;
