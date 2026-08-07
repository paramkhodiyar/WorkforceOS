'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import { useToast } from '../../lib/toast/ToastProvider';

interface RolePermissionItem {
  resource: string;
  action: string;
}

interface RoleItem {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: Array<{ id: string; resource: string; action: string }>;
  _count?: { userRoles: number };
}

const RESOURCES = [
  { id: 'employee', label: 'Employees Directory' },
  { id: 'attendance', label: 'Attendance & Geofence' },
  { id: 'leave', label: 'Leave Requests' },
  { id: 'tasks', label: 'Task Management' },
  { id: 'performance', label: 'Performance Appraisals' },
  { id: 'payroll', label: 'Payroll & Compensation' },
  { id: 'expenses', label: 'Expense Reimbursements' },
  { id: 'assets', label: 'Asset Hardware Catalog' },
  { id: 'knowledge', label: 'Knowledge Wiki' },
  { id: 'org_canvas', label: 'Org Canvas & Hierarchy' }
];

const ACTIONS = ['read', 'create', 'update', 'delete'];

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRolesUpdated?: () => void;
}

export function RoleManagementModal({ isOpen, onClose, onRolesUpdated }: RoleManagementModalProps) {
  const toast = useToast();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [roleName, setRoleName] = useState('');
  const [permissionSet, setPermissionSet] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  async function loadRoles() {
    try {
      setLoading(true);
      const res = await api.orgCanvas.getRoles();
      const loadedRoles: RoleItem[] = res.data || [];
      setRoles(loadedRoles);
      if (loadedRoles.length > 0 && !selectedRole) {
        selectRoleForEdit(loadedRoles[0]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load organization roles');
    } finally {
      setLoading(false);
    }
  }

  function selectRoleForEdit(role: RoleItem) {
    setSelectedRole(role);
    setIsCreating(false);
    setRoleName(role.name);
    const permKeys = new Set(role.permissions.map((p) => `${p.resource}:${p.action}`));
    setPermissionSet(permKeys);
  }

  function startCreateNewRole() {
    setSelectedRole(null);
    setIsCreating(true);
    setRoleName('');
    setPermissionSet(new Set(['employee:read', 'org_canvas:read']));
  }

  function togglePermission(resource: string, action: string) {
    const key = `${resource}:${action}`;
    const updated = new Set(permissionSet);
    if (updated.has(key)) {
      updated.delete(key);
    } else {
      updated.add(key);
    }
    setPermissionSet(updated);
  }

  async function handleSaveRole() {
    if (!roleName.trim()) {
      toast.error('Please specify a role name');
      return;
    }

    const permissions: RolePermissionItem[] = Array.from(permissionSet).map((key) => {
      const [resource, action] = key.split(':');
      return { resource, action };
    });

    try {
      setSubmitting(true);
      if (isCreating) {
        await api.orgCanvas.createRole({
          name: roleName.trim(),
          permissions
        });
        toast.success(`Role '${roleName}' created successfully`);
      } else if (selectedRole) {
        await api.orgCanvas.updateRole(selectedRole.id, {
          name: roleName.trim(),
          permissions
        });
        toast.success(`Role '${roleName}' permissions updated successfully`);
      }
      await loadRoles();
      onRolesUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRole(role: RoleItem) {
    if (role.isSystem) {
      toast.error('System default roles cannot be deleted');
      return;
    }
    if (!confirm(`Are you sure you want to delete role '${role.name}'?`)) return;

    try {
      setSubmitting(true);
      await api.orgCanvas.deleteRole(role.id);
      toast.success(`Role '${role.name}' deleted`);
      await loadRoles();
      onRolesUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete role');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-in-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
              Org Canvas Security
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Dynamic Roles & Access Control
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] block">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden divide-x divide-slate-100">
          {/* Left Column: Roles List */}
          <div className="w-64 p-4 space-y-2 overflow-y-auto bg-slate-50/50">
            <button
              onClick={startCreateNewRole}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mb-3"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Create Custom Role
            </button>

            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 mb-2">
              Organization Roles
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">Loading roles...</div>
            ) : (
              roles.map((role) => {
                const isSelected = !isCreating && selectedRole?.id === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => selectRoleForEdit(role)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border-blue-200 font-extrabold'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 font-bold text-xs'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs truncate">{role.name}</div>
                      <div className="text-[9px] text-slate-400 font-medium">
                        {role.isSystem ? 'System Default' : `${role._count?.userRoles || 0} Assigned`}
                      </div>
                    </div>

                    {!role.isSystem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
                        title="Delete role"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Permission Matrix Editor */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Role Name</label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                disabled={selectedRole?.isSystem}
                placeholder="e.g. Lead Architect, Compliance Officer..."
                className="w-full max-w-md px-3 py-2 text-xs font-bold bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
              />
            </div>

            {/* Permission Matrix */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Resource Permissions Matrix
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {permissionSet.size} permissions selected
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                      <th className="p-3">Module Resource</th>
                      {ACTIONS.map((action) => (
                        <th key={action} className="p-3 text-center uppercase text-[10px]">
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {RESOURCES.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{res.label}</td>
                        {ACTIONS.map((action) => {
                          const key = `${res.id}:${action}`;
                          const isChecked = permissionSet.has(key);
                          return (
                            <td key={action} className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(res.id, action)}
                                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-0 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <span className="text-[11px] text-slate-400 font-medium">
            Changes automatically sync to Redis permission cache instantly.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRole}
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving...' : isCreating ? 'Create Role' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
