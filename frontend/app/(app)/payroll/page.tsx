'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';

export default function PayrollPage() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [runMonth, setRunMonth] = useState(new Date().getMonth() + 1);
  const [runYear, setRunYear] = useState(new Date().getFullYear());

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isFinance = userRoles.some((r: any) => r.roleName === 'FINANCE_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  async function loadData() {
    try {
      const payslipsRes = await api.payroll.list();
      setPayslips(payslipsRes.data || []);
      
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

  async function handleGenerateRun(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.payroll.generate({
        month: Number(runMonth),
        year: Number(runYear)
      });
      await loadData();
      alert('Payroll run generated successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to generate payroll run');
    } finally {
      setGenerating(false);
    }
  }

  async function handleViewPayslip(id: string) {
    try {
      const res = await api.payroll.getPayslip(id);
      setSelectedPayslip(res.data);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch payslip details');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Compensation & Payroll</h1>
          <p className="text-body-sm text-outline">Manage salary slips and view payout logs</p>
        </div>
      </div>

      {(isAdmin || isFinance) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm h-fit">
            <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Run Payroll</h2>
            <form onSubmit={handleGenerateRun} className="space-y-4">
              <div>
                <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Month</label>
                <select
                  value={runMonth}
                  onChange={(e) => setRunMonth(Number(e.target.value))}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
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
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-label-md font-bold transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
              >
                {generating ? 'Generating Run...' : 'Execute Payout'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
            <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Payroll Run Logs</h2>
            {runs.length === 0 ? (
              <p className="text-body-sm text-outline py-8 text-center">No payroll runs executed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Run Date</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Period</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Total Gross</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Deductions</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant text-body-sm">
                    {runs.map(run => (
                      <tr key={run.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-3 font-semibold text-on-surface">
                          {new Date(run.runDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {new Date(run.year, run.month - 1).toLocaleString('default', { month: 'long' })} {run.year}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant font-mono">
                          ${run.totalGross.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-error font-mono">
                          ${run.totalDeductions.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200">
                            {run.status}
                          </span>
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

      <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
        <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">
          {isAdmin || isFinance ? 'All Employee Payslips' : 'My Payslips'}
        </h2>
        {payslips.length === 0 ? (
          <p className="text-body-sm text-outline py-8 text-center">No payslip records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Employee</th>
                  <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Period</th>
                  <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-right">Net Payout</th>
                  <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-center">Status</th>
                  <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-body-sm">
                {payslips.map(ps => (
                  <tr key={ps.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-semibold text-on-surface">
                      {ps.user?.firstName} {ps.user?.lastName}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {new Date(ps.year, ps.month - 1).toLocaleString('default', { month: 'long' })} {ps.year}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant font-mono text-right">
                      ${ps.netPay.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200">
                        {ps.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewPayslip(ps.id)}
                        className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded text-label-sm font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        View Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant mb-6">
              <div>
                <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Salary Slip Details</h3>
                <p className="text-[11px] text-outline mt-0.5">
                  Period: {new Date(selectedPayslip.year, selectedPayslip.month - 1).toLocaleString('default', { month: 'long' })} {selectedPayslip.year}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="p-1.5 hover:bg-surface-container rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-1.5 border-b border-outline-variant text-body-sm">
                <span className="text-outline">Basic Salary</span>
                <span className="font-semibold text-on-surface font-mono">${selectedPayslip.basic.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-outline-variant text-body-sm">
                <span className="text-outline">HRA</span>
                <span className="font-semibold text-on-surface font-mono">${selectedPayslip.hra.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-outline-variant text-body-sm">
                <span className="text-outline">Allowances</span>
                <span className="font-semibold text-on-surface font-mono">${selectedPayslip.allowances.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-outline-variant text-body-sm">
                <span className="text-outline">Deductions</span>
                <span className="font-semibold text-error font-mono">-${selectedPayslip.deductions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-outline-variant text-body-sm">
                <span className="text-outline">Tax Incurred</span>
                <span className="font-semibold text-error font-mono">-${selectedPayslip.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 bg-surface-container-low px-4 rounded-lg text-label-md font-bold">
                <span className="text-on-surface">Net Take Home</span>
                <span className="text-primary font-mono">${selectedPayslip.netPay.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPayslip(null)}
              className="mt-6 w-full py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-label-md font-bold transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
