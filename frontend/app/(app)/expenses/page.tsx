'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';
import { Button } from '../../../components/ui/Button';
import { TableSkeleton, FormSkeleton } from '../../../components/ui/Skeleton';
import { ReadMoreText } from '../../../components/ui/ReadMoreText';

export default function ExpensesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actioningClaimId, setActioningClaimId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('TRAVEL');
  const [description, setDescription] = useState('');
  const [searchClaims, setSearchClaims] = useState('');
  const [currentPageClaims, setCurrentPageClaims] = useState(1);
  const [searchApproval, setSearchApproval] = useState('');
  const [currentPageApproval, setCurrentPageApproval] = useState(1);
  const itemsPerPage = 8;

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isFinance = userRoles.some((r: any) => r.roleName === 'FINANCE_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  async function loadData() {
    try {
      const res = await api.expenses.list();
      setExpenses(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.expenses.create({
        amount: Number(amount),
        category,
        description
      });
      setAmount('');
      setDescription('');
      await loadData();
      toast.success('Expense claim filed successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit expense claim');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: string, status: string) {
    setActioningClaimId(id);
    try {
      await api.expenses.approve(id, status);
      await loadData();
      toast.success(`Expense claim ${status.toLowerCase()} successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActioningClaimId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Reimbursement & Expenses</h1>
          <p className="text-body-sm text-outline">File reimbursement requests and review team expenses claims</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <FormSkeleton />
          </div>
          <div className="md:col-span-2">
            <TableSkeleton rows={6} cols={4} />
          </div>
        </div>
      </div>
    );
  }

  const filteredClaims = expenses.filter(exp => exp.userId === user.id).filter(exp => {
    const category = exp.category?.toLowerCase() || '';
    const description = exp.description?.toLowerCase() || '';
    const status = exp.status?.toLowerCase() || '';
    const q = searchClaims.toLowerCase();
    return category.includes(q) || description.includes(q) || status.includes(q);
  });
  const totalPagesClaims = Math.ceil(filteredClaims.length / itemsPerPage);
  const paginatedClaims = filteredClaims.slice(
    (currentPageClaims - 1) * itemsPerPage,
    currentPageClaims * itemsPerPage
  );

  const filteredApprovals = expenses.filter(exp => exp.userId !== user.id && exp.status === 'PENDING').filter(exp => {
    const name = `${exp.user?.firstName} ${exp.user?.lastName}`.toLowerCase();
    const category = exp.category?.toLowerCase() || '';
    const description = exp.description?.toLowerCase() || '';
    const q = searchApproval.toLowerCase();
    return name.includes(q) || category.includes(q) || description.includes(q);
  });
  const totalPagesApprovals = Math.ceil(filteredApprovals.length / itemsPerPage);
  const paginatedApprovals = filteredApprovals.slice(
    (currentPageApproval - 1) * itemsPerPage,
    currentPageApproval * itemsPerPage
  );

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Reimbursement & Expenses</h1>
        <p className="text-body-sm text-outline">File reimbursement requests and review team expenses claims</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm h-fit">
          <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">File Claim</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="TRAVEL">Travel</option>
                <option value="MEALS">Meals & Food</option>
                <option value="EQUIPMENT">Equipment & Tech</option>
                <option value="EDUCATION">Education & Training</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Description</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              loading={submitting}
              className="w-full py-3"
            >
              File Expense Claim
            </Button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-6">
          {(isAdmin || isFinance || isManager) && (
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Pending Team Claims</h2>
                <div className="relative w-48">
                  <input
                    type="text"
                    placeholder="Search pending..."
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
                <p className="text-body-sm text-outline py-4 text-center">No pending expense approvals.</p>
              ) : (
                <div>
                  <div className="divide-y divide-outline-variant">
                    {paginatedApprovals.map(exp => (
                      <div key={exp.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-label-md font-bold text-on-surface">{exp.user?.firstName} {exp.user?.lastName}</p>
                          <p className="text-body-sm text-on-surface-variant font-semibold mt-0.5">
                            ₹{exp.amount.toFixed(2)} - {exp.category}
                          </p>
                          <p className="text-body-sm text-outline italic mt-1">"{exp.description}"</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            loading={actioningClaimId === exp.id}
                            disabled={actioningClaimId !== null}
                            onClick={() => handleApprove(exp.id, 'REJECTED')}
                            className="px-3 py-1.5 text-error hover:bg-error/5 border-error-container text-label-sm"
                          >
                            Reject
                          </Button>
                          <Button
                            variant="primary"
                            loading={actioningClaimId === exp.id}
                            disabled={actioningClaimId !== null}
                            onClick={() => handleApprove(exp.id, 'APPROVED')}
                            className="px-3 py-1.5 text-label-sm"
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
                        Showing {(currentPageApproval - 1) * itemsPerPage + 1} to {Math.min(currentPageApproval * itemsPerPage, filteredApprovals.length)} of {filteredApprovals.length} claims
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

          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">My Expenses</h2>
              <div className="relative w-48">
                <input
                  type="text"
                  placeholder="Search claims..."
                  value={searchClaims}
                  onChange={(e) => {
                    setSearchClaims(e.target.value);
                    setCurrentPageClaims(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-[11px] focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[14px]">search</span>
              </div>
            </div>
            
            {paginatedClaims.length === 0 ? (
              <p className="text-body-sm text-outline py-8 text-center">No expense claims filed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Category</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Amount</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Description</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant text-body-sm">
                    {paginatedClaims.map(exp => (
                      <tr key={exp.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-3 font-semibold text-on-surface">{exp.category}</td>
                        <td className="px-4 py-3 text-on-surface-variant font-mono">
                          ₹{exp.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant max-w-xs">
                          <ReadMoreText text={exp.description} title="Expense Description" />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            exp.status === 'APPROVED'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : exp.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          }`}>
                            {exp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {totalPagesClaims > 1 && (
                  <div className="pt-4 mt-4 border-t border-outline-variant flex items-center justify-between">
                    <span className="text-[11px] text-outline">
                      Showing {(currentPageClaims - 1) * itemsPerPage + 1} to {Math.min(currentPageClaims * itemsPerPage, filteredClaims.length)} of {filteredClaims.length} claims
                    </span>
                    <div className="flex gap-1">
                      <button
                        disabled={currentPageClaims === 1}
                        onClick={() => setCurrentPageClaims(currentPageClaims - 1)}
                        className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Prev
                      </button>
                      <button
                        disabled={currentPageClaims === totalPagesClaims}
                        onClick={() => setCurrentPageClaims(currentPageClaims + 1)}
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
      </div>
    </div>
  );
}
