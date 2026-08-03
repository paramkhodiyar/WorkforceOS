'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthProvider';
import { api } from '../../lib/api/client';

/** Returns a human-readable date label relative to today */
function formatNotifDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (d.toDateString() === today.toDateString()) {
    return `Today · ${time}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday · ${time}`;
  }
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ` · ${time}`;
}

export default function TopNavBar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) return null;

  // Derive unread count from the list — no second API call needed
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.notifications.list();
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  async function handleMarkRead(id: string) {
    try {
      await api.notifications.markRead(id);
      // Optimistically update local state — no refetch needed
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await api.notifications.readAll();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDismiss(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.notifications.dismiss(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-14 md:h-16 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between px-3.5 md:px-6 z-30">
      <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
        <div className="flex items-center gap-1.5 md:hidden shrink-0">
          <img 
            src={user?.organization?.logoUrl || "/workforceoslogo.png"} 
            alt={user?.organization?.name || "Logo"} 
            className="h-5 w-5 object-contain rounded bg-white border border-slate-200/50" 
          />
          <h2 className="text-[10px] font-black text-slate-800 tracking-tight uppercase truncate max-w-[100px]">
            {user?.organization?.name || "WorkforceOS"}
          </h2>
        </div>
        <div className="relative hidden sm:flex items-center select-none">
          <style>{`
            @keyframes elasticSlide {
              0% { transform: scale(0.9) translateX(-15px); opacity: 0; }
              70% { transform: scale(1.05) translateX(3px); opacity: 0.9; }
              100% { transform: scale(1) translateX(0); opacity: 1; }
            }
            .animate-elastic {
              animation: elasticSlide 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
          `}</style>
          <span className="text-[15px] font-black text-slate-900 tracking-tight animate-elastic">
            Welcome back, <span className="text-primary">{user?.firstName || 'User'}</span>
            <span className="text-primary font-black">.</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {user.originalRole === 'SYS_OWNER' && (
          <Link
            href="/select-role"
            className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">sync_alt</span>
            <span className="hidden sm:inline">Switch ({user.systemRole})</span>
            <span className="sm:hidden font-black">Switch</span>
          </Link>
        )}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
            }}
            className="hover:bg-surface-container p-1.5 rounded-full transition-transform active:scale-95 relative flex items-center"
          >
            <span className="material-symbols-outlined text-outline">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-600 rounded-full ring-2 ring-surface-container-lowest"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-[-40px] md:right-0 mt-2 w-[320px] max-w-[90vw] bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-slide-in-up">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                <span className="text-label-md font-bold text-slate-800 uppercase tracking-wider">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] text-primary hover:underline font-bold uppercase cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="text-body-sm text-outline text-center py-6">No new notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                      className={`py-2 px-1 flex justify-between items-start gap-2 cursor-pointer transition-colors hover:bg-surface-container-low/50 ${
                        !notif.isRead ? 'bg-surface-container-low/20 font-semibold' : ''
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {!notif.isRead && (
                            <span className="h-1.5 w-1.5 bg-primary rounded-full shrink-0"></span>
                          )}
                          <p className="text-label-md text-on-surface truncate">{notif.title}</p>
                        </div>
                        <p className="text-body-sm text-on-surface-variant line-clamp-2 font-normal">{notif.body}</p>
                        <p className="text-[9px] text-outline font-normal">
                          {formatNotifDate(notif.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDismiss(notif.id, e)}
                        className="p-0.5 hover:bg-surface-container rounded-full text-outline hover:text-on-surface shrink-0"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-[1px] bg-outline-variant"></div>

        <div className="flex items-center gap-3">
          <Link href="/profile" className="flex items-center gap-3 hover:opacity-85 transition-opacity text-right">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-outline-variant" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold text-xs border border-blue-200">
                {user.firstName?.[0] ?? '?'}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-label-md font-bold text-on-surface leading-tight">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-outline font-semibold uppercase tracking-wider mt-0.5">{user.designation || 'Staff'}</p>
            </div>
          </Link>
          <button onClick={logout} className="hover:bg-surface-container p-1.5 rounded-full transition-transform active:scale-95 cursor-pointer">
            <span className="material-symbols-outlined text-outline">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
