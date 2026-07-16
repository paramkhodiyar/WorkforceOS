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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string): Promise<void> {
    setLoading(true);
    try {
      const response = await api.auth.login(email, password);
      const token = response.data.tokens.accessToken;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      setUser(response.data.user);
      // Notify native Flutter app to save both tokens for biometric bypass
      if (typeof window !== 'undefined' && (window as any).WorkforceOSBridge) {
        (window as any).WorkforceOSBridge.postMessage(JSON.stringify({
          type: 'save_token',
          token,
          refreshToken: response.data.tokens.refreshToken,
        }));
      }
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
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setOrganization(null);
    setFeatures([]);
    // Notify native Flutter app to clear the stored biometric token
    if (typeof window !== 'undefined' && (window as any).WorkforceOSBridge) {
      (window as any).WorkforceOSBridge.postMessage(JSON.stringify({ type: 'clear_token' }));
    }
    router.push('/login');
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
