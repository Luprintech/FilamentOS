import { NavLink } from 'react-router-dom';
import { Calculator, BarChart3, LineChart, Package, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const items = [
    { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
    { to: '/bitacora', icon: BarChart3, label: 'Bitácora' },
    { to: '/estadisticas', icon: LineChart, label: 'Estadísticas' },
    { to: '/inventario', icon: Package, label: 'Inventario' },
    { to: '/recursos', icon: Globe, label: 'Recursos' },
  ];

  return (
    // Contenedor fixed full-screen para evitar el bug de iOS Safari
    // donde position: fixed no se recalcula al ocultar/mostrar la barra de dirección
    <div className="fixed inset-0 z-[999] pointer-events-none print:hidden lg:hidden">
      <nav
        className="absolute bottom-0 left-0 right-0 flex w-full items-center justify-evenly gap-0 border-t border-border bg-background/90 px-2 py-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-xl pointer-events-auto"
        aria-label="Navegación inferior"
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-0.5 text-center font-semibold transition-colors duration-150',
                'text-[9px] sm:text-[10px] md:text-xs',
                isActive
                  ? 'text-purple-400'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0 md:h-5 md:w-5" />
            <span className="leading-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
