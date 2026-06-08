'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';

export default function EmployeesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [enrollResult, setEnrollResult] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<any | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [salaryBand, setSalaryBand] = useState('BAND_A');
  const [joinDate, setJoinDate] = useState('');

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  async function loadEmployees() {
    try {
      const response = await api.employees.list();
      setEmployees(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    setEnrollResult(null);
    try {
      if (editingEmployee) {
        await api.employees.update(editingEmployee.id, {
          firstName,
          lastName,
          email,
          phone,
          designation,
          salaryBand,
          joinDate: joinDate ? new Date(joinDate) : undefined
        });
        loadEmployees();
        setShowModal(false);
        setEditingEmployee(null);
      } else {
        const result = await api.employees.create({
          firstName,
          lastName,
          email,
          phone,
          designation,
          salaryBand,
          joinDate: joinDate ? new Date(joinDate) : undefined
        });
        setEnrollResult(result.data);
        loadEmployees();
      }
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setDesignation('');
      setJoinDate('');
    } catch (err: any) {
      alert(err.message || 'Failed to process employee request');
    }
  }

  function handleEditEmployee(emp: any) {
    setEditingEmployee(emp);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setEmail(emp.email);
    setPhone(emp.phone || '');
    setDesignation(emp.designation || '');
    setSalaryBand(emp.salaryBand || 'BAND_A');
    if (emp.joinDate) {
      setJoinDate(new Date(emp.joinDate).toISOString().split('T')[0]);
    } else {
      setJoinDate('');
    }
    setEnrollResult(null);
    setShowModal(true);
  }

  async function handleDeleteEmployee(id: string) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.employees.delete(id);
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee');
    }
  }

  function handleSelectRow(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  function handleSelectAll() {
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map(emp => emp.id));
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const query = search.toLowerCase();
    
    const matchesSearch = 
      fullName.includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(query)) ||
      (emp.designation && emp.designation.toLowerCase().includes(query));
      
    const matchesDept = departmentFilter === 'ALL' || emp.department?.name === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const departmentsList = Array.from(new Set(employees.map(emp => emp.department?.name).filter(Boolean)));

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Employee Directory</h1>
          <p className="text-body-sm text-outline">Manage and monitor all workforce members in your organization.</p>
        </div>
        {(isAdmin || isHR) && (
          <button
            onClick={() => {
              setEditingEmployee(null);
              setFirstName('');
              setLastName('');
              setEmail('');
              setPhone('');
              setDesignation('');
              setSalaryBand('BAND_A');
              setJoinDate('');
              setEnrollResult(null);
              setShowModal(true);
            }}
            className="bg-primary hover:bg-blue-700 text-on-primary px-5 py-2.5 rounded-xl text-label-md font-bold shadow-sm transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Employee
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">search</span>
            <input
              type="text"
              placeholder="Filter by name, ID or role..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 md:flex-none p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm text-on-surface font-semibold focus:border-primary"
            >
              <option value="ALL">All Departments</option>
              {departmentsList.map((dept: any) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 md:flex-none p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-body-sm text-on-surface font-semibold focus:border-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="w-12 px-6 py-4">
                    <input
                      type="checkbox"
                      checked={filteredEmployees.length > 0 && selectedIds.length === filteredEmployees.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-section-cap text-outline uppercase font-semibold">Employee Name</th>
                  <th className="px-6 py-4 text-section-cap text-outline uppercase font-semibold">Employee ID</th>
                  <th className="px-6 py-4 text-section-cap text-outline uppercase font-semibold">Department</th>
                  <th className="px-6 py-4 text-section-cap text-outline uppercase font-semibold">Designation</th>
                  <th className="px-6 py-4 text-section-cap text-outline uppercase font-semibold">Status</th>
                  <th className="px-6 py-4 text-section-cap text-outline uppercase font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-body-sm text-outline">
                      No employees match your active filter settings.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(emp.id)}
                          onChange={() => handleSelectRow(emp.id)}
                          className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-50 text-primary border border-blue-100 flex items-center justify-center font-bold text-label-md">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div>
                            <p className="text-label-md font-bold text-on-surface">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[11px] text-outline font-medium">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-body-sm text-on-surface-variant font-semibold font-mono">
                        {emp.employeeId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-body-sm text-on-surface-variant font-medium">
                        {emp.department?.name || 'Operations'}
                      </td>
                      <td className="px-6 py-4 text-body-sm text-on-surface-variant font-medium">
                        {emp.designation || 'Staff Member'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          emp.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === emp.id ? null : emp.id);
                          }}
                          className="p-1 hover:bg-slate-100 rounded-lg text-outline hover:text-on-surface transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
 
                        {activeMenuId === emp.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-6 mt-1 w-44 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-20 text-left">
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  router.push(`/profile?id=${emp.id}`);
                                }}
                                className="w-full px-4 py-2 text-body-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                View Details
                              </button>
                              {(isAdmin || isHR) && (
                                <>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleEditEmployee(emp);
                                    }}
                                    className="w-full px-4 py-2 text-body-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                    Edit Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleDeleteEmployee(emp.id);
                                    }}
                                    className="w-full px-4 py-2 text-body-sm text-red-600 hover:bg-red-50/50 transition-colors flex items-center gap-2 font-medium cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-body-sm text-outline">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer text-on-surface"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-body-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer text-on-surface"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-6 z-50 animate-bounce-short">
          <span className="text-label-sm font-semibold text-slate-300">
            {selectedIds.length} {selectedIds.length === 1 ? 'employee' : 'employees'} selected
          </span>
          <div className="h-4 w-[1px] bg-slate-800"></div>
          <div className="flex gap-2">
            <button className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer">
              Export
            </button>
            <button className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer">
              Bulk Edit
            </button>
            <button className="px-3.5 py-1.5 bg-red-950 text-red-300 border border-red-900/50 hover:bg-red-900 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer">
              Archive
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-headline-sm font-bold text-on-surface">
                {editingEmployee ? 'Edit Employee Details' : 'Add New Employee'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingEmployee(null);
                }}
                className="p-1.5 hover:bg-slate-50 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {enrollResult ? (
              <div className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl">
                  <p className="text-label-md font-bold">Employee successfully registered!</p>
                  <p className="text-body-sm mt-1">Please share the following credentials with the new staff member.</p>
                </div>
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <span className="text-[10px] text-outline font-bold uppercase block">Email</span>
                    <span className="text-body-sm font-bold text-on-surface font-mono">{enrollResult.employee.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline font-bold uppercase block">Employee ID</span>
                    <span className="text-body-sm font-bold text-on-surface font-mono">{enrollResult.employee.employeeId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline font-bold uppercase block">Temporary Password</span>
                    <span className="text-body-sm font-bold text-primary font-mono">{enrollResult.tempPassword}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEnrollResult(null);
                    setShowModal(false);
                  }}
                  className="w-full py-3.5 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-md font-bold transition-all active:scale-[0.98] cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnroll} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Join Date</label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingEmployee(null);
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-on-surface rounded-xl text-label-md font-bold transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-md font-bold transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {editingEmployee ? 'Save Changes' : 'Enroll'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
