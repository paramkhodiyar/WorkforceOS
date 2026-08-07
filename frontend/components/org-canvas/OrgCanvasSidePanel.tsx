'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api/client';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useToast } from '../../lib/toast/ToastProvider';

interface SelectedNodeData {
  type: 'employee' | 'department' | 'team';
  node: any;
}

interface OrgCanvasSidePanelProps {
  selectedNode: SelectedNodeData | null;
  allRoles?: any[];
  onClose: () => void;
  onFocusNode?: (nodeId: string) => void;
  onRefreshData?: () => void;
}

export function OrgCanvasSidePanel({
  selectedNode,
  allRoles = [],
  onClose,
  onFocusNode,
  onRefreshData
}: OrgCanvasSidePanelProps) {
  const { user, features } = useAuth();
  const toast = useToast();
  const [assigningRole, setAssigningRole] = useState(false);

  if (!selectedNode) return null;

  const activeFeatures = features && features.length > 0 ? features : [
    'employees', 'attendance', 'leave', 'tasks', 'performance', 'payroll', 'expenses', 'assets', 'knowledge', 'calendar', 'org-canvas'
  ];

  const systemRole = user?.systemRole;
  const isSuperAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN' || user?.originalRole === 'SYS_OWNER';

  const { type, node } = selectedNode;

  async function handleToggleUserRole(roleId: string, isCurrentlyAssigned: boolean) {
    if (!node || type !== 'employee') return;
    try {
      setAssigningRole(true);
      await api.orgCanvas.assignUserRole({
        userId: node.id,
        roleId,
        action: isCurrentlyAssigned ? 'remove' : 'add'
      });
      toast.success(isCurrentlyAssigned ? 'Role removed from employee' : 'Role assigned to employee');
      onRefreshData?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user role');
    } finally {
      setAssigningRole(false);
    }
  }

  return (
    <aside className="fixed right-0 top-0 h-screen w-96 bg-white border-l border-slate-200 z-50 flex flex-col p-6 overflow-y-auto animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {type} details
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] block">close</span>
        </button>
      </div>

      {/* Body: Employee Node */}
      {type === 'employee' && (
        <div className="mt-6 space-y-6 flex-1">
          {/* Main User Card */}
          <div className="flex items-start gap-4">
            <img
              src={node.avatarUrl || '/workforceoslogo.png'}
              alt={node.name}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-slate-50 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-extrabold text-slate-900 truncate">{node.name}</h2>
              <p className="text-xs text-slate-500 font-medium">{node.designation}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{node.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  node.isOnLeaveToday
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : node.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    node.isOnLeaveToday ? 'bg-amber-500' : node.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />
                  {node.isOnLeaveToday ? 'On Leave' : node.status}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {node.employeeType || 'FULL_TIME'}
                </span>
              </div>
            </div>
          </div>

          {/* Manager Chip */}
          {node.managerId && node.managerName && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Reports To
              </span>
              <button
                onClick={() => onFocusNode?.(node.managerId)}
                className="flex items-center justify-between w-full text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">
                    account_tree
                  </span>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {node.managerName}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-blue-600 group-hover:underline">
                  Focus Node →
                </span>
              </button>
            </div>
          )}

          {/* Attributes List */}
          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-bold text-slate-900">{node.departmentName || 'Unassigned'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Teams</span>
              <span className="font-bold text-slate-900 text-right">
                {node.teams && node.teams.length > 0
                  ? node.teams.map((t: any) => t.name).join(', ')
                  : 'None'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Work Location</span>
              <span className="font-bold text-slate-900">{node.workLocation || 'Office'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Date of Joining</span>
              <span className="font-bold text-slate-900">
                {node.joiningDate ? new Date(node.joiningDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Assigned System & Custom Roles */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Assigned Roles & Access
              </h4>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {node.roles && node.roles.length > 0 ? (
                node.roles.map((r: any) => (
                  <span
                    key={r.id}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"
                  >
                    {r.name}
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleToggleUserRole(r.id, true)}
                        disabled={assigningRole}
                        className="hover:text-red-600 transition-colors ml-1 cursor-pointer"
                        title="Remove role"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No custom roles assigned</span>
              )}
            </div>

            {/* Role Assign Dropdown for Super Admin */}
            {isSuperAdmin && allRoles.length > 0 && (
              <div className="mt-3 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Assign New Role:
                </span>
                <div className="flex flex-wrap gap-1">
                  {allRoles.map((r: any) => {
                    const isAssigned = node.roles?.some((ur: any) => ur.id === r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleToggleUserRole(r.id, !!isAssigned)}
                        disabled={assigningRole}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                          isAssigned
                            ? 'bg-slate-200 text-slate-800 border-slate-300'
                            : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200'
                        }`}
                      >
                        {isAssigned ? `✓ ${r.name}` : `+ ${r.name}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons Row */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Quick Deep Links
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {activeFeatures.includes('employees') && (
                <Link
                  href="/employees"
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center flex flex-col items-center gap-1 text-slate-700 hover:text-slate-900 transition-all font-bold text-[11px]"
                >
                  <span className="material-symbols-outlined text-[18px] text-blue-600">badge</span>
                  View Profile
                </Link>
              )}

              {activeFeatures.includes('attendance') && (
                <Link
                  href="/attendance"
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center flex flex-col items-center gap-1 text-slate-700 hover:text-slate-900 transition-all font-bold text-[11px]"
                >
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">
                    event_available
                  </span>
                  Attendance
                </Link>
              )}

              {activeFeatures.includes('leave') && (
                <Link
                  href="/leave"
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center flex flex-col items-center gap-1 text-slate-700 hover:text-slate-900 transition-all font-bold text-[11px]"
                >
                  <span className="material-symbols-outlined text-[18px] text-amber-600">
                    event_busy
                  </span>
                  Leave Records
                </Link>
              )}

              {activeFeatures.includes('tasks') && (
                <Link
                  href="/tasks"
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center flex flex-col items-center gap-1 text-slate-700 hover:text-slate-900 transition-all font-bold text-[11px]"
                >
                  <span className="material-symbols-outlined text-[18px] text-indigo-600">
                    assignment
                  </span>
                  Tasks
                </Link>
              )}

              {activeFeatures.includes('performance') && (
                <Link
                  href="/performance"
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center flex flex-col items-center gap-1 text-slate-700 hover:text-slate-900 transition-all font-bold text-[11px]"
                >
                  <span className="material-symbols-outlined text-[18px] text-violet-600">
                    trending_up
                  </span>
                  Performance
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Body: Department / Team Node */}
      {(type === 'department' || type === 'team') && (
        <div className="mt-6 space-y-6 flex-1">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {type} Container
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{node.name}</h2>
            {node.head && (
              <p className="text-xs text-slate-600 font-medium mt-1">
                Head/Lead: <strong className="text-slate-800 font-bold">{node.head.firstName} {node.head.lastName}</strong>
              </p>
            )}
          </div>

          {/* Aggregate Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Headcount</span>
              <span className="text-lg font-extrabold text-slate-900 mt-1 block">
                {type === 'department' ? node.userCount : node.memberCount}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Sub-teams</span>
              <span className="text-lg font-extrabold text-slate-900 mt-1 block">
                {type === 'department' ? node.teamCount : 1}
              </span>
            </div>
          </div>

          {/* HR & Ops Metrics */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Live Department Metrics
            </h4>

            <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
              <span className="text-slate-600 font-medium">On Leave Today</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                0 employees
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
              <span className="text-slate-600 font-medium">Pending Performance Reviews</span>
              <span className="font-bold text-slate-800">0</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
              <span className="text-slate-600 font-medium">Open Requisitions</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                Coming soon
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
