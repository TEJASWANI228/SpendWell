import type {
  AppNotification,
  Budget,
  Transaction,
  TransactionType,
  User,
} from '@/api/types';

// Starting balance in INR minor units (paise) displayed as ₹ amount.
// 82,450 paise = ₹82,450 — a realistic mid-month savings balance.
export const STARTING_BALANCE = 82450;

function iso(daysAgo: number, hour = 12, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

interface SeedTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: Transaction['categoryId'];
  note: string;
  daysAgo: number;
  hour?: number;
  paymentMethod?: Transaction['paymentMethod'];
}

// All amounts are in INR (₹). Realistic for a salaried professional in India.
const SEED_TRANSACTIONS: SeedTransaction[] = [
  { id: 'txn-01', type: 'expense', amount: 120,    categoryId: 'food',          note: 'Morning chai & snacks',       daysAgo: 0,  hour: 8,  paymentMethod: 'card' },
  { id: 'txn-02', type: 'expense', amount: 280,    categoryId: 'transport',     note: 'Ola to office',               daysAgo: 0,  hour: 9,  paymentMethod: 'card' },
  { id: 'txn-03', type: 'expense', amount: 1850,   categoryId: 'groceries',     note: 'Weekly groceries – DMart',    daysAgo: 0,  hour: 18, paymentMethod: 'card' },
  { id: 'txn-04', type: 'income',  amount: 85000,  categoryId: 'other',         note: 'Monthly salary – Acme Studio',daysAgo: 1,  hour: 10, paymentMethod: 'bank' },
  { id: 'txn-05', type: 'expense', amount: 649,    categoryId: 'entertainment', note: 'Netflix subscription',        daysAgo: 1,  hour: 20, paymentMethod: 'card' },
  { id: 'txn-06', type: 'expense', amount: 380,    categoryId: 'health',        note: 'Apollo Pharmacy',             daysAgo: 1,  hour: 16, paymentMethod: 'cash' },
  { id: 'txn-07', type: 'expense', amount: 3499,   categoryId: 'shopping',      note: 'Running shoes – Decathlon',   daysAgo: 2,  hour: 15, paymentMethod: 'card' },
  { id: 'txn-08', type: 'expense', amount: 540,    categoryId: 'food',          note: 'Lunch with Priya',            daysAgo: 2,  hour: 13, paymentMethod: 'card' },
  { id: 'txn-09', type: 'expense', amount: 1940,   categoryId: 'bills',         note: 'Electricity bill – BESCOM',   daysAgo: 3,  hour: 11, paymentMethod: 'bank' },
  { id: 'txn-10', type: 'expense', amount: 680,    categoryId: 'entertainment', note: 'Movie tickets – PVR',         daysAgo: 3,  hour: 19, paymentMethod: 'card' },
  { id: 'txn-11', type: 'expense', amount: 1200,   categoryId: 'transport',     note: 'Petrol – HPCL',              daysAgo: 4,  hour: 17, paymentMethod: 'card' },
  { id: 'txn-12', type: 'expense', amount: 1999,   categoryId: 'education',     note: 'Coursera subscription',       daysAgo: 4,  hour: 21, paymentMethod: 'card' },
  { id: 'txn-13', type: 'expense', amount: 22000,  categoryId: 'bills',         note: 'Apartment rent',              daysAgo: 5,  hour: 9,  paymentMethod: 'bank' },
  { id: 'txn-14', type: 'income',  amount: 18000,  categoryId: 'other',         note: 'Freelance project payment',   daysAgo: 5,  hour: 14, paymentMethod: 'bank' },
  { id: 'txn-15', type: 'expense', amount: 1450,   categoryId: 'food',          note: 'Dinner out – Social',         daysAgo: 6,  hour: 20, paymentMethod: 'card' },
  { id: 'txn-16', type: 'expense', amount: 119,    categoryId: 'entertainment', note: 'Spotify Premium',             daysAgo: 6,  hour: 7,  paymentMethod: 'card' },
  { id: 'txn-17', type: 'expense', amount: 1500,   categoryId: 'health',        note: 'Cult.fit membership',         daysAgo: 7,  hour: 8,  paymentMethod: 'card' },
  { id: 'txn-18', type: 'expense', amount: 2200,   categoryId: 'shopping',      note: 'Amazon – home essentials',    daysAgo: 7,  hour: 16, paymentMethod: 'card' },
  { id: 'txn-19', type: 'expense', amount: 500,    categoryId: 'transport',     note: 'BMTC monthly pass',           daysAgo: 8,  hour: 9,  paymentMethod: 'card' },
  { id: 'txn-20', type: 'expense', amount: 899,    categoryId: 'education',     note: 'Design book – Flipkart',      daysAgo: 8,  hour: 18, paymentMethod: 'card' },
  { id: 'txn-21', type: 'expense', amount: 2750,   categoryId: 'groceries',     note: 'More supermarket',            daysAgo: 9,  hour: 17, paymentMethod: 'card' },
  { id: 'txn-22', type: 'expense', amount: 5800,   categoryId: 'travel',        note: 'Coorg weekend trip',          daysAgo: 10, hour: 12, paymentMethod: 'card' },
  { id: 'txn-23', type: 'expense', amount: 90,     categoryId: 'food',          note: 'Chai tapri',                  daysAgo: 11, hour: 8,  paymentMethod: 'cash' },
  { id: 'txn-24', type: 'expense', amount: 999,    categoryId: 'bills',         note: 'Jio broadband bill',          daysAgo: 12, hour: 10, paymentMethod: 'bank' },
  { id: 'txn-25', type: 'expense', amount: 3200,   categoryId: 'entertainment', note: 'Concert tickets – Lollapalooza',daysAgo: 13,hour: 19, paymentMethod: 'card' },
  { id: 'txn-26', type: 'expense', amount: 1620,   categoryId: 'groceries',     note: 'Farmer\'s market – organic',  daysAgo: 14, hour: 11, paymentMethod: 'cash' },
  { id: 'txn-27', type: 'expense', amount: 800,    categoryId: 'health',        note: 'Doctor consultation',         daysAgo: 15, hour: 15, paymentMethod: 'card' },
  { id: 'txn-28', type: 'expense', amount: 1199,   categoryId: 'shopping',      note: 'Amazon order',                daysAgo: 16, hour: 14, paymentMethod: 'card' },
  { id: 'txn-29', type: 'expense', amount: 480,    categoryId: 'food',          note: 'Lunch – Swiggy',              daysAgo: 17, hour: 13, paymentMethod: 'card' },
  { id: 'txn-30', type: 'expense', amount: 1350,   categoryId: 'transport',     note: 'Petrol – BPCL',               daysAgo: 18, hour: 8,  paymentMethod: 'card' },
  { id: 'txn-31', type: 'expense', amount: 7800,   categoryId: 'travel',        note: 'Flight to Hyderabad',         daysAgo: 19, hour: 6,  paymentMethod: 'card' },
  { id: 'txn-32', type: 'expense', amount: 699,    categoryId: 'bills',         note: 'Airtel mobile recharge',      daysAgo: 20, hour: 10, paymentMethod: 'bank' },
  { id: 'txn-33', type: 'expense', amount: 1980,   categoryId: 'groceries',     note: 'Weekly groceries – BigBasket',daysAgo: 21, hour: 18, paymentMethod: 'card' },
  { id: 'txn-34', type: 'expense', amount: 560,    categoryId: 'entertainment', note: 'Movie night – BookMyShow',    daysAgo: 22, hour: 20, paymentMethod: 'card' },
  { id: 'txn-35', type: 'expense', amount: 1650,   categoryId: 'food',          note: 'Dinner with friends – Toit',  daysAgo: 23, hour: 21, paymentMethod: 'card' },
  { id: 'txn-36', type: 'expense', amount: 499,    categoryId: 'education',     note: 'Stationery set',              daysAgo: 24, hour: 16, paymentMethod: 'cash' },
  { id: 'txn-37', type: 'expense', amount: 1500,   categoryId: 'health',        note: 'Cult.fit membership',         daysAgo: 25, hour: 8,  paymentMethod: 'card' },
  { id: 'txn-38', type: 'expense', amount: 3200,   categoryId: 'shopping',      note: 'Winter jacket – Myntra',      daysAgo: 26, hour: 15, paymentMethod: 'card' },
  { id: 'txn-39', type: 'expense', amount: 80,     categoryId: 'food',          note: 'Chai',                        daysAgo: 27, hour: 8,  paymentMethod: 'cash' },
  { id: 'txn-40', type: 'expense', amount: 500,    categoryId: 'transport',     note: 'BMTC monthly pass',           daysAgo: 28, hour: 7,  paymentMethod: 'card' },
  { id: 'txn-41', type: 'expense', amount: 2100,   categoryId: 'groceries',     note: 'Groceries – Reliance Fresh',  daysAgo: 29, hour: 18, paymentMethod: 'card' },
];

export function seedTransactions(): Transaction[] {
  return SEED_TRANSACTIONS.map((seed) => {
    const date = iso(seed.daysAgo, seed.hour ?? 12);
    return {
      id: seed.id,
      type: seed.type,
      amount: seed.amount,
      categoryId: seed.categoryId,
      note: seed.note,
      date,
      createdAt: date,
      paymentMethod: seed.paymentMethod ?? 'card',
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export const SEED_USER: User = {
  id: 'usr-1',
  name: 'Alex Morgan',
  email: 'alex@spendwell.app',
  phone: '+91 98765 43210',
  avatarUrl: null,
  currency: 'INR',
  monthlyIncome: 85000,
  isStudent: false,
  startingBalance: STARTING_BALANCE,
  profileCompleted: true,
  provider: 'email',
  joinedAt: iso(420),
};

export function seedBudget(): Budget {
  return {
    id: `budget-${currentMonthKey()}`,
    month: currentMonthKey(),
    // ₹60,000 total monthly budget for a Bangalore professional
    amount: 60000,
    categoryLimits: {
      food:          8000,
      groceries:     7000,
      shopping:      5000,
      transport:     4000,
      bills:        25000,
      entertainment: 4000,
      health:        3000,
      education:     2000,
      travel:        5000,
      other:         2000,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function seedNotifications(): AppNotification[] {
  return [
    {
      id: 'ntf-1',
      type: 'budget',
      title: 'You are 74% through your budget',
      body: 'You have ₹15,600 left for the rest of the month. Keep it up!',
      createdAt: iso(0, 9, 15),
      read: false,
    },
    {
      id: 'ntf-2',
      type: 'transaction',
      title: 'Grocery payment recorded',
      body: '₹1,850 at DMart was added to your transactions.',
      createdAt: iso(0, 8, 40),
      read: false,
    },
    {
      id: 'ntf-3',
      type: 'insight',
      title: 'Your food spend is down 12%',
      body: 'You spent ₹680 less on food than last month. Nice discipline!',
      createdAt: iso(1, 18, 5),
      read: false,
    },
    {
      id: 'ntf-4',
      type: 'budget',
      title: 'Entertainment budget nearly used',
      body: 'You have used 85% of your ₹4,000 entertainment allowance.',
      createdAt: iso(2, 12, 30),
      read: true,
    },
    {
      id: 'ntf-5',
      type: 'transaction',
      title: 'Salary received',
      body: '₹85,000 from Acme Studio landed in your account.',
      createdAt: iso(3, 10, 0),
      read: true,
    },
    {
      id: 'ntf-6',
      type: 'system',
      title: 'New: set category budgets',
      body: 'Give every category a monthly limit and let SpendWell keep watch.',
      createdAt: iso(6, 15, 0),
      read: true,
    },
  ];
}
