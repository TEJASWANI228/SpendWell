import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizes: Record<Size, string> = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-psm',
  lg: 'h-16 w-16 text-h6',
  xl: 'h-24 w-24 text-h4',
};

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: Size;
  className?: string;
  ring?: boolean;
}

export function Avatar({ name, src, size = 'md', className, ring = false }: AvatarProps) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-gradient-to-br from-brand-400 to-brand-700 font-semibold text-white',
        ring && 'ring-2 ring-white ring-offset-2 ring-offset-brand-700',
        sizes[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={`${name}'s profile photo`} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
      {!src ? <span className="sr-only">{name}</span> : null}
    </span>
  );
}
