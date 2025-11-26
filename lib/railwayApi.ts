/**
 * Railway API Client
 * Centralized API client for all Railway backend calls
 */

const RAILWAY_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

class RailwayApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'RailwayApiError';
  }
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Make API request to Railway backend
 */
async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth token if required
  if (requireAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new RailwayApiError('No authentication token found', 401);
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${RAILWAY_API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      const errorData = isJson ? await response.json() : await response.text();
      throw new RailwayApiError(
        errorData.message || errorData.error || 'API request failed',
        response.status,
        errorData
      );
    }

    // Return parsed JSON or empty object for 204 responses
    if (response.status === 204) {
      return {} as T;
    }

    return isJson ? await response.json() : ({} as T);
  } catch (error) {
    if (error instanceof RailwayApiError) {
      throw error;
    }
    throw new RailwayApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

/**
 * Railway API Client
 */
export const railwayApi = {
  // ==================== AUTH ====================
  auth: {
    login: (email: string, password: string) =>
      apiRequest<{ token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        requireAuth: false,
      }),

    register: (email: string, password: string, name: string) =>
      apiRequest<{ token: string; user: any }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
        requireAuth: false,
      }),

    logout: () =>
      apiRequest('/api/auth/logout', {
        method: 'POST',
      }),

    getCurrentUser: () =>
      apiRequest<any>('/api/auth/me'),
  },

  // ==================== CLIENTS ====================
  clients: {
    getAll: () =>
      apiRequest<any[]>('/api/clients'),

    getById: (id: string) =>
      apiRequest<any>(`/api/clients/${id}`),

    create: (data: any) =>
      apiRequest<any>('/api/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/api/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest(`/api/clients/${id}`, {
        method: 'DELETE',
      }),
  },

  // ==================== PROJECTS ====================
  projects: {
    getAll: () =>
      apiRequest<any[]>('/api/projects'),

    getById: (id: string) =>
      apiRequest<any>(`/api/projects/${id}`),

    getByClientId: (clientId: string) =>
      apiRequest<any[]>(`/api/projects?client_id=${clientId}`),

    create: (data: any) =>
      apiRequest<any>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest(`/api/projects/${id}`, {
        method: 'DELETE',
      }),
  },

  // ==================== OPPORTUNITIES ====================
  opportunities: {
    getAll: () =>
      apiRequest<any[]>('/api/opportunities'),

    getById: (id: string) =>
      apiRequest<any>(`/api/opportunities/${id}`),

    create: (data: any) =>
      apiRequest<any>('/api/opportunities', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/api/opportunities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest(`/api/opportunities/${id}`, {
        method: 'DELETE',
      }),
  },

  // ==================== MEETINGS ====================
  meetings: {
    getAll: () =>
      apiRequest<any[]>('/api/meetings'),

    getById: (id: string) =>
      apiRequest<any>(`/api/meetings/${id}`),

    getByClientId: (clientId: string) =>
      apiRequest<any[]>(`/api/meetings?client_id=${clientId}`),

    create: (data: any) =>
      apiRequest<any>('/api/meetings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/api/meetings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest(`/api/meetings/${id}`, {
        method: 'DELETE',
      }),
  },

  // ==================== PAYMENTS ====================
  payments: {
    getAll: () =>
      apiRequest<any[]>('/api/payments'),

    getById: (id: string) =>
      apiRequest<any>(`/api/payments/${id}`),

    getByClientId: (clientId: string) =>
      apiRequest<any[]>(`/api/payments?client_id=${clientId}`),

    create: (data: any) =>
      apiRequest<any>('/api/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/api/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest(`/api/payments/${id}`, {
        method: 'DELETE',
      }),
  },

  // ==================== DELIVERABLES ====================
  deliverables: {
    getAll: () =>
      apiRequest<any[]>('/api/deliverables'),

    getById: (id: string) =>
      apiRequest<any>(`/api/deliverables/${id}`),

    getByProjectId: (projectId: string) =>
      apiRequest<any[]>(`/api/deliverables?project_id=${projectId}`),

    create: (data: any) =>
      apiRequest<any>('/api/deliverables', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/api/deliverables/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest(`/api/deliverables/${id}`, {
        method: 'DELETE',
      }),
  },

  // ==================== BOOKINGS ====================
  bookings: {
    getAll: () =>
      apiRequest<any[]>('/api/bookings'),

    getById: (id: string) =>
      apiRequest<any>(`/api/bookings/${id}`),

    create: (data: any) =>
      apiRequest<any>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/api/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest(`/api/bookings/${id}`, {
        method: 'DELETE',
      }),
  },

  // ==================== MESSAGES ====================
  messages: {
    getAll: () =>
      apiRequest<any[]>('/api/messages'),

    getByClientId: (clientId: string) =>
      apiRequest<any[]>(`/api/messages?client_id=${clientId}`),

    send: (data: any) =>
      apiRequest<any>('/api/messages', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ==================== EPISODES ====================
  episodes: {
    getAll: () =>
      apiRequest<any[]>('/api/episodes'),

    getById: (id: string) =>
      apiRequest<any>(`/api/episodes/${id}`),

    getByProjectId: (projectId: string) =>
      apiRequest<any[]>(`/api/episodes?project_id=${projectId}`),

    create: (data: any) =>
      apiRequest<any>('/api/episodes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      apiRequest<any>(`/api/episodes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiRequest(`/api/episodes/${id}`, {
        method: 'DELETE',
      }),
  },

  // ==================== FILES ====================
  files: {
    upload: async (file: File, metadata?: any) => {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      const token = getAuthToken();
      const response = await fetch(`${RAILWAY_API_URL}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new RailwayApiError('File upload failed', response.status);
      }

      return response.json();
    },

    getSignedUrl: (fileId: string) =>
      apiRequest<{ url: string }>(`/api/files/${fileId}/signed-url`),

    delete: (fileId: string) =>
      apiRequest(`/api/files/${fileId}`, {
        method: 'DELETE',
      }),
  },

  // ==================== GOOGLE CALENDAR ====================
  calendar: {
    getEvents: () =>
      apiRequest<any[]>('/api/calendar/events'),

    syncMeeting: (meetingId: string) =>
      apiRequest<{ success: boolean; eventId: string; meetLink: string; htmlLink: string }>('/api/calendar/sync', {
        method: 'POST',
        body: JSON.stringify({ meetingId }),
      }),

    updateEvent: (meetingId: string) =>
      apiRequest<{ success: boolean; eventId: string; htmlLink: string }>(`/api/calendar/sync/${meetingId}`, {
        method: 'PUT',
      }),

    deleteEvent: (meetingId: string) =>
      apiRequest<{ success: boolean }>(`/api/calendar/sync/${meetingId}`, {
        method: 'DELETE',
      }),
  },
};

export { RailwayApiError };
export default railwayApi;
