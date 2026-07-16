import React from 'react';
import LogoLoader from '@/components/ui/LogoLoader';

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <LogoLoader size={96} />
    </div>
  );
}
