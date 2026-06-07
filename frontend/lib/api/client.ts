const API_BASE = 'http://localhost:4000/api/v1';

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string): Promise<any> => 
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: (): Promise<any> => request('/auth/me'),
  },
  employees: {
    list: (): Promise<any> => request('/employees'),
    create: (data: any): Promise<any> =>
      request('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  attendance: {
    history: (): Promise<any> => request('/attendance/history'),
    checkIn: (data: any): Promise<any> =>
      request('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    checkOut: (): Promise<any> =>
      request('/attendance/check-out', {
        method: 'POST',
      }),
    getCurrentStatus: (): Promise<any> => request('/attendance/current'),
  },
  leave: {
    list: (): Promise<any> => request('/leave'),
    balances: (): Promise<any> => request('/leave/balances'),
    apply: (data: any): Promise<any> =>
      request('/leave/apply', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    pendingApprovals: (): Promise<any> => request('/leave/approvals/pending'),
    approve: (id: string, data: any): Promise<any> =>
      request(`/leave/approvals/${id}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  payroll: {
    list: (): Promise<any> => request('/payroll'),
    getPayslip: (id: string): Promise<any> => request(`/payroll/payslip/${id}`),
    runs: (): Promise<any> => request('/payroll/runs'),
    generate: (data: any): Promise<any> =>
      request('/payroll/runs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  tasks: {
    list: (): Promise<any> => request('/tasks'),
    create: (data: any): Promise<any> =>
      request('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string): Promise<any> =>
      request(`/tasks/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
  expenses: {
    list: (): Promise<any> => request('/expenses'),
    create: (data: any): Promise<any> =>
      request('/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approve: (id: string, status: string): Promise<any> =>
      request(`/expenses/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
  },
  assets: {
    list: (): Promise<any> => request('/assets'),
    request: (data: any): Promise<any> =>
      request('/assets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  knowledge: {
    list: (): Promise<any> => request('/knowledge'),
    get: (id: string): Promise<any> => request(`/knowledge/${id}`),
  },
  audit: {
    logs: (): Promise<any> => request('/audit'),
  },
  organization: {
    get: (): Promise<any> => request('/organization'),
    updateFeatures: (enabledFeatures: string[]): Promise<any> =>
      request('/organization/features', {
        method: 'PUT',
        body: JSON.stringify({ enabledFeatures }),
      }),
  },
  notifications: {
    list: (): Promise<any> => request('/notifications'),
    unreadCount: (): Promise<any> => request('/notifications/unread-count'),
    readAll: (): Promise<any> =>
      request('/notifications/read-all', {
        method: 'PATCH',
      }),
    markRead: (id: string): Promise<any> =>
      request(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    dismiss: (id: string): Promise<any> =>
      request(`/notifications/${id}`, {
        method: 'DELETE',
      }),
  },
};
