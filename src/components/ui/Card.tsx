import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type CardVariant = 'default' | 'flat' | 'outline' | 'brand' | 'dark';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

const variants: Record<CardVariant, string> = {
  default: 'bg-white shadow-card',
  flat: 'bg-grey-100',
  outline: 'border border-grey-200 bg-white',
  brand: 'bg-brand-50',
  dark: 'bg-ink-900 text-white',
};

const paddings: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant = 'default', padding = 'md', ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('rounded-card', variants[variant], paddings[padding], className)}
      {...props}
    />
  );
});
