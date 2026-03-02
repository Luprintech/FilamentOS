import React from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';
import { PrivacyPolicyModal } from '@/components/privacy-policy-modal';

interface Props {
  onAccept: () => void;
}

export function CookieBanner({ onAccept }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm shadow-lg print:hidden">
      <div className="mx-auto max-w-4xl flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Usamos <strong className="text-foreground">cookies técnicas</strong> necesarias
            para el inicio de sesión. No utilizamos cookies de seguimiento ni publicidad.{' '}
            <PrivacyPolicyModal
              trigger={
                <button className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                  Más información
                </button>
              }
            />
          </p>
        </div>
        <Button onClick={onAccept} size="sm" className="shrink-0 w-full sm:w-auto">
          Aceptar y continuar
        </Button>
      </div>
    </div>
  );
}
