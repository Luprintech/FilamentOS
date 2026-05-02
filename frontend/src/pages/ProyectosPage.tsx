import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Trash2, Clock, Weight, Wallet, ImageIcon, FileText,
  LayoutGrid, List, Search, FolderPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { GridDensityControl, GRID_DENSITY_OPTIONS, getResponsiveGridStyle, type GridDensity } from '@/components/grid-density-control';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageShell, PageHeader } from '@/components/page-shell';
import { useAuth } from '@/context/auth-context';
import { useProjects, useDeleteProject } from '@/features/projects/api/use-projects';
import { getGuestProjects, deleteGuestProject, type SavedProject } from '@/features/projects/api/projects-api';
import { buildProjectPdfData } from '@/features/calculator/lib/build-project-pdf-data';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { getGridActionMode, useGridPageSize } from '@/components/grid-density-control';

// ── Constants ──────────────────────────────────────────────────────────────────

type SortMode = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'cost-desc' | 'grams-desc';
type ViewMode  = 'grid' | 'list';

const GRID_DENSITY_STORAGE_KEY = 'filamentos_calculator_project_grid_density';

function loadGridDensity(): GridDensity {
  if (typeof window === 'undefined') return 'compact';
  const saved = window.localStorage.getItem(GRID_DENSITY_STORAGE_KEY);
  return GRID_DENSITY_OPTIONS.includes(saved as GridDensity) ? (saved as GridDensity) : 'compact';
}

function saveGridDensity(value: GridDensity) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GRID_DENSITY_STORAGE_KEY, value);
}

const SORT_OPTIONS: [SortMode, string][] = [
  ['date-desc',  'proj_sort_newest'],
  ['date-asc',   'proj_sort_oldest'],
  ['name-asc',   'proj_sort_nameAsc'],
  ['name-desc',  'proj_sort_nameDesc'],
  ['cost-desc',  'proj_sort_cost'],
  ['grams-desc', 'proj_sort_grams'],
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function secsToString(secs: number): string {
  if (!secs) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}


const STATUS_STYLES: Record<string, string> = {
  pending:        'bg-slate-400/15 text-slate-400 border-slate-400/30',
  printed:        'bg-blue-500/15 text-blue-400 border-blue-500/30',
  post_processed: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  delivered:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  failed:         'bg-red-500/15 text-red-400 border-red-500/30',
};

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const key = status === 'post_processed' ? 'tracker.status.postProcessed' : `tracker.status.${status}`;
  const style = STATUS_STYLES[status] ?? 'bg-muted/40 text-muted-foreground border-border/50';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.62rem] font-bold ${style}`}>
      {t(key as any)}
    </span>
  );
}

function formatCost(cost: number, currency = 'EUR'): string {
  if (!cost) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(cost);
}

function getProjectDisplayDate(project: SavedProject): string | null {
  return project.printedAt || project.createdAt || null;
}

function getProjectDateValue(project: SavedProject): number {
  const dateValue = getProjectDisplayDate(project);
  if (!dateValue) return 0;
  const time = new Date(dateValue).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getProjectMetrics(p: SavedProject) {
  const totalSecs  = (p as any).totalSecs  ?? ((p.printingTimeHours ?? 0) * 3600 + (p.printingTimeMinutes ?? 0) * 60);
  const totalGrams = (p as any).totalGrams ?? (p.filamentWeight ?? 0);
  const totalCost  = (p as any).totalCost  ?? 0;
  return { totalSecs, totalGrams, totalCost };
}

function sortProjects(projects: SavedProject[], mode: SortMode): SavedProject[] {
  return [...projects].sort((a, b) => {
    switch (mode) {
      case 'name-asc':   return a.jobName.localeCompare(b.jobName, undefined, { sensitivity: 'base' });
      case 'name-desc':  return b.jobName.localeCompare(a.jobName, undefined, { sensitivity: 'base' });
      case 'cost-desc':  return (getProjectMetrics(b).totalCost  - getProjectMetrics(a).totalCost);
      case 'grams-desc': return (getProjectMetrics(b).totalGrams - getProjectMetrics(a).totalGrams);
      case 'date-asc':   return getProjectDateValue(a) - getProjectDateValue(b);
      case 'date-desc':
      default:           return getProjectDateValue(b) - getProjectDateValue(a);
    }
  });
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function CardSkeleton({ view }: { view: ViewMode }) {
  if (view === 'list') {
    return (
      <div className="flex items-center gap-4 rounded-[18px] border border-border/50 bg-card/40 p-4 animate-pulse">
        <div className="h-16 w-16 shrink-0 rounded-xl bg-muted/60" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-muted/60" />
          <div className="h-3 w-1/2 rounded bg-muted/40" />
          <div className="h-3 w-2/3 rounded bg-muted/30" />
        </div>
        <div className="h-8 w-24 shrink-0 rounded-full bg-muted/50" />
      </div>
    );
  }
  return (
    <div className="flex flex-col rounded-[24px] border border-border/50 bg-card/40 animate-pulse">
      <div className="h-40 rounded-t-[22px] bg-muted/60" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 rounded bg-muted/60" />
        <div className="h-3 w-full rounded bg-muted/40" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-[12px] bg-muted/40" />)}
        </div>
        <div className="h-9 rounded-full bg-muted/50" />
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ onGo }: { onGo: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-6 rounded-[24px] border border-dashed border-border/50 bg-card/30 px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border/60 bg-muted/40">
        <FolderPlus className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <div className="space-y-1.5">
        <p className="text-lg font-black text-foreground">{t('proj_empty_title') ?? 'Sin proyectos guardados'}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {t('proj_empty_subtitle') ?? 'Calcula el coste de tu primera impresión y guárdala aquí.'}
        </p>
      </div>
      <Button className="rounded-full px-6 font-extrabold" onClick={onGo}>
        {t('proj_empty_btn') ?? 'Ir a la calculadora'}
      </Button>
    </div>
  );
}

// ── Project card ───────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: SavedProject;
  view: ViewMode;
  gridDensity: GridDensity;
  onLoad: (p: SavedProject) => void;
  onOpenPdf: (p: SavedProject) => void;
  onDelete: (p: SavedProject) => void;
}

function ProjectCard({ project, view, gridDensity, onLoad, onOpenPdf, onDelete }: ProjectCardProps) {
  const { t } = useTranslation();
  const { totalSecs, totalGrams, totalCost } = getProjectMetrics(project);
  const actionMode = view === 'grid' ? getGridActionMode(gridDensity) : 'large';
  const compactMetrics = view === 'grid' && gridDensity === 'compact';

  const metrics = [
    { icon: <Clock  className="h-3.5 w-3.5" />, label: t('pm_stat_time'),     value: secsToString(totalSecs),                     color: 'text-[hsl(var(--challenge-blue))]'  },
    { icon: <Weight className="h-3.5 w-3.5" />, label: t('pm_stat_filament'), value: totalGrams ? `${totalGrams.toFixed(1)} g` : '—', color: 'text-[hsl(var(--challenge-green))]' },
    { icon: <Wallet className="h-3.5 w-3.5" />, label: t('pm_stat_cost'),     value: formatCost(totalCost, project.currency),       color: 'text-yellow-400'                    },
  ];

  function ActionButton({
    icon,
    label,
    shortLabel,
    onClick,
    destructive = false,
    primary = false,
  }: {
    icon: React.ReactNode;
    label: string;
    shortLabel?: string;
    onClick: () => void;
    destructive?: boolean;
    primary?: boolean;
  }) {
    const compact = actionMode === 'compact';
    const medium = actionMode === 'medium';
    const content = compact ? icon : (
      <>
        {icon}
        <span>{medium ? (shortLabel ?? label) : label}</span>
      </>
    );

    const button = (
      <Button
        size="sm"
        variant={primary ? 'default' : 'outline'}
        className={cn(
          'rounded-full',
          primary ? 'font-extrabold' : 'font-bold',
          compact ? 'h-9 w-9 p-0' : 'h-9 px-3',
          primary && 'challenge-btn-primary',
          destructive && 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive',
        )}
        onClick={onClick}
      >
        <span className={cn('flex items-center gap-1.5', compact && 'justify-center')}>{content}</span>
      </Button>
    );

    if (!compact) return button;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent><p>{label}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const actions = (
    // stopPropagation: evita que los botones de acción propaguen el click del card
    <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <ActionButton
        icon={<FileText className="h-4 w-4" />}
        label="Customizar PDF"
        shortLabel="PDF"
        onClick={() => onOpenPdf(project)}
      />
      <ActionButton
        icon={<Trash2 className="h-4 w-4" />}
        label={t('delete')}
        shortLabel={t('delete')}
        onClick={() => onDelete(project)}
        destructive
      />
    </div>
  );

  if (view === 'list') {
    return (
      <div
        className="group flex cursor-pointer items-center gap-4 rounded-[18px] border border-border/60 bg-card/50 p-4 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
        onClick={() => onLoad(project)}
      >
        {/* Thumbnail */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted/40">
          {project.projectImage
            ? <img src={project.projectImage} alt={project.jobName} className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground/40" /></div>
          }
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="line-clamp-2 break-words text-sm font-black leading-tight text-foreground sm:text-[0.95rem]">{project.jobName}</p>
          <StatusBadge status={project.status || 'delivered'} t={t} />
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            {metrics.map((m) => (
              <span key={m.label} className={cn('flex items-center gap-1 text-[0.7rem] font-bold', m.color)}>
                {m.icon}{m.value}
              </span>
            ))}
          </div>
          {getProjectDisplayDate(project) && (
            <p className="text-[0.68rem] text-muted-foreground/60">
              {getProjectDisplayDate(project) ? new Date(getProjectDisplayDate(project)!).toLocaleDateString() : '—'}
            </p>
          )}
        </div>

        {actions}
      </div>
    );
  }

  // Grid card
  return (
    <div
      className="group flex h-full min-h-[360px] cursor-pointer flex-col rounded-[24px] border border-border/60 bg-card/50 transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      onClick={() => onLoad(project)}
    >
      {/* Cover */}
      <div className="relative h-40 overflow-hidden rounded-t-[22px] bg-muted/30">
        {project.projectImage
          ? <img src={project.projectImage} alt={project.jobName} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          : <div className="flex h-full w-full items-center justify-center"><ImageIcon className="h-10 w-10 text-muted-foreground/20" /></div>
        }
        {getProjectDisplayDate(project) && (
          <div className="absolute left-3 top-3 rounded-full border border-white/[0.12] bg-black/50 px-2.5 py-1 text-[0.68rem] font-bold text-white backdrop-blur-sm">
            {new Date(getProjectDisplayDate(project)!).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="line-clamp-2 break-words text-sm font-black leading-tight text-foreground sm:text-[0.95rem] xl:text-base">{project.jobName}</h3>
          <StatusBadge status={project.status || 'delivered'} t={t} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-[12px] border border-border/50 bg-muted/20 p-2.5">
              <div className={cn('mb-0.5 flex items-center gap-1', m.color)}>
                {m.icon}
                {!compactMetrics && (
                  <p className="text-[0.66rem] font-bold uppercase tracking-wider text-muted-foreground">{m.label}</p>
                )}
              </div>
              <p className={cn('break-words text-[0.7rem] font-black leading-tight sm:text-xs', m.color)}>{m.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-1">{actions}</div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function ProyectosPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();

  const gridRef = useRef<HTMLDivElement>(null);

  const [query,    setQuery]    = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [gridDensity, setGridDensity] = useState<GridDensity>(loadGridDensity);
  const [page,     setPage]     = useState(1);

  const pageSize = useGridPageSize(gridRef, gridDensity, viewMode);
  const [guestProjects, setGuestProjects] = useState<SavedProject[]>(() => getGuestProjects());

  const { data: serverProjects = [], isLoading } = useProjects(isGuest);
  const deleteProjectMutation = useDeleteProject();

  // Guest: listen for localStorage changes
  React.useEffect(() => {
    if (!isGuest) return;
    const refresh = () => setGuestProjects(getGuestProjects());
    window.addEventListener('storage', refresh);
    window.addEventListener('filamentos:guest-projects-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('filamentos:guest-projects-updated', refresh);
    };
  }, [isGuest]);

  const allProjects = isGuest ? guestProjects : serverProjects;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = q ? allProjects.filter((p) => p.jobName.toLowerCase().includes(q)) : allProjects;
    return sortProjects(list, sortMode);
  }, [allProjects, query, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  function handleLoad(project: SavedProject) {
    navigate('/calculadora', { state: { project } });
  }

  function handleOpenPdf(project: SavedProject) {
    navigate('/calculadora/pdf', {
      state: {
        project,
        projectData: buildProjectPdfData(project),
      },
    });
  }

  function handleDelete(project: SavedProject) {
    if (!window.confirm(t('delete_confirm', { name: project.jobName }))) return;
    if (isGuest) {
      deleteGuestProject(project.id);
      setGuestProjects(getGuestProjects());
      return;
    }
    deleteProjectMutation.mutate(project.id);
  }

  const showSkeletons = isLoading && !isGuest;

  React.useEffect(() => {
    saveGridDensity(gridDensity);
    setPage(1);
  }, [gridDensity]);

  React.useEffect(() => {
    setPage(1);
  }, [viewMode]);

  return (
    <PageShell innerRef={gridRef}>
      <PageHeader
        icon={<FolderOpen />}
        badge={t('proj_badge') ?? 'Calculadora'}
        title={t('proj_title') ?? 'Proyectos guardados'}
        subtitle={t('proj_subtitle') ?? 'Historial de cálculos guardados. Carga uno para retomar donde lo dejaste.'}
        actions={
          <Button
            className="rounded-full font-extrabold"
            onClick={() => navigate('/calculadora')}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            {t('proj_back_to_calculator') ?? 'Volver a la calculadora'}
          </Button>
        }
      />

      {/* ── Controls ── */}
      {(showSkeletons || allProjects.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={t('saved_projects_search')}
              className="pl-9"
            />
          </div>
          <select
            value={sortMode}
            onChange={(e) => { setSortMode(e.target.value as SortMode); setPage(1); }}
            className="h-9 rounded-xl border border-border/60 bg-card/60 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {SORT_OPTIONS.map(([value, key]) => (
              <option key={value} value={value}>{t(key)}</option>
            ))}
          </select>
          <div className="flex rounded-xl border border-border/60 bg-card/60 p-0.5">
            {(['grid', 'list'] as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setViewMode(v)}
                className={cn(
                  'rounded-lg p-1.5 transition-colors',
                  viewMode === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
                title={v === 'grid' ? (t('pm_view_grid') ?? 'Cuadrícula') : (t('pm_view_list') ?? 'Lista')}
              >
                {v === 'grid' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </button>
            ))}
          </div>
          {viewMode === 'grid' && (
            <GridDensityControl
              density={gridDensity}
              onChange={setGridDensity}
              className="ml-auto hidden min-w-[280px] xl:block"
            />
          )}
        </div>
      )}

      {/* ── Content ── */}
      {showSkeletons ? (
        <div className={viewMode === 'grid'
          ? 'grid gap-5 transition-all duration-300'
          : 'flex flex-col gap-3'
        } style={viewMode === 'grid' ? getResponsiveGridStyle(gridDensity) : undefined}>
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} view={viewMode} />)}
        </div>
      ) : allProjects.length === 0 ? (
        <EmptyState onGo={() => navigate('/calculadora')} />
      ) : filtered.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-border/50 bg-card/30 px-4 py-12 text-center text-sm text-muted-foreground">
          {t('pm_no_results')}
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid'
            ? 'grid gap-5 transition-all duration-300'
            : 'flex flex-col gap-3'
          } style={viewMode === 'grid' ? getResponsiveGridStyle(gridDensity) : undefined}>
            {paginated.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                view={viewMode}
                gridDensity={gridDensity}
                onLoad={handleLoad}
                onOpenPdf={handleOpenPdf}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* ── Pagination ── */}
          <PaginationBar
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemLabel={t('proj_count') ?? 'proyectos'}
            onChange={setPage}
          />
        </>
      )}
    </PageShell>
  );
}
