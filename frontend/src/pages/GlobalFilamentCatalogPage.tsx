import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useInventory } from '@/features/inventory/api/use-inventory';

export function GlobalFilamentCatalogPage() {
  const { user, authLoading } = useAuth();
  const { catalogItems, catalogAttribution, refreshCatalog } = useInventory({
    userId: user?.id ?? null,
    authLoading,
  });

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Base global de filamentos</h1>
          <p className="text-sm text-muted-foreground">
            Explora el catalogo global y luego importa o vincula filamentos a tu inventario local.
          </p>
        </div>
        <Link to="/inventario">
          <Button variant="outline" className="rounded-full font-bold">
            Volver a mi inventario
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
        {catalogAttribution || 'Datos obtenidos desde FilamentColors.xyz con atribucion.'}
      </div>

      {catalogItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <PackageSearch className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">No hay filamentos globales sincronizados todavia.</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Cuando el admin sincronice FilamentColors, apareceran aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalogItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{item.brand}</p>
                  <p className="text-sm text-muted-foreground">{item.material} · {item.color}</p>
                </div>
                <div className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: item.colorHex ?? '#cccccc' }} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{item.slug}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
