import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Calculator, Package, BarChart3, LineChart, ArrowRight, ChevronRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/language-selector';
import { CurrencySelector } from '@/components/currency-selector';
import { PrivacyPolicyModal } from '@/components/privacy-policy-modal';
import { BuyMeCoffeeButton } from '@/components/buy-me-coffee-button';
import { TikTokIcon } from '@/components/icons';
import { Youtube, Instagram } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { InstallPWAButton } from '@/components/install-pwa-button';

// ── Theme toggle (standalone, sin dep de context) ─────────────────────────────
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={resolvedTheme === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}
function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm transition-shadow hover:shadow-md">
      <div className="text-primary mb-1">{icon}</div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

// ── Main landing page ─────────────────────────────────────────────────────────
export function HomePage() {
  const { goToLogin, startGuest } = useAuth();
  const { resolvedTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logoSrc = resolvedTheme === 'dark' ? '/filamentos_negro.png' : '/filamentos_blanco.png';
  
  // Infografía según idioma y tema
  const getInfographicSrc = () => {
    const isSpanish = i18n.language === 'es';
    const isDark = resolvedTheme === 'dark';
    
    if (isSpanish) {
      return isDark ? '/infografia-oscura.png' : '/infografia-clara.png';
    } else {
      return isDark ? '/infografia-oscura-ingles.png' : '/infografia-clara-ingles.png';
    }
  };

  async function handleStartGuest() {
    await startGuest();
    navigate('/calculadora');
  }

  const features: FeatureCardProps[] = [
    {
      icon: <Calculator className="h-10 w-10" />,
      title: t('home_feature_calculator_title'),
      description: t('home_feature_calculator_desc'),
    },
    {
      icon: <Package className="h-10 w-10" />,
      title: t('home_feature_inventory_title'),
      description: t('home_feature_inventory_desc'),
    },
    {
      icon: <BarChart3 className="h-10 w-10" />,
      title: t('home_feature_tracker_title'),
      description: t('home_feature_tracker_desc'),
    },
    {
      icon: <LineChart className="h-10 w-10" />,
      title: t('home_feature_stats_title'),
      description: t('home_feature_stats_desc'),
    },
  ];

  return (
    <>
      {/* SEO meta — inyectado programáticamente */}
      {React.createElement('title', {}, 'FilamentOS — El sistema operativo de tus impresiones 3D')}

      <div className="flex min-h-screen flex-col bg-background">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src={logoSrc}
                alt="FilamentOS logo"
                width={40}
                height={40}
                className="rounded-full border border-border/60 shadow-sm"
              />
              <span className="text-xl font-black tracking-tight text-primary">FilamentOS</span>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <ThemeToggle />
              <LanguageSelector />
              <CurrencySelector />
              <Button variant="outline" size="sm" className="rounded-full font-bold" onClick={goToLogin}>
                {t('sign_in')}
              </Button>
            </div>

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

          {mobileMenuOpen && (
            <div className="border-t border-border/60 px-4 py-4 md:hidden">
              <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center">
                <div className="grid w-full grid-cols-3 place-items-center gap-3">
                  <div className="flex w-full justify-center"><ThemeToggle /></div>
                  <div className="flex w-full justify-center"><LanguageSelector /></div>
                  <div className="flex w-full justify-center"><CurrencySelector /></div>
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-full font-bold"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    goToLogin();
                  }}
                >
                  {t('sign_in')}
                </Button>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1">

          {/* ── Hero ──────────────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16 md:py-20">
            {/* Gradient orb background */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse 80% 50% at 50% -10%, hsl(var(--primary)/0.15), transparent)',
              }}
            />

            <div className="relative mx-auto max-w-3xl text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-1.5 text-xs font-bold text-muted-foreground backdrop-blur-sm">
                {t('home_badge')}
              </div>

              {/* H1 */}
              <h1
                className="mb-6 text-3xl font-black leading-tight tracking-tight sm:text-5xl"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 50%, hsl(280,80%,70%) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {t('home_hero_title')}
              </h1>

              {/* Subtítulo */}
              <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t('home_hero_subtitle')}
              </p>

              {/* CTAs */}
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  className="w-full rounded-full px-8 font-extrabold sm:w-auto"
                  onClick={goToLogin}
                >
                  {t('sign_in')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full px-8 font-bold sm:w-auto"
                  onClick={handleStartGuest}
                >
                  {t('home_cta_guest')}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground/70">
                {t('home_cta_disclaimer')}
              </p>

              {/* PWA Install Button */}
              <div className="mt-3 flex justify-center">
                <InstallPWAButton />
              </div>

              {/* Infografía */}
              <div className="mt-12 mx-auto w-full max-w-4xl group cursor-pointer">
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-card/50 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] hover:scale-[1.02] hover:border-primary/30">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  <img
                    src={getInfographicSrc()}
                    alt="Infografía del sistema operativo FilamentOS"
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                  />
                  <div className="absolute inset-0 ring-2 ring-primary/0 group-hover:ring-primary/20 rounded-xl transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Features ──────────────────────────────────────────────────────── */}
          <section className="px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {features.map((f) => (
                  <FeatureCard key={f.title} {...f} />
                ))}
              </div>
            </div>
          </section>

          {/* ── Segunda CTA ────────────────────────────────────────────────────── */}
          <section className="px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-2xl">
              <div
                className="rounded-3xl p-10 text-center"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)/0.10) 0%, hsl(280,60%,60%,0.08) 100%)',
                  border: '1px solid hsl(var(--primary)/0.15)',
                }}
              >
                <h2 className="mb-3 text-2xl font-black text-foreground sm:text-3xl">
                  {t('home_cta2_title')}
                </h2>
                <p className="mb-8 text-muted-foreground">
                  {t('home_cta2_subtitle')}
                </p>

                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Button
                    size="lg"
                    className="w-full rounded-full px-8 font-extrabold sm:w-auto"
                    onClick={goToLogin}
                  >
                    {t('sign_in')} →
                  </Button>
                </div>

                <button
                  className="mt-4 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  onClick={handleStartGuest}
                >
                  {t('home_cta2_guest')}
                </button>
              </div>
            </div>
          </section>

        </main>

        {/* ── Footer (igual que el de la app) ──────────────────────────────── */}
        <footer className="border-t border-border/40 px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
          <div className="flex justify-center gap-6 mb-4">
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
            {t('footer_contact')}{' '}
            <a href="mailto:luprintech@gmail.com" className="text-primary hover:underline">
              luprintech@gmail.com
            </a>
            {' '}{t('footer_contact_social')}
          </p>
          <p className="mb-2">{t('footer_copyright', { year: currentYear })}</p>
          <p>
            <PrivacyPolicyModal
              trigger={
                <button className="text-primary hover:underline underline-offset-2 transition-colors">
                  {t('footer_privacy')}
                </button>
              }
            />
          </p>
          <div className="mt-4 border-t border-[#8b5cf6]/15 pt-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-gray-400">¿Te es útil FilamentOS? Puedes invitarme a un café</p>
              <BuyMeCoffeeButton size="md" />
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
