import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | WorkforceOS',
  description: 'Privacy Policy details for data security on WorkforceOS.',
};

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Last updated: June 15, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">1. Data We Collect</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              We collect information necessary to operate your organization's HR workflows, including employee onboarding profiles, work email, encrypted bank account numbers, PAN cards, attendance timestamps, check-in locations, and performance scores. Sensitive financial elements are strictly encrypted at-rest using AES-256-GCM encryption.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">2. How We Use Data</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              We process data to calculate monthly payrolls, manage task lists, approve leave allocations, verify check-in deadlines, and provide leaderboard indices. Access to this data is governed strictly by the Role-Based Access Control (RBAC) permission parameters configured by your organization's administrator.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">3. Third-Party Sharing</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              WorkforceOS does not sell, lease, or share individual employee profiles or attendance logs with third-party tracking services. Data is only accessible to authenticated organization leaders and verified administrative personnel.
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
