'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthProvider';

export default function SideNavBar() {
  const pathname = usePathname();
  const { user, features } = useAuth();

  if (!user) return null;

  const systemRole = user.systemRole;
  const userRoles = user.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isFinance = userRoles.some((r: any) => r.roleName === 'FINANCE_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  const menuItems = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      href: '/dashboard',
      show: true
    },
    {
      label: 'Employees',
      icon: 'badge',
      href: '/employees',
      show: (isAdmin || isHR || isManager) && features.includes('employees')
    },
    {
      label: 'Statuses',
      icon: 'wifi',
      href: '/statuses',
      show: features.includes('attendance')
    },
    {
      label: 'Attendance',
      icon: 'event_available',
      href: '/attendance',
      show: features.includes('attendance')
    },
    {
      label: 'Leave',
      icon: 'event_busy',
      href: '/leave',
      show: features.includes('leave')
    },
    {
      label: 'Tasks',
      icon: 'assignment',
      href: '/tasks',
      show: features.includes('tasks')
    },
    {
      label: 'Performance',
      icon: 'trending_up',
      href: '/performance',
      show: features.includes('performance')
    },
    {
      label: 'Payroll',
      icon: 'payments',
      href: '/payroll',
      show: features.includes('payroll')
    },
    {
      label: 'Expenses',
      icon: 'receipt_long',
      href: '/expenses',
      show: features.includes('expenses')
    },
    {
      label: 'Assets',
      icon: 'inventory_2',
      href: '/assets',
      show: features.includes('assets')
    },
    {
      label: 'Knowledge',
      icon: 'menu_book',
      href: '/knowledge',
      show: features.includes('knowledge')
    },
    {
      label: 'Audit Log',
      icon: 'history',
      href: '/audit',
      show: isAdmin && features.includes('audit')
    }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-outline-variant bg-surface-container-lowest flex flex-col p-5 z-40 hidden md:flex">
      <div className="mb-8 px-2 flex items-center gap-3">
        <img src="/workforceoslogo.png" alt="Logo" className="h-8 w-8 object-contain rounded" />
        <div>
          <h1 className="text-label-md font-extrabold text-primary tracking-wider uppercase">WorkforceOS</h1>
          <p className="text-[9px] text-outline uppercase tracking-wider font-semibold">{systemRole.replace('_', ' ')}</p>
        </div>
      </div>

      <nav className="flex-grow space-y-1 overflow-y-auto pr-1">
        {menuItems.filter(item => item.show).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-outline-variant mt-auto space-y-1">
        {(isAdmin || isHR) && (
          <Link 
            href="/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
              pathname === '/settings'
                ? 'bg-primary-container text-on-primary-container font-semibold'
                : 'text-on-surface-variant hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-label-md">Settings</span>
          </Link>
        )}
        <Link 
          href="/unauthorized"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span className="text-label-md">Support</span>
        </Link>
      </div>
    </aside>
  );
}
