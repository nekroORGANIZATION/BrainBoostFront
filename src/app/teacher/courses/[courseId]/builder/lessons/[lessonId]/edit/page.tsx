'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import http, { setAuthHeader } from '@/lib/http';
import {
  Save, Eye, ChevronLeft, Download, Type, Bold, Italic, Underline as UnderlineIcon,
  Strikethrough, Highlighter, Quote, Code2, Minus, Link2, Unlink, Image as ImageIcon,
  Youtube, Table as TableIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, ListChecks, Heading1, Heading2, Heading3, Palette, Wand2,
  Columns2, Redo2, Undo2, Eraser, Sparkles, Info, AlertTriangle, CheckCircle2,
  Subscript, Superscript
} from 'lucide-react';

/* ===================== helpers (1:1 зі сторінкою створення) ===================== */
const nowTimeUA = () => new Date().toLocaleTimeString('uk-UA');

type Module = { id:number; title:string; order:number; is_visible?:boolean };

type LessonDto = {
  id:number; title:string; course:number;
  module?: { id:number } | number | null;
  summary?: string;
  contents?: Array<{ type:string; data:any; order:number; is_hidden:boolean }>;
};

function asArray<T=any>(raw:any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw?.results && Array.isArray(raw.results)) return raw.results as T[];
  if (raw?.data && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}

async function uploadImageSmart(file: File): Promise<string> {
  const fd = new FormData(); fd.append('file', file);
  const endpoints = ['/files/upload/', '/media/upload/', '/upload/', '/api/files/', '/api/upload/'];
  for (const url of endpoints) {
    try {
      const r = await http.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const d = r.data || {}; const u = d.url || d.file || d.path || d.location;
      if (u) {
        const base = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
        return String(u).startsWith('http') ? String(u) : `${base}${String(u).startsWith('/') ? '' : '/'}${u}`;
      }
    } catch {}
  }
  // фолбек — base64
  const toBase64 = (f: File) => new Promise<string>((res, rej) => {
    const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(f);
  });
  return await toBase64(file);
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function tableHTML(rows=3, cols=3, header=true) {
  const th = `<tr>${Array.from({length:cols}).map((_,i)=>`<th>Колонка ${i+1}</th>`).join('')}</tr>`;
  const trs = Array.from({length:rows}).map((_,r)=>`<tr>${Array.from({length:cols}).map((__,c)=>`<td>R${r+1}C${c+1}</td>`).join('')}</tr>`).join('');
  return `<table class="cxe-table">${header?th:''}${trs}</table><p><br/></p>`;
}

const CALL = {
  info: (txt='Пояснення / контекст') => `<div class="cxe-callout cxe-callout-info"><strong>Інфо:</strong> ${txt}</div>`,
  warn: (txt='Застереження / важливо') => `<div class="cxe-callout cxe-callout-warn"><strong>Увага:</strong> ${txt}</div>`,
  ok: (txt='Порада / best practice') => `<div class="cxe-callout cxe-callout-ok"><strong>Порада:</strong> ${txt}</div>`,
};

const COLS2 = `<div class="cxe-cols"><div><h3>Колонка 1</h3><p>Вміст…</p></div><div><h3>Колонка 2</h3><p>Вміст…</p></div></div><p><br/></p>`;

function extractText(html: string) { const d = document.createElement('div'); d.innerHTML = html || ''; return (d.innerText || '').trim(); }

function prettyError(e: any): string {
  const data = e?.response?.data; const status = e?.response?.status;
  if (typeof data === 'string') return data;
  if (!data) return e?.message || 'Сталася помилка.';
  if (data.detail) return String(data.detail);
  try {
    return Object.entries(data).map(([k, v]) => (Array.isArray(v) ? `${k}: ${v.join(', ')}` : `${k}: ${JSON.stringify(v)}`)).join('\n');
  } catch { return status ? `HTTP ${status}` : 'Сталася помилка.'; }
}

/* ===================== PAGE (EDIT) ===================== */
export default function LessonEditPage() {
  const router = useRouter();
  const params = useParams() as { courseId?: string|string[]; lessonId?: string|string[] };

  const courseId = Number(Array.isArray(params.courseId)?params.courseId[0]:params.courseId);
  const lessonId = Number(Array.isArray(params.lessonId)?params.lessonId[0]:params.lessonId);
  const { accessToken } = useAuth();

  // meta
  const [lessonTitle, setLessonTitle] = useState('Завантаження…');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string|null>(null);

  // модулі для селекту
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleIdState, setModuleIdState] = useState<number|null>(null);

  // editor
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [html, setHtml] = useState<string>('');
  const [sourceMode, setSourceMode] = useState(false);
  const [busy, setBusy] = useState(false);

  // selection state
  const [sel, setSel] = useState({ b:false,i:false,u:false,s:false, sub:false, sup:false, align:'left' as 'left'|'center'|'right'|'justify', ul:false, ol:false, link:false, blockquote:false });

  // sidebar
  const [stats, setStats] = useState({ words: 0, chars: 0, read: '0 хв' });
  const [outline, setOutline] = useState<Array<{id:string; text:string; level:number}>>([]);

  /* ---------- auth → axios ---------- */
  useEffect(()=>{ if(accessToken) setAuthHeader(accessToken); },[accessToken]);

  /* ---------- load lesson + modules ---------- */
  useEffect(() => {
    if (!courseId || !lessonId) return;
    let cancel = false;
    (async () => {
      try {
        setErr(null);
        const [lRes, mRes] = await Promise.all([
          http.get(`/lesson/admin/lessons/${lessonId}/`),
          http.get(`/lesson/admin/modules/`, { params: { course: courseId, ordering: 'order' } })
        ]);
        if (cancel) return;
        const l = (lRes.data || {}) as LessonDto;
        const ms = asArray<Module>(mRes.data).sort((a,b)=>a.order-b.order||a.id-b.id);

        setModules(ms);
        setLessonTitle(l.title || 'Урок');
        // нормалізуємо модуль
        const modId = (typeof l.module === 'number') ? l.module : (l.module?.id ?? null);
        setModuleIdState(modId ?? null);

        // initial html
        let initialHtml = '';
        const blocks = Array.isArray(l?.contents) ? l.contents : [];
        const htmlBlock = blocks.find((b: any) => b?.type === 'html' && b?.data?.html);
        const textBlock = blocks.find((b: any) => b?.type === 'text' && b?.data?.text);
        if (htmlBlock) initialHtml = String(htmlBlock.data.html || '');
        else if (textBlock) initialHtml = `<p>${String(textBlock.data.text || '')}</p>`;
        else if (l?.summary) initialHtml = String(l.summary);
        setHtml(initialHtml);
        setTimeout(()=>{ if (editorRef.current) editorRef.current.innerHTML = initialHtml; },0);
      } catch (e:any) {
        setErr(prettyError(e));
      }
    })();
    return () => { cancel = true; };
  }, [courseId, lessonId]);

  /* ---------- core editor helpers (ідентично "створенню") ---------- */
  const focusEditor = () => { editorRef.current?.focus(); };
  const exec = (command: string, value?: string) => { focusEditor(); document.execCommand(command, false, value); };

  function insertHTML(htmlFrag: string, ref: React.RefObject<HTMLDivElement | null>) {
    focusEditor(); const el = ref.current; const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !el) { el?.insertAdjacentHTML('beforeend', htmlFrag); return; }
    const range = sel.getRangeAt(0); range.deleteContents(); const tmp = document.createElement('div'); tmp.innerHTML = htmlFrag;
    const frag = document.createDocumentFragment(); let node: ChildNode | null; while ((node = tmp.firstChild)) frag.appendChild(node);
    range.insertNode(frag); sel.collapseToEnd();
  }
  function wrapSelection(tagName: string, styles?: Record<string,string>) {
    focusEditor(); const sel = window.getSelection(); if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0); const span = document.createElement(tagName); if (styles) Object.assign(span.style, styles);
    span.appendChild(range.extractContents()); range.insertNode(span); sel.collapseToEnd();
  }
  const setHeading = (level: 1|2|3) => exec('formatBlock', `<h${level}>`);
  const setAlign = (a: 'left'|'center'|'right'|'justify') => exec('justify' + a[0].toUpperCase()+a.slice(1));
  const setFontSizePx = (px: string) => wrapSelection('span', { fontSize: px });
  const setFontFamily = (css: string) => wrapSelection('span', { fontFamily: css });
  const setColor = (hex: string) => exec('foreColor', hex);
  const setHighlight = (hex: string) => exec('hiliteColor', hex);
  const clearFormatting = () => exec('removeFormat');
  const undo = () => exec('undo');
  const redo = () => exec('redo');
  const subscript = () => exec('subscript');
  const superscript = () => exec('superscript');
  const addLink = () => { const url = prompt('Вставити URL посилання:'); if (!url) return; exec('createLink', url); };
  const removeLink = () => exec('unlink');

  const insertImage = async () => {
    const fromFile = confirm('Завантажити файл? (ОК — файл, Відміна — URL)');
    if (fromFile) {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = async () => { const f = inp.files?.[0]; if (!f) return; const url = await uploadImageSmart(f); insertHTML(`<figure><img src="${url}" alt="" /><figcaption>Підпис (необовʼязково)</figcaption></figure><p><br/></p>`, editorRef); };
      inp.click();
    } else {
      const url = prompt('Вставити URL зображення:'); if (url) insertHTML(`<figure><img src="${url}" alt="" /><figcaption>Підпис (необовʼязково)</figcaption></figure><p><br/></p>`, editorRef);
    }
  };
  const insertYouTube = () => {
    const url = prompt('Вставити YouTube URL:'); if (!url) return;
    const yt = /youtu\.be|youtube\.com/.test(url); let embed = url;
    if (yt) { try { const u = new URL(url); const v = u.searchParams.get('v') || url.split('/').pop() || ''; embed = `https://www.youtube.com/embed/${v}`; } catch {} }
    insertHTML(`<p><iframe class="cxe-video" src="${embed}" allowfullscreen></iframe></p>`, editorRef);
  };
  const insertTable = () => { const r = Number(prompt('К-сть рядків:', '3') || '3'); const c = Number(prompt('К-сть колонок:', '3') || '3'); insertHTML(tableHTML(Math.max(1, r), Math.max(1, c), true), editorRef); };
  const insertChecklist = () => { insertHTML(`<ul class="cxe-checklist"><li data-checked="false">Завдання 1</li><li data-checked="false">Завдання 2</li><li data-checked="false">Завдання 3</li></ul><p><br/></p>`, editorRef); };
  const toggleBlockquote = () => { const bq = closest(editorRef.current, 'blockquote'); if (bq) unwrap(bq as HTMLElement); else exec('formatBlock', '<blockquote>'); };
  const insertCols2 = () => insertHTML(COLS2, editorRef);
  const insertCallout = (kind: 'info'|'warn'|'ok') => insertHTML(CALL[kind](), editorRef);
  const toggleSource = () => { if (!sourceMode) { setHtml(editorRef.current?.innerHTML || ''); setSourceMode(true); } else { if (editorRef.current) editorRef.current.innerHTML = html; setSourceMode(false); } };

  /* ---------- selection listeners ---------- */
  useEffect(() => {
    const onSel = () => {
      const q = (cmd:string) => (document.queryCommandState(cmd) as boolean) || false;
      const align = document.queryCommandState('justifyCenter') ? 'center' : document.queryCommandState('justifyRight') ? 'right' : document.queryCommandState('justifyFull') ? 'justify' : 'left';
      setSel({ b: q('bold'), i: q('italic'), u: q('underline'), s: q('strikeThrough'), sub: q('subscript'), sup: q('superscript'), ul: q('insertUnorderedList'), ol: q('insertOrderedList'), link: q('unlink') === false, blockquote: !!closest(editorRef.current, 'blockquote'), align });
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  /* ---------- sanitize paste ---------- */
  useEffect(() => {
    const el = editorRef.current; if (!el) return;
    const onPaste = (e: ClipboardEvent) => { if (!e.clipboardData) return; e.preventDefault(); const h = e.clipboardData.getData('text/html') || ''; const t = e.clipboardData.getData('text/plain') || ''; const clean = h ? sanitizeHTML(h) : t.replace(/\r\n|\r|\n/g, '<br/>'); insertHTML(clean, editorRef); };
    el.addEventListener('paste', onPaste as any); return () => { el.removeEventListener('paste', onPaste as any); };
  }, []);

  /* ---------- drag & drop images ---------- */
  useEffect(() => {
    const el = editorRef.current; if (!el) return;
    const onDrop = async (ev: DragEvent) => { ev.preventDefault(); if (!ev.dataTransfer) return; const file = ev.dataTransfer.files?.[0]; if (file && file.type.startsWith('image/')) { const url = await uploadImageSmart(file); insertHTML(`<figure><img src="${url}" alt="" /><figcaption>Підпис</figcaption></figure><p><br/></p>`, editorRef); } };
    const onDragOver = (e: DragEvent) => e.preventDefault();
    el.addEventListener('drop', onDrop as any); el.addEventListener('dragover', onDragOver as any);
    return () => { el.removeEventListener('drop', onDrop as any); el.removeEventListener('dragover', onDragOver as any); };
  }, []);

  /* ---------- stats & outline ---------- */
  useEffect(() => {
    const calc = () => {
      const root = editorRef.current; const text = (root?.innerText || '').trim();
      const words = text ? text.split(/\s+/).length : 0; const chars = text.length; const mins = Math.max(1, Math.ceil(words / 180)); setStats({ words, chars, read: `${mins} хв` });
      const out: Array<{id:string;text:string;level:number}> = []; if (root) { root.querySelectorAll('h1,h2,h3').forEach((h,i) => { const id = `h-${i}`; (h as HTMLElement).id = (h as HTMLElement).id || id; out.push({ id: (h as HTMLElement).id, text: (h.textContent||'').trim(), level: Number(h.nodeName[1]) }); }); } setOutline(out);
    };
    const el = editorRef.current; if (!el) return; const onInput = () => calc();
    el.addEventListener('input', onInput); calc();
    return () => el.removeEventListener('input', onInput);
  }, []);

  /* ---------- hotkeys ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveNow(false); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [lessonTitle, html, moduleIdState, sourceMode]);

  /* ---------- SAVE (PATCH існуючого уроку) ---------- */
  const saveNow = useCallback(async (goToProgram=false) => {
    setBusy(true); setErr(null);
    try {
      const contentHtml = sourceMode ? html : (editorRef.current?.innerHTML || '');
      const summaryText = extractText(contentHtml).slice(0, 300);
      const blocks = [{ type: 'html', data: { html: contentHtml }, order: 0, is_hidden: false }];

      await http.patch(`/lesson/admin/lessons/${lessonId}/`, {
        title: (lessonTitle || '').trim(),
        summary: summaryText,
        contents: blocks,
        module_id: moduleIdState, // ВАЖЛИВО: змінюємо/закріплюємо модуль
      });

      setLastSaved(nowTimeUA());
      if (goToProgram) router.push(`/teacher/courses/${courseId}/builder/program`);
    } catch (e:any) { setErr(prettyError(e)); } finally { setBusy(false); }
  }, [lessonId, lessonTitle, sourceMode, html, moduleIdState, router, courseId]);

  /* ---------- GUARD ---------- */
  if (!accessToken) {
    return (
      <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top grid place-items-center px-6">
        <div className="max-w-lg rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-6 text-center">
          <h1 className="text-2xl font-extrabold text-[#0F2E64]">Потрібен вхід</h1>
          <p className="text-slate-600 mt-1">Щоб редагувати уроки — увійди.</p>
          <div className="mt-4"><Link href="/login" className="inline-flex items-center px-5 py-2 rounded-xl bg-[#1345DE] text-white font-semibold">Увійти</Link></div>
        </div>
      </main>
    );
  }

  /* ---------- UI ---------- */
  return (
    <main className="min-h-screen bg-[url('/images/back.png')] bg-cover bg-top">
      <style>{`
        .cxe { line-height: 1.7; }
        .cxe h1,h2,h3 { color:#021C4E; font-weight:800; }
        .cxe h1 { font-size: 28px; margin: .6em 0 .3em; }
        .cxe h2 { font-size: 22px; margin: .8em 0 .35em; }
        .cxe h3 { font-size: 18px; margin: .9em 0 .4em; }
        .cxe p, .cxe ul, .cxe ol, .cxe blockquote, .cxe pre, .cxe figure { margin: .5em 0; }
        .cxe ul, .cxe ol { padding-left: 1.2em; }
        .cxe figure img { max-width: 100%; border-radius: 10px; }
        .cxe figure figcaption { font-size: 12px; color: #64748b; margin-top: 4px; }
        .cxe blockquote { border-left: 4px solid #1345DE; padding: .2em .8em; color: #334155; background: #f8fbff; border-radius: 8px; }
        .cxe pre { background:#0b1020; color:#e2e8f0; padding: 12px; border-radius:10px; overflow:auto; font-size: 13px; }
        .cxe .cxe-video { width: 100%; aspect-ratio: 16/9; border: 0; border-radius: 10px; }
        .cxe .cxe-table { width: 100%; border-collapse: collapse; }
        .cxe .cxe-table th, .cxe .cxe-table td { border: 1px solid #E5ECFF; padding: 8px; }
        .cxe .cxe-checklist li { list-style: none; position: relative; padding-left: 26px; margin: 6px 0; }
        .cxe .cxe-checklist li::before { content: attr(data-checked); display: inline-block; width: 16px; height: 16px; border: 1px solid #94a3b8; position: absolute; left: 0; top: 2px; border-radius: 4px; background: #fff; color: transparent; }
        .cxe .cxe-checklist li[data-checked="true"]::before { background: #10b981; border-color: #10b981; color: #fff; content: "✓"; font-weight: 700; text-align: center; line-height: 16px; }
        .cxe .cxe-callout { padding:12px 14px; border-radius:12px; border:1px solid; }
        .cxe .cxe-callout-info { background:#EEF6FF; border-color:#BFDBFE; color:#1e3a8a; }
        .cxe .cxe-callout-warn { background:#FFF7ED; border-color:#FED7AA; color:#7c2d12; }
        .cxe .cxe-callout-ok { background:#ECFDF5; border-color:#A7F3D0; color:#065f46; }
        .cxe .cxe-cols { display:grid; gap:16px; grid-template-columns: 1fr; }
        @media (min-width: 768px) { .cxe .cxe-cols { grid-template-columns: 1fr 1fr; } }
        .toolbar button.active { background: rgba(19,69,222,0.08); color: #1345DE; }
        .cxe[contenteditable="true"][data-placeholder]:empty::before { content: attr(data-placeholder); color: #94a3b8; }
        .no-scrollbar::-webkit-scrollbar{ display:none; }
      `}</style>

      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pt-[90px] pb-24">
        {/* Header */}
        <div className="rounded-[24px] bg-white/90 ring-1 ring-[#E5ECFF] p-4 md:p-6 shadow-[0_10px_30px_rgba(2,28,78,0.10)]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-slate-600">
                <Link href={`/teacher/courses/${courseId}/builder/overview`} className="text-[#1345DE] hover:underline">Builder</Link>
                <span> / </span>
                <Link href={`/teacher/courses/${courseId}/builder/lessons`} className="text-[#1345DE] hover:underline">Розділи/Уроки</Link>
                <span> / Редактор</span>
              </div>
              <input
                value={lessonTitle}
                onChange={(e)=>setLessonTitle(e.target.value)}
                placeholder="Назва уроку…"
                className="w-full text-[26px] md:text-[32px] font-extrabold text-[#021C4E] leading-tight bg-transparent outline-none border-0 mt-1"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {/* селектор модуля */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Розділ:</span>
                  <select
                    value={moduleIdState ?? ''}
                    onChange={(e)=>setModuleIdState(e.target.value?Number(e.target.value):null)}
                    className="px-2 py-1.5 rounded-lg ring-1 ring-[#E5ECFF] bg-white text-sm"
                  >
                    <option value="">— Без розділу —</option>
                    {modules.map(m=> (
                      <option key={m.id} value={m.id}>#{m.order} • {m.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {busy ? 'Зберігаємо…' : lastSaved ? `Збережено о ${lastSaved}` : 'Чернетка не збережена'}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={()=>saveNow(false)} disabled={busy} className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white text-sm inline-flex items-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" /> Зберегти
              </button>
              <button onClick={()=>saveNow(true)} disabled={busy} className="px-3 py-2 rounded-xl bg-[#1345DE] text-white text-sm inline-flex items-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" /> Зберегти та повернутись
              </button>
              <Link href={`/courses/${courseId}`} className="px-3 py-2 rounded-xl text-sm ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2">
                <Eye className="w-4 h-4" /> Переглянути курс
              </Link>
              <Link href={`/teacher/courses/${courseId}/builder/lessons`} className="px-3 py-2 rounded-xl text-sm ring-1 ring-[#E5ECFF] bg-white inline-flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> До розділів
              </Link>
            </div>
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-xl bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 whitespace-pre-wrap">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 mt-0.5"/> <span>{err}</span>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="mt-4 rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-3 shadow-sm overflow-x-auto no-scrollbar">
          <div className="toolbar flex flex-wrap items-center gap-1">
            <Btn onClick={undo} icon={<Undo2/>} title="Відмінити"/>
            <Btn onClick={redo} icon={<Redo2/>} title="Повторити"/>
            <Divider/>

            <Btn onClick={()=>setHeading(1)} icon={<Heading1/>} title="H1"/>
            <Btn onClick={()=>setHeading(2)} icon={<Heading2/>} title="H2"/>
            <Btn onClick={()=>setHeading(3)} icon={<Heading3/>} title="H3"/>
            <Divider/>

            <Btn onClick={()=>exec('bold')} icon={<Bold/>} active={sel.b} title="Жирний"/>
            <Btn onClick={()=>exec('italic')} icon={<Italic/>} active={sel.i} title="Курсив"/>
            <Btn onClick={()=>exec('underline')} icon={<UnderlineIcon/>} active={sel.u} title="Підкреслення"/>
            <Btn onClick={()=>exec('strikeThrough')} icon={<Strikethrough/>} active={sel.s} title="Перекреслення"/>
            <Btn onClick={subscript} icon={<Subscript/>} active={sel.sub} title="Підрядковий"/>
            <Btn onClick={superscript} icon={<Superscript/>} active={sel.sup} title="Надрядковий"/>
            <Btn onClick={()=>wrapSelection('code')} icon={<Code2/>} title="Inline code"/>
            <Btn onClick={()=>insertHTML('<pre><code>Ваш код…</code></pre><p><br/></p>', editorRef)} icon={<Code2/>} title="Код-блок"/>
            <Btn onClick={()=>setHighlight('#fff59d')} icon={<Highlighter/>} title="Виділити (жовтий)"/>
            <Divider/>

            <label className="inline-flex items-center gap-2 px-2 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white cursor-pointer">
              <Palette className="w-4 h-4"/>
              <input type="color" onChange={(e)=>setColor(e.target.value)} className="w-6 h-6 p-0 border-0 bg-transparent" />
            </label>
            <select onChange={(e)=>setFontFamily(e.target.value)} className="px-2 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white" defaultValue="">
              <option value="" disabled>Шрифт</option>
              <option value="Inter, ui-sans-serif">Inter</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="monospace">Monospace</option>
            </select>
            <select onChange={(e)=>setFontSizePx(e.target.value)} className="px-2 py-1.5 rounded-xl ring-1 ring-[#E5ECFF] bg-white" defaultValue="">
              <option value="" disabled>Розмір</option>
              {['14','16','18','20','24','28','32','36','40'].map(s=>
                <option key={s} value={`${s}px`}>{s}</option>
              )}
            </select>
            <Divider/>

            <Btn onClick={()=>setAlign('left')} icon={<AlignLeft/>} active={sel.align==='left'} title="Left"/>
            <Btn onClick={()=>setAlign('center')} icon={<AlignCenter/>} active={sel.align==='center'} title="Center"/>
            <Btn onClick={()=>setAlign('right')} icon={<AlignRight/>} active={sel.align==='right'} title="Right"/>
            <Btn onClick={()=>setAlign('justify')} icon={<AlignJustify/>} active={sel.align==='justify'} title="Justify"/>
            <Divider/>

            <Btn onClick={()=>exec('insertUnorderedList')} icon={<List/>} active={sel.ul} title="Маркерований"/>
            <Btn onClick={()=>exec('insertOrderedList')} icon={<ListOrdered/>} active={sel.ol} title="Нумерований"/>
            <Btn onClick={insertChecklist} icon={<ListChecks/>} title="Чекліст"/>
            <Divider/>

            <Btn onClick={toggleBlockquote} icon={<Quote/>} active={sel.blockquote} title="Цитата"/>
            <Btn onClick={()=>insertHTML('<hr/><p><br/></p>', editorRef)} icon={<Minus/>} title="Лінія"/>
            <Divider/>

            <Btn onClick={insertImage} icon={<ImageIcon/>} title="Зображення"/>
            <Btn onClick={insertYouTube} icon={<Youtube/>} title="YouTube"/>
            <Btn onClick={insertTable} icon={<TableIcon/>} title="Таблиця"/>
            <Btn onClick={insertCols2} icon={<Columns2/>} title="2 колонки"/>
            <Divider/>

            <Btn onClick={()=>insertCallout('info')} icon={<Info/>} title="Info box"/>
            <Btn onClick={()=>insertCallout('warn')} icon={<AlertTriangle/>} title="Warning box"/>
            <Btn onClick={()=>insertCallout('ok')} icon={<CheckCircle2/>} title="Success box"/>
            <Divider/>

            <Btn onClick={addLink} icon={<Link2/>} title="Посилання"/>
            <Btn onClick={removeLink} icon={<Unlink/>} title="Зняти посилання"/>
            <Divider/>

            <Btn onClick={toggleSource} icon={<Type/>} title={sourceMode ? 'Повернутись' : 'HTML'}/>
            <Btn onClick={()=>applyTemplate(editorRef, 'theory')} icon={<Wand2/>} title="Шаблон: Теорія"/>
            <Btn onClick={()=>applyTemplate(editorRef, 'lab')} icon={<Sparkles/>} title="Шаблон: Практика"/>
            <Btn onClick={()=>downloadText('lesson.html', sourceMode ? html : (editorRef.current?.innerHTML || ''))} icon={<Download/>} title="Експорт HTML"/>
            <Btn onClick={clearFormatting} icon={<Eraser/>} title="Очистити формат"/>
          </div>
        </div>

        {/* Editor + sidebar */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4">
            {sourceMode ? (
              <textarea
                value={html}
                onChange={(e)=>setHtml(e.target.value)}
                rows={24}
                className="w-full rounded-xl ring-1 ring-[#E5ECFF] px-3 py-2 font-mono text-[13px] minх-[520px]"
              />
            ) : (
              <div className="min-h-[520px]">
                <div
                  ref={editorRef}
                  className="cxe max-w-none focus:outline-none w-full min-h-[520px] leading-relaxed text-[16px]"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Почніть писати урок…"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Panel title="Швидка вставка">
              <div className="grid grid-cols-2 gap-2">
                <BtnFull onClick={()=>insertHTML(`<figure><img src=\"https://picsum.photos/1200/700\" alt=\"demo\"/><figcaption>Демо</figcaption></figure><p><br/></p>`, editorRef)}><ImageIcon className="w-4 h-4"/> Демо-зображення</BtnFull>
                <BtnFull onClick={insertYouTube}><Youtube className="w-4 h-4"/> YouTube</BtnFull>
                <BtnFull onClick={()=>insertHTML(`<blockquote>Цитата…</blockquote>`, editorRef)}><Quote className="w-4 h-4"/> Цитата</BtnFull>
                <BtnFull onClick={()=>insertHTML(`<pre><code>console.log('Hello');</code></pre><p><br/></p>`, editorRef)}><Code2 className="w-4 h-4"/> Код-блок</BtnFull>
                <BtnFull onClick={()=>insertHTML(tableHTML(), editorRef)}><TableIcon className="w-4 h-4"/> Таблиця</BtnFull>
                <BtnFull onClick={()=>insertHTML(`<hr/>`, editorRef)}><Minus className="w-4 h-4"/> Роздільник</BtnFull>
                <BtnFull onClick={insertCols2}><Columns2 className="w-4 h-4"/> 2 колонки</BtnFull>
                <BtnFull onClick={()=>insertCallout('info')}><Info className="w-4 h-4"/> Info box</BtnFull>
                <BtnFull onClick={()=>insertCallout('warn')}><AlertTriangle className="w-4 h-4"/> Warning box</BtnFull>
                <BtnFull onClick={()=>insertCallout('ok')}><CheckCircle2 className="w-4 h-4"/> Success box</BtnFull>
                <BtnFull onClick={insertChecklist}><ListChecks className="w-4 h-4"/> Чекліст</BtnFull>
              </div>
            </Panel>

            <Panel title="Огляд сторінки">
              <div className="text-sm text-slate-600">Слів: <b>{stats.words}</b> • Символів: <b>{stats.chars}</b> • Час читання: <b>{stats.read}</b></div>
              {outline.length ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {outline.map(h => (
                    <li key={h.id} className="truncate">
                      <a href={`#${h.id}`} className={`${h.level===1?'font-semibold':'pl-3'} hover:underline`}>• {h.text || '(без назви)'}</a>
                    </li>
                  ))}
                </ul>
              ) : <div className="mt-2 text-sm text-slate-500">Додай заголовки H1–H3 — зʼявиться зміст.</div>}
            </Panel>

            <Panel title="Навігація">
              <div className="grid gap-2">
                <Link className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] text-center" href={`/teacher/courses/${courseId}/builder/overview`}>← До Hub</Link>
                <Link className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] text-center" href={`/teacher/courses/${courseId}/builder/lessons`}>До розділів/уроків →</Link>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ===================== малий UI ===================== */
function Btn({ onClick, icon, title, active }: { onClick?: ()=>void; icon?: React.ReactNode; title?: string; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] active:translate-y-[1px] transition ${active ? 'active' : ''}`}
    >
      {icon}
    </button>
  );
}
function Divider(){ return <span className="w-px h-6 bg-[#E5ECFF] mx-1" />; }
function Panel({ title, children }:{title:string; children:React.ReactNode}) {
  return (
    <div className="rounded-2xl bg-white/95 ring-1 ring-[#E5ECFF] p-4">
      <div className="text-sm font-semibold text-[#0F2E64]">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
function BtnFull({children, onClick}:{children:React.ReactNode; onClick?:()=>void}) {
  return (
    <button onClick={onClick} type="button"
      className="px-3 py-2 rounded-xl ring-1 ring-[#E5ECFF] bg-white hover:ring-[#1345DE] transition inline-flex items-center gap-2 w-full text-left">
      {children}
    </button>
  );
}

/* ===================== утиліти DOM ===================== */
function closest(root: HTMLElement | null, selector: string): HTMLElement | null {
  const sel = window.getSelection(); if (!sel || sel.rangeCount === 0) return null;
  const node = sel.anchorNode as Node | null; if (!node) return null;
  const el = (node.nodeType === 1 ? node as HTMLElement : node.parentElement) as HTMLElement | null; if (!el) return null;
  return el.closest(selector);
}
function unwrap(el: HTMLElement) {
  const parent = el.parentNode; if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

/* ===================== простенький sanitizer ===================== */
function sanitizeHTML(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const allowed = new Set(['P','BR','STRONG','B','EM','I','U','S','SUB','SUP','A','UL','OL','LI','H1','H2','H3','BLOCKQUOTE','PRE','CODE','FIGURE','IMG','FIGCAPTION','HR','TABLE','THEAD','TBODY','TR','TH','TD','DIV','SPAN']);
  const walk = (node: Element) => {
    [...node.children].forEach((child) => {
      if (!allowed.has(child.tagName)) {
        const parent = child.parentElement!;
        while (child.firstChild) parent.insertBefore(child.firstChild, child);
        parent.removeChild(child);
      } else {
        [...child.attributes].forEach(attr => {
          const name = attr.name.toLowerCase();
          const ok = ['href','src','alt','rowspan','colspan','style'].includes(name);
          if (!ok) child.removeAttribute(name);
          if (name === 'href' && child.getAttribute('href')?.startsWith('javascript:')) child.removeAttribute('href');
        });
        walk(child);
      }
    });
  };
  if (doc.body) walk(doc.body);
  return doc.body.innerHTML || '';
}

/* ===================== шаблони ===================== */
function applyTemplate(editorRef: React.RefObject<HTMLDivElement | null>, key:'theory'|'lab') {
  const commonHeader =
`<h1>Назва уроку</h1>
<p><strong>Мета:</strong> коротко опишіть, що студент засвоїть.</p>
${CALL.info('Очікувані результати у двох реченнях.')}`;
  const html = key === 'theory'
    ? `${commonHeader}
<h2>Вступ</h2>
<p>…текст вступу…</p>
<h2>Основні поняття</h2>
<ul>
  <li><strong>Термін 1</strong> — визначення…</li>
  <li><strong>Термін 2</strong> — визначення…</li>
</ul>
${CALL.ok('Невелика порада чи best practice.')}
<h2>Приклад коду</h2>
<pre><code>console.log('Hello');</code></pre>
<h2>Підсумок</h2>
<p>Ключові висновки…</p>`
    : `${commonHeader}
<h2>Завдання</h2>
<ol>
  <li>Крок 1…</li>
  <li>Крок 2…</li>
  <li>Крок 3…</li>
</ol>
<h2>Чек-ліст виконання</h2>
<ul class="cxe-checklist">
  <li data-checked="false">Запустіть середовище</li>
  <li data-checked="false">Напишіть функцію</li>
  <li data-checked="false">Пройдіть тести</li>
</ul>
${CALL.warn('На що звернути увагу під час виконання')}
<h2>Звіт</h2>
<p>Додайте скріншоти/опис виконання.</p>`;
  const el = editorRef.current;
  if (!el) return;
  el.innerHTML = html;
}
