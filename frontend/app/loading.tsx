import React from 'react';
import LogoLoader from '../components/ui/LogoLoader';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-slate-50">
      <LogoLoader size={80} text="Loading WorkforceOS..." />
    </div>
  );
}
