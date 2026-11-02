import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';

export function AppLayout() {
  return (
    <div className="app-shell relative min-h-[100dvh] bg-white pb-[84px]">
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
