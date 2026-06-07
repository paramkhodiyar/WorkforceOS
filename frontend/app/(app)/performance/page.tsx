'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';

interface Goal {
  id: string;
  title: string;
  category: string;
  progress: number;
  dueDate: string;
}

export default function PerformancePage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', title: 'Achieve 95% test coverage on frontend package', category: 'Engineering', progress: 80, dueDate: '2026-06-30' },
    { id: '2', title: 'Complete compliance audit preparations', category: 'Compliance', progress: 100, dueDate: '2026-05-15' },
    { id: '3', title: 'Deliver UI/UX design specs for mobile layouts', category: 'Design', progress: 45, dueDate: '2026-07-15' }
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Engineering');
  const [newDueDate, setNewDueDate] = useState('');

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
  const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');

  const mockReviews = [
    { id: 'rev-1', cycle: 'H1 2026 Mid-Year Review', reviewer: 'Sarah Jenkins', rating: 'Exceeds Expectations', status: 'Completed', date: '2026-06-01' },
    { id: 'rev-2', cycle: 'FY 2025 Annual Review', reviewer: 'Michael Cho', rating: 'Meets Expectations', status: 'Completed', date: '2025-12-15' }
  ];

  const mockTeamPerformance = [
    { id: 'emp-1', name: 'Alice Vance', rating: 4.8, completedGoals: 5, activeGoals: 2, status: 'Completed' },
    { id: 'emp-2', name: 'Bobby Vance', rating: 4.2, completedGoals: 4, activeGoals: 3, status: 'In Review' },
    { id: 'emp-3', name: 'Charlie Dave', rating: 3.9, completedGoals: 3, activeGoals: 4, status: 'Pending Self Assessment' }
  ];

  function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGoal: Goal = {
      id: Date.now().toString(),
      title: newTitle,
      category: newCategory,
      progress: 0,
      dueDate: newDueDate || new Date().toISOString().split('T')[0]
    };

    setGoals([...goals, newGoal]);
    setNewTitle('');
    setNewDueDate('');
  }

  function handleProgressChange(id: string, progress: number) {
    setGoals(goals.map(g => g.id === id ? { ...g, progress: Math.min(100, Math.max(0, progress)) } : g));
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Performance Management</h1>
        <p className="text-body-sm text-outline">Track professional objectives, review cycles, and performance feedback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Objectives & Key Results (OKRs)</h2>
            </div>

            <div className="space-y-4 mb-6">
              {goals.length === 0 ? (
                <p className="text-body-sm text-outline text-center py-6">No performance objectives configured yet.</p>
              ) : (
                goals.map(goal => (
                  <div key={goal.id} className="p-4 bg-surface-container-low border border-outline-variant rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {goal.category}
                        </span>
                        <h4 className="text-body-md font-bold text-on-surface mt-1.5">{goal.title}</h4>
                      </div>
                      <span className="text-body-sm text-outline font-mono">Due {goal.dueDate}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-body-sm">
                        <span className="text-outline">Progress</span>
                        <span className="font-semibold text-on-surface font-mono">{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary h-2 transition-all duration-300"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => handleProgressChange(goal.id, goal.progress - 10)}
                        className="p-1 border border-outline-variant rounded hover:bg-surface-container transition-colors text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <button
                        onClick={() => handleProgressChange(goal.id, goal.progress + 10)}
                        className="p-1 border border-outline-variant rounded hover:bg-surface-container transition-colors text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddGoal} className="pt-4 border-t border-outline-variant space-y-4">
              <h3 className="text-label-sm font-bold text-on-surface uppercase">Create Objective</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter objective title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
                <div className="w-full sm:w-1/3">
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary hover:bg-blue-700 text-on-primary px-5 py-2.5 rounded-lg text-label-md font-bold shadow-sm transition-all active:scale-[0.98] w-full sm:w-auto"
                >
                  Add Objective
                </button>
              </div>
            </form>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
            <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">My Review History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Review Cycle</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Evaluator</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Rating</th>
                    <th className="px-4 py-2.5 text-section-cap text-outline uppercase font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-body-sm">
                  {mockReviews.map(rev => (
                    <tr key={rev.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 font-semibold text-on-surface">
                        <div>
                          <p>{rev.cycle}</p>
                          <p className="text-[10px] text-outline mt-0.5">Signed off on {rev.date}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">{rev.reviewer}</td>
                      <td className="px-4 py-3 font-medium text-primary">{rev.rating}</td>
                      <td className="px-4 py-3">
                        <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          {rev.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
            <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Quick Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg text-center">
                <p className="text-[10px] text-outline font-bold uppercase">Average Score</p>
                <p className="text-headline-md font-bold text-on-surface mt-1">4.5 / 5.0</p>
              </div>
              <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg text-center">
                <p className="text-[10px] text-outline font-bold uppercase">Objectives</p>
                <p className="text-headline-md font-bold text-on-surface mt-1">
                  {goals.filter(g => g.progress === 100).length} / {goals.length}
                </p>
              </div>
            </div>
          </div>

          {(isAdmin || isHR || isManager) && (
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
              <h2 className="text-label-md font-bold text-on-surface uppercase tracking-wider mb-4">Team Performance Logs</h2>
              <div className="space-y-4">
                {mockTeamPerformance.map(emp => (
                  <div key={emp.id} className="p-3 bg-surface-container-low border border-outline-variant rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-label-md font-bold text-on-surface">{emp.name}</p>
                      <span className="text-body-sm font-semibold font-mono text-primary">{emp.rating} / 5.0</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-outline">
                      <span>Goals: {emp.completedGoals} completed / {emp.activeGoals} active</span>
                      <span className="font-semibold">{emp.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
