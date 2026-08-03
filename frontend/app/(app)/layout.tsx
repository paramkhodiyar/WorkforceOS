'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthProvider';
import AppShell from '../../components/layout/AppShell';
import LogoLoader from '../../components/ui/LogoLoader';
import { api } from '../../lib/api/client';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, organization, loading, features } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if welcome popup should be shown for first-time signee in DB
      const dismissedLocal = localStorage.getItem(`wfos_welcome_dismissed_${user.id}`);
      if (!user.hasSeenWelcome && !dismissedLocal) {
        setShowWelcome(true);
      }

      const isSystemOwner = user.systemRole === 'SYS_OWNER' || user.originalRole === 'SYS_OWNER';

      // Intercept SYS_OWNER without selected active role
      if (user.systemRole === 'SYS_OWNER' && pathname !== '/select-role') {
        router.push('/select-role');
        return;
      }

      if (isSystemOwner) {
        return;
      }

      // Check License / Trial / Subscription Expiration
      if (organization) {
        const isTrial = organization.subscriptionStatus === 'TRIAL';
        const isExpired = organization.subscriptionStatus === 'EXPIRED' || organization.licenseStatus === 'INACTIVE' || organization.licenseStatus === 'REVOKED' || organization.licenseStatus === 'EXPIRED';
        const trialEnded = organization.trialEndDate && new Date(organization.trialEndDate) < new Date();

        if (isExpired || (isTrial && trialEnded)) {
          if (pathname !== '/paywall') {
            router.push('/paywall');
            return;
          }
        }

        // Check Onboarding status
        if (!organization.isSetupComplete && pathname !== '/onboarding/setup') {
          router.push('/onboarding/setup');
          return;
        }
      }

      if (user.forcePasswordChange && pathname !== '/reset-password') {
        router.push('/reset-password');
      } else if (!user.forcePasswordChange && pathname === '/reset-password') {
        router.push('/dashboard');
      }
    }
  }, [user, organization, loading, router, pathname]);

  const handleDismissWelcome = async () => {
    setShowWelcome(false);
    if (user) {
      localStorage.setItem(`wfos_welcome_dismissed_${user.id}`, 'true');
      try {
        await api.auth.dismissWelcome();
      } catch (err) {
        console.error('Failed to dismiss welcome popup in DB:', err);
      }
    }
  };

  if (loading) {
    return <LogoLoader size={80} text="Loading Workspace Session..." fullScreen />;
  }

  if (!user) {
    return null;
  }

  // If the user must change password, we render the page without the standard AppShell sidebar/header navigation to lock them down!
  if (user.forcePasswordChange && pathname === '/reset-password') {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 w-full">{children}</div>;
  }

  // Helper to map feature names to user-friendly guides
  const getFeatureGuide = (feat: string) => {
    switch (feat) {
      case 'payroll':
        return { name: 'Payroll & Compensation', desc: 'Access your monthly salary slips, statutory calculation sheets, and check payout logs.' };
      case 'tasks':
        return { name: 'Task Board', desc: 'Track your assigned work objectives, accept new actions, and submit work in review.' };
      case 'leave':
        return { name: 'Leave & Absences', desc: 'Request official time-off, track manager approvals, and view holiday calendars.' };
      case 'attendance':
        return { name: 'Attendance System', desc: 'Clock your daily shifts, check attendance records, and review location-locked status sheets.' };
      case 'expenses':
        return { name: 'Expense Claims', desc: 'Request reimbursements for recognized travel, meals, or equipment expenses.' };
      case 'assets':
        return { name: 'Inventory & Assets', desc: 'Verify physical workspace devices and hardware issued to your account.' };
      case 'performance':
        return { name: 'Performance Appraisals', desc: 'Examine performance logs, peer reviews, and designation parameters.' };
      case 'calendar':
        return { name: 'Organization Calendar', desc: 'Plan around company-wide schedules, meetings, and holiday declarations.' };
      case 'knowledge':
        return { name: 'Knowledge Center', desc: 'Browse training documents, security handbooks, and HR reference materials.' };
      default:
        return null;
    }
  };

  const activeGuides = (features || [])
    .map(getFeatureGuide)
    .filter((g): g is { name: string; desc: string } => g !== null);

  return (
    <>
      <AppShell>{children}</AppShell>

      {/* Premium Welcome Pop-up Modal (Shown once on first login) */}
      {showWelcome && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          {/* MOBILE CODE - Scrollable overlay container */}
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest block">Welcome to WorkforceOS</span>
                <h2 className="text-headline-sm font-black text-slate-900 leading-tight">
                  Hello, {user.firstName}!
                </h2>
                <p className="text-body-sm text-slate-550 leading-relaxed font-medium">
                  Your workspace profile is configured. Below are the functional modules available to you based on your role settings:
                </p>
              </div>

              {/* Active Features List */}
              <div className="space-y-3 pt-2">
                {activeGuides.length > 0 ? (
                  activeGuides.map((guide, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-205 rounded-2xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-slate-500 mt-0.5 text-[20px]">
                        {guide.name.includes('Task') ? 'assignment' :
                         guide.name.includes('Payroll') ? 'payments' :
                         guide.name.includes('Leave') ? 'event_busy' :
                         guide.name.includes('Attendance') ? 'event_available' :
                         guide.name.includes('Expense') ? 'receipt_long' :
                         guide.name.includes('Asset') ? 'inventory_2' :
                         guide.name.includes('Performance') ? 'trending_up' :
                         guide.name.includes('Calendar') ? 'calendar_today' :
                         'menu_book'}
                      </span>
                      <div>
                        <h4 className="text-body-sm font-bold text-slate-850">{guide.name}</h4>
                        <p className="text-body-xs text-slate-500 leading-relaxed mt-0.5 font-medium">{guide.desc}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-body-xs text-slate-500 italic">No special functional modules are active for your account role.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleDismissWelcome}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-label-md py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Get Started
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
