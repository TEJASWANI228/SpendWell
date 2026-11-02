import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-700 text-white shadow-brand hover:bg-brand-600 active:bg-brand-800 disabled:bg-brand-300 disabled:shadow-none',
  secondary:
    'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 disabled:text-brand-300',
  outline:
    'border border-grey-300 bg-white text-ink-900 hover:border-brand-400 hover:text-brand-700 active:bg-brand-50 disabled:text-ink-300',
  ghost:
    'bg-transparent text-ink-700 hover:bg-grey-100 active:bg-grey-200 disabled:text-ink-300',
  danger:
    'bg-danger text-white hover:bg-[#d60000] active:bg-[#b80000] disabled:bg-danger/40',
  link: 'bg-transparent px-0 text-brand-700 underline-offset-4 hover:underline',
};

const sizes: Record<Size, string> = {
  sm: 'min-h-[40px] px-4 text-psm rounded-[10px] gap-2',
  md: 'min-h-[48px] px-5 text-pmd rounded-[12px] gap-2',
  lg: 'min-h-[54px] px-6 text-pmd rounded-[14px] gap-2.5',
  icon: 'h-11 w-11 min-h-[44px] min-w-[44px] rounded-full justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
