'use client';

import React from 'react';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { LandingFooter } from '../../components/layout/LandingFooter';

export default function CookiePolicyPage() {
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
            Cookie & Session Storage Policy
          </h1>
          <p className="text-slate-400 text-xs font-semibold">
            Last updated: June 15, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">1. Essential Authentication Cookies</h2>
            <p className="text-slate-605 text-[15px] leading-relaxed">
              WorkforceOS utilizes secure session cookies to manage user logins. When you log into the portal, our Node.js API server issues a cryptographically signed JWT <code>token</code> cookie. 
            </p>
            <p className="text-slate-605 text-[15px] leading-relaxed">
              This cookie is essential for keeping you securely logged in as you navigate between different parts of the workspace, such as clocking in attendance, approving leave requests, or scoring tasks. Disabling this cookie will prevent access to the dashboard.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">2. Local Storage (`localStorage`) Caching</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              We utilize your browser's local storage to cache non-sensitive configuration settings, which optimizes rendering performance and limits API requests:
            </p>
            <ul className="list-disc pl-6 text-slate-600 text-[15px] space-y-2">
              <li>
                <strong>Active User Session:</strong> Caches basic identification metadata (such as full name, email, and user role) to render the navigation headers immediately without waiting for server checks.
              </li>
              <li>
                <strong>Layout Preferences:</strong> Caches settings like sidebar collapses, dashboard tables sorting preferences, and notifications panel states.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">3. Zero Third-Party Advertising Trackers</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              Because WorkforceOS is a professional B2B software application, we respect the absolute privacy of your company's data. 
            </p>
            <p className="text-slate-600 text-[15px] leading-relaxed font-semibold">
              We do not deploy third-party advertising cookies, retargeting social media pixels (e.g. Meta Pixel, LinkedIn Insight Tag), or cross-site tracking scripts. Your activity logs are strictly isolated within your organization boundaries.
            </p>
          </section>
        </article>
      </main>

      {/* Navigation Footer */}
      <LandingFooter />
    </div>
  );
}
