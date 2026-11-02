const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTHS = MONTHS.map((month) => month.slice(0, 3));

export function toDate(value: string): Date {
  return new Date(value);
}

export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  const index = Number(month) - 1;
  return `${MONTHS[index] ?? ''} ${year ?? ''}`.trim();
}

export function shortMonthLabel(key: string): string {
  const [, month] = key.split('-');
  return SHORT_MONTHS[Number(month) - 1] ?? key;
}

export function formatDate(value: string, style: 'short' | 'long' = 'short'): string {
  const date = toDate(value);
  if (style === 'long') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(value: string): string {
  return toDate(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatInputDate(value: string): string {
  const date = toDate(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function dateKey(value: string): string {
  const date = toDate(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function relativeDayLabel(value: string): string {
  const date = toDate(value);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((start.getTime() - target.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function relativeTime(value: string): string {
  const diffMs = Date.now() - toDate(value).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

export function daysInMonth(key: string): number {
  const [year, month] = key.split('-').map(Number);
  return new Date(year ?? 2026, month ?? 1, 0).getDate();
}

export function shiftMonth(key: string, amount: number): string {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year ?? 2026, (month ?? 1) - 1 + amount, 1);
  return monthKey(date);
}
