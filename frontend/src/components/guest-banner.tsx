import React from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

interface GuestBannerProps {
  message: string;
}

/** Banner no-sticky para secciones de ejemplo en modo invitado. */
export function GuestBanner({ message }: GuestBannerProps) {
  const { goToLogin } = useAuth();

  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 dark:border-purple-800/50 dark:bg-purple-950/30"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" aria-hidden="true" />
        <p className="text-sm text-purple-700 dark:text-purple-300">{message}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 shrink-0 rounded-full border-purple-300 bg-white px-3 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:bg-transparent dark:text-purple-300 dark:hover:bg-purple-900/40"
        onClick={goToLogin}
      >
        Iniciar sesión
      </Button>
    </div>
  );
}
