import React from 'react';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { LandingFooter } from '../../components/layout/LandingFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compliance & Payroll Disclaimer | WorkforceOS',
  description: 'Compliance and statutory payroll calculations disclaimer. WorkforceOS provides automated calculations for Indian compliance, to be verified by subscribing organizations.',
};

export default function DisclaimerPage() {
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
            Compliance & Payroll Disclaimer
          </h1>
          <p className="text-slate-400 text-xs font-semibold">
            Last updated: June 15, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">1. Not Legal or Certified Financial Advice</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              WorkforceOS provides software engines designed to assist organizations in tracking attendance, managing leave limits, rating performance, and calculating salaries. The platform, its codebases, calculations, and descriptive articles do not constitute certified financial, legal, CA (Chartered Accountant), or professional tax advice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">2. Statutory Deductions & Tax Slabs Accuracy</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Our payroll systems process Indian statutory deductions—including Provident Fund (PF) calculations subject to ₹1,800 thresholds, Employee State Insurance (ESIC) rates, state-level Professional Tax (PT) parameters, and TDS slabs. 
            </p>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Calculations are dependent on the organizational parameters, salary bands, and settings configured by your administrator. Subscribing organizations are strictly responsible for conducting complete audit checks on all salary register calculations before scheduling payouts or executing bank transfers. We make no warranties regarding complete liability for manual input config mismatches.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">3. Shift Clocks & Automated CRON Actions</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Attendance calculations (such as late deductions, break tracking, and automatic nightly absent marks) are managed by automated CRON scripts based on the ShiftConfig parameters (including grace margins) defined by the organization. WorkforceOS is not liable for LOP salary losses resulting from employees failing to check-in properly or submit timely double-approval adjustment requests.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">4. Performance Scorecard Evaluations</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              The composite performance scores (calculated from task ratios, quality reviews, deadline logs, and qualitative HR points) are mathematical models running on weights chosen by the organization. They represent general metric indexes for management decision-support, not binding recommendations.
            </p>
          </section>
        </article>
      </main>

      {/* Navigation Footer */}
      <LandingFooter />
    </div>
  );
}
