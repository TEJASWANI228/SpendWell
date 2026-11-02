import { NavLink, useLocation } from 'react-router-dom';
import { ChartPie, Home, Plus, ReceiptText, UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';

const items = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/transactions', label: 'Activity', icon: ReceiptText, end: false },
  { to: '/app/analytics', label: 'Insights', icon: ChartPie, end: false },
  { to: '/app/profile', label: 'Profile', icon: UserRound, end: false },
];

const HIDDEN_PREFIXES = ['/app/transactions/new', '/app/budget/set', '/app/profile/edit'];

export function BottomNav() {
  const location = useLocation();
  const hidden =
    HIDDEN_PREFIXES.some((prefix) => location.pathname.startsWith(prefix)) ||
    /^\/app\/transactions\/[^/]+\/edit$/.test(location.pathname);

  if (hidden) return null;

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-grey-100 bg-white/95 shadow-nav backdrop-blur-xl"
    >
      <div className="relative grid h-[68px] grid-cols-5 items-center px-2">
        {items.slice(0, 2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <div className="relative flex h-full items-start justify-center">
          <NavLink
            to="/app/transactions/new"
            aria-label="Add transaction"
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-float transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
          >
            <Plus className="h-6 w-6" aria-hidden />
          </NavLink>
        </div>

        {items.slice(2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </nav>
  );
}

interface NavItemProps {
  to: string;
  label: string;
  icon: typeof Home;
  end: boolean;
}

function NavItem({ to, label, icon: Icon, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[10px] text-[11px] font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700',
          isActive ? 'text-brand-700' : 'text-ink-400 hover:text-ink-600',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'flex h-7 w-10 items-center justify-center rounded-pill transition-colors',
              isActive && 'bg-brand-50',
            )}
          >
            <Icon className="h-[21px] w-[21px]" strokeWidth={isActive ? 2.4 : 2} aria-hidden />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}
