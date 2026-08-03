'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { triggerHaptic } from '../../../lib/utils/haptics';

export default function AppDirectoryPage() {
  const { user, features, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  const systemRole = user.systemRole;
  const userRoles = user.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isLeaderOrHead = (user.departmentHead && user.departmentHead.length > 0) || (user.teamLead && user.teamLead.length > 0);
  const isActualManager = isManager || isLeaderOrHead;
  const hasTeamsOrDepts = isLeaderOrHead || (user.teams && user.teams.length > 0) || user.departmentId !== null;
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  const directorySections = [
    {
      title: 'Core Operations',
      items: [
        { label: 'Attendance Terminal', icon: 'event_available', href: '/attendance', desc: 'Biometric & geofenced check-in', show: features.includes('attendance'), badge: 'Live' },
        { label: 'Tasks & Projects', icon: 'assignment', href: '/tasks', desc: 'Sprint board & task assignments', show: features.includes('tasks') },
        { label: 'Employee Directory', icon: 'badge', href: '/employees', desc: 'Organization staff roster & profiles', show: (isAdmin || isHR || isActualManager) && features.includes('employees') },
        { label: 'Ops Statistics', icon: 'analytics', href: '/ops-stats', desc: 'Real-time operational stats', show: isAdmin || isHR },
        { label: 'Company Calendar', icon: 'calendar_month', href: '/calendar', desc: 'Holidays, shifts & events', show: true },
      ],
    },
    {
      title: 'My Workspace',
      items: [
        { label: 'Leave Requests', icon: 'event_busy', href: '/leave', desc: 'Apply & track time-off balances', show: features.includes('leave') },
        { label: 'Payroll & Slips', icon: 'payments', href: '/payroll', desc: 'Salary breakdown & tax slips', show: features.includes('payroll') },
        { label: 'Expense Claims', icon: 'receipt_long', href: '/expenses', desc: 'Reimbursements & claims', show: features.includes('expenses') },
        { label: 'My Team', icon: 'groups', href: '/my-team', desc: 'Team members & shift schedules', show: isAdmin || isHR || isActualManager || hasTeamsOrDepts },
        { label: 'Performance Reviews', icon: 'military_tech', href: '/performance', desc: 'Quarterly OKRs & feedback', show: features.includes('performance') },
        { label: 'My Profile', icon: 'account_circle', href: '/profile', desc: 'Personal details & security', show: true },
      ],
    },
    {
      title: 'Admin & Tools',
      items: [
        { label: 'Assets Manager', icon: 'inventory_2', href: '/assets', desc: 'Hardware & software assignments', show: features.includes('assets') },
        { label: 'Knowledge Base', icon: 'menu_book', href: '/knowledge', desc: 'Company SOPs & documents', show: features.includes('knowledge') },
        { label: 'Password Vault', icon: 'vpn_key', href: '/password-manager', desc: 'Encrypted corporate credentials', show: isAdmin },
        { label: 'Audit Trail', icon: 'history', href: '/audit', desc: 'System security log history', show: isAdmin && features.includes('audit') },
        { label: 'Workspace Settings', icon: 'settings', href: '/settings', desc: 'Module features & organization', show: isAdmin || isHR },
      ],
    },
  ];

  // Filter sections based on search query
  const filteredSections = directorySections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.show &&
          (item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-28 pt-4 px-4 font-sans select-none md:hidden">
      
      {/* ── TOP HEADER CARD ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 border-2 border-blue-400 font-black text-white flex items-center justify-center text-lg shadow-md">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-tight">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-xs text-slate-400 font-medium">{user.email}</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full">
            {systemRole}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search workspace directory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* ── DIRECTORY SECTIONS ── */}
      <div className="space-y-6">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center justify-between">
              <span>{section.title}</span>
              <span className="text-[10px] font-mono text-slate-500">({section.items.length})</span>
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => triggerHaptic(item.label === 'Attendance Terminal' ? 50 : 20)}
                  className="bg-slate-900/80 border border-slate-800/80 hover:border-blue-500/50 p-3.5 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-slate-800/90 border border-slate-700/60 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white leading-tight">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-500 group-hover:text-white text-[18px] transition-colors">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── QUICK ACTIONS (ROLE SWITCH / LOGOUT) ── */}
      <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
        {isAdmin && (
          <Link
            href="/select-role"
            className="w-full py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px] text-blue-400">published_with_changes</span>
            Switch Admin Persona
          </Link>
        )}

        <button
          onClick={() => logout()}
          className="w-full py-3.5 bg-red-950/60 text-red-400 border border-red-800/40 hover:bg-red-900/40 rounded-2xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 active:scale-98"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign Out of Workspace
        </button>
      </div>

    </div>
  );
}
