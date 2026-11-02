import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Landmark,
  LogOut,
  Pencil,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useDashboard, useNotifications } from '@/api/queries';
import { api } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { downloadTransactionsCsv } from '@/lib/exportCsv';
import { formatCurrency } from '@/lib/format';

const currencies = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
];

export function Profile() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const { data, isLoading } = useDashboard();
  const { data: notifications } = useNotifications();
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [appLock, setAppLock] = useState(false);
  const [currency, setCurrency] = useState(data?.user.currency ?? 'USD');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const unread = notifications?.filter((item) => !item.read).length ?? 0;

  async function handleExportData() {
    setIsExporting(true);
    try {
      const list = await api.transactions.list();
      if (!list || list.length === 0) {
        showToast({
          title: 'No transactions found',
          description: 'You have no transactions to export yet.',
          tone: 'info',
        });
        return;
      }
      downloadTransactionsCsv(list);
      showToast({
        title: 'Export complete',
        description: `Downloaded ${list.length} transaction${list.length === 1 ? '' : 's'} as CSV.`,
        tone: 'success',
      });
    } catch {
      showToast({
        title: 'Export failed',
        description: 'Could not export your data. Please try again.',
        tone: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
      showToast({ title: 'Signed out', description: 'See you soon.', tone: 'info' });
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-[100dvh]">
        <PageHeader title="Profile" showBack={false} />
        <div className="space-y-4 px-5 pt-4" role="status" aria-label="Loading profile">
          <Skeleton className="h-[150px] rounded-[20px]" />
          <Skeleton className="h-[88px] rounded-card" />
          <Skeleton className="h-[300px] rounded-card" />
        </div>
      </div>
    );
  }

  const { user } = data;
  const saved = data.monthIncome - data.monthExpense;

  return (
    <div className="min-h-[100dvh] pb-6">
      <PageHeader
        title="Profile"
        showBack={false}
        right={
          <Link
            to="/app/profile/edit"
            className="flex min-h-[44px] items-center gap-1.5 rounded-full px-2.5 text-caption font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </Link>
        }
      />

      <div className="px-5 pt-4">
        <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-5 text-white shadow-float">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <Avatar name={user.name} src={user.avatarUrl} size="lg" ring />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-h6 text-white">{user.name}</h1>
              <p className="truncate text-caption text-white/70">{user.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-pill bg-white/15 px-2.5 py-1 text-[10px] font-medium">
                <Sparkles className="h-3 w-3" aria-hidden />
                Member since {new Date(user.joinedAt).getFullYear()}
              </span>
            </div>
          </div>
        </section>

        <div className="mx-2 -mt-5 grid grid-cols-3 divide-x divide-grey-100 rounded-card bg-white p-3 shadow-card">
          <div className="px-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-ink-400">Balance</p>
            <p className="mt-0.5 truncate text-psm font-semibold tabular-nums text-ink-900">
              {formatCurrency(data.balance, currency)}
            </p>
          </div>
          <div className="px-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-ink-400">Spent</p>
            <p className="mt-0.5 truncate text-psm font-semibold tabular-nums text-ink-900">
              {formatCurrency(data.monthExpense, currency)}
            </p>
          </div>
          <div className="px-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-ink-400">Saved</p>
            <p className="mt-0.5 truncate text-psm font-semibold tabular-nums text-success">
              {formatCurrency(saved, currency)}
            </p>
          </div>
        </div>

        <section className="mt-5" aria-label="Account">
          <h2 className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-400">Account</h2>
          <Card padding="none" className="divide-y divide-grey-100 overflow-hidden shadow-card">
            <MenuLink to="/app/profile/edit" icon={UserRound} label="Personal details" description="Name, email and phone" />
            <MenuLink
              to="/app/notifications"
              icon={Bell}
              label="Notifications"
              description="Budget alerts and insights"
              trailing={unread > 0 ? <Badge tone="brand">{unread}</Badge> : undefined}
            />
            <MenuButton
              icon={ShieldCheck}
              label="Security & privacy"
              description="Password and app lock"
              onClick={() => showToast({ title: 'Security settings', description: 'Password management is coming soon.', tone: 'info' })}
            />
            <MenuButton
              icon={CreditCard}
              label="Payment methods"
              description="Cards and bank accounts"
              onClick={() => showToast({ title: 'Payment methods', description: 'No cards linked in this demo.', tone: 'info' })}
            />
          </Card>
        </section>

        <section className="mt-5" aria-label="Preferences">
          <h2 className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-400">Preferences</h2>
          <Card padding="none" className="divide-y divide-grey-100 overflow-hidden shadow-card">
            <div className="px-4 py-3">
              <Switch
                checked={weeklySummary}
                onChange={setWeeklySummary}
                label="Weekly summary"
                description="A gentle recap every Sunday"
              />
            </div>
            <div className="px-4 py-3">
              <Switch
                checked={budgetAlerts}
                onChange={setBudgetAlerts}
                label="Budget alerts"
                description="Nudge me at 80% and 100%"
              />
            </div>
            <div className="px-4 py-3">
              <Switch
                checked={appLock}
                onChange={setAppLock}
                label="App lock"
                description="Require Face ID to open SpendWell"
              />
            </div>
            <button
              type="button"
              onClick={() => setCurrencyOpen(true)}
              className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-grey-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Landmark className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-psm font-medium text-ink-900">Currency</span>
                <span className="block text-caption text-ink-400">
                  {currencies.find((item) => item.code === currency)?.label ?? 'US Dollar'}
                </span>
              </span>
              <span className="flex items-center gap-1 text-caption font-semibold text-ink-500">
                {currency}
                <ChevronRight className="h-4 w-4 text-ink-400" aria-hidden />
              </span>
            </button>
          </Card>
        </section>

        <section className="mt-5" aria-label="Support">
          <h2 className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-400">Support</h2>
          <Card padding="none" className="divide-y divide-grey-100 overflow-hidden shadow-card">
            <MenuButton
              icon={HelpCircle}
              label="Help center"
              description="FAQs and contact support"
              onClick={() => showToast({ title: 'Help center', description: 'support@spendwell.app', tone: 'info' })}
            />
            <MenuButton
              icon={Wallet}
              label={isExporting ? 'Exporting data...' : 'Export my data'}
              description="Download all transactions as CSV"
              onClick={() => void handleExportData()}
            />
          </Card>
        </section>

        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[12px] border border-grey-200 bg-white text-psm font-semibold text-danger transition hover:border-danger/30 hover:bg-[#fff7f7]"
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden />
          Log out
        </button>

        <p className="mt-5 text-center text-[10px] text-ink-400">SpendWell v1.0.0 · Made for calmer money</p>
      </div>

      <Modal
        open={currencyOpen}
        onClose={() => setCurrencyOpen(false)}
        title="Display currency"
        description="Choose how amounts are shown across SpendWell."
        size="sm"
      >
        <div className="space-y-1">
          {currencies.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setCurrency(item.code);
                setCurrencyOpen(false);
                showToast({ title: `Currency set to ${item.code}`, description: 'Applies to new amounts in this demo.', tone: 'success' });
              }}
              className="flex min-h-[48px] w-full items-center gap-3 rounded-[10px] px-3 text-left transition hover:bg-grey-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-grey-100 text-psm font-semibold text-ink-700">
                {item.symbol}
              </span>
              <span className="flex-1">
                <span className="block text-psm font-medium text-ink-900">{item.label}</span>
                <span className="block text-caption text-ink-400">{item.code}</span>
              </span>
              {currency === item.code ? <Badge tone="brand">Selected</Badge> : null}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Log out of SpendWell?"
        description="Your data stays safely on this device."
        size="sm"
        footer={
          <>
            <Button variant="outline" fullWidth onClick={() => setLogoutOpen(false)}>
              Stay
            </Button>
            <Button variant="danger" fullWidth loading={loggingOut} onClick={() => void handleLogout()}>
              Log out
            </Button>
          </>
        }
      >
        <p className="text-psm text-ink-500">You can sign back in anytime with your email and password.</p>
      </Modal>
    </div>
  );
}

interface MenuLinkProps {
  to: string;
  icon: typeof UserRound;
  label: string;
  description: string;
  trailing?: ReactNode;
}

function MenuLink({ to, icon: Icon, label, description, trailing }: MenuLinkProps) {
  return (
    <Link
      to={to}
      className="flex min-h-[64px] items-center gap-3 px-4 py-3 transition hover:bg-grey-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-psm font-medium text-ink-900">{label}</span>
        <span className="block truncate text-caption text-ink-400">{description}</span>
      </span>
      {trailing}
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
    </Link>
  );
}

interface MenuButtonProps {
  icon: typeof UserRound;
  label: string;
  description: string;
  onClick: () => void;
}

function MenuButton({ icon: Icon, label, description, onClick }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-grey-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-psm font-medium text-ink-900">{label}</span>
        <span className="block truncate text-caption text-ink-400">{description}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
    </button>
  );
}
