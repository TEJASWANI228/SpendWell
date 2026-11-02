import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-11 w-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-5" aria-label="Loading dashboard" role="status">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
      <Skeleton className="h-[172px] w-full rounded-[20px]" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-[12px]" />
        ))}
      </div>
      <Skeleton className="h-[120px] w-full rounded-card" />
      <div className="space-y-1 pt-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <TransactionRowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-1 px-5 py-3" role="status" aria-label="Loading list">
      {Array.from({ length: rows }).map((_, index) => (
        <TransactionRowSkeleton key={index} />
      ))}
    </div>
  );
}
