import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type {
  BudgetInput,
  GoogleProfileInput,
  LoginInput,
  OnboardingInput,
  SignUpInput,
  TransactionFilters,
  TransactionInput,
  User,
} from '@/api/types';
import { monthKey } from '@/lib/dates';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  me: ['me'] as const,
  transactions: (filters?: TransactionFilters) => ['transactions', filters ?? {}] as const,
  transaction: (id: string) => ['transaction', id] as const,
  budget: (month: string) => ['budget', month] as const,
  notifications: ['notifications'] as const,
  analytics: (month: string) => ['analytics', month] as const,
};

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: () => api.dashboard() });
}

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: () => api.me() });
}

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: () => api.transactions.list(filters),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: () => api.transactions.get(id),
    enabled: Boolean(id),
  });
}

export function useBudget(month: string = monthKey()) {
  return useQuery({
    queryKey: queryKeys.budget(month),
    queryFn: () => api.budgets.get(month),
  });
}

export function useNotifications() {
  return useQuery({ queryKey: queryKeys.notifications, queryFn: () => api.notifications.list() });
}

export function useAnalytics(month: string) {
  return useQuery({
    queryKey: queryKeys.analytics(month),
    queryFn: () => api.analytics(month),
  });
}

function useInvalidateFinance() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    void queryClient.invalidateQueries({ queryKey: ['analytics'] });
    void queryClient.invalidateQueries({ queryKey: ['budget'] });
  };
}

export function useLogin() {
  return useMutation({ mutationFn: (input: LoginInput) => api.auth.login(input) });
}

export function useGoogleSignIn() {
  return useMutation({
    mutationFn: (profile?: GoogleProfileInput) => api.auth.googleSignIn(profile),
  });
}

export function useSignUp() {
  return useMutation({ mutationFn: (input: SignUpInput) => api.auth.signup(input) });
}

export function useRequestOtp() {
  return useMutation({ mutationFn: (email: string) => api.auth.requestOtp(email) });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (input: { email: string; code: string }) =>
      api.auth.verifyOtp(input.email, input.code),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      api.auth.resetPassword(input.token, input.password),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (input: Partial<User>) => api.updateProfile(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      invalidate();
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OnboardingInput) => api.completeOnboarding(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}

export function useCreateTransaction() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (input: TransactionInput) => api.transactions.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateFinance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; values: Partial<TransactionInput> }) =>
      api.transactions.update(input.id, input.values),
    onSuccess: (transaction) => {
      queryClient.setQueryData(queryKeys.transaction(transaction.id), transaction);
      invalidate();
    },
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (id: string) => api.transactions.remove(id),
    onSuccess: invalidate,
  });
}

export function useUpsertBudget() {
  const invalidate = useInvalidateFinance();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { month: string; values: BudgetInput }) =>
      api.budgets.upsert(input.month, input.values),
    onSuccess: (budget) => {
      queryClient.setQueryData(queryKeys.budget(budget.month), budget);
      invalidate();
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
