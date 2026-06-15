import React from 'react';
import Link from 'next/link';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { LandingFooter } from '../../components/layout/LandingFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Me | WorkforceOS - Solved Operation Challenges',
  description: 'Read my journey of building WorkforceOS from scratch. Inspired by summer internship manual clock-in friction, I built a modular HRMS to drive startup efficiency.',
};

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
            MY STORY
          </span>

          {/* Headline */}
          <h1 
            className="text-3xl md:text-[2.75rem] font-[800] text-slate-900 leading-[1.15] tracking-[-0.02em] mb-12"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Built to solve real problems and drive startup efficiency.
          </h1>

          {/* Desktop/Mobile Layout */}
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Founder Avatar */}
            <div className="order-1 md:order-2 self-center md:self-start shrink-0 flex flex-col items-center gap-3">
              <div className="w-[200px] h-[200px] md:w-[240px] md:h-[240px] rounded-full bg-slate-50 relative overflow-hidden select-none">
                <img 
                  src="/me.jpg" 
                  alt="Param Khodiyar" 
                  className="w-full h-full object-cover object-center scale-[1.15] transition-transform" 
                />
              </div>
              <div 
                className="text-slate-900 text-xs font-extrabold uppercase tracking-widest bg-slate-100 border border-slate-200 px-3 py-1 rounded-full"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Param Khodiyar
              </div>
            </div>

            {/* First-person story */}
            <div className="order-2 md:order-1 flex-1 space-y-6 text-slate-600 text-[16px] leading-[1.75]">
              <p>
                The idea for <strong className="font-bold text-slate-900">WorkforceOS</strong> was born during my summer internship. Every single day, I had to manually clock in and clock out. It was a repetitive, friction-filled task, and I quickly realized there had to be a better way to automate it.
              </p>
              <p>
                That curiosity led me to discover that systems designed to handle this are called HRMS (Human Resource Management Systems). I was immediately keen to build one. I love developing solutions that solve my own day-to-day problems and the broader operational challenges around the world. Technology, at its core, was built to streamline processes and save time.
              </p>
              <p>
                I built WorkforceOS entirely on my own, working alongside autonomous agents to amplify my development speed and capabilities. My goal was to deliver a sleek, lightweight, yet fully-compliant product that small startups can use to eliminate spreadsheet chaos and drastically increase operational efficiency.
              </p>
              <p>
                WorkforceOS is centered around a simple belief: business tools should be clean, fast, and secure. I started by building an immutable audit trail ledger first, then built attendance tracking, leaves, tasks, and payroll structures on top of it. It is built specifically for Indian startups and SMBs of 20 to 500 people who want high-performance, compliant execution without the bloat.
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
              The principles behind my code.
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
                Every action in WorkforceOS is logged and attributable. I built the audit trail first, then built the features around it. I run my own product the same way.
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
