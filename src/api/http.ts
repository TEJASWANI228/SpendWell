import type {
  Analytics,
  AppNotification,
  AuthSession,
  Budget,
  BudgetInput,
  Dashboard,
  GoogleProfileInput,
  LoginInput,
  OnboardingInput,
  SignUpInput,
  SpendWellApi,
  Transaction,
  TransactionFilters,
  TransactionInput,
  User,
} from '@/api/types';
import { getToken } from '@/api/session';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) message = payload.message;
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function queryString(values: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export const httpApi: SpendWellApi = {
  auth: {
    login: (input: LoginInput) =>
      request<AuthSession>('/auth/login', { method: 'POST', body: input, auth: false }),
    signup: (input: SignUpInput) =>
      request<AuthSession>('/auth/signup', { method: 'POST', body: input, auth: false }),
    // Google OAuth: the UI obtains a Google profile (Google Identity Services)
    // and exchanges it with the backend for a SpendWell session.
    googleSignIn: (profile?: GoogleProfileInput) =>
      request<AuthSession>('/auth/google', {
        method: 'POST',
        body: profile ?? {},
        auth: false,
      }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
    requestOtp: (email: string) =>
      request<{ sent: boolean }>('/auth/forgot-password', {
        method: 'POST',
        body: { email },
        auth: false,
      }),
    verifyOtp: (email: string, code: string) =>
      request<{ resetToken: string }>('/auth/verify-otp', {
        method: 'POST',
        body: { email, code },
        auth: false,
      }),
    resetPassword: (resetToken: string, password: string) =>
      request<{ success: boolean }>('/auth/reset-password', {
        method: 'POST',
        body: { resetToken, password },
        auth: false,
      }),
  },

  me: () => request<User>('/me'),

  updateProfile: (input: Partial<User>) =>
    request<User>('/me', { method: 'PATCH', body: input }),

  completeOnboarding: (input: OnboardingInput) =>
    request<User>('/onboarding', { method: 'POST', body: input }),

  transactions: {
    list: (filters?: TransactionFilters) =>
      request<Transaction[]>(
        `/transactions${queryString({
          type: filters?.type,
          category: filters?.categoryId,
          q: filters?.query,
          from: filters?.from,
          to: filters?.to,
        })}`,
      ),
    get: (id: string) => request<Transaction>(`/transactions/${id}`),
    create: (input: TransactionInput) =>
      request<Transaction>('/transactions', { method: 'POST', body: input }),
    update: (id: string, input: Partial<TransactionInput>) =>
      request<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: input }),
    remove: (id: string) => request<void>(`/transactions/${id}`, { method: 'DELETE' }),
  },

  budgets: {
    get: (month: string) => request<Budget>(`/budgets/${month}`),
    upsert: (month: string, input: BudgetInput) =>
      request<Budget>(`/budgets/${month}`, { method: 'PUT', body: input }),
  },

  notifications: {
    list: () => request<AppNotification[]>('/notifications'),
    markRead: (id: string) =>
      request<AppNotification>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<void>('/notifications/read-all', { method: 'POST' }),
  },

  analytics: (month: string) => request<Analytics>(`/analytics${queryString({ month })}`),

  dashboard: () => request<Dashboard>('/dashboard'),
};
