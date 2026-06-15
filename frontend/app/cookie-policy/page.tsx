import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy | WorkforceOS',
  description: 'Information on cookie usage and local storage within WorkforceOS.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm">W</span>
          <span className="font-bold text-lg tracking-wider text-white">WorkforceOS</span>
        </div>
        <Link 
          id="back-home-link"
          href="/" 
          className="text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/30 px-3 py-1.5 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer"
        >
          Back to Portal
        </Link>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 space-y-8">
        <article className="space-y-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight border-b border-slate-800 pb-4">
            Cookie & Session Policy
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Last updated: June 15, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">1. Use of Local Storage & Cookies</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              WorkforceOS utilizes cookies and browser local storage (`localStorage`) to manage user session tokens and maintain authentication states. These tracking identifiers are essential for keeping you logged in as you navigate between the dashboard, attendance panel, leave workflows, and task boards.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">2. Essential Identifiers</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Our authentication cookies contain unique cryptographically secured credentials that authenticate your connection to the Node.js API backend. They are strictly temporary and are cleared upon logging out or session expiration.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">3. Third-Party Analytics</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              This enterprise platform does not deploy third-party advertising cookies or cross-site tracking scripts, guaranteeing the complete operational privacy of all organization activities.
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} WorkforceOS. All rights reserved. Enterprise Redesign Template.</p>
      </footer>
    </div>
  );
}
