import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChartPie,
  PiggyBank,
  TrendingUp,
} from 'lucide-react';
import { useAnalytics } from '@/api/queries';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { categoryFor } from '@/data/categories';
import { monthKey, monthLabel, shiftMonth } from '@/lib/dates';
import { formatCurrency, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Slice {
  id: string;
  name: string;
  value: number;
  color: string;
  share: number;
}

export function Analytics() {
  const [month, setMonth] = useState(monthKey());
  const { data, isLoading } = useAnalytics(month);
  const current = month === monthKey();

  const slices = useMemo<Slice[]>(() => {
    if (!data) return [];
    const sorted = data.byCategory;
    const top: Slice[] = sorted.slice(0, 5).map((entry) => {
      const category = categoryFor(entry.categoryId);
      return {
        id: entry.categoryId,
        name: category.name,
        value: entry.amount,
        color: category.color,
        share: entry.share,
      };
    });
    const rest = sorted.slice(5);
    if (rest.length > 0) {
      const value = rest.reduce((sum, entry) => sum + entry.amount, 0);
      const share = rest.reduce((sum, entry) => sum + entry.share, 0);
      top.push({ id: 'other-group', name: 'Other', value, color: '#828384', share });
    }
    return top;
  }, [data]);

  const totalSpend = data?.expense ?? 0;
  const savingsRate = data && data.income > 0 ? data.savings / data.income : 0;
  const topCategory = slices[0];

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-30 border-b border-grey-100 bg-white/95 px-5 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h6 text-ink-900">Analytics</h1>
            <p className="text-caption text-ink-400">Understand your money, gently</p>
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
        {isLoading || !data ? (
          <div className="space-y-4" role="status" aria-label="Loading analytics">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-[86px] rounded-card" />
              ))}
            </div>
            <Skeleton className="h-[280px] rounded-card" />
            <Skeleton className="h-[320px] rounded-card" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: 'Income',
                  value: data.income,
                  icon: ArrowDownLeft,
                  className: 'text-success',
                  bg: 'bg-[#e6f7f1]',
                },
                {
                  label: 'Expenses',
                  value: data.expense,
                  icon: ArrowUpRight,
                  className: 'text-danger',
                  bg: 'bg-[#fff0f0]',
                },
                {
                  label: 'Saved',
                  value: data.savings,
                  icon: PiggyBank,
                  className: 'text-brand-700',
                  bg: 'bg-brand-50',
                },
              ].map((stat) => (
                <Card key={stat.label} padding="sm" className="shadow-card">
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', stat.bg, stat.className)}>
                    <stat.icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <p className="mt-2 text-[11px] text-ink-400">{stat.label}</p>
                  <p className={cn('truncate text-psm font-semibold tabular-nums', stat.className)}>
                    {formatCurrency(stat.value)}
                  </p>
                </Card>
              ))}
            </div>

            <Card className="mt-4 shadow-card" padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-psm font-semibold text-ink-900">Income vs expenses</h2>
                  <p className="text-caption text-ink-400">Last 6 months</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-ink-500">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-brand-700" aria-hidden />
                    Income
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-brand-300" aria-hidden />
                    Expense
                  </span>
                </div>
              </div>

              <div className="mt-4 h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthly} barGap={3} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#828384', fontSize: 11 }}
                      dy={6}
                    />
                    <Tooltip
                      cursor={{ fill: '#f7f3ff' }}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #e8e8ea',
                        boxShadow: '0 8px 24px rgba(21,18,28,0.10)',
                        fontSize: 12,
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Bar dataKey="income" name="Income" fill="#6f33ff" radius={[4, 4, 0, 0]} maxBarSize={14} />
                    <Bar dataKey="expense" name="Expense" fill="#c3a6ff" radius={[4, 4, 0, 0]} maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="sr-only">
                Income and expenses for the last six months. Current month income{' '}
                {formatCurrency(data.income)} and expenses {formatCurrency(data.expense)}.
              </p>
            </Card>

            <Card className="mt-4 shadow-card" padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-psm font-semibold text-ink-900">Spending by category</h2>
                  <p className="text-caption text-ink-400">{monthLabel(month)}</p>
                </div>
                {topCategory ? <Badge tone="brand">{topCategory.name}</Badge> : null}
              </div>

              {slices.length === 0 ? (
                <EmptyState
                  icon={<ChartPie className="h-7 w-7" aria-hidden />}
                  title="No spending yet"
                  description="Add an expense and your category breakdown will appear here."
                  className="py-8"
                />
              ) : (
                <>
                  <div className="relative mx-auto mt-2 h-[190px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={slices}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={62}
                          outerRadius={86}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {slices.map((slice) => (
                            <Cell key={slice.id} fill={slice.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 10,
                            border: '1px solid #e8e8ea',
                            fontSize: 12,
                          }}
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-caption text-ink-400">Total spent</span>
                      <span className="text-pmd font-semibold text-ink-900">{formatCurrency(totalSpend)}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-success">
                        <TrendingUp className="h-3 w-3" aria-hidden />
                        {formatPercent(savingsRate * 100)} saved
                      </span>
                    </div>
                  </div>

                  <ul className="mt-3 divide-y divide-grey-100">
                    {slices.map((slice) => (
                      <li key={slice.id} className="flex items-center gap-2.5 py-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-psm text-ink-700">{slice.name}</span>
                        <span className="text-caption text-ink-400">{formatPercent(slice.share * 100)}</span>
                        <span className="w-[74px] text-right text-psm font-medium tabular-nums text-ink-900">
                          {formatCurrency(slice.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>

            <div className="mt-4 flex items-start gap-3 rounded-card bg-brand-50 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-700">
                <ChartPie className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <p className="text-psm leading-relaxed text-ink-700">
                {topCategory ? (
                  <>
                    <span className="font-semibold">{topCategory.name}</span> is your biggest category at{' '}
                    <span className="font-semibold">{formatPercent(topCategory.share * 100)}</span> of spending.
                    A small trim here could free up{' '}
                    {formatCurrency(topCategory.value * 0.1)} a month.
                  </>
                ) : (
                  'Once you record a few expenses, SpendWell will surface a gentle, data-backed observation here.'
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
