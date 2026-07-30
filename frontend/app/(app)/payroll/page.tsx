'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';
import { TableSkeleton, FormSkeleton } from '../../../components/ui/Skeleton';
import { Button } from '../../../components/ui/Button';
import { ThreeDotMenu } from '../../../components/ui/ThreeDotMenu';

export default function PayrollPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [runMonth, setRunMonth] = useState(new Date().getMonth() + 1);
  const [runYear, setRunYear] = useState(new Date().getFullYear());

  const [runSearch, setRunSearch] = useState('');
  const [currentRunPage, setCurrentRunPage] = useState(1);
  const [payslipSearch, setPayslipSearch] = useState('');
  const [currentPayslipPage, setCurrentPayslipPage] = useState(1);

  // Executive Review Edit State
  const [editFormData, setEditFormData] = useState({
    basicSalary: 0,
    hra: 0,
    allowances: 0,
    bonus: 0,
    pf: 0,
    tax: 0,
    lopDays: 0,
    lopDeduction: 0,
    lateDeduction: 0,
    otherDeductions: 0,
    comments: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Disbursement State
  const [utrRemarks, setUtrRemarks] = useState('');
  const [utrFile, setUtrFile] = useState<File | null>(null);
  const [disbursing, setDisbursing] = useState(false);

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isFinance = userRoles.some((r: any) => r.roleName === 'FINANCE_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  async function loadData() {
    try {
      const payslipsRes = await api.payroll.list();
      const mappedPayslips = (payslipsRes.data || []).map((ps: any) => ({
        ...ps,
        year: ps.payrollRun?.year ?? ps.year,
        month: ps.payrollRun?.month ?? ps.month,
        status: ps.status ?? ps.payrollRun?.status ?? 'DRAFT',
        netPay: ps.netSalary ?? ps.netPay ?? 0,
        basic: ps.basicSalary ?? ps.basic ?? 0,
        deductions: ps.totalDeductions ?? ps.deductions ?? 0,
      }));
      setPayslips(mappedPayslips);
      
      if (isAdmin || isFinance) {
        const runsRes = await api.payroll.runs();
        setRuns(runsRes.data || []);
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

  // Sync edit form data when a payslip is selected
  useEffect(() => {
    if (selectedPayslip) {
      setEditFormData({
        basicSalary: selectedPayslip.basicSalary || 0,
        hra: selectedPayslip.hra || 0,
        allowances: selectedPayslip.allowances || 0,
        bonus: selectedPayslip.bonus || 0,
        pf: selectedPayslip.pf || 0,
        tax: selectedPayslip.tax || 0,
        lopDays: selectedPayslip.lopDays || 0,
        lopDeduction: selectedPayslip.lopDeduction || 0,
        lateDeduction: selectedPayslip.lateDeduction || 0,
        otherDeductions: selectedPayslip.otherDeductions || 0,
        comments: selectedPayslip.comments || ''
      });
      setUtrRemarks('');
      setUtrFile(null);
    }
  }, [selectedPayslip]);

  async function handleGenerateRun(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.payroll.generate({
        month: Number(runMonth),
        year: Number(runYear)
      });
      await loadData();
      toast.success('Payroll run generated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate payroll run');
    } finally {
      setGenerating(false);
    }
  }

  async function handleViewPayslip(id: string) {
    try {
      const res = await api.payroll.getPayslip(id);
      const ps = res.data;
      if (ps) {
        setSelectedPayslip({
          ...ps,
          year: ps.payrollRun?.year ?? ps.year,
          month: ps.payrollRun?.month ?? ps.month,
          status: ps.status ?? ps.payrollRun?.status ?? 'DRAFT',
          netPay: ps.netSalary ?? ps.netPay ?? 0,
          basic: ps.basicSalary ?? ps.basic ?? 0,
          deductions: ps.totalDeductions ?? ps.deductions ?? 0,
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch payslip details');
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await api.payroll.editPayslip(selectedPayslip.id, editFormData);
      const updated = res.data;
      setSelectedPayslip({
        ...updated,
        year: updated.payrollRun?.year ?? updated.year,
        month: updated.payrollRun?.month ?? updated.month,
        status: updated.status ?? updated.payrollRun?.status ?? 'DRAFT',
        netPay: updated.netSalary,
        basic: updated.basicSalary,
        deductions: updated.totalDeductions,
      });
      toast.success('Salary parameters updated successfully');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save salary parameters');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDisburse(e: React.FormEvent) {
    e.preventDefault();
    setDisbursing(true);
    try {
      const formData = new FormData();
      formData.append('remarks', utrRemarks);
      if (utrFile) {
        formData.append('receipt', utrFile);
      }
      const res = await api.payroll.disbursePayslip(selectedPayslip.id, formData);
      const updated = res.data;
      setSelectedPayslip({
        ...updated,
        year: updated.payrollRun?.year ?? updated.year,
        month: updated.payrollRun?.month ?? updated.month,
        status: updated.status ?? updated.payrollRun?.status ?? 'DRAFT',
        netPay: updated.netSalary,
        basic: updated.basicSalary,
        deductions: updated.totalDeductions,
      });
      toast.success('Salary marked as paid and disbursed');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to disburse salary');
    } finally {
      setDisbursing(false);
    }
  }

  function handleLopDaysChange(daysVal: number) {
    const basic = editFormData.basicSalary;
    const dailyWage = basic / 30.0;
    const lopDeduct = Math.round(daysVal * dailyWage * 100) / 100;
    setEditFormData(prev => ({
      ...prev,
      lopDays: daysVal,
      lopDeduction: lopDeduct
    }));
  }

  // Live client-side recalculations
  const liveGross = editFormData.basicSalary + editFormData.hra + editFormData.allowances + editFormData.bonus;
  const liveProfessionalTax = (selectedPayslip?.user?.employeeType === 'INTERN') ? 0 : 200;
  const liveEsic = (selectedPayslip?.user?.employeeType === 'INTERN' || liveGross > 21000) ? 0 : Math.round(liveGross * 0.0075 * 100) / 100;
  const liveDeductions = editFormData.pf + editFormData.tax + liveProfessionalTax + liveEsic + editFormData.lopDeduction + editFormData.lateDeduction + editFormData.otherDeductions;
  const liveNet = Math.max(0, liveGross - liveDeductions);

  const filteredRuns = runs.filter(run => {
    const monthName = new Date(run.year, run.month - 1).toLocaleString('default', { month: 'long' }).toLowerCase();
    const query = runSearch.toLowerCase();
    return (
      monthName.includes(query) ||
      run.year.toString().includes(query) ||
      run.status.toLowerCase().includes(query)
    );
  });

  const runItemsPerPage = 5;
  const totalRunPages = Math.ceil(filteredRuns.length / runItemsPerPage);
  const paginatedRuns = filteredRuns.slice(
    (currentRunPage - 1) * runItemsPerPage,
    currentRunPage * runItemsPerPage
  );

  const filteredPayslips = payslips.filter(ps => {
    const fullName = `${ps.user?.firstName} ${ps.user?.lastName}`.toLowerCase();
    const monthName = new Date(ps.year, ps.month - 1).toLocaleString('default', { month: 'long' }).toLowerCase();
    const query = payslipSearch.toLowerCase();
    return (
      fullName.includes(query) ||
      (ps.user?.email || '').toLowerCase().includes(query) ||
      monthName.includes(query) ||
      ps.year.toString().includes(query) ||
      ps.status.toLowerCase().includes(query)
    );
  });

  const payslipItemsPerPage = 5;
  const totalPayslipPages = Math.ceil(filteredPayslips.length / payslipItemsPerPage);
  const paginatedPayslips = filteredPayslips.slice(
    (currentPayslipPage - 1) * payslipItemsPerPage,
    currentPayslipPage * payslipItemsPerPage
  );

  if (loading) {
    return (
      <div className="space-y-6 font-sans p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline-md font-bold text-on-surface">Payroll Management</h1>
            <p className="text-body-sm text-outline">Manage salary schedules, statutory deductions, and payslips</p>
          </div>
        </div>
        
        {isAdmin || isFinance ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <FormSkeleton />
            </div>
            <div className="md:col-span-2 space-y-6">
              <TableSkeleton rows={4} cols={5} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <TableSkeleton rows={4} cols={5} />
          </div>
        )}
      </div>
    );
  }

  // ── DEDICATED FULL-PAGE EXECUTIVE REVIEW WORKSPACE ─────────────────────────
  if (selectedPayslip) {
    const telemetry = selectedPayslip.telemetry || {
      attendance: { presentDays: 0, lateDays: 0, absentDays: 0, halfDays: 0, leaveDays: 0, totalDaysInMonth: 30 },
      leaves: { approvedLeavesCount: 0 },
      tasks: { assignedTasksCount: 0, completedTasksCount: 0, productivityRate: 0 },
      expenses: []
    };

    const isRecordPaid = selectedPayslip.status === 'PAID';
    const periodName = new Date(selectedPayslip.year, selectedPayslip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
      <div className="space-y-6 font-sans p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
        
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedPayslip(null)}
              className="group flex items-center gap-2 text-body-sm font-bold text-slate-650 hover:text-slate-900 transition-colors cursor-pointer py-1"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Queue
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-headline-sm font-bold text-slate-900">
                {selectedPayslip.user?.firstName} {selectedPayslip.user?.lastName}
              </h1>
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-300">
                ID: {selectedPayslip.user?.employeeId || 'N/A'}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                isRecordPaid 
                  ? 'bg-green-100 text-green-850 border-green-200' 
                  : selectedPayslip.status === 'APPROVED'
                  ? 'bg-blue-100 text-blue-850 border-blue-200'
                  : 'bg-amber-100 text-amber-850 border-amber-200'
              }`}>
                {selectedPayslip.status}
              </span>
            </div>
            <p className="text-body-xs text-slate-500">
              {selectedPayslip.user?.designation || 'Staff'} · {periodName}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-label-md font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print Page
            </button>
          </div>
        </div>

        {/* Executive Monthly Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Attendance */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-sm font-bold text-slate-500 uppercase tracking-wider">Attendance Stats</span>
              <span className="material-symbols-outlined text-slate-400">calendar_today</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-headline-sm font-extrabold text-slate-900">
                  {telemetry.attendance.presentDays} / {telemetry.attendance.totalDaysInMonth}
                </span>
                <span className="text-body-xs font-semibold text-slate-500">Days Checked-In</span>
              </div>
              <div className="flex justify-between text-body-xs font-medium text-slate-600">
                <span>Late: {telemetry.attendance.lateDays}d</span>
                <span>Absent: {telemetry.attendance.absentDays}d</span>
                <span>Leave: {telemetry.attendance.leaveDays}d</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-700 h-full transition-all" 
                  style={{ width: `${Math.min(100, ((telemetry.attendance.presentDays + telemetry.attendance.leaveDays) / telemetry.attendance.totalDaysInMonth) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Leaves & LOP */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-sm font-bold text-slate-500 uppercase tracking-wider">Leaves & LOP</span>
              <span className="material-symbols-outlined text-slate-400">pending_actions</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-headline-sm font-extrabold text-slate-900">
                  {telemetry.leaves.approvedLeavesCount}
                </span>
                <span className="text-body-xs font-semibold text-slate-500">Approved Leaves</span>
              </div>
              <div className="flex justify-between items-center text-body-xs pt-1">
                <span className="font-semibold text-slate-600">LOP Days: {editFormData.lopDays}d</span>
                <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                  Charged: ₹{editFormData.lopDeduction.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Productivity */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-sm font-bold text-slate-500 uppercase tracking-wider">Task Productivity</span>
              <span className="material-symbols-outlined text-slate-400">task_alt</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-headline-sm font-extrabold text-slate-900">
                  {telemetry.tasks.productivityRate}%
                </span>
                <span className="text-body-xs font-semibold text-slate-500">Completion Rate</span>
              </div>
              <div className="flex justify-between text-body-xs font-semibold text-slate-600">
                <span>Completed: {telemetry.tasks.completedTasksCount}</span>
                <span>Assigned: {telemetry.tasks.assignedTasksCount}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-700 h-full transition-all" 
                  style={{ width: `${telemetry.tasks.productivityRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Record Status */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-sm font-bold text-slate-500 uppercase tracking-wider">Workflow Phase</span>
              <span className="material-symbols-outlined text-slate-400">payments</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-headline-sm font-extrabold text-slate-900">
                  {isRecordPaid ? 'PAID' : selectedPayslip.status}
                </span>
                <span className="text-body-xs font-semibold text-slate-500">Record Lock</span>
              </div>
              <div className="text-body-xs font-medium text-slate-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  {isRecordPaid ? 'lock' : 'lock_open'}
                </span>
                {isRecordPaid ? 'Disbursement complete. Locked.' : 'Awaiting admin override.'}
              </div>
            </div>
          </div>
        </div>

        {/* Pre-Disbursement Summary Banner */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-label-md font-bold tracking-wider text-slate-350 uppercase">Pre-Disbursement Verification</h3>
            <p className="text-body-sm text-slate-100 font-medium">
              {selectedPayslip.user?.firstName} {selectedPayslip.user?.lastName} ({selectedPayslip.user?.employeeId || 'N/A'})
            </p>
            <p className="text-body-xs text-slate-400 font-medium">
              Gross: ₹{liveGross.toFixed(2)} · Deductions: -₹{liveDeductions.toFixed(2)} · Bank Account: XXXX1234
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
            <div className="bg-slate-800 border border-slate-700 px-5 py-3 rounded-xl flex flex-col min-w-[160px]">
              <span className="text-body-xs text-slate-400 font-semibold uppercase">Net Take-Home Pay</span>
              <span className="text-title-md font-black text-white font-mono mt-0.5">
                ₹{liveNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Workspace Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT PANEL: Official Payslip Document View */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-label-md font-black tracking-widest text-slate-900 uppercase">WorkforceOS</h2>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Salary Disbursement Slip</p>
                </div>
                <div className="text-right">
                  <p className="text-body-xs font-bold text-slate-850">Period: {periodName}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Generated: {new Date(selectedPayslip.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Employee Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm bg-slate-50 p-4 border border-slate-200 rounded-xl">
              <div>
                <span className="text-slate-500 font-semibold text-[11px] uppercase block">Employee Name</span>
                <span className="font-bold text-slate-800">{selectedPayslip.user?.firstName} {selectedPayslip.user?.lastName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold text-[11px] uppercase block">Employee ID</span>
                <span className="font-bold text-slate-850">{selectedPayslip.user?.employeeId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold text-[11px] uppercase block">Designation</span>
                <span className="font-bold text-slate-850">{selectedPayslip.user?.designation || 'Staff'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold text-[11px] uppercase block">Bank Account Number</span>
                <span className="font-bold text-slate-850">XXXX1234 (Dummy HDFC)</span>
              </div>
            </div>

            {/* Earnings Table */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-1">Earnings</h4>
              <div className="divide-y divide-slate-100 text-body-sm">
                <div className="flex justify-between py-2">
                  <span className="text-slate-600 font-medium">Basic Salary</span>
                  <span className="font-mono text-slate-800">₹{editFormData.basicSalary.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600 font-medium">House Rent Allowance (HRA)</span>
                  <span className="font-mono text-slate-800">₹{editFormData.hra.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600 font-medium">Special Allowances</span>
                  <span className="font-mono text-slate-800">₹{editFormData.allowances.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600 font-medium">Performance Bonus / Adjustments</span>
                  <span className="font-mono text-slate-800">₹{editFormData.bonus.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2.5 font-bold text-slate-900 border-t border-slate-200">
                  <span>Gross Salary</span>
                  <span className="font-mono">₹{liveGross.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Deductions Table */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-1">Deductions</h4>
              <div className="divide-y divide-slate-100 text-body-sm">
                <div className="flex justify-between py-2">
                  <span className="text-slate-600 font-medium">Provident Fund (PF)</span>
                  <span className="font-mono text-slate-800">₹{editFormData.pf.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600 font-medium">Income Tax (TDS)</span>
                  <span className="font-mono text-slate-800">₹{editFormData.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600 font-medium">Professional Tax (PT)</span>
                  <span className="font-mono text-slate-800">₹{liveProfessionalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600 font-medium">ESIC Contribution</span>
                  <span className="font-mono text-slate-800">₹{liveEsic.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600 font-medium">Loss of Pay (LOP)</span>
                  <span className="font-mono text-slate-800">₹{editFormData.lopDeduction.toFixed(2)} ({editFormData.lopDays} days)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600 font-medium">Late Arrival Penalties</span>
                  <span className="font-mono text-slate-800">₹{editFormData.lateDeduction.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600 font-medium">Other Miscellaneous Deductions</span>
                  <span className="font-mono text-slate-800">₹{editFormData.otherDeductions.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2.5 font-bold text-error border-t border-slate-200">
                  <span>Total Deductions</span>
                  <span className="font-mono">-₹{liveDeductions.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* High Contrast Net Take Home Box */}
            <div className="bg-slate-900 text-white px-5 py-4 rounded-xl flex justify-between items-center text-label-md font-bold font-mono">
              <span className="uppercase text-slate-350 tracking-wider text-label-sm">Net take-home payout</span>
              <span className="text-white text-title-sm">
                ₹{liveNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Remarks Display */}
            {editFormData.comments && (
              <div className="border-t border-slate-200 pt-4">
                <span className="text-slate-500 font-semibold text-[11px] uppercase block">Admin Remarks</span>
                <p className="text-body-sm text-slate-700 whitespace-pre-wrap leading-relaxed mt-1 font-medium bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {editFormData.comments}
                </p>
              </div>
            )}

            {selectedPayslip.paymentSlipUrl && (
              <div className="border-t border-slate-200 pt-4 flex items-center justify-between bg-green-50/50 p-3 rounded-lg border border-green-200">
                <span className="text-body-xs font-semibold text-green-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  Payment receipt attachment uploaded
                </span>
                <a
                  href={selectedPayslip.paymentSlipUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-body-xs font-bold text-slate-900 underline hover:text-slate-700"
                >
                  Download Receipt
                </a>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Admin Component Edit & Disbursement Console */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Reimbursement suggestions */}
            {telemetry.expenses.length > 0 && !isRecordPaid && (
              <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-3">
                <h3 className="text-label-sm font-bold text-slate-900 uppercase tracking-wider">Expense Reimbursements</h3>
                <p className="text-body-xs text-slate-500">Click to automatically attach pending expense claims to this month's adjustments.</p>
                <div className="space-y-2">
                  {telemetry.expenses.map((exp: any) => (
                    <label key={exp.id} className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-body-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        onChange={(e) => {
                          const val = exp.amount;
                          if (e.target.checked) {
                            setEditFormData(prev => ({ ...prev, bonus: prev.bonus + val }));
                          } else {
                            setEditFormData(prev => ({ ...prev, bonus: Math.max(0, prev.bonus - val) }));
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{exp.title}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{exp.category} · {new Date(exp.incurredOn).toLocaleDateString()}</p>
                      </div>
                      <span className="font-bold text-slate-950 shrink-0">₹{exp.amount.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Form Console */}
            <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4">
              <h3 className="text-label-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-slate-500">tune</span>
                Adjustment Parameters
              </h3>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">Basic Salary</label>
                    <input
                      type="number"
                      value={editFormData.basicSalary || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, basicSalary: parseFloat(e.target.value) || 0 }))}
                      disabled={isRecordPaid || savingEdit}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">HRA</label>
                    <input
                      type="number"
                      value={editFormData.hra || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, hra: parseFloat(e.target.value) || 0 }))}
                      disabled={isRecordPaid || savingEdit}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">Special Allowance</label>
                    <input
                      type="number"
                      value={editFormData.allowances || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, allowances: parseFloat(e.target.value) || 0 }))}
                      disabled={isRecordPaid || savingEdit}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">Bonus / Adjustment</label>
                    <input
                      type="number"
                      value={editFormData.bonus || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, bonus: parseFloat(e.target.value) || 0 }))}
                      disabled={isRecordPaid || savingEdit}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">PF Deduction</label>
                    <input
                      type="number"
                      value={editFormData.pf || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, pf: parseFloat(e.target.value) || 0 }))}
                      disabled={isRecordPaid || savingEdit}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">TDS Deduction</label>
                    <input
                      type="number"
                      value={editFormData.tax || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                      disabled={isRecordPaid || savingEdit}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">LOP Days</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editFormData.lopDays || ''}
                      onChange={(e) => handleLopDaysChange(parseFloat(e.target.value) || 0)}
                      disabled={isRecordPaid || savingEdit}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">LOP Deduction</label>
                    <input
                      type="number"
                      value={editFormData.lopDeduction || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, lopDeduction: parseFloat(e.target.value) || 0 }))}
                      disabled={isRecordPaid || savingEdit}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">Late Deduction</label>
                    <input
                      type="number"
                      value={editFormData.lateDeduction || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, lateDeduction: parseFloat(e.target.value) || 0 }))}
                      disabled={isRecordPaid || savingEdit}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">Other Deductions</label>
                    <input
                      type="number"
                      value={editFormData.otherDeductions || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, otherDeductions: parseFloat(e.target.value) || 0 }))}
                      disabled={isRecordPaid || savingEdit}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">Comments / Notes</label>
                  <textarea
                    rows={2}
                    value={editFormData.comments}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, comments: e.target.value }))}
                    disabled={isRecordPaid || savingEdit}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700 disabled:opacity-50"
                  />
                </div>

                {!isRecordPaid && (
                  <Button
                    type="submit"
                    loading={savingEdit}
                    className="w-full"
                  >
                    Save Changes
                  </Button>
                )}
              </form>
            </div>

            {/* Disbursement Proof Form */}
            {!isRecordPaid ? (
              <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4">
                <h3 className="text-label-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-slate-500">receipt_long</span>
                  Mark as Disbursed
                </h3>

                <form onSubmit={handleDisburse} className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">UTR / Payment Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR1234567890"
                      value={utrRemarks}
                      onChange={(e) => setUtrRemarks(e.target.value)}
                      required
                      disabled={disbursing}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-650 mb-1.5 uppercase font-bold">Receipt Attachment (PDF/Image)</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setUtrFile(e.target.files[0]);
                        }
                      }}
                      required
                      disabled={disbursing}
                      className="w-full p-2 text-body-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-200 file:bg-white file:text-body-sm file:font-semibold hover:file:bg-slate-100 file:cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  <Button
                    type="submit"
                    loading={disbursing}
                    className="w-full"
                  >
                    Confirm Disbursement
                  </Button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-100 border border-slate-200 p-5 rounded-3xl space-y-2 text-center text-body-sm">
                <span className="material-symbols-outlined text-slate-400 text-[36px]">verified</span>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider">Record Locked</h4>
                <p className="text-slate-500 text-body-xs px-4">
                  This payroll slip has been fully disbursed and marked paid. Parameters cannot be edited further.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN QUEUE LIST VIEW ───────────────────────────────────────────────────
  return (
    <div className="space-y-6 font-sans p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Compensation & Payroll</h1>
          <p className="text-body-sm text-outline">Manage salary slips and view payout logs</p>
        </div>
      </div>

      {(isAdmin || isFinance) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm h-fit">
            <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Run Payroll</h2>
            <form onSubmit={handleGenerateRun} className="space-y-4">
              <div>
                <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Month</label>
                <select
                  value={runMonth}
                  onChange={(e) => setRunMonth(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Year</label>
                <select
                  value={runYear}
                  onChange={(e) => setRunYear(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm focus:ring-1 focus:ring-slate-700"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>

              <Button
                type="submit"
                loading={generating}
                className="w-full animate-none"
              >
                Execute Payout
              </Button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Payroll Run Logs</h2>
              <div className="relative w-full sm:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={runSearch}
                  onChange={(e) => {
                    setRunSearch(e.target.value);
                    setCurrentRunPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-slate-700"
                />
              </div>
            </div>

            {filteredRuns.length === 0 ? (
              <p className="text-body-sm text-outline py-8 text-center">No payroll runs executed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <>
                  {/* MOBILE CODE - Mobile View for Runs */}
                  <div className="block md:hidden space-y-4">
                    {paginatedRuns.map(run => (
                      <div key={run.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-none hover:border-slate-350 transition-all text-body-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-label-sm font-bold text-slate-900">Run: {new Date(run.createdAt).toLocaleDateString()}</h4>
                            <p className="text-[11px] text-outline mt-0.5 font-medium">
                              Period: {new Date(run.year, run.month - 1).toLocaleString('default', { month: 'long' })} {run.year}
                            </p>
                          </div>
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold border border-slate-200 uppercase">
                            {run.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100 font-semibold text-slate-700">
                          <span>Total Gross: <span className="font-mono text-slate-900">₹{(run.totalGross ?? 0).toFixed(2)}</span></span>
                          <span className="text-red-650">Deductions: <span className="font-mono">₹{(run.totalDeductions ?? 0).toFixed(2)}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View - Runs Table */}
                  <table className="hidden md:table w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Run Date</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Period</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Total Gross</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Deductions</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-body-sm">
                      {paginatedRuns.map(run => (
                        <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-on-surface">
                            {new Date(run.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant">
                            {new Date(run.year, run.month - 1).toLocaleString('default', { month: 'long' })} {run.year}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant font-mono">
                            ₹{(run.totalGross ?? 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-error font-mono">
                            ₹{(run.totalDeductions ?? 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                              {run.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>

                {totalRunPages > 1 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-body-sm text-outline">
                      Showing {(currentRunPage - 1) * runItemsPerPage + 1} to {Math.min(currentRunPage * runItemsPerPage, filteredRuns.length)} of {filteredRuns.length} runs
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={currentRunPage === 1}
                        onClick={() => setCurrentRunPage(currentRunPage - 1)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer text-on-surface bg-white"
                      >
                        Previous
                      </button>
                      <button
                        disabled={currentRunPage === totalRunPages}
                        onClick={() => setCurrentRunPage(currentRunPage + 1)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer text-on-surface bg-white"
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
      )}

      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">
            {isAdmin || isFinance ? 'All Employee Payslips' : 'My Payslips'}
          </h2>
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search payslips..."
              value={payslipSearch}
              onChange={(e) => {
                setPayslipSearch(e.target.value);
                setCurrentPayslipPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-slate-700"
            />
          </div>
        </div>

        {filteredPayslips.length === 0 ? (
          <p className="text-body-sm text-outline py-8 text-center">No payslip records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <>
              {/* MOBILE CODE - Mobile View for Slips */}
              <div className="block md:hidden space-y-4">
                {paginatedPayslips.map(ps => (
                  <div key={ps.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-none hover:border-slate-350 transition-all text-body-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-label-sm font-bold text-slate-900">{ps.user?.firstName} {ps.user?.lastName}</h4>
                        <p className="text-[11px] text-outline mt-0.5 font-medium">
                          Period: {new Date(ps.year, ps.month - 1).toLocaleString('default', { month: 'long' })} {ps.year}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                        ps.status === 'PAID' ? 'bg-green-50 text-green-750 border-green-200' : 'bg-slate-100 text-slate-750 border-slate-200'
                      }`}>
                        {ps.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100 font-semibold text-slate-700">
                      <span>Net Payout: <span className="font-mono text-slate-900">₹{ps.netPay.toFixed(2)}</span></span>
                      <button
                        onClick={() => handleViewPayslip(ps.id)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] rounded uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[12px]">visibility</span>
                        View Workspace
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Slips Table */}
              <table className="hidden md:table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Employee</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Period</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-right">Net Payout</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-center">Status</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-body-sm">
                  {paginatedPayslips.map(ps => (
                    <tr key={ps.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-on-surface">
                        {ps.user?.firstName} {ps.user?.lastName}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {new Date(ps.year, ps.month - 1).toLocaleString('default', { month: 'long' })} {ps.year}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant font-mono text-right">
                        ₹{ps.netPay.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          ps.status === 'PAID' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : ps.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {ps.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ThreeDotMenu
                          actions={[
                            {
                              label: (isAdmin || isFinance) ? 'Review Workspace' : 'View Payslip',
                              icon: 'visibility',
                              onClick: () => handleViewPayslip(ps.id)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>

            {totalPayslipPages > 1 && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-body-sm text-outline">
                  Showing {(currentPayslipPage - 1) * payslipItemsPerPage + 1} to {Math.min(currentPayslipPage * payslipItemsPerPage, filteredPayslips.length)} of {filteredPayslips.length} slips
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPayslipPage === 1}
                    onClick={() => setCurrentPayslipPage(currentPayslipPage - 1)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer text-on-surface bg-white"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPayslipPage === totalPayslipPages}
                    onClick={() => setCurrentPayslipPage(currentPayslipPage + 1)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer text-on-surface bg-white"
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
  );
}
