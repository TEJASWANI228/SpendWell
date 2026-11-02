import { z } from 'zod';

const email = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/[0-9]/, 'Include at least one number');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean(),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const signUpSchema = z
  .object({
    name: z.string().min(2, 'Enter your full name'),
    email,
    password,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    terms: z.boolean().refine((value) => value, {
      message: 'Please accept the terms to continue',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type SignUpValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const otpSchema = z.object({
  code: z
    .string()
    .length(6, 'Enter the 6-digit code')
    .regex(/^\d{6}$/, 'The code only contains numbers'),
});
export type OtpValues = z.infer<typeof otpSchema>;

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const categoryIds = [
  'food',
  'groceries',
  'shopping',
  'transport',
  'bills',
  'entertainment',
  'health',
  'education',
  'travel',
  'other',
] as const;

export const transactionSchema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z
    .string()
    .min(1, 'Enter an amount')
    .refine((value) => Number(value) > 0, 'Amount must be greater than zero')
    .refine((value) => Number(value) <= 1_000_000, 'Amount is too large'),
  categoryId: z.enum(categoryIds),
  note: z.string().min(1, 'Add a short note').max(80, 'Keep the note under 80 characters'),
  date: z.string().min(1, 'Choose a date'),
  paymentMethod: z.enum(['card', 'cash', 'bank']),
});

export type TransactionValues = z.infer<typeof transactionSchema>;

export const budgetSchema = z.object({
  amount: z
    .string()
    .min(1, 'Enter a budget amount')
    .refine((value) => Number(value) > 0, 'Budget must be greater than zero'),
});
export type BudgetValues = z.infer<typeof budgetSchema>;

export const profileSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email,
  phone: z
    .string()
    .min(1, 'Enter a phone number')
    .regex(/^[+()\d\s-]{7,20}$/, 'Enter a valid phone number'),
  monthlyIncome: z
    .string()
    .min(1, 'Enter your monthly income')
    .refine((value) => Number(value) >= 0, 'Income cannot be negative'),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const setupProfileSchema = z
  .object({
    monthlyIncome: z
      .string()
      .min(1, 'Enter your monthly income')
      .refine((value) => Number(value) > 0, 'Income must be greater than zero')
      .refine((value) => Number.isFinite(Number(value)), 'Enter a valid amount'),
    studentStatus: z
      .string()
      .refine(
        (value): boolean => value === 'student' || value === 'not-student',
        'Tell us whether you are a student',
      ),
    currentBalance: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.studentStatus !== 'student') return;
    const raw = values.currentBalance?.trim() ?? '';
    if (!raw) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentBalance'],
        message: 'Enter your current balance',
      });
      return;
    }
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentBalance'],
        message: 'Enter a valid balance',
      });
    }
  });
export type SetupProfileValues = z.infer<typeof setupProfileSchema>;

export function passwordStrength(value: string): { score: number; label: string } {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  return { score, label: labels[score] ?? 'Too weak' };
}
