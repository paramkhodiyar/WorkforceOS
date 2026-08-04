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

  const activeIndex = Math.max(0, tabs.findIndex(t => pathname === t.href || pathname.startsWith(t.href + '/')));

  return (
    <nav className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-[90] md:hidden select-none">
      {/* Translucent Glassmorphic Capsule */}
      <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-full p-1.5 flex items-center justify-around shadow-sm">
        {tabs.map((tab, idx) => {
          const isActive = activeIndex === idx;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => {
                triggerHaptic(35);
              }}
              className={`relative z-10 flex items-center gap-2 px-3.5 py-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                isActive ? 'scale-110 text-white' : 'scale-100 text-slate-600'
              }`}>
                {tab.icon}
              </span>

              {/* Text label smoothly transitions width & opacity */}
              <span
                className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isActive ? 'max-w-[100px] opacity-100 font-bold ml-0.5' : 'max-w-0 opacity-0'
                }`}
              >
                {tab.label}
              </span>

              {/* Notification Badge for Inactive Tabs */}
              {tab.badge && !isActive && (
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
