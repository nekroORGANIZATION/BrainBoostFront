'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

interface Choice {
  id: number;
  text: string;
}

interface Question {
  id: number;
  text: string;
  type: 'single' | 'multiple' | 'true_false' | 'short' | 'long' | 'code' | 'match' | 'order';
  choices?: Choice[];
}

interface Test {
  id: number;
  title: string;
  questions: Question[];
}

interface Detail {
  is_correct: boolean;
  correct_answer?: string;
}

export default function TestPage() {
  const { id } = useParams();
  const router = useRouter();

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [score, setScore] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, Detail>>({});

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;

  useEffect(() => {
    if (!id || !token) {
      setLoading(false);
      setError('Не авторизовані або не вказано тест.');
      return;
    }

    setLoading(true);
    axios
      .get(`https://brainboost.pp.ua/api/api/tests/${id}/public/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setTest(res.data))
      .catch(() => setError('Не вдалося завантажити тест'))
      .finally(() => setLoading(false));
  }, [id, token]);

  useEffect(() => {
    if (!test || attemptId !== null || !token) return;

    axios
      .post(
        `https://brainboost.pp.ua/api/tests/${test.id}/attempts/start/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(res => setAttemptId(res.data.id))
      .catch(() => setError('Не вдалося стартувати спробу'));
  }, [test, attemptId, token]);

  const handleAnswerChange = (questionId: number, value: any, multiple = false) => {
    if (multiple) {
      setUserAnswers(prev => {
        const prevArr = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        if (prevArr.includes(value)) {
          return { ...prev, [questionId]: prevArr.filter(v => v !== value) };
        } else {
          return { ...prev, [questionId]: [...prevArr, value] };
        }
      });
    } else {
      setUserAnswers(prev => ({ ...prev, [questionId]: value }));
    }
  };

  const validateAnswers = () => {
    if (!test) return false;
    for (const q of test.questions) {
      if (
        userAnswers[q.id] === undefined ||
        userAnswers[q.id] === '' ||
        userAnswers[q.id] === null ||
        (q.type === 'multiple' && (!Array.isArray(userAnswers[q.id]) || userAnswers[q.id].length === 0))
      ) {
        alert(`Будь ласка, відповісти на питання: "${q.text}"`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!test || !attemptId) return;
    if (!validateAnswers()) return;
    if (!token) {
      alert('Не авторизовані. Увійдіть у систему.');
      return;
    }

    const answersPayload = test.questions.map(q => {
      const ans = userAnswers[q.id];
      if (q.type === 'single' || q.type === 'true_false') {
        return { question: q.id, selected: ans };
      } else if (q.type === 'multiple') {
        return { question: q.id, selected: Array.isArray(ans) ? ans : [ans] };
      } else if (['short', 'long', 'code'].includes(q.type)) {
        return { question: q.id, text: ans };
      } else if (['match', 'order'].includes(q.type)) {
        return { question: q.id, data: ans };
      }
      return { question: q.id };
    });

    try {
      setSubmitting(true);
      const res = await axios.post(
        `https://brainboost.pp.ua/api/api/tests/${test.id}/attempts/${attemptId}/submit/`,
        { answers: answersPayload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data) {
        setScore(res.data.score ?? null);
        setTotal(res.data.max_score ?? null);

        if (res.data.breakdown) {
          const detMap: Record<number, Detail> = {};
          res.data.breakdown.forEach((d: any) => {
            detMap[d.question] = { is_correct: d.is_correct };
          });
          setDetails(detMap);
        }
      }

      setSubmitted(true);
    } catch {
      alert('Помилка відправки тесту');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Завантаження...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!test) return <p>Тест не знайдено</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{test.title}</h1>

      {test.questions.map(q => (
        <div key={q.id} style={styles.questionBlock}>
          <h3>{q.text}</h3>

          {q.type === 'single' &&
            q.choices?.map(c => (
              <label key={c.id} style={styles.label}>
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  value={c.id}
                  checked={userAnswers[q.id] === c.id}
                  onChange={() => handleAnswerChange(q.id, c.id)}
                />{' '}
                {c.text}
              </label>
            ))}

          {q.type === 'multiple' &&
            q.choices?.map(c => (
              <label key={c.id} style={styles.label}>
                <input
                  type="checkbox"
                  name={`q_${q.id}`}
                  value={c.id}
                  checked={Array.isArray(userAnswers[q.id]) && userAnswers[q.id].includes(c.id)}
                  onChange={() => handleAnswerChange(q.id, c.id, true)}
                />{' '}
                {c.text}
              </label>
            ))}

          {q.type === 'true_false' && (
            <>
              <label style={styles.label}>
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  value="true"
                  checked={userAnswers[q.id] === true}
                  onChange={() => handleAnswerChange(q.id, true)}
                />{' '}
                Так
              </label>
              <label style={styles.label}>
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  value="false"
                  checked={userAnswers[q.id] === false}
                  onChange={() => handleAnswerChange(q.id, false)}
                />{' '}
                Ні
              </label>
            </>
          )}

          {['short', 'long', 'code'].includes(q.type) && (
            <textarea
              value={userAnswers[q.id] || ''}
              onChange={e => handleAnswerChange(q.id, e.target.value)}
              placeholder="Введіть відповідь"
              style={styles.textarea}
            />
          )}
        </div>
      ))}

      <div style={styles.buttonsWrapper}>
        <button
          onClick={handleSubmit}
          disabled={submitting || attemptId === null}
          style={styles.submitButton}
        >
          {submitting ? 'Відправка...' : 'Завершити тест'}
        </button>
        <button onClick={() => router.back()} style={styles.backButton}>
          ⬅ Повернутися назад
        </button>
      </div>

      {submitted && score !== null && total !== null && (
        <p>Ви набрали {score} з {total}</p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: 20 },
  title: { textAlign: 'center', marginBottom: 20 },
  questionBlock: { marginBottom: 20, padding: 15, borderRadius: 5, border: '1px solid #ddd' },
  textarea: { width: '100%', minHeight: 60, marginTop: 5 },
  label: { display: 'block', marginBottom: 5 },
  buttonsWrapper: { display: 'flex', gap: 10, marginTop: 20 },
  submitButton: { padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' },
  backButton: { padding: '10px 20px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' },
};
