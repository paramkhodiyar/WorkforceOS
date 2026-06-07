'use client';

import React, { useState } from 'react';
import { useAuth, SEED_USERS } from '../../../lib/auth/AuthProvider';

export default function LoginPage() {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6 font-sans">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant p-8 rounded-xl shadow-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/workforceoslogo.png" alt="Logo" className="h-16 w-16 object-contain rounded mb-3" />
          <h1 className="text-3xl font-bold text-primary">WorkforceOS</h1>
          <p className="text-label-sm text-outline mt-1">Enterprise Operations Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-container border border-error-container text-error rounded-lg text-body-sm">
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
              className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
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
              className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-label-md font-bold transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 border-t border-outline-variant pt-6">
          <p className="text-[10px] text-outline font-bold uppercase tracking-wider text-center mb-4">Development Quick Login</p>
          <div className="grid grid-cols-2 gap-2">
            {SEED_USERS.map((seed) => (
              <button
                key={seed.email}
                type="button"
                onClick={() => handleQuickLogin(seed.email)}
                disabled={loading}
                className="p-3 bg-surface-container-low border border-outline-variant hover:bg-surface-container rounded-lg text-left transition-all active:scale-95 duration-100 flex flex-col justify-between"
              >
                <span className="text-label-sm font-bold text-on-surface">{seed.label}</span>
                <span className="text-[9px] text-outline uppercase tracking-wider mt-1">{seed.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
