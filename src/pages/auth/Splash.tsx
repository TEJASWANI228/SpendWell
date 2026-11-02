import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/auth/AuthContext';

export const ONBOARDED_KEY = 'spendwell.onboarded.v1';

export function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const onboarded = localStorage.getItem(ONBOARDED_KEY) === 'true';
      if (!onboarded) {
        navigate('/onboarding', { replace: true });
      } else if (isAuthenticated && user?.profileCompleted === false) {
        navigate('/setup', { replace: true });
      } else if (isAuthenticated) {
        navigate('/app', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 1900);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, navigate, user?.profileCompleted]);

  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 px-8 text-white">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute left-16 top-32 h-2.5 w-2.5 rounded-full bg-white/50" />
      <div aria-hidden className="pointer-events-none absolute right-20 top-48 h-1.5 w-1.5 rounded-full bg-white/40" />

      <div className="relative flex flex-col items-center animate-fade-up">
        <div className="relative">
          <div aria-hidden className="absolute inset-0 -z-10 animate-ping rounded-[26px] bg-white/10" />
          <Logo size={92} inverse />
        </div>
        <h1 className="mt-6 text-[34px] font-semibold tracking-[-0.04em] text-white">SpendWell</h1>
        <p className="mt-2 text-psm font-medium tracking-[0.02em] text-white/70">
          Mindful money, every day.
        </p>
      </div>

      <div className="absolute bottom-16 flex flex-col items-center gap-6">
        <div className="flex items-center gap-1.5" role="status" aria-label="Loading SpendWell">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/70"
              style={{ animationDelay: `${index * 180}ms` }}
            />
          ))}
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
          Track · Budget · Grow
        </p>
      </div>
    </main>
  );
}
