'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import LogoLoader from '../../../components/ui/LogoLoader';

interface EmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  departmentName?: string;
  managerEmail?: string;
  salaryBand?: string;
  basicSalary?: string;
  ctcAnnual?: string;
  taxRegime?: string;
}

export default function OnboardingSetupPage() {
  const { user, organization, refetchUser, logout } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Firm Setup
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('Workforce123!');

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || '');
      setOrgSlug(organization.slug || '');
      setLogoUrl(organization.logoUrl || '');
    }
  }, [organization]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 2: Excel / File Upload
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Step 3: Tabular Preview Component
  const [employees, setEmployees] = useState<EmployeeData[]>([]);

  // Step 4: Key Personnel & Assign roles
  const [hrEmails, setHrEmails] = useState<string[]>([]);
  const [financeEmails, setFinanceEmails] = useState<string[]>([]);

  // Mobile enforcement check
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024 || !!(window as any).WorkforceOSBridge);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);



  // File parsing trigger
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const res = await fetch(`http://localhost:4000/api/v1/onboarding/upload-employees`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        if (!res.ok) throw new Error('Failed to parse employee sheet');
        const resData = await res.json();
        setEmployees(resData.data || []);
        setStep(3); // Advance to tabular preview
      } catch (err: any) {
        setError(err.message || 'Error uploading file.');
      } finally {
        setUploading(false);
      }
    }
  }

  // Row Manipulation
  const handleCellEdit = (idx: number, field: keyof EmployeeData, val: string) => {
    setEmployees((prev) =>
      prev.map((emp, i) => (i === idx ? { ...emp, [field]: val } : emp))
    );
  };

  const handleDeleteRow = (idx: number) => {
    setEmployees((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddRow = () => {
    setEmployees((prev) => [
      ...prev,
      {
        firstName: '',
        lastName: '',
        email: '',
        designation: '',
        departmentName: '',
        managerEmail: '',
        salaryBand: 'BAND_C',
        basicSalary: '40000',
        ctcAnnual: '480000',
        taxRegime: 'NEW',
      },
    ]);
  };

  // Submit Final Setup Payload
  async function handleOnboardSubmit() {
    setIsSubmitting(true);
    setError('');

    // Pre-populate admin user details into the employees array if they aren't already there
    const adminEmail = user?.email || '';
    const hasAdminInEmployees = employees.some(e => e.email.toLowerCase() === adminEmail.toLowerCase());

    const finalEmployees = [...employees];
    if (!hasAdminInEmployees) {
      finalEmployees.unshift({
        firstName: user?.firstName || 'Admin',
        lastName: user?.lastName || 'User',
        email: adminEmail,
        designation: 'CEO',
        departmentName: 'Management',
        salaryBand: 'BAND_A',
        basicSalary: '120000',
        ctcAnnual: '1800000',
        taxRegime: 'NEW',
      });
    }

    const payload = {
      organizationName: orgName,
      organizationSlug: orgSlug,
      logoUrl,
      defaultPassword,
      employees: finalEmployees,
      orgAdminEmail: adminEmail,
      hrEmails,
      financeEmails,
    };

    try {
      await api.onboarding.setup(payload);
      await refetchUser();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Setup submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
        {/* Header */}
        <header className="border-b border-slate-200 px-8 py-4 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <img src="/workforceoslogo.png" alt="Logo" className="h-8 w-8 object-contain rounded" />
            <span className="text-lg font-bold tracking-wider uppercase">WorkforceOS Setup</span>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Logout
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-md w-full mx-auto px-6 py-12 flex flex-col justify-center text-center space-y-6">
          <div className="h-16 w-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px] text-blue-600">desktop_mac</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Desktop Setup Required</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Setting up your organization, uploading Excel sheets, and configuring departments requires a larger screen. 
            Please open this URL on a desktop or laptop computer to complete onboarding:
          </p>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 select-all">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Setup URL</p>
            <p className="text-xs font-mono text-blue-600 break-all font-semibold">https://workforceos1.vercel.app/onboarding/setup</p>
          </div>
          <p className="text-xs text-slate-500">
            Once completed, the mobile app will automatically unlock.
          </p>
        </main>

        {/* Footer */}
        <footer className="text-center py-6 text-[10px] text-slate-500 border-t border-slate-200">
          WorkforceOS Management Platform
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-200 px-8 py-4 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/workforceoslogo.png" alt="Logo" className="h-8 w-8 object-contain rounded" />
          <span className="text-lg font-bold tracking-wider uppercase">WorkforceOS Setup</span>
        </div>
        <button
          onClick={logout}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        {/* Progress Tracker */}
        <div className="mb-12 max-w-md mx-auto text-center">
          <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
            Onboarding Setup
          </span>
          <div className="flex justify-between items-center mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span className={step >= 1 ? 'text-blue-600' : ''}>1. Company</span>
            <span className={step >= 2 ? 'text-blue-600' : ''}>2. Upload Excel</span>
            <span className={step >= 3 ? 'text-blue-600' : ''}>3. Tabular Preview</span>
            <span className={step >= 4 ? 'text-blue-600' : ''}>4. Assign Roles</span>
          </div>
          <div className="w-full bg-white h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Wizard Card Container */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          {/* STEP 1: COMPANY PROFILE SETUP */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto">
                <h2 className="text-2xl font-extrabold tracking-tight">Configure Organization Profile</h2>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  Provide your organization details and set a default password that new employees will use to log in initially.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Company Name</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-sm transition-all focus:ring-1 focus:ring-blue-600"
                    placeholder="e.g. Acme Corporation"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Workspace Slug (URL Part)</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-sm transition-all focus:ring-1 focus:ring-blue-600"
                    placeholder="acme-corp"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Default Employee Password</label>
                <input
                  type="password"
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-sm transition-all focus:ring-1 focus:ring-blue-600 max-w-md"
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                />
                <p className="text-[10px] text-slate-500">
                  New employees will receive this temporary password to authenticate. They will be requested to update it.
                </p>
              </div>

              <div className="border-t border-slate-200 pt-6 flex justify-end">
                <button
                  disabled={!orgName || !orgSlug}
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Continue &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: EXCEL BULK UPLOAD */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto">
                <h2 className="text-2xl font-extrabold tracking-tight">Upload Employee Sheet</h2>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  Bulk import your team! Choose a standard Excel spreadsheet containing employee email, designation, and department details.
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-200 hover:border-blue-600 bg-slate-50 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <LogoLoader size={45} />
                    <span className="text-xs font-semibold text-blue-600">Parsing spreadsheet...</span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[40px] text-slate-500 mb-2">upload_file</span>
                    <span className="text-sm font-bold text-slate-700 block mb-1">
                      {file ? file.name : 'Select Employee Spreadsheet'}
                    </span>
                    <span className="text-xs text-slate-500">Supports Excel (.xlsx) and CSV</span>
                  </>
                )}
              </div>

              <div className="border-t border-slate-200 pt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  &larr; Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Skip Import &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TABULAR PREVIEW AND MERGE */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-extrabold tracking-tight">Review Employee Grid</h2>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  Review the parsed employee details. Verify salaries, designations, and departments before merging into your official database.
                </p>
              </div>

              {/* Responsive Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 max-h-[350px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-white border-b border-slate-200 font-bold text-slate-500 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 w-10">#</th>
                      <th className="p-3">First Name *</th>
                      <th className="p-3">Last Name</th>
                      <th className="p-3">Email *</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Basic Salary</th>
                      <th className="p-3">CTC (Annual)</th>
                      <th className="p-3">Manager Email</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-600 font-semibold">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={emp.firstName}
                            onChange={(e) => handleCellEdit(idx, 'firstName', e.target.value)}
                            className="w-full px-2 py-1 bg-white rounded border border-transparent hover:border-slate-200 focus:border-blue-600 focus:bg-slate-50 font-medium"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={emp.lastName}
                            onChange={(e) => handleCellEdit(idx, 'lastName', e.target.value)}
                            className="w-full px-2 py-1 bg-white rounded border border-transparent hover:border-slate-200 focus:border-blue-600 focus:bg-slate-50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="email"
                            value={emp.email}
                            onChange={(e) => handleCellEdit(idx, 'email', e.target.value)}
                            className="w-full px-2 py-1 bg-white rounded border border-transparent hover:border-slate-200 focus:border-blue-600 focus:bg-slate-50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={emp.designation || ''}
                            onChange={(e) => handleCellEdit(idx, 'designation', e.target.value)}
                            className="w-full px-2 py-1 bg-white rounded border border-transparent hover:border-slate-200 focus:border-blue-600 focus:bg-slate-50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={emp.departmentName || ''}
                            onChange={(e) => handleCellEdit(idx, 'departmentName', e.target.value)}
                            className="w-full px-2 py-1 bg-white rounded border border-transparent hover:border-slate-200 focus:border-blue-600 focus:bg-slate-50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={emp.basicSalary || ''}
                            onChange={(e) => handleCellEdit(idx, 'basicSalary', e.target.value)}
                            className="w-full px-2 py-1 bg-white rounded border border-transparent hover:border-slate-200 focus:border-blue-600 focus:bg-slate-50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={emp.ctcAnnual || ''}
                            onChange={(e) => handleCellEdit(idx, 'ctcAnnual', e.target.value)}
                            className="w-full px-2 py-1 bg-white rounded border border-transparent hover:border-slate-200 focus:border-blue-600 focus:bg-slate-50"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={emp.managerEmail || ''}
                            onChange={(e) => handleCellEdit(idx, 'managerEmail', e.target.value)}
                            className="w-full px-2 py-1 bg-white rounded border border-transparent hover:border-slate-200 focus:border-blue-600 focus:bg-slate-50"
                          />
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() => handleDeleteRow(idx)}
                            className="text-red-500 hover:text-red-600 p-1 flex items-center justify-center transition-colors rounded hover:bg-white"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddRow}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <span>+ Add Custom Employee Row</span>
                </button>
              </div>

              <div className="border-t border-slate-200 pt-6 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  &larr; Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-500/10"
                >
                  Verify & Next &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ASSIGN KEY PERSONNEL ROLES */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto">
                <h2 className="text-2xl font-extrabold tracking-tight">Assign Core Roles</h2>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  Identify the HR managers and Finance administrators from the employee list. They will receive system-level access.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* HR Selection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">HR Administrators</h3>
                  <div className="border border-slate-200 rounded-2xl bg-slate-50 p-4 max-h-[200px] overflow-y-auto custom-scrollbar space-y-2">
                    {employees.map((emp) => (
                      <label key={emp.email} className="flex items-center gap-3 text-xs text-slate-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hrEmails.includes(emp.email.toLowerCase())}
                          onChange={() => {
                            const e = emp.email.toLowerCase();
                            setHrEmails(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
                          }}
                          className="rounded border-slate-200 bg-white text-blue-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span>{emp.firstName} {emp.lastName} ({emp.email})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Finance Selection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">Finance Administrators</h3>
                  <div className="border border-slate-200 rounded-2xl bg-slate-50 p-4 max-h-[200px] overflow-y-auto custom-scrollbar space-y-2">
                    {employees.map((emp) => (
                      <label key={emp.email} className="flex items-center gap-3 text-xs text-slate-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={financeEmails.includes(emp.email.toLowerCase())}
                          onChange={() => {
                            const e = emp.email.toLowerCase();
                            setFinanceEmails(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
                          }}
                          className="rounded border-slate-200 bg-white text-blue-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span>{emp.firstName} {emp.lastName} ({emp.email})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  &larr; Back
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleOnboardSubmit}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Setting up Organization...
                    </>
                  ) : (
                    'Finalize Onboarding'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-[10px] text-slate-500 border-t border-slate-200">
        WorkforceOS Management Platform. Locked and Secured.
      </footer>
    </div>
  );
}
