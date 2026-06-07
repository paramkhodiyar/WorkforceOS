'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<string[]>([]);
  
  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isFinance = userRoles.some((r: any) => r.roleName === 'FINANCE_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  useEffect(() => {
    async function loadData() {
      try {
        const orgRes = await api.organization.get();
        setFeatures(orgRes.data.enabledFeatures || []);
        
        if (isAdmin || isHR) {
          const empList = await api.employees.list();
          const leaveApprovals = await api.leave.pendingApprovals();
          setMetrics({
            employeeCount: empList.data?.length || 0,
            pendingLeaves: leaveApprovals.data?.length || 0,
          });
        } else if (isFinance) {
          const payrollList = await api.payroll.list();
          const runs = await api.payroll.runs();
          setMetrics({
            totalPayslips: payrollList.data?.length || 0,
            completedRuns: runs.data?.length || 0,
          });
        } else {
          const leaveRes = await api.leave.balances();
          const tasksRes = await api.tasks.list();
          setMetrics({
            leaveBalance: leaveRes.data || [],
            openTasks: tasksRes.data?.filter((t: any) => t.status !== 'DONE')?.length || 0,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isAdmin, isHR, isFinance]);

  async function handleToggleFeature(featureName: string) {
    const nextFeatures = features.includes(featureName)
      ? features.filter(f => f !== featureName)
      : [...features, featureName];
    
    try {
      await api.organization.updateFeatures(nextFeatures);
      setFeatures(nextFeatures);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Welcome, {user.firstName}!</h1>
        <p className="text-body-sm text-outline">Here is what is happening in Acme Corporation today.</p>
      </div>

      {(isAdmin || isHR) && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:border-outline transition-colors">
            <p className="text-section-cap text-outline uppercase font-semibold">Total Employees</p>
            <h3 className="text-headline-lg font-bold mt-2">{metrics.employeeCount}</h3>
            <Link href="/employees" className="text-label-sm text-primary hover:underline mt-4 inline-block font-semibold">
              View Directory
            </Link>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:border-outline transition-colors">
            <p className="text-section-cap text-outline uppercase font-semibold">Pending Leave Approvals</p>
            <h3 className="text-headline-lg font-bold mt-2">{metrics.pendingLeaves}</h3>
            <Link href="/leave" className="text-label-sm text-primary hover:underline mt-4 inline-block font-semibold">
              Go to Leaves Queue
            </Link>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:border-outline transition-colors">
            <p className="text-section-cap text-outline uppercase font-semibold">Quick Enroll</p>
            <p className="text-body-sm text-outline mt-1">Add new staff members instantly</p>
            <Link href="/employees" className="bg-primary hover:bg-blue-700 text-on-primary px-4 py-2 rounded-lg text-label-sm font-bold mt-4 inline-block shadow-sm transition-all active:scale-[0.98]">
              Enroll Employee
            </Link>
          </div>
        </div>
      )}

      {isFinance && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:border-outline transition-colors">
            <p className="text-section-cap text-outline uppercase font-semibold">Total Payslips Managed</p>
            <h3 className="text-headline-lg font-bold mt-2">{metrics.totalPayslips}</h3>
            <Link href="/payroll" className="text-label-sm text-primary hover:underline mt-4 inline-block font-semibold">
              Review Payslips
            </Link>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:border-outline transition-colors">
            <p className="text-section-cap text-outline uppercase font-semibold">Completed Runs</p>
            <h3 className="text-headline-lg font-bold mt-2">{metrics.completedRuns}</h3>
            <Link href="/payroll" className="text-label-sm text-primary hover:underline mt-4 inline-block font-semibold">
              Trigger New Run
            </Link>
          </div>
        </div>
      )}

      {!isAdmin && !isHR && !isFinance && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:border-outline transition-colors">
            <p className="text-section-cap text-outline uppercase font-semibold">Pending Tasks</p>
            <h3 className="text-headline-lg font-bold mt-2">{metrics.openTasks}</h3>
            <Link href="/tasks" className="text-label-sm text-primary hover:underline mt-4 inline-block font-semibold">
              Open Task Board
            </Link>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:border-outline transition-colors col-span-2">
            <p className="text-section-cap text-outline uppercase font-semibold">My Leave Balances</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {metrics.leaveBalance.map((bal: any) => (
                <div key={bal.id} className="p-3 bg-surface-container-low border border-outline-variant rounded-lg">
                  <p className="text-[10px] text-outline font-bold uppercase">{bal.leaveType}</p>
                  <p className="text-headline-sm font-bold text-on-surface mt-1">{bal.remaining} / {bal.allocated} Left</p>
                </div>
              ))}
            </div>
            <Link href="/leave" className="text-label-sm text-primary hover:underline mt-4 inline-block font-semibold">
              Apply for Leave
            </Link>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <h2 className="text-headline-sm font-bold text-on-surface mb-2">Enable or Disable System Modules</h2>
          <p className="text-body-sm text-outline mb-6">Manage availability of organization tools for all employees.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'assets', label: 'Assets Management', desc: 'Hardware inventory & tracking' },
              { id: 'knowledge', label: 'Knowledge Base', desc: 'Policy wikis & handbook library' },
              { id: 'payroll', label: 'Payroll & Salaries', desc: 'Payslips generation & tax inputs' },
              { id: 'leave', label: 'Leave Requests', desc: 'Accruals tracking & workflows' }
            ].map(mod => {
              const isEnabled = features.includes(mod.id);
              return (
                <div key={mod.id} className="p-4 bg-surface-container-low border border-outline-variant rounded-lg flex flex-col justify-between">
                  <div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isEnabled ? 'bg-green-100 text-green-800' : 'bg-zinc-200 text-zinc-600'}`}>
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <h3 className="text-label-md font-bold text-on-surface mt-3">{mod.label}</h3>
                    <p className="text-[11px] text-outline mt-1">{mod.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature(mod.id)}
                    className={`mt-4 w-full py-2 rounded-lg text-[11px] font-bold uppercase transition-all active:scale-95 border ${
                      isEnabled
                        ? 'bg-error-container text-error border-error-container hover:bg-error/15'
                        : 'bg-primary-container text-on-primary-container border-primary-container hover:bg-primary-container/85'
                    }`}
                  >
                    {isEnabled ? 'Disable Module' : 'Enable Module'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
