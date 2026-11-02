/** Locale used for number/currency formatting. en-IN gives ₹ symbol and lakh/crore grouping. */
const LOCALE = 'en-IN';

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, maximumFractionDigits: number): Intl.NumberFormat {
  const key = `${currency}:${maximumFractionDigits}`;
  const cached = currencyFormatters.get(key);
  if (cached) return cached;
  const next = new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
    maximumFractionDigits,
  });
  currencyFormatters.set(key, next);
  return next;
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return formatter(currency, 2).format(amount);
}

export function formatCurrencyCompact(amount: number, currency = 'INR'): string {
  if (Math.abs(amount) >= 10000) {
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return formatter(currency, 0).format(amount);
}

export function formatSignedCurrency(
  amount: number,
  type: 'income' | 'expense',
  currency = 'INR',
): string {
  const sign = type === 'income' ? '+' : '−';
  return `${sign}${formatCurrency(Math.abs(amount), currency)}`;
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${Math.round(value * 10 ** fractionDigits) / 10 ** fractionDigits}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function firstName(name: string): string {
  return name.split(' ')[0] ?? name;
}
