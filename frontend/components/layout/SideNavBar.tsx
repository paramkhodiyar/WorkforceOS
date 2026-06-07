'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthProvider';

export default function SideNavBar() {
  const pathname = usePathname();
  const { user } = useAuth();

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
      show: isAdmin || isHR || isManager
    },
    {
      label: 'Attendance',
      icon: 'event_available',
      href: '/attendance',
      show: true
    },
    {
      label: 'Leave',
      icon: 'event_busy',
      href: '/leave',
      show: true
    },
    {
      label: 'Tasks',
      icon: 'assignment',
      href: '/tasks',
      show: true
    },
    {
      label: 'Performance',
      icon: 'trending_up',
      href: '/performance',
      show: true
    },
    {
      label: 'Payroll',
      icon: 'payments',
      href: '/payroll',
      show: true
    },
    {
      label: 'Expenses',
      icon: 'receipt_long',
      href: '/expenses',
      show: true
    },
    {
      label: 'Assets',
      icon: 'inventory_2',
      href: '/assets',
      show: true
    },
    {
      label: 'Knowledge',
      icon: 'menu_book',
      href: '/knowledge',
      show: true
    },
    {
      label: 'Audit Log',
      icon: 'history',
      href: '/audit',
      show: isAdmin
    }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-outline-variant bg-surface-container-lowest flex flex-col p-4 z-40 hidden md:flex">
      <div className="mb-8 px-2 flex items-center gap-2.5">
        <img src="/workforceoslogo.png" alt="Logo" className="h-8 w-8 object-contain rounded" />
        <div>
          <h1 className="text-label-md font-bold text-primary tracking-wider uppercase">WorkforceOS</h1>
          <p className="text-[10px] text-outline capitalize font-semibold">{systemRole.toLowerCase().replace('_', ' ')}</p>
        </div>
      </div>
      <nav className="flex-grow space-y-1 overflow-y-auto">
        {menuItems.filter(item => item.show).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
