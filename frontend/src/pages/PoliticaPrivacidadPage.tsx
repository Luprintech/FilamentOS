import { useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

export function PoliticaPrivacidadPage() {
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
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground">{t('privacy_title')}</h1>
            <p className="text-sm text-muted-foreground">{t('privacy_updated')}</p>
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
          {/* 1. Responsable */}
          <section className="space-y-1">
            <h3 className="font-semibold text-foreground text-base">{t('privacy_section1_title')}</h3>
            <p className="text-muted-foreground">
              <strong>{t('privacy_section1_owner_label')}:</strong> {t('privacy_section1_owner_value')}<br />
              <strong>{t('privacy_section1_activity_label')}:</strong> {t('privacy_section1_activity_value')}<br />
              <strong>{t('privacy_section1_contact_label')}:</strong>{' '}
              <a href="mailto:luprintech@gmail.com" className="text-primary hover:underline">
                luprintech@gmail.com
              </a>
            </p>
          </section>

          <Separator />

          {/* 2. Datos recogidos */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('privacy_section2_title')}</h3>
            <p className="text-muted-foreground">
              {t('privacy_section2_intro')}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
              <li>{t('privacy_section2_item1')}</li>
              <li>{t('privacy_section2_item2')}</li>
              <li>{t('privacy_section2_item3')}</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              <strong>Además, almacenamos:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
              <li>Proyectos de cálculo de costes de impresión 3D que guardes voluntariamente.</li>
              <li>Proyectos de bitácora con piezas, tiempos, fotos y filamentos.</li>
              <li>Inventario de filamentos con marca, material, color y cantidad.</li>
              <li>Preferencias de usuario (formato de fecha, unidades de medida).</li>
              <li>Foto de perfil personalizada (opcional, límite 10MB).</li>
              <li>Configuración de personalización de PDFs (logo, colores, datos de empresa).</li>
            </ul>
            <p className="text-muted-foreground mt-2 text-xs italic">
              Todos estos datos son almacenados localmente en nuestra base de datos y NUNCA se comparten con terceros sin tu consentimiento.
            </p>
          </section>

          <Separator />

          {/* 3. Finalidad y legitimación */}
          <section className="space-y-1">
            <h3 className="font-semibold text-foreground text-base">{t('privacy_section3_title')}</h3>
            <div className="text-muted-foreground space-y-1">
              <p>
                <strong>{t('privacy_section3_purpose_label')}:</strong> {t('privacy_section3_purpose_text')}
              </p>
              <p>
                <strong>{t('privacy_section3_legal_label')}:</strong> {t('privacy_section3_legal_text')}
              </p>
            </div>
          </section>

          <Separator />

          {/* 4. Conservación */}
          <section className="space-y-1">
            <h3 className="font-semibold text-foreground text-base">{t('privacy_section4_title')}</h3>
            <p className="text-muted-foreground">
              {t('privacy_section4_text')}{' '}
              <a href="mailto:luprintech@gmail.com" className="text-primary hover:underline">
                luprintech@gmail.com
              </a>.
            </p>
          </section>

          <Separator />

          {/* 5. Destinatarios */}
          <section className="space-y-1">
            <h3 className="font-semibold text-foreground text-base">{t('privacy_section5_title')}</h3>
            <p className="text-muted-foreground">
              {t('privacy_section5_text_prefix')}{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google OAuth
              </a>
              {t('privacy_section5_text_suffix')}
            </p>
          </section>

          <Separator />

          {/* 6. Derechos */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('privacy_section6_title')}</h3>
            <p className="text-muted-foreground">
              {t('privacy_section6_intro')}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
              <li>{t('privacy_section6_item1')}</li>
              <li>{t('privacy_section6_item2')}</li>
              <li>{t('privacy_section6_item3')}</li>
              <li>{t('privacy_section6_item4')}</li>
              <li>{t('privacy_section6_item5')}</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              {t('privacy_section6_outro_prefix')}{' '}
              <a href="mailto:luprintech@gmail.com" className="text-primary hover:underline">
                luprintech@gmail.com
              </a>
              {t('privacy_section6_outro_middle')}{' '}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t('privacy_section6_outro_link_text')}
              </a>
              {t('privacy_section6_outro_suffix')}
            </p>
          </section>

          <Separator />

          {/* 7. Cookies */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground text-base">{t('privacy_section7_title')}</h3>
            <p className="text-muted-foreground">
              {t('privacy_section7_intro')}
            </p>
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
                      <td className="p-3 font-mono text-xs text-muted-foreground">connect.sid</td>
                      <td className="p-3 text-muted-foreground">{t('privacy_table_row1_type')}</td>
                      <td className="p-3 text-muted-foreground">{t('privacy_table_row1_duration')}</td>
                      <td className="p-3 text-muted-foreground">{t('privacy_table_row1_purpose')}</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="p-3 font-mono text-xs text-muted-foreground">cookieConsent</td>
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
                  <span className="text-xs text-foreground text-right font-mono">connect.sid</span>
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
                  <span className="text-xs text-foreground text-right font-mono">cookieConsent</span>
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
            <p className="text-muted-foreground text-xs mt-2">
              {t('privacy_section7_footer')}
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
