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
      {/* Flat Glassmorphic Container (Zero Shadows, Zero Gradients, Equal Grid Alignment) */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-300 rounded-2xl p-1.5 grid grid-cols-4 gap-1 w-full items-center">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => {
                if (tab.label === 'Attendance') triggerHaptic(50);
              }}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-blue-600 text-white font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                isActive ? 'scale-105' : 'scale-100'
              }`}>
                {tab.icon}
              </span>

              <span className="text-[10px] tracking-tight font-extrabold mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>

              {/* Notification Badge for Pending Requests */}
              {tab.badge && !isActive && (
                <span className="absolute top-1.5 right-3 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
