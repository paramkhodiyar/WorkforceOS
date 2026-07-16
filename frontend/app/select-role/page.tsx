'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/AuthProvider';

const SIMULATION_ROLES = [
  {
    id: 'ORG_ADMIN',
    name: 'Administrator',
    description: 'Simulate the Owner / Org Admin dashboard. Manage organization, payroll, and core settings.',
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
      <header className="border-b border-slate-200 bg-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/workforceoslogo.png" alt="Logo" className="h-8 w-8 object-contain rounded" />
          <span className="text-lg font-bold tracking-wider uppercase text-slate-800">WorkforceOS Portal</span>
        </div>
        <button
          onClick={logout}
          className="text-xs font-semibold text-slate-555 hover:text-slate-800 transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Main Choice Selector */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-center text-center space-y-10">
        <div className="space-y-3">
          <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
            System Owner Portal
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Select Simulator Persona</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Welcome, System Owner. Please choose which role simulation persona you would like to run inside the WorkforceOS workspace.
          </p>
        </div>

        {/* Roles Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SIMULATION_ROLES.map((role) => (
            <div
              key={role.id}
              onClick={() => !loading && handleSelect(role.id)}
              className={`border rounded-[28px] p-8 text-center flex flex-col justify-between items-center transition-all duration-300 relative overflow-hidden group ${
                loading && activeChoice === role.id
                  ? 'border-blue-600 bg-blue-50/20 scale-[0.98]'
                  : loading
                  ? 'opacity-40 cursor-not-allowed border-slate-200 bg-white'
                  : `cursor-pointer bg-white ${role.color} ${role.bg} hover:scale-[1.02]`
              }`}
            >
              <div className="space-y-4 flex flex-col items-center">
                <div className="h-16 w-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[32px]">{role.icon}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-800">{role.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{role.description}</p>
                </div>
              </div>

              <div className="pt-6 w-full">
                <button
                  disabled={loading}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all ${
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
      <footer className="text-center py-6 text-[10px] text-slate-400 border-t border-slate-200 bg-white">
        WorkforceOS Management Platform. Locked and Secured.
      </footer>
    </div>
  );
}
