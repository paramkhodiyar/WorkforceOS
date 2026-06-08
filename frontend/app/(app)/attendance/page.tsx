'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthProvider';

export default function AttendancePage() {
  const { user } = useAuth();
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [teamAttendance, setTeamAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkType, setCheckType] = useState('WFO');
  const [location, setLocation] = useState('Office Headquarters');
  const [searchHistory, setSearchHistory] = useState('');
  const [currentPageHistory, setCurrentPageHistory] = useState(1);
  const [searchTeam, setSearchTeam] = useState('');
  const [currentPageTeam, setCurrentPageTeam] = useState(1);
  const itemsPerPage = 8;

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isDeptHead = userRoles.some((r: any) => r.roleName === 'DEPARTMENT_HEAD');
  const isTeamManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
  const showTeamAttendance = isAdmin || isHR || isDeptHead || isTeamManager;

  async function loadData() {
    try {
      const statusRes = await api.attendance.getCurrentStatus();
      setCurrentStatus(statusRes.data || null);
      
      const historyRes = await api.attendance.history();
      setHistory(historyRes.data || []);

      if (showTeamAttendance) {
        try {
          const teamRes = await api.attendance.team();
          setTeamAttendance(teamRes.data || []);
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

  async function handleCheckIn() {
    if (checking) return;
    setChecking(true);
    try {
      await api.attendance.checkIn({
        workMode: checkType,
        ipAddress: location
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    } finally {
      setChecking(false);
    }
  }

  async function handleCheckOut() {
    if (checking) return;
    setChecking(true);
    try {
      await api.attendance.checkOut();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Check-out failed');
    } finally {
      setChecking(false);
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Attendance Tracker</h1>
        <p className="text-body-sm text-outline">Record daily shifts and inspect check-in history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm h-fit">
          <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Daily Actions</h2>
          
          {currentStatus && !currentStatus.checkOut ? (
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
              <button
                onClick={handleCheckOut}
                disabled={checking}
                className="w-full py-3 bg-error hover:bg-red-700 text-on-error rounded-lg text-label-md font-bold transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {checking ? 'Processing...' : 'Check Out Now'}
              </button>
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
                  <option value="WFM">Work From Home (WFM)</option>
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

              <button
                onClick={handleCheckIn}
                disabled={checking}
                className="w-full py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-label-md font-bold transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {checking ? 'Processing...' : 'Check In Now'}
              </button>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Date</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">In</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Out</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Type</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Location</th>
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.workMode === 'WFO' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {log.workMode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant max-w-xs truncate">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
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
            </div>
          )}
        </div>
      </div>

      {showTeamAttendance && (
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Employee</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Check In</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Check Out</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Mode</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Location / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-body-sm">
                  {paginatedTeam.map(member => {
                    const todayRecord = member.attendances?.[0];
                    const isCheckedIn = todayRecord && !todayRecord.checkOut;
                    const hasCheckedOut = todayRecord && todayRecord.checkOut;
                    
                    return (
                      <tr key={member.id} className="hover:bg-surface-container-low transition-colors">
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
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              todayRecord.workMode === 'WFO' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                            }`}>
                              {todayRecord.workMode}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant max-w-xs truncate">
                          {todayRecord?.ipAddress || '-'}
                        </td>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
