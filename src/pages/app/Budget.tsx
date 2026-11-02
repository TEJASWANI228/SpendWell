import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Pencil,
  RotateCcw,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useAnalytics, useBudget } from '@/api/queries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RingProgress } from '@/components/ui/RingProgress';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { CategoryIcon } from '@/components/transactions/CategoryIcon';
import { CATEGORIES } from '@/data/categories';
import { daysInMonth, monthKey, monthLabel, shiftMonth } from '@/lib/dates';
import { formatCurrency, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';

export function Budget() {
  const [month, setMonth] = useState(monthKey());
  const { data: budget, isLoading: budgetLoading } = useBudget(month);
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(month);
  const [rollover, setRollover] = useState(true);

  const current = month === monthKey();
  const loading = budgetLoading || analyticsLoading;

  const total = budget?.amount ?? 0;
  const spent = analytics?.expense ?? 0;
  const remaining = total - spent;
  const percent = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
  const totalDays = daysInMonth(month);
  const daysLeft = current ? Math.max(1, totalDays - new Date().getDate() + 1) : totalDays;
  const dailyAllowance = remaining > 0 ? remaining / daysLeft : 0;
  const averagePerDay = spent / Math.max(1, current ? new Date().getDate() : totalDays);

  const rows = useMemo(() => {
    if (!budget || !analytics) return [];
    const spendMap = new Map(analytics.byCategory.map((entry) => [entry.categoryId, entry.amount]));
    return CATEGORIES.filter((category) => budget.categoryLimits[category.id] !== undefined).map(
      (category) => {
        const limit = budget.categoryLimits[category.id] ?? 0;
        const categorySpend = spendMap.get(category.id) ?? 0;
        return {
          category,
          limit,
          spent: categorySpend,
          percent: limit > 0 ? Math.min(100, (categorySpend / limit) * 100) : 0,
        };
      },
    );
  }, [budget, analytics]);

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-30 border-b border-grey-100 bg-white/95 px-5 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h6 text-ink-900">Budget</h1>
            <p className="text-caption text-ink-400">Give every dollar a gentle job</p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-grey-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setMonth((value) => shiftMonth(value, -1))}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-grey-100"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </button>
            <span className="min-w-[82px] text-center text-caption font-semibold text-ink-900">
              {monthLabel(month).split(' ')[0]}
              <span className="ml-1 font-normal text-ink-400">{month.slice(0, 4)}</span>
            </span>
            <button
              type="button"
              onClick={() => setMonth((value) => shiftMonth(value, 1))}
              disabled={current}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <div className="px-5 pt-4">
        {loading ? (
          <div className="space-y-4" role="status" aria-label="Loading budget">
            <Skeleton className="h-[230px] rounded-[20px]" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-[76px] rounded-card" />
              ))}
            </div>
            <Skeleton className="h-[280px] rounded-card" />
          </div>
        ) : (
          <>
            <section
              aria-label="Budget summary"
              className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-5 text-white shadow-float"
            >
              <div aria-hidden className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/10" />
              <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-white/10" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-psm text-white/70">Monthly budget</p>
                  <p className="mt-1 text-[30px] font-semibold tracking-[-0.03em] tabular-nums">
                    {formatCurrency(total)}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-2.5 py-1 text-[11px] font-medium">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    {formatCurrency(spent)} spent
                  </div>
                </div>
                <RingProgress
                  value={percent}
                  size={92}
                  stroke={9}
                  tone="inverse"
                  trackColor="rgba(255,255,255,0.22)"
                  label="Budget used"
                >
                  <span className="text-pmd font-semibold text-white">{formatPercent(percent)}</span>
                  <span className="text-[9px] uppercase tracking-wide text-white/60">used</span>
                </RingProgress>
              </div>
              <div className="relative mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-psm">
                <div>
                  <p className="text-[11px] text-white/60">Remaining</p>
                  <p className="font-semibold tabular-nums">
                    {formatCurrency(Math.abs(remaining))}
                    {remaining < 0 ? ' over' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-white/60">Days left</p>
                  <p className="font-semibold tabular-nums">{daysLeft}</p>
                </div>
              </div>
            </section>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Daily allowance', value: formatCurrency(dailyAllowance), icon: CalendarDays },
                { label: 'Avg / day', value: formatCurrency(averagePerDay), icon: Wallet },
                { label: 'Categories', value: String(rows.length), icon: RotateCcw },
              ].map((stat) => (
                <Card key={stat.label} padding="sm" className="shadow-card">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <stat.icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <p className="mt-2 text-[10px] leading-tight text-ink-400">{stat.label}</p>
                  <p className="truncate text-psm font-semibold tabular-nums text-ink-900">{stat.value}</p>
                </Card>
              ))}
            </div>

            <section className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-psm font-semibold text-ink-900">Category budgets</h2>
                <Link
                  to="/app/budget/set"
                  className="flex min-h-[44px] items-center gap-1 rounded-full px-2 text-caption font-semibold text-brand-700 hover:underline"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Adjust
                </Link>
              </div>

              {rows.length === 0 ? (
                <Card className="flex flex-col items-center py-8 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Wallet className="h-6 w-6" aria-hidden />
                  </span>
                  <p className="mt-3 text-psm font-semibold text-ink-900">No category limits yet</p>
                  <p className="mt-1 max-w-[240px] text-caption text-ink-500">
                    Add gentle limits to keep each part of your spending in check.
                  </p>
                  <Link
                    to="/app/budget/set"
                    className="mt-4 inline-flex min-h-[40px] items-center rounded-[10px] bg-brand-700 px-4 text-psm font-medium text-white shadow-brand transition hover:bg-brand-600"
                  >
                    Set category budgets
                  </Link>
                </Card>
              ) : (
                <div className="divide-y divide-grey-100 rounded-card bg-white px-4 shadow-card">
                  {rows.map((row) => {
                    const over = row.spent > row.limit;
                    return (
                      <div key={row.category.id} className="py-3.5">
                        <div className="flex items-center gap-3">
                          <CategoryIcon categoryId={row.category.id} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="truncate text-psm font-medium text-ink-900">{row.category.name}</p>
                              <p className="shrink-0 text-caption tabular-nums text-ink-500">
                                <span className={cn('font-medium', over ? 'text-danger' : 'text-ink-900')}>
                                  {formatCurrency(row.spent)}
                                </span>{' '}
                                / {formatCurrency(row.limit)}
                              </p>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-grey-100">
                              <div
                                className={cn(
                                  'h-full rounded-pill transition-all',
                                  row.percent >= 100
                                    ? 'bg-danger'
                                    : row.percent >= 80
                                      ? 'bg-warning'
                                      : 'bg-brand-700',
                                )}
                                style={{ width: `${row.percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <Card className="mt-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <RotateCcw className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-psm font-semibold text-ink-900">Roll over unused budget</p>
                    <Badge tone="brand">Smart</Badge>
                  </div>
                  <p className="mt-1 text-caption leading-relaxed text-ink-500">
                    Move what you don’t spend into next month’s buffer. Gentle progress, no pressure.
                  </p>
                  <div className="mt-3">
                    <Switch
                      checked={rollover}
                      onChange={setRollover}
                      label="Enable rollover"
                      description={rollover ? 'Unused budget carries forward' : 'Budget resets each month'}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-4">
              <Link
                to="/app/budget/set"
                className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand-700 px-6 text-pmd font-medium text-white shadow-brand transition hover:bg-brand-600"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Edit monthly budget
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
