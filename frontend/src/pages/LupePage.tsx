import { useEffect, useRef, useState } from 'react';
import { LupeAuthProvider, useLupeAuth } from '@/context/lupe-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2, LogOut, Plus, Pencil, Trash2, ImagePlus, X, Check,
  ExternalLink, ImageOff, KeyRound, Tag, LayoutList, Eye, EyeOff, Package, Filter,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { httpRequest, HttpClientError } from '@/shared/api/http-client';
import { PaginationBar } from '@/components/ui/pagination-bar';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label_es: string;
  label_en: string;
  color: string;
  badge_cls: string;
  sort_order: number;
}

interface Resource {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  is_ai: number;
  is_free: number;
  is_new: number;
  custom_image: string | null;
  sort_order: number;
  extra_tags: string[];
}

interface ResourceTag {
  id: string;
  label: string;
  badge_cls: string;
  sort_order: number;
}

const EMPTY_RESOURCE: Omit<Resource, 'id' | 'custom_image'> = {
  name: '', description: '', url: '', category: 'utils',
  is_ai: 0, is_free: 0, is_new: 0, sort_order: 99, extra_tags: [],
};

const EMPTY_CATEGORY: Omit<Category, 'id' | 'created_at'> = {
  label_es: '', label_en: '',
  color: 'text-muted-foreground', badge_cls: '', sort_order: 99,
};

type Tab = 'resources' | 'categories' | 'tags' | 'catalog' | 'settings';

// ── Login ──────────────────────────────────────────────────────────────────────

function LoginScreen() {
  const { login } = useLupeAuth();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(user, pass);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="challenge-gradient-text text-4xl font-black">filamentOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Panel de administración</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[24px] border border-border/60 bg-card/50 p-6 backdrop-blur-md"
        >
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Usuario</label>
            <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="usuario" autoComplete="username" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contraseña</label>
            <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
          </div>
          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full rounded-full font-extrabold" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Small shared helpers ───────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors',
        checked
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground',
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', checked ? 'bg-primary' : 'bg-muted-foreground/40')} />
      {label}
    </button>
  );
}

function Badge({ color, children }: { color: 'blue' | 'green' | 'pink'; children: React.ReactNode }) {
  const cls = {
    blue:  'border-blue-400/30 bg-blue-400/10 text-blue-400',
    green: 'border-green-400/30 bg-green-400/10 text-green-400',
    pink:  'border-pink-400/30 bg-pink-400/10 text-pink-400',
  }[color];
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[0.6rem] font-extrabold', cls)}>{children}</span>
  );
}

// ── Resource form modal ────────────────────────────────────────────────────────

interface ResourceFormProps {
  initial?: Resource | null;
  categories: Category[];
  availableTags: ResourceTag[];
  onSave: (data: Omit<Resource, 'id' | 'custom_image'>) => Promise<void>;
  onClose: () => void;
}

function ResourceForm({ initial, categories, availableTags, onSave, onClose }: ResourceFormProps) {
  const [form, setForm] = useState<Omit<Resource, 'id' | 'custom_image'>>(
    initial
      ? { name: initial.name, description: initial.description, url: initial.url, category: initial.category, is_ai: initial.is_ai, is_free: initial.is_free, is_new: initial.is_new, sort_order: initial.sort_order, extra_tags: Array.isArray(initial.extra_tags) ? initial.extra_tags : [] }
      : { ...EMPTY_RESOURCE, category: categories[0]?.id || 'utils' }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [newTag, setNewTag] = useState('');

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-y-auto rounded-[24px] border border-border/60 bg-card p-6 shadow-2xl max-h-[90vh]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground">{initial ? 'Editar recurso' : 'Nuevo recurso'}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-muted/40"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Ej: MakerWorld" />
          </Field>
          <Field label="URL">
            <Input value={form.url} onChange={(e) => set('url', e.target.value)} required placeholder="https://..." type="url" />
          </Field>
          <Field label="Descripción">
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Breve descripción visible en la card..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría">
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="h-9 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label_es}</option>
                ))}
              </select>
            </Field>
            <Field label="Orden">
              <Input type="number" value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} min={0} />
            </Field>
          </div>

          <div className="flex flex-wrap gap-4">
            <Toggle label="IA"     checked={!!form.is_ai}   onChange={(v) => set('is_ai',   v ? 1 : 0)} />
            <Toggle label="Gratis" checked={!!form.is_free} onChange={(v) => set('is_free', v ? 1 : 0)} />
            <Toggle label="Nuevo"  checked={!!form.is_new}  onChange={(v) => set('is_new',  v ? 1 : 0)} />
          </div>

          {/* Etiquetas personalizadas */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Etiquetas adicionales</label>
            {availableTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const selected = (form.extra_tags ?? []).includes(tag.label);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => set('extra_tags', selected
                        ? (form.extra_tags ?? []).filter((t) => t !== tag.label)
                        : [...(form.extra_tags ?? []), tag.label])}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[0.65rem] font-bold transition-colors',
                        selected
                          ? tag.badge_cls || 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(form.extra_tags ?? []).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/30 px-2.5 py-0.5 text-[0.65rem] font-bold text-foreground">
                  {tag}
                  <button type="button" onClick={() => set('extra_tags', (form.extra_tags ?? []).filter((t) => t !== tag))} className="hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const trimmed = newTag.trim();
                    if (trimmed && !(form.extra_tags ?? []).includes(trimmed)) {
                      set('extra_tags', [...(form.extra_tags ?? []), trimmed]);
                    }
                    setNewTag('');
                  }
                }}
                placeholder="Ej: Premium, Beta, Popular... (Enter para añadir)"
                className="h-8 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full px-3 text-xs"
                onClick={() => {
                  const trimmed = newTag.trim();
                  if (trimmed && !(form.extra_tags ?? []).includes(trimmed)) {
                    set('extra_tags', [...(form.extra_tags ?? []), trimmed]);
                  }
                  setNewTag('');
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="rounded-full font-bold" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Image uploader ─────────────────────────────────────────────────────────────

function ImageUploader({ resource, onDone }: { resource: Resource; onDone: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const r = await fetch(`/api/lupe/resources/${resource.id}/image`, { method: 'POST', credentials: 'include', body: fd });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Error');
      onDone();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setUploading(true);
    await fetch(`/api/lupe/resources/${resource.id}/image`, { method: 'DELETE', credentials: 'include' });
    setUploading(false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-1.5">
      {resource.custom_image && (
        <div className="relative h-20 w-32 overflow-hidden rounded-xl border border-border/50">
          <img src={resource.custom_image} alt="" className="h-full w-full object-cover" />
          <button type="button" onClick={handleRemove} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-destructive">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <Button type="button" variant="outline" size="sm" className="rounded-full text-xs" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <ImagePlus className="mr-1.5 h-3 w-3" />}
        {resource.custom_image ? 'Cambiar' : 'Subir imagen'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Resources tab ──────────────────────────────────────────────────────────────

function ResourcesTab({ categories, tags }: { categories: Category[]; tags: ResourceTag[] }) {
  const { logout } = useLupeAuth();
  const [resources, setResources]   = useState<Resource[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterCat, setFilterCat]   = useState<string>('all');
  const [editTarget, setEditTarget] = useState<Resource | null | 'new'>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [loadError, setLoadError]   = useState('');

  async function load() {
    setLoading(true);
    setLoadError('');
    try {
      const data = await httpRequest<unknown>({ url: '/api/lupe/resources', init: { credentials: 'include' } });
      if (!Array.isArray(data)) {
        throw new Error('La respuesta de recursos no es una lista válida');
      }
      setResources(data as Resource[]);
    } catch (err) {
      if (err instanceof HttpClientError && err.status === 401) {
        await logout();
        return;
      }
      setResources([]);
      setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los recursos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(data: Omit<Resource, 'id' | 'custom_image'>) {
    if (editTarget === 'new') {
      const r = await fetch('/api/lupe/resources', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Error al crear');
    } else if (editTarget) {
      const r = await fetch(`/api/lupe/resources/${editTarget.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Error al guardar');
    }
    await load();
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    await fetch(`/api/lupe/resources/${id}`, { method: 'DELETE', credentials: 'include' });
    setDeleteId(null);
    setDeleting(false);
    await load();
  }

  const safeResources = Array.isArray(resources) ? resources : [];
  const visible = filterCat === 'all' ? safeResources : safeResources.filter((r) => r.category === filterCat);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          <button
            type="button"
            onClick={() => setFilterCat('all')}
            className={cn('shrink-0 rounded-full border px-3 py-1 text-xs font-bold transition-colors',
              filterCat === 'all' ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground')}
          >
            Todos ({safeResources.length})
          </button>
          {categories.map((cat) => {
            const count = safeResources.filter((r) => r.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCat(cat.id)}
                className={cn('shrink-0 rounded-full border px-3 py-1 text-xs font-bold transition-colors',
                  filterCat === cat.id ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground')}
              >
                {cat.label_es} ({count})
              </button>
            );
          })}
        </div>
        <Button className="rounded-full font-bold shrink-0 self-start sm:self-auto" onClick={() => setEditTarget('new')}>
          <Plus className="mr-1.5 h-4 w-4" />Nuevo recurso
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {loadError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {loadError}
            </div>
          )}
          {visible.map((res) => {
            const cat = categories.find((c) => c.id === res.category);
            const isDeleting = deleteId === res.id;
            return (
              <div key={res.id} className="flex flex-col gap-3 rounded-[18px] border border-border/50 bg-card/50 p-4 sm:flex-row sm:items-center">
                {/* Thumbnail */}
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-muted/30 sm:h-16 sm:w-24">
                  {res.custom_image
                    ? <img src={res.custom_image} alt={res.name} className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center"><ImageOff className="h-5 w-5 text-muted-foreground/30" /></div>}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn('text-sm font-extrabold text-foreground', cat?.color)}>{res.name}</span>
                    <span className="rounded-full border border-border/40 bg-muted/30 px-2 py-0.5 text-[0.58rem] font-bold text-muted-foreground">
                      {cat?.label_es ?? res.category}
                    </span>
                    {!!res.is_ai   && <Badge color="blue">IA</Badge>}
                    {!!res.is_free && <Badge color="green">Gratis</Badge>}
                    {!!res.is_new  && <Badge color="pink">Nuevo</Badge>}
                    {(Array.isArray(res.extra_tags) ? res.extra_tags : []).slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full border border-border/40 bg-muted/20 px-2 py-0.5 text-[0.55rem] font-extrabold text-foreground/70">{tag}</span>
                    ))}
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{res.description}</p>
                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground/60 hover:text-foreground truncate max-w-full">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{res.url.length > 60 ? res.url.slice(0, 60) + '…' : res.url}</span>
                  </a>
                </div>

                {/* Image uploader + Actions — same row on mobile */}
                <div className="flex items-center gap-2 sm:flex-col sm:shrink-0">
                  <div className="sm:hidden"><ImageUploader resource={res} onDone={load} /></div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setEditTarget(res)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {isDeleting ? (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="destructive" className="h-8 rounded-full px-3 text-xs font-bold" disabled={deleting} onClick={() => handleDelete(res.id)}>
                          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : '¿Seguro?'}
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setDeleteId(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(res.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Desktop image uploader */}
                <div className="hidden sm:block shrink-0"><ImageUploader resource={res} onDone={load} /></div>
              </div>
            );
          })}
          {visible.length === 0 && (
            <div className="rounded-[18px] border border-dashed border-border/50 py-16 text-center text-sm text-muted-foreground">
              Sin recursos en esta categoría
            </div>
          )}
        </div>
      )}

      {editTarget !== null && (
        <ResourceForm
          initial={editTarget === 'new' ? null : editTarget}
          categories={categories}
          availableTags={tags}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}

interface TagFormProps {
  initial?: ResourceTag | null;
  onSave: (data: Omit<ResourceTag, 'id'>) => Promise<void>;
  onClose: () => void;
}

function TagForm({ initial, onSave, onClose }: TagFormProps) {
  const [form, setForm] = useState<Omit<ResourceTag, 'id'>>(
    initial
      ? { label: initial.label, badge_cls: initial.badge_cls, sort_order: initial.sort_order }
      : { label: '', badge_cls: 'border-border/50 bg-muted/20 text-muted-foreground', sort_order: 99 }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[24px] border border-border/60 bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground">{initial ? 'Editar etiqueta' : 'Nueva etiqueta'}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-muted/40"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre">
            <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required placeholder="Ej: Premium" />
          </Field>
          <Field label="Clases del badge">
            <Input value={form.badge_cls} onChange={(e) => setForm((f) => ({ ...f, badge_cls: e.target.value }))} />
          </Field>
          <Field label="Orden">
            <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} min={0} />
          </Field>

          <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
            <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Vista previa</p>
            <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold', form.badge_cls)}>
              {form.label || 'Etiqueta'}
            </span>
          </div>

          {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="rounded-full font-bold" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TagsTab({ tags, onTagsChange }: { tags: ResourceTag[]; onTagsChange: () => void }) {
  const { logout } = useLupeAuth();
  const [editTarget, setEditTarget] = useState<ResourceTag | null | 'new'>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(data: Omit<ResourceTag, 'id'>) {
    if (editTarget === 'new') {
      const r = await fetch('/api/lupe/tags', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (r.status === 401) { await logout(); return; }
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Error al crear');
    } else if (editTarget) {
      const r = await fetch(`/api/lupe/tags/${editTarget.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (r.status === 401) { await logout(); return; }
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Error al guardar');
    }
    onTagsChange();
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    const r = await fetch(`/api/lupe/tags/${id}`, { method: 'DELETE', credentials: 'include' });
    if (r.status === 401) { await logout(); return; }
    setDeleteId(null);
    setDeleting(false);
    onTagsChange();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tags.length} etiqueta{tags.length !== 1 ? 's' : ''} configurada{tags.length !== 1 ? 's' : ''}</p>
        <Button className="rounded-full font-bold" onClick={() => setEditTarget('new')}>
          <Plus className="mr-1.5 h-4 w-4" />Nueva etiqueta
        </Button>
      </div>

      <div className="space-y-2">
        {tags.map((tag) => {
          const isDeleting = deleteId === tag.id;
          return (
            <div key={tag.id} className="flex items-center gap-4 rounded-[18px] border border-border/50 bg-card/50 p-4">
              <div className="shrink-0">
                <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold', tag.badge_cls)}>
                  {tag.label}
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-bold text-foreground">{tag.label}</p>
                <p className="truncate text-[0.65rem] text-muted-foreground/60 font-mono">id: {tag.id} · orden: {tag.sort_order}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setEditTarget(tag)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {isDeleting ? (
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="destructive" className="h-8 rounded-full px-3 text-xs font-bold" disabled={deleting} onClick={() => handleDelete(tag.id)}>
                      {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : '¿Seguro?'}
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setDeleteId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(tag.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {tags.length === 0 && (
          <div className="rounded-[18px] border border-dashed border-border/50 py-16 text-center text-sm text-muted-foreground">
            Sin etiquetas. Crea la primera.
          </div>
        )}
      </div>

      {editTarget !== null && (
        <TagForm
          initial={editTarget === 'new' ? null : editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}

// ── Category form modal ────────────────────────────────────────────────────────

interface CategoryFormProps {
  initial?: Category | null;
  onSave: (data: Omit<Category, 'id'>) => Promise<void>;
  onClose: () => void;
}

function CategoryForm({ initial, onSave, onClose }: CategoryFormProps) {
  const [form, setForm] = useState<Omit<Category, 'id'>>(
    initial
      ? { label_es: initial.label_es, label_en: initial.label_en, color: initial.color, badge_cls: initial.badge_cls, sort_order: initial.sort_order }
      : { ...EMPTY_CATEGORY }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-y-auto rounded-[24px] border border-border/60 bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground">{initial ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-muted/40"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre (ES)">
              <Input value={form.label_es} onChange={(e) => set('label_es', e.target.value)} required placeholder="Ej: Tutoriales" />
            </Field>
            <Field label="Nombre (EN)">
              <Input value={form.label_en} onChange={(e) => set('label_en', e.target.value)} placeholder="Ej: Tutorials" />
            </Field>
          </div>

          <Field label="Color del texto (clase Tailwind)">
            <Input value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="text-teal-400" />
          </Field>

          <Field label="Clases del badge">
            <Input value={form.badge_cls} onChange={(e) => set('badge_cls', e.target.value)} placeholder="border-teal-400/30 bg-teal-400/10 text-teal-400" />
          </Field>

          <Field label="Orden">
            <Input type="number" value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} min={0} />
          </Field>

          {/* Preview */}
          {(form.color || form.badge_cls) && (
            <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
              <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Vista previa</p>
              <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold', form.badge_cls || 'border-border/50 bg-muted/20 text-muted-foreground')}>
                <span className={cn('mr-1.5 h-2 w-2 rounded-full bg-current opacity-70')} />
                {form.label_es || 'Categoría'}
              </span>
            </div>
          )}

          {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="rounded-full font-bold" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Categories tab ─────────────────────────────────────────────────────────────

function CategoriesTab({ categories, onCategoriesChange }: { categories: Category[]; onCategoriesChange: () => void }) {
  const { logout } = useLupeAuth();
  const [editTarget, setEditTarget] = useState<Category | null | 'new'>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);

  async function handleSave(data: Omit<Category, 'id'>) {
    if (editTarget === 'new') {
      const r = await fetch('/api/lupe/categories', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (r.status === 401) { await logout(); return; }
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Error al crear');
    } else if (editTarget) {
      const r = await fetch(`/api/lupe/categories/${editTarget.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (r.status === 401) { await logout(); return; }
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Error al guardar');
    }
    onCategoriesChange();
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    const r = await fetch(`/api/lupe/categories/${id}`, { method: 'DELETE', credentials: 'include' });
    if (r.status === 401) { await logout(); return; }
    setDeleteId(null);
    setDeleting(false);
    onCategoriesChange();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{categories.length} categoría{categories.length !== 1 ? 's' : ''} configurada{categories.length !== 1 ? 's' : ''}</p>
        <Button className="rounded-full font-bold" onClick={() => setEditTarget('new')}>
          <Plus className="mr-1.5 h-4 w-4" />Nueva categoría
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => {
          const isDeleting = deleteId === cat.id;
          return (
            <div key={cat.id} className="flex items-center gap-4 rounded-[18px] border border-border/50 bg-card/50 p-4">
              {/* Preview badge */}
              <div className="shrink-0">
                <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold', cat.badge_cls || 'border-border/50 bg-muted/20 text-muted-foreground')}>
                  {cat.label_es}
                </span>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className={cn('text-sm font-bold', cat.color)}>{cat.label_es} <span className="text-muted-foreground font-normal">/ {cat.label_en}</span></p>
                <p className="truncate text-[0.65rem] text-muted-foreground/60 font-mono">id: {cat.id} · orden: {cat.sort_order}</p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1.5">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setEditTarget(cat)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {isDeleting ? (
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="destructive" className="h-8 rounded-full px-3 text-xs font-bold" disabled={deleting} onClick={() => handleDelete(cat.id)}>
                      {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : '¿Seguro?'}
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setDeleteId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(cat.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="rounded-[18px] border border-dashed border-border/50 py-16 text-center text-sm text-muted-foreground">
            Sin categorías. Crea la primera.
          </div>
        )}
      </div>

      {editTarget !== null && (
        <CategoryForm
          initial={editTarget === 'new' ? null : editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}

// ── Settings tab ───────────────────────────────────────────────────────────────

function SettingsTab() {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving]           = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (newPass !== confirmPass) { setError('Las contraseñas nuevas no coinciden'); return; }
    if (newPass.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/lupe/password', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPass, newPass }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Error al cambiar contraseña');
      setSuccess(true);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="rounded-[20px] border border-border/60 bg-card/50 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <KeyRound className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Cambiar contraseña</h3>
            <p className="text-[0.7rem] text-muted-foreground">La nueva contraseña se guardará en la base de datos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Contraseña actual">
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="••••••••"
                required
                className="pr-10"
              />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field label="Nueva contraseña">
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Mín. 6 caracteres"
                required
                className="pr-10"
              />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field label="Confirmar nueva contraseña">
            <Input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Repite la contraseña"
              required
            />
          </Field>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          )}
          {success && (
            <p className="rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" /> Contraseña actualizada correctamente
            </p>
          )}

          <Button type="submit" className="w-full rounded-full font-bold" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
            Actualizar contraseña
          </Button>
        </form>
      </div>
    </div>
  );
}

interface CatalogFilament {
  id: string;
  source: string;
  brand: string;
  material: string;
  color: string;
  colorHex: string | null;
  imageUrl: string | null;
  customImage: string | null;
  purchaseUrl: string | null;
  finish: string | null;
}

// ── SpoolIcon SVG ──────────────────────────────────────────────────────────────
function SpoolIcon({ colorHex, size = 24 }: { colorHex: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="40" cy="40" r="37" fill="#2a2a2a" />
      <circle cx="40" cy="40" r="35" fill="#404040" />
      <circle cx="40" cy="40" r="30" fill="#383838" />
      <circle cx="40" cy="40" r="29" fill={colorHex} />
      {[25, 21, 17].map((r) => (
        <circle key={r} cx="40" cy="40" r={r} fill="none" stroke="black" strokeOpacity="0.12" strokeWidth="1.2" />
      ))}
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
    </svg>
  );
}

function CatalogTab() {
  const { logout } = useLupeAuth();
  const [filaments, setFilaments] = useState<CatalogFilament[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');
  
  // Filtros
  const [brands, setBrands] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [editTarget, setEditTarget] = useState<CatalogFilament | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Cargar metadatos de filtros
  useEffect(() => {
    async function loadFilters() {
      try {
        const data = await httpRequest<{ brands: string[]; materials: string[] }>({
          url: '/api/filament-catalog/metadata/filters',
          init: { credentials: 'include' },
        });
        setBrands(data.brands);
        setMaterials(data.materials);
      } catch (err) {
        if (err instanceof HttpClientError && err.status === 401) {
          await logout();
        }
      }
    }
    void loadFilters();
  }, []);

  async function loadFilaments() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '50',
      });
      if (selectedBrand) params.set('brand', selectedBrand);
      if (selectedMaterial) params.set('material', selectedMaterial);
      if (colorSearch.trim()) params.set('color', colorSearch.trim());

      const r = await httpRequest<{ items: CatalogFilament[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>({
        url: `/api/filament-catalog?${params.toString()}`,
        init: { credentials: 'include' },
      });
      setFilaments(r.items);
      setPagination(r.pagination);
    } catch (err) {
      if (err instanceof HttpClientError && err.status === 401) {
        await logout();
        return;
      }
      setFilaments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadFilaments(); }, [currentPage, selectedBrand, selectedMaterial, colorSearch]);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage('');
    setSyncError('');
    try {
      const result = await httpRequest<{ success: boolean; imported: number }>({
        url: '/api/filament-catalog/sync',
        init: { method: 'POST', credentials: 'include' },
      });
      setSyncMessage(`✅ Sincronización completa: ${result.imported} filamentos importados.`);
      await loadFilaments();
    } catch (err) {
      if (err instanceof HttpClientError && err.status === 401) {
        await logout();
        return;
      }
      setSyncError(err instanceof HttpClientError ? err.message : 'No se pudo sincronizar');
    } finally {
      setSyncing(false);
    }
  }

  async function handleUpdateUrl(id: string, purchaseUrl: string, customImage: string | null) {
    try {
      await httpRequest({
        url: `/api/filament-catalog/${id}`,
        init: {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purchaseUrl, customImage }),
        },
      });
      await loadFilaments();
      setEditTarget(null);
    } catch (err) {
      if (err instanceof HttpClientError && err.status === 401) {
        await logout();
        return;
      }
      alert(err instanceof HttpClientError ? err.message : 'Error al actualizar');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este filamento del catálogo?')) return;
    try {
      await httpRequest({ url: `/api/filament-catalog/${id}`, init: { method: 'DELETE', credentials: 'include' } });
      await loadFilaments();
    } catch (err) {
      if (err instanceof HttpClientError && err.status === 401) {
        await logout();
        return;
      }
      alert(err instanceof HttpClientError ? err.message : 'Error al eliminar');
    }
  }

  function handleResetFilters() {
    setSelectedBrand('');
    setSelectedMaterial('');
    setColorSearch('');
    setCurrentPage(1);
  }

  const hasFilters = selectedBrand || selectedMaterial || colorSearch;

  return (
    <div className="space-y-3">
      {/* Header con acciones */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">Catálogo global de filamentos</h3>
          <p className="text-xs text-muted-foreground hidden sm:block">Gestiona enlaces de afiliado y añade marcas españolas</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" className="rounded-full font-bold text-xs" onClick={handleSync} disabled={syncing}>
            {syncing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
            Sincronizar
          </Button>
          <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => setAddModalOpen(true)}>
            <Plus className="mr-1 h-3 w-3" />
            Añadir
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => window.open('/filamentos/globales', '_blank')}>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {syncMessage && <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">{syncMessage}</p>}
      {syncError && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{syncError}</p>}

      {/* Filtros */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-xs font-bold text-foreground">Filtros</h4>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="h-8 w-full rounded-full border border-border bg-background px-3 text-xs text-foreground"
            value={selectedBrand}
            onChange={(e) => { setSelectedBrand(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Todas las marcas</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          <select
            className="h-8 w-full rounded-full border border-border bg-background px-3 text-xs text-foreground"
            value={selectedMaterial}
            onChange={(e) => { setSelectedMaterial(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Todos los materiales</option>
            {materials.map((material) => (
              <option key={material} value={material}>{material}</option>
            ))}
          </select>

          <Input
            type="text"
            placeholder="Color..."
            className="h-8 rounded-full text-xs"
            value={colorSearch}
            onChange={(e) => { setColorSearch(e.target.value); setCurrentPage(1); }}
          />

          {hasFilters && (
            <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={handleResetFilters}>
              Limpiar
            </Button>
          )}
        </div>
        {pagination.total > 0 && (
          <p className="text-xs text-muted-foreground">
            {filaments.length} de {pagination.total} filamentos
          </p>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filaments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {hasFilters ? 'No hay filamentos con esos filtros.' : 'No hay filamentos en el catálogo.'}
          </p>
        </div>
      ) : (
        <>
          {/* Filament grid — replaces the table */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filaments.map((fil) => (
              <div key={fil.id} className="flex gap-3 rounded-[18px] border border-border/50 bg-card/50 p-3">
                {/* Image / SpoolIcon */}
                <div className="h-12 w-12 shrink-0">
                  {fil.customImage ? (
                    <img src={fil.customImage} alt={fil.color || ''} className="h-12 w-12 rounded-xl border border-border/60 object-cover" />
                  ) : (
                    <SpoolIcon colorHex={fil.colorHex || '#888'} size={48} />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-foreground truncate">
                        {fil.brand || '—'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {fil.material || '—'} · {fil.color || '—'}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => setEditTarget(fil)}
                        className="h-8 w-8 rounded-lg border border-border/40 flex items-center justify-center hover:bg-muted/50 transition-colors"
                        title="Editar enlace"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      {fil.source === 'manual' && (
                        <button
                          onClick={() => handleDelete(fil.id)}
                          className="h-8 w-8 rounded-lg border border-border/40 flex items-center justify-center hover:bg-destructive/10 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Purchase URL */}
                  <div className="pt-1">
                    {fil.purchaseUrl ? (
                      <a
                        href={fil.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        <ShoppingCart className="h-3 w-3" />
                        <span className="truncate max-w-[180px]">
                          {fil.purchaseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">Sin enlace</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <PaginationBar
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {editTarget && (
        <EditCatalogUrlModal
          filament={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(url, customImage) => handleUpdateUrl(editTarget.id, url, customImage)}
        />
      )}

      {addModalOpen && (
        <AddCatalogFilamentModal
          onClose={() => setAddModalOpen(false)}
          onSave={() => { setAddModalOpen(false); void loadFilaments(); }}
        />
      )}
    </div>
  );
}

function EditCatalogUrlModal({ filament, onClose, onSave }: { filament: CatalogFilament; onClose: () => void; onSave: (url: string, customImage: string | null) => Promise<void> }) {
  const [url, setUrl] = useState(filament.purchaseUrl || '');
  const [customImage, setCustomImage] = useState(filament.customImage || '');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(url, customImage || null);
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setCustomImage(base64);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[24px] border border-border/60 bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground">Editar filamento</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-muted/40"><X className="h-4 w-4" /></button>
        </div>

        <div className="mb-4 rounded-xl border border-border/50 bg-muted/20 p-3">
          <p className="text-sm font-bold text-foreground">{filament.brand}</p>
          <p className="text-xs text-muted-foreground">{filament.material} · {filament.color}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="URL de compra (enlace afiliado Amazon, tienda, etc.)">
            <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </Field>

          <Field label="Imagen personalizada (opcional)">
            <div className="space-y-2">
              {customImage && (
                <div className="relative inline-block">
                  <img src={customImage} alt="Preview" className="h-24 w-24 rounded-lg border border-border object-cover" />
                  <button
                    type="button"
                    onClick={() => setCustomImage('')}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                {customImage ? 'Cambiar imagen' : 'Subir imagen'}
              </Button>
              <p className="text-xs text-muted-foreground">Si no subes imagen, se mostrará la bobina por defecto</p>
            </div>
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="rounded-full font-bold" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddCatalogFilamentModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('#cccccc');
  const [finish, setFinish] = useState('');
  const [purchaseUrl, setPurchaseUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const r = await httpRequest({
        url: '/api/filament-catalog',
        init: {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand, material, color, colorHex, finish: finish || null, purchaseUrl: purchaseUrl || null }),
        },
      });
      onSave();
    } catch (err) {
      setError(err instanceof HttpClientError ? err.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[24px] border border-border/60 bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground">Añadir filamento manual</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-muted/40"><X className="h-4 w-4" /></button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Añade marcas españolas (Sakata, 3DTested, etc.) que no están en FilamentColors.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Marca *">
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej: Sakata 3D" required />
          </Field>

          <Field label="Material *">
            <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Ej: PLA, PETG, ABS" required />
          </Field>

          <Field label="Color *">
            <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Ej: Rojo, Azul cielo" required />
          </Field>

          <Field label="Código hexadecimal del color">
            <div className="flex gap-2">
              <Input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="w-16" />
              <Input type="text" value={colorHex} onChange={(e) => setColorHex(e.target.value)} placeholder="#cccccc" />
            </div>
          </Field>

          <Field label="Acabado (opcional)">
            <Input value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="Ej: matte, silk, marble" />
          </Field>

          <Field label="URL de compra (opcional)">
            <Input type="url" value={purchaseUrl} onChange={(e) => setPurchaseUrl(e.target.value)} placeholder="https://..." />
          </Field>

          {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="rounded-full font-bold" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Añadir
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────

function AdminPanel() {
  const { logout }          = useLupeAuth();
  const [tab, setTab]       = useState<Tab>('resources');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<ResourceTag[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError] = useState('');

  async function loadCategories() {
    setCatsLoading(true);
    setCatsError('');
    try {
      const data = await httpRequest<unknown>({ url: '/api/lupe/categories', init: { credentials: 'include' } });
      if (!Array.isArray(data)) {
        throw new Error('La respuesta de categorías no es una lista válida');
      }
      setCategories(data as Category[]);
    } catch (err) {
      if (err instanceof HttpClientError && err.status === 401) {
        await logout();
        return;
      }
      setCategories([]);
      setCatsError(err instanceof Error ? err.message : 'No se pudieron cargar las categorías');
    } finally {
      setCatsLoading(false);
    }
  }

  useEffect(() => { loadCategories(); }, []);

  async function loadTags() {
    try {
      const data = await httpRequest<unknown>({ url: '/api/lupe/tags', init: { credentials: 'include' } });
      setTags(Array.isArray(data) ? data as ResourceTag[] : []);
    } catch (err) {
      if (err instanceof HttpClientError && err.status === 401) {
        await logout();
        return;
      }
      setTags([]);
    }
  }

  useEffect(() => { void loadTags(); }, []);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'resources',  label: 'Recursos',    icon: <LayoutList className="h-3.5 w-3.5" /> },
    { id: 'categories', label: 'Categorías',  icon: <Tag className="h-3.5 w-3.5" /> },
    { id: 'tags',       label: 'Etiquetas',   icon: <Tag className="h-3.5 w-3.5" /> },
    { id: 'catalog',    label: 'Catálogo',    icon: <Package className="h-3.5 w-3.5" /> },
    { id: 'settings',   label: 'Ajustes',     icon: <KeyRound className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <h1 className="challenge-gradient-text text-xl font-black leading-none">filamentOS</h1>
            <p className="text-[0.7rem] text-muted-foreground">Panel de administración</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Tab bar */}
            <nav className="hidden sm:flex items-center gap-1 rounded-full border border-border/50 bg-muted/20 p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                    tab === t.id
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </nav>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => window.open('/inventario', '_blank')}
            >
              <Package className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Ver filamentos</span>
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={logout}>
              <LogOut className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden flex border-t border-border/50 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1 py-2.5 text-[0.65rem] font-bold whitespace-nowrap transition-colors min-w-0',
                tab === t.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground',
              )}
            >
              {t.icon}
              <span className="max-[400px]:hidden">{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 py-6">
        {catsLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {catsError && tab !== 'catalog' && (
              <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {catsError}
              </div>
            )}
            {tab === 'resources'  && <ResourcesTab categories={categories} tags={tags} />}
            {tab === 'categories' && <CategoriesTab categories={categories} onCategoriesChange={loadCategories} />}
            {tab === 'tags'       && <TagsTab tags={tags} onTagsChange={loadTags} />}
            {tab === 'catalog'    && <CatalogTab />}
            {tab === 'settings'   && <SettingsTab />}
          </>
        )}
      </main>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────

function LupePageContent() {
  const { isAdmin, loading } = useLupeAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <LoginScreen />;
  }

  return <AdminPanel />;
}

export function LupePage() {
  return (
    <LupeAuthProvider>
      <LupePageContent />
    </LupeAuthProvider>
  );
}
