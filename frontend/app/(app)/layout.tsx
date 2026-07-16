'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthProvider';
import AppShell from '../../components/layout/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, organization, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Check Trial / Subscription Expiration
      if (organization) {
        const isTrial = organization.subscriptionStatus === 'TRIAL';
        const isExpired = organization.subscriptionStatus === 'EXPIRED';
        const trialEnded = organization.trialEndDate && new Date(organization.trialEndDate) < new Date();

        if (isExpired || (isTrial && trialEnded)) {
          router.push('/paywall');
          return;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-label-sm text-outline tracking-wider font-semibold uppercase">Loading Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If the user must change password, we render the page without the standard AppShell sidebar/header navigation to lock them down!
  if (user.forcePasswordChange && pathname === '/reset-password') {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 w-full">{children}</div>;
  }

  return <AppShell>{children}</AppShell>;
}
