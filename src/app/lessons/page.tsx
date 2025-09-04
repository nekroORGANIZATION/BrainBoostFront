'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import TheoryEditor from '@/components/TheoryEditor';
import { MessageSquare } from 'lucide-react';

export default function TheoryPage() {
  const { id } = useParams(); // id уроку
  const [content, setContent] = useState('<p>Завантаження...</p>');
  const [theoryId, setTheoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([]);
  const [userInput, setUserInput] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  // --- Завантаження теорії ---
  useEffect(() => {
    if (!id) return;

    axios
      .get(`https://brainboost.pp.ua/api/api/lesson/lesson/theories/${id}/`, { headers })
      .then((res) => {
        if (res.data.length > 0) {
          setContent(res.data[0].theory_text);
          setTheoryId(res.data[0].id);
        } else {
          setContent('<p>Напиши теорію тут...</p>');
          setTheoryId(null);
        }
      })
      .catch((err: AxiosError) => console.error('❌ Помилка завантаження:', err))
      .finally(() => setLoading(false));
  }, [id, token]);

  // --- Збереження теорії ---
  const handleSave = async (html: string) => {
    if (!id) return;
    try {
      if (theoryId) {
        const res = await axios.put(
          `https://brainboost.pp.ua/api/api/lesson/lesson/theories/${id}/${theoryId}/`,
          { theory_text: html },
          { headers }
        );
        setContent(res.data.theory_text);
      } else {
        const res = await axios.post(
          `https://brainboost.pp.ua/api/api/lesson/lesson/theories/${id}/`,
          { theory_text: html },
          { headers }
        );
        setTheoryId(res.data.id);
        setContent(res.data.theory_text);
      }
    } catch (error) {
      const err = error as AxiosError<unknown>;
      console.error('❌ Помилка збереження:', err.response?.data || err.message);
    }
  };

  if (loading) return <p className="text-center mt-10">Завантаження...</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-6 shadow-md rounded-md relative">
      <h1 className="text-2xl font-bold mb-4">Редагування теорії</h1>
      <TheoryEditor initialContent={content} onSave={handleSave} />

      {/* Кнопка чату */}
      <button
        onClick={() => setIsChatOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
      >
        <MessageSquare size={24} />
      </button>

      {/* Чат */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-6 w-80 bg-white shadow-lg rounded-lg border flex flex-col h-96">
          <div className="p-3 bg-blue-600 text-white font-semibold">💬 Чат з ШІ</div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-blue-100 self-end text-right ml-auto'
                    : 'bg-gray-100 text-left mr-auto'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 border rounded p-2"
              placeholder="Напиши повідомлення..."
            />
            <button
              onClick={async () => {
                if (!userInput.trim() || !id) return;

                const userMessage = { role: 'user', text: userInput };
                setChatMessages((prev) => [...prev, userMessage]);
                setUserInput('');

                try {
                  const res = await axios.post(
                    'https://brainboost.pp.ua/api/api/ai/ask/',
                    { lesson_id: id, question: userInput },
                    { headers: { ...headers, 'Content-Type': 'application/json' } }
                  );

                  const aiMessage = { role: 'assistant', text: res.data.answer };
                  setChatMessages((prev) => [...prev, aiMessage]);
                } catch (error) {
                  const err = error as AxiosError<unknown>;
                  const errText = err.response?.data?.error || 'Помилка з боку ШІ.';
                  setChatMessages((prev) => [...prev, { role: 'assistant', text: `❌ ${errText}` }]);
                }
              }}
              className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
