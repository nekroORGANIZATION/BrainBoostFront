'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import http, { setAuthHeader } from '@/lib/http';
import {
  Plus, Save, Loader2, Settings2, ChevronLeft, Eye, Trash2,
  SquarePlus, Rows4, Clock, Shuffle, CheckCircle2, AlertTriangle,
  CircleHelp, ListOrdered, List, Type, Quote, Code2, Wand2,
  X, GripVertical, Image as ImageIcon, TimerReset, Sparkles,
  ArrowUpAZ, ArrowDownAZ, Play, Check, Shield, Gauge, Copy
} from 'lucide-react';

/* =====================================================
   Types
===================================================== */

type TestStatus = 'draft' | 'published' | 'closed';

type QuestionType =
  | 'single' | 'multiple' | 'true_false'
  | 'short' | 'long' | 'code'
  | 'match' | 'order';

type Lesson = { id:number; title:string };

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

type ChoiceUI = { uid:string; text:string; isCorrect?:boolean; order?:number };

type QuestionUI = {
  id: number;
  type: QuestionType;
  text: string;
  points: number;
  order: number;
  explanation?: string;
  required?: boolean;
  options: ChoiceUI[];
  trueFalse?: 'true'|'false';
  correctText?: string;
  spec: Record<string, any>;
  touched?: boolean;
};

type TestDTO = {
  id?: number;
  lesson: number;
  title: string;
  description: string;
  status: TestStatus;
  time_limit_sec: number | null;
  attempts_allowed: number | null;
  pass_mark: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_feedback_mode: 'none'|'immediate'|'after_close';
  questions: Array<{
    id?: number;
    text: string;
    type: QuestionType;
    points: number;
    order: number;
    explanation?: string;
    required?: boolean;
    spec?: Record<string, any>;
    choices: Array<{ text:string; order:number; is_correct:boolean }>;
  }>;
};

/* =====================================================
   Helpers
===================================================== */
const API = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

const emptyQuestion = (seq:number): QuestionUI => ({
  id: seq,
  type: 'single',
  text: '',
  points: 1,
  order: seq,
  options: [
    { uid: uid(), text: '', isCorrect: false, order: 1 },
    { uid: uid(), text: '', isCorrect: false, order: 2 },
  ],
  spec: {},
  required: true,
});

const prettyError = (e:any) => {
  const d = e?.response?.data; const s = e?.response?.status;
  if (typeof d === 'string') return d;
  if (!d) return e?.message || 'Сталася помилка.';
  if (d.detail) return String(d.detail);
  try { return Object.entries(d).map(([k,v])=> Array.isArray(v)? `${k}: ${v.join(', ')}`: `${k}: ${JSON.stringify(v)}`).join('\n'); }
  catch{ return s?`HTTP ${s}`:'Сталася помилка.'; }
};
const secToMinStr = (sec:number|null|undefined) => (!sec && sec!==0) ? '' : String(Math.round(Number(sec)/60));
const minutesToSec = (m:string) => (m === '' ? null : Math.max(0, Number(m||0)*60));

/* =====================================================
   Page Component
===================================================== */
export default function TestNewPage(){
  const router = useRouter();
  const params = useParams() as { courseId?: string|string[] };
  const courseId = Number(Array.isArray(params.courseId)?params.courseId[0]:params.courseId);
  const search = useSearchParams();
  const preLesson = Number(search.get('lesson')||'') || undefined;
  const { accessToken } = useAuth();

  // meta
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<number|''>(preLesson ?? '');
  const [testId, setTestId] = useState<number|null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TestStatus>('draft');
  const [timeLimitMin, setTimeLimitMin] = useState<string>('');
  const [attemptsAllowed, setAttemptsAllowed] = useState<string>('');
  const [passMark, setPassMark] = useState<string>('60');
  const [shuffleQ, setShuffleQ] = useState(true);
  const [shuffleO, setShuffleO] = useState(true);
  const [feedbackMode, setFeedbackMode] = useState<'none'|'immediate'|'after_close'>('after_close');

  const [questions, setQuestions] = useState<QuestionUI[]>([emptyQuestion(1)]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState<string|null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // auth → axios
  useEffect(()=>{ if(accessToken) setAuthHeader(accessToken); }, [accessToken]);

  // lessons
  useEffect(()=>{
    if (!accessToken || !courseId) return;
    (async()=>{
      try{
        // пробуємо обидва варіанти джерела уроків (щоб не ламати існуюче)
        let arr: any[] = [];
        try{
          const r1 = await http.get(`/lesson/admin/lessons/`, { params:{ course: courseId, ordering:'id' } });
          arr = Array.isArray(r1.data?.results)? r1.data.results : (Array.isArray(r1.data)? r1.data : []);
        }catch{
          const r2 = await http.get(`${API}/api/lesson/lessons/mine/`);
          arr = Array.isArray(r2.data?.results)? r2.data.results : (Array.isArray(r2.data)? r2.data : []);
        }
        setLessons(arr.map((x:any)=>({ id:x.id, title:x.title })));
      }catch(e){ console.error(e); }
    })();
  },[accessToken, courseId]);

  // якщо вибрали урок — підвантажимо існуючий тест (щоб одразу редагувати)
  useEffect(()=>{
    setErr(null); setOk(null);
    if (!selectedLessonId) return;
    (async()=>{
      setLoading(true);
      try{
        const list = await http.get(`${API}/api/tests/`, { params:{ lesson_id: selectedLessonId } });
        const items = Array.isArray(list.data?.results)? list.data.results : Array.isArray(list.data)? list.data : [];
        if (items.length){
          const test = await http.get(`${API}/api/tests/${items[0].id}/`);
          const d: TestDTO = test.data;
          setTestId(d.id ?? null);
          setTitle(d.title ?? ''); setDescription(d.description ?? '');
          setStatus((d.status as TestStatus) ?? 'draft');
          setTimeLimitMin(secToMinStr(d.time_limit_sec));
          setAttemptsAllowed(d.attempts_allowed==null? '' : String(d.attempts_allowed));
          setPassMark(String(Math.round(Number(d.pass_mark ?? 60))));
          setShuffleQ(!!d.shuffle_questions); setShuffleO(!!d.shuffle_options);
          setFeedbackMode((d.show_feedback_mode as any) || 'after_close');

          const qs: QuestionUI[] = (d.questions||[]).map((q, i)=> {
            const base: QuestionUI = {
              id: i+1, type:q.type, text:q.text || '', points: Number(q.points ?? 1), order: Number(q.order ?? i+1),
              explanation: q.explanation || '', required:true, options:[], spec:q.spec||{}, touched:false
            };
            if (q.type==='single' || q.type==='multiple'){
              base.options = (q.choices||[]).map((c, j)=>({ uid:uid(), text:c.text||'', isCorrect:!!c.is_correct, order:Number(c.order??(j+1)) }));
            } else if (q.type==='true_false'){
              const t = (q.choices||[]).find((c:any)=> String(c.text).toLowerCase()==='true');
              const f = (q.choices||[]).find((c:any)=> String(c.text).toLowerCase()==='false');
              base.trueFalse = t?.is_correct ? 'true' : f?.is_correct ? 'false' : 'true';
            } else if (q.type==='short' || q.type==='long' || q.type==='code'){
              base.correctText = (q.choices||[])[0]?.text || '';
            }
            return base;
          });
          setQuestions(qs.length? qs : [emptyQuestion(1)]);
          setOk('Завантажено існуючий тест цього уроку.');
        } else {
          resetToNew();
          setOk('Для цього уроку ще немає тесту — створіть його нижче.');
        }
      } catch(e:any){ setErr(prettyError(e)); }
      finally{ setLoading(false); }
    })();
  },[selectedLessonId]);

  const resetToNew = () => {
    setTestId(null); setTitle(''); setDescription(''); setStatus('draft');
    setTimeLimitMin(''); setAttemptsAllowed(''); setPassMark('60');
    setShuffleQ(true); setShuffleO(true); setFeedbackMode('after_close');
    setQuestions([emptyQuestion(1)]);
  };

  // пресети правил
  const applyPreset = (k:'quiz'|'exam'|'speed')=>{
    if (k==='quiz'){ setTimeLimitMin('20'); setAttemptsAllowed('1'); setPassMark('60'); setShuffleQ(true); setShuffleO(true); setFeedbackMode('immediate'); }
    if (k==='exam'){ setTimeLimitMin('60'); setAttemptsAllowed('1'); setPassMark('70'); setShuffleQ(true); setShuffleO(true); setFeedbackMode('after_close'); }
    if (k==='speed'){ setTimeLimitMin('5'); setAttemptsAllowed(''); setPassMark('50'); setShuffleQ(true); setShuffleO(true); setFeedbackMode('none'); }
  };

  // побудова DTO
  const buildDto = (): TestDTO => ({
    id: testId ?? undefined,
    lesson: Number(selectedLessonId),
    title,
    description,
    status,
    time_limit_sec: minutesToSec(timeLimitMin),
    attempts_allowed: attemptsAllowed===''? null : Number(attemptsAllowed),
    pass_mark: passMark===''? 0 : Number(passMark),
    shuffle_questions: shuffleQ,
    shuffle_options: shuffleO,
    show_feedback_mode: feedbackMode,
    questions: questions.map((q, idx)=>{
      let choices: TestDTO['questions'][number]['choices'] = [];
      if (q.type==='single' || q.type==='multiple'){
        choices = (q.options||[]).map((o,i)=>({ text:o.text||'', order:Number(o.order??(i+1)), is_correct:!!o.isCorrect }));
      } else if (q.type==='true_false'){
        const ans = q.trueFalse==='false' ? 'false' : 'true';
        choices = [
          { text:'True', order:1, is_correct: ans==='true' },
          { text:'False', order:2, is_correct: ans==='false' },
        ];
      } else if (q.type==='short' || q.type==='long' || q.type==='code'){
        choices = [{ text:q.correctText||'', order:1, is_correct:true }];
      }
      return {
        text: q.text||'', type:q.type, points:Number(q.points||1), order:q.order||idx+1,
        explanation: q.explanation||'', required: q.required??true, spec:q.spec||{}, choices
      };
    })
  });

  // валідація
  const errors = useMemo(()=>{
    const list:string[] = [];
    if (!selectedLessonId) list.push('Оберіть урок.');
    if (!title.trim()) list.push('Додайте назву тесту.');
    questions.forEach((q,i)=>{
      if (!q.text.trim()) list.push(`Питання #${i+1}: порожній текст.`);
      if ((q.type==='single'||q.type==='multiple') && q.options.length<2) list.push(`Питання #${i+1}: потрібно мінімум 2 варіанти.`);
      if ((q.type==='single'||q.type==='multiple') && !q.options.some(o=>o.isCorrect)) list.push(`Питання #${i+1}: познач правильну відповідь.`);
      if ((q.type==='short') && !(q.correctText||'').trim()) list.push(`Питання #${i+1}: введіть еталон короткої відповіді.`);
    });
    const pm = Number(passMark||0); if (isNaN(pm) || pm<0 || pm>100) list.push('Порог повинен бути в межах 0..100%.');
    return list;
  },[selectedLessonId, title, passMark, questions]);

  const completeness = useMemo(()=>{
    const total = Math.max(1, questions.length*3 + 2);
    let score = 0;
    if (selectedLessonId) score++;
    if (title.trim()) score++;
    questions.forEach(q=>{
      if (q.text.trim()) score++;
      if (q.type==='single'||q.type==='multiple'){
        if (q.options.length>=2) score++;
        if (q.options.some(o=>o.isCorrect)) score++;
      }else{
        score+=2;
      }
    });
    return Math.min(100, Math.round(score/total*100));
  },[selectedLessonId,title,questions]);

  const canSave = errors.length===0 && !!selectedLessonId && title.trim().length>0 && !saving;

  // autosave + hotkeys
  const saveNow = useCallback(async ()=>{
    if (!selectedLessonId || !title.trim()) return;
    setSaving(true); setErr(null); setOk(null);
    try{
      const dto = buildDto();
      const isUpdate = !!testId;
      const url = isUpdate ? `${API}/api/tests/${testId}/` : `${API}/api/tests/create/`;
      const method = isUpdate ? 'PUT' : 'POST';
      const r = await http({ url, method, data: dto });
      if (!isUpdate){ setTestId(r.data?.id || null); }
      setOk(isUpdate ? 'Зміни збережено.' : 'Тест створено.');
    } catch(e:any){ setErr(prettyError(e)); }
    finally{ setSaving(false); }
  },[testId, selectedLessonId, title, description, status, timeLimitMin, attemptsAllowed, passMark, shuffleQ, shuffleO, feedbackMode, questions]);

  useEffect(()=>{
    const onKey = (e:KeyboardEvent)=>{
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); if (canSave) saveNow(); }
      if (e.key.toLowerCase()==='n'){ addQuestion(); }
      if (e.altKey && e.key==='ArrowUp'){ e.preventDefault(); move(questions[questions.length-1]?.id, -1); }
      if (e.altKey && e.key==='ArrowDown'){ e.preventDefault(); move(questions[questions.length-1]?.id, +1); }
    };
    window.addEventListener('keydown', onKey); return ()=>window.removeEventListener('keydown', onKey);
  },[canSave, questions, saveNow]);

  const autosaveTimer = useRef<number | null>(null);
  useEffect(()=>{
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(()=>{ if (canSave) saveNow(); }, 2000);
    return ()=>{ if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); };
  },[title, description, status, timeLimitMin, attemptsAllowed, passMark, shuffleQ, shuffleO, feedbackMode, questions, canSave, saveNow]);

  // questions ops
  const addQuestion = () => setQuestions(prev=>[...prev, emptyQuestion(prev.length? Math.max(...prev.map(q=>q.id))+1 : 1)]);
  const removeQuestion = (qid:number) => setQuestions(prev=> prev.filter(q=>q.id!==qid));
  const move = (qid:number, dir:-1|1) => setQuestions(prev=>{
    const idx = prev.findIndex(q=>q.id===qid);
    if (idx<0) return prev;
    const next = [...prev];
    const to = idx+dir;
    if (to<0 || to>=next.length) return prev;
    [next[idx], next[to]] = [next[to], next[idx]];
    return next.map((q,i)=>({ ...q, order: i+1 }));
  });
  const addOption = (qid:number) => setQuestions(prev=> prev.map(q=> q.id===qid ? ({...q, options:[...q.options, { uid:uid(), text:'', isCorrect:false, order:(q.options?.length||0)+1 }]}) : q));
  const removeOption = (qid:number, ouid:string) => setQuestions(prev=> prev.map(q=> q.id===qid ? ({...q, options:q.options.filter(o=>o.uid!==ouid)}) : q));

  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pt-20 pb-24">
        {/* Header */}
        <header className="rounded-[24px] bg-white/90 ring-1 ring-[#E5ECFF] p-4 md:p-6 shadow-[0_10px_30px_rgba(2,28,78,0.10)] sticky top-12 z-10 backdrop-blur transition-all">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-slate-600">
                <Link href={`/teacher/courses/${courseId}/builder/overview`} className="text-indigo-600 hover:underline">Builder</Link>
                <span> / </span>
                <Link href={`/teacher/courses/${courseId}/builder/assessments`} className="text-indigo-600 hover:underline">Оцінювання</Link>
                <span> / Новий тест</span>
              </div>
              <input
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
                placeholder="Назва тесту…"
                className="w-full text-[26px] md:text-[32px] font-extrabold text-[#021C4E] leading-tight bg-transparent outline-none border-0 mt-1"
              />
              <div className="mt-2 text-xs text-slate-600 flex flex-wrap items-center gap-2">
                <span className={`px-2 py-1 rounded-full ${errors.length? 'bg-amber-50 text-amber-700 ring-amber-200':'bg-emerald-50 text-emerald-700 ring-emerald-200'} ring-1`}>
                  {errors.length? `Є помилки (${errors.length})` : 'Готово до збереження'}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-40 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all" style={{ width:`${completeness}%` }}/>
                  </div>
                  <span className="text-slate-500">{completeness}%</span>
                </div>
                {saving && <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Збереження…</span>}
                {ok && <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 animate-[fade_2s_ease]">{ok}</span>}
                {err && <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200">{err}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={saveNow} disabled={!canSave} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm inline-flex items-center gap-2 disabled:opacity-60 hover:shadow-md transition"><Save className="w-4 h-4"/> Зберегти</button>
              <Link href={`/teacher/courses/${courseId}/builder/assessments`} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2 hover:shadow-sm transition"><ChevronLeft className="w-4 h-4"/> Список</Link>
            </div>
          </div>
        </header>

        {/* Content grid */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left card */}
          <div className="rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4 shadow-[0_10px_30px_rgba(2,28,78,0.05)]">
            {/* Основні */}
            <Section title="Основні налаштування" icon={<Settings2 className="w-4 h-4"/>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-600">Урок</label>
                  <select value={selectedLessonId} onChange={(e)=> setSelectedLessonId(e.target.value? Number(e.target.value) : '')} className="w-full mt-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white">
                    <option value="">— Оберіть урок —</option>
                    {lessons.map(l=> <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Статус</label>
                  <select value={status} onChange={(e)=> setStatus(e.target.value as TestStatus)} className="w-full mt-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-slate-600">Опис</label>
                  <textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white"/>
                </div>
              </div>
            </Section>

            {/* Пресети */}
            <Section title="Швидкі пресети" icon={<Gauge className="w-4 h-4"/>}>
              <div className="flex flex-wrap gap-2">
                <Preset onClick={()=>applyPreset('quiz')}  label="Квіз 20 хв / 1 спроба / 60%" icon={<Sparkles className="w-4 h-4"/>}/>
                <Preset onClick={()=>applyPreset('exam')}  label="Іспит 60 хв / 1 спроба / 70%"  icon={<Shield className="w-4 h-4"/>}/>
                <Preset onClick={()=>applyPreset('speed')} label="Експрес 5 хв / 0 спроб / 50%"  icon={<Gauge className="w-4 h-4"/>}/>
              </div>
            </Section>

            {/* Правила */}
            <Section title="Правила" icon={<Rows4 className="w-4 h-4"/>}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <LabeledInput label="Ліміт часу (хв)" value={timeLimitMin} onChange={setTimeLimitMin} placeholder="напр. 30" icon={<Clock className="w-4 h-4"/>} />
                <LabeledInput label="К-сть спроб" value={attemptsAllowed} onChange={setAttemptsAllowed} placeholder="порожнє = без ліміту" icon={<TimerReset className="w-4 h-4"/>} />
                <LabeledInput label="Поріг, %" value={passMark} onChange={setPassMark} placeholder="0..100" />
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Toggle label="Перемішувати питання" checked={shuffleQ} onChange={setShuffleQ} icon={<Shuffle className="w-4 h-4"/>} />
                <Toggle label="Перемішувати варіанти" checked={shuffleO} onChange={setShuffleO} icon={<Shuffle className="w-4 h-4"/>} />
                <div>
                  <label className="text-sm text-slate-600">Показ фідбеку</label>
                  <select value={feedbackMode} onChange={(e)=> setFeedbackMode(e.target.value as any)} className="w-full mt-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white">
                    <option value="none">Не показувати</option>
                    <option value="immediate">Одразу після сабміту</option>
                    <option value="after_close">Після закриття</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* Питання */}
            <Section title="Питання" icon={<ListOrdered className="w-4 h-4"/>}>
              <div className="space-y-4">
                {questions.map((q)=> (
                  <QuestionCard key={q.id}
                    q={q}
                    onChange={(patch)=> setQuestions(prev=> prev.map(x=> x.id===q.id ? { ...x, ...patch, touched:true } : x))}
                    onRemove={()=> removeQuestion(q.id)}
                    onMoveUp={()=> move(q.id, -1)}
                    onMoveDown={()=> move(q.id, +1)}
                    addOption={()=> addOption(q.id)}
                    removeOption={(ouid)=> removeOption(q.id, ouid)}
                  />
                ))}
                <div className="pt-1 flex flex-wrap gap-2">
                  <button type="button" onClick={addQuestion} className="px-4 py-2 rounded-xl bg-indigo-600 text-white inline-flex items-center justify-center gap-2 hover:shadow-md transition">
                    <SquarePlus className="w-4 h-4"/> Додати питання
                  </button>
                  <button type="button" onClick={()=> setQuestions(prev=>[...prev, {...emptyQuestion(prev.length? Math.max(...prev.map(q=>q.id))+1 : 1), type:'multiple'}])} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2 hover:shadow-sm transition">
                    <Copy className="w-4 h-4"/> Швидко: Multiple
                  </button>
                </div>
              </div>
            </Section>

            {/* Помилки */}
            {!!errors.length && (
              <div className="mt-4 rounded-xl bg-amber-50 text-amber-800 ring-1 ring-amber-200 p-3">
                <div className="font-semibold mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Треба виправити:</div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {errors.map((e,i)=> <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Right */}
          <aside className="space-y-4">
            <InfoCard/>
            <div className="rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4 shadow-[0_10px_30px_rgba(2,28,78,0.05)]">
              <div className="text-sm font-semibold text-[#0F2E64] mb-2">Дії</div>
              <div className="grid gap-2">
                <button onClick={saveNow} disabled={!canSave} className="px-3 py-2 rounded-xl bg-indigo-600 text-white inline-flex items-center justify-center gap-2 disabled:opacity-60 hover:shadow-md transition">
                  <Save className="w-4 h-4"/> Зберегти
                </button>
                <Link href={`/teacher/courses/${courseId}/builder/assessments`} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white inline-flex items-center justify-center gap-2 hover:shadow-sm transition">
                  <ChevronLeft className="w-4 h-4"/> Назад до списку
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm animate-[fade_.2s_ease]">
          <div className="max-w-3xl w-[95%] rounded-2xl bg-white ring-1 ring-[#E5ECFF] shadow-2xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-[#0F2E64]">Прев’ю для студента</div>
              <button onClick={()=>setShowPreview(false)} className="px-2 py-1 rounded-lg ring-1 ring-slate-200 hover:bg-slate-50"><X className="w-4 h-4"/></button>
            </div>
            <div className="mt-3 max-h-[70vh] overflow-auto pr-1">
              <h3 className="text-xl font-bold">{title || 'Без назви'}</h3>
              <p className="text-sm text-slate-600">{description}</p>
              <div className="mt-3 space-y-4">
                {questions.map((q)=>(
                  <div key={q.id} className="rounded-xl ring-1 ring-[#E5ECFF] p-3">
                    <div className="text-sm text-slate-600">#{q.order} • {labelOfType(q.type)} • {q.points} бал.</div>
                    <div className="font-medium mt-1">{q.text || <span className="text-slate-400">[текст питання]</span>}</div>
                    <div className="mt-2 text-sm">
                      {(q.type==='single'||q.type==='multiple') && (
                        <ul className="space-y-1">
                          {q.options.map(o=> <li key={o.uid} className="px-3 py-2 rounded-lg ring-1 ring-[#E5ECFF]">{o.text || <span className="text-slate-400">варіант</span>}</li>)}
                        </ul>
                      )}
                      {q.type==='true_false' && <div className="px-3 py-2 rounded-lg ring-1 ring-[#E5ECFF] inline-block">True / False</div>}
                      {(q.type==='short'||q.type==='long'||q.type==='code') && <div className="px-3 py-2 rounded-lg ring-1 ring-[#E5ECFF] inline-block w-full">Текстова відповідь…</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-right">
              <button onClick={()=>setShowPreview(false)} className="px-3 py-2 rounded-xl bg-indigo-600 text-white inline-flex items-center gap-2">Ок</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fade { from{opacity:0; transform:translateY(4px)} to{opacity:1; transform:none} }
      `}</style>
    </main>
  );
}

/* =====================================================
   UI bits
===================================================== */
function Section({ title, icon, children }:{ title:string; icon?:React.ReactNode; children:React.ReactNode }){
  return (
    <section className="not-prose animate-[fade_.2s_ease]">
      <div className="flex items-center gap-2 mb-2"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700">{icon}</span><h2 className="text-base font-semibold text-[#0F2E64]">{title}</h2></div>
      <div className="rounded-xl ring-1 ring-[#E5ECFF] p-3 bg-white">{children}</div>
    </section>
  );
}
function LabeledInput({ label, value, onChange, placeholder, icon }:{ label:string; value:string; onChange:(v:string)=>void; placeholder?:string; icon?:React.ReactNode }){
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <div className="mt-1 flex items-center gap-2 ring-1 ring-[#E5ECFF] rounded-xl bg-white px-2 py-1.5 focus-within:ring-indigo-400 transition">
        {icon}
        <input value={value} onChange={(e)=> onChange(e.target.value)} placeholder={placeholder} className="flex-1 outline-none bg-transparent px-1"/>
      </div>
    </div>
  );
}
function Toggle({ label, checked, onChange, icon }:{ label:string; checked:boolean; onChange:(v:boolean)=>void; icon?:React.ReactNode }){
  return (
    <label className="flex items-center justify-between gap-3 ring-1 ring-[#E5ECFF] rounded-xl bg-white px-3 py-2 hover:shadow-sm transition">
      <span className="inline-flex items-center gap-2 text-sm text-slate-700">{icon}{label}</span>
      <button type="button" onClick={()=> onChange(!checked)} className={`w-10 h-6 rounded-full transition ${checked? 'bg-indigo-600':'bg-slate-300'}`}>
        <span className={`block w-5 h-5 bg-white rounded-full mt-0.5 transition ${checked? 'translate-x-5':'translate-x-0.5'}`}></span>
      </button>
    </label>
  );
}
function Preset({ label, onClick, icon }:{ label:string; onClick:()=>void; icon:React.ReactNode }){
  return (
    <button onClick={onClick} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2 hover:shadow-sm active:translate-y-[1px] transition">
      {icon} {label}
    </button>
  );
}
function InfoCard(){
  return (
    <div className="rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4 shadow-[0_10px_30px_rgba(2,28,78,0.05)]">
      <div className="text-sm font-semibold text-[#0F2E64] mb-1 flex items-center gap-2"><CircleHelp className="w-4 h-4"/> Поради</div>
      <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
        <li>Використовуйте <b>пресети</b> та <b>перемішування</b> для чесності.</li>
        <li>Multiple: часткове нарахування вже підтримане беком.</li>
        <li>Short: еталонна відповідь у полі “Правильна” (синоніми — поки вручну).</li>
      </ul>
    </div>
  );
}
function labelOfType(t:QuestionType){
  return t==='single'?'Один варіант': t==='multiple'?'Кілька варіантів': t==='true_false'?'True/False': t==='short'?'Коротка': t==='long'?'Розгорнута': t==='code'?'Код': t==='match'?'Відповідність':'Порядок';
}
function QuestionCard({ q, onChange, onRemove, onMoveUp, onMoveDown, addOption, removeOption }:{
  q: QuestionUI;
  onChange:(patch: Partial<QuestionUI>)=>void;
  onRemove:()=>void;
  onMoveUp:()=>void;
  onMoveDown:()=>void;
  addOption:()=>void;
  removeOption:(ouid:string)=>void;
}){
  const invalid =
    !q.text.trim() ||
    ((q.type==='single'||q.type==='multiple') && (!q.options.length || !q.options.some(o=>o.isCorrect)));

  return (
    <div className={`rounded-xl ring-1 p-3 bg-white transition shadow-sm ${invalid && q.touched ? 'ring-red-200' : 'ring-[#E5ECFF]'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-400"/>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100">#{q.order}</span>
          {q.touched && !invalid && <span className="text-emerald-600 text-xs inline-flex items-center gap-1"><Check className="w-3 h-3"/> ок</span>}
          {q.touched && invalid && <span className="text-amber-600 text-xs inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> перевір</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onMoveUp} title="Вгору" className="px-2 py-1 rounded-lg ring-1 ring-slate-200 hover:shadow-sm">↑</button>
          <button onClick={onMoveDown} title="Вниз" className="px-2 py-1 rounded-lg ring-1 ring-slate-200 hover:shadow-sm">↓</button>
          <button onClick={onRemove} className="px-2 py-1 rounded-lg ring-1 ring-red-200 text-red-700 inline-flex items-center gap-1 hover:shadow-sm"><Trash2 className="w-4 h-4"/> Видалити</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
        <div className="md:col-span-2">
          <label className="text-sm text-slate-600">Текст питання</label>
          <input
            value={q.text}
            onChange={(e)=> onChange({ text:e.target.value })}
            onBlur={()=> onChange({ touched:true })}
            className="w-full mt-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white focus:ring-indigo-400 transition"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Тип</label>
          <select value={q.type} onChange={(e)=>{
            const t = e.target.value as QuestionType;
            const patch: Partial<QuestionUI> = { type:t };
            if (t==='single' || t==='multiple') patch.options = q.options.length? q.options : [ {uid:uid(), text:'', isCorrect:false, order:1 }, { uid:uid(), text:'', isCorrect:false, order:2 } ];
            if (t==='true_false') patch.trueFalse = q.trueFalse || 'true';
            if (t==='short' || t==='long' || t==='code') patch.correctText = q.correctText || '';
            if (t==='match' || t==='order') patch.spec = q.spec || { solution:{} };
            onChange(patch);
          }} className="w-full mt-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white focus:ring-indigo-400 transition">
            <option value="single">Один варіант</option>
            <option value="multiple">Кілька варіантів</option>
            <option value="true_false">Правда / Брехня</option>
            <option value="short">Коротка відповідь</option>
            <option value="long">Розгорнута відповідь</option>
            <option value="code">Код</option>
            <option value="match">Відповідність</option>
            <option value="order">Порядок</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600">Бали</label>
          <input type="number" min={0.25} step={0.25} value={q.points} onChange={(e)=> onChange({ points: Number(e.target.value)||1 })} className="w-full mt-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white focus:ring-indigo-400 transition"/>
        </div>
      </div>

      {(q.type==='single' || q.type==='multiple') && (
        <div className="mt-3">
          <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <List className="w-4 h-4"/> Варіанти
          </div>
          <div className="space-y-2">
            {q.options.map((o)=> (
              <div key={o.uid} className="flex items-center gap-2 group">
                <input
                  type={q.type==='single'? 'radio':'checkbox'}
                  checked={!!o.isCorrect}
                  onChange={(e)=>{
                    if (q.type==='single'){
                      onChange({ options: q.options.map(x=> x.uid===o.uid? { ...x, isCorrect:true } : { ...x, isCorrect:false }) });
                    } else {
                      onChange({ options: q.options.map(x=> x.uid===o.uid? { ...x, isCorrect:e.target.checked } : x) });
                    }
                  }}
                  className="accent-indigo-600"
                />
                <input
                  value={o.text}
                  onChange={(e)=> onChange({ options: q.options.map(x=> x.uid===o.uid? { ...x, text:e.target.value } : x) })}
                  className="flex-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white focus:ring-indigo-400 transition"
                  placeholder="Текст варіанту"
                />
                <button onClick={()=> removeOption(o.uid)} className="px-2 py-1 rounded-lg ring-1 ring-slate-200 opacity-0 group-hover:opacity-100 transition"><X className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <button type="button" onClick={addOption} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 inline-flex items-center gap-2 hover:shadow-sm transition"><Plus className="w-4 h-4"/> Додати варіант</button>
          </div>
        </div>
      )}

      {q.type==='true_false' && (
        <div className="mt-3 flex items-center gap-4">
          <label className="inline-flex items-center gap-2"><input type="radio" checked={q.trueFalse==='true'} onChange={()=> onChange({ trueFalse:'true' })} className="accent-indigo-600"/> True</label>
          <label className="inline-flex items-center gap-2"><input type="radio" checked={q.trueFalse==='false'} onChange={()=> onChange({ trueFalse:'false' })} className="accent-indigo-600"/> False</label>
        </div>
      )}

      {(q.type==='short' || q.type==='long' || q.type==='code') && (
        <div className="mt-3">
          <label className="text-sm text-slate-600">Правильна відповідь (еталон, опційно)</label>
          <input value={q.correctText||''} onChange={(e)=> onChange({ correctText:e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white focus:ring-indigo-400 transition"/>
        </div>
      )}

      {(q.type==='match' || q.type==='order') && (
        <div className="mt-3">
          <label className="text-sm text-slate-600">JSON-специфікація (solution / pairs / order ...)</label>
          <textarea value={JSON.stringify(q.spec||{}, null, 2)} onChange={(e)=>{
            try{ const v = JSON.parse(e.target.value||'{}'); onChange({ spec:v }); }
            catch{ /* ignore */ }
          }} rows={6} className="w-full mt-1 px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white font-mono text-xs focus:ring-indigo-400 transition"/>
        </div>
      )}
    </div>
  );
}

/* small UI helpers */
function label({bad}:{bad?:boolean}){
  return bad ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200';
}
function InfoPill({ ok=true, children }:{ ok?:boolean; children:React.ReactNode }){
  return <span className={`px-2 py-1 rounded-full text-xs ring-1 ${label({bad:!ok})}`}>{children}</span>;
}
