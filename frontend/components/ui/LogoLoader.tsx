'use client';

import React from 'react';

interface LogoLoaderProps {
  size?: number;
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LogoLoader({
  size = 72,
  text = 'Loading WorkforceOS...',
  fullScreen = false,
  className = '',
}: LogoLoaderProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center text-center p-6 select-none ${className}`}>
      {/* Outer Logo Container (Flat Solid, No Shadows/Gradients) */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing Outer Border Ring */}
        <div 
          className="absolute rounded-2xl border-2 border-blue-600/40 animate-ping"
          style={{ width: size * 1.3, height: size * 1.3 }}
        />

        {/* WorkforceOS Official Logo Image */}
        <div 
          className="relative z-10 flex items-center justify-center bg-white border-2 border-slate-200 rounded-2xl p-3 animate-pulse"
          style={{ width: size, height: size }}
        >
          <img
            src="/workforceoslogo.png"
            alt="WorkforceOS Loading"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Loading Label & Animated Dots */}
      {text && (
        <div className="mt-5 space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center justify-center gap-1">
            <span>{text}</span>
          </p>
          <div className="flex justify-center gap-1.5 pt-1">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50">
        {content}
      </div>
    );
  }

  return content;
}
