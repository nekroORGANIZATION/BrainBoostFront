'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTest } from '@/services/tests';

interface Question {
  text: string;
  type: 'multiple_choice' | 'true_false' | 'open';
  choices: { text: string; is_correct: boolean }[];
  correct_answer?: boolean | string;
}

const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}
    {...props}
  />
);

export default function CreateTestPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', type: 'multiple_choice', choices: [] }]);
  };

  const handleSubmit = async () => {
    const res = await createTest({ title, description, questions });
    if (res?.id) router.push('/tests');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Create Test</h1>
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }} />
      <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '1rem', padding: '0.5rem' }} />

      <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Questions</h2>
      {questions.map((q, qi) => (
        <div key={qi} style={{ marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '0.375rem', padding: '1rem' }}>
          <input
            placeholder="Question text"
            value={q.text}
            onChange={e => {
              const newQuestions = [...questions];
              newQuestions[qi].text = e.target.value;
              setQuestions(newQuestions);
            }}
            style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
          />

          <select
            value={q.type}
            onChange={e => {
              const newQuestions = [...questions];
              newQuestions[qi].type = e.target.value as Question['type'];
              newQuestions[qi].choices = [];
              newQuestions[qi].correct_answer = undefined;
              setQuestions(newQuestions);
            }}
            style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="open">Open</option>
          </select>

          {q.type === 'multiple_choice' && (
            <div>
              {q.choices.map((c, ci) => (
                <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    placeholder="Choice text"
                    value={c.text}
                    onChange={e => {
                      const newQuestions = [...questions];
                      newQuestions[qi].choices[ci].text = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={c.is_correct}
                      onChange={e => {
                        const newQuestions = [...questions];
                        newQuestions[qi].choices[ci].is_correct = e.target.checked;
                        setQuestions(newQuestions);
                      }}
                    /> Correct
                  </label>
                </div>
              ))}
              <Button onClick={() => {
                const newQuestions = [...questions];
                newQuestions[qi].choices.push({ text: '', is_correct: false });
                setQuestions(newQuestions);
              }}>Add Choice</Button>
            </div>
          )}

          {q.type === 'true_false' && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label>
                <input
                  type="radio"
                  name={`truefalse-${qi}`}
                  checked={q.correct_answer === true}
                  onChange={() => {
                    const newQuestions = [...questions];
                    newQuestions[qi].correct_answer = true;
                    setQuestions(newQuestions);
                  }}
                /> True
              </label>
              <label>
                <input
                  type="radio"
                  name={`truefalse-${qi}`}
                  checked={q.correct_answer === false}
                  onChange={() => {
                    const newQuestions = [...questions];
                    newQuestions[qi].correct_answer = false;
                    setQuestions(newQuestions);
                  }}
                /> False
              </label>
            </div>
          )}
        </div>
      ))}

      <Button onClick={handleAddQuestion}>Add Question</Button>
      <Button onClick={handleSubmit}>Create Test</Button>
    </div>
  );
}