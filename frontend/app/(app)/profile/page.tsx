'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthProvider';

function ProfileContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const profileId = searchParams.get('id');
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'job' | 'compensation' | 'leave'>('personal');
  const [attendanceStatus, setAttendanceStatus] = useState<'ACTIVE' | 'OFFLINE' | 'COMPLETED'>('OFFLINE');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
  const isOwnProfile = !profileId || profileId === user?.id;
  const canEdit = isOwnProfile || isAdmin || isHR;
  const canViewCompensation = isOwnProfile || isAdmin || isHR;

  async function loadProfileData() {
    try {
      const targetId = profileId || user?.id;
      if (!targetId) return;

      const res = await api.employees.get(targetId);
      setProfile(res.data);

      try {
        const teamRes = await api.attendance.team();
        const member = teamRes.data?.find((m: any) => m.id === targetId);
        const todayRecord = member?.attendances?.[0];
        if (todayRecord) {
          if (!todayRecord.checkOut) {
            setAttendanceStatus('ACTIVE');
          } else {
            setAttendanceStatus('COMPLETED');
          }
        } else {
          setAttendanceStatus('OFFLINE');
        }
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfileData();
  }, [profileId, user]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhone(profile.phone || '');
      setDesignation(profile.designation || '');
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.employees.update(profile.id, {
        firstName,
        lastName,
        phone,
        designation: canEdit && !isOwnProfile ? designation : undefined
      });
      setEditing(false);
      loadProfileData();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm text-center">
        <p className="text-body-sm text-outline">Employee profile not found.</p>
      </div>
    );
  }

  const bandDetails: Record<string, any> = {
    BAND_A: { basic: 45000, hra: 20000, allowances: 10000, deductions: 5000, tax: 4000 },
    BAND_B: { basic: 30000, hra: 12000, allowances: 8000, deductions: 3500, tax: 2000 },
    BAND_C: { basic: 20000, hra: 10000, allowances: 5000, deductions: 2500, tax: 1000 }
  };
  const compDetails = bandDetails[profile.salaryBand] || bandDetails.BAND_B;
  const grossSalary = compDetails.basic + compDetails.hra + compDetails.allowances;
  const netSalary = grossSalary - compDetails.deductions - compDetails.tax;

  const tabs = [
    { id: 'personal', name: 'Personal Info' },
    { id: 'job', name: 'Job Details' },
    ...(canViewCompensation ? [{ id: 'compensation', name: 'Compensation' }] : []),
    { id: 'leave', name: 'Leave Balances' }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Employee Profile</h1>
        <p className="text-body-sm text-outline">Manage personal details, compensation structure, and balance sheets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[32px] shadow-sm mb-4">
            {profile.firstName?.[0]}{profile.lastName?.[0]}
          </div>

          <h2 className="text-title-lg font-bold text-on-surface">{profile.firstName} {profile.lastName}</h2>
          <p className="text-body-sm text-outline font-medium">{profile.designation || 'Staff Member'}</p>
          <p className="text-[11px] text-outline mt-0.5">{profile.department?.name || 'Operations'}</p>
          {profile.departmentHead && profile.departmentHead.length > 0 && (
            <div className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Department Head: {profile.departmentHead.map((d: any) => d.name).join(', ')}
            </div>
          )}
          {profile.teamLead && profile.teamLead.length > 0 && (
            <div className="mt-2 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Team Lead: {profile.teamLead.map((t: any) => t.name).join(', ')}
            </div>
          )}

          <div className="w-full border-t border-slate-100 my-4"></div>

          <div className="flex flex-col gap-2.5 items-center w-full">
            {attendanceStatus === 'ACTIVE' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                Checked In
              </div>
            )}
            {attendanceStatus === 'COMPLETED' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                Completed
              </div>
            )}
            {attendanceStatus === 'OFFLINE' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                Offline
              </div>
            )}

            <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
              profile.status === 'ACTIVE'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              Account: {profile.status}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50/50 px-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setEditing(false);
                }}
                className={`px-4 py-3.5 text-label-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-outline hover:text-on-surface'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'personal' && (
              <div>
                {editing ? (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">First Name</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Last Name</label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {canEdit && !isOwnProfile && (
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Designation</label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-on-surface rounded-lg text-label-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-label-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Contact Details</h3>
                      {canEdit && (
                        <button
                          onClick={() => setEditing(true)}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-label-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
                        >
                          Edit Info
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-slate-100">
                      <div className="flex justify-between py-3 text-body-sm">
                        <span className="text-outline">Full Name</span>
                        <span className="font-semibold text-on-surface">{profile.firstName} {profile.lastName}</span>
                      </div>
                      <div className="flex justify-between py-3 text-body-sm">
                        <span className="text-outline">Email Address</span>
                        <span className="font-semibold text-on-surface font-mono">{profile.email}</span>
                      </div>
                      <div className="flex justify-between py-3 text-body-sm">
                        <span className="text-outline">Phone Number</span>
                        <span className="font-semibold text-on-surface">{profile.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'job' && (
              <div className="space-y-4">
                <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-2">Employment Information</h3>
                <div className="divide-y divide-slate-100">
                  <div className="flex justify-between py-3 text-body-sm">
                    <span className="text-outline">Employee ID</span>
                    <span className="font-semibold text-on-surface">{profile.employeeId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-3 text-body-sm">
                    <span className="text-outline">Designation</span>
                    <span className="font-semibold text-on-surface">{profile.designation || 'Staff Member'}</span>
                  </div>
                  <div className="flex justify-between py-3 text-body-sm">
                    <span className="text-outline">Department</span>
                    <span className="font-semibold text-on-surface">{profile.department?.name || 'Operations'}</span>
                  </div>
                  <div className="flex justify-between py-3 text-body-sm">
                    <span className="text-outline">System Role</span>
                    <span className="font-semibold text-on-surface text-xs">{profile.systemRole}</span>
                  </div>
                  <div className="flex justify-between py-3 text-body-sm">
                    <span className="text-outline">Reporting Manager</span>
                    <span className="font-semibold text-on-surface">
                      {profile.manager ? `${profile.manager.firstName} ${profile.manager.lastName}` : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 text-body-sm">
                    <span className="text-outline">Join Date</span>
                    <span className="font-semibold text-on-surface font-mono">
                      {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'compensation' && canViewCompensation && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Compensation & Salary Structure</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-outline uppercase font-semibold">Salary Grade Band</p>
                      <p className="text-title-md font-bold text-on-surface mt-0.5">{profile.salaryBand || 'BAND_A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-outline uppercase font-semibold">Estimated Net Take Home</p>
                      <p className="text-title-lg font-bold text-primary mt-0.5 font-mono">₹{netSalary.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="flex justify-between py-2.5 text-body-sm">
                    <span className="text-outline font-medium">Basic Salary</span>
                    <span className="font-semibold text-on-surface font-mono">₹{compDetails.basic.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-body-sm">
                    <span className="text-outline font-medium">HRA (House Rent Allowance)</span>
                    <span className="font-semibold text-on-surface font-mono">₹{compDetails.hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-body-sm">
                    <span className="text-outline font-medium">Special Allowances</span>
                    <span className="font-semibold text-on-surface font-mono">₹{compDetails.allowances.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-body-sm">
                    <span className="text-outline font-medium text-error">Standard Deductions (PF/Insurance)</span>
                    <span className="font-semibold text-error font-mono">-₹{compDetails.deductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-body-sm">
                    <span className="text-outline font-medium text-error">Estimated Income Tax</span>
                    <span className="font-semibold text-error font-mono">-₹{compDetails.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-3 text-label-md font-bold pt-4">
                    <span className="text-on-surface">Total Gross Salary</span>
                    <span className="text-on-surface font-mono">₹{grossSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leave' && (
              <div className="space-y-4">
                <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-2">Leave Balances</h3>
                {!profile.leaveBalances || profile.leaveBalances.length === 0 ? (
                  <p className="text-body-sm text-outline py-6 text-center">No leave balance records available.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.leaveBalances.map((balance: any) => {
                      const totalAllocated = balance.allocated || 1;
                      const ratio = Math.min((balance.used / totalAllocated) * 100, 100);
                      return (
                        <div key={balance.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-label-md font-bold text-on-surface uppercase tracking-wider text-[11px]">
                                {balance.leaveType}
                              </span>
                              <span className="text-body-xs font-semibold text-outline">
                                {balance.remaining} remaining
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
                              <div
                                className="bg-primary h-full rounded-full transition-all"
                                style={{ width: `${ratio}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-between text-[11px] text-outline font-semibold">
                            <span>Used: {balance.used}</span>
                            <span>Pending: {balance.pending}</span>
                            <span>Total: {balance.allocated}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
