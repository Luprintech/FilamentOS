import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator as CalculatorIcon, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CalculatorForm } from '@/components/calculator-form';
import { PriceStickyDesktop, PriceStickyMobile } from '@/components/price-sticky-panel';
import { formSchema, type FormData } from '@/lib/schema';
import { defaultFormValues } from '@/lib/defaults';
import { buildProjectPdfData } from '@/features/calculator/lib/build-project-pdf-data';
import type { SavedProject } from '@/features/projects/api/projects-api';
import type { CostCalculations } from '@/features/calculator/domain/cost-calculator';

const EMPTY_CALCULATIONS: CostCalculations = {
  filamentCost: 0, electricityCost: 0, laborCost: 0,
  currentMachineCost: 0, otherCostsTotal: 0,
  subTotal: 0, profitAmount: 0, priceBeforeVat: 0,
  vatAmount: 0, finalPrice: 0,
};

export function CalculadoraPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [calculations, setCalculations] = React.useState<CostCalculations>(EMPTY_CALCULATIONS);

  const incomingProject = (location.state as { project?: SavedProject } | null)?.project;

  // Merge incoming project with defaults so fields added after old projects were
  // saved (e.g. status, filaments) always have a valid value.
  const mergeProject = React.useCallback((project: SavedProject): FormData => ({
    ...defaultFormValues,
    ...project,
    status: (project as any).status ?? defaultFormValues.status,
    filaments: (project as any).filaments?.length > 0 ? project.filaments : defaultFormValues.filaments,
  }), []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: incomingProject ? mergeProject(incomingProject) : defaultFormValues,
  });

  React.useEffect(() => {
    if (!incomingProject) return;
    form.reset(mergeProject(incomingProject));
    window.history.replaceState({}, '');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [jobName, status, printTimeH, printTimeM, projectImage, filaments] = form.watch([
    'jobName', 'status', 'printingTimeHours', 'printingTimeMinutes', 'projectImage', 'filaments',
  ]);

  const detectedMaterials = React.useMemo(() => {
    return (filaments ?? [])
      .filter(f => Number(f.grams) > 0 && f.filamentType)
      .map(f => f.filamentType as string)
      .filter((v, i, arr) => arr.indexOf(v) === i);
  }, [filaments]);

  function handleOpenPdfCustomizer() {
    const project = form.getValues();
    navigate('/calculadora/pdf', {
      state: {
        project,
        projectData: buildProjectPdfData(project),
      },
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full"
    >
      {/* ── Page header ── */}
      <div className="mb-8 rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-md shadow-[0_12px_36px_rgba(2,8,23,0.08)] dark:border-white/10 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-bold text-[hsl(var(--challenge-blue))] dark:border-white/[0.08] dark:bg-white/[0.04]">
              <CalculatorIcon className="h-3.5 w-3.5" />
              {t('calc_hero_badge')}
            </div>
            <h2 className="challenge-gradient-text text-3xl font-black leading-none sm:text-4xl">
              {t('calc_hero_title')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('calc_hero_subtitle')}
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 rounded-lg font-medium"
            onClick={() => navigate('/proyectos')}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            {t('load_project') ?? 'Cargar proyecto'}
          </Button>
        </div>
      </div>

      {/* ── Main content: form (65%) + sticky summary (35%) ── */}
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start xl:gap-6 pb-24 xl:pb-0">
        <CalculatorForm
          form={form}
          onProjectSaved={() => {}}
          onCalculationsChange={setCalculations}
        />
        <PriceStickyDesktop
          calculations={calculations}
          projectName={jobName}
          status={status}
          printTimeHours={Number(printTimeH ?? 0)}
          printTimeMinutes={Number(printTimeM ?? 0)}
          projectImage={projectImage}
          detectedMaterials={detectedMaterials}
          onOpenPdfCustomizer={handleOpenPdfCustomizer}
        />
      </div>

      {/* Mobile fixed bottom bar */}
      <PriceStickyMobile calculations={calculations} />
    </motion.div>
  );
}
