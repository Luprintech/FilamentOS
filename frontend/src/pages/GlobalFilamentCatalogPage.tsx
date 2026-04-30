import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { useAuth } from '@/context/auth-context';
import { httpRequest } from '@/shared/api/http-client';
import { FilamentCatalogCard } from '@/features/inventory/ui/filament-catalog-card';
import { ImportFromCatalogModal } from '@/features/inventory/ui/import-from-catalog-modal';
import { useToast } from '@/hooks/use-toast';

interface CatalogItem {
  id: string;
  brand: string;
  material: string;
  color: string;
  colorHex: string | null;
  finish: string | null;
  imageUrl: string | null;
  customImage: string | null;
  purchaseUrl: string | null;
  metadata: {
    td?: number | null;
    materialName?: string;
  };
}

interface CatalogResponse {
  items: CatalogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  attribution: string;
}

interface FilterMetadata {
  brands: string[];
  materials: string[];
}

export function GlobalFilamentCatalogPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [attribution, setAttribution] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [brands, setBrands] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal de importación
  const [importTarget, setImportTarget] = useState<CatalogItem | null>(null);

  // Cargar metadatos de filtros
  useEffect(() => {
    async function loadFilters() {
      try {
        const data = await httpRequest<FilterMetadata>({
          url: '/api/filament-catalog/metadata/filters',
          init: { credentials: 'include' },
        });
        setBrands(data.brands);
        setMaterials(data.materials);
      } catch (error) {
        console.error('Failed to load filter metadata:', error);
      }
    }
    void loadFilters();
  }, []);

  // Cargar catálogo con filtros
  async function loadCatalog() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '50',
      });
      if (selectedBrand) params.set('brand', selectedBrand);
      if (selectedMaterial) params.set('material', selectedMaterial);
      if (colorSearch.trim()) params.set('color', colorSearch.trim());

      const data = await httpRequest<CatalogResponse>({
        url: `/api/filament-catalog?${params.toString()}`,
        init: { credentials: 'include' },
      });

      setItems(data.items);
      setPagination(data.pagination);
      setAttribution(data.attribution);
    } catch (error) {
      console.error('Failed to load catalog:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCatalog();
  }, [currentPage, selectedBrand, selectedMaterial, colorSearch]);

  function handleImport(item: CatalogItem) {
    setImportTarget(item);
  }

  async function handleConfirmImport(data: {
    catalogFilamentId: string;
    totalGrams: number;
    remainingG: number;
    price: number;
    notes: string;
    shopUrl: string;
  }) {
    try {
      await httpRequest({
        url: '/api/inventory/spools/import-from-catalog',
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        },
      });

      toast({
        title: '¡Importado!',
        description: `${importTarget?.brand} ${importTarget?.material} ${importTarget?.color} se ha añadido a tu inventario.`,
      });

      setImportTarget(null);
    } catch (error: any) {
      throw new Error(error.message || 'Error al importar el filamento');
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
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Base global de filamentos</h1>
          <p className="text-sm text-muted-foreground">
            Explora el catálogo global y luego importa o vincula filamentos a tu inventario local.
          </p>
        </div>
        <Link to="/inventario">
          <Button variant="outline" className="rounded-full font-bold">
            Volver a mi inventario
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
        {attribution || 'Datos obtenidos desde FilamentColors.xyz con atribución.'}
      </div>

      {/* Filtros */}
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card/50 p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Marca</label>
            <select
              className="h-9 w-full rounded-full border border-border bg-background px-3 text-sm text-foreground"
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todas</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Material</label>
            <select
              className="h-9 w-full rounded-full border border-border bg-background px-3 text-sm text-foreground"
              value={selectedMaterial}
              onChange={(e) => {
                setSelectedMaterial(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todos</option>
              {materials.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Color</label>
            <Input
              type="text"
              placeholder="Buscar por color..."
              className="h-9 rounded-full"
              value={colorSearch}
              onChange={(e) => {
                setColorSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {hasFilters && (
            <div className="flex items-end">
              <Button variant="outline" size="sm" className="h-9 rounded-full" onClick={handleResetFilters}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
        {pagination.total > 0 && (
          <p className="text-xs text-muted-foreground">
            Mostrando {items.length} de {pagination.total} filamentos
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <PackageSearch className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">
            {hasFilters ? 'No se encontraron filamentos con esos filtros.' : 'No hay filamentos globales sincronizados todavía.'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            {hasFilters ? 'Prueba a ajustar los filtros.' : 'Cuando el admin sincronice FilamentColors, aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <FilamentCatalogCard key={item.id} item={item} onImport={handleImport} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <PaginationBar
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemLabel="filamentos"
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {importTarget && (
        <ImportFromCatalogModal
          item={importTarget}
          onClose={() => setImportTarget(null)}
          onConfirm={handleConfirmImport}
        />
      )}
    </section>
  );
}
