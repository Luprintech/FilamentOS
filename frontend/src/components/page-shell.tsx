/**
 * PageShell + PageHeader + PageBreadcrumb
 *
 * Unified page chrome used by every route under <AppLayout/>.
 * The goal is that every page has the same animated wrapper, the same
 * header card (badge + gradient title + subtitle + right-side actions)
 * and the same breadcrumb pattern for nested views.
 *
 * Usage:
 *
 *   <PageShell>
 *     <PageHeader
 *       icon={<Calculator />}
 *       badge="Calculadora"
 *       title="Calcula tu presupuesto"
 *       subtitle="Subtítulo opcional"
 *       actions={<Button>…</Button>}
 *     />
 *     {…page content…}
 *   </PageShell>
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── PageShell ────────────────────────────────────────────────────────────────

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Inner-ref forwarded to the motion.div (used by some pages for grid sizing). */
  innerRef?: React.Ref<HTMLDivElement>;
}

export function PageShell({ children, className, innerRef }: PageShellProps) {
  return (
    <motion.div
      ref={innerRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('w-full space-y-6', className)}
    >
      {children}
    </motion.div>
  );
}

// ── PageBreadcrumb ───────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  /** Marks the current/last item — rendered as plain text. */
  current?: boolean;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn(
        'flex flex-wrap items-center gap-1.5 text-xs font-bold text-muted-foreground sm:text-[0.8rem]',
        className,
      )}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1 || item.current;
        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {isLast || !item.onClick ? (
              <span className={cn('truncate', isLast && 'text-foreground')}>{item.label}</span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="truncate transition-colors hover:text-foreground"
              >
                {item.label}
              </button>
            )}
            {idx < items.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ── PageHeader ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  /** Optional icon shown next to the badge label. */
  icon?: React.ReactNode;
  /** Top badge text (small pill above the title). Hidden if absent. */
  badge?: React.ReactNode;
  /** Main page title — rendered with the gradient style. */
  title: React.ReactNode;
  /** Short helper sentence under the title. */
  subtitle?: React.ReactNode;
  /** Right-side actions (Buttons, etc). */
  actions?: React.ReactNode;
  /** Optional breadcrumb rendered ABOVE the badge/title block. */
  breadcrumb?: BreadcrumbItem[];
  /** Extra content rendered below the header but inside the same card (e.g. stats). */
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon,
  badge,
  title,
  subtitle,
  actions,
  breadcrumb,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-border/70 bg-card/60 p-5 backdrop-blur-md shadow-[0_12px_36px_rgba(2,8,23,0.08)] dark:border-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-7',
        className,
      )}
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <PageBreadcrumb items={breadcrumb} className="mb-4" />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          {badge && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-bold text-[hsl(var(--challenge-blue))] dark:border-white/[0.08] dark:bg-white/[0.04]">
              {icon ? <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span> : null}
              {badge}
            </div>
          )}
          <h1 className="challenge-gradient-text text-2xl font-black leading-none sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
