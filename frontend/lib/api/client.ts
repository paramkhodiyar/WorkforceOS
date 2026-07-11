const getApiBase = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) return 'http://localhost:4000/api/v1';
  return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/$/, '')}/api/v1`;
};

const API_BASE = getApiBase();

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
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
    if (response.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              const newAccessToken = refreshData.data.accessToken;
              const newRefreshToken = refreshData.data.refreshToken;
              
              if (typeof window !== 'undefined') {
                localStorage.setItem('token', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken);
                // Keep Flutter's stored token in sync after a silent refresh
                // so that biometric injection on next cold start uses a valid token.
                if ((window as any).WorkforceOSBridge) {
                  (window as any).WorkforceOSBridge.postMessage(
                    JSON.stringify({
                      type: 'save_token',
                      token: newAccessToken,
                      refreshToken: newRefreshToken,
                    })
                  );
                }
              }
              
              isRefreshing = false;
              onRefreshed(newAccessToken);
            } else {
              isRefreshing = false;
              if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
              }
              const errorData = await refreshRes.json().catch(() => ({}));
              throw new Error(errorData.message || `Refresh failed with status ${refreshRes.status}`);
            }
          } catch (refreshErr) {
            isRefreshing = false;
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
            }
            throw refreshErr;
          }
        }

        // Wait for the token to be refreshed
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            headers['Authorization'] = `Bearer ${newToken}`;
            resolve(
              fetch(`${API_BASE}${path}`, {
                ...options,
                headers,
              }).then((res) => {
                if (!res.ok) {
                  return res.json().catch(() => ({})).then((errorData) => {
                    throw new Error(errorData.message || `Retry request failed with status ${res.status}`);
                  });
                }
                return res.json();
              })
            );
          });
        });
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    } else if (response.status === 401 && path !== '/auth/login') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
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
    changePassword: (data: any): Promise<any> =>
      request('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    getAdminContact: (): Promise<any> => request('/auth/admin-contact'),
  },
  employees: {
    resetPassword: (employeeId: string, data: any): Promise<any> =>
      request(`/employees/${employeeId}/reset-password`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
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
    directory: (): Promise<any> => request('/employees/directory'),
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
    accept: (id: string): Promise<any> => request(`/tasks/${id}/accept`, { method: 'POST' }),
    submit: (id: string): Promise<any> => request(`/tasks/${id}/submit`, { method: 'POST' }),
    resubmit: (id: string): Promise<any> => request(`/tasks/${id}/resubmit`, { method: 'POST' }),
    close: (id: string): Promise<any> => request(`/tasks/${id}/close`, { method: 'POST' }),
    review: (id: string, data: any): Promise<any> =>
      request(`/tasks/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    addComment: (id: string, body: string): Promise<any> =>
      request(`/tasks/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
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
    updateLocation: (orgId: string, data: { officeLatitude: number | null; officeLongitude: number | null; officeRadius: number | null }): Promise<any> =>
      request(`/organization/${orgId}/location`, {
        method: 'PATCH',
        body: JSON.stringify(data),
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
    bulkPublish: (ids: string[]): Promise<any> =>
      request('/performance/reviews/bulk-publish', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
  },
  calendar: {
    listEvents: (start: string, end: string): Promise<any> =>
      request(`/calendar/events?start=${start}&end=${end}`),
    createEvent: (data: any): Promise<any> =>
      request('/calendar/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateEvent: (id: string, data: any): Promise<any> =>
      request(`/calendar/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteEvent: (id: string): Promise<any> =>
      request(`/calendar/events/${id}`, {
        method: 'DELETE',
      }),
    deleteInstance: (id: string, date: string): Promise<any> =>
      request(`/calendar/events/${id}/instance?date=${date}`, {
        method: 'DELETE',
      }),
    respond: (id: string, status: string): Promise<any> =>
      request(`/calendar/events/${id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    checkAvailability: (data: { inviteeIds: string[]; startTime: string; endTime: string }): Promise<any> =>
      request('/calendar/check-availability', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  onboarding: {
    onboard: (data: any): Promise<any> =>
      request('/onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
