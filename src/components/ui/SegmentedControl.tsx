import { cn } from '@/lib/cn';

export interface SegmentOption {
  value: string;
  label: string;
  count?: number;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, label, className }: SegmentedControlProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex w-full rounded-[12px] bg-grey-100 p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[9px] px-3 text-psm font-medium transition-all duration-200',
              active
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-ink-500 hover:text-ink-700',
            )}
          >
            {option.label}
            {typeof option.count === 'number' ? (
              <span
                className={cn(
                  'rounded-pill px-1.5 py-0.5 text-[10px] leading-none',
                  active ? 'bg-brand-50 text-brand-700' : 'bg-white/70 text-ink-400',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
