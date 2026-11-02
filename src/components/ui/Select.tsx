import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, error, options, id, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className="w-full">
      <label htmlFor={fieldId} className="mb-1.5 block text-psm font-medium text-ink-700">
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={cn(
            'min-h-[52px] w-full appearance-none rounded-[12px] border bg-white px-4 pr-10 text-pmd text-ink-900 outline-none transition',
            'focus:ring-2 focus:ring-brand-700/15',
            error ? 'border-danger' : 'border-grey-300 focus:border-brand-700',
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden
        />
      </div>
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-caption text-danger">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
});
