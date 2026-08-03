'use client';

import React, { useState, useEffect } from 'react';

export default function CorporateAttendanceHeroAnimation() {
  const [activeFrame, setActiveFrame] = useState<number>(0);
  const [progressWidth, setProgressWidth] = useState<number>(0);
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    // Real-time Clock String
    const updateTime = () => {
      const d = new Date();
      setTimeString(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 1000);

    // Frame Switching Video Loop (Every 4 seconds switch frame)
    const frameTimer = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % 3);
    }, 4500);

    // Progress Bar Animation
    const progressTimer = setInterval(() => {
      setProgressWidth((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 45);

    return () => {
      clearInterval(clockTimer);
      clearInterval(frameTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="relative hidden md:flex flex-col justify-between p-8 lg:p-12 bg-slate-950 text-white overflow-hidden select-none min-h-screen">
      
      {/* ── TOP HEADER BRAND BAR ── */}
      <div className="relative z-20 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
          <img src="/workforceoslogo.png" alt="Logo" className="h-7 w-7 object-contain rounded" />
          <span className="text-sm font-black tracking-widest uppercase text-white">WorkforceOS</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              LIVE SYSTEM MOTION DEMO
            </span>
          </div>
        </div>
      </div>

      {/* ── CENTER VIDEO MOCKUP FRAME (PREMIUM ENTERPRISE SAAS SHOWCASE) ── */}
      <div className="relative z-10 my-auto py-4 flex flex-col items-center justify-center w-full max-w-xl mx-auto">
        
        {/* macOS Style Application Window Frame */}
        <div className="w-full bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden">
          
          {/* Window Header Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                WorkforceOS Biometric Operations Console · v2.4
              </span>
            </div>

            {/* Stage Selector Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button 
                onClick={() => setActiveFrame(0)}
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                  activeFrame === 0 ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                01. Check-In
              </button>
              <button 
                onClick={() => setActiveFrame(1)}
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                  activeFrame === 1 ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                02. Telemetry
              </button>
              <button 
                onClick={() => setActiveFrame(2)}
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                  activeFrame === 2 ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                03. Payroll
              </button>
            </div>
          </div>

          {/* Window Main Canvas - Animated Video Stages */}
          <div className="p-6 md:p-8 bg-slate-950 min-h-[340px] flex flex-col justify-between relative overflow-hidden">
            
            {/* ── FRAME 0: BIOMETRIC CHECK-IN SCANNER MOTION ── */}
            {activeFrame === 0 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Biometric Terminal #01</span>
                    <h3 className="text-lg font-black text-white mt-0.5">Automated Attendance Check-In</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 border border-emerald-500/40 px-3 py-1 rounded-full">
                    {timeString || '09:00:00 AM'}
                  </span>
                </div>

                {/* Animated Biometric HUD Target Canvas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  
                  {/* Face / Biometric Scan HUD SVG */}
                  <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center h-44 overflow-hidden">
                    {/* Corner Scanning Markers */}
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-blue-400" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-blue-400" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-blue-400" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-blue-400" />

                    {/* Vector Scanning Reticle SVG */}
                    <svg viewBox="0 0 100 100" className="w-24 h-24">
                      {/* Outer Ring */}
                      <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="2" fill="none" />
                      <circle cx="50" cy="50" r="42" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="60 30" className="animate-spin-slow" />
                      
                      {/* Avatar Profile Silhouette */}
                      <circle cx="50" cy="40" r="14" fill="#3b82f6" opacity="0.8" />
                      <path d="M 28 80 C 28 60, 72 60, 72 80 Z" fill="#3b82f6" opacity="0.8" />

                      {/* Laser Scanning Ray */}
                      <line x1="10" y1="50" x2="90" y2="50" stroke="#10b981" strokeWidth="3" className="animate-laser-scan-vert" />
                    </svg>

                    <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      BIOMETRICS MATCHED 100%
                    </span>
                  </div>

                  {/* Employee Live Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 font-black text-white flex items-center justify-center text-sm border border-blue-400">
                        PO
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Param Owner</h4>
                        <p className="text-[11px] text-slate-400 font-medium">System Owner / Executive</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="font-bold text-emerald-400 uppercase">PRESENT · WFO</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Shift Clock:</span>
                        <span className="font-mono font-bold text-white">09:00 AM (On Time)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Geofence:</span>
                        <span className="font-bold text-blue-400 uppercase">HQ Verified</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ── FRAME 1: LIVE ATTENDANCE TELEMETRY MOTION ── */}
            {activeFrame === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Real-Time Operations</span>
                    <h3 className="text-lg font-black text-white mt-0.5">Organization Attendance Telemetry</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 border border-blue-500/40 px-3 py-1 rounded-full">
                    98.4% Present Today
                  </span>
                </div>

                {/* Animated Department Attendance Bar Chart */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-300">Engineering & Tech</span>
                      <span className="text-emerald-400 font-mono">42 / 45 Checked In (93%)</span>
                    </div>
                    <div className="w-full bg-slate-900 h-3 rounded-full border border-slate-800 overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[93%] transition-all duration-1000" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-300">Operations & HR</span>
                      <span className="text-blue-400 font-mono">28 / 28 Checked In (100%)</span>
                    </div>
                    <div className="w-full bg-slate-900 h-3 rounded-full border border-slate-800 overflow-hidden">
                      <div className="bg-blue-500 h-full w-[100%] transition-all duration-1000" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-300">Sales & Marketing</span>
                      <span className="text-indigo-400 font-mono">35 / 36 Checked In (97%)</span>
                    </div>
                    <div className="w-full bg-slate-900 h-3 rounded-full border border-slate-800 overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[97%] transition-all duration-1000" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── FRAME 2: AUTOMATED PAYROLL & TASKS MOTION ── */}
            {activeFrame === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Automated Engine</span>
                    <h3 className="text-lg font-black text-white mt-0.5">Payroll & Compliance Compute</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 border border-emerald-500/40 px-3 py-1 rounded-full">
                    100% Tax Compliant
                  </span>
                </div>

                {/* Animated Compliance Metric Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Monthly Payroll Net</span>
                    <p className="text-xl font-black text-white font-mono">₹14,82,500</p>
                    <p className="text-[10px] text-emerald-400 font-bold">✓ PF & TDS Auto-Calculated</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tasks Resolution</span>
                    <p className="text-xl font-black text-white font-mono">142 / 150 Done</p>
                    <p className="text-[10px] text-blue-400 font-bold">⚡ 94.6% Sprint Productivity</p>
                  </div>
                </div>
              </div>
            )}

            {/* Video Timeline Scrubber Bar at Bottom of Canvas */}
            <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">DEMO FRAME 0{activeFrame + 1}/03</span>
              <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-blue-500 h-full transition-all duration-75 ease-linear"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>

          </div>

        </div>

        {/* Headline below video window */}
        <div className="text-center max-w-md mt-8 space-y-2">
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
            The modern operating system for your enterprise team.
          </h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-medium">
            Consolidate attendance, leaves, tasks, payroll, and assets into a single clean workspace.
          </p>
        </div>

      </div>

      {/* ── FOOTER BAR ── */}
      <div className="relative z-20 flex items-center justify-between text-[11px] text-slate-400 font-bold border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">shield</span>
          <span className="tracking-wider uppercase text-[10px] text-slate-300">WORKFORCEOS MANAGEMENT PLATFORM</span>
        </div>
        <span className="text-slate-500 hidden sm:inline text-[10px] uppercase font-mono">ENTERPRISE SECURED</span>
      </div>

      {/* Embedded CSS Animations */}
      <style jsx>{`
        @keyframes laserScanVert {
          0%, 100% { transform: translateY(-30px); }
          50% { transform: translateY(30px); }
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-laser-scan-vert {
          animation: laserScanVert 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spinSlow 25s linear infinite;
        }
      `}</style>
    </div>
  );
}
