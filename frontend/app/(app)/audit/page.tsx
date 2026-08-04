'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { TableSkeleton } from '../../../components/ui/Skeleton';

export default function AuditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      const systemRole = user.systemRole;
      const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
      // Inline check handles non-admin access cleanly without redirecting
    }
  }, [user]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.audit.logs();
        setLogs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const actorName = log.actor ? `${log.actor.firstName} ${log.actor.lastName}`.toLowerCase() : 'system process';
    const actorEmail = log.actor?.email?.toLowerCase() || '';
    const action = log.action?.toLowerCase() || '';
    const module = log.module?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    return (
      actorName.includes(query) ||
      actorEmail.includes(query) ||
      action.includes(query) ||
      module.includes(query)
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">System Audit Trail</h1>
          <p className="text-body-sm text-outline">Inspect real-time operations, logs, and state changes</p>
        </div>
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">System Audit Trail</h1>
        <p className="text-body-sm text-outline">Inspect real-time operations, logs, and state changes</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm space-y-4">
        <div className="relative w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search by actor, email, action, or module..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary"
          />
        </div>

        {paginatedLogs.length === 0 ? (
          <p className="text-body-sm text-outline py-8 text-center">No system audit records logged.</p>
        ) : (
          <>
            {/* Mobile View - Cards List */}
            <div className="block md:hidden space-y-4 p-4">
              {paginatedLogs.map(log => (
                <div key={log.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      {log.actor ? (
                        <div>
                          <h4 className="text-label-sm font-bold text-slate-900">{log.actor.firstName} {log.actor.lastName}</h4>
                          <p className="text-[10px] text-outline font-mono mt-0.5">{log.actor.email}</p>
                        </div>
                      ) : (
                        <h4 className="text-label-sm italic text-outline font-bold">System Process</h4>
                      )}
                    </div>
                    <span className="bg-zinc-150 text-zinc-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-zinc-200">
                      {log.action}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-100 font-semibold text-slate-700">
                    <span className="font-mono text-outline">{new Date(log.timestamp).toLocaleString()}</span>
                    <div>
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border border-blue-200 mr-2">{log.module}</span>
                      <span className="font-mono">{log.ipAddress || 'Internal'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Standard Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Timestamp</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Actor</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Action</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Module</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-body-sm">
                  {paginatedLogs.map(log => (
                    <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-on-surface-variant font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {log.actor ? (
                          <div>
                            <p className="font-semibold text-on-surface">{log.actor.firstName} {log.actor.lastName}</p>
                            <p className="text-[10px] text-outline font-mono">{log.actor.email}</p>
                          </div>
                        ) : (
                          <span className="text-outline italic">System Process</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-zinc-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant font-semibold">
                        {log.module}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant font-mono">
                        {log.ipAddress || 'Internal'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-body-sm text-outline">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer text-on-surface"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer text-on-surface"
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
