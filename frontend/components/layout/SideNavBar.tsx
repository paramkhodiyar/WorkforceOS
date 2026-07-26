'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthProvider';
import { api } from '../../lib/api/client';

export default function SideNavBar() {
  const pathname = usePathname();
  const { user, features } = useAuth();
  const [hasPendingRequests, setHasPendingRequests] = useState(false);

  useEffect(() => {
    if (!user) return;
    const sysRole = user.systemRole;
    const usrRoles = user.roles || [];
    const isHrRole = usrRoles.some((r: any) => r.roleName === 'HR_MANAGER');
    const isAdminRole = sysRole === 'SUPER_ADMIN' || sysRole === 'ORG_ADMIN';

    function checkPending() {
      if (isAdminRole || isHrRole) {
        api.employees.listProfileRequests()
          .then(res => {
            const pending = res.data?.some((r: any) => r.status === 'PENDING');
            setHasPendingRequests(!!pending);
          })
          .catch(console.error);
      }
    }

    checkPending();

    // Refresh badge every 60 seconds so admins see new requests without a page reload
    const interval = setInterval(checkPending, 60000);

    if (typeof window !== 'undefined') {
      window.addEventListener('profile-requests-updated', checkPending);
      return () => {
        clearInterval(interval);
        window.removeEventListener('profile-requests-updated', checkPending);
      };
    }

    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const systemRole = user.systemRole;
  const orgName = user?.organization?.name || 'WorkforceOS';
  const userRoles = user.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isFinance = userRoles.some((r: any) => r.roleName === 'FINANCE_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isLeaderOrHead = (user.departmentHead && user.departmentHead.length > 0) || (user.teamLead && user.teamLead.length > 0);
  const isActualManager = isManager || isLeaderOrHead;
  const hasTeamsOrDepts =
    isLeaderOrHead ||
    (user.teams && user.teams.length > 0) ||
    user.departmentId !== null;
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  const menuItems = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      href: '/dashboard',
      show: true
    },
    {
      label: 'Ops Stats',
      icon: 'analytics',
      href: '/ops-stats',
      show: isAdmin || isHR
    },
    {
      label: 'My Team',
      icon: 'groups',
      href: '/my-team',
      show: isAdmin || isHR || isActualManager || hasTeamsOrDepts
    },
    {
      label: 'Employees',
      icon: 'badge',
      href: '/employees',
      show: (isAdmin || isHR || isActualManager) && features.includes('employees')
    },
    {
      label: 'Statuses',
      icon: 'wifi',
      href: '/statuses',
      show: (isAdmin || isHR || isActualManager) && features.includes('attendance')
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
      label: 'Calendar',
      icon: 'calendar_today',
      href: '/calendar',
      show: features.includes('calendar')
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
      label: 'Password Manager',
      icon: 'vpn_key',
      href: '/password-manager',
      show: isAdmin
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
      <div className="mb-8 px-2 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <img 
            src={user?.organization?.logoUrl || "/workforceoslogo.png"} 
            alt={orgName} 
            className="h-9 w-9 object-contain rounded-lg bg-white border border-slate-200/85 p-0.5" 
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-label-md font-bold text-slate-800 tracking-tight truncate uppercase">
              {orgName}
            </h1>
            <p className="text-[9px] text-outline uppercase tracking-wider font-semibold">
              {systemRole.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 px-1 opacity-70">
          <img src="/workforceoslogo.png" className="h-3 w-3 object-contain" alt="WorkforceOS" />
          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">WorkforceOS Portal</span>
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
        <Link 
          href="/profile"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
            pathname === '/profile'
              ? 'bg-primary-container text-on-primary-container font-semibold'
              : 'text-on-surface-variant hover:bg-slate-50'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
          <span className="text-label-md">My Profile</span>
        </Link>
        {(isAdmin || isHR) && (
          <Link 
            href="/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
              pathname === '/settings'
                ? 'bg-primary-container text-on-primary-container font-semibold'
                : 'text-on-surface-variant hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] relative">
              settings
              {hasPendingRequests && (
                <span className="absolute top-0.5 right-0.5 block h-1.5 w-1.5 rounded-full bg-red-500 ring-[1px] ring-white"></span>
              )}
            </span>
            <span className="text-label-md">Settings</span>
          </Link>
        )}
        <a
          href="mailto:paramkhodiyar1008@gmail.com"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span className="text-label-md">Support</span>
        </a>
      </div>
    </aside>
  );
}
