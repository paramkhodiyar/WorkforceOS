'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { useToast } from '../../../lib/toast/ToastProvider';
import { TableSkeleton } from '../../../components/ui/Skeleton';

export default function OpsStatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [empStats, setEmpStats] = useState<any>(null);
  const [empLoading, setEmpLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const systemRole = user.systemRole;
      const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
      const isHR = (user.roles || []).some((r: any) => r.roleName === 'HR_MANAGER') || systemRole === 'HR';
      if (!isAdmin && !isHR) {
        router.push('/unauthorized');
      }
    }
  }, [user, router]);

  async function loadOpsStats() {
    try {
      setLoading(true);
      const res = await api.stats.getOperationsStats();
      setStats(res.data);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load operations stats');
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployeeStats(empId: string) {
    try {
      setEmpLoading(true);
      const res = await api.stats.getEmployeeStats(empId);
      setEmpStats(res.data);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load employee details');
    } finally {
      setEmpLoading(false);
    }
  }

  useEffect(() => {
    loadOpsStats();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadEmployeeStats(selectedEmployeeId);
    } else {
      setEmpStats(null);
    }
  }, [selectedEmployeeId]);

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Operations Stats</h1>
          <p className="text-body-sm text-outline">Loading organization analytics...</p>
        </div>
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  const { overview, departments, lateEmployees, leaveFrequencyEmployees } = stats || {};

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Operations Stats</h1>
        <p className="text-body-sm text-outline">Real-time attendance patterns, leave frequency, and task blockages</p>
      </div>

      {/* Grid Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Attendance Rate</span>
            <span className="material-symbols-outlined text-[20px] text-green-500">check_circle</span>
          </div>
          <div>
            <h3 className="text-headline-sm font-black text-slate-900">
              {overview ? `${(100 - overview.lateRate).toFixed(1)}%` : '0%'}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">
              Late Check-ins: {overview?.lateRate}% (30d)
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Check-in Time</span>
            <span className="material-symbols-outlined text-[20px] text-blue-500">schedule</span>
          </div>
          <div>
            <h3 className="text-headline-sm font-black text-slate-900">
              {overview?.avgCheckInTime || 'N/A'}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">
              Today checked in: {overview?.todayCheckedIn} / {overview?.activeEmployees}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Task Blockages</span>
            <span className="material-symbols-outlined text-[20px] text-red-500">error</span>
          </div>
          <div>
            <h3 className="text-headline-sm font-black text-slate-900">
              {overview?.blockedTasksCount || 0}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">
              Overdue: {overview?.overdueTasksCount} | Late submissions: {overview?.lateTaskCount}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Leaves</span>
            <span className="material-symbols-outlined text-[20px] text-amber-500">event_busy</span>
          </div>
          <div>
            <h3 className="text-headline-sm font-black text-slate-900">
              {overview?.pendingLeaveRequests || 0}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">
              Leave pending rate: {overview?.leavePendingRate}% (30d)
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Attendance - Late Frequency */}
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-title-sm font-bold text-slate-800">Top Late Employees</h2>
              <p className="text-[10px] text-slate-500 font-medium">Most check-ins flagged late in the last 30 days</p>
            </div>
            <span className="material-symbols-outlined text-[20px] text-slate-400">gavel</span>
          </div>
          <div className="p-4 space-y-3">
            {lateEmployees && lateEmployees.length > 0 ? (
              lateEmployees.map((emp: any) => (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-body-sm shadow-sm">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div>
                      <h4 className="text-body-xs font-bold text-slate-850 group-hover:text-primary transition-colors">
                        {emp.firstName} {emp.lastName}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {emp.designation} • {emp.department?.name || 'No Dept'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold">
                    {emp.lateCount} Late
                  </div>
                </div>
              ))
            ) : (
              <p className="text-body-xs text-slate-500 py-6 text-center">No late logs in the last 30 days.</p>
            )}
          </div>
        </div>

        {/* Leave - High Frequency */}
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-title-sm font-bold text-slate-800">High Leave Frequency</h2>
              <p className="text-[10px] text-slate-500 font-medium">Most leave applications requested in the last 30 days</p>
            </div>
            <span className="material-symbols-outlined text-[20px] text-slate-400">bar_chart</span>
          </div>
          <div className="p-4 space-y-3">
            {leaveFrequencyEmployees && leaveFrequencyEmployees.length > 0 ? (
              leaveFrequencyEmployees.map((emp: any) => (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-body-sm shadow-sm">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div>
                      <h4 className="text-body-xs font-bold text-slate-850 group-hover:text-primary transition-colors">
                        {emp.firstName} {emp.lastName}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {emp.designation} • {emp.department?.name || 'No Dept'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold">
                    {emp.leaveCount} Requests
                  </div>
                </div>
              ))
            ) : (
              <p className="text-body-xs text-slate-500 py-6 text-center">No leave requests in the last 30 days.</p>
            )}
          </div>
        </div>
      </div>

      {/* Departments Overview */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-title-sm font-bold text-slate-800">Departments Distribution</h2>
          <p className="text-[10px] text-slate-500 font-medium">Headcount density per department</p>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {departments && departments.map((dept: any) => (
            <div key={dept.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
              <h4 className="text-body-xs font-bold text-slate-800 line-clamp-1">{dept.name}</h4>
              <p className="text-title-lg font-black text-slate-900 mt-1">{dept.memberCount}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Employees</p>
            </div>
          ))}
        </div>
      </div>

      {/* Drill-down Employee Modal */}
      {selectedEmployeeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-6 animate-scale-up">
            <div className="flex justify-between items-start">
              <h3 className="text-title-md font-extrabold text-slate-900 tracking-tight">Employee Drill-down</h3>
              <button
                onClick={() => setSelectedEmployeeId(null)}
                className="text-slate-400 hover:text-slate-650"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {empLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-body-xs text-slate-500 font-medium">Fetching stats...</p>
              </div>
            ) : empStats ? (
              <div className="space-y-6">
                {/* Profile header */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-title-md">
                    {empStats.user.firstName?.[0]}{empStats.user.lastName?.[0]}
                  </div>
                  <div>
                    <h4 className="text-body-sm font-black text-slate-900">{empStats.user.firstName} {empStats.user.lastName}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">{empStats.user.designation} • {empStats.user.department?.name || 'No Dept'}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Attendance Rate</p>
                    <p className="text-title-md font-black text-slate-900 mt-0.5">{empStats.attendanceRate}%</p>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">{empStats.lateCount} late in 30d</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Leaves (30d)</p>
                    <p className="text-title-md font-black text-slate-900 mt-0.5">{empStats.totalLeave}</p>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">{empStats.pendingLeave} pending approval</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Assigned Tasks</p>
                    <p className="text-title-md font-black text-slate-900 mt-0.5">{empStats.assignedTasks}</p>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">Active backlog</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Overdue Tasks</p>
                    <p className="text-title-md font-black text-red-600 mt-0.5">{empStats.overdueTasks}</p>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">Missed deadlines</p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => router.push(`/profile?id=${empStats.user.id}`)}
                    className="inline-flex items-center gap-1.5 text-body-xs font-bold text-primary hover:text-blue-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    <span>View Full Employee Profile</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-body-xs text-slate-500 py-6">Could not fetch statistics.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
