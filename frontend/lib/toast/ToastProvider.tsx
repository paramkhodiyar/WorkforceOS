'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContextType {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/** Map raw API/status error strings to friendly human-readable messages */
function humanizeError(raw: string): { title: string; message: string } {
  const lower = raw.toLowerCase();

  if (lower.includes('request failed with status 403') || lower.includes('forbidden'))
    return { title: 'Access Denied', message: "You don't have permission to perform this action. Contact your administrator." };
  if (lower.includes('request failed with status 401') || lower.includes('unauthorized'))
    return { title: 'Session Expired', message: 'Your session has expired. Please log in again.' };
  if (lower.includes('request failed with status 422') || lower.includes('validation failed'))
    return { title: 'Invalid Input', message: 'Some fields have invalid values. Please check your form and try again.' };
  if (lower.includes('request failed with status 500') || lower.includes('internal server'))
    return { title: 'Server Error', message: 'Something went wrong on our end. Please try again in a moment.' };
  if (lower.includes('request failed with status 404') || lower.includes('not found'))
    return { title: 'Not Found', message: 'The requested item could not be found.' };
  if (lower.includes('request failed with status 429') || lower.includes('too many'))
    return { title: 'Slow Down', message: "You're sending requests too fast. Please wait a moment and try again." };
  if (lower.includes('request failed with status 409') || lower.includes('conflict'))
    return { title: 'Conflict', message: 'This item already exists or there was a scheduling conflict.' };
  if (lower.includes('network') || lower.includes('fetch'))
    return { title: 'Network Error', message: "Couldn't reach the server. Check your internet connection." };
  if (lower.includes('start time must be before end time'))
    return { title: 'Invalid Time Range', message: 'The start time must be before the end time.' };

  // Clean up tech residue from the raw message before showing it
  const cleaned = raw
    .replace(/request failed with status \d+/gi, '')
    .replace(/at (request|async|loadData|loadDashboard)\s?\(.*?\)/gi, '')
    .trim();

  return { title: 'Error', message: cleaned || 'Something went wrong. Please try again.' };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, rawMessage: string, rawTitle?: string) => {
    const id = Math.random().toString(36).substring(2, 9);

    let title: string;
    let message: string;

    if (type === 'error' && !rawTitle) {
      const humanized = humanizeError(rawMessage);
      title = humanized.title;
      message = humanized.message;
    } else {
      title = rawTitle || (type === 'success' ? 'Done!' : type === 'warning' ? 'Heads up' : 'Info');
      message = rawMessage;
    }

    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string, title?: string) => addToast('success', message, title), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast('error', message, title), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast('info', message, title), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast('warning', message, title), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
        {toasts.map((toast) => {
          let icon = 'info';
          let borderClass = 'border-blue-400';
          let iconBg = 'bg-blue-100 text-blue-600';
          let bgClass = 'bg-white';
          let titleClass = 'text-blue-800';
          let msgClass = 'text-blue-600';

          if (toast.type === 'success') {
            icon = 'check_circle';
            borderClass = 'border-emerald-400';
            iconBg = 'bg-emerald-100 text-emerald-600';
            titleClass = 'text-emerald-800';
            msgClass = 'text-emerald-600';
          } else if (toast.type === 'error') {
            icon = 'error';
            borderClass = 'border-rose-400';
            iconBg = 'bg-rose-100 text-rose-600';
            titleClass = 'text-rose-800';
            msgClass = 'text-rose-600';
          } else if (toast.type === 'warning') {
            icon = 'warning';
            borderClass = 'border-amber-400';
            iconBg = 'bg-amber-100 text-amber-600';
            titleClass = 'text-amber-800';
            msgClass = 'text-amber-600';
          }

          return (
            <div
              key={toast.id}
              className={`${bgClass} border-l-4 ${borderClass} rounded-xl shadow-xl pointer-events-auto flex items-start gap-3 p-4 animate-slide-in-right`}
              role="alert"
            >
              {/* Icon */}
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className={`text-xs font-extrabold leading-tight ${titleClass}`}>{toast.title}</p>
                <p className={`text-[11px] font-medium leading-snug mt-0.5 ${msgClass}`}>{toast.message}</p>
              </div>

              {/* Close */}
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
