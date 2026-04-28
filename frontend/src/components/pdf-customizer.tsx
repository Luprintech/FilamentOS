import { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePdfCustomization, PdfCustomization, ProjectData, SocialLink } from '@/features/calculator/api/use-pdf-customization';
import { PdfCustomizerShell } from '@/components/pdf-customizer-shell';
import { X, Loader2, Trash2, Plus, Save } from 'lucide-react';

// Redes disponibles para el selector
const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'x', label: 'X / Twitter' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'pinterest', label: 'Pinterest' },
  { key: 'etsy', label: 'Etsy' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'web', label: 'Web / Tienda' },
];

const NETWORK_PLACEHOLDERS: Record<string, string> = {
  instagram: 'https://instagram.com/usuario',
  facebook: 'https://facebook.com/pagina',
  tiktok: 'https://tiktok.com/@usuario',
  youtube: 'https://youtube.com/@canal',
  x: 'https://x.com/usuario',
  linkedin: 'https://linkedin.com/in/usuario',
  pinterest: 'https://pinterest.com/usuario',
  etsy: 'https://etsy.com/shop/tienda',
  whatsapp: 'https://wa.me/34600000000',
  telegram: 'https://t.me/usuario',
  web: 'https://miweb.com',
};

const SOCIAL_ICONS_SVG: Record<string, string> = {
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  tiktok: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  x: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  pinterest: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>`,
  etsy: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.81 9.815H8.023l-.254 1.328h1.792s.293-.025.293.24c0 .132-.038.226-.038.226l-.254 1.27s-.062.226-.292.226H7.505l-.518 2.766h2.483l.48-2.49h1.217l-.48 2.49h2.786L15.5 9.815h-2.786l-.48 2.49h-1.217l.48-2.49zm9.89-7.326c0-.27-.213-.489-.47-.489H4.77c-.257 0-.47.219-.47.489v19.022c0 .27.213.489.47.489h14.46c.257 0 .47-.219.47-.489V2.489z"/></svg>`,
  web: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
  telegram: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
};

interface PdfCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectData: ProjectData;
  guestMode?: boolean;
}

// â”€â”€ Plantillas de color guardadas por el usuario â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STORAGE_KEY = 'filamentos_color_templates';

interface ColorTemplate {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

function loadTemplates(): ColorTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTemplates(templates: ColorTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}


function renderPreviewLinks(config: PdfCustomization) {
      const links = (config.socialLinks ?? []).filter(l => l.url.trim());
  if (links.length === 0) return '';
  return `<div style="margin-top:16px; display:flex; justify-content:center; flex-wrap:wrap; gap:8px; border-top:1px solid #ddd; padding-top:12px;">${links.map(({ network, url }) => {
    const label = SOCIAL_NETWORKS.find(n => n.key === network)?.label ?? network;
    const safeUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const icon = SOCIAL_ICONS_SVG[network] ?? SOCIAL_ICONS_SVG.web;
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:${config.primaryColor}; border:1px solid ${config.primaryColor}; border-radius:50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; text-decoration:none;" title="${label}">${icon}</a>`;
  }).join('')}</div>`;
}

// â”€â”€ Color presets predefinidos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const COLOR_PRESETS = [
  {
    name: 'Profesional',
    primary: '#29aae1',
    secondary: '#333333',
    accent: '#f0f4f8'
  },
  {
    name: 'Moderno',
    primary: '#6366f1',
    secondary: '#1e293b',
    accent: '#f1f5f9'
  },
  {
    name: 'Cálido',
    primary: '#f97316',
    secondary: '#431407',
    accent: '#fff7ed'
  },
  {
    name: 'Natural',
    primary: '#10b981',
    secondary: '#064e3b',
    accent: '#ecfdf5'
  },
];

export function PdfCustomizer({ open, onOpenChange, projectData, guestMode = false }: PdfCustomizerProps) {
  const { toast } = useToast();
  const {
    config: savedConfig,
    isLoading,
    saveConfig,
    isSavingConfig,
    uploadLogo,
    isUploadingLogo,
    generatePreview,
    isGeneratingPreview,
    generatePdf,
    isGeneratingPdf,
  } = usePdfCustomization(guestMode);

  const [config, setConfig] = useState<PdfCustomization>({
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
  });

  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [activeTab, setActiveTab] = useState('design');
  const [isDragging, setIsDragging] = useState(false);
  const [userTemplates, setUserTemplates] = useState<ColorTemplate[]>(loadTemplates);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved config
  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [savedConfig]);

  // Auto-generate preview when dialog opens or config changes (debounced)
  useEffect(() => {
    if (!open) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      handleGeneratePreview();
    }, 500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, open]);

  const handleLogoUpload = async (file: File) => {
    if (guestMode) {
      toast({
        title: "Modo invitado",
        description: "Inicia sesión para subir tu logo personalizado y guardarlo en tu cuenta.",
        variant: "default",
      });
      return;
    }

    if (!file.type.match(/^image\/(png|jpeg)$/)) {
      toast({
        title: 'Formato no soportado',
        description: 'Solo se permiten imágenes PNG o JPG',
        variant: 'destructive',
      });
      return;
    }

    try {
      const logoPath = await uploadLogo(file);
      setConfig(prev => ({ ...prev, logoPath }));
      
      // Auto-guardar la configuración para que el logo no se pierda
      if (!guestMode) {
        saveConfig({ ...config, logoPath });
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleLogoUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const handleGeneratePreview = async () => {
    if (guestMode) {
      // Generate local preview in guest mode
      const mockHtml = `
        <div style="font-family: ${config.templateName === 'modern' ? 'Inter, sans-serif' : 'Arial, sans-serif'}; padding: 40px; background: white; color: #333;">
          <div style="border-bottom: 3px solid ${config.primaryColor}; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: ${config.primaryColor}; margin: 0; font-size: 32px;">
              ${config.companyName || 'Tu Empresa'}
            </h1>
            <p style="color: ${config.secondaryColor}; margin: 10px 0 0;">Presupuesto de Impresión 3D</p>
          </div>
          
          <div style="background: ${config.accentColor}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: ${config.secondaryColor}; margin: 0 0 15px; font-size: 20px;">
              ${projectData.jobName || 'Proyecto de ejemplo'}
            </h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="margin: 5px 0; color: #666;"><strong>Tiempo de impresión:</strong> ${projectData.printingTimeHours}h ${projectData.printingTimeMinutes}m</p>
                <p style="margin: 5px 0; color: #666;"><strong>Filamento:</strong> ${projectData.filamentWeight}g</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #666;"><strong>Moneda:</strong> ${projectData.currency}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Total:</strong> ${projectData.finalPrice.toFixed(2)} ${projectData.currency}</p>
              </div>
            </div>
          </div>
          
          ${config.showBreakdown ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: ${config.secondaryColor}; font-size: 18px; margin-bottom: 10px;">Desglose de costes</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: ${config.accentColor};">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${config.primaryColor};">Concepto</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid ${config.primaryColor};">Importe</th>
              </tr>
              ${config.showElectricity ? `<tr><td style="padding: 8px;">Electricidad</td><td style="padding: 8px; text-align: right;">${projectData.electricityCost.toFixed(2)} ${projectData.currency}</td></tr>` : ''}
              ${config.showLaborCosts ? `<tr><td style="padding: 8px;">Mano de obra</td><td style="padding: 8px; text-align: right;">${projectData.laborCost.toFixed(2)} ${projectData.currency}</td></tr>` : ''}
              ${config.showMachineCosts ? `<tr><td style="padding: 8px;">Amortización</td><td style="padding: 8px; text-align: right;">${projectData.machineCost.toFixed(2)} ${projectData.currency}</td></tr>` : ''}
            </table>
          </div>
          ` : ''}
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px;">
            ${config.footerText || 'Presupuesto generado con FilamentOS'}
          </div>
          ${renderPreviewLinks(config)}
        </div>
      `;
      setPreviewHtml(mockHtml);
      return;
    }

    try {
      const html = await generatePreview({ projectData, customization: config });
      setPreviewHtml(html);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSaveConfig = () => {
    saveConfig(config);
  };

  const handleGeneratePdf = () => {
    if (guestMode) {
      toast({
        title: "Modo invitado",
        description: "Inicia sesión para generar PDFs personalizados con tu logo y configuración guardada.",
        variant: "default",
      });
      return;
    }
    generatePdf({ projectData, customization: config });
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setConfig(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
  };

  const handleSaveTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) return;
    const template: ColorTemplate = {
      id: Date.now().toString(),
      name,
      primary: config.primaryColor,
      secondary: config.secondaryColor,
      accent: config.accentColor,
    };
    const updated = [...userTemplates, template];
    setUserTemplates(updated);
    saveTemplates(updated);
    setEditingTemplateId(template.id);
    setNewTemplateName('');
    toast({ description: `Plantilla "${name}" guardada.` });
  };

  const handleApplyTemplate = (tpl: ColorTemplate) => {
    setConfig(prev => ({ ...prev, primaryColor: tpl.primary, secondaryColor: tpl.secondary, accentColor: tpl.accent }));
    setNewTemplateName(tpl.name);
    setEditingTemplateId(tpl.id);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplateId) return;
    const name = newTemplateName.trim();
    if (!name) return;
    const updated = userTemplates.map((tpl) => tpl.id === editingTemplateId
      ? { ...tpl, name, primary: config.primaryColor, secondary: config.secondaryColor, accent: config.accentColor }
      : tpl
    );
    setUserTemplates(updated);
    saveTemplates(updated);
    toast({ description: `Plantilla "${name}" actualizada.` });
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = userTemplates.filter(t => t.id !== id);
    setUserTemplates(updated);
    saveTemplates(updated);
    if (editingTemplateId === id) {
      setEditingTemplateId(null);
      setNewTemplateName('');
    }
  };

  // ── Panels ────────────────────────────────────────────────────────────────

  const designPanel = (
    <div className="space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Logo de la Empresa</Label>
                    <div
                      className={`
                        relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer
                        ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
                      `}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={handleFileSelect}
                      />

                      <div className="flex flex-col items-center gap-3">
                        {config.logoPath ? (
                          <>
                            <img
                              src={config.logoPath}
                              alt="Logo preview"
                              className="max-h-24 max-w-full object-contain"
                            />
                            <p className="text-sm text-muted-foreground">
                              Click o arrastra para cambiar
                            </p>
                          </>
                        ) : (
                          <>
                            {isUploadingLogo && (
                              <Loader2 className="h-6 w-6 text-primary animate-spin" />
                            )}
                            <div className="text-center">
                              <p className="text-sm font-medium">
                                Arrastra tu logo aquí o haz click
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PNG o JPG (max 2 MB)
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {config.logoPath && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfig(prev => ({ ...prev, logoPath: null }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nombre de la Empresa (opcional)</Label>
                    <Input
                      id="companyName"
                      placeholder="Ej: Luprintech"
                      value={config.companyName || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>

                  {/* Redes sociales dinámicas */}
                  <div className="space-y-3 rounded-lg border border-border/70 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">Redes sociales</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Aparecer&aacute;n como iconos clicables en el footer del PDF.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          socialLinks: [...(prev.socialLinks ?? []), { network: 'instagram', url: '' }],
                        }))}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        A&ntilde;adir
                      </Button>
                    </div>

                    {(config.socialLinks ?? []).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
                        Sin redes añadidas. Pulsa «A&ntilde;adir» para agregar la primera.
                      </p>
                    )}

                    <div className="space-y-2">
                      {(config.socialLinks ?? []).map((link, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <select
                            value={link.network}
                            onChange={(e) => {
                              const links = [...(config.socialLinks ?? [])];
                              links[idx] = { ...links[idx], network: e.target.value };
                              setConfig(prev => ({ ...prev, socialLinks: links }));
                            }}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm shrink-0 w-[130px] focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {SOCIAL_NETWORKS.map(n => (
                              <option key={n.key} value={n.key}>{n.label}</option>
                            ))}
                          </select>
                          <Input
                            placeholder={NETWORK_PLACEHOLDERS[link.network] ?? 'https://'}
                            value={link.url}
                            onChange={(e) => {
                              const links = [...(config.socialLinks ?? [])];
                              links[idx] = { ...links[idx], url: e.target.value };
                              setConfig(prev => ({ ...prev, socialLinks: links }));
                            }}
                            className="h-9 flex-1 text-sm"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              const links = (config.socialLinks ?? []).filter((_, i) => i !== idx);
                              setConfig(prev => ({ ...prev, socialLinks: links }));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Color Presets */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Plantillas de Color</Label>

                    {/* Presets predefinidos */}
                    <div className="grid grid-cols-2 gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          className="justify-start"
                          onClick={() => applyPreset(preset)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-4 h-4 rounded-full border" style={{ background: preset.primary }} />
                              <div className="w-4 h-4 rounded-full border" style={{ background: preset.secondary }} />
                            </div>
                            <span className="text-sm">{preset.name}</span>
                          </div>
                        </Button>
                      ))}
                    </div>

                    {/* Plantillas guardadas por el usuario */}
                    {userTemplates.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mis plantillas</p>
                        {userTemplates.map((tpl) => (
                          <div key={tpl.id} className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 justify-start text-sm h-9"
                              onClick={() => handleApplyTemplate(tpl)}
                            >
                              <div className="flex gap-1 mr-2">
                                <div className="w-4 h-4 rounded-full border" style={{ background: tpl.primary }} />
                                <div className="w-4 h-4 rounded-full border" style={{ background: tpl.secondary }} />
                                <div className="w-4 h-4 rounded-full border" style={{ background: tpl.accent }} />
                              </div>
                              {tpl.name}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              title="Eliminar plantilla"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Guardar plantilla actual */}
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="Nombre de la plantilla…"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') (editingTemplateId ? handleUpdateTemplate() : handleSaveTemplate()); }}
                        className="h-9 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 shrink-0"
                        onClick={handleSaveTemplate}
                        disabled={!newTemplateName.trim()}
                      >
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 shrink-0"
                        onClick={handleUpdateTemplate}
                        disabled={!editingTemplateId || !newTemplateName.trim()}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>

                  {/* Custom Colors */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Colores Personalizados</Label>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor" className="text-sm">Primario</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={config.primaryColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="h-10 w-full"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor" className="text-sm">Secundario</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={config.secondaryColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="h-10 w-full"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accentColor" className="text-sm">Acento</Label>
                        <div className="flex gap-2">
                          <Input
                            id="accentColor"
                            type="color"
                            value={config.accentColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                            className="h-10 w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Text */}
                  <div className="space-y-2">
                    <Label htmlFor="footerText">Texto del Pie de Página (opcional)</Label>
                    <Textarea
                      id="footerText"
                      placeholder="Ej: Gracias por confiar en nosotros"
                      value={config.footerText || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, footerText: e.target.value }))}
                      rows={3}
                    />
                  </div>
    </div>
  );

  const layoutPanel = (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Secciones a Mostrar</Label>
      <div className="space-y-4">
        {[
          { id: 'showBreakdown',   label: 'Desglose detallado de costes',      key: 'showBreakdown'   as const },
          { id: 'showElectricity', label: 'Costes de electricidad',             key: 'showElectricity' as const },
          { id: 'showLaborCosts',  label: 'Costes de mano de obra',             key: 'showLaborCosts'  as const },
          { id: 'showMachineCosts',label: 'Costes de máquina y amortización',   key: 'showMachineCosts'as const },
          { id: 'showOtherCosts',  label: 'Otros costes adicionales',           key: 'showOtherCosts'  as const },
        ].map(({ id, label, key }) => (
          <div key={id} className="flex items-center justify-between">
            <Label htmlFor={id} className="cursor-pointer">{label}</Label>
            <Switch
              id={id}
              checked={config[key]}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, [key]: checked }))}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const previewPanel = isGeneratingPreview ? (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ) : previewHtml ? (
    <iframe
      ref={iframeRef}
      srcDoc={previewHtml}
      className="h-full min-h-[400px] w-full rounded-xl border bg-white shadow-lg"
      title="PDF Preview"
    />
  ) : (
    <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
      Generando vista previa…
    </div>
  );

  return (
    <PdfCustomizerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Customizar PDF"
      subtitle="Personaliza tu presupuesto con logo, colores y layout"
      designPanel={designPanel}
      layoutPanel={layoutPanel}
      previewPanel={previewPanel}
      onRefreshPreview={handleGeneratePreview}
      isRefreshing={isGeneratingPreview}
      onSave={handleSaveConfig}
      isSaving={isSavingConfig}
      onGeneratePdf={handleGeneratePdf}
      isGeneratingPdf={isGeneratingPdf}
      guestMode={guestMode}
    />
  );
}


