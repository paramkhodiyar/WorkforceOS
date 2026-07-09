'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;      // Optional: if provided, renders label above select
  required?: boolean;  // Optional: if label is provided, shows required asterisk
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
  label,
  required,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(val: string) {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">
          {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {/* ── Trigger ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-all border outline-none ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
            : isOpen
            ? 'border-primary ring-1 ring-primary bg-white text-slate-800 shadow-sm cursor-pointer'
            : selectedOption && selectedOption.value !== ''
            ? 'border-slate-200 bg-white text-slate-800 hover:border-slate-350 shadow-sm cursor-pointer'
            : 'border-slate-200 bg-white text-slate-400 hover:border-slate-350 shadow-sm cursor-pointer'
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0 ml-2">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-hidden flex flex-col animate-slide-in-up left-0">
          {/* Search bar inside dropdown (optional, shown if list is long) */}
          {options.length > 5 && (
            <div className="p-2 border-b border-slate-100 flex items-center">
              <span className="material-symbols-outlined text-[18px] text-slate-400 ml-2 mr-1">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-2 py-1.5 text-xs text-slate-900 placeholder-slate-400 bg-transparent outline-none font-semibold"
                autoFocus
              />
            </div>
          )}
          <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white font-extrabold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-xs text-slate-400 font-semibold text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
