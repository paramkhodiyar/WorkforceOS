'use client';

import React from 'react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] font-sans p-6 text-center">
      <div className="max-w-md space-y-4">
        <span className="material-symbols-outlined text-[64px] text-error">gavel</span>
        <h1 className="text-headline-md font-bold text-on-surface">Access Denied</h1>
        <p className="text-body-sm text-outline">
          Your active roles or scopes do not permit access to this resource or module. Please contact your system administrator if you believe this is in error.
        </p>
        <div className="pt-4">
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-label-sm font-bold shadow-sm transition-all active:scale-95 inline-block"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
