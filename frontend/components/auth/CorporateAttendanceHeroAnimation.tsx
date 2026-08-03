'use client';

import React, { useState, useEffect } from 'react';

export default function CorporateAttendanceHeroAnimation() {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative hidden md:flex flex-col justify-between p-8 lg:p-12 bg-slate-950 text-white overflow-hidden select-none min-h-screen">
      
      {/* ── TOP HEADER BRAND BAR ── */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
          <img src="/workforceoslogo.png" alt="Logo" className="h-7 w-7 object-contain rounded" />
          <span className="text-sm font-black tracking-widest uppercase text-white">WorkforceOS</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            SYSTEM ACTIVE
          </span>
        </div>
      </div>

      {/* ── CENTER MINIMALIST HIGH-RES VECTOR ILLUSTRATION SHOWCASE ── */}
      <div className="relative z-10 my-auto py-4 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        
        {/* Minimalist Vector Graphic Display Frame */}
        <div className="relative w-full bg-slate-900 border border-slate-800/80 rounded-3xl p-3 overflow-hidden">
          
          {/* High-Res Professional Vector Asset */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800">
            <img 
              src="/login_hero_vector.png" 
              alt="WorkforceOS Graphical Workflows" 
              className="w-full h-auto object-cover max-h-[280px]"
            />
          </div>

          {/* Floating Subtle Live Status Badges */}
          <div className="absolute top-6 left-6 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Biometric Lock</span>
              <span className="text-[11px] font-extrabold text-white font-mono">VERIFIED · {timeString || '09:00 AM'}</span>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Attendance Rate</span>
              <span className="text-[11px] font-extrabold text-emerald-400 font-mono">98.4% ON TIME</span>
            </div>
          </div>

        </div>

        {/* Minimalist Corporate Headline */}
        <div className="text-center max-w-md mt-8 space-y-2">
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
            The modern operating system for your enterprise team.
          </h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-medium">
            Consolidate attendance, leaves, tasks, payroll, and assets into a single clean workspace.
          </p>
        </div>

      </div>

      {/* ── FOOTER BRANDING BAR ── */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 font-bold border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
          <span className="tracking-wider uppercase text-[10px] text-slate-300">WORKFORCEOS MANAGEMENT PLATFORM</span>
        </div>
        <span className="text-slate-500 hidden sm:inline text-[10px] uppercase font-mono">SOC2 TYPE II CERTIFIED</span>
      </div>

    </div>
  );
}
