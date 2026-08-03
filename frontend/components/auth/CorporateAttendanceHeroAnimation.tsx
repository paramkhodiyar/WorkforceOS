'use client';

import React, { useState, useEffect } from 'react';

export default function CorporateAttendanceHeroAnimation() {
  const [scanStep, setScanStep] = useState<0 | 1 | 2 | 3>(0);
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    // Update live clock string
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // Scan cycle animation loop
    const scanInterval = setInterval(() => {
      setScanStep(1); // Scanning
      setTimeout(() => setScanStep(2), 1200); // Verified
      setTimeout(() => setScanStep(3), 2400); // Recorded
      setTimeout(() => setScanStep(0), 4500); // Reset
    }, 5500);

    return () => {
      clearInterval(clockInterval);
      clearInterval(scanInterval);
    };
  }, []);

  return (
    <div className="relative hidden md:flex flex-col justify-between p-8 lg:p-12 bg-slate-950 text-white overflow-hidden select-none min-h-screen">
      {/* Background Animated Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950 pointer-events-none" />
      
      {/* Ambient Pulsing Glowing Orbs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Cyber Grid Lines Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* ── TOP NAVBAR BRAND HEADER ── */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 px-4 py-2 rounded-2xl shadow-lg">
          <img src="/workforceoslogo.png" alt="Logo" className="h-7 w-7 object-contain rounded" />
          <span className="text-sm font-black tracking-widest uppercase text-white">WorkforceOS</span>
        </div>

        <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-full backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
            Biometric Node Active
          </span>
        </div>
      </div>

      {/* ── CENTER SCENE: ANIMATED BIOMETRIC CHARACTER & TERMINAL ── */}
      <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center">
        
        {/* Animated Corporate Professional & Biometric Scanner Graphic */}
        <div className="relative w-full max-w-lg flex flex-col items-center">
          
          {/* Glowing Aura Ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-blue-500/20 to-emerald-500/20 rounded-full blur-2xl animate-spin" style={{ animationDuration: '15s' }} />

          {/* SVG Professional Illustration */}
          <div className="relative z-10 w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
            <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
              <defs>
                <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="scannerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Desk Workstation Arc Base */}
              <ellipse cx="150" cy="240" rx="120" ry="30" fill="#1e293b" opacity="0.8" />
              <ellipse cx="150" cy="240" rx="100" ry="20" fill="#0f172a" />

              {/* Modern Computer Desk Screen */}
              <rect x="90" y="160" width="120" height="70" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
              <rect x="96" y="166" width="108" height="58" rx="5" fill="#090d16" />
              {/* Animated Code lines on monitor */}
              <line x1="104" y1="176" x2="160" y2="176" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
              <line x1="104" y1="186" x2="180" y2="186" stroke="#10b981" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              <line x1="104" y1="196" x2="140" y2="196" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
              <line x1="104" y1="206" x2="190" y2="206" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" opacity="0.8" />

              {/* Corporate Character (Avatar) */}
              <g className="animate-bounce-gentle">
                {/* Body / Suit */}
                <path d="M 110 150 C 110 115, 190 115, 190 150 L 205 210 L 95 210 Z" fill="url(#avatarGrad)" />
                {/* Collar & Tie */}
                <polygon points="150,135 142,160 150,185 158,160" fill="#ffffff" opacity="0.9" />
                <polygon points="150,145 146,175 150,185 154,175" fill="#f43f5e" />

                {/* Head / Face */}
                <circle cx="150" cy="100" r="32" fill="#fde047" />
                {/* Smiling Expression */}
                <path d="M 140 108 Q 150 120 160 108" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                {/* Happy Eyes */}
                <circle cx="140" cy="94" r="3.5" fill="#0f172a" />
                <circle cx="160" cy="94" r="3.5" fill="#0f172a" />
                {/* Stylish Hair */}
                <path d="M 120 95 C 120 65, 180 65, 180 95 C 170 72, 130 72, 120 95 Z" fill="#1e293b" />
                
                {/* Headset with Mic */}
                <path d="M 120 95 Q 150 65 180 95" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
                <rect x="116" y="90" width="8" height="16" rx="4" fill="#3b82f6" />
                <rect x="176" y="90" width="8" height="16" rx="4" fill="#3b82f6" />
                <path d="M 120 102 Q 128 116 138 112" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="138" cy="112" r="3" fill="#10b981" className="animate-ping" />
              </g>

              {/* Biometric Touch Terminal (Right of desk) */}
              <g transform="translate(205, 160)">
                <rect x="0" y="0" width="45" height="55" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" filter="url(#glow)" />
                {/* Fingerprint Scanner Surface */}
                <rect x="5" y="5" width="35" height="45" rx="6" fill="#090d16" />
                
                {/* Fingerprint Ridge Arc Animations */}
                <path d="M 15 25 A 8 8 0 0 1 30 25" fill="none" stroke={scanStep >= 2 ? "#10b981" : "#3b82f6"} strokeWidth="2" strokeLinecap="round" />
                <path d="M 12 30 A 11 11 0 0 1 33 30" fill="none" stroke={scanStep >= 2 ? "#10b981" : "#3b82f6"} strokeWidth="2" strokeLinecap="round" />
                <path d="M 17 35 A 6 6 0 0 1 28 35" fill="none" stroke={scanStep >= 2 ? "#10b981" : "#3b82f6"} strokeWidth="2" strokeLinecap="round" />

                {/* Laser Scanning Line Animation */}
                <line 
                  x1="6" y1={scanStep === 1 ? "38" : "12"} 
                  x2="39" y2={scanStep === 1 ? "38" : "12"} 
                  stroke="#10b981" 
                  strokeWidth="2.5" 
                  filter="url(#glow)"
                  className="transition-all duration-1000 ease-in-out"
                />
              </g>
            </svg>
          </div>

          {/* ── FLOATING GLASSMORPHIC STATUS CARDS ── */}

          {/* Card 1: Attendance Verification Badge (Top Floating) */}
          <div className="absolute -top-4 left-2 md:-left-6 bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-float-slow">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-500 ${
              scanStep >= 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}>
              <span className="material-symbols-outlined text-[22px]">
                {scanStep >= 2 ? 'verified' : 'fingerprint'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {scanStep === 1 ? 'SCANNING...' : scanStep >= 2 ? 'CHECK-IN VERIFIED' : 'TOUCH SENSOR'}
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${scanStep >= 2 ? 'bg-emerald-400' : 'bg-blue-400'}`} />
              </div>
              <p className="text-xs font-bold text-white mt-0.5">
                {scanStep >= 2 ? `Recorded · ${timeString || '09:00 AM'}` : 'Place thumb to clock in'}
              </p>
            </div>
          </div>

          {/* Card 2: Shift Clock & Status (Right Floating) */}
          <div className="absolute bottom-2 -right-4 md:-right-8 bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-float-reverse">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">schedule</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Shift Clock</span>
              <p className="text-xs font-bold text-white mt-0.5">
                On Schedule <span className="text-emerald-400 font-mono ml-1">08:58 AM</span>
              </p>
            </div>
          </div>

          {/* Card 3: Enterprise Compliance (Bottom Left Floating) */}
          <div className="absolute -bottom-6 left-6 bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-float-slow" style={{ animationDelay: '1.5s' }}>
            <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">security</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Security Guard</span>
              <p className="text-xs font-bold text-emerald-400 mt-0.5">100% Encrypted Node</p>
            </div>
          </div>
        </div>

        {/* Dynamic Headline Text */}
        <div className="text-center max-w-md mt-10 space-y-3 relative z-10">
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
            The modern operating system for your enterprise team.
          </h2>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
            Automate biometric attendance, payroll, leaves, tasks, and shift compliance in one clean workspace.
          </p>
        </div>
      </div>

      {/* ── FOOTER SECURITY TICKER ── */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 font-semibold border-t border-slate-800/80 pt-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">lock</span>
          <span className="tracking-wider uppercase text-[10px]">WorkforceOS Biometric Engine v2.4</span>
        </div>
        <span className="text-slate-500 hidden sm:inline text-[10px] uppercase">SOC2 Type II Certified</span>
      </div>

      {/* Custom CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(0.5deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(8px) rotate(-0.5deg); }
        }
        @keyframes bounceGentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .animate-float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: floatReverse 7s ease-in-out infinite;
        }
        .animate-bounce-gentle {
          animation: bounceGentle 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
