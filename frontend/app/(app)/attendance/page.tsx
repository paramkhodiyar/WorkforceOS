'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api/client';

export default function AttendancePage() {
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkType, setCheckType] = useState('WFO');
  const [location, setLocation] = useState('Office Headquarters');

  async function loadData() {
    try {
      const statusRes = await api.attendance.getCurrentStatus();
      setCurrentStatus(statusRes.data || null);
      const historyRes = await api.attendance.history();
      setHistory(historyRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCheckIn() {
    setChecking(true);
    try {
      await api.attendance.checkIn({
        type: checkType,
        location
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    } finally {
      setChecking(false);
    }
  }

  async function handleCheckOut() {
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
          
          {currentStatus && !currentStatus.checkOutTime ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-[10px] text-green-800 font-bold uppercase block">Current Shift Status</span>
                <p className="text-label-md font-bold text-green-900 mt-1">Checked In ({currentStatus.type})</p>
                <p className="text-[11px] text-green-700 mt-0.5">Since {new Date(currentStatus.checkInTime).toLocaleTimeString()}</p>
                {currentStatus.location && (
                  <p className="text-[11px] text-green-600 mt-1">Location: {currentStatus.location}</p>
                )}
              </div>
              <button
                onClick={handleCheckOut}
                disabled={checking}
                className="w-full py-3 bg-error hover:bg-red-700 text-on-error rounded-lg text-label-md font-bold transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
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
                  <option value="WFH">Work From Home (WFH)</option>
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
                className="w-full py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-label-md font-bold transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
              >
                {checking ? 'Processing...' : 'Check In Now'}
              </button>
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
          <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Shift Logs History</h2>
          
          {history.length === 0 ? (
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
                  {history.map(log => (
                    <tr key={log.id} className="hover:bg-surface-container-low transition-colors text-body-sm">
                      <td className="px-4 py-3 text-on-surface font-semibold">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant font-mono">
                        {new Date(log.checkInTime).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant font-mono">
                        {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.type === 'WFO' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant max-w-xs truncate">
                        {log.location || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
