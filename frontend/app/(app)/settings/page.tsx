'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { CustomSelect } from '../../../components/ui/CustomSelect';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'departments' | 'teams'>('departments');
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState<{ id?: string; name: string; headId: string | null }>({
    name: '',
    headId: null,
  });

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamForm, setTeamForm] = useState<{ id?: string; name: string; departmentId: string; leadId: string | null; memberIds: string[] }>({
    name: '',
    departmentId: '',
    leadId: null,
    memberIds: [],
  });
  const [memberSearch, setMemberSearch] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'department' | 'team'; id: string; name: string } | null>(null);

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
      const [deptRes, teamRes, empRes] = await Promise.all([
        api.departments.list(),
        api.teams.list(),
        api.employees.list({ limit: 1000 }),
      ]);

      setDepartments(deptRes.data || []);
      setTeams(teamRes.data || []);
      setEmployees(empRes.data || []);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load configuration data.');
    } finally {
      setLoading(false);
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
        });
      } else {
        await api.departments.create({
          name: deptForm.name,
          headId: deptForm.headId || null,
        });
      }
      setIsDeptModalOpen(false);
      setDeptForm({ name: '', headId: null });
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
    <div className="flex-1 font-sans p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-headline-md font-extrabold text-on-surface">Organization Settings</h1>
          <p className="text-body-sm text-outline">Manage organization departments, teams, and administrative roles.</p>
        </div>
        <div>
          {activeTab === 'departments' ? (
            <button
              onClick={() => {
                setDeptForm({ name: '', headId: null });
                setIsDeptModalOpen(true);
              }}
              className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              Add Department
            </button>
          ) : (
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

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-xs">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex-1 py-2 text-center text-label-sm font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-2 text-center text-label-sm font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'teams' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Teams
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-label-sm text-outline font-semibold uppercase">Loading Organization Configuration...</p>
        </div>
      ) : (
        <>
          {activeTab === 'departments' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-900 font-bold">{dept.name}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">{dept._count?.teams || 0}</td>
                        <td className="px-6 py-4 text-center text-slate-600">{dept._count?.employees || 0}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setDeptForm({ id: dept.id, name: dept.name, headId: dept.headId });
                              setIsDeptModalOpen(true);
                            }}
                            className="text-primary hover:text-blue-700 font-bold text-label-xs cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'department', id: dept.id, name: dept.name })}
                            className="text-error hover:text-red-700 font-bold text-label-xs cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No departments found. Click Add Department to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                  {teams.length > 0 ? (
                    teams.map((team) => (
                      <tr key={team.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-900 font-bold">{team.name}</td>
                        <td className="px-6 py-4 text-slate-600">{team.department?.name}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {team.lead ? `${team.lead.firstName} ${team.lead.lastName}` : 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">{team._count?.members || 0}</td>
                        <td className="px-6 py-4 text-right space-x-2">
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
                            className="text-primary hover:text-blue-700 font-bold text-label-xs cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'team', id: team.id, name: team.name })}
                            className="text-error hover:text-red-700 font-bold text-label-xs cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                        {departments.length === 0
                          ? 'Please add a department first before creating teams.'
                          : 'No teams found. Click Add Team to create one.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
    </div>
  );
}
