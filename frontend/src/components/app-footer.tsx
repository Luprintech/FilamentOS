import { Link } from 'react-router-dom';
import { Youtube, Instagram, Github, Calculator, BarChart3, LineChart, Package, Globe, MessageCircleQuestion, MessageSquarePlus, Coffee, Heart, Mail, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { TikTokIcon } from '@/components/icons';
import { motion } from 'framer-motion';

interface AppFooterProps {
  onOpenChatbot?: () => void;
  onOpenChatbotHelp?: () => void;
}

export function AppFooter({ onOpenChatbot, onOpenChatbotHelp }: AppFooterProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const currentYear = new Date().getFullYear();
  const logoSrc = resolvedTheme === 'dark' ? '/filamentos_negro.png' : '/filamentos_blanco.png';

  const handleSugerenciasClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenChatbot) {
      onOpenChatbot();
    }
  };

  const handleAyudaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenChatbotHelp) {
      onOpenChatbotHelp();
    }
  };

  const quickLinks = [
    { to: '/calculadora', icon: Calculator, label: t('tab_calculator') },
    { to: '/bitacora', icon: BarChart3, label: t('tab_tracker') },
    { to: '/estadisticas', icon: LineChart, label: t('tab_statistics') },
    { to: '/inventario', icon: Package, label: t('tab_inventory') },
    { to: '/recursos', icon: Globe, label: t('tab_recursos') },
  ];

  const socialLinks = [
    { href: 'https://www.youtube.com/@Luprintech', icon: Youtube, label: 'YouTube' },
    { href: 'https://www.instagram.com/luprintech/', icon: Instagram, label: 'Instagram' },
    { href: 'https://www.tiktok.com/@luprintech', icon: TikTokIcon, label: 'TikTok', isCustomIcon: true },
    { href: 'https://github.com/luprintech', icon: Github, label: 'GitHub' },
  ];

  return (
    <footer className="mt-16 w-full print:hidden">
      {/* Main footer content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border/70 bg-card/60 p-8 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-10"
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Columna 1: Marca */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center gap-3">
              <img src={logoSrc} alt="FilamentOS" className="h-10 w-10 rounded-full border border-border/60 shadow-md" />
              <h3 className="font-headline text-xl font-bold tracking-tight text-foreground">
                FilamentOS
              </h3>
            </div>
            <p className="text-sm font-semibold text-foreground/80">
              Tu centro de control para impresión 3D
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Calcula, registra y optimiza cada detalle de tus impresiones para obtener los mejores resultados.
            </p>
          </div>

          {/* Columna 2: Accesos rápidos */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Accesos rápidos
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Soporte */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Soporte
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={handleAyudaClick}
                  className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  <MessageCircleQuestion className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Centro de ayuda
                </button>
              </li>
              <li>
                <button
                  onClick={handleSugerenciasClick}
                  className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  <MessageSquarePlus className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Sugerencias
                </button>
              </li>
              <li>
                <Link
                  to="/acerca"
                  className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  <Info className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Acerca de FilamentOS
                </Link>
              </li>
              <li>
                <a
                  href="mailto:luprintech@gmail.com"
                  className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary cursor-pointer"
                >
                  <Mail className="h-4 w-4 transition-transform group-hover:scale-110" />
                  luprintech@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 4: Síguenos + Buy Me a Coffee */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Síguenos
            </h4>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(({ href, icon: Icon, label, isCustomIcon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-muted/20 transition-all hover:scale-110 hover:border-primary hover:bg-primary/10 hover:shadow-lg"
                  title={label}
                >
                  {isCustomIcon ? (
                    <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                  ) : (
                    <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                  )}
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Únete a la comunidad de makers
            </p>

            {/* Buy Me a Coffee */}
            <div className="rounded-xl border border-border/50 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 p-4 mt-4">
              <div className="flex items-start gap-3">
                <Coffee className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-bold text-foreground">¿Te gusta FilamentOS?</p>
                  <a
                    href="https://www.buymeacoffee.com/luprintech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    <Coffee className="h-3.5 w-3.5" />
                    Invítame a un café
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Franja inferior */}
        <div className="mt-8 border-t border-border/50 pt-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-xs text-muted-foreground">
              © {currentYear} Guadalupe Cano. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Hecho con</span>
              <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
              <span>para makers</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:justify-end">
              <Link
                to="/politica-privacidad"
                className="text-muted-foreground transition-colors hover:text-primary hover:underline underline-offset-2"
              >
                {t('footer_privacy')}
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <Link
                to="/cookies"
                className="text-muted-foreground transition-colors hover:text-primary hover:underline underline-offset-2"
              >
                Cookies
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <Link
                to="/terminos"
                className="text-muted-foreground transition-colors hover:text-primary hover:underline underline-offset-2"
              >
                Términos y condiciones
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
