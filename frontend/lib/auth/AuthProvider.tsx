'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../api/client';

interface SeedUser {
  email: string;
  label: string;
  role: string;
}

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  systemRole: string;
  originalRole?: string;
  designation?: string | null;
  avatarUrl?: string | null;
  organizationId: string;
  organization?: any;
  homeLatitude?: number | null;
  homeLongitude?: number | null;
  homeAddressLocked?: boolean;
  forcePasswordChange?: boolean;
  departmentId?: string | null;
  departmentHead?: { id: string }[];
  teamLead?: { id: string }[];
  teams?: { id: string; name: string }[];
  roles: Array<{ roleId: string; roleName: string; scopeType: string; scopeId: string }>;
  [key: string]: any;
}

interface AuthContextValue {
  user: AuthUser | null;
  organization: any | null;
  loading: boolean;
  features: string[];
  setFeatures: (features: string[]) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: string) => Promise<void>;
  refetchUser: () => Promise<void>;
  hasPermission: (resource: string, action?: string) => boolean;
  /** Only available in development builds */
  quickLogin?: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const isDev = process.env.NODE_ENV === 'development';

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
  const [user, setUser] = useState<AuthUser | null>(null);
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
        const loadedFeatures = orgRes.data?.enabledFeatures;
        const finalFeatures = (loadedFeatures && loadedFeatures.length > 0) ? loadedFeatures : [
          'employees', 'attendance', 'leave', 'tasks', 'performance', 'payroll', 'expenses', 'assets', 'knowledge', 'audit', 'calendar', 'org-canvas'
        ];
        setOrganization({ ...orgRes.data, enabledFeatures: finalFeatures });
        setFeatures(finalFeatures);
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
        try {
          api.auth.cookieExchange(tokens.accessToken, tokens.refreshToken).catch(() => {});
        } catch (_) {}
        if (typeof window !== 'undefined' && (window as any).WorkforceOSBridge) {
          const u = response.data?.user || response.user;
          (window as any).WorkforceOSBridge.postMessage(JSON.stringify({
            type: 'save_token',
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            userName: u ? `${u.firstName} ${u.lastName}` : 'Staff Member',
          }));
        }
      }

      setUser(response.data.user);
      try {
        const orgRes = await api.organization.get();
        const loadedFeatures = orgRes.data?.enabledFeatures;
        const finalFeatures = (loadedFeatures && loadedFeatures.length > 0) ? loadedFeatures : [
          'employees', 'attendance', 'leave', 'tasks', 'performance', 'payroll', 'expenses', 'assets', 'knowledge', 'audit', 'calendar', 'org-canvas'
        ];
        setOrganization({ ...orgRes.data, enabledFeatures: finalFeatures });
        setFeatures(finalFeatures);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
      const userRole = response.data.user?.systemRole;
      const origRole = response.data.user?.originalRole;
      if (userRole === 'SYS_OWNER' || origRole === 'SYS_OWNER') {
        router.push('/select-role');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }

  /** quickLogin is a dev-only helper — not exposed in production builds */
  async function quickLogin(email: string): Promise<void> {
    if (!isDev) return;
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
      
      const tokens = response.data?.tokens || response.tokens;
      const userObj = response.data?.user || response.user || user;
      if (tokens) {
        localStorage.setItem('token', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        if (typeof window !== 'undefined' && (window as any).WorkforceOSBridge) {
          (window as any).WorkforceOSBridge.postMessage(JSON.stringify({
            type: 'save_token',
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            userName: userObj ? `${userObj.firstName} ${userObj.lastName}` : 'Staff Member',
          }));
        }
      }

      if (userObj) {
        setUser({ ...userObj, originalRole: 'SYS_OWNER', systemRole: role });
      }
      
      try {
        const orgRes = await api.organization.get();
        const orgData = orgRes.data || orgRes;
        if (orgData) {
          setOrganization(orgData);
          setFeatures(orgData.enabledFeatures || []);
        }
      } catch (err) {
        console.error('Org fetch fallback on role switch:', err);
      }
      setLoading(false);
      router.push('/dashboard');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }

  function hasPermission(resource: string, action = 'read'): boolean {
    if (!user) return false;
    const isSysAdmin = user.systemRole === 'SYS_OWNER' || user.systemRole === 'SUPER_ADMIN' || user.systemRole === 'ORG_ADMIN' || user.originalRole === 'SYS_OWNER';
    if (isSysAdmin) return true;

    const userPerms = user.permissions || [];
    if (userPerms.includes(`${resource}:${action}`) || userPerms.includes(`${resource}:manage`) || userPerms.includes(`${resource}:*`)) {
      return true;
    }

    const objPerms = user.permissionObjects || [];
    return objPerms.some((p: any) => p.resource === resource && (p.action === action || p.action === 'manage' || p.action === '*'));
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
        ...(isDev ? { quickLogin } : {}),
        logout,
        switchRole,
        refetchUser: loadUser,
        hasPermission,
      } satisfies AuthContextValue}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
