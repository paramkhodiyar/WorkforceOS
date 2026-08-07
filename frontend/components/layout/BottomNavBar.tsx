'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const initialHeightRef = useRef<number>(0);

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

    initialHeightRef.current = window.innerHeight;

    function checkKeyboard() {
      const active = document.activeElement as HTMLElement;
      const isInputFocused = active && (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) ||
        !!active.closest('input, textarea, select, [contenteditable="true"]')
      );

      const screenH = window.screen?.height || initialHeightRef.current;
      const currentH = window.visualViewport?.height || window.innerHeight;
      const isViewportShrunk = currentH < screenH * 0.78 || currentH < initialHeightRef.current * 0.78;

      setIsKeyboardOpen(isInputFocused || isViewportShrunk);
    }

    function handleFocusIn(e: FocusEvent) {
      const target = e.target as HTMLElement;
      if (target && (target.closest('input, textarea, select, [contenteditable="true"]') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
        setIsKeyboardOpen(true);
      }
    }

    function handleFocusOut() {
      setTimeout(checkKeyboard, 100);
    }

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    window.addEventListener('resize', checkKeyboard);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkKeyboard);
    }

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('resize', checkKeyboard);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkKeyboard);
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
    <nav className="bottom-nav-bar fixed bottom-5 left-1/2 -translate-x-1/2 w-fit max-w-[94vw] z-[90] md:hidden select-none transform-gpu">
      {/* GPU Accelerated Light Glassmorphic Capsule */}
      <div className="relative bg-white/92 backdrop-blur-md border border-slate-200/90 rounded-full p-1.5 flex items-center gap-1 shadow-lg shadow-slate-900/10 transform-gpu">
        {tabs.map((tab, idx) => {
          const isActive = activeIndex === idx;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              onClick={() => {
                triggerHaptic(30);
              }}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-colors duration-150 ease-out cursor-pointer transform-gpu ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-semibold'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-150 ${
                isActive ? 'scale-105 text-white' : 'scale-100 text-slate-500'
              }`}>
                {tab.icon}
              </span>

              {/* Text label with hardware accelerated width animation */}
              <span
                className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
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
