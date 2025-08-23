'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

interface Choice {
  id: number;
  answer_text: string;
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'MC' | 'TF' | 'TXT';
  answers?: Choice[];
}

interface Test {
  test_id: number;
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
  const [userId, setUserId] = useState<string | null>(null);

  // нові стейти для результату
  const [score, setScore] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [percentage, setPercentage] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, Detail>>({});

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      axios
        .get('http://127.0.0.1:8000/api/auth/user/', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => setUserId(res.data.pk?.toString()))
        .catch(() => console.warn('Не вдалося отримати ID користувача'));
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios
      .get(`http://127.0.0.1:8000/api/tests/${id}/random/`)
      .then(res => {
        setTest(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Не вдалося завантажити тест');
        setLoading(false);
      });
  }, [id]);

  const handleAnswerChange = (questionId: number, value: any) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const validateAnswers = () => {
    if (!test) return false;
    for (const q of test.questions) {
      if (
        userAnswers[q.id] === undefined ||
        userAnswers[q.id] === '' ||
        userAnswers[q.id] === null
      ) {
        alert(`Будь ласка, відповісти на питання: "${q.question_text}"`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!test) return;
    if (!validateAnswers()) return;
    if (!userId) {
      alert('Не вдалося визначити користувача. Увійдіть у систему.');
      return;
    }

    const answersPayload = test.questions.map(q => {
      const ans = userAnswers[q.id];
      if (q.question_type === 'MC') {
        return { question_id: q.id, selected_choice: Number(ans) };
      } else if (q.question_type === 'TF') {
        return { question_id: q.id, is_true_false: ans === true || ans === 'true' };
      } else if (q.question_type === 'TXT') {
        return { question_id: q.id, text_answer: ans };
      }
      return { question_id: q.id };
    });

    const payload = {
      user_identifier: userId,
      test_id: test.test_id,
      answers: answersPayload,
    };

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access');
      const res = await axios.post('http://127.0.0.1:8000/api/tests/submit-answers/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data) {
        setScore(res.data.score ?? null);
        setTotal(res.data.total ?? null);
        setPercentage(res.data.percentage ?? null);

        if (res.data.details) {
          const detMap: Record<number, Detail> = {};
          res.data.details.forEach((d: any) => {
            detMap[d.question_id] = { is_correct: d.is_correct, correct_answer: d.correct_answer };
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

  const totalQuestions = test?.questions.length || 0;
  const answeredCount = Object.keys(userAnswers).filter(
    key =>
      userAnswers[Number(key)] !== undefined &&
      userAnswers[Number(key)] !== null &&
      userAnswers[Number(key)] !== ''
  ).length;
  const progressPercent =
    totalQuestions === 0 ? 0 : (answeredCount / totalQuestions) * 100;

  if (loading) return <p>Завантаження...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!test) return <p>Тест не знайдено</p>;

  if (submitted) {
    return (
      <div style={styles.container}>
        <h2 style={styles.success}>✅ Ваші відповіді надіслано!</h2>
        {score !== null && total !== null && percentage !== null && (
          <p style={styles.resultText}>
            Ви набрали {score} з {total} ({percentage}%)
          </p>
        )}

        {test.questions.map(q => {
          const result = details[q.id];
          return (
            <div
              key={q.id}
              style={{
                ...styles.questionBlock,
                backgroundColor: result
                  ? result.is_correct
                    ? '#d4edda' // зелений
                    : '#f8d7da' // червоний
                  : '#fff'
              }}
            >
              <h4>{q.question_text}</h4>
              {result && !result.is_correct && result.correct_answer && (
                <p><strong>Правильна відповідь:</strong> {result.correct_answer}</p>
              )}
            </div>
          );
        })}

        <button
          style={styles.backButton}
          onClick={() => router.push('/lessons/15/details')}
        >
          ⬅ Повернутися до теорії
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{test.title}</h1>

      <div style={styles.progressBarContainer}>
        <div
          style={{ ...styles.progressBarFill, width: `${progressPercent}%` }}
        />
      </div>
      <p style={styles.progressText}>
        Прогрес: {answeredCount} / {totalQuestions} питань
      </p>

      {totalQuestions === 0 && <p>Немає питань у цьому тесті.</p>}

      {test.questions.map(q => (
        <div key={q.id} style={styles.questionBlock}>
          <h3 style={styles.questionText}>{q.question_text}</h3>

          {q.question_type === 'MC' &&
            q.answers?.map(a => (
              <label key={a.id} style={styles.label}>
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  value={a.id}
                  checked={userAnswers[q.id] === a.id}
                  onChange={() => handleAnswerChange(q.id, a.id)}
                  style={styles.input}
                />{' '}
                {a.answer_text}
              </label>
            ))}

          {q.question_type === 'TF' && (
            <>
              <label style={styles.label}>
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  value="true"
                  checked={userAnswers[q.id] === true}
                  onChange={() => handleAnswerChange(q.id, true)}
                  style={styles.input}
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
                  style={styles.input}
                />{' '}
                Ні
              </label>
            </>
          )}

          {q.question_type === 'TXT' && (
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
          disabled={submitting}
          style={styles.submitButton}
        >
          {submitting ? 'Відправка...' : 'Завершити тест'}
        </button>
        <button
          onClick={() => router.push('/lessons/15/details')}
          style={styles.backButton}
        >
          ⬅ Повернутися до теорії
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: 20 },
  title: { textAlign: 'center', marginBottom: 20 },
  questionBlock: { marginBottom: 20, padding: 15, borderRadius: 5, border: '1px solid #ddd' },
  questionText: { marginBottom: 10 },
  label: { display: 'block', marginBottom: 5 },
  input: { marginRight: 5 },
  textarea: { width: '100%', minHeight: 60 },
  buttonsWrapper: { display: 'flex', gap: 10, marginTop: 20 },
  submitButton: { padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' },
  backButton: { padding: '10px 20px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' },
  progressBarContainer: { width: '100%', height: 10, backgroundColor: '#e9ecef', borderRadius: 5, marginBottom: 10 },
  progressBarFill: { height: '100%', backgroundColor: '#007bff', borderRadius: 5 },
  progressText: { marginBottom: 15 },
  success: { color: 'green', textAlign: 'center' },
  resultText: { fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
};
