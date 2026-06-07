'use client';

import React from 'react';
import SideNavBar from './SideNavBar';
import TopNavBar from './TopNavBar';
import BottomNavBar from './BottomNavBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <SideNavBar />
      <div className="flex-1 flex flex-col md:pl-60">
        <TopNavBar />
        <main className="flex-1 pt-16 pb-16 md:pb-0 min-h-screen px-6 py-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <BottomNavBar />
    </div>
  );
}
