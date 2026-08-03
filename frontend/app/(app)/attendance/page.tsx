'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { useToast } from '../../../lib/toast/ToastProvider';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { TableSkeleton, ListSkeleton, FormSkeleton } from '../../../components/ui/Skeleton';
import { Button } from '../../../components/ui/Button';
import { ReadMoreText } from '../../../components/ui/ReadMoreText';
import { triggerHaptic } from '../../../lib/utils/haptics';
import LogoLoader from '../../../components/ui/LogoLoader';

export default function AttendancePage() {
  const { user } = useAuth();
  const toast = useToast();
  const customConfirm = useConfirm();
  const [activeTab, setActiveTab] = useState('my-attendance');
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [teamAttendance, setTeamAttendance] = useState<any[]>([]);
  const [adjustmentRequests, setAdjustmentRequests] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [totalExceptions, setTotalExceptions] = useState(0);
  const [currentPageExceptions, setCurrentPageExceptions] = useState(1);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkType, setCheckType] = useState('WFO');
  const [location, setLocation] = useState('Office Headquarters');
  const [searchHistory, setSearchHistory] = useState('');
  const [currentPageHistory, setCurrentPageHistory] = useState(1);
  const [searchTeam, setSearchTeam] = useState('');
  const [currentPageTeam, setCurrentPageTeam] = useState(1);
  const [searchAdjustments, setSearchAdjustments] = useState('');
  const [currentPageAdjustments, setCurrentPageAdjustments] = useState(1);
  const [searchExceptions, setSearchExceptions] = useState('');

  // Adjustment modal state
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedRecordForAdjustment, setSelectedRecordForAdjustment] = useState<any>(null);
  const [proposedCheckIn, setProposedCheckIn] = useState('');
  const [proposedCheckOut, setProposedCheckOut] = useState('');
  const [proposedStatus, setProposedStatus] = useState('PRESENT');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);
  const [actioningAdjustmentId, setActioningAdjustmentId] = useState<string | null>(null);

  const itemsPerPage = 8;

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isDeptHead = userRoles.some((r: any) => r.roleName === 'DEPARTMENT_HEAD');
  const isTeamManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
  const showTeamAttendance = isAdmin || isHR || isDeptHead || isTeamManager;

  const formatDateTime = (dStr: string | null | undefined) => {
    if (!dStr) return '-';
    const d = new Date(dStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatTime = (dStr: string | null | undefined) => {
    if (!dStr) return '-';
    const d = new Date(dStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  async function loadData() {
    try {
      const statusRes = await api.attendance.getCurrentStatus();
      setCurrentStatus(statusRes.data || null);

      const historyRes = await api.attendance.history();
      setHistory(historyRes.data || []);

      if (showTeamAttendance) {
        try {
          const teamRes = await api.attendance.team();
          if (teamRes.data && Array.isArray(teamRes.data.records)) {
            setTeamAttendance(teamRes.data.records);
          } else {
            setTeamAttendance(Array.isArray(teamRes.data) ? teamRes.data : []);
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (isAdmin || isHR) {
        try {
          const adjRes = await api.attendance.listAdjustments();
          setAdjustmentRequests(adjRes.data || []);
          const excRes = await api.attendance.exceptions(currentPageExceptions, itemsPerPage);
          setExceptions(excRes.records || []);
          setTotalExceptions(excRes.total || 0);
        } catch (err) {
          console.error(err);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (isAdmin || isHR) {
      api.attendance.exceptions(currentPageExceptions, itemsPerPage)
        .then(res => {
          setExceptions(res.records || []);
          setTotalExceptions(res.total || 0);
        })
        .catch(console.error);
    }
  }, [currentPageExceptions]);

  async function handleCheckIn() {
    if (checking) return;
    triggerHaptic([50, 50, 50]);
    setChecking(true);

    const performCheckIn = async (gpsLat?: number, gpsLng?: number) => {
      try {
        await api.attendance.checkIn({
          workMode: checkType,
          ipAddress: location,
          gpsLat,
          gpsLng
        });
        triggerHaptic([60, 100, 60]);
        toast.success('Successfully checked in!');
        await loadData();
      } catch (err: any) {
        toast.error(err.message || 'Check-in failed');
      } finally {
        setChecking(false);
      }
    };

    if (checkType === 'WFO' && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          performCheckIn(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          toast.warning('Could not retrieve precise location. Checking in without GPS verification.');
          performCheckIn();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      performCheckIn();
    }
  }

  async function handleCheckOut() {
    if (checking) return;
    triggerHaptic([60, 40]);
    setChecking(true);
    try {
      await api.attendance.checkOut();
      triggerHaptic([40, 40]);
      toast.success('Successfully checked out!');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Check-out failed');
    } finally {
      setChecking(false);
    }
  }

  function openAdjustmentModal(record: any) {
    setSelectedRecordForAdjustment(record);

    const formatDateForInput = (dStr: string | null, defaultHour = 9) => {
      const d = dStr ? new Date(dStr) : new Date(record.date);
      if (!dStr) {
        d.setHours(defaultHour, 0, 0, 0);
      }
      const pad = (num: number) => String(num).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setProposedCheckIn(record.checkIn ? formatDateForInput(record.checkIn) : formatDateForInput(null, 9));
    setProposedCheckOut(record.checkOut ? formatDateForInput(record.checkOut) : formatDateForInput(null, 18));
    setProposedStatus(record.status || 'PRESENT');
    setAdjustmentNotes('');
    setIsAdjustmentModalOpen(true);
  }

  async function handleAdjustmentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustmentNotes.trim()) {
      toast.warning('Reason/notes are required');
      return;
    }
    setSubmittingAdjustment(true);
    try {
      const payload: any = {
        notes: adjustmentNotes,
        status: proposedStatus,
      };
      if (proposedCheckIn) payload.checkIn = new Date(proposedCheckIn).toISOString();
      if (proposedCheckOut) payload.checkOut = new Date(proposedCheckOut).toISOString();

      await api.attendance.adjust(selectedRecordForAdjustment.id, payload);
      toast.success('Adjustment request submitted successfully!');
      setIsAdjustmentModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setSubmittingAdjustment(false);
    }
  }

  async function handleApproveAdjustment(id: string) {
    const ok = await customConfirm({
      title: 'Approve Attendance Adjustment',
      message: 'Are you sure you want to approve this adjustment?',
      variant: 'info',
      confirmLabel: 'Approve',
    });
    if (!ok) return;
    setActioningAdjustmentId(id);
    try {
      await api.attendance.approveAdjustment(id);
      toast.success('Adjustment approved successfully!');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve adjustment');
    } finally {
      setActioningAdjustmentId(null);
    }
  }

  async function handleRejectAdjustment(id: string) {
    const ok = await customConfirm({
      title: 'Reject Attendance Adjustment',
      message: 'Are you sure you want to reject this adjustment?',
      variant: 'danger',
      confirmLabel: 'Reject',
    });
    if (!ok) return;
    setActioningAdjustmentId(id);
    try {
      await api.attendance.rejectAdjustment(id);
      toast.success('Adjustment rejected successfully!');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject adjustment');
    } finally {
      setActioningAdjustmentId(null);
    }
  }

  async function handleActionAdjustment(id: string, status: 'APPROVED' | 'REJECTED') {
    if (status === 'APPROVED') {
      return handleApproveAdjustment(id);
    } else {
      return handleRejectAdjustment(id);
    }
  }

  const filteredHistory = history.filter(log => {
    const mode = log.workMode?.toLowerCase() || '';
    const locationStr = log.ipAddress?.toLowerCase() || '';
    const dateStr = log.date ? new Date(log.date).toLocaleDateString() : '';
    const q = searchHistory.toLowerCase();
    return mode.includes(q) || locationStr.includes(q) || dateStr.includes(q);
  });
  const totalPagesHistory = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPageHistory - 1) * itemsPerPage,
    currentPageHistory * itemsPerPage
  );

  const filteredTeam = teamAttendance.filter(member => {
    const name = `${member.firstName} ${member.lastName}`.toLowerCase();
    const email = member.email?.toLowerCase() || '';
    const todayRecord = member.attendances?.[0];
    const locationStr = todayRecord?.ipAddress?.toLowerCase() || '';
    const mode = todayRecord?.workMode?.toLowerCase() || '';
    const q = searchTeam.toLowerCase();
    return name.includes(q) || email.includes(q) || locationStr.includes(q) || mode.includes(q);
  });
  const totalPagesTeam = Math.ceil(filteredTeam.length / itemsPerPage);
  const paginatedTeam = filteredTeam.slice(
    (currentPageTeam - 1) * itemsPerPage,
    currentPageTeam * itemsPerPage
  );

  const filteredAdjustments = adjustmentRequests.filter(req => {
    const emp = req.attendance?.user;
    const name = `${emp?.firstName || ''} ${emp?.lastName || ''}`.toLowerCase();
    const reason = req.reason?.toLowerCase() || '';
    const status = req.status?.toLowerCase() || '';
    const q = searchAdjustments.toLowerCase();
    return name.includes(q) || reason.includes(q) || status.includes(q);
  });
  const totalPagesAdjustments = Math.ceil(filteredAdjustments.length / itemsPerPage);
  const paginatedAdjustments = filteredAdjustments.slice(
    (currentPageAdjustments - 1) * itemsPerPage,
    currentPageAdjustments * itemsPerPage
  );

  const filteredExceptions = exceptions.filter(exc => {
    const name = `${exc.firstName || ''} ${exc.lastName || ''}`.toLowerCase();
    const email = exc.email?.toLowerCase() || '';
    const status = exc.status?.toLowerCase() || '';
    const q = searchExceptions.toLowerCase();
    return name.includes(q) || email.includes(q) || status.includes(q);
  });
  const totalPagesExceptions = Math.ceil(filteredExceptions.length / itemsPerPage);
  const paginatedExceptions = filteredExceptions.slice(
    (currentPageExceptions - 1) * itemsPerPage,
    currentPageExceptions * itemsPerPage
  );

  if (loading) {
    return <LogoLoader size={72} text="Loading Attendance Data..." />;
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Attendance Tracker</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Record daily shifts and inspect check-in history</p>
      </div>

      {/* Modern Segmented Control Tabs (Zero Shadows, Zero Gradients) */}
      <div className="bg-slate-100/90 border border-slate-200 p-1.5 rounded-2xl grid grid-cols-2 md:grid-cols-3 gap-1.5 w-full max-w-2xl select-none">
        <button
          onClick={() => setActiveTab('my-attendance')}
          className={`py-2.5 px-3 rounded-xl text-xs transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'my-attendance'
              ? 'bg-white text-blue-600 border border-slate-200/80 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
          <span>My Logs</span>
        </button>

        {showTeamAttendance && (
          <button
            onClick={() => setActiveTab('team-attendance')}
            className={`py-2.5 px-3 rounded-xl text-xs transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'team-attendance'
                ? 'bg-white text-blue-600 border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">groups</span>
            <span>Team Logs</span>
          </button>
        )}

        {(isAdmin || isHR) && (
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`py-2.5 px-3 rounded-xl text-xs transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'adjustments'
                ? 'bg-white text-blue-600 border border-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Adjustments</span>
          </button>
        )}
      </div>

      {/* Tab: My Attendance */}
      {activeTab === 'my-attendance' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm h-fit">
            <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Daily Actions</h2>

            {currentStatus && currentStatus.checkIn && currentStatus.checkOut ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex flex-col items-center text-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-150 flex items-center justify-center text-green-700">
                    <span className="material-symbols-outlined text-[24px]">verified_user</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-green-800 font-extrabold uppercase block tracking-wider">Current Shift Status</span>
                    <p className="text-label-sm font-bold text-green-900 mt-1">Shift Completed</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {new Date(currentStatus.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' → '}
                      {new Date(currentStatus.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 border-t border-slate-200 w-full pt-2 leading-relaxed">
                    Only one check-in/out cycle is allowed per day. See you tomorrow! 👋
                  </p>
                </div>
              </div>
            ) : currentStatus && currentStatus.checkIn && !currentStatus.checkOut ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-[10px] text-green-800 font-bold uppercase block">Current Shift Status</span>
                  <p className="text-label-md font-bold text-green-900 mt-1">Checked In ({currentStatus.workMode})</p>
                  {currentStatus.checkIn && (
                    <p className="text-[11px] text-green-700 mt-0.5">Since {new Date(currentStatus.checkIn).toLocaleTimeString()}</p>
                  )}
                  {currentStatus.ipAddress && (
                    <p className="text-[11px] text-green-600 mt-1">Location: {currentStatus.ipAddress}</p>
                  )}
                </div>
                <Button
                  onClick={handleCheckOut}
                  loading={checking}
                  variant="danger"
                  className="w-full py-3"
                >
                  Check Out Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <span className="text-[10px] text-outline font-bold uppercase block">Current Shift Status</span>
                  <p className="text-label-md font-bold text-on-surface mt-1">Not Checked In</p>
                </div>

                <div>
                  <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Shift Mode</label>
                  <select
                    value={checkType}
                    onChange={(e) => setCheckType(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="WFO">Work From Office (WFO)</option>
                    <option value="WFH">Work From Home (WFH)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Location / Notes</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <Button
                  onClick={handleCheckIn}
                  loading={checking}
                  className="w-full py-3"
                >
                  Check In Now
                </Button>
              </div>
            )}
          </div>

          <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Shift Logs History</h2>
              <div className="relative w-48">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchHistory}
                  onChange={(e) => {
                    setSearchHistory(e.target.value);
                    setCurrentPageHistory(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-[11px] focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[14px]">search</span>
              </div>
            </div>

            {paginatedHistory.length === 0 ? (
              <p className="text-body-sm text-outline py-8 text-center">No attendance logs recorded yet.</p>
            ) : (
              <>
                {/* Mobile View - Cards List */}
                <div className="block md:hidden space-y-4">
                  {paginatedHistory.map(log => (
                    <div key={log.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-label-sm font-bold text-slate-900">{new Date(log.date).toLocaleDateString()}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold inline-block mt-1 ${log.workMode === 'WFO' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                            }`}>
                            {log.workMode}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-body-xs font-semibold block">In: {log.checkIn ? new Date(log.checkIn).toLocaleTimeString() : '-'}</span>
                          <span className="text-body-xs font-semibold block">Out: {log.checkOut ? new Date(log.checkOut).toLocaleTimeString() : '-'}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
                        <span className="text-slate-550 font-mono">IP: {log.ipAddress || '-'}</span>
                        {log.notes && (
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${log.notes.includes('Flagged') ? 'bg-red-50 text-red-750 border-red-150' : 'bg-slate-100 text-slate-655 border-slate-200'
                            }`}>
                            {log.notes}
                          </span>
                        )}
                      </div>

                      {(isHR || isAdmin) && (
                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={() => openAdjustmentModal({
                              ...log,
                              user: {
                                firstName: user?.firstName || 'Self',
                                lastName: user?.lastName || ''
                              }
                            })}
                            className="w-full py-2 bg-primary hover:bg-blue-755 text-on-primary font-bold text-[10px] rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            Request Adjustment
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop View - Standard Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50">
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Date</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">In</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Out</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Type</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Location</th>
                        {(isHR || isAdmin) && (
                          <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-right">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {paginatedHistory.map(log => (
                        <tr key={log.id} className="hover:bg-surface-container-low transition-colors text-body-sm">
                          <td className="px-4 py-3 text-on-surface font-semibold">
                            {new Date(log.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant font-mono">
                            {log.checkIn ? new Date(log.checkIn).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant font-mono">
                            {log.checkOut ? new Date(log.checkOut).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.workMode === 'WFO' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                              }`}>
                              {log.workMode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant max-w-xs">
                            <div className="truncate">{log.ipAddress || '-'}</div>
                            {log.notes && (
                              <div className={`text-[10px] mt-0.5 inline-block ${log.notes.includes('Flagged') ? 'bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded font-bold' : 'text-slate-550'}`}>
                                {log.notes}
                              </div>
                            )}
                          </td>
                          {(isHR || isAdmin) && (
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => openAdjustmentModal({
                                  ...log,
                                  user: {
                                    firstName: user?.firstName || 'Self',
                                    lastName: user?.lastName || ''
                                  }
                                })}
                                className="text-primary hover:text-blue-700 font-bold text-[11px] underline cursor-pointer"
                              >
                                Adjust
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPagesHistory > 1 && (
                  <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between">
                    <span className="text-[11px] text-outline">
                      Showing {(currentPageHistory - 1) * itemsPerPage + 1} to {Math.min(currentPageHistory * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} logs
                    </span>
                    <div className="flex gap-1">
                      <button
                        disabled={currentPageHistory === 1}
                        onClick={() => setCurrentPageHistory(currentPageHistory - 1)}
                        className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Prev
                      </button>
                      <button
                        disabled={currentPageHistory === totalPagesHistory}
                        onClick={() => setCurrentPageHistory(currentPageHistory + 1)}
                        className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab: Team Attendance */}
      {activeTab === 'team-attendance' && showTeamAttendance && (
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Active Staff Check-ins</h2>
            <div className="relative w-48">
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTeam}
                onChange={(e) => {
                  setSearchTeam(e.target.value);
                  setCurrentPageTeam(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-[11px] focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[14px]">search</span>
            </div>
          </div>

          {paginatedTeam.length === 0 ? (
            <p className="text-body-sm text-outline py-8 text-center">No team members assigned or records found.</p>
          ) : (
            <>
              {/* Mobile View - Cards List */}
              <div className="block md:hidden space-y-4">
                {paginatedTeam.map(member => {
                  const todayRecord = member.attendances?.[0];
                  const isCheckedIn = todayRecord && todayRecord.checkIn && !todayRecord.checkOut;
                  const hasCheckedOut = todayRecord && todayRecord.checkIn && todayRecord.checkOut;

                  return (
                    <div key={member.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-50 text-primary border border-blue-100 flex items-center justify-center font-bold text-[12px] shrink-0">
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </div>
                          <div>
                            <h4 className="text-label-sm font-bold text-slate-900 leading-tight">
                              {member.firstName} {member.lastName}
                            </h4>
                            <p className="text-[10px] text-outline mt-0.5">{member.email}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${isCheckedIn
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : hasCheckedOut
                            ? 'bg-zinc-100 text-zinc-650 border-zinc-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                          {isCheckedIn ? 'Checked In' : hasCheckedOut ? 'Completed' : 'Offline'}
                        </span>
                      </div>

                      {todayRecord && (
                        <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-semibold">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-outline block">In Time</span>
                            <span className="font-mono text-slate-950">
                              {todayRecord.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-outline block">Out Time</span>
                            <span className="font-mono text-slate-950">
                              {todayRecord.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-outline block">Work Mode</span>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${todayRecord.workMode === 'WFO' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                              }`}>
                              {todayRecord.workMode}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-outline block">Location / Notes</span>
                            <span className="text-slate-950 block truncate max-w-[130px]" title={todayRecord.ipAddress}>
                              {todayRecord.ipAddress || '-'}
                            </span>
                          </div>
                        </div>
                      )}

                      {todayRecord?.notes && (
                        <div className="pt-1.5">
                          <span className={`text-[10px] inline-block ${todayRecord.notes.includes('Flagged')
                            ? 'bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded-lg font-bold'
                            : 'text-slate-550'
                            }`}>
                            {todayRecord.notes}
                          </span>
                        </div>
                      )}

                      {(isHR || isAdmin) && (
                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          {todayRecord ? (
                            <button
                              type="button"
                              onClick={() => openAdjustmentModal({
                                ...todayRecord,
                                user: {
                                  firstName: member.firstName,
                                  lastName: member.lastName
                                }
                              })}
                              className="text-primary hover:text-blue-700 font-extrabold text-[11px] underline cursor-pointer"
                            >
                              Adjust Attendance
                            </button>
                          ) : (
                            <span className="text-[10px] text-outline italic">No log available</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop View - Standard Table */}
              <table className="hidden md:table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Employee</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Check In</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Check Out</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Mode</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Location / Notes</th>
                    {(isHR || isAdmin) && (
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-body-sm">
                  {paginatedTeam.map(member => {
                    const todayRecord = member.attendances?.[0];
                    const isCheckedIn = todayRecord && todayRecord.checkIn && !todayRecord.checkOut;
                    const hasCheckedOut = todayRecord && todayRecord.checkIn && todayRecord.checkOut;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-50 text-primary border border-blue-100 flex items-center justify-center font-bold text-[11px]">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-on-surface leading-tight">{member.firstName} {member.lastName}</p>
                              <p className="text-[10px] text-outline mt-0.5">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isCheckedIn ? (
                            <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              Checked In
                            </span>
                          ) : hasCheckedOut ? (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              Completed
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              Offline
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant font-mono">
                          {todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant font-mono">
                          {todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {todayRecord?.workMode ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${todayRecord.workMode === 'WFO' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                              }`}>
                              {todayRecord?.workMode}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant max-w-xs">
                          <div className="truncate">{todayRecord?.ipAddress || '-'}</div>
                          {todayRecord?.notes && (
                            <div className={`text-[10px] mt-0.5 inline-block ${todayRecord.notes.includes('Flagged') ? 'bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded font-bold' : 'text-slate-550'}`}>
                              {todayRecord.notes}
                            </div>
                          )}
                        </td>
                        {(isHR || isAdmin) && (
                          <td className="px-4 py-3 text-right">
                            {todayRecord ? (
                              <button
                                onClick={() => openAdjustmentModal({
                                  ...todayRecord,
                                  user: {
                                    firstName: member.firstName,
                                    lastName: member.lastName
                                  }
                                })}
                                className="text-primary hover:text-blue-700 font-bold text-[11px] underline cursor-pointer"
                              >
                                Adjust
                              </button>
                            ) : (
                              <span className="text-[10px] text-outline italic">No log</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPagesTeam > 1 && (
                <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between">
                  <span className="text-[11px] text-outline">
                    Showing {(currentPageTeam - 1) * itemsPerPage + 1} to {Math.min(currentPageTeam * itemsPerPage, filteredTeam.length)} of {filteredTeam.length} entries
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={currentPageTeam === 1}
                      onClick={() => setCurrentPageTeam(currentPageTeam - 1)}
                      className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                    >
                      Prev
                    </button>
                    <button
                      disabled={currentPageTeam === totalPagesTeam}
                      onClick={() => setCurrentPageTeam(currentPageTeam + 1)}
                      className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                    >
                      Next
                    </button>
                  </div>
</div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Adjustments & Exceptions */}
      {activeTab === 'adjustments' && (isAdmin || isHR) && (
        <div className="space-y-6">
          {/* Pending Adjustments Section */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Pending Adjustment Requests</h2>
              <div className="relative w-48">
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchAdjustments}
                  onChange={(e) => {
                    setSearchAdjustments(e.target.value);
                    setCurrentPageAdjustments(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-[11px] focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[14px]">search</span>
              </div>
            </div>

            {filteredAdjustments.length === 0 ? (
              <p className="text-body-sm text-outline py-4 text-center">No pending adjustment requests found.</p>
            ) : (
              <div>
                {/* Mobile View - Cards List */}
                <div className="block md:hidden space-y-4">
                  {paginatedAdjustments.map(req => {
                    const emp = req.attendance?.user;
                    const isOwnRequest = req.requestedBy === user?.id;

                    return (
                      <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-label-sm font-bold text-slate-900 leading-tight">
                              {emp?.firstName} {emp?.lastName}
                            </h4>
                            <p className="text-[10px] text-outline mt-0.5">Emp ID: {emp?.employeeId}</p>
                            <p className="text-[11px] font-bold text-slate-700 mt-1">
                              Date: {new Date(req.attendance?.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                            {req.status}
                          </span>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-3 text-[11px] text-slate-700">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-outline font-bold block">Original Times</span>
                            <span className="font-mono text-slate-950 block">In: {formatTime(req.attendance?.checkIn)}</span>
                            <span className="font-mono text-slate-950 block">Out: {formatTime(req.attendance?.checkOut)}</span>
                            <span className="text-[9px] font-bold text-slate-500">Status: {req.attendance?.status}</span>
                          </div>
                          <div className="bg-blue-50/50 p-1.5 rounded-lg border border-blue-100/50">
                            <span className="text-[9px] uppercase tracking-wider text-blue-700 font-bold block">Proposed Times</span>
                            <span className="font-mono text-slate-950 block">In: {formatTime(req.proposedCheckIn)}</span>
                            <span className="font-mono text-slate-950 block">Out: {formatTime(req.proposedCheckOut)}</span>
                            <span className="text-[9px] font-bold text-blue-700">New Status: {req.proposedStatus}</span>
                          </div>
                        </div>

                        {req.reason && (
                          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                            <span className="font-bold text-slate-800">Reason: </span>
                            <ReadMoreText text={req.reason} maxLength={60} />
                          </div>
                        )}

                        <div className="pt-2.5 border-t border-slate-100 flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={actioningAdjustmentId === req.id}
                            onClick={() => handleActionAdjustment(req.id, 'REJECTED')}
                            className="px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg font-bold text-[11px] transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {actioningAdjustmentId === req.id ? 'Processing...' : 'Reject'}
                          </button>
                          {!isOwnRequest && (
                            <button
                              type="button"
                              disabled={actioningAdjustmentId === req.id}
                              onClick={() => handleActionAdjustment(req.id, 'APPROVED')}
                              className="px-3 py-1.5 bg-primary text-white hover:bg-blue-700 rounded-lg font-bold text-[11px] transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {actioningAdjustmentId === req.id ? 'Approving...' : 'Approve'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50">
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Employee</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Date</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Original Times</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Proposed Times</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Reason</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {paginatedAdjustments.map(req => {
                        const emp = req.attendance?.user;
                        const isOwnRequest = req.requestedBy === user?.id;

                        return (
                          <tr key={req.id} className="hover:bg-surface-container-low transition-colors text-body-sm">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{emp?.firstName} {emp?.lastName}</div>
                              <div className="text-[10px] text-outline">ID: {emp?.employeeId}</div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-700">
                              {new Date(req.attendance?.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-[11px] font-mono">
                              In: {formatTime(req.attendance?.checkIn)}<br />
                              Out: {formatTime(req.attendance?.checkOut)}<br />
                              <span className="text-[9px] font-bold text-slate-500">Status: {req.attendance?.status}</span>
                            </td>
                            <td className="px-4 py-3 text-[11px] font-mono text-blue-700 font-bold">
                              In: {formatTime(req.proposedCheckIn)}<br />
                              Out: {formatTime(req.proposedCheckOut)}<br />
                              <span className="text-[9px] text-blue-800">New Status: {req.proposedStatus}</span>
                            </td>
                            <td className="px-4 py-3 max-w-xs text-xs">
                              <ReadMoreText text={req.reason || 'No reason provided'} maxLength={45} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={actioningAdjustmentId === req.id}
                                  onClick={() => handleActionAdjustment(req.id, 'REJECTED')}
                                  className="px-2.5 py-1 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg font-bold text-[11px] transition-all disabled:opacity-50 cursor-pointer"
                                >
                                  {actioningAdjustmentId === req.id ? 'Processing...' : 'Reject'}
                                </button>
                                {!isOwnRequest && (
                                  <button
                                    type="button"
                                    disabled={actioningAdjustmentId === req.id}
                                    onClick={() => handleActionAdjustment(req.id, 'APPROVED')}
                                    className="px-2.5 py-1 bg-primary text-white hover:bg-blue-700 rounded-lg font-bold text-[11px] transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    {actioningAdjustmentId === req.id ? 'Approving...' : 'Approve'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {totalPagesAdjustments > 1 && (
                  <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between">
                    <span className="text-[11px] text-outline">
                      Showing {(currentPageAdjustments - 1) * itemsPerPage + 1} to {Math.min(currentPageAdjustments * itemsPerPage, filteredAdjustments.length)} of {filteredAdjustments.length} requests
                    </span>
                    <div className="flex gap-1">
                      <button
                        disabled={currentPageAdjustments === 1}
                        onClick={() => setCurrentPageAdjustments(currentPageAdjustments - 1)}
                        className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Prev
                      </button>
                      <button
                        disabled={currentPageAdjustments === totalPagesAdjustments}
                        onClick={() => setCurrentPageAdjustments(currentPageAdjustments + 1)}
                        className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Exceptions Section */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-2">Attendance Exceptions Log</h2>
            {exceptions.length === 0 ? (
              <p className="text-body-sm text-outline py-4 text-center">No attendance exceptions found.</p>
            ) : (
              <>
                {/* Mobile View - Cards List */}
                <div className="block md:hidden space-y-4">
                  {exceptions.map(exc => (
                    <div key={exc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-label-sm font-bold text-slate-900 leading-tight">
                            {exc.firstName} {exc.lastName}
                          </h4>
                          <p className="text-[10px] text-outline mt-0.5">{exc.email}</p>
                          <p className="text-[11px] font-bold text-slate-700 mt-1">
                            Date: {new Date(exc.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${exc.status === 'LATE'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : exc.status === 'ABSENT'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                          {exc.status}
                        </span>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-semibold">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-outline block">In Time</span>
                          <span className="font-mono text-slate-950">
                            {exc.checkIn ? new Date(exc.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-outline block">Out Time</span>
                          <span className="font-mono text-slate-950">
                            {exc.checkOut ? new Date(exc.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                              <span className="text-error font-bold text-[9px] uppercase">Missing Out</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => openAdjustmentModal({
                            ...exc,
                            user: {
                              firstName: exc.firstName,
                              lastName: exc.lastName
                            }
                          })}
                          className="text-primary hover:text-blue-700 font-extrabold text-[11px] underline cursor-pointer"
                        >
                          Adjust Log
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View - Structured Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-body-sm">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Employee</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Date</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">In</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Out</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {exceptions.map(exc => (
                        <tr key={exc.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-on-surface">{exc.firstName} {exc.lastName}</p>
                            <p className="text-[10px] text-outline">{exc.email}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-on-surface">
                            {new Date(exc.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-mono text-on-surface-variant">
                            {exc.checkIn ? new Date(exc.checkIn).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-4 py-3 font-mono text-on-surface-variant">
                            {exc.checkOut ? new Date(exc.checkOut).toLocaleTimeString() : (
                              <span className="text-error font-bold text-[10px] uppercase">Missing Out</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${exc.status === 'LATE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : exc.status === 'ABSENT'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                              {exc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openAdjustmentModal({
                                ...exc,
                                user: {
                                  firstName: exc.firstName,
                                  lastName: exc.lastName
                                }
                              })}
                              className="px-2.5 py-1.5 border border-outline-variant hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Adjust
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Exceptions Pagination */}
                {Math.ceil(totalExceptions / itemsPerPage) > 1 && (
                  <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between">
                    <span className="text-[11px] text-outline">
                      Showing {(currentPageExceptions - 1) * itemsPerPage + 1} to {Math.min(currentPageExceptions * itemsPerPage, totalExceptions)} of {totalExceptions} exceptions
                    </span>
                    <div className="flex gap-1">
                      <button
                        disabled={currentPageExceptions === 1}
                        onClick={() => setCurrentPageExceptions(currentPageExceptions - 1)}
                        className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Prev
                      </button>
                      <button
                        disabled={currentPageExceptions === Math.ceil(totalExceptions / itemsPerPage)}
                        onClick={() => setCurrentPageExceptions(currentPageExceptions + 1)}
                        className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* All Historical Adjustments Section */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-2">Resolved Adjustment History</h2>
            {adjustmentRequests.filter(req => req.status !== 'PENDING').length === 0 ? (
              <p className="text-body-sm text-outline py-4 text-center">No resolved adjustments.</p>
            ) : (
              <div>
                {/* Mobile View - Cards List */}
                <div className="block md:hidden space-y-4">
                  {adjustmentRequests.filter(req => req.status !== 'PENDING').map(req => {
                    const emp = req.attendance?.user;

                    return (
                      <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-label-sm font-bold text-slate-900 leading-tight">
                              {emp?.firstName} {emp?.lastName}
                            </h4>
                            <p className="text-[10px] text-outline mt-0.5">Emp ID: {emp?.employeeId}</p>
                            <p className="text-[11px] font-bold text-slate-700 mt-1">
                              Date: {new Date(req.attendance?.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${req.status === 'APPROVED'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            {req.status}
                          </span>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-700 space-y-1">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-outline font-bold block">Adjusted Times</span>
                            <span className="font-mono text-slate-950 block">
                              In: {formatTime(req.proposedCheckIn)} · Out: {formatTime(req.proposedCheckOut)}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500">Status: {req.proposedStatus || req.attendance?.status}</span>
                          </div>
                          {req.reason && (
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-outline font-bold block">Notes</span>
                              <ReadMoreText text={req.reason} title="Adjustment Notes" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View - Structured Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-body-sm">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Employee</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Date</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Adjusted Values</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adjustmentRequests.filter(req => req.status !== 'PENDING').map(req => {
                        const emp = req.attendance?.user;

                        return (
                          <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-on-surface">{emp?.firstName} {emp?.lastName}</p>
                              <p className="text-[10px] text-outline">{emp?.employeeId}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-on-surface">
                              {new Date(req.attendance?.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">
                              In: {formatTime(req.proposedCheckIn)}<br />
                              Out: {formatTime(req.proposedCheckOut)}<br />
                              Status: <span className="font-bold text-[10px]">{req.proposedStatus || req.attendance?.status}</span>
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant max-w-xs">
                              <ReadMoreText text={req.reason} title="Adjustment Notes" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Adjustment Modal */}
      {isAdjustmentModalOpen && selectedRecordForAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 text-on-surface">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-label-md font-bold uppercase tracking-wider">Request Attendance Adjustment</h3>
                <p className="text-body-sm text-outline mt-0.5">
                  For {selectedRecordForAdjustment.user?.firstName || 'Employee'} {selectedRecordForAdjustment.user?.lastName || ''} on {new Date(selectedRecordForAdjustment.date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-outline hover:text-on-surface cursor-pointer flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Proposed Check-In</label>
                  <input
                    type="datetime-local"
                    value={proposedCheckIn}
                    onChange={(e) => setProposedCheckIn(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary text-on-surface font-medium"
                  />
                </div>
                <div>
                  <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Proposed Check-Out</label>
                  <input
                    type="datetime-local"
                    value={proposedCheckOut}
                    onChange={(e) => setProposedCheckOut(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary text-on-surface font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Proposed Status</label>
                <select
                  value={proposedStatus}
                  onChange={(e) => setProposedStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary text-on-surface font-medium"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                  <option value="EARLY_DEP">EARLY_DEP</option>
                </select>
              </div>

              <div>
                <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Reason / Notes (Required)</label>
                <textarea
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="Explain why this adjustment is needed..."
                  required
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none text-on-surface font-medium resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-label-sm font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjustment}
                  className="px-4 py-2 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingAdjustment ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
