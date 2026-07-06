'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { TableSkeleton } from '../../../components/ui/Skeleton';

export default function StatusesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  async function loadStatuses() {
    try {
      const res = await api.attendance.team();
      setData(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatuses();
  }, []);

  useEffect(() => {
    if (user) {
      const systemRole = user.systemRole;
      const userRoles = user.roles || [];
      const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
      const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
      const isLeaderOrHead = (user.departmentHead && user.departmentHead.length > 0) || (user.teamLead && user.teamLead.length > 0);
      const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
      const isActualManager = isManager || isLeaderOrHead;

      if (!isAdmin && !isHR && !isActualManager) {
        router.push('/unauthorized');
      }
    }
  }, [user, router]);

  const filtered = data.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const query = search.toLowerCase();
    const todayRecord = member.attendances?.[0];
    const locationStr = todayRecord?.ipAddress?.toLowerCase() || '';
    const modeStr = todayRecord?.workMode?.toLowerCase() || '';

    return (
      fullName.includes(query) ||
      member.email.toLowerCase().includes(query) ||
      locationStr.includes(query) ||
      modeStr.includes(query)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Employee Status Board</h1>
          <p className="text-body-sm text-outline">Monitor daily check-ins, shift modes, and activity locations</p>
        </div>
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Employee Status Board</h1>
        <p className="text-body-sm text-outline">Monitor daily check-ins, shift modes, and activity locations</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search by name, email, mode or location..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <>
          {/* Mobile View - Cards List */}
          <div className="block md:hidden p-4 space-y-4">
            {paginated.length === 0 ? (
              <div className="py-12 text-center text-body-sm text-outline">
                No employee status records match your query.
              </div>
            ) : (
              paginated.map(member => {
                const todayRecord = member.attendances?.[0];
                const isCheckedIn = todayRecord && !todayRecord.checkOut;
                const hasCheckedOut = todayRecord && todayRecord.checkOut;

                return (
                  <div key={member.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-50 text-primary border border-blue-100 flex items-center justify-center font-bold text-label-md">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </div>
                        <div>
                          <h4 className="text-label-sm font-bold text-slate-900">{member.firstName} {member.lastName}</h4>
                          <p className="text-[11px] text-outline font-medium">{member.email}</p>
                        </div>
                      </div>
                      {isCheckedIn ? (
                        <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          Checked In
                        </span>
                      ) : hasCheckedOut ? (
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          Completed
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          Offline
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100 font-semibold text-slate-700">
                      <div>
                        <span className="block text-slate-555 font-medium">In: <span className="font-mono text-slate-900">{todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString() : '-'}</span></span>
                        <span className="block text-slate-555 font-medium">Out: <span className="font-mono text-slate-900">{todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString() : '-'}</span></span>
                      </div>
                      <div className="text-right">
                        {todayRecord?.workMode && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border inline-block ${
                            todayRecord.workMode === 'WFO' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {todayRecord.workMode}
                          </span>
                        )}
                        <span className="block font-mono text-[10px] text-outline mt-1">IP: {todayRecord?.ipAddress || '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop View - Standard Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-section-cap text-outline uppercase font-semibold">Employee</th>
                  <th className="px-6 py-4 text-section-cap text-outline uppercase font-semibold">Shift Status</th>
                  <th className="px-6 py-4 text-section-cap text-outline uppercase font-semibold">Check In</th>
                  <th className="px-6 py-4 text-section-cap text-outline uppercase font-semibold">Check Out</th>
                  <th className="px-6 py-4 text-section-cap text-outline uppercase font-semibold">Mode</th>
                  <th className="px-6 py-4 text-section-cap text-outline uppercase font-semibold">Location / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-body-sm">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-body-sm text-outline">
                      No employee status records match your query.
                    </td>
                  </tr>
                ) : (
                  paginated.map(member => {
                    const todayRecord = member.attendances?.[0];
                    const isCheckedIn = todayRecord && !todayRecord.checkOut;
                    const hasCheckedOut = todayRecord && todayRecord.checkOut;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-blue-50 text-primary border border-blue-100 flex items-center justify-center font-bold text-label-md">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-label-md font-bold text-on-surface">{member.firstName} {member.lastName}</p>
                              <p className="text-[11px] text-outline font-medium">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isCheckedIn ? (
                            <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              Checked In
                            </span>
                          ) : hasCheckedOut ? (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              Completed
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              Offline
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant font-mono">
                          {todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant font-mono">
                          {todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {todayRecord?.workMode ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              todayRecord.workMode === 'WFO' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                            }`}>
                              {todayRecord.workMode}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant max-w-xs truncate">
                          {todayRecord?.ipAddress || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-body-sm text-outline">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} records
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
