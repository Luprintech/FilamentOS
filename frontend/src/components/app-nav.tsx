import { NavLink, useMatch, useLocation } from 'react-router-dom';
import { Calculator, BarChart3, LineChart, Package, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  guestDisabled?: boolean;
}

export function AppNav() {
  const { t } = useTranslation();
  const { isGuest } = useAuth();
  // /proyectos is a sub-view of /calculadora — keep that tab active
  const onProyectos = useMatch('/proyectos');
  const location = useLocation();

  const items: NavItem[] = [
    { to: '/calculadora', icon: <Calculator className="h-4 w-4" />, label: t('tab_calculator') },
    { to: '/bitacora',    icon: <BarChart3   className="h-4 w-4" />, label: t('tab_tracker'),    guestDisabled: true },
    { to: '/estadisticas',icon: <LineChart   className="h-4 w-4" />, label: t('tab_statistics'), guestDisabled: true },
    { to: '/inventario',  icon: <Package     className="h-4 w-4" />, label: t('tab_inventory') },
    { to: '/recursos',    icon: <Globe       className="h-4 w-4" />, label: t('tab_recursos') },
  ];

  return (
    <nav
      className="hidden mb-7 grid h-auto w-full grid-cols-5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-1 sm:p-1.5 print:hidden dark:border-white/10 lg:grid"
      aria-label="Navegación principal"
    >
      {items.map(({ to, icon, label, guestDisabled }) => {
        const disabled = guestDisabled && isGuest;
        return (
          <NavLink
            key={to}
            to={to}
            title={label}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            onClick={disabled ? (e) => e.preventDefault() : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-center gap-0 rounded-xl py-2 sm:py-2.5 text-sm font-bold transition-colors sm:gap-2',
                (isActive
                  || (to === '/calculadora' && !!onProyectos)
                  || (to === '/bitacora' && location.pathname.startsWith('/bitacora/'))
                ) && !disabled
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground',
                disabled && 'pointer-events-none opacity-45',
              )
            }
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
