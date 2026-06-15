import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  icon?: string;
  className?: string;
}

interface ThreeDotMenuProps {
  actions: ActionMenuItem[];
  align?: 'left' | 'right';
}

export function ThreeDotMenu({ actions, align = 'right' }: ThreeDotMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        // Calculate coords relative to document
        const top = rect.bottom + window.scrollY;
        const left = align === 'right' ? rect.right + window.scrollX - 144 : rect.left + window.scrollX;
        setCoords({ top, left });
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, align]);

  useEffect(() => {
    function handleScrollOrResize() {
      if (isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div className="inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 hover:bg-surface-container rounded-full transition-colors cursor-pointer text-outline hover:text-on-surface flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={menuRef}
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
          className="z-50 w-36 rounded-lg bg-surface-container-lowest border border-outline-variant shadow-lg py-1 focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setIsOpen(false);
                action.onClick();
              }}
              className={`w-full text-left px-4 py-2 text-body-sm font-semibold flex items-center gap-2 hover:bg-surface-container transition-colors cursor-pointer ${
                action.className || 'text-on-surface'
              }`}
            >
              {action.icon && (
                <span className="material-symbols-outlined text-[16px] text-outline shrink-0">{action.icon}</span>
              )}
              <span>{action.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export default ThreeDotMenu;
