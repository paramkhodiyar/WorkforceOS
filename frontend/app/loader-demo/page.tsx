'use client';

import React, { useState } from 'react';
import LogoLoader from '../../components/ui/LogoLoader';

export default function LoaderDemoPage() {
  const [loaderSize, setLoaderSize] = useState<number>(80);
  const [loaderText, setLoaderText] = useState<string>('Loading WorkforceOS...');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative p-6">
      {/* Top Floating Control Bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-lg rounded-2xl p-3 flex flex-wrap items-center gap-3 z-50 text-xs font-bold text-slate-800">
        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Loader Demo Controls:</span>
        
        <button
          onClick={() => setLoaderText('Loading WorkforceOS...')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
        >
          Default Text
        </button>

        <button
          onClick={() => setLoaderText('Authenticating Session...')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
        >
          Auth Text
        </button>

        <button
          onClick={() => setLoaderText('Processing Payroll & Telemetry...')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
        >
          Payroll Text
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <span className="text-[10px] text-slate-400">Size:</span>
          <button
            onClick={() => setLoaderSize(60)}
            className={`px-2 py-1 rounded-lg ${loaderSize === 60 ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
          >
            60px
          </button>
          <button
            onClick={() => setLoaderSize(80)}
            className={`px-2 py-1 rounded-lg ${loaderSize === 80 ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
          >
            80px
          </button>
          <button
            onClick={() => setLoaderSize(100)}
            className={`px-2 py-1 rounded-lg ${loaderSize === 100 ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
          >
            100px
          </button>
        </div>
      </div>

      {/* Main Centered Loader Component */}
      <div className="flex-1 flex items-center justify-center w-full">
        <LogoLoader size={loaderSize} text={loaderText} />
      </div>
    </div>
  );
}
