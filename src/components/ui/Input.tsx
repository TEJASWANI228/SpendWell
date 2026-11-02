import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  optional?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, leftIcon, rightSlot, optional, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="mb-1.5 flex items-center justify-between text-psm font-medium text-ink-700"
      >
        <span>{label}</span>
        {optional ? <span className="text-caption font-normal text-ink-400">Optional</span> : null}
      </label>
      <div
        className={cn(
          'flex min-h-[52px] items-center gap-2.5 rounded-[12px] border bg-white px-4 transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-brand-700/15',
          error
            ? 'border-danger focus-within:border-danger focus-within:ring-danger/15'
            : 'border-grey-300 focus-within:border-brand-700',
          props.disabled && 'cursor-not-allowed border-grey-200 bg-grey-100',
        )}
      >
        {leftIcon ? (
          <span className={cn('shrink-0', error ? 'text-danger' : 'text-ink-400')} aria-hidden>
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-full min-h-[50px] w-full flex-1 bg-transparent text-pmd text-ink-900 outline-none',
            'placeholder:text-ink-400 disabled:cursor-not-allowed disabled:text-disabled',
            className,
          )}
          {...props}
        />
        {rightSlot ? <span className="shrink-0">{rightSlot}</span> : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 flex items-center gap-1.5 text-caption text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-caption text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
