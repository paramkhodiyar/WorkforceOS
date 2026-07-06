'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { CommentDialog } from '../../../components/ui/CommentDialog';
import { useToast } from '../../../lib/toast/ToastProvider';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { TableSkeleton, ListSkeleton, FormSkeleton } from '../../../components/ui/Skeleton';
import { Button } from '../../../components/ui/Button';
import { ThreeDotMenu } from '../../../components/ui/ThreeDotMenu';
import { ReadMoreText } from '../../../components/ui/ReadMoreText';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';

const leaveTypeOptions = [
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'EARNED', label: 'Earned Leave' },
  { value: 'WFH', label: 'Work From Home (WFH)' },
  { value: 'HALF_DAY', label: 'Half Day' }
];

export default function LeavePage() {
  const { user } = useAuth();
  const toast = useToast();
  const customConfirm = useConfirm();
  const [balances, setBalances] = useState<any[]>([]);
  const [balancesOpen, setBalancesOpen] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');
  const [currentPageHistory, setCurrentPageHistory] = useState(1);
  const [searchApproval, setSearchApproval] = useState('');
  const [currentPageApproval, setCurrentPageApproval] = useState(1);
  const itemsPerPage = 8;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDefaultValue, setDialogDefaultValue] = useState('');
  const [dialogParams, setDialogParams] = useState<{ id: string; status: string; currentStatus: string } | null>(null);

  const [leaveType, setLeaveType] = useState('SICK');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  async function loadData() {
    try {
      const balancesRes = await api.leave.balances();
      setBalances(balancesRes.data || []);
      const leavesRes = await api.leave.list();
      setLeaves(leavesRes.data || []);

      if (isAdmin || isHR || isManager) {
        const approvalsRes = await api.leave.pendingApprovals();
        setPendingApprovals(approvalsRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.leave.apply({
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason
      });
      await loadData();
      setStartDate('');
      setEndDate('');
      setReason('');
      toast.success('Leave request submitted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply for leave');
    } finally {
      setSubmitting(false);
    }
  }

  function handleApproval(id: string, status: string, currentStatus: string) {
    const actionText = status === 'APPROVED' ? 'approve' : 'reject';
    setDialogTitle(`Enter a comment/reason to ${actionText} this leave request:`);
    setDialogDefaultValue(status === 'APPROVED' ? 'Approved' : 'Rejected');
    setDialogParams({ id, status, currentStatus });
    setDialogOpen(true);
  }

  async function handleDialogConfirm(comment: string) {
    if (!dialogParams) return;
    const { id, status, currentStatus } = dialogParams;
    try {
      await api.leave.approve(id, { 
        status, 
        currentStatus, 
        comment: comment.trim() || `${status === 'APPROVED' ? 'Approved' : 'Rejected'} via operations dashboard` 
      });
      await loadData();
      setDialogOpen(false);
      toast.success(`Leave request successfully ${status === 'APPROVED' ? 'approved' : 'rejected'}`);
    } catch (err: any) {
      toast.error(err.message || 'Approval action failed');
      throw err;
    }
  }

  async function handleCancel(id: string) {
    const ok = await customConfirm({
      title: 'Cancel Leave Request',
      message: 'Are you sure you want to cancel this leave request?',
      variant: 'warning',
      confirmLabel: 'Cancel Request',
    });
    if (!ok) return;
    try {
      await api.leave.cancel(id);
      await loadData();
      toast.success('Leave request cancelled successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel leave request');
    }
  }

  const filteredHistory = leaves.filter(req => {
    const type = req.leaveType?.toLowerCase() || '';
    const reason = req.reason?.toLowerCase() || '';
    const status = req.status?.toLowerCase() || '';
    const q = searchHistory.toLowerCase();
    return type.includes(q) || reason.includes(q) || status.includes(q);
  });
  const totalPagesHistory = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPageHistory - 1) * itemsPerPage,
    currentPageHistory * itemsPerPage
  );

  const filteredApprovals = pendingApprovals.filter(req => {
    const name = `${req.user?.firstName} ${req.user?.lastName}`.toLowerCase();
    const type = req.leaveType?.toLowerCase() || '';
    const reason = req.reason?.toLowerCase() || '';
    const q = searchApproval.toLowerCase();
    return name.includes(q) || type.includes(q) || reason.includes(q);
  });
  const totalPagesApprovals = Math.ceil(filteredApprovals.length / itemsPerPage);
  const paginatedApprovals = filteredApprovals.slice(
    (currentPageApproval - 1) * itemsPerPage,
    currentPageApproval * itemsPerPage
  );

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Leave Management</h1>
          <p className="text-body-sm text-outline">Manage leave allocations, request checkouts, and approve requests</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <ListSkeleton count={5} />
            <FormSkeleton />
          </div>
          <div className="md:col-span-2 space-y-6">
            <ListSkeleton count={2} />
            <TableSkeleton rows={4} cols={5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Leave Management</h1>
        <p className="text-body-sm text-outline">Manage leave allocations, request checkouts, and approve requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm">
            <button
              type="button"
              onClick={() => setBalancesOpen(prev => !prev)}
              className="w-full flex justify-between items-center mb-1"
            >
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Leave Balances</h2>
              <span className="material-symbols-outlined text-[18px] text-outline transition-transform" style={{ transform: balancesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
            </button>
            {balancesOpen && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {balances.map(bal => {
                  const pct = bal.allocated > 0 ? bal.remaining / bal.allocated : 0;
                  const color = pct === 0 ? 'border-red-300 bg-red-50 text-red-700' : pct < 0.4 ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-blue-200 bg-blue-50 text-blue-900';
                  return (
                    <div key={bal.id} className={`rounded-xl p-2.5 border flex flex-col items-center gap-0.5 text-center ${color}`}>
                      <span className="text-[8px] font-extrabold uppercase tracking-wider leading-tight">{bal.leaveType.replace('_', ' ')}</span>
                      <span className="text-[18px] font-black leading-tight">{bal.remaining}</span>
                      <span className="text-[8px] font-bold opacity-70">of {bal.allocated}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Request Leave</h2>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Leave Type</label>
                <CustomSelect
                  options={leaveTypeOptions}
                  value={leaveType}
                  onChange={setLeaveType}
                  placeholder="Select Leave Type"
                />
              </div>

              <div>
                <CustomDatePicker
                  label="Start Date"
                  required
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Select start date"
                />
              </div>

              <div>
                <CustomDatePicker
                  label="End Date"
                  required
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Select end date"
                />
              </div>

              <div>
                <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                loading={submitting}
                className="w-full"
              >
                Submit Request
              </Button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {(isAdmin || isHR || isManager) && (
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Approvals Inbox</h2>
                <div className="relative w-48">
                  <input
                    type="text"
                    placeholder="Search inbox..."
                    value={searchApproval}
                    onChange={(e) => {
                      setSearchApproval(e.target.value);
                      setCurrentPageApproval(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-[11px] focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[14px]">search</span>
                </div>
              </div>
              
              {paginatedApprovals.length === 0 ? (
                <p className="text-body-sm text-outline py-4 text-center">No pending approval requests.</p>
              ) : (
                <div>
                  <div className="divide-y divide-outline-variant">
                    {paginatedApprovals.map(req => (
                      <div key={req.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-label-md font-bold text-on-surface">{req.user?.firstName} {req.user?.lastName}</p>
                          <p className="text-body-sm text-on-surface-variant font-semibold mt-0.5">
                            {req.leaveType} ({new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()})
                          </p>
                          <p className="text-body-sm text-outline italic mt-1">"{req.reason}"</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1.5 border ${
                            req.status === 'MANAGER_APPROVED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {req.status === 'MANAGER_APPROVED' ? 'Pending HR Approval' : 'Pending Manager Approval'}
                          </span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            onClick={() => handleApproval(req.id, 'REJECTED', req.status)}
                            className="text-error border-error-container hover:bg-error/5"
                          >
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleApproval(req.id, 'APPROVED', req.status)}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {totalPagesApprovals > 1 && (
                    <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between">
                      <span className="text-[11px] text-outline">
                        Showing {(currentPageApproval - 1) * itemsPerPage + 1} to {Math.min(currentPageApproval * itemsPerPage, filteredApprovals.length)} of {filteredApprovals.length} requests
                      </span>
                      <div className="flex gap-1">
                        <button
                          disabled={currentPageApproval === 1}
                          onClick={() => setCurrentPageApproval(currentPageApproval - 1)}
                          className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                        >
                          Prev
                        </button>
                        <button
                          disabled={currentPageApproval === totalPagesApprovals}
                          onClick={() => setCurrentPageApproval(currentPageApproval + 1)}
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

          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">My Requests History</h2>
              <div className="relative w-48">
                <input
                  type="text"
                  placeholder="Search history..."
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
              <p className="text-body-sm text-outline py-8 text-center">No leave requests filed yet.</p>
            ) : (
              <>
              {/* Mobile View - Sleek Cards */}
              <div className="block md:hidden space-y-4">
                {paginatedHistory.map(req => (
                  <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-label-sm font-bold text-slate-900">{req.leaveType} Leave</h4>
                        <p className="text-[11px] text-outline mt-0.5 font-semibold">
                          {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        req.status === 'HR_APPROVED'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : req.status === 'MANAGER_APPROVED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : req.status === 'REJECTED'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : req.status === 'CANCELLED'
                          ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {req.status === 'HR_APPROVED' ? 'APPROVED' : req.status}
                      </span>
                    </div>

                    <div className="text-body-sm text-slate-700 pt-1 border-t border-slate-100">
                      <ReadMoreText text={req.reason} title="Leave Reason" />
                    </div>

                    {(req.status === 'PENDING' || req.status === 'MANAGER_APPROVED') && (
                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => handleCancel(req.id)}
                          className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[10px] rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 border border-red-150 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                          Cancel Request
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
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Type</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Duration</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Reason</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {paginatedHistory.map(req => (
                      <tr key={req.id} className="hover:bg-surface-container-low transition-colors text-body-sm">
                        <td className="px-4 py-3 font-semibold text-on-surface">{req.leaveType}</td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant max-w-xs">
                          <ReadMoreText text={req.reason} title="Leave Reason" />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            req.status === 'HR_APPROVED'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : req.status === 'MANAGER_APPROVED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : req.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : req.status === 'CANCELLED'
                              ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {req.status === 'HR_APPROVED' ? 'APPROVED' : req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(req.status === 'PENDING' || req.status === 'MANAGER_APPROVED') ? (
                            <ThreeDotMenu
                              actions={[
                                {
                                  label: 'Cancel Request',
                                  icon: 'close',
                                  className: 'text-error hover:bg-error/5',
                                  onClick: () => handleCancel(req.id)
                                }
                              ]}
                            />
                          ) : (
                            <span className="text-outline">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>  
                {totalPagesHistory > 1 && (
                  <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between">
                    <span className="text-[11px] text-outline">
                      Showing {(currentPageHistory - 1) * itemsPerPage + 1} to {Math.min(currentPageHistory * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} requests
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
      </div>
      {dialogOpen && (
        <CommentDialog
          isOpen={dialogOpen}
          title={dialogTitle}
          defaultValue={dialogDefaultValue}
          onConfirm={handleDialogConfirm}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
