import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/use-pwa-install';

const STORAGE_KEY = 'android-install-banner-dismissed';

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true;
}

export function AndroidInstallBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const { canInstall, install } = usePwaInstall();

  useEffect(() => {
    const alreadyDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    if (isAndroid() && !isInStandaloneMode() && !alreadyDismissed && canInstall) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall]);

  function dismiss(permanent: boolean) {
    setVisible(false);
    if (permanent) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }

  const handleInstall = async () => {
    await install();
    dismiss(true);
  };

  if (!visible || !canInstall) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-3 mb-4 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur-md dark:bg-card/90">
        {/* Cabecera */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/icon-192x192.png"
              alt="FilamentOS"
              className="h-12 w-12 rounded-2xl border border-border/40 shadow-sm"
            />
            <div>
              <p className="font-bold text-foreground">FilamentOS</p>
              <p className="text-xs text-muted-foreground">
                {t('android_install_subtitle', 'Instala la app en tu Android')}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-full"
            onClick={() => dismiss(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Descripción */}
        <p className="mb-3 text-sm text-foreground/80">
          {t(
            'android_install_desc',
            'Instala FilamentOS en tu dispositivo para acceder rápidamente sin necesidad de navegador.'
          )}
        </p>

        {/* Botones */}
        <div className="flex gap-2">
          <Button onClick={handleInstall} className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            {t('android_install_button', 'Instalar FilamentOS')}
          </Button>
        </div>

        {/* No volver a mostrar */}
        <button
          onClick={() => dismiss(true)}
          className="mt-2 w-full text-center text-xs text-muted-foreground/60 underline-offset-2 hover:underline"
        >
          {t('android_install_dismiss', 'No volver a mostrar')}
        </button>
      </div>
    </div>
  );
}
