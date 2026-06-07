'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [enrollResult, setEnrollResult] = useState<any>(null);

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
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setDesignation('');
      setJoinDate('');
    } catch (err: any) {
      alert(err.message || 'Failed to enroll employee');
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const query = search.toLowerCase();
    return (
      fullName.includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(query)) ||
      (emp.designation && emp.designation.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Employee Directory</h1>
          <p className="text-body-sm text-outline">Manage and view all staff profiles</p>
        </div>
        {(isAdmin || isHR) && (
          <button
            onClick={() => {
              setEnrollResult(null);
              setShowModal(true);
            }}
            className="bg-primary hover:bg-blue-700 text-on-primary px-4 py-2 rounded-lg text-label-md font-bold shadow-sm transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Enroll Employee
          </button>
        )}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-3 text-section-cap text-outline uppercase font-semibold">Employee</th>
                  <th className="px-6 py-3 text-section-cap text-outline uppercase font-semibold">Designation</th>
                  <th className="px-6 py-3 text-section-cap text-outline uppercase font-semibold">ID</th>
                  <th className="px-6 py-3 text-section-cap text-outline uppercase font-semibold">Joined Date</th>
                  <th className="px-6 py-3 text-section-cap text-outline uppercase font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-label-md">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <p className="text-label-md font-bold text-on-surface">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[11px] text-outline">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant">
                      {emp.designation || 'Staff'}
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant font-mono">
                      {emp.employeeId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant">
                      {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        emp.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant mb-6">
              <h2 className="text-headline-sm font-bold text-on-surface">Enroll New Employee</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-surface-container rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {enrollResult ? (
              <div className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
                  <p className="text-label-md font-bold">Employee successfully registered!</p>
                  <p className="text-body-sm mt-1">Please share the following credentials with the new staff member.</p>
                </div>
                <div className="space-y-3 p-4 bg-surface-container-low border border-outline-variant rounded-lg">
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
                  className="w-full py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-lg text-label-md font-bold transition-all active:scale-[0.98]"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnroll} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-sm text-outline mb-1 uppercase font-semibold">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm text-outline mb-1 uppercase font-semibold">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-sm text-outline mb-1 uppercase font-semibold">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-label-sm text-outline mb-1 uppercase font-semibold">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-label-sm text-outline mb-1 uppercase font-semibold">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-label-sm text-outline mb-1 uppercase font-semibold">Join Date</label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  />
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
                    Enroll
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
