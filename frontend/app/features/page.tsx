'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { LandingFooter } from '../../components/layout/LandingFooter';
import { AmbientGrid } from '../../components/ui/AmbientGrid';

export default function FeaturesPage() {
  const [activeSection, setActiveSection] = useState('employees');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const modules = [
    { id: 'employees', name: 'Employees', icon: 'group', color: 'bg-blue-50 text-blue-600 border-blue-150', iconColor: 'text-blue-600' },
    { id: 'attendance', name: 'Attendance', icon: 'fingerprint', color: 'bg-teal-50 text-teal-600 border-teal-150', iconColor: 'text-teal-600' },
    { id: 'leave', name: 'Leave', icon: 'date_range', color: 'bg-sky-50 text-sky-600 border-sky-150', iconColor: 'text-sky-600' },
    { id: 'tasks', name: 'Tasks', icon: 'assignment', color: 'bg-violet-50 text-violet-600 border-violet-150', iconColor: 'text-violet-600' },
    { id: 'performance', name: 'Performance', icon: 'trending_up', color: 'bg-amber-50 text-amber-600 border-amber-150', iconColor: 'text-amber-600' },
    { id: 'payroll', name: 'Payroll', icon: 'payments', color: 'bg-green-50 text-green-600 border-green-150', iconColor: 'text-green-600' },
    { id: 'expenses', name: 'Expenses', icon: 'receipt_long', color: 'bg-orange-50 text-orange-600 border-orange-150', iconColor: 'text-orange-600' },
    { id: 'assets', name: 'Assets', icon: 'devices', color: 'bg-slate-100 text-slate-600 border-slate-200', iconColor: 'text-slate-600' },
    { id: 'knowledge-base', name: 'Knowledge Base', icon: 'menu_book', color: 'bg-indigo-50 text-indigo-600 border-indigo-150', iconColor: 'text-indigo-600' },
    { id: 'notifications', name: 'Notifications', icon: 'notifications_active', color: 'bg-red-50 text-red-600 border-red-150', iconColor: 'text-red-600' },
    { id: 'audit-log', name: 'Audit Log', icon: 'history', color: 'bg-stone-100 text-stone-700 border-stone-200', iconColor: 'text-stone-700' },
  ];

  // ==========================================
  // STATE DEFINITIONS FOR THE 11 MODULE WIDGETS
  // ==========================================

  // Walkthrough Tour Wizard States
  const [tourStep, setTourStep] = useState(1);
  const [wizardName, setWizardName] = useState('Rahul Verma');
  const [wizardRole, setWizardRole] = useState('SDE-I');
  const [wizardBankVerified, setWizardBankVerified] = useState(true);
  const [wizardEmployees, setWizardEmployees] = useState([
    { id: 1, name: 'Vikram Sharma', role: 'Founder & CEO', status: 'AES-256 Encrypted' },
    { id: 2, name: 'Ananya Patel', role: 'Head of Operations', status: 'AES-256 Encrypted' }
  ]);
  const [wizardCheckInStatus, setWizardCheckInStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [wizardCasualLimit, setWizardCasualLimit] = useState(15);
  const [wizardSickLimit, setWizardSickLimit] = useState(12);
  const [wizardGrossSalary, setWizardGrossSalary] = useState(85000);
  const [wizardLogs, setWizardLogs] = useState<string[]>([
    `[19:12:00] SYSTEM: Isolated Database shard initialized successfully.`,
    `[19:12:05] COMPLIANCE: AES-256 encryption keys rotated for payroll database.`
  ]);

  const addWizardLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setWizardLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };
  
  // 1. Employees (Onboarding Steps)
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardData, setOnboardData] = useState({ name: 'Aarav Mehta', role: 'SDE-II', bankVerified: false });
  
  // 2. Attendance (Clocking)
  const [attendState, setAttendState] = useState<'out' | 'in' | 'break'>('out');
  const [attendLogs, setAttendLogs] = useState<string[]>(['Checked Out - Yesterday']);
  const [breakTimer, setBreakTimer] = useState(0);

  // 3. Leave (Forms & Balance updates)
  const [leaveBalance, setLeaveBalance] = useState(12);
  const [leaveHistory, setLeaveHistory] = useState([
    { id: 1, type: 'Sick Leave', duration: 2, status: 'Approved' }
  ]);
  const [newLeaveType, setNewLeaveType] = useState('Casual Leave');
  const [newLeaveDays, setNewLeaveDays] = useState(3);

  // 4. Tasks (State transitions)
  const [taskState, setTaskState] = useState<'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'CLOSED'>('DRAFT');
  const [taskRating, setTaskRating] = useState(8);

  // 5. Performance (OKR weight score recalculations)
  const [weightTask, setWeightTask] = useState(40);
  const [weightQuality, setWeightQuality] = useState(30);
  const [weightAttendance, setWeightAttendance] = useState(30);
  
  // 6. Payroll (Statutory computations)
  const [payrollGross, setPayrollGross] = useState(75000);
  const [payrollLopDays, setPayrollLopDays] = useState(1);

  // 7. Expenses (Claims logger)
  const [expenseList, setExpenseList] = useState([
    { title: 'Internet Reimbursement', amount: 1499, status: 'Manager Approved' }
  ]);
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  // 8. Assets (Assignment tracker)
  const [assetList, setAssetList] = useState([
    { id: 'AST-2026-04', type: 'MacBook Pro 14"', status: 'Available', assignee: '-' }
  ]);

  // 9. Knowledge Base (Version editor)
  const [wikiTitle, setWikiTitle] = useState('Standard Operations Leave Policy');
  const [wikiContent, setWikiContent] = useState('All employees are eligible for 12 days of Casual Leave annually. Leave applications require two-stage manager and HR review.');
  const [wikiVersion, setWikiVersion] = useState(1);
  const [wikiHistory, setWikiHistory] = useState<string[]>([]);

  // 10. Notifications (Inbox alerts)
  const [inboxNotifications, setInboxNotifications] = useState([
    { id: 1, text: 'Welcome to WorkforceOS portal!', read: false }
  ]);

  // 11. Audit Log (Event streams)
  const [auditEvents, setAuditEvents] = useState([
    '[SYSTEM] 19:30:00 - Isolated Database shard initialized successfully.',
    '[SYSTEM] 19:12:15 - User auth token rotated securely.'
  ]);

  // General log appender helper
  const addAudit = (msg: string) => {
    setAuditEvents((prev) => [`[SYSTEM] ${new Date().toLocaleTimeString()} - ${msg}`, ...prev]);
  };

  // Intersection observer logic
  useEffect(() => {
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0.1,
    });

    Object.values(sectionRefs.current).forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(id);
    }
  };

  // Performance calculation formula helper
  const calcPerformanceScore = () => {
    // Mock base factor values for SDE employee: Task score 90, Quality score 85, Attendance score 98
    const score = (90 * weightTask) / 100 + (85 * weightQuality) / 100 + (98 * weightAttendance) / 100;
    return Math.round(score);
  };

  const calcGradeBand = (score: number) => {
    if (score >= 93) return 'S Band (Outstanding)';
    if (score >= 87) return 'A Band (Excellent)';
    if (score >= 80) return 'B Band (Satisfactory)';
    return 'C Band (Needs Review)';
  };

  // Payroll Statutory computations helper
  const runPayrollCalculation = () => {
    const perDay = payrollGross / 30;
    const lopAmount = perDay * payrollLopDays;
    const grossAfterLop = Math.max(0, payrollGross - lopAmount);
    
    // PF 12% capped at ₹1,800 limit
    const pf = Math.min(1800, Math.round(grossAfterLop * 0.12));
    
    // ESIC 0.75% Employee side if gross is <= 21000
    const esic = grossAfterLop <= 21000 ? Math.round(grossAfterLop * 0.0075) : 0;
    
    // Professional Tax (Standard Maharashtra/Karnataka slab mockup)
    const pt = grossAfterLop > 10000 ? 200 : 0;
    
    const totalDeductions = pf + esic + pt;
    const netSalary = Math.round(grossAfterLop - totalDeductions);

    return { lopAmount, pf, esic, pt, netSalary };
  };

  const payrollResult = runPayrollCalculation();

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-900">
      {/* Navigation Header */}
      <LandingHeader />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16 bg-slate-50 border-b border-slate-200">
        <AmbientGrid />
        <div className="max-w-[760px] mx-auto text-center px-6 relative z-10">
          <span 
            className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            PRODUCT MODULES
          </span>
          <h1 
            className="text-3xl md:text-[3rem] font-[800] text-slate-900 leading-tight tracking-[-0.02em] mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Every feature, documented.
          </h1>
          <p className="text-slate-550 text-base md:text-lg mb-8 max-w-xl mx-auto font-normal">
            11 modules. Built for Indian companies. Designed for every role in your organisation.
          </p>
          <Link
            id="features-hero-cta"
            href="/contact"
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all border border-blue-600 active:scale-95 text-center cursor-pointer"
          >
            Request a demo
          </Link>
        </div>
      </section>

      {/* SECTION: INTERACTIVE WORKFLOW WIZARD */}
      <section className="bg-slate-50 border-b border-slate-200 py-12">
        <div className="max-w-[850px] mx-auto px-6">
          <div className="text-center mb-8">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-250 px-3 py-1 rounded-full mb-3 inline-block">
              Interactive Simulation
            </span>
            <h2 className="text-2xl md:text-3xl font-[800] text-slate-900 tracking-tight mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              How WorkforceOS Works
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto font-normal">
              Simulate the core workflow of our HRMS platform in 5 quick interactive steps.
            </p>
          </div>

          {/* Wizard Card Container */}
          <div className="bg-white border border-slate-200 rounded-[20px] overflow-hidden flex flex-col">
            
            {/* Step Indicators */}
            <div className="border-b border-slate-200 bg-slate-50/50 p-4 grid grid-cols-5 text-center gap-2">
              {[
                { step: 1, label: '1. Onboarding' },
                { step: 2, label: '2. Geofence' },
                { step: 3, label: '3. Leaves' },
                { step: 4, label: '4. Payroll' },
                { step: 5, label: '5. Audit Logs' },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setTourStep(s.step)}
                  className={`py-2 text-[10px] md:text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    tourStep === s.step
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <span className="hidden md:inline">{s.label}</span>
                  <span className="md:hidden">{s.step}</span>
                </button>
              ))}
            </div>

            {/* Tour Step Panel Content */}
            <div className="p-6 md:p-8 flex-1 min-h-[300px] flex flex-col justify-between">
              
              {/* STEP 1: ONBOARDING */}
              {tourStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Step 1: Automated Employee Onboarding
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-normal">
                      Onboard employees using structured profiles. Captures personal details encrypted using AES-256-GCM.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Add Form */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Employee Profile</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Name</label>
                          <input
                            type="text"
                            value={wizardName}
                            onChange={(e) => setWizardName(e.target.value)}
                            className="w-full bg-white border border-slate-200 p-2.5 text-xs rounded-lg focus:border-blue-600 font-medium"
                            placeholder="Enter employee name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Designation</label>
                          <input
                            type="text"
                            value={wizardRole}
                            onChange={(e) => setWizardRole(e.target.value)}
                            className="w-full bg-white border border-slate-200 p-2.5 text-xs rounded-lg focus:border-blue-600 font-medium"
                            placeholder="Enter designation"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={wizardBankVerified}
                            onChange={(e) => setWizardBankVerified(e.target.checked)}
                            className="cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-[11px] text-slate-650 font-medium select-none">Verify Bank Details (PAN/IFSC)</span>
                        </label>
                        <button
                          onClick={() => {
                            if (!wizardName.trim() || !wizardRole.trim()) return;
                            const newEmp = { id: Date.now(), name: wizardName, role: wizardRole, status: 'AES-256 Encrypted' };
                            setWizardEmployees(prev => [...prev, newEmp]);
                            addWizardLog(`EMPLOYEE-ONBOARDED: "${wizardName}" joined as ${wizardRole}. DB write completed.`);
                            setWizardName('');
                            setWizardRole('SDE-I');
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider cursor-pointer transition-colors"
                        >
                          Onboard Employee
                        </button>
                      </div>
                    </div>

                    {/* Employee Directory View */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-650">
                        <span>Database Directory (PostgreSQL)</span>
                        <span className="text-green-600 font-mono text-[8px]">● Connected</span>
                      </div>
                      <div className="p-3 divide-y divide-slate-100 max-h-[220px] overflow-y-auto custom-scrollbar">
                        {wizardEmployees.map((emp) => (
                          <div key={emp.id} className="py-2.5 flex justify-between items-center">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">{emp.name}</span>
                              <span className="text-[10px] text-slate-500">{emp.role}</span>
                            </div>
                            <span className="text-[8.5px] bg-green-50 text-green-700 border border-green-150 px-2 py-0.5 rounded font-mono font-bold">
                              {emp.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: GEOFENCE */}
              {tourStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Step 2: Geofenced Attendance Lock
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-normal">
                      Lock check-ins to exact geographical coordinates. Employees checking in outside defined bounds will be flagged for LOP.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Interactive Geofence Grid */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Office Area Boundary (Click to map)</span>
                      <div className="grid grid-cols-5 gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl aspect-square max-w-[240px] mx-auto md:mx-0">
                        {Array.from({ length: 25 }).map((_, idx) => {
                          const r = Math.floor(idx / 5) - 2;
                          const c = (idx % 5) - 2;
                          const isCenter = r === 0 && c === 0;
                          const isHQ = Math.abs(r) <= 1 && Math.abs(c) <= 1; // Default 3x3 geofence area
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (isCenter) return;
                                addWizardLog(`GEOFENCE-UPDATED: Toggled grid coordinate zone at (${r}, ${c}).`);
                              }}
                              className={`aspect-square rounded border flex items-center justify-center cursor-pointer transition-all select-none ${
                                isCenter
                                  ? 'bg-blue-600 border-blue-600 text-white font-bold text-xs'
                                  : isHQ
                                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                                  : 'bg-white hover:bg-slate-100 border-slate-200'
                              }`}
                              title={isCenter ? 'Main Office Center' : `Zone (${r}, ${c})`}
                            >
                              {isCenter ? (
                                <span className="material-symbols-outlined text-[14px]">home</span>
                              ) : (
                                <span className="text-[7px] text-slate-400 font-mono">{r},{c}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Check In Action Simulation */}
                    <div className="space-y-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Clock In Simulator</span>
                        <p className="text-xs text-slate-650 font-normal">Simulate checking in from different virtual coordinates:</p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setWizardCheckInStatus('success');
                              addWizardLog(`ATTENDANCE-LOG: Clock-in SUCCESS. Verified coordinates matching Bangalore HQ.`);
                            }}
                            className="bg-white border border-slate-200 hover:border-blue-600 hover:bg-blue-50/20 text-slate-700 py-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                          >
                            At Bangalore HQ
                          </button>
                          <button
                            onClick={() => {
                              setWizardCheckInStatus('failed');
                              addWizardLog(`ATTENDANCE-WARNING: Geofence MISMATCH. Clock-in rejected from unauthorized coordinates (Distance 14.2km).`);
                            }}
                            className="bg-white border border-slate-200 hover:border-red-500 hover:bg-red-50/20 text-slate-700 py-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                          >
                            15km Away (Remote)
                          </button>
                        </div>

                        {wizardCheckInStatus === 'success' && (
                          <div className="bg-green-50 border border-green-150 p-2.5 rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-green-600 text-[18px]">verified</span>
                            <span className="text-[10.5px] font-semibold text-green-700 font-mono">Clock In Approved: Within Geofence</span>
                          </div>
                        )}

                        {wizardCheckInStatus === 'failed' && (
                          <div className="bg-red-50 border border-red-150 p-2.5 rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500 text-[18px]">warning</span>
                            <span className="text-[10.5px] font-semibold text-red-700 font-mono">Flagged: Outside Bounds (LOP Rules Apply)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: LEAVES */}
              {tourStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Step 3: Custom Leave & Holiday Policies
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-normal">
                      Define organizational leaves and holidays. WorkforceOS automatically filters weekend overlaps and holiday calendar clashes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Controls */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">Casual Leave Limit (Annual)</span>
                          <span className="font-mono text-blue-600 font-bold">{wizardCasualLimit} Days</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="30"
                          value={wizardCasualLimit}
                          onChange={(e) => {
                            setWizardCasualLimit(Number(e.target.value));
                            addWizardLog(`POLICY-UPDATE: Annual Casual Leave pool adjusted to ${e.target.value} days.`);
                          }}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">Sick Leave Limit (Annual)</span>
                          <span className="font-mono text-blue-600 font-bold">{wizardSickLimit} Days</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="25"
                          value={wizardSickLimit}
                          onChange={(e) => {
                            setWizardSickLimit(Number(e.target.value));
                            addWizardLog(`POLICY-UPDATE: Annual Sick Leave pool adjusted to ${e.target.value} days.`);
                          }}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Policy Allowance Visualization */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Active Policy Structure</span>
                      <div className="space-y-3 font-mono text-[10.5px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>Casual Leave Allowance:</span>
                            <span className="font-bold">{wizardCasualLimit} Days</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full animate-pulse" style={{ width: `${(wizardCasualLimit / 30) * 100}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>Sick Leave Allowance:</span>
                            <span className="font-bold">{wizardSickLimit} Days</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-sky-500 h-full animate-pulse" style={{ width: `${(wizardSickLimit / 25) * 100}%` }}></div>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-700 font-bold">
                          <span>Total Paid Pool:</span>
                          <span>{wizardCasualLimit + wizardSickLimit} Days / Year</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PAYROLL */}
              {tourStep === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Step 4: Indian Statutory Payroll Ledger
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-normal">
                      Live calculations of LOP, Provident Fund (PF capped at ₹1,800), Employee State Insurance (ESIC), and Net Salary.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Slider input */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">Gross Monthly CTC</span>
                          <span className="font-mono text-blue-600 font-bold text-sm">₹{wizardGrossSalary.toLocaleString('en-IN')}</span>
                        </div>
                        <input
                          type="range"
                          min="15000"
                          max="250000"
                          step="5000"
                          value={wizardGrossSalary}
                          onChange={(e) => {
                            setWizardGrossSalary(Number(e.target.value));
                            addWizardLog(`PAYROLL-UPDATE: Adjusted Gross Monthly CTC calculation factor to ₹${Number(e.target.value).toLocaleString('en-IN')}.`);
                          }}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>

                      <div className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-1 font-mono">
                        <div>● PF: 12% of Gross (capped at ₹1,800)</div>
                        <div>● ESIC: 0.75% of Gross (only if Gross &le; ₹21,000)</div>
                        <div>● PT: Maharashtra/Karnataka slab (₹200 for &gt;₹10,000)</div>
                      </div>
                    </div>

                    {/* Payroll Breakdown View */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden font-mono text-[11px] bg-white">
                      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 flex justify-between">
                        <span>Statutory Ledger</span>
                        <span>INR (₹)</span>
                      </div>
                      <div className="p-3.5 space-y-2 bg-white">
                        <div className="flex justify-between text-slate-600">
                          <span>Gross salary base:</span>
                          <span>{wizardGrossSalary.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-red-500">
                          <span>Provident Fund (PF):</span>
                          <span>-{Math.min(1800, Math.round(wizardGrossSalary * 0.12)).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-red-500">
                          <span>ESIC Contribution:</span>
                          <span>-{wizardGrossSalary <= 21000 ? Math.round(wizardGrossSalary * 0.0075).toLocaleString('en-IN') : '0'}</span>
                        </div>
                        <div className="flex justify-between text-red-500">
                          <span>Professional Tax (PT):</span>
                          <span>-{wizardGrossSalary > 10000 ? '200' : '0'}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-900 font-bold text-xs">
                          <span>Net take-home:</span>
                          <span className="text-blue-600 font-bold">
                            ₹{(
                              wizardGrossSalary -
                              Math.min(1800, Math.round(wizardGrossSalary * 0.12)) -
                              (wizardGrossSalary <= 21000 ? Math.round(wizardGrossSalary * 0.0075) : 0) -
                              (wizardGrossSalary > 10000 ? 200 : 0)
                            ).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: AUDIT LOGS */}
              {tourStep === 5 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Step 5: Compliance Audit Stream
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-normal">
                      Every administrative, payroll, and geofence action generates an immutable audit log timestamped in UTC.
                    </p>
                  </div>

                  <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden font-mono text-[9px] border border-slate-800">
                    <div className="bg-slate-800 px-4 py-2 flex justify-between items-center text-slate-400 font-bold">
                      <span>Immutable Audit Trail</span>
                      <span className="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-mono select-none">SHA-256 Chain</span>
                    </div>
                    <div className="p-4 space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar flex flex-col-reverse bg-slate-950">
                      {wizardLogs.map((log, index) => (
                        <div key={index} className="text-green-400 font-semibold tracking-wide">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <Link
                      href="/contact"
                      className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Book a guided demo
                    </Link>
                  </div>
                </div>
              )}

              {/* Back / Next Controls */}
              <div className="border-t border-slate-200 pt-4 mt-6 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Simulation Step {tourStep} / 5
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={tourStep === 1}
                    onClick={() => setTourStep(prev => prev - 1)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (tourStep === 5) {
                        setTourStep(1);
                      } else {
                        setTourStep(prev => prev + 1);
                      }
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    {tourStep === 5 ? 'Restart Walkthrough' : 'Next Step'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* MAIN DOCUMENTATION BODY */}
      <div className="max-w-[1100px] mx-auto w-full px-6 py-12 flex-1 flex flex-col md:flex-row gap-12 relative">
        
        {/* DESKTOP SIDEBAR - STICKY */}
        <aside className="hidden md:block w-[200px] shrink-0 sticky top-24 self-start">
          <nav className="flex flex-col gap-1 border-l border-slate-100">
            {modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => scrollToSection(mod.id)}
                className={`text-left pl-4 py-2 border-l-[3px] text-sm font-semibold transition-all cursor-pointer ${
                  activeSection === mod.id
                    ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/30'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                {mod.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* MOBILE STICKY NAVIGATION BAR */}
        <div className="md:hidden sticky top-16 left-0 right-0 z-30 bg-white border-b border-slate-200 -mx-6 px-6 py-3 overflow-x-auto scrollbar-none flex gap-2">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => scrollToSection(mod.id)}
              className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeSection === mod.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {mod.name}
            </button>
          ))}
        </div>

        {/* DOCUMENTATION CONTENT AREA */}
        <main className="flex-1 space-y-20">
          
          {/* 1. EMPLOYEES */}
          <section 
            id="employees" 
            ref={(el) => { sectionRefs.current['employees'] = el; }}
            className="pt-6 border-b border-slate-150 pb-16 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 select-none">
                <span className="material-symbols-outlined text-[24px]">group</span>
              </div>
              <h2 className="text-2xl font-[800] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Employees Module
              </h2>
            </div>

            {/* Dashboard Mockup - Fully Interactive */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/9] flex flex-col justify-between">
              <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Employee Onboarding Wizard</span>
                <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Simulator Sandbox</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between">
                {onboardStep === 1 && (
                  <div className="space-y-2 py-1 flex-1 flex flex-col justify-center">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase">Step 1: Personal Profile</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        value={onboardData.name} 
                        onChange={(e) => setOnboardData({...onboardData, name: e.target.value})}
                        className="bg-slate-55 border border-slate-200 p-2 text-[10px] rounded focus:border-blue-600" 
                        placeholder="Full Name"
                      />
                      <input 
                        type="text" 
                        value={onboardData.role} 
                        onChange={(e) => setOnboardData({...onboardData, role: e.target.value})}
                        className="bg-slate-55 border border-slate-200 p-2 text-[10px] rounded focus:border-blue-600" 
                        placeholder="Designation"
                      />
                    </div>
                  </div>
                )}
                {onboardStep === 2 && (
                  <div className="space-y-2 py-1 flex-1 flex flex-col justify-center">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase">Step 2: Bank Compliance</span>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={onboardData.bankVerified} 
                          onChange={(e) => setOnboardData({...onboardData, bankVerified: e.target.checked})}
                          className="cursor-pointer"
                        />
                        Verify Indian bank account details (PAN/IFSC)
                      </label>
                    </div>
                  </div>
                )}
                {onboardStep === 3 && (
                  <div className="space-y-2 py-1 flex-1 flex flex-col justify-center text-center">
                    <span className="material-symbols-outlined text-green-600 text-[24px]">verified</span>
                    <span className="text-[11px] font-bold text-slate-900 block">Onboarding complete!</span>
                    <p className="text-[8px] text-slate-400">Employee profile successfully written to SQL. Bank details encrypted using AES-256-GCM.</p>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-100 pt-2 shrink-0">
                  <span className="text-[8.5px] text-slate-400 font-bold mt-1">Step {onboardStep} of 3</span>
                  <div className="flex gap-2">
                    <button 
                      disabled={onboardStep === 1}
                      onClick={() => setOnboardStep(prev => prev - 1)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200 rounded text-[9px] font-bold cursor-pointer disabled:opacity-40"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => {
                        if (onboardStep === 3) {
                          setOnboardStep(1);
                          setOnboardData({ name: 'Aarav Mehta', role: 'SDE-II', bankVerified: false });
                        } else {
                          setOnboardStep(prev => prev + 1);
                          if (onboardStep === 2) {
                            addAudit(`Employee Onboard Wizard complete: ${onboardData.name} (${onboardData.role}).`);
                          }
                        }
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-750 text-white rounded text-[9px] font-bold cursor-pointer"
                    >
                      {onboardStep === 3 ? 'Reset Sandbox' : 'Next Step'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { title: '7-Step Guided Onboarding', desc: 'A step-by-step wizard capturing personal demographics, professional role mapping, statutory inputs, bank records, and document scans.' },
                { title: 'Org Chart & Department Mapping', desc: 'Define visual department trees, reporting hierarchies, and line-manager relationships effortlessly.' },
                { title: 'Document Vault', desc: 'Secure storage for PAN, Aadhaar, educational transcripts, and previous employment contracts with granular access controls.' },
                { title: 'Lifecycle Tracking', desc: 'Track employee stages dynamically: probation statuses, department transfers, promotions, and structured exit checklists.' },
                { title: 'Granular Role-based Profiles', desc: 'Ensure employees only see what is configured for their role, leaving HR documents private.' },
                { title: 'Excel Import/Export', desc: 'Batch upload existing directories with automatic schema validation to set up your database in minutes.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-[16px] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[15px] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-1 text-slate-500 text-[14px]">
              <span>Want to see Employees in action?</span>
              <Link href="/contact" className="font-bold text-blue-600 hover:underline">
                Request a demo &rarr;
              </Link>
            </div>
          </section>

          {/* 2. ATTENDANCE */}
          <section 
            id="attendance" 
            ref={(el) => { sectionRefs.current['attendance'] = el; }}
            className="pt-6 border-b border-slate-150 pb-16 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100 select-none">
                <span className="material-symbols-outlined text-[24px]">fingerprint</span>
              </div>
              <h2 className="text-2xl font-[800] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Attendance Module
              </h2>
            </div>

            {/* Dashboard Mockup - Fully Interactive */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/9] flex flex-col justify-between">
              <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Attendance Check In & Breaks</span>
                <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Simulator Sandbox</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center text-[10px]">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Daily Shift Marker</span>
                    <span className="font-semibold text-slate-700">Status: {
                      attendState === 'out' ? 'Checked Out' : attendState === 'in' ? 'Clocked In' : 'On Tea Break'
                    }</span>
                  </div>
                  <div className="flex gap-2">
                    {attendState === 'out' ? (
                      <button 
                        onClick={() => {
                          setAttendState('in');
                          setAttendLogs(prev => [`Clocked In (Office IP) - ${new Date().toLocaleTimeString()}`, ...prev.slice(0, 1)]);
                          addAudit("Attendance check-in logged: Lat 12.97, Lng 77.59");
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold rounded cursor-pointer"
                      >
                        Clock In
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            if (attendState === 'in') {
                              setAttendState('break');
                              setAttendLogs(prev => [`Started Break - ${new Date().toLocaleTimeString()}`, ...prev.slice(0, 1)]);
                            } else {
                              setAttendState('in');
                              setAttendLogs(prev => [`Ended Break - ${new Date().toLocaleTimeString()}`, ...prev.slice(0, 1)]);
                            }
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-650 text-[9px] font-bold rounded cursor-pointer"
                        >
                          {attendState === 'break' ? 'End Break' : 'Tea Break'}
                        </button>
                        <button 
                          onClick={() => {
                            setAttendState('out');
                            setAttendLogs(prev => [`Clocked Out - ${new Date().toLocaleTimeString()}`, ...prev.slice(0, 1)]);
                            addAudit("Attendance check-out logged.");
                          }}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-[9px] font-bold rounded cursor-pointer"
                        >
                          Clock Out
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-slate-100 pt-2.5 flex-1 flex flex-col justify-end gap-1.5 overflow-hidden">
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Attendance Logs Tracker</span>
                  <div className="space-y-1 font-mono text-[8px] text-slate-500">
                    {attendLogs.map((log, index) => (
                      <div key={index}>● {log}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { title: 'Shift-Aware Late Thresholds', desc: 'Define check-in grace margins (e.g., 15 minutes) per shift, with automated alerts triggered when thresholds are breached.' },
                { title: 'Geofenced Check-In modes', desc: 'Allow tap-based check-ins for Office (WF) or Remote (WFH) locations, backed by IP & coordinates matching.' },
                { title: 'Micro-Break Tracker', desc: 'Log individual daily breaks (lunch, coffee, tea) to accurately track net working hours.' },
                { title: 'Double-Approval Adjustments', desc: 'Allows employees to submit adjustment requests for forgotten checks, subject to review by manager and HR.' },
                { title: 'Automated Nightly Absentees', desc: 'CRON worker automatically flags employees absent at midnight if no check-in was recorded for a working day.' },
                { title: 'Device Integration Sync', desc: 'Integrate with local biometrics/card systems using secure API hooks.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-[16px] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[15px] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-1 text-slate-500 text-[14px]">
              <span>Want to see Attendance in action?</span>
              <Link href="/contact" className="font-bold text-blue-600 hover:underline">
                Request a demo &rarr;
              </Link>
            </div>
          </section>

          {/* 3. LEAVE */}
          <section 
            id="leave" 
            ref={(el) => { sectionRefs.current['leave'] = el; }}
            className="pt-6 border-b border-slate-150 pb-16 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 select-none">
                <span className="material-symbols-outlined text-[24px]">date_range</span>
              </div>
              <h2 className="text-2xl font-[800] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Leave Module
              </h2>
            </div>

            {/* Dashboard Mockup - Fully Interactive */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/9] flex flex-col justify-between">
              <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Leave Balance & Submission form</span>
                <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Simulator Sandbox</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between gap-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold uppercase">Leave Balance:</span>
                  <span className="font-extrabold text-blue-600 text-sm">{leaveBalance} Days remaining</span>
                </div>
                
                {/* Form to submit a leave request */}
                <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-2 items-center">
                  <select 
                    value={newLeaveType}
                    onChange={(e) => setNewLeaveType(e.target.value)}
                    className="bg-slate-50 border border-slate-200 p-1 rounded text-[9px] cursor-pointer"
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Earned Leave">Earned Leave</option>
                  </select>
                  <input 
                    type="number"
                    value={newLeaveDays}
                    onChange={(e) => setNewLeaveDays(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="bg-slate-50 border border-slate-200 p-1 rounded text-[9px] w-full"
                  />
                  <button 
                    onClick={() => {
                      if (leaveBalance >= newLeaveDays) {
                        setLeaveHistory(prev => [
                          { id: Date.now(), type: newLeaveType, duration: newLeaveDays, status: 'Pending Approval' },
                          ...prev
                        ]);
                        addAudit(`Leave request filed: ${newLeaveType} for ${newLeaveDays} days.`);
                      } else {
                        alert('Insufficient leave balance!');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-750 text-white font-bold rounded p-1 text-[9px] cursor-pointer"
                  >
                    Apply Leave
                  </button>
                </div>

                {/* Queue list */}
                <div className="flex-1 overflow-y-auto text-[8px] space-y-1.5 max-h-[60px]">
                  {leaveHistory.map((leave) => (
                    <div key={leave.id} className="flex justify-between items-center border-b border-slate-50 pb-1">
                      <span>{leave.type} ({leave.duration} Days)</span>
                      <div className="flex gap-1.5 items-center">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          leave.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-600'
                        }`}>{leave.status}</span>
                        {leave.status === 'Pending Approval' && (
                          <button 
                            onClick={() => {
                              setLeaveHistory(prev => prev.map(l => l.id === leave.id ? { ...l, status: 'Approved' } : l));
                              setLeaveBalance(prev => Math.max(0, prev - leave.duration));
                              addAudit(`Leave approved. Balance decremented by ${leave.duration} days.`);
                            }}
                            className="bg-slate-100 hover:bg-slate-250 border border-slate-250 text-slate-700 font-bold rounded px-1.5 py-0.5 text-[7px]"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { title: 'Rigid Two-Stage Approvals', desc: 'Leaves require structural sign-off: manager review first, then HR final verification. Balances are not decremented until HR signature.' },
                { title: 'Weekend & Holiday Filtering', desc: 'System automatically filters organization holidays and Saturdays/Sundays to prevent over-allocation.' },
                { title: 'Multiple Configurable Leave Types', desc: 'Supports Sick, Casual, Earned, Unpaid (LOP), Half-day, and work-from-home configurations.' },
                { title: 'Conflict Overlap Audits', desc: 'Warns HR managers if an active leave overlaps with task deadlines or attendance records.' },
                { title: 'Leave Cancellation Rules', desc: 'Allows employees to cancel manager-approved requests before final HR execution, automatically triggering alerts.' },
                { title: 'Policy Propagation Settings', desc: 'Propagates balance updates automatically when HR resets standard policy limits mid-year.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-[16px] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[15px] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-1 text-slate-500 text-[14px]">
              <span>Want to see Leave in action?</span>
              <Link href="/contact" className="font-bold text-blue-600 hover:underline">
                Request a demo &rarr;
              </Link>
            </div>
          </section>

          {/* 4. TASKS */}
          <section 
            id="tasks" 
            ref={(el) => { sectionRefs.current['tasks'] = el; }}
            className="pt-6 border-b border-slate-150 pb-16 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100 select-none">
                <span className="material-symbols-outlined text-[24px]">assignment</span>
              </div>
              <h2 className="text-2xl font-[800] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Tasks Module
              </h2>
            </div>

            {/* Dashboard Mockup - Fully Interactive */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/9] flex flex-col justify-between">
              <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Task State Machine Sandbox</span>
                <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Simulator Sandbox</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between gap-3">
                <div className="text-[10px] font-bold text-slate-700 border-b border-slate-100 pb-2 flex justify-between items-center">
                  <span>Task: Build PostgreSQL Shards</span>
                  <span className="text-blue-600 font-mono text-[9px]">Priority: High</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 flex-1 pt-1.5">
                  <div className="space-y-1.5">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase block">State Transition</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-violet-100 text-violet-700 rounded text-[9.5px] font-bold border border-violet-150">
                        {taskState}
                      </span>
                    </div>
                  </div>
                  {taskState === 'REVIEW' && (
                    <div className="space-y-1 flex flex-col justify-center">
                      <label className="text-[8px] text-slate-400 font-bold uppercase block">Quality Evaluation Score</label>
                      <select 
                        value={taskRating}
                        onChange={(e) => setTaskRating(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 rounded text-[9px] p-1 cursor-pointer w-full"
                      >
                        {[5, 6, 7, 8, 9, 10].map(s => <option key={s} value={s}>{s} / 10 Points</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 shrink-0 border-t border-slate-100 pt-2">
                  <button 
                    onClick={() => {
                      setTaskState('DRAFT');
                      addAudit("Reset task back to DRAFT state.");
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded text-[8.5px] font-bold cursor-pointer"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => {
                      if (taskState === 'DRAFT') {
                        setTaskState('IN_PROGRESS');
                        addAudit("Advanced task state: DRAFT -> IN_PROGRESS.");
                      } else if (taskState === 'IN_PROGRESS') {
                        setTaskState('REVIEW');
                        addAudit("Advanced task state: IN_PROGRESS -> REVIEW.");
                      } else if (taskState === 'REVIEW') {
                        setTaskState('CLOSED');
                        addAudit(`Task CLOSED. Quality Score logged: ${taskRating}/10.`);
                      }
                    }}
                    disabled={taskState === 'CLOSED'}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-750 text-white rounded text-[8.5px] font-bold cursor-pointer disabled:opacity-40"
                  >
                    {taskState === 'REVIEW' ? 'Review & Close' : 'Advance State &rarr;'}
                  </button>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { title: '10-State Finite State Machine', desc: 'Task lifecycles strictly travel states: Draft → Assigned → In-progress → Review → Closed, blockading illegal shortcuts.' },
                { title: 'Granular Task Scopes', desc: 'Create tasks scoped to Personal, Team, Department, or Organization boundaries to safeguard compliance views.' },
                { title: 'Peer Review Workflows', desc: 'Integrate quality review steps, allowing assigners to approve submittals or enforce rework loops.' },
                { title: 'Stat-Driven Performance Logs', desc: 'Log task completion latencies and rework scores to directly feed the review metrics engine.' },
                { title: 'Interactive Board Boards', desc: 'Drag-and-drop Kanban panels with color-coded priority flags (High, Medium, Low).' },
                { title: 'Audit Trail Integration', desc: 'Log every task update, status shift, and assignment revision to the immutable log system.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-[16px] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[15px] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-1 text-slate-500 text-[14px]">
              <span>Want to see Tasks in action?</span>
              <Link href="/contact" className="font-bold text-blue-600 hover:underline">
                Request a demo &rarr;
              </Link>
            </div>
          </section>

          {/* 5. PERFORMANCE */}
          <section 
            id="performance" 
            ref={(el) => { sectionRefs.current['performance'] = el; }}
            className="pt-6 border-b border-slate-150 pb-16 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 select-none">
                <span className="material-symbols-outlined text-[24px]">trending_up</span>
              </div>
              <h2 className="text-2xl font-[800] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Performance Module
              </h2>
            </div>

            {/* Dashboard Mockup - Fully Interactive */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/9] flex flex-col justify-between">
              <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Weighted Composite Review Engine</span>
                <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Simulator Sandbox</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-800">Weights configuration: Task rate, Quality, Attendance</span>
                
                {/* Weight slider simulations */}
                <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-2">
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-400 font-bold block uppercase">Task Weight ({weightTask}%)</span>
                    <input 
                      type="range" 
                      min="10" 
                      max="60" 
                      value={weightTask} 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setWeightTask(val);
                        setWeightQuality(Math.round((100 - val) / 2));
                        setWeightAttendance(100 - val - Math.round((100 - val) / 2));
                      }}
                      className="w-full cursor-pointer" 
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-400 font-bold block uppercase">Quality ({weightQuality}%)</span>
                    <input 
                      type="range" 
                      min="10" 
                      max="60" 
                      value={weightQuality} 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setWeightQuality(val);
                        setWeightTask(Math.round((100 - val) / 2));
                        setWeightAttendance(100 - val - Math.round((100 - val) / 2));
                      }}
                      className="w-full cursor-pointer" 
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-400 font-bold block uppercase">Attendance ({weightAttendance}%)</span>
                    <input 
                      type="range" 
                      min="10" 
                      max="60" 
                      value={weightAttendance} 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setWeightAttendance(val);
                        setWeightTask(Math.round((100 - val) / 2));
                        setWeightQuality(100 - val - Math.round((100 - val) / 2));
                      }}
                      className="w-full cursor-pointer" 
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 text-[10px]">
                  <div>
                    <span className="text-[8px] text-slate-450 block uppercase">Composite Score Output:</span>
                    <span className="text-lg font-bold text-slate-800 font-mono">{calcPerformanceScore()} / 100 Points</span>
                  </div>
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-bold border border-green-100 text-[8.5px]">
                    {calcGradeBand(calcPerformanceScore())}
                  </span>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { title: '5-Factor Composite Score', desc: 'Calculates performance with custom weights: Task Completion (25%), Deadline Adherence (20%), Quality Index (25%), Attendance Rate (20%), and HR Feedback (10%).' },
                { title: 'Draft-State Private Reviews', desc: 'Reviews are compiled privately and only made visible/released when HR executes the release trigger.' },
                { title: 'HR Qualitative Scorecard', desc: 'HR can submit detailed scores (0–5 rating) and narrative feedback that triggers automatic recalculation of composite numbers.' },
                { title: 'Automatic Grading Bands', desc: 'Maps grades dynamically based on final composite scores (S, A, B, C, D bands).' },
                { title: 'Org-wide Performance Leaderboard', desc: 'Enables management to see top-performing divisions and team members based on structured metrics.' },
                { title: 'Goal-Setting Milestones', desc: 'Track employee key result areas (OKR style) with automatic progress syncs.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-[16px] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[15px] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-1 text-slate-500 text-[14px]">
              <span>Want to see Performance in action?</span>
              <Link href="/contact" className="font-bold text-blue-600 hover:underline">
                Request a demo &rarr;
              </Link>
            </div>
          </section>

          {/* 6. PAYROLL */}
          <section 
            id="payroll" 
            ref={(el) => { sectionRefs.current['payroll'] = el; }}
            className="pt-6 border-b border-slate-150 pb-16 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100 select-none">
                <span className="material-symbols-outlined text-[24px]">payments</span>
              </div>
              <h2 className="text-2xl font-[800] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Payroll Module
              </h2>
            </div>

            {/* Dashboard Mockup - Fully Interactive */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/9] flex flex-col justify-between">
              <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Statutory Deduction & Net Payout Calculator</span>
                <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Simulator Sandbox</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-400 font-bold block uppercase">Monthly Gross (₹)</span>
                    <input 
                      type="number"
                      step={5000}
                      value={payrollGross}
                      onChange={(e) => setPayrollGross(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-200 p-1.5 text-[9.5px] rounded w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-400 font-bold block uppercase">LOP Unpaid Days</span>
                    <input 
                      type="number"
                      min="0"
                      max="15"
                      step="0.5"
                      value={payrollLopDays}
                      onChange={(e) => setPayrollLopDays(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-200 p-1.5 text-[9.5px] rounded w-full"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-4 text-[9px] text-slate-650">
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between"><span>LOP Deducts:</span> <span>-₹{Math.round(payrollResult.lopAmount)}</span></div>
                    <div className="flex justify-between"><span>PF (12% cap):</span> <span>₹{payrollResult.pf}</span></div>
                    <div className="flex justify-between"><span>ESIC:</span> <span>₹{payrollResult.esic}</span></div>
                    <div className="flex justify-between"><span>Prof Tax:</span> <span>₹{payrollResult.pt}</span></div>
                  </div>
                  <div className="flex flex-col justify-center items-end border-l border-slate-100 pl-4">
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Net Payout:</span>
                    <span className="text-base font-black text-blue-600 font-mono">₹{payrollResult.netSalary}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { title: 'Indian Statutory Computations', desc: 'Auto-calculates Provident Fund (PF) capped at ₹1,800 limit, ESIC rules (0.75% / 3.25% gross <= ₹21,000 threshold), and local state-wise Professional Tax (PT) slabs.' },
                { title: 'Dynamic LOP Computations', desc: 'Syncs with the attendance database to automatically compute unpaid absent days and LOP adjustments.' },
                { title: 'New vs Old Regime TDS', desc: 'Configures tax regimes dynamically per employee to process correct statutory TDS deductions.' },
                { title: 'Special Intern Stipends', desc: 'Process interns under a zero-deduction compliance scheme (stipend only) with custom configuration rules.' },
                { title: 'PDF Payslip Exports', desc: 'Generates compliant monthly payslip records and exports them as print-ready PDF files.' },
                { title: 'Payroll History Logs', desc: 'Maintains historical payroll logs matching database indices for smooth audit operations.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-[16px] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[15px] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-1 text-slate-500 text-[14px]">
              <span>Want to see Payroll in action?</span>
              <Link href="/contact" className="font-bold text-blue-600 hover:underline">
                Request a demo &rarr;
              </Link>
            </div>
          </section>

          {/* 7. EXPENSES */}
          <section 
            id="expenses" 
            ref={(el) => { sectionRefs.current['expenses'] = el; }}
            className="pt-6 border-b border-slate-150 pb-16 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 select-none">
                <span className="material-symbols-outlined text-[24px]">receipt_long</span>
              </div>
              <h2 className="text-2xl font-[800] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Expenses Module
              </h2>
            </div>

            {/* Dashboard Mockup - Fully Interactive */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/9] flex flex-col justify-between">
              <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Claims Ledger Sandbox</span>
                <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Simulator Sandbox</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between gap-2">
                
                {/* Form to submit an expense */}
                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2 items-center">
                  <input 
                    type="text"
                    value={newExpenseTitle}
                    onChange={(e) => setNewExpenseTitle(e.target.value)}
                    className="bg-slate-50 border border-slate-200 p-1 rounded text-[9px] w-full"
                    placeholder="Title (e.g. Travel)"
                  />
                  <input 
                    type="number"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    className="bg-slate-50 border border-slate-200 p-1 rounded text-[9px] w-full"
                    placeholder="Amount (₹)"
                  />
                  <button 
                    onClick={() => {
                      if (newExpenseTitle.trim() && newExpenseAmount) {
                        setExpenseList(prev => [
                          { title: newExpenseTitle, amount: Number(newExpenseAmount), status: 'Pending Manager' },
                          ...prev
                        ]);
                        addAudit(`Expense claim submitted: ${newExpenseTitle} (₹${newExpenseAmount}).`);
                        setNewExpenseTitle('');
                        setNewExpenseAmount('');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-750 text-white font-bold rounded p-1 text-[9px] cursor-pointer"
                  >
                    File Claim
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto text-[8.5px] space-y-1.5 max-h-[60px]">
                  {expenseList.map((exp, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-1">
                      <span>{exp.title} (₹{exp.amount})</span>
                      <div className="flex gap-1.5 items-center">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          exp.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-600'
                        }`}>{exp.status}</span>
                        {exp.status === 'Pending Manager' && (
                          <button 
                            onClick={() => {
                              setExpenseList(prev => prev.map((e, i) => i === idx ? { ...e, status: 'Paid' } : e));
                              addAudit(`Expense approved by manager & processed as Paid.`);
                            }}
                            className="bg-slate-100 hover:bg-slate-250 border border-slate-250 text-slate-700 font-bold rounded px-1.5 py-0.5 text-[7px]"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { title: 'Receipt Upload Trails', desc: 'Secure image/file storage associated with every submission for transparent audit-ready claims.' },
                { title: 'Two-Stage Approval Rules', desc: 'Claims must pass team manager stage 1 and finance manager stage 2 before execution.' },
                { title: 'Configurable Spend Caps', desc: 'Enforce limits per department and role to auto-flag policy violations.' },
                { title: 'Reimbursement Audit Trails', desc: 'Maintains records of when claims are paid, with timestamps and transaction links.' },
                { title: 'Tax Category Assignments', desc: 'Categorize claims under local statutory tax codes (e.g. Travel, Office, Client entertainment).' },
                { title: 'Excel Reconciliation Sheets', desc: 'Compile claims records in unified sheets for simple bank payouts.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-[16px] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[15px] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-1 text-slate-500 text-[14px]">
              <span>Want to see Expenses in action?</span>
              <Link href="/contact" className="font-bold text-blue-600 hover:underline">
                Request a demo &rarr;
              </Link>
            </div>
          </section>

          {/* 8. ASSETS */}
          <section 
            id="assets" 
            ref={(el) => { sectionRefs.current['assets'] = el; }}
            className="pt-6 border-b border-slate-150 pb-16 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 select-none">
                <span className="material-symbols-outlined text-[24px]">devices</span>
              </div>
              <h2 className="text-2xl font-[800] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Assets Module
              </h2>
            </div>

            {/* Dashboard Mockup - Fully Interactive */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/9] flex flex-col justify-between">
              <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Asset Inventory Manager</span>
                <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Simulator Sandbox</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between gap-3">
                <div className="text-[10px] flex justify-between items-center">
                  <span className="font-bold text-slate-800">{assetList[0].type}</span>
                  <span className="font-mono text-slate-400">{assetList[0].id}</span>
                </div>
                <div className="border-y border-slate-100 py-2.5 flex justify-between items-center text-[9.5px]">
                  <span>Status: <strong className={assetList[0].status === 'Assigned' ? 'text-blue-600' : 'text-green-600'}>{assetList[0].status}</strong></span>
                  {assetList[0].status === 'Assigned' && <span>Held by: <strong>{assetList[0].assignee}</strong></span>}
                </div>
                <div className="flex justify-end gap-2">
                  {assetList[0].status === 'Available' ? (
                    <button 
                      onClick={() => {
                        setAssetList([{ ...assetList[0], status: 'Assigned', assignee: 'Aarav Mehta' }]);
                        addAudit(`Asset AST-2026-04 assigned to Aarav Mehta.`);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-750 text-white rounded text-[9.5px] font-bold cursor-pointer"
                    >
                      Assign to Aarav
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setAssetList([{ ...assetList[0], status: 'Available', assignee: '-' }]);
                        addAudit(`Asset AST-2026-04 returned and logged available.`);
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 rounded text-[9.5px] font-bold cursor-pointer"
                    >
                      Process Return Check
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { title: 'Inventory Log Cataloging', desc: 'Track laptops, hardware, mobile phones, security badges, and corporate keys in a secure central central index.' },
                { title: 'Employee Assignment Logs', desc: 'Assign equipment to employees with automated timestamp logs and digital hand-off records.' },
                { title: 'Return Checklist Flows', desc: 'Verify physical conditions and document resets when assets are returned upon offboarding.' },
                { title: 'Asset Status States', desc: 'Mark gear statuses: Available, Assigned, Maintenance, or Retired.' },
                { title: 'SerialNumber Index Matches', desc: 'Search and match equipment based on serial numbers, IP codes, or internal asset tags.' },
                { title: 'Service History Tracks', desc: 'Log asset maintenance events, repair costs, and warranty timelines.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-[16px] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[15px] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-1 text-slate-500 text-[14px]">
              <span>Want to see Assets in action?</span>
              <Link href="/contact" className="font-bold text-blue-600 hover:underline">
                Request a demo &rarr;
              </Link>
            </div>
          </section>

          {/* 9. KNOWLEDGE BASE */}
          <section 
            id="knowledge-base" 
            ref={(el) => { sectionRefs.current['knowledge-base'] = el; }}
            className="pt-6 border-b border-slate-150 pb-16 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 select-none">
                <span className="material-symbols-outlined text-[24px]">menu_book</span>
              </div>
              <h2 className="text-2xl font-[800] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Knowledge Base Module
              </h2>
            </div>

            {/* Dashboard Mockup - Fully Interactive */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/9] flex flex-col justify-between">
              <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Internal SOP wiki builder</span>
                <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Simulator Sandbox</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={wikiTitle}
                    onChange={(e) => setWikiTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-[9.5px] p-1.5 rounded font-bold"
                  />
                  <textarea 
                    value={wikiContent}
                    onChange={(e) => setWikiContent(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 text-[8.5px] p-1.5 rounded"
                  />
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-2 shrink-0">
                  <span className="text-[8px] text-slate-400 font-mono font-semibold">Version: v{wikiVersion}</span>
                  <button 
                    onClick={() => {
                      setWikiVersion(prev => prev + 1);
                      addAudit(`Knowledge Base article edited. Version incremented: v${wikiVersion + 1}`);
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-750 text-white rounded text-[8.5px] font-bold cursor-pointer"
                  >
                    Publish Version
                  </button>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { title: 'Markdown Wiki Editor', desc: 'Create and publish SOP guides, corporate policies, and onboarding wiki guides using clean formatting.' },
                { title: 'Version History Tracks', desc: 'Logs every edit and keeps historical versions to guarantee change audit trails.' },
                { title: 'Author-Attributed Metadata', desc: 'Displays author names, reviewer logs, and publication timestamps on every page.' },
                { title: 'Granular Document Scopes', desc: 'Restrict reading accesses to specific departments, management, or roles.' },
                { title: 'Index Search Registry', desc: 'Find guidelines instantly with tag indexes and text searches.' },
                { title: 'Print PDF Handouts', desc: 'Format pages automatically to generate clean, readable PDF document files.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-[16px] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[15px] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-1 text-slate-500 text-[14px]">
              <span>Want to see Knowledge Base in action?</span>
              <Link href="/contact" className="font-bold text-blue-600 hover:underline">
                Request a demo &rarr;
              </Link>
            </div>
          </section>

          {/* 10. NOTIFICATIONS */}
          <section 
            id="notifications" 
            ref={(el) => { sectionRefs.current['notifications'] = el; }}
            className="pt-6 border-b border-slate-150 pb-16 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 select-none">
                <span className="material-symbols-outlined text-[24px]">notifications_active</span>
              </div>
              <h2 className="text-2xl font-[800] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Notifications Module
              </h2>
            </div>

            {/* Dashboard Mockup - Fully Interactive */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/9] flex flex-col justify-between">
              <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>In-app Notification Inbox Alerts</span>
                <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Simulator Sandbox</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between gap-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 shrink-0">
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase">Click triggers to simulate:</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setInboxNotifications(prev => [
                          { id: Date.now(), text: 'New Task: Optimize SQL shards allocated to team.', read: false },
                          ...prev
                        ]);
                        addAudit("Mock in-app notification fired: task_assigned.");
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-650 text-[8.5px] rounded cursor-pointer"
                    >
                      Task Alert
                    </button>
                    <button 
                      onClick={() => {
                        setInboxNotifications(prev => [
                          { id: Date.now(), text: 'Leave Request Approved by HR Manager.', read: false },
                          ...prev
                        ]);
                        addAudit("Mock in-app notification fired: leave_approved.");
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-650 text-[8.5px] rounded cursor-pointer"
                    >
                      Leave Alert
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto text-[8.5px] space-y-1.5 max-h-[60px]">
                  {inboxNotifications.map((notif) => (
                    <div key={notif.id} className="flex gap-2 items-center text-slate-700 border-b border-slate-50 pb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span>{notif.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { title: 'Real-Time Delivery Settings', desc: 'Delivers system notices (e.g. task reviews, leave statuses) instantly to target dashboards.' },
                { title: 'Role-Scoped Audiences', desc: 'Target announcements or alerts directly to specific departments, groups, or administrative users.' },
                { title: 'Security Alert Scopes', desc: 'Triggers priority warnings when credential updates, profile changes, or bank data changes occur.' },
                { title: 'Read-Status Tracking logs', desc: 'Keeps record of read/unread states to optimize notification workflows.' },
                { title: 'Quiet-Hour Settings', desc: 'Enables custom rules to buffer non-critical alerts, preventing chat fatigue.' },
                { title: 'Template Customizations', desc: 'Enables HR admins to configure custom messaging layouts for system-wide notices.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-[16px] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[15px] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-1 text-slate-500 text-[14px]">
              <span>Want to see Notifications in action?</span>
              <Link href="/contact" className="font-bold text-blue-600 hover:underline">
                Request a demo &rarr;
              </Link>
            </div>
          </section>

          {/* 11. AUDIT LOG */}
          <section 
            id="audit-log" 
            ref={(el) => { sectionRefs.current['audit-log'] = el; }}
            className="pt-6 pb-16 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 border border-stone-200 select-none">
                <span className="material-symbols-outlined text-[24px]">history</span>
              </div>
              <h2 className="text-2xl font-[800] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Audit Log Module
              </h2>
            </div>

            {/* Dashboard Mockup - Fully Interactive */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/9] flex flex-col justify-between">
              <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Immutable Organisation Audit Log Streams</span>
                <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Simulator Sandbox</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 flex flex-col justify-between gap-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 shrink-0">
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase">Trigger Security Simulations:</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setAuditEvents(prev => [
                          `[SECURITY WARN] ${new Date().toLocaleTimeString()} - GPS coordinate check failed for user EMP-009. Coordinates mismatch Org-WFO range. Check blocked.`,
                          ...prev
                        ]);
                      }}
                      className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-700 text-[8.5px] rounded cursor-pointer"
                    >
                      Geo-Spoof Block
                    </button>
                    <button 
                      onClick={() => {
                        setAuditEvents(prev => [
                          `[FIREWALL BLOCK] ${new Date().toLocaleTimeString()} - Rate limiter blocked API request sequence on /api/auth/login from IP 192.168.1.198.`,
                          ...prev
                        ]);
                      }}
                      className="px-2 py-0.5 bg-red-50 hover:bg-red-100 border border-red-250 text-red-700 text-[8.5px] rounded cursor-pointer"
                    >
                      Rate Limiter Alert
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto text-[7px] text-slate-500 font-mono space-y-1.5 max-h-[70px]">
                  {auditEvents.map((evt, idx) => (
                    <div key={idx} className={evt.includes('SECURITY') ? 'text-amber-600 font-bold' : evt.includes('FIREWALL') ? 'text-red-600 font-bold' : ''}>
                      {evt}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { title: 'Immutable Row Auditing', desc: 'Every row addition, update, or deletion is logged automatically to an unalterable audit archive.' },
                { title: 'Before & After Value Caps', desc: 'Saves JSON diff payloads showing the state of database records before and after action execution.' },
                { title: 'Ip & Actor Attribution', desc: 'Attributes every single system transaction to a specific user account, session key, and client IP address.' },
                { title: 'Security Threat Flags', desc: 'Flags suspicious activities (such as rapid sequence updates or unauthorized export attempts) for admin inspection.' },
                { title: 'Searchable Audit Indexes', desc: 'Allows compliance teams to search system histories by specific user, timestamp, or table entity.' },
                { title: 'Statutory Compliance Ready', desc: 'Provides ready-to-verify system histories matching ISO, SOC2, and statutory Indian compliance rules.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-[16px] text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[15px] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-1 text-slate-500 text-[14px]">
              <span>Want to see Audit Log in action?</span>
              <Link href="/contact" className="font-bold text-blue-600 hover:underline">
                Request a demo &rarr;
              </Link>
            </div>
          </section>

        </main>
      </div>

      {/* Global Navigation Footer */}
      <LandingFooter />
    </div>
  );
}
