'use client';

import React, { useState, useMemo } from 'react';

interface EmployeeDrawerSidebarProps {
  employees: any[];
  onSelectEmployee?: (empId: string) => void;
  onPromoteClick?: (emp: any) => void;
}

export function EmployeeDrawerSidebar({
  employees = [],
  onSelectEmployee,
  onPromoteClick
}: EmployeeDrawerSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNASSIGNED' | 'EXECUTIVE'>('ALL');

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = search.toLowerCase();
      const matchesSearch =
        emp.name.toLowerCase().includes(q) ||
        (emp.designation && emp.designation.toLowerCase().includes(q)) ||
        emp.email.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filter === 'UNASSIGNED') {
        return !emp.departmentId;
      }
      if (filter === 'EXECUTIVE') {
        const d = (emp.designation || '').toUpperCase();
        return d.includes('CEO') || d.includes('CTO') || d.includes('MD') || d.includes('CXO') || d.includes('VP') || emp.isRoot;
      }
      return true;
    });
  }, [employees, search, filter]);

  return (
    <>
      {/* Toggle Tab */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-20 z-40 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all"
      >
        <span className="material-symbols-outlined text-[18px] text-blue-600">badge</span>
        <span>Employees ({employees.length})</span>
        <span className="material-symbols-outlined text-[16px] text-slate-400">
          {isOpen ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {/* Slide-out Drawer */}
      {isOpen && (
        <aside className="fixed right-0 top-0 h-screen w-80 bg-white border-l border-slate-200 z-50 flex flex-col p-4 shadow-xl animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                Workforce Directory
              </span>
              <h3 className="text-sm font-extrabold text-slate-900">Drag to Assign</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] block">close</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-3 relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[16px] text-slate-400">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>

          {/* Filter Pills */}
          <div className="mt-2.5 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            {(['ALL', 'UNASSIGNED', 'EXECUTIVE'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                  filter === f
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Employee Cards List */}
          <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredEmployees.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No matching employees found
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'employee', id: emp.id }));
                  }}
                  onClick={() => onSelectEmployee?.(emp.id)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing group flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={emp.avatarUrl || '/workforceoslogo.png'}
                      alt={emp.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-white"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {emp.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{emp.designation}</div>
                      {emp.departmentName ? (
                        <div className="text-[9px] font-bold text-slate-400 truncate">
                          {emp.departmentName}
                        </div>
                      ) : (
                        <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-1 rounded">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPromoteClick?.(emp);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white transition-colors cursor-pointer flex-shrink-0"
                    title="Promote / Change Executive Title"
                  >
                    <span className="material-symbols-outlined text-[16px] block">trending_up</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      )}
    </>
  );
}
