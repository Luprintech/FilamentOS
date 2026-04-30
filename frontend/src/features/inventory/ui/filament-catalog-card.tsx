import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Thermometer, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilamentCatalogItem {
  id: string;
  brand: string;
  material: string;
  color: string;
  colorHex: string | null;
  finish: string | null;
  imageUrl: string | null;
  customImage?: string | null;
  purchaseUrl: string | null;
  metadata: {
    td?: number | null;
    materialName?: string;
  };
}

interface FilamentCatalogCardProps {
  item: FilamentCatalogItem;
  onImport: (item: FilamentCatalogItem) => void;
}

// ── SVG bobina de filamento ────────────────────────────────────────────────────
function SpoolIcon({ colorHex, size = 64 }: { colorHex: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="40" cy="75" rx="26" ry="4" fill="black" opacity="0.18" />
      <circle cx="40" cy="40" r="37" fill="#2a2a2a" />
      <circle cx="40" cy="40" r="35" fill="#404040" />
      <circle cx="40" cy="40" r="30" fill="#383838" />
      <circle cx="40" cy="40" r="29" fill={colorHex} />
      {[25, 21, 17].map((r) => (
        <circle key={r} cx="40" cy="40" r={r} fill="none" stroke="black" strokeOpacity="0.12" strokeWidth="1.2" />
      ))}
      <ellipse cx="31" cy="26" rx="11" ry="6" fill="white" opacity="0.22" transform="rotate(-20 31 26)" />
      <circle cx="40" cy="40" r="14" fill="#2c2c2c" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 40 + 14 * Math.cos(rad);
        const y1 = 40 + 14 * Math.sin(rad);
        const x2 = 40 + 9 * Math.cos(rad);
        const y2 = 40 + 9 * Math.sin(rad);
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#555" strokeWidth="1.5" strokeLinecap="round" />
        );
      })}
      <circle cx="40" cy="40" r="8" fill="#1a1a1a" />
      <circle cx="40" cy="40" r="8" fill="none" stroke="#555" strokeWidth="0.8" />
      <ellipse cx="37" cy="37" rx="3" ry="2" fill="white" opacity="0.15" />
      <circle cx="40" cy="40" r="35" fill="none" stroke="white" strokeOpacity="0.07" strokeWidth="1" />
      <circle cx="40" cy="40" r="29" fill="none" stroke="black" strokeOpacity="0.2" strokeWidth="0.8" />
    </svg>
  );
}

export function FilamentCatalogCard({ item, onImport }: FilamentCatalogCardProps) {
  const { t } = useTranslation();

  return (
    <div className="relative rounded-2xl border border-border/70 bg-card p-4 transition-all hover:border-border hover:shadow-md">
      {/* Spool icon + info */}
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          {item.customImage ? (
            <img src={item.customImage} alt={item.color} className="h-16 w-16 rounded-lg border border-border object-cover" />
          ) : (
            <SpoolIcon colorHex={item.colorHex || '#888888'} size={64} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{item.brand}</p>
          <p className="truncate text-xs text-muted-foreground">
            {item.material} · {item.color}
          </p>
          {item.finish && (
            <span className="mt-1 inline-block rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {item.finish}
            </span>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-3 space-y-1">
        {item.metadata?.td && (
          <div className="flex items-center gap-1.5 text-[0.72rem] text-muted-foreground">
            <Thermometer className="h-3.5 w-3.5" />
            <span>
              <strong className="text-foreground">TD: {item.metadata.td}</strong> (Transmission Distance)
            </span>
          </div>
        )}
        {item.metadata?.materialName && item.metadata.materialName !== item.material && (
          <p className="text-[0.72rem] text-muted-foreground">
            Tipo: {item.metadata.materialName}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant="default"
          className="h-7 rounded-full px-2.5 text-xs font-bold"
          onClick={() => onImport(item)}
        >
          <Download className="mr-1 h-3.5 w-3.5" />
          Importar a mi inventario
        </Button>
        {item.purchaseUrl && (
          <a
            href={item.purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Comprar"
            className={cn(
              'inline-flex h-7 items-center rounded-full border border-border/60 bg-muted/20 px-2.5 text-xs text-primary transition-colors hover:bg-muted/40 hover:text-primary',
            )}
          >
            <ExternalLink className="mr-1 h-3.5 w-3.5" />
            Comprar
          </a>
        )}
      </div>
    </div>
  );
}
