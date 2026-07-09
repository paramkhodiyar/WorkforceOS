'use client';

import React, { useState, useRef, useEffect } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

interface CustomDatePickerProps {
  label: string;
  value: string;        // 'YYYY-MM-DD'
  onChange: (value: string) => void;
  min?: string;         // 'YYYY-MM-DD'
  placeholder?: string;
  required?: boolean;
}

export function CustomDatePicker({ label, value, onChange, min, placeholder, required }: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => value ? new Date(value) : new Date());
  const [selDate, setSelDate] = useState<Date | null>(() => value ? new Date(value) : null);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelDate(d);
        setViewDate(d);
      }
    } else {
      setSelDate(null);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Parse min date string 'YYYY-MM-DD' to Date object at start of day
  const minDate = min ? new Date(min + 'T00:00:00') : null;

  function isDisabledDay(day: number): boolean {
    if (!minDate) return false;
    const dateToCheck = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Reset hours to start of day for accurate day-only comparison
    dateToCheck.setHours(0,0,0,0);
    const normalizedMinDate = new Date(minDate);
    normalizedMinDate.setHours(0,0,0,0);
    return dateToCheck < normalizedMinDate;
  }

  function pickDay(day: number) {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelDate(d);
    setOpen(false);

    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dateStr = String(d.getDate()).padStart(2, '0');
    onChange(`${y}-${mo}-${dateStr}`);
  }

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const today = new Date();

  const display = selDate
    ? selDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="relative w-full" ref={ref}>
      <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all border cursor-pointer ${
          open
            ? 'border-primary ring-1 ring-primary bg-white text-slate-800 shadow-sm'
            : display
            ? 'border-slate-200 bg-white text-slate-800 hover:border-slate-350 shadow-sm'
            : 'border-slate-200 bg-white text-slate-400 hover:border-slate-350 shadow-sm'
        }`}
      >
        <span className="material-symbols-outlined text-[18px] text-primary shrink-0">event</span>
        <span className="flex-1 text-left truncate">{display || placeholder || 'Select date'}</span>
        <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* ── Calendar drop ── */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up w-72 left-0"
        >
          {/* ── Month nav ── */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-600">chevron_left</span>
            </button>
            <div className="flex items-center gap-1 font-sans">
              <select
                value={viewDate.getMonth()}
                onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1))}
                className="bg-transparent text-[11px] font-extrabold text-slate-800 outline-none cursor-pointer hover:text-primary transition-colors py-0.5 border-none focus:ring-0 p-0"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
              <select
                value={viewDate.getFullYear()}
                onChange={(e) => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1))}
                className="bg-transparent text-[11px] font-extrabold text-slate-800 outline-none cursor-pointer hover:text-primary transition-colors py-0.5 border-none focus:ring-0 p-0"
              >
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() + 10 - i).map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-600">chevron_right</span>
            </button>
          </div>

          {/* ── Days Grid ── */}
          <div className="p-3">
            <div className="grid grid-cols-7 text-center mb-1">
              {DAYS.map(day => (
                <span key={day} className="text-[10px] font-extrabold text-slate-400 uppercase py-0.5">
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 text-center gap-y-1">
              {/* Empty offset cells */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <span key={`empty-${i}`} />
              ))}

              {/* Month Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isDisabled = isDisabledDay(dayNum);

                const isSelected = selDate
                  && selDate.getDate() === dayNum
                  && selDate.getMonth() === viewDate.getMonth()
                  && selDate.getFullYear() === viewDate.getFullYear();

                const isToday = today.getDate() === dayNum
                  && today.getMonth() === viewDate.getMonth()
                  && today.getFullYear() === viewDate.getFullYear();

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => pickDay(dayNum)}
                    className={`h-7 w-7 mx-auto flex items-center justify-center rounded-full text-[11px] font-bold transition-all relative ${
                      isDisabled
                        ? 'text-slate-200 cursor-not-allowed'
                        : isSelected
                        ? 'bg-primary text-white shadow-sm'
                        : isToday
                        ? 'border border-primary text-primary hover:bg-slate-100'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
