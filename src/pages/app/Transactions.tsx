import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Plus, ReceiptText, Search, X } from 'lucide-react';
import { useTransactions } from '@/api/queries';
import type { Transaction, TransactionType } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { CATEGORIES } from '@/data/categories';
import { dateKey, relativeDayLabel } from '@/lib/dates';
import { downloadTransactionsCsv } from '@/lib/exportCsv';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

type Filter = 'all' | TransactionType;

interface Group {
  key: string;
  label: string;
  items: Transaction[];
  expense: number;
  income: number;
}

export function Transactions() {
  const { data, isLoading, isError, refetch } = useTransactions();
  const { showToast } = useToast();
  const [type, setType] = useState<Filter>('all');
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');

  const transactions = data ?? [];

  const counts = useMemo(
    () => ({
      all: transactions.length,
      income: transactions.filter((item) => item.type === 'income').length,
      expense: transactions.filter((item) => item.type === 'expense').length,
    }),
    [transactions],
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      if (type !== 'all' && transaction.type !== type) return false;
      if (category !== 'all' && transaction.categoryId !== category) return false;
      if (search && !transaction.note.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [transactions, type, category, query]);

  function handleExportCsv() {
    if (filtered.length === 0) {
      showToast({
        title: 'No transactions to export',
        description: 'There are no transactions matching your current filters.',
        tone: 'info',
      });
      return;
    }

    const isFiltered = filtered.length !== transactions.length;
    const filename = isFiltered
      ? `spendwell-filtered-${dateKey(new Date().toISOString())}.csv`
      : `spendwell-transactions-${dateKey(new Date().toISOString())}.csv`;

    downloadTransactionsCsv(filtered, filename);
    showToast({
      title: 'CSV Exported',
      description: `Exported ${filtered.length} transaction${filtered.length === 1 ? '' : 's'} successfully.`,
      tone: 'success',
    });
  }

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const transaction of filtered) {
      const key = dateKey(transaction.date);
      const existing = map.get(key);
      const group =
        existing ??
        ({
          key,
          label: relativeDayLabel(transaction.date),
          items: [],
          expense: 0,
          income: 0,
        } satisfies Group);
      group.items.push(transaction);
      if (transaction.type === 'expense') group.expense += transaction.amount;
      else group.income += transaction.amount;
      map.set(key, group);
    }
    return [...map.values()];
  }, [filtered]);

  const summary = useMemo(
    () => ({
      income: filtered.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0),
      expense: filtered.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
    }),
    [filtered],
  );

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-30 border-b border-grey-100 bg-white/95 px-5 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h6 text-ink-900">Transactions</h1>
            <p className="text-caption text-ink-400">
              {counts.all} {counts.all === 1 ? 'record' : 'records'} this period
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              aria-label="Export transactions as CSV"
              title="Export CSV"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-grey-200 bg-white text-ink-700 shadow-sm transition hover:bg-grey-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-5 w-5" aria-hidden />
            </button>
            <Link
              to="/app/transactions/new"
              aria-label="Add transaction"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-white shadow-brand transition hover:bg-brand-600"
            >
              <Plus className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes and categories"
            aria-label="Search transactions"
            className="min-h-[48px] w-full rounded-[12px] border border-grey-200 bg-grey-100 pl-11 pr-11 text-psm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-700 focus:bg-white focus:ring-2 focus:ring-brand-700/15"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 hover:bg-white"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="mt-3">
          <SegmentedControl
            label="Filter by transaction type"
            value={type}
            onChange={(value) => setType(value as Filter)}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'expense', label: 'Expenses', count: counts.expense },
              { value: 'income', label: 'Income', count: counts.income },
            ]}
          />
        </div>

        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          <button
            type="button"
            onClick={() => setCategory('all')}
            aria-pressed={category === 'all'}
            className={cn(
              'min-h-[38px] shrink-0 rounded-pill border px-3.5 text-caption font-medium transition',
              category === 'all'
                ? 'border-brand-700 bg-brand-700 text-white'
                : 'border-grey-200 bg-white text-ink-600 hover:border-brand-300',
            )}
          >
            All categories
          </button>
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              aria-pressed={category === item.id}
              className={cn(
                'flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-pill border px-3 text-caption font-medium transition',
                category === item.id
                  ? 'border-brand-700 bg-brand-50 text-brand-700'
                  : 'border-grey-200 bg-white text-ink-600 hover:border-brand-300',
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
              {item.name}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? <ListSkeleton rows={8} /> : null}

      {isError ? (
        <div className="px-5 py-10 text-center">
          <p className="text-psm font-medium text-ink-900">Couldn’t load transactions</p>
          <Button className="mt-3" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <>
          <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-card bg-[#e6f7f1] p-3.5">
              <p className="text-caption text-ink-500">Income</p>
              <p className="mt-0.5 text-pmd font-semibold tabular-nums text-success">
                {formatCurrency(summary.income)}
              </p>
            </div>
            <div className="rounded-card bg-[#fff0f0] p-3.5">
              <p className="text-caption text-ink-500">Expenses</p>
              <p className="mt-0.5 text-pmd font-semibold tabular-nums text-danger">
                {formatCurrency(summary.expense)}
              </p>
            </div>
          </div>

          {groups.length === 0 ? (
            <EmptyState
              icon={<ReceiptText className="h-7 w-7" aria-hidden />}
              title="No transactions found"
              description="Try a different search or filter, or add your first transaction."
              action={
                <Link
                  to="/app/transactions/new"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-[12px] bg-brand-700 px-5 text-pmd font-medium text-white shadow-brand transition hover:bg-brand-600"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add transaction
                </Link>
              }
            />
          ) : (
            <div className="mt-4 px-5">
              {groups.map((group) => (
                <section key={group.key} aria-label={group.label} className="mb-4">
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-caption font-semibold uppercase tracking-wide text-ink-400">
                      {group.label}
                    </h2>
                    <div className="flex items-center gap-2">
                      {group.income > 0 ? (
                        <Badge tone="success">+{formatCurrency(group.income)}</Badge>
                      ) : null}
                      {group.expense > 0 ? (
                        <span className="text-caption font-medium tabular-nums text-ink-500">
                          −{formatCurrency(group.expense)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="divide-y divide-grey-100 rounded-card bg-white">
                    {group.items.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
