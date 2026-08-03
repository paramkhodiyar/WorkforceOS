'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthProvider';
import { api } from '../../lib/api/client';
import { triggerHaptic } from '../../lib/utils/haptics';

export default function BottomNavBar() {
  const pathname = usePathname();
  const { user, features } = useAuth();
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

  const tabs = [
    { label: 'Home', icon: 'dashboard', href: '/dashboard', show: true },
    { label: 'Attendance', icon: 'event_available', href: '/attendance', show: features.includes('attendance') },
    { label: 'Tasks', icon: 'assignment', href: '/tasks', show: features.includes('tasks') },
    { label: 'Directory', icon: 'grid_view', href: '/app-directory', show: true, badge: hasPendingRequests },
  ].filter(tab => tab.show);

  return (
    <nav className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-[90] md:hidden select-none">
      {/* Hyper-Modern Translucent Glassmorphic Capsule (Zero Shadows, Zero Gradients) */}
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-300 rounded-full px-3 py-2 flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => {
                if (tab.label === 'Attendance') triggerHaptic(50);
              }}
              className={`relative flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 ${
                isActive
                  ? 'bg-blue-600 text-white font-extrabold px-4 py-2 rounded-full scale-[1.03]'
                  : 'text-slate-600 hover:text-slate-900 p-2.5 rounded-full hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[22px] transition-transform duration-300 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}>
                  {tab.icon}
                </span>

                {/* Name rendered ONLY for the active tab */}
                {isActive && (
                  <span className="text-xs font-black tracking-tight whitespace-nowrap animate-fade-in">
                    {tab.label}
                  </span>
                )}
              </div>

              {/* Notification Badge for Pending Requests on Inactive Tabs */}
              {tab.badge && !isActive && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
