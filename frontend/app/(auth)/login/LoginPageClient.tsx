'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth/AuthProvider';

// Detect if running inside the Flutter WebView bridge
function isNativeMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).WorkforceOSBridge;
}

export default function LoginPageClient() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Biometric state — only relevant when running inside the Flutter WebView
  const [isMobile, setIsMobile] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasStoredSession, setHasStoredSession] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [showBioConsent, setShowBioConsent] = useState(false);

  useEffect(() => {
    const mobile = isNativeMobile();
    setIsMobile(mobile);
    if (mobile) {
      const saved = localStorage.getItem('biometric_enabled') === 'true';
      const hasToken = !!localStorage.getItem('token');
      setBiometricEnabled(saved);
      setHasStoredSession(hasToken);
    }
  }, []);

  function toggleBiometric() {
    if (!biometricEnabled) {
      // Show consent before enabling
      setShowBioConsent(true);
      return;
    }
    // Disabling — no consent needed
    setBiometricEnabled(false);
    localStorage.setItem('biometric_enabled', 'false');
    if ((window as any).WorkforceOSBridge) {
      (window as any).WorkforceOSBridge.postMessage(
        JSON.stringify({ type: 'set_biometric_pref', enabled: false })
      );
    }
  }

  function confirmBioConsent() {
    setShowBioConsent(false);
    setBiometricEnabled(true);
    localStorage.setItem('biometric_enabled', 'true');
    if ((window as any).WorkforceOSBridge) {
      (window as any).WorkforceOSBridge.postMessage(
        JSON.stringify({ type: 'set_biometric_pref', enabled: true })
      );
    }
  }

  function triggerBiometric() {
    if (!(window as any).WorkforceOSBridge) return;
    setBioLoading(true);
    // Ask Flutter to run biometric auth → Flutter will inject token + redirect
    (window as any).WorkforceOSBridge.postMessage(
      JSON.stringify({ type: 'trigger_biometric' })
    );
    // If Flutter doesn't respond (no stored session), reset after 5s
    setTimeout(() => setBioLoading(false), 5000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      // After login, mark that a session exists for biometric bypass
      if (isMobile) setHasStoredSession(true);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans bg-surface">
      {/* Desktop Hero Panel */}
      <div className="relative hidden md:flex flex-col justify-between p-12 bg-slate-950 text-white overflow-hidden select-none">
        <img
          src="/login_hero.png"
          alt="Office space"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-slate-950/20" />

        <div className="relative z-10 flex items-center gap-3">
          <img src="/workforceoslogo.png" alt="Logo" className="h-8 w-8 object-contain rounded" />
          <span className="text-lg font-bold tracking-wider uppercase">WorkforceOS</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            The modern operating system for your enterprise team.
          </h2>
          <p className="mt-4 text-slate-200 text-body-sm leading-relaxed">
            Consolidate your attendance, leaves, task boards, payroll, and assets into a single clean workspace.
          </p>
        </div>

        <div className="relative z-10 text-[11px] text-slate-400 font-semibold tracking-wider uppercase">
          WorkforceOS Management Platform
        </div>
      </div>

      {/* Sign In Form */}
      <div className="w-full flex items-center justify-center p-8 lg:p-16 bg-white overflow-y-auto">
        <div className="max-w-md w-full space-y-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <img
              src="/workforceoslogo.png"
              alt="Logo"
              className="h-12 w-12 object-contain rounded mb-4 block md:hidden"
            />
            <h1 className="text-headline-md font-bold text-on-surface">Sign In</h1>
            <p className="text-body-sm text-outline mt-1.5">Enter your credentials to access your dashboard</p>
          </div>

          {/* ── Biometric Section (mobile-only) ──────────────────────── */}
          {isMobile && (
            <div className="space-y-4">
              {/* Toggle row */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px] text-blue-600">fingerprint</span>
                  </div>
                  <div>
                    <p className="text-label-sm font-bold text-slate-900">Biometric Login</p>
                    <p className="text-[11px] text-slate-500">Use fingerprint instead of password</p>
                  </div>
                </div>
                {/* Slider toggle */}
                <button
                  type="button"
                  onClick={toggleBiometric}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                    biometricEnabled ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${
                      biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Fingerprint button — only shown when biometric is ON + session exists */}
              {biometricEnabled && hasStoredSession && (
                <button
                  type="button"
                  onClick={triggerBiometric}
                  disabled={bioLoading}
                  className="w-full py-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all flex flex-col items-center gap-2 active:scale-[0.98] disabled:opacity-60"
                >
                  {bioLoading ? (
                    <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[40px] text-blue-600">fingerprint</span>
                  )}
                  <span className="text-label-sm font-bold text-blue-700">
                    {bioLoading ? 'Waiting for scan...' : 'Login with Fingerprint'}
                  </span>
                </button>
              )}

              {biometricEnabled && !hasStoredSession && (
                <p className="text-[11px] text-center text-slate-500 -mt-2">
                  Sign in once with your password to enable fingerprint login next time.
                </p>
              )}

              {biometricEnabled && hasStoredSession && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">or sign in with password</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              )}
            </div>
          )}
          {/* ─────────────────────────────────────────────────────────── */}

          {error && (
            <div className="p-4 bg-error-container border border-error-container text-error rounded-xl text-body-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-md font-bold transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 cursor-pointer block text-center"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Legal footer */}
          <p className="text-center text-[11px] text-slate-400 mt-4">
            By signing in you agree to our{' '}
            <Link href="/terms-conditions" target="_blank" className="text-blue-500 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy-policy" target="_blank" className="text-blue-500 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* Biometric Consent Modal */}
      {showBioConsent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-blue-600">fingerprint</span>
              </div>
            </div>
            <h3 className="text-center text-lg font-bold text-slate-900">Enable Biometric Login?</h3>
            <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
              <p>By enabling biometric login, you consent to the following:</p>
              <ul className="list-disc pl-5 space-y-1 text-[13px]">
                <li>Your device's fingerprint sensor will be used to authenticate you on future logins.</li>
                <li><strong>WorkforceOS does not store or transmit your fingerprint data.</strong> Scanning is handled entirely by Android's secure enclave.</li>
                <li>An authentication token is stored securely on your device. This token is cleared when you sign out.</li>
                <li>You may disable biometric login at any time from this screen.</li>
              </ul>
            </div>
            <p className="text-[11px] text-slate-400 border-t pt-3">
              This consent is in accordance with the <strong>DPDP Act 2023</strong> and IT Rules 2011 (India).
              Biometric data is classified as Sensitive Personal Data.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowBioConsent(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBioConsent}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
              >
                I Consent & Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
