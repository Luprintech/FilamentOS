import React from 'react';
import { cn } from '@/lib/utils';

export const GRID_ROWS = 3;

export type GridDensity = 'compact' | 'medium' | 'large';
export type GridActionMode = 'compact' | 'medium' | 'large';

export const GRID_DENSITY_OPTIONS: GridDensity[] = ['compact', 'medium', 'large'];

const DENSITY_LABELS: Record<GridDensity, string> = {
  compact: 'Compacto',
  medium: 'Medio',
  large: 'Grande',
};

export const GRID_MIN_CARD_WIDTH: Record<GridDensity, string> = {
  compact: '220px',
  medium: '280px',
  large: '360px',
};

export function getGridActionMode(density: GridDensity): GridActionMode {
  return density;
}

export function getGridColumnsStyle(density: GridDensity): React.CSSProperties {
  return {
    gridTemplateColumns: `repeat(auto-fill, minmax(${GRID_MIN_CARD_WIDTH[density]}, 1fr))`,
  };
}

export function getGridColumnsVars(density: GridDensity): React.CSSProperties {
  return {
    ['--grid-min-width' as string]: GRID_MIN_CARD_WIDTH[density],
  } as React.CSSProperties;
}

interface GridDensityControlProps {
  density: GridDensity;
  onChange: (value: GridDensity) => void;
  className?: string;
}

export function GridDensityControl({ density, onChange, className }: GridDensityControlProps) {
  const densityIndex = GRID_DENSITY_OPTIONS.indexOf(density);
  const progress = (densityIndex / (GRID_DENSITY_OPTIONS.length - 1)) * 100;

  return (
    <div className={cn('rounded-[14px] border border-border/40 bg-card/40 px-2.5 py-2 backdrop-blur-sm', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted-foreground/90">Tamaño</p>
        <p className="text-[0.68rem] font-medium text-foreground/80">{DENSITY_LABELS[density]}</p>
      </div>

      <div>
        <div className="group rounded-full bg-muted/20 px-1.5 py-1.5 transition-colors hover:bg-muted/30">
          <input
            type="range"
            min={0}
            max={GRID_DENSITY_OPTIONS.length - 1}
            step={1}
            value={densityIndex}
            onChange={(e) => onChange(GRID_DENSITY_OPTIONS[Number(e.target.value)] ?? 'compact')}
            aria-label="Tamaño de tarjetas"
            className="grid-density-slider h-1.5 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right, rgba(99,102,241,0.75) 0%, rgba(41,170,225,0.75) ${progress}%, rgba(148,163,184,0.18) ${progress}%, rgba(148,163,184,0.18) 100%)`,
            }}
          />
        </div>
      </div>

      <style>{`
        .grid-density-slider::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 9999px;
          background: transparent;
          border: 0;
        }
        .grid-density-slider::-moz-range-track {
          height: 6px;
          border-radius: 9999px;
          background: transparent;
          border: 0;
        }
        .grid-density-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          margin-top: -4px;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          border: 1.5px solid rgba(255,255,255,0.95);
          background: linear-gradient(135deg, rgba(99,102,241,1), rgba(41,170,225,1));
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .grid-density-slider:hover::-webkit-slider-thumb {
          transform: scale(1.12);
        }
        .grid-density-slider:active::-webkit-slider-thumb {
          box-shadow: 0 0 0 4px rgba(99,102,241,0.16), 0 2px 6px rgba(15, 23, 42, 0.18);
        }
        .grid-density-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          border: 1.5px solid rgba(255,255,255,0.95);
          background: linear-gradient(135deg, rgba(99,102,241,1), rgba(41,170,225,1));
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .grid-density-slider:hover::-moz-range-thumb {
          transform: scale(1.12);
        }
        .grid-density-slider:active::-moz-range-thumb {
          box-shadow: 0 0 0 4px rgba(99,102,241,0.16), 0 2px 6px rgba(15, 23, 42, 0.18);
        }
      `}</style>
    </div>
  );
}

// Card height estimate (px) — all cards have min-height 360px + gap
// Density affects WIDTH, not height
const CARD_HEIGHT_ESTIMATE = 380; // 360px card + 20px gap

export function useGridPageSize(
  containerRef: React.RefObject<HTMLElement>,
  density: GridDensity,
  viewMode: 'grid' | 'list',
  listPageSize = 15,
): number {
  const minWidthPx = parseInt(GRID_MIN_CARD_WIDTH[density]);

  const calc = React.useCallback(
    (containerWidth: number, containerHeight: number): number => {
      if (viewMode !== 'grid') return listPageSize;
      
      // Calculate columns based on width
      const cols = Math.max(1, Math.floor(containerWidth / minWidthPx));
      
      // Calculate rows based on available height
      // Use at least 3 rows, but fill the page if there's more space
      const minRows = 3;
      const maxRowsFromHeight = Math.max(minRows, Math.floor(containerHeight / CARD_HEIGHT_ESTIMATE));
      
      return cols * maxRowsFromHeight;
    },
    [viewMode, minWidthPx, listPageSize],
  );

  const [pageSize, setPageSize] = React.useState<number>(() => {
    if (typeof window === 'undefined') return GRID_ROWS * 3;
    // Initial calculation using viewport height as estimate
    const estimatedHeight = window.innerHeight - 300; // subtract header/nav/footer
    return calc(window.innerWidth, estimatedHeight);
  });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setPageSize(calc(entry.contentRect.width, entry.contentRect.height));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, calc]);

  return pageSize;
}
