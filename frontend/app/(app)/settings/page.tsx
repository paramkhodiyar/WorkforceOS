'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { ThreeDotMenu } from '../../../components/ui/ThreeDotMenu';
import { TableSkeleton } from '../../../components/ui/Skeleton';

export default function SettingsPage() {
  const { user, features, setFeatures } = useAuth();
  const [activeTab, setActiveTab] = useState<'departments' | 'teams' | 'features' | 'location'>('departments');
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [featureToggling, setFeatureToggling] = useState(false);

  const [officeLat, setOfficeLat] = useState<string>('');
  const [officeLng, setOfficeLng] = useState<string>('');
  const [officeRadius, setOfficeRadius] = useState<string>('');
  const [savingLocation, setSavingLocation] = useState(false);

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

  useEffect(() => {
    if (isAdmin || isHR) {
      loadData();
    }
  }, [isAdmin, isHR]);

  async function loadData() {
    try {
      setLoading(true);
      const [deptRes, teamRes, empRes, orgRes] = await Promise.all([
        api.departments.list(),
        api.teams.list(),
        api.employees.list({ limit: 1000 }),
        api.organization.get(),
      ]);

      setDepartments(deptRes.data || []);
      setTeams(teamRes.data || []);
      setEmployees(empRes.data || []);
      if (orgRes?.data) {
        setOfficeLat(orgRes.data.officeLatitude !== null ? String(orgRes.data.officeLatitude) : '');
        setOfficeLng(orgRes.data.officeLongitude !== null ? String(orgRes.data.officeLongitude) : '');
        setOfficeRadius(orgRes.data.officeRadius !== null ? String(orgRes.data.officeRadius) : '');
      }
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load configuration data.');
    } finally {
      setLoading(false);
    }
  }

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

      alert('Office geofencing configuration updated successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save location settings.');
    } finally {
      setSavingLocation(false);
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
        <div className="p-4 bg-error-container text-error rounded-xl text-body-sm font-medium border border-error/20 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-error hover:opacity-80 font-bold cursor-pointer">
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
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all text-slate-800 font-semibold"
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
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all text-slate-800 font-semibold"
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
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all text-slate-800 font-semibold"
                  />
                  <p className="text-[10px] text-slate-450">
                    Minimum: 10m. Reverts to default 200m if empty.
                  </p>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setOfficeLat(pos.coords.latitude.toFixed(6));
                          setOfficeLng(pos.coords.longitude.toFixed(6));
                        }, (err) => {
                          alert("Unable to fetch current GPS coordinates. Please enter manually.");
                        });
                      } else {
                        alert("Geolocation is not supported by your browser.");
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
        </>
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
