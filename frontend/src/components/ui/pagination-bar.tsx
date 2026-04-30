import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationBarProps {
  /** Página actual (1-based) - acepta tanto 'currentPage' como 'page' para compatibilidad */
  currentPage?: number;
  page?: number;
  /** Total de páginas */
  totalPages: number;
  /** Total de ítems (para la etiqueta) - opcional */
  totalItems?: number;
  /** Texto del tipo de ítem, ej. "bobinas", "proyectos", "piezas" - opcional */
  itemLabel?: string;
  /** Callback cuando cambia la página - acepta tanto 'onPageChange' como 'onChange' */
  onPageChange?: (page: number) => void;
  onChange?: (page: number) => void;
  className?: string;
}

/**
 * Barra de paginación homogénea usada en todas las vistas con listas paginadas.
 * Solo se renderiza si totalPages > 1.
 * Muestra máximo 7 botones de página con "..." cuando hay muchas páginas.
 */
export function PaginationBar({
  currentPage,
  page,
  totalPages,
  totalItems,
  itemLabel,
  onPageChange,
  onChange,
  className = '',
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, currentPage ?? page ?? 1), totalPages);
  const handlePageChange = onPageChange ?? onChange ?? (() => {});

  // Generar números de página a mostrar (máximo 7 botones)
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
    
    if (totalPages <= 7) {
      // Si hay 7 o menos páginas, mostrarlas todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar la primera página
      pages.push(1);
      
      if (safePage <= 3) {
        // Cerca del inicio: 1 2 3 4 ... 100
        pages.push(2, 3, 4);
        pages.push('ellipsis-end');
        pages.push(totalPages);
      } else if (safePage >= totalPages - 2) {
        // Cerca del final: 1 ... 97 98 99 100
        pages.push('ellipsis-start');
        pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // En el medio: 1 ... 48 49 50 ... 100
        pages.push('ellipsis-start');
        pages.push(safePage - 1, safePage, safePage + 1);
        pages.push('ellipsis-end');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/30 px-4 py-3 ${className}`}
    >
      {/* Etiqueta izquierda */}
      {totalItems !== undefined && itemLabel !== undefined ? (
        <span className="text-xs font-semibold text-muted-foreground">
          Página {safePage} de {totalPages} · {totalItems} {itemLabel}
        </span>
      ) : (
        <span className="text-xs font-semibold text-muted-foreground">
          Página {safePage} de {totalPages}
        </span>
      )}

      {/* Controles */}
      <div className="flex flex-wrap gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => handlePageChange(1)}
          disabled={safePage === 1}
          aria-label="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => handlePageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((n, idx) => {
          if (n === 'ellipsis-start' || n === 'ellipsis-end') {
            return (
              <div key={`ellipsis-${idx}`} className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground">
                ...
              </div>
            );
          }
          
          return (
            <Button
              key={n}
              variant={n === safePage ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8 rounded-full text-xs font-bold"
              onClick={() => handlePageChange(n)}
              aria-label={`Página ${n}`}
              aria-current={n === safePage ? 'page' : undefined}
            >
              {n}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => handlePageChange(totalPages)}
          disabled={safePage === totalPages}
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
