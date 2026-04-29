/**
 * BitacoraLayout
 *
 * Root layout for all /bitacora/* routes.
 * Owns the single instance of useFilamentStorage and exposes its API
 * to child routes via React Router's Outlet context.
 *
 * This avoids multiple instances of the hook and keeps state consistent
 * across manager → project detail → pieces → new piece.
 */

import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/icons';
import { GuestBanner } from '@/components/guest-banner';
import { LoginRequiredModal } from '@/components/login-required-modal';
import { useAuth } from '@/context/auth-context';
import { useFilamentStorage } from '@/components/filament-challenge/use-filament-storage';
import { useInventory } from '@/features/inventory/api/use-inventory';
import { TrackerApiError } from '@/components/filament-challenge/tracker-api';
import { mockTrackerProjects, mockTrackerPieces, toFilamentProject } from '@/data/mockData';
import { useTranslation } from 'react-i18next';
import type { FilamentProject, FilamentPiece } from '@/components/filament-challenge/filament-types';
import type { PieceInput, ProjectInput } from '@/components/filament-challenge/use-filament-storage';
import type { Spool } from '@/features/inventory/types';

// ── Context shape exposed to child routes ─────────────────────────────────────

export interface BitacoraContext {
  // Projects
  projects: FilamentProject[];
  activeProject: FilamentProject | null;
  selectProject: (id: string | null) => void;
  createProject: (input: ProjectInput) => Promise<string>;
  updateProject: (id: string, input: ProjectInput) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  // Pieces (scoped to activeProject)
  pieces: FilamentPiece[];
  addPiece: (input: PieceInput) => Promise<{ spoolRemainingG?: number } | undefined>;
  updatePiece: (id: string, input: PieceInput) => Promise<void>;
  deletePiece: (id: string) => Promise<void>;
  reorderPieces: (orderedIds: string[]) => Promise<void>;
  // Inventory
  activeSpools: Spool[];
  // Guest
  isGuest: boolean;
}

// ── Login gate ────────────────────────────────────────────────────────────────

function LoginPrompt() {
  const { goToLogin } = useAuth();
  const { t } = useTranslation();
  return (
    <div className="challenge-panel flex flex-col items-center justify-center gap-6 rounded-[24px] border border-white/[0.10] p-6 sm:p-10 text-center">
      <div className="challenge-gradient-text text-2xl font-black leading-none sm:text-4xl">
        {t('tracker_login_title')}
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {t('tracker_login_text')}
      </p>
      <Button
        onClick={goToLogin}
        className="challenge-btn-primary rounded-full px-6 font-extrabold"
        size="lg"
      >
        <GoogleIcon className="mr-2 h-5 w-5" />
        {t('tracker_login_btn')}
      </Button>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export function BitacoraLayout() {
  const { user, loading: authLoading, isGuest } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const {
    loading, error,
    projects: realProjects,
    activeProject: realActiveProject,
    createProject, updateProject, deleteProject,
    selectProject: realSelectProject,
    pieces: realPieces,
    addPiece, updatePiece, deletePiece, reorderPieces,
  } = useFilamentStorage({ authLoading, userId: isGuest ? null : (user?.id ?? null) });

  const { spools: allSpools } = useInventory({
    authLoading,
    userId: isGuest ? null : (user?.id ?? null),
  });
  const activeSpools = allSpools.filter((s) => s.status === 'active');

  // Guest mode: mock data
  const [guestActiveId, setGuestActiveId] = useState<string | null>(null);
  const projects = isGuest ? mockTrackerProjects.map(toFilamentProject) : realProjects;
  const activeProject = isGuest
    ? projects.find((p) => p.id === guestActiveId) ?? null
    : realActiveProject;
  const selectProject = isGuest ? setGuestActiveId : realSelectProject;
  const pieces = isGuest && activeProject
    ? mockTrackerPieces.filter((p) => p.projectId === activeProject.id)
    : realPieces;

  // ── Loading / error ──────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--challenge-blue))]" />
      </div>
    );
  }

  if (!user && !isGuest) return <LoginPrompt />;

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--challenge-blue))]" />
      </div>
    );
  }

  if (error) {
    const trackerError = error instanceof TrackerApiError ? error : null;
    const message = trackerError?.kind === 'runtime-mismatch'
      ? t('tracker_error_runtime')
      : trackerError?.kind === 'auth'
        ? t('tracker_error_auth')
        : t('tracker_error_generic', { message: (error as Error).message });
    return (
      <div className="rounded-[24px] border border-destructive/30 bg-destructive/10 p-6 text-center text-sm font-bold text-destructive">
        {message}
      </div>
    );
  }

  // ── Context passed to all child routes ───────────────────────────────────────

  const ctx: BitacoraContext = {
    projects,
    activeProject,
    selectProject,
    createProject,
    updateProject,
    deleteProject,
    pieces,
    addPiece,
    updatePiece,
    deletePiece,
    reorderPieces,
    activeSpools,
    isGuest,
  };

  return (
    <>
      {isGuest && (
        <GuestBanner message="👀 Modo invitado. Inicia sesión para crear y gestionar tus series reales." />
      )}
      <Outlet context={ctx} />
      <LoginRequiredModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        message="Inicia sesión para crear y gestionar tus proyectos de seguimiento."
      />
    </>
  );
}
