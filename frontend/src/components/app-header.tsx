import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Download, LogOut, FlaskConical, Menu, X, UserCircle2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LanguageSelector } from '@/components/language-selector';
import { CurrencySelector } from '@/components/currency-selector';
import { useAuth } from '@/context/auth-context';
import { usePwaInstall } from '@/hooks/use-pwa-install';

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={resolvedTheme === 'dark' ? t('theme_dark') : t('theme_light')}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export function AppHeader() {
  const { user, logout, goToLogin, isGuest, exitGuest } = useAuth();
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { canInstall, install } = usePwaInstall();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isDevMode, setIsDevMode] = React.useState(false);
  const [devLoading, setDevLoading] = React.useState(false);

  const logoSrc = resolvedTheme === 'dark' ? '/filamentos_negro.png' : '/filamentos_blanco.png';
  const displayName = user?.name ?? user?.email ?? (isGuest ? 'Invitado' : '');
  const avatarUrl = user?.photo ?? undefined;
  const initials = displayName.charAt(0).toUpperCase();

  React.useEffect(() => {
    fetch('/api/dev/ping', { credentials: 'include' })
      .then((r) => { if (r.ok) setIsDevMode(true); })
      .catch(() => {});
  }, []);

  async function handleDevLogin() {
    setDevLoading(true);
    try {
      const res = await fetch('/api/dev/login-seed', { method: 'POST', credentials: 'include' });
      if (res.ok) window.location.reload();
    } finally {
      setDevLoading(false);
    }
  }

  const controls = (
    <>
      {canInstall && (
        <Button variant="outline" size="icon" onClick={install} title={t('install_title')}>
          <Download className="h-4 w-4" />
        </Button>
      )}
      <ThemeToggle />
      <LanguageSelector />
      <CurrencySelector />
    </>
  );

  const authControls = user ? (
    <>
      <button
        type="button"
        onClick={() => navigate('/ajustes')}
        className="hidden sm:flex rounded-full ring-2 ring-transparent hover:ring-primary/50 transition-all focus-visible:outline-none focus-visible:ring-primary"
        title="Mi perfil"
        aria-label="Abrir perfil"
      >
        <Avatar className="h-8 w-8">
          {avatarUrl
            ? <AvatarImage src={avatarUrl} alt={displayName} />
            : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </button>
    </>
  ) : isGuest ? (
    <>
      <Button onClick={goToLogin} variant="outline" size="sm" className="hidden sm:inline-flex rounded-full font-bold">
        Iniciar sesión
      </Button>
      <Button onClick={goToLogin} variant="outline" size="icon" className="sm:hidden" title="Iniciar sesión">
        <LogOut className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => { void exitGuest().then(() => { window.location.href = '/'; }); }}
        variant="ghost"
        size="icon"
        title="Salir del modo invitado"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </>
  ) : (
    <>
      <Button onClick={goToLogin} variant="outline" size="sm" className="hidden sm:inline-flex">
        {t('sign_in')}
      </Button>
      <Button onClick={goToLogin} variant="outline" size="icon" className="sm:hidden" title={t('sign_in')}>
        <LogOut className="h-4 w-4" />
      </Button>
      {isDevMode && (
        <Button
          onClick={handleDevLogin}
          disabled={devLoading}
          variant="outline"
          size="icon"
          className="border-dashed border-yellow-500/60 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
          title="Dev Login — usuario de seed"
        >
          {devLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
        </Button>
      )}
    </>
  );

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-4 sm:mb-8 rounded-2xl border border-border/70 bg-card/60 p-3 sm:p-4 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md print:hidden dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)] pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-[max(1rem,env(safe-area-inset-top))]"
        >
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt={t('logo_alt')} width={50} height={50} className="h-8 w-8 rounded-full shadow-lg border border-gray-200 sm:h-[50px] sm:w-[50px]" />
            <div className="text-left">
              <h1 className="font-headline text-lg sm:text-xl md:text-3xl font-bold tracking-tighter text-primary">
                {t('app_title')}
              </h1>
              {isGuest ? (
                <p className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2 py-0.5 text-[0.65rem] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  👀 Modo invitado
                </p>
              ) : user ? (
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{t('welcome', { name: displayName })}</p>
              ) : null}
            </div>
          </div>

          {/* Desktop controls */}
          <div className="hidden items-center gap-1.5 sm:gap-2 md:flex">
            {controls}
            {authControls}
          </div>

          {/* Mobile hamburger */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="mt-4 border-t border-border/60 pt-4 md:hidden"
            >
              <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center">
                <div className="grid w-full grid-cols-3 place-items-center gap-3">
                  <div className="flex w-full justify-center"><ThemeToggle /></div>
                  <div className="flex w-full justify-center"><LanguageSelector /></div>
                  <div className="flex w-full justify-center"><CurrencySelector /></div>
                </div>
                {canInstall && (
                  <Button variant="outline" onClick={install} className="w-full rounded-full font-bold">
                    <Download className="mr-2 h-4 w-4" />
                    {t('install_title')}
                  </Button>
                )}
                {user ? (
                  <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-4">
                    <button
                      type="button"
                      onClick={() => { navigate('/ajustes'); setMobileMenuOpen(false); }}
                      className="rounded-full ring-2 ring-transparent hover:ring-primary/50 transition-all focus-visible:outline-none focus-visible:ring-primary"
                      title="Mi perfil"
                    >
                      <Avatar className="h-12 w-12">
                        {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </button>
                    <div className="min-w-0 w-full">
                      <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{t('welcome', { name: displayName })}</p>
                    </div>
                    <Button
                      onClick={() => { navigate('/ajustes'); setMobileMenuOpen(false); }}
                      variant="outline"
                      className="w-full rounded-full font-bold"
                    >
                      <UserCircle2 className="mr-2 h-4 w-4" />
                      Mi perfil
                    </Button>
                  </div>
                ) : isGuest ? (
                  <div className="flex flex-col gap-2 w-full">
                    <Button onClick={goToLogin} variant="outline" className="w-full rounded-full font-bold">
                      {t('sign_in')}
                    </Button>
                    <Button
                      onClick={() => { void exitGuest().then(() => { window.location.href = '/'; }); }}
                      variant="ghost"
                      className="w-full rounded-full font-bold"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Salir del modo invitado
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 w-full">
                    <Button onClick={goToLogin} variant="outline" className="w-full rounded-full font-bold">
                      {t('sign_in')}
                    </Button>
                    {isDevMode && (
                      <Button
                        onClick={handleDevLogin}
                        disabled={devLoading}
                        variant="outline"
                        className="w-full rounded-full border-dashed border-yellow-500/60 font-bold text-yellow-500 hover:bg-yellow-500/10"
                      >
                        {devLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4" />}
                        Dev Login
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isGuest && (
          <div className="mt-4 rounded-2xl border border-purple-300/40 bg-gradient-to-r from-purple-500/12 via-fuchsia-500/10 to-indigo-500/12 px-4 py-3 text-sm font-semibold text-purple-800 dark:text-purple-200">
            Estás en modo invitado. Crea una cuenta gratuita para guardar tus proyectos.
          </div>
        )}
      </motion.header>
    </>
  );
}
