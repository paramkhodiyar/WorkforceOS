'use client';

import React, { useState, useEffect } from 'react';

interface LiveClockProps {
  className?: string;
  size?: 'sm' | 'lg';
}

export default function LiveClock({ className = '', size = 'sm' }: LiveClockProps) {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      
      // Format time: HH:MM:SS AM/PM
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      // Format date: Wednesday, July 15, 2026
      setDate(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null; // Prevent SSR mismatch

  if (size === 'lg') {
    return (
      <div className={`bg-white border border-slate-200 p-6 rounded-3xl text-slate-800 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden ${className}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live System Time
          </p>
          <h3 className="text-headline-lg font-black tracking-tight mt-2 font-mono text-slate-900 tabular-nums">
            {time}
          </h3>
        </div>
        <p className="text-body-xs font-semibold text-slate-500 mt-4 border-t border-slate-100 pt-2">
          {date}
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-800 relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
      <div className="font-mono text-headline-sm font-extrabold tracking-tight tabular-nums flex justify-center items-center gap-1 text-slate-900">
        <span className="material-symbols-outlined text-[16px] text-blue-600 animate-pulse mr-1">schedule</span>
        {time}
      </div>
      <p className="text-[9px] text-slate-550 font-bold uppercase tracking-wider mt-1">{date}</p>
    </div>
  );
}
