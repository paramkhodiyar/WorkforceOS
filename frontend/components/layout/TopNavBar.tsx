'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, SEED_USERS } from '../../lib/auth/AuthProvider';
import { api } from '../../lib/api/client';

export default function TopNavBar() {
  const { user, quickLogin, logout } = useAuth();
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) return null;

  async function handleQuickSwitch(email: string) {
    setShowDevMenu(false);
    try {
      await quickLogin(email);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchNotifications() {
    try {
      const res = await api.notifications.list();
      setNotifications(res.data || []);
      const countRes = await api.notifications.unreadCount();
      setUnreadCount(countRes.data?.count || 0);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  async function handleMarkRead(id: string) {
    try {
      await api.notifications.markRead(id);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await api.notifications.readAll();
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDismiss(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.notifications.dismiss(id);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-60 h-16 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between px-6 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 md:hidden">
          <img src="/workforceoslogo.png" alt="Logo" className="h-6 w-6 object-contain rounded" />
          <h2 className="text-label-md font-bold text-primary tracking-wider uppercase">WorkforceOS</h2>
        </div>
        <div className="relative hidden sm:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">search</span>
          <input
            className="pl-10 pr-4 py-1.5 bg-surface-container-low border-none rounded-lg text-body-sm focus:ring-1 focus:ring-primary w-64"
            placeholder="Search records..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowDevMenu(false);
            }}
            className="hover:bg-surface-container p-1.5 rounded-full transition-transform active:scale-95 relative flex items-center"
          >
            <span className="material-symbols-outlined text-outline">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-600 rounded-full ring-2 ring-surface-container-lowest"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-3 z-50">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant mb-2">
                <span className="text-label-md font-bold text-on-surface uppercase tracking-wider">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] text-primary hover:underline font-bold uppercase"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant">
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
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

        <div className="relative">
          <button
            onClick={() => {
              setShowDevMenu(!showDevMenu);
              setShowNotifications(false);
            }}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300 px-3 py-1 rounded text-[11px] font-bold tracking-wider flex items-center gap-1 active:scale-95 duration-100"
          >
            <span className="material-symbols-outlined text-[14px]">terminal</span>
            DEV SWITCHER
          </button>
          
          {showDevMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-2 z-50">
              <p className="text-[10px] text-outline font-bold px-3 py-1.5 uppercase tracking-wider">Quick Switch Role</p>
              <div className="max-h-60 overflow-y-auto">
                {SEED_USERS.map((seed) => (
                  <button
                    key={seed.email}
                    onClick={() => handleQuickSwitch(seed.email)}
                    className="w-full text-left px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container rounded-lg transition-colors flex flex-col"
                  >
                    <span className="font-semibold">{seed.label}</span>
                    <span className="text-[10px] text-outline">{seed.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-[1px] bg-outline-variant"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-label-md font-bold text-on-surface">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] text-outline font-semibold uppercase tracking-wider">{user.designation || 'Staff'}</p>
          </div>
          <button onClick={logout} className="hover:bg-surface-container p-1.5 rounded-full transition-transform active:scale-95">
            <span className="material-symbols-outlined text-outline">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
