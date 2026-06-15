import React from 'react';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { LandingFooter } from '../../components/layout/LandingFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | WorkforceOS',
  description: 'Review the Terms and Conditions of service for WorkforceOS. Learn about our license boundaries, GPS verification for shifts, session security, API rate limits, and calculation liability disclaimers.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-900">
      {/* Navigation Header */}
      <LandingHeader />

      {/* Main Document Content */}
      <main className="flex-1 max-w-[720px] w-full mx-auto px-6 pt-28 pb-16 space-y-8">
        <article className="space-y-6">
          <h1 
            className="text-3xl font-[800] text-slate-900 tracking-tight border-b border-slate-200 pb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Terms & Conditions of Service
          </h1>
          <p className="text-slate-400 text-xs font-semibold">
            Last updated: June 15, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">1. Scope & License Authorization</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              These terms govern the use of the WorkforceOS HRMS software, including shift attendance checkers, leave double-approval forms, task lifecycle dashboards, OKR modules, expense sheets, and calculated payroll tools.
            </p>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Access is provided under license configurations purchased by the employer organization. All user registrations and role permissions (Admin, HR, Manager, Finance, Employee) are defined and managed under the organization administrator's control.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">2. Attendance Verification & GPS Coordinates</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              When using WorkforceOS to record shift check-ins and check-outs, you must provide accurate, real-time data.
            </p>
            <p className="text-slate-650 text-[14px] leading-relaxed border-l-4 border-amber-500 pl-4 bg-amber-50/20 py-2">
              <strong>CRITICAL AUDIT NOTICE:</strong> Falsifying attendance check-ins, spoofing GPS location coordinates, or using automation scripts to clock in remotely when designated for WFO shifts violates workplace compliance regulations. Any detected geo-spoofing is flagged immediately, blocked by the system, and logged in the organization's immutable audit log.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">3. Credentials & Session Security</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Users must secure their login credentials. Upon receiving a temporary password via HR, employees are required to update their password immediately during their initial login sequence. Accounts are personal and must not be shared. WorkforceOS rotates JWT session tokens periodically; attempts to bypass auth middleware or access raw API routes will result in session termination and IP logging.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">4. API Rate Limits & Usage Conduct</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              To guarantee service stability, WorkforceOS enforces global <strong>Redis-backed sliding window rate limiters</strong>. You agree not to deploy scrapers, automated bot crawlers, or scripting requests targeting our API routers. Flooding the servers with requests will trigger automatic security blocks.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">5. Limitation of Liability</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              WorkforceOS provides calculators for Indian statutory tax bands (PF, ESIC, Professional Tax, TDS deductions). While we perform updates according to Indian statutory slab configurations, the organization must verify payroll outputs prior to executing actual payouts. WorkforceOS is not liable for errors in calculations arising from incorrect configurations set by organization administrators.
            </p>
          </section>
        </article>
      </main>

      {/* Navigation Footer */}
      <LandingFooter />
    </div>
  );
}
