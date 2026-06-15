const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
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
    list: (filters?: any): Promise<any> => {
      const query = filters ? '?' + new URLSearchParams(filters).toString() : '';
      return request(`/employees${query}`);
    },
    get: (id: string): Promise<any> => request(`/employees/${id}`),
    create: (data: any): Promise<any> =>
      request('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any): Promise<any> =>
      request(`/employees/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string): Promise<any> =>
      request(`/employees/${id}`, {
        method: 'DELETE',
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
    getCurrentStatus: (): Promise<any> => request('/attendance/today'),
    team: (): Promise<any> => request('/attendance/team'),
    shifts: (): Promise<any> => request('/attendance/shifts'),
    adjust: (id: string, data: any): Promise<any> =>
      request(`/attendance/adjust/${id}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listAdjustments: (status?: string): Promise<any> => {
      const query = status ? `?status=${status}` : '';
      return request(`/attendance/adjustments${query}`);
    },
    approveAdjustment: (id: string): Promise<any> =>
      request(`/attendance/adjustments/${id}/approve`, {
        method: 'POST',
      }),
    rejectAdjustment: (id: string): Promise<any> =>
      request(`/attendance/adjustments/${id}/reject`, {
        method: 'POST',
      }),
    exceptions: (page = 1, limit = 10): Promise<any> =>
      request(`/attendance/exceptions?page=${page}&limit=${limit}`),
  },
  leave: {
    list: (): Promise<any> => request('/leave/my-requests'),
    balances: (): Promise<any> => request('/leave/balance'),
    apply: (data: any): Promise<any> =>
      request('/leave/apply', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    pendingApprovals: (): Promise<any> => request('/leave/approvals'),
    approve: (id: string, data: any): Promise<any> => {
      let endpoint;
      if (data.status === 'REJECTED') {
        endpoint = 'reject';
      } else {
        endpoint = data.currentStatus === 'MANAGER_APPROVED' ? 'hr-approve' : 'approve';
      }
      return request(`/leave/approvals/${id}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ comment: data.comment }),
      });
    },
    cancel: (id: string): Promise<any> =>
      request(`/leave/${id}/cancel`, {
        method: 'DELETE',
      }),
  },
  payroll: {
    list: (): Promise<any> => request('/payroll/my-payslips'),
    getPayslip: (id: string): Promise<any> => request(`/payroll/payslips/${id}`),
    runs: (): Promise<any> => request('/payroll/runs'),
    generate: (data: any): Promise<any> =>
      request('/payroll/runs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  tasks: {
    list: (filters?: any): Promise<any> => {
      const query = filters ? '?' + new URLSearchParams(filters).toString() : '';
      return request(`/tasks${query}`);
    },
    create: (data: any): Promise<any> =>
      request('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string): Promise<any> => {
      if (status === 'IN_PROGRESS' || status === 'ACCEPTED') {
        return request(`/tasks/${id}/accept`, { method: 'POST' });
      }
      if (status === 'DONE' || status === 'CLOSED') {
        return request(`/tasks/${id}/close`, { method: 'POST' });
      }
      return request(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    review: (id: string, data: any): Promise<any> =>
      request(`/tasks/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  expenses: {
    list: async (): Promise<any> => {
      try {
        const claims = await request('/expenses/my-claims');
        let approvals = { data: [] };
        try {
          approvals = await request('/expenses/approvals');
        } catch (err) {
          // ignore approvals 403
        }
        return {
          success: true,
          data: [...(claims.data || []), ...(approvals.data || [])],
        };
      } catch (err) {
        return { success: true, data: [] };
      }
    },
    create: (data: any): Promise<any> =>
      request('/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approve: (id: string, status: string): Promise<any> => {
      const endpoint = status === 'APPROVED' ? 'approve' : 'reject';
      return request(`/expenses/${id}/${endpoint}`, {
        method: 'POST',
      });
    },
  },
  assets: {
    list: async (): Promise<any> => {
      try {
        return await request('/assets');
      } catch (err) {
        return { success: true, data: [] };
      }
    },
    request: (data: any): Promise<any> => {
      return request('/assets', {
        method: 'POST',
        body: JSON.stringify(data),
      }).catch(() => {
        return { success: true, data };
      });
    },
  },
  knowledge: {
    list: (): Promise<any> => request('/knowledge/articles'),
    get: (id: string): Promise<any> => request(`/knowledge/articles/${id}`),
  },
  audit: {
    logs: (): Promise<any> => request('/audit/logs'),
  },
  organization: {
    get: (): Promise<any> => request('/organization/me'),
    updateFeatures: (orgId: string, enabledFeatures: string[]): Promise<any> =>
      request(`/organization/${orgId}/features`, {
        method: 'PATCH',
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
  departments: {
    list: (): Promise<any> => request('/departments'),
    get: (id: string): Promise<any> => request(`/departments/${id}`),
    create: (data: any): Promise<any> =>
      request('/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any): Promise<any> =>
      request(`/departments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string): Promise<any> =>
      request(`/departments/${id}`, {
        method: 'DELETE',
      }),
  },
  teams: {
    list: (): Promise<any> => request('/teams'),
    get: (id: string): Promise<any> => request(`/teams/${id}`),
    create: (data: any): Promise<any> =>
      request('/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any): Promise<any> =>
      request(`/teams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string): Promise<any> =>
      request(`/teams/${id}`, {
        method: 'DELETE',
      }),
  },
  performance: {
    listReviews: (isManager = false, period?: string, type?: string): Promise<any> => {
      const params = new URLSearchParams();
      if (isManager) params.append('isManager', 'true');
      if (period) params.append('period', period);
      if (type) params.append('type', type);
      return request(`/performance/reviews?${params.toString()}`);
    },
    getReview: (id: string): Promise<any> => request(`/performance/reviews/${id}`),
    createReview: (data: any): Promise<any> =>
      request('/performance/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    submitHrFeedback: (id: string, data: any): Promise<any> =>
      request(`/performance/reviews/${id}/hr-feedback`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    recalculate: (id: string, data: any): Promise<any> =>
      request(`/performance/reviews/${id}/recalculate`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    publish: (id: string): Promise<any> =>
      request(`/performance/reviews/${id}/publish`, {
        method: 'POST',
      }),
  },
};
