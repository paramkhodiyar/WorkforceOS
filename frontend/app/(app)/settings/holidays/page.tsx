'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api/client';
import { useAuth } from '../../../../lib/auth/AuthProvider';
import { useToast } from '../../../../lib/toast/ToastProvider';
import { TableSkeleton } from '../../../../components/ui/Skeleton';

export default function HolidaysPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [isOptional, setIsOptional] = useState(false);

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  async function loadHolidays() {
    try {
      setLoading(true);
      const res = await api.organization.listHolidays();
      setHolidays(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      if (!isAdmin && !isHR) {
        router.push('/unauthorized');
      } else {
        loadHolidays();
      }
    }
  }, [user, router]);

  async function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !date) {
      toast.error('Please enter both name and date');
      return;
    }
    try {
      setSubmitting(true);
      await api.organization.createHoliday({ name, date, isOptional });
      toast.success('Holiday added successfully');
      setName('');
      setDate('');
      setIsOptional(false);
      await loadHolidays();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create holiday');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteHoliday(id: string) {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await api.organization.deleteHoliday(id);
      toast.success('Holiday deleted successfully');
      await loadHolidays();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete holiday');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Holiday Calendar Settings</h1>
          <p className="text-body-sm text-outline">Manage custom and national holidays</p>
        </div>
        <TableSkeleton rows={8} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-extrabold text-slate-900 tracking-tight">Holiday Settings</h1>
          <p className="text-body-sm text-slate-500 mt-1">Configure national and custom holidays for your organization</p>
        </div>
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-body-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Settings
        </button>
      </div>

      {/* Note Warning explaining the impacts */}
      <div className="bg-amber-50 border border-amber-200/80 text-amber-900 rounded-3xl p-6 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 flex items-center justify-center bg-amber-100 text-amber-700 rounded-2xl shrink-0">
          <span className="material-symbols-outlined text-[22px]">warning</span>
        </div>
        <div>
          <h4 className="text-label-md font-bold text-amber-950">Crucial System Impact of Holidays</h4>
          <p className="text-[12px] text-amber-800 leading-relaxed mt-1">
            Holidays are <strong>automatically excluded</strong> from the company's scheduled working days for each calendar month.
            Configuring or deleting holidays will directly alter the <strong>workingDaysInMonth</strong> parameter, which:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-[12px] text-amber-800">
            <li>Recalculates employees' Loss of Pay (LOP) deduction triggers in payroll.</li>
            <li>Prevents automatic absenteeism marking for that date during the nightly attendance cron job.</li>
            <li>Alters leave duration calculations (employees will not be deducted leave balances if a request spans a holiday).</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Create Form */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
          <h3 className="text-label-md font-extrabold text-slate-900 uppercase tracking-wider mb-4">Add Custom Holiday</h3>
          <form onSubmit={handleAddHoliday} className="space-y-4">
            <div>
              <label className="block text-body-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Holiday Name</label>
              <input
                type="text"
                placeholder="e.g. Diwali, Eid, Founder's Day"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-body-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Holiday Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none"
                required
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="isOptional"
                checked={isOptional}
                onChange={(e) => setIsOptional(e.target.checked)}
                className="h-4 w-4 rounded border-slate-350 text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="isOptional" className="text-body-sm font-semibold text-slate-700 cursor-pointer select-none">
                Optional / Restricted Holiday
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-label-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              {submitting ? 'Adding...' : 'Add Holiday'}
            </button>
          </form>
        </div>

        {/* Right Side: List Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-label-md font-extrabold text-slate-900 uppercase tracking-wider">Active Holidays List</h3>
            <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded-full uppercase">
              {holidays.length} Holidays
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-3.5 text-section-cap text-outline uppercase font-semibold">Holiday Date</th>
                  <th className="px-4 py-3.5 text-section-cap text-outline uppercase font-semibold">Holiday Name</th>
                  <th className="px-4 py-3.5 text-section-cap text-outline uppercase font-semibold">Type</th>
                  <th className="px-4 py-3.5 text-section-cap text-outline uppercase font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-body-sm">
                {holidays.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-body-sm text-outline">
                      No holidays added yet. Add a custom holiday or let the system auto-fetch national holidays.
                    </td>
                  </tr>
                ) : (
                  holidays.map((holiday) => {
                    const localDate = new Date(holiday.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                    return (
                      <tr key={holiday.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800">{localDate}</td>
                        <td className="px-4 py-3 text-slate-900 font-bold">{holiday.name}</td>
                        <td className="px-4 py-3">
                          {holiday.isOptional ? (
                            <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded text-[10px] font-bold">
                              Restricted
                            </span>
                          ) : (
                            <span className="bg-blue-50 text-blue-755 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold">
                              National / Mandatory
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center"
                            title="Delete Holiday"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
