'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthProvider';
import { api } from '../../lib/api/client';
import { triggerHaptic } from '../../lib/utils/haptics';

export default function BottomNavBar() {
  const pathname = usePathname();
  const { user, features, logout } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [hasPendingRequests, setHasPendingRequests] = useState(false);

  useEffect(() => {
    function checkPending() {
      const systemRole = user?.systemRole;
      const userRoles = user?.roles || [];
      const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
      const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

      if (isAdmin || isHR) {
        api.employees.listProfileRequests()
          .then(res => {
            const pending = res.data?.some((r: any) => r.status === 'PENDING');
            setHasPendingRequests(!!pending);
          })
          .catch(console.error);
      }
    }

    checkPending();

    if (typeof window !== 'undefined') {
      window.addEventListener('profile-requests-updated', checkPending);
      return () => window.removeEventListener('profile-requests-updated', checkPending);
    }
  }, [user]);

  if (!user) return null;

  const systemRole = user.systemRole;
  const userRoles = user.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isLeaderOrHead = (user.departmentHead && user.departmentHead.length > 0) || (user.teamLead && user.teamLead.length > 0);
  const isActualManager = isManager || isLeaderOrHead;
  const hasTeamsOrDepts =
    isLeaderOrHead ||
    (user.teams && user.teams.length > 0) ||
    user.departmentId !== null;
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  const quickTabs = [
    { label: 'Home', icon: 'dashboard', href: '/dashboard', show: true },
    { label: 'Tasks', icon: 'assignment', href: '/tasks', show: features.includes('tasks') },
    { label: 'Attendance', icon: 'event_available', href: '/attendance', show: features.includes('attendance') },
    { label: 'Profile', icon: 'account_circle', href: '/profile', show: true },
  ].filter(tab => tab.show);

  const secondaryTabs = [
    { label: 'My Team', icon: 'groups', href: '/my-team', show: isAdmin || isHR || isActualManager || hasTeamsOrDepts },
    { label: 'Leave Request', icon: 'event_busy', href: '/leave', show: features.includes('leave') },
    { label: 'Statuses Board', icon: 'wifi', href: '/statuses', show: (isAdmin || isHR || isActualManager) && features.includes('attendance') },
    { label: 'Ops Stats', icon: 'analytics', href: '/ops-stats', show: isAdmin || isHR },
    { label: 'Employee List', icon: 'badge', href: '/employees', show: (isAdmin || isHR || isActualManager) && features.includes('employees') },
    { label: 'Compensation', icon: 'payments', href: '/payroll', show: features.includes('payroll') },
    { label: 'Expenses Claims', icon: 'receipt_long', href: '/expenses', show: features.includes('expenses') },
    { label: 'Assets Check-out', icon: 'inventory_2', href: '/assets', show: features.includes('assets') },
    { label: 'Knowledge Base', icon: 'menu_book', href: '/knowledge', show: features.includes('knowledge') },
    { label: 'Password Manager', icon: 'vpn_key', href: '/password-manager', show: isAdmin },
    { label: 'Audit Trail', icon: 'history', href: '/audit', show: isAdmin && features.includes('audit') },
    { label: 'Settings', icon: 'settings', href: '/settings', show: isAdmin || isHR }
  ].filter(tab => tab.show);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-around z-40 md:hidden pb-safe">
        {quickTabs.map(tab => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => triggerHaptic(tab.label === 'Attendance' ? 50 : 25)}
              className={`flex flex-col items-center justify-center w-20 h-full transition-colors active:scale-95 duration-100 ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors active:scale-95 duration-100 ${
            showMoreMenu ? 'text-primary' : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined relative">
            menu
            {hasPendingRequests && (
              <span className="absolute top-0.5 right-0.5 block h-1.5 w-1.5 rounded-full bg-red-500 ring-[1px] ring-white"></span>
            )}
          </span>
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {showMoreMenu && (
        <div className="fixed inset-0 bg-black/40 z-50 md:hidden flex items-end">
          <div className="w-full bg-surface-container-lowest rounded-t-xl max-h-[80vh] overflow-y-auto p-6 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <div>
                <p className="text-label-md font-bold text-on-surface">{user.firstName} {user.lastName}</p>
                <p className="text-[11px] text-outline">{user.email}</p>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 hover:bg-surface-container rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {secondaryTabs.filter(tab => tab.show !== false).map(tab => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setShowMoreMenu(false)}
                  className="flex flex-col items-center gap-2 p-3 bg-surface-container-low border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-center relative"
                >
                  <span className="material-symbols-outlined text-primary relative">
                    {tab.icon}
                    {tab.label === 'Settings' && hasPendingRequests && (
                      <span className="absolute top-0.5 right-0.5 block h-1.5 w-1.5 rounded-full bg-red-500 ring-[1px] ring-white"></span>
                    )}
                  </span>
                  <span className="text-[11px] font-medium text-on-surface">{tab.label}</span>
                </Link>
              ))}
            </div>

            <button
              onClick={() => {
                setShowMoreMenu(false);
                logout();
              }}
              className="mt-4 w-full py-3 bg-error-container text-error border border-error-container hover:bg-error/10 rounded-lg text-label-md font-bold transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
