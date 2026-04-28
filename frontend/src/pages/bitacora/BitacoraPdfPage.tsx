import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PdfCustomizerLayout } from '@/components/pdf-customizer-layout';
import { PdfCustomizerDesignPanel } from '@/components/pdf-customizer-design-panel';
import { usePdfCustomization, type PdfCustomization } from '@/features/calculator/api/use-pdf-customization';
import { useTrackerPdf, type TrackerPdfData } from '@/features/tracker/api/use-tracker-pdf';

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

export function BitacoraPdfPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const trackerData = (location.state as { trackerData?: TrackerPdfData } | null)?.trackerData ?? null;

  const {
    config: savedConfig,
    saveConfig,
    isSavingConfig,
    uploadLogo,
    isUploadingLogo,
  } = usePdfCustomization();

  const { generatePreview, isGeneratingPreview, generatePdf, isGeneratingPdf } = useTrackerPdf();
  const [config, setConfig] = useState<PdfCustomization>(DEFAULT_CONFIG);
  const [previewHtml, setPreviewHtml] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (savedConfig) setConfig(savedConfig);
  }, [savedConfig]);

  const handleGeneratePreview = useCallback(async () => {
    if (!trackerData) return;
    try {
      const html = await generatePreview({ trackerData, customization: config });
      setPreviewHtml(html);
    } catch {
      // handled by hook
    }
  }, [config, generatePreview, trackerData]);

  useEffect(() => {
    if (!trackerData) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(handleGeneratePreview, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handleGeneratePreview, trackerData]);

  async function handleLogoUpload(file: File) {
    try {
      const logoPath = await uploadLogo(file);
      setConfig((prev) => ({ ...prev, logoPath }));
    } catch {
      // handled by mutation
    }
  }

  if (!trackerData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
        <FileText className="h-12 w-12 opacity-30" />
        <p className="text-sm">No hay datos del proyecto. Volvé a la bitácora.</p>
        <Button variant="outline" className="rounded-full" onClick={() => navigate(projectId ? `/bitacora/${projectId}` : '/bitacora')}>
          ← Volver
        </Button>
      </div>
    );
  }

  const previewPanel = isGeneratingPreview ? (
    <div className="flex min-h-[240px] items-center justify-center rounded-xl border bg-white shadow-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ) : previewHtml ? (
    <div className="mx-auto w-full" style={{ maxWidth: 794 }}>
      <iframe
        ref={iframeRef}
        srcDoc={previewHtml}
        title="Vista previa PDF"
        className="w-full rounded-xl border bg-white shadow-lg"
        style={{ aspectRatio: '1 / 1.414', minHeight: 400 }}
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
          <p className="text-sm text-muted-foreground">{trackerData.projectTitle}</p>
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
          previewPanel={previewPanel}
          onRefreshPreview={handleGeneratePreview}
          isRefreshing={isGeneratingPreview}
          onBack={() => navigate(projectId ? `/bitacora/${projectId}` : '/bitacora')}
          onSave={() => saveConfig(config)}
          isSaving={isSavingConfig}
          onGeneratePdf={() => generatePdf({ trackerData, customization: config })}
          isGeneratingPdf={isGeneratingPdf}
          generateLabel="Generar PDF"
        />
      </div>
    </motion.div>
  );
}
