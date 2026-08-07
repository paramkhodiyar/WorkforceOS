'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const PALETTE = [
  { border: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8', borderLight: '#bfdbfe' },
  { border: '#10b981', bg: '#ecfdf5', text: '#047857', borderLight: '#a7f3d0' },
  { border: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9', borderLight: '#ddd6fe' },
  { border: '#f59e0b', bg: '#fffbeb', text: '#b45309', borderLight: '#fde68a' },
  { border: '#14b8a6', bg: '#f0fdfa', text: '#0f766e', borderLight: '#99f6e4' },
  { border: '#6366f1', bg: '#eef2ff', text: '#4338ca', borderLight: '#c7d2fe' },
  { border: '#f43f5e', bg: '#fff1f2', text: '#be123c', borderLight: '#fecdd3' },
  { border: '#06b6d4', bg: '#ecfeff', text: '#0e7490', borderLight: '#a5f3fc' },
];

function getDepartmentColor(deptId: string) {
  let hash = 0;
  for (let i = 0; i < deptId.length; i++) {
    hash = deptId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

interface DepartmentNodeProps {
  data: {
    id: string;
    name: string;
    head?: { firstName: string; lastName: string; avatarUrl?: string | null } | null;
    userCount: number;
    teamCount: number;
    isCollapsed?: boolean;
    onToggleExpand?: (id: string) => void;
    onSelectNode?: (id: string, type: 'department') => void;
  };
}

export const DepartmentNode = memo(({ data }: DepartmentNodeProps) => {
  const color = getDepartmentColor(data.id);

  return (
    <div
      onClick={() => data.onSelectNode?.(data.id, 'department')}
      className="relative min-w-72 p-4 bg-white rounded-2xl border-2 transition-all cursor-pointer select-none border-slate-200 hover:border-slate-400"
      style={{
        backgroundColor: color.bg,
        borderColor: color.borderLight,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-slate-400 !border-2 !border-white"
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color.border }}
          />
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Department
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 truncate tracking-tight">
              {data.name}
            </h3>
          </div>
        </div>

        {/* Headcount Badge & Toggle */}
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg border bg-white text-slate-700 uppercase tracking-wider"
            style={{ borderColor: color.borderLight }}
          >
            {data.userCount} Members
          </span>

          {data.onToggleExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onToggleExpand?.(data.id);
              }}
              className="p-1 rounded-lg bg-white border hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              style={{ borderColor: color.borderLight }}

            >
              <span className="material-symbols-outlined text-[16px] block">
                {data.isCollapsed ? 'expand_more' : 'expand_less'}
              </span>
            </button>
          )}
        </div>
      </div>

      {data.head && (
        <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center gap-2">
          <img
            src={data.head.avatarUrl || '/workforceoslogo.png'}
            alt={`${data.head.firstName} ${data.head.lastName}`}
            className="w-5 h-5 rounded-full object-cover border border-slate-200 bg-white"
          />
          <span className="text-[11px] text-slate-600 font-medium truncate">
            Head: <strong className="text-slate-800 font-bold">{data.head.firstName} {data.head.lastName}</strong>
          </span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-slate-400 !border-2 !border-white"
      />
    </div>
  );
});

DepartmentNode.displayName = 'DepartmentNode';
