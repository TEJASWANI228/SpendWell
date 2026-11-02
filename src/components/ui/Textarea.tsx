import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, hint, error, id, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = [hint ? `${fieldId}-hint` : '', error ? `${fieldId}-error` : '']
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="w-full">
      <label htmlFor={fieldId} className="mb-1.5 block text-psm font-medium text-ink-700">
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full resize-none rounded-[12px] border bg-white px-4 py-3 text-pmd text-ink-900 outline-none transition-all duration-200',
          'placeholder:text-ink-400 focus:ring-2 focus:ring-brand-700/15',
          error
            ? 'border-danger focus:border-danger focus:ring-danger/15'
            : 'border-grey-300 focus:border-brand-700',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-caption text-danger">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-caption text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
