'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LandingHeader } from '../components/layout/LandingHeader';
import { LandingFooter } from '../components/layout/LandingFooter';
import { AmbientGrid } from '../components/ui/AmbientGrid';
import { useAuth } from '../lib/auth/AuthProvider';
import { api } from '../lib/api/client';
import VoyagerChatbot from '../components/chatbot/VoyagerChatbot';
import Image from 'next/image';

export default function HomepageClient() {
  const { user } = useAuth();

  // Tab showcase state
  const [activeTab, setActiveTab] = useState<'hr' | 'employee' | 'manager' | 'finance' | 'admin'>('hr');
  const [fade, setFade] = useState(true);

  // Live Interactive Mockup States
  const [clockedIn, setClockedIn] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(96.8);
  const [pendingLeaves, setPendingLeaves] = useState(3);
  const [mockLogs, setMockLogs] = useState<string[]>([
    "[AUDIT LOG] 19:30:04 - Shift verification CRON run successfully.",
    "[AUDIT LOG] 19:12:15 - Kabir Sen applied for Sick Leave (June 20-22)."
  ]);

  // HR Showcase Mockup State
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardSuccess, setOnboardSuccess] = useState(false);
  const onboardStepNames = [
    'Firm Setup',
    'Excel Upload',
    'Column Mapping',
    'Verification & Editing',
    'Key Personnel',
    'Complete Setup'
  ];

  // Employee Showcase Mockup State
  const [empClockedIn, setEmpClockedIn] = useState(false);
  const [empLogs, setEmpLogs] = useState<string[]>(['Checked Out - Yesterday']);

  // Manager Showcase Mockup State
  const [priyaLeaveStatus, setPriyaLeaveStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Finance Showcase Mockup State
  const [payrollApproved, setPayrollApproved] = useState(false);
  const [payrollApproving, setPayrollApproving] = useState(false);

  // Admin Showcase Mockup State
  const [hrPermissions, setHrPermissions] = useState({
    dbAccess: true,
    runPayroll: false
  });
  const [adminLogs, setAdminLogs] = useState<string[]>([
    "[AUDIT LOG] 14:02:18 - Admin updated 'HR Manager' permission: payroll_write disabled."
  ]);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    companySize: '',
    challenge: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Onboarding Animation Simulator State
  const [simState, setSimState] = useState<'idle' | 'dragging' | 'dropped' | 'processing' | 'success'>('idle');
  const [simProgress, setSimProgress] = useState(0);

  // Trial Registration Modal States
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialForm, setTrialForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    companySize: '',
    challenge: ''
  });
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState('');

  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;
    let timer4: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const runCycle = () => {
      setSimState('idle');
      setSimProgress(0);

      // Start dragging after 2 seconds
      timer1 = setTimeout(() => {
        setSimState('dragging');

        // Drop the file in the dropzone after 2.5 seconds of dragging
        timer2 = setTimeout(() => {
          setSimState('dropped');

          // Start processing 0.5 seconds after dropping
          timer3 = setTimeout(() => {
            setSimState('processing');
            let progressVal = 0;

            progressInterval = setInterval(() => {
              progressVal += 5;
              setSimProgress(progressVal);
              if (progressVal >= 100) {
                clearInterval(progressInterval);
                setSimState('success');

                // Show success screen for 4.5 seconds, then repeat the loop
                timer4 = setTimeout(() => {
                  runCycle();
                }, 4500);
              }
            }, 70); // 70ms * 20 steps = 1.4s total processing time

          }, 500);

        }, 2500);

      }, 2000);
    };

    runCycle();

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearInterval(progressInterval);
    };
  }, []);

  // Handle cross-fade transition for tabs
  const handleTabChange = (tab: typeof activeTab) => {
    setFade(false);
    setTimeout(() => {
      setActiveTab(tab);
      setFade(true);
    }, 150);
  };

  // Live interactive controls for Hero Mockup
  const handleHeroClockIn = () => {
    if (!clockedIn) {
      setClockedIn(true);
      setAttendanceCount(98.4);
      setMockLogs((prev) => [
        `[ATTENDANCE] ${new Date().toLocaleTimeString()} - User EMP-042 checked in successfully.`,
        ...prev
      ]);
    } else {
      setClockedIn(false);
      setAttendanceCount(96.8);
      setMockLogs((prev) => [
        `[ATTENDANCE] ${new Date().toLocaleTimeString()} - User EMP-042 checked out successfully.`,
        ...prev
      ]);
    }
  };

  const handleHeroApproveLeave = () => {
    if (pendingLeaves > 0) {
      setPendingLeaves((prev) => prev - 1);
      setMockLogs((prev) => [
        `[LEAVE] ${new Date().toLocaleTimeString()} - Admin signed off leave application ID: 412.`,
        ...prev
      ]);
    }
  };

  // Form handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.companySize) newErrors.companySize = 'Company size is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleRegisterTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrialError('');
    setTrialLoading(true);

    try {
      const res = await api.auth.registerTrial({
        firstName: trialForm.firstName.trim(),
        lastName: trialForm.lastName.trim(),
        email: trialForm.email.trim(),
        phone: trialForm.phone.trim(),
        companyName: trialForm.companyName.trim(),
        companySize: trialForm.companySize,
        challenge: trialForm.challenge.trim(),
        source: 'homepage trial modal'
      });

      if (res.data?.tokens) {
        localStorage.setItem('token', res.data.tokens.accessToken);
        localStorage.setItem('refreshToken', res.data.tokens.refreshToken);

        if (typeof window !== 'undefined' && (window as any).WorkforceOSBridge) {
          (window as any).WorkforceOSBridge.postMessage(JSON.stringify({
            type: 'save_token',
            token: res.data.tokens.accessToken,
            refreshToken: res.data.tokens.refreshToken,
          }));
        }

        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setTrialError(err.message || 'Trial registration failed. Please try again.');
    } finally {
      setTrialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-900">
      {/* Global Navigation Header */}
      <LandingHeader />

      {/* Screen-reader heading for global SEO keyphrase indexing */}
      <h1 className="sr-only">WorkforceOS | Unified Indian B2B HRMS & Operations Platform</h1>

      {/* SECTION 1: HERO */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-slate-50 border-b border-slate-200 overflow-hidden">
        {/* Ambient Grid Flow Background Animation */}
        <AmbientGrid />


        <div className="max-w-[760px] mx-auto text-center px-6 relative z-10 flex flex-col items-center">
          {/* Eyebrow Pill */}
          <span
            className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            WORKFORCE MANAGEMENT FOR INDIAN BUSINESSES
          </span>

          {/* Main Headline - Solid Color, No Gradients */}
          <h2
            className="text-4xl md:text-[4.25rem] font-[800] text-slate-900 leading-[1.1] tracking-[-0.03em] mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Run your entire team from one place.
          </h2>

          {/* Subheadline */}
          <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-[560px] mb-10 font-normal">
            WorkforceOS handles attendance, tasks, leaves, payroll, and performance — built for the way Indian companies actually operate.
          </p>

          {/* CTA Row - No shadows */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4 mb-16">
            <button
              onClick={() => setShowTrialModal(true)}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-sm uppercase tracking-wider transition-all border border-blue-600 active:scale-95 text-center cursor-pointer"
            >
              Start 7-Day Free Trial
            </button>
            <a
              id="hero-demo-cta-btn"
              href="#contact"
              className="px-8 py-3.5 bg-white hover:bg-slate-55 text-slate-700 border border-slate-300 font-bold rounded-full text-sm uppercase tracking-wider active:scale-95 transition-all text-center cursor-pointer"
            >
              Request a demo
            </a>
          </div>

          {/* Fully Interactive Visual Dashboard Mockup - No shadows, flat design */}
          <div className="w-full max-w-[700px] aspect-[16/9] bg-white border border-slate-300 rounded-[20px] p-2 relative overflow-hidden flex flex-col">
            <div className="w-full h-full bg-slate-50 border border-slate-200 rounded-[14px] flex flex-col overflow-hidden relative">
              {/* Fake top bar */}
              <div className="h-8 border-b border-slate-200 bg-white flex items-center px-4 justify-between">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]"></span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono select-none">workforceos.com/dashboard</div>
                <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded-full font-bold select-none">Live Simulator</span>
              </div>
              {/* Fake body grid */}
              <div className="flex-1 p-4 grid grid-cols-3 gap-4 text-left">
                {/* Sidebar */}
                <div className="space-y-2 border-r border-slate-200 pr-2">
                  <div className="h-6 bg-blue-50 border border-blue-150 rounded-md flex items-center px-2 gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-[9px] font-bold text-blue-600">Operations</span>
                  </div>
                  {['Employees', 'Attendance', 'Leave', 'Payroll', 'Performance'].map((nav) => (
                    <div key={nav} className="h-5 hover:bg-slate-200/50 rounded-md flex items-center px-2">
                      <span className="text-[9px] text-slate-500 font-medium">{nav}</span>
                    </div>
                  ))}
                </div>
                {/* Main panel */}
                <div className="col-span-2 space-y-3 flex flex-col">
                  <div className="flex justify-between items-center shrink-0">
                    <span className="text-[11px] font-bold text-slate-800">Operational Overview</span>
                    <span className="text-[8px] font-mono text-green-600 font-semibold select-none animate-pulse">● System Active</span>
                  </div>
                  {/* Grid cards - flat */}
                  <div className="grid grid-cols-2 gap-2 shrink-0">
                    <div className="bg-white border border-slate-200 p-2.5 rounded-lg">
                      <span className="text-[8px] text-slate-400 block font-semibold uppercase">Today's Attendance</span>
                      <span className="text-lg font-bold text-slate-800 transition-all">{attendanceCount}%</span>
                    </div>
                    <div
                      onClick={handleHeroApproveLeave}
                      className="bg-white border border-slate-200 p-2.5 rounded-lg cursor-pointer hover:border-blue-600 transition-colors group"
                      title="Click to approve a leave request"
                    >
                      <span className="text-[8px] text-slate-400 block font-semibold uppercase flex justify-between items-center">
                        <span>Pending Actions</span>
                        <span className="text-[8px] text-blue-600 font-bold group-hover:underline">Click to resolve</span>
                      </span>
                      <span className="text-lg font-bold text-blue-600 transition-all">
                        {pendingLeaves > 0 ? `${pendingLeaves} Leaves` : 'All Clear'}
                      </span>
                    </div>
                  </div>
                  {/* Live Simulation Trigger Area */}
                  <div className="bg-white border border-slate-200 rounded-lg p-2 flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-100 shrink-0">
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Live Simulation Controls</span>
                      <button
                        onClick={handleHeroClockIn}
                        className={`px-3 py-1 rounded text-[8px] font-bold transition-colors cursor-pointer border ${clockedIn
                          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                          : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                          }`}
                      >
                        {clockedIn ? 'Clock Out EMP-042' : 'Clock In EMP-042'}
                      </button>
                    </div>
                    {/* Live Logs scrolling view */}
                    <div className="flex-1 overflow-y-auto pt-2 space-y-1.5 font-mono text-[7px] text-slate-500">
                      {mockLogs.map((log, index) => (
                        <div key={index} className="transition-all animate-fade-in duration-300">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PROBLEM STATEMENT */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="flex justify-start">
            <span
              className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full mb-6"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              PAIN POINTS WE ELIMINATE
            </span>
          </div>

          <h2
            className="text-2xl md:text-[2.25rem] font-[700] text-slate-900 leading-[1.2] tracking-[-0.02em] mb-4 text-left"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            HR teams drowning in spreadsheets and WhatsApp groups deserve better.
          </h2>
          <p className="text-slate-550 text-sm md:text-base mb-12 text-left">
            These are the six things WorkforceOS was built to replace.
          </p>

          {/* Pain point grid - no shadows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Attendance in Excel.',
                body: "Tracking who's in, who's late, and who's on leave across sheets that nobody fully trusts — updated manually every morning."
              },
              {
                title: 'Tasks lost in chat.',
                body: 'No one knows the real status of work. Managers chase individuals. Deadlines slip quietly and accountability disappears.'
              },
              {
                title: 'Leave requests on WhatsApp.',
                body: 'Approvals by message, balances tracked manually, and every month HR corrects the same errors in the same cells.'
              },
              {
                title: 'Payroll is a month-end fire drill.',
                body: 'LOP calculations, bonus adjustments, and statutory deductions assembled under pressure, from multiple sources, every single cycle.'
              },
              {
                title: 'Performance is guesswork.',
                body: 'Annual reviews based on memory and instinct. No data, no trail, no consistent method — and no one trusts the scores.'
              },
              {
                title: 'Nothing is auditable.',
                body: 'When something goes wrong — a missed approval, a disputed payout, an unauthorised change — there is no log to check.'
              }
            ].map((problem, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col hover:border-slate-400 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-5 shrink-0 select-none">
                  <span className="material-symbols-outlined text-[20px] font-bold">close</span>
                </div>
                <h3
                  className="text-[17px] font-semibold text-slate-900 mb-2.5 leading-snug"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {problem.title}
                </h3>
                <p className="text-slate-500 text-[14px] leading-[1.65] font-normal">
                  {problem.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2.5: DRAG AND DROP ONBOARDING SIMULATOR */}
      <section className="py-20 md:py-24 bg-slate-50 border-b border-slate-200">
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes scaleUp {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.1); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
          }
        ` }} />
        <div className="max-w-[1000px] mx-auto px-6 text-center">
          <span
            className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Instant Excel Import Simulator
          </span>
          <h2
            className="text-3xl md:text-[2.5rem] font-[800] text-slate-900 leading-tight tracking-[-0.02em] mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Onboarding that actually takes seconds.
          </h2>
          <p className="text-slate-600 text-base md:text-lg mb-12 max-w-xl mx-auto font-normal">
            Have your company directory in an Excel spreadsheet? Just drag, drop, and onboard your entire team instantly. Try the simulator below.
          </p>
          {/* Interactive Workspace Simulator Container */}
          <div className="w-full max-w-[850px] mx-auto bg-white border border-slate-350 rounded-[24px] shadow-sm select-none overflow-hidden text-left">
            {/* macOS Window Header */}
            <div className="h-10 border-b border-slate-200 bg-slate-50 flex items-center px-6 justify-between shrink-0">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]"></span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono select-none">workforceos.com/import-simulator</div>
              <div className="w-12"></div>
            </div>

            <div className="p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden">

              {/* Left Column: Local Folder (Excel Source) */}
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-left flex flex-col justify-between h-[280px] relative">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-3">Local Files</span>
                  <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                    {/* Folder Icon SVG */}
                    <svg className="w-5 h-5 text-slate-500 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    </svg>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Desktop</span>
                      <span className="text-[10px] text-slate-400">2 files found</span>
                    </div>
                  </div>
                </div>

                {/* Animated Excel File */}
                <div className="relative flex-1 flex items-center justify-center">
                  <div
                    className={`px-4 py-3 bg-green-50 border border-green-200 rounded-lg shadow-md flex items-center gap-3 transition-all duration-[2000ms] ease-in-out z-20 cursor-grab active:cursor-grabbing ${simState === 'idle' ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : ''
                      } ${simState === 'dragging' ? 'opacity-100 translate-x-[110%] translate-y-[-10px] md:translate-x-[120%] md:translate-y-[0px] scale-95 shadow-lg rotate-3' : ''
                      } ${simState === 'dropped' ? 'opacity-0 scale-50 translate-x-[120%] translate-y-[0px]' : ''
                      } ${simState === 'processing' || simState === 'success' ? 'opacity-40 scale-75 cursor-not-allowed' : ''
                      }`}
                    style={{
                      transformOrigin: 'center'
                    }}
                  >
                    {/* Spreadsheet Icon SVG */}
                    <svg className="w-6 h-6 text-green-600 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M21.17 3.25Q21.5 3.25 21.75 3.5T22 4.08V19.92Q22 20.5 21.75 20.75T21.17 21H7.83Q7.5 21 7.25 20.75T7 20.17V17H2.83Q2.5 17 2.25 16.75T2 16.17V7.83Q2 7.5 2.25 7.25T2.83 7H7V3.83Q7 3.25 7.83 3.25M7 9H4.5V11H7M7 13H4.5V15H7M20 5H9V19H20M11 7H13.5V9.5H11M11 11H13.5V13.5H11M11 15H13.5V17.5H11M15 7H18V9.5H15M15 11H18V13.5H15M15 15H18V17.5H15" />
                    </svg>
                    <div className="text-left">
                      <span className="text-xs font-bold text-green-800 block font-sans">employee_directory.xlsx</span>
                      <span className="text-[9px] text-green-600 block font-sans">14 employees • 2 sheets</span>
                    </div>
                  </div>

                  {/* Hand/Cursor Drag Indicator */}
                  {simState === 'idle' && (
                    <div className="absolute top-[65%] left-[55%] animate-bounce-short z-30 pointer-events-none flex flex-col items-center">
                      {/* Drag pointer hand SVG */}
                      <svg className="w-6 h-6 text-slate-800 fill-current filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24">
                        <path d="M9 11.75V5c0-1.66 1.34-3 3-3s3 1.34 3 3v6.75c.98-.66 2.23-.42 2.92.57l.08.12c.57.87.41 2.05-.36 2.73l-4.14 3.7c-.57.51-1.31.79-2.07.79H10c-1.66 0-3-1.34-3-3v-2.31c0-.85.53-1.61 1.32-1.9l.68-.29M12 4c-.55 0-1 .45-1 1v6.75l-.92.39c-.26.11-.43.37-.43.66v2.31c0 1.1.9 2 2 2h1.43c.48 0 .94-.18 1.3-.5l4.13-3.7c.25-.22.3-.61.12-.89l-.07-.1c-.22-.32-.62-.4-.94-.18L15 14.25V5c0-.55-.45-1-1-1s-1 .45-1 1v7h-1v-7c0-.55-.45-1-1-1" />
                      </svg>
                      <span className="text-[9px] bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded shadow mt-1">Drag Me</span>
                    </div>
                  )}
                </div>

                <div className="h-6"></div>
              </div>

              {/* Middle Indicator */}
              <div className="hidden md:flex items-center justify-center">
                <span className="text-slate-350 text-2xl font-bold">→</span>
              </div>

              {/* Right Column: WorkforceOS Destination */}
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-left flex flex-col justify-between h-[280px] relative overflow-hidden">

                <div className="flex justify-between items-center shrink-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">WorkforceOS Portal</span>
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600">Enterprise Setup</span>
                </div>

                {/* Dynamic UI Content */}
                <div className="flex-1 flex flex-col items-center justify-center py-4 w-full">

                  {(simState === 'idle' || simState === 'dragging') && (
                    <div className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all duration-300 ${simState === 'dragging' ? 'border-blue-500 bg-blue-55/40 text-blue-600' : 'border-slate-350 text-slate-400'
                      }`}>
                      {/* Cloud Upload Icon SVG */}
                      <svg className="w-8 h-8 text-blue-500 fill-none stroke-current stroke-2 mb-2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs font-bold text-center block font-sans">Drop Excel sheet here</span>
                      <span className="text-[9.5px] text-slate-400 mt-1 text-center font-sans">Supports xlsx, csv, multi-sheets</span>
                    </div>
                  )}

                  {(simState === 'dropped' || simState === 'processing') && (
                    <div className="w-full px-4 flex flex-col items-center justify-center animate-fade-in">
                      {/* Mock Excel Sheet Animation */}
                      <div className="w-full border border-slate-200 rounded-xl overflow-hidden text-[10px] font-sans bg-white shadow-sm max-w-[340px]">
                        <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between font-bold text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-green-600">table_view</span>
                            <span>employee_directory.xlsx</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Sheet1</span>
                        </div>
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-150 text-[9px] font-bold text-slate-400">
                              <th className="px-2.5 py-1 border-r border-slate-150">A (Name)</th>
                              <th className="px-2.5 py-1 border-r border-slate-150">B (Email)</th>
                              <th className="px-2.5 py-1">C (Designation)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                            <tr className={`${simProgress > 10 && simProgress < 40 ? 'bg-blue-50/60 text-primary' : ''} transition-colors duration-250`}>
                              <td className="px-2.5 py-1.5 border-r border-slate-150 font-bold text-slate-800">Michael Scott</td>
                              <td className="px-2.5 py-1.5 border-r border-slate-150">michael@dunder.com</td>
                              <td className="px-2.5 py-1.5">Regional Manager</td>
                            </tr>
                            <tr className={`${simProgress >= 40 && simProgress < 75 ? 'bg-blue-50/60 text-primary' : ''} transition-colors duration-250`}>
                              <td className="px-2.5 py-1.5 border-r border-slate-150 font-bold text-slate-800">Dwight Schrute</td>
                              <td className="px-2.5 py-1.5 border-r border-slate-150">dwight@dunder.com</td>
                              <td className="px-2.5 py-1.5">Sales Leader</td>
                            </tr>
                            <tr className={`${simProgress >= 75 ? 'bg-blue-50/60 text-primary' : ''} transition-colors duration-250`}>
                              <td className="px-2.5 py-1.5 border-r border-slate-150 font-bold text-slate-800">Jim Halpert</td>
                              <td className="px-2.5 py-1.5 border-r border-slate-150">jim@dunder.com</td>
                              <td className="px-2.5 py-1.5">Sales Representative</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="w-full max-w-[340px] mt-4 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>
                            {simProgress < 35 && "Scanning spreadsheet..."}
                            {simProgress >= 35 && simProgress < 70 && "Mapping columns & data fields..."}
                            {simProgress >= 70 && "Seeding organizational structure..."}
                          </span>
                          <span className="font-mono">{simProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                          <div className="bg-green-500 h-full transition-all duration-100" style={{ width: `${simProgress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {simState === 'success' && (
                    <div className="w-full text-center flex flex-col items-center justify-center px-4" style={{ animation: "fade-in 0.4s ease-out forwards" }}>
                      {/* Apple Success Spring scaling checkmark in matching green */}
                      <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center shadow-sm mb-3" style={{ animation: "scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards" }}>
                        <svg className="w-6 h-6 stroke-green-600 fill-none stroke-[3.5] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" className="draw-checkmark" />
                        </svg>
                      </div>
                      <span className="text-xs font-extrabold text-green-700 uppercase tracking-widest block mb-1 font-sans">Onboarding Successful</span>
                      <span className="text-sm font-bold text-slate-800 block font-sans">Dunder Mifflin Inc. Setup Completed</span>

                      <div className="flex gap-1.5 justify-center mt-3 flex-wrap">
                        <span className="text-[8.5px] bg-slate-100 border border-slate-200 font-bold text-slate-600 px-2 py-0.5 rounded-full font-sans">14 Employees</span>
                        <span className="text-[8.5px] bg-slate-100 border border-slate-200 font-bold text-slate-600 px-2 py-0.5 rounded-full font-sans">3 Departments</span>
                        <span className="text-[8.5px] bg-slate-100 border border-slate-200 font-bold text-slate-600 px-2 py-0.5 rounded-full font-sans">Default Passwords Set</span>
                      </div>
                    </div>
                  )}

                </div>

                <div className="h-6"></div>
              </div>

            </div>
          </div>

          <div className="mt-10 flex flex-col items-center">
            <button
              onClick={() => setShowTrialModal(true)}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-sm uppercase tracking-wider active:scale-95 transition-all border border-blue-600 cursor-pointer shadow-md shadow-blue-600/10 flex items-center gap-2 hover:gap-3"
            >
              <span>Start Your Trial Workspace</span>
              <span className="text-xs font-bold font-mono">→</span>
            </button>
            <span className="text-[11px] text-slate-400 mt-2.5 font-medium font-sans">Trial workspace first • Setup opens after purchase • Supports multi-sheet spreadsheets</span>
          </div>

        </div>
      </section>

      {/* SECTION 3: SOLUTION OVERVIEW */}
      <section className="py-20 md:py-24 bg-slate-100/60 border-y border-slate-200 relative">
        <div className="max-w-[1100px] mx-auto px-6 flex flex-col items-center">
          {/* Eyebrow */}
          <span
            className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            THE WORKFORCEOS DIFFERENCE
          </span>

          <h2
            className="text-2xl md:text-[2.25rem] font-[700] text-slate-900 leading-[1.2] tracking-[-0.02em] mb-12 text-center"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Everything HR needs. Nothing it doesn't.
          </h2>

          {/* Three-column stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full mb-12 text-left md:text-left">
            {[
              {
                number: '11',
                label: 'INTEGRATED MODULES',
                body: 'From onboarding to payroll — all connected, all sharing the same data.'
              },
              {
                number: '0',
                label: 'SPREADSHEETS NEEDED',
                body: 'Real-time data replaces manual tracking. One platform is always the source of truth.'
              },
              {
                number: '100%',
                label: 'AUDIT-READY',
                body: 'Every approval, every change, every login — logged automatically with actor and timestamp.'
              }
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2.5">
                <span
                  className="text-5xl font-[800] text-blue-600 tracking-tight block"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {stat.number}
                </span>
                <span className="text-[12px] font-bold text-slate-400 tracking-wider block uppercase font-mono">
                  {stat.label}
                </span>
                <p className="text-slate-650 text-[14px] leading-[1.6] font-normal">
                  {stat.body}
                </p>
              </div>
            ))}
          </div>

          {/* Horizontal Line divider */}
          <div className="w-full border-t border-slate-200 mb-10"></div>

          {/* Module chip strip */}
          <div className="w-full flex justify-start md:justify-center overflow-x-auto pb-4 mb-12 scrollbar-none custom-scrollbar">
            <div className="flex flex-nowrap md:flex-wrap gap-2 md:justify-center px-2">
              {[
                'Employees', 'Attendance', 'Leave', 'Tasks', 'Performance',
                'Payroll', 'Expenses', 'Assets', 'Knowledge Base', 'Notifications', 'Audit Log'
              ].map((chip) => (
                <Link
                  key={chip}
                  href={`/features#${chip.toLowerCase().replace(' ', '-')}`}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-[13px] rounded-full shrink-0 transition-all hover:border-blue-600 hover:text-blue-600 hover:bg-slate-50 active:scale-95 whitespace-nowrap"
                >
                  {chip}
                </Link>
              ))}
            </div>
          </div>

          {/* CTA & Objection-removal Text - flat */}
          <div className="flex flex-col items-center gap-2">
            <Link
              id="solution-demo-cta-btn"
              href="#contact"
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-sm uppercase tracking-wider transition-all border border-blue-600 active:scale-95 text-center cursor-pointer"
            >
              Request a demo
            </Link>
            <span className="text-xs text-slate-400 font-medium">
              30-minute demo · no commitment required
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 4: MODULE SHOWCASE (Role-Based Tabs with live interaction) */}
      <section className="py-20 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1100px] mx-auto px-6">
          {/* Top text block */}
          <div className="mb-12">
            <span
              className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full mb-6"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              HOW IT WORKS
            </span>
            <h2
              className="text-2xl md:text-[2.25rem] font-[700] text-slate-900 leading-[1.2] tracking-[-0.02em] mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Built for every person on the team.
            </h2>
            <p className="text-slate-500 text-sm md:text-[1.0625rem]">
              Different roles see different things. Everyone gets exactly what they need.
            </p>
          </div>

          {/* Tabs switch bar */}
          <div className="flex overflow-x-auto pb-3 mb-12 border-b border-slate-100 scrollbar-none">
            <div className="flex gap-2">
              {[
                { key: 'hr', name: 'HR Manager' },
                { key: 'employee', name: 'Employee' },
                { key: 'manager', name: 'Manager' },
                { key: 'finance', name: 'Finance' },
                { key: 'admin', name: 'Admin' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key as any)}
                  className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-transparent text-slate-500 border border-slate-200 hover:bg-slate-55'
                    }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive display viewport - flat, transition border lights up */}
          <div className={`transition-opacity duration-150 ${fade ? 'opacity-100' : 'opacity-0'}`}>
            {/* HR Manager Tab */}
            {activeTab === 'hr' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 space-y-6">
                  <h3
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    What HR managers can do
                  </h3>
                  <ul className="space-y-4">
                    {[
                      'One-click employee onboarding with bank details, emergency contacts, and documents captured in a guided wizard.',
                      'Two-stage leave approval — manager first, HR sign-off second.',
                      'Org-wide attendance view with late-arrival and no-checkout alerts.',
                      'Performance reviews powered by a data-driven composite score.',
                      'Leave policy management per leave type and department.'
                    ].map((feature, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-700 text-[15px] leading-relaxed">
                        <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0 select-none">check_circle</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Visual Dashboard Mockup - Interactive */}
                <div className="order-1 md:order-2 bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/10] flex flex-col justify-between">
                  <div className="h-6 border-b border-slate-200 pb-2 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 shrink-0 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f56] border border-[#e0443e]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e] border border-[#dea123]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f] border border-[#1aab29]"></span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">HR Workspace / Onboarding Wizard</span>
                    </div>
                    <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Interactive mockup</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-3 justify-center text-left">
                    {onboardSuccess ? (
                      <div className="bg-white border border-green-200 p-4 rounded-lg text-center space-y-2">
                        <span className="material-symbols-outlined text-green-600 text-[24px]">verified</span>
                        <h4 className="text-xs font-bold text-slate-900">Onboarding Setup Completed!</h4>
                        <p className="text-[9px] text-slate-400">Employee database populated. Secure onboarding files processed successfully.</p>
                        <button
                          onClick={() => { setOnboardSuccess(false); setOnboardStep(1); }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-650 border border-slate-200 text-[8px] rounded font-bold cursor-pointer"
                        >
                          Reset Wizard
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col justify-between gap-3 min-h-[140px]">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">
                              Wizard: {onboardStepNames[onboardStep - 1]}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold">
                              {Math.round((onboardStep / 6) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full transition-all duration-500"
                              style={{ width: `${(onboardStep / 6) * 100}%` }}
                            ></div>
                          </div>

                          {/* Dynamic step detail layout */}
                          {onboardStep === 1 && (
                            <div className="text-[9px] space-y-1 py-1">
                              <div className="flex justify-between border-b border-slate-50 pb-0.5"><span className="text-slate-400">Firm Name:</span> <span className="font-bold text-slate-800">Dunder Mifflin Inc</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Workspace URL:</span> <span className="font-mono text-blue-600">dunder-mifflin</span></div>
                            </div>
                          )}
                          {onboardStep === 2 && (
                            <div className="text-[9px] flex items-center gap-2 py-1 bg-slate-50 border border-slate-100 rounded p-1.5">
                              <span className="material-symbols-outlined text-[16px] text-green-600">table_view</span>
                              <div>
                                <span className="font-bold text-slate-800 block">employee_directory.xlsx</span>
                                <span className="text-[8px] text-slate-400">14 records found</span>
                              </div>
                            </div>
                          )}
                          {onboardStep === 3 && (
                            <div className="text-[8.5px] space-y-1 py-1">
                              <div className="flex justify-between"><span className="text-slate-400">FirstName Column:</span> <span className="font-mono font-bold text-slate-700">A (First Name)</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Email Column:</span> <span className="font-mono font-bold text-slate-700">C (Email)</span></div>
                            </div>
                          )}
                          {onboardStep === 4 && (
                            <div className="text-[8px] space-y-0.5 py-1">
                              <div className="flex justify-between items-center text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded"><span>Michael Scott</span> <span>✓ Valid</span></div>
                              <div className="flex justify-between items-center text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded"><span>Dwight Schrute</span> <span>✓ Valid</span></div>
                            </div>
                          )}
                          {onboardStep === 5 && (
                            <div className="text-[9px] space-y-1 py-1">
                              <div className="flex justify-between"><span className="text-slate-400">Admin Account:</span> <span className="font-bold text-slate-700">michael@dunder-mifflin.com</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">HR Manager:</span> <span className="font-bold text-slate-700">toby@dunder-mifflin.com</span></div>
                            </div>
                          )}
                          {onboardStep === 6 && (
                            <div className="text-[9px] py-1 text-center font-bold text-blue-600 animate-pulse">
                              Configuration verified! Ready to compile.
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-2 shrink-0">
                          <button
                            disabled={onboardStep === 1}
                            onClick={() => setOnboardStep(prev => prev - 1)}
                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200 rounded text-[9px] font-bold cursor-pointer disabled:opacity-40"
                          >
                            Prev Step
                          </button>
                          <button
                            onClick={() => {
                              if (onboardStep === 6) {
                                setOnboardSuccess(true);
                              } else {
                                setOnboardStep(prev => prev + 1);
                              }
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-750 text-white rounded text-[9px] font-bold cursor-pointer"
                          >
                            {onboardStep === 6 ? 'Complete Setup' : 'Next Step'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Employee Tab */}
            {activeTab === 'employee' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {/* Mockup on left */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/10] flex flex-col justify-between">
                  <div className="h-6 border-b border-slate-200 pb-2 mb-1 flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 shrink-0 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f56] border border-[#e0443e]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e] border border-[#dea123]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f] border border-[#1aab29]"></span>
                      </div>
                      <span>Employee Dashboard Simulator</span>
                    </div>
                    <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Interactive mockup</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1 pt-2">
                    <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1.5">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Work Attendance</span>
                      <button
                        onClick={() => {
                          setEmpClockedIn(!empClockedIn);
                          setEmpLogs(prev => [
                            `${empClockedIn ? 'Checked Out' : 'Checked In'} - Just now`,
                            ...prev.slice(0, 1)
                          ]);
                        }}
                        className={`w-full py-1.5 text-white text-[9px] font-bold rounded transition-colors cursor-pointer ${empClockedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                      >
                        {empClockedIn ? 'Clock Out' : 'Clock In'}
                      </button>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col justify-between">
                      <span className="text-[8px] font-bold text-slate-400 uppercase block">Active Balances</span>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-600">
                          <span>Casual:</span>
                          <span className="font-bold text-slate-800">4 / 12 Days</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-600">
                          <span>Earned:</span>
                          <span className="font-bold text-slate-800">10 / 18 Days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 mt-2">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-700 border-b border-slate-100 pb-1 mb-1.5">
                      <span>Simulation Activity Log</span>
                    </div>
                    <div className="space-y-1 text-[8px] text-slate-500 font-mono">
                      {empLogs.map((log, i) => (
                        <div key={i}>● {log}</div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Feature details */}
                <div className="space-y-6">
                  <h3
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    What employees can do
                  </h3>
                  <ul className="space-y-4">
                    {[
                      'Check in and out with one tap, for WFH or office.',
                      'Apply for leave, track balance, see both stages of approval in real time.',
                      'Accept tasks assigned to you, submit for review, track your own performance score over time.',
                      'View your monthly payslip and any expense claims you\'ve submitted.'
                    ].map((feature, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-700 text-[15px] leading-relaxed">
                        <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0 select-none">check_circle</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Manager Tab */}
            {activeTab === 'manager' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 space-y-6">
                  <h3
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    What managers can do
                  </h3>
                  <ul className="space-y-4">
                    {[
                      'See your team\'s attendance for today at a glance, with late arrivals highlighted.',
                      'Assign tasks with due dates and priority levels to any member of your team.',
                      'Review submitted work and score quality — that score feeds directly into the team member\'s performance.',
                      'Approve or reject leave requests from your direct reports with a single action.'
                    ].map((feature, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-700 text-[15px] leading-relaxed">
                        <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0 select-none">check_circle</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Manager Visual Mockup - Interactive */}
                <div className="order-1 md:order-2 bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/10] flex flex-col justify-between">
                  <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 shrink-0 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f56] border border-[#e0443e]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e] border border-[#dea123]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f] border border-[#1aab29]"></span>
                      </div>
                      <span>Team Leave Approval Queue</span>
                    </div>
                    <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Interactive mockup</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 flex-1 mb-2 flex flex-col justify-center">
                    {priyaLeaveStatus === 'pending' ? (
                      <div className="flex justify-between items-center text-[10px] text-slate-700">
                        <div>
                          <span className="font-bold text-slate-800 block">Priya Sharma</span>
                          <span className="text-[8px] text-slate-400">Sick Leave · 2 Days (June 18-19)</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setPriyaLeaveStatus('approved')}
                            className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[8px] font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setPriyaLeaveStatus('rejected')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded text-[8px] font-bold cursor-pointer border border-slate-200"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-1.5">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border inline-block ${priyaLeaveStatus === 'approved'
                          ? 'bg-green-50 text-green-700 border-green-150'
                          : 'bg-red-50 text-red-700 border-red-150'
                          }`}>
                          Priya's Request: {priyaLeaveStatus === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                        <p className="text-[8px] text-slate-400">Action logged to database. HR notified for stage-2 sign-off.</p>
                        <button
                          onClick={() => setPriyaLeaveStatus('pending')}
                          className="text-[8px] font-bold text-blue-600 hover:underline block mx-auto cursor-pointer"
                        >
                          Reset Request
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1.5">Team Status Today</span>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-1 border border-slate-100 rounded text-[9px] bg-green-50 text-green-750 font-semibold">Aarav</div>
                      <div className={`p-1 border rounded text-[9px] font-semibold transition-all ${priyaLeaveStatus === 'approved'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-green-50 text-green-750 border-green-100'
                        }`}>
                        Priya
                      </div>
                      <div className="p-1 border border-slate-100 rounded text-[9px] bg-green-50 text-green-750 font-semibold">Kabir</div>
                      <div className="p-1 border border-slate-100 rounded text-[9px] bg-slate-100 text-slate-400 font-medium">Nisha</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Finance Tab */}
            {activeTab === 'finance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {/* Finance Mockup on left - Interactive */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/10] flex flex-col justify-between">
                  <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 shrink-0 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f56] border border-[#e0443e]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e] border border-[#dea123]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f] border border-[#1aab29]"></span>
                      </div>
                      <span>Payroll calculation portal</span>
                    </div>
                    <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Interactive mockup</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex-1 flex flex-col mb-3">
                    <div className="bg-slate-50 border-b border-slate-150 px-2 py-1.5 grid grid-cols-4 text-[8px] font-bold text-slate-500 uppercase">
                      <span>Employee</span>
                      <span>LOP</span>
                      <span>PF Capped</span>
                      <span className="text-right">Net salary</span>
                    </div>
                    <div className="flex-1 p-2 space-y-1.5">
                      <div className="grid grid-cols-4 text-[9px] text-slate-700 border-b border-slate-100 pb-1">
                        <span>Aarav M.</span>
                        <span className="font-mono">0</span>
                        <span className="font-mono">₹1,800</span>
                        <span className="text-right font-bold text-slate-800">₹72,400</span>
                      </div>
                      <div className="grid grid-cols-4 text-[9px] text-slate-700 border-b border-slate-100 pb-1">
                        <span>Priya S.</span>
                        <span className="font-mono">1.5</span>
                        <span className="font-mono">₹1,500</span>
                        <span className="text-right font-bold text-slate-800">₹53,120</span>
                      </div>
                    </div>
                  </div>
                  {payrollApproved ? (
                    <div className="bg-green-50 border border-green-200 p-2 text-center rounded-lg space-y-1">
                      <span className="text-[10px] font-bold text-green-700 block">● Payroll Executed & Confirmed</span>
                      <button
                        onClick={() => setPayrollApproved(false)}
                        className="text-[8px] font-bold text-slate-500 hover:underline cursor-pointer"
                      >
                        Reset Run
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setPayrollApproving(true);
                        setTimeout(() => {
                          setPayrollApproving(false);
                          setPayrollApproved(true);
                        }, 1200);
                      }}
                      disabled={payrollApproving}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {payrollApproving ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[12px]">progress_activity</span>
                          <span>Approving...</span>
                        </>
                      ) : (
                        <span>Approve Payroll Run</span>
                      )}
                    </button>
                  )}
                </div>
                {/* Feature details */}
                <div className="space-y-6">
                  <h3
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    What Finance teams can do
                  </h3>
                  <ul className="space-y-4">
                    {[
                      'Generate monthly payroll runs in one click with auto-calculated LOP from real attendance data.',
                      'PF, ESIC, Professional Tax, and TDS fields are structured, not manual.',
                      'Approve expense claims submitted by any employee with a full receipt trail.',
                      'Export payslips as PDFs.'
                    ].map((feature, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-700 text-[15px] leading-relaxed">
                        <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0 select-none">check_circle</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Admin Tab */}
            {activeTab === 'admin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 space-y-6">
                  <h3
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    What Admin can do
                  </h3>
                  <ul className="space-y-4">
                    {[
                      'Define departments, teams, and reporting lines in a visual structure.',
                      'Assign custom roles with granular permissions — choose exactly what each role can see and do per module.',
                      'View the full audit log across the entire organisation, every action attributed to an actor.'
                    ].map((feature, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-700 text-[15px] leading-relaxed">
                        <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0 select-none">check_circle</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Admin Mockup right - Interactive */}
                <div className="order-1 md:order-2 bg-slate-50 border border-slate-200 rounded-xl p-4 aspect-[16/10] flex flex-col justify-between">
                  <div className="h-6 border-b border-slate-200 pb-2 mb-2 flex items-center justify-between text-[10px] font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 shrink-0 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f56] border border-[#e0443e]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e] border border-[#dea123]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f] border border-[#1aab29]"></span>
                      </div>
                      <span>Role Permissions Configuration</span>
                    </div>
                    <span className="text-[8.5px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded font-bold uppercase select-none">Interactive mockup</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex-1 mb-2 flex flex-col justify-center gap-2">
                    <span className="text-[8px] font-bold text-slate-400 block uppercase">HR Manager Roles</span>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] text-slate-700">
                        <span>Manage Employee Records</span>
                        <button
                          onClick={() => {
                            const val = !hrPermissions.dbAccess;
                            setHrPermissions(prev => ({ ...prev, dbAccess: val }));
                            setAdminLogs(prev => [
                              `[AUDIT LOG] ${new Date().toLocaleTimeString()} - Admin updated 'HR Manager' permission: db_access ${val ? 'enabled' : 'disabled'}.`,
                              ...prev
                            ]);
                          }}
                          className={`w-7 h-4 rounded-full relative transition-colors cursor-pointer ${hrPermissions.dbAccess ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                          <span className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${hrPermissions.dbAccess ? 'right-0.5' : 'left-0.5'}`}></span>
                        </button>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-700">
                        <span>Run & Process Payroll</span>
                        <button
                          onClick={() => {
                            const val = !hrPermissions.runPayroll;
                            setHrPermissions(prev => ({ ...prev, runPayroll: val }));
                            setAdminLogs(prev => [
                              `[AUDIT LOG] ${new Date().toLocaleTimeString()} - Admin updated 'HR Manager' permission: run_payroll ${val ? 'enabled' : 'disabled'}.`,
                              ...prev
                            ]);
                          }}
                          className={`w-7 h-4 rounded-full relative transition-colors cursor-pointer ${hrPermissions.runPayroll ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                          <span className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${hrPermissions.runPayroll ? 'right-0.5' : 'left-0.5'}`}></span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2 text-[6.5px] text-slate-400 font-mono h-10 overflow-y-auto scrollbar-none">
                    {adminLogs.map((l, i) => (
                      <div key={i} className="truncate">● {l}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 5: FEATURE CARDS GRID */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-[1140px] mx-auto px-6">
          {/* Top segment */}
          <div className="mb-12">
            <span
              className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full mb-6"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              WHAT'S INCLUDED
            </span>
            <h2
              className="text-2xl md:text-[2.25rem] font-[700] text-slate-900 leading-[1.2] tracking-[-0.02em]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              12 modules. Every one production-ready.
            </h2>
          </div>

          {/* Cards grid - flat design, lifts slightly on hover */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: 'Employees',
                body: 'Full employee lifecycle from onboarding to exit. A guided 7-step wizard captures personal info, role assignment, compensation, bank details, emergency contacts, and documents in a single transaction.',
                stat: '7-step onboarding wizard',
                color: 'bg-blue-50 text-blue-600 border-blue-150',
                icon: 'group'
              },
              {
                title: 'Attendance',
                body: 'Check-in and check-out with WFH and WFO modes. Shift-aware late detection, multiple break sessions per day, and attendance adjustment with a mandatory two-person approval rule.',
                stat: 'Nightly absent auto-mark via cron',
                color: 'bg-teal-50 text-teal-600 border-teal-150',
                icon: 'fingerprint'
              },
              {
                title: 'Leave',
                body: 'Two-stage approval — direct manager first, then HR. Tracks Casual, Sick, Earned, WFH, and Half-Day leave types. Calendar view of who is out. Auto-deducts balance on final HR approval.',
                stat: '5 leave types, org-configurable',
                color: 'bg-sky-50 text-sky-600 border-sky-150',
                icon: 'date_range'
              },
              {
                title: 'Tasks',
                body: 'Scoped task creation — personal, team, department, or org-wide. A clean ten-state lifecycle from draft to closed. Peer review and quality scoring built into the workflow, feeding the performance module.',
                stat: '10-state lifecycle, no dead ends',
                color: 'bg-violet-50 text-violet-600 border-violet-150',
                icon: 'assignment'
              },
              {
                title: 'Performance',
                body: 'Composite score from task completion rate, deadline adherence, quality and rework, attendance, and HR qualitative feedback — all weighted, all transparent. No more appraisal guesswork.',
                stat: '5-factor weighted formula, 0–100 score',
                color: 'bg-amber-50 text-amber-600 border-amber-150',
                icon: 'trending_up'
              },
              {
                title: 'Payroll',
                body: 'Monthly payroll runs with LOP auto-calculated from attendance records. Structured salary bands, PF and ESIC fields, Professional Tax and TDS. Payslip export as PDF.',
                stat: 'LOP derived from actual attendance',
                color: 'bg-green-50 text-green-600 border-green-150',
                icon: 'payments'
              },
              {
                title: 'Expenses',
                body: 'Employees draft and submit expense claims with receipt uploads. Manager approves at stage one, Finance at stage two, then marks as paid. Full trail at every stage.',
                stat: '3-stage approval with receipt trail',
                color: 'bg-orange-50 text-orange-600 border-orange-150',
                icon: 'receipt_long'
              },
              {
                title: 'Assets',
                body: 'Track laptops, access cards, phones, and equipment. Assign to employees and log returns with timestamps. See exactly what each person holds right now.',
                stat: 'Full assignment history per asset',
                color: 'bg-slate-100 text-slate-600 border-slate-200',
                icon: 'devices'
              },
              {
                title: 'Knowledge Base',
                body: 'Write and publish internal guides, SOPs, and policy documents. Version history keeps a full edit trail. Authors and publish dates always visible.',
                stat: 'Version-controlled, author-attributed',
                color: 'bg-indigo-50 text-indigo-600 border-indigo-150',
                icon: 'menu_book'
              },
              {
                title: 'Notifications',
                body: 'Every meaningful event — task assigned, leave approved, payroll generated — triggers a real-time in-app notification to the right person. Role-targeted and never spammy.',
                stat: 'Real-time, role-scoped delivery',
                color: 'bg-red-50 text-red-600 border-red-150',
                icon: 'notifications_active'
              },
              {
                title: 'Audit Log',
                body: 'Every create, update, delete, approval, and login logged with actor, timestamp, before-and-after values, and IP address. Immutable. Compliance-ready from day one.',
                stat: 'Immutable, org-wide, always on',
                color: 'bg-stone-100 text-stone-700 border-stone-200',
                icon: 'history'
              },
              {
                title: 'Org Calendar',
                body: 'Integrated shared team calendar showing employee leaves, scheduled shift timings, task deadlines, and company events. Keeps the whole office synchronized in one place.',
                stat: 'Real-time, cross-module calendar sync',
                color: 'bg-rose-50 text-rose-600 border-rose-150',
                icon: 'calendar_today'
              }
            ].map((module) => (
              <div
                key={module.title}
                className="bg-white border border-slate-200 rounded-[20px] p-8 hover:-translate-y-1 hover:border-blue-600 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-12 h-12 rounded-full ${module.color} flex items-center justify-center mb-6 border select-none`}>
                    <span className="material-symbols-outlined text-[24px]">{module.icon}</span>
                  </div>
                  <h3
                    className="text-lg font-bold text-slate-900 mb-3"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {module.title}
                  </h3>
                  <p className="text-slate-500 text-[14px] leading-[1.65] mb-6">
                    {module.body}
                  </p>
                </div>
                <div>
                  <div className="border-t border-slate-150 my-4"></div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-semibold text-blue-600">
                      {module.stat}
                    </span>
                    <Link
                      href={`/features#${module.title.toLowerCase().replace(' ', '-')}`}
                      className="text-sm font-semibold text-blue-600 group-hover:underline cursor-pointer"
                    >
                      Learn more &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom redirection line */}
          <div className="text-center">
            <span className="text-slate-500 text-sm font-medium">Want the full breakdown of each module? </span>
            <Link
              href="/features"
              className="text-sm font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Explore all features &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5.5: MOBILE APP READY */}
      <section className="py-20 bg-slate-50 border-y border-slate-200 text-slate-800">
        <div className="max-w-[1100px] mx-auto px-6 space-y-12">

          <div className="text-center space-y-4">
            <span className="inline-block px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full">
              Mobile App Hub
            </span>

            <h2
              className="text-3xl md:text-[2.5rem] font-[800] tracking-[-0.02em] leading-tight text-slate-900"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              WorkforceOS in Your Pocket
            </h2>

            <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
              The Android app is functionally ready for attendance, approvals, tasks,
              payroll access, biometric login, and mobile-first HR workflows. iOS is
              in development.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-center bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 lg:p-10 overflow-hidden">

            {/* Left */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "fingerprint",
                  title: "Biometric sign-in",
                  body: "Fast secure login on supported Android devices.",
                },
                {
                  icon: "location_on",
                  title: "Geo attendance",
                  body: "Check-in, check-out, WFH, and WFO flows on mobile.",
                },
                {
                  icon: "task_alt",
                  title: "Task actioning",
                  body: "Accept, submit, review, and track work from the phone.",
                },
                {
                  icon: "payments",
                  title: "Payroll access",
                  body: "Employees can view compensation and payslip records.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="border border-slate-200 rounded-2xl p-5 bg-slate-50 h-full"
                >
                  <span className="material-symbols-outlined text-blue-600 text-[24px] mb-3 block">
                    {feature.icon}
                  </span>

                  <h3 className="font-extrabold text-slate-900 text-sm mb-2">
                    {feature.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Right */}
            <div className="flex flex-col items-center w-full">

              <div className="w-full max-w-[220px] aspect-[210/360] rounded-[34px] border-[10px] border-slate-900 bg-slate-50 shadow-lg p-3 flex flex-col">

                <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto mb-5"></div>

                <div className="flex-1 bg-white border border-slate-200 rounded-[24px] p-4 flex flex-col justify-between overflow-hidden">

                  <div>

                    <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto">
                      <Image
                        src="/workforceoslogo.png"
                        alt="WorkforceOS"
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>

                    <div className="mt-3 text-center">
                      <p className="text-sm font-extrabold text-slate-900">
                        WorkforceOS
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Android Ready
                      </p>
                    </div>

                    <div className="space-y-2 mt-4">
                      {["Attendance", "Tasks", "Leaves", "Payroll"].map((item) => (
                        <div
                          key={item}
                          className="h-8 rounded-xl bg-slate-50 border border-slate-100 px-3 flex items-center justify-between"
                        >
                          <span className="text-[10px] font-bold text-slate-600">
                            {item}
                          </span>

                          <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/mobile-app"
                    className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold text-center transition-colors"
                  >
                    View Mobile App
                  </Link>

                </div>
              </div>

              <Link
                href="/mobile-app"
                className="mt-6 inline-flex items-center justify-center w-full max-w-[220px] py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Open Mobile App Page
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION 6: TECHNICAL CREDIBILITY */}
      <section className="py-20 md:py-24 bg-slate-100/60 border-y border-slate-200">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden grid grid-cols-1 md:grid-cols-2">
            {/* Left side */}
            <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center">
              <span
                className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full mb-6 w-fit"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                BUILT TO LAST
              </span>
              <h2
                className="text-xl md:text-[1.625rem] font-[700] text-slate-900 leading-[1.2] tracking-[-0.02em] mb-4"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Enterprise-grade infrastructure. Startup-friendly setup.
              </h2>
              <p className="text-slate-500 text-[14px] leading-[1.7] mb-8 font-normal">
                WorkforceOS is built on Node.js, PostgreSQL, Prisma, and Next.js — the same stack powering companies like Vercel and Linear. Role-based access control, a full audit trail, and field-level encryption on sensitive data (bank account numbers, PAN) are built in from day one, not bolted on later.
              </p>
              {/* Tech chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Node.js', dotColor: 'bg-green-500' },
                  { name: 'PostgreSQL', dotColor: 'bg-blue-500' },
                  { name: 'Next.js', dotColor: 'bg-slate-900' },
                  { name: 'Redis', dotColor: 'bg-red-500' }
                ].map((tech) => (
                  <span key={tech.name} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${tech.dotColor}`}></span>
                    {tech.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Right side checkmarks */}
            <div className="p-8 md:p-12 bg-slate-50/50 flex flex-col justify-center">
              <ul className="space-y-4">
                {[
                  'Multi-tenant, org-isolated data — your data is never shared across organisations',
                  'Granular role and permission system — not just "admin" and "employee"',
                  'Bank account numbers and PAN details encrypted at rest',
                  'Rate-limited APIs — no brute-force or scraping exposure',
                  'Every row change in the database logged with before and after values',
                  'Soft-delete on all records — nothing is permanently lost',
                  'JWT authentication with refresh token rotation for session security',
                  'Designed for Indian statutory compliance: PF, ESIC, Professional Tax, TDS'
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-slate-700 text-[14px] leading-relaxed">
                    <span className="material-symbols-outlined text-green-600 text-[18px] shrink-0 select-none">verified</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: PRICING PLANS */}
      <section id="pricing" className="py-20 md:py-24 bg-white border-t border-slate-200">
        <div className="max-w-[1100px] mx-auto px-6 space-y-12">

          <div className="text-center space-y-4">
            <span className="inline-block px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full">
              Subscription Plans
            </span>
            <h2 className="text-3xl md:text-[2.5rem] font-[800] tracking-[-0.02em] leading-tight text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Attractive pricing, built for growing teams.
            </h2>
            <p className="text-slate-550 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-sans">
              Start with a friendly monthly plan, scale when your team grows, or choose a one-time enterprise license. Full plan details are on the pricing page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'rocket_launch', title: 'Startup-friendly entry', body: 'A low-friction plan for small teams moving away from spreadsheets.' },
              { icon: 'trending_up', title: 'Scales with your org', body: 'Upgrade when payroll, performance, expense, and shift workflows get serious.' },
              { icon: 'workspace_premium', title: 'Enterprise option', body: 'One-time license and custom deployment path for larger teams.' }
            ].map((item) => (
              <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-7 text-left">
                <div className="h-10 w-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-blue-600 text-[22px]">{item.icon}</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/pricing" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-sm uppercase tracking-wider transition-all text-center">
              View detailed pricing
            </Link>
            <button onClick={() => setShowTrialModal(true)} className="px-8 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-full text-sm uppercase tracking-wider transition-all">
              Start 7-day trial
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 8: CONTACT FORM / DEMO REQUEST */}
      <section id="contact" className="py-20 md:py-24 bg-slate-100/60 border-t border-slate-200">
        <div className="max-w-[1000px] mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Left Side persuasion */}
          <div className="md:col-span-5 space-y-6">
            <span
              className="inline-block px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              GET A LIVE DEMO
            </span>
            <h2
              className="text-2xl md:text-[2.25rem] font-[700] text-slate-900 leading-[1.15] tracking-[-0.02em]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              See WorkforceOS running your way — in under 30 minutes.
            </h2>
            <p className="text-slate-550 text-sm leading-[1.7] font-normal">
              We'll set up a private demo configured with your org's structure, roles, and sample data. No slide deck. No sales script. Just the product working the way your team would actually use it.
            </p>
            {/* List */}
            <ul className="space-y-3 font-semibold text-[14px] text-slate-700">
              {['A 30-minute screen-share demo', 'Your questions answered live', 'No commitment required', 'We reply within 24 hours'].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold select-none">&rarr;</span>
                  {item}
                </li>
              ))}
            </ul>
            {/* Founder Note */}
            <div className="pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-400 block font-medium">Founder's Direct Email:</span>
              <a href="mailto:param@workforceos.com" className="text-sm font-semibold text-blue-600 hover:underline">
                paramkhodiyar1008@gmail.com
              </a>
            </div>
          </div>

          {/* Right Side Form container - flat design */}
          <div className="md:col-span-7">
            <div className="bg-white border border-slate-200 rounded-[24px] p-8 md:p-10 relative">
              {isSuccess ? (
                <div className="text-center py-10 space-y-4 flex flex-col items-center animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 border border-green-100 flex items-center justify-center select-none mb-2">
                    <span className="material-symbols-outlined text-[28px] font-bold">done</span>
                  </div>
                  <h3
                    className="text-2xl font-bold text-slate-900"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    We've got your request.
                  </h3>
                  <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                    Expect a reply within 24 hours. We've sent a quick confirmation to your email.
                  </p>
                  <Link
                    href="/features"
                    className="text-sm font-bold text-blue-600 hover:underline pt-4 block"
                  >
                    Browse the full module breakdown &rarr;
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-150 text-red-700 text-xs rounded-lg">
                      {submitError}
                    </div>
                  )}

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="firstName" className="text-xs font-bold text-slate-700 uppercase">First Name</label>
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        autoComplete="given-name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-50 border ${errors.firstName ? 'border-red-500' : 'border-slate-200'} focus:border-blue-650 rounded-lg p-3 text-sm text-slate-800 transition-all`}
                        placeholder="Aarav"
                      />
                      {errors.firstName && <span className="text-red-500 text-[11px] block">{errors.firstName}</span>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="lastName" className="text-xs font-bold text-slate-700 uppercase">Last Name</label>
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        autoComplete="family-name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-50 border ${errors.lastName ? 'border-red-500' : 'border-slate-200'} focus:border-blue-650 rounded-lg p-3 text-sm text-slate-800 transition-all`}
                        placeholder="Mehta"
                      />
                      {errors.lastName && <span className="text-red-500 text-[11px] block">{errors.lastName}</span>}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase">Work Email</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} focus:border-blue-650 rounded-lg p-3 text-sm text-slate-800 transition-all`}
                      placeholder="aarav@company.in"
                    />
                    {errors.email && <span className="text-red-500 text-[11px] block">{errors.email}</span>}
                  </div>

                  {/* Company Details */}
                  <div className="space-y-1">
                    <label htmlFor="companyName" className="text-xs font-bold text-slate-700 uppercase">Company Name</label>
                    <input
                      id="companyName"
                      type="text"
                      name="companyName"
                      autoComplete="organization"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 border ${errors.companyName ? 'border-red-500' : 'border-slate-200'} focus:border-blue-650 rounded-lg p-3 text-sm text-slate-800 transition-all`}
                      placeholder="RazorCore Pvt Ltd"
                    />
                    {errors.companyName && <span className="text-red-500 text-[11px] block">{errors.companyName}</span>}
                  </div>

                  {/* Company Size */}
                  <div className="space-y-1">
                    <label htmlFor="companySize" className="text-xs font-bold text-slate-700 uppercase">Company Size</label>
                    <select
                      id="companySize"
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 border ${errors.companySize ? 'border-red-500' : 'border-slate-200'} focus:border-blue-650 rounded-lg p-3 text-sm text-slate-800 transition-all cursor-pointer`}
                    >
                      <option value="">Select size...</option>
                      <option value="1-20">1–20 employees</option>
                      <option value="21-50">21–50 employees</option>
                      <option value="51-200">51–200 employees</option>
                      <option value="201-500">201–500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                    {errors.companySize && <span className="text-red-500 text-[11px] block">{errors.companySize}</span>}
                  </div>

                  {/* Challenge Textarea */}
                  <div className="space-y-1">
                    <label htmlFor="challenge" className="text-xs font-bold text-slate-700 uppercase">Biggest HR Challenge</label>
                    <textarea
                      id="challenge"
                      name="challenge"
                      value={formData.challenge}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-lg p-3 text-sm text-slate-800 transition-all"
                      placeholder="e.g. We track attendance in Excel and leave approvals come on WhatsApp — it breaks down every month-end."
                    />
                  </div>

                  {/* Submit button - flat */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-full text-sm uppercase tracking-wider transition-all border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Request a demo</span>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center font-medium">
                    No credit card · No commitment · Replies within 24 hours
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Global Navigation Footer */}
      <LandingFooter />
      <VoyagerChatbot />

      {/* TRIAL REGISTRATION MODAL */}
      {showTrialModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-[28px] max-w-md w-full p-8 space-y-6 relative text-left">

            <div className="flex justify-between items-center shrink-0">
              <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                Trial Workspace
              </span>
              <button
                onClick={() => {
                  setShowTrialModal(false);
                  setTrialError('');
                }}
                className="text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 leading-tight">Start Your 7-Day Trial</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Set up a sandboxed organization workspace instantly. No credit card required, unlock all premium operational features.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Trial workspaces use <span className="font-mono font-bold text-slate-600">Workforce123!</span> as the temporary admin password.
              </p>
            </div>

            <form onSubmit={handleRegisterTrial} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold font-sans">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. David"
                    value={trialForm.firstName}
                    onChange={(e) => setTrialForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs text-slate-800 font-sans outline-none"
                    required
                    disabled={trialLoading}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold font-sans">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wallace"
                    value={trialForm.lastName}
                    onChange={(e) => setTrialForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs text-slate-800 font-sans outline-none"
                    required
                    disabled={trialLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold font-sans">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. david@dundermifflin.com"
                    value={trialForm.email}
                    onChange={(e) => setTrialForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs text-slate-800 font-sans outline-none"
                    required
                    disabled={trialLoading}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold font-sans">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={trialForm.phone}
                    onChange={(e) => setTrialForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs text-slate-800 font-sans outline-none"
                    required
                    disabled={trialLoading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold font-sans">
                  Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dunder Mifflin Paper"
                  value={trialForm.companyName}
                  onChange={(e) => setTrialForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs text-slate-800 font-sans outline-none"
                  required
                  disabled={trialLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold font-sans">
                  Company Size
                </label>
                <select
                  value={trialForm.companySize}
                  onChange={(e) => setTrialForm((prev) => ({ ...prev, companySize: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs text-slate-800 font-sans outline-none"
                  required
                  disabled={trialLoading}
                >
                  <option value="">Select size...</option>
                  <option value="1-20">1–20 employees</option>
                  <option value="21-50">21–50 employees</option>
                  <option value="51-200">51–200 employees</option>
                  <option value="201-500">201–500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold font-sans">
                  Biggest HR Challenge
                </label>
                <textarea
                  value={trialForm.challenge}
                  onChange={(e) => setTrialForm((prev) => ({ ...prev, challenge: e.target.value }))}
                  rows={4}
                  placeholder="Tell us what you want to fix first."
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs text-slate-800 font-sans outline-none"
                  disabled={trialLoading}
                />
              </div>

              {trialError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold text-center font-sans">
                  {trialError}
                </div>
              )}

              <button
                type="submit"
                disabled={trialLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                {trialLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Launching Workspace...
                  </>
                ) : (
                  'Launch Sandbox Workspace'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
