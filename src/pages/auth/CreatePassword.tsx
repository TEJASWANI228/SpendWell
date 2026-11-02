import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Eye, EyeOff, Lock } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { useToast } from '@/components/ui/Toast';
import { useResetPassword } from '@/api/queries';
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/validation';

const requirements = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'One letter', test: (value: string) => /[A-Za-z]/.test(value) },
  { label: 'One number', test: (value: string) => /\d/.test(value) },
];

export function CreatePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const resetPassword = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const state = location.state as { token?: string; email?: string } | null;
  const token = state?.token ?? 'demo-reset-token';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password');

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);
    try {
      await resetPassword.mutateAsync({ token, password: values.password });
      showToast({
        title: 'Password updated',
        description: 'Sign in with your new password.',
        tone: 'success',
      });
      navigate('/login', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not update your password.');
    }
  }

  return (
    <AuthLayout
      compactHero
      backTo="/otp"
      title="Create new password"
      subtitle="Choose something strong and easy for you to remember."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError ? (
          <div role="alert" className="flex items-start gap-2 rounded-[10px] bg-[#ffebeb] p-3 text-psm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        ) : null}

        <div>
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Enter a new password"
            leftIcon={<Lock className="h-[18px] w-[18px]" />}
            error={errors.password?.message}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-grey-100 hover:text-ink-700"
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" aria-hidden /> : <Eye className="h-[18px] w-[18px]" aria-hidden />}
              </button>
            }
            {...register('password')}
          />
          <PasswordStrength value={password} />
        </div>

        <Input
          label="Confirm new password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your new password"
          leftIcon={<Lock className="h-[18px] w-[18px]" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="rounded-[12px] bg-grey-100 p-4">
          <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-500">
            Password checklist
          </p>
          <ul className="space-y-1.5">
            {requirements.map((requirement) => {
              const met = requirement.test(password);
              return (
                <li key={requirement.label} className="flex items-center gap-2 text-caption">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full ${
                      met ? 'bg-success text-white' : 'border border-grey-300 bg-white text-transparent'
                    }`}
                  >
                    <Check className="h-2.5 w-2.5" aria-hidden />
                  </span>
                  <span className={met ? 'text-ink-700' : 'text-ink-400'}>{requirement.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting || resetPassword.isPending}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
