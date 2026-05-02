import { useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

export function TerminosPage() {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* Botón volver */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Button asChild variant="outline" size="sm" className="gap-2 rounded-full">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            {t('back_to_filamentos')}
          </Link>
        </Button>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border/70 bg-card/60 p-4 md:p-8 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-black text-foreground leading-tight">{t('terms_title')}</h1>
            <p className="text-xs md:text-sm text-muted-foreground">{t('terms_updated')}</p>
          </div>
        </div>
      </motion.div>

      {/* Contenido */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-border/70 bg-card/60 p-4 md:p-8 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      >
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-5 text-sm leading-relaxed">
          {/* Introducción */}
          <section className="space-y-2">
            <p className="text-muted-foreground font-semibold">
              {t('terms_intro')}
            </p>
          </section>

          <Separator />

          {/* 1. Objeto del servicio */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('terms_section1_title')}</h3>
            <p className="text-muted-foreground">
              {t('terms_section1_text')}
            </p>
          </section>

          <Separator />

          {/* 2. Requisitos de uso */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('terms_section2_title')}</h3>
            <p className="text-muted-foreground">
              {t('terms_section2_intro')}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>{t('terms_section2_item1')}</li>
              <li>{t('terms_section2_item2')}</li>
              <li>{t('terms_section2_item3')}</li>
            </ul>
          </section>

          <Separator />

          {/* 3. Cuenta de usuario */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('terms_section3_title')}</h3>
            <p className="text-muted-foreground">
              {t('terms_section3_text')}
            </p>
          </section>

          <Separator />

          {/* 4. Contenido del usuario */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('terms_section4_title')}</h3>
            <p className="text-muted-foreground">
              {t('terms_section4_text')}
            </p>
          </section>

          <Separator />

          {/* 5. Disponibilidad */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('terms_section5_title')}</h3>
            <p className="text-muted-foreground">
              {t('terms_section5_text')}
            </p>
          </section>

          <Separator />

          {/* 6. Propiedad intelectual */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('terms_section6_title')}</h3>
            <p className="text-muted-foreground">
              {t('terms_section6_text')}
            </p>
          </section>

          <Separator />

          {/* 7. Limitación de responsabilidad */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('terms_section7_title')}</h3>
            <p className="text-muted-foreground">
              {t('terms_section7_text')}
            </p>
          </section>

          <Separator />

          {/* 8. Modificaciones */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('terms_section8_title')}</h3>
            <p className="text-muted-foreground">
              {t('terms_section8_text')}
            </p>
          </section>

          <Separator />

          {/* 9. Legislación */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('terms_section9_title')}</h3>
            <p className="text-muted-foreground">
              {t('terms_section9_text')}
            </p>
          </section>

          <Separator />

          {/* 10. Contacto */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">{t('terms_section10_title')}</h3>
            <p className="text-muted-foreground">
              {t('terms_section10_text')}
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
