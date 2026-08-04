'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';
import LiveClock from '../../../components/dashboard/LiveClock';
import { CardSkeleton, TableSkeleton } from '../../../components/ui/Skeleton';
import { triggerHaptic } from '../../../lib/utils/haptics';

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<string[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);

  const [checking, setChecking] = useState(false);
  const [workMode, setWorkMode] = useState<'WFO' | 'WFH'>('WFO');
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!attendanceStatus?.checkIn || attendanceStatus?.checkOut) {
      setElapsed('');
      return;
    }
    const checkInTime = new Date(attendanceStatus.checkIn).getTime();
    const interval = setInterval(() => {
      const diff = Date.now() - checkInTime;
      if (diff < 0) {
        setElapsed('00h 00m 00s');
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(hrs).padStart(2,'0')}h ${String(mins).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [attendanceStatus]);

  async function handleQuickCheckIn() {
    if (checking) return;
    setChecking(true);

    const performCheckIn = async (gpsLat?: number, gpsLng?: number) => {
      try {
        await api.attendance.checkIn({
          workMode,
          gpsLat,
          gpsLng
        });
        toast.success('Successfully clocked in!');
        const attStatus = await api.attendance.getCurrentStatus();
        setAttendanceStatus(attStatus.data);
      } catch (err: any) {
        toast.error(err.message || 'Clock-in failed');
      } finally {
        setChecking(false);
      }
    };

    if (workMode === 'WFO' && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          performCheckIn(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          toast.warning('Location access denied. Clocking in without GPS verification.');
          performCheckIn();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      performCheckIn();
    }
  }

  async function handleQuickCheckOut() {
    if (checking) return;
    setChecking(true);
    try {
      await api.attendance.checkOut();
      toast.success('Successfully clocked out!');
      const attStatus = await api.attendance.getCurrentStatus();
      setAttendanceStatus(attStatus.data);
    } catch (err: any) {
      toast.error(err.message || 'Clock-out failed');
    } finally {
      setChecking(false);
    }
  }

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isFinance = userRoles.some((r: any) => r.roleName === 'FINANCE_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
  const isClockedIn = !!(attendanceStatus?.checkIn && !attendanceStatus?.checkOut);
  const isShiftCompleted = !!(attendanceStatus?.checkIn && attendanceStatus?.checkOut);

  async function loadDashboardData() {
    try {
      const orgRes = await api.organization.get();
      setFeatures(orgRes.data.enabledFeatures || []);

      // Fetch attendance status once, shared by both admin and employee branches
      try {
        const attStatus = await api.attendance.getCurrentStatus();
        setAttendanceStatus(attStatus.data);
      } catch (e) {
        console.error(e);
      }

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
          onLeaveCount: pendingLeavesCount,
        });

        setRecentActivities(activities);
        setPendingItems(pendingLeavesList);
      } else {
        let balances: any[] = [];
        let openTasksCount = 0;
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

        setMetrics({
          leaveBalance: balances,
          openTasks: openTasksCount,
        });

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
    if (!user) return;
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
      <div className="space-y-6 font-sans">
        <CardSkeleton count={4} />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6 font-sans">

      {/* ── 📱 MOBILE APP DASHBOARD OVERHAUL ── */}
      <div className="block md:hidden space-y-6">
        
        {/* Profile Card & Shift Duration */}
        <div className="bg-gradient-to-tr from-primary to-blue-500 rounded-3xl p-5 text-white shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center font-extrabold text-headline-sm text-white select-none">
                {user.firstName?.[0] ?? '?'}{user.lastName?.[0] ?? ''}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-blue-100">Welcome Back</p>
                <h2 className="text-[18px] font-extrabold tracking-tight">{user.firstName} {user.lastName}</h2>
              </div>
            </div>
            <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold border border-white/15">
              {user.designation || 'Staff'}
            </span>
          </div>
          
          {isClockedIn && (
            <div className="pt-2 flex justify-between items-center border-t border-white/10">
              <div className="flex items-center gap-1.5 text-body-xs font-semibold text-blue-100">
                <span className="material-symbols-outlined text-[16px] animate-pulse">timer</span>
                Active Shift
              </div>
              <span className="font-mono text-body-sm font-extrabold bg-black/20 px-3 py-1 rounded-lg">
                {elapsed || 'Loading...'}
              </span>
            </div>
          )}
        </div>

        {/* Home Address Warning Banner - Mobile */}
        {!user.homeAddressLocked && !user.homeLatitude && (
          <Link href="/profile?tab=home-address" className="block">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0">home_pin</span>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-amber-800">Home Address Not Set</p>
                <p className="text-[11px] text-amber-700 font-medium mt-0.5">Required for WFH check-in. Tap to set.</p>
              </div>
              <span className="material-symbols-outlined text-amber-500 text-[16px]">arrow_forward</span>
            </div>
          </Link>
        )}

        {/* Quick Actions Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="text-label-sm font-bold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
          <div className={`grid ${isAdmin || isHR ? 'grid-cols-4' : 'grid-cols-3'} gap-3`}>
            <Link 
              href="/tasks" 
              className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-2xl transition-all text-center group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 border border-blue-150 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-105 transition-all">
                <span className="material-symbols-outlined text-[20px]">assignment</span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-700 group-hover:text-blue-700 mt-2">View Tasks</span>
            </Link>

            <Link 
              href="/leave" 
              className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-2xl transition-all text-center group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 border border-amber-150 flex items-center justify-center group-hover:bg-amber-100 group-hover:scale-105 transition-all">
                <span className="material-symbols-outlined text-[20px]">date_range</span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-700 group-hover:text-amber-700 mt-2">Apply Leave</span>
            </Link>

            <Link 
              href="/attendance" 
              className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-200 rounded-2xl transition-all text-center group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-green-50 text-green-600 border border-green-150 flex items-center justify-center group-hover:bg-green-100 group-hover:scale-105 transition-all">
                <span className="material-symbols-outlined text-[20px]">fingerprint</span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-700 group-hover:text-green-700 mt-2">Attendance</span>
            </Link>

            {(isAdmin || isHR) && (
              <Link 
                href="/ops-stats" 
                className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 rounded-2xl transition-all text-center group cursor-pointer"
              >
                <div className="h-10 w-10 rounded-full bg-violet-50 text-violet-600 border border-violet-150 flex items-center justify-center group-hover:bg-violet-100 group-hover:scale-105 transition-all">
                  <span className="material-symbols-outlined text-[20px]">analytics</span>
                </div>
                <span className="text-[10px] font-extrabold text-slate-700 group-hover:text-violet-700 mt-2">Ops Stats</span>
              </Link>
            )}
          </div>
        </div>

        {/* Quick Check-In/Check-Out Widget */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <LiveClock size="sm" />
            {/* ── Shift Controls ── */}
            {isShiftCompleted ? (
              // Day is done — show a clear completed state
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-label-sm font-bold text-slate-900 uppercase tracking-wider">Shift Controls</h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Shift Complete
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-3 text-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 text-[26px]">check_circle</span>
                  </div>
                  <div>
                    <p className="text-label-sm font-bold text-slate-900">Today's shift is complete</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(attendanceStatus.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' → '}
                      {new Date(attendanceStatus.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 border-t border-slate-200 w-full pt-2">
                    Only one check-in/out cycle is allowed per day. See you tomorrow! 👋
                  </p>
                </div>
              </div>
            ) : (
            <div className="flex justify-between items-center">
              <h3 className="text-label-sm font-bold text-slate-900 uppercase tracking-wider">Shift Controls</h3>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                isClockedIn ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-slate-100 text-slate-650'
              }`}>
                {isClockedIn ? 'Clocked In' : 'Clocked Out'}
              </span>
            </div>
            )}

            {!isShiftCompleted && !isClockedIn ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                  {(['WFO', 'WFH'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setWorkMode(mode)}
                      className={`py-2 text-center text-label-xs font-bold rounded-lg uppercase transition-all duration-155 cursor-pointer ${
                        workMode === mode ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode === 'WFO' ? 'In Office' : 'Remote'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic([50, 50, 50]);
                    handleQuickCheckIn();
                  }}
                  disabled={checking}
                  className="w-full py-3.5 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-label-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  {checking ? 'Clocking In...' : 'Clock In Now'}
                </button>
              </div>
            ) : !isShiftCompleted && isClockedIn ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-body-xs font-semibold text-slate-700">
                  <span>Logged Mode: <strong className="text-slate-950 uppercase">{attendanceStatus.workMode}</strong></span>
                  <span>In At: <strong className="text-slate-950">{new Date(attendanceStatus.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic([60, 40]);
                    handleQuickCheckOut();
                  }}
                  disabled={checking}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm text-label-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  {checking ? 'Clocking Out...' : 'Clock Out Now'}
                </button>
              </div>
            ) : null}
          </div>

        {/* 2x2 KPIs Grid */}
        {(isAdmin || isHR || isManager) && metrics ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col justify-between aspect-square">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-2xl">
                <span className="material-symbols-outlined text-[20px]">group</span>
              </div>
              <div>
                <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Total Headcount</p>
                <h3 className="text-headline-md font-bold text-slate-900 mt-1">{metrics.employeeCount}</h3>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col justify-between aspect-square">
              <div className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 rounded-2xl">
                <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              </div>
              <div>
                <p className="text-[10px] text-outline font-bold uppercase tracking-wider">On Duty Today</p>
                <h3 className="text-headline-md font-bold text-green-600 mt-1">{metrics.employeeCount - metrics.onLeaveCount}</h3>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col justify-between aspect-square">
              <div className="w-10 h-10 flex items-center justify-center bg-amber-50 text-amber-600 rounded-2xl">
                <span className="material-symbols-outlined text-[20px]">flight_takeoff</span>
              </div>
              <div>
                <p className="text-[10px] text-outline font-bold uppercase tracking-wider">On Leave</p>
                <h3 className="text-headline-md font-bold text-amber-600 mt-1">{metrics.onLeaveCount}</h3>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col justify-between aspect-square">
              <div className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-600 rounded-2xl">
                <span className="material-symbols-outlined text-[20px]">pending_actions</span>
              </div>
              <div>
                <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Pending Tasks</p>
                <h3 className="text-headline-md font-bold text-rose-600 mt-1">{metrics.pendingLeaves}</h3>
              </div>
            </div>
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col justify-between aspect-square">
              <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-650 rounded-2xl">
                <span className="material-symbols-outlined text-[20px]">assignment</span>
              </div>
              <div>
                <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Active Tasks</p>
                <h3 className="text-headline-md font-bold text-indigo-755 mt-1">{metrics.openTasks} Tasks</h3>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col justify-between aspect-square">
              <div className="w-10 h-10 flex items-center justify-center bg-amber-50 text-amber-600 rounded-2xl">
                <span className="material-symbols-outlined text-[20px]">event_busy</span>
              </div>
              <div>
                <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Leave Balance</p>
                <h3 className="text-headline-md font-bold text-amber-655 mt-1">
                  {metrics.leaveBalance?.reduce((acc: number, val: any) => acc + val.remaining, 0) || 0} Days
                </h3>
              </div>
            </div>
          </div>
        ) : null}

        {/* Leave Allocations Side by Side Grid */}
        {!isAdmin && !isHR && !isManager && metrics && (
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-label-sm font-bold text-slate-900 uppercase tracking-wider">Leave Allocations</h3>
            <div className="grid grid-cols-2 gap-3">
              {metrics.leaveBalance.length === 0 ? (
                <p className="text-body-sm text-outline text-center col-span-2">No leave allocations found.</p>
              ) : (
                metrics.leaveBalance.map((bal: any) => (
                  <div key={bal.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-body-xs font-bold text-slate-900">{bal.leaveType}</span>
                    </div>
                    <p className="text-body-sm font-bold text-primary font-mono">{bal.remaining} / {bal.allocated} Left</p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-1.5 transition-all duration-300"
                        style={{ width: `${(bal.remaining / bal.allocated) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Mobile Active Tasks Card Feed List */}
        {!isAdmin && !isHR && !isManager && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-label-sm font-bold text-slate-900 uppercase tracking-wider">My Active Tasks</h3>
              <Link href="/tasks" className="text-xs text-primary font-bold hover:underline">View Board</Link>
            </div>
            {myTasks.length === 0 ? (
              <p className="text-body-sm text-outline text-center py-6">No active tasks assigned to you.</p>
            ) : (
              <div className="space-y-3">
                {myTasks.map(task => (
                  <div key={task.id} className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-label-sm font-bold text-slate-900">{task.title}</h4>
                        <span className="text-[9px] font-mono text-outline">{task.taskId}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        task.priority === 'CRITICAL' || task.priority === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-body-xs font-semibold pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                      <span className="text-[10px] font-bold uppercase text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{task.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Approvals Feed List on Mobile */}
        {(isAdmin || isHR || isManager) && (
          <div className="space-y-4">
            <h3 className="text-label-sm font-bold text-slate-900 uppercase tracking-wider">Pending Approvals</h3>
            {pendingItems.length === 0 ? (
              <p className="text-body-sm text-outline text-center py-6">No pending approvals.</p>
            ) : (
              <div className="space-y-3">
                {pendingItems.map(item => (
                  <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-label-sm font-bold text-slate-900">{item.user?.firstName} {item.user?.lastName}</h4>
                        <p className="text-[10px] uppercase font-bold text-primary tracking-wider mt-0.5">{item.leaveType} Leave</p>
                      </div>
                      <span className="text-[10px] font-mono text-outline font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                        {item.duration} Days
                      </span>
                    </div>
                    <p className="text-body-sm text-slate-600 italic">"{item.reason}"</p>
                    <div className="flex gap-2">
                      <Link href="/leave" className="flex-grow py-2.5 bg-primary hover:bg-blue-750 text-white text-center rounded-xl text-[11px] font-bold shadow-sm transition-all">
                        Open Leave Center
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── 🖥️ DESKTOP DASHBOARD ── */}
      <div className="hidden md:block space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white px-7 py-6 rounded-3xl border border-slate-200">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="text-slate-600">{user.firstName}.</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1.5">
              Here&apos;s what&apos;s happening across your workspace today.
            </p>
          </div>
          <LiveClock size="lg" className="w-80 shrink-0" />
        </div>

        {/* Home Address Warning Banner */}
        {!user.homeAddressLocked && !user.homeLatitude && (
          <Link href="/profile?tab=home-address" className="block">
            <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 hover:bg-amber-100 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-amber-600 text-[22px] shrink-0">home_pin</span>
              <div className="flex-1">
                <p className="text-body-xs font-bold text-amber-800">Home Address Not Set</p>
                <p className="text-body-xs text-amber-700 font-medium mt-0.5">Your home address is required for WFH attendance verification. Click here to set it in your profile.</p>
              </div>
              <span className="material-symbols-outlined text-amber-500 text-[18px]">arrow_forward</span>
            </div>
          </Link>
        )}

        {/* Quick Actions Panel */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-3">
          <h2 className="text-label-sm font-bold text-slate-800 uppercase tracking-wider">Quick Actions</h2>
          <div className={`grid ${isAdmin || isHR ? 'grid-cols-3 lg:grid-cols-4' : 'grid-cols-3'} gap-6`}>
            <Link 
              href="/tasks" 
              className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-2xl transition-all group cursor-pointer"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-150 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-105 transition-all">
                <span className="material-symbols-outlined text-[24px]">assignment</span>
              </div>
              <div>
                <p className="text-body-sm font-bold text-slate-900 group-hover:text-blue-700">View Tasks</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Check assigned criteria & status</p>
              </div>
            </Link>

            <Link 
              href="/leave" 
              className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-2xl transition-all group cursor-pointer"
            >
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-150 flex items-center justify-center group-hover:bg-amber-100 group-hover:scale-105 transition-all">
                <span className="material-symbols-outlined text-[24px]">date_range</span>
              </div>
              <div>
                <p className="text-body-sm font-bold text-slate-900 group-hover:text-amber-700">Apply Leave</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Submit request & view balance</p>
              </div>
            </Link>

            <Link 
              href="/attendance" 
              className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-200 rounded-2xl transition-all group cursor-pointer"
            >
              <div className="h-12 w-12 rounded-xl bg-green-50 text-green-600 border border-green-150 flex items-center justify-center group-hover:bg-green-100 group-hover:scale-105 transition-all">
                <span className="material-symbols-outlined text-[24px]">fingerprint</span>
              </div>
              <div>
                <p className="text-body-sm font-bold text-slate-900 group-hover:text-green-700">Attendance Log</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">View detailed shifts & history</p>
              </div>
            </Link>

            {(isAdmin || isHR) && (
              <Link 
                href="/ops-stats" 
                className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 rounded-2xl transition-all group cursor-pointer"
              >
                <div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 border border-violet-150 flex items-center justify-center group-hover:bg-violet-100 group-hover:scale-105 transition-all">
                  <span className="material-symbols-outlined text-[24px]">analytics</span>
                </div>
                <div>
                  <p className="text-body-sm font-bold text-slate-900 group-hover:text-violet-700">Operations Stats</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">View organization analytics</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {(isAdmin || isHR || isManager) && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-slate-300/80 transition-all flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Total Headcount</p>
                  <h3 className="text-headline-lg font-bold text-on-surface mt-1.5">{metrics.employeeCount}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <span className="material-symbols-outlined text-[24px]">group</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-slate-300/80 transition-all flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-wider">On Duty Today</p>
                  <h3 className="text-headline-lg font-bold text-green-600 mt-1.5">{metrics.employeeCount - metrics.onLeaveCount}</h3>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <span className="material-symbols-outlined text-[24px]">assignment_turned_in</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-slate-300/80 transition-all flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-wider">On Leave</p>
                  <h3 className="text-headline-lg font-bold text-amber-600 mt-1.5">{metrics.onLeaveCount}</h3>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <span className="material-symbols-outlined text-[24px]">flight_takeoff</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-slate-300/80 transition-all flex items-center justify-between">
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

              <div className={`${isAdmin ? 'lg:col-span-1' : 'lg:col-span-3'} bg-white border border-slate-200 p-6 rounded-2xl shadow-sm`}>
                <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-6">Pending Approvals Queue</h2>
                {pendingItems.length === 0 ? (
                  <p className="text-body-sm text-outline py-8 text-center">No pending items in your queue.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingItems.map((item) => (
                      <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div>
                          <p className="text-label-sm font-bold text-on-surface">{item.user?.firstName} {item.user?.lastName}</p>
                          <p className="text-[10px] text-outline uppercase font-semibold mt-0.5">{item.leaveType} Leave</p>
                          <p className="text-body-sm text-on-surface-variant font-medium mt-2">"{item.reason}"</p>
                        </div>
                        <div className="flex justify-end pt-1">
                          <Link href="/leave" className="px-5 py-2 bg-primary text-on-primary text-center rounded-xl text-[11px] font-bold shadow-sm hover:bg-blue-700 transition-all cursor-pointer">
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
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
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
                      <p className={`text-body-sm font-bold mt-0.5 ${isClockedIn ? 'text-green-600' : 'text-slate-500'}`}>
                        {isClockedIn ? 'Clocked In' : 'Clocked Out'}
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
      </div>

    </div>
  );
}
