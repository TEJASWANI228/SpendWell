import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  backTo?: string;
  showBack?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  right,
  backTo,
  showBack = true,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  function goBack() {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex min-h-[60px] items-center gap-2 border-b border-grey-100 bg-white/95 px-4 py-2 backdrop-blur-md',
        className,
      )}
    >
      {showBack ? (
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-700 transition hover:bg-grey-100 active:bg-grey-200"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-pmd font-semibold text-ink-900">{title}</h1>
        {subtitle ? <p className="truncate text-caption text-ink-400">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-1">{right}</div> : null}
    </header>
  );
}
