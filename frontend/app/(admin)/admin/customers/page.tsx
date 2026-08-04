'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../lib/auth/AuthProvider';
import { api } from '../../../../lib/api/client';
import { useToast } from '../../../../lib/toast/ToastProvider';
import Link from 'next/link';

type TabId = 'CUSTOMERS' | 'TRIALS' | 'INVOICES' | 'MINT_KEY';

export default function PlatformAdminCmsPage() {
  const { user, switchRole } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('CUSTOMERS');
  const [customers, setCustomers] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Mint Key Form State
  const [mintCompany, setMintCompany] = useState('');
  const [mintTier, setMintTier] = useState('GROWTH');
  const [mintSeats, setMintSeats] = useState('50');
  const [mintValidity, setMintValidity] = useState('365');
  const [mintNotes, setMintNotes] = useState('');
  const [minting, setMinting] = useState(false);
  const [generatedKeyResult, setGeneratedKeyResult] = useState<string | null>(null);

  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);

  const isPlatformOwner = user?.systemRole === 'SYS_OWNER' || user?.originalRole === 'SYS_OWNER' || user?.systemRole === 'SUPER_ADMIN';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'CUSTOMERS') {
        const res = await api.adminCms.listCustomers({ search });
        const all = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : Array.isArray(res.items) ? res.items : [];
        setCustomers(all.filter((o: any) => o.subscriptionStatus !== 'TRIAL'));
      } else if (activeTab === 'TRIALS') {
        const res = await api.adminCms.listCustomers({ search });
        const all = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : Array.isArray(res.items) ? res.items : [];
        setTrials(all.filter((o: any) => o.subscriptionStatus === 'TRIAL'));
      } else if (activeTab === 'INVOICES') {
        const res = await api.adminCms.listInvoices();
        setInvoices(Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load CMS data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggleOrgStatus(orgId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.adminCms.updateStatus(orgId, nextStatus);
      toast.success(`License marked as ${nextStatus}`);
      loadData();
      if (selectedOrg?.id === orgId) {
        setSelectedOrg({ ...selectedOrg, licenseStatus: nextStatus });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  }

  async function handleVerifyInvoice(invoiceId: string, isApproved: boolean) {
    try {
      await api.adminCms.verifyInvoice(invoiceId, isApproved);
      toast.success(isApproved ? 'Invoice approved & license activated!' : 'Invoice rejected');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify invoice');
    }
  }

  async function handleMintKeySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mintCompany.trim()) { toast.error('Company Name is required'); return; }
    setMinting(true);
    setGeneratedKeyResult(null);
    try {
      const res = await api.adminCms.mintKey({
        companyName: mintCompany.trim(),
        tier: mintTier,
        maxEmployees: parseInt(mintSeats, 10),
        validityDays: parseInt(mintValidity, 10),
        notes: mintNotes.trim()
      });
      setGeneratedKeyResult(res.data.key);
      toast.success('License Key minted successfully!');
      setMintCompany('');
      setMintNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to mint key');
    } finally {
      setMinting(false);
    }
  }

  if (!isPlatformOwner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-md text-center space-y-4">
          <span className="material-symbols-outlined text-[48px] text-red-500">gavel</span>
          <h2 className="text-xl font-extrabold text-slate-900">Access Denied</h2>
          <p className="text-slate-600 text-sm">Platform Admin System Owner permissions are required.</p>
          <Link href="/dashboard" className="inline-block px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'CUSTOMERS', label: 'Customer Orgs', icon: 'corporate_fare' },
    { id: 'TRIALS', label: 'Trial Registrations', icon: 'science' },
    { id: 'INVOICES', label: 'Payment Invoices', icon: 'receipt_long' },
    { id: 'MINT_KEY', label: 'Mint License Key', icon: 'key' },
  ];

  const OrgTable = ({ rows, emptyMsg }: { rows: any[]; emptyMsg: string }) => (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <th className="py-4 px-6">Organization</th>
              <th className="py-4 px-6">Admin Contact</th>
              <th className="py-4 px-6">License Key</th>
              <th className="py-4 px-6">Tier & Seats</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Registered</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm">{emptyMsg}</td></tr>
            ) : (
              rows.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900">{org.name}</p>
                    <span className="text-xs text-slate-400 font-mono">/{org.slug}</span>
                  </td>
                  <td className="py-4 px-6">
                    {org.adminContact ? (
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{org.adminContact.firstName} {org.adminContact.lastName}</p>
                        <p className="text-xs text-slate-400 font-mono">{org.adminContact.email}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">No admin listed</span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs">
                    {org.licenseKey ? (
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800 font-bold">
                        {org.licenseKey}
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-block bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200 mb-1">
                      {org.subscriptionTier}
                    </span>
                    <p className="text-xs text-slate-500 font-medium">{org.activeEmployeesCount} / {org.licenseMaxEmployees} seats</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      org.licenseStatus === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : org.subscriptionStatus === 'TRIAL'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {org.subscriptionStatus === 'TRIAL' ? 'Trial' : org.licenseStatus}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                    {org.createdAt ? new Date(org.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => setSelectedOrg(org)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleToggleOrgStatus(org.id, org.licenseStatus)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        org.licenseStatus === 'ACTIVE'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {org.licenseStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-10 space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white px-7 py-6 rounded-3xl border border-slate-200">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1">WorkforceOS Platform</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Customer & License Command
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage organizations, trial registrations, invoices, and license keys.
          </p>
        </div>

        {/* Persona Role Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider hidden sm:block">Switch:</span>
          <button
            onClick={() => switchRole('SYS_OWNER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              user.systemRole === 'SYS_OWNER' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Owner
          </button>
          <button
            onClick={() => switchRole('ORG_ADMIN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              user.systemRole === 'ORG_ADMIN' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            Org Admin
          </button>
          <button
            onClick={() => switchRole('HR_MANAGER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              user.systemRole === 'HR' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            HR
          </button>
          <Link
            href="/dashboard"
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all ml-1 cursor-pointer"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search bar (for data tabs) */}
      {(activeTab === 'CUSTOMERS' || activeTab === 'TRIALS') && (
        <div>
          <input
            type="text"
            placeholder="Search by company name, slug, or license key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-96 p-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:border-slate-500 outline-none"
          />
        </div>
      )}

      {/* TAB: CUSTOMERS */}
      {activeTab === 'CUSTOMERS' && (
        <OrgTable rows={customers} emptyMsg="No paid customer organizations found." />
      )}

      {/* TAB: TRIAL REGISTRATIONS */}
      {activeTab === 'TRIALS' && (
        <OrgTable rows={trials} emptyMsg="No trial registrations yet. When someone registers a trial from the homepage, they'll appear here." />
      )}

      {/* TAB: INVOICES */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">Invoice #</th>
                  <th className="py-4 px-6">Organization</th>
                  <th className="py-4 px-6">Tier</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">12-Digit UTR</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm">Loading invoices...</td></tr>
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm">No payment invoices submitted yet.</td></tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-xs">{inv.invoiceNumber}</td>
                      <td className="py-4 px-6 font-bold">{inv.organization?.name || inv.organizationId}</td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border border-slate-200">
                          {inv.tier}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-slate-900">₹{inv.amount.toLocaleString()}</td>
                      <td className="py-4 px-6 font-mono text-xs font-bold">{inv.utr}</td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          inv.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {inv.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleVerifyInvoice(inv.id, true)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyInvoice(inv.id, false)}
                              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MINT KEY */}
      {activeTab === 'MINT_KEY' && (
        <div className="max-w-2xl bg-white border border-slate-200 p-8 rounded-3xl space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Mint Personalized License Key</h2>
            <p className="text-slate-500 text-xs mt-1">
              Generates a signed key formatted as <span className="font-mono font-bold text-slate-700">WFOS-[COMP]-[TIER]-[HASH]</span>.
            </p>
          </div>

          <form onSubmit={handleMintKeySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Target Company Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corporation"
                value={mintCompany}
                onChange={(e) => setMintCompany(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-slate-500 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tier</label>
                <select
                  value={mintTier}
                  onChange={(e) => setMintTier(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold"
                >
                  <option value="STARTUP">Startup (15 seats)</option>
                  <option value="GROWTH">Growth (50 seats)</option>
                  <option value="ENTERPRISE">Enterprise (1000 seats)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Seat Limit</label>
                <input
                  type="number"
                  value={mintSeats}
                  onChange={(e) => setMintSeats(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Validity (Days)</label>
                <input
                  type="number"
                  value={mintValidity}
                  onChange={(e) => setMintValidity(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Internal Notes</label>
              <textarea
                placeholder="e.g. Issued for Acme Corp annual enterprise contract"
                value={mintNotes}
                onChange={(e) => setMintNotes(e.target.value)}
                rows={2}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={minting}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {minting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Minting Key...
                </>
              ) : 'Mint License Key'}
            </button>
          </form>

          {generatedKeyResult && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Key Generated</p>
              <p className="text-xl font-mono font-black text-slate-900 select-all break-all">{generatedKeyResult}</p>
              <p className="text-xs text-slate-500">Copy & share this key with the client administrator.</p>
            </div>
          )}
        </div>
      )}

      {/* ORG DETAIL DRAWER */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full p-8 space-y-6 overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedOrg.name}</h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">/{selectedOrg.slug}</p>
                <span className={`inline-block mt-2 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  selectedOrg.subscriptionStatus === 'TRIAL'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : selectedOrg.licenseStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {selectedOrg.subscriptionStatus === 'TRIAL' ? 'Trial' : selectedOrg.licenseStatus}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">License Key</p>
                <p className="font-mono text-sm font-bold text-slate-900 break-all">{selectedOrg.licenseKey || 'None assigned'}</p>
                <div className="flex items-center gap-3 pt-1 text-xs font-medium text-slate-500">
                  <span>Status: <strong>{selectedOrg.licenseStatus}</strong></span>
                  <span>·</span>
                  <span>Seats: <strong>{selectedOrg.licenseMaxEmployees}</strong></span>
                  <span>·</span>
                  <span>Tier: <strong>{selectedOrg.subscriptionTier}</strong></span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Admin Contact</h4>
                {selectedOrg.adminContact ? (
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
                    <p className="font-bold text-slate-900">{selectedOrg.adminContact.firstName} {selectedOrg.adminContact.lastName}</p>
                    <p className="text-xs text-slate-500 font-mono">{selectedOrg.adminContact.email}</p>
                    <p className="text-xs text-slate-500 font-mono">{selectedOrg.adminContact.phone || 'No phone on file'}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No admin contact details</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Seat Usage</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-slate-700 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (selectedOrg.activeEmployeesCount / (selectedOrg.licenseMaxEmployees || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 shrink-0">
                    {selectedOrg.activeEmployeesCount} / {selectedOrg.licenseMaxEmployees}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => handleToggleOrgStatus(selectedOrg.id, selectedOrg.licenseStatus)}
                  className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    selectedOrg.licenseStatus === 'ACTIVE'
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {selectedOrg.licenseStatus === 'ACTIVE' ? 'Deactivate License' : 'Activate License'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
