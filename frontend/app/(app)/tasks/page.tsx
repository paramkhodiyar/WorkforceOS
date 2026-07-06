'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { CommentDialog } from '../../../components/ui/CommentDialog';
import { useToast } from '../../../lib/toast/ToastProvider';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Button } from '../../../components/ui/Button';
import { ThreeDotMenu } from '../../../components/ui/ThreeDotMenu';

export default function TasksPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');

  // Task Scope Form State
  const [scope, setScope] = useState<'PERSONAL' | 'TEAM' | 'DEPARTMENT' | 'ORG'>('PERSONAL');
  const [targetTeamId, setTargetTeamId] = useState<string>('');
  const [targetDeptId, setTargetDeptId] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'dashboard'>('board');

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [reviewingTaskId, setReviewingTaskId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'CHANGES_REQUESTED'>('CHANGES_REQUESTED');
  const [delayedSearch, setDelayedSearch] = useState('');
  const [delayedPage, setDelayedPage] = useState(1);
  const itemsPerPageDelayed = 5;

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
  const isIntern = systemRole === 'INTERN' || userRoles.some((r: any) => r.roleName === 'INTERN');
  const canSeeOperations = isAdmin || isHR || isManager;

  const myLedTeams = isAdmin || isHR ? teams : teams.filter(t => t.leadId === user?.id);
  const myHeadedDepts = isAdmin || isHR ? departments : departments.filter(d => d.headId === user?.id);

  const scopeOptions = [
    { value: 'PERSONAL', label: 'Personal (Self)' },
    ...(isAdmin || isHR || myLedTeams.length > 0 ? [{ value: 'TEAM', label: 'Team' }] : []),
    ...(isAdmin || isHR || myHeadedDepts.length > 0 ? [{ value: 'DEPARTMENT', label: 'Department' }] : []),
    ...(isAdmin || isHR ? [{ value: 'ORG', label: 'Organization-wide' }] : [])
  ];

  async function loadInitialData() {
    try {
      const empRes = await api.employees.list({ taskAssignees: 'true', limit: 1000 });
      setEmployees(empRes.data || []);

      if (canSeeOperations) {
        const [deptRes, teamRes] = await Promise.all([
          api.departments.list(),
          api.teams.list()
        ]);
        setDepartments(deptRes.data || []);
        setTeams(teamRes.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadTasks() {
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedDeptId) filters.departmentId = selectedDeptId;
      if (selectedTeamId) filters.teamId = selectedTeamId;

      const response = await api.tasks.list(filters);
      setTasks(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, [canSeeOperations]);

  useEffect(() => {
    loadTasks();
  }, [selectedDeptId, selectedTeamId]);

  useEffect(() => {
    if (scope === 'PERSONAL') {
      setAssigneeId(user?.id || null);
    } else {
      setAssigneeId(null);
    }
    setTargetTeamId('');
    setTargetDeptId('');
  }, [scope, user]);

  useEffect(() => {
    if (scope === 'TEAM' && targetTeamId) {
      api.teams.get(targetTeamId)
        .then(res => {
          setTeamMembers(res.data?.members || []);
        })
        .catch(console.error);
    } else {
      setTeamMembers([]);
    }
  }, [targetTeamId, scope]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      await api.tasks.create({
        title,
        description,
        priority,
        scope,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        teamId: scope === 'TEAM' ? targetTeamId : undefined,
        departmentId: scope === 'DEPARTMENT' ? targetDeptId : undefined
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setAssigneeId(null);
      setDueDate('');
      setScope('PERSONAL');
      setTargetTeamId('');
      setTargetDeptId('');
      loadTasks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMoveStatus(task: any, action: 'START' | 'SUBMIT' | 'RESUBMIT' | 'CLOSE' | 'APPROVE' | 'REQUEST_CHANGES') {
    try {
      if (action === 'START') {
        await api.tasks.accept(task.id);
        toast.success('Task started successfully');
      } else if (action === 'SUBMIT') {
        await api.tasks.submit(task.id);
        toast.success('Task submitted for review');
      } else if (action === 'RESUBMIT') {
        await api.tasks.resubmit(task.id);
        toast.success('Task resubmitted for review');
      } else if (action === 'CLOSE') {
        await api.tasks.close(task.id);
        toast.success('Task closed successfully');
      } else if (action === 'APPROVE') {
        setReviewAction('APPROVED');
        setReviewingTaskId(task.id);
        return; // Opens CommentDialog
      } else if (action === 'REQUEST_CHANGES') {
        setReviewAction('CHANGES_REQUESTED');
        setReviewingTaskId(task.id);
        return; // Opens CommentDialog
      }
      loadTasks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task');
    }
  }

  async function handleReviewTaskConfirm(commentText: string) {
    if (!reviewingTaskId) return;

    try {
      await api.tasks.review(reviewingTaskId, {
        score: reviewAction === 'APPROVED' ? 5 : 1,
        comment: commentText,
        action: reviewAction
      });
      setReviewingTaskId(null);
      loadTasks();
      toast.success(reviewAction === 'APPROVED' ? 'Task approved successfully' : 'Changes requested on task');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit task review');
    }
  }

  function getColumnStatusKey(status: string): 'TODO' | 'IN_PROGRESS' | 'DONE' {
    if (status === 'DRAFT' || status === 'ASSIGNED') return 'TODO';
    if (status === 'APPROVED' || status === 'CLOSED') return 'DONE';
    return 'IN_PROGRESS';
  }

  const columns = {
    TODO: { label: 'To Do', bg: 'bg-zinc-100', text: 'text-zinc-700' },
    IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700' },
    DONE: { label: 'Completed', bg: 'bg-green-50', text: 'text-green-700' }
  };

  const filteredTeams = selectedDeptId
    ? teams.filter(t => t.departmentId === selectedDeptId)
    : teams;

  const employeeOptions = [
    { value: '', label: 'Unassigned' },
    ...employees.map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName} (${emp.designation || 'Employee'})`
    }))
  ];

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map(d => ({ value: d.id, label: d.name }))
  ];

  const teamOptions = [
    { value: '', label: 'All Teams' },
    ...filteredTeams.map(t => ({ value: t.id, label: t.name }))
  ];

  const totalCount = tasks.length;
  const todoCount = tasks.filter(t => getColumnStatusKey(t.status) === 'TODO').length;
  const progressCount = tasks.filter(t => getColumnStatusKey(t.status) === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(t => getColumnStatusKey(t.status) === 'DONE').length;

  const delayedTasks = tasks.filter(t => {
    const isCompleted = getColumnStatusKey(t.status) === 'DONE';
    const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
    return !isCompleted && isOverdue;
  });
  const delayedCount = delayedTasks.length;

  const filteredDelayedTasks = delayedTasks.filter((t: any) => {
    const title = (t.title || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    const assigneeName = t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}`.toLowerCase() : 'unassigned';
    const query = delayedSearch.toLowerCase();
    return title.includes(query) || desc.includes(query) || assigneeName.includes(query);
  });

  const totalDelayedPages = Math.ceil(filteredDelayedTasks.length / itemsPerPageDelayed);
  const paginatedDelayedTasks = filteredDelayedTasks.slice(
    (delayedPage - 1) * itemsPerPageDelayed,
    delayedPage * itemsPerPageDelayed
  );

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-headline-md font-extrabold text-on-surface">Tasks Center</h1>
          <p className="text-body-sm text-outline">Manage tasks, assign projects, and monitor organizational milestones.</p>
        </div>
        {!isIntern && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-blue-700 text-on-primary px-5 py-2.5 rounded-xl text-label-sm font-bold shadow-sm transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add_task</span>
            Create Task
          </button>
        )}
      </div>

      {canSeeOperations && (
        <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-label-xs font-bold text-slate-700 uppercase tracking-wider">Operational Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Department</label>
              <CustomSelect
                options={departmentOptions}
                value={selectedDeptId}
                onChange={(val) => {
                  setSelectedDeptId(val || null);
                  setSelectedTeamId(null);
                }}
                placeholder="All Departments"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Team</label>
              <CustomSelect
                options={teamOptions}
                value={selectedTeamId}
                onChange={(val) => setSelectedTeamId(val || null)}
                placeholder="All Teams"
                disabled={!selectedDeptId && departments.length > 0}
              />
            </div>
          </div>
        </div>
      )}

      {canSeeOperations && (
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-xs">
          <button
            onClick={() => setActiveTab('board')}
            className={`flex-1 py-2 text-center text-label-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'board' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tasks Board
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 text-center text-label-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Operations Dashboard
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      ) : activeTab === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(columns) as Array<keyof typeof columns>).map(statusKey => {
            const colTasks = tasks.filter(t => getColumnStatusKey(t.status) === statusKey);
            const colInfo = columns[statusKey];
            return (
              <div key={statusKey} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col min-h-[500px] shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                  <span className={`text-label-sm font-bold px-3 py-1 rounded-full ${colInfo.bg} ${colInfo.text}`}>
                    {colInfo.label}
                  </span>
                  <span className="text-[11px] text-outline font-bold">{colTasks.length} tasks</span>
                </div>

                <div className="flex-grow space-y-3 overflow-y-auto custom-scrollbar">
                  {colTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                      <span className="material-symbols-outlined text-[32px] opacity-40">assignment_turned_in</span>
                      <p className="text-[11px] font-medium mt-2">No tasks in this stage</p>
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                      >
                        <div className="space-y-1">
                          <h3 className="text-label-sm font-bold text-slate-900 line-clamp-1">{task.title}</h3>
                          <p className="text-[11px] text-outline line-clamp-2 leading-relaxed">{task.description}</p>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              task.priority === 'HIGH'
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : task.priority === 'MEDIUM'
                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {task.priority}
                            </span>
                            {task.assignee && (
                              <span
                                title={`Assigned to ${task.assignee.firstName} ${task.assignee.lastName}`}
                                className="h-5 w-5 rounded-full bg-blue-100 text-primary border border-blue-200 flex items-center justify-center font-extrabold text-[8px]"
                              >
                                {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-1.5 flex-wrap">
                            {statusKey === 'TODO' && task.assigneeId === user?.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStatus(task, 'START');
                                }}
                                className="px-2.5 py-1 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer"
                              >
                                Start
                              </button>
                            )}
                            {statusKey === 'IN_PROGRESS' && (
                              <>
                                {/* Assignee Actions */}
                                {task.assigneeId === user?.id && (
                                  <>
                                    {(task.status === 'ACCEPTED' || task.status === 'IN_PROGRESS') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMoveStatus(task, 'SUBMIT');
                                        }}
                                        className="px-2.5 py-1 bg-green-600 hover:bg-green-750 text-on-primary rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer"
                                      >
                                        Complete
                                      </button>
                                    )}
                                    {task.status === 'CHANGES_REQUESTED' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMoveStatus(task, 'RESUBMIT');
                                        }}
                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-750 text-on-primary rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer"
                                      >
                                        Resubmit
                                      </button>
                                    )}
                                    {(task.status === 'SUBMITTED' || task.status === 'RESUBMITTED' || task.status === 'IN_REVIEW') && (
                                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                        Pending Review
                                      </span>
                                    )}
                                  </>
                                )}
                                {/* Creator/Admin/HR Review Actions */}
                                {(task.creatorId === user?.id || isAdmin || isHR) && task.assigneeId !== user?.id && (
                                  <>
                                    {(task.status === 'SUBMITTED' || task.status === 'RESUBMITTED' || task.status === 'IN_REVIEW') && (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMoveStatus(task, 'APPROVE');
                                          }}
                                          className="px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded text-[9px] font-bold uppercase transition-all shadow-sm cursor-pointer"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMoveStatus(task, 'REQUEST_CHANGES');
                                          }}
                                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold uppercase transition-all shadow-sm cursor-pointer"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    )}
                                    {(task.status === 'APPROVED' || task.status === 'ACCEPTED' || task.status === 'IN_PROGRESS' || task.status === 'CHANGES_REQUESTED') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMoveStatus(task, 'CLOSE');
                                        }}
                                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-[9px] font-bold uppercase transition-all shadow-sm cursor-pointer"
                                      >
                                        Close
                                      </button>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Tasks</span>
              <span className="text-headline-md font-extrabold text-slate-900 block">{totalCount}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">To Do</span>
              <span className="text-headline-md font-extrabold text-slate-900 block">{todoCount}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">In Progress</span>
              <span className="text-headline-md font-extrabold text-primary block">{progressCount}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Completed</span>
              <span className="text-headline-md font-extrabold text-green-600 block">{completedCount}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1 col-span-2 md:col-span-1 border-l-4 border-l-red-500">
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider block">Delayed Tasks</span>
              <span className="text-headline-md font-extrabold text-red-600 block">{delayedCount}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-label-sm font-bold text-slate-900 uppercase tracking-wider">Delayed Milestones</h2>
                <p className="text-body-xs text-outline font-medium">{delayedCount} Overdue</p>
              </div>
              <div className="relative w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search delayed milestones..."
                  value={delayedSearch}
                  onChange={(e) => {
                    setDelayedSearch(e.target.value);
                    setDelayedPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                />
              </div>
            </div>

            {/* Mobile View - Sleek Actionable Cards */}
            <div className="block md:hidden space-y-4">
              {paginatedDelayedTasks.length > 0 ? (
                paginatedDelayedTasks.map(task => (
                  <div key={task.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-label-sm font-bold text-slate-900">{task.title}</h4>
                        <p className="text-[11px] text-outline mt-0.5 line-clamp-2">{task.description}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        task.priority === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-body-xs font-semibold pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <span className="h-5 w-5 rounded-full bg-blue-100 text-primary flex items-center justify-center font-extrabold text-[8px]">
                              {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                            </span>
                            <span className="text-slate-700">{task.assignee.firstName} {task.assignee.lastName}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-red-600 block">Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                        <span className="text-[9px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 mt-1 inline-block">{task.status}</span>
                      </div>
                    </div>

                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => setReviewingTaskId(task.id)}
                        className="flex-1 py-2 bg-primary hover:bg-blue-750 text-on-primary font-bold text-[10px] rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[14px]">rate_review</span>
                        Raise Delay Review
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 font-medium">
                  No overdue tasks found matching your filter.
                </div>
              )}
            </div>

            {/* Desktop View - Structured Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-label-xs font-bold text-slate-500 uppercase">Task Details</th>
                    <th className="px-6 py-4 text-label-xs font-bold text-slate-500 uppercase">Assignee</th>
                    <th className="px-6 py-4 text-label-xs font-bold text-slate-500 uppercase">Priority</th>
                    <th className="px-6 py-4 text-label-xs font-bold text-slate-500 uppercase">Due Date</th>
                    <th className="px-6 py-4 text-label-xs font-bold text-slate-500 uppercase">Current Status</th>
                    <th className="px-6 py-4 text-label-xs font-bold text-slate-500 uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-body-sm font-medium text-slate-800">
                  {paginatedDelayedTasks.length > 0 ? (
                    paginatedDelayedTasks.map(task => (
                      <tr key={task.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{task.title}</div>
                          <div className="text-[11px] text-outline line-clamp-1 mt-0.5">{task.description}</div>
                        </td>
                        <td className="px-6 py-4">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <span className="h-5 w-5 rounded-full bg-blue-100 text-primary flex items-center justify-center font-extrabold text-[8px]">
                                {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                              </span>
                              <span>{task.assignee.firstName} {task.assignee.lastName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            task.priority === 'HIGH'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-red-600 font-bold">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap inline-block">
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <ThreeDotMenu
                            actions={[
                              {
                                label: 'Raise Delay Review',
                                icon: 'rate_review',
                                onClick: () => setReviewingTaskId(task.id)
                              }
                            ]}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No overdue tasks found matching your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalDelayedPages > 1 && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-body-sm text-outline">
                  Showing {(delayedPage - 1) * itemsPerPageDelayed + 1} to {Math.min(delayedPage * itemsPerPageDelayed, filteredDelayedTasks.length)} of {filteredDelayedTasks.length} tasks
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={delayedPage === 1}
                    onClick={() => setDelayedPage(delayedPage - 1)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer text-on-surface"
                  >
                    Previous
                  </button>
                  <button
                    disabled={delayedPage === totalDelayedPages}
                    onClick={() => setDelayedPage(delayedPage + 1)}
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

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Create New Task</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-label-xs font-bold text-slate-700 uppercase">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Update client spreadsheets"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-sm transition-all outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-label-xs font-bold text-slate-700 uppercase">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed criteria..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-sm transition-all outline-none font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-label-xs font-bold text-slate-700 uppercase">Priority</label>
                  <CustomSelect
                    options={[
                      { value: 'LOW', label: 'Low' },
                      { value: 'MEDIUM', label: 'Medium' },
                      { value: 'HIGH', label: 'High' }
                    ]}
                    value={priority}
                    onChange={(val) => setPriority(val)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-label-xs font-bold text-slate-700 uppercase">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-sm transition-all outline-none font-medium text-slate-700"
                  />
                </div>
              </div>

              {/* Task Scope Selection */}
              <div className="space-y-1">
                <label className="text-label-xs font-bold text-slate-700 uppercase">Task Scope</label>
                <CustomSelect
                  options={scopeOptions}
                  value={scope}
                  onChange={(val) => setScope(val as any)}
                />
              </div>

              {/* Scope-specific dropdowns */}
              {scope === 'TEAM' && (
                <div className="space-y-1">
                  <label className="text-label-xs font-bold text-slate-700 uppercase">Target Team</label>
                  <CustomSelect
                    options={myLedTeams.map(t => ({ value: t.id, label: t.name }))}
                    value={targetTeamId}
                    onChange={(val) => setTargetTeamId(val)}
                    placeholder="Select team you lead..."
                  />
                </div>
              )}

              {scope === 'DEPARTMENT' && (
                <div className="space-y-1">
                  <label className="text-label-xs font-bold text-slate-700 uppercase">Target Department</label>
                  <CustomSelect
                    options={myHeadedDepts.map(d => ({ value: d.id, label: d.name }))}
                    value={targetDeptId}
                    onChange={(val) => setTargetDeptId(val)}
                    placeholder="Select department you head..."
                  />
                </div>
              )}

              {/* Assignee Selection */}
              {scope !== 'PERSONAL' && (
                <div className="space-y-1">
                  <label className="text-label-xs font-bold text-slate-700 uppercase">Assignee</label>
                  <CustomSelect
                    options={
                      scope === 'TEAM'
                        ? [
                            { value: '', label: 'Unassigned' },
                            ...teamMembers.map(emp => ({
                              value: emp.id,
                              label: `${emp.firstName} ${emp.lastName}`
                            }))
                          ]
                        : scope === 'DEPARTMENT'
                        ? [
                            { value: '', label: 'Unassigned' },
                            ...employees.filter(emp => emp.departmentId === targetDeptId).map(emp => ({
                              value: emp.id,
                              label: `${emp.firstName} ${emp.lastName}`
                            }))
                          ]
                        : [
                            { value: '', label: 'Unassigned' },
                            ...employees.map(emp => ({
                              value: emp.id,
                              label: `${emp.firstName} ${emp.lastName}`
                            }))
                          ]
                    }
                    value={assigneeId}
                    onChange={(val) => setAssigneeId(val || null)}
                    placeholder="Select assignee..."
                    disabled={scope === 'TEAM' ? !targetTeamId : scope === 'DEPARTMENT' ? !targetDeptId : false}
                  />
                </div>
              )}

              {scope === 'PERSONAL' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-outline font-bold uppercase block">Auto-Assignee</span>
                  <p className="text-body-sm font-semibold text-slate-700 mt-1">Assigned to yourself ({user?.firstName} {user?.lastName})</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={submitting}
                  className="flex-1"
                >
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">{selectedTask.title}</h2>
              <button onClick={() => setSelectedTask(null)} className="p-1.5 hover:bg-slate-100 rounded-full cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-outline font-bold uppercase block">Description</span>
                <p className="text-body-sm text-slate-700 mt-1 leading-relaxed font-medium">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[10px] text-outline font-bold uppercase block">Priority</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-1 inline-block ${
                    selectedTask.priority === 'HIGH'
                      ? 'bg-red-50 text-red-700'
                      : selectedTask.priority === 'MEDIUM'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-outline font-bold uppercase block">Status</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-1 inline-block ${
                    getColumnStatusKey(selectedTask.status) === 'DONE'
                      ? 'bg-green-50 text-green-700'
                      : getColumnStatusKey(selectedTask.status) === 'IN_PROGRESS'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-zinc-100 text-zinc-700'
                  }`}>
                    {selectedTask.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[10px] text-outline font-bold uppercase block">Assignee</span>
                  {selectedTask.assignee ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="h-6 w-6 rounded-full bg-blue-100 text-primary border border-blue-200 flex items-center justify-center font-bold text-[9px]">
                        {selectedTask.assignee.firstName[0]}{selectedTask.assignee.lastName[0]}
                      </span>
                      <span className="text-body-sm font-bold text-slate-800">
                        {selectedTask.assignee.firstName} {selectedTask.assignee.lastName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-body-sm text-slate-400 mt-1 inline-block font-medium">Unassigned</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-outline font-bold uppercase block">Created By</span>
                  {selectedTask.creator ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-[9px]">
                        {selectedTask.creator.firstName[0]}{selectedTask.creator.lastName[0]}
                      </span>
                      <span className="text-body-sm font-bold text-slate-800">
                        {selectedTask.creator.firstName} {selectedTask.creator.lastName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-body-sm text-slate-400 mt-1 inline-block font-medium">N/A</span>
                  )}
                </div>
              </div>

              {selectedTask.dueDate && (
                <div className="pt-2">
                  <span className="text-[10px] text-outline font-bold uppercase block">Due Date</span>
                  <span className="text-body-sm font-bold text-slate-800 mt-1 block">
                    {new Date(selectedTask.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTask(null)}
              className="mt-6 w-full py-2.5 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <CommentDialog
        isOpen={reviewingTaskId !== null}
        title={reviewAction === 'APPROVED' ? 'Approve Task' : 'Request Changes on Task'}
        placeholder={reviewAction === 'APPROVED' ? 'Provide optional approval notes...' : 'Specify what changes are needed...'}
        confirmLabel={reviewAction === 'APPROVED' ? 'Approve' : 'Request Changes'}
        onConfirm={handleReviewTaskConfirm}
        onClose={() => setReviewingTaskId(null)}
      />
    </div>
  );
}
