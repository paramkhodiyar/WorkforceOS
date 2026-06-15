'use client';

import React, { useState } from 'react';
import { useAuth, SEED_USERS } from '../../../lib/auth/AuthProvider';

export default function LoginPageClient() {
  const { login, quickLogin, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    }
  }

  async function handleQuickLogin(seedEmail: string) {
    setError('');
    try {
      await quickLogin(seedEmail);
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans bg-surface">
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

      <div className="w-full flex items-center justify-center p-8 lg:p-16 bg-white overflow-y-auto">
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <img 
              src="/workforceoslogo.png" 
              alt="Logo" 
              className="h-12 w-12 object-contain rounded mb-4 block md:hidden"
            />
            <h1 className="text-headline-md font-bold text-on-surface">Sign In</h1>
            <p className="text-body-sm text-outline mt-1.5">Enter your credentials to access your organization dashboard</p>
          </div>

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

          <div className="border-t border-slate-100 pt-6">
            <p className="text-[10px] text-outline font-bold uppercase tracking-wider text-center md:text-left mb-4">Development Quick Login</p>
            <div className="grid grid-cols-2 gap-3">
              {SEED_USERS.map((seed) => (
                <button
                  key={seed.email}
                  type="button"
                  onClick={() => handleQuickLogin(seed.email)}
                  disabled={loading}
                  className="p-3 bg-slate-50 border border-slate-100 hover:border-primary/30 hover:bg-slate-100/50 rounded-xl text-left transition-all active:scale-95 duration-100 flex flex-col justify-between cursor-pointer"
                >
                  <span className="text-label-sm font-bold text-on-surface">{seed.label}</span>
                  <span className="text-[9px] text-outline uppercase tracking-wider mt-1 font-semibold">{seed.role.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
