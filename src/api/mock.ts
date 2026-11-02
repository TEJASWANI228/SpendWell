import type {
  AppNotification,
  AuthSession,
  Budget,
  BudgetInput,
  Dashboard,
  GoogleProfileInput,
  OnboardingInput,
  SpendWellApi,
  Transaction,
  TransactionFilters,
  TransactionInput,
  User,
} from '@/api/types';
import {
  computeAnalytics,
  currentMonthSpend,
  spentToday,
  sumByType,
  transactionsForMonth,
} from '@/lib/analytics';
import { monthKey } from '@/lib/dates';
import { getSession } from '@/api/session';
import {
  SEED_USER,
  seedBudget,
  seedNotifications,
  seedTransactions,
} from '@/data/seed';

interface Db {
  user: User;
  transactions: Transaction[];
  budget: Budget;
  notifications: AppNotification[];
}

interface Store {
  accounts: Record<string, Db>;
}

/**
 * Accounts are stored separately so a new Google/sign-up user does not inherit
 * the demo profile. The session's user id selects the active account.
 */
const STORE_KEY = 'spendwell.accounts.v1';
const LEGACY_DB_KEY = 'spendwell.db.v1';
const GOOGLE_DEMO_PROFILE: Required<Omit<GoogleProfileInput, 'googleId'>> & { googleId: string } = {
  googleId: 'demo-google-user',
  name: 'Google User',
  email: 'google.user@gmail.com',
  avatarUrl: null,
};

function normalizeUser(input: Partial<User> & Pick<User, 'id' | 'name' | 'email'>): User {
  const isSeedUser = input.id === SEED_USER.id;
  return {
    id: input.id,
    name: input.name,
    email: input.email,
    phone: input.phone ?? '',
    avatarUrl: input.avatarUrl ?? null,
    currency: input.currency ?? 'INR',
    monthlyIncome: input.monthlyIncome ?? (isSeedUser ? SEED_USER.monthlyIncome : 0),
    isStudent: input.isStudent ?? false,
    startingBalance: input.startingBalance ?? (isSeedUser ? SEED_USER.startingBalance : 0),
    profileCompleted: input.profileCompleted ?? true,
    provider: input.provider ?? 'email',
    joinedAt: input.joinedAt ?? new Date().toISOString(),
  };
}

function emptyBudget(): Budget {
  const month = monthKey();
  return {
    id: `budget-${month}`,
    month,
    amount: 0,
    categoryLimits: {},
    updatedAt: new Date().toISOString(),
  };
}

function normalizeDb(input: Partial<Db>): Db | null {
  if (!input.user) return null;
  const user = normalizeUser(input.user);
  return {
    user,
    transactions: Array.isArray(input.transactions) ? input.transactions : [],
    budget: input.budget ?? emptyBudget(),
    notifications: Array.isArray(input.notifications) ? input.notifications : [],
  };
}

function freshDb(): Db {
  return {
    user: SEED_USER,
    transactions: seedTransactions(),
    budget: seedBudget(),
    notifications: seedNotifications(),
  };
}

function emptyDb(user: User): Db {
  return {
    user,
    transactions: [],
    budget: emptyBudget(),
    notifications: [],
  };
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Store>;
      const accounts: Record<string, Db> = {};
      for (const [id, account] of Object.entries(parsed.accounts ?? {})) {
        const normalized = normalizeDb(account);
        if (normalized) accounts[id] = normalized;
      }
      if (Object.keys(accounts).length > 0) {
        const store = { accounts };
        ensureDemoAccount(store);
        return store;
      }
    }
  } catch {
    // Fall through to a fresh store.
  }

  const store = migrateLegacyDb() ?? { accounts: {} as Record<string, Db> };
  ensureDemoAccount(store);
  writeStore(store);
  return store;
}

function migrateLegacyDb(): Store | null {
  try {
    const raw = localStorage.getItem(LEGACY_DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Db>;
    const db = normalizeDb(parsed);
    if (!db) return null;
    return { accounts: { [db.user.id]: db } };
  } catch {
    return null;
  }
}

function ensureDemoAccount(store: Store): void {
  const hasDemoEmail = Object.values(store.accounts).some(
    (account) => account.user.email.toLowerCase() === SEED_USER.email.toLowerCase(),
  );
  if (!hasDemoEmail) {
    store.accounts[SEED_USER.id] = freshDb();
  }
}

function writeStore(store: Store): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function findAccountByEmail(store: Store, email: string): Db | undefined {
  const target = email.trim().toLowerCase();
  return Object.values(store.accounts).find(
    (account) => account.user.email.toLowerCase() === target,
  );
}

function saveAccount(store: Store, db: Db): void {
  store.accounts[db.user.id] = db;
  writeStore(store);
}

function readDb(): Db {
  const store = readStore();
  const session = getSession();
  const activeId = session?.user.id;
  if (activeId) {
    const active = store.accounts[activeId];
    if (active) return active;
    const created = emptyDb(normalizeUser(session.user));
    saveAccount(store, created);
    return created;
  }
  ensureDemoAccount(store);
  return store.accounts[SEED_USER.id] ?? freshDb();
}

function writeDb(db: Db): void {
  const store = readStore();
  saveAccount(store, db);
}

function delay(ms = 320): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function fail(message: string): never {
  throw new Error(message);
}

function sortNewestFirst(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function toSession(user: User): AuthSession {
  return {
    token: `mock-${user.id}-${Date.now()}`,
    user,
    isNewUser: !user.profileCompleted,
  };
}

function newUser(
  input: Pick<User, 'id' | 'name' | 'email'> &
    Partial<Pick<User, 'phone' | 'avatarUrl' | 'provider' | 'currency'>>,
): User {
  return normalizeUser({
    ...input,
    monthlyIncome: 0,
    isStudent: false,
    startingBalance: 0,
    profileCompleted: false,
    joinedAt: new Date().toISOString(),
  });
}

export const mockApi: SpendWellApi = {
  auth: {
    async login({ email, password }): Promise<AuthSession> {
      await delay(480);
      if (!email.includes('@')) fail('Enter a valid email address');
      if (password.length < 6) fail('Incorrect email or password');

      const store = readStore();
      const existing = findAccountByEmail(store, email);
      if (existing) {
        return toSession(existing.user);
      }

      // Any unknown email is treated as a new account. We intentionally keep the
      // demo credentials working while routing new users through profile setup.
      const user = newUser({
        id: `usr-${crypto.randomUUID()}`,
        name: email.split('@')[0] || 'Friend',
        email,
        provider: 'email',
      });
      const db = emptyDb(user);
      saveAccount(store, db);
      return toSession(user);
    },

    async signup({ name, email, password }): Promise<AuthSession> {
      await delay(560);
      if (password.length < 8) fail('Password must be at least 8 characters');

      const store = readStore();
      if (findAccountByEmail(store, email)) {
        fail('An account with this email already exists. Sign in instead.');
      }

      const user = newUser({
        id: `usr-${crypto.randomUUID()}`,
        name,
        email,
        provider: 'email',
      });
      const db = emptyDb(user);
      saveAccount(store, db);
      return toSession(user);
    },

    async logout(): Promise<void> {
      await delay(160);
    },

    // Mock Google OAuth. When a real Google profile is supplied (from Google
    // Identity Services) it is used as-is; otherwise we synthesise a stable demo
    // Google account. Returning Google users keep their account and skip setup.
    async googleSignIn(profile?: GoogleProfileInput): Promise<AuthSession> {
      await delay(700);
      const email = (profile?.email ?? GOOGLE_DEMO_PROFILE.email).trim().toLowerCase();
      const googleId = profile?.googleId ?? GOOGLE_DEMO_PROFILE.googleId;
      const displayName = profile?.name ?? GOOGLE_DEMO_PROFILE.name;
      const avatarUrl = profile?.avatarUrl ?? GOOGLE_DEMO_PROFILE.avatarUrl;
      const store = readStore();
      const existing = findAccountByEmail(store, email);

      if (existing) {
        if (existing.user.provider !== 'google') {
          existing.user = {
            ...existing.user,
            provider: 'google',
            avatarUrl: existing.user.avatarUrl ?? avatarUrl ?? null,
          };
          saveAccount(store, existing);
        }
        return toSession(existing.user);
      }

      const user = newUser({
        id: `usr-google-${googleId}`,
        name: displayName || email.split('@')[0] || 'Google User',
        email,
        avatarUrl: avatarUrl ?? null,
        provider: 'google',
      });
      const db = emptyDb(user);
      saveAccount(store, db);
      return toSession(user);
    },

    async requestOtp(email): Promise<{ sent: boolean }> {
      await delay(460);
      if (!email.includes('@')) fail('Enter a valid email address');
      return { sent: true };
    },

    async verifyOtp(_email, code): Promise<{ resetToken: string }> {
      await delay(420);
      if (!/^\d{6}$/.test(code)) fail('Enter the 6-digit code');
      return { resetToken: `reset-${Date.now()}` };
    },

    async resetPassword(_resetToken, password): Promise<{ success: boolean }> {
      await delay(520);
      if (password.length < 8) fail('Password must be at least 8 characters');
      return { success: true };
    },
  },

  async me(): Promise<User> {
    await delay(160);
    return readDb().user;
  },

  async updateProfile(input): Promise<User> {
    await delay(420);
    const db = readDb();
    db.user = { ...db.user, ...input };
    writeDb(db);
    return db.user;
  },

  async completeOnboarding(input: OnboardingInput): Promise<User> {
    await delay(560);
    const db = readDb();
    const startingBalance =
      input.isStudent &&
      typeof input.currentBalance === 'number' &&
      Number.isFinite(input.currentBalance)
        ? Math.max(0, input.currentBalance)
        : 0;
    db.user = {
      ...db.user,
      monthlyIncome: input.monthlyIncome,
      isStudent: input.isStudent,
      startingBalance,
      profileCompleted: true,
    };
    writeDb(db);
    return db.user;
  },

  transactions: {
    async list(filters?: TransactionFilters): Promise<Transaction[]> {
      await delay(240);
      let items = readDb().transactions;
      if (filters?.type) items = items.filter((item) => item.type === filters.type);
      if (filters?.categoryId) {
        items = items.filter((item) => item.categoryId === filters.categoryId);
      }
      if (filters?.query) {
        const query = filters.query.toLowerCase();
        items = items.filter(
          (item) =>
            item.note.toLowerCase().includes(query) ||
            item.categoryId.toLowerCase().includes(query),
        );
      }
      if (filters?.from) items = items.filter((item) => item.date >= filters.from!);
      if (filters?.to) items = items.filter((item) => item.date <= filters.to!);
      return sortNewestFirst(items);
    },

    async get(id): Promise<Transaction> {
      await delay(200);
      const item = readDb().transactions.find((transaction) => transaction.id === id);
      if (!item) fail('Transaction not found');
      return item;
    },

    async create(input: TransactionInput): Promise<Transaction> {
      await delay(480);
      const db = readDb();
      const transaction: Transaction = {
        ...input,
        id: `txn-${crypto.randomUUID()}`,
        createdAt: new Date().toISOString(),
      };
      db.transactions = [transaction, ...db.transactions];
      writeDb(db);
      return transaction;
    },

    async update(id, input): Promise<Transaction> {
      await delay(420);
      const db = readDb();
      const existing = db.transactions.find((transaction) => transaction.id === id);
      if (!existing) fail('Transaction not found');
      const updated: Transaction = { ...existing, ...input };
      db.transactions = db.transactions.map((transaction) =>
        transaction.id === id ? updated : transaction,
      );
      writeDb(db);
      return updated;
    },

    async remove(id): Promise<void> {
      await delay(360);
      const db = readDb();
      db.transactions = db.transactions.filter((transaction) => transaction.id !== id);
      writeDb(db);
    },
  },

  budgets: {
    async get(month): Promise<Budget> {
      await delay(220);
      const budget = readDb().budget;
      return budget.month === month ? budget : { ...budget, month };
    },

    async upsert(month, input: BudgetInput): Promise<Budget> {
      await delay(480);
      const db = readDb();
      const budget: Budget = {
        id: `budget-${month}`,
        month,
        amount: input.amount,
        categoryLimits: input.categoryLimits,
        updatedAt: new Date().toISOString(),
      };
      db.budget = budget;
      writeDb(db);
      return budget;
    },
  },

  notifications: {
    async list(): Promise<AppNotification[]> {
      await delay(220);
      return [...readDb().notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },

    async markRead(id): Promise<AppNotification> {
      await delay(120);
      const db = readDb();
      let updated: AppNotification | undefined;
      db.notifications = db.notifications.map((notification) => {
        if (notification.id !== id) return notification;
        updated = { ...notification, read: true };
        return updated;
      });
      writeDb(db);
      if (!updated) fail('Notification not found');
      return updated;
    },

    async markAllRead(): Promise<void> {
      await delay(180);
      const db = readDb();
      db.notifications = db.notifications.map((notification) => ({
        ...notification,
        read: true,
      }));
      writeDb(db);
    },
  },

  async analytics(month): Promise<ReturnType<typeof computeAnalytics>> {
    await delay(320);
    const db = readDb();
    return computeAnalytics(db.transactions, month, db.budget);
  },

  async dashboard(): Promise<Dashboard> {
    await delay(300);
    const db = readDb();
    const month = monthKey();
    const monthTransactions = transactionsForMonth(db.transactions, month);
    const monthExpense = sumByType(monthTransactions, 'expense');
    const balance =
      db.user.startingBalance +
      sumByType(db.transactions, 'income') -
      sumByType(db.transactions, 'expense');
    return {
      user: db.user,
      balance,
      monthIncome: sumByType(monthTransactions, 'income'),
      monthExpense,
      budget: db.budget,
      spentToday: spentToday(db.transactions),
      remainingBudget: db.budget.amount - currentMonthSpend(db.transactions),
      recent: sortNewestFirst(db.transactions).slice(0, 5),
      unreadNotifications: db.notifications.filter((notification) => !notification.read).length,
    };
  },
};
