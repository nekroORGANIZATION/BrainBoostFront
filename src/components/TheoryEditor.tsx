'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import StarterKit from '@tiptap/starter-kit';
import { Extension } from '@tiptap/core';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';

// Імпорт твого кастомного BubbleMenu React компонента
import BubbleMenu from './BubbleMenu';  // поправ шлях, якщо потрібно

// Кастомне розширення для розміру шрифту (залишаємо без змін)
const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, '') || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        },
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
];

interface TheoryEditorProps {
  initialContent: string;
  onSave: (html: string) => void;
}

const TheoryEditor: React.FC<TheoryEditorProps> = ({ initialContent, onSave }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      BubbleMenuExtension, // обов’язково додай це розширення сюди!
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FontSize,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onSave(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
        spellCheck: 'false',
      },
    },
    immediatelyRender: false,
  });

  const [fontSize, setFontSize] = useState('16px');
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateFontSize = () => {
      const size = editor.getAttributes('textStyle').fontSize || '16px';
      setFontSize(size);
    };

    editor.on('selectionUpdate', updateFontSize);
    editor.on('transaction', updateFontSize);

    return () => {
      editor.off('selectionUpdate', updateFontSize);
      editor.off('transaction', updateFontSize);
    };
  }, [editor]);

  const applyFontSize = (size: string) => {
    setFontSize(size);
    editor?.chain().focus().setFontSize(size).run();
  };

  if (!editor) {
    return <p>Ініціалізація редактора...</p>;
  }

  return (
    <div className="relative border rounded-md p-4">
      {/* Панель інструментів зверху */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Кнопки форматування зверху */}
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

        {['1', '2', '3'].map(level => (
          <button
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level: Number(level) as 1 | 2 | 3 }).run()}
            className={editor.isActive('heading', { level: Number(level) }) ? 'bg-gray-300 px-2 rounded' : 'px-2 rounded'}
            title={`Заголовок ${level}`}
            type="button"
          >
            H{level}
          </button>
        ))}

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-gray-300 px-2 rounded' : 'px-2 rounded'}
          title="Маркерований список"
          type="button"
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-gray-300 px-2 rounded' : 'px-2 rounded'}
          title="Нумерований список"
          type="button"
        >
          1. List
        </button>

        {['left', 'center', 'right', 'justify'].map((align) => (
          <button
            key={align}
            onClick={() => editor.chain().focus().setTextAlign(align).run()}
            className={editor.isActive({ textAlign: align }) ? 'bg-gray-300 px-2 rounded' : 'px-2 rounded'}
            title={`Вирівняти по ${align}`}
            type="button"
          >
            {align[0].toUpperCase()}
          </button>
        ))}

        <input
          type="color"
          value={editor.getAttributes('textStyle').color || '#000000'}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          title="Колір тексту"
          className="w-8 h-8 p-0 border-0 rounded"
        />

        <select
          value={fontSize}
          onChange={(e) => applyFontSize(e.target.value)}
          title="Розмір шрифту"
          className="border rounded px-2 py-1"
        >
          {FONT_SIZES.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Кнопки Зберегти та Повернутися */}
      <div className="flex justify-between mb-4">
        <button
          onClick={() => { onSave(editor.getHTML()); setShowMessage(true); setTimeout(() => setShowMessage(false), 3000); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          type="button"
        >
          Зберегти
        </button>

        <button
          onClick={() => {
            window.history.back();
          }}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          type="button"
        >
          Повернутися до уроків
        </button>
      </div>

      {/* Повідомлення про збереження */}
      {showMessage && (
        <div className="mb-4 px-4 py-2 rounded bg-green-100 text-green-800 border border-green-400 shadow-sm">
          ✅ Збережено успішно!
        </div>
      )}

      {/* Плаваюче меню */}
      <BubbleMenu editor={editor}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'font-bold text-blue-600' : ''}
          aria-label="Bold"
          type="button"
        >
          <b>B</b>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'italic text-blue-600' : ''}
          aria-label="Italic"
          type="button"
        >
          <i>I</i>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'underline text-blue-600' : ''}
          aria-label="Underline"
          type="button"
        >
          U
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'text-blue-600' : ''}
          aria-label="Align Left"
          type="button"
        >
          ⬅️
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'text-blue-600' : ''}
          aria-label="Align Center"
          type="button"
        >
          ↔️
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'text-blue-600' : ''}
          aria-label="Align Right"
          type="button"
        >
          ➡️
        </button>
        <input
          type="color"
          onInput={(e) => editor.chain().focus().setColor(e.currentTarget.value).run()}
          value={editor.getAttributes('textStyle').color || '#000000'}
          title="Text color"
          className="w-6 h-6 p-0 border-none"
        />
      </BubbleMenu>

      {/* Основний редактор */}
      <EditorContent editor={editor} className="min-h-[300px] border rounded p-3" />
    </div>
  );
};

export default TheoryEditor;
