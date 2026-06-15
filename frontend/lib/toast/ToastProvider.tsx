'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string) => addToast('success', message), [addToast]);
  const error = useCallback((message: string) => addToast('error', message), [addToast]);
  const info = useCallback((message: string) => addToast('info', message), [addToast]);
  const warning = useCallback((message: string) => addToast('warning', message), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => {
          let icon = 'info';
          let borderClass = 'border-blue-500';
          let textClass = 'text-blue-800';
          let bgClass = 'bg-blue-50/90';
          let iconColor = 'text-blue-500';

          if (toast.type === 'success') {
            icon = 'check_circle';
            borderClass = 'border-emerald-500';
            textClass = 'text-emerald-800';
            bgClass = 'bg-emerald-50/95';
            iconColor = 'text-emerald-500';
          } else if (toast.type === 'error') {
            icon = 'error';
            borderClass = 'border-rose-500';
            textClass = 'text-rose-800';
            bgClass = 'bg-rose-50/95';
            iconColor = 'text-rose-500';
          } else if (toast.type === 'warning') {
            icon = 'warning';
            borderClass = 'border-amber-500';
            textClass = 'text-amber-800';
            bgClass = 'bg-amber-50/95';
            iconColor = 'text-amber-500';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${borderClass} ${bgClass} ${textClass} shadow-lg backdrop-blur-md pointer-events-auto transform translate-y-0 transition-all duration-300 animate-slide-in-right max-w-sm ml-auto`}
              role="alert"
            >
              <span className={`material-symbols-outlined shrink-0 ${iconColor}`}>{icon}</span>
              <div className="flex-1 text-xs font-semibold leading-relaxed pr-2">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 flex items-center justify-center p-0.5 rounded-full hover:bg-black/5"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
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
