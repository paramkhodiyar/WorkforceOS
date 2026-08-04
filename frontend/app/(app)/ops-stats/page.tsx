'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { useToast } from '../../../lib/toast/ToastProvider';
import { TableSkeleton, ListSkeleton } from '../../../components/ui/Skeleton';

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

  const { overview, departments, lateEmployees, leaveFrequencyEmployees, dailyAttendanceCounts, taskStatusCounts } = stats || {};

  // 1. Check-In Trend Chart Calculations
  const dailyAttendance = dailyAttendanceCounts || [];
  const maxAttendanceCount = Math.max(...dailyAttendance.map((d: any) => d.count), 5);
  const chartPoints = dailyAttendance.map((d: any, index: number) => {
    const x = 50 + (index * (400 / Math.max(dailyAttendance.length - 1, 1)));
    const y = 160 - (d.count * 120 / maxAttendanceCount);
    let label = d.date;
    try {
      const dateObj = new Date(d.date);
      label = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    } catch {}
    return { x, y, label, count: d.count };
  });

  const linePath = chartPoints.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = chartPoints.length > 0
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} 170 L ${chartPoints[0].x} 170 Z`
    : '';

  // 2. Task Status Donut Calculations
  const taskStatus = taskStatusCounts || [];
  const totalTasksCount = taskStatus.reduce((acc: number, curr: any) => acc + curr.count, 0);

  const statusColors: any = {
    TODO: '#94a3b8',
    IN_PROGRESS: '#f59e0b',
    IN_REVIEW: '#8b5cf6',
    COMPLETED: '#10b981',
    CLOSED: '#10b981',
    APPROVED: '#10b981',
    BLOCKED: '#ef4444'
  };

  const statusLabels: any = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    COMPLETED: 'Completed',
    CLOSED: 'Closed',
    APPROVED: 'Approved',
    BLOCKED: 'Blocked'
  };

  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let currentOffset = 0;

  const donutSegments = taskStatus.map((item: any) => {
    const percentage = totalTasksCount > 0 ? (item.count / totalTasksCount) * 100 : 0;
    const strokeDash = `${(percentage * donutCircumference) / 100} ${donutCircumference}`;
    const strokeOffset = donutCircumference - currentOffset;
    currentOffset += (percentage * donutCircumference) / 100;
    return {
      ...item,
      label: statusLabels[item.status] || item.status,
      percentage,
      strokeDash,
      strokeOffset,
      color: statusColors[item.status] || '#cbd5e1'
    };
  });

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
      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-in Activity Trend (2/3 width) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:col-span-2 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-title-sm font-bold text-slate-800">Check-in Activity Trend</h2>
              <p className="text-[10px] text-slate-500 font-medium">Daily attendance check-in volumes for the past week</p>
            </div>
            <span className="text-[10px] font-bold text-primary bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">calendar_today</span> Last 7 Days
            </span>
          </div>

          <div className="relative flex-1 min-h-[200px] flex items-end">
            {chartPoints.length > 0 ? (
              <div className="w-full">
                <svg viewBox="0 0 500 200" className="w-full h-48 overflow-visible">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="40" y1="40" x2="480" y2="40" stroke="#f8fafc" strokeWidth="1" />
                  <line x1="40" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="160" x2="480" y2="160" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Area Fill */}
                  <path d={areaPath} fill="url(#areaGradient)" />

                  {/* Stroke Line */}
                  <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Interactive Points */}
                  {chartPoints.map((p: any, idx: number) => (
                    <g key={idx} className="group/pt cursor-pointer">
                      <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" className="transition-all duration-150 group-hover/pt:r-[6px]" />
                      <circle cx={p.x} cy={p.y} r="9" fill="#3b82f6" className="opacity-0 group-hover/pt:opacity-15 transition-opacity duration-150" />
                      
                      {/* Floating tooltip count */}
                      <g className="opacity-0 group-hover/pt:opacity-100 pointer-events-none transition-opacity duration-150">
                        <rect x={p.x - 18} y={p.y - 30} width="36" height="20" rx="6" fill="#1e293b" />
                        <text x={p.x} y={p.y - 17} textAnchor="middle" fill="#ffffff" className="text-[10px] font-bold font-sans">
                          {p.count}
                        </text>
                      </g>

                      {/* X-axis labels */}
                      <text x={p.x} y="182" textAnchor="middle" className="text-[9px] font-bold fill-slate-450 uppercase tracking-wider">
                        {p.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center py-12">
                <span className="material-symbols-outlined text-[32px] text-slate-300">show_chart</span>
                <p className="text-body-xs text-slate-450 mt-1 font-semibold">Insufficient check-in trend data</p>
              </div>
            )}
          </div>
        </div>

        {/* Task Status Allocation (1/3 width) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-title-sm font-bold text-slate-800">Task Allocation</h2>
            <p className="text-[10px] text-slate-500 font-medium">Breakdown of current task statuses</p>
          </div>

          {totalTasksCount > 0 ? (
            <div className="flex flex-col items-center space-y-6">
              {/* Donut Circle */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="9" />
                  {donutSegments.map((seg: any, idx: number) => (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="9"
                      strokeDasharray={seg.strokeDash}
                      strokeDashoffset={seg.strokeOffset}
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-title-lg font-black text-slate-900 leading-none">{totalTasksCount}</span>
                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider mt-0.5">Tasks</span>
                </div>
              </div>

              {/* Status List Legend */}
              <div className="w-full grid grid-cols-2 gap-2 text-left">
                {donutSegments.map((seg: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-750 block truncate leading-none">{seg.label}</span>
                      <span className="text-[9px] font-semibold text-slate-400 mt-0.5">{seg.count} ({seg.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <span className="material-symbols-outlined text-[32px] text-slate-300">pie_chart</span>
              <p className="text-body-xs text-slate-450 mt-1 font-semibold">No tasks currently tracked</p>
            </div>
          )}
        </div>
      </div>
      {/* Main Stats Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Attendance - Late Frequency */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[320px]">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-title-sm font-bold text-slate-800">Top Late Employees</h2>
              <p className="text-[10px] text-slate-500 font-medium">Most check-ins flagged late in the last 30 days</p>
            </div>
            <span className="material-symbols-outlined text-[20px] text-slate-400">gavel</span>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
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
              <div className="h-full flex items-center justify-center py-6">
                <p className="text-body-xs text-slate-500 text-center">No late logs in the last 30 days.</p>
              </div>
            )}
          </div>
        </div>

        {/* Leave - High Frequency */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[320px]">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-title-sm font-bold text-slate-800">High Leave Frequency</h2>
              <p className="text-[10px] text-slate-500 font-medium">Most leave applications requested in the last 30 days</p>
            </div>
            <span className="material-symbols-outlined text-[20px] text-slate-400">bar_chart</span>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
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
              <div className="h-full flex items-center justify-center py-6">
                <p className="text-body-xs text-slate-500 text-center">No leave requests in the last 30 days.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Departments Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
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
              <ListSkeleton count={3} />
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
