import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  GraduationCap,
  IndianRupee,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useCompleteOnboarding } from '@/api/queries';
import { useAuth } from '@/auth/AuthContext';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { firstName } from '@/lib/format';
import { setupProfileSchema, type SetupProfileValues } from '@/lib/validation';

export function SetupProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const completeOnboarding = useCompleteOnboarding();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SetupProfileValues>({
    resolver: zodResolver(setupProfileSchema),
    defaultValues: { monthlyIncome: '', studentStatus: '', currentBalance: '' },
  });

  const isStudent = watch('studentStatus') === 'student';

  useEffect(() => {
    if (user?.profileCompleted) navigate('/app', { replace: true });
  }, [navigate, user?.profileCompleted]);

  async function onSubmit(values: SetupProfileValues) {
    setFormError(null);
    try {
      const updated = await completeOnboarding.mutateAsync({
        monthlyIncome: Number(values.monthlyIncome),
        isStudent: values.studentStatus === 'student',
        currentBalance:
          values.studentStatus === 'student' ? Number(values.currentBalance ?? 0) : undefined,
      });
      updateUser(updated);
      showToast({
        title: "You're all set",
        description: 'Your money profile is ready. Let’s look at your dashboard.',
        tone: 'success',
      });
      navigate('/app', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save your details.');
    }
  }

  const firstNameValue = firstName(user?.name?.trim() || 'there');

  return (
    <AuthLayout
      compactHero
      title="Let’s set up your money"
      subtitle={`Welcome, ${firstNameValue}. Two quick questions so SpendWell can shape itself around you.`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-[10px] bg-[#ffebeb] p-3 text-psm text-danger"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        ) : null}

        <Input
          label="Monthly income"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="e.g. 45000"
          leftIcon={<IndianRupee className="h-[18px] w-[18px]" />}
          hint="Your take-home income each month. We use it to suggest a comfortable budget."
          error={errors.monthlyIncome?.message}
          {...register('monthlyIncome')}
        />

        <fieldset>
          <legend className="mb-2 text-psm font-medium text-ink-700">Are you a student?</legend>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={isStudent}
              onClick={() => setValue('studentStatus', 'student', { shouldValidate: true })}
              className={cn(
                'flex min-h-[112px] flex-col items-start gap-1.5 rounded-[14px] border p-4 text-left transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2',
                isStudent
                  ? 'border-brand-700 bg-brand-50 shadow-brand'
                  : 'border-grey-300 bg-white hover:border-brand-400',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full',
                  isStudent ? 'bg-brand-700 text-white' : 'bg-grey-100 text-ink-500',
                )}
              >
                <GraduationCap className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="text-psm font-semibold text-ink-900">Yes, I’m a student</span>
              <span className="text-caption text-ink-400">Ask my current balance</span>
            </button>

            <button
              type="button"
              aria-pressed={watch('studentStatus') === 'not-student'}
              onClick={() => setValue('studentStatus', 'not-student', { shouldValidate: true })}
              className={cn(
                'flex min-h-[112px] flex-col items-start gap-1.5 rounded-[14px] border p-4 text-left transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2',
                watch('studentStatus') === 'not-student'
                  ? 'border-brand-700 bg-brand-50 shadow-brand'
                  : 'border-grey-300 bg-white hover:border-brand-400',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full',
                  watch('studentStatus') === 'not-student'
                    ? 'bg-brand-700 text-white'
                    : 'bg-grey-100 text-ink-500',
                )}
              >
                <Briefcase className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="text-psm font-semibold text-ink-900">No, I work</span>
              <span className="text-caption text-ink-400">Income is enough</span>
            </button>
          </div>
          {errors.studentStatus?.message ? (
            <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-caption text-danger">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {errors.studentStatus.message}
            </p>
          ) : null}
        </fieldset>

        {isStudent ? (
          <div className="animate-fade-up">
            <Input
              label="Current balance"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 12000"
              leftIcon={<Wallet className="h-[18px] w-[18px]" />}
              hint="What’s in your accounts right now? This becomes your starting balance."
              error={errors.currentBalance?.message}
              {...register('currentBalance')}
            />
          </div>
        ) : null}

        <div className="flex items-start gap-3 rounded-card bg-brand-50 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-700">
            <Sparkles className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <p className="text-caption leading-relaxed text-ink-600">
            We ask about income so your budgets fit real life. If you’re a student, your balance gives
            us a starting point — no judgement, just clarity.
          </p>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting || completeOnboarding.isPending}
          rightIcon={<ArrowRight className="h-[18px] w-[18px]" aria-hidden />}
        >
          Continue to SpendWell
        </Button>
      </form>
    </AuthLayout>
  );
}
