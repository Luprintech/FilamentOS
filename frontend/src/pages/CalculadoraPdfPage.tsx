import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PdfCustomizerLayout } from '@/components/pdf-customizer-layout';
import { PdfCustomizerDesignPanel } from '@/components/pdf-customizer-design-panel';
import { usePdfCustomization, type PdfCustomization, type ProjectData } from '@/features/calculator/api/use-pdf-customization';
import type { FormData } from '@/lib/schema';

const DEFAULT_CONFIG: PdfCustomization = {
  logoPath: null,
  primaryColor: '#29aae1',
  secondaryColor: '#333333',
  accentColor: '#f0f4f8',
  companyName: null,
  footerText: null,
  socialLinks: [],
  showMachineCosts: true,
  showBreakdown: true,
  showOtherCosts: true,
  showLaborCosts: true,
  showElectricity: true,
  templateName: 'default',
};

export function CalculadoraPdfPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const state = (location.state as { projectData?: ProjectData; project?: FormData } | null) ?? null;
  const projectData = state?.projectData ?? null;
  const rawProject = state?.project ?? null;

  const {
    config: savedConfig,
    saveConfig,
    isSavingConfig,
    uploadLogo,
    isUploadingLogo,
    generatePreview,
    isGeneratingPreview,
    generatePdf,
    isGeneratingPdf,
  } = usePdfCustomization(false);

  const [config, setConfig] = useState<PdfCustomization>(DEFAULT_CONFIG);
  const [previewHtml, setPreviewHtml] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (savedConfig) setConfig(savedConfig);
  }, [savedConfig]);

  const handleGeneratePreview = useCallback(async () => {
    if (!projectData) return;
    try {
      const html = await generatePreview({ projectData, customization: config });
      setPreviewHtml(html);
    } catch {
      // handled by hook
    }
  }, [config, generatePreview, projectData]);

  useEffect(() => {
    if (!projectData) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(handleGeneratePreview, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handleGeneratePreview, projectData]);

  async function handleLogoUpload(file: File) {
    try {
      const logoPath = await uploadLogo(file);
      setConfig((prev) => ({ ...prev, logoPath }));
    } catch {
      // handled by mutation
    }
  }

  if (!projectData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
        <FileText className="h-12 w-12 opacity-30" />
        <p className="text-sm">No hay datos del presupuesto. Volvé a la calculadora.</p>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => navigate('/calculadora', { state: rawProject ? { project: rawProject } : undefined })}
        >
          ← Volver
        </Button>
      </div>
    );
  }

  const layoutPanel = (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Secciones a mostrar</Label>
      <div className="space-y-4">
        {[
          { id: 'showBreakdown', label: 'Desglose detallado de costes', key: 'showBreakdown' as const },
          { id: 'showElectricity', label: 'Costes de electricidad', key: 'showElectricity' as const },
          { id: 'showLaborCosts', label: 'Costes de mano de obra', key: 'showLaborCosts' as const },
          { id: 'showMachineCosts', label: 'Costes de máquina y amortización', key: 'showMachineCosts' as const },
          { id: 'showOtherCosts', label: 'Otros costes adicionales', key: 'showOtherCosts' as const },
        ].map(({ id, label, key }) => (
          <div key={id} className="flex items-center justify-between gap-4">
            <Label htmlFor={id} className="cursor-pointer">{label}</Label>
            <Switch
              id={id}
              checked={config[key]}
              onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, [key]: checked }))}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const previewPanel = isGeneratingPreview ? (
    <div className="flex min-h-[240px] items-center justify-center rounded-xl border bg-white shadow-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ) : previewHtml ? (
    <div className="mx-auto w-full" style={{ maxWidth: 794 }}>
      <iframe
        ref={iframeRef}
        srcDoc={previewHtml}
        className="w-full rounded-xl border bg-white shadow-lg"
        style={{ aspectRatio: '1 / 1.414', minHeight: 400 }}
        title="PDF Preview"
      />
    </div>
  ) : (
    <div className="flex min-h-[240px] items-center justify-center rounded-xl border bg-white shadow-lg text-sm text-muted-foreground">
      Generando vista previa…
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="mb-4 flex shrink-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground">Customizar PDF</h1>
          <p className="text-sm text-muted-foreground">{projectData.jobName || 'Presupuesto sin nombre'}</p>
        </div>
      </div>

      <div className="rounded-[20px] border border-border/60 bg-card/80 shadow-md">
        <PdfCustomizerLayout
          designPanel={(
            <PdfCustomizerDesignPanel
              config={config}
              setConfig={setConfig}
              onLogoUpload={handleLogoUpload}
              isUploadingLogo={isUploadingLogo}
            />
          )}
          layoutPanel={layoutPanel}
          previewPanel={previewPanel}
          onRefreshPreview={handleGeneratePreview}
          isRefreshing={isGeneratingPreview}
          onBack={() => navigate('/calculadora', { state: rawProject ? { project: rawProject } : undefined })}
          onSave={() => saveConfig(config)}
          isSaving={isSavingConfig}
          onGeneratePdf={() => generatePdf({ projectData, customization: config })}
          isGeneratingPdf={isGeneratingPdf}
          generateLabel="Presupuesto PDF"
        />
      </div>
    </motion.div>
  );
}
