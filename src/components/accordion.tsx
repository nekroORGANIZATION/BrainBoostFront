import React, { useState } from "react";

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-2 px-4 font-semibold"
      >
        {title}
      </button>
      {open && <div className="px-4 py-2">{children}</div>}
    </div>
  );
};

export const Accordion: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="border rounded">{children}</div>
);

// Додаткові експортовані компоненти, щоб відповідати імпорту
export const AccordionTrigger = AccordionItem;
export const AccordionContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);
