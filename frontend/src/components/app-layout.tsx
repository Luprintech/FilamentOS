import { Outlet } from 'react-router-dom';
import { GlobalBackground } from '@/components/global-background';
import { AppHeader } from '@/components/app-header';
import { AppNav } from '@/components/app-nav';
import { AppFooter } from '@/components/app-footer';

export function AppLayout() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-10 pt-6 sm:px-8 md:px-10">
      <GlobalBackground />
      <div className="w-full max-w-[1400px]">
        <AppHeader />
        <AppNav />
        <Outlet />
        <AppFooter />
      </div>
    </main>
  );
}
