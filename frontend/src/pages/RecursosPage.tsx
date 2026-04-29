import { useEffect, useState } from 'react';
import { Globe, ExternalLink, Cpu, Download, ShoppingCart, Scissors, Wrench, Loader2 } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/page-shell';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ApiCategory {
  id: string;
  label_es: string;
  label_en: string;
  color: string;
  badge_cls: string;
  sort_order: number;
}

interface ResourceLink {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  is_ai: number;
  is_free: number;
  is_new: number;
  custom_image: string | null;
  extra_tags?: string[];
}

// ── Icon map for well-known category ids ──────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ai:       <Cpu className="h-3.5 w-3.5" />,
  models:   <Download className="h-3.5 w-3.5" />,
  filament: <ShoppingCart className="h-3.5 w-3.5" />,
  slicers:  <Scissors className="h-3.5 w-3.5" />,
  utils:    <Wrench className="h-3.5 w-3.5" />,
};

function getCategoryIcon(id: string) {
  return CATEGORY_ICONS[id] ?? <Globe className="h-3.5 w-3.5" />;
}

// ── Screenshot thumbnail helper ────────────────────────────────────────────────

function thumbUrl(url: string) {
  return `https://image.thum.io/get/width/600/crop/340/noanimate/${url}`;
}

function faviconUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return '';
  }
}

// ── ResourceCard ───────────────────────────────────────────────────────────────

function ResourceCard({ resource, categories }: { resource: ResourceLink; categories: ApiCategory[] }) {
  const { t, i18n } = useTranslation();
  const [imgError, setImgError] = useState(false);

  const cat = categories.find((c) => c.id === resource.category);
  const catLabel = cat ? (i18n.language.startsWith('en') ? cat.label_en : cat.label_es) : resource.category;
  const catBadgeCls = cat?.badge_cls || 'border-border/60 bg-muted/40 text-foreground';
  const imgSrc = resource.custom_image || thumbUrl(resource.url);

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-[20px] border border-border/60 bg-card/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`${resource.name} — ${resource.description}`}
    >
      {/* Screenshot */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-muted/30">
        {!imgError ? (
          <img
            src={imgSrc}
            alt={resource.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted/60 to-muted/20">
            <img src={faviconUrl(resource.url)} alt="" className="h-10 w-10 rounded-xl opacity-80" />
            <span className="text-xs font-bold text-muted-foreground">{resource.name}</span>
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Badges top-right */}
        <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1.5">
          {!!resource.is_ai && (
            <span className="rounded-full border border-[hsl(var(--challenge-blue))]/40 bg-black/60 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider text-[hsl(var(--challenge-blue))] backdrop-blur-sm">
              IA
            </span>
          )}
          {!!resource.is_free && (
            <span className="rounded-full border border-[hsl(var(--challenge-green))]/40 bg-black/60 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider text-[hsl(var(--challenge-green))] backdrop-blur-sm">
              {t('recursos.free')}
            </span>
          )}
          {!!resource.is_new && (
            <span className="rounded-full border border-[hsl(var(--challenge-pink))]/40 bg-black/60 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider text-[hsl(var(--challenge-pink))] backdrop-blur-sm">
              NEW
            </span>
          )}
          {(Array.isArray(resource.extra_tags) ? resource.extra_tags : []).map((tag) => (
            <span key={tag} className="rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider text-white/80 backdrop-blur-sm">
              {tag}
            </span>
          ))}
        </div>

        {/* External link icon bottom-right */}
        <div className="absolute bottom-2.5 right-2.5 rounded-full border border-white/[0.15] bg-black/50 p-1.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ExternalLink className="h-3 w-3 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Category badge */}
        <span className={cn('inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold', catBadgeCls)}>
          {getCategoryIcon(resource.category)}
          {catLabel}
        </span>

        {/* Name */}
        <h3 className="text-sm font-extrabold leading-tight text-foreground group-hover:text-primary transition-colors">
          {resource.name}
        </h3>

        {/* Description */}
        <p className="line-clamp-2 text-[0.72rem] leading-relaxed text-muted-foreground">
          {resource.description}
        </p>

        {/* URL chip */}
        <p className="mt-auto truncate pt-1 text-[0.65rem] font-semibold text-muted-foreground/50">
          {new URL(resource.url).hostname.replace('www.', '')}
        </p>
      </div>
    </a>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function RecursosPage() {
  const { t } = useTranslation();
  const [active, setActive]         = useState<string>('all');
  const [resources, setResources]   = useState<ResourceLink[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/resources').then((r) => r.json()).catch(() => []),
      fetch('/api/categories').then((r) => r.json()).catch(() => []),
    ]).then(([res, cats]) => {
      setResources(Array.isArray(res) ? res : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setLoading(false);
    });
  }, []);

  const filtered = active === 'all'
    ? resources
    : resources.filter((r) => r.category === active);

  return (
    <PageShell>
      <PageHeader
        icon={<Globe />}
        badge={t('recursos.badge')}
        title={t('recursos.title')}
        subtitle={t('recursos.subtitle')}
      />

      {/* ── Category filter ── */}
      <div className="flex flex-wrap gap-2">
        {/* All button */}
        <button
          type="button"
          onClick={() => setActive('all')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all',
            active === 'all'
              ? 'border-border/60 bg-muted/40 text-foreground shadow-sm'
              : 'border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground',
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          {t('recursos.cat.all')}
          <span className={cn('rounded-full px-1.5 py-0.5 text-[0.6rem] font-extrabold', active === 'all' ? 'bg-white/20' : 'bg-muted/60')}>
            {resources.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = resources.filter((r) => r.category === cat.id).length;
          const isActive = active === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActive(cat.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all',
                isActive
                  ? cn(cat.badge_cls, 'shadow-sm')
                  : 'border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground',
              )}
            >
              {getCategoryIcon(cat.id)}
              {t(`recursos.cat.${cat.id}`, { defaultValue: cat.label_es })}
              <span className={cn('rounded-full px-1.5 py-0.5 text-[0.6rem] font-extrabold', isActive ? 'bg-white/20' : 'bg-muted/60')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} categories={categories} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
