'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Extension } from '@tiptap/core';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useRouter } from 'next/navigation';
import BubbleMenu from './BubbleMenu';

// FontSize Extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {}),
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

// FontFamily Extension
const FontFamily = Extension.create({
  name: 'fontFamily',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontFamily: {
          default: null,
          parseHTML: el => el.style.fontFamily || null,
          renderHTML: attrs => (attrs.fontFamily ? { style: `font-family: ${attrs.fontFamily}` } : {}),
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontFamily: (fontFamily: string) => ({ chain }) => chain().setMark('textStyle', { fontFamily }).run(),
      unsetFontFamily: () => ({ chain }) => chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run(),
    };
  },
});

const FONT_SIZES = [
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '24px', value: '24px' },
  { label: '32px', value: '32px' },
  { label: '40px', value: '40px' },
  { label: '48px', value: '48px' },
  { label: '56px', value: '56px' },
  { label: '64px', value: '64px' },
  { label: '72px', value: '72px' },
];

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive, sans-serif' },
  { label: 'Lucida Console', value: '"Lucida Console", Monaco, monospace' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Palatino Linotype', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { label: 'Candara', value: 'Candara, sans-serif' },
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
];

interface TheoryEditorProps {
  initialContent: string;
  onSave: (html: string) => void;
}

const TheoryEditor: React.FC<TheoryEditorProps> = ({ initialContent, onSave }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FontSize,
      FontFamily,
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Image,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => onSave(editor.getHTML()),
    editorProps: {
      attributes: { class: 'prose m-5 focus:outline-none', spellCheck: 'false' },
    },
    immediatelyRender: false,
  });

  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const [color, setColor] = useState('#000000');

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const size = editor.getAttributes('textStyle').fontSize || '16px';
      const family = editor.getAttributes('textStyle').fontFamily || 'Arial, sans-serif';
      const c = editor.getAttributes('textStyle').color || '#000000';
      setFontSize(size);
      setFontFamily(family);
      setColor(c);
    };

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  const applyFontSize = (size: string) => {
    setFontSize(size);
    editor?.chain().focus().setFontSize(size).run();
  };

  const applyFontFamily = (family: string) => {
    setFontFamily(family);
    editor?.chain().focus().setFontFamily(family).run();
  };

  const applyColor = (c: string) => {
    setColor(c);
    editor?.chain().focus().setColor(c).run();
  };

  const onImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          editor?.chain().focus().setImage({ src: reader.result }).run();
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const setLink = () => {
    const url = prompt('Введіть URL для посилання:');
    if (url) editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return <p>Ініціалізація редактора...</p>;

  return (
    <div className="relative border rounded-md p-4">
      {/* Панель інструментів */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Форматування */}
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'font-bold bg-gray-300 px-2 rounded' : 'px-2 rounded'} title="Жирний" type="button">B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'italic bg-gray-300 px-2 rounded' : 'px-2 rounded'} title="Курсив" type="button">I</button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'underline bg-gray-300 px-2 rounded' : 'px-2 rounded'} title="Підкреслення" type="button">U</button>

        {/* Заголовки */}
        {[1, 2, 3].map(level => (
          <button key={level} onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()} className={editor.isActive('heading', { level }) ? 'bg-gray-300 px-2 rounded' : 'px-2 rounded'} type="button" title={`Заголовок ${level}`}>H{level}</button>
        ))}

        {/* Шрифт і розмір */}
        <select value={fontFamily} onChange={e => applyFontFamily(e.target.value)} title="Вибір шрифту" className="border rounded px-2">
          {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select value={fontSize} onChange={e => applyFontSize(e.target.value)} title="Вибір розміру" className="border rounded px-2">
          {FONT_SIZES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        {/* Колір */}
        <input type="color" value={color} onChange={e => applyColor(e.target.value)} title="Колір тексту" className="w-10 h-10 p-0 border rounded" />

        {/* Посилання */}
        <button onClick={setLink} className="px-2 rounded bg-blue-500 text-white" type="button" title="Додати/редагувати посилання">🔗 Link</button>

        {/* Списки */}
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-gray-300 px-2 rounded' : 'px-2 rounded'} type="button">• List</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-gray-300 px-2 rounded' : 'px-2 rounded'} type="button">1. List</button>

        {/* Вирівнювання */}
        {[
          { label: 'Ліворуч', value: 'left' },
          { label: 'По центру', value: 'center' },
          { label: 'Праворуч', value: 'right' },
          { label: 'По ширині', value: 'justify' },
        ].map(align => (
          <button
            key={align.value}
            onClick={() => editor.chain().focus().setTextAlign(align.value as any).run()}
            className={editor.isActive({ textAlign: align.value as any }) ? 'bg-gray-300 px-2 rounded' : 'px-2 rounded'}
            type="button"
          >
            {align.label}
          </button>
        ))}

        {/* Зображення */}
        <button onClick={() => fileInputRef.current?.click()} className="px-2 rounded bg-green-500 text-white" type="button">🖼️ Image</button>
        <input type="file" ref={fileInputRef} onChange={onImageUpload} accept="image/*" className="hidden" />
      </div>

      <EditorContent editor={editor} />

      {/* BubbleMenu з children */}
      <BubbleMenu editor={editor}>
        <div className="flex space-x-2 bg-white border rounded p-1 shadow">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'font-bold bg-gray-300 px-2 rounded' : 'px-2 rounded'}
            title="Жирний"
            type="button"
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'italic bg-gray-300 px-2 rounded' : 'px-2 rounded'}
            title="Курсив"
            type="button"
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'underline bg-gray-300 px-2 rounded' : 'px-2 rounded'}
            title="Підкреслення"
            type="button"
          >
            U
          </button>
        </div>
        {/* Підсвічування */}
        <input
          type="color"
          title="Підсвічування тексту"
          className="w-10 h-10 p-0 border rounded"
          onChange={e => editor?.chain().focus().toggleHighlight({ color: e.target.value }).run()}
        />

        {/* Таблиця */}
        <button
          onClick={() => editor?.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}
          className="px-2 rounded bg-purple-500 text-white"
          type="button"
        >
          Таблиця
        </button>
      </BubbleMenu>

      {/* Кнопки внизу */}
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => {
            if (editor) {
              const html = editor.getHTML();
              onSave(html);
              alert('Зміни збережено!');
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          type="button"
        >
          Зберегти
        </button>

        <button
          onClick={() => router.push('/lessons')}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          type="button"
        >
          Повернутися до уроків
        </button>
      </div>
    </div>
  );
};

export default TheoryEditor;
