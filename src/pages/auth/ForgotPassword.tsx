import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Mail, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useRequestOtp } from '@/api/queries';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/validation';

export function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const requestOtp = useRequestOtp();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: 'alex@spendwell.app' },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);
    try {
      await requestOtp.mutateAsync(values.email);
      showToast({
        title: 'Reset code sent',
        description: `Check ${values.email} for a 6-digit code.`,
        tone: 'success',
      });
      navigate('/otp', { state: { email: values.email } });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not send the reset code.');
    }
  }

  return (
    <AuthLayout
      compactHero
      backTo="/login"
      title="Forgot password?"
      subtitle="No stress. We’ll email you a secure code to reset it."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError ? (
          <div role="alert" className="flex items-start gap-2 rounded-[10px] bg-[#ffebeb] p-3 text-psm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        ) : null}

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-[18px] w-[18px]" />}
          error={errors.email?.message}
          hint="We’ll send a 6-digit code that expires in 10 minutes."
          {...register('email')}
        />

        <Button type="submit" fullWidth size="lg" loading={isSubmitting || requestOtp.isPending}>
          Send reset code
        </Button>

        <div className="flex items-start gap-3 rounded-[12px] bg-brand-50 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-700">
            <ShieldCheck className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <div>
            <p className="text-psm font-medium text-ink-900">Your account stays protected</p>
            <p className="mt-0.5 text-caption leading-relaxed text-ink-500">
              We never share your email, and the reset code can only be used once.
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
