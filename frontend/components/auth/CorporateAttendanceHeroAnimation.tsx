'use client';

import React from 'react';

export default function CorporateAttendanceHeroAnimation() {
  return (
    <div className="relative hidden md:flex flex-col justify-between p-8 lg:p-12 bg-slate-900 text-white overflow-hidden select-none min-h-screen">
      
      {/* ── FULL-BLEED BACKGROUND IMAGE (USING PREVIOUS IMAGE WITH HIGH VIBRANCE & NO PITCH BLACK DARKNESS) ── */}
      <div className="absolute inset-0 z-0 opacity-70 pointer-events-none">
        <img
          src="/login_hero_fullbleed.png"
          alt="WorkforceOS Platform Background"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Subtle Blue/Slate Overlay for Readability without Pitch Black Darkness */}
      <div className="absolute inset-0 z-0 bg-slate-900/35 pointer-events-none" />

      {/* ── TOP HEADER BRAND BAR (CLEAN FRAMELESS LOGO - NO ROUNDED RECTANGLE HOUSING) ── */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/workforceoslogo.png" alt="WorkforceOS Logo" className="h-8 w-8 object-contain rounded" />
          <span className="text-xl font-black tracking-widest uppercase text-white font-sans">WorkforceOS</span>
        </div>
      </div>

      {/* ── CENTER CORPORATE HEADLINE ── */}
      <div className="relative z-10 my-auto py-8 max-w-md">
        <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
          The modern operating system for your enterprise team.
        </h2>
        <p className="text-slate-200 text-sm leading-relaxed font-medium mt-4">
          Consolidate attendance, leaves, tasks, payroll, and assets into a single clean workspace.
        </p>
      </div>

      {/* ── FOOTER WARM WELCOME MESSAGE (NO SECURITY LABELS, NO NAMES) ── */}
      <div className="relative z-10 border-t border-slate-700/60 pt-4">
        <p className="text-xs text-slate-200 font-medium leading-relaxed">
          Welcome to WorkforceOS. Empowering teams, streamlining operations, and simplifying workspace management.
        </p>
      </div>

    </div>
  );
}
