'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { ThreeDotMenu } from '../../../components/ui/ThreeDotMenu';
import { TableSkeleton } from '../../../components/ui/Skeleton';

export default function SettingsPage() {
  const { user, features, setFeatures, refetchUser } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'departments' | 'teams' | 'features' | 'location' | 'profile-requests' | 'license'>('departments');
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [featureToggling, setFeatureToggling] = useState(false);

  // License State
  const [licenseData, setLicenseData] = useState<any>(null);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [activatingLicense, setActivatingLicense] = useState(false);

  const [officeLat, setOfficeLat] = useState<string>('');
  const [officeLng, setOfficeLng] = useState<string>('');
  const [officeRadius, setOfficeRadius] = useState<string>('');
  const [savingLocation, setSavingLocation] = useState(false);

  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

  const [profileRequests, setProfileRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState<{ id?: string; name: string; headId: string | null; employeeIds: string[] }>({
    name: '',
    headId: null,
    employeeIds: [],
  });
  const [deptMemberSearch, setDeptMemberSearch] = useState('');

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamForm, setTeamForm] = useState<{ id?: string; name: string; departmentId: string; leadId: string | null; memberIds: string[] }>({
    name: '',
    departmentId: '',
    leadId: null,
    memberIds: [],
  });
  const [memberSearch, setMemberSearch] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'department' | 'team'; id: string; name: string } | null>(null);
  
  const [deptSearch, setDeptSearch] = useState('');
  const [deptPage, setDeptPage] = useState(1);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamPage, setTeamPage] = useState(1);

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
  const hasPendingRequests = profileRequests.some((r: any) => r.status === 'PENDING');

  useEffect(() => {
    if (isAdmin || isHR) {
      loadData();
    }
  }, [isAdmin, isHR]);

  async function loadData() {
    try {
      setLoading(true);
      const [deptRes, teamRes, empRes, orgRes, reqRes] = await Promise.all([
        api.departments.list(),
        api.teams.list(),
        api.employees.list({ limit: 1000 }),
        api.organization.get(),
        api.employees.listProfileRequests().catch(() => ({ data: [] })),
      ]);

      setDepartments(deptRes.data || []);
      setTeams(teamRes.data || []);
      setEmployees(empRes.data || []);
      setProfileRequests(reqRes.data || []);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile-requests-updated'));
      }
      if (orgRes?.data) {
        setOfficeLat(orgRes.data.officeLatitude !== null ? String(orgRes.data.officeLatitude) : '');
        setOfficeLng(orgRes.data.officeLongitude !== null ? String(orgRes.data.officeLongitude) : '');
        setOfficeRadius(orgRes.data.officeRadius !== null ? String(orgRes.data.officeRadius) : '');
      }
      setErrorMessage('');
      loadLicense();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load configuration data.');
    } finally {
      setLoading(false);
    }
  }

  async function loadLicense() {
    try {
      const res = await api.organization.getLicense();
      setLicenseData(res.data);
    } catch (err: any) {
      console.error("Failed to load license details:", err);
    }
  }

  async function handleActivateLicense(e: React.FormEvent) {
    e.preventDefault();
    if (!licenseKeyInput.trim()) {
      toast.error('Please enter a valid License Key.');
      return;
    }
    setActivatingLicense(true);
    try {
      await api.organization.activateLicense({ key: licenseKeyInput.trim() });
      toast.success('License Key activated successfully!');
      setLicenseKeyInput('');
      await loadLicense();
      await refetchUser();
    } catch (err: any) {
      toast.error(err.message || 'License activation failed.');
    } finally {
      setActivatingLicense(false);
    }
  }

  async function handleReviewRequest(id: string, action: 'approve' | 'reject') {
    try {
      setSubmitting(true);
      if (action === 'approve') {
        await api.employees.approveProfileRequest(id);
        toast.success('Profile changes approved and applied.');
      } else {
        await api.employees.rejectProfileRequest(id, rejectComment);
        toast.success('Profile request declined.');
      }
      const reqRes = await api.employees.listProfileRequests().catch(() => ({ data: [] }));
      setProfileRequests(reqRes.data || []);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile-requests-updated'));
      }
      const empRes = await api.employees.list({ limit: 1000 });
      setEmployees(empRes.data || []);
      setIsRequestModalOpen(false);
      setRejectComment('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to process request.');
    } finally {
      setSubmitting(false);
    }
  }

  const renderComparisonRows = (req: any) => {
    const currentEmp = employees.find(e => e.id === req.userId) || {};
    const requested = req.requestedData || {};
    const rows: React.ReactNode[] = [];

    const addRow = (label: string, curVal: any, reqVal: any) => {
      const displayCur = typeof curVal === 'object' ? JSON.stringify(curVal) : String(curVal || '-');
      const displayReq = typeof reqVal === 'object' ? JSON.stringify(reqVal) : String(reqVal || '-');
      const isDifferent = displayCur !== displayReq;

      if (!isDifferent && reqVal === undefined) return;

      rows.push(
        <tr key={label} className="border-b border-slate-100 font-medium">
          <td className="px-3 py-2.5 font-bold text-slate-500">{label}</td>
          <td className="px-3 py-2.5 text-slate-700">{displayCur}</td>
          <td className="px-3 py-2.5 bg-blue-50/20 text-primary font-semibold">{displayReq}</td>
        </tr>
      );
    };

    const simpleFields = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'personalEmail', label: 'Personal Email' },
      { key: 'personalPhone', label: 'Personal Phone' },
      { key: 'gender', label: 'Gender' },
      { key: 'bloodGroup', label: 'Blood Group' },
    ];

    simpleFields.forEach(f => {
      if (requested[f.key] !== undefined) {
        addRow(f.label, currentEmp[f.key], requested[f.key]);
      }
    });

    if (requested.dateOfBirth) {
      const curDob = currentEmp.dateOfBirth ? new Date(currentEmp.dateOfBirth).toLocaleDateString() : '-';
      const reqDob = new Date(requested.dateOfBirth).toLocaleDateString();
      addRow('Date of Birth', curDob, reqDob);
    }

    if (requested.address) {
      const curAddr = currentEmp.address ? `${currentEmp.address.line1 || ''}, ${currentEmp.address.city || ''}, ${currentEmp.address.state || ''}` : '-';
      const reqAddr = `${requested.address.line1 || ''}, ${requested.address.city || ''}, ${requested.address.state || ''}`;
      addRow('Address', curAddr, reqAddr);
    }

    if (requested.bankDetail) {
      const curBank = currentEmp.bankDetail ? `${currentEmp.bankDetail.bankName || ''} (${currentEmp.bankDetail.accountNumber || ''})` : '-';
      const reqBank = `${requested.bankDetail.bankName || ''} (${requested.bankDetail.accountNumber || ''})`;
      addRow('Bank Details', curBank, reqBank);
    }

    if (requested.emergencyContact) {
      const curEmer = currentEmp.emergencyContact ? `${currentEmp.emergencyContact.name || ''} (${currentEmp.emergencyContact.relation || ''}) - ${currentEmp.emergencyContact.phone || ''}` : '-';
      const reqEmer = `${requested.emergencyContact.name || ''} (${requested.emergencyContact.relation || ''}) - ${requested.emergencyContact.phone || ''}`;
      addRow('Emergency Contact', curEmer, reqEmer);
    }

    if (requested.homeLatitude !== undefined) {
      addRow('Home Latitude', currentEmp.homeLatitude, requested.homeLatitude);
    }
    if (requested.homeLongitude !== undefined) {
      addRow('Home Longitude', currentEmp.homeLongitude, requested.homeLongitude);
    }
    if (requested.homeRadius !== undefined) {
      addRow('Home Geofence Radius', currentEmp.homeRadius ? `${currentEmp.homeRadius}m` : '-', `${requested.homeRadius}m`);
    }
    if (requested.address?.homeLabel !== undefined) {
      addRow('Home Address Label', currentEmp.address?.homeLabel || '-', requested.address?.homeLabel);
    }

    return rows;
  };

  async function handleToggleFeature(featureName: string) {
    if (!user?.organizationId) return;
    const nextFeatures = features.includes(featureName)
      ? features.filter((f: string) => f !== featureName)
      : [...features, featureName];
    
    try {
      setFeatureToggling(true);
      await api.organization.updateFeatures(user.organizationId, nextFeatures);
      setFeatures(nextFeatures);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle feature.');
    } finally {
      setFeatureToggling(false);
    }
  }

  async function handleSaveLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId) return;

    try {
      setSavingLocation(true);
      setErrorMessage('');

      const lat = officeLat.trim() ? parseFloat(officeLat) : null;
      const lng = officeLng.trim() ? parseFloat(officeLng) : null;
      const rad = officeRadius.trim() ? parseFloat(officeRadius) : null;

      if ((lat !== null && isNaN(lat)) || (lng !== null && isNaN(lng)) || (rad !== null && isNaN(rad))) {
        throw new Error('Please enter valid numeric values for latitude, longitude, and radius.');
      }

      await api.organization.updateLocation(user.organizationId, {
        officeLatitude: lat,
        officeLongitude: lng,
        officeRadius: rad,
      });

      // Refresh data
      const orgRes = await api.organization.get();
      if (orgRes?.data) {
        setOfficeLat(orgRes.data.officeLatitude !== null ? String(orgRes.data.officeLatitude) : '');
        setOfficeLng(orgRes.data.officeLongitude !== null ? String(orgRes.data.officeLongitude) : '');
        setOfficeRadius(orgRes.data.officeRadius !== null ? String(orgRes.data.officeRadius) : '');
      }

      toast.success('Office location & geofencing settings saved successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save location settings.');
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleAddressSearch(query: string) {
    setAddressQuery(query);
    if (query.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setAddressSuggestions(data || []);
    } catch (err) {
      console.error('Address search error:', err);
    }
  }

  if (!isAdmin && !isHR) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] font-sans p-6 text-center">
        <div className="max-w-md space-y-4">
          <span className="material-symbols-outlined text-[64px] text-error">gavel</span>
          <h1 className="text-headline-md font-bold text-on-surface">Access Denied</h1>
          <p className="text-body-sm text-outline">
            Your active roles or scopes do not permit access to Settings. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  async function handleSaveDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!deptForm.name.trim()) return;

    try {
      setSubmitting(true);
      if (deptForm.id) {
        await api.departments.update(deptForm.id, {
          name: deptForm.name,
          headId: deptForm.headId || null,
          employeeIds: deptForm.employeeIds,
        });
      } else {
        await api.departments.create({
          name: deptForm.name,
          headId: deptForm.headId || null,
          employeeIds: deptForm.employeeIds,
        });
      }
      setIsDeptModalOpen(false);
      setDeptForm({ name: '', headId: null, employeeIds: [] });
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save department.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamForm.name.trim() || !teamForm.departmentId) return;

    try {
      setSubmitting(true);
      if (teamForm.id) {
        await api.teams.update(teamForm.id, {
          name: teamForm.name,
          departmentId: teamForm.departmentId,
          leadId: teamForm.leadId || null,
          memberIds: teamForm.memberIds,
        });
      } else {
        await api.teams.create({
          name: teamForm.name,
          departmentId: teamForm.departmentId,
          leadId: teamForm.leadId || null,
          memberIds: teamForm.memberIds,
        });
      }
      setIsTeamModalOpen(false);
      setTeamForm({ name: '', departmentId: '', leadId: null, memberIds: [] });
      setMemberSearch('');
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save team.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    try {
      setSubmitting(true);
      if (deleteTarget.type === 'department') {
        await api.departments.delete(deleteTarget.id);
      } else {
        await api.teams.delete(deleteTarget.id);
      }
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to delete ${deleteTarget.type}.`);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) || 
    (d.head ? `${d.head.firstName} ${d.head.lastName}` : '').toLowerCase().includes(deptSearch.toLowerCase())
  );
  
  const itemsPerPage = 8;
  const totalPagesDepts = Math.ceil(filteredDepts.length / itemsPerPage);
  const paginatedDepts = filteredDepts.slice((deptPage - 1) * itemsPerPage, deptPage * itemsPerPage);

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(teamSearch.toLowerCase()) || 
    (t.department?.name || '').toLowerCase().includes(teamSearch.toLowerCase()) ||
    (t.lead ? `${t.lead.firstName} ${t.lead.lastName}` : '').toLowerCase().includes(teamSearch.toLowerCase())
  );
  const totalPagesTeams = Math.ceil(filteredTeams.length / itemsPerPage);
  const paginatedTeams = filteredTeams.slice((teamPage - 1) * itemsPerPage, teamPage * itemsPerPage);

  const employeeOptions = [
    { value: '', label: 'None / Unassigned' },
    ...employees.map((emp) => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName} (${emp.designation || 'Employee'})`,
    })),
  ];

  const departmentOptions = departments.map((dept) => ({
    value: dept.id,
    label: dept.name,
  }));

  return (
    <div className="flex-1 font-sans py-4 md:py-6 px-0 md:px-4 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-headline-md font-extrabold text-on-surface">Organization Settings</h1>
          <p className="text-body-sm text-outline">Manage organization departments, teams, and administrative roles.</p>
        </div>
        <div>
          {activeTab === 'departments' && (
            <button
              onClick={() => {
                setDeptForm({ name: '', headId: null, employeeIds: [] });
                setIsDeptModalOpen(true);
              }}
              className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              Add Department
            </button>
          )}
          {activeTab === 'teams' && (
            <button
              onClick={() => {
                setTeamForm({ name: '', departmentId: departments[0]?.id || '', leadId: null, memberIds: [] });
                setMemberSearch('');
                setIsTeamModalOpen(true);
              }}
              className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-sm font-bold shadow-sm transition-all cursor-pointer"
              disabled={departments.length === 0}
            >
              Add Team
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-error-container text-error rounded-xl text-body-sm font-medium border border-error/20 flex items-start justify-between gap-4">
          <span className="flex-1 min-w-0 break-words">{errorMessage}</span>
          <button 
            onClick={() => setErrorMessage('')} 
            className="text-error hover:opacity-80 font-bold cursor-pointer shrink-0 transition-opacity"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex overflow-x-auto whitespace-nowrap gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-max scrollbar-none">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex-1 sm:flex-none px-4 py-2.5 text-center text-label-sm font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'departments'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 sm:flex-none px-4 py-2.5 text-center text-label-sm font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'teams' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Teams
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`flex-1 sm:flex-none px-4 py-2.5 text-center text-label-sm font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'features' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          App Management
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('location')}
            className={`flex-1 sm:flex-none px-4 py-2.5 text-center text-label-sm font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'location' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Office Location
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => {
              setActiveTab('license');
              loadLicense();
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 text-center text-label-sm font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'license' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            License & Subscription
          </button>
        )}
        {(isAdmin || isHR) && (
          <button
            onClick={() => setActiveTab('profile-requests')}
            className={`flex-1 sm:flex-none px-4 py-2.5 text-center text-label-sm font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'profile-requests' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Profile Requests</span>
            {hasPendingRequests && (
              <span className="h-2 w-2 rounded-full bg-red-500 block"></span>
            )}
          </button>
        )}
        {(isAdmin || isHR) && (
          <Link
            href="/settings/holidays"
            className="flex-1 sm:flex-none px-4 py-2.5 text-center text-label-sm font-bold rounded-lg transition-all hover:bg-slate-550 hover:bg-slate-50 cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 text-slate-600"
          >
            <span>Holiday Settings</span>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : (
        <>
          {activeTab === 'departments' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Departments</h2>
                <div className="relative w-48">
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={deptSearch}
                    onChange={(e) => {
                      setDeptSearch(e.target.value);
                      setDeptPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-[11px] focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[14px]">search</span>
                </div>
              </div>

              <>
                {/* Mobile View - Cards List */}
                <div className="block md:hidden space-y-4">
                  {paginatedDepts.length > 0 ? (
                    paginatedDepts.map((dept) => (
                      <div key={dept.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-label-sm font-bold text-slate-900">{dept.name}</h4>
                            <p className="text-[11px] text-outline mt-0.5 font-medium">
                              Head: <span className="font-semibold text-slate-700">{dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : 'Unassigned'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100 font-semibold text-slate-700">
                          <div>
                            <span className="block text-slate-550 font-medium">Teams: <span className="text-slate-900">{dept._count?.teams || 0}</span></span>
                            <span className="block text-slate-550 font-medium">Employees: <span className="text-slate-900">{dept._count?.employees || 0}</span></span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await api.departments.get(dept.id);
                                  const fullDept = res.data;
                                  setDeptForm({
                                    id: fullDept.id,
                                    name: fullDept.name,
                                    headId: fullDept.headId,
                                    employeeIds: fullDept.employees?.map((m: any) => m.id) || [],
                                  });
                                  setDeptMemberSearch('');
                                  setIsDeptModalOpen(true);
                                } catch (err: any) {
                                  setErrorMessage(err.message || 'Failed to load department details');
                                }
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[9px] rounded uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'department', id: dept.id, name: dept.name })}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[9px] rounded uppercase transition-all flex items-center justify-center gap-1 border border-red-150 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400 font-medium">
                      No departments found.
                    </div>
                  )}
                </div>

                {/* Desktop View - Standard Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Department Name</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Department Head</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700 text-center">Teams Count</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700 text-center">Employees Count</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-body-sm font-medium text-slate-800">
                      {paginatedDepts.length > 0 ? (
                        paginatedDepts.map((dept) => (
                          <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-slate-900 font-bold">{dept.name}</td>
                            <td className="px-6 py-4 text-slate-600">
                              {dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : 'Unassigned'}
                            </td>
                            <td className="px-6 py-4 text-center text-slate-600">{dept._count?.teams || 0}</td>
                            <td className="px-6 py-4 text-center text-slate-600">{dept._count?.employees || 0}</td>
                            <td className="px-6 py-4 text-right">
                              <ThreeDotMenu
                                actions={[
                                  {
                                    label: 'Edit',
                                    icon: 'edit',
                                    onClick: async () => {
                                      try {
                                        const res = await api.departments.get(dept.id);
                                        const fullDept = res.data;
                                        setDeptForm({
                                          id: fullDept.id,
                                          name: fullDept.name,
                                          headId: fullDept.headId,
                                          employeeIds: fullDept.employees?.map((m: any) => m.id) || [],
                                        });
                                        setDeptMemberSearch('');
                                        setIsDeptModalOpen(true);
                                      } catch (err: any) {
                                        setErrorMessage(err.message || 'Failed to load department details');
                                      }
                                    }
                                  },
                                  {
                                    label: 'Delete',
                                    icon: 'delete',
                                    className: 'text-error hover:bg-error/5',
                                    onClick: () => setDeleteTarget({ type: 'department', id: dept.id, name: dept.name })
                                  }
                                ]}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                            No departments found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>

              {totalPagesDepts > 1 && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-outline">
                    Showing {(deptPage - 1) * itemsPerPage + 1} to {Math.min(deptPage * itemsPerPage, filteredDepts.length)} of {filteredDepts.length} departments
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={deptPage === 1}
                      onClick={() => setDeptPage(deptPage - 1)}
                      className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                    >
                      Prev
                    </button>
                    <button
                      disabled={deptPage === totalPagesDepts}
                      onClick={() => setDeptPage(deptPage + 1)}
                      className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Teams</h2>
                <div className="relative w-48">
                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={teamSearch}
                    onChange={(e) => {
                      setTeamSearch(e.target.value);
                      setTeamPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-[11px] focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[14px]">search</span>
                </div>
              </div>

              <>
                {/* Mobile View - Cards List */}
                <div className="block md:hidden space-y-4">
                  {paginatedTeams.length > 0 ? (
                    paginatedTeams.map((team) => (
                      <div key={team.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-label-sm font-bold text-slate-900">{team.name}</h4>
                            <p className="text-[11px] text-outline mt-0.5 font-medium">
                              Dept: <span className="font-semibold text-slate-700">{team.department?.name || 'N/A'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100 font-semibold text-slate-700">
                          <div>
                            <span className="block text-slate-550 font-medium">Lead: <span className="text-slate-900">{team.lead ? `${team.lead.firstName} ${team.lead.lastName}` : 'Unassigned'}</span></span>
                            <span className="block text-slate-550 font-medium">Members: <span className="text-slate-900">{team._count?.members || 0}</span></span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await api.teams.get(team.id);
                                  const fullTeam = res.data;
                                  setTeamForm({
                                    id: fullTeam.id,
                                    name: fullTeam.name,
                                    departmentId: fullTeam.departmentId,
                                    leadId: fullTeam.leadId,
                                    memberIds: fullTeam.members?.map((m: any) => m.id) || [],
                                  });
                                  setMemberSearch('');
                                  setIsTeamModalOpen(true);
                                } catch (err: any) {
                                  setErrorMessage(err.message || 'Failed to load team details');
                                }
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[9px] rounded uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'team', id: team.id, name: team.name })}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[9px] rounded uppercase transition-all flex items-center justify-center gap-1 border border-red-150 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400 font-medium">
                      No teams found.
                    </div>
                  )}
                </div>

                {/* Desktop View - Standard Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Team Name</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Department</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Team Lead</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700 text-center">Members Count</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-body-sm font-medium text-slate-800">
                      {paginatedTeams.length > 0 ? (
                        paginatedTeams.map((team) => (
                          <tr key={team.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-slate-900 font-bold">{team.name}</td>
                            <td className="px-6 py-4 text-slate-600">{team.department?.name}</td>
                            <td className="px-6 py-4 text-slate-600">
                              {team.lead ? `${team.lead.firstName} ${team.lead.lastName}` : 'Unassigned'}
                            </td>
                            <td className="px-6 py-4 text-center text-slate-600">{team._count?.members || 0}</td>
                            <td className="px-6 py-4 text-right">
                              <ThreeDotMenu
                                actions={[
                                  {
                                    label: 'Edit',
                                    icon: 'edit',
                                    onClick: async () => {
                                      try {
                                        const res = await api.teams.get(team.id);
                                        const fullTeam = res.data;
                                        setTeamForm({
                                          id: fullTeam.id,
                                          name: fullTeam.name,
                                          departmentId: fullTeam.departmentId,
                                          leadId: fullTeam.leadId,
                                          memberIds: fullTeam.members?.map((m: any) => m.id) || [],
                                        });
                                        setMemberSearch('');
                                        setIsTeamModalOpen(true);
                                      } catch (err: any) {
                                        setErrorMessage(err.message || 'Failed to load team details');
                                      }
                                    }
                                  },
                                  {
                                    label: 'Delete',
                                    icon: 'delete',
                                    className: 'text-error hover:bg-error/5',
                                    onClick: () => setDeleteTarget({ type: 'team', id: team.id, name: team.name })
                                  }
                                ]}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                            No teams found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>

              {totalPagesTeams > 1 && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-outline">
                    Showing {(teamPage - 1) * itemsPerPage + 1} to {Math.min(teamPage * itemsPerPage, filteredTeams.length)} of {filteredTeams.length} teams
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={teamPage === 1}
                      onClick={() => setTeamPage(teamPage - 1)}
                      className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                    >
                      Prev
                    </button>
                    <button
                      disabled={teamPage === totalPagesTeams}
                      onClick={() => setTeamPage(teamPage + 1)}
                      className="px-2 py-1 border border-outline-variant hover:bg-surface-container-low rounded text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer text-on-surface"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'features' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 space-y-6">
              <div>
                <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-1">System Feature Controls</h2>
                <p className="text-body-sm text-outline">Enable or disable module routes across your organization. Disabling a feature removes it from the sidebar and navigation options for all users.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { id: 'employees', label: 'Employees Directory', desc: 'Onboarding & profile records' },
                  { id: 'attendance', label: 'Attendance & Geofencing', desc: 'Check-in with GPS verification' },
                  { id: 'leave', label: 'Leave Workflows', desc: 'Requests review and balances' },
                  { id: 'tasks', label: 'Task Management', desc: 'State-machine task boards' },
                  { id: 'performance', label: 'Performance Feedback', desc: 'Reviews and team appraisals' },
                  { id: 'payroll', label: 'Payroll & Compliance', desc: 'Generate payslips & compliance' },
                  { id: 'expenses', label: 'Expense Filing', desc: 'Reimbursement claims & approvals' },
                  { id: 'assets', label: 'Asset Tracker', desc: 'Hardware inventory catalog' },
                  { id: 'knowledge', label: 'Knowledge Wiki', desc: 'Handbooks and policy pages' },
                  { id: 'calendar', label: 'Shared Calendar', desc: 'Events and holiday calendar' }
                ].map(mod => {
                  const isEnabled = features.includes(mod.id);
                  return (
                    <div key={mod.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          isEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-200 text-slate-650 border-slate-300'
                        }`}>
                          {isEnabled ? 'Active' : 'Disabled'}
                        </span>
                        <h3 className="text-label-sm font-bold text-on-surface mt-3">{mod.label}</h3>
                        <p className="text-[10px] text-outline mt-1 leading-relaxed">{mod.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggleFeature(mod.id)}
                        className={`mt-4 w-full py-2 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 border cursor-pointer ${
                          isEnabled
                            ? 'bg-red-50 text-red-650 border-red-150 hover:bg-red-100'
                            : 'bg-primary text-on-primary border-primary hover:bg-blue-700'
                        }`}
                      >
                        {isEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {activeTab === 'location' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm max-w-lg space-y-6">
              <div>
                <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-1">Office Location & Geofencing</h2>
                <p className="text-body-sm text-outline">
                  Configure your office coordinates and maximum geofencing allowance radius. 
                  Clock-ins marked as WFO (Work From Office) will verify users are within bounds.
                </p>
              </div>

              <form onSubmit={handleSaveLocation} className="space-y-4">
                {/* Address Search */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Search Office Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type address, e.g. Dunder Mifflin Scranton..."
                      value={addressQuery}
                      onChange={(e) => handleAddressSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all text-slate-800 font-semibold outline-none"
                    />
                    {addressSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 max-h-48 overflow-y-auto">
                        {addressSuggestions.map((s: any) => (
                          <button
                            key={s.place_id}
                            type="button"
                            onClick={() => {
                              setOfficeLat(parseFloat(s.lat).toFixed(6));
                              setOfficeLng(parseFloat(s.lon).toFixed(6));
                              setAddressQuery(s.display_name);
                              setAddressSuggestions([]);
                            }}
                            className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 text-slate-700 font-medium truncate block border-b border-slate-100 last:border-0 cursor-pointer"
                          >
                            {s.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Search your company office name or street address to automatically retrieve coordinates.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Office Latitude
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 12.9716"
                      value={officeLat}
                      onChange={(e) => setOfficeLat(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all text-slate-800 font-semibold outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Office Longitude
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 77.5946"
                      value={officeLng}
                      onChange={(e) => setOfficeLng(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all text-slate-800 font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Allowable Radius (meters)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 200"
                    value={officeRadius}
                    onChange={(e) => setOfficeRadius(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all text-slate-800 font-semibold outline-none"
                  />
                  <p className="text-[10px] text-slate-450">
                    Minimum: 10m. Reverts to default 200m if empty.
                  </p>
                </div>

                {/* Embedded Map Preview */}
                {officeLat && officeLng && !isNaN(parseFloat(officeLat)) && !isNaN(parseFloat(officeLng)) && (
                  <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 shadow-inner mt-4">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://maps.google.com/maps?q=${parseFloat(officeLat)},${parseFloat(officeLng)}&z=15&output=embed`}
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      className="border-0"
                    />
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setOfficeLat(pos.coords.latitude.toFixed(6));
                          setOfficeLng(pos.coords.longitude.toFixed(6));
                          setAddressQuery('Current GPS Location');
                        }, (err) => {
                          toast.error('Unable to fetch your GPS location. Please enter the coordinates manually.');
                        });
                      } else {
                        toast.error('Geolocation is not supported by your browser. Please enter coordinates manually.');
                      }
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">my_location</span>
                    <span>Use Current Location</span>
                  </button>

                  <button
                    type="submit"
                    disabled={savingLocation}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {savingLocation && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></div>}
                    <span>Save Geofencing</span>
                  </button>
                </div>
              </form>
            </div>
          )}
          {activeTab === 'profile-requests' && (
            <div className="space-y-6">
              {/* Mobile View - Card List */}
              <div className="block md:hidden space-y-4">
                {profileRequests.length > 0 ? (
                  profileRequests.map((req) => (
                    <div key={req.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        {req.user.avatarUrl ? (
                          <img src={req.user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold text-xs">
                            {req.user.firstName[0]}
                          </div>
                        )}
                        <div className="flex-1">
                          <span className="font-semibold text-slate-800 text-body-sm block">
                            {req.user.firstName} {req.user.lastName}
                          </span>
                          <span className="text-[10px] text-slate-450 block">
                            {req.user.employeeId || 'No ID'} • {req.user.designation || 'No Designation'}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          req.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-100' :
                          'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-100">
                        <span>Submitted {new Date(req.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsRequestModalOpen(true);
                          }}
                          className="px-3 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          <span>Review</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 font-medium bg-white border border-slate-200 rounded-2xl shadow-sm">
                    No profile change requests found.
                  </div>
                )}
              </div>

              {/* Desktop View - Standard Table */}
              <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-100">
                  <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-1">Profile Change Requests</h2>
                  <p className="text-body-sm text-outline">
                    Review personal details update requests submitted by employees. Approving requests will immediately update their employee records.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Employee</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Requested Date</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Status</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-body-sm font-medium text-slate-800">
                      {profileRequests.length > 0 ? (
                        profileRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {req.user.avatarUrl ? (
                                  <img src={req.user.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold text-xs">
                                    {req.user.firstName[0]}
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-slate-900 block">
                                    {req.user.firstName} {req.user.lastName}
                                  </span>
                                  <span className="text-[11px] text-slate-500 block">
                                    {req.user.employeeId || 'No ID'} • {req.user.designation || 'No Designation'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                req.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-100' :
                                'bg-red-50 text-red-700 border border-red-100'
                              }`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setIsRequestModalOpen(true);
                                }}
                                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">visibility</span>
                                <span>Review</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">
                            No profile change requests found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'license' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">License & Subscription</h2>
                  <p className="text-body-xs text-outline mt-0.5">Manage your organization's active license key, subscription tier, and employee seat capacity.</p>
                </div>
                {licenseData && (
                  <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                    licenseData.licenseStatus === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    License: {licenseData.licenseStatus || 'ACTIVE'}
                  </span>
                )}
              </div>

              {licenseData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Active Key Box */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Active License Key</span>
                    <p className="font-mono text-base font-bold text-slate-900">{licenseData.maskedKey || 'No active key'}</p>
                    <p className="text-xs text-slate-500 font-medium">Tier: <span className="font-bold text-blue-600 uppercase">{licenseData.subscriptionTier}</span></p>
                  </div>

                  {/* Seat Usage Bar */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Employee Seat Capacity</span>
                      <span className="text-xs font-bold text-slate-700">{licenseData.activeEmployeesCount} / {licenseData.licenseMaxEmployees} seats</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all"
                        style={{ width: `${Math.min(100, (licenseData.activeEmployeesCount / (licenseData.licenseMaxEmployees || 1)) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500">{licenseData.seatsRemaining} seats remaining available</p>
                  </div>

                  {/* Validity Info */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Expiration & Renewal</span>
                    <p className="font-bold text-sm text-slate-900">
                      {licenseData.licenseValidUntil ? new Date(licenseData.licenseValidUntil).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : 'Lifetime / Perpetual'}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Status: {licenseData.isExpired ? <span className="text-red-600 font-bold">EXPIRED</span> : <span className="text-emerald-600 font-bold">VALID & ACTIVE</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* Upgrade / Activate License Key Form */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-label-sm font-bold text-slate-800 uppercase tracking-wider">Activate or Upgrade License Key</h3>
                <form onSubmit={handleActivateLicense} className="flex flex-col sm:flex-row gap-4 max-w-xl">
                  <input
                    type="text"
                    placeholder="Enter personalized key e.g. WFOS-ACME-GWTH-9482"
                    value={licenseKeyInput}
                    onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-sm font-mono tracking-wider uppercase font-bold outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={activatingLicense}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-1.5"
                  >
                    {activatingLicense ? 'Activating...' : 'Submit License Key'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {isRequestModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider">
                  Review Profile Request
                </h3>
                <p className="text-body-xs text-outline mt-0.5">
                  Proposed changes from {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsRequestModalOpen(false);
                  setRejectComment('');
                }}
                className="text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                      <th className="px-3 py-2">Field</th>
                      <th className="px-3 py-2">Current Value</th>
                      <th className="px-3 py-2 bg-blue-50/50 text-primary">Proposed Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderComparisonRows(selectedRequest)}
                  </tbody>
                </table>
              </div>

              {selectedRequest.requestedData?.changeReason && (
                <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1 animate-fade-in">
                  <div className="font-bold text-[10px] uppercase tracking-wider text-blue-700">Reason for Request</div>
                  <div className="font-medium leading-relaxed">{selectedRequest.requestedData.changeReason}</div>
                </div>
              )}

              {selectedRequest.status === 'PENDING' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Rejection Comment (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="Provide a reason if declining this request..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-sm transition-all outline-none font-medium"
                  />
                </div>
              )}

              {selectedRequest.status !== 'PENDING' && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 space-y-1">
                  <div>Status: <span className="capitalize font-bold">{selectedRequest.status.toLowerCase()}</span></div>
                  {selectedRequest.comment && <div>Comment: <span className="font-normal text-slate-500">{selectedRequest.comment}</span></div>}
                </div>
              )}
            </div>

            {selectedRequest.status === 'PENDING' && (
              <div className="flex gap-2.5 justify-end border-t border-slate-100 pt-4">
                <button
                  onClick={() => handleReviewRequest(selectedRequest.id, 'reject')}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleReviewRequest(selectedRequest.id, 'approve')}
                  disabled={submitting}
                  className="px-5 py-2 bg-primary hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></div>}
                  <span>Approve & Apply</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider">
              {deptForm.id ? 'Edit Department' : 'Add Department'}
            </h3>
            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-label-xs font-bold text-slate-700 uppercase">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Sales"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-sm transition-all outline-none font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-label-xs font-bold text-slate-700 uppercase">Department Head</label>
                <CustomSelect
                  options={employeeOptions}
                  value={deptForm.headId}
                  onChange={(val) => setDeptForm({ ...deptForm, headId: val || null })}
                  placeholder="Select a department head..."
                  searchPlaceholder="Search employees..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-label-xs font-bold text-slate-700 uppercase">Department Members</label>
                <input
                  type="text"
                  value={deptMemberSearch}
                  onChange={(e) => setDeptMemberSearch(e.target.value)}
                  placeholder="Filter employees..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-sm transition-all outline-none font-medium mb-2"
                />
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-40 overflow-y-auto space-y-2">
                  {employees.filter(emp =>
                    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(deptMemberSearch.toLowerCase())
                  ).map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deptForm.employeeIds?.includes(emp.id) || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const newEmployeeIds = checked
                            ? [...(deptForm.employeeIds || []), emp.id]
                            : (deptForm.employeeIds || []).filter(id => id !== emp.id);
                          setDeptForm({ ...deptForm, employeeIds: newEmployeeIds });
                        }}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                      <span>{emp.firstName} {emp.lastName} ({emp.designation || 'Staff'})</span>
                    </label>
                  ))}
                  {employees.filter(emp =>
                    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(deptMemberSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="text-xs text-slate-400 font-medium text-center py-2">No employees match your filter</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-label-sm font-bold transition-all cursor-pointer"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-sm font-bold shadow-sm transition-all cursor-pointer"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider">
              {teamForm.id ? 'Edit Team' : 'Add Team'}
            </h3>
            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div className="space-y-1">
                <label className="text-label-xs font-bold text-slate-700 uppercase">Team Name</label>
                <input
                  type="text"
                  required
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="e.g. Northeast Regional Sales"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-sm transition-all outline-none font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-label-xs font-bold text-slate-700 uppercase">Department</label>
                <CustomSelect
                  options={departmentOptions}
                  value={teamForm.departmentId}
                  onChange={(val) => setTeamForm({ ...teamForm, departmentId: val })}
                  placeholder="Select a department..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-label-xs font-bold text-slate-700 uppercase">Team Lead</label>
                <CustomSelect
                  options={employeeOptions}
                  value={teamForm.leadId}
                  onChange={(val) => setTeamForm({ ...teamForm, leadId: val || null })}
                  placeholder="Select a team lead..."
                  searchPlaceholder="Search employees..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-label-xs font-bold text-slate-700 uppercase">Team Members</label>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Filter employees..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-sm transition-all outline-none font-medium mb-2"
                />
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-40 overflow-y-auto space-y-2">
                  {employees.filter(emp =>
                    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(memberSearch.toLowerCase())
                  ).map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={teamForm.memberIds?.includes(emp.id) || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const newMemberIds = checked
                            ? [...(teamForm.memberIds || []), emp.id]
                            : (teamForm.memberIds || []).filter(id => id !== emp.id);
                          setTeamForm({ ...teamForm, memberIds: newMemberIds });
                        }}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                      <span>{emp.firstName} {emp.lastName} ({emp.designation || 'Staff'})</span>
                    </label>
                  ))}
                  {employees.filter(emp =>
                    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(memberSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="text-xs text-slate-400 font-medium text-center py-2">No employees match your filter</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-label-sm font-bold transition-all cursor-pointer"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-sm font-bold shadow-sm transition-all cursor-pointer"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-label-md font-bold text-error uppercase tracking-wider">
              Delete {deleteTarget.type === 'department' ? 'Department' : 'Team'}
            </h3>
            <p className="text-body-sm text-slate-600 font-medium">
              Are you sure you want to delete <span className="font-bold text-slate-900">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-label-sm font-bold transition-all cursor-pointer"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-error hover:bg-red-700 text-on-error rounded-xl text-label-sm font-bold shadow-sm transition-all cursor-pointer"
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {featureToggling && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-md font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center border border-slate-200">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-800">Updating Modules</p>
            <p className="text-[11px] text-outline leading-relaxed">Applying organization configuration and updating user menus... Please wait.</p>
          </div>
        </div>
      )}
    </div>
  );
}
