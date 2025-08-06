'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import TheoryEditor from '@/components/TheoryEditor';
import { MessageSquare } from 'lucide-react';

export default function TheoryPage() {
  const { id } = useParams();
  const [content, setContent] = useState('');
  const [theoryId, setTheoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([]);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    if (!id) return;

    axios
      .get(`http://127.0.0.1:8000/api/lesson/theories/?lesson=${id}`)
      .then((res) => {
        if (res.data.length > 0) {
          setContent(res.data[0].theory_text);
          setTheoryId(res.data[0].id);
        } else {
          setContent('<p>Напиши теорію тут...</p>');
        }
      })
      .catch((err) => console.error('❌ Помилка завантаження:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (html: string) => {
    const payload = { lesson: id, theory_text: html };
    if (theoryId) {
      await axios.put(`http://127.0.0.1:8000/api/lesson/theories/${theoryId}/`, payload);
    } else {
      const res = await axios.post(`http://127.0.0.1:8000/api/lesson/theories/`, payload);
      setTheoryId(res.data.id);
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
              onClick={() => {
                if (!userInput.trim()) return;
                setChatMessages((prev) => [...prev, { role: 'user', text: userInput }]);
                setTimeout(() => {
                  setChatMessages((prev) => [
                    ...prev,
                    { role: 'assistant', text: '🤖 Тут буде відповідь ШІ.' },
                  ]);
                }, 1000);
                setUserInput('');
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
