'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function handleResult(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  const iconMap = {
    danger:  { icon: 'delete_forever', iconBg: 'bg-rose-100',   iconColor: 'text-rose-600',   confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white' },
    warning: { icon: 'warning',        iconBg: 'bg-amber-100',  iconColor: 'text-amber-600',  confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white' },
    info:    { icon: 'info',           iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   confirmBtn: 'bg-primary hover:bg-blue-700 text-white' },
  };

  const v = iconMap[pending?.variant ?? 'info'];

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {pending && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 animate-slide-in-up space-y-4">

            {/* Icon + Title */}
            <div className="flex items-start gap-4">
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${v.iconBg}`}>
                <span className={`material-symbols-outlined text-[22px] ${v.iconColor}`}>{v.icon}</span>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-[15px] font-extrabold text-slate-800 leading-tight">{pending.title}</h3>
                <p className="text-[12px] text-slate-500 font-medium mt-1 leading-relaxed">{pending.message}</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleResult(false)}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer active:scale-[0.98]"
              >
                {pending.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleResult(true)}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer active:scale-[0.98] ${v.confirmBtn}`}
              >
                {pending.confirmLabel ?? 'Confirm'}
              </button>
            </div>

          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
