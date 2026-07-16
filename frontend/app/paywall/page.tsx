'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { api } from '../../lib/api/client';
import LogoLoader from '../../components/ui/LogoLoader';

const PLANS = [
  {
    id: 'STARTUP',
    name: 'Startup Tier',
    price: 2499,
    employees: 'Up to 15 Employees',
    features: [
      'Core HR Management',
      'Geofenced Attendance',
      'Standard Leave Management',
      'Direct Manager Approvals',
      'Mobile App Access (Employee view)',
    ],
    cta: 'Select Startup',
  },
  {
    id: 'GROWTH',
    name: 'Growth Tier',
    price: 7999,
    employees: 'Up to 50 Employees',
    features: [
      'Everything in Startup',
      'Advanced Payroll Generation',
      'Performance Reviews',
      'Expense Claim Auditing',
      'Shift Configurations',
      'Priority Email Support',
    ],
    cta: 'Select Growth',
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Perpetual Enterprise',
    price: 24999,
    employees: 'Unlimited Employees',
    features: [
      'Perpetual On-Premise License',
      'Custom Active Directory (AD) sync',
      'Dedicated SLA Support',
      'All Advanced Modules Unlocked',
      'White-label options available',
    ],
    cta: 'Contact for perpetual license',
    enterprise: true,
  },
];

export default function PaywallPage() {
  const { organization, refetchUser, logout } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<any>(PLANS[1]); // Default to Growth
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Generate dynamic UPI payload link
  const payeeUPI = '9875413483@upi';
  const payeeName = 'WorkforceOS Technologies';
  const note = `WorkforceOS ${selectedPlan.name} Subscription`;
  const upiUrl = `upi://pay?pa=${payeeUPI}&pn=${encodeURIComponent(payeeName)}&am=${selectedPlan.price}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (utr.trim().length !== 12 || !/^\d+$/.test(utr.trim())) {
      setError('A valid UPI UTR must be exactly 12 digits.');
      setLoading(false);
      return;
    }

    try {
      await api.organization.verifyUpi({
        utr: utr.trim(),
        tier: selectedPlan.id,
      });
      setSuccess(true);
      // Wait 1.5 seconds for UX, then reload user details to unlock access
      setTimeout(async () => {
        await refetchUser();
        window.location.href = '/onboarding/setup';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the UTR and try again.');
    } finally {
      setLoading(false);
    }
  }



  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans p-6">
        <div className="max-w-md w-full text-center space-y-6 animate-pulse">
          <div className="h-16 w-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <span className="material-symbols-outlined text-[36px] text-white">check</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Payment Registered!</h2>
          <p className="text-slate-400 text-sm">
            Thank you for subscribing. We are initializing your clean database slate and unlocking your organization.
          </p>
          <div className="flex justify-center">
            <LogoLoader size={60} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col lg:flex-row">
      {/* Sidebar: Plans & Tier selection */}
      <div className="lg:w-2/3 p-8 lg:p-16 flex flex-col justify-between space-y-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/workforceoslogo.png" alt="Logo" className="h-8 w-8 object-contain rounded" />
            <span className="text-lg font-bold tracking-wider uppercase text-slate-100">WorkforceOS</span>
          </div>
          <button
            onClick={logout}
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
            Trial Expired
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Unlock premium workspace access.
          </h1>
          <p className="text-slate-400 max-w-xl text-body-sm">
            Your 7-day trial of WorkforceOS has ended. Select a plan below to activate your account and start importing your team structure.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => !plan.enterprise && setSelectedPlan(plan)}
              className={`relative border rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                selectedPlan.id === plan.id
                  ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/10 scale-[1.02]'
                  : plan.enterprise
                  ? 'border-slate-800 bg-slate-900/10 hover:border-slate-700'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 text-[10px] font-bold uppercase tracking-wider bg-blue-500 text-white px-2.5 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              {plan.enterprise && (
                <span className="absolute -top-3 left-6 text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white px-2.5 py-1 rounded-full">
                  One-time Buy
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-slate-200">{plan.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">{plan.employees}</p>
                </div>

                <div className="flex items-baseline">
                  <span className="text-3xl font-extrabold">₹{plan.price.toLocaleString()}</span>
                  <span className="text-slate-500 text-xs ml-1">{plan.enterprise ? '' : '/month'}</span>
                </div>

                <ul className="space-y-2 pt-2 border-t border-slate-900">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">done</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                {plan.enterprise ? (
                  <a
                    href={`mailto:support@workforceos.com?subject=Enterprise perpetual license request&body=Hi, I am interested in purchasing the WorkforceOS Perpetual Enterprise License for my organization.`}
                    className="w-full py-2.5 text-center text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all inline-block"
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <button
                    className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all ${
                      selectedPlan.id === plan.id
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paywall QR Code Checkout */}
      <div className="lg:w-1/3 bg-slate-900 border-l border-slate-800 p-8 lg:p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight">Scan to Pay</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Scan this QR code with any UPI app (GPay, PhonePe, Paytm) to transfer the amount instantly.
            </p>
          </div>

          {/* QR code box */}
          <div className="bg-white p-4 rounded-3xl w-64 h-64 flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden group">
            <img src={qrCodeUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-center space-y-1">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Payee UPI VPA</p>
            <p className="text-sm font-bold text-slate-200 font-mono">{payeeUPI}</p>
            <p className="text-xs text-blue-400 font-semibold pt-1">Amount: ₹{selectedPlan.price.toLocaleString()}</p>
          </div>

          {/* UTR Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-1.5">
                12-Digit Transaction UTR
              </label>
              <input
                type="text"
                placeholder="Enter 12-digit transaction ID"
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:bg-slate-950 rounded-xl text-sm transition-all focus:ring-1 focus:ring-blue-500 font-mono text-center"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying Transaction...
                </>
              ) : (
                'Confirm & Unlock Workspace'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
