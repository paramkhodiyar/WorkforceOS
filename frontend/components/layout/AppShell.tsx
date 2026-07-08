'use client';

import React from 'react';
import SideNavBar from './SideNavBar';
import TopNavBar from './TopNavBar';
import BottomNavBar from './BottomNavBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <SideNavBar />
      <div className="flex-1 flex flex-col md:pl-64">
        <TopNavBar />
        <main className="flex-1 pt-24 pb-16 md:pb-6 min-h-screen px-4 md:px-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <BottomNavBar />
    </div>
  );
}
