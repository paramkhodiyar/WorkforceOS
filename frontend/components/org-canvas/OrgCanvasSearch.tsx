'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api/client';

interface OrgCanvasSearchProps {
  onSelectResult: (result: { id: string; type: 'employee' | 'department' | 'team' }) => void;
}

export function OrgCanvasSearch({ onSelectResult }: OrgCanvasSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ employees: any[]; departments: any[]; teams: any[] }>({
    employees: [],
    departments: [],
    teams: []
  });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ employees: [], departments: [], teams: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      api.orgCanvas
        .search(query)
        .then((res) => {
          setResults(res.data || { employees: [], departments: [], teams: [] });
          setIsOpen(true);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const hasResults =
    results.employees.length > 0 || results.departments.length > 0 || results.teams.length > 0;

  return (
    <div ref={searchRef} className="relative w-80 z-30">
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search employee, department, or team..."
          className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-xl p-2 space-y-3 z-50">
          {loading ? (
            <div className="p-3 text-center text-xs text-slate-400 font-medium">Searching...</div>
          ) : !hasResults ? (
            <div className="p-3 text-center text-xs text-slate-400 font-medium">
              No matching hierarchy node found
            </div>
          ) : (
            <>
              {/* Employees */}
              {results.employees.length > 0 && (
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1">
                    Employees
                  </div>
                  {results.employees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        onSelectResult({ id: emp.id, type: 'employee' });
                        setIsOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <img
                        src={emp.avatarUrl || '/workforceoslogo.png'}
                        alt={emp.name}
                        className="w-7 h-7 rounded-md object-cover border border-slate-200 bg-slate-100"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">{emp.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{emp.designation}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Departments */}
              {results.departments.length > 0 && (
                <div className="border-t border-slate-100 pt-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1">
                    Departments
                  </div>
                  {results.departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => {
                        onSelectResult({ id: dept.id, type: 'department' });
                        setIsOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-blue-600">
                        corporate_fare
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">{dept.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Teams */}
              {results.teams.length > 0 && (
                <div className="border-t border-slate-100 pt-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1">
                    Teams
                  </div>
                  {results.teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => {
                        onSelectResult({ id: team.id, type: 'team' });
                        setIsOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-indigo-600">
                        groups
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">{team.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
