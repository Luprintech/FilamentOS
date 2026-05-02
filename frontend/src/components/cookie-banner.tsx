import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';
import { PrivacyPolicyModal } from '@/components/privacy-policy-modal';
import { useTranslation } from 'react-i18next';

interface Props {
  onAccept: () => void;
}

export function CookieBanner({ onAccept }: Props) {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    // Modal centrado en móvil para evitar que el BottomNav (z-[999]) lo tape
    return (
      <div className="fixed inset-0 z-[1000] flex items-end justify-center print:hidden">
        {/* Backdrop oscuro */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onAccept}
          aria-hidden="true"
        />
        {/* Tarjeta del banner */}
        <div className="relative z-10 mx-4 mb-6 w-full max-w-sm rounded-xl border bg-background shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                {t('cookie_text')}{' '}
                <PrivacyPolicyModal
                  trigger={
                    <button className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                      {t('cookie_more')}
                    </button>
                  }
                />
              </p>
            </div>
            <button
              onClick={onAccept}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label={t('cookie_accept')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="border-t p-4 pt-3">
            <Button onClick={onAccept} className="w-full">
              {t('cookie_accept')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: banner inferior original
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] border-t bg-background/95 backdrop-blur-sm shadow-lg print:hidden">
      <div className="mx-auto max-w-4xl flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            {t('cookie_text')}{' '}
            <PrivacyPolicyModal
              trigger={
                <button className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                  {t('cookie_more')}
                </button>
              }
            />
          </p>
        </div>
        <Button onClick={onAccept} size="sm" className="shrink-0 w-full sm:w-auto">
          {t('cookie_accept')}
        </Button>
      </div>
    </div>
  );
}
