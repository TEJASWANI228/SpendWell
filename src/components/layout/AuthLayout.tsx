import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  backTo?: string;
  compactHero?: boolean;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  backTo,
  compactHero = false,
}: AuthLayoutProps) {
  return (
    <div className="app-shell relative flex min-h-[100dvh] flex-col bg-white">
      <div
        className={cn(
          'relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-6 text-white',
          compactHero ? 'pb-12 pt-4' : 'pb-16 pt-4',
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-10 top-24 h-2.5 w-2.5 rounded-full bg-white/40"
        />
        <div className="relative flex items-center justify-between">
          {backTo ? (
            <Link
              to={backTo}
              aria-label="Go back"
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </Link>
          ) : (
            <Logo size={38} inverse />
          )}
          {backTo ? <Logo size={34} inverse /> : <span className="w-11" />}
        </div>
        <div className={cn('relative', compactHero ? 'mt-6' : 'mt-10')}>
          <h1 className="text-h4 text-white">{title}</h1>
          <p className="mt-2 max-w-[300px] text-psm leading-relaxed text-white/75">{subtitle}</p>
        </div>
      </div>

      <main className="relative -mt-7 flex flex-1 flex-col rounded-t-[28px] bg-white px-6 pb-8 pt-7">
        <div className="flex-1">{children}</div>
        {footer ? <div className="mt-8">{footer}</div> : null}
      </main>
    </div>
  );
}
