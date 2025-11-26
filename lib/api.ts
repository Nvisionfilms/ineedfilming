// Railway API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'https://api-production-d1ca.up.railway.app';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Network error' };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{ user: any; token: string; mfaRequired?: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(email: string, password: string, fullName: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/me', {
      method: 'GET',
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async logout() {
    await this.request('/api/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
  }

  // MFA endpoints
  async enableMFA() {
    return this.request<{ secret: string; qrCode: string }>('/api/mfa/enable', {
      method: 'POST',
    });
  }

  async verifyMFASetup(token: string) {
    return this.request('/api/mfa/verify-setup', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async verifyMFALogin(token: string) {
    const response = await this.request<{ token: string }>('/api/mfa/verify-login', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async disableMFA(password: string) {
    return this.request('/api/mfa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async getMFAStatus() {
    return this.request<{ enabled: boolean }>('/api/mfa/status', {
      method: 'GET',
    });
  }

  // Projects
  async getProjects() {
    return this.request('/api/projects', {
      method: 'GET',
    });
  }

  // Messages
  async getMessages() {
    return this.request('/api/messages', {
      method: 'GET',
    });
  }

  // Files
  async getFiles(projectId: string) {
    return this.request(`/api/files?projectId=${projectId}`, {
      method: 'GET',
    });
  }

  // Newsletter
  async subscribeNewsletter(email: string, name?: string) {
    return this.request('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  }

  // Contact Form
  async submitContactForm(data: { name: string; email: string; phone?: string; message: string; service?: string }) {
    return this.request('/api/contact/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin - Clients
  async getClients() {
    return this.request('/api/clients', {
      method: 'GET',
    });
  }

  // Admin - Bookings
  async getBookings() {
    return this.request('/api/bookings', {
      method: 'GET',
    });
  }

  async createBooking(data: any) {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBooking(id: string, data: any) {
    return this.request(`/api/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBooking(id: string) {
    return this.request(`/api/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin - Create Client Account
  async createClientAccount(data: { email: string; password: string; full_name: string; company_name?: string; project_id?: string; booking_id?: string }) {
    return this.request('/api/clients/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClientAccount(userId: string, data: any) {
    return this.request(`/api/clients/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClientAccount(userId: string) {
    return this.request(`/api/clients/${userId}`, {
      method: 'DELETE',
    });
  }

  // Stripe
  async createCheckoutSession(data: { amount: number; customerEmail: string; customerName: string; metadata: any }) {
    return this.request('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Deliverables
  async getDeliverables(projectId: string) {
    return this.request(`/api/deliverables?projectId=${projectId}`, {
      method: 'GET',
    });
  }

  async createDeliverable(data: any) {
    return this.request('/api/deliverables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Meetings
  async getMeetings() {
    return this.request('/api/meetings', {
      method: 'GET',
    });
  }

  async createMeeting(data: any) {
    return this.request('/api/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Payments
  async getPayments(bookingId?: string) {
    const url = bookingId ? `/api/payments?bookingId=${bookingId}` : '/api/payments';
    return this.request(url, {
      method: 'GET',
    });
  }

  // Locations
  async getLocations(projectId: string) {
    return this.request(`/api/locations?projectId=${projectId}`, {
      method: 'GET',
    });
  }

  async createLocation(data: any) {
    return this.request('/api/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteLocation(id: string) {
    return this.request(`/api/locations/${id}`, {
      method: 'DELETE',
    });
  }

  // Call Sheets
  async getCallSheets(projectId: string) {
    return this.request(`/api/call-sheets?projectId=${projectId}`, {
      method: 'GET',
    });
  }

  async createCallSheet(data: any) {
    return this.request('/api/call-sheets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Shot Lists
  async getShotLists(projectId: string) {
    return this.request(`/api/shot-lists?projectId=${projectId}`, {
      method: 'GET',
    });
  }

  async createShotList(data: any) {
    return this.request('/api/shot-lists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getShotListItems(shotListId: string) {
    return this.request(`/api/shot-lists/${shotListId}/items`, {
      method: 'GET',
    });
  }

  async createShotListItem(shotListId: string, data: any) {
    return this.request(`/api/shot-lists/${shotListId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateShotListItem(shotListId: string, itemId: string, data: any) {
    return this.request(`/api/shot-lists/${shotListId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteShotListItem(shotListId: string, itemId: string) {
    return this.request(`/api/shot-lists/${shotListId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Send Message
  async sendMessage(data: { recipientId: string; subject?: string; message: string }) {
    return this.request('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markMessageAsRead(messageId: string) {
    return this.request(`/api/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  // Booking Actions
  async approveBooking(id: string, approvedPrice: number, adminNotes?: string) {
    return this.request(`/api/bookings/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved_price: approvedPrice, admin_notes: adminNotes }),
    });
  }

  async rejectBooking(id: string, adminNotes?: string) {
    return this.request(`/api/bookings/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ admin_notes: adminNotes }),
    });
  }

  async counterBooking(id: string, counterPrice: number, adminNotes?: string) {
    return this.request(`/api/bookings/${id}/counter`, {
      method: 'POST',
      body: JSON.stringify({ counter_price: counterPrice, admin_notes: adminNotes }),
    });
  }

  async archiveBooking(id: string) {
    return this.request(`/api/bookings/${id}/archive`, {
      method: 'POST',
    });
  }

  // Meeting Actions
  async updateMeeting(id: string, data: any) {
    return this.request(`/api/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMeeting(id: string) {
    return this.request(`/api/meetings/${id}`, {
      method: 'DELETE',
    });
  }

  // Opportunities
  async getOpportunities() {
    return this.request('/api/opportunities', {
      method: 'GET',
    });
  }

  async createOpportunity(data: any) {
    return this.request('/api/opportunities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOpportunity(id: string, data: any) {
    return this.request(`/api/opportunities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addOpportunityActivity(id: string, data: any) {
    return this.request(`/api/opportunities/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteOpportunity(id: string) {
    return this.request(`/api/opportunities/${id}`, {
      method: 'DELETE',
    });
  }

  // Deliverable Actions
  async updateDeliverable(id: string, data: any) {
    return this.request(`/api/deliverables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDeliverable(id: string) {
    return this.request(`/api/deliverables/${id}`, {
      method: 'DELETE',
    });
  }

  // Payment Actions
  async createPayment(data: any) {
    return this.request('/api/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayment(id: string, data: any) {
    return this.request(`/api/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(API_URL);
export default api;
