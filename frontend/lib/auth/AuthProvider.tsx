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
  { email: 'orgadmin@acme.com', label: 'Org Admin', role: 'ORG_ADMIN' },
  { email: 'hr@acme.com', label: 'HR Manager', role: 'HR_MANAGER' },
  { email: 'manager1@acme.com', label: 'Team Manager', role: 'TEAM_MANAGER' },
  { email: 'manager2@acme.com', label: 'Dept Head', role: 'DEPARTMENT_HEAD' },
  { email: 'emp1@acme.com', label: 'Employee 1', role: 'EMPLOYEE' },
  { email: 'intern@acme.com', label: 'Intern', role: 'INTERN' }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadUser() {
    try {
      const response = await api.auth.me();
      setUser(response.data);
    } catch (err) {
      setUser(null);
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
      localStorage.setItem('token', response.data.tokens.accessToken);
      setUser(response.data.user);
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
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
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
