import React, { useState, useEffect, useRef } from 'react';
import { User, Settings, Shield, Globe, DollarSign, Palette, Ruler, Scale, KeyRound, Trash2, Mail, ShieldCheck, FolderOpen, Layers, Package, Loader2, Check, AlertTriangle, X, LogOut, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { CURRENCIES, useCurrency } from '@/context/currency-context';
import { usePreferences } from '@/hooks/use-preferences';
import { CircleFlag } from 'react-circle-flags';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  hasPassword: boolean;
  isGoogleAccount: boolean;
  stats: {
    projects: number;
    pieces: number;
    spools: number;
  };
}

// ── Language data ──────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'es', label: 'Español', country: 'es' },
  { code: 'en', label: 'English', country: 'gb' },
  { code: 'pt', label: 'Português', country: 'br' },
  { code: 'fr', label: 'Français', country: 'fr' },
  { code: 'de', label: 'Deutsch', country: 'de' },
  { code: 'it', label: 'Italiano', country: 'it' },
] as const;

// ── Currency groups ────────────────────────────────────────────────────────────

const EUROPE_CODES  = ['EUR','GBP','CHF','SEK','NOK','DKK','PLN','CZK','HUF','RON'];
const NORTH_AM_CODES = ['USD','CAD'];
const LATAM_CODES   = ['MXN','BRL','ARS','CLP','COP','PEN','UYU','BOB','PYG','DOP','GTQ','CRC','HNL','NIO','CUP'];
const OTHER_CODES   = ['JPY'];

const CURRENCY_GROUPS = [
  { labelKey: 'currency_group_europe',   codes: EUROPE_CODES },
  { labelKey: 'currency_group_north_am', codes: NORTH_AM_CODES },
  { labelKey: 'currency_group_latam',    codes: LATAM_CODES },
  { labelKey: 'currency_group_other',    codes: OTHER_CODES },
];

// ── Section type ───────────────────────────────────────────────────────────────

type SectionKey = 'profile' | 'preferences' | 'security';

// ── Feedback message ──────────────────────────────────────────────────────────

function Feedback({ kind, message }: { kind: 'success' | 'error'; message: string }) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold',
      kind === 'success'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
        : 'border-destructive/30 bg-destructive/10 text-destructive',
    )}>
      {kind === 'success' ? <Check className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
      {message}
    </div>
  );
}

// ── Stat pill ──────────────────────────────────────────────────────────────────

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-[14px] border border-border/50 bg-muted/20 px-3 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-lg font-black text-foreground">{value}</span>
      <span className="text-[0.65rem] font-bold text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { i18n, t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { preferences: serverPrefs, loading: loadingPrefs, updatePreferences, saving: savingPrefs } = usePreferences();

  const [activeSection, setActiveSection] = useState<SectionKey>('preferences');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Local preferences state (draft)
  const [localPrefs, setLocalPrefs] = useState(serverPrefs);
  const [prefsFeedback, setPrefsFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  // Sync local state when server preferences load
  React.useEffect(() => {
    setLocalPrefs(serverPrefs);
  }, [serverPrefs]);

  // Name
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameFeedback, setNameFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [savingName, setSavingName] = useState(false);

  // Password
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passFeedback, setPassFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [savingPass, setSavingPass] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteFeedback, setDeleteFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  // Photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoadingProfile(true);
    fetch('/api/user/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setProfile(data);
        setNewName(data.name ?? '');
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [user]);

  async function handleSaveName() {
    if (!newName.trim()) return;
    setSavingName(true);
    setNameFeedback(null);
    try {
      const r = await fetch('/api/user/name', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Error al guardar.');
      setProfile((p) => p ? { ...p, name: data.name } : p);
      setNameFeedback({ kind: 'success', message: 'Nombre actualizado.' });
      setEditingName(false);
    } catch (e: unknown) {
      setNameFeedback({ kind: 'error', message: e instanceof Error ? e.message : 'Error al guardar.' });
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword() {
    setPassFeedback(null);
    if (!currentPass || !newPass || !confirmPass) {
      setPassFeedback({ kind: 'error', message: 'Rellena todos los campos.' }); return;
    }
    if (newPass !== confirmPass) {
      setPassFeedback({ kind: 'error', message: 'Las contraseñas nuevas no coinciden.' }); return;
    }
    if (newPass.length < 6) {
      setPassFeedback({ kind: 'error', message: 'La nueva contraseña debe tener al menos 6 caracteres.' }); return;
    }
    setSavingPass(true);
    try {
      const r = await fetch('/api/user/password', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Error al cambiar contraseña.');
      setPassFeedback({ kind: 'success', message: 'Contraseña cambiada correctamente.' });
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (e: unknown) {
      setPassFeedback({ kind: 'error', message: e instanceof Error ? e.message : 'Error.' });
    } finally {
      setSavingPass(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'ELIMINAR') {
      setDeleteFeedback({ kind: 'error', message: 'Escribe ELIMINAR para confirmar.' }); return;
    }
    setDeleting(true);
    setDeleteFeedback(null);
    try {
      const r = await fetch('/api/user', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'ELIMINAR' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Error al eliminar la cuenta.');
      await logout();
    } catch (e: unknown) {
      setDeleteFeedback({ kind: 'error', message: e instanceof Error ? e.message : 'Error.' });
      setDeleting(false);
    }
  }

  async function handleSavePreferences() {
    setPrefsFeedback(null);
    try {
      await updatePreferences(localPrefs);
      setPrefsFeedback({ kind: 'success', message: 'Preferencias guardadas correctamente.' });
    } catch (e: unknown) {
      setPrefsFeedback({ kind: 'error', message: e instanceof Error ? e.message : 'Error al guardar preferencias.' });
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setPhotoFeedback({ kind: 'error', message: 'La imagen no puede superar los 10 MB.' });
      return;
    }

    // Validar tipo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoFeedback({ kind: 'error', message: 'Solo se permiten imágenes PNG, JPG o WebP.' });
      return;
    }

    setPhotoFeedback(null);
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const r = await fetch('/api/user/photo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Error al subir la imagen.');

      // Actualizar foto en el perfil
      setProfile((p) => p ? { ...p, photo: data.photo } : p);
      setPhotoFeedback({ kind: 'success', message: 'Foto actualizada correctamente.' });

      // Limpiar input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: unknown) {
      setPhotoFeedback({ kind: 'error', message: e instanceof Error ? e.message : 'Error al subir la imagen.' });
    } finally {
      setUploadingPhoto(false);
    }
  }

  const initials = (profile?.name ?? profile?.email ?? '?').charAt(0).toUpperCase();

  const sidebarItems = [
    { key: 'profile' as SectionKey, icon: <User className="h-4 w-4" />, label: 'Mi perfil' },
    { key: 'preferences' as SectionKey, icon: <Settings className="h-4 w-4" />, label: 'Preferencias' },
    { key: 'security' as SectionKey, icon: <Shield className="h-4 w-4" />, label: 'Seguridad' },
  ];

  return (
    <div className="flex gap-6">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-64 flex-col gap-2">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-md dark:border-white/10">
          <h3 className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Mi cuenta
          </h3>
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-bold transition-colors',
                activeSection === item.key
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {/* ── Separador ── */}
          <hr className="my-2 border-border/50" />

          {/* ── Cerrar sesión ── */}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-bold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1">
        {/* Mobile selector */}
        <div className="md:hidden mb-6">
          <Select value={activeSection} onValueChange={(v) => setActiveSection(v as SectionKey)}>
            <SelectTrigger className="w-full">
              {(() => {
                const active = sidebarItems.find((i) => i.key === activeSection);
                return active ? (
                  <span className="flex items-center gap-2">
                    {active.icon}
                    {active.label}
                  </span>
                ) : (
                  <SelectValue />
                );
              })()}
            </SelectTrigger>
            <SelectContent>
              {sidebarItems.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                    {item.key === activeSection && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mobile logout */}
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-left text-sm font-bold text-muted-foreground backdrop-blur-md transition-colors hover:bg-destructive/10 hover:text-destructive dark:border-white/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>

        {loadingProfile || loadingPrefs ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* ──────────────────────────────────────────────────────────────── */}
            {/* MI PERFIL */}
            {/* ──────────────────────────────────────────────────────────────── */}
            {activeSection === 'profile' && profile && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Mi perfil</h1>
                  <p className="text-sm text-muted-foreground">Información de tu cuenta</p>
                </div>

                {/* Avatar + info */}
                <div className="rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-md dark:border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      {profile.photo ? (
                        <img src={profile.photo} alt={profile.name ?? ''} className="h-16 w-16 rounded-full border border-border/60 object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-2xl font-black text-foreground">
                          {initials}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Cambiar foto"
                      >
                        {uploadingPhoto ? (
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        ) : (
                          <Camera className="h-5 w-5 text-white" />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      {editingName ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                            className="h-9 text-sm"
                            autoFocus
                          />
                          <Button size="sm" className="h-9 rounded-full px-4" onClick={handleSaveName} disabled={savingName}>
                            {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          </Button>
                          <Button size="sm" variant="outline" className="h-9 rounded-full px-4" onClick={() => setEditingName(false)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setEditingName(true); setNameFeedback(null); }}
                          className="group flex items-center gap-2 text-left"
                        >
                          <span className="text-lg font-extrabold text-foreground group-hover:text-primary transition-colors">
                            {profile.name ?? 'Sin nombre'}
                          </span>
                          <span className="text-[0.65rem] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                            editar
                          </span>
                        </button>
                      )}
                      {nameFeedback && <Feedback kind={nameFeedback.kind} message={nameFeedback.message} />}
                      {profile.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{profile.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{profile.isGoogleAccount ? 'Cuenta Google' : 'Cuenta con contraseña'}</span>
                      </div>
                    </div>
                  </div>
                  {photoFeedback && (
                    <div className="mt-3">
                      <Feedback kind={photoFeedback.kind} message={photoFeedback.message} />
                    </div>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Haz clic en la foto para cambiarla. Máximo 10 MB.
                    {profile.isGoogleAccount && ' Puedes reemplazar la foto de Google.'}
                  </p>
                </div>

                {/* Stats */}
                <div className="rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-md dark:border-white/10">
                  <h3 className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Mis datos
                  </h3>
                  <div className="flex gap-3">
                    <StatPill icon={<FolderOpen className="h-4 w-4" />} label="Proyectos" value={profile.stats.projects} />
                    <StatPill icon={<Layers className="h-4 w-4" />} label="Piezas" value={profile.stats.pieces} />
                    <StatPill icon={<Package className="h-4 w-4" />} label="Bobinas" value={profile.stats.spools} />
                  </div>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────────── */}
            {/* PREFERENCIAS */}
            {/* ──────────────────────────────────────────────────────────────── */}
            {activeSection === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Preferencias</h1>
                  <p className="text-sm text-muted-foreground">Personaliza tu experiencia en FilamentOS</p>
                </div>

                {/* 1. Apariencia */}
                <div className="rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-md dark:border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Apariencia</h3>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground">Tema</label>
                    <Select value={resolvedTheme ?? 'dark'} onValueChange={setTheme}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">☀️ Claro</SelectItem>
                        <SelectItem value="dark">🌙 Oscuro</SelectItem>
                        <SelectItem value="system">💻 Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 2. Regional */}
                <div className="rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-md dark:border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Regional</h3>
                  </div>
                  <div className="space-y-4">
                    {/* Idioma */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Idioma</label>
                      <Select value={i18n.resolvedLanguage ?? 'es'} onValueChange={(value) => i18n.changeLanguage(value)}>
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <span className="flex items-center gap-2">
                                <CircleFlag countryCode={lang.country} height="16" width="16" />
                                {lang.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Moneda */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Moneda</label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {CURRENCY_GROUPS.map((group) => {
                            const items = CURRENCIES.filter((c) => group.codes.includes(c.code));
                            return (
                              <SelectGroup key={group.labelKey}>
                                <SelectLabel className="text-xs font-black uppercase tracking-wider text-muted-foreground/70 px-2 py-1">
                                  {t(group.labelKey)}
                                </SelectLabel>
                                {items.map((c) => (
                                  <SelectItem key={c.code} value={c.code}>
                                    <span className="flex items-center gap-2">
                                      <span className="w-8 text-right tabular-nums font-mono text-muted-foreground text-xs">
                                        {c.symbol}
                                      </span>
                                      <span className="font-bold">{c.code}</span>
                                      <span className="text-muted-foreground text-xs">— {c.name}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Formato de fecha */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Formato de fecha</label>
                      <Select 
                        value={localPrefs.dateFormat} 
                        onValueChange={(value) => setLocalPrefs(p => ({ ...p, dateFormat: value as typeof p.dateFormat }))}
                      >
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dd-mm-yyyy">DD/MM/AAAA</SelectItem>
                          <SelectItem value="mm-dd-yyyy">MM/DD/AAAA</SelectItem>
                          <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 3. Medidas */}
                <div className="rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-md dark:border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Ruler className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Medidas</h3>
                  </div>
                  <div className="space-y-4">
                    {/* Longitud */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Unidad de longitud</label>
                      <Select 
                        value={localPrefs.lengthUnit} 
                        onValueChange={(value) => setLocalPrefs(p => ({ ...p, lengthUnit: value as typeof p.lengthUnit }))}
                      >
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm">Milímetros (mm)</SelectItem>
                          <SelectItem value="cm">Centímetros (cm)</SelectItem>
                          <SelectItem value="in">Pulgadas (in)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Peso */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Unidad de peso</label>
                      <Select 
                        value={localPrefs.weightUnit} 
                        onValueChange={(value) => setLocalPrefs(p => ({ ...p, weightUnit: value as typeof p.weightUnit }))}
                      >
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">Gramos (g)</SelectItem>
                          <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                          <SelectItem value="oz">Onzas (oz)</SelectItem>
                          <SelectItem value="lb">Libras (lb)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Botón guardar + feedback */}
                {prefsFeedback && <Feedback kind={prefsFeedback.kind} message={prefsFeedback.message} />}
                <Button
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                  className="w-full rounded-full font-bold"
                  size="lg"
                >
                  {savingPrefs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Guardar preferencias
                </Button>
              </div>
            )}

            {/* ──────────────────────────────────────────────────────────────── */}
            {/* SEGURIDAD */}
            {/* ──────────────────────────────────────────────────────────────── */}
            {activeSection === 'security' && profile && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Seguridad</h1>
                  <p className="text-sm text-muted-foreground">Protege tu cuenta</p>
                </div>

                {/* Cambiar contraseña */}
                {profile.hasPassword && !profile.isGoogleAccount && (
                  <div className="rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-md dark:border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                      <KeyRound className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">Cambiar contraseña</h3>
                    </div>
                    <div className="space-y-3">
                      <Input
                        type="password"
                        placeholder="Contraseña actual"
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        className="h-10"
                      />
                      <Input
                        type="password"
                        placeholder="Nueva contraseña (mín. 6 caracteres)"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="h-10"
                      />
                      <Input
                        type="password"
                        placeholder="Confirmar nueva contraseña"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleChangePassword(); }}
                        className="h-10"
                      />
                      {passFeedback && <Feedback kind={passFeedback.kind} message={passFeedback.message} />}
                      <Button
                        size="default"
                        className="w-full rounded-full font-bold"
                        onClick={handleChangePassword}
                        disabled={savingPass}
                      >
                        {savingPass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                        Cambiar contraseña
                      </Button>
                    </div>
                  </div>
                )}

                {/* Zona de peligro */}
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <h3 className="text-sm font-bold text-destructive">Zona de peligro</h3>
                  </div>
                  {!showDeleteSection ? (
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 font-bold"
                      onClick={() => setShowDeleteSection(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar mi cuenta
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-destructive">
                        ⚠️ Esta acción es permanente e irreversible. Se eliminarán todos tus proyectos, piezas de bitácora, inventario y datos.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Escribe <strong className="text-foreground">ELIMINAR</strong> para confirmar:
                      </p>
                      <Input
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="ELIMINAR"
                        className="h-10 border-destructive/40 font-mono"
                      />
                      {deleteFeedback && <Feedback kind={deleteFeedback.kind} message={deleteFeedback.message} />}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="default"
                          className="flex-1 rounded-full font-bold"
                          onClick={() => { setShowDeleteSection(false); setDeleteConfirm(''); setDeleteFeedback(null); }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          size="default"
                          className="flex-1 rounded-full font-bold"
                          onClick={handleDeleteAccount}
                          disabled={deleting || deleteConfirm !== 'ELIMINAR'}
                        >
                          {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          Eliminar cuenta
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
