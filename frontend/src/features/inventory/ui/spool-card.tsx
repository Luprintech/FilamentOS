import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, MinusCircle, CheckCircle, ShoppingCart } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Spool } from '../types';
import { isLowStock, getRemainingPercent } from '../types';

interface SpoolCardProps {
  spool: Spool;
  onEdit: (spool: Spool) => void;
  onDelete: (id: string) => void;
  onDeduct: (spool: Spool) => void;
  onFinish: (id: string) => void;
  /** Si true, los botones de acción muestran el candado y llaman a onGuestAction */
  guestMode?: boolean;
  onGuestAction?: () => void;
}

// ── SVG bobina de filamento ────────────────────────────────────────────────────
function SpoolIcon({ colorHex, finished = false, size = 64 }: { colorHex: string; finished?: boolean; size?: number }) {
  const filament = finished ? '#888' : colorHex;
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
      <circle cx="40" cy="40" r="29" fill={filament} />
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

export function SpoolCard({ spool, onEdit, onDelete, onDeduct, onFinish, guestMode = false, onGuestAction }: SpoolCardProps) {
  const { t } = useTranslation();
  const percent = getRemainingPercent(spool);
  const lowStock = isLowStock(spool);
  const finished = spool.status === 'finished';


  const guestTooltip = 'Inicia sesión para gestionar tu inventario';

  function guestBtn(handler: () => void, children: React.ReactNode, extraClass = '') {
    if (guestMode) {
      return (
        <Button
          size="sm"
          variant="outline"
          className={`h-7 cursor-not-allowed rounded-full px-2.5 text-xs opacity-50 ${extraClass}`}
          title={guestTooltip}
          onClick={onGuestAction}
        >
          {children}
        </Button>
      );
    }
    return (
      <Button size="sm" variant="outline" className={`h-7 rounded-full px-2.5 text-xs ${extraClass}`} onClick={handler}>
        {children}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl border p-4 transition-all',
        finished
          ? 'border-border/40 bg-muted/30 opacity-60'
          : lowStock
          ? 'border-orange-400/40 bg-orange-400/5'
          : 'border-border/70 bg-card',
      )}
    >
      {/* Spool icon + info */}
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <SpoolIcon colorHex={spool.colorHex} finished={finished} size={64} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{spool.brand}</p>
          <p className="truncate text-xs text-muted-foreground">
            {spool.material} · {spool.color}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {finished && (
              <span className="rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {t('inventory.finished')}
              </span>
            )}
            {lowStock && !finished && (
              <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                {t('inventory.lowStock')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[0.72rem] text-muted-foreground">
          <span>{t('inventory.remaining')}: <strong className="text-foreground">{spool.remainingG.toFixed(0)} g</strong></span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className={cn('h-2 rounded-full transition-all', finished ? 'bg-muted-foreground/40' : lowStock ? 'bg-orange-400' : 'bg-primary')}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1 text-[0.72rem] text-muted-foreground">
          {t('inventory.totalGrams')}: {spool.totalGrams.toFixed(0)} g · {t('inventory.price')}: {spool.price.toFixed(2)} €
        </p>
      </div>

      {/* Actions */}
      {!finished && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {guestBtn(() => onDeduct(spool), <><MinusCircle className="mr-1 h-3.5 w-3.5" />{t('inventory.deduct')}</>)}
          {guestBtn(() => onFinish(spool.id), <><CheckCircle className="mr-1 h-3.5 w-3.5" />{t('inventory.markFinished')}</>)}
          {spool.shopUrl && (
            <a
              href={spool.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={t('inventory.buyLink')}
              className={cn(
                buttonVariants({ size: 'sm', variant: 'outline' }),
                'h-7 rounded-full px-2.5 text-xs text-primary hover:text-primary',
              )}
            >
              <ShoppingCart className="mr-1 h-3.5 w-3.5" />
              {t('inventory.buyLink')}
            </a>
          )}
          {guestBtn(() => onEdit(spool), <Edit2 className="h-3.5 w-3.5" />)}
          {guestBtn(
            () => onDelete(spool.id),
            <Trash2 className="h-3.5 w-3.5" />,
            'text-destructive hover:text-destructive',
          )}
        </div>
      )}

      {/* Edit/delete when finished */}
      {finished && (
        <div className="mt-3 flex gap-1.5">
          {guestBtn(
            () => onEdit(spool),
            <Edit2 className="h-3.5 w-3.5" />,
          )}
          {guestBtn(
            () => onDelete(spool.id),
            <Trash2 className="h-3.5 w-3.5" />,
            'text-destructive hover:text-destructive',
          )}
        </div>
      )}

      {spool.notes && (
        <p className="mt-2 text-[0.72rem] italic text-muted-foreground line-clamp-2">{spool.notes}</p>
      )}
    </div>
  );
}
