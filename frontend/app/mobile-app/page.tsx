import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { LandingFooter } from '../../components/layout/LandingFooter';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Mobile App | WorkforceOS',
  description: 'Try the functionally ready WorkforceOS Android APK. iOS is currently in development.',
};

const phoneFeatures = [
  { icon: 'fingerprint', label: 'Biometric login' },
  { icon: 'location_on', label: 'Geo attendance' },
  { icon: 'task_alt', label: 'Task workflows' },
  { icon: 'payments', label: 'Payslip access' },
];

export default function MobileAppPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <LandingHeader />

      <main className="flex-1">
        <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full mb-6">
                Android Ready
              </span>
              <h1 className="text-4xl md:text-[3.5rem] font-[800] tracking-tight leading-tight mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Mobile HR workflows, ready for Android teams.
              </h1>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
                WorkforceOS Android is functionally ready as an APK. It supports login, attendance, leave, tasks, payroll views, and native mobile authentication. The iOS app is currently in development.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                {[
                  'Built for field and office attendance',
                  'Optimized for employee self-service',
                  'Works with the same WorkforceOS backend',
                  'APK available while store listings are prepared',
                ].map((item) => (
                  <div key={item} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600 text-[20px]">check_circle</span>
                    <span className="text-sm font-semibold text-slate-700 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-[390px]">
              <div className="rounded-[44px] border-[12px] border-slate-900 bg-slate-900 shadow-sm p-2">
                <div className="bg-white rounded-[32px] min-h-[650px] overflow-hidden flex flex-col">
                  <div className="h-8 bg-white flex items-center justify-center">
                    <div className="h-4 w-28 rounded-full bg-slate-900"></div>
                  </div>

                  <div className="px-5 pb-5 flex-1 flex flex-col">
                    <div className="border-b border-slate-100 pb-5">
                      <Link href="/" className="inline-flex items-center gap-2 text-[11px] font-bold text-blue-600 mb-5">
                        <span className="material-symbols-outlined text-[16px]">arrow_back_ios</span>
                        WorkforceOS
                      </Link>
                      <div className="flex gap-4 items-center">
                        <div className="h-24 w-24 rounded-[22px] bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                          <Image
                            src="/workforceoslogo.png"
                            alt="WorkforceOS Logo"
                            width={70}
                            height={70}
                            className="object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-2xl font-black tracking-tight leading-tight">WorkforceOS</h2>
                          <p className="text-sm text-slate-500 font-semibold mt-1">HRMS & Operations</p>
                          <p className="text-xs text-blue-600 font-extrabold mt-2 uppercase tracking-wider">Android APK</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 text-center py-5 border-b border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Version</p>
                        <p className="text-sm font-extrabold mt-1">1.0.0</p>
                      </div>
                      <div className="border-x border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Size</p>
                        <p className="text-sm font-extrabold mt-1">45.6 MB</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                        <p className="text-sm font-extrabold mt-1">Ready</p>
                      </div>
                    </div>

                    <div className="py-5">
                      <h3 className="text-sm font-black mb-3">Included on mobile</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {phoneFeatures.map((feature) => (
                          <div key={feature.label} className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                            <span className="material-symbols-outlined text-blue-600 text-[22px] block mb-2">{feature.icon}</span>
                            <p className="text-[11px] font-extrabold text-slate-700 leading-tight">{feature.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto space-y-3">
                      <a
                        href="/downloads/workforceos-release.apk"
                        download
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[19px]">download</span>
                        Download APK
                      </a>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center gap-1.5 opacity-60">
                          <span className="material-symbols-outlined text-[15px] text-slate-400">shop</span>
                          <span className="text-[10px] font-bold text-slate-500">Play Store soon</span>
                        </div>
                        <div className="h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center gap-1.5 opacity-60">
                          <span className="material-symbols-outlined text-[15px] text-slate-400">phone_iphone</span>
                          <span className="text-[10px] font-bold text-slate-500">iOS in dev</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
