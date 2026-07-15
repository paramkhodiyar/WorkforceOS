'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthProvider';
import { api } from '../../lib/api/client';

export default function TopNavBar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) return null;

  async function fetchNotifications() {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      return;
    }
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
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between px-6 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 md:hidden">
          <img 
            src={user?.organization?.logoUrl || "/workforceoslogo.png"} 
            alt={user?.organization?.name || "Logo"} 
            className="h-6 w-6 object-contain rounded bg-white border border-slate-200/50" 
          />
          <h2 className="text-[11px] font-bold text-slate-800 tracking-tight uppercase truncate max-w-[120px]">
            {user?.organization?.name || "WorkforceOS"}
          </h2>
          <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">WOS</span>
        </div>
        <div className="relative hidden sm:flex items-center gap-2 select-none">
          <style>{`
            @keyframes wave {
              0% { transform: rotate( 0.0deg) }
              10% { transform: rotate(14.0deg) }
              20% { transform: rotate(-8.0deg) }
              30% { transform: rotate(14.0deg) }
              40% { transform: rotate(-4.0deg) }
              50% { transform: rotate(10.0deg) }
              60% { transform: rotate( 0.0deg) }
             100% { transform: rotate( 0.0deg) }
            }
            @keyframes fadeInUp {
              0% { opacity: 0; transform: translateY(6px); filter: blur(2px); }
              100% { opacity: 1; transform: translateY(0); filter: blur(0); }
            }
            .animate-wave {
              animation: wave 2.2s infinite;
              transform-origin: 70% 70%;
              display: inline-block;
            }
            .animate-fade-in-up {
              animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .gradient-greeting {
              background: linear-gradient(135deg, #0f172a 0%, #2563eb 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
          `}</style>
          <span className="animate-wave text-title-md">👋</span>
          <span className="text-body-sm font-black text-slate-800 tracking-tight animate-fade-in-up">
            <span className="gradient-greeting">
              {(() => {
                const hr = new Date().getHours();
                if (hr < 12) return 'Good morning';
                if (hr < 17) return 'Good afternoon';
                return 'Good evening';
              })()}
              , {user?.firstName || 'User'}
            </span>
            <span className="ml-1.5 text-body-md">
              {(() => {
                const hr = new Date().getHours();
                if (hr < 12) return '☕';
                if (hr < 17) return '☀️';
                return '🌆';
              })()}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
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
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] text-primary hover:underline font-bold uppercase cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
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

        <div className="h-8 w-[1px] bg-outline-variant"></div>

        <div className="flex items-center gap-3">
          <Link href="/profile" className="flex items-center gap-3 hover:opacity-85 transition-opacity text-right">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-outline-variant" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold text-xs border border-blue-200">
                {user.firstName[0]}
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
