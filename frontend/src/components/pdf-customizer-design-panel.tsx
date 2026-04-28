import { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { PdfCustomization } from '@/features/calculator/api/use-pdf-customization';
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react';

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

const COLOR_PRESETS = [
  { name: 'Profesional', primary: '#29aae1', secondary: '#333333', accent: '#f0f4f8' },
  { name: 'Moderno', primary: '#6366f1', secondary: '#1e293b', accent: '#f1f5f9' },
  { name: 'Cálido', primary: '#f97316', secondary: '#431407', accent: '#fff7ed' },
  { name: 'Natural', primary: '#10b981', secondary: '#064e3b', accent: '#ecfdf5' },
];

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

interface PdfCustomizerDesignPanelProps {
  config: PdfCustomization;
  setConfig: React.Dispatch<React.SetStateAction<PdfCustomization>>;
  onLogoUpload: (file: File) => void | Promise<void> | Promise<string>;
  isUploadingLogo?: boolean;
}

export function PdfCustomizerDesignPanel({
  config,
  setConfig,
  onLogoUpload,
  isUploadingLogo = false,
}: PdfCustomizerDesignPanelProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [userTemplates, setUserTemplates] = useState<ColorTemplate[]>(loadTemplates);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const applyPreset = (preset: typeof COLOR_PRESETS[number]) => {
    setConfig((prev) => ({
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
    setConfig((prev) => ({
      ...prev,
      primaryColor: tpl.primary,
      secondaryColor: tpl.secondary,
      accentColor: tpl.accent,
    }));
    setNewTemplateName(tpl.name);
    setEditingTemplateId(tpl.id);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplateId) return;
    const name = newTemplateName.trim();
    if (!name) return;
    const updated = userTemplates.map((tpl) => tpl.id === editingTemplateId
      ? { ...tpl, name, primary: config.primaryColor, secondary: config.secondaryColor, accent: config.accentColor }
      : tpl);
    setUserTemplates(updated);
    saveTemplates(updated);
    toast({ description: `Plantilla "${name}" actualizada.` });
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = userTemplates.filter((tpl) => tpl.id !== id);
    setUserTemplates(updated);
    saveTemplates(updated);
    if (editingTemplateId === id) {
      setEditingTemplateId(null);
      setNewTemplateName('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-semibold">Logo de la empresa</Label>
        <div
          className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-all ${
            isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
          }`}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) onLogoUpload(file);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onLogoUpload(file);
            }}
          />

          <div className="flex flex-col items-center gap-3 text-center">
            {config.logoPath ? (
              <>
                <img src={config.logoPath} alt="Logo preview" className="max-h-24 max-w-full object-contain" />
                <p className="text-sm text-muted-foreground">Click o arrastra para cambiar</p>
              </>
            ) : (
              <>
                {isUploadingLogo && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                <div>
                  <p className="text-sm font-medium">Arrastra tu logo aquí o haz click</p>
                  <p className="mt-1 text-xs text-muted-foreground">PNG, JPG o SVG (máx 2 MB)</p>
                </div>
              </>
            )}
          </div>

          {config.logoPath && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-2 top-2"
              onClick={(e) => {
                e.stopPropagation();
                setConfig((prev) => ({ ...prev, logoPath: null }));
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">Nombre de la empresa (opcional)</Label>
        <Input
          id="companyName"
          placeholder="Ej: Luprintech"
          value={config.companyName || ''}
          onChange={(e) => setConfig((prev) => ({ ...prev, companyName: e.target.value }))}
        />
      </div>

      <div className="space-y-3 rounded-lg border border-border/70 p-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Redes sociales</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfig((prev) => ({
              ...prev,
              socialLinks: [...(prev.socialLinks ?? []), { network: 'instagram', url: '' }],
            }))}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />Añadir
          </Button>
        </div>

        {(config.socialLinks ?? []).length === 0 && (
          <p className="rounded-md border border-dashed py-3 text-center text-xs text-muted-foreground">
            Sin redes añadidas. Pulsa «Añadir» para agregar la primera.
          </p>
        )}

        <div className="space-y-2">
          {(config.socialLinks ?? []).map((link, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={link.network}
                onChange={(e) => {
                  const links = [...(config.socialLinks ?? [])];
                  links[idx] = { ...links[idx], network: e.target.value };
                  setConfig((prev) => ({ ...prev, socialLinks: links }));
                }}
                className="h-9 w-[130px] shrink-0 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {SOCIAL_NETWORKS.map((network) => (
                  <option key={network.key} value={network.key}>{network.label}</option>
                ))}
              </select>
              <Input
                placeholder={NETWORK_PLACEHOLDERS[link.network] ?? 'https://'}
                value={link.url}
                onChange={(e) => {
                  const links = [...(config.socialLinks ?? [])];
                  links[idx] = { ...links[idx], url: e.target.value };
                  setConfig((prev) => ({ ...prev, socialLinks: links }));
                }}
                className="h-9 flex-1 text-sm"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setConfig((prev) => ({
                  ...prev,
                  socialLinks: (prev.socialLinks ?? []).filter((_, i) => i !== idx),
                }))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Plantillas de color</Label>

        <div className="grid grid-cols-2 gap-2">
          {COLOR_PRESETS.map((preset) => (
            <Button key={preset.name} variant="outline" className="justify-start" onClick={() => applyPreset(preset)}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="h-4 w-4 rounded-full border" style={{ background: preset.primary }} />
                  <div className="h-4 w-4 rounded-full border" style={{ background: preset.secondary }} />
                </div>
                <span className="text-sm">{preset.name}</span>
              </div>
            </Button>
          ))}
        </div>

        {userTemplates.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mis plantillas</p>
            {userTemplates.map((tpl) => (
              <div key={tpl.id} className="flex items-center gap-2">
                <Button variant="outline" className="h-9 flex-1 justify-start text-sm" onClick={() => handleApplyTemplate(tpl)}>
                  <div className="mr-2 flex gap-1">
                    <div className="h-4 w-4 rounded-full border" style={{ background: tpl.primary }} />
                    <div className="h-4 w-4 rounded-full border" style={{ background: tpl.secondary }} />
                    <div className="h-4 w-4 rounded-full border" style={{ background: tpl.accent }} />
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

        <div className="flex gap-2 pt-1">
          <Input
            placeholder="Nombre de la plantilla…"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                editingTemplateId ? handleUpdateTemplate() : handleSaveTemplate();
              }
            }}
            className="h-9 text-sm"
          />
          <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={handleSaveTemplate} disabled={!newTemplateName.trim()}>
            <Save className="mr-1.5 h-3.5 w-3.5" />Guardar
          </Button>
          <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={handleUpdateTemplate} disabled={!editingTemplateId || !newTemplateName.trim()}>
            Editar
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">Colores personalizados</Label>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'primaryColor', label: 'Primario', key: 'primaryColor' as const },
            { id: 'secondaryColor', label: 'Secundario', key: 'secondaryColor' as const },
            { id: 'accentColor', label: 'Acento', key: 'accentColor' as const },
          ].map(({ id, label, key }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={id} className="text-sm">{label}</Label>
              <Input
                id={id}
                type="color"
                value={config[key]}
                onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.value }))}
                className="h-10 w-full"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="footerText">Texto del pie de página (opcional)</Label>
        <Textarea
          id="footerText"
          placeholder="Ej: Gracias por confiar en nosotros"
          value={config.footerText || ''}
          onChange={(e) => setConfig((prev) => ({ ...prev, footerText: e.target.value }))}
          rows={3}
        />
      </div>
    </div>
  );
}
