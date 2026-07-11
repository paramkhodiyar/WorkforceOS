'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { LandingFooter } from '../../components/layout/LandingFooter';
import { AmbientGrid } from '../../components/ui/AmbientGrid';
import { api } from '../../lib/api/client';

interface EmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  departmentName?: string;
  managerEmail?: string;
  salaryBand?: string;
  basicSalary?: number;
  ctcAnnual?: number;
  taxRegime?: string;
}

interface ValidatedRow {
  index: number;
  data: EmployeeData;
  errors: Record<string, string>;
  isValid: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Step 1: Firm Setup
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('Workforce123!');
  const [slugModified, setSlugModified] = useState(false);

  // Step 2: Excel Upload
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');

  // Step 3: Column Mapping
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    departmentName: '',
    managerEmail: '',
  });

  // Step 4: Verification & Editing
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [globalDataError, setGlobalDataError] = useState('');

  // Step 5: Key Personnel
  const [orgAdminEmail, setOrgAdminEmail] = useState('');
  const [hrEmails, setHrEmails] = useState<string[]>([]);
  const [financeEmails, setFinanceEmails] = useState<string[]>([]);

  // Step 6: Confirmation & Redirect
  const [countdown, setCountdown] = useState(5);
  const [successResponse, setSuccessResponse] = useState<any>(null);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugModified && orgName) {
      const generated = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setOrgSlug(generated);
    }
  }, [orgName, slugModified]);

  // Read Excel File
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setSubmitError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (data) {
          const wb = XLSX.read(data, { type: 'array' });
          setWorkbook(wb);
          setSheetNames(wb.SheetNames);
          setSelectedSheet(wb.SheetNames[0]);
          parseSheet(wb, wb.SheetNames[0]);
        }
      } catch (err: any) {
        setSubmitError(`Failed to read spreadsheet: ${err.message || err}`);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const parseSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as any[];
    setRawRows(rows);

    if (rows.length === 0) {
      setExcelHeaders([]);
      setSubmitError('The selected sheet is empty.');
      return;
    }

    // Extract all headers
    const allHeaders = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => allHeaders.add(key));
    });
    const headersArray = Array.from(allHeaders);
    setExcelHeaders(headersArray);

    // Initial Guessing of mappings
    const mapping: Record<string, string> = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      designation: '',
      departmentName: '',
      managerEmail: '',
    };

    headersArray.forEach((h) => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (lower.includes('firstname') || lower === 'fname' || lower.includes('first')) {
        mapping.firstName = h;
      } else if (lower.includes('lastname') || lower === 'lname' || lower.includes('last')) {
        mapping.lastName = h;
      } else if ((lower === 'name' || lower === 'fullname' || lower === 'employee') && !mapping.firstName) {
        mapping.firstName = h; // Fallback
      } else if (lower === 'email' || lower.includes('emailid') || lower.includes('emailaddress') || lower === 'mail') {
        mapping.email = h;
      } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) {
        mapping.phone = h;
      } else if (lower.includes('designation') || lower.includes('jobtitle') || lower === 'role') {
        mapping.designation = h;
      } else if (lower.includes('department') || lower === 'dept') {
        mapping.departmentName = h;
      } else if (lower.includes('manageremail') || lower.includes('managermail') || lower.includes('reportsto') || lower.includes('manager')) {
        mapping.managerEmail = h;
      }
    });

    setColumnMapping(mapping);
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      parseSheet(workbook, sheetName);
    }
  };

  // Move from Mapping (Step 3) to Verification (Step 4)
  const applyColumnMapping = () => {
    if (!columnMapping.firstName || !columnMapping.email) {
      setSubmitError('First Name and Email mappings are required.');
      return;
    }
    setSubmitError('');

    const formatted = rawRows.map((row, idx) => {
      // If we only mapped firstName and not lastName, and the column mapped is full name, split it!
      let fName = row[columnMapping.firstName]?.toString() || '';
      let lName = columnMapping.lastName ? (row[columnMapping.lastName]?.toString() || '') : '';

      if (!columnMapping.lastName && fName.includes(' ')) {
        const parts = fName.trim().split(' ');
        fName = parts[0];
        lName = parts.slice(1).join(' ');
      }

      const email = row[columnMapping.email]?.toString() || '';
      const phone = columnMapping.phone ? row[columnMapping.phone]?.toString() : '';
      const designation = columnMapping.designation ? row[columnMapping.designation]?.toString() : '';
      const departmentName = columnMapping.departmentName ? row[columnMapping.departmentName]?.toString() : '';
      const managerEmail = columnMapping.managerEmail ? row[columnMapping.managerEmail]?.toString() : '';

      const emp: EmployeeData = {
        firstName: fName.trim(),
        lastName: lName.trim(),
        email: email.trim(),
        phone: phone?.trim(),
        designation: designation?.trim(),
        departmentName: departmentName?.trim(),
        managerEmail: managerEmail?.trim(),
      };

      return validateRow(emp, idx);
    });

    setValidatedRows(formatted);
    setStep(4);
  };

  const validateRow = (emp: EmployeeData, index: number): ValidatedRow => {
    const errors: Record<string, string> = {};
    if (!emp.firstName) errors.firstName = 'First Name is required';
    
    if (!emp.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email)) {
      errors.email = 'Invalid email address';
    }

    return {
      index,
      data: emp,
      errors,
      isValid: Object.keys(errors).length === 0,
    };
  };

  // Handles inline cell edits in verification grid
  const handleCellEdit = (index: number, field: keyof EmployeeData, value: string) => {
    setValidatedRows((prev) =>
      prev.map((row) => {
        if (row.index === index) {
          const updatedData = { ...row.data, [field]: value };
          return validateRow(updatedData, index);
        }
        return row;
      })
    );
  };

  const handleAddEmployee = () => {
    const index = validatedRows.length;
    const newEmp: EmployeeData = {
      firstName: '',
      lastName: '',
      email: '',
      designation: '',
      departmentName: '',
      managerEmail: '',
    };
    setValidatedRows((prev) => [...prev, validateRow(newEmp, index)]);
  };

  const handleDeleteEmployee = (index: number) => {
    setValidatedRows((prev) => prev.filter((r) => r.index !== index).map((r, i) => ({ ...r, index: i })));
  };

  const verifyAndContinue = () => {
    // Check for duplicate emails
    const emails = validatedRows.map((r) => r.data.email.toLowerCase().trim()).filter(Boolean);
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      setGlobalDataError('Duplicate email addresses detected. Please make each email unique.');
      return;
    }

    const hasErrors = validatedRows.some((r) => !r.isValid);
    if (hasErrors) {
      setGlobalDataError('Please fix all highlighted errors in the table before continuing.');
      return;
    }

    setGlobalDataError('');
    setSubmitError('');

    // Prepopulate Key Personnel selection
    const emailsList = validatedRows.map((r) => r.data.email.toLowerCase().trim());
    if (emailsList.length > 0) {
      setOrgAdminEmail(emailsList[0]);
    }
    setStep(5);
  };

  // Submit Firm Onboarding
  const handleSubmitOnboarding = async () => {
    if (!orgAdminEmail) {
      setSubmitError('Primary Administrator email is required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const payload = {
      organizationName: orgName,
      organizationSlug: orgSlug,
      defaultPassword,
      employees: validatedRows.map((r) => r.data),
      orgAdminEmail,
      hrEmails,
      financeEmails,
    };

    try {
      const res = await api.onboarding.onboard(payload);
      setSuccessResponse(res.data);
      setStep(6);
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during onboarding setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Countdown redirect effect
  useEffect(() => {
    if (step === 6) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            router.push('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, router]);

  // Multiselect toggles
  const toggleHrRole = (email: string) => {
    setHrEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const toggleFinanceRole = (email: string) => {
    setFinanceEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-900">
      <title>Quick Onboard Company & Import Excel | WorkforceOS</title>
      
      {/* Dynamic Keyframes for Apple Spring Success Checkmark */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes springCheck {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes drawStroke {
          to { stroke-dashoffset: 0; }
        }
        .apple-spring {
          animation: springCheck 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards;
        }
        .draw-checkmark {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: drawStroke 0.4s ease-out 0.3s forwards;
        }
      ` }} />

      <LandingHeader />

      <section className="relative pt-24 pb-16 min-h-[calc(100vh-140px)] flex items-center justify-center">
        <AmbientGrid />

        <div className="max-w-[950px] w-full mx-auto px-6 relative z-10">
          
          {/* Progress Header */}
          {step < 6 && (
            <div className="mb-8 max-w-[500px] mx-auto text-center font-sans">
              <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                Firm Setup Wizard
              </span>
              <div className="flex justify-between items-center mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span className={step >= 1 ? 'text-blue-600' : ''}>1. Company</span>
                <span className={step >= 2 ? 'text-blue-600' : ''}>2. Upload</span>
                <span className={step >= 3 ? 'text-blue-600' : ''}>3. Mapping</span>
                <span className={step >= 4 ? 'text-blue-600' : ''}>4. Verify</span>
                <span className={step >= 5 ? 'text-blue-600' : ''}>5. Assign</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-250 rounded-[24px] p-8 md:p-10 shadow-sm">
            
            {/* STEP 1: COMPANY SETUP */}
            {step === 1 && (
              <div className="space-y-6 font-sans">
                <div className="text-center max-w-[480px] mx-auto mb-8">
                  <h2 className="text-2xl md:text-3xl font-[800] text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Configure Your Firm
                  </h2>
                  <p className="text-slate-500 text-sm mt-2">
                    Enter your organization details and set a default password to initialize your workforce workspace.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Company Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 text-sm focus:border-blue-500 bg-white"
                      placeholder="e.g. Dunder Mifflin Paper"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Workspace Slug (URL)</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 text-sm focus:border-blue-500 bg-white"
                        placeholder="dunder-mifflin"
                        value={orgSlug}
                        onChange={(e) => {
                          setOrgSlug(e.target.value);
                          setSlugModified(true);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Default Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-800 text-sm focus:border-blue-500 bg-white max-w-md"
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                  />
                  <span className="text-[11px] text-slate-400 block mt-2">
                    This temporary password will be assigned to all imported employees. They can modify it later.
                  </span>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-150 text-xs font-semibold">
                    {submitError}
                  </div>
                )}

                <div className="border-t border-slate-200 pt-6 flex justify-end">
                  <button
                    disabled={!orgName || !orgSlug || !defaultPassword}
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                  >
                    Continue &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: EXCEL UPLOAD */}
            {step === 2 && (
              <div className="space-y-6 font-sans">
                <div className="text-center max-w-[480px] mx-auto mb-8">
                  <h2 className="text-2xl md:text-3xl font-[800] text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Import Employee Directory
                  </h2>
                  <p className="text-slate-500 text-sm mt-2">
                    Drop your spreadsheet below. We support multi-sheet Excel files (.xlsx) and CSV files.
                  </p>
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 rounded-[16px] p-10 flex flex-col items-center justify-center cursor-pointer transition-all relative"
                >
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                  />
                  <svg className="w-10 h-10 text-green-600 fill-current mb-3 shrink-0" viewBox="0 0 24 24">
                    <path d="M21.17 3.25Q21.5 3.25 21.75 3.5T22 4.08V19.92Q22 20.5 21.75 20.75T21.17 21H7.83Q7.5 21 7.25 20.75T7 20.17V17H2.83Q2.5 17 2.25 16.75T2 16.17V7.83Q2 7.5 2.25 7.25T2.83 7H7V3.83Q7 3.25 7.83 3.25M7 9H4.5V11H7M7 13H4.5V15H7M20 5H9V19H20M11 7H13.5V9.5H11M11 11H13.5V13.5H11M11 15H13.5V17.5H11M15 7H18V9.5H15M15 11H18V13.5H15M15 15H18V17.5H15" />
                  </svg>
                  <span className="text-sm font-bold text-slate-700 block mb-1">
                    {file ? file.name : 'Select or drag employee spreadsheet here'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports xlsx, csv formats'}
                  </span>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-150 text-xs font-semibold">
                    {submitError}
                  </div>
                )}

                <div className="border-t border-slate-200 pt-6 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    &larr; Back
                  </button>
                  <button
                    disabled={!file}
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SHEET SELECTOR & COLUMN MAPPING */}
            {step === 3 && (
              <div className="space-y-6 font-sans">
                <div className="text-center max-w-[480px] mx-auto mb-6">
                  <h2 className="text-2xl md:text-3xl font-[800] text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Map Excel Columns
                  </h2>
                  <p className="text-slate-500 text-sm mt-2">
                    Select the spreadsheet sheet and map its columns to our standard employee fields.
                  </p>
                </div>

                {/* Sheet Selector */}
                {sheetNames.length > 1 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Select Active Spreadsheet Sheet</span>
                      <span className="text-[10px] text-slate-400">This sheet contains employee records</span>
                    </div>
                    <select
                      className="px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-700"
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                    >
                      {sheetNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Mapping Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'firstName', label: 'First Name (or Full Name)', required: true },
                    { key: 'lastName', label: 'Last Name', required: false },
                    { key: 'email', label: 'Work Email Address', required: true },
                    { key: 'phone', label: 'Phone Number', required: false },
                    { key: 'designation', label: 'Designation / Job Title', required: false },
                    { key: 'departmentName', label: 'Department Name', required: false },
                    { key: 'managerEmail', label: 'Manager Email', required: false },
                  ].map((field) => (
                    <div key={field.key} className="flex flex-col">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800 text-sm focus:border-blue-500 bg-white"
                        value={columnMapping[field.key]}
                        onChange={(e) =>
                          setColumnMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      >
                        <option value="">-- Do Not Import --</option>
                        {excelHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-150 text-xs font-semibold">
                    {submitError}
                  </div>
                )}

                <div className="border-t border-slate-200 pt-6 flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={applyColumnMapping}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                  >
                    Map Columns &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: VERIFICATION & INLINE EDITING */}
            {step === 4 && (
              <div className="space-y-6 font-sans">
                <div className="text-center max-w-[480px] mx-auto mb-4">
                  <h2 className="text-2xl md:text-3xl font-[800] text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Verify & Correct Directory
                  </h2>
                  <p className="text-slate-550 text-sm mt-2">
                    Review parsed employee records. Double-click any cell to edit details directly before final import.
                  </p>
                </div>

                {/* Data Error Banner */}
                {globalDataError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-150 text-xs font-semibold">
                    {globalDataError}
                  </div>
                )}

                {/* Grid Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[350px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 w-10">#</th>
                        <th className="p-3">First Name *</th>
                        <th className="p-3">Last Name</th>
                        <th className="p-3">Email *</th>
                        <th className="p-3">Designation</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Manager Email</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validatedRows.map((row) => (
                        <tr key={row.index} className={!row.isValid ? 'bg-red-50/40' : 'hover:bg-slate-50'}>
                          <td className="p-3 text-slate-400 font-semibold">{row.index + 1}</td>
                          
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.data.firstName}
                              onChange={(e) => handleCellEdit(row.index, 'firstName', e.target.value)}
                              className={`w-full px-2 py-1 bg-transparent rounded border ${
                                row.errors.firstName ? 'border-red-400 focus:border-red-500' : 'border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white'
                              }`}
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={row.data.lastName}
                              onChange={(e) => handleCellEdit(row.index, 'lastName', e.target.value)}
                              className="w-full px-2 py-1 bg-transparent rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={row.data.email}
                              onChange={(e) => handleCellEdit(row.index, 'email', e.target.value)}
                              className={`w-full px-2 py-1 bg-transparent rounded border ${
                                row.errors.email ? 'border-red-400 focus:border-red-500' : 'border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white'
                              }`}
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={row.data.designation || ''}
                              onChange={(e) => handleCellEdit(row.index, 'designation', e.target.value)}
                              className="w-full px-2 py-1 bg-transparent rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={row.data.departmentName || ''}
                              onChange={(e) => handleCellEdit(row.index, 'departmentName', e.target.value)}
                              className="w-full px-2 py-1 bg-transparent rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={row.data.managerEmail || ''}
                              onChange={(e) => handleCellEdit(row.index, 'managerEmail', e.target.value)}
                              className="w-full px-2 py-1 bg-transparent rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white"
                            />
                          </td>

                          <td className="p-2">
                            <button
                              onClick={() => handleDeleteEmployee(row.index)}
                              className="text-red-500 hover:text-red-750 p-1 flex items-center justify-center transition-colors rounded hover:bg-red-50"
                              title="Delete Row"
                            >
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleAddEmployee}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>+ Add Employee Row</span>
                  </button>
                </div>

                <div className="border-t border-slate-200 pt-6 flex justify-between">
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={verifyAndContinue}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                  >
                    Continue &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: ROLE ASSIGNMENT & PRIMARY DETAILS */}
            {step === 5 && (
              <div className="space-y-6 font-sans">
                <div className="text-center max-w-[480px] mx-auto mb-8">
                  <h2 className="text-2xl md:text-3xl font-[800] text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Assign Primary Roles
                  </h2>
                  <p className="text-slate-500 text-sm mt-2">
                    Specify organization administrators, HR Managers, and Finance controllers from the imported list.
                  </p>
                </div>

                {/* Primary Admin */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Primary Super Administrator (Org Admin)
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800 text-sm focus:border-blue-500 bg-white max-w-md"
                    value={orgAdminEmail}
                    onChange={(e) => setOrgAdminEmail(e.target.value)}
                  >
                    <option value="">-- Select Super Admin --</option>
                    {validatedRows.map((r) => (
                      <option key={r.data.email} value={r.data.email}>
                        {r.data.firstName} {r.data.lastName} ({r.data.email})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400 block mt-2">
                    This user will receive full bypass privileges and can configure payroll, modules, and structure.
                  </span>
                </div>

                {/* HR Roles */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Assign Human Resource (HR) Managers
                  </label>
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-55 max-h-[150px] overflow-y-auto custom-scrollbar space-y-2">
                    {validatedRows.map((r) => (
                      <label key={r.data.email} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hrEmails.includes(r.data.email)}
                          onChange={() => toggleHrRole(r.data.email)}
                          className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                        <span>{r.data.firstName} {r.data.lastName} ({r.data.email})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Finance Roles */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Assign Finance Managers
                  </label>
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-55 max-h-[150px] overflow-y-auto custom-scrollbar space-y-2">
                    {validatedRows.map((r) => (
                      <label key={r.data.email} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={financeEmails.includes(r.data.email)}
                          onChange={() => toggleFinanceRole(r.data.email)}
                          className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                        <span>{r.data.firstName} {r.data.lastName} ({r.data.email})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-150 text-xs font-semibold">
                    {submitError}
                  </div>
                )}

                <div className="border-t border-slate-200 pt-6 flex justify-between">
                  <button
                    disabled={isSubmitting}
                    onClick={() => setStep(4)}
                    className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    &larr; Back
                  </button>
                  <button
                    disabled={isSubmitting || !orgAdminEmail}
                    onClick={handleSubmitOnboarding}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></div>
                        <span>Setting Up Workspace...</span>
                      </>
                    ) : (
                      <span>Complete Setup & Import</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: CONFIRMATION & APPLE SUCCESS ANIMATION */}
            {step === 6 && (
              <div className="space-y-6 font-sans text-center flex flex-col items-center justify-center py-8">
                
                {/* Apple Success Spring scaling checkmark circle */}
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-5xl shadow-md border-4 border-white mb-6 apple-spring">
                  <svg className="w-10 h-10 stroke-current fill-none stroke-[4.5]" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" className="draw-checkmark" />
                  </svg>
                </div>

                <div className="max-w-[480px]">
                  <span className="text-[10px] font-extrabold text-green-700 bg-green-55/60 px-3 py-1 rounded-full border border-green-200 uppercase tracking-widest block w-fit mx-auto mb-3">
                    Workspace Ready
                  </span>
                  <h2 className="text-2xl md:text-3xl font-[800] text-slate-900 leading-tight tracking-tight mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Setup Complete!
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Your firm <strong>{orgName}</strong> (slug: <code>{orgSlug}</code>) has been successfully created. We imported all your employees and seeded default permissions, leave balances, and shifts.
                  </p>
                </div>

                {/* Team Stats summary */}
                <div className="flex gap-3 justify-center max-w-md w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6">
                  <div className="flex-1 border-r border-slate-200">
                    <span className="text-xl font-bold text-slate-800 block">
                      {validatedRows.length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Employees</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xl font-bold text-slate-800 block">
                      {Array.from(new Set(validatedRows.map((r) => r.data.departmentName?.trim()).filter(Boolean))).length || 1}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Departments</span>
                  </div>
                </div>

                {/* Redirection segment */}
                <div className="pt-8 w-full flex flex-col items-center">
                  <button
                    onClick={() => router.push('/login')}
                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-sm uppercase tracking-wider active:scale-95 transition-all border border-blue-600 cursor-pointer shadow-md shadow-blue-600/10 flex items-center gap-2"
                  >
                    <span>Log In to Workspace</span>
                    <span className="text-xs font-bold font-mono">→</span>
                  </button>
                  <span className="text-[11px] text-slate-400 mt-3 font-medium">
                    Redirecting you to login screen in <strong className="text-slate-600 font-bold">{countdown}s</strong>...
                  </span>
                </div>

              </div>
            )}

          </div>

        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
