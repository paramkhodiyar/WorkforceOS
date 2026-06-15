'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';
import { FormSkeleton, TableSkeleton } from '../../../components/ui/Skeleton';

export default function AssetsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('LAPTOP');
  const [reason, setReason] = useState('');

  const [myAssetsSearch, setMyAssetsSearch] = useState('');
  const [myAssetsPage, setMyAssetsPage] = useState(1);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryPage, setInventoryPage] = useState(1);

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
      toast.success('Asset request submitted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit asset request');
    } finally {
      setSubmitting(false);
    }
  }

  const myAssets = assets.filter(ast => ast.assignedToId === user?.id);
  const inventory = assets;

  const filteredMyAssets = myAssets.filter(ast => 
    ast.name.toLowerCase().includes(myAssetsSearch.toLowerCase()) ||
    ast.category.toLowerCase().includes(myAssetsSearch.toLowerCase()) ||
    (ast.serialNumber || '').toLowerCase().includes(myAssetsSearch.toLowerCase())
  );
  const itemsPerPage = 5;
  const paginatedMyAssets = filteredMyAssets.slice((myAssetsPage - 1) * itemsPerPage, myAssetsPage * itemsPerPage);
  const totalMyAssetsPages = Math.ceil(filteredMyAssets.length / itemsPerPage);

  const filteredInventory = inventory.filter(ast => 
    ast.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    ast.category.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    (ast.serialNumber || '').toLowerCase().includes(inventorySearch.toLowerCase()) ||
    (ast.assignedTo ? `${ast.assignedTo.firstName} ${ast.assignedTo.lastName}` : '').toLowerCase().includes(inventorySearch.toLowerCase())
  );
  const paginatedInventory = filteredInventory.slice((inventoryPage - 1) * itemsPerPage, inventoryPage * itemsPerPage);
  const totalInventoryPages = Math.ceil(filteredInventory.length / itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Assets Inventory</h1>
          <p className="text-body-sm text-outline">Request corporate hardware and view assigned hardware list</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <FormSkeleton />
          </div>
          <div className="md:col-span-2 space-y-6">
            <TableSkeleton rows={3} cols={4} />
            <TableSkeleton rows={3} cols={4} />
          </div>
        </div>
      </div>
    );
  }

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
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">My Assigned Hardware</h2>
              <div className="relative w-48">
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={myAssetsSearch}
                  onChange={(e) => {
                    setMyAssetsSearch(e.target.value);
                    setMyAssetsPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-[11px] focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[14px]">search</span>
              </div>
            </div>

            {paginatedMyAssets.length === 0 ? (
              <p className="text-body-sm text-outline py-8 text-center">No assigned assets found.</p>
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
                    {paginatedMyAssets.map(ast => (
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

            {totalMyAssetsPages > 1 && (
              <div className="pt-4 border-t border-outline-variant flex items-center justify-between">
                <span className="text-[11px] text-outline">
                  Showing {(myAssetsPage - 1) * itemsPerPage + 1} to {Math.min(myAssetsPage * itemsPerPage, filteredMyAssets.length)} of {filteredMyAssets.length} assets
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={myAssetsPage === 1}
                    onClick={() => setMyAssetsPage(myAssetsPage - 1)}
                    className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                  >
                    Prev
                  </button>
                  <button
                    disabled={myAssetsPage === totalMyAssetsPages}
                    onClick={() => setMyAssetsPage(myAssetsPage + 1)}
                    className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {(isAdmin || isHR) && (
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Organization Inventory Logs</h2>
                <div className="relative w-48">
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={inventorySearch}
                    onChange={(e) => {
                      setInventorySearch(e.target.value);
                      setInventoryPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-[11px] focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[14px]">search</span>
                </div>
              </div>

              {paginatedInventory.length === 0 ? (
                <p className="text-body-sm text-outline py-8 text-center">No assets found in organization inventory.</p>
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
                      {paginatedInventory.map(ast => (
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

              {totalInventoryPages > 1 && (
                <div className="pt-4 border-t border-outline-variant flex items-center justify-between">
                  <span className="text-[11px] text-outline">
                    Showing {(inventoryPage - 1) * itemsPerPage + 1} to {Math.min(inventoryPage * itemsPerPage, filteredInventory.length)} of {filteredInventory.length} assets
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={inventoryPage === 1}
                      onClick={() => setInventoryPage(inventoryPage - 1)}
                      className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                    >
                      Prev
                    </button>
                    <button
                      disabled={inventoryPage === totalInventoryPages}
                      onClick={() => setInventoryPage(inventoryPage + 1)}
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
  );
}
