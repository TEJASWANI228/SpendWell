import { cn } from '@/lib/cn';
import { passwordStrength } from '@/lib/validation';

const colors = ['bg-grey-200', 'bg-danger', 'bg-warning', 'bg-[#f4b740]', 'bg-success', 'bg-success'];

export function PasswordStrength({ value }: { value: string }) {
  const { score, label } = passwordStrength(value);
  if (!value) return null;
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'h-1 flex-1 rounded-pill transition-colors',
              index < score ? colors[score] ?? 'bg-success' : 'bg-grey-200',
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-caption text-ink-400">
        Password strength: <span className="font-medium text-ink-700">{label}</span>
      </p>
    </div>
  );
}
