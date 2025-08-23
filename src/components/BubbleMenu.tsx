// BubbleMenu.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';

interface BubbleMenuProps {
  editor: Editor | null;
  children: React.ReactNode;
}

const BubbleMenu: React.FC<BubbleMenuProps> = ({ editor, children }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { state } = editor;
      const { from, to } = state.selection;
      if (from === to) {
        setIsActive(false);
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setIsActive(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setCoords({
        left: rect.left + window.pageXOffset,
        top: rect.top + window.pageYOffset - 40,
      });

      setIsActive(true);
    };

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  if (!isActive) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        left: coords.left,
        top: coords.top,
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: 4,
        padding: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
      }}
    >
      {children}
    </div>
  );
};

export default BubbleMenu;
