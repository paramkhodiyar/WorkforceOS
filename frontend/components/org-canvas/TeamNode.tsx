'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface TeamNodeProps {
  data: {
    id: string;
    name: string;
    departmentName?: string | null;
    lead?: { firstName: string; lastName: string; avatarUrl?: string | null } | null;
    memberCount: number;
    isCollapsed?: boolean;
    onToggleExpand?: (id: string) => void;
    onSelectNode?: (id: string, type: 'team') => void;
  };
}

export const TeamNode = memo(({ data }: TeamNodeProps) => {
  return (
    <div
      onClick={() => data.onSelectNode?.(data.id, 'team')}
      className="relative min-w-64 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-400 transition-all cursor-pointer select-none"
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-slate-400 !border-2 !border-white"
      />

      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[18px] text-slate-500 flex-shrink-0">
            groups
          </span>
          <div className="min-w-0">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
              Team
            </span>
            <h4 className="text-xs font-extrabold text-slate-900 truncate tracking-tight">
              {data.name}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {data.memberCount} Members
          </span>

          {data.onToggleExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onToggleExpand?.(data.id);
              }}
              className="p-0.5 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px] block">
                {data.isCollapsed ? 'expand_more' : 'expand_less'}
              </span>
            </button>
          )}
        </div>
      </div>

      {data.lead && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
          <img
            src={data.lead.avatarUrl || '/workforceoslogo.png'}
            alt={`${data.lead.firstName} ${data.lead.lastName}`}
            className="w-4 h-4 rounded-full object-cover border border-slate-200 bg-white"
          />
          <span className="text-[10px] text-slate-500 font-medium truncate">
            Lead: <strong className="text-slate-700 font-bold">{data.lead.firstName} {data.lead.lastName}</strong>
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

TeamNode.displayName = 'TeamNode';
