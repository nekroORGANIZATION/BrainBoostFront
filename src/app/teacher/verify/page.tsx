'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

/* ================= Config ================= */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
const CREATE_URL = `${API_BASE}/admin_panel/api/teacher-applications/create/`;
const REFRESH_URL = `${API_BASE}/api/token/refresh/`;

/* ================= Token helpers ================= */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}
function setAccessToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', token);
}
function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('refreshToken');
}

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('Немає refreshToken у sessionStorage — увійдіть знову.');
  const res = await fetch(REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Не вдалося оновити токен — увійдіть знову.');
  }
  const data = (await res.json()) as { access: string };
  if (!data?.access) throw new Error('Сервер не повернув новий access token.');
  setAccessToken(data.access);
  return data.access;
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // первая попытка
  const tryOnce = async (access?: string | null) =>
    fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
    });

  let res = await tryOnce(getAccessToken());

  // если токен истёк/невалиден — пробуем обновить и повторить
  if (res.status === 401 || res.status === 403) {
    let shouldRetry = false;
    try {
      const text = await res.clone().text();
      shouldRetry =
        text.includes('token_not_valid') ||
        text.includes('Token is invalid or expired') ||
        text.includes('Not authenticated') ||
        text.includes('credentials were not provided');
    } catch {
      /* ignore parse errors */
    }
    if (shouldRetry) {
      const newAccess = await refreshAccessToken();
      res = await tryOnce(newAccess);
    }
  }
  return res;
}

/* ================= UI helpers ================= */
function fmtErr(e: unknown) {
  if (!e) return 'Сталася помилка.';
  if (typeof e === 'string') return e;
  const any = e as any;
  return any?.message || 'Сталася помилка.';
}
function toPreview(file: File | null) {
  return file ? URL.createObjectURL(file) : null;
}

/* ================= Types & limits ================= */
type State = 'idle' | 'submitting' | 'success' | 'error';
const LIMITS = {
  maxMB: 10,
  accept: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic', 'image/heif'],
};

/* ================= Page ================= */
export default function TeacherVerifyPage() {
  const [status, setStatus] = useState<State>('idle');
  const [message, setMessage] = useState('');

  const [note, setNote] = useState('');
  const [selfie, setSelfie] = useState<File | null>(null);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [diploma, setDiploma] = useState<File | null>(null);

  const [selfieErr, setSelfieErr] = useState<string | null>(null);
  const [idErr, setIdErr] = useState<string | null>(null);
  const [dipErr, setDipErr] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const selfieUrl = useMemo(() => toPreview(selfie), [selfie]);
  const idUrl = useMemo(() => toPreview(idPhoto), [idPhoto]);
  const diplomaUrl = useMemo(() => toPreview(diploma), [diploma]);

  useEffect(() => {
    return () => {
      if (selfieUrl) URL.revokeObjectURL(selfieUrl);
      if (idUrl) URL.revokeObjectURL(idUrl);
      if (diplomaUrl) URL.revokeObjectURL(diplomaUrl);
    };
  }, [selfieUrl, idUrl, diplomaUrl]);

  function validateFile(file: File | null): string | null {
    if (!file) return null;
    const mb = file.size / 1024 / 1024;
    if (mb > LIMITS.maxMB) return `Файл завеликий: ${mb.toFixed(1)}MB (макс ${LIMITS.maxMB}MB)`;
    if (!LIMITS.accept.includes(file.type)) return `Неприпустимий тип: ${file.type || 'unknown'}`;
    return null;
  }

  function onPickSelfie(f: File | null) {
    setSelfie(f);
    setSelfieErr(validateFile(f));
  }
  function onPickId(f: File | null) {
    setIdPhoto(f);
    setIdErr(validateFile(f));
  }
  function onPickDiploma(f: File | null) {
    setDiploma(f);
    setDipErr(validateFile(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    const e1 = validateFile(selfie);
    const e2 = validateFile(idPhoto);
    const e3 = validateFile(diploma);
    setSelfieErr(e1);
    setIdErr(e2);
    setDipErr(e3);
    if (!selfie || !idPhoto || e1 || e2 || e3) {
      setStatus('error');
      setMessage(
        !selfie || !idPhoto
          ? 'Будь ласка, додайте селфі та фото документа.'
          : 'Перевірте файли — тип або розмір некоректний.'
      );
      return;
    }

    try {
      const fd = new FormData();
      fd.append('selfie_photo', selfie);
      fd.append('id_photo', idPhoto);
      if (diploma) fd.append('diploma_photo', diploma);
      if (note.trim()) fd.append('note', note.trim());

      const r = await authFetch(CREATE_URL, {
        method: 'POST',
        // ВАЖНО: не ставим Content-Type — браузер сам проставит boundary
        body: fd,
      });

      if (!r.ok) {
        const text = await r.text();
        if (r.status === 400 && /Заявка вже існує/i.test(text)) {
          throw new Error('Заявка вже існує. Дочекайтеся рішення або зверніться до підтримки.');
        }
        if (r.status === 403) {
          throw new Error('Доступ заборонено. Перевірте, що ви увійшли як викладач (is_teacher=true).');
        }
        throw new Error(text || `Помилка ${r.status}`);
      }

      setStatus('success');
      setMessage('Заявку на підтвердження надіслано. Очікуйте рішення адміністратора.');

      formRef.current?.reset();
      setSelfie(null);
      setIdPhoto(null);
      setDiploma(null);
      setNote('');
      setSelfieErr(null);
      setIdErr(null);
      setDipErr(null);
    } catch (err) {
      setStatus('error');
      setMessage(fmtErr(err));
    }
  }

  return (
    <main className="space-y-6 pb-16">
      {/* Hero */}
      <section
        className="rounded-3xl p-6 md:p-8 shadow-2xl text-white"
        style={{ background: 'linear-gradient(135deg,#1e3a8a,#6366f1)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Підтвердження кваліфікації</h1>
            <p className="mt-2 opacity-90">
              Додайте селфі та фото документа, за бажанням — диплом чи сертифікат. Після перевірки ми оновимо ваш статус.
            </p>
            <div className="mt-4">
              <Link href="/teacher" className="underline">
                ← Повернутись до кабінету викладача
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Alerts */}
      {status === 'success' && (
        <div className="rounded-2xl p-4 bg-green-50 border border-green-200 text-green-800">
          {message || 'Заявку надіслано.'}
        </div>
      )}
      {status === 'error' && (
        <div className="rounded-2xl p-4 bg-red-50 border border-red-200 text-red-800">
          {message || 'Помилка. Спробуйте ще раз.'}
        </div>
      )}

      {/* Form */}
      <section className="rounded-3xl bg-white shadow-xl p-6 md:p-8">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-7">
          {/* Selfie */}
          <div className="grid gap-2">
            <label className="font-medium">Селфі (обов’язково)</label>
            <FileDropzone
              id="selfie"
              onPick={onPickSelfie}
              previewUrl={selfieUrl}
              error={selfieErr}
              accept={LIMITS.accept.join(',')}
              hint="Обличчя крупним планом, гарне освітлення."
            />
          </div>

          {/* ID */}
          <div className="grid gap-2">
            <label className="font-medium">Фото паспорта / ID (обов’язково)</label>
            <FileDropzone
              id="idphoto"
              onPick={onPickId}
              previewUrl={idUrl}
              error={idErr}
              accept={LIMITS.accept.join(',')}
              hint="Сторінка з фото/ID-картка. Можете закрити чутливі дані."
            />
          </div>

          {/* Diploma (optional) */}
          <div className="grid gap-2">
            <label className="font-medium">Диплом/сертифікат (необов’язково)</label>
            <FileDropzone
              id="diploma"
              onPick={onPickDiploma}
              previewUrl={diplomaUrl}
              error={dipErr}
              accept={LIMITS.accept.join(',')}
              hint="Будь-який документ, що підтверджує кваліфікацію."
              required={false}
            />
          </div>

          {/* Note */}
          <div className="grid gap-2">
            <label className="font-medium">Коментар / Примітка</label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Коротко опишіть досвід викладання, посилання на профілі тощо (необов’язково)"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="rounded-2xl px-5 py-3 bg-black text-white shadow hover:shadow-md disabled:opacity-70"
            >
              {status === 'submitting' ? 'Надсилаємо…' : 'Надіслати заявку'}
            </button>
            <span className="text-sm opacity-70">
              Максимальний розмір кожного файлу — {LIMITS.maxMB}MB. Підтримувані формати: JPG, PNG, WEBP, HEIC.
            </span>
          </div>
        </form>
      </section>
    </main>
  );
}

/* ================= FileDropzone ================= */
function FileDropzone({
  id,
  onPick,
  previewUrl,
  error,
  accept,
  hint,
  required = true,
}: {
  id: string;
  onPick: (file: File | null) => void;
  previewUrl: string | null;
  error: string | null;
  accept: string;
  hint?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    onPick(f);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0] || null;
    onPick(f);
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed p-4 transition ${
          dragOver ? 'border-[#1345DE] bg-[#EEF3FF]' : 'border-slate-300 bg-white'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition text-sm"
          >
            Обрати файл
          </button>
          <div className="text-sm text-slate-600">
            або перетягніть у це поле {required ? <span className="text-red-500">*</span> : null}
            {hint ? <div className="opacity-70">{hint}</div> : null}
          </div>
        </div>

        <input
          id={id}
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
          required={required}
        />

        {previewUrl && (
          <div className="mt-3 relative w-48 h-48 rounded-xl overflow-hidden border">
            <Image src={previewUrl} alt="preview" fill className="object-cover" />
          </div>
        )}
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
    </div>
  );
}
