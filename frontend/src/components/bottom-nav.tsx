import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Calculator, BarChart3, LineChart, Package, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const navRef = useRef<HTMLElement>(null);

  // iOS Safari no recalcula position: fixed cuando la barra de dirección
  // se oculta/muestra al hacer scroll. Forzamos un reflow en scroll y resize.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const handleReflow = () => {
      // Trigger reflow para que iOS Safari recalculé la posición fixed
      void el.offsetHeight;
    };

    window.addEventListener('resize', handleReflow, { passive: true });
    window.addEventListener('scroll', handleReflow, { passive: true });
    return () => {
      window.removeEventListener('resize', handleReflow);
      window.removeEventListener('scroll', handleReflow);
    };
  }, []);

  const items = [
    { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
    { to: '/bitacora', icon: BarChart3, label: 'Bitácora' },
    { to: '/estadisticas', icon: LineChart, label: 'Estadísticas' },
    { to: '/inventario', icon: Package, label: 'Inventario' },
    { to: '/recursos', icon: Globe, label: 'Recursos' },
  ];

  return (
    <nav
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 z-[999] flex w-full items-center justify-evenly gap-0 border-t border-border bg-background/90 px-2 py-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-xl print:hidden lg:hidden"
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
  );
}
