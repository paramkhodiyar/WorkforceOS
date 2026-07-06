'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

interface Props {
  label: string;
  value: string;        // 'YYYY-MM-DDTHH:MM'
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  required?: boolean;
}

export default function DateTimePicker({ label, value, onChange, min, placeholder, required }: Props) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => value ? new Date(value) : new Date());
  const [selDate, setSelDate] = useState<Date | null>(() => value ? new Date(value) : null);
  const [hour, setHour] = useState(() => value ? new Date(value).getHours() : 9);
  const [minute, setMinute] = useState(() => value ? new Date(value).getMinutes() : 0);

  const ref = useRef<HTMLDivElement>(null);
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minInputRef = useRef<HTMLInputElement>(null);
  // Raw text while user is typing — null means display real value
  const [hourDraft, setHourDraft] = useState<string | null>(null);
  const [minDraft, setMinDraft] = useState<string | null>(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelDate(d); setViewDate(d);
        setHour(d.getHours());
        const m = d.getMinutes();
        setMinute(d.getMinutes());
      }
    } else {
      setSelDate(null);
    }
  }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  function emit(date: Date | null, h: number, m: number) {
    if (!date) return;
    const y = date.getFullYear(), mo = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
    onChange(`${y}-${mo}-${d}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  }

  // Parse the min prop into a Date (or null) — must be before functions that use it
  const minDate = min ? new Date(min) : null;

  function isDisabledDay(day: number): boolean {
    if (!minDate) return false;
    const dayEnd = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 23, 59);
    return dayEnd < minDate;
  }

  function getMinHourForSelDate(): number {
    if (!minDate || !selDate) return 0;
    const sameDay = selDate.getFullYear() === minDate.getFullYear()
      && selDate.getMonth() === minDate.getMonth()
      && selDate.getDate() === minDate.getDate();
    return sameDay ? minDate.getHours() : 0;
  }

  function getMinMinuteForSelDate(h: number): number {
    if (!minDate || !selDate) return 0;
    const sameDay = selDate.getFullYear() === minDate.getFullYear()
      && selDate.getMonth() === minDate.getMonth()
      && selDate.getDate() === minDate.getDate();
    if (sameDay && h === minDate.getHours()) return minDate.getMinutes();
    return 0;
  }

  function pickDay(day: number) {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelDate(d);
    if (minDate) {
      const isMinDay = d.getFullYear() === minDate.getFullYear()
        && d.getMonth() === minDate.getMonth()
        && d.getDate() === minDate.getDate();
      if (isMinDay) {
        const clampedHour = Math.max(hour, minDate.getHours());
        const minMin = minDate.getMinutes();
        const clampedMin = clampedHour === minDate.getHours() ? Math.max(minute, minMin) : minute;
        setHour(clampedHour); setMinute(clampedMin);
        emit(d, clampedHour, clampedMin); return;
      }
    }
    emit(d, hour, minute);
  }

  // Compute next value outside setState updater — never call onChange inside setState
  const changeHour = useCallback((delta: number) => {
    const minH = getMinHourForSelDate();
    const raw = (hour + delta + 24) % 24;
    const n = Math.max(raw, minH);
    setHour(n);
    emit(selDate, n, minute);
  }, [selDate, hour, minute, minDate]);

  const changeMinute = useCallback((delta: number) => {
    const n = (minute + delta + 60) % 60;
    const minM = getMinMinuteForSelDate(hour);
    const clamped = Math.max(n, minM);
    setMinute(clamped);
    emit(selDate, hour, clamped);
  }, [selDate, hour, minute, minDate]);

  // Is the currently selected datetime before the min?
  const selectedISO = selDate ? new Date(selDate.getFullYear(), selDate.getMonth(), selDate.getDate(), hour, minute) : null;
  const isPast = !!(minDate && selectedISO && selectedISO < minDate);

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0).getDate();
  const today = new Date();

  const display = selDate
    ? `${selDate.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}  ·  ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`
    : '';

  const SpinBtn = ({ onClick, icon }: { onClick: () => void; icon: string }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-all cursor-pointer active:scale-90"
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all border cursor-pointer ${
          open
            ? 'border-primary ring-1 ring-primary bg-white text-slate-800'
            : display
            ? 'border-slate-200 bg-slate-50 text-slate-800 hover:border-primary/50'
            : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-primary/50'
        }`}
      >
        <span className="material-symbols-outlined text-[17px] text-primary shrink-0">event</span>
        <span className="flex-1 text-left truncate">{display || placeholder || 'Select date & time'}</span>
        <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          ref={undefined}
          className="absolute z-50 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up"
          style={{ width: 288, left: 0 }}
        >

          {/* ── Month nav ── */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
            <button type="button" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}
              className="p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px] text-slate-600">chevron_left</span>
            </button>
            <span className="text-[12px] font-extrabold text-slate-800">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button type="button" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}
              className="p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px] text-slate-600">chevron_right</span>
            </button>
          </div>

          {/* ── Day-of-week header ── */}
          <div className="grid grid-cols-7 px-2 pt-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[9px] font-extrabold text-slate-400 uppercase pb-1">{d}</div>
            ))}
          </div>

          {/* ── Calendar days ── */}
          <div className="grid grid-cols-7 px-2 pb-2">
            {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i+1).map(day => {
              const isSel = selDate && selDate.getDate()===day && selDate.getMonth()===viewDate.getMonth() && selDate.getFullYear()===viewDate.getFullYear();
              const isT = today.getDate()===day && today.getMonth()===viewDate.getMonth() && today.getFullYear()===viewDate.getFullYear();
              const dis = isDisabledDay(day);
              return (
                <button key={day} type="button" disabled={dis} onClick={() => pickDay(day)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                    isSel ? 'bg-primary text-white font-extrabold shadow-sm'
                    : isT ? 'bg-primary/10 text-primary font-bold'
                    : dis ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-100'
                  }`}>
                  {day}
                </button>
              );
            })}
          </div>

          {/* ── Time drum wheel ── */}
          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
            <div className="flex items-center justify-center gap-4">

              {/* Hour drum */}
              <div className="flex flex-col items-center gap-1">
                <SpinBtn onClick={() => changeHour(1)} icon="keyboard_arrow_up" />
                <div className="w-14 h-10 bg-white border-2 border-primary rounded-xl flex items-center justify-center shadow-sm">
                  <input
                    ref={hourInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={hourDraft !== null ? hourDraft : String(hour).padStart(2,'0')}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g,'').slice(0,2);
                      setHourDraft(raw);
                      if (raw.length === 2) {
                        const n = Math.min(23, parseInt(raw, 10) || 0);
                        setHour(n); setHourDraft(null); emit(selDate, n, minute);
                        setTimeout(() => minInputRef.current?.select(), 0);
                      }
                    }}
                    onBlur={() => {
                      if (hourDraft !== null) {
                        const n = Math.min(23, parseInt(hourDraft, 10) || 0);
                        setHour(n); setHourDraft(null); emit(selDate, n, minute);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp')   { e.preventDefault(); changeHour(1); }
                      if (e.key === 'ArrowDown') { e.preventDefault(); changeHour(-1); }
                      if (e.key === 'Tab' || e.key === ':') { e.preventDefault(); minInputRef.current?.select(); }
                    }}
                    className="w-full text-center text-[22px] font-extrabold text-primary tabular-nums leading-none bg-transparent outline-none caret-primary cursor-text"
                  />
                </div>
                <SpinBtn onClick={() => changeHour(-1)} icon="keyboard_arrow_down" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Hour</span>
              </div>

              {/* Separator */}
              <span className="text-[28px] font-black text-slate-300 pb-5">:</span>

              {/* Minute drum */}
              <div className="flex flex-col items-center gap-1">
                <SpinBtn onClick={() => changeMinute(1)} icon="keyboard_arrow_up" />
                <div className="w-14 h-10 bg-white border-2 border-primary rounded-xl flex items-center justify-center shadow-sm">
                  <input
                    ref={minInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={minDraft !== null ? minDraft : String(minute).padStart(2,'0')}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g,'').slice(0,2);
                      setMinDraft(raw);
                      if (raw.length === 2) {
                        const parsed = Math.min(59, parseInt(raw, 10) || 0);
                        setMinute(parsed); setMinDraft(null); emit(selDate, hour, parsed);
                      }
                    }}
                    onBlur={() => {
                      if (minDraft !== null) {
                        const parsed = Math.min(59, parseInt(minDraft, 10) || 0);
                        setMinute(parsed); setMinDraft(null); emit(selDate, hour, parsed);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp')   { e.preventDefault(); changeMinute(1); }
                      if (e.key === 'ArrowDown') { e.preventDefault(); changeMinute(-1); }
                    }}
                    className="w-full text-center text-[22px] font-extrabold text-primary tabular-nums leading-none bg-transparent outline-none caret-primary cursor-text"
                  />
                </div>
                <SpinBtn onClick={() => changeMinute(-1)} icon="keyboard_arrow_down" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Min</span>
              </div>

            </div>
          </div>

          {/* ── Past-time warning ── */}
          {isPast && (
            <div className="mx-3 mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[16px] shrink-0">warning</span>
              <p className="text-[10px] font-bold text-amber-700 leading-tight">
                This time has already passed. Please pick{' '}
                <strong>{minDate!.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</strong> or later.
              </p>
            </div>
          )}

          {/* ── Confirm button ── */}
          <div className="px-3 pb-3 bg-slate-50">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={!selDate || isPast}
              className="w-full py-2.5 rounded-xl text-[12px] font-extrabold transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-white hover:bg-blue-700"
            >
              {selDate && !isPast
                ? `Confirm  ·  ${selDate.toLocaleDateString('en-GB',{day:'numeric',month:'short'})} at ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`
                : isPast ? 'Select a valid time above'
                : 'Pick a date first'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
