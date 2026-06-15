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
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isFinance = userRoles.some((r: any) => r.roleName === 'FINANCE_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  async function loadDashboardData() {
    try {
      const orgRes = await api.organization.get();
      setFeatures(orgRes.data.enabledFeatures || []);

      if (isAdmin || isHR || isManager) {
        let employeesCount = 0;
        let pendingLeavesCount = 0;
        let pendingLeavesList: any[] = [];
        let activities: any[] = [];

        try {
          const empList = await api.employees.list();
          employeesCount = empList.data?.length || 0;
        } catch (e) {
          console.error(e);
        }

        try {
          const leaveApprovals = await api.leave.pendingApprovals();
          pendingLeavesCount = leaveApprovals.data?.length || 0;
          pendingLeavesList = leaveApprovals.data || [];
        } catch (e) {
          console.error(e);
        }

        if (isAdmin) {
          try {
            const auditRes = await api.audit.logs();
            activities = auditRes.data?.slice(0, 5) || [];
          } catch (e) {
            console.error(e);
          }
        }

        setMetrics({
          employeeCount: employeesCount,
          pendingLeaves: pendingLeavesCount,
          absentCount: Math.floor(employeesCount * 0.08),
          onLeaveCount: pendingLeavesCount,
        });

        setRecentActivities(activities);
        setPendingItems(pendingLeavesList);
      } else {
        let balances: any[] = [];
        let openTasksCount = 0;
        let status: any = null;
        let tasksList: any[] = [];

        try {
          const leaveRes = await api.leave.balances();
          balances = leaveRes.data || [];
        } catch (e) {
          console.error(e);
        }

        try {
          const tasksRes = await api.tasks.list();
          openTasksCount = tasksRes.data?.filter((t: any) => t.status !== 'DONE')?.length || 0;
          tasksList = tasksRes.data?.filter((t: any) => t.status !== 'DONE')?.slice(0, 5) || [];
        } catch (e) {
          console.error(e);
        }

        try {
          const attStatus = await api.attendance.getCurrentStatus();
          status = attStatus.data;
        } catch (e) {
          console.error(e);
        }

        setMetrics({
          leaveBalance: balances,
          openTasks: openTasksCount,
        });

        setAttendanceStatus(status);
        setMyTasks(tasksList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [isAdmin, isHR, isFinance, isManager]);

  async function handleToggleFeature(featureName: string) {
    const nextFeatures = features.includes(featureName)
      ? features.filter(f => f !== featureName)
      : [...features, featureName];
    
    try {
      await api.organization.updateFeatures(user.organizationId, nextFeatures);
      setFeatures(nextFeatures);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Dashboard</h1>
          <p className="text-body-sm text-outline">Welcome back, {user.firstName}. Here is your dashboard summary.</p>
        </div>
      </div>

      {(isAdmin || isHR || isManager) && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:border-slate-200/80 transition-all flex items-center justify-between">
              <div>
                <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Total Headcount</p>
                <h3 className="text-headline-lg font-bold text-on-surface mt-1.5">{metrics.employeeCount}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <span className="material-symbols-outlined text-[24px]">group</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:border-slate-200/80 transition-all flex items-center justify-between">
              <div>
                <p className="text-[10px] text-outline font-bold uppercase tracking-wider">On Duty Today</p>
                <h3 className="text-headline-lg font-bold text-green-600 mt-1.5">{metrics.employeeCount - metrics.onLeaveCount}</h3>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <span className="material-symbols-outlined text-[24px]">assignment_turned_in</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:border-slate-200/80 transition-all flex items-center justify-between">
              <div>
                <p className="text-[10px] text-outline font-bold uppercase tracking-wider">On Leave</p>
                <h3 className="text-headline-lg font-bold text-amber-600 mt-1.5">{metrics.onLeaveCount}</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <span className="material-symbols-outlined text-[24px]">flight_takeoff</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:border-slate-200/80 transition-all flex items-center justify-between">
              <div>
                <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Pending Tasks</p>
                <h3 className="text-headline-lg font-bold text-rose-600 mt-1.5">{metrics.pendingLeaves}</h3>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <span className="material-symbols-outlined text-[24px]">pending_actions</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {isAdmin && (
              <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Today's Activity Log</h2>
                  <Link href="/audit" className="text-xs text-primary font-bold hover:underline">View All Logs</Link>
                </div>
                
                {recentActivities.length === 0 ? (
                  <p className="text-body-sm text-outline py-8 text-center">No recent audit log activities recorded today.</p>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((log) => (
                      <div key={log.id} className="flex gap-4 items-start py-1">
                        <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0">
                          <span className="material-symbols-outlined text-[16px]">history</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-semibold text-on-surface">
                            {log.actor?.firstName} {log.actor?.lastName} {log.action.toLowerCase()} {log.module.toLowerCase()}
                          </p>
                          <p className="text-[10px] text-outline mt-0.5 font-medium">
                            Target ID: {log.targetId || '-'} &bull; {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={`${isAdmin ? 'lg:col-span-1' : 'lg:col-span-3'} bg-white border border-slate-100 p-6 rounded-2xl shadow-sm`}>
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-6">Pending Approvals Queue</h2>
              {pendingItems.length === 0 ? (
                <p className="text-body-sm text-outline py-8 text-center">No pending items in your queue.</p>
              ) : (
                <div className="space-y-4">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                      <div>
                        <p className="text-label-sm font-bold text-on-surface">{item.user?.firstName} {item.user?.lastName}</p>
                        <p className="text-[10px] text-outline uppercase font-semibold mt-0.5">{item.leaveType} Leave</p>
                        <p className="text-body-sm text-on-surface-variant font-medium mt-2">"{item.reason}"</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/leave" className="flex-1 py-2 bg-primary text-on-primary text-center rounded-lg text-[11px] font-bold shadow-sm hover:bg-blue-700 transition-colors">
                          Review Queue
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isAdmin && !isHR && !isManager && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-2">Attendance Check-in</h2>
                <p className="text-body-sm text-outline mb-6">Record your clock-in status for today.</p>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-outline font-bold uppercase">Work Mode</p>
                    <p className="text-body-sm font-bold text-on-surface mt-0.5">
                      {attendanceStatus?.workMode || 'WFO'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-outline font-bold uppercase">Status</p>
                    <p className="text-body-sm font-bold text-green-600 mt-0.5">
                      {attendanceStatus?.checkIn ? 'Clocked In' : 'Clocked Out'}
                    </p>
                  </div>
                </div>
                <Link href="/attendance" className="block w-full py-3 bg-primary hover:bg-blue-700 text-on-primary font-bold rounded-xl text-center text-label-md shadow-sm transition-all">
                  Go to Attendance Panel
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">My Leave Allocations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {metrics.leaveBalance.length === 0 ? (
                  <p className="text-body-sm text-outline py-8 text-center sm:col-span-2">No leave records loaded.</p>
                ) : (
                  metrics.leaveBalance.map((bal: any) => (
                    <div key={bal.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-label-sm font-bold text-on-surface">{bal.leaveType}</span>
                        <span className="text-xs font-mono text-outline font-bold">{bal.remaining} / {bal.allocated} Left</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-2 transition-all duration-300"
                          style={{ width: `${(bal.remaining / bal.allocated) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">My Active Tasks</h2>
              <Link href="/tasks" className="text-xs text-primary font-bold hover:underline">Go to Task Board</Link>
            </div>
            {myTasks.length === 0 ? (
              <p className="text-body-sm text-outline py-8 text-center">No pending tasks assigned to you.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-section-cap text-outline uppercase font-semibold">Task ID</th>
                      <th className="px-4 py-3 text-section-cap text-outline uppercase font-semibold">Title</th>
                      <th className="px-4 py-3 text-section-cap text-outline uppercase font-semibold">Priority</th>
                      <th className="px-4 py-3 text-section-cap text-outline uppercase font-semibold">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-body-sm">
                    {myTasks.map(task => (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-on-surface-variant font-semibold">{task.taskId}</td>
                        <td className="px-4 py-3 font-semibold text-on-surface">{task.title}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            task.priority === 'CRITICAL' || task.priority === 'HIGH'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-headline-sm font-bold text-on-surface mb-1">System Feature Controls</h2>
          <p className="text-body-sm text-outline mb-6">Enable or disable module routes across your organization.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { id: 'assets', label: 'Assets Tracker', desc: 'Hardware inventory catalog' },
              { id: 'knowledge', label: 'Knowledge Wiki', desc: 'Handbooks and policies' },
              { id: 'payroll', label: 'Compensation Logs', desc: 'Payslips execution run' },
              { id: 'leave', label: 'Leave Workflows', desc: 'Requests review inbox' }
            ].map(mod => {
              const isEnabled = features.includes(mod.id);
              return (
                <div key={mod.id} className="p-5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      isEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}>
                      {isEnabled ? 'Active' : 'Disabled'}
                    </span>
                    <h3 className="text-label-md font-bold text-on-surface mt-4">{mod.label}</h3>
                    <p className="text-[11px] text-outline mt-1 leading-relaxed">{mod.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature(mod.id)}
                    className={`mt-6 w-full py-2.5 rounded-lg text-[11px] font-bold uppercase transition-all active:scale-95 border cursor-pointer ${
                      isEnabled
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-primary text-on-primary border-primary hover:bg-blue-700'
                    }`}
                  >
                    {isEnabled ? 'Disable' : 'Enable'}
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
