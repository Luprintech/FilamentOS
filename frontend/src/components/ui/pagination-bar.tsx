import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationBarProps {
  /** Página actual (1-based) */
  page: number;
  /** Total de páginas */
  totalPages: number;
  /** Total de ítems (para la etiqueta) */
  totalItems: number;
  /** Texto del tipo de ítem, ej. "bobinas", "proyectos", "piezas" */
  itemLabel: string;
  onChange: (page: number) => void;
  className?: string;
}

/**
 * Barra de paginación homogénea usada en todas las vistas con listas paginadas.
 * Solo se renderiza si totalPages > 1.
 */
export function PaginationBar({
  page,
  totalPages,
  totalItems,
  itemLabel,
  onChange,
  className = '',
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, page), totalPages);

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/30 px-4 py-3 ${className}`}
    >
      {/* Etiqueta izquierda */}
      <span className="text-xs font-semibold text-muted-foreground">
        Página {safePage} de {totalPages} · {totalItems} {itemLabel}
      </span>

      {/* Controles */}
      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <Button
            key={n}
            variant={n === safePage ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8 rounded-full text-xs font-bold"
            onClick={() => onChange(n)}
            aria-label={`Página ${n}`}
            aria-current={n === safePage ? 'page' : undefined}
          >
            {n}
          </Button>
        ))}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
