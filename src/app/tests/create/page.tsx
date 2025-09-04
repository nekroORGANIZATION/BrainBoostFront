// src/app/tests/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// 👇 импортируем как есть…
import { createTest as createTestRaw } from '@/services/tests';

/** ===================== TYPES ===================== */
type Choice = { text: string; is_correct: boolean };

type MultipleChoiceQuestion = {
  type: 'multiple_choice';
  text: string;
  choices: Choice[];
  // correct_answer вычисляется по choices — отдельное поле не нужно
};

type TrueFalseQuestion = {
  type: 'true_false';
  text: string;
  correct_answer: boolean;
};

type OpenQuestion = {
  type: 'open';
  text: string;
  correct_answer?: string;
};

type TestQuestion = MultipleChoiceQuestion | TrueFalseQuestion | OpenQuestion;

type CreateTestPayload = {
  title: string;
  description: string;
  // чтобы не конфликтовать с глобальными типами Question/Test — отправляем как unknown[]
  questions: unknown[];
};

// 👇 аккуратный адаптер поверх сервиса, без `any`
const createTest = createTestRaw as unknown as (
  data: CreateTestPayload
) => Promise<{ id?: number }>;

const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    style={{
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      border: 'none',
      cursor: 'pointer',
      marginTop: '0.5rem',
    }}
    {...props}
  />
);

export default function CreateTestPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { type: 'multiple_choice', text: '', choices: [] } as MultipleChoiceQuestion,
    ]);
  };

  const replaceQuestion = (idx: number, next: TestQuestion) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? next : q)));
  };

  const handleSubmit = async () => {
    const payload: CreateTestPayload = {
      title,
      description,
      questions: questions as unknown[], // см. комментарий в типе
    };
    const res = await createTest(payload);
    if (res?.id) router.push('/tests');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Create Test</h1>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
      />

      <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Questions</h2>

      {questions.map((q, qi) => (
        <div
          key={qi}
          style={{ marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '0.375rem', padding: '1rem' }}
        >
          <input
            placeholder="Question text"
            value={q.text}
            onChange={(e) => replaceQuestion(qi, { ...q, text: e.target.value })}
            style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
          />

          <select
            value={q.type}
            onChange={(e) => {
              const t = e.target.value as TestQuestion['type'];
              if (t === 'multiple_choice') {
                replaceQuestion(qi, { type: 'multiple_choice', text: q.text, choices: [] });
              } else if (t === 'true_false') {
                replaceQuestion(qi, { type: 'true_false', text: q.text, correct_answer: true });
              } else {
                replaceQuestion(qi, { type: 'open', text: q.text, correct_answer: '' });
              }
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
                <div
                  key={ci}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
                >
                  <input
                    placeholder="Choice text"
                    value={c.text}
                    onChange={(e) => {
                      const next: MultipleChoiceQuestion = {
                        ...q,
                        choices: q.choices.map((ch, i) => (i === ci ? { ...ch, text: e.target.value } : ch)),
                      };
                      replaceQuestion(qi, next);
                    }}
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={c.is_correct}
                      onChange={(e) => {
                        const next: MultipleChoiceQuestion = {
                          ...q,
                          choices: q.choices.map((ch, i) =>
                            i === ci ? { ...ch, is_correct: e.target.checked } : ch
                          ),
                        };
                        replaceQuestion(qi, next);
                      }}
                    />{' '}
                    Correct
                  </label>
                </div>
              ))}
              <Button
                onClick={() => {
                  const next: MultipleChoiceQuestion = {
                    ...q,
                    choices: [...q.choices, { text: '', is_correct: false }],
                  };
                  replaceQuestion(qi, next);
                }}
              >
                Add Choice
              </Button>
            </div>
          )}

          {q.type === 'true_false' && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label>
                <input
                  type="radio"
                  name={`truefalse-${qi}`}
                  checked={q.correct_answer === true}
                  onChange={() => replaceQuestion(qi, { ...q, correct_answer: true })}
                />{' '}
                True
              </label>
              <label>
                <input
                  type="radio"
                  name={`truefalse-${qi}`}
                  checked={q.correct_answer === false}
                  onChange={() => replaceQuestion(qi, { ...q, correct_answer: false })}
                />{' '}
                False
              </label>
            </div>
          )}

          {q.type === 'open' && (
            <input
              placeholder="Correct answer (optional)"
              value={q.correct_answer ?? ''}
              onChange={(e) => replaceQuestion(qi, { ...q, correct_answer: e.target.value })}
              style={{ display: 'block', width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
            />
          )}
        </div>
      ))}

      <Button onClick={handleAddQuestion}>Add Question</Button>
      <Button onClick={handleSubmit}>Create Test</Button>
    </div>
  );
}
