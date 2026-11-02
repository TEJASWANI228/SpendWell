import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Divider, SocialButtons } from '@/components/ui/SocialButtons';
import { useToast } from '@/components/ui/Toast';
import { useLogin, useGoogleSignIn } from '@/api/queries';
import { useAuth } from '@/auth/AuthContext';
import { googleClientId, signInWithGoogle } from '@/lib/google';
import { loginSchema, type LoginValues } from '@/lib/validation';

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const login = useLogin();
  const googleSignIn = useGoogleSignIn();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'alex@spendwell.app', password: 'spendwell123', remember: true },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      const session = await login.mutateAsync({ email: values.email, password: values.password });
      signIn(session);
      const firstName = session.user.name.trim().split(/\s+/)[0] || 'there';
      showToast({ title: `Welcome back, ${firstName}`, description: 'Your dashboard is ready.', tone: 'success' });
      navigate(session.user.profileCompleted ? '/app' : '/setup', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign in. Try again.');
    }
  }

  async function handleGoogleSignIn() {
    setFormError(null);
    setGoogleLoading(true);
    try {
      // Use the real Google account chooser when configured; otherwise the mock
      // API returns a demo Google account so the flow still works locally.
      const profile = googleClientId() ? await signInWithGoogle() : undefined;
      const session = await googleSignIn.mutateAsync(profile);
      signIn(session);
      const firstName = session.user.name.trim().split(/\s+/)[0] || 'there';
      if (session.user.profileCompleted) {
        showToast({
          title: `Welcome, ${firstName}!`,
          description: 'Signed in with Google.',
          tone: 'success',
        });
      }
      navigate(session.user.profileCompleted ? '/app' : '/setup', { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Google sign-in failed. Try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  const isBusy = isSubmitting || login.isPending || googleSignIn.isPending || googleLoading;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to keep your money moving in the right direction."
      footer={
        <p className="text-center text-psm text-ink-500">
          New to SpendWell?{' '}
          <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
            Create an account
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
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-[18px] w-[18px]" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
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

        <div className="flex items-center justify-between">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-psm text-ink-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-grey-300 text-brand-700 accent-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
              {...register('remember')}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-psm font-medium text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={isBusy}>
          Sign in
        </Button>

        <div className="rounded-[10px] bg-brand-50 px-3.5 py-2.5 text-caption text-brand-900">
          <span className="font-semibold">Demo mode:</span> credentials are pre-filled. Any email and a 6+ character password works — new emails go through a quick income setup.
        </div>

        <Divider label="or continue with" />
        <SocialButtons
          googleLoading={googleLoading || googleSignIn.isPending}
          onGoogle={handleGoogleSignIn}
          onApple={() =>
            showToast({
              title: 'Apple sign-in is coming soon',
              description: 'Use email and password for now.',
              tone: 'info',
            })
          }
        />
      </form>
    </AuthLayout>
  );
}
