import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Disclaimer | WorkforceOS',
  description: 'Legal disclaimer for the WorkforceOS Enterprise Management Platform.',
};

export default function DisclaimerPage() {
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
            Legal Disclaimer
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Last updated: June 15, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">1. General Information</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              The information provided by WorkforceOS ("we", "us", or "our") on this platform is for general informational and enterprise operations management purposes only. All information is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">2. Professional & Legal Advice</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              This platform does not contain legal, financial, tax, or professional human resources advice. The payroll, statutory deduction calculations (including PF, ESIC, and Professional Tax), and attendance policy rules are configured based on typical templates and specific user inputs. They should not be relied upon without verification from certified financial or human resources professionals.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">3. System Downtime & Data Loss</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Under no circumstance shall we have any liability to you for any loss or damage of any kind incurred as a result of the use of the platform or reliance on any information provided. Your use of the platform and your reliance on any information is solely at your own risk.
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
