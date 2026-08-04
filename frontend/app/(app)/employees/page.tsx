'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { ThreeDotMenu } from '../../../components/ui/ThreeDotMenu';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import PaginationControls from '../../../components/ui/PaginationControls';

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
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
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
  const [sickLeaves, setSickLeaves] = useState('12');
  const [casualLeaves, setCasualLeaves] = useState('12');
  const [earnedLeaves, setEarnedLeaves] = useState('12');

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
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showPanNumber, setShowPanNumber] = useState(false);

  // Step 5: Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyAltPhone, setEmergencyAltPhone] = useState('');

  // Step 6: Review & Access
  const [systemRoleField, setSystemRoleField] = useState('EMPLOYEE');

  // Admin Reset Password states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetEmployee, setResetTargetEmployee] = useState<any>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showNewEmployeePassword, setShowNewEmployeePassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccessPassword, setResetSuccessPassword] = useState('');

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

      // Inline check handles non-admin access cleanly without redirecting
    }
  }, [user]);

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    setEnrollResult(null);
    setEnrollSubmitting(true);
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

      const leaveAllocations = [
        { leaveType: 'SICK', allocated: Number(sickLeaves) || 0 },
        { leaveType: 'CASUAL', allocated: Number(casualLeaves) || 0 },
        { leaveType: 'EARNED', allocated: Number(earnedLeaves) || 0 }
      ];

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
        emergencyContact,
        leaveAllocations
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
      setSickLeaves('12');
      setCasualLeaves('12');
      setEarnedLeaves('12');
      setActiveStep(0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process employee request');
    } finally {
      setEnrollSubmitting(false);
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

    if (emp.leaveBalances && emp.leaveBalances.length > 0) {
      const sickBal = emp.leaveBalances.find((b: any) => b.leaveType === 'SICK');
      const casualBal = emp.leaveBalances.find((b: any) => b.leaveType === 'CASUAL');
      const earnedBal = emp.leaveBalances.find((b: any) => b.leaveType === 'EARNED');
      setSickLeaves(sickBal ? String(sickBal.allocated) : '12');
      setCasualLeaves(casualBal ? String(casualBal.allocated) : '12');
      setEarnedLeaves(earnedBal ? String(earnedBal.allocated) : '12');
    } else {
      setSickLeaves('12');
      setCasualLeaves('12');
      setEarnedLeaves('12');
    }
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

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTargetEmployee) return;
    if (!adminPassword || !newEmployeePassword) {
      toast.error('Both administrator and new employee passwords are required');
      return;
    }
    if (newEmployeePassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    setResetSubmitting(true);
    try {
      await api.employees.resetPassword(resetTargetEmployee.id, {
        adminPassword,
        newPassword: newEmployeePassword
      });
      setResetSuccessPassword(newEmployeePassword);
      setAdminPassword('');
      setNewEmployeePassword('');
      toast.success(`Password for ${resetTargetEmployee.firstName} reset successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset employee password');
    } finally {
      setResetSubmitting(false);
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
              setSickLeaves('12');
              setCasualLeaves('12');
              setEarnedLeaves('12');
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
            <div className="block md:hidden p-5 space-y-4">
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
                              ...(isAdmin ? [
                                {
                                  label: 'Reset Password',
                                  icon: 'lock_reset',
                                  onClick: () => {
                                    setResetTargetEmployee(emp);
                                    setAdminPassword('');
                                    setNewEmployeePassword('');
                                    setResetSuccessPassword('');
                                    setShowResetModal(true);
                                  }
                                }
                              ] : []),
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

        <div className="p-4 border-t border-slate-100">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEmployees.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">First Name *</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Work Email *</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Work Phone</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Personal Email</label>
                        <input
                          type="email"
                          value={personalEmail}
                          onChange={(e) => setPersonalEmail(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Personal Phone</label>
                        <input
                          type="text"
                          value={personalPhone}
                          onChange={(e) => setPersonalPhone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <CustomDatePicker
                          label="Date of Birth"
                          value={dateOfBirth}
                          onChange={(val) => setDateOfBirth(val)}
                        />
                      </div>
                      <div>
                        <CustomSelect
                          label="Gender"
                          value={gender}
                          onChange={(val) => setGender(val)}
                          placeholder="Select Gender"
                          options={[
                            { value: 'Male', label: 'Male' },
                            { value: 'Female', label: 'Female' },
                            { value: 'Other', label: 'Other' },
                          ]}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <CustomSelect
                          label="Blood Group"
                          value={bloodGroup}
                          onChange={(val) => setBloodGroup(val)}
                          placeholder="Select Blood Group"
                          options={['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => ({ value: bg, label: bg }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h3 className="text-label-sm font-bold text-slate-800 uppercase tracking-wider">Address Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                          <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Address Line 1</label>
                          <input
                            type="text"
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Address Line 2</label>
                          <input
                            type="text"
                            value={addressLine2}
                            onChange={(e) => setAddressLine2(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">City</label>
                          <input
                            type="text"
                            value={addressCity}
                            onChange={(e) => setAddressCity(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">State</label>
                          <input
                            type="text"
                            value={addressState}
                            onChange={(e) => setAddressState(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Pincode</label>
                          <input
                            type="text"
                            value={addressPincode}
                            onChange={(e) => setAddressPincode(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Country</label>
                          <input
                            type="text"
                            value={addressCountry}
                            onChange={(e) => setAddressCountry(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Professional Info */}
                {activeStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Designation</label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                      <div>
                        <CustomSelect
                          label="Employee Type"
                          value={employeeType}
                          onChange={(val) => setEmployeeType(val)}
                          options={[
                            { value: 'FULL_TIME', label: 'Full Time' },
                            { value: 'PART_TIME', label: 'Part Time' },
                            { value: 'INTERN', label: 'Intern' },
                            { value: 'CONTRACTOR', label: 'Contractor' },
                          ]}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <CustomSelect
                          label="Department"
                          value={departmentId}
                          onChange={(val) => setDepartmentId(val)}
                          placeholder="Select Department"
                          options={departments.map((d: any) => ({ value: d.id, label: d.name }))}
                        />
                      </div>
                      <div>
                        <CustomSelect
                          label="Manager / Supervisor"
                          value={managerId}
                          onChange={(val) => setManagerId(val)}
                          placeholder="Select Manager"
                          options={employees
                            .filter((emp: any) => !editingEmployee || emp.id !== editingEmployee.id)
                            .map((emp: any) => ({
                              value: emp.id,
                              label: `${emp.firstName} ${emp.lastName} (${emp.designation || 'Staff'})`
                            }))}
                        />
                      </div>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <CustomDatePicker
                          label="Join Date"
                          value={joinDate}
                          onChange={(val) => setJoinDate(val)}
                        />
                      </div>
                      <div>
                        <CustomDatePicker
                          label="Probation End Date"
                          value={probationEndDate}
                          onChange={(val) => setProbationEndDate(val)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Work Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Scranton HQ"
                          value={workLocation}
                          onChange={(e) => setWorkLocation(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                      <div>
                        <CustomSelect
                          label="Shift Configuration"
                          value={shiftId}
                          onChange={(val) => setShiftId(val)}
                          placeholder="Select Shift Config"
                          options={shifts.map((s: any) => ({
                            value: s.id,
                            label: `${s.name} (${s.checkInStart} - ${s.checkInDeadline} deadline)`
                          }))}
                        />
                      </div>
                    </div>

                    {/* Leave Allocations */}
                    <div className="space-y-3 pt-2">
                      <h3 className="text-label-sm font-bold text-slate-800 uppercase tracking-wider">Leave Allocations (Days per Year)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Sick Leaves</label>
                          <input
                            type="number"
                            min="0"
                            value={sickLeaves}
                            onChange={(e) => setSickLeaves(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Casual Leaves</label>
                          <input
                            type="number"
                            min="0"
                            value={casualLeaves}
                            onChange={(e) => setCasualLeaves(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Earned Leaves</label>
                          <input
                            type="number"
                            min="0"
                            value={earnedLeaves}
                            onChange={(e) => setEarnedLeaves(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Compensation */}
                {activeStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <CustomSelect
                          label="Salary Band"
                          value={salaryBand}
                          onChange={(val) => setSalaryBand(val)}
                          options={[
                            { value: 'BAND_A', label: 'Band A (VP / C-Suite)' },
                            { value: 'BAND_B', label: 'Band B (Director / Head)' },
                            { value: 'BAND_C', label: 'Band C (Lead / Manager)' },
                            { value: 'BAND_D', label: 'Band D (Associate / Staff)' },
                            { value: 'BAND_E', label: 'Band E (Intern / Junior)' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Basic Monthly Salary (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={basicSalary}
                          onChange={(e) => setBasicSalary(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <CustomSelect
                          label="Tax Regime"
                          value={taxRegime}
                          onChange={(val) => setTaxRegime(val)}
                          options={[
                            { value: 'NEW', label: 'New Tax Regime' },
                            { value: 'OLD', label: 'Old Tax Regime' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">CTC Annual (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={ctcAnnual}
                          onChange={(e) => setCtcAnnual(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Account Holder Name</label>
                        <input
                          type="text"
                          value={accountHolderName}
                          onChange={(e) => setAccountHolderName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Bank Name</label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">IFSC Code</label>
                        <input
                          type="text"
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Account Number</label>
                        <div className="relative">
                          <input
                            type={showAccountNumber ? "text" : "password"}
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium font-mono text-slate-800 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAccountNumber(!showAccountNumber)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showAccountNumber ? "visibility_off" : "visibility"}
                            </span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">PAN Number</label>
                        <div className="relative">
                          <input
                            type={showPanNumber ? "text" : "password"}
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value)}
                            className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium font-mono text-slate-800 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPanNumber(!showPanNumber)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showPanNumber ? "visibility_off" : "visibility"}
                            </span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Aadhaar Last 4 Digits</label>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="e.g. 1234"
                          value={aadhaarLast4}
                          onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
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
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Contact Name</label>
                        <input
                          type="text"
                          value={emergencyName}
                          onChange={(e) => setEmergencyName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Relation</label>
                        <input
                          type="text"
                          placeholder="e.g. Spouse, Parent, Sibling"
                          value={emergencyRelation}
                          onChange={(e) => setEmergencyRelation(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Phone Number</label>
                        <input
                          type="text"
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">Alternative Phone Number</label>
                        <input
                          type="text"
                          value={emergencyAltPhone}
                          onChange={(e) => setEmergencyAltPhone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Access & Review */}
                {activeStep === 5 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">System Permission Role</label>
                      <select
                        value={systemRoleField}
                        onChange={(e) => setSystemRoleField(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium text-slate-800 shadow-sm"
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
                          <span className="text-slate-800">
                            {salaryBand === 'BAND_A' ? 'Band A (VP / C-Suite)'
                             : salaryBand === 'BAND_B' ? 'Band B (Director / Head)'
                             : salaryBand === 'BAND_C' ? 'Band C (Lead / Manager)'
                             : salaryBand === 'BAND_D' ? 'Band D (Associate / Staff)'
                             : 'Band E (Intern / Junior)'}
                            {basicSalary ? ` / ₹${Number(basicSalary).toLocaleString()}` : ''}
                          </span>
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
                      disabled={enrollSubmitting}
                      className="px-6 py-3 bg-primary hover:bg-blue-700 text-on-primary rounded-xl text-label-md font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                      {enrollSubmitting ? (editingEmployee ? 'Saving...' : 'Enrolling...') : (editingEmployee ? 'Save Changes' : 'Enroll')}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showResetModal && resetTargetEmployee && (
        <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">lock_reset</span>
                Reset Password
              </h2>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetTargetEmployee(null);
                  setResetSuccessPassword('');
                }}
                className="p-1.5 hover:bg-slate-50 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {resetSuccessPassword ? (
              <div className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl">
                  <p className="text-label-md font-bold">Password reset successfully!</p>
                  <p className="text-xs mt-1">Please copy the new credentials below and share them securely with the employee.</p>
                </div>

                <div className="space-y-3 p-4 bg-slate-50 border border-slate-150 rounded-xl">
                  <div>
                    <span className="text-[10px] text-outline font-bold uppercase block">Employee Name</span>
                    <span className="text-body-sm font-bold text-on-surface">
                      {resetTargetEmployee.firstName} {resetTargetEmployee.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline font-bold uppercase block">New Password</span>
                    <div className="flex items-center justify-between mt-1 p-2.5 bg-white border border-slate-200 rounded-lg">
                      <span className="text-body-sm font-mono font-bold text-primary select-all">
                        {resetSuccessPassword}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(resetSuccessPassword);
                          toast.success('Password copied to clipboard');
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setShowResetModal(false);
                      setResetTargetEmployee(null);
                      setResetSuccessPassword('');
                    }}
                    className="px-6 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl text-label-md font-bold transition-all cursor-pointer shadow-md"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs leading-relaxed">
                  <p className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    Security Verification Required
                  </p>
                  <p className="mt-1 text-slate-700">
                    To reset the password for <strong>{resetTargetEmployee.firstName} {resetTargetEmployee.lastName}</strong>, please verify your own administrator credentials. This action will terminate all other active sessions for this employee.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">
                    Your Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium font-mono text-slate-800 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showAdminPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-outline uppercase font-bold tracking-wider block mb-1.5">
                    New Employee Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewEmployeePassword ? "text" : "password"}
                      required
                      value={newEmployeePassword}
                      onChange={(e) => setNewEmployeePassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium font-mono text-slate-800 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewEmployeePassword(!showNewEmployeePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showNewEmployeePassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[10px] text-outline font-semibold">Choose a strong, unique password</span>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = `DM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
                        setNewEmployeePassword(generated);
                        setShowNewEmployeePassword(true);
                      }}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Generate Secure Password
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setResetTargetEmployee(null);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-on-surface rounded-xl text-label-md font-bold transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl text-label-md font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {resetSubmitting ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : null}
                    Confirm Reset
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
