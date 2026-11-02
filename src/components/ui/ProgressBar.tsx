import { cn } from '@/lib/cn';
import { clamp } from '@/lib/format';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'inverse' | 'auto';
type Size = 'sm' | 'md' | 'lg';

export interface ProgressBarProps {
  value: number;
  tone?: Tone;
  size?: Size;
  label?: string;
  className?: string;
  trackClassName?: string;
}

const sizes: Record<Size, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

const tones: Record<Exclude<Tone, 'auto'>, string> = {
  brand: 'bg-brand-700',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  inverse: 'bg-white',
};

function autoTone(value: number): Exclude<Tone, 'auto'> {
  if (value >= 100) return 'danger';
  if (value >= 80) return 'warning';
  return 'brand';
}

export function ProgressBar({
  value,
  tone = 'brand',
  size = 'md',
  label,
  className,
  trackClassName,
}: ProgressBarProps) {
  const percent = clamp(value, 0, 100);
  const resolvedTone = tone === 'auto' ? autoTone(percent) : tone;
  return (
    <div
      className={cn('w-full overflow-hidden rounded-pill bg-grey-100', sizes[size], trackClassName, className)}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
    >
      <div
        className={cn('h-full rounded-pill transition-[width] duration-700 ease-out', tones[resolvedTone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
