import { useEffect } from 'react';
import { Cookie } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

export function CookiesPage() {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border/70 bg-card/60 p-8 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Cookie className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground">{t('cookies_title')}</h1>
            <p className="text-sm text-muted-foreground">{t('cookies_updated')}</p>
          </div>
        </div>
      </motion.div>

      {/* Contenido */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-border/70 bg-card/60 p-8 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      >
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-5 text-sm leading-relaxed">
          {/* Introducción */}
          <section className="space-y-2">
            <p className="text-muted-foreground">
              {t('cookies_intro')}
            </p>
          </section>

          <Separator />

          {/* ¿Qué son las cookies? */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('cookies_what_title')}</h3>
            <p className="text-muted-foreground">
              {t('cookies_what_text')}
            </p>
          </section>

          <Separator />

          {/* Tabla de cookies */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-base">{t('cookies_table_title')}</h3>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="p-3 text-left font-semibold text-foreground">{t('privacy_table_header_name')}</th>
                      <th className="p-3 text-left font-semibold text-foreground">{t('privacy_table_header_type')}</th>
                      <th className="p-3 text-left font-semibold text-foreground">{t('privacy_table_header_duration')}</th>
                      <th className="p-3 text-left font-semibold text-foreground">{t('privacy_table_header_purpose')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{t('cookies_table_name')}</td>
                      <td className="p-3 text-muted-foreground">{t('privacy_table_row1_type')}</td>
                      <td className="p-3 text-muted-foreground">{t('privacy_table_row1_duration')}</td>
                      <td className="p-3 text-muted-foreground">{t('privacy_table_row1_purpose')}</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{t('cookies_table_name2')}</td>
                      <td className="p-3 text-muted-foreground">{t('privacy_table_row2_type')}</td>
                      <td className="p-3 text-muted-foreground">{t('privacy_table_row2_duration')}</td>
                      <td className="p-3 text-muted-foreground">{t('privacy_table_row2_purpose')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="block sm:hidden space-y-3">
              {/* connect.sid */}
              <div className="rounded-xl border border-border/50 bg-card/50 p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">{t('privacy_table_header_name')}</span>
                  <span className="text-xs text-foreground text-right font-mono">{t('cookies_table_name')}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">{t('privacy_table_header_type')}</span>
                  <span className="text-xs text-foreground text-right">{t('privacy_table_row1_type')}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">{t('privacy_table_header_duration')}</span>
                  <span className="text-xs text-foreground text-right">{t('privacy_table_row1_duration')}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">{t('privacy_table_header_purpose')}</span>
                  <span className="text-xs text-foreground text-right">{t('privacy_table_row1_purpose')}</span>
                </div>
              </div>
              {/* cookieConsent */}
              <div className="rounded-xl border border-border/50 bg-card/50 p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">{t('privacy_table_header_name')}</span>
                  <span className="text-xs text-foreground text-right font-mono">{t('cookies_table_name2')}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">{t('privacy_table_header_type')}</span>
                  <span className="text-xs text-foreground text-right">{t('privacy_table_row2_type')}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">{t('privacy_table_header_duration')}</span>
                  <span className="text-xs text-foreground text-right">{t('privacy_table_row2_duration')}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">{t('privacy_table_header_purpose')}</span>
                  <span className="text-xs text-foreground text-right">{t('privacy_table_row2_purpose')}</span>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Gestión de cookies */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('cookies_management_title')}</h3>
            <p className="text-muted-foreground">
              {t('cookies_management_text')}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('cookies_links_chrome')}
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('cookies_links_firefox')}
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('cookies_links_safari')}
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('cookies_links_edge')}
                </a>
              </li>
            </ul>
          </section>

          <Separator />

          {/* Base legal */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('cookies_legal_title')}</h3>
            <p className="text-muted-foreground">
              {t('cookies_legal_text')}
            </p>
          </section>

          <Separator />

          {/* Más información */}
          <section className="space-y-2">
            <p className="text-muted-foreground">
              {t('cookies_more_info')}{' '}
              <Link to="/politica-privacidad" className="text-primary hover:underline font-semibold">
                {t('privacy_title')}
              </Link>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
