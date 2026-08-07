'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const PALETTE = [
  { border: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' }, // Blue
  { border: '#10b981', bg: '#ecfdf5', text: '#047857' }, // Emerald
  { border: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9' }, // Violet
  { border: '#f59e0b', bg: '#fffbeb', text: '#b45309' }, // Amber
  { border: '#14b8a6', bg: '#f0fdfa', text: '#0f766e' }, // Teal
  { border: '#6366f1', bg: '#eef2ff', text: '#4338ca' }, // Indigo
  { border: '#f43f5e', bg: '#fff1f2', text: '#be123c' }, // Rose
  { border: '#06b6d4', bg: '#ecfeff', text: '#0e7490' }, // Cyan
];

function getDepartmentColor(deptId?: string | null) {
  if (!deptId) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < deptId.length; i++) {
    hash = deptId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

interface EmployeeNodeProps {
  data: {
    id: string;
    name: string;
    designation: string;
    avatarUrl?: string | null;
    status: string;
    departmentId?: string | null;
    departmentName?: string | null;
    roles?: Array<{ id: string; name: string }>;
    isOnLeaveToday?: boolean;
    isRoot?: boolean;
    isHighlighted?: boolean;
    isDimmed?: boolean;
    isDeleted?: boolean;
    onSelectNode?: (id: string, type: 'employee') => void;
  };
}

export const EmployeeNode = memo(({ data }: EmployeeNodeProps) => {
  const color = getDepartmentColor(data.departmentId);
  const isInactive = data.isDeleted || data.status === 'INACTIVE' || data.status === 'SUSPENDED';

  return (
    <div
      onClick={() => data.onSelectNode?.(data.id, 'employee')}
      className={`relative w-64 p-3 bg-white rounded-xl border-2 transition-all cursor-pointer select-none ${
        data.isHighlighted
          ? 'ring-2 ring-blue-600 border-blue-600 opacity-100 z-30'
          : data.isDimmed
          ? 'opacity-30 border-slate-200'
          : 'border-slate-200 hover:border-slate-400 opacity-100'
      } ${isInactive ? 'bg-slate-50 opacity-60' : ''}`}
      style={{
        borderLeftColor: color.border,
        borderLeftWidth: '4px',
      }}
    >
      {/* Top Handle for Reporting Connectors */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-slate-400 !border-2 !border-white"
      />

      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={data.avatarUrl || '/workforceoslogo.png'}
            alt={data.name}
            className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-50"
          />
          {/* Status Dot */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
              data.isOnLeaveToday
                ? 'bg-amber-500'
                : data.status === 'ACTIVE' && !data.isDeleted
                ? 'bg-emerald-500'
                : 'bg-slate-400'
            }`}
            title={data.isOnLeaveToday ? 'On Leave' : data.status}
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-slate-900 truncate tracking-tight">{data.name}</h4>
            {data.isRoot && (
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                CEO
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 truncate font-medium">{data.designation}</p>

          {data.departmentName && (
            <p
              className="text-[9px] font-bold truncate mt-0.5 uppercase tracking-wider"
              style={{ color: color.text }}
            >
              {data.departmentName}
            </p>
          )}
        </div>
      </div>

      {/* Role Badges */}
      {data.roles && data.roles.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
          {data.roles.slice(0, 2).map((role) => (
            <span
              key={role.id}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-tight"
            >
              {role.name}
            </span>
          ))}
          {data.roles.length > 2 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
              +{data.roles.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Bottom Handle for Subordinate Connectors */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-slate-400 !border-2 !border-white"
      />
    </div>
  );
});

EmployeeNode.displayName = 'EmployeeNode';
