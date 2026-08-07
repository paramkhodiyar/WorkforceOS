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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleFocusIn(e: FocusEvent) {
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        setIsKeyboardOpen(true);
      }
    }

    function handleFocusOut() {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement;
        if (!active || !['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) {
          setIsKeyboardOpen(false);
        }
      }, 100);
    }

    function handleResize() {
      if (window.visualViewport) {
        setIsKeyboardOpen(window.visualViewport.height < window.innerHeight * 0.85);
      }
    }

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  if (!user || isKeyboardOpen) return null;

  const tabs = [
    { label: 'Home', icon: 'dashboard', href: '/dashboard', show: true },
    { label: 'Attendance', icon: 'event_available', href: '/attendance', show: features.includes('attendance') },
    { label: 'Tasks', icon: 'assignment', href: '/tasks', show: features.includes('tasks') },
    { label: 'Directory', icon: 'grid_view', href: '/app-directory', show: true, badge: hasPendingRequests },
  ].filter(tab => tab.show);

  const activeIndex = Math.max(0, tabs.findIndex(t => pathname === t.href || pathname.startsWith(t.href + '/')));

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-fit max-w-[94vw] z-[90] md:hidden select-none">
      {/* Light Frosted Glass Capsule Bar */}
      <div className="relative bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-full p-1.5 flex items-center gap-1 shadow-xl shadow-slate-900/10">
        {tabs.map((tab, idx) => {
          const isActive = activeIndex === idx;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => {
                triggerHaptic(30);
              }}
              className={`relative z-10 flex items-center gap-2 px-3.5 py-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-bold'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                isActive ? 'scale-105 text-white' : 'scale-100 text-slate-500'
              }`}>
                {tab.icon}
              </span>

              {/* Text label smoothly expands on active tab */}
              <span
                className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isActive ? 'max-w-[100px] opacity-100 font-bold ml-0.5' : 'max-w-0 opacity-0'
                }`}
              >
                {tab.label}
              </span>

              {/* Notification Badge */}
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
