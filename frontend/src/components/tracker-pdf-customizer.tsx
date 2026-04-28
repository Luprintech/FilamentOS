import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePdfCustomization, PdfCustomization, SocialLink } from '@/features/calculator/api/use-pdf-customization';
import { useTrackerPdf, TrackerPdfData } from '@/features/tracker/api/use-tracker-pdf';
import {
  Eye, Save, FileDown, Loader2, FileText, X, RefreshCw, Plus,
} from 'lucide-react';

interface TrackerPdfCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackerData: TrackerPdfData;
}

const COLOR_PRESETS = [
  { name: 'Profesional', primary: '#29aae1', secondary: '#333333', accent: '#f0f4f8' },
  { name: 'Moderno',     primary: '#6366f1', secondary: '#1e293b', accent: '#f1f5f9' },
  { name: 'Cálido',      primary: '#f97316', secondary: '#431407', accent: '#fff7ed' },
  { name: 'Natural',     primary: '#10b981', secondary: '#064e3b', accent: '#ecfdf5' },
];

const SOCIAL_NETWORKS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook',  label: 'Facebook' },
  { value: 'tiktok',    label: 'TikTok' },
  { value: 'youtube',   label: 'YouTube' },
  { value: 'x',         label: 'X (Twitter)' },
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'etsy',      label: 'Etsy' },
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'telegram',  label: 'Telegram' },
  { value: 'web',       label: 'Sitio web' },
];

export function TrackerPdfCustomizer({ open, onOpenChange, trackerData }: TrackerPdfCustomizerProps) {
  const { toast } = useToast();

  const {
    config: savedConfig,
    saveConfig,
    isSavingConfig,
    uploadLogo,
    isUploadingLogo,
  } = usePdfCustomization();

  const { generatePreview, isGeneratingPreview, generatePdf, isGeneratingPdf } = useTrackerPdf();

  const [config, setConfig] = useState<PdfCustomization>({
    logoPath:        null,
    primaryColor:    '#29aae1',
    secondaryColor:  '#333333',
    accentColor:     '#f0f4f8',
    companyName:     null,
    footerText:      null,
    socialLinks:     [],
    showMachineCosts: true,
    showBreakdown:   true,
    showOtherCosts:  true,
    showLaborCosts:  true,
    showElectricity: true,
    templateName:    'default',
  });

  const [previewHtml, setPreviewHtml] = useState('');
  const [isDragging,  setIsDragging]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef    = useRef<HTMLIFrameElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (savedConfig) setConfig(savedConfig);
  }, [savedConfig]);

  // Auto-preview debounced
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(handleGeneratePreview, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [config, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogoUpload = useCallback(async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Archivo muy grande', description: 'Máx 2 MB', variant: 'destructive' });
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
      toast({ title: 'Formato no válido', description: 'PNG, JPG o SVG', variant: 'destructive' });
      return;
    }
    try {
      const logoPath = await uploadLogo(file);
      setConfig((c) => ({ ...c, logoPath }));
    } catch { /* handled by mutation */ }
  }, [uploadLogo, toast]);

  async function handleGeneratePreview() {
    try {
      const html = await generatePreview({ trackerData, customization: config });
      setPreviewHtml(html);
    } catch { /* handled */ }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Override shadcn defaults: remove max-w-lg, add our own sizing
        className="flex h-[92dvh] w-[min(96vw,1000px)] max-w-none flex-col gap-0 overflow-hidden p-0"
      >
        {/* ── Header ── */}
        <DialogHeader className="flex shrink-0 flex-row items-center gap-3 border-b border-border/60 px-5 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base font-bold">Customizar PDF — Bitácora</DialogTitle>
            <p className="truncate text-xs text-muted-foreground">Personaliza el reporte con logo, colores y marca</p>
          </div>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {/*
            Desktop: two equal columns side-by-side.
            Mobile:  single column — config on top, preview below.
          */}
          <div className="grid h-full grid-cols-1 md:grid-cols-2">

            {/* ── Left / Top: config panel ── */}
            <div className="overflow-y-auto border-b border-border/60 p-5 md:border-b-0 md:border-r">
              <div className="space-y-5">

                {/* Logo upload */}
                <div className="space-y-2">
                  <Label className="font-semibold">Logo de la empresa</Label>
                  <div
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleLogoUpload(f); }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
                    />
                    {config.logoPath ? (
                      <>
                        <img src={config.logoPath} alt="Logo" className="mx-auto max-h-20 max-w-full object-contain" />
                        <p className="mt-2 text-xs text-muted-foreground">Click o arrastra para cambiar</p>
                        <Button
                          size="icon" variant="ghost"
                          className="absolute right-1 top-1 h-7 w-7 rounded-full"
                          onClick={(e) => { e.stopPropagation(); setConfig((c) => ({ ...c, logoPath: null })); }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {isUploadingLogo
                          ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                          : <p className="text-sm font-medium">Arrastra tu logo aquí o haz click<br /><span className="text-xs text-muted-foreground">PNG, JPG o SVG (máx 2 MB)</span></p>
                        }
                      </>
                    )}
                  </div>
                </div>

                {/* Company name */}
                <div className="space-y-1.5">
                  <Label>Nombre de la empresa</Label>
                  <Input
                    placeholder="Ej: Luprintech"
                    value={config.companyName ?? ''}
                    onChange={(e) => setConfig((c) => ({ ...c, companyName: e.target.value }))}
                  />
                </div>

                {/* Color presets */}
                <div className="space-y-2">
                  <Label className="font-semibold">Plantillas de color</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <Button
                        key={p.name} variant="outline"
                        className="justify-start gap-2 text-sm"
                        onClick={() => setConfig((c) => ({ ...c, primaryColor: p.primary, secondaryColor: p.secondary, accentColor: p.accent }))}
                      >
                        <span className="flex gap-1">
                          <span className="h-4 w-4 rounded-full border" style={{ background: p.primary }} />
                          <span className="h-4 w-4 rounded-full border" style={{ background: p.secondary }} />
                        </span>
                        {p.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom colors */}
                <div className="space-y-2">
                  <Label className="font-semibold">Colores personalizados</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { id: 'primary',   label: 'Primario',   key: 'primaryColor'   as const },
                      { id: 'secondary', label: 'Secundario', key: 'secondaryColor' as const },
                      { id: 'accent',    label: 'Acento',     key: 'accentColor'    as const },
                    ]).map(({ id, label, key }) => (
                      <div key={id} className="space-y-1">
                        <Label htmlFor={id} className="text-xs">{label}</Label>
                        <Input
                          id={id} type="color"
                          value={config[key]}
                          onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))}
                          className="h-10 w-full cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer text */}
                <div className="space-y-1.5">
                  <Label>Pie de página</Label>
                  <Textarea
                    placeholder="Ej: Gracias por confiar en nosotros"
                    value={config.footerText ?? ''}
                    rows={2}
                    onChange={(e) => setConfig((c) => ({ ...c, footerText: e.target.value }))}
                  />
                </div>

                {/* Social links */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Redes sociales</Label>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 gap-1 rounded-full text-xs"
                      onClick={() => setConfig((c) => ({
                        ...c,
                        socialLinks: [...(c.socialLinks ?? []), { network: 'instagram', url: '' } as SocialLink],
                      }))}
                    >
                      <Plus className="h-3.5 w-3.5" /> Añadir
                    </Button>
                  </div>
                  {(config.socialLinks ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin redes configuradas. Aparecerán como iconos en el footer del PDF.</p>
                  ) : (
                    <div className="space-y-2">
                      {(config.socialLinks ?? []).map((link, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Select
                            value={link.network}
                            onValueChange={(value) => {
                              const updated = [...(config.socialLinks ?? [])];
                              updated[i] = { ...updated[i], network: value };
                              setConfig((c) => ({ ...c, socialLinks: updated }));
                            }}
                          >
                            <SelectTrigger className="h-8 w-32 shrink-0 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SOCIAL_NETWORKS.map((n) => (
                                <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            className="h-8 flex-1 text-xs"
                            placeholder="https://..."
                            value={link.url}
                            onChange={(e) => {
                              const updated = [...(config.socialLinks ?? [])];
                              updated[i] = { ...updated[i], url: e.target.value };
                              setConfig((c) => ({ ...c, socialLinks: updated }));
                            }}
                          />
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={() => {
                              const updated = (config.socialLinks ?? []).filter((_, j) => j !== i);
                              setConfig((c) => ({ ...c, socialLinks: updated }));
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ── Right / Bottom: preview panel ── */}
            <div className="flex flex-col overflow-hidden bg-muted/20">
              {/* Preview toolbar */}
              <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background/60 px-4 py-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Vista previa</span>
                </div>
                <Button
                  size="sm" variant="outline"
                  onClick={handleGeneratePreview}
                  disabled={isGeneratingPreview}
                  className="h-7 gap-1.5 rounded-full text-xs font-bold"
                >
                  {isGeneratingPreview
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <RefreshCw className="h-3.5 w-3.5" />}
                  Actualizar
                </Button>
              </div>

              {/* iframe */}
              <div className="flex-1 overflow-auto p-4">
                {isGeneratingPreview ? (
                  <div className="flex h-full min-h-[200px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : previewHtml ? (
                  <iframe
                    ref={iframeRef}
                    srcDoc={previewHtml}
                    title="Vista previa PDF"
                    className="w-full rounded-xl border bg-white shadow-lg"
                    style={{ minHeight: 400 }}
                  />
                ) : (
                  <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
                    Generando vista previa…
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── Footer sticky ── */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/60 bg-background px-5 py-3">
          <Button variant="outline" size="sm" className="rounded-full font-bold" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            variant="outline" size="sm" className="rounded-full font-bold"
            onClick={() => saveConfig(config)}
            disabled={isSavingConfig}
          >
            {isSavingConfig ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Guardar
          </Button>
          <Button
            size="sm" className="rounded-full font-extrabold"
            onClick={() => generatePdf({ trackerData, customization: config })}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />}
            Generar PDF
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
