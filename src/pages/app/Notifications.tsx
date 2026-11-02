import { useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Info,
  Lightbulb,
  ReceiptText,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/api/queries';
import type { AppNotification } from '@/api/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { dateKey, relativeDayLabel, relativeTime } from '@/lib/dates';
import { cn } from '@/lib/cn';

const typeMeta: Record<AppNotification['type'], { icon: LucideIcon; bg: string; color: string }> = {
  budget: { icon: Wallet, bg: 'bg-[#fff4e5]', color: 'text-warning' },
  transaction: { icon: ReceiptText, bg: 'bg-[#eaf2ff]', color: 'text-[#4c9aff]' },
  insight: { icon: Lightbulb, bg: 'bg-[#e6f7f1]', color: 'text-success' },
  system: { icon: Info, bg: 'bg-brand-50', color: 'text-brand-700' },
};

export function Notifications() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const notifications = data ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;

  const filtered = useMemo(
    () => (filter === 'unread' ? notifications.filter((item) => !item.read) : notifications),
    [notifications, filter],
  );

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: AppNotification[] }>();
    for (const notification of filtered) {
      const key = dateKey(notification.createdAt);
      const existing = map.get(key);
      if (existing) {
        existing.items.push(notification);
      } else {
        map.set(key, { label: relativeDayLabel(notification.createdAt), items: [notification] });
      }
    }
    return [...map.values()];
  }, [filtered]);

  async function handleMarkAll() {
    await markAllRead.mutateAsync();
    showToast({ title: 'All caught up', description: 'Every notification is marked as read.', tone: 'success' });
  }

  return (
    <div className="min-h-[100dvh] pb-6">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
        right={
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            disabled={unreadCount === 0 || markAllRead.isPending}
            className="flex min-h-[44px] items-center gap-1.5 rounded-full px-2.5 text-caption font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-ink-400"
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            Mark all read
          </button>
        }
      />

      <div className="px-5 pt-4">
        <SegmentedControl
          label="Filter notifications"
          value={filter}
          onChange={(value) => setFilter(value as 'all' | 'unread')}
          options={[
            { value: 'all', label: 'All', count: notifications.length },
            { value: 'unread', label: 'Unread', count: unreadCount },
          ]}
        />

        {isLoading ? (
          <div className="mt-4 space-y-3" role="status" aria-label="Loading notifications">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-[92px] rounded-card" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-7 w-7" aria-hidden />}
            title={filter === 'unread' ? 'No unread notifications' : 'Nothing here yet'}
            description={
              filter === 'unread'
                ? 'You’ve read everything. We’ll nudge you when something needs attention.'
                : 'Budget alerts and spending insights will appear here as you use SpendWell.'
            }
            className="py-16"
          />
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mt-5" aria-label={group.label}>
              <h2 className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-400">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.items.map((notification) => {
                  const meta = typeMeta[notification.type];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => {
                        if (!notification.read) void markRead.mutateAsync(notification.id);
                      }}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-card border p-3.5 text-left transition',
                        notification.read
                          ? 'border-grey-100 bg-white hover:bg-grey-50'
                          : 'border-brand-100 bg-brand-50/70 hover:bg-brand-50',
                      )}
                    >
                      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', meta.bg, meta.color)}>
                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-psm font-semibold leading-snug text-ink-900">{notification.title}</p>
                          {!notification.read ? (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-700" aria-hidden />
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-caption leading-relaxed text-ink-500">{notification.body}</p>
                        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-400">
                          {relativeTime(notification.createdAt)}
                        </p>
                      </div>
                      <span className="sr-only">
                        {notification.read ? 'Read notification' : 'Unread. Mark as read'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {unreadCount > 0 ? (
          <div className="mt-5 flex justify-center">
            <Badge tone="brand" dot>
              {unreadCount} waiting for you
            </Badge>
          </div>
        ) : null}
      </div>
    </div>
  );
}
