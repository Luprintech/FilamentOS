import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { GlobalBackground } from '@/components/global-background';
import { AppHeader } from '@/components/app-header';
import { AppNav } from '@/components/app-nav';
import { AppFooter } from '@/components/app-footer';
import { BottomNav } from '@/components/bottom-nav';

interface AppLayoutProps {
  onOpenChatbot?: () => void;
  onOpenChatbotHelp?: () => void;
}

export function AppLayout({ onOpenChatbot, onOpenChatbotHelp }: AppLayoutProps) {
  const location = useLocation();

  // Scroll al inicio cada vez que cambia la ruta
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-10 pt-6 sm:px-8 md:px-10">
      <GlobalBackground />
      <div className="mobile-app-container relative mx-auto min-h-[100dvh] w-full max-w-[430px] overflow-x-hidden pb-[100px] md:max-w-[768px] md:pb-[120px] lg:max-w-[1400px] lg:pb-10">
        <AppHeader />
        <AppNav />
        <Outlet />
        <AppFooter onOpenChatbot={onOpenChatbot} onOpenChatbotHelp={onOpenChatbotHelp} />
      </div>
      {/* Bottom nav fuera del contenedor scroll para position: fixed real */}
      <BottomNav />
    </main>
  );
}
