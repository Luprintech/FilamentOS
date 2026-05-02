import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Share, Plus, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform ?? ''))
  );
}

function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
}

export function InstallPWAButton() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Show fallback after a delay if no install prompt available (generic web)
  useEffect(() => {
    if (isInStandaloneMode()) return;
    const timer = setTimeout(() => {
      if (!deferredPrompt && !isAndroid() && !isIOS()) {
        setShowFallback(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [deferredPrompt]);

  const handleAndroidInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  // Already installed
  if (isInStandaloneMode()) return null;

  // Android with install prompt available — show button
  if (isAndroid() && deferredPrompt) {
    return (
      <Button
        size="lg"
        variant="secondary"
        className="w-full rounded-full px-6 font-bold sm:w-auto gap-2"
        onClick={handleAndroidInstall}
      >
        <Download className="h-4 w-4" />
        {t('home_install_button', 'Instalar FilamentOS')}
      </Button>
    );
  }

  // iOS Safari — show button that opens modal with instructions
  if (isIOS() && isSafari()) {
    return (
      <>
        <Button
          size="lg"
          variant="secondary"
          className="w-full rounded-full px-6 font-bold sm:w-auto gap-2"
          onClick={() => setIosModalOpen(true)}
        >
          <Download className="h-4 w-4" />
          {t('home_install_button', 'Instalar FilamentOS')}
        </Button>

        {iosModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIosModalOpen(false)}
            />
            <div className="relative z-10 mx-3 mb-4 w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/icon-192x192.png"
                    alt="FilamentOS"
                    className="h-10 w-10 rounded-xl border border-border/40"
                  />
                  <div>
                    <p className="font-bold text-foreground">{t('home_install_title', 'Instalar FilamentOS')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('home_install_ios_subtitle', 'Sigue estos pasos en Safari')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => setIosModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    1
                  </div>
                  <span className="text-foreground/80">
                    {t('home_install_step1', 'Pulsa el botón')}{' '}
                    <span className="inline-flex items-center gap-0.5 rounded-md border border-border/50 bg-muted px-1.5 py-0.5 text-xs font-semibold">
                      <Share className="h-3 w-3" />
                      {t('home_install_share', 'Compartir')}
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    2
                  </div>
                  <span className="text-foreground/80">
                    {t('home_install_step2', 'Selecciona')}{' '}
                    <span className="inline-flex items-center gap-0.5 rounded-md border border-border/50 bg-muted px-1.5 py-0.5 text-xs font-semibold">
                      <Plus className="h-3 w-3" />
                      {t('home_install_add_home', 'Añadir a pantalla de inicio')}
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    3
                  </div>
                  <span className="text-foreground/80">
                    {t('home_install_step3', 'Pulsa "Añadir" arriba a la derecha')}
                  </span>
                </li>
              </ol>
            </div>
          </div>
        )}
      </>
    );
  }

  // Generic web (desktop/other) — show fallback install hint
  if (showFallback) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => {
          // Suggest browser menu install
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <Download className="h-3.5 w-3.5" />
        {t('home_install_web', 'Instalar')}
      </Button>
    );
  }

  return null;
}
