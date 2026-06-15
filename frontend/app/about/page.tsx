'use client';

import React from 'react';
import Link from 'next/link';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { LandingFooter } from '../../components/layout/LandingFooter';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-900">
      {/* Navigation Header */}
      <LandingHeader />

      {/* HERO & STORY SECTION */}
      <section className="pt-28 pb-16 md:pt-40 md:pb-24 bg-white border-b border-slate-100">
        <div className="max-w-[760px] mx-auto px-6">
          <span 
            className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 rounded-full mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            OUR STORY
          </span>

          {/* Headline */}
          <h1 
            className="text-3xl md:text-[2.75rem] font-[800] text-slate-900 leading-[1.15] tracking-[-0.02em] mb-12"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Built by someone who's seen the spreadsheet chaos firsthand.
          </h1>

          {/* Desktop/Mobile Layout */}
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Founder Avatar - Styled flat visual representation */}
            <div className="order-1 md:order-2 self-center md:self-start shrink-0">
              <div className="w-[200px] h-[200px] md:w-[240px] md:h-[240px] rounded-full border-[3px] border-blue-600 bg-slate-50 flex items-center justify-center relative overflow-hidden select-none">
                {/* SVG Avatar representing the founder */}
                <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <div className="absolute bottom-2 left-0 right-0 text-center bg-blue-600/90 text-white text-[9px] font-bold py-1 uppercase tracking-wider">
                  Param Khodiyar
                </div>
              </div>
            </div>

            {/* First-person story */}
            <div className="order-2 md:order-1 flex-1 space-y-6 text-slate-600 text-[16px] leading-[1.75]">
              <p>
                A few years ago, I was running operations at a fast-growing Indian software company. We scaled from 15 to 80 employees in less than a year. Almost overnight, the simple operational systems we relied on completely fell apart.
              </p>
              <p>
                We were tracking attendance in giant Excel sheets. Leave requests came through chaotic WhatsApp messages that were hard to scroll back and verify. Task statuses were discussed in chats and immediately forgotten, leaving managers constantly chasing status reports. When month-end payroll arrived, HR and finance went into a two-day panic, manually calculating loss-of-pay and statutory deductions under pressure.
              </p>
              <p>
                I looked for an alternative HRMS to purchase, but every platform we trialled was either bloated with hundreds of complex options we didn't need, or failed to handle basic Indian compliance variables (like PF caps, ESIC thresholds, and Professional Tax slabs) out of the box. So we decided to build what we couldn't buy.
              </p>
              <p>
                We built **WorkforceOS** around one simple idea: HRMS platforms should be clean, fast, and secure. We started by building a robust audit log database first, then laid down attendance, payroll, leaves, tasks, and reviews on top of it. It's built specifically for Indian startups and SMBs of 20 to 500 people who want to replace spreadsheet chaos with clear, compliant execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES SECTION */}
      <section className="py-20 md:py-24 bg-slate-50 border-b border-slate-200/50">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="text-center mb-16">
            <span 
              className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 rounded-full mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              CORE VALUES
            </span>
            <h2 
              className="text-2xl md:text-[2.25rem] font-[700] text-slate-900 leading-[1.2] tracking-[-0.02em]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              The principles behind our code.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-start text-left hover:border-slate-400 transition-colors">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6 border border-blue-100 select-none">
                <span className="material-symbols-outlined text-[24px]">history</span>
              </div>
              <h3 
                className="text-lg font-bold text-slate-900 mb-3"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Transparency
              </h3>
              <p className="text-slate-500 text-[14px] leading-[1.65]">
                Every action in WorkforceOS is logged and attributable. We built the audit trail first, then built the features around it. We run our own product the same way.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-start text-left hover:border-slate-400 transition-colors">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-6 border border-teal-100 select-none">
                <span className="material-symbols-outlined text-[24px]">grid_view</span>
              </div>
              <h3 
                className="text-lg font-bold text-slate-900 mb-3"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Simplicity
              </h3>
              <p className="text-slate-500 text-[14px] leading-[1.65]">
                Most HRMS platforms ship with 200 features and 180 you never use. WorkforceOS ships with the 11 things Indian companies actually need, and lets you disable the rest.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-start text-left hover:border-slate-400 transition-colors">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-6 border border-amber-100 select-none">
                <span className="material-symbols-outlined text-[24px]">flag</span>
              </div>
              <h3 
                className="text-lg font-bold text-slate-900 mb-3"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Indian-first
              </h3>
              <p className="text-slate-500 text-[14px] leading-[1.65]">
                PF, ESIC, Professional Tax, TDS — not afterthoughts. The leave types, the reporting hierarchies, the payroll structures — all designed for how Indian companies actually operate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION - Slate/comfortable theme background */}
      <section className="py-20 bg-slate-100 border-b border-slate-200/50">
        <div className="max-w-[560px] mx-auto text-center px-6 space-y-6">
          <span 
            className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 rounded-full"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            READY?
          </span>
          <h2 
            className="text-2xl md:text-[2.25rem] font-[700] text-slate-900 leading-[1.2] tracking-[-0.02em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            See what WorkforceOS can do for your team.
          </h2>
          
          <div className="pt-2 flex flex-col items-center gap-2">
            <Link
              id="about-demo-cta"
              href="/contact"
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-sm uppercase tracking-wider transition-all border border-blue-600 active:scale-95 cursor-pointer"
            >
              Request a demo
            </Link>
            <span className="text-xs text-slate-400 font-medium">
              30 minutes · no commitment
            </span>
          </div>
        </div>
      </section>

      {/* Global Navigation Footer */}
      <LandingFooter />
    </div>
  );
}
