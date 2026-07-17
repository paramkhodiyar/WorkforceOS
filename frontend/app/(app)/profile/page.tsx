'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { useToast } from '../../../lib/toast/ToastProvider';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';

function ProfileContent() {
  const { user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const profileId = searchParams.get('id');
  const tabParam = searchParams.get('tab');
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(tabParam || 'personal');
  const [attendanceStatus, setAttendanceStatus] = useState<'ACTIVE' | 'OFFLINE' | 'COMPLETED'>('OFFLINE');

  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Password Reset / Security states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotOldPassword, setForgotOldPassword] = useState(false);
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');

  // Personal Info edit states
  const [personalEmail, setPersonalEmail] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressPincode, setAddressPincode] = useState('');
  const [addressCountry, setAddressCountry] = useState('');

  // Bank Details edit states
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');

  // Emergency Contact edit states
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyAltPhone, setEmergencyAltPhone] = useState('');

  // Home Address states
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [homeSearchResults, setHomeSearchResults] = useState<any[]>([]);
  const [homeSearchLoading, setHomeSearchLoading] = useState(false);
  const [selectedHomeLocation, setSelectedHomeLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [homeRadius, setHomeRadius] = useState(200);
  const [homeAddressSubmitting, setHomeAddressSubmitting] = useState(false);
  const [showHomeChangeRequest, setShowHomeChangeRequest] = useState(false);
  const [homeChangeReason, setHomeChangeReason] = useState('');

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

      if (isOwnProfile) {
        try {
          const todayRes = await api.attendance.getCurrentStatus();
          const todayRecord = todayRes.data;
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
          setAttendanceStatus('OFFLINE');
        }
      } else if (isAdmin || isHR) {
        try {
          const teamRes = await api.attendance.team();
          const records = teamRes.data?.records || (Array.isArray(teamRes.data) ? teamRes.data : []);
          const member = records.find((m: any) => m.id === targetId);
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
          setAttendanceStatus('OFFLINE');
        }
      } else {
        setAttendanceStatus('OFFLINE');
      }

      try {
        const dirRes = await api.employees.directory();
        const adminUser = dirRes.data?.find((u: any) => u.systemRole === 'SUPER_ADMIN' || u.systemRole === 'ORG_ADMIN');
        if (adminUser) {
          setSuperAdminEmail(adminUser.email);
        } else {
          setSuperAdminEmail('admin@dunder-mifflin.com');
        }
      } catch (err) {
        console.error('Failed to load superadmin email:', err);
        setSuperAdminEmail('admin@dunder-mifflin.com');
      }
    } catch (err) {
      console.error(err);
      if (!isOwnProfile) {
        router.push('/unauthorized');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    setPasswordUpdating(true);
    try {
      await api.auth.changePassword({ oldPassword, newPassword });
      toast.success('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.message || 'Failed to update password';
      toast.error(msg);
    } finally {
      setPasswordUpdating(false);
    }
  }

  useEffect(() => {
    loadProfileData();
  }, [profileId, user]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftScroll(scrollLeft > 5);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll();
      window.addEventListener('resize', handleScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhone(profile.phone || '');
      setDesignation(profile.designation || '');

      setPersonalEmail(profile.personalEmail || '');
      setPersonalPhone(profile.personalPhone || '');
      setDateOfBirth(profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '');
      setGender(profile.gender || '');
      setBloodGroup(profile.bloodGroup || '');
      if (profile.address) {
        setAddressLine1(profile.address.line1 || '');
        setAddressLine2(profile.address.line2 || '');
        setAddressCity(profile.address.city || '');
        setAddressState(profile.address.state || '');
        setAddressPincode(profile.address.pincode || '');
        setAddressCountry(profile.address.country || '');
      } else {
        setAddressLine1('');
        setAddressLine2('');
        setAddressCity('');
        setAddressState('');
        setAddressPincode('');
        setAddressCountry('');
      }

      if (profile.bankDetail) {
        setBankName(profile.bankDetail.bankName || '');
        setAccountNumber(profile.bankDetail.accountNumber || '');
        setIfscCode(profile.bankDetail.ifscCode || '');
        setAccountHolderName(profile.bankDetail.accountHolderName || '');
        setPanNumber(profile.bankDetail.panNumber || '');
        setAadhaarLast4(profile.bankDetail.aadhaarLast4 || '');
      } else {
        setBankName('');
        setAccountNumber('');
        setIfscCode('');
        setAccountHolderName('');
        setPanNumber('');
        setAadhaarLast4('');
      }

      if (profile.emergencyContact) {
        setEmergencyName(profile.emergencyContact.name || '');
        setEmergencyRelation(profile.emergencyContact.relation || '');
        setEmergencyPhone(profile.emergencyContact.phone || '');
        setEmergencyAltPhone(profile.emergencyContact.altPhone || '');
      } else {
        setEmergencyName('');
        setEmergencyRelation('');
        setEmergencyPhone('');
        setEmergencyAltPhone('');
      }
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const address = addressLine1 || addressCity || addressState || addressPincode ? {
        line1: addressLine1,
        line2: addressLine2 || undefined,
        city: addressCity,
        state: addressState,
        pincode: addressPincode,
        country: addressCountry || undefined
      } : undefined;

      const bankDetail = bankName || accountNumber || ifscCode || accountHolderName || panNumber ? {
        bankName,
        accountNumber,
        ifscCode,
        accountHolderName,
        panNumber,
        aadhaarLast4: aadhaarLast4 || undefined
      } : undefined;

      const emergencyContact = emergencyName || emergencyRelation || emergencyPhone ? {
        name: emergencyName,
        relation: emergencyRelation,
        phone: emergencyPhone,
        altPhone: emergencyAltPhone || undefined
      } : undefined;

      if (isOwnProfile) {
        await api.employees.createProfileRequest({
          firstName,
          lastName,
          phone,
          personalEmail: personalEmail || undefined,
          personalPhone: personalPhone || undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender: gender || undefined,
          bloodGroup: bloodGroup || undefined,
          address,
          bankDetail,
          emergencyContact
        });
        toast.success('Your profile changes have been submitted to HR/Admin for approval.');
      } else {
        await api.employees.update(profile.id, {
          firstName,
          lastName,
          phone,
          designation,
          personalEmail: personalEmail || undefined,
          personalPhone: personalPhone || undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender: gender || undefined,
          bloodGroup: bloodGroup || undefined,
          address,
          bankDetail,
          emergencyContact
        });
        toast.success('Employee profile updated successfully.');
      }
      setEditing(false);
      loadProfileData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
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

  const basic = profile.basicSalary 
    ? profile.basicSalary 
    : profile.salaryBand === 'BAND_A' ? 80000
    : profile.salaryBand === 'BAND_B' ? 50000
    : profile.salaryBand === 'BAND_C' ? 35000
    : profile.salaryBand === 'BAND_D' ? 25000
    : 18000; // BAND_E

  const hra = Math.round(basic * 0.40);
  const allowances = profile.ctcAnnual 
    ? Math.max(0, Math.round((profile.ctcAnnual / 12) - basic - hra))
    : Math.round(basic * 0.20);
  const deductions = profile.pfApplicable ? Math.round(basic * 0.12) : 0;
  
  const annualCTC = profile.ctcAnnual ?? (basic + hra + allowances) * 12;
  let taxRate = 0;
  if (annualCTC > 1200000) taxRate = 0.15;
  else if (annualCTC > 800000) taxRate = 0.10;
  else if (annualCTC > 500000) taxRate = 0.05;
  const tax = Math.round((annualCTC * taxRate) / 12);

  const compDetails = {
    basic,
    hra,
    allowances,
    deductions,
    tax
  };
  const grossSalary = compDetails.basic + compDetails.hra + compDetails.allowances;
  const netSalary = grossSalary - compDetails.deductions - compDetails.tax;

  const tabs = [
    { id: 'personal', name: 'Personal Info' },
    { id: 'job', name: 'Job Details' },
    ...(canViewCompensation ? [{ id: 'compensation', name: 'Compensation' }] : []),
    { id: 'leave', name: 'Leave Balances' },
    ...(isOwnProfile ? [{ id: 'security', name: 'Security' }] : []),
    ...(isOwnProfile ? [{ id: 'home-address', name: 'Home Address' }] : [])
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">
          {isOwnProfile ? 'My Profile' : 'Employee Profile'}
        </h1>
        <p className="text-body-sm text-outline">
          {isOwnProfile
            ? 'View and manage your personal details and information'
            : 'Manage personal details, compensation structure, and balance sheets'}
        </p>
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
          <div className="relative flex items-center border-b border-slate-100 bg-slate-50/50">
            {/* Left Scroll Gradient Shadow & Chevron */}
            {showLeftScroll && (
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-100 to-transparent pointer-events-none md:hidden z-10 flex items-center justify-start pl-1 text-slate-400">
                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
              </div>
            )}

            {/* Scrollable Tabs Wrapper */}
            <div 
              ref={scrollRef}
              className="flex px-4 overflow-x-auto whitespace-nowrap scrollbar-none flex-grow"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setEditing(false);
                  }}
                  className={`px-4 py-3.5 text-label-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-outline hover:text-on-surface'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Right Scroll Gradient Shadow & Chevron */}
            {showRightScroll && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-100 to-transparent pointer-events-none md:hidden z-10 flex items-center justify-end pr-1 text-slate-400">
                <span className="material-symbols-outlined text-[14px] animate-pulse">chevron_right</span>
              </div>
            )}
          </div>

          <div className="p-6">
            {activeTab === 'personal' && (
              <div>
                {editing ? (
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">First Name</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Last Name</label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Work Phone Number</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Personal Email</label>
                        <input
                          type="email"
                          value={personalEmail}
                          onChange={(e) => setPersonalEmail(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Personal Phone</label>
                        <input
                          type="text"
                          value={personalPhone}
                          onChange={(e) => setPersonalPhone(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <CustomDatePicker
                          label="Date of Birth"
                          value={dateOfBirth}
                          onChange={(val) => setDateOfBirth(val)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium animate-none"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Blood Group</label>
                        <input
                          type="text"
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h4 className="text-label-sm font-bold text-slate-800 uppercase tracking-wider">Address</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Line 1</label>
                          <input
                            type="text"
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Line 2</label>
                          <input
                            type="text"
                            value={addressLine2}
                            onChange={(e) => setAddressLine2(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">City</label>
                          <input
                            type="text"
                            value={addressCity}
                            onChange={(e) => setAddressCity(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">State</label>
                          <input
                            type="text"
                            value={addressState}
                            onChange={(e) => setAddressState(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Pincode</label>
                          <input
                            type="text"
                            value={addressPincode}
                            onChange={(e) => setAddressPincode(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Country</label>
                          <input
                            type="text"
                            value={addressCountry}
                            onChange={(e) => setAddressCountry(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-label-sm font-bold text-slate-800 uppercase tracking-wider">Bank Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Account Holder Name</label>
                          <input
                            type="text"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Bank Name</label>
                          <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">IFSC Code</label>
                          <input
                            type="text"
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Account Number</label>
                          <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">PAN Number</label>
                          <input
                            type="text"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Aadhaar Last 4</label>
                          <input
                            type="text"
                            maxLength={4}
                            value={aadhaarLast4}
                            onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-label-sm font-bold text-slate-800 uppercase tracking-wider">Emergency Contact</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Contact Name</label>
                          <input
                            type="text"
                            value={emergencyName}
                            onChange={(e) => setEmergencyName(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Relation</label>
                          <input
                            type="text"
                            value={emergencyRelation}
                            onChange={(e) => setEmergencyRelation(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Phone Number</label>
                          <input
                            type="text"
                            value={emergencyPhone}
                            onChange={(e) => setEmergencyPhone(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Alternative Phone Number</label>
                          <input
                            type="text"
                            value={emergencyAltPhone}
                            onChange={(e) => setEmergencyAltPhone(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {canEdit && !isOwnProfile && (
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Designation</label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
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
                      <div className="flex justify-between py-3 text-body-sm">
                        <span className="text-outline">Personal Email</span>
                        <span className="font-semibold text-on-surface font-mono">{profile.personalEmail || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-3 text-body-sm">
                        <span className="text-outline">Personal Phone</span>
                        <span className="font-semibold text-on-surface">{profile.personalPhone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-3 text-body-sm">
                        <span className="text-outline">Date of Birth</span>
                        <span className="font-semibold text-on-surface font-mono">
                          {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 text-body-sm">
                        <span className="text-outline">Gender</span>
                        <span className="font-semibold text-on-surface">{profile.gender || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-3 text-body-sm">
                        <span className="text-outline">Blood Group</span>
                        <span className="font-semibold text-on-surface font-mono">{profile.bloodGroup || 'N/A'}</span>
                      </div>
                      {profile.address && (
                        <div className="flex justify-between py-3 text-body-sm">
                          <span className="text-outline text-left">Address</span>
                          <span className="font-semibold text-on-surface text-right whitespace-pre-line max-w-[250px]">
                            {profile.address.line1}
                            {profile.address.line2 ? `, ${profile.address.line2}` : ''}
                            {`\n${profile.address.city}, ${profile.address.state} - ${profile.address.pincode}`}
                            {profile.address.country ? `\n${profile.address.country}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bank Details section */}
                    {profile.bankDetail && (
                      <div className="pt-6 mt-6 border-t border-slate-100">
                        <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-3">Bank Details</h3>
                        <div className="divide-y divide-slate-100">
                          <div className="flex justify-between py-3 text-body-sm">
                            <span className="text-outline">Account Holder Name</span>
                            <span className="font-semibold text-on-surface">{profile.bankDetail.accountHolderName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-3 text-body-sm">
                            <span className="text-outline">Bank Name</span>
                            <span className="font-semibold text-on-surface">{profile.bankDetail.bankName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-3 text-body-sm">
                            <span className="text-outline">IFSC Code</span>
                            <span className="font-semibold text-on-surface font-mono">{profile.bankDetail.ifscCode || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-3 text-body-sm">
                            <span className="text-outline">Account Number</span>
                            <span className="font-semibold text-on-surface font-mono">{profile.bankDetail.accountNumber || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-3 text-body-sm">
                            <span className="text-outline">PAN Number</span>
                            <span className="font-semibold text-on-surface font-mono">{profile.bankDetail.panNumber || 'N/A'}</span>
                          </div>
                          {profile.bankDetail.aadhaarLast4 && (
                            <div className="flex justify-between py-3 text-body-sm">
                              <span className="text-outline">Aadhaar Last 4 Digits</span>
                              <span className="font-semibold text-on-surface font-mono">**** **** {profile.bankDetail.aadhaarLast4}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Emergency Contact section */}
                    {profile.emergencyContact && (
                      <div className="pt-6 mt-6 border-t border-slate-100">
                        <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-3">Emergency Contact</h3>
                        <div className="divide-y divide-slate-100">
                          <div className="flex justify-between py-3 text-body-sm">
                            <span className="text-outline">Contact Name</span>
                            <span className="font-semibold text-on-surface">{profile.emergencyContact.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-3 text-body-sm">
                            <span className="text-outline">Relation</span>
                            <span className="font-semibold text-on-surface">{profile.emergencyContact.relation || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-3 text-body-sm">
                            <span className="text-outline">Phone Number</span>
                            <span className="font-semibold text-on-surface font-mono">{profile.emergencyContact.phone || 'N/A'}</span>
                          </div>
                          {profile.emergencyContact.altPhone && (
                            <div className="flex justify-between py-3 text-body-sm">
                              <span className="text-outline">Alternative Phone</span>
                              <span className="font-semibold text-on-surface font-mono">{profile.emergencyContact.altPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                      <p className="text-title-md font-bold text-on-surface mt-0.5">
                        {profile.salaryBand === 'BAND_A' ? 'Band A (VP / C-Suite)'
                         : profile.salaryBand === 'BAND_B' ? 'Band B (Director / Head)'
                         : profile.salaryBand === 'BAND_C' ? 'Band C (Lead / Manager)'
                         : profile.salaryBand === 'BAND_D' ? 'Band D (Associate / Staff)'
                         : 'Band E (Intern / Junior)'}
                      </p>
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

            {activeTab === 'security' && isOwnProfile && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-2">Change Password</h3>
                  <p className="text-body-sm text-outline mb-4">Choose a strong password to protect your account and data privacy.</p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Current Password</label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium font-mono"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showOldPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium font-mono"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showNewPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium font-mono"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showConfirmPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setForgotOldPassword(!forgotOldPassword)}
                      className="text-xs font-semibold text-primary hover:underline self-start cursor-pointer"
                    >
                      Forgot your current password?
                    </button>

                    <button
                      type="submit"
                      disabled={passwordUpdating}
                      className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-label-md font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      {passwordUpdating ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : null}
                      Update Password
                    </button>
                  </div>
                </form>

                {forgotOldPassword && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl max-w-md animate-fade-in">
                    <p className="text-label-md font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">info</span>
                      Reset Current Password
                    </p>
                    <p className="text-xs mt-1.5 leading-relaxed text-slate-600">
                      To reset your lost password, please request your System Administrator. You can email them directly at:
                    </p>
                    <a
                      href={`mailto:${superAdminEmail}?subject=Password Reset Request&body=Hi Administrator,%0D%0A%0D%0AI have forgotten my password for WorkforceOS. Could you please reset it for me?%0D%0A%0D%0AMy Employee ID is: ${profile.employeeId}.`}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                    >
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      {superAdminEmail}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ── Home Address Tab ──────────────────────────────────────────────── */}
            {activeTab === 'home-address' && isOwnProfile && (() => {
              const isLocked = user?.homeAddressLocked || profile?.homeAddressLocked;
              const hasHome = (user?.homeLatitude !== null && user?.homeLatitude !== undefined) || (profile?.homeLatitude !== null && profile?.homeLatitude !== undefined);
              const homeLat = user?.homeLatitude ?? profile?.homeLatitude;
              const homeLng = user?.homeLongitude ?? profile?.homeLongitude;
              const homeRadiusVal = user?.homeRadius ?? profile?.homeRadius ?? 200;
              const homeLabel = (user?.address as any)?.homeLabel || (profile?.address as any)?.homeLabel || '';

              const searchHome = async (q: string) => {
                if (!q || q.length < 3) { setHomeSearchResults([]); return; }
                setHomeSearchLoading(true);
                try {
                  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
                  const json = await res.json();
                  setHomeSearchResults(json || []);
                } catch { setHomeSearchResults([]); }
                finally { setHomeSearchLoading(false); }
              };

              const handleSetHome = async () => {
                if (!selectedHomeLocation) return;
                setHomeAddressSubmitting(true);
                try {
                  await api.employees.setHomeAddress({
                    lat: selectedHomeLocation.lat,
                    lng: selectedHomeLocation.lng,
                    radius: homeRadius,
                    addressLabel: selectedHomeLocation.label
                  });
                  toast.success('Home address set and locked successfully!');
                  window.location.reload();
                } catch (e: any) {
                  toast.error(e?.response?.data?.message || 'Failed to set home address');
                } finally { setHomeAddressSubmitting(false); }
              };

              const handleChangeRequest = async () => {
                if (!selectedHomeLocation || !homeChangeReason.trim()) return;
                setHomeAddressSubmitting(true);
                try {
                  await api.employees.createProfileRequest({
                    homeLatitude: selectedHomeLocation.lat,
                    homeLongitude: selectedHomeLocation.lng,
                    homeRadius,
                    address: { homeLabel: selectedHomeLocation.label },
                    changeReason: homeChangeReason
                  });
                  toast.success('Home address change request submitted for HR approval!');
                  setShowHomeChangeRequest(false);
                  setHomeChangeReason('');
                  setSelectedHomeLocation(null);
                } catch (e: any) {
                  toast.error(e?.response?.data?.message || 'Failed to submit change request');
                } finally { setHomeAddressSubmitting(false); }
              };

              return (
                <div className="space-y-6">
                  {!hasHome && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-4">
                      <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">warning</span>
                      <div>
                        <p className="text-body-xs font-bold">Home Address Required</p>
                        <p className="text-body-xs font-medium mt-0.5">Your home address is mandatory for WFH attendance validation. Please set it below. Once set, it will be locked and can only be changed with HR/Admin approval.</p>
                      </div>
                    </div>
                  )}

                  {hasHome && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-body-sm font-bold text-slate-800">Current Home Address</p>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                          <span className="material-symbols-outlined text-[12px]">lock</span> Locked
                        </span>
                      </div>
                      <p className="text-body-xs text-slate-600 font-medium">{homeLabel || `${homeLat?.toFixed(5)}, ${homeLng?.toFixed(5)}`}</p>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-[16px]">radar</span>
                        <p className="text-body-xs text-slate-500">Radius: <strong>{homeRadiusVal}m</strong></p>
                      </div>
                      <a
                        href={`https://maps.google.com/?q=${homeLat},${homeLng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 hover:text-blue-900"
                      >
                        <span className="material-symbols-outlined text-[14px]">map</span> View on Google Maps
                      </a>
                      {!showHomeChangeRequest && (
                        <button
                          onClick={() => setShowHomeChangeRequest(true)}
                          className="w-full mt-2 py-2 border border-slate-300 rounded-xl text-body-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                        >
                          Request Address Change
                        </button>
                      )}
                    </div>
                  )}

                  {/* Address Search */}
                  {(!isLocked || showHomeChangeRequest) && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                      <p className="text-body-sm font-bold text-slate-800">
                        {showHomeChangeRequest ? 'New Home Address (Change Request)' : 'Set Home Address'}
                      </p>

                      <div className="relative">
                        <input
                          type="text"
                          value={homeSearchQuery}
                          onChange={e => { setHomeSearchQuery(e.target.value); searchHome(e.target.value); }}
                          placeholder="Search your home address..."
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-body-xs bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all"
                        />
                        {homeSearchLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        {homeSearchResults.length > 0 && (
                          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                            {homeSearchResults.map((r: any, i: number) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setSelectedHomeLocation({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_name });
                                  setHomeSearchQuery(r.display_name);
                                  setHomeSearchResults([]);
                                }}
                                className="w-full text-left px-4 py-3 text-body-xs text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                              >
                                {r.display_name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedHomeLocation && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                          <p className="text-[11px] font-bold text-green-800">Selected Location</p>
                          <p className="text-[11px] text-green-700 mt-0.5">{selectedHomeLocation.label}</p>
                          <p className="text-[10px] text-green-600 mt-0.5">{selectedHomeLocation.lat.toFixed(5)}, {selectedHomeLocation.lng.toFixed(5)}</p>
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Geofencing Radius</label>
                        <div className="relative">
                          <select
                            value={homeRadius}
                            onChange={e => setHomeRadius(parseInt(e.target.value))}
                            className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-xl text-body-xs bg-slate-50 focus:bg-white focus:border-primary outline-none cursor-pointer"
                          >
                            <option value={50}>50 meters (Very Precise)</option>
                            <option value={100}>100 meters</option>
                            <option value={200}>200 meters (Recommended)</option>
                            <option value={500}>500 meters</option>
                            <option value={1000}>1 kilometer</option>
                          </select>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[16px] pointer-events-none">expand_more</span>
                        </div>
                      </div>

                      {showHomeChangeRequest && (
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Reason for Change <span className="text-red-500">*</span></label>
                          <textarea
                            value={homeChangeReason}
                            onChange={e => setHomeChangeReason(e.target.value)}
                            rows={3}
                            placeholder="Explain why you need to update your home address (e.g., relocation, moved to new home)..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-body-xs bg-slate-50 focus:bg-white focus:border-primary outline-none resize-none transition-all"
                          />
                        </div>
                      )}

                      <div className="flex gap-3">
                        {showHomeChangeRequest && (
                          <button
                            onClick={() => { setShowHomeChangeRequest(false); setSelectedHomeLocation(null); setHomeSearchQuery(''); }}
                            className="flex-1 py-2.5 border border-slate-300 rounded-xl text-body-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={showHomeChangeRequest ? handleChangeRequest : handleSetHome}
                          disabled={!selectedHomeLocation || homeAddressSubmitting || (showHomeChangeRequest && !homeChangeReason.trim())}
                          className="flex-1 py-2.5 bg-primary hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-body-xs font-bold transition-all"
                        >
                          {homeAddressSubmitting ? 'Submitting...' : showHomeChangeRequest ? 'Submit Change Request' : 'Set & Lock Home Address'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
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
