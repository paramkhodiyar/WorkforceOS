'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthProvider';
import { api } from '../../lib/api/client';

export default function SideNavBar() {
  const pathname = usePathname();
  const { user, features, hasPermission } = useAuth();
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
    'employees', 'attendance', 'leave', 'tasks', 'performance', 'payroll', 'expenses', 'assets', 'knowledge', 'audit', 'calendar', 'org-canvas'
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
      label: 'Org Canvas',
      icon: 'account_tree',
      href: '/org-canvas',
      show: (isAdmin || isHR || hasPermission('employee', 'read')) && activeFeatures.includes('org-canvas')
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
      show: (isAdmin || isHR || isActualManager || hasPermission('employee', 'read')) && activeFeatures.includes('employees')
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
      show: (isAdmin || isHR || isFinance || hasPermission('payroll', 'read')) && activeFeatures.includes('payroll')
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
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-200 bg-white flex flex-col p-5 z-40 hidden md:flex select-none">
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
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
              {systemRole.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 px-1 opacity-70">
          <img src="/workforceoslogo.png" className="h-3.5 w-3.5 object-contain" alt="WorkforceOS" />
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
              className={`flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-100/80 shadow-none'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium text-label-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                  {item.icon}
                </span>
                <span className="text-label-md">{item.label}</span>
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
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 ${
            pathname === '/profile'
              ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-100/80 shadow-none'
              : 'text-slate-600 hover:bg-slate-50 font-medium text-label-md'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${pathname === '/profile' ? 'text-blue-700' : 'text-slate-500'}`}>
            account_circle
          </span>
          <span className="text-label-md">My Profile</span>
        </Link>
        {(isAdmin || isHR) && (
          <Link 
            href="/settings"
            className={`flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all duration-200 ${
              pathname === '/settings'
                ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-100/80 shadow-none'
                : 'text-slate-600 hover:bg-slate-50 font-medium text-label-md'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[20px] ${pathname === '/settings' ? 'text-blue-700' : 'text-slate-500'}`}>
                settings
              </span>
              <span className="text-label-md">Settings</span>
            </div>
            {hasPendingRequests && (
              <span className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </Link>
        )}
        <a
          href="mailto:paramkhodiyar1008@gmail.com"
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-slate-600 hover:bg-slate-50 font-medium text-label-md transition-colors"
        >
          <span className="material-symbols-outlined text-[20px] text-slate-500">help</span>
          <span className="text-label-md">Support</span>
        </a>
      </div>
    </aside>
  );
}
