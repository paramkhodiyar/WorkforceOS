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
    const isAdminRole = sysRole === 'SUPER_ADMIN' || sysRole === 'ORG_ADMIN' || user.originalRole === 'SYS_OWNER';

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
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER') || systemRole === 'HR';
  const isFinance = userRoles.some((r: any) => r.roleName === 'FINANCE_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isLeaderOrHead = (user.departmentHead && user.departmentHead.length > 0) || (user.teamLead && user.teamLead.length > 0);
  const isActualManager = isManager || isLeaderOrHead;
  const hasTeamsOrDepts =
    isLeaderOrHead ||
    (user.teams && user.teams.length > 0) ||
    user.departmentId !== null;
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN' || user.originalRole === 'SYS_OWNER';

  const activeFeatures = (features && features.length > 0) ? features : [
    'employees', 'attendance', 'leave', 'tasks', 'performance', 'payroll', 'expenses', 'assets', 'knowledge', 'audit', 'calendar'
  ];

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
      label: 'Approvals',
      icon: 'fact_check',
      href: '/approvals',
      show: isAdmin || isHR || isActualManager,
      badge: hasPendingRequests
    },
    {
      label: 'Employees',
      icon: 'badge',
      href: '/employees',
      show: (isAdmin || isHR || isActualManager) && activeFeatures.includes('employees')
    },
    {
      label: 'Statuses',
      icon: 'wifi',
      href: '/statuses',
      show: (isAdmin || isHR || isActualManager) && activeFeatures.includes('attendance')
    },
    {
      label: 'Attendance',
      icon: 'event_available',
      href: '/attendance',
      show: activeFeatures.includes('attendance')
    },
    {
      label: 'Leave',
      icon: 'event_busy',
      href: '/leave',
      show: activeFeatures.includes('leave')
    },
    {
      label: 'Tasks',
      icon: 'assignment',
      href: '/tasks',
      show: activeFeatures.includes('tasks')
    },
    {
      label: 'Performance',
      icon: 'trending_up',
      href: '/performance',
      show: activeFeatures.includes('performance')
    },
    {
      label: 'Calendar',
      icon: 'calendar_today',
      href: '/calendar',
      show: activeFeatures.includes('calendar')
    },
    {
      label: 'Payroll',
      icon: 'payments',
      href: '/payroll',
      show: (isAdmin || isHR || isFinance) && activeFeatures.includes('payroll')
    },
    {
      label: 'Expenses',
      icon: 'receipt_long',
      href: '/expenses',
      show: activeFeatures.includes('expenses')
    },
    {
      label: 'Assets',
      icon: 'inventory_2',
      href: '/assets',
      show: activeFeatures.includes('assets')
    },
    {
      label: 'Knowledge',
      icon: 'menu_book',
      href: '/knowledge',
      show: activeFeatures.includes('knowledge')
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
      show: isAdmin && activeFeatures.includes('audit')
    }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-outline-variant bg-surface-container-lowest flex flex-col p-5 z-40 hidden md:flex select-none">
      <div className="mb-6 px-2 border-b border-slate-100 pb-4">
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
        <div className="mt-2.5 flex items-center gap-1.5 px-1 opacity-70">
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
              className={`flex items-center justify-between px-3.5 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                <span className="text-xs font-bold">{item.label}</span>
              </div>
              {item.badge && (
                <span className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-100 mt-auto space-y-1">
        <Link 
          href="/profile"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
            pathname === '/profile'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="material-symbols-outlined text-[19px]">account_circle</span>
          <span className="text-xs font-bold">My Profile</span>
        </Link>
        {(isAdmin || isHR) && (
          <Link 
            href="/settings"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
              pathname === '/settings'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[19px]">settings</span>
              <span className="text-xs font-bold">Settings</span>
            </div>
            {hasPendingRequests && (
              <span className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </Link>
        )}
        <a
          href="mailto:paramkhodiyar1008@gmail.com"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[19px]">help</span>
          <span className="text-xs font-bold">Support</span>
        </a>
      </div>
    </aside>
  );
}
