import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, ChevronDown, Loader2, Check, Table2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiGetStatsPieces } from '../api/stats-api';
import type { StatsResponse, StatsPieceDetail } from '../types';
import type { StatsFilters } from '../types';

interface StatsExportButtonsProps {
  data: StatsResponse;
  filters: StatsFilters;
}

type ExportState = 'idle' | 'loading' | 'done' | 'error';

// ── Filename ──────────────────────────────────────────────────────────────────

function buildFilename(filters: StatsFilters): string {
  return `filamentOS_${filters.from.replace(/-/g, '')}-${filters.to.replace(/-/g, '')}.xlsx`;
}

// ── Cell style helpers ────────────────────────────────────────────────────────

function hdr(bg: string) {
  return {
    font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: bg } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border:    borderAll('CCCCCC'),
  };
}
function borderAll(c: string) {
  const s = { style: 'thin', color: { rgb: c } };
  return { top: s, bottom: s, left: s, right: s };
}
function cell(even: boolean, align: 'left' | 'right' = 'right') {
  return {
    font:      { sz: 10, name: 'Arial' },
    fill:      { patternType: 'solid', fgColor: { rgb: even ? 'F7F9FC' : 'FFFFFF' } },
    alignment: { horizontal: align, vertical: 'center' },
    border:    { bottom: { style: 'thin', color: { rgb: 'E8ECF0' } }, left: { style: 'thin', color: { rgb: 'E8ECF0' } }, right: { style: 'thin', color: { rgb: 'E8ECF0' } } },
  };
}
function totalStyle() {
  return { font: { bold: true, sz: 10, name: 'Arial' }, fill: { patternType: 'solid', fgColor: { rgb: 'EEF2FF' } }, alignment: { horizontal: 'right' } };
}
function totalLbl() {
  return { font: { bold: true, sz: 10, name: 'Arial' }, fill: { patternType: 'solid', fgColor: { rgb: 'EEF2FF' } }, alignment: { horizontal: 'left' } };
}
function metaKey() { return { font: { bold: true, sz: 10, name: 'Arial', color: { rgb: '444444' } } }; }
function metaVal() { return { font: { sz: 10, name: 'Arial' } }; }
function kpiLabel() { return { font: { bold: true, sz: 10, name: 'Arial', color: { rgb: '64748B' } } }; }
function kpiValue(rgb: string) { return { font: { bold: true, sz: 16, name: 'Arial', color: { rgb } } }; }

function ws_set(ws: XLSX.WorkSheet, r: number, c: number, v: unknown, s?: unknown) {
  const addr = XLSX.utils.encode_cell({ r, c });
  ws[addr] = { v, t: typeof v === 'number' ? 'n' : 's', s } as XLSX.CellObject;
}
function ws_merge(ws: XLSX.WorkSheet, r1: number, c1: number, r2: number, c2: number) {
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

// ── Sheet 1: Resumen ──────────────────────────────────────────────────────────

function buildSummarySheet(data: StatsResponse, filters: StatsFilters): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};

  // Title
  ws_set(ws, 0, 0, 'FilamentOS — Resumen de Estadísticas', { font: { bold: true, sz: 14, name: 'Arial', color: { rgb: '1E293B' } } });
  ws_merge(ws, 0, 0, 0, 5);

  // Metadata
  const sourceLabel = filters.source === 'all' ? 'Todos' : filters.source === 'tracker' ? 'Bitácora' : 'Calculadora';
  const granLabel   = filters.granularity === 'day' ? 'Diario' : filters.granularity === 'week' ? 'Semanal' : 'Mensual';
  const meta: [string, string][] = [
    ['Generado',   new Date().toLocaleString()],
    ['Período',    `${filters.from}  →  ${filters.to}`],
    ['Proyecto',   filters.projectId === 'all' ? 'Todos' : filters.projectId],
    ['Estado',     filters.status === 'all' ? 'Todos' : filters.status],
    ['Agrupación', granLabel],
    ['Origen',     sourceLabel],
  ];
  meta.forEach(([k, v], i) => {
    ws_set(ws, 2 + i, 0, k, metaKey()); ws_set(ws, 2 + i, 1, v, metaVal());
    ws_merge(ws, 2 + i, 1, 2 + i, 5);
  });

  // KPIs
  ws_set(ws, 10, 0, 'KPIs Principales', { font: { bold: true, sz: 12, name: 'Arial', color: { rgb: '1E293B' } } });
  ws_merge(ws, 10, 0, 10, 5);

  const kpis = [
    { label: 'Total de piezas',           value: data.summary.totalPieces,                  fmt: '#,##0',     color: '3B82F6' },
    { label: 'Filamento (kg)',             value: data.summary.totalGrams / 1000,            fmt: '#,##0.000', color: '10B981' },
    { label: 'Coste total (€)',            value: data.summary.totalCost,                    fmt: '#,##0.00',  color: '8B5CF6' },
    { label: 'Tiempo total (h)',           value: data.summary.totalSecs / 3600,             fmt: '#,##0.00',  color: 'F59E0B' },
    { label: 'Coste medio por pieza (€)',  value: data.summary.avgCostPerPiece,              fmt: '#,##0.00',  color: 'EF4444' },
    { label: 'Proyectos activos',          value: data.summary.projectCount,                  fmt: '#,##0',     color: '06B6D4' },
  ];
  kpis.forEach(({ label, value, color }, i) => {
    const row = 12 + i * 2;
    ws_set(ws, row, 0, label, kpiLabel()); ws_merge(ws, row, 0, row, 1);
    ws_set(ws, row, 2, value, kpiValue(color)); ws_merge(ws, row, 2, row, 5);
  });

  // Estado
  const sr = 26;
  ws_set(ws, sr, 0, 'Distribución por Estado', { font: { bold: true, sz: 12, name: 'Arial', color: { rgb: '1E293B' } } });
  ws_merge(ws, sr, 0, sr, 5);
  ['Estado', 'Piezas', '% del total'].forEach((h, c) => ws_set(ws, sr + 1, c, h, hdr('334155')));
  const bs = data.summary.byStatus;
  const tot = data.summary.totalPieces || 1;
  [['Pendiente', bs.pending], ['Impresa', bs.printed], ['Post-procesada', bs.postProcessed], ['Entregada', bs.delivered], ['Fallida', bs.failed]]
    .forEach(([name, count], i) => {
      const e = i % 2 === 0;
      ws_set(ws, sr + 2 + i, 0, name,                                       cell(e, 'left'));
      ws_set(ws, sr + 2 + i, 1, count as number,                            cell(e));
      ws_set(ws, sr + 2 + i, 2, `${(((count as number) / tot) * 100).toFixed(1)}%`, cell(e));
    });

  ws['!ref']  = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 38, c: 5 } });
  ws['!cols'] = [{ wch: 28 }, { wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  return ws;
}

// ── Sheet 2: Evolución temporal ───────────────────────────────────────────────

function buildTimeSeriesSheet(data: StatsResponse): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const headers = ['Período', 'Piezas', 'Filamento (g)', 'Filamento (kg)', 'Coste (€)', 'Tiempo (h)', 'Acum. piezas', 'Acum. coste (€)'];
  headers.forEach((h, c) => ws_set(ws, 0, c, h, hdr('3B82F6')));

  let cumP = 0, cumC = 0;
  data.timeSeries.forEach((p, i) => {
    cumP += p.pieces; cumC += p.cost;
    const e = i % 2 === 0;
    ws_set(ws, 1+i, 0, p.period,                                 cell(e, 'left'));
    ws_set(ws, 1+i, 1, p.pieces,                                 cell(e));
    ws_set(ws, 1+i, 2, parseFloat(p.grams.toFixed(2)),           cell(e));
    ws_set(ws, 1+i, 3, parseFloat((p.grams/1000).toFixed(3)),    cell(e));
    ws_set(ws, 1+i, 4, parseFloat(p.cost.toFixed(2)),            cell(e));
    ws_set(ws, 1+i, 5, parseFloat((p.secs/3600).toFixed(2)),     cell(e));
    ws_set(ws, 1+i, 6, cumP,                                     cell(e));
    ws_set(ws, 1+i, 7, parseFloat(cumC.toFixed(2)),              cell(e));
  });

  const tr = 1 + data.timeSeries.length;
  ws_set(ws, tr, 0, 'TOTAL', totalLbl());
  ws_set(ws, tr, 1, data.summary.totalPieces, totalStyle());
  ws_set(ws, tr, 2, parseFloat(data.summary.totalGrams.toFixed(2)), totalStyle());
  ws_set(ws, tr, 3, parseFloat((data.summary.totalGrams/1000).toFixed(3)), totalStyle());
  ws_set(ws, tr, 4, parseFloat(data.summary.totalCost.toFixed(2)), totalStyle());
  ws_set(ws, tr, 5, parseFloat((data.summary.totalSecs/3600).toFixed(2)), totalStyle());

  ws['!ref']  = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: tr, c: 7 } });
  ws['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
  return ws;
}

// ── Sheet 3: Por proyecto ─────────────────────────────────────────────────────

function buildProjectSheet(data: StatsResponse): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const sorted = [...data.byProject].sort((a, b) => b.cost - a.cost);
  const headers = ['Proyecto', 'Piezas', 'Filamento (g)', 'Filamento (kg)', 'Coste total (€)', 'Coste medio/pieza (€)', 'Tiempo (h)', '% del coste'];
  headers.forEach((h, c) => ws_set(ws, 0, c, h, hdr('8B5CF6')));

  const tc = data.summary.totalCost || 1;
  sorted.forEach((p, i) => {
    const e = i % 2 === 0;
    const avg = p.pieces > 0 ? p.cost / p.pieces : 0;
    ws_set(ws, 1+i, 0, p.title,                                   cell(e, 'left'));
    ws_set(ws, 1+i, 1, p.pieces,                                  cell(e));
    ws_set(ws, 1+i, 2, parseFloat(p.grams.toFixed(2)),            cell(e));
    ws_set(ws, 1+i, 3, parseFloat((p.grams/1000).toFixed(3)),     cell(e));
    ws_set(ws, 1+i, 4, parseFloat(p.cost.toFixed(2)),             cell(e));
    ws_set(ws, 1+i, 5, parseFloat(avg.toFixed(2)),                cell(e));
    ws_set(ws, 1+i, 6, parseFloat((p.secs/3600).toFixed(2)),      cell(e));
    ws_set(ws, 1+i, 7, `${((p.cost/tc)*100).toFixed(1)}%`,        cell(e));
  });

  ws['!ref']  = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 1+sorted.length, c: 7 } });
  ws['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 14 }];
  return ws;
}

// ── Sheet 4: Detalle de piezas ────────────────────────────────────────────────

function buildPiecesSheet(pieces: StatsPieceDetail[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const headers = ['Pieza', 'Label', 'Proyecto / Origen', 'Estado', 'Filamento (g)', 'Filamento (kg)', 'Coste (€)', 'Tiempo (h)', 'Eficiencia (€/h)', 'Fecha'];
  headers.forEach((h, c) => ws_set(ws, 0, c, h, hdr('10B981')));

  const statusMap: Record<string, string> = {
    pending: 'Pendiente', printed: 'Impresa', post_processed: 'Post-procesada',
    postProcessed: 'Post-procesada', delivered: 'Entregada', failed: 'Fallida',
  };

  pieces.forEach((p, i) => {
    const e = i % 2 === 0;
    const eff = p.totalSecs > 0 ? p.totalCost / (p.totalSecs / 3600) : 0;
    ws_set(ws, 1+i, 0, p.name,                                      cell(e, 'left'));
    ws_set(ws, 1+i, 1, p.label || '',                               cell(e, 'left'));
    ws_set(ws, 1+i, 2, p.source === 'calculator' ? 'Calculadora' : (p.projectTitle || ''), cell(e, 'left'));
    ws_set(ws, 1+i, 3, statusMap[p.status] ?? p.status,             cell(e, 'left'));
    ws_set(ws, 1+i, 4, parseFloat(p.totalGrams.toFixed(2)),         cell(e));
    ws_set(ws, 1+i, 5, parseFloat((p.totalGrams/1000).toFixed(3)), cell(e));
    ws_set(ws, 1+i, 6, parseFloat(p.totalCost.toFixed(2)),          cell(e));
    ws_set(ws, 1+i, 7, parseFloat((p.totalSecs/3600).toFixed(2)),   cell(e));
    ws_set(ws, 1+i, 8, parseFloat(eff.toFixed(4)),                  cell(e));
    ws_set(ws, 1+i, 9, p.date ? p.date.slice(0, 10) : '',           cell(e, 'left'));
  });

  ws['!ref']  = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 1+pieces.length, c: 9 } });
  ws['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 14 }];
  return ws;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StatsExportButtons({ data, filters }: StatsExportButtonsProps) {
  const { t }                     = useTranslation();
  const [open, setOpen]           = useState(false);
  const [state, setState]         = useState<ExportState>('idle');
  const menuRef                   = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  function closeMenu() { setOpen(false); }

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      right: Math.max(16, window.innerWidth - rect.right),
    });
  }, [open]);

  async function handleExport() {
    setState('loading');
    closeMenu();
    try {
      // Fetch piece details respecting current filters
      const piecesRes = await apiGetStatsPieces({
        from:      filters.from,
        to:        filters.to,
        projectId: filters.projectId,
        status:    filters.status,
        source:    filters.source,
      });

      const wb = XLSX.utils.book_new();
      wb.Props = { Title: 'FilamentOS — Estadísticas', Author: 'FilamentOS', CreatedDate: new Date() };

      XLSX.utils.book_append_sheet(wb, buildSummarySheet(data, filters),     '📊 Resumen');
      XLSX.utils.book_append_sheet(wb, buildTimeSeriesSheet(data),           '📈 Evolución');
      XLSX.utils.book_append_sheet(wb, buildProjectSheet(data),              '📁 Por Proyecto');
      XLSX.utils.book_append_sheet(wb, buildPiecesSheet(piecesRes.pieces),   '📋 Piezas');

      XLSX.writeFile(wb, buildFilename(filters), { bookType: 'xlsx', compression: true });
      setState('done');
    } catch {
      setState('error');
    }
    setTimeout(() => setState('idle'), 2500);
  }

  const isLoading = state === 'loading';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {t('stats_export_main')}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div
            className="fixed z-[60] w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[16px] border border-border/60 bg-card/95 shadow-2xl backdrop-blur-md"
            style={menuPosition ? { top: menuPosition.top, right: menuPosition.right } : { top: 80, right: 16 }}
          >
            <p className="border-b border-border/40 px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
              {t('stats_export_choose')}
            </p>

            <button
              type="button"
              onClick={handleExport}
              disabled={state !== 'idle'}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed"
            >
              <span className={`mt-0.5 shrink-0 ${state === 'done' ? 'text-emerald-500' : state === 'error' ? 'text-destructive' : 'text-primary'}`}>
                {state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" />
                 : state === 'done'  ? <Check className="h-4 w-4" />
                 : <Table2 className="h-4 w-4" />}
              </span>
              <span>
                <p className="text-xs font-bold text-foreground">Exportar Excel completo</p>
                <p className="text-[0.68rem] text-muted-foreground">
                  Resumen · Evolución · Proyectos · <strong>Detalle de piezas</strong>
                </p>
              </span>
            </button>

            <div className="border-t border-border/40 px-4 py-2.5">
              <p className="text-[0.62rem] text-muted-foreground/60">
                .xlsx · 4 hojas · Filtros aplicados · Excel &amp; LibreOffice
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
