import React from 'react';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { LandingFooter } from '../../components/layout/LandingFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | WorkforceOS',
  description: 'Read our Privacy & Data Security Policy. Understand how we protect employee profile data, secure bank detail calculations using AES-256 field-level encryption, and log activity in an immutable audit ledger.',
};

export default function PrivacyPage() {
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
            Privacy & Data Security Policy
          </h1>
          <p className="text-slate-400 text-xs font-semibold">
            Last updated: June 15, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">1. Information Collected & Encryption Protocols</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              WorkforceOS is a modular HRMS platform that processes human resources, compliance, and payroll records on behalf of your employer (the subscribing Organization). We collect and store:
            </p>
            <ul className="list-disc pl-6 text-slate-600 text-[15px] space-y-2">
              <li>
                <strong>Employee Profiles & Identifiers:</strong> Legal names, corporate emails, emergency contact logs, PAN numbers, and Aadhaar numbers.
              </li>
              <li>
                <strong>Encrypted Bank & Financial Data:</strong> Employee bank accounts, IFC codes, and salary details are strictly subjected to hardware-accelerated <strong>AES-256-GCM field-level encryption</strong> before being committed to our PostgreSQL database, securing them against unauthorized read access.
              </li>
              <li>
                <strong>Shift Attendance Logs:</strong> GPS coordinates and client IP addresses captured during Office (WFO) or Remote (WFH) shift check-ins to prevent time spoofing, alongside logs of individual break durations.
              </li>
              <li>
                <strong>Performance & Task History:</strong> Task assignments, lifecycle state transitions, quality ratings, peer reviews, and qualitative HR evaluations.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">2. Processing Scope & Access Control</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Data processing is strictly confined to the operations of the subscribing organization. We utilize your data to calculate monthly payrolls (incorporating LOP absent rules and Indian statutory calculations), verify leave double-approval structures, track OKR progress, and log audit entries. 
            </p>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              All views and endpoints are guarded by a robust <strong>Role-Based Access Control (RBAC)</strong> middleware layer, ensuring that sensitive data such as salary slips, audit logs, and employee profiles are accessible only to authorized Org Admins or HR Managers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">3. Immutable Auditing & Zero Data Sharing</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              WorkforceOS does not share, lease, or sell organization databases or individual attendance histories to third-party data analytics or advertising companies.
            </p>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Every data creation, modification, or deletion is recorded in our <strong>immutable Audit Log</strong>, documenting the actor ID, timestamp, before/after values, and IP address. This log cannot be deactivated or cleared by organization administrators, guaranteeing compliance and data traceability.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">4. Retention & Deletion Rights</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Organization databases are isolated. Deletion requests for specific employee profiles, credentials, or audit tracks must be directed to your organization administrator. Upon license expiration or termination, all isolated database instances are soft-deleted immediately and permanently wiped from our server backups within 30 days.
            </p>
          </section>
        </article>
      </main>

      {/* Navigation Footer */}
      <LandingFooter />
    </div>
  );
}
