'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../lib/auth/AuthProvider';
import { api } from '../../../../lib/api/client';
import { useToast } from '../../../../lib/toast/ToastProvider';
import Link from 'next/link';

type TabId = 'CUSTOMERS' | 'TRIALS' | 'INVOICES' | 'INQUIRIES' | 'MINT_KEY';

export default function PlatformAdminCmsPage() {
  const { user, switchRole } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('TRIALS');
  const [customers, setCustomers] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

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

  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, invRes, inqRes] = await Promise.allSettled([
        api.adminCms.listCustomers({ limit: 200 }),
        api.adminCms.listInvoices(),
        api.adminCms.listInquiries()
      ]);

      let allOrgs: any[] = [];
      if (custRes.status === 'fulfilled') {
        const res = custRes.value;
        allOrgs = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : Array.isArray(res.items) ? res.items : [];
      }

      const activePaid = allOrgs.filter((o: any) => o.subscriptionStatus !== 'TRIAL');
      const activeTrials = allOrgs.filter((o: any) => o.subscriptionStatus === 'TRIAL');

      setCustomers(activePaid);
      setTrials(activeTrials);

      if (invRes.status === 'fulfilled') {
        const res = invRes.value;
        setInvoices(Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);
      }

      if (inqRes.status === 'fulfilled') {
        const res = inqRes.value;
        setInquiries(Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);
      }

      if (!initialLoaded) {
        setInitialLoaded(true);
        if (activePaid.length === 0 && activeTrials.length > 0) {
          setActiveTab('TRIALS');
        } else if (activePaid.length > 0) {
          setActiveTab('CUSTOMERS');
        }
      }
    } catch (err: any) {
      console.error('Error loading CMS data:', err);
    } finally {
      setLoading(false);
    }
  }, [initialLoaded]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page to 1 when tab or search changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const activeRows = useMemo(() => {
    const rawRows = activeTab === 'CUSTOMERS' ? customers : activeTab === 'TRIALS' ? trials : [];
    if (!search.trim()) return rawRows;
    const q = search.toLowerCase().trim();
    return rawRows.filter((o: any) => 
      (o.name && o.name.toLowerCase().includes(q)) ||
      (o.slug && o.slug.toLowerCase().includes(q)) ||
      (o.licenseKey && o.licenseKey.toLowerCase().includes(q)) ||
      (o.adminContact?.email && o.adminContact.email.toLowerCase().includes(q)) ||
      (o.adminContact?.firstName && o.adminContact.firstName.toLowerCase().includes(q))
    );
  }, [activeTab, customers, trials, search]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return activeRows.slice(start, start + itemsPerPage);
  }, [activeRows, page, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(activeRows.length / itemsPerPage));

  async function handleToggleOrgStatus(orgId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.adminCms.updateStatus(orgId, nextStatus);
      toast.success(`License status updated to ${nextStatus}`);
      loadData();
      if (selectedOrg?.id === orgId) {
        setSelectedOrg({ ...selectedOrg, licenseStatus: nextStatus });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update organization status');
    }
  }

  async function handleMintKey(e: React.FormEvent) {
    e.preventDefault();
    if (!mintCompany.trim()) {
      toast.error('Please enter a company name');
      return;
    }
    setMinting(true);
    setGeneratedKeyResult(null);
    try {
      const res = await api.adminCms.mintKey({
        companyName: mintCompany.trim(),
        tier: mintTier,
        maxEmployees: parseInt(mintSeats, 10) || 50,
        validityDays: parseInt(mintValidity, 10) || 365,
        notes: mintNotes.trim()
      });
      const key = res.data?.key || res.key;
      setGeneratedKeyResult(key);
      toast.success('Custom License Key minted successfully!');
      setMintCompany('');
      setMintNotes('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mint key');
    } finally {
      setMinting(false);
    }
  }

  function handleCopyKey(keyStr: string) {
    navigator.clipboard.writeText(keyStr);
    toast.success('License key copied to clipboard!');
  }

  if (!isPlatformOwner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-md text-center space-y-4 shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-red-500">gavel</span>
          <h2 className="text-xl font-extrabold text-slate-900">Access Denied</h2>
          <p className="text-slate-600 text-sm">Platform Admin System Owner permissions are required.</p>
          <Link href="/dashboard" className="inline-block px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-slate-800 transition-all">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const TABS: { id: TabId; label: string; icon: string; count?: number }[] = [
    { id: 'CUSTOMERS', label: 'Customer Orgs', icon: 'corporate_fare', count: customers.length },
    { id: 'TRIALS', label: 'Trial Registrations', icon: 'science', count: trials.length },
    { id: 'INVOICES', label: 'Payment Invoices', icon: 'receipt_long', count: invoices.length },
    { id: 'INQUIRIES', label: 'Website Inquiries', icon: 'contact_mail', count: inquiries.length },
    { id: 'MINT_KEY', label: 'Mint License Key', icon: 'key' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 md:p-8 space-y-6">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white px-6 py-5 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-blue-600 mb-0.5">WorkforceOS Platform CMS</p>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Customer & License Command
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage tenant organizations, trial evaluation telemetry, invoices, and license keys.
          </p>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider hidden sm:block">Switch Persona:</span>
          <button
            onClick={() => switchRole('SYS_OWNER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              user.systemRole === 'SYS_OWNER' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            Owner
          </button>
          <button
            onClick={() => switchRole('ORG_ADMIN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              user.systemRole === 'ORG_ADMIN' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            Org Admin
          </button>
          <button
            onClick={() => switchRole('HR_MANAGER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              user.systemRole === 'HR' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            HR
          </button>
          <Link
            href="/dashboard"
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-extrabold hover:bg-slate-50 transition-all ml-1 cursor-pointer shadow-2xs"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 overflow-x-auto select-none pt-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`}>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Data Section: CUSTOMERS or TRIALS */}
      {(activeTab === 'CUSTOMERS' || activeTab === 'TRIALS') && (
        <div className="space-y-4">

          {/* Search Bar & Stats */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search company name, slug, email, or key..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-2xs"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-slate-500 self-end sm:self-center">
              Showing <span className="font-bold text-slate-900">{activeRows.length}</span> {activeTab === 'TRIALS' ? 'trial' : 'customer'} organizations
            </div>
          </div>

          {/* Clean Spaced Table */}
          <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider font-extrabold select-none">
                    <th className="py-3.5 px-5 min-w-[200px]">Organization</th>
                    <th className="py-3.5 px-5 min-w-[220px]">Admin Contact</th>
                    <th className="py-3.5 px-5 min-w-[220px]">License Key</th>
                    <th className="py-3.5 px-5 min-w-[130px]">Tier & Seats</th>
                    <th className="py-3.5 px-5 min-w-[100px]">Status</th>
                    <th className="py-3.5 px-5 min-w-[110px]">Registered</th>
                    <th className="py-3.5 px-5 min-w-[150px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-semibold text-slate-500">Loading organizations telemetry...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <span className="material-symbols-outlined text-[36px] text-slate-300 mb-1">domain_disabled</span>
                        <p className="text-xs font-semibold text-slate-600">
                          {search ? `No results found matching "${search}"` : activeTab === 'TRIALS' ? 'No trial registrations found' : 'No paid customer organizations found'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((org) => (
                      <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Organization Column */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5 max-w-[220px]">
                            <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-black text-xs shrink-0 uppercase">
                              {org.name.slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 truncate" title={org.name}>{org.name}</p>
                              <span className="text-[10px] text-slate-400 font-mono block truncate">/{org.slug}</span>
                            </div>
                          </div>
                        </td>

                        {/* Admin Contact Column */}
                        <td className="py-3.5 px-5">
                          {org.adminContact ? (
                            <div className="max-w-[220px]">
                              <p className="font-bold text-slate-800 truncate" title={`${org.adminContact.firstName} ${org.adminContact.lastName}`}>
                                {org.adminContact.firstName} {org.adminContact.lastName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono truncate" title={org.adminContact.email}>
                                {org.adminContact.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">No admin listed</span>
                          )}
                        </td>

                        {/* License Key Column - Fixed Non-Overlapping Monospace Pill */}
                        <td className="py-3.5 px-5">
                          {org.licenseKey ? (
                            <div className="inline-flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-xl whitespace-nowrap">
                              <span className="font-mono text-[11px] font-bold text-slate-800 tracking-tight">
                                {org.licenseKey}
                              </span>
                              <button
                                onClick={() => handleCopyKey(org.licenseKey)}
                                title="Copy Key"
                                className="text-slate-400 hover:text-slate-800 transition-colors cursor-pointer flex items-center"
                              >
                                <span className="material-symbols-outlined text-[13px]">content_copy</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-mono">None</span>
                          )}
                        </td>

                        {/* Tier & Seats */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="inline-block bg-slate-100 text-slate-700 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-slate-200 mb-1">
                            {org.subscriptionTier}
                          </span>
                          <p className="text-[11px] text-slate-500 font-semibold">{org.activeEmployeesCount} / {org.licenseMaxEmployees} seats</p>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            org.licenseStatus === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : org.subscriptionStatus === 'TRIAL'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {org.subscriptionStatus === 'TRIAL' ? 'Trial' : org.licenseStatus}
                          </span>
                        </td>

                        {/* Registered Date */}
                        <td className="py-3.5 px-5 text-slate-500 font-semibold whitespace-nowrap">
                          {org.createdAt ? new Date(org.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>

                        {/* Actions Flex Row - Never Squeezed */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
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
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {org.licenseStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            {activeRows.length > 0 && (
              <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/70 border-t border-slate-200/80 text-xs font-semibold text-slate-600 select-none">
                <div>
                  Showing <span className="font-bold text-slate-900">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-900">{Math.min(activeRows.length, page * itemsPerPage)}</span> of <span className="font-bold text-slate-900">{activeRows.length}</span> entries
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-slate-800 font-extrabold text-xs">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Payment Invoices */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Platform Payment Invoices & Manual Verification</h2>
          {invoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-[40px] text-slate-300 mb-1">receipt_long</span>
              <p className="text-xs font-semibold text-slate-600">No payment invoices pending verification.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {invoices.map((inv: any) => (
                <div key={inv.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{inv.organization?.name || 'Organization'}</p>
                    <p className="text-xs text-slate-500 font-mono">UTR: {inv.utrNumber || 'N/A'} · Amount: ₹{inv.amount}</p>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Mint License Key */}
      {activeTab === 'MINT_KEY' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm p-6 md:p-8 max-w-2xl space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Mint Personalized Custom License Key</h2>
            <p className="text-xs text-slate-500 font-medium">Generate enterprise license keys for custom offline activations or enterprise deals.</p>
          </div>

          <form onSubmit={handleMintKey} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Company Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Dunder Mifflin Paper Co."
                value={mintCompany}
                onChange={(e) => setMintCompany(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl text-xs font-semibold outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Subscription Tier</label>
                <select
                  value={mintTier}
                  onChange={(e) => setMintTier(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="STARTUP">Startup (15 Seats)</option>
                  <option value="GROWTH">Growth (50 Seats)</option>
                  <option value="ENTERPRISE">Enterprise (1000 Seats)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Max Seats</label>
                <input
                  type="number"
                  value={mintSeats}
                  onChange={(e) => setMintSeats(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Validity (Days)</label>
                <input
                  type="number"
                  value={mintValidity}
                  onChange={(e) => setMintValidity(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Notes / Reference</label>
              <input
                type="text"
                placeholder="Internal notes or invoice ref..."
                value={mintNotes}
                onChange={(e) => setMintNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={minting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {minting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>Mint License Key</span>
            </button>
            {generatedKeyResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Generated Enterprise Key</span>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono font-extrabold text-slate-900 text-sm select-all">{generatedKeyResult}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyKey(generatedKeyResult)}
                    className="px-3 py-1.5 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition-all cursor-pointer"
                  >
                    Copy Key
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Website Lead Inquiries Tab */}
      {activeTab === 'INQUIRIES' && (
        <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Website Lead Inquiries</h2>
              <p className="text-xs text-slate-500 font-medium">Inbound contact & sales demo inquiry submissions from the main website.</p>
            </div>
          </div>

          {inquiries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              No website lead inquiries submitted yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inquiries.map((inq: any) => (
                <div key={inq.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{inq.name}</h4>
                      <p className="text-xs text-blue-600 font-mono font-semibold">{inq.email}</p>
                      {inq.phone && <p className="text-[11px] text-slate-500 font-mono">{inq.phone}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                      inq.status === 'NEW'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : inq.status === 'CONTACTED'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : inq.status === 'CONVERTED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {inq.status}
                    </span>
                  </div>

                  {(inq.companyName || inq.employeeCount) && (
                    <div className="text-xs text-slate-600 font-medium pt-1 border-t border-slate-200/60 flex items-center justify-between">
                      <span>Company: <strong>{inq.companyName || 'N/A'}</strong></span>
                      <span>Employees: <strong>{inq.employeeCount || 'N/A'}</strong></span>
                    </div>
                  )}

                  {inq.message && (
                    <div className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-slate-200">
                      "{inq.message}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-400 font-mono">
                      {new Date(inq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <select
                      value={inq.status}
                      onChange={async (e) => {
                        try {
                          await api.adminCms.updateInquiryStatus(inq.id, e.target.value);
                          toast.success('Inquiry status updated!');
                          loadData();
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to update status');
                        }
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="NEW">Mark NEW</option>
                      <option value="CONTACTED">Mark CONTACTED</option>
                      <option value="CONVERTED">Mark CONVERTED</option>
                      <option value="CLOSED">Mark CLOSED</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Organization Details Modal Drawer */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{selectedOrg.name}</h3>
                <span className="text-xs text-slate-400 font-mono">ID: {selectedOrg.id}</span>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="p-1 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Subscription Tier</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedOrg.subscriptionTier}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Employees</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedOrg.activeEmployeesCount} / {selectedOrg.licenseMaxEmployees} seats</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Active License Key</span>
                  <span className="font-mono font-bold text-slate-800 text-xs select-all">{selectedOrg.licenseKey || 'None'}</span>
                </div>
              </div>

              {selectedOrg.adminContact && (
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Primary Organization Contact</span>
                  <p className="font-bold text-slate-800">{selectedOrg.adminContact.firstName} {selectedOrg.adminContact.lastName}</p>
                  <p className="font-mono text-slate-500">{selectedOrg.adminContact.email}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedOrg(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
