export type TransactionType = 'income' | 'expense';

export type CategoryId =
  | 'food'
  | 'groceries'
  | 'shopping'
  | 'transport'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'travel'
  | 'other';

export type PaymentMethod = 'card' | 'cash' | 'bank';

export type AuthProvider = 'email' | 'google';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  color: string;
  tint: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  currency: string;
  monthlyIncome: number;
  /** True when the user told us they are a student during profile setup. */
  isStudent: boolean;
  /** Balance the user had when they joined. Income and expenses move it from here. */
  startingBalance: number;
  /** False until a new user answers the income/student/balance questions. */
  profileCompleted: boolean;
  provider: AuthProvider;
  joinedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: CategoryId;
  note: string;
  date: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
}

export type TransactionInput = Omit<Transaction, 'id' | 'createdAt'>;

export interface Budget {
  id: string;
  month: string;
  amount: number;
  categoryLimits: Partial<Record<CategoryId, number>>;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  type: 'budget' | 'transaction' | 'insight' | 'system';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface CategorySpend {
  categoryId: CategoryId;
  amount: number;
  share: number;
}

export interface MonthlyPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export interface Analytics {
  month: string;
  income: number;
  expense: number;
  savings: number;
  byCategory: CategorySpend[];
  monthly: MonthlyPoint[];
}

export interface Dashboard {
  user: User;
  balance: number;
  monthIncome: number;
  monthExpense: number;
  budget: Budget;
  spentToday: number;
  remainingBudget: number;
  recent: Transaction[];
  unreadNotifications: number;
}

export interface AuthSession {
  token: string;
  user: User;
  /** True when the account was just created and still needs profile setup. */
  isNewUser?: boolean;
}

/** Profile returned by Google Identity Services after a successful sign-in. */
export interface GoogleProfileInput {
  googleId?: string;
  name?: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface OnboardingInput {
  monthlyIncome: number;
  isStudent: boolean;
  /** Only collected when the user is a student. */
  currentBalance?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: CategoryId;
  query?: string;
  from?: string;
  to?: string;
}

export interface BudgetInput {
  amount: number;
  categoryLimits: Partial<Record<CategoryId, number>>;
}

export interface SpendWellApi {
  auth: {
    login(input: LoginInput): Promise<AuthSession>;
    signup(input: SignUpInput): Promise<AuthSession>;
    googleSignIn(profile?: GoogleProfileInput): Promise<AuthSession>;
    logout(): Promise<void>;
    requestOtp(email: string): Promise<{ sent: boolean }>;
    verifyOtp(email: string, code: string): Promise<{ resetToken: string }>;
    resetPassword(resetToken: string, password: string): Promise<{ success: boolean }>;
  };
  me(): Promise<User>;
  updateProfile(input: Partial<User>): Promise<User>;
  completeOnboarding(input: OnboardingInput): Promise<User>;
  transactions: {
    list(filters?: TransactionFilters): Promise<Transaction[]>;
    get(id: string): Promise<Transaction>;
    create(input: TransactionInput): Promise<Transaction>;
    update(id: string, input: Partial<TransactionInput>): Promise<Transaction>;
    remove(id: string): Promise<void>;
  };
  budgets: {
    get(month: string): Promise<Budget>;
    upsert(month: string, input: BudgetInput): Promise<Budget>;
  };
  notifications: {
    list(): Promise<AppNotification[]>;
    markRead(id: string): Promise<AppNotification>;
    markAllRead(): Promise<void>;
  };
  analytics(month: string): Promise<Analytics>;
  dashboard(): Promise<Dashboard>;
}
