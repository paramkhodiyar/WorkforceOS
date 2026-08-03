'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthProvider';

const SIMULATION_ROLES = [
  {
    id: 'ORG_ADMIN',
    name: 'Administrator',
    description: 'Simulate the Org Admin dashboard. Manage organization, payroll, employees, and core settings.',
    icon: 'admin_panel_settings',
    color: 'border-blue-200 hover:border-blue-600 text-blue-600',
    bg: 'bg-blue-50/20',
  },
  {
    id: 'HR',
    name: 'HR Manager',
    description: 'Simulate the HR Manager dashboard. Oversee employees, leaves, attendance, and onboarding.',
    icon: 'supervised_user_circle',
    color: 'border-emerald-200 hover:border-emerald-600 text-emerald-600',
    bg: 'bg-emerald-50/20',
  },
  {
    id: 'EMPLOYEE',
    name: 'Standard Employee',
    description: 'Simulate the employee view. Log attendance check-ins, view tasks, and request leaves.',
    icon: 'person',
    color: 'border-purple-200 hover:border-purple-600 text-purple-600',
    bg: 'bg-purple-50/20',
  },
];

export default function SelectRolePage() {
  const { switchRole, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeChoice, setActiveChoice] = useState<string | null>(null);

  async function handleSelect(role: string) {
    setActiveChoice(role);
    setLoading(true);
    try {
      await switchRole(role);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-3.5 md:px-8 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/workforceoslogo.png" alt="Logo" className="h-7 w-7 md:h-8 md:w-8 object-contain rounded" />
          <span className="text-xs md:text-base font-black tracking-wider uppercase text-slate-800">
            WorkforceOS
          </span>
        </div>
        <button
          onClick={logout}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors active:scale-95 cursor-pointer"
        >
          Logout
        </button>
      </header>

      {/* Main Choice Selector */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:px-6 md:py-12 flex flex-col justify-center text-center space-y-6 md:space-y-10">
        <div className="space-y-2">
          <h1 className="text-xl md:text-3xl font-black tracking-tight text-slate-900">
            Select Simulator Persona
          </h1>
          <p className="text-slate-500 text-xs md:text-sm max-w-md mx-auto leading-relaxed font-medium">
            Choose which role simulation persona you would like to run inside the WorkforceOS workspace.
          </p>
        </div>

        {/* ── Owner Platform Quick Access ── */}
        <Link
          href="/admin/customers"
          className="group w-full max-w-2xl mx-auto flex items-center justify-between gap-4 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded-2xl px-6 py-4 transition-all duration-200 active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px] text-amber-400">verified_user</span>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">Platform Owner</h3>
                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  SYS_OWNER
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Access the master CMS — manage customer organizations, licenses, invoices, and platform keys.
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-white text-[20px] transition-colors shrink-0">
            arrow_forward
          </span>
        </Link>

        {/* Roles Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {SIMULATION_ROLES.map((role) => (
            <div
              key={role.id}
              onClick={() => !loading && handleSelect(role.id)}
              className={`border rounded-2xl md:rounded-[28px] p-5 md:p-8 text-center flex flex-col justify-between items-center transition-all duration-200 relative overflow-hidden active:scale-[0.98] ${
                loading && activeChoice === role.id
                  ? 'border-blue-600 bg-blue-50/20 scale-[0.98]'
                  : loading
                  ? 'opacity-40 cursor-not-allowed border-slate-200 bg-white'
                  : `cursor-pointer bg-white ${role.color} ${role.bg} hover:scale-[1.02]`
              }`}
            >
              <div className="space-y-3 md:space-y-4 flex flex-col items-center">
                <div className="h-12 w-12 md:h-16 md:w-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px] md:text-[32px]">{role.icon}</span>
                </div>
                <div className="space-y-1 md:space-y-2">
                  <h3 className="text-base md:text-lg font-bold text-slate-800">{role.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{role.description}</p>
                </div>
              </div>

              <div className="pt-4 md:pt-6 w-full">
                <button
                  disabled={loading}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    loading && activeChoice === role.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'
                  }`}
                >
                  {loading && activeChoice === role.id ? 'Launching Persona...' : 'Launch Persona'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-[10px] text-slate-400 border-t border-slate-200 bg-white">
        WorkforceOS Management Platform. Locked and Secured.
      </footer>
    </div>
  );
}
