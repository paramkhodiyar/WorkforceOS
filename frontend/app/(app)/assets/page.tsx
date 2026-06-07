'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('LAPTOP');
  const [reason, setReason] = useState('');

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  async function loadData() {
    try {
      const res = await api.assets.list();
      setAssets(res.data || []);
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
      await api.assets.request({
        name,
        category,
        reason
      });
      setName('');
      setReason('');
      await loadData();
      alert('Asset request submitted successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to submit asset request');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const myAssets = assets.filter(ast => ast.assignedToId === user.id);
  const inventory = assets;

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Assets Inventory</h1>
        <p className="text-body-sm text-outline">Request corporate hardware and view assigned hardware list</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm h-fit">
          <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Request Hardware</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Device Name</label>
              <input
                type="text"
                placeholder="e.g. MacBook Pro M3"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                <option value="LAPTOP">Laptop Computer</option>
                <option value="MONITOR">External Monitor</option>
                <option value="PHONE">Mobile Phone</option>
                <option value="ACCESSORY">Peripherals & Accessories</option>
              </select>
            </div>

            <div>
              <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Business Justification</label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-label-md font-bold transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Request Checkout'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
            <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">My Assigned Hardware</h2>
            {myAssets.length === 0 ? (
              <p className="text-body-sm text-outline py-8 text-center">No assigned assets under your name.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Asset Name</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Category</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Serial Number</th>
                      <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant text-body-sm">
                    {myAssets.map(ast => (
                      <tr key={ast.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-3 font-semibold text-on-surface">{ast.name}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{ast.category}</td>
                        <td className="px-4 py-3 text-on-surface-variant font-mono">{ast.serialNumber || 'Pending Allocation'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            ast.status === 'ASSIGNED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          }`}>
                            {ast.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(isAdmin || isHR) && (
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Organization Inventory Logs</h2>
              {inventory.length === 0 ? (
                <p className="text-body-sm text-outline py-8 text-center">Empty inventory ledger.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50">
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Asset</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Assignee</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Serial</th>
                        <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-body-sm">
                      {inventory.map(ast => (
                        <tr key={ast.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-on-surface">{ast.name}</p>
                            <p className="text-[10px] text-outline">{ast.category}</p>
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant">
                            {ast.assignedTo ? `${ast.assignedTo.firstName} ${ast.assignedTo.lastName}` : 'Unassigned'}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant font-mono">{ast.serialNumber || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              ast.status === 'ASSIGNED'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                            }`}>
                              {ast.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
