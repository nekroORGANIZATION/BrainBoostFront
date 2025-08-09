'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTest } from '@/services/tests';

export default function CreateTestPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      id: 0,
      text: '',
      question_type: 'MC',
      choices: [],
    }]);
  };

  const handleSubmit = async () => {
    const res = await createTest({ title, description, questions });
    if (res?.id) router.push('/tests');
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].text = text;
    setQuestions(newQuestions);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Create Test</h1>
      <input
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
      />

      <button onClick={handleAddQuestion} style={{ marginTop: '1rem' }}>Add Question</button>
      <button onClick={handleSubmit} style={{ marginTop: '1rem' }}>Create Test</button>
    </div>
  );
}
