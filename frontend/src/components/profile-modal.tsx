import React, { useState, useEffect } from 'react';
import { KeyRound, Trash2, User, Mail, ShieldCheck, BarChart3, Package, FolderOpen, Layers, Loader2, Check, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
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

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
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

// ── Main modal ────────────────────────────────────────────────────────────────

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user, logout } = useAuth();

  const [profile, setProfile]             = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Name
  const [editingName, setEditingName]     = useState(false);
  const [newName, setNewName]             = useState('');
  const [nameFeedback, setNameFeedback]   = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [savingName, setSavingName]       = useState(false);

  // Password
  const [currentPass, setCurrentPass]   = useState('');
  const [newPass, setNewPass]           = useState('');
  const [confirmPass, setConfirmPass]   = useState('');
  const [passFeedback, setPassFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [savingPass, setSavingPass]     = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm]   = useState('');
  const [deleteFeedback, setDeleteFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [deleting, setDeleting]             = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoadingProfile(true);
    fetch('/api/user/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setProfile(data);
        setNewName(data.name ?? '');
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [open, user]);

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

  const initials = (profile?.name ?? profile?.email ?? '?').charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Mi perfil
          </DialogTitle>
          <DialogDescription>Gestiona tu cuenta y preferencias.</DialogDescription>
        </DialogHeader>

        {loadingProfile ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : profile ? (
          <div className="space-y-6 pt-1">

            {/* ── Avatar + info ── */}
            <Section title="Cuenta">
              <div className="flex items-center gap-4 rounded-[16px] border border-border/50 bg-muted/20 p-4">
                {profile.photo ? (
                  <img src={profile.photo} alt={profile.name ?? ''} className="h-14 w-14 rounded-full border border-border/60 object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-xl font-black text-foreground">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-0.5">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button size="sm" className="h-8 rounded-full px-3" onClick={handleSaveName} disabled={savingName}>
                        {savingName ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 rounded-full px-3" onClick={() => setEditingName(false)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setEditingName(true); setNameFeedback(null); }}
                      className="group flex items-center gap-1.5 text-left"
                    >
                      <span className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                        {profile.name ?? 'Sin nombre'}
                      </span>
                      <span className="text-[0.6rem] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">editar</span>
                    </button>
                  )}
                  {nameFeedback && <Feedback kind={nameFeedback.kind} message={nameFeedback.message} />}
                  {profile.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3 w-3" />
                    <span>{profile.isGoogleAccount ? 'Cuenta Google' : 'Cuenta con contraseña'}</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* ── Estadísticas ── */}
            <Section title="Mis datos">
              <div className="flex gap-2">
                <StatPill icon={<FolderOpen className="h-4 w-4" />} label="Proyectos" value={profile.stats.projects} />
                <StatPill icon={<Layers className="h-4 w-4" />} label="Piezas" value={profile.stats.pieces} />
                <StatPill icon={<Package className="h-4 w-4" />} label="Bobinas" value={profile.stats.spools} />
              </div>
            </Section>

            {/* ── Cambiar contraseña ── */}
            {profile.hasPassword && !profile.isGoogleAccount && (
              <Section title="Seguridad">
                <div className="space-y-3 rounded-[16px] border border-border/50 bg-muted/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    Cambiar contraseña
                  </div>
                  <Input
                    type="password"
                    placeholder="Contraseña actual"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="password"
                    placeholder="Nueva contraseña (mín. 6 caracteres)"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="password"
                    placeholder="Confirmar nueva contraseña"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleChangePassword(); }}
                    className="h-8 text-sm"
                  />
                  {passFeedback && <Feedback kind={passFeedback.kind} message={passFeedback.message} />}
                  <Button
                    size="sm"
                    className="w-full rounded-full font-bold"
                    onClick={handleChangePassword}
                    disabled={savingPass}
                  >
                    {savingPass ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <KeyRound className="mr-2 h-3.5 w-3.5" />}
                    Cambiar contraseña
                  </Button>
                </div>
              </Section>
            )}

            {/* ── Eliminar cuenta ── */}
            <Section title="Zona de peligro">
              {!showDeleteSection ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 font-bold"
                  onClick={() => setShowDeleteSection(true)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Eliminar mi cuenta
                </Button>
              ) : (
                <div className="space-y-3 rounded-[16px] border border-destructive/30 bg-destructive/5 p-4">
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
                    className="h-8 border-destructive/40 text-sm font-mono"
                  />
                  {deleteFeedback && <Feedback kind={deleteFeedback.kind} message={deleteFeedback.message} />}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full font-bold"
                      onClick={() => { setShowDeleteSection(false); setDeleteConfirm(''); setDeleteFeedback(null); }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 rounded-full font-bold"
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirm !== 'ELIMINAR'}
                    >
                      {deleting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
                      Eliminar cuenta
                    </Button>
                  </div>
                </div>
              )}
            </Section>

          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No se pudo cargar el perfil.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
