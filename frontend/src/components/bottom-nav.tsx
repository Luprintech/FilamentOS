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
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+12px)] left-1/2 z-[999] -translate-x-1/2 flex w-[calc(100vw-24px)] max-w-[430px] items-center justify-evenly gap-0.5 rounded-[24px] border border-white/10 bg-black/78 px-2 py-1.5 backdrop-blur-2xl print:hidden lg:hidden md:max-w-[720px] md:gap-1 md:px-3"
      aria-label="Navegación inferior"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-center font-semibold transition-all duration-200 md:px-2',
              'text-[9px] sm:text-[10px] md:text-xs',
              isActive
                ? 'bg-gradient-to-br from-purple-500/20 to-cyan-400/20 text-purple-300 shadow-[0_0_16px_rgba(168,85,247,0.25)]'
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
