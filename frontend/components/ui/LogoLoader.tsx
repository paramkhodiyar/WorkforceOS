'use client';

import React from 'react';

interface LogoLoaderProps {
  size?: number;
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LogoLoader({
  size = 56,
  text,
  fullScreen = false,
  className = '',
}: LogoLoaderProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      <style>{`
        @keyframes random-bounce {
          0%   { transform: translate(0px, 0px) rotate(0deg); }
          15%  { transform: translate(-12px, -20px) rotate(-6deg); }
          30%  { transform: translate(5px, 6px) rotate(2deg); }
          50%  { transform: translate(16px, -18px) rotate(7deg); }
          70%  { transform: translate(-8px, -2px) rotate(-3deg); }
          85%  { transform: translate(6px, -12px) rotate(4deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
        .animate-random-bounce {
          animation: random-bounce 3.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
      `}</style>
      
      <div 
        className="relative flex flex-col items-center justify-center"
        style={{ width: size, height: size * 1.13 }}
      >
        <div className="w-full h-full animate-random-bounce">
          <svg 
            viewBox="0 0 572 650" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-full h-full drop-shadow-xl"
          >
            <polygon points="298.0,637.5 297.0,533.5 409.5,466.0 395.5,452.0 391.0,452.5 297.0,506.5 296.5,331.0 448.5,244.0 449.0,357.5 470.0,362.5 559.0,311.5 559.5,485.0" fill="#fd8902" />
            <polygon points="274.0,638.5 11.5,485.0 11.5,181.0 21.0,182.5 100.5,229.0 101.5,362.0 122.5,356.0 123.0,242.5 275.5,332.0 274.5,507.0 180.0,452.5 161.5,466.0 274.5,533.0" fill="#59cb8f" />
            <polygon points="34.5,166.0 26.0,157.5 284.0,11.5 543.0,156.5 545.0,161.5 460.0,210.5 343.5,146.0 332.5,163.0 335.0,166.5 436.0,224.5 287.0,311.5 134.5,224.0 236.5,166.0 227.0,145.5 111.5,210.0" fill="#028b61" />
            <polygon points="472.0,334.5 470.5,230.0 555.0,180.5 558.5,181.0 558.0,284.5" fill="#028b61" />
          </svg>
        </div>
        
        <div className="absolute -bottom-5 w-3/4 h-2.5 bg-black/10 rounded-[100%] blur-[4px] animate-[pulse_3.2s_ease-in-out_infinite]" />
      </div>

      {text && (
        <p className="mt-7 text-[11px] font-black uppercase tracking-widest text-slate-500">
          {text}
        </p>
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

  // Inline page-level loader — centered vertically in available viewport height
  return (
    <div className="w-full flex items-center justify-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {content}
    </div>
  );
}
