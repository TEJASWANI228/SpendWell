import { cn } from '@/lib/cn';

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  inverse?: boolean;
  className?: string;
}

export function Logo({ size = 40, withWordmark = false, inverse = false, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="SpendWell"
        className="shrink-0 drop-shadow-[0_6px_14px_rgba(111,51,255,0.25)]"
      >
        <defs>
          <linearGradient id="spendwell-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a783fc" />
            <stop offset="1" stopColor="#6f33ff" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill="url(#spendwell-mark)" />
        <path
          d="M20 40.5c4.2 3.4 8.2 5 12.2 5 5 0 8.2-2.3 8.2-5.8 0-3.2-2.3-4.6-7.6-5.8l-3.1-.7c-6.6-1.4-9.6-4-9.6-8.8C20.1 18.6 24.8 15 32 15c4.6 0 8.6 1.3 12 3.8l-3.2 4.5c-2.8-1.9-5.8-2.9-9-2.9-4.4 0-6.9 1.8-6.9 4.6 0 2.5 1.9 3.7 6.4 4.7l3 .7c7.2 1.6 10.8 4.5 10.8 9.9 0 6.4-5.3 10.4-13.4 10.4-5.4 0-10.2-1.8-14.2-5.4L20 40.5Z"
          fill="#fff"
        />
      </svg>
      {withWordmark ? (
        <span
          className={cn(
            'text-[22px] font-semibold tracking-[-0.03em]',
            inverse ? 'text-white' : 'text-ink-900',
          )}
        >
          Spend<span className={inverse ? 'text-white/80' : 'text-brand-700'}>Well</span>
        </span>
      ) : null}
    </div>
  );
}
