'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { CommentDialog } from '../../../components/ui/CommentDialog';
import { ThreeDotMenu } from '../../../components/ui/ThreeDotMenu';
import { TableSkeleton } from '../../../components/ui/Skeleton';

export default function MyTeamPage() {
  const { user, refetchUser } = useAuth();
  const router = useRouter();
  const [scopes, setScopes] = useState<any[]>([]);
  const [selectedScope, setSelectedScope] = useState<string>('');
  const [entityData, setEntityData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'tasks'>('members');
  const [errorMessage, setErrorMessage] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [addSearch, setAddSearch] = useState('');
  const [selectedToAssign, setSelectedToAssign] = useState<string[]>([]);

  const [delayReviewTaskId, setDelayReviewTaskId] = useState<string | null>(null);

  const [membersSearch, setMembersSearch] = useState('');
  const [membersPage, setMembersPage] = useState(1);
  const [tasksSearch, setTasksSearch] = useState('');
  const [tasksPage, setTasksPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setMembersPage(1);
    setTasksPage(1);
  }, [selectedScope, activeTab]);

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
  const isGlobalManager = isAdmin || isHR;

  useEffect(() => {
    if (refetchUser) {
      refetchUser();
    }
  }, []);

  useEffect(() => {
    if (user) {
      initializeScopes();
    }
  }, [user]);

  async function initializeScopes() {
    try {
      setLoading(true);
      let list: any[] = [];

      if (isGlobalManager) {
        const [deptRes, teamRes] = await Promise.all([
          api.departments.list(),
          api.teams.list()
        ]);
        const depts = (deptRes.data || []).map((d: any) => ({
          value: `dept:${d.id}`,
          label: `Department: ${d.name}`
        }));
        const tms = (teamRes.data || []).map((t: any) => ({
          value: `team:${t.id}`,
          label: `Team: ${t.name}`
        }));
        list = [...depts, ...tms];
      } else {
        const deptHeadsSet = new Set((user.departmentHead || []).map((d: any) => d.id));
        const teamLeadsSet = new Set((user.teamLead || []).map((t: any) => t.id));

        const depts = (user.departmentHead || []).map((d: any) => ({
          value: `dept:${d.id}`,
          label: `Department: ${d.name}`
        }));
        const tms = (user.teamLead || []).map((t: any) => ({
          value: `team:${t.id}`,
          label: `Team: ${t.name}`
        }));

        list = [...depts, ...tms];

        if (user.department && !deptHeadsSet.has(user.department.id)) {
          list.push({
            value: `dept:${user.department.id}`,
            label: `Department: ${user.department.name}`
          });
        }

        if (user.teams) {
          user.teams.forEach((t: any) => {
            if (!teamLeadsSet.has(t.id)) {
              list.push({
                value: `team:${t.id}`,
                label: `Team: ${t.name}`
              });
            }
          });
        }
      }

      setScopes(list);
      if (list.length > 0) {
        setSelectedScope(list[0].value);
      } else {
        router.push('/unauthorized');
      }
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize scopes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedScope) {
      loadScopeData();
    } else {
      setEntityData(null);
      setTasks([]);
    }
  }, [selectedScope]);

  async function loadScopeData() {
    try {
      setLoading(true);
      const [type, id] = selectedScope.split(':');
      
      let entityRes;
      let tasksRes;

      if (type === 'dept') {
        [entityRes, tasksRes] = await Promise.all([
          api.departments.get(id),
          api.tasks.list({ departmentId: id })
        ]);
      } else {
        [entityRes, tasksRes] = await Promise.all([
          api.teams.get(id),
          api.tasks.list({ teamId: id })
        ]);
      }

      setEntityData(entityRes.data);
      setTasks(tasksRes.data || []);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load scope details.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllEmployees() {
    try {
      const res = await api.employees.list({ limit: 1000 });
      setAllEmployees(res.data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load employees list.');
    }
  }

  function handleOpenAddModal() {
    loadAllEmployees();
    setSelectedToAssign([]);
    setAddSearch('');
    setIsAddModalOpen(true);
  }

  async function handleAddMembers() {
    if (selectedToAssign.length === 0 || !entityData) return;

    try {
      setSubmitting(true);
      const [type, id] = selectedScope.split(':');
      
      if (type === 'team') {
        const currentMemberIds = entityData.members?.map((m: any) => m.id) || [];
        const newMemberIds = Array.from(new Set([...currentMemberIds, ...selectedToAssign]));
        await api.teams.update(id, {
          name: entityData.name,
          departmentId: entityData.departmentId,
          leadId: entityData.leadId,
          memberIds: newMemberIds
        });
      } else {
        const currentEmpIds = entityData.employees?.map((e: any) => e.id) || [];
        const newEmpIds = Array.from(new Set([...currentEmpIds, ...selectedToAssign]));
        await api.departments.update(id, {
          name: entityData.name,
          headId: entityData.headId,
          employeeIds: newEmpIds
        });
      }

      setIsAddModalOpen(false);
      loadScopeData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add members.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!entityData) return;

    try {
      setSubmitting(true);
      const [type, id] = selectedScope.split(':');

      if (type === 'team') {
        const currentMemberIds = entityData.members?.map((m: any) => m.id) || [];
        const newMemberIds = currentMemberIds.filter((mid: string) => mid !== memberId);
        await api.teams.update(id, {
          name: entityData.name,
          departmentId: entityData.departmentId,
          leadId: entityData.leadId,
          memberIds: newMemberIds
        });
      } else {
        const currentEmpIds = entityData.employees?.map((e: any) => e.id) || [];
        const newEmpIds = currentEmpIds.filter((eid: string) => eid !== memberId);
        await api.departments.update(id, {
          name: entityData.name,
          headId: entityData.headId,
          employeeIds: newEmpIds
        });
      }

      loadScopeData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove member.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRaiseDelayReview(commentText: string) {
    if (!delayReviewTaskId) return;

    try {
      await api.tasks.review(delayReviewTaskId, {
        score: 1,
        comment: commentText,
        action: 'CHANGES_REQUESTED'
      });
      setDelayReviewTaskId(null);
      loadScopeData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to raise delay review.');
    }
  }

  if (scopes.length === 0 && !loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] font-sans p-6 text-center">
        <div className="max-w-md space-y-4">
          <span className="material-symbols-outlined text-[64px] text-outline">groups</span>
          <h1 className="text-headline-md font-bold text-on-surface">No Managed Scopes</h1>
          <p className="text-body-sm text-outline">
            You are not currently assigned to any team or department. If this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const [type] = selectedScope.split(':');
  const membersList = type === 'dept' ? entityData?.employees || [] : entityData?.members || [];

  const filteredMembers = membersList.filter((m: any) => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    const email = (m.email || '').toLowerCase();
    const designation = (m.designation || '').toLowerCase();
    const query = membersSearch.toLowerCase();
    return fullName.includes(query) || email.includes(query) || designation.includes(query);
  });

  const totalMembersPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (membersPage - 1) * itemsPerPage,
    membersPage * itemsPerPage
  );

  const filteredTasks = tasks.filter((t: any) => {
    const taskId = (t.taskId || '').toLowerCase();
    const title = (t.title || '').toLowerCase();
    const assigneeName = t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}`.toLowerCase() : 'unassigned';
    const query = tasksSearch.toLowerCase();
    return taskId.includes(query) || title.includes(query) || assigneeName.includes(query);
  });

  const totalTasksPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice(
    (tasksPage - 1) * itemsPerPage,
    tasksPage * itemsPerPage
  );
  
  const currentMemberIds = new Set(membersList.map((m: any) => m.id));
  const assignableEmployees = allEmployees.filter((emp: any) => !currentMemberIds.has(emp.id));

  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t: any) => ['DRAFT', 'ASSIGNED', 'ACCEPTED'].includes(t.status)).length;
  const inProgressTasks = tasks.filter((t: any) => ['IN_PROGRESS', 'CHANGES_REQUESTED', 'RESUBMITTED'].includes(t.status)).length;
  const completedTasks = tasks.filter((t: any) => ['APPROVED', 'CLOSED'].includes(t.status)).length;
  
  const delayedTasks = tasks.filter((t: any) => {
    const isPending = !['APPROVED', 'CLOSED'].includes(t.status);
    const isPastDue = t.dueDate && new Date(t.dueDate) < new Date();
    return isPending && isPastDue;
  });
  const delayedTasksCount = delayedTasks.length;

  const isLeadOfSelected = type === 'team' && entityData?.leadId === user?.id;
  const isHeadOfSelected = type === 'dept' && entityData?.headId === user?.id;
  const canEdit = isGlobalManager || isLeadOfSelected || isHeadOfSelected;

  return (
    <div className="flex-1 font-sans p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-headline-md font-extrabold text-on-surface">My Managed Team</h1>
          <p className="text-body-sm text-outline font-medium">View team rosters, manage members, and monitor tasks.</p>
        </div>
        <div className="w-full md:w-72">
          <CustomSelect
            options={scopes}
            value={selectedScope}
            onChange={(val) => setSelectedScope(val)}
            placeholder="Select team/department..."
          />
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

      {loading && !entityData ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <>
          {entityData && (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-title-lg font-bold text-slate-900">{entityData.name}</h2>
                <p className="text-body-sm text-slate-500 font-medium mt-1">
                  {type === 'dept' ? 'Department Head: ' : 'Team Lead: '}
                  <span className="text-slate-800 font-semibold">
                    {type === 'dept'
                      ? entityData.head ? `${entityData.head.firstName} ${entityData.head.lastName}` : 'Unassigned'
                      : entityData.lead ? `${entityData.lead.firstName} ${entityData.lead.lastName}` : 'Unassigned'}
                  </span>
                </p>
                {type === 'team' && entityData.department && (
                  <p className="text-body-xs text-slate-400 font-medium mt-0.5">
                    Department: {entityData.department.name}
                  </p>
                )}
              </div>
              <div className="flex gap-4">
                <div className="bg-white border border-slate-200/60 px-4 py-2 rounded-xl text-center">
                  <p className="text-[10px] text-outline font-bold uppercase">Members</p>
                  <p className="text-title-md font-bold text-slate-900 mt-0.5">{membersList.length}</p>
                </div>
                <div className="bg-white border border-slate-200/60 px-4 py-2 rounded-xl text-center">
                  <p className="text-[10px] text-outline font-bold uppercase">Tasks</p>
                  <p className="text-title-md font-bold text-slate-900 mt-0.5">{totalTasks}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200/60 p-4 rounded-xl">
              <p className="text-[9px] text-outline font-bold uppercase">Total Tasks</p>
              <h3 className="text-headline-sm font-bold text-slate-900 mt-1">{totalTasks}</h3>
            </div>
            <div className="bg-white border border-slate-200/60 p-4 rounded-xl">
              <p className="text-[9px] text-outline font-bold uppercase">To Do</p>
              <h3 className="text-headline-sm font-bold text-slate-600 mt-1">{todoTasks}</h3>
            </div>
            <div className="bg-white border border-slate-200/60 p-4 rounded-xl">
              <p className="text-[9px] text-outline font-bold uppercase">In Progress</p>
              <h3 className="text-headline-sm font-bold text-primary mt-1">{inProgressTasks}</h3>
            </div>
            <div className="bg-white border border-slate-200/60 p-4 rounded-xl">
              <p className="text-[9px] text-outline font-bold uppercase">Completed</p>
              <h3 className="text-headline-sm font-bold text-green-600 mt-1">{completedTasks}</h3>
            </div>
            <div className="bg-white border border-slate-200/60 p-4 rounded-xl col-span-2 lg:col-span-1">
              <p className="text-[9px] text-outline font-bold uppercase">Delayed / Overdue</p>
              <h3 className={`text-headline-sm font-bold mt-1 ${delayedTasksCount > 0 ? 'text-error' : 'text-slate-500'}`}>
                {delayedTasksCount}
              </h3>
            </div>
          </div>

          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-3 px-2 text-label-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'members'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Members Roster ({membersList.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 px-2 text-label-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Scoped Task List ({totalTasks})
            </button>
          </div>

          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={membersSearch}
                    onChange={(e) => { setMembersSearch(e.target.value); setMembersPage(1); }}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary text-on-surface"
                  />
                </div>
                {canEdit && (
                  <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                  >
                    Add Member
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <>
                {/* Mobile View - Cards List */}
                <div className="block md:hidden space-y-4">
                  {paginatedMembers.length > 0 ? (
                    paginatedMembers.map((m: any) => {
                      const isLead = type === 'team' && entityData.leadId === m.id;
                      const isHead = type === 'dept' && entityData.headId === m.id;
                      return (
                        <div key={m.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-label-sm font-bold text-slate-900">{m.firstName} {m.lastName}</h4>
                              <p className="text-[11px] text-outline mt-0.5 font-medium">{m.designation || 'Staff Member'}</p>
                            </div>
                            {isLead && (
                              <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-[9px] font-bold uppercase">
                                Lead
                              </span>
                            )}
                            {isHead && (
                              <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-[9px] font-bold uppercase">
                                Head
                              </span>
                            )}
                            {!isLead && !isHead && (
                              <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[9px] font-bold uppercase">
                                Member
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100 font-semibold text-slate-700">
                            <span className="font-mono">{m.email}</span>
                          </div>
                          {canEdit && !(isLead || isHead) && (
                            <div className="pt-2 flex gap-2">
                              <button
                                onClick={() => handleRemoveMember(m.id)}
                                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[10px] rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 border border-red-150 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">person_remove</span>
                                Remove Member
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-slate-400 font-medium">
                      No team members found.
                    </div>
                  )}
                </div>

                {/* Desktop View - Standard Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Name</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Email</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Designation</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Role</th>
                        {canEdit && <th className="px-6 py-4 text-label-sm font-bold text-slate-700 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-body-sm font-medium text-slate-800">
                      {paginatedMembers.length > 0 ? (
                        paginatedMembers.map((m: any) => {
                          const isLead = type === 'team' && entityData.leadId === m.id;
                          const isHead = type === 'dept' && entityData.headId === m.id;
                          return (
                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900">
                                {m.firstName} {m.lastName}
                              </td>
                              <td className="px-6 py-4 text-slate-600 font-mono">{m.email}</td>
                              <td className="px-6 py-4 text-slate-600">{m.designation || 'Staff Member'}</td>
                              <td className="px-6 py-4">
                                {isLead && (
                                  <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-[9px] font-bold uppercase">
                                    Lead
                                  </span>
                                )}
                                {isHead && (
                                  <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-[9px] font-bold uppercase">
                                    Head
                                  </span>
                                )}
                                {!isLead && !isHead && (
                                  <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[9px] font-bold uppercase">
                                    Member
                                  </span>
                                )}
                              </td>
                              {canEdit && (
                                <td className="px-6 py-4 text-right">
                                  {!(isLead || isHead) ? (
                                    <ThreeDotMenu
                                      actions={[
                                        {
                                          label: 'Remove Member',
                                          icon: 'person_remove',
                                          className: 'text-red-600 hover:bg-red-50/50',
                                          onClick: () => handleRemoveMember(m.id)
                                        }
                                      ]}
                                    />
                                  ) : (
                                    <span className="text-slate-300 text-label-xs select-none">No action</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={canEdit ? 5 : 4} className="px-6 py-12 text-center text-slate-400 font-medium">
                            No team members found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>

                {totalMembersPages > 1 && (
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-body-sm text-outline">
                      Showing {(membersPage - 1) * itemsPerPage + 1} to {Math.min(membersPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={membersPage === 1}
                        onClick={() => setMembersPage(membersPage - 1)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Previous
                      </button>
                      <button
                        disabled={membersPage === totalMembersPages}
                        onClick={() => setMembersPage(membersPage + 1)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="relative w-full md:w-80">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={tasksSearch}
                  onChange={(e) => { setTasksSearch(e.target.value); setTasksPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <>
                {/* Mobile View - Cards List */}
                <div className="block md:hidden space-y-4">
                  {paginatedTasks.length > 0 ? (
                    paginatedTasks.map((task: any) => {
                      const isPending = !['APPROVED', 'CLOSED'].includes(task.status);
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                      const showDelayAction = isPending && isOverdue;

                      return (
                        <div key={task.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all text-body-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-mono text-outline font-bold block">{task.taskId}</span>
                              <h4 className="text-label-sm font-bold text-slate-900 mt-0.5">{task.title}</h4>
                              <p className="text-[11px] text-slate-600 mt-1">
                                Assignee: <span className="font-semibold text-slate-800">{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}</span>
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap ${
                              task.status === 'APPROVED' || task.status === 'CLOSED'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100 font-semibold text-slate-700">
                            <span>Due: <span className="font-mono text-slate-900">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span></span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                              task.priority === 'CRITICAL' || task.priority === 'HIGH'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {task.priority}
                            </span>
                          </div>

                          {canEdit && showDelayAction && (
                            <div className="pt-2">
                              <button
                                onClick={() => setDelayReviewTaskId(task.id)}
                                className="w-full py-2 bg-primary hover:bg-blue-755 text-on-primary font-bold text-[10px] rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">rate_review</span>
                                Raise Delay Review
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-slate-400 font-medium">
                      No tasks associated with this scope.
                    </div>
                  )}
                </div>

                {/* Desktop View - Standard Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Task ID</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Task Title</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700">Assignee</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700 text-center">Priority</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700 text-center">Status</th>
                        <th className="px-6 py-4 text-label-sm font-bold text-slate-700 font-mono">Due Date</th>
                        {canEdit && <th className="px-6 py-4 text-label-sm font-bold text-slate-700 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-body-sm font-medium text-slate-800">
                      {paginatedTasks.length > 0 ? (
                        paginatedTasks.map((task: any) => {
                          const isPending = !['APPROVED', 'CLOSED'].includes(task.status);
                          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                          const showDelayAction = isPending && isOverdue;

                          return (
                            <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-mono text-slate-900 font-bold">{task.taskId}</td>
                              <td className="px-6 py-4 text-slate-900 font-bold">{task.title}</td>
                              <td className="px-6 py-4 text-slate-600">
                                {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  task.priority === 'CRITICAL' || task.priority === 'HIGH'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {task.priority}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap inline-block ${
                                  task.status === 'APPROVED' || task.status === 'CLOSED'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : task.status === 'IN_PROGRESS'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-mono text-slate-600">
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                              </td>
                              {canEdit && (
                                <td className="px-6 py-4 text-right">
                                  {showDelayAction ? (
                                    <ThreeDotMenu
                                      actions={[
                                        {
                                          label: 'Raise Delay Review',
                                          icon: 'rate_review',
                                          onClick: () => setDelayReviewTaskId(task.id)
                                        }
                                      ]}
                                    />
                                  ) : (
                                    <span className="text-slate-300 text-label-xs select-none">No action</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={canEdit ? 7 : 6} className="px-6 py-12 text-center text-slate-400 font-medium">
                            No tasks associated with this team or department scope.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>

                {totalTasksPages > 1 && (
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-body-sm text-outline">
                      Showing {(tasksPage - 1) * itemsPerPage + 1} to {Math.min(tasksPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={tasksPage === 1}
                        onClick={() => setTasksPage(tasksPage - 1)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Previous
                      </button>
                      <button
                        disabled={tasksPage === totalTasksPages}
                        onClick={() => setTasksPage(tasksPage + 1)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer text-on-surface"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wider">
              Add Member to {entityData?.name}
            </h3>
            
            <div className="space-y-3">
              <input
                type="text"
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                placeholder="Search employees by name..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-sm transition-all outline-none font-medium"
              />

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-60 overflow-y-auto space-y-2">
                {assignableEmployees.filter((emp: any) =>
                  `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(addSearch.toLowerCase())
                ).map((emp: any) => (
                  <label key={emp.id} className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedToAssign.includes(emp.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const next = checked
                          ? [...selectedToAssign, emp.id]
                          : selectedToAssign.filter((id) => id !== emp.id);
                        setSelectedToAssign(next);
                      }}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <span>{emp.firstName} {emp.lastName} ({emp.designation || 'Staff'})</span>
                  </label>
                ))}

                {assignableEmployees.filter((emp: any) =>
                  `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(addSearch.toLowerCase())
                ).length === 0 && (
                  <p className="text-xs text-slate-400 font-medium text-center py-4">
                    No assignable employees found.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-label-sm font-bold transition-all cursor-pointer"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMembers}
                className="px-4 py-2 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-sm font-bold shadow-sm transition-all cursor-pointer"
                disabled={submitting || selectedToAssign.length === 0}
              >
                {submitting ? 'Adding...' : 'Add Selected'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CommentDialog
        isOpen={delayReviewTaskId !== null}
        title="Raise Delay Review"
        placeholder="Request progress review comment / action details..."
        confirmLabel="Raise Review"
        onConfirm={handleRaiseDelayReview}
        onClose={() => setDelayReviewTaskId(null)}
      />
    </div>
  );
}
