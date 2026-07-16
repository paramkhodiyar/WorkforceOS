import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { LandingFooter } from '../../components/layout/LandingFooter';

export const metadata: Metadata = {
  title: 'Pricing | WorkforceOS',
  description: 'Detailed WorkforceOS pricing for Startup, Growth, and Perpetual Enterprise plans.',
};

const plans = [
  {
    name: 'Startup Tier',
    price: '₹2,499',
    billing: '/ month',
    employees: 'Up to 15 employees',
    features: [
      'Core HR management',
      'Geofenced attendance',
      'Standard leave management',
      'Direct manager approvals',
      'Employee mobile app access',
    ],
  },
  {
    name: 'Growth Tier',
    price: '₹7,999',
    billing: '/ month',
    employees: 'Up to 50 employees',
    features: [
      'Everything in Startup',
      'Advanced payroll generation',
      'Performance reviews',
      'Expense claim auditing',
      'Shift configurations',
      'Priority email support',
    ],
    popular: true,
  },
  {
    name: 'Perpetual Enterprise',
    price: '₹24,999',
    billing: 'one-time',
    employees: 'Unlimited employees',
    features: [
      'Perpetual on-premise license',
      'Custom Active Directory sync',
      'Dedicated SLA support',
      'All advanced modules unlocked',
      'White-label options available',
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <LandingHeader />

      <main className="flex-1">
        <section className="pt-28 pb-16 md:pt-36 md:pb-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-[900px] mx-auto px-6 text-center">
            <span className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full mb-6">
              WorkforceOS Pricing
            </span>
            <h1 className="text-4xl md:text-[3.75rem] font-[800] tracking-tight leading-tight mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Simple plans for serious operations.
            </h1>
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Start with a 7-day trial, choose the plan that fits your current team, and scale when your workflows need more depth.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-[1120px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-7">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative border rounded-2xl p-8 flex flex-col justify-between ${
                  plan.popular ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-5 right-5 text-[10px] font-extrabold uppercase tracking-wider bg-blue-600 text-white px-3 py-1 rounded-full">
                    Popular
                  </span>
                )}
                <div>
                  <h2 className="text-xl font-extrabold mb-1">{plan.name}</h2>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">{plan.employees}</p>
                  <div className="flex items-baseline mb-7">
                    <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-slate-500 text-sm ml-2 font-semibold">{plan.billing}</span>
                  </div>
                  <ul className="space-y-3 border-t border-slate-200 pt-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-slate-650 leading-relaxed">
                        <span className="material-symbols-outlined text-[18px] text-blue-600 mt-0.5">done</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={plan.name === 'Perpetual Enterprise' ? '/contact' : '/#pricing'}
                  className={`mt-8 w-full py-3 rounded-xl text-center text-sm font-bold transition-colors ${
                    plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {plan.name === 'Perpetual Enterprise' ? 'Talk to founder' : 'Start 7-day trial'}
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
