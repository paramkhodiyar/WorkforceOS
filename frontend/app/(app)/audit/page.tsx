'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api/client';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-headline-md font-bold text-on-surface">System Audit Trail</h1>
        <p className="text-body-sm text-outline">Inspect real-time operations, logs, and state changes</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
        {logs.length === 0 ? (
          <p className="text-body-sm text-outline py-8 text-center">No system audit records logged.</p>
        ) : (
          <div className="overflow-x-auto">
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
                {logs.map(log => (
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
        )}
      </div>
    </div>
  );
}
