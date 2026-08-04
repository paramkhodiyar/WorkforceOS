'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthProvider';

interface PermissionGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // e.g. ['SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER']
  requireAdmin?: boolean;
  requireHR?: boolean;
  requireManager?: boolean;
}

export function PermissionGuard({
  children,
  allowedRoles,
  requireAdmin = false,
  requireHR = false,
  requireManager = false,
}: PermissionGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="h-14 w-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
            <span className="material-symbols-outlined text-[30px]">lock</span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Authentication Required</h2>
          <p className="text-slate-500 text-xs leading-relaxed font-medium">
            Please log in to your WorkforceOS account to access this page.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-98"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const systemRole = user.systemRole;
  const userRoles = user.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER') || systemRole === 'HR';
  const isFinance = userRoles.some((r: any) => r.roleName === 'FINANCE_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isLeaderOrHead = (user.departmentHead && user.departmentHead.length > 0) || (user.teamLead && user.teamLead.length > 0);
  const isActualManager = isManager || isLeaderOrHead;
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN' || user.originalRole === 'SYS_OWNER';

  let hasAccess = true;

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleNames = [systemRole, ...userRoles.map((r: any) => r.roleName)];
    hasAccess = allowedRoles.some((r) => userRoleNames.includes(r)) || isAdmin;
  }

  if (requireAdmin && !isAdmin) {
    hasAccess = false;
  }

  if (requireHR && !isAdmin && !isHR) {
    hasAccess = false;
  }

  if (requireManager && !isAdmin && !isHR && !isActualManager) {
    hasAccess = false;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="h-14 w-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <span className="material-symbols-outlined text-[32px]">shield_lock</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full">
              Access Restricted
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 pt-2">Permissions Required</h2>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed font-medium">
            You do not have the necessary security role ({user.systemRole}) to view this administrative resource. Contact your organization administrator if you believe this is an error.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-block w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-98"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
