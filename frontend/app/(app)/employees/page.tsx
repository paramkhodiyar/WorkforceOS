'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { ThreeDotMenu } from '../../../components/ui/ThreeDotMenu';
import { TableSkeleton } from '../../../components/ui/Skeleton';

export default function EmployeesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const customConfirm = useConfirm();
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

  // Wizard States
  const [activeStep, setActiveStep] = useState(0);
  const [departments, setDepartments] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);

  // Step 1: Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressPincode, setAddressPincode] = useState('');
  const [addressCountry, setAddressCountry] = useState('');

  // Step 2: Professional Info
  const [designation, setDesignation] = useState('');
  const [employeeType, setEmployeeType] = useState('FULL_TIME');
  const [departmentId, setDepartmentId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [probationEndDate, setProbationEndDate] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [shiftId, setShiftId] = useState('');

  // Step 3: Compensation
  const [salaryBand, setSalaryBand] = useState('BAND_A');
  const [basicSalary, setBasicSalary] = useState('');
  const [taxRegime, setTaxRegime] = useState('NEW');
  const [pfApplicable, setPfApplicable] = useState(true);
  const [ctcAnnual, setCtcAnnual] = useState('');

  // Step 4: Bank Details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');

  // Step 5: Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyAltPhone, setEmergencyAltPhone] = useState('');

  // Step 6: Review & Access
  const [systemRoleField, setSystemRoleField] = useState('EMPLOYEE');

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';

  async function loadEmployees() {
    try {
      const empRes = await api.employees.list();
      setEmployees(empRes.data || []);

      const deptRes = await api.departments.list().catch(() => ({ data: [] }));
      setDepartments(deptRes.data || []);

      const shiftRes = await api.attendance.shifts().catch(() => ({ data: [] }));
      setShifts(shiftRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (user) {
      const systemRole = user.systemRole;
      const userRoles = user.roles || [];
      const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER');
      const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN';
      const isLeaderOrHead = (user.departmentHead && user.departmentHead.length > 0) || (user.teamLead && user.teamLead.length > 0);
      const isManager = userRoles.some((r: any) => r.roleName === 'TEAM_MANAGER' || r.roleName === 'DEPARTMENT_HEAD');
      const isActualManager = isManager || isLeaderOrHead;

      if (!isAdmin && !isHR && !isActualManager) {
        router.push('/unauthorized');
      }
    }
  }, [user, router]);

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    setEnrollResult(null);
    try {
      const address = addressLine1 || addressCity || addressState || addressPincode ? {
        line1: addressLine1,
        line2: addressLine2 || undefined,
        city: addressCity,
        state: addressState,
        pincode: addressPincode,
        country: addressCountry || undefined
      } : undefined;

      const bankDetail = bankName || accountNumber || ifscCode || accountHolderName || panNumber ? {
        bankName,
        accountNumber,
        ifscCode,
        accountHolderName,
        panNumber,
        aadhaarLast4: aadhaarLast4 || undefined
      } : undefined;

      const emergencyContact = emergencyName || emergencyRelation || emergencyPhone ? {
        name: emergencyName,
        relation: emergencyRelation,
        phone: emergencyPhone,
        altPhone: emergencyAltPhone || undefined
      } : undefined;

      const payload: any = {
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        designation: designation || undefined,
        salaryBand: salaryBand || undefined,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        personalEmail: personalEmail || undefined,
        personalPhone: personalPhone || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender || undefined,
        bloodGroup: bloodGroup || undefined,
        address,
        employeeType: employeeType || undefined,
        departmentId: departmentId || undefined,
        managerId: managerId || undefined,
        probationEndDate: probationEndDate ? new Date(probationEndDate) : undefined,
        workLocation: workLocation || undefined,
        shiftId: shiftId || undefined,
        basicSalary: basicSalary ? Number(basicSalary) : undefined,
        taxRegime: taxRegime || undefined,
        pfApplicable: pfApplicable,
        ctcAnnual: ctcAnnual ? Number(ctcAnnual) : undefined,
        systemRole: systemRoleField || undefined,
        bankDetail,
        emergencyContact
      };

      if (editingEmployee) {
        await api.employees.update(editingEmployee.id, payload);
        loadEmployees();
        setShowModal(false);
        setEditingEmployee(null);
        toast.success('Employee updated successfully');
      } else {
        const result = await api.employees.create(payload);
        setEnrollResult(result.data);
        loadEmployees();
        toast.success('Employee enrolled successfully');
      }

      // Clear fields
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setDesignation('');
      setSalaryBand('BAND_A');
      setJoinDate('');
      setPersonalEmail('');
      setPersonalPhone('');
      setDateOfBirth('');
      setGender('');
      setBloodGroup('');
      setAddressLine1('');
      setAddressLine2('');
      setAddressCity('');
      setAddressState('');
      setAddressPincode('');
      setAddressCountry('');
      setEmployeeType('FULL_TIME');
      setDepartmentId('');
      setManagerId('');
      setProbationEndDate('');
      setWorkLocation('');
      setShiftId('');
      setBasicSalary('');
      setTaxRegime('NEW');
      setPfApplicable(true);
      setCtcAnnual('');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setAccountHolderName('');
      setPanNumber('');
      setAadhaarLast4('');
      setEmergencyName('');
      setEmergencyRelation('');
      setEmergencyPhone('');
      setEmergencyAltPhone('');
      setSystemRoleField('EMPLOYEE');
      setActiveStep(0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process employee request');
    }
  }

  function handleEditEmployee(emp: any) {
    setEditingEmployee(emp);
    setFirstName(emp.firstName || '');
    setLastName(emp.lastName || '');
    setEmail(emp.email || '');
    setPhone(emp.phone || '');
    setDesignation(emp.designation || '');
    setSalaryBand(emp.salaryBand || 'BAND_A');
    if (emp.joinDate) {
      setJoinDate(new Date(emp.joinDate).toISOString().split('T')[0]);
    } else {
      setJoinDate('');
    }

    setPersonalEmail(emp.personalEmail || '');
    setPersonalPhone(emp.personalPhone || '');
    setDateOfBirth(emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '');
    setGender(emp.gender || '');
    setBloodGroup(emp.bloodGroup || '');
    if (emp.address) {
      setAddressLine1(emp.address.line1 || '');
      setAddressLine2(emp.address.line2 || '');
      setAddressCity(emp.address.city || '');
      setAddressState(emp.address.state || '');
      setAddressPincode(emp.address.pincode || '');
      setAddressCountry(emp.address.country || '');
    } else {
      setAddressLine1('');
      setAddressLine2('');
      setAddressCity('');
      setAddressState('');
      setAddressPincode('');
      setAddressCountry('');
    }
    setEmployeeType(emp.employeeType || 'FULL_TIME');
    setDepartmentId(emp.departmentId || '');
    setManagerId(emp.managerId || '');
    setProbationEndDate(emp.probationEndDate ? new Date(emp.probationEndDate).toISOString().split('T')[0] : '');
    setWorkLocation(emp.workLocation || '');
    setShiftId(emp.shiftId || '');
    setBasicSalary(emp.basicSalary ? String(emp.basicSalary) : '');
    setTaxRegime(emp.taxRegime || 'NEW');
    setPfApplicable(emp.pfApplicable !== false);
    setCtcAnnual(emp.ctcAnnual ? String(emp.ctcAnnual) : '');

    if (emp.bankDetail) {
      setBankName(emp.bankDetail.bankName || '');
      setAccountNumber(emp.bankDetail.accountNumber || '');
      setIfscCode(emp.bankDetail.ifscCode || '');
      setAccountHolderName(emp.bankDetail.accountHolderName || '');
      setPanNumber(emp.bankDetail.panNumber || '');
      setAadhaarLast4(emp.bankDetail.aadhaarLast4 || '');
    } else {
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setAccountHolderName('');
      setPanNumber('');
      setAadhaarLast4('');
    }

    if (emp.emergencyContact) {
      setEmergencyName(emp.emergencyContact.name || '');
      setEmergencyRelation(emp.emergencyContact.relation || '');
      setEmergencyPhone(emp.emergencyContact.phone || '');
      setEmergencyAltPhone(emp.emergencyContact.altPhone || '');
    } else {
      setEmergencyName('');
      setEmergencyRelation('');
      setEmergencyPhone('');
      setEmergencyAltPhone('');
    }

    setSystemRoleField(emp.systemRole || 'EMPLOYEE');
    setEnrollResult(null);
    setActiveStep(0);
    setShowModal(true);
  }

  async function handleDeleteEmployee(id: string) {
    const ok = await customConfirm({
      title: 'Delete Employee Record',
      message: 'Are you sure you want to delete this employee?',
      variant: 'danger',
      confirmLabel: 'Delete Employee',
    });
    if (!ok) return;
    try {
      await api.employees.delete(id);
      loadEmployees();
      toast.success('Employee deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete employee');
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
              setPersonalEmail('');
              setPersonalPhone('');
              setDateOfBirth('');
              setGender('');
              setBloodGroup('');
              setAddressLine1('');
              setAddressLine2('');
              setAddressCity('');
              setAddressState('');
              setAddressPincode('');
              setAddressCountry('');
              setEmployeeType('FULL_TIME');
              setDepartmentId('');
              setManagerId('');
              setProbationEndDate('');
              setWorkLocation('');
              setShiftId('');
              setBasicSalary('');
              setTaxRegime('NEW');
              setPfApplicable(true);
              setCtcAnnual('');
              setBankName('');
              setAccountNumber('');
              setIfscCode('');
              setAccountHolderName('');
              setPanNumber('');
              setAadhaarLast4('');
              setEmergencyName('');
              setEmergencyRelation('');
              setEmergencyPhone('');
              setEmergencyAltPhone('');
              setSystemRoleField('EMPLOYEE');
              setEnrollResult(null);
              setActiveStep(0);
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
          <TableSkeleton rows={8} cols={7} />
        ) : (
          <>
            {/* Mobile View - Sleek Profile Cards */}
            <div className="block md:hidden space-y-4">
              {paginatedEmployees.length === 0 ? (
                <div className="py-12 text-center text-body-sm text-outline">
                  No employees match your active filter settings.
                </div>
              ) : (
                paginatedEmployees.map(emp => (
                  <div key={emp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:border-slate-350 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-50 text-primary border border-blue-100 flex items-center justify-center font-bold text-label-md">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <h4 className="text-label-sm font-bold text-slate-900">{emp.firstName} {emp.lastName}</h4>
                          <p className="text-[10px] text-outline uppercase tracking-wider font-semibold">{emp.designation || 'Staff Member'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        emp.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-slate-100 text-slate-655 border-slate-200'
                      }`}>
                        {emp.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-body-xs font-semibold pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-mono">ID: {emp.employeeId || 'N/A'}</span>
                      <span className="text-slate-700">{emp.department?.name || 'Operations'}</span>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => router.push(`/profile?id=${emp.id}`)}
                        className="flex-1 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        View Profile
                      </button>
                      {(isAdmin || isHR) && (
                        <>
                          <button
                            onClick={() => handleEditEmployee(emp)}
                            className="py-2 px-3 bg-primary hover:bg-blue-750 text-on-primary font-bold text-[10px] rounded-lg uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-650 border border-red-150 font-bold text-[10px] rounded-lg uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View - Structured Table */}
            <div className="hidden md:block overflow-x-auto">
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
                              : 'bg-slate-100 text-slate-655 border-slate-200'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <ThreeDotMenu
                            actions={[
                              {
                                label: 'View Details',
                                icon: 'visibility',
                                onClick: () => router.push(`/profile?id=${emp.id}`)
                              },
                              ...((isAdmin || isHR) ? [
                                {
                                  label: 'Edit Details',
                                  icon: 'edit',
                                  onClick: () => handleEditEmployee(emp)
                                },
                                {
                                  label: 'Delete',
                                  icon: 'delete',
                                  className: 'text-red-600 hover:bg-red-50/50',
                                  onClick: () => handleDeleteEmployee(emp.id)
                                }
                              ] : [])
                            ]}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
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
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
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
                    <span className="text-body-sm font-bold text-on-surface font-mono">{enrollResult.employee?.email || enrollResult.employee?.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline font-bold uppercase block">Employee ID</span>
                    <span className="text-body-sm font-bold text-on-surface font-mono">{enrollResult.employee?.employeeId}</span>
                  </div>
                  {enrollResult.tempPassword && (
                    <div>
                      <span className="text-[10px] text-outline font-bold uppercase block">Temporary Password</span>
                      <span className="text-body-sm font-bold text-primary font-mono">{enrollResult.tempPassword}</span>
                    </div>
                  )}
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
              <form onSubmit={handleEnroll} className="space-y-6">
                {/* Stepper progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 overflow-x-auto gap-4 scrollbar-none">
                    {['Personal', 'Professional', 'Compensation', 'Bank Details', 'Emergency', 'Access & Review'].map((stepName, idx) => (
                      <button
                        key={stepName}
                        type="button"
                        onClick={() => {
                          if (idx > 0 && (!firstName.trim() || !lastName.trim() || !email.trim())) {
                            toast.warning('Please fill out first name, last name, and work email before moving to other steps.');
                            return;
                          }
                          setActiveStep(idx);
                        }}
                        className={`text-body-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                          activeStep === idx
                            ? 'border-primary text-primary'
                            : 'border-transparent text-outline hover:text-on-surface'
                        }`}
                      >
                        {idx + 1}. {stepName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 0: Personal Info */}
                {activeStep === 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">First Name *</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Work Email *</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Work Phone</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Personal Email</label>
                        <input
                          type="email"
                          value={personalEmail}
                          onChange={(e) => setPersonalEmail(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Personal Phone</label>
                        <input
                          type="text"
                          value={personalPhone}
                          onChange={(e) => setPersonalPhone(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">DOB</label>
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium animate-none"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Blood Group</label>
                        <input
                          type="text"
                          placeholder="e.g. O+"
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h3 className="text-label-sm font-bold text-slate-800 uppercase tracking-wider">Address Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Address Line 1</label>
                          <input
                            type="text"
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Address Line 2</label>
                          <input
                            type="text"
                            value={addressLine2}
                            onChange={(e) => setAddressLine2(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">City</label>
                          <input
                            type="text"
                            value={addressCity}
                            onChange={(e) => setAddressCity(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">State</label>
                          <input
                            type="text"
                            value={addressState}
                            onChange={(e) => setAddressState(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Pincode</label>
                          <input
                            type="text"
                            value={addressPincode}
                            onChange={(e) => setAddressPincode(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Country</label>
                          <input
                            type="text"
                            value={addressCountry}
                            onChange={(e) => setAddressCountry(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Professional Info */}
                {activeStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Designation</label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Employee Type</label>
                        <select
                          value={employeeType}
                          onChange={(e) => setEmployeeType(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        >
                          <option value="FULL_TIME">Full Time</option>
                          <option value="PART_TIME">Part Time</option>
                          <option value="INTERN">Intern</option>
                          <option value="CONTRACTOR">Contractor</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Department</label>
                        <select
                          value={departmentId}
                          onChange={(e) => setDepartmentId(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        >
                          <option value="">Select Department</option>
                          {departments.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Manager / Supervisor</label>
                        <select
                          value={managerId}
                          onChange={(e) => setManagerId(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        >
                          <option value="">Select Manager</option>
                          {employees
                            .filter((emp: any) => !editingEmployee || emp.id !== editingEmployee.id)
                            .map((emp: any) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.firstName} {emp.lastName} ({emp.designation || 'Staff'})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Join Date</label>
                        <input
                          type="date"
                          value={joinDate}
                          onChange={(e) => setJoinDate(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Probation End Date</label>
                        <input
                          type="date"
                          value={probationEndDate}
                          onChange={(e) => setProbationEndDate(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Work Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Scranton HQ"
                          value={workLocation}
                          onChange={(e) => setWorkLocation(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Shift Configuration</label>
                        <select
                          value={shiftId}
                          onChange={(e) => setShiftId(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        >
                          <option value="">Select Shift Config</option>
                          {shifts.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.checkInStart} - {s.checkInDeadline} deadline)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Compensation */}
                {activeStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Salary Band</label>
                        <select
                          value={salaryBand}
                          onChange={(e) => setSalaryBand(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        >
                          <option value="BAND_A">Band A (Executive)</option>
                          <option value="BAND_B">Band B (Senior)</option>
                          <option value="BAND_C">Band C (Lead / Manager)</option>
                          <option value="BAND_D">Band D (Director / Head)</option>
                          <option value="BAND_E">Band E (VP / C-Suite)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Basic Monthly Salary (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={basicSalary}
                          onChange={(e) => setBasicSalary(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Tax Regime</label>
                        <select
                          value={taxRegime}
                          onChange={(e) => setTaxRegime(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        >
                          <option value="NEW">New Tax Regime</option>
                          <option value="OLD">Old Tax Regime</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">CTC Annual (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={ctcAnnual}
                          onChange={(e) => setCtcAnnual(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pfApplicable}
                          onChange={(e) => setPfApplicable(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-body-sm font-semibold text-slate-800">Provident Fund (PF) Contribution Applicable</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3: Bank Details */}
                {activeStep === 3 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-800">
                      <span className="material-symbols-outlined text-[20px] shrink-0">lock</span>
                      <p className="text-body-xs font-medium">Bank details and PAN are securely encrypted at rest using industry-grade AES-256-GCM. These fields are masked for authorized views.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Account Holder Name</label>
                        <input
                          type="text"
                          value={accountHolderName}
                          onChange={(e) => setAccountHolderName(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Bank Name</label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">IFSC Code</label>
                        <input
                          type="text"
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Account Number</label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">PAN Number</label>
                        <input
                          type="text"
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Aadhaar Last 4 Digits</label>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="e.g. 1234"
                          value={aadhaarLast4}
                          onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Emergency Contact */}
                {activeStep === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Contact Name</label>
                        <input
                          type="text"
                          value={emergencyName}
                          onChange={(e) => setEmergencyName(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Relation</label>
                        <input
                          type="text"
                          placeholder="e.g. Spouse, Parent, Sibling"
                          value={emergencyRelation}
                          onChange={(e) => setEmergencyRelation(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Phone Number</label>
                        <input
                          type="text"
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Alternative Phone Number</label>
                        <input
                          type="text"
                          value={emergencyAltPhone}
                          onChange={(e) => setEmergencyAltPhone(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Access & Review */}
                {activeStep === 5 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">System Permission Role</label>
                      <select
                        value={systemRoleField}
                        onChange={(e) => setSystemRoleField(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium"
                      >
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="ORG_ADMIN">Organization Admin</option>
                        <option value="HR">HR Specialist / Manager</option>
                        <option value="FINANCE">Finance Manager</option>
                        <option value="DEPARTMENT_HEAD">Department Head</option>
                        <option value="MANAGER">Manager / Lead</option>
                        <option value="EMPLOYEE">Employee</option>
                        <option value="AUDITOR">Auditor</option>
                        <option value="INTERN">Intern</option>
                      </select>
                    </div>

                    <div className="pt-2 space-y-3">
                      <h3 className="text-label-sm font-bold text-slate-800 uppercase tracking-wider">Review Summary Checklist</h3>
                      <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl text-body-xs font-semibold text-slate-600">
                        <div>
                          <span className="text-slate-400 block font-normal text-[10px] uppercase">Name</span>
                          <span className="text-slate-800">{firstName || '-'} {lastName || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-normal text-[10px] uppercase">Work Email</span>
                          <span className="text-slate-800 font-mono">{email || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-normal text-[10px] uppercase">Designation</span>
                          <span className="text-slate-800">{designation || 'Not Assigned'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-normal text-[10px] uppercase">Salary Band / Monthly</span>
                          <span className="text-slate-800">{salaryBand} {basicSalary ? `/ ₹${basicSalary}` : ''}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-normal text-[10px] uppercase">Bank Account</span>
                          <span className="text-slate-800 font-mono">
                            {accountNumber ? `Masked (${accountNumber.slice(-4)})` : 'Not Provided'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-normal text-[10px] uppercase">Emergency Phone</span>
                          <span className="text-slate-800 font-mono">{emergencyPhone || 'Not Provided'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingEmployee(null);
                      }}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-on-surface rounded-xl text-label-md font-bold transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Cancel
                    </button>
                    {activeStep > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveStep(prev => prev - 1)}
                        className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-label-md font-bold transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Back
                      </button>
                    )}
                  </div>
                  {activeStep < 5 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeStep === 0) {
                          if (!firstName.trim() || !lastName.trim() || !email.trim()) {
                            toast.warning('Please fill out all required fields: First Name, Last Name, and Work Email.');
                            return;
                          }
                        }
                        if (activeStep === 3) {
                          const startedBank = bankName || accountNumber || ifscCode || accountHolderName || panNumber || aadhaarLast4;
                          if (startedBank && (!bankName || !accountNumber || !ifscCode || !accountHolderName || !panNumber)) {
                            toast.warning('If providing bank details, please fill out all required fields: Bank Name, Account Number, IFSC Code, Account Holder Name, and PAN.');
                            return;
                          }
                        }
                        if (activeStep === 4) {
                          const startedEmergency = emergencyName || emergencyRelation || emergencyPhone || emergencyAltPhone;
                          if (startedEmergency && (!emergencyName || !emergencyRelation || !emergencyPhone)) {
                            toast.warning('If providing emergency contact, please fill out Name, Relation, and Phone Number.');
                            return;
                          }
                        }
                        setActiveStep(prev => prev + 1);
                      }}
                      className="px-6 py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-md font-bold transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-md font-bold transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {editingEmployee ? 'Save Changes' : 'Enroll'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
