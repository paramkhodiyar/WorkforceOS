'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthProvider';

export default function BottomNavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (!user) return null;

  const systemRole = user.systemRole;
  const userRoles = user.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  const quickTabs = [
    { label: 'Home', icon: 'dashboard', href: '/dashboard' },
    { label: 'Tasks', icon: 'assignment', href: '/tasks' },
    { label: 'Attendance', icon: 'event_available', href: '/attendance' }
  ];

  const secondaryTabs = [
    { label: 'Leave Request', icon: 'event_busy', href: '/leave' },
    { label: 'Employee List', icon: 'badge', href: '/employees', show: isAdmin || isHR || isManager },
    { label: 'Compensation', icon: 'payments', href: '/payroll' },
    { label: 'Expenses Claims', icon: 'receipt_long', href: '/expenses' },
    { label: 'Assets Check-out', icon: 'inventory_2', href: '/assets' },
    { label: 'Knowledge Base', icon: 'menu_book', href: '/knowledge' },
    { label: 'Audit Trail', icon: 'history', href: '/audit', show: isAdmin }
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-around z-40 md:hidden pb-safe">
        {quickTabs.map(tab => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
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
          <span className="material-symbols-outlined">menu</span>
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
                  className="flex flex-col items-center gap-2 p-3 bg-surface-container-low border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-center"
                >
                  <span className="material-symbols-outlined text-primary">{tab.icon}</span>
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
