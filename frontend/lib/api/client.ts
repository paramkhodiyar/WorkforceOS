const getApiBase = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) return 'http://localhost:4000/api/v1';
  return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/$/, '')}/api/v1`;
};

const API_BASE = getApiBase();

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

let isRefreshing = false;
let refreshSubscribers: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

function subscribeTokenRefresh(resolve: (token: string) => void, reject: (err: any) => void) {
  refreshSubscribers.push({ resolve, reject });
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(err: any) {
  refreshSubscribers.forEach(({ reject }) => reject(err));
  refreshSubscribers = [];
}

function isProtectedPath(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  const protectedPrefixes = [
    '/dashboard',
    '/employees',
    '/tasks',
    '/attendance',
    '/leave',
    '/performance',
    '/payroll',
    '/assets',
    '/audit',
    '/calendar',
    '/settings',
    '/profile',
    '/select-role',
    '/my-team',
    '/ops-stats',
    '/paywall',
    '/onboarding/setup'
  ];
  return protectedPrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));
}

function getErrorMessage(status: number, errorData: any, defaultPrefix = "Request failed"): string {
  const backendMessage = errorData?.error?.message || errorData?.message;
  if (backendMessage) return backendMessage;

  switch (status) {
    case 400:
      return "The request could not be processed. Please check the entered data.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "Access Denied: You do not have permission to perform this action.";
    case 404:
      return "The requested page or resource could not be found.";
    case 422:
      return "Validation failed. Please verify your input data.";
    case 500:
      return "A server error occurred. Please try again in a few moments.";
    default:
      return `${defaultPrefix} (Status code: ${status}).`;
  }
}

async function request(path: string, options: RequestInit = {}, signal?: AbortSignal): Promise<any> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach access token if present
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Detect and flag if running in Flutter WebView
  const isBridge = typeof window !== 'undefined' && (window as any).WorkforceOSBridge;
  if (isBridge) {
    headers['x-workforceos-bridge'] = 'true';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    ...(signal ? { signal } : {}),
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
                if (isProtectedPath()) {
                  window.location.href = '/login';
                }
              }
              const errorData = await refreshRes.json().catch(() => ({}));
              const refreshError = new Error(getErrorMessage(refreshRes.status, errorData, "Refresh failed"));
              onRefreshFailed(refreshError);
              throw refreshError;
            }
          } catch (refreshErr: any) {
            isRefreshing = false;
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              if (isProtectedPath()) {
                window.location.href = '/login';
              }
            }
            onRefreshFailed(refreshErr);
            throw refreshErr;
          }
        }

        // Wait for the token to be refreshed
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            (newToken) => {
              headers['Authorization'] = `Bearer ${newToken}`;
              fetch(`${API_BASE}${path}`, {
                ...options,
                headers,
              })
                .then((res) => {
                  if (!res.ok) {
                    return res.json().catch(() => ({})).then((errorData) => {
                      reject(new Error(getErrorMessage(res.status, errorData, "Retry request failed")));
                    });
                  }
                  resolve(res.json());
                })
                .catch((err) => reject(err));
            },
            (err) => {
              reject(err);
            }
          );
        });
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          if (isProtectedPath()) {
            window.location.href = '/login';
          }
        }
      }
    } else if (response.status === 401 && path !== '/auth/login') {
      if (isProtectedPath()) {
        window.location.href = '/login';
      }
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(response.status, errorData));
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
    cookieExchange: (accessToken: string, refreshToken: string): Promise<any> =>
      request('/auth/cookie-exchange', {
        method: 'POST',
        body: JSON.stringify({ accessToken, refreshToken }),
      }),
    masterBypass: (data: { pin: string }): Promise<any> =>
      request('/auth/master-bypass', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: (): Promise<any> => request('/auth/me'),
    changePassword: (data: any): Promise<any> =>
      request('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    switchRole: (role: string): Promise<any> =>
      request('/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),
    registerTrial: (data: {
      organizationName?: string;
      companyName?: string;
      adminName?: string;
      firstName?: string;
      lastName?: string;
      adminEmail?: string;
      email?: string;
      phone: string;
      companySize: string;
      challenge?: string;
      nickname?: string;
      source?: string;
    }): Promise<any> =>
      request('/auth/register-trial', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAdminContact: (): Promise<any> => request('/auth/admin-contact'),
    logout: (refreshToken: string | null): Promise<any> =>
      request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),
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
    createProfileRequest: (data: any): Promise<any> =>
      request('/employees/profile-requests', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listProfileRequests: (): Promise<any> => request('/employees/profile-requests'),
    approveProfileRequest: (id: string): Promise<any> =>
      request(`/employees/profile-requests/${id}/approve`, {
        method: 'POST',
      }),
    rejectProfileRequest: (id: string, comment?: string): Promise<any> =>
      request(`/employees/profile-requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),
    setHomeAddress: (data: { lat: number; lng: number; radius: number; addressLabel: string }): Promise<any> =>
      request('/employees/home-address', {
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
    editPayslip: (id: string, data: any): Promise<any> =>
      request(`/payroll/payslips/${id}/edit`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    disbursePayslip: (id: string, formData: FormData): Promise<any> =>
      request(`/payroll/payslips/${id}/disburse`, {
        method: 'POST',
        body: formData,
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
    get: (id: string): Promise<any> => request(`/tasks/${id}`),
    flagBlocker: (id: string, note: string): Promise<any> =>
      request(`/tasks/${id}/blocker`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
    resolveBlocker: (id: string): Promise<any> =>
      request(`/tasks/${id}/resolve-blocker`, {
        method: 'POST',
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
    verifyUpi: (data: { utr: string; tier: string }): Promise<any> =>
      request('/organization/verify-upi', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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
    listHolidays: (): Promise<any> => request('/organization/holidays'),
    createHoliday: (data: { date: string; name: string; isOptional?: boolean }): Promise<any> =>
      request('/organization/holidays', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteHoliday: (id: string): Promise<any> =>
      request(`/organization/holidays/${id}`, {
        method: 'DELETE',
      }),
    getLicense: (): Promise<any> => request('/organization/license'),
    activateLicense: (data: { key: string }): Promise<any> =>
      request('/organization/license/activate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  adminCms: {
    listCustomers: (params?: { search?: string; page?: number; limit?: number }): Promise<any> => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      const str = q.toString();
      return request(`/admin/cms/customers${str ? `?${str}` : ''}`);
    },
    mintKey: (data: { companyName: string; tier: string; type?: string; maxEmployees?: number; validityDays?: number; notes?: string; orgId?: string }): Promise<any> =>
      request('/admin/cms/keys/mint', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (orgId: string, status: string): Promise<any> =>
      request(`/admin/cms/customers/${orgId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    listInvoices: (status?: string): Promise<any> =>
      request(`/admin/cms/invoices${status ? `?status=${status}` : ''}`),
    verifyInvoice: (invoiceId: string, isApproved: boolean, notes?: string): Promise<any> =>
      request(`/admin/cms/invoices/${invoiceId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ isApproved, notes }),
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
    setup: (data: any): Promise<any> =>
      request('/onboarding/setup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    uploadEmployees: (formData: FormData): Promise<any> =>
      request('/onboarding/upload-employees', {
        method: 'POST',
        body: formData,
      }),
  },
  stats: {
    getOperationsStats: (): Promise<any> => request('/stats'),
    getEmployeeStats: (userId: string): Promise<any> => request(`/stats/employee/${userId}`),
  },
  chatbot: {
    public: (message: string): Promise<any> =>
      request('/chatbot/public', {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    internal: (message: string): Promise<any> =>
      request('/chatbot/internal', {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
  },
};
