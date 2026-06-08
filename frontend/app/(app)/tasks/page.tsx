'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api/client';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [selectedTask, setSelectedTask] = useState<any>(null);

  async function loadTasks() {
    try {
      const response = await api.tasks.list();
      setTasks(response.data || []);
      const empRes = await api.employees.list();
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.tasks.create({
        title,
        description,
        priority,
        assigneeId: assigneeId || undefined
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setAssigneeId('');
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  }

  async function handleMoveStatus(id: string, newStatus: string) {
    try {
      await api.tasks.updateStatus(id, newStatus);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  }

  const columns = {
    TODO: { label: 'To Do', bg: 'bg-zinc-100', text: 'text-zinc-700' },
    IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700' },
    DONE: { label: 'Completed', bg: 'bg-green-50', text: 'text-green-700' }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Tasks Board</h1>
          <p className="text-body-sm text-outline">Manage team assignments and progress tracking</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-blue-700 text-on-primary px-4 py-2 rounded-lg text-label-md font-bold shadow-sm transition-all active:scale-[0.98] flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add_task</span>
          Create Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(columns) as Array<keyof typeof columns>).map(statusKey => {
          const colTasks = tasks.filter(t => t.status === statusKey);
          const colInfo = columns[statusKey];
          return (
            <div key={statusKey} className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex flex-col h-full min-h-[500px]">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
                <span className={`text-label-md font-bold px-2.5 py-0.5 rounded-full ${colInfo.bg} ${colInfo.text}`}>
                  {colInfo.label}
                </span>
                <span className="text-[11px] text-outline font-bold">{colTasks.length} tasks</span>
              </div>

              <div className="flex-grow space-y-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <p className="text-[11px] text-outline py-8 text-center italic">No tasks in this stage</p>
                ) : (
                  colTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-4 bg-surface-container-low border border-outline-variant rounded-lg hover:border-outline hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <h3 className="text-label-sm font-bold text-on-surface line-clamp-1">{task.title}</h3>
                        <p className="text-[11px] text-outline line-clamp-2 mt-1">{task.description}</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                            task.priority === 'HIGH'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : task.priority === 'MEDIUM'
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              : 'bg-zinc-50 text-zinc-700 border border-zinc-200'
                          }`}>
                            {task.priority}
                          </span>
                          {task.assignee && (
                            <span 
                              title={`Assigned to ${task.assignee.firstName} ${task.assignee.lastName}`}
                              className="h-5 w-5 rounded-full bg-blue-50 text-primary border border-blue-100 flex items-center justify-center font-extrabold text-[8px]"
                            >
                              {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-1">
                          {statusKey === 'TODO' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveStatus(task.id, 'IN_PROGRESS');
                              }}
                              className="px-2 py-1 bg-primary text-on-primary rounded text-[9px] font-bold uppercase transition-all"
                            >
                              Start
                            </button>
                          )}
                          {statusKey === 'IN_PROGRESS' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveStatus(task.id, 'DONE');
                              }}
                              className="px-2 py-1 bg-green-600 text-on-primary rounded text-[9px] font-bold uppercase transition-all"
                            >
                              Complete
                            </button>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant mb-6">
              <h2 className="text-headline-sm font-bold text-on-surface">Create New Task</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-surface-container rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-label-sm text-outline mb-1 uppercase font-semibold">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-label-sm text-outline mb-1 uppercase font-semibold">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div>
                <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.designation || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-outline-variant flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-label-md font-bold transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-label-md font-bold transition-all active:scale-[0.98]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant mb-6">
              <h2 className="text-headline-sm font-bold text-on-surface">{selectedTask.title}</h2>
              <button onClick={() => setSelectedTask(null)} className="p-1.5 hover:bg-surface-container rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-outline font-bold uppercase block">Description</span>
                <p className="text-body-sm text-on-surface-variant mt-1 leading-relaxed">{selectedTask.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[10px] text-outline font-bold uppercase block">Priority</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-1 inline-block ${
                    selectedTask.priority === 'HIGH'
                      ? 'bg-red-50 text-red-700'
                      : selectedTask.priority === 'MEDIUM'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-zinc-50 text-zinc-700'
                  }`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-outline font-bold uppercase block">Status</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-1 inline-block ${
                    selectedTask.status === 'DONE'
                      ? 'bg-green-50 text-green-700'
                      : selectedTask.status === 'IN_PROGRESS'
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
                      <span className="h-6 w-6 rounded-full bg-blue-50 text-primary border border-blue-100 flex items-center justify-center font-bold text-[9px]">
                        {selectedTask.assignee.firstName[0]}{selectedTask.assignee.lastName[0]}
                      </span>
                      <span className="text-body-sm font-semibold text-on-surface">
                        {selectedTask.assignee.firstName} {selectedTask.assignee.lastName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-body-sm text-outline mt-1 inline-block">Unassigned</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-outline font-bold uppercase block">Created By</span>
                  {selectedTask.creator ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="h-6 w-6 rounded-full bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-[9px]">
                        {selectedTask.creator.firstName[0]}{selectedTask.creator.lastName[0]}
                      </span>
                      <span className="text-body-sm font-semibold text-on-surface">
                        {selectedTask.creator.firstName} {selectedTask.creator.lastName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-body-sm text-outline mt-1 inline-block">N/A</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTask(null)}
              className="mt-6 w-full py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-label-md font-bold transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
