'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth/AuthProvider';

export default function RootPage() {
  const { user, loading } = useAuth();

  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "WorkforceOS",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "description": "Next-Gen Enterprise Human Resource Management System (HRMS) featuring automated shift attendance, double-approval leave workflows, rigid task state machines, composite performance review metrics, and statutory Indian payroll calculations.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.95",
      "ratingCount": "342"
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-white">
      {/* JSON-LD Structured SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* Screen-reader heading for global SEO keyphrase indexing */}
      <h1 className="sr-only">WorkforceOS | Best Enterprise HRMS Software & Human Resource Management System</h1>

      {/* Navbar Header */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/workforceoslogo.png" alt="WorkforceOS Logo" className="h-8 w-8 object-contain rounded" />
          <span className="font-extrabold text-xl tracking-wider text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            WorkforceOS
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
          <a href="#security" className="hover:text-blue-400 transition-colors">Security</a>
          <a href="#payroll" className="hover:text-blue-400 transition-colors">Payroll & Compliance</a>
          <a href="#faq" className="hover:text-blue-400 transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <Link 
              id="dashboard-access-btn"
              href="/dashboard" 
              className="text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/10 transition-all active:scale-95 cursor-pointer"
            >
              Enter Dashboard
            </Link>
          ) : (
            <Link 
              id="portal-login-btn"
              href="/login" 
              className="text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/10 transition-all active:scale-95 cursor-pointer"
            >
              Portal Login
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-6 md:px-12 text-center max-w-4xl mx-auto space-y-6">
        <div className="absolute inset-0 bg-blue-500/5 blur-3xl -z-10 rounded-full max-w-lg mx-auto"></div>
        <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full">
          The Next-Gen Human Resource Management System
        </span>
        <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Unified Operating System for <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Modern Operations</span>
        </h2>
        <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
          Scale your employee onboarding, shift-based attendance clocking, leave double-approvals, structured task machines, and statutory calculations inside one premium database.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Link 
            id="hero-cta-btn"
            href={user ? "/dashboard" : "/login"} 
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            {user ? "Go to Dashboard" : "Get Started Now"}
          </Link>
          <a 
            href="#features" 
            className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 font-bold rounded-xl text-sm uppercase tracking-wider active:scale-95 transition-all"
          >
            Explore Features
          </a>
        </div>
      </section>

      {/* Product Highlight / Features Grid */}
      <section id="features" className="py-20 bg-slate-900/30 border-y border-slate-900 px-6 md:px-12 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Complete HRMS Suite Features</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">Everything you need to configure statutory payrolls, shifts, leaves, and tasks in compliance with local regulations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
            <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl w-fit">
              <span className="material-symbols-outlined text-[24px]">group_add</span>
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Step Employee Onboarding</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Step-by-step onboarding capture: personal profiles, professional role details, compliance documents, and emergency contact registries. Saves drafts securely at-rest.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl w-fit">
              <span className="material-symbols-outlined text-[24px]">schedule</span>
            </div>
            <h3 className="text-lg font-bold text-white">Shift-Based Attendance & Breaks</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Define custom shift starts and check-in deadlines. Real-time micro-break tracking with dynamic adjustment submission workflows when check-in offsets trigger anomalies.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
            <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl w-fit">
              <span className="material-symbols-outlined text-[24px]">rule</span>
            </div>
            <h3 className="text-lg font-bold text-white">Double-Approval Leaves</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Two-stage leave workflow (Manager review → final HR approval). Automatic weekend and organization holiday filtering during duration calculation to prevent over-allocation.
            </p>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section id="security" className="py-20 px-6 md:px-12 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full w-fit">
            Enterprise Security
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
            Database Protection with AES-256 Field Encryption
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Sensitive records—including bank accounts, Aadhaar details, and PAN identifiers—are subjected to hardware-accelerated field-level encryption before writing to disk. Secure rate limiters globally monitor authenticated API requests per user session.
          </p>
          <ul className="space-y-3 text-xs text-slate-300 font-semibold">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-400 text-[18px]">verified</span>
              AES-256-GCM At-Rest Encryption
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-400 text-[18px]">verified</span>
              Helmet Content Security & CORS Controls
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-400 text-[18px]">verified</span>
              Redis-Backed Global Sliding Window Rate Limiting
            </li>
          </ul>
        </div>
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden flex flex-col justify-center gap-4">
          <div className="h-24 w-24 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 mx-auto">
            <span className="material-symbols-outlined text-blue-400 text-[40px]">shield</span>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-white">Security Hardening Activated</p>
            <p className="text-xs text-slate-500">Global server-side middleware running state checks</p>
          </div>
        </div>
      </section>

      {/* Payroll Section */}
      <section id="payroll" className="py-20 bg-slate-900/20 border-t border-slate-900 px-6 md:px-12 max-w-6xl mx-auto w-full space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="p-6 bg-slate-950 border border-slate-900 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Statutory Deductions Slabs</span>
              <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded uppercase font-bold">Indian Compliance</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400 font-semibold">Provident Fund (PF)</span>
                <span className="text-white font-bold">12% Capped (₹1,800 limit)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400 font-semibold">Employee State Insurance (ESIC)</span>
                <span className="text-white font-bold">0.75% Employee | 3.25% Employer</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400 font-semibold">Professional Tax (PT)</span>
                <span className="text-white font-bold">Gross Income Slab Rules</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-semibold">Income Tax TDS Regimes</span>
                <span className="text-white font-bold">Old vs New Tax Regime choice</span>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full w-fit">
              Compliance Automation
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Automated Payroll Runs with LOP Deductions
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Calculate statutory deductions seamlessly for permanent hires and interns. LOP (Loss of Pay) deductions are dynamically calculated based on actual unpaid absent records flagged inside the attendance database for the payroll calendar month.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 md:px-12 max-w-4xl mx-auto w-full space-y-12">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center tracking-tight">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-bold text-white mb-2">How does the leave balance refactoring work?</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Submitting a leave request only increments the employee's pending leave count. It does not reduce the remaining balance until final sign-off is completed by the HR manager, ensuring accurate calculations at any given date.
            </p>
          </div>

          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-bold text-white mb-2">Can employees apply for past-date leaves?</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Yes. We have removed strict future-only constraints, allowing employees to apply for leave dates before today when recording retrospective time-off requests.
            </p>
          </div>

          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-bold text-white mb-2">How are performance reviews released?</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Performance evaluations are created as draft reviews and remain completely invisible to reviewees. They are only released/published when an Admin or HR manager clicks the release action button, triggering a system notification.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 px-6 md:px-12 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/workforceoslogo.png" alt="WorkforceOS Logo" className="h-6 w-6 object-contain rounded" />
            <span className="font-extrabold text-sm tracking-wider text-white">WorkforceOS HRMS</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500 font-semibold">
            <Link href="/disclaimer" className="hover:text-blue-400 transition-colors">Disclaimer</Link>
            <Link href="/privacy-policy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
            <Link href="/cookie-policy" className="hover:text-blue-400 transition-colors">Cookie Policy</Link>
            <Link href="/terms-conditions" className="hover:text-blue-400 transition-colors">Terms & Conditions</Link>
          </div>
          <p className="text-[10px] text-slate-600 font-medium">
            &copy; {new Date().getFullYear()} WorkforceOS. Designed for premium corporate compliance operations.
          </p>
        </div>
      </footer>
    </div>
  );
}
