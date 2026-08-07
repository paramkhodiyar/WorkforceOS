'use client';

import React, { memo } from 'react';
import Link from 'next/link';
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

interface NestedDepartmentNodeProps {
  data: {
    id: string;
    name: string;
    head?: { firstName: string; lastName: string; avatarUrl?: string | null; designation?: string | null } | null;
    userCount: number;
    teamCount: number;
    directMembers?: any[];
    teams?: any[];
    onSelectNode?: (id: string, type: 'department') => void;
  };
}

export const NestedDepartmentNode = memo(({ data }: NestedDepartmentNodeProps) => {
  const color = getDepartmentColor(data.id);
  const directMembers = data.directMembers || [];
  const teams = data.teams || [];

  return (
    <div
      data-id={`dept-${data.id}`}
      onClick={() => data.onSelectNode?.(data.id, 'department')}
      className="relative w-[360px] bg-white rounded-2xl border-2 transition-all select-none shadow-xs group"
      style={{
        backgroundColor: '#ffffff',
        borderColor: color.borderLight,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3.5 h-3.5 !bg-slate-700 !border-2 !border-white"
      />

      {/* Header Banner */}
      <div
        className="p-4 rounded-t-xl border-b flex items-center justify-between"
        style={{ backgroundColor: color.bg, borderColor: color.borderLight }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: color.border }}
          />
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              DEPARTMENT CONTAINER
            </span>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              {data.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg border bg-white text-slate-800"
            style={{ borderColor: color.borderLight }}
          >
            {data.userCount} Members
          </span>
          <Link
            href="/tasks"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors"
            title="Open Department Task Board"
          >
            <span className="material-symbols-outlined text-[16px] block">assignment</span>
          </Link>
        </div>
      </div>

      {/* Department Head */}
      {data.head && (
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={data.head.avatarUrl || '/workforceoslogo.png'}
              alt={`${data.head.firstName} ${data.head.lastName}`}
              className="w-6 h-6 rounded-full object-cover border border-slate-200 bg-white"
            />
            <div className="min-w-0">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 block">
                Department Head
              </span>
              <span className="text-xs font-bold text-slate-900 truncate block">
                {data.head.firstName} {data.head.lastName}
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-slate-500">{data.head.designation}</span>
        </div>
      )}

      {/* Body Content */}
      <div className="p-4 space-y-4">
        {/* Direct Department Members (Not in any sub-team) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Direct Members ({directMembers.length})
            </span>
            <span className="text-[9px] text-slate-400 italic">Not in any sub-team</span>
          </div>

          {directMembers.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No direct members. Drag employees here to assign.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {directMembers.map((emp) => (
                <div
                  key={emp.id}
                  data-id={`emp-${emp.id}`}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={emp.avatarUrl || '/workforceoslogo.png'}
                      alt={emp.name}
                      className="w-5 h-5 rounded-full object-cover border border-slate-200 bg-white"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{emp.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{emp.designation}</div>
                    </div>
                  </div>
                  <Link
                    href="/tasks"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    Tasks →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nested Teams Containers */}
        {teams.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
              Sub-Teams ({teams.length})
            </span>
            <div className="space-y-2">
              {teams.map((team) => (
                <div
                  key={team.id}
                  data-id={`team-${team.id}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-indigo-600">
                        groups
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">{team.name}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {team.memberCount} Members
                    </span>
                  </div>

                  {team.lead && (
                    <div className="text-[10px] text-slate-500 font-medium">
                      Lead: <strong className="text-slate-800">{team.lead.firstName} {team.lead.lastName}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3.5 h-3.5 !bg-slate-700 !border-2 !border-white"
      />
    </div>
  );
});

NestedDepartmentNode.displayName = 'NestedDepartmentNode';
