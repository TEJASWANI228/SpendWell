import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  ChartPie,
  Eye,
  EyeOff,
  Lightbulb,
  Plus,
  ReceiptText,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useDashboard } from '@/api/queries';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RingProgress } from '@/components/ui/RingProgress';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { firstName, formatCurrency, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Home() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const [hidden, setHidden] = useState(false);

  const budgetPercent = useMemo(() => {
    if (!data || data.budget.amount <= 0) return 0;
    return Math.min(100, ((data.budget.amount - data.remainingBudget) / data.budget.amount) * 100);
  }, [data]);

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffebeb] text-danger">
          <RefreshCw className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-pmd font-semibold text-ink-900">We couldn’t load your dashboard</h1>
        <p className="mt-1.5 text-psm text-ink-500">Check your connection and try again.</p>
        <Button className="mt-5" onClick={() => void refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Try again
        </Button>
      </div>
    );
  }

  const currency = data.user.currency;
  const spent = data.budget.amount - data.remainingBudget;
  const percentLabel = formatPercent(budgetPercent);
  const budgetTone = budgetPercent >= 100 ? 'danger' : budgetPercent >= 80 ? 'warning' : 'brand';
  const remainingLabel = data.remainingBudget >= 0 ? 'remaining' : 'over budget';

  return (
    <div className="px-5 pb-6 pt-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption text-ink-400">{greeting()},</p>
          <h1 className="truncate text-h6 text-ink-900">{firstName(data.user.name)}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            to="/app/notifications"
            aria-label={`Notifications${data.unreadNotifications > 0 ? `, ${data.unreadNotifications} unread` : ''}`}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition hover:bg-grey-100"
          >
            <Bell className="h-[21px] w-[21px]" aria-hidden />
            {data.unreadNotifications > 0 ? (
              <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-700 ring-2 ring-white" />
              </span>
            ) : null}
          </Link>
          <Link
            to="/app/profile"
            aria-label="Open profile"
            className="rounded-full transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
          >
            <Avatar name={data.user.name} src={data.user.avatarUrl} size="md" />
          </Link>
        </div>
      </header>

      <section
        aria-label="Total balance"
        className="relative mt-5 overflow-hidden rounded-[22px] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-5 text-white shadow-float"
      >
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-psm text-white/70">Total balance</p>
            <button
              type="button"
              onClick={() => setHidden((current) => !current)}
              aria-label={hidden ? 'Show balance' : 'Hide balance'}
              aria-pressed={hidden}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20"
            >
              {hidden ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          <p className="mt-1 text-[32px] font-semibold tracking-[-0.03em] tabular-nums">
            {hidden ? '••••••' : formatCurrency(data.balance, currency)}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/15 pt-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <ArrowDownLeft className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-[11px] text-white/60">Income</p>
                <p className="text-psm font-semibold tabular-nums">
                  {hidden ? '••••' : formatCurrency(data.monthIncome, currency)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-[11px] text-white/60">Expenses</p>
                <p className="text-psm font-semibold tabular-nums">
                  {hidden ? '••••' : formatCurrency(data.monthExpense, currency)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Quick actions" className="mt-4">
        <div className="grid grid-cols-4 gap-2 rounded-card bg-white p-2.5 shadow-card">
          {[
            { label: 'Add', to: '/app/transactions/new', icon: Plus, tint: 'bg-brand-50 text-brand-700' },
            { label: 'Budget', to: '/app/budget', icon: Wallet, tint: 'bg-[#eaf2ff] text-[#4c9aff]' },
            { label: 'Insights', to: '/app/analytics', icon: ChartPie, tint: 'bg-[#e6f7f1] text-success' },
            { label: 'Alerts', to: '/app/notifications', icon: Bell, tint: 'bg-[#fff4e5] text-warning' },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-[10px] px-1 py-1.5 transition hover:bg-grey-50 focus-visible:bg-grey-50"
            >
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', action.tint)}>
                <action.icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="text-[11px] font-medium text-ink-600">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Monthly budget" className="mt-4">
        <Card padding="md" className="shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-psm font-semibold text-ink-900">Monthly budget</h2>
              <p className="text-caption text-ink-400">
                {formatCurrency(spent, currency)} of {formatCurrency(data.budget.amount, currency)} used
              </p>
            </div>
            <Link
              to="/app/budget"
              className="flex min-h-[44px] items-center gap-0.5 rounded-full px-2 text-caption font-semibold text-brand-700 hover:underline"
            >
              Manage
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <div className="mt-3 flex items-center gap-4">
            <RingProgress
              value={budgetPercent}
              size={92}
              stroke={9}
              tone={budgetTone}
              label="Budget used"
            >
              <span className="text-pmd font-semibold text-ink-900">{percentLabel}</span>
              <span className="text-[9px] uppercase tracking-wide text-ink-400">used</span>
            </RingProgress>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-caption text-ink-400">Today</p>
                <p className="text-caption font-medium text-ink-700">
                  {formatCurrency(data.spentToday, currency)}
                </p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-grey-100">
                <div
                  className="h-full rounded-pill bg-brand-400"
                  style={{ width: `${Math.min(100, (data.spentToday / Math.max(1, data.budget.amount / 30)) * 100)}%` }}
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <p className="text-caption text-ink-400">Monthly</p>
                <Badge tone={budgetTone === 'danger' ? 'danger' : budgetTone === 'warning' ? 'warning' : 'success'} dot>
                  {budgetPercent >= 100 ? 'Over limit' : budgetPercent >= 80 ? 'Watch it' : 'On track'}
                </Badge>
              </div>
              <p className="mt-1 text-caption text-ink-500">
                <span className={cn('font-semibold', data.remainingBudget < 0 ? 'text-danger' : 'text-ink-900')}>
                  {formatCurrency(Math.abs(data.remainingBudget), currency)}
                </span>{' '}
                {remainingLabel}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section aria-label="Recent activity" className="mt-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-psm font-semibold text-ink-900">Recent activity</h2>
          <Link
            to="/app/transactions"
            className="flex min-h-[44px] items-center gap-0.5 rounded-full px-2 text-caption font-semibold text-brand-700 hover:underline"
          >
            See all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="h-7 w-7" aria-hidden />}
            title="No transactions yet"
            description="Add your first expense or income and it will show up here."
            action={
              <Link
                to="/app/transactions/new"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-brand-700 px-4 text-psm font-medium text-white shadow-brand transition hover:bg-brand-600"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add transaction
              </Link>
            }
            className="mt-2 rounded-card border border-dashed border-grey-200 py-8"
          />
        ) : (
          <div className="divide-y divide-grey-100">
            {data.recent.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} currency={currency} />
            ))}
          </div>
        )}
      </section>

      <section aria-label="Daily insight" className="mt-4">
        <div className="flex items-start gap-3 rounded-card bg-brand-50 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-700">
            <Lightbulb className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-caption font-semibold uppercase tracking-wide text-brand-700">Daily insight</p>
            <p className="mt-1 text-psm leading-relaxed text-ink-700">
              You’ve spent {formatCurrency(data.spentToday, currency)} today. Cooking at home could keep
              your food budget on track.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
