import React from 'react';
import { Button } from '@/components/ui/button';
import { Github, Youtube, Instagram } from 'lucide-react';
import { GoogleIcon, TikTokIcon } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { PrivacyPolicyModal } from '@/components/privacy-policy-modal';

export function LoginPage() {
  const { loginWithGoogle, loading } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-background p-4 sm:p-8">
      <div className="flex w-full flex-grow items-center justify-center">
        <div className="w-full max-w-md text-center animate-fade-in">

          <img
            src="/Logo.svg"
            alt="Logo de Luprintech"
            width={150}
            height={150}
            className="mx-auto mb-6 rounded-full shadow-lg border border-gray-200"
          />

          <div className="mb-4 mt-8">
            <h1 className="font-headline text-5xl font-bold tracking-tighter text-primary sm:text-6xl">
              Calculadora 3D
            </h1>
            <p className="font-headline text-2xl text-muted-foreground">
              by Luprintech
            </p>
          </div>

          <p className="mx-auto mt-4 max-w-sm text-lg text-muted-foreground">
            Calcula al instante el precio de tus impresiones 3D con precisión.
          </p>

          <div className="mt-8">
            <Button
              onClick={loginWithGoogle}
              disabled={loading}
              className="w-full rounded-2xl shadow-md transition-all hover:shadow-lg"
              size="lg"
            >
              {loading
                ? <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                : <GoogleIcon className="mr-3 h-6 w-6" />
              }
              Iniciar sesión con Google
            </Button>
          </div>
        </div>
      </div>

      <footer className="w-full py-6 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-6 mb-4">
          <a href="https://github.com/luprintech" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-primary transition-colors">
            <Github className="h-5 w-5" />
          </a>
          <a href="https://www.youtube.com/@Luprintech" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-primary transition-colors">
            <Youtube className="h-5 w-5" />
          </a>
          <a href="https://www.instagram.com/luprintech/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-primary transition-colors">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="https://www.tiktok.com/@luprintech" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-primary transition-colors">
            <TikTokIcon className="h-5 w-5" />
          </a>
        </div>
        <p className="mb-2">
          ¿Tienes dudas? Escríbeme a{' '}
          <a href="mailto:luprintech@gmail.com" className="text-primary hover:underline">
            luprintech@gmail.com
          </a>
        </p>
        <p className="mb-2">&copy; {currentYear} Guadalupe Cano. Todos los derechos reservados.</p>
        <p>
          <PrivacyPolicyModal
            trigger={
              <button className="text-primary hover:underline underline-offset-2 transition-colors">
                Política de Privacidad y Cookies
              </button>
            }
          />
        </p>
      </footer>
    </main>
  );
}
