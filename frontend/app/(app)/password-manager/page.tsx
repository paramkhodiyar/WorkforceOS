'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';
import LogoLoader from '../../../components/ui/LogoLoader';

export default function PasswordManagerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection & form states
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showNewEmployeePassword, setShowNewEmployeePassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetSuccessPassword, setResetSuccessPassword] = useState('');

  const systemRole = user?.systemRole;
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/unauthorized');
    }
  }, [isAdmin, loading, router]);

  async function loadDirectory() {
    try {
      const res = await api.employees.directory();
      setEmployees(res.data || []);
    } catch (err: any) {
      toast.error('Failed to load employee directory');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDirectory();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const term = searchQuery.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(term) ||
      emp.lastName.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      (emp.designation && emp.designation.toLowerCase().includes(term))
    );
  });

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmployee) return;
    if (!adminPassword || !newEmployeePassword) {
      toast.error('Both administrator and new employee passwords are required');
      return;
    }
    if (newEmployeePassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setSubmitting(true);
    try {
      await api.employees.resetPassword(selectedEmployee.id, {
        adminPassword,
        newPassword: newEmployeePassword
      });
      setResetSuccessPassword(newEmployeePassword);
      setAdminPassword('');
      setNewEmployeePassword('');
      toast.success(`Password for ${selectedEmployee.firstName} reset successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LogoLoader size={72} text="Loading Directory..." />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 font-sans pb-12">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-primary">vpn_key</span>
          Admin Password Manager
        </h1>
        <p className="text-body-sm text-outline">
          Securely manage organization passwords, rotate credentials, and override access locks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Employee List */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs outline-none transition-all font-medium shadow-inner"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => {
                const isSelected = selectedEmployee?.id === emp.id;
                return (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setResetSuccessPassword('');
                      setAdminPassword('');
                      setNewEmployeePassword('');
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-primary/5 border border-primary/20 shadow-sm'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">{emp.firstName} {emp.lastName}</p>
                      <p className="text-[10px] text-outline truncate font-medium">{emp.email}</p>
                      {emp.designation && (
                        <p className="text-[9px] text-primary font-bold mt-0.5 truncate uppercase tracking-wider">
                          {emp.designation}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    )}
                  </button>
                );
              })
            ) : (
              <p className="text-center text-xs text-outline py-8 font-medium">No employees found.</p>
            )}
          </div>
        </div>

        {/* Right Side: Reset Form Details */}
        <div className="lg:col-span-2">
          {selectedEmployee ? (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">
              {/* Selected User Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-extrabold text-label-lg">
                    {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-title-md font-bold text-on-surface">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </h2>
                    <p className="text-body-xs font-mono text-outline">{selectedEmployee.email}</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
                  <span className="text-[9px] text-outline uppercase font-semibold block">Employee ID</span>
                  <span className="text-xs font-bold text-on-surface font-mono">{selectedEmployee.employeeId || 'N/A'}</span>
                </div>
              </div>

              {resetSuccessPassword ? (
                /* Success Screen */
                <div className="space-y-6 animate-fade-in">
                  <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl">
                    <p className="text-label-md font-bold">Temporary Password Generated!</p>
                    <p className="text-xs mt-1 leading-relaxed">
                      Please copy the password below and share it securely. The employee will be forced to rotate it on their next login attempt.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                    <div>
                      <span className="text-[10px] text-outline font-bold uppercase block">New Password</span>
                      <div className="flex items-center justify-between mt-1 p-3 bg-white border border-slate-200 rounded-xl">
                        <span className="text-body-sm font-mono font-bold text-primary select-all">
                          {resetSuccessPassword}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(resetSuccessPassword);
                            toast.success('Password copied to clipboard');
                          }}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setResetSuccessPassword('')}
                      className="px-6 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl text-label-md font-bold transition-all cursor-pointer shadow-md"
                    >
                      Reset Another
                    </button>
                  </div>
                </div>
              ) : (
                /* Input Form */
                <form onSubmit={handleResetSubmit} className="space-y-4 max-w-md">
                  <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs leading-relaxed">
                    <p className="font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      Administrative Verification Needed
                    </p>
                    <p className="mt-1 text-slate-700">
                      To prevent unauthorized changes, please verify your administrator credentials. Triggering a password reset immediately revokes all current sessions and active login tokens for this staff member.
                    </p>
                  </div>

                  <div>
                    <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Your Admin Password</label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? "text" : "password"}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showAdminPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">New Employee Password</label>
                    <div className="relative">
                      <input
                        type={showNewEmployeePassword ? "text" : "password"}
                        required
                        value={newEmployeePassword}
                        onChange={(e) => setNewEmployeePassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewEmployeePassword(!showNewEmployeePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showNewEmployeePassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-[10px] text-outline font-semibold">Choose a strong, unique password</span>
                      <button
                        type="button"
                        onClick={() => {
                          const generated = `DM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
                          setNewEmployeePassword(generated);
                          setShowNewEmployeePassword(true);
                        }}
                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        Generate Secure Password
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEmployee(null);
                        setAdminPassword('');
                        setNewEmployeePassword('');
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-on-surface rounded-xl text-label-md font-bold transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl text-label-md font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      {submitting ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : null}
                      Confirm Password Reset
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center h-[350px] flex flex-col justify-center items-center">
              <span className="material-symbols-outlined text-[64px] text-slate-200 mb-3 animate-pulse">
                manage_accounts
              </span>
              <h3 className="text-title-md font-bold text-on-surface mb-1">No Employee Selected</h3>
              <p className="text-body-sm text-outline max-w-sm">
                Choose a staff member from the directory on the left to initiate a credential update.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
