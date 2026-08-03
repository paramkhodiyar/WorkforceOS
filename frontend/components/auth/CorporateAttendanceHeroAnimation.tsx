'use client';

import React, { useState, useEffect } from 'react';

export default function CorporateAttendanceHeroAnimation() {
  const [scanStep, setScanStep] = useState<0 | 1 | 2 | 3>(0);
  const [timeString, setTimeString] = useState<string>('');
  const [activeNode, setActiveNode] = useState(0);

  useEffect(() => {
    // Live Clock
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // Biometric Scanner State Loop
    const scanInterval = setInterval(() => {
      setScanStep(1); // Scanning HUD
      setTimeout(() => setScanStep(2), 1200); // Verified
      setTimeout(() => setScanStep(3), 2400); // Recorded & Authenticated
      setTimeout(() => setScanStep(0), 4800); // Reset
    }, 5600);

    // Node Pulser
    const nodeInterval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % 4);
    }, 800);

    return () => {
      clearInterval(clockInterval);
      clearInterval(scanInterval);
      clearInterval(nodeInterval);
    };
  }, []);

  return (
    <div className="relative hidden md:flex flex-col justify-between p-8 lg:p-12 bg-slate-950 text-white overflow-hidden select-none min-h-screen">
      {/* High-Tech Grid Background - Solid Lines, No Gradients */}
      <div 
        className="absolute inset-0 opacity-[0.12] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Dynamic Laser Grid Scanning Ray */}
      <div className="absolute inset-x-0 h-0.5 bg-blue-500/40 animate-laser-sweep pointer-events-none z-0" />

      {/* ── TOP BRAND HEADER ── */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
          <img src="/workforceoslogo.png" alt="Logo" className="h-7 w-7 object-contain rounded" />
          <span className="text-sm font-black tracking-widest uppercase text-white">WorkforceOS</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            BIOMETRIC HUD ACTIVE
          </span>
        </div>
      </div>

      {/* ── CENTER ISOMETRIC BIOMETRIC ATTENDANCE COMMAND CENTER ── */}
      <div className="relative z-10 my-auto py-4 flex flex-col items-center justify-center">
        
        {/* High-Tech Biometric HUD Visual Container */}
        <div className="relative w-full max-w-lg flex flex-col items-center justify-center">
          
          {/* Main Interactive Biometric Scanner Circle */}
          <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
            
            {/* Outer Concentric HUD Rings (Rotating in opposite directions) */}
            <div className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-full animate-spin-slow" />
            <div className="absolute inset-4 border border-slate-800 rounded-full" />
            <div className="absolute inset-8 border border-blue-600/40 rounded-full animate-spin-reverse" />
            <div className="absolute inset-12 border-2 border-emerald-500/20 rounded-full" />

            {/* Radar Crosshair Reticle Lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-blue-500/20" />
              <div className="h-full w-[1px] bg-blue-500/20 absolute" />
            </div>

            {/* Vector Fingerprint HUD Core (Solid Colors, No Gradients/Emojis) */}
            <div className="relative z-10 w-44 h-44 bg-slate-900 border-2 border-slate-800 rounded-3xl flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-28 h-28">
                {/* Fingerprint Arcs */}
                <path d="M 50 15 A 35 35 0 0 1 85 50" fill="none" stroke={scanStep >= 2 ? "#10b981" : "#3b82f6"} strokeWidth="3" strokeLinecap="round" />
                <path d="M 50 25 A 25 25 0 0 1 75 50" fill="none" stroke={scanStep >= 2 ? "#10b981" : "#60a5fa"} strokeWidth="3" strokeLinecap="round" />
                <path d="M 50 35 A 15 15 0 0 1 65 50" fill="none" stroke={scanStep >= 2 ? "#10b981" : "#3b82f6"} strokeWidth="3" strokeLinecap="round" />

                <path d="M 15 50 A 35 35 0 0 1 50 15" fill="none" stroke={scanStep >= 2 ? "#10b981" : "#3b82f6"} strokeWidth="3" strokeLinecap="round" />
                <path d="M 25 50 A 25 25 0 0 1 50 25" fill="none" stroke={scanStep >= 2 ? "#10b981" : "#60a5fa"} strokeWidth="3" strokeLinecap="round" />

                <path d="M 30 55 A 20 20 0 0 0 70 55" fill="none" stroke={scanStep >= 2 ? "#10b981" : "#3b82f6"} strokeWidth="3" strokeLinecap="round" />
                <path d="M 38 65 A 12 12 0 0 0 62 65" fill="none" stroke={scanStep >= 2 ? "#10b981" : "#60a5fa"} strokeWidth="3" strokeLinecap="round" />
                <path d="M 45 75 A 5 5 0 0 0 55 75" fill="none" stroke={scanStep >= 2 ? "#10b981" : "#3b82f6"} strokeWidth="3" strokeLinecap="round" />

                {/* Laser Scanning Line */}
                <line 
                  x1="10" y1={scanStep === 1 ? "80" : "20"} 
                  x2="90" y2={scanStep === 1 ? "80" : "20"} 
                  stroke={scanStep >= 2 ? "#10b981" : "#00f0ff"} 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-in-out"
                />
              </svg>

              {/* Status Badge in Center of Scanner */}
              <div className="absolute -bottom-3 bg-slate-950 border border-slate-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-400">
                {scanStep === 1 ? 'SCANNING...' : scanStep >= 2 ? 'VERIFIED ✓' : 'READY TO SCAN'}
              </div>
            </div>

            {/* Orbiting Satellite Data Nodes */}
            <div className={`absolute top-2 right-4 h-3 w-3 rounded-full border border-blue-400 ${activeNode === 0 ? 'bg-blue-400 scale-125' : 'bg-slate-800'} transition-all`} />
            <div className={`absolute bottom-6 right-2 h-3 w-3 rounded-full border border-emerald-400 ${activeNode === 1 ? 'bg-emerald-400 scale-125' : 'bg-slate-800'} transition-all`} />
            <div className={`absolute bottom-2 left-6 h-3 w-3 rounded-full border border-purple-400 ${activeNode === 2 ? 'bg-purple-400 scale-125' : 'bg-slate-800'} transition-all`} />
            <div className={`absolute top-6 left-2 h-3 w-3 rounded-full border border-amber-400 ${activeNode === 3 ? 'bg-amber-400 scale-125' : 'bg-slate-800'} transition-all`} />
          </div>

          {/* ── FLOATING HUD TELEMETRY CARDS (FLAT SOLID CARDS - NO GRADIENTS, NO SHADOWS) ── */}

          {/* Top Left Floating Telemetry */}
          <div className="absolute -top-6 -left-4 md:-left-10 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
              scanStep >= 2 ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-blue-400 border-blue-500/30'
            }`}>
              <span className="material-symbols-outlined text-[20px]">
                {scanStep >= 2 ? 'verified_user' : 'fingerprint'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Biometric Lock</span>
              <p className="text-xs font-extrabold text-white mt-0.5">
                {scanStep >= 2 ? `RECORDED · ${timeString || '09:00:00 AM'}` : 'SCANNER ACTIVE'}
              </p>
            </div>
          </div>

          {/* Bottom Right Floating Shift Status */}
          <div className="absolute -bottom-4 -right-4 md:-right-8 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-800 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Shift Telemetry</span>
              <p className="text-xs font-extrabold text-white mt-0.5">
                ON TIME <span className="text-emerald-400 font-mono ml-1">09:00 AM</span>
              </p>
            </div>
          </div>

          {/* Left Middle Floating Security Badge */}
          <div className="absolute top-1/2 -left-6 md:-left-12 -translate-y-1/2 bg-slate-900 border border-slate-800 p-3 rounded-xl hidden lg:flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
              100% Encrypted Node
            </span>
          </div>

        </div>

        {/* Corporate Operating System Headline */}
        <div className="text-center max-w-md mt-10 space-y-3 relative z-10">
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
            The modern operating system for your enterprise team.
          </h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-medium">
            Automate biometric attendance, payroll, leaves, tasks, and shift compliance in one clean workspace.
          </p>
        </div>
      </div>

      {/* ── FOOTER TICKER ── */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 font-bold border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">shield</span>
          <span className="tracking-wider uppercase text-[10px] text-slate-300">WORKFORCEOS BIOMETRIC ENGINE V2.4</span>
        </div>
        <span className="text-slate-500 hidden sm:inline text-[10px] uppercase font-mono">SOC2 TYPE II CERTIFIED</span>
      </div>

      {/* High-Tech Animations (Pure CSS, No Lag) */}
      <style jsx>{`
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spinReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes laserSweep {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
        .animate-spin-slow {
          animation: spinSlow 20s linear infinite;
        }
        .animate-spin-reverse {
          animation: spinReverse 15s linear infinite;
        }
        .animate-laser-sweep {
          animation: laserSweep 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
