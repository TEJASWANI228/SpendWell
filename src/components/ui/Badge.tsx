import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'brand' | 'success' | 'danger' | 'warning' | 'neutral' | 'inverse';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const tones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-[#e6f7f1] text-success',
  danger: 'bg-[#ffebeb] text-danger',
  warning: 'bg-[#fff4e5] text-warning',
  neutral: 'bg-grey-100 text-ink-600',
  inverse: 'bg-white/15 text-white',
};

const dots: Record<Tone, string> = {
  brand: 'bg-brand-700',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  neutral: 'bg-ink-400',
  inverse: 'bg-white',
};

export function Badge({ className, tone = 'neutral', dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-caption font-medium',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} aria-hidden /> : null}
      {children}
    </span>
  );
}
