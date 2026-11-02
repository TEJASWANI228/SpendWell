import type { Transaction } from '@/api/types';
import { categoryFor } from '@/data/categories';
import { dateKey } from '@/lib/dates';

/**
 * Escapes a cell value for RFC 4180 compliant CSV output.
 * Also neutralizes spreadsheet formula injection risks (=, +, -, @).
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();

  // Neutralize formula injection in Excel / Google Sheets
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Quote if it contains commas, double quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Formats a transaction payment method nicely for export.
 */
function formatPaymentMethod(method: string): string {
  switch (method) {
    case 'card':
      return 'Card';
    case 'cash':
      return 'Cash';
    case 'bank':
      return 'Bank Transfer';
    default:
      return method;
  }
}

/**
 * Converts a list of transactions into a CSV formatted string.
 */
export function generateCsv(transactions: Transaction[]): string {
  const headers = [
    'Date',
    'Type',
    'Category',
    'Amount',
    'Payment Method',
    'Note',
    'Transaction ID',
  ];

  const rows = transactions.map((t) => [
    escapeCsvCell(t.date.slice(0, 10)),
    escapeCsvCell(t.type === 'expense' ? 'Expense' : 'Income'),
    escapeCsvCell(categoryFor(t.categoryId)?.name ?? t.categoryId),
    escapeCsvCell(t.amount.toFixed(2)),
    escapeCsvCell(formatPaymentMethod(t.paymentMethod)),
    escapeCsvCell(t.note || '-'),
    escapeCsvCell(t.id),
  ]);

  // Combine headers and rows with CRLF
  const csvBody = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  // Include UTF-8 BOM (\uFEFF) so Excel/Numbers automatically parses UTF-8 correctly
  return `\uFEFF${csvBody}`;
}

/**
 * Initiates a browser download of transactions as a CSV file.
 */
export function downloadTransactionsCsv(
  transactions: Transaction[],
  fileName?: string,
): void {
  const csvData = generateCsv(transactions);
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const defaultName = `spendwell-transactions-${dateKey(new Date().toISOString())}.csv`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName || defaultName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release object URL
  window.setTimeout(() => URL.revokeObjectURL(url), 100);
}
