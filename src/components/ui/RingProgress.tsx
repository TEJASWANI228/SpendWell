import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { clamp } from '@/lib/format';

export interface RingProgressProps {
  value: number;
  size?: number;
  stroke?: number;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'inverse';
  trackColor?: string;
  label: string;
  children?: ReactNode;
  className?: string;
}

const toneColors = {
  brand: '#6f33ff',
  success: '#0f9f6e',
  warning: '#f79009',
  danger: '#ff0000',
  inverse: '#ffffff',
};

export function RingProgress({
  value,
  size = 128,
  stroke = 10,
  tone = 'brand',
  trackColor = '#eeeeee',
  label,
  children,
  className,
}: RingProgressProps) {
  const percent = clamp(value, 0, 100);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${Math.round(percent)}%`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={toneColors[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
