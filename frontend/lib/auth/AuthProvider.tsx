'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../api/client';

interface SeedUser {
  email: string;
  label: string;
  role: string;
}

const AuthContext = createContext<any>(null);

export const SEED_USERS: SeedUser[] = [
  { email: 'superadmin@workforceos.com', label: 'Super Admin', role: 'SUPER_ADMIN' },
  { email: 'michael@dunder-mifflin.com', label: 'Michael Scott', role: 'ORG_ADMIN' },
  { email: 'toby@dunder-mifflin.com', label: 'Toby Flenderson', role: 'HR_MANAGER' },
  { email: 'jim@dunder-mifflin.com', label: 'Jim Halpert', role: 'TEAM_MANAGER' },
  { email: 'dwight@dunder-mifflin.com', label: 'Dwight Schrute', role: 'DEPARTMENT_HEAD' },
  { email: 'pam@dunder-mifflin.com', label: 'Pam Beesly', role: 'EMPLOYEE' },
  { email: 'ryan@dunder-mifflin.com', label: 'Ryan Howard', role: 'INTERN' }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadUser() {
    try {
      const response = await api.auth.me();
      setUser(response.data);
      try {
        const orgRes = await api.organization.get();
        setOrganization(orgRes.data);
        setFeatures(orgRes.data.enabledFeatures || []);
      } catch (orgResError) {
        console.error(orgResError);
      }
    } catch (err) {
      setUser(null);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function login(email: string, password: string): Promise<void> {
    setLoading(true);
    try {
      const response = await api.auth.login(email, password);
      
      const tokens = response.data?.tokens;
      if (tokens) {
        localStorage.setItem('token', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        if (typeof window !== 'undefined' && (window as any).WorkforceOSBridge) {
          (window as any).WorkforceOSBridge.postMessage(JSON.stringify({
            type: 'save_token',
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          }));
        }
      }

      setUser(response.data.user);
      try {
        const orgRes = await api.organization.get();
        setOrganization(orgRes.data);
        setFeatures(orgRes.data.enabledFeatures || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
      router.push('/dashboard');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }

  async function quickLogin(email: string): Promise<void> {
    return login(email, 'Password123!');
  }

  function logout(): void {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    api.auth.logout(refreshToken).catch(console.error);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }

    setUser(null);
    setOrganization(null);
    setFeatures([]);
    // Notify native Flutter app to clear the stored biometric token
    if (typeof window !== 'undefined' && (window as any).WorkforceOSBridge) {
      (window as any).WorkforceOSBridge.postMessage(JSON.stringify({ type: 'clear_token' }));
    }
    router.push('/login');
  }

  async function switchRole(role: string): Promise<void> {
    setLoading(true);
    try {
      const response = await api.auth.switchRole(role);
      
      const tokens = response.data?.tokens;
      if (tokens) {
        localStorage.setItem('token', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        if (typeof window !== 'undefined' && (window as any).WorkforceOSBridge) {
          (window as any).WorkforceOSBridge.postMessage(JSON.stringify({
            type: 'save_token',
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          }));
        }
      }

      setUser(response.data.user);
      
      try {
        const orgRes = await api.organization.get();
        setOrganization(orgRes.data);
        setFeatures(orgRes.data.enabledFeatures || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
      router.push('/dashboard');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        loading,
        features,
        setFeatures,
        login,
        quickLogin,
        logout,
        switchRole,
        refetchUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
