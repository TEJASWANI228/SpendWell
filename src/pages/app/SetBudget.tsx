import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Sparkles, Wand2 } from 'lucide-react';
import type { Budget, CategoryId } from '@/api/types';
import { useBudget, useUpsertBudget } from '@/api/queries';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { CategoryIcon } from '@/components/transactions/CategoryIcon';
import { CATEGORIES } from '@/data/categories';
import { monthKey, monthLabel } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import { budgetSchema, type BudgetValues } from '@/lib/validation';
import { cn } from '@/lib/cn';

function BudgetForm({ budget }: { budget: Budget }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const upsertBudget = useUpsertBudget();
  const [limits, setLimits] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const category of CATEGORIES) {
      const value = budget.categoryLimits[category.id];
      initial[category.id] = value ? String(value) : '';
    }
    return initial;
  });
  const [allocationError, setAllocationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { amount: String(budget.amount) },
  });

  const amountValue = Number(watch('amount') || 0);

  const allocated = useMemo(
    () =>
      Object.values(limits).reduce((sum, value) => {
        const parsed = Number(value);
        return sum + (Number.isFinite(parsed) ? parsed : 0);
      }, 0),
    [limits],
  );

  const unallocated = amountValue - allocated;
  const allocationPercent = amountValue > 0 ? Math.min(100, (allocated / amountValue) * 100) : 0;

  function updateLimit(categoryId: CategoryId, value: string) {
    const clean = value.replace(/[^\d.]/g, '');
    setLimits((current) => ({ ...current, [categoryId]: clean }));
    setAllocationError(null);
  }

  function distributeEvenly() {
    const even = Math.floor((amountValue / CATEGORIES.length) * 100) / 100;
    const next: Record<string, string> = {};
    for (const category of CATEGORIES) next[category.id] = String(even);
    setLimits(next);
    setAllocationError(null);
  }

  async function submit(values: BudgetValues) {
    setAllocationError(null);
    const total = Number(values.amount);
    const categoryLimits: Partial<Record<CategoryId, number>> = {};
    for (const category of CATEGORIES) {
      const parsed = Number(limits[category.id]);
      if (Number.isFinite(parsed) && parsed > 0) categoryLimits[category.id] = parsed;
    }
    const allocatedTotal = Object.values(categoryLimits).reduce((sum, value) => sum + (value ?? 0), 0);
    if (allocatedTotal > total) {
      setAllocationError(
        `Category limits add up to ${formatCurrency(allocatedTotal)}, which is more than your ${formatCurrency(
          total,
        )} budget.`,
      );
      return;
    }
    await upsertBudget.mutateAsync({
      month: budget.month,
      values: { amount: total, categoryLimits },
    });
    showToast({
      title: 'Budget updated',
      description: 'Your category limits are now active.',
      tone: 'success',
    });
    navigate('/app/budget', { replace: true });
  }

  return (
    <div className="min-h-[100dvh] pb-28">
      <PageHeader title="Set budget" subtitle={monthLabel(budget.month)} backTo="/app/budget" />

      <form onSubmit={handleSubmit(submit)} noValidate className="px-5 pt-4">
        <div className="rounded-[16px] border border-brand-100 bg-brand-50 p-5 text-center">
          <label htmlFor="budget-amount" className="text-caption font-medium uppercase tracking-wide text-ink-500">
            Monthly budget
          </label>
          <div className="mt-1 flex items-center justify-center gap-1">
            <span className="text-h5 font-semibold text-brand-700" aria-hidden>
              $
            </span>
            <input
              id="budget-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              aria-invalid={errors.amount ? true : undefined}
              aria-describedby={errors.amount ? 'budget-amount-error' : undefined}
              className="w-[190px] bg-transparent text-center text-[38px] font-semibold tracking-[-0.03em] text-brand-900 outline-none placeholder:text-ink-400"
              {...register('amount')}
            />
          </div>
          {errors.amount?.message ? (
            <p id="budget-amount-error" role="alert" className="mt-1 flex items-center justify-center gap-1 text-caption text-danger">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden />
              {errors.amount.message}
            </p>
          ) : (
            <p className="mt-1 text-caption text-ink-400">A limit you can live with, not a punishment.</p>
          )}
        </div>

        <Card className="mt-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-psm font-semibold text-ink-900">Allocate by category</h2>
              <p className="text-caption text-ink-400">
                {formatCurrency(allocated)} allocated ·{' '}
                <span className={unallocated < 0 ? 'font-medium text-danger' : 'text-ink-500'}>
                  {formatCurrency(Math.abs(unallocated))} {unallocated < 0 ? 'over' : 'left'}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={distributeEvenly}
              className="flex min-h-[40px] items-center gap-1.5 rounded-pill bg-brand-50 px-3 text-caption font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              <Wand2 className="h-3.5 w-3.5" aria-hidden />
              Even split
            </button>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-grey-100">
            <div
              className={cn('h-full rounded-pill transition-all', unallocated < 0 ? 'bg-danger' : 'bg-brand-700')}
              style={{ width: `${allocationPercent}%` }}
            />
          </div>

          <div className="mt-2 divide-y divide-grey-100">
            {CATEGORIES.map((category) => (
              <div key={category.id} className="flex items-center gap-3 py-2.5">
                <CategoryIcon categoryId={category.id} size="sm" />
                <label htmlFor={`limit-${category.id}`} className="min-w-0 flex-1 truncate text-psm text-ink-700">
                  {category.name}
                </label>
                <div className="flex min-h-[40px] w-[104px] items-center gap-1 rounded-[10px] border border-grey-200 bg-white px-2.5 focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-700/15">
                  <span className="text-caption text-ink-400" aria-hidden>
                    $
                  </span>
                  <input
                    id={`limit-${category.id}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={limits[category.id] ?? ''}
                    onChange={(event) => updateLimit(category.id, event.target.value)}
                    className="w-full bg-transparent text-right text-psm font-medium tabular-nums text-ink-900 outline-none placeholder:text-ink-400"
                  />
                </div>
              </div>
            ))}
          </div>

          {allocationError ? (
            <p role="alert" className="mt-3 flex items-start gap-1.5 rounded-[10px] bg-[#ffebeb] p-2.5 text-caption text-danger">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {allocationError}
            </p>
          ) : null}
        </Card>

        <div className="mt-4 flex items-start gap-3 rounded-card bg-brand-50 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-700">
            <Sparkles className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <p className="text-caption leading-relaxed text-ink-600">
            Tip: leave a little unallocated. A small buffer makes room for the unexpected without
            breaking your plan.
          </p>
        </div>

        <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-grey-100 bg-white/95 px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          <Button type="submit" fullWidth size="lg" loading={isSubmitting || upsertBudget.isPending}>
            Save budget
          </Button>
        </div>
      </form>
    </div>
  );
}

export function SetBudget() {
  const month = monthKey();
  const { data, isLoading } = useBudget(month);

  if (isLoading || !data) {
    return (
      <div className="min-h-[100dvh]">
        <PageHeader title="Set budget" backTo="/app/budget" />
        <div className="space-y-4 px-5 pt-4" role="status" aria-label="Loading budget form">
          <Skeleton className="h-[150px] rounded-[16px]" />
          <Skeleton className="h-[420px] rounded-card" />
        </div>
      </div>
    );
  }

  return <BudgetForm budget={data} />;
}
