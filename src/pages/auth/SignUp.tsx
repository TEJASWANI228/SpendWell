import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { Divider, SocialButtons } from '@/components/ui/SocialButtons';
import { useToast } from '@/components/ui/Toast';
import { useSignUp, useGoogleSignIn } from '@/api/queries';
import { useAuth } from '@/auth/AuthContext';
import { googleClientId, signInWithGoogle } from '@/lib/google';
import { signUpSchema, type SignUpValues } from '@/lib/validation';

export function SignUp() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const signUp = useSignUp();
  const googleSignIn = useGoogleSignIn();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const password = watch('password');

  async function onSubmit(values: SignUpValues) {
    setFormError(null);
    try {
      const session = await signUp.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      signIn(session);
      showToast({
        title: 'Your account is ready',
        description: 'One quick step so we can set up your dashboard.',
        tone: 'success',
      });
      navigate('/setup', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create your account.');
    }
  }

  async function handleGoogleSignIn() {
    setFormError(null);
    setGoogleLoading(true);
    try {
      const profile = googleClientId() ? await signInWithGoogle() : undefined;
      const session = await googleSignIn.mutateAsync(profile);
      signIn(session);
      const first = session.user.name.trim().split(/\s+/)[0] || 'there';
      if (session.user.profileCompleted) {
        showToast({
          title: `Welcome, ${first}!`,
          description: 'Signed in with Google.',
          tone: 'success',
        });
      }
      navigate(session.user.profileCompleted ? '/app' : '/setup', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Google sign-up failed. Try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <AuthLayout
      compactHero
      title="Create your account"
      subtitle="A calmer relationship with money starts with one small step."
      footer={
        <p className="text-center text-psm text-ink-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError ? (
          <div role="alert" className="flex items-start gap-2 rounded-[10px] bg-[#ffebeb] p-3 text-psm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        ) : null}

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Alex Morgan"
          leftIcon={<UserRound className="h-[18px] w-[18px]" />}
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-[18px] w-[18px]" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
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
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
          leftIcon={<Lock className="h-[18px] w-[18px]" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-psm text-ink-600">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-grey-300 accent-brand-700"
              {...register('terms')}
            />
            <span>
              I agree to the{' '}
              <span className="font-medium text-brand-700 underline underline-offset-2">Terms of Service</span>{' '}
              and{' '}
              <span className="font-medium text-brand-700 underline underline-offset-2">Privacy Policy</span>.
            </span>
          </label>
          {errors.terms?.message ? (
            <p role="alert" className="mt-1 text-caption text-danger">
              {errors.terms.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting || signUp.isPending}>
          Create account
        </Button>

        <Divider label="or sign up with" />
        <SocialButtons
          googleLoading={googleLoading || googleSignIn.isPending}
          onGoogle={handleGoogleSignIn}
          onApple={() =>
            showToast({
              title: 'Apple sign-up is coming soon',
              description: 'Use your email to create an account for now.',
              tone: 'info',
            })
          }
        />
      </form>
    </AuthLayout>
  );
}
