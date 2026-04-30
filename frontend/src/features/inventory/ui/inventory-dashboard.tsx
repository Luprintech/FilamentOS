import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Plus, AlertTriangle, ScanLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventory } from '../api/use-inventory';
import { SpoolCard } from './spool-card';
import { SpoolForm } from './spool-form';
import { DeductModal } from './deduct-modal';
import { BarcodeScannerModal, type ScannerFillData } from './barcode-scanner-modal';
import type { Spool, SpoolInput } from '../types';
import { getTotalInventoryValue, getAverageCostPerKg, isLowStock } from '../types';
import { GuestBanner } from '@/components/guest-banner';
import { LoginRequiredModal } from '@/components/login-required-modal';
import { mockSpools } from '@/data/mockData';
import { useAuth } from '@/context/auth-context';

// ── Responsive page size ──────────────────────────────────────────────────────
// Coincide con los breakpoints del grid: 1 col (mobile) / 2 col (sm) / 3 col (lg)
// 4 = 4 filas × 1 col | 6 = 3 filas × 2 col | 9 = 3 filas × 3 col

function useInventoryPageSize() {
  function detect() {
    if (typeof window === 'undefined') return 9;
    if (window.matchMedia('(min-width: 1024px)').matches) return 9;
    if (window.matchMedia('(min-width: 640px)').matches)  return 6;
    return 4;
  }

  const [pageSize, setPageSize] = useState(detect);

  useEffect(() => {
    function onResize() { setPageSize(detect()); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return pageSize;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface InventoryDashboardProps {
  userId: string | null;
  authLoading: boolean;
}

export function InventoryDashboard({ userId, authLoading }: InventoryDashboardProps) {
  const { t } = useTranslation();
  const { isGuest } = useAuth();
  const {
    spools: realSpools,
    loading,
    error,
    customBrands,
    customMaterials,
    createSpool,
    updateSpool,
    deleteSpool,
    deductSpool,
    finishSpool,
  } =
    useInventory({ userId, authLoading });

  const [formOpen, setFormOpen]           = useState(false);
  const [editingSpool, setEditingSpool]   = useState<Spool | null>(null);
  const [deductTarget, setDeductTarget]   = useState<Spool | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen]     = useState(false);
  const [scanPrefill, setScanPrefill]     = useState<Partial<ScannerFillData> | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // ── Pagination ────────────────────────────────────────────────────────────────
  const [page, setPage]   = useState(1);
  const pageSize          = useInventoryPageSize();
  const listRef           = useRef<HTMLDivElement>(null);

  const spools   = isGuest ? mockSpools : realSpools;
  const filtered = spools; // punto de extensión: aplicar búsqueda/filtros aquí

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);

  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  // Reset a página 1 cuando cambia la lista (alta/baja de bobinas)
  useEffect(() => { setPage(1); }, [spools.length]);

  // Scroll al inicio del listado al cambiar de página
  useEffect(() => {
    if (safePage > 1 && listRef.current) {
      listRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [safePage]);

  // ── Derived metrics ───────────────────────────────────────────────────────────
  const totalValue    = getTotalInventoryValue(spools);
  const avgCostPerKg  = getAverageCostPerKg(spools);
  const lowStockCount = spools.filter(isLowStock).length;
  const activeCount   = spools.filter((s) => s.status === 'active').length;

  // ── Pagination label ──────────────────────────────────────────────────────────
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd   = Math.min(safePage * pageSize, filtered.length);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handleOpenAdd() {
    if (isGuest) { setLoginModalOpen(true); return; }
    setEditingSpool(null);
    setScanPrefill(null);
    setFormOpen(true);
  }

  function handleScanFill(data: ScannerFillData) {
    setScannerOpen(false);
    setEditingSpool(null);
    setScanPrefill(data);
    setFormOpen(true);
  }

  function handleOpenEdit(spool: Spool) {
    if (isGuest) { setLoginModalOpen(true); return; }
    setEditingSpool(spool);
    setFormOpen(true);
  }

  async function handleFormSubmit(input: SpoolInput) {
    if (editingSpool) {
      await updateSpool(editingSpool.id, input);
    } else {
      await createSpool(input);
    }
  }

  async function handleDelete(id: string) {
    if (isGuest) { setLoginModalOpen(true); return; }
    if (deleteConfirm === id) {
      await deleteSpool(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  }

  async function handleDeduct(id: string, grams: number) {
    if (isGuest) { setLoginModalOpen(true); return; }
    await deductSpool(id, grams);
  }

  async function handleFinish(id: string) {
    if (isGuest) { setLoginModalOpen(true); return; }
    await finishSpool(id);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!userId && !authLoading && !isGuest) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <Package className="mb-4 h-12 w-12 opacity-30" />
        <p className="text-sm">{t('tracker_login_text')}</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* GuestBanner */}
      {isGuest && (
        <GuestBanner message=" Inventario de ejemplo. Inicia sesión para gestionar tus bobinas reales." />
      )}

      {/* Action bar — page title/subtitle live in the unified PageHeader above */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          disabled
          onClick={() => {}}
          className="cursor-not-allowed rounded-full font-bold opacity-50"
          title="Próximamente"
        >
          <ScanLine className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">{t('scan_btn')}</span>
          <span className="ml-1 hidden md:inline text-[0.65rem] font-semibold">· Próximamente</span>
        </Button>
        <Button
          onClick={handleOpenAdd}
          className={`rounded-full font-bold ${isGuest ? 'cursor-not-allowed opacity-50' : ''}`}
          title={isGuest ? 'Inicia sesión para gestionar tu inventario' : undefined}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t('inventory.addSpool')}
        </Button>
        <Link to="/filamentos/globales">
          <Button variant="outline" className="rounded-full font-bold">
            Base global
          </Button>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label={t('inventory.totalValue')}    value={`€ ${totalValue.toFixed(2)}`} />
        <MetricCard label={t('inventory.avgCostKg')}     value={`€ ${avgCostPerKg.toFixed(2)}/kg`} />
        <MetricCard label={t('inventory.activeSpools')}  value={String(activeCount)} />
        {lowStockCount > 0 ? (
          <MetricCard label={t('inventory.lowStockAlert')} value={String(lowStockCount)} highlight />
        ) : (
          <MetricCard label={t('inventory.lowStockAlert')} value="0" />
        )}
      </div>

      {/* Low stock warning */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-400/8 px-4 py-3 text-sm text-orange-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{t('inventory.lowStockWarning', { count: lowStockCount })}</span>
        </div>
      )}

      {/* Error */}
      {!isGuest && error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {/* Loading skeletons */}
      {!isGuest && loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isGuest && !loading && spools.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">{t('inventory.emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground/70">{t('inventory.emptySubtitle')}</p>
          <Button onClick={handleOpenAdd} className="mt-4 rounded-full font-bold" variant="outline">
            <Plus className="mr-1.5 h-4 w-4" />
            {t('inventory.addSpool')}
          </Button>
        </div>
      )}

      {/* Spool grid */}
      {(isGuest || (!loading && spools.length > 0)) && (
        <div ref={listRef} className="space-y-4 scroll-mt-4">

          {/* "Mostrando X de Y" */}
          {filtered.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground">
              {t('inventory.showing', {
                start: rangeStart,
                end:   rangeEnd,
                total: filtered.length,
                defaultValue: `Mostrando ${rangeStart}–${rangeEnd} de ${filtered.length} bobinas`,
              })}
            </p>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((spool) => (
              <div key={spool.id}>
                {!isGuest && deleteConfirm === spool.id && (
                  <div className="mb-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <p className="font-semibold">{t('inventory.deleteConfirm', { name: `${spool.brand} ${spool.color}` })}</p>
                    <div className="mt-1.5 flex gap-2">
                      <button onClick={() => handleDelete(spool.id)} className="font-bold underline underline-offset-2">
                        {t('delete')}
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-muted-foreground">
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                )}
                <SpoolCard
                  spool={spool}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onDeduct={setDeductTarget}
                  onFinish={handleFinish}
                  guestMode={isGuest}
                  onGuestAction={() => setLoginModalOpen(true)}
                />
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          <PaginationBar
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemLabel={t('inventory.spoolCount', { defaultValue: 'bobinas' })}
            onChange={setPage}
          />
        </div>
      )}

      {/* Add/Edit Form modal */}
      {!isGuest && (
        <SpoolForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setScanPrefill(null); }}
          onSubmit={handleFormSubmit}
          editingSpool={editingSpool}
          customBrands={customBrands}
          customMaterials={customMaterials}
          prefill={scanPrefill ?? undefined}
        />
      )}

      {/* Deduct modal */}
      {!isGuest && (
        <DeductModal
          spool={deductTarget}
          onClose={() => setDeductTarget(null)}
          onDeduct={handleDeduct}
        />
      )}

      {/* Barcode scanner modal */}
      {!isGuest && (
        <BarcodeScannerModal
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onFill={handleScanFill}
        />
      )}

      {/* Login required modal */}
      <LoginRequiredModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        message="Inicia sesión para gestionar tu inventario de bobinas reales."
      />
    </section>
  );
}

function MetricCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? 'border-orange-400/30 bg-orange-400/8' : 'border-border/60 bg-card'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-black ${highlight ? 'text-orange-400' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  );
}
