import type { Analytics, Budget, CategoryId, CategorySpend, MonthlyPoint, Transaction } from '@/api/types';
import { monthKey, shortMonthLabel, shiftMonth } from '@/lib/dates';

const BASE_INCOME = [5200, 4850, 5100, 4850, 5200, 4850];
const BASE_EXPENSE = [3800, 4100, 3600, 4300, 3950, 3420];

function monthOf(value: string): string {
  return value.slice(0, 7);
}

export function transactionsForMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((transaction) => monthOf(transaction.date) === month);
}

export function sumByType(transactions: Transaction[], type: Transaction['type']): number {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function categoryBreakdown(transactions: Transaction[]): CategorySpend[] {
  const totals = new Map<CategoryId, number>();
  for (const transaction of transactions) {
    if (transaction.type !== 'expense') continue;
    totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amount);
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return [...totals.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      amount,
      share: total === 0 ? 0 : amount / total,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function spentToday(transactions: Transaction[]): number {
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;
  return transactions
    .filter((transaction) => transaction.type === 'expense' && transaction.date.slice(0, 10) === key)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function buildMonthlySeries(transactions: Transaction[], month: string): MonthlyPoint[] {
  const points: MonthlyPoint[] = [];
  for (let index = 5; index >= 0; index -= 1) {
    const key = shiftMonth(month, -index);
    const monthTransactions = transactionsForMonth(transactions, key);
    const isCurrent = index === 0;
    const position = 5 - index;
    const income = isCurrent
      ? sumByType(monthTransactions, 'income')
      : BASE_INCOME[position] ?? 4850;
    const expense = isCurrent
      ? sumByType(monthTransactions, 'expense')
      : BASE_EXPENSE[position] ?? 3800;
    points.push({ month: key, label: shortMonthLabel(key), income, expense });
  }
  return points;
}

export function computeAnalytics(
  transactions: Transaction[],
  month: string,
  _budget?: Budget,
): Analytics {
  const monthTransactions = transactionsForMonth(transactions, month);
  const income = sumByType(monthTransactions, 'income');
  const expense = sumByType(monthTransactions, 'expense');
  return {
    month,
    income,
    expense,
    savings: income - expense,
    byCategory: categoryBreakdown(monthTransactions),
    monthly: buildMonthlySeries(transactions, month),
  };
}

export function currentMonthSpend(transactions: Transaction[]): number {
  return sumByType(transactionsForMonth(transactions, monthKey()), 'expense');
}
