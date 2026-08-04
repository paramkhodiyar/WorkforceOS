'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import PaginationControls from '../../../components/ui/PaginationControls';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'leave' | 'profile' | 'attendance' | 'expenses'>('leave');
  const [loading, setLoading] = useState(true);

  // Leave Requests state
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('PENDING');
  const [leavePage, setLeavePage] = useState(1);

  // Profile Requests state
  const [profileRequests, setProfileRequests] = useState<any[]>([]);
  const [profileStatusFilter, setProfileStatusFilter] = useState('PENDING');
  const [profilePage, setProfilePage] = useState(1);

  // Attendance Adjustments state
  const [attendanceAdjustments, setAttendanceAdjustments] = useState<any[]>([]);
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('PENDING');
  const [attendancePage, setAttendancePage] = useState(1);

  // Expense Claims state
  const [expenseClaims, setExpenseClaims] = useState<any[]>([]);
  const [expenseStatusFilter, setExpenseStatusFilter] = useState('PENDING');
  const [expensePage, setExpensePage] = useState(1);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  useEffect(() => {
    loadAllApprovals();
  }, [user]);

  async function loadAllApprovals() {
    setLoading(true);
    try {
      const [leaveRes, profileRes, attendRes, expenseRes] = await Promise.all([
        api.leave.pendingApprovals().catch(() => ({ data: [] })),
        api.employees.listProfileRequests().catch(() => ({ data: [] })),
        api.attendance.listAdjustments().catch(() => ({ data: [] })),
        api.expenses.list().catch(() => ({ data: [] })),
      ]);

      setLeaveRequests(leaveRes.data || []);
      setProfileRequests(profileRes.data || []);
      setAttendanceAdjustments(attendRes.data || (Array.isArray(attendRes) ? attendRes : []));
      setExpenseClaims(expenseRes.data || (Array.isArray(expenseRes) ? expenseRes : []));
    } catch (err: any) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  }

  // --- Leave Action ---
  async function handleLeaveAction(id: string, currentStatus: string, actionStatus: 'APPROVED' | 'REJECTED') {
    setActionLoading(`leave-${id}`);
    try {
      await api.leave.approve(id, { status: actionStatus, currentStatus, comment: '' });
      toast.success(`Leave request ${actionStatus.toLowerCase()} successfully`);
      loadAllApprovals();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${actionStatus.toLowerCase()} leave request`);
    } finally {
      setActionLoading(null);
    }
  }

  // --- Profile Action ---
  async function handleProfileAction(id: string, action: 'approve' | 'reject') {
    setActionLoading(`profile-${id}`);
    try {
      if (action === 'approve') {
        await api.employees.approveProfileRequest(id);
        toast.success('Profile update request approved');
      } else {
        await api.employees.rejectProfileRequest(id);
        toast.success('Profile update request rejected');
      }
      loadAllApprovals();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve profile request');
    } finally {
      setActionLoading(null);
    }
  }

  // --- Attendance Adjustment Action ---
  async function handleAttendanceAction(id: string, action: 'approve' | 'reject') {
    setActionLoading(`attend-${id}`);
    try {
      if (action === 'approve') {
        await api.attendance.approveAdjustment(id);
        toast.success('Attendance adjustment approved');
      } else {
        await api.attendance.rejectAdjustment(id);
        toast.success('Attendance adjustment rejected');
      }
      loadAllApprovals();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve attendance adjustment');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  const itemsPerPage = 8;

  // Filtered lists
  const filteredLeave = leaveRequests.filter(r => leaveStatusFilter === 'ALL' || r.status === leaveStatusFilter);
  const pagedLeave = filteredLeave.slice((leavePage - 1) * itemsPerPage, leavePage * itemsPerPage);

  const filteredProfile = profileRequests.filter(r => profileStatusFilter === 'ALL' || r.status === profileStatusFilter);
  const pagedProfile = filteredProfile.slice((profilePage - 1) * itemsPerPage, profilePage * itemsPerPage);

  const filteredAttendance = attendanceAdjustments.filter(r => attendanceStatusFilter === 'ALL' || r.status === attendanceStatusFilter);
  const pagedAttendance = filteredAttendance.slice((attendancePage - 1) * itemsPerPage, attendancePage * itemsPerPage);

  const filteredExpenses = expenseClaims.filter(r => expenseStatusFilter === 'ALL' || r.status === expenseStatusFilter);
  const pagedExpenses = filteredExpenses.slice((expensePage - 1) * itemsPerPage, expensePage * itemsPerPage);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-slate-900">Approvals Center</h1>
        <p className="text-body-sm text-slate-500">
          Centralized queue for organization leave requests, profile detail updates, attendance adjustments, and expense filings.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('leave')}
          className={`px-4 py-3 text-label-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'leave' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">event_busy</span>
          Leave Requests
          {leaveRequests.filter(r => r.status === 'PENDING').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
              {leaveRequests.filter(r => r.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-3 text-label-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'profile' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">person_edit</span>
          Profile Updates
          {profileRequests.filter(r => r.status === 'PENDING').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
              {profileRequests.filter(r => r.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-3 text-label-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'attendance' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
          Attendance Adjustments
          {attendanceAdjustments.filter(r => r.status === 'PENDING').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
              {attendanceAdjustments.filter(r => r.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-3 text-label-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'expenses' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          Expense Claims
          {expenseClaims.filter(r => r.status === 'PENDING').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
              {expenseClaims.filter(r => r.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {/* --- LEAVE REQUESTS TAB --- */}
      {activeTab === 'leave' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-label-md font-bold text-slate-800 uppercase tracking-wider">Leave Requests</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter:</span>
              <select
                value={leaveStatusFilter}
                onChange={(e) => { setLeaveStatusFilter(e.target.value); setLeavePage(1); }}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 outline-none"
              >
                <option value="PENDING">Pending Only</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ALL">All Statuses</option>
              </select>
            </div>
          </div>

          {filteredLeave.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-medium">No leave requests found matching status filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Reason</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {pagedLeave.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-all">
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Employee'}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-600">{r.leaveType}</td>
                      <td className="py-3 px-3 font-medium text-slate-600">
                        {new Date(r.startDate).toLocaleDateString()} — {new Date(r.endDate).toLocaleDateString()} ({r.days} day{r.days > 1 ? 's' : ''})
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate">{r.reason || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          r.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {r.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleLeaveAction(r.id, r.status, 'REJECTED')}
                              disabled={actionLoading === `leave-${r.id}`}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleLeaveAction(r.id, r.status, 'APPROVED')}
                              disabled={actionLoading === `leave-${r.id}`}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <PaginationControls
                currentPage={leavePage}
                totalPages={Math.ceil(filteredLeave.length / itemsPerPage)}
                totalItems={filteredLeave.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setLeavePage}
              />
            </div>
          )}
        </div>
      )}

      {/* --- PROFILE UPDATES TAB --- */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-label-md font-bold text-slate-800 uppercase tracking-wider">Profile Update Requests</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter:</span>
              <select
                value={profileStatusFilter}
                onChange={(e) => { setProfileStatusFilter(e.target.value); setProfilePage(1); }}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 outline-none"
              >
                <option value="PENDING">Pending Only</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ALL">All Statuses</option>
              </select>
            </div>
          </div>

          {filteredProfile.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-medium">No profile update requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Requested Changes</th>
                    <th className="py-3 px-3">Submitted Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {pagedProfile.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-all">
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Employee'}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-600 max-w-[280px] truncate">
                        {Object.keys(r.requestedData || {}).join(', ')}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          r.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {r.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleProfileAction(r.id, 'reject')}
                              disabled={actionLoading === `profile-${r.id}`}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleProfileAction(r.id, 'approve')}
                              disabled={actionLoading === `profile-${r.id}`}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <PaginationControls
                currentPage={profilePage}
                totalPages={Math.ceil(filteredProfile.length / itemsPerPage)}
                totalItems={filteredProfile.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setProfilePage}
              />
            </div>
          )}
        </div>
      )}

      {/* --- ATTENDANCE ADJUSTMENTS TAB --- */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-label-md font-bold text-slate-800 uppercase tracking-wider">Attendance Adjustments</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter:</span>
              <select
                value={attendanceStatusFilter}
                onChange={(e) => { setAttendanceStatusFilter(e.target.value); setAttendancePage(1); }}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 outline-none"
              >
                <option value="PENDING">Pending Only</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ALL">All Statuses</option>
              </select>
            </div>
          </div>

          {filteredAttendance.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-medium">No attendance adjustment requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Proposed Check In/Out</th>
                    <th className="py-3 px-3">Reason</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {pagedAttendance.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-all">
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {r.attendance?.user ? `${r.attendance.user.firstName} ${r.attendance.user.lastName}` : 'Employee'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {r.attendance?.date ? new Date(r.attendance.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {r.proposedCheckIn ? new Date(r.proposedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Same'} — {r.proposedCheckOut ? new Date(r.proposedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Same'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate">{r.reason || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          r.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {r.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleAttendanceAction(r.id, 'reject')}
                              disabled={actionLoading === `attend-${r.id}`}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAttendanceAction(r.id, 'approve')}
                              disabled={actionLoading === `attend-${r.id}`}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <PaginationControls
                currentPage={attendancePage}
                totalPages={Math.ceil(filteredAttendance.length / itemsPerPage)}
                totalItems={filteredAttendance.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setAttendancePage}
              />
            </div>
          )}
        </div>
      )}

      {/* --- EXPENSE CLAIMS TAB --- */}
      {activeTab === 'expenses' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-label-md font-bold text-slate-800 uppercase tracking-wider">Expense Reimbursement Claims</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter:</span>
              <select
                value={expenseStatusFilter}
                onChange={(e) => { setExpenseStatusFilter(e.target.value); setExpensePage(1); }}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 outline-none"
              >
                <option value="PENDING">Pending Only</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ALL">All Statuses</option>
              </select>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-medium">No expense claims found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="py-3 px-3">Title / Merchant</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {pagedExpenses.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-all">
                      <td className="py-3 px-3 font-semibold text-slate-800">{r.title || r.merchantName || 'Expense Item'}</td>
                      <td className="py-3 px-3 font-medium text-slate-600">{r.category || 'General'}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900">₹{r.amount?.toLocaleString()}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {r.expenseDate ? new Date(r.expenseDate).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          r.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <PaginationControls
                currentPage={expensePage}
                totalPages={Math.ceil(filteredExpenses.length / itemsPerPage)}
                totalItems={filteredExpenses.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setExpensePage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
