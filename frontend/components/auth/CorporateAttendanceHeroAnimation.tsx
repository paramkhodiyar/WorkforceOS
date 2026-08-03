'use client';

import React from 'react';

export default function CorporateAttendanceHeroAnimation() {
  return (
    <div className="relative hidden md:flex flex-col justify-between p-8 lg:p-12 bg-slate-950 text-white overflow-hidden select-none min-h-screen">
      
      {/* ── FULL-BLEED BACKGROUND IMAGE (SPANS ENTIRE HERO PANEL EDGE-TO-EDGE) ── */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <img
          src="/login_hero_fullbleed.png"
          alt="WorkforceOS Platform Background"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Dark Backdrop Overlay for High Contrast & Readability */}
      <div className="absolute inset-0 z-0 bg-slate-950/60 pointer-events-none" />

      {/* ── TOP HEADER BRAND BAR ── */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl backdrop-blur-md">
          <img src="/workforceoslogo.png" alt="Logo" className="h-7 w-7 object-contain rounded" />
          <span className="text-sm font-black tracking-widest uppercase text-white">WorkforceOS</span>
        </div>
      </div>

      {/* ── CENTER CORPORATE HEADLINE ── */}
      <div className="relative z-10 my-auto py-8 max-w-md">
        <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
          The modern operating system for your enterprise team.
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed font-medium mt-4">
          Consolidate attendance, leaves, tasks, payroll, and assets into a single clean workspace.
        </p>
      </div>

      {/* ── FOOTER WARM WELCOME MESSAGE (NO SECURITY LABELS, NO NAMES) ── */}
      <div className="relative z-10 border-t border-slate-800/80 pt-4">
        <p className="text-xs text-slate-300 font-medium leading-relaxed">
          Welcome to WorkforceOS. Empowering teams, streamlining operations, and simplifying workspace management.
        </p>
      </div>

    </div>
  );
}
