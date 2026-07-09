'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';

export default function ResetPasswordPage() {
  const { user, refetchUser } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotOldPassword, setForgotOldPassword] = useState(false);
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadAdminEmail() {
      try {
        const dirRes = await api.employees.directory();
        const adminUser = dirRes.data?.find((u: any) => u.systemRole === 'SUPER_ADMIN' || u.systemRole === 'ORG_ADMIN');
        if (adminUser) {
          setSuperAdminEmail(adminUser.email);
        } else {
          setSuperAdminEmail('admin@dunder-mifflin.com');
        }
      } catch (err) {
        setSuperAdminEmail('admin@dunder-mifflin.com');
      }
    }
    loadAdminEmail();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setUpdating(true);
    try {
      await api.auth.changePassword({ oldPassword, newPassword });
      toast.success('Password updated successfully. Logging you in...');
      await refetchUser();
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl p-8 font-sans">
      <div className="text-center mb-6">
        <span className="material-symbols-outlined text-[48px] text-primary mb-2">lock_open</span>
        <h2 className="text-headline-sm font-extrabold text-on-surface">Password Rotation Required</h2>
        <p className="text-body-sm text-outline mt-1.5 leading-relaxed">
          Your account is currently using a temporary password. You must set a new secure password before continuing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Temporary / Current Password</label>
          <div className="relative">
            <input
              type={showOldPassword ? "text" : "password"}
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium font-mono"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showOldPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">New Password</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium font-mono"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showNewPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-label-sm text-outline mb-1.5 uppercase font-semibold">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-body-sm transition-all focus:ring-1 focus:ring-primary outline-none font-medium font-mono"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showConfirmPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            type="submit"
            disabled={updating}
            className="w-full py-3 bg-primary hover:bg-blue-700 text-white rounded-xl text-label-md font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {updating ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : null}
            Rotate Password & Login
          </button>

          <button
            type="button"
            onClick={() => setForgotOldPassword(!forgotOldPassword)}
            className="text-xs font-semibold text-primary hover:underline text-center cursor-pointer"
          >
            Forgot temporary password?
          </button>
        </div>
      </form>

      {forgotOldPassword && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl animate-fade-in text-left">
          <p className="text-label-md font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">info</span>
            Reset Current Password
          </p>
          <p className="text-xs mt-1.5 leading-relaxed text-slate-600">
            Please ask your HR or System Administrator to reset your temporary password. You can email them directly at:
          </p>
          <a
            href={`mailto:${superAdminEmail}?subject=Password Reset Request&body=Hi Administrator,%0D%0A%0D%0AI have forgotten my temporary password for WorkforceOS. Could you please reset it for me?%0D%0A%0D%0AMy Email is: ${user?.email}.`}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
          >
            <span className="material-symbols-outlined text-[16px]">mail</span>
            {superAdminEmail}
          </a>
        </div>
      )}
    </div>
  );
}
