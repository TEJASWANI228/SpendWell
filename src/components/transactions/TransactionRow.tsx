import { Link } from 'react-router-dom';
import { ArrowDownLeft } from 'lucide-react';
import type { Transaction } from '@/api/types';
import { categoryFor } from '@/data/categories';
import { cn } from '@/lib/cn';
import { formatSignedCurrency } from '@/lib/format';
import { formatTime } from '@/lib/dates';
import { CategoryIcon } from '@/components/transactions/CategoryIcon';

export interface TransactionRowProps {
  transaction: Transaction;
  currency?: string;
  showTime?: boolean;
  className?: string;
  interactive?: boolean;
}

export function TransactionRow({
  transaction,
  currency = 'USD',
  showTime = true,
  className,
  interactive = true,
}: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const category = categoryFor(transaction.categoryId);
  const content = (
    <>
      {isIncome ? (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e6f7f1] text-success">
          <ArrowDownLeft className="h-5 w-5" strokeWidth={2.2} aria-hidden />
        </span>
      ) : (
        <CategoryIcon categoryId={transaction.categoryId} />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-psm font-medium text-ink-900">{transaction.note}</p>
        <p className="mt-0.5 truncate text-caption text-ink-400">
          {isIncome ? 'Income' : category.name}
          {showTime ? ` · ${formatTime(transaction.date)}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            'text-psm font-semibold tabular-nums',
            isIncome ? 'text-success' : 'text-ink-900',
          )}
        >
          {formatSignedCurrency(transaction.amount, transaction.type, currency)}
        </p>
        <p className="mt-0.5 text-caption text-ink-400">
          {transaction.paymentMethod === 'cash'
            ? 'Cash'
            : transaction.paymentMethod === 'bank'
              ? 'Bank'
              : 'Card'}
        </p>
      </div>
    </>
  );

  if (!interactive) {
    return <div className={cn('flex items-center gap-3 py-2.5', className)}>{content}</div>;
  }

  return (
    <Link
      to={`/app/transactions/${transaction.id}/edit`}
      className={cn(
        'flex items-center gap-3 rounded-[10px] py-2.5 transition-colors hover:bg-grey-50 focus-visible:bg-grey-50',
        className,
      )}
    >
      {content}
      <span className="sr-only">Edit transaction</span>
    </Link>
  );
}
