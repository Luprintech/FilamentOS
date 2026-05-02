import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Target, BarChart3, Clock, Weight, Wallet, LayoutGrid, List, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { formatCost, secsToString } from './filament-storage';
import type { FilamentProject } from './filament-types';
import type { ProjectInput } from './use-filament-storage';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/context/currency-context';
import { ImageUpload } from '@/components/ui/image-upload';
import { GridDensityControl, GRID_DENSITY_OPTIONS, getGridActionMode, getResponsiveGridStyle, useGridPageSize, type GridActionMode, type GridDensity } from '@/components/grid-density-control';
import { compressImage } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────
type ProjectSortMode = 'created-desc' | 'created-asc' | 'name-asc' | 'name-desc' | 'pieces-desc' | 'cost-desc' | 'cost-asc';
type ProjectViewMode = 'grid' | 'list';

const GRID_DENSITY_STORAGE_KEY = 'filamentos_tracker_project_grid_density';

const SORT_OPTIONS: [ProjectSortMode, string][] = [
  ['created-desc', 'pm_sort_newest'],
  ['created-asc',  'pm_sort_oldest'],
  ['name-asc',     'pm_sort_nameAsc'],
  ['name-desc',    'pm_sort_nameDesc'],
  ['pieces-desc',  'pm_sort_pieces'],
  ['cost-desc',    'pm_sort_cost'],
  ['cost-asc',     'pm_sort_cost_asc'],
];

function loadGridDensity(): GridDensity {
  if (typeof window === 'undefined') return 'compact';
  const saved = window.localStorage.getItem(GRID_DENSITY_STORAGE_KEY);
  return GRID_DENSITY_OPTIONS.includes(saved as GridDensity) ? (saved as GridDensity) : 'compact';
}

function saveGridDensity(value: GridDensity) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GRID_DENSITY_STORAGE_KEY, value);
}

function sortProjects(projects: FilamentProject[], mode: ProjectSortMode): FilamentProject[] {
  return [...projects].sort((a, b) => {
    switch (mode) {
      case 'name-asc':     return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      case 'name-desc':    return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
      case 'pieces-desc':  return b.totalPieces - a.totalPieces;
      case 'cost-desc':    return b.totalCost - a.totalCost;
      case 'cost-asc':     return a.totalCost - b.totalCost;
      case 'created-asc':  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'created-desc':
      default:             return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
}

// ── Constants ──────────────────────────────────────────────────────────────────

// (CURRENCIES list removed — now managed globally via CurrencyContext)

// ── Project form (inside dialog) ───────────────────────────────────────────────

interface ProjectFormValues {
  title: string;
  description: string;
  coverImage: string;
  goal: string;
  currency: string;
}

interface ProjectFormProps {
  defaultValues?: ProjectFormValues;
  onSubmit: (input: ProjectInput) => void;
  onCancel: () => void;
  submitLabel: string;
}

export function ProjectForm({ defaultValues, onSubmit, onCancel, submitLabel }: ProjectFormProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProjectFormValues>({
    defaultValues: defaultValues ?? {
      title: '', description: '', coverImage: '', goal: '30', currency,
    },
  });

  // Keep hidden currency field in sync with global setting (for new projects)
  React.useEffect(() => {
    if (!defaultValues) {
      setValue('currency', currency);
    }
  }, [currency, defaultValues, setValue]);

  const coverImage = watch('coverImage');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState('');

  async function handleCoverUpload(file: File) {
    try {
      setIsProcessing(true);
      setImageError('');
      const optimized = await compressImage(file, 1200, 0.82);
      setValue('coverImage', optimized);
    } catch {
      setImageError(t('pm_image_error'));
    } finally {
      setIsProcessing(false);
    }
  }

  function handleValid(values: ProjectFormValues) {
    onSubmit({
      title:       values.title.trim(),
      description: values.description.trim(),
      coverImage:  values.coverImage.trim() || null,
      goal:        Math.max(1, parseInt(values.goal, 10) || 1),
      pricePerKg:  0,
      currency:    values.currency,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleValid)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="pm-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t('pm_name')} *
        </Label>
        <Input
          id="pm-title"
          placeholder={t('pm_name_placeholder')}
          {...register('title', { required: t('pm_name_required') })}
        />
        {errors.title && <p className="text-xs font-semibold text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pm-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t('pm_desc')}
        </Label>
        <Input
          id="pm-desc"
          placeholder={t('pm_desc_placeholder')}
          {...register('description')}
        />
      </div>

      <ImageUpload
        imagePreview={coverImage || null}
        isProcessing={isProcessing}
        error={imageError}
        onFileSelect={handleCoverUpload}
        onClear={() => setValue('coverImage', '')}
        label={t('pm_cover')}
        dragPrompt={t('tracker.upload.dragPrompt')}
        dropPrompt={t('tracker.upload.dropPrompt')}
        changeBtn={t('pm_cover_change')}
        uploadBtn={t('pm_cover_upload')}
        hint={t('pm_cover_hint')}
        processingLabel={t('tracker.upload.processing')}
      />

      <div className="space-y-1.5">
        <Label htmlFor="pm-goal" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t('pm_goal')}
        </Label>
        <Input id="pm-goal" type="number" min={1} placeholder="30" {...register('goal')} />
        <p className="text-[0.78rem] text-muted-foreground">{t('pm_goal_hint')}</p>
      </div>

      {/* Hidden currency field — value comes from global CurrencySelector */}
      <input type="hidden" {...register('currency')} />

      <div className="flex gap-2 pt-1">
        <Button type="submit" className="challenge-btn-primary rounded-full font-extrabold">
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-full font-bold">
          {t('pm_cancel')}
        </Button>
      </div>
    </form>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onCreate: () => void;
}

function EmptyState({ onCreate }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-6 rounded-[24px] border border-dashed border-white/[0.12] bg-white/[0.02] px-8 py-16 text-center">
      <div className="challenge-gradient-text text-3xl font-black leading-none sm:text-5xl">TRACKER</div>
      <div className="space-y-1">
        <p className="font-bold text-foreground">{t('pm_empty_title')}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {t('pm_empty_subtitle')}
        </p>
      </div>
      <Button className="challenge-btn-primary rounded-full px-6 font-extrabold" onClick={onCreate}>
        {t('pm_empty_btn')}
      </Button>
    </div>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────────

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  shortLabel?: string;
  onClick: () => void;
  variant?: 'outline' | 'default';
  destructive?: boolean;
  actionMode: GridActionMode;
  /** Cuando true, usa comportamiento responsive: icon-only en móvil, texto desde sm */
  responsiveIconOnly?: boolean;
}

function ActionButton({
  icon,
  label,
  shortLabel,
  onClick,
  variant = 'outline',
  destructive = false,
  actionMode,
  responsiveIconOnly,
}: ActionButtonProps) {
  const compact = actionMode === 'compact';
  const medium = actionMode === 'medium';

  // Modo responsive: icon-only en móvil, texto desde sm
  if (responsiveIconOnly) {
    const button = (
      <Button
        variant={variant}
        size="sm"
        className={cn(
          'rounded-full font-bold',
          'h-[40px] w-[40px] sm:h-9 sm:w-auto sm:px-3',
          destructive && 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive',
          variant === 'default' && 'challenge-btn-primary font-extrabold'
        )}
        onClick={onClick}
        aria-label={label}
        title={label}
      >
        <span className="flex items-center justify-center gap-1.5">
          {icon}
          <span className="hidden sm:inline">{shortLabel ?? label}</span>
        </span>
      </Button>
    );
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="top"><p>{label}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const content = compact ? icon : (
    <>
      {icon}
      <span>{medium ? (shortLabel ?? label) : label}</span>
    </>
  );

  const button = (
    <Button
      variant={variant}
      size="sm"
      className={cn(
        'rounded-full font-bold',
        compact ? 'h-9 w-9 p-0' : 'h-9 px-3',
        destructive && 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive',
        variant === 'default' && 'challenge-btn-primary font-extrabold'
      )}
      onClick={onClick}
      aria-label={label}
      title={label}
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

// ── Main export ────────────────────────────────────────────────────────────────

interface ProjectManagerProps {
  projects: FilamentProject[];
  activeProjectId: string | null;
  onCreate: (input: ProjectInput) => Promise<void> | void;
  onUpdate: (id: string, input: ProjectInput) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onSelect: (id: string) => void;
  onOpenProject: (id: string) => void;
  onGeneratePdf?: (project: FilamentProject) => void;
  /** Cuando true, los botones mutantes llaman a onGuestAction en lugar de abrir diálogos */
  guestMode?: boolean;
  onGuestAction?: () => void;
}

export function ProjectManager({
  projects, activeProjectId, onCreate, onUpdate, onDelete, onSelect, onOpenProject, onGeneratePdf,
  guestMode = false, onGuestAction,
}: ProjectManagerProps) {
  const { t } = useTranslation();
  const iconClass = 'h-4 w-4';
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [createOpen, setCreateOpen]     = useState(false);
  const [editing, setEditing]           = useState<FilamentProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FilamentProject | null>(null);
  const [query, setQuery]               = useState('');
  const [sortMode, setSortMode]         = useState<ProjectSortMode>('created-desc');
  const [viewMode, setViewMode]         = useState<ProjectViewMode>('grid');
  const [gridDensity, setGridDensity]   = useState<GridDensity>(loadGridDensity);
  const [page, setPage]                 = useState(1);
  const pageSize                        = useGridPageSize(gridRef, gridDensity, viewMode, 9);

  React.useEffect(() => {
    saveGridDensity(gridDensity);
  }, [gridDensity]);

  const filteredProjects = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = q
      ? projects.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(q))
      : projects;
    return sortProjects(filtered, sortMode);
  }, [projects, query, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, safePage, pageSize]);

  function handleCreate(input: ProjectInput) {
    onCreate(input);
    setCreateOpen(false);
  }

  function handleUpdate(input: ProjectInput) {
    if (!editing) return;
    onUpdate(editing.id, input);
    setEditing(null);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    onDelete(deleteTarget.id);
    setDeleteTarget(null);
  }

  const actionMode = viewMode === 'grid' ? getGridActionMode(gridDensity) : 'large';

  return (
    <div ref={gridRef} className="w-full animate-fade-in space-y-5">


      {/* ── Page header ── */}
      <div className="challenge-hero relative overflow-hidden rounded-[28px] border border-white/[0.10] p-6 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(var(--challenge-pink)) 0%, transparent 65%)' }}
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-[hsl(var(--challenge-blue))]">
              <BarChart3 className={iconClass} />
              {t('pm_badge')}
            </div>
            <h2 className="challenge-gradient-text text-3xl font-black leading-none sm:text-4xl">
              {t('pm_title')}
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              {t('pm_subtitle')}
            </p>
          </div>
          {projects.length > 0 && (
            <Button
              className="challenge-btn-primary shrink-0 rounded-full px-5 font-extrabold"
              onClick={() => guestMode ? onGuestAction?.() : setCreateOpen(true)}
            >
              {t('pm_new')}
            </Button>
          )}
        </div>
      </div>

      {/* ── Controls bar (only when there are projects) ── */}
      {projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${iconClass}`} />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={t('pm_search')}
              className="challenge-input pl-9"
            />
          </div>

          {/* Sort */}
          <Select
            value={sortMode}
            onValueChange={(value) => { setSortMode(value as ProjectSortMode); setPage(1); }}
          >
            <SelectTrigger className="h-9 w-[11.5rem] rounded-xl border-white/[0.10] bg-card/60 px-3 text-xs font-bold backdrop-blur-md dark:bg-slate-950/80 dark:text-slate-100 dark:ring-offset-slate-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/[0.10] bg-slate-950 text-slate-100 dark:border-white/[0.10] dark:bg-slate-950 dark:text-slate-100">
              {SORT_OPTIONS.map(([value, key]) => (
                <SelectItem key={value} value={value} className="text-xs font-bold focus:bg-white/10 focus:text-slate-100">
                  {t(key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex rounded-xl border border-white/[0.10] bg-card/60 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title={t('pm_view_grid') ?? 'Cuadrícula'}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title={t('pm_view_list') ?? 'Lista'}
            >
              <List className="h-4 w-4" />
            </button>
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
      {projects.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-white/[0.12] bg-white/[0.02] px-4 py-12 text-center text-sm text-muted-foreground">
          {t('pm_no_results')}
        </div>
      ) : (
        <>
        <div
          className={viewMode === 'grid'
            ? 'grid gap-5 transition-all duration-300'
            : 'flex flex-col gap-3'
          }
          style={viewMode === 'grid' ? getResponsiveGridStyle(gridDensity) : undefined}
        >
          {paginated.map((project) => {
            const progressPct = project.goal > 0
              ? Math.min(Math.round((project.totalPieces / project.goal) * 100), 100)
              : 0;

            const metrics = [
              { icon: <BarChart3 className="h-3.5 w-3.5" />, label: t('pm_stat_pieces'),   value: `${project.totalPieces} / ${project.goal}`,          color: 'text-[hsl(var(--challenge-pink))]' },
              { icon: <Clock     className="h-3.5 w-3.5" />, label: t('pm_stat_time'),     value: secsToString(project.totalSecs),                       color: 'text-[hsl(var(--challenge-blue))]' },
              { icon: <Weight    className="h-3.5 w-3.5" />, label: t('pm_stat_filament'), value: `${project.totalGrams.toFixed(1)} g`,                  color: 'text-[hsl(var(--challenge-green))]' },
              { icon: <Wallet    className="h-3.5 w-3.5" />, label: t('pm_stat_cost'),     value: formatCost(project.totalCost, project.currency),       color: 'text-yellow-400' },
            ];

            const actions = (
               // stopPropagation: evita que los botones propaguen el click del card
               <div className="flex flex-shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                   {onGeneratePdf && (
                     <ActionButton
                       icon={<FileText className="h-4 w-4" />}
                       label="Generar PDF"
                       shortLabel="PDF"
                       onClick={() => onGeneratePdf(project)}
                       actionMode={actionMode}
                       responsiveIconOnly={viewMode === 'list'}
                     />
                   )}
                   <ActionButton
                     icon={<Trash2 className="h-4 w-4" />}
                     label={t('delete')}
                     shortLabel={t('delete')}
                     onClick={() => guestMode ? onGuestAction?.() : setDeleteTarget(project)}
                     destructive
                     actionMode={actionMode}
                     responsiveIconOnly={viewMode === 'list'}
                   />
               </div>
             );

            const progressBar = (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, hsl(var(--challenge-pink)), hsl(var(--challenge-blue)))' }} />
              </div>
            );

            if (viewMode === 'list') {
              return (
                <div
                  key={project.id}
                  className="challenge-panel flex cursor-pointer items-center gap-3 rounded-[18px] border border-white/[0.10] bg-white/[0.03] p-3 sm:p-4 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                  onClick={() => onOpenProject(project.id)}
                >
                  {/* Thumbnail — izquierda, flex-shrink-0 */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-white/[0.05] sm:h-16 sm:w-16">
                    {project.coverImage
                      ? <img src={project.coverImage} alt={project.title} className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><Target className="h-6 w-6 text-white/20" /></div>
                    }
                  </div>

                  {/* Info — centro, flex-1 + min-w-0 para evitar cortes */}
                  <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 max-w-full">
                        <h3 className="truncate text-sm font-black text-foreground" title={project.title}>{project.title}</h3>
                        {project.description && <p className="truncate text-xs text-muted-foreground" title={project.description}>{project.description}</p>}
                      </div>
                      <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[0.68rem] font-extrabold text-[hsl(var(--challenge-blue))]">
                        {progressPct}%
                      </span>
                    </div>
                    {progressBar}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 sm:gap-x-4">
                      {metrics.map((m) => (
                        <span key={m.label} className={`flex items-center gap-1 text-[0.68rem] font-bold sm:text-[0.7rem] ${m.color}`}>
                          {m.icon}{m.value}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Acciones — derecha, flex-shrink-0 */}
                  {actions}
                </div>
              );
            }

            // Grid card
            return (
              <div
                key={project.id}
                className="challenge-panel group flex h-full min-h-[390px] cursor-pointer flex-col rounded-[24px] border border-white/[0.10] bg-white/[0.03] transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
                onClick={() => onOpenProject(project.id)}
              >
                {/* Cover */}
                <div className="relative h-40 overflow-hidden rounded-t-[22px] bg-white/[0.05]">
                  {project.coverImage
                    ? <img src={project.coverImage} alt={project.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    : <div className="flex h-full w-full items-center justify-center"><Target className="h-10 w-10 text-white/20" /></div>
                  }
                  <div className="absolute right-3 top-3 rounded-full border border-white/[0.12] bg-black/50 px-2.5 py-1 text-[0.7rem] font-extrabold text-white backdrop-blur-sm">
                    {project.totalPieces}/{project.goal}
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <h3 className="truncate text-base font-black text-foreground">{project.title}</h3>
                    {project.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{project.description}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {metrics.map((s) => (
                      <div key={s.label} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-3">
                        <div className={`mb-0.5 flex items-center gap-1.5 ${s.color}`}>
                          {s.icon}
                          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                        </div>
                        <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[0.7rem] font-bold text-muted-foreground">
                      <span>{t('pm_progress')}</span>
                      <span>{progressPct}%</span>
                    </div>
                    {progressBar}
                  </div>

                  <div className="mt-auto pt-1">{actions}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Pagination ── */}
        <PaginationBar
          page={safePage}
          totalPages={totalPages}
          totalItems={filteredProjects.length}
          itemLabel={t('pm_total_projects', { count: filteredProjects.length }) ?? 'proyectos'}
          onChange={setPage}
        />
        </>
      )}

      {/* ── Create dialog ── */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('pm_dialog_title')}</DialogTitle>
            <DialogDescription>
              {t('pm_dialog_subtitle')}
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitLabel={t('pm_create_btn')}
          />
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tracker_delete_project')}</DialogTitle>
            <DialogDescription>
              {t('tracker_delete_project_confirm', { title: deleteTarget?.title ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full">{t('cancel')}</Button>
            </DialogClose>
            <Button variant="destructive" className="rounded-full" onClick={handleDeleteConfirm}>
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
