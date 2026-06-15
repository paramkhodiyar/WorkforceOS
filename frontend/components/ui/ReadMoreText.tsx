'use client';

import React, { useState } from 'react';
import { Button } from './Button';

interface ReadMoreDialogProps {
  isOpen: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

export function ReadMoreDialog({
  isOpen,
  title,
  content,
  onClose,
}: ReadMoreDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex justify-between items-start pb-2 border-b border-slate-100">
          <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider">{title}</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 hover:bg-slate-100 rounded-full cursor-pointer text-outline hover:text-on-surface flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto pr-1">
          <p className="text-body-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed font-medium">
            {content}
          </p>
        </div>
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ReadMoreTextProps {
  text: string;
  maxLength?: number;
  title?: string;
}

export function ReadMoreText({ text, maxLength = 40, title = 'Details' }: ReadMoreTextProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!text) return <span className="text-slate-400 italic">No details provided</span>;
  if (text.length <= maxLength) return <span>{text}</span>;

  const truncated = text.slice(0, maxLength) + '...';

  return (
    <>
      <span className="inline-flex items-center">
        <span>{truncated}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="text-primary hover:text-blue-700 text-body-xs font-bold underline cursor-pointer ml-1 whitespace-nowrap"
        >
          Read more
        </button>
      </span>
      <ReadMoreDialog
        isOpen={isOpen}
        title={title}
        content={text}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

export default ReadMoreText;
