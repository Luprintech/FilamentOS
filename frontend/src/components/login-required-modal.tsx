import React, { useState } from 'react';
import { Loader2, Lock, Mail } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleIcon } from '@/components/icons';
import { useAuth } from '@/context/auth-context';

interface LoginRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

export function LoginRequiredModal({ open, onOpenChange, message }: LoginRequiredModalProps) {
  const { loginWithGoogle, loginWithEmail, startGuest } = useAuth();
  const [mode, setMode] = useState<'select' | 'email'>('select');
  const [guestLoading, setGuestLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setMode('select');
    setEmail('');
    setPassword('');
    setError('');
  }

  async function handleGuest() {
    setGuestLoading(true);
    try {
      await startGuest();
      onOpenChange(false);
      window.location.href = '/calculadora';
    } finally {
      setGuestLoading(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      onOpenChange(false);
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  }

  const isBusy = guestLoading || submitting;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <DialogTitle className="text-center">Para esta acción necesitas una cuenta gratuita</DialogTitle>
          <DialogDescription className="text-center">
            {message ?? 'Inicia sesión para desbloquear todas las funciones, guardar tus datos y acceder desde cualquier lugar.'}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {mode === 'select' && (
            <>
              <Button className="w-full rounded-full font-bold" onClick={loginWithGoogle}>
                <GoogleIcon className="mr-2 h-4 w-4" />
                Iniciar sesión con Google
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full font-semibold"
                onClick={() => setMode('email')}
              >
                <Mail className="mr-2 h-4 w-4" />
                Iniciar sesión con email
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full font-semibold"
                onClick={handleGuest}
                disabled={isBusy}
              >
                {guestLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continuar sin cuenta
              </Button>
            </>
          )}

          {mode === 'email' && (
            <form onSubmit={handleEmailLogin} className="w-full space-y-3">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="modal-email">Email</Label>
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label htmlFor="modal-password">Contraseña</Label>
                <Input
                  id="modal-password"
                  type="password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={isBusy} className="w-full rounded-full font-bold">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Iniciar sesión
              </Button>

              <button
                type="button"
                onClick={() => setMode('select')}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Otras opciones
              </button>
            </form>
          )}

          <DialogClose asChild>
            <Button variant="ghost" className="w-full rounded-full text-sm">
              Cancelar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
