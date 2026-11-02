import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ScreenProps {
  children: ReactNode;
  className?: string;
  withNavPadding?: boolean;
}

export function Screen({ children, className, withNavPadding = false }: ScreenProps) {
  return (
    <div className={cn('screen', withNavPadding && 'pb-[84px]', className)}>{children}</div>
  );
}

export interface ScreenBodyProps {
  children: ReactNode;
  className?: string;
}

export function ScreenBody({ children, className }: ScreenBodyProps) {
  return <main className={cn('flex-1 px-5', className)}>{children}</main>;
}
