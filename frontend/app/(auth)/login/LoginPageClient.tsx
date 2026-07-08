'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth/AuthProvider';

function isInFlutterWebView(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).WorkforceOSBridge;
}

function sendBridge(msg: object) {
  if (typeof window === 'undefined') return;
  const bridge = (window as any).WorkforceOSBridge;
  if (bridge) bridge.postMessage(JSON.stringify(msg));
}

export default function LoginPageClient() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mobile-only biometric toggle state
  const [isMobile, setIsMobile] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    const mobile = isInFlutterWebView();
    setIsMobile(mobile);
    if (mobile) {
      setBiometricEnabled(localStorage.getItem('biometric_enabled') === 'true');
    }
  }, []);

  // ── Biometric toggle ────────────────────────────────────────────────────

  function handleToggle() {
    if (!biometricEnabled) {
      // Turning ON → show consent first
      setShowConsentModal(true);
    } else {
      // Turning OFF → no consent needed
      applyBiometricPref(false);
    }
  }

  function applyBiometricPref(enabled: boolean) {
    setBiometricEnabled(enabled);
    localStorage.setItem('biometric_enabled', enabled ? 'true' : 'false');
    // Tell Flutter so it persists to SharedPreferences
    sendBridge({ type: 'set_biometric_pref', enabled });
  }

  function onConsentAccept() {
    setShowConsentModal(false);
    applyBiometricPref(true);
  }

  // ── Password login ──────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('401') || errMsg.toLowerCase().includes('unauthorized') || errMsg.toLowerCase().includes('invalid credentials')) {
        setError('Invalid email or password. Please verify your credentials and try again.');
      } else if (errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('network')) {
        setError('Connection error. Please check your internet connection and try again.');
      } else {
        setError(errMsg || 'An unexpected error occurred. Please try again.');
      }
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans bg-surface">

      {/* Desktop hero */}
      <div className="relative hidden md:flex flex-col justify-between p-12 bg-slate-950 text-white overflow-hidden select-none">
        <img src="/login_hero.png" alt="Office" className="absolute inset-0 w-full h-full object-cover opacity-85" />
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
            Consolidate attendance, leaves, tasks, payroll, and assets into a single clean workspace.
          </p>
        </div>
        <div className="relative z-10 text-[11px] text-slate-400 font-semibold tracking-wider uppercase">
          WorkforceOS Management Platform
        </div>
      </div>

      {/* Sign-in panel */}
      <div className="w-full flex items-center justify-center p-8 lg:p-16 bg-white overflow-y-auto">
        <div className="max-w-md w-full space-y-6">

          {/* Logo (mobile only) */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <img src="/workforceoslogo.png" alt="Logo" className="h-12 w-12 object-contain rounded mb-4 block md:hidden" />
            <h1 className="text-headline-md font-bold text-on-surface">Sign In</h1>
            <p className="text-body-sm text-outline mt-1.5">Enter your credentials to access your dashboard</p>
          </div>

          {/* ── Biometric toggle (mobile WebView only) ─────────────────── */}
          {isMobile && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px] text-blue-600">fingerprint</span>
                  </div>
                  <div>
                    <p className="text-label-sm font-bold text-slate-900">Biometric Login</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {biometricEnabled
                        ? 'Next launch: fingerprint scan instead of password'
                        : 'Enable to skip password on next app open'}
                    </p>
                  </div>
                </div>
                {/* Slider */}
                <button
                  type="button"
                  onClick={handleToggle}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${biometricEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${biometricEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {biometricEnabled && (
                <p className="text-[11px] text-blue-600 mt-2.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Close the app and reopen it — fingerprint scan will appear.
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-error-container border border-error-container text-error rounded-xl text-body-sm">
              {error}
            </div>
          )}

          {/* Password form */}
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors flex items-center justify-center p-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px] select-none">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
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
          <p className="text-center text-[11px] text-slate-400">
            By signing in you agree to our{' '}
            <Link href="/terms-conditions" target="_blank" className="text-blue-500 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy-policy" target="_blank" className="text-blue-500 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* ── Biometric Consent Modal ───────────────────────────────────── */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-blue-600">fingerprint</span>
              </div>
            </div>
            <h3 className="text-center text-lg font-bold text-slate-900">Enable Biometric Login?</h3>
            <div className="text-sm text-slate-600 leading-relaxed space-y-2">
              <p>When enabled, the <strong>next time you open the app</strong> you will see a fingerprint scan prompt instead of this login form.</p>
              <ul className="list-disc pl-5 space-y-1 text-[13px]">
                <li>Your fingerprint is processed by Android's secure hardware — WorkforceOS never sees it.</li>
                <li>An authentication token is stored securely on your device.</li>
                <li>You can disable this at any time by toggling it off here.</li>
              </ul>
            </div>
            <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
              In accordance with the <strong>DPDP Act 2023</strong> — biometric data is Sensitive Personal Data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConsentModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={onConsentAccept}
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
