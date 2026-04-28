/**
 * DatePicker — unified component for the whole app.
 *
 * Modes:
 *   mode="single" (default) — selects one date.  Uses value/onChange.
 *   mode="range"            — selects from/to.  Uses valueFrom/valueTo/onRangeChange.
 *
 * The dropdown renders via a React Portal directly on document.body using
 * position:fixed + getBoundingClientRect — immune to overflow:hidden, transform
 * and stacking context issues in any ancestor.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatDateLabel(value: string | null | undefined, locale: string): string {
  if (!value) return '';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale || 'es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(date);
}

function toIso(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function todayIso(): string { return toIso(new Date()); }

function parseIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getCalendarMatrix(monthDate: Date): Array<Array<Date | null>> {
  const start    = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end      = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startDay = (start.getDay() + 6) % 7; // Monday first
  const total    = end.getDate();
  const cells: Array<Date | null> = [];

  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let day = 1; day <= total; day++) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Array<Array<Date | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function getWeekdayHeaders(locale: string): string[] {
  const base = new Date(2024, 0, 1); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d);
  });
}

// ── Portal dropdown ───────────────────────────────────────────────────────────
// Renders directly on document.body with fixed positioning so no ancestor
// overflow:hidden / transform / stacking context can clip it.

interface PortalDropdownProps {
  anchorRef: React.RefObject<HTMLElement>;
  onClose: () => void;
  children: React.ReactNode;
}

function PortalDropdown({ anchorRef, onClose, children }: PortalDropdownProps) {
  const { t } = useTranslation();
  const dropRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

  // Position below the anchor after mount
  useEffect(() => {
    function reposition() {
      if (!anchorRef.current || !dropRef.current) return;
      const rect   = anchorRef.current.getBoundingClientRect();
      const drop   = dropRef.current.getBoundingClientRect();
      const vp     = window.innerHeight;
      const spaceB = vp - rect.bottom - 8;
      const spaceT = rect.top - 8;

      const top = spaceB >= drop.height || spaceB >= spaceT
        ? rect.bottom + 6
        : rect.top - drop.height - 6;

      // Clamp horizontally so the dropdown never goes off-screen
      let left = rect.left;
      if (left + drop.width > window.innerWidth - 8) {
        left = window.innerWidth - drop.width - 8;
      }

      setStyle({ top, left, visibility: 'visible' });
    }

    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      ref={dropRef}
      style={{ position: 'fixed', zIndex: 9999, width: 296, ...style }}
      className="rounded-[16px] border border-border/60 bg-card/95 p-3 shadow-2xl backdrop-blur-md dark:border-white/[0.10] dark:bg-[#121826]/95 animate-in fade-in zoom-in-95 duration-150"
    >
      {children}
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full px-3 text-[11px] font-bold"
          onClick={onClose}
        >
          {t('tracker.date.close') ?? 'Cerrar'}
        </Button>
      </div>
    </div>,
    document.body,
  );
}

// ── Calendar grid (shared) ────────────────────────────────────────────────────

interface CalendarGridProps {
  month: Date;
  onMonthChange: (d: Date) => void;
  selectedIso?: string | null;
  rangeFrom?: string | null;
  rangeTo?: string | null;
  onSelectDate: (iso: string) => void;
  locale: string;
}

function CalendarGrid({ month, onMonthChange, selectedIso, rangeFrom, rangeTo, onSelectDate, locale }: CalendarGridProps) {
  const { t } = useTranslation();
  const weeks   = useMemo(() => getCalendarMatrix(month), [month]);
  const today   = useMemo(() => todayIso(), []);
  const headers = useMemo(() => getWeekdayHeaders(locale), [locale]);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);

  function inRange(iso: string): boolean {
    if (!rangeFrom || !rangeTo) return false;
    return iso > rangeFrom && iso < rangeTo;
  }
  function isRangeEdge(iso: string): boolean {
    return iso === rangeFrom || iso === rangeTo;
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label={t('datepicker_prev_month') ?? 'Mes anterior'}
          className="rounded-full border border-border/60 p-1.5 text-foreground transition-colors hover:bg-accent dark:border-white/[0.10]"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <p className="text-xs font-bold capitalize text-foreground">{monthLabel}</p>
        <button
          type="button"
          aria-label={t('datepicker_next_month') ?? 'Mes siguiente'}
          className="rounded-full border border-border/60 p-1.5 text-foreground transition-colors hover:bg-accent dark:border-white/[0.10]"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {headers.map((h, i) => <div key={i}>{h}</div>)}
      </div>

      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-0.5">
            {week.map((date, ci) => {
              if (!date) return <div key={ci} className="h-8" />;
              const iso        = toIso(date);
              const isSelected = iso === selectedIso || isRangeEdge(iso);
              const isInRange  = inRange(iso);
              const isToday    = iso === today;
              return (
                <button
                  key={ci}
                  type="button"
                  onClick={() => onSelectDate(iso)}
                  className={cn(
                    'flex h-8 items-center justify-center rounded-[9px] text-xs font-semibold transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow'
                      : isInRange
                        ? 'rounded-none bg-primary/15 text-foreground'
                        : isToday
                          ? 'border border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20'
                          : 'text-foreground hover:bg-accent',
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Trigger button ────────────────────────────────────────────────────────────

interface TriggerProps {
  label: string;
  hasValue: boolean;
  onClick: () => void;
  onClear?: () => void;
  className?: string;
  disabled?: boolean;
}

function Trigger({ label, hasValue, onClick, onClear, className, disabled }: TriggerProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'flex h-10 w-full items-center justify-between gap-2 rounded-[12px] border border-border/60 bg-card/80 px-3 py-2 text-sm font-medium text-foreground shadow-sm outline-none transition',
        'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
        'dark:border-white/[0.10] dark:bg-white/[0.04]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      onClick={onClick}
    >
      <span className={cn(!hasValue && 'text-muted-foreground', 'flex-1 text-left truncate')}>
        {label}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {hasValue && onClear && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Limpiar fecha"
            className="rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            onKeyDown={(e) => e.key === 'Enter' && onClear?.()}
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </span>
    </button>
  );
}

// ── Single DatePicker ─────────────────────────────────────────────────────────

export interface DatePickerProps {
  value?: string | null;
  onChange?: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, placeholder, className, disabled }: DatePickerProps) {
  const { t, i18n } = useTranslation();
  const locale      = i18n.language || 'es-ES';
  const [isOpen, setIsOpen]          = useState(false);
  const [calendarMonth, setCalMonth] = useState<Date>(() => parseIso(value) ?? new Date());
  const triggerRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = parseIso(value);
    if (d) setCalMonth(d);
  }, [value]);

  const label = value
    ? formatDateLabel(value, locale)
    : (placeholder ?? t('datepicker_placeholder') ?? 'Seleccionar fecha');

  return (
    <div className="relative w-full" ref={triggerRef}>
      <Trigger
        label={label}
        hasValue={!!value}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        onClear={() => { onChange?.(''); setIsOpen(false); }}
        className={className}
        disabled={disabled}
      />

      {isOpen && (
        <PortalDropdown anchorRef={triggerRef as React.RefObject<HTMLElement>} onClose={() => setIsOpen(false)}>
          <CalendarGrid
            month={calendarMonth}
            onMonthChange={setCalMonth}
            selectedIso={value}
            onSelectDate={(iso) => { onChange?.(iso); setIsOpen(false); }}
            locale={locale}
          />
        </PortalDropdown>
      )}
    </div>
  );
}

// ── Range DatePicker ──────────────────────────────────────────────────────────

export interface DateRangePickerProps {
  valueFrom?: string | null;
  valueTo?: string | null;
  onRangeChange?: (from: string, to: string) => void;
  placeholderFrom?: string;
  placeholderTo?: string;
  className?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  valueFrom, valueTo, onRangeChange,
  placeholderFrom, placeholderTo,
  className, disabled,
}: DateRangePickerProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'es-ES';

  type RangeOpen = 'from' | 'to' | null;
  const [open, setOpen]   = useState<RangeOpen>(null);
  const [month, setMonth] = useState<Date>(() => parseIso(valueFrom) ?? new Date());
  const fromRef           = useRef<HTMLDivElement>(null);
  const toRef             = useRef<HTMLDivElement>(null);

  function handleSelect(iso: string) {
    if (open === 'from') {
      const to = valueTo && iso > valueTo ? '' : (valueTo ?? '');
      onRangeChange?.(iso, to);
      setOpen('to');
    } else {
      const from = valueFrom && iso < valueFrom ? '' : (valueFrom ?? '');
      onRangeChange?.(from, iso);
      setOpen(null);
    }
  }

  const labelFrom = valueFrom ? formatDateLabel(valueFrom, locale) : (placeholderFrom ?? t('datepicker_from') ?? 'Desde');
  const labelTo   = valueTo   ? formatDateLabel(valueTo, locale)   : (placeholderTo   ?? t('datepicker_to')   ?? 'Hasta');

  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row', className)}>
      {/* From */}
      <div className="relative flex-1" ref={fromRef}>
        <Trigger
          label={labelFrom}
          hasValue={!!valueFrom}
          onClick={() => !disabled && setOpen(open === 'from' ? null : 'from')}
          onClear={() => onRangeChange?.('', valueTo ?? '')}
          disabled={disabled}
        />
        {open === 'from' && (
          <PortalDropdown anchorRef={fromRef as React.RefObject<HTMLElement>} onClose={() => setOpen(null)}>
            <CalendarGrid
              month={month}
              onMonthChange={setMonth}
              selectedIso={valueFrom}
              rangeFrom={valueFrom}
              rangeTo={valueTo}
              onSelectDate={handleSelect}
              locale={locale}
            />
          </PortalDropdown>
        )}
      </div>

      {/* To */}
      <div className="relative flex-1" ref={toRef}>
        <Trigger
          label={labelTo}
          hasValue={!!valueTo}
          onClick={() => !disabled && setOpen(open === 'to' ? null : 'to')}
          onClear={() => onRangeChange?.(valueFrom ?? '', '')}
          disabled={disabled}
        />
        {open === 'to' && (
          <PortalDropdown anchorRef={toRef as React.RefObject<HTMLElement>} onClose={() => setOpen(null)}>
            <CalendarGrid
              month={month}
              onMonthChange={setMonth}
              selectedIso={valueTo}
              rangeFrom={valueFrom}
              rangeTo={valueTo}
              onSelectDate={handleSelect}
              locale={locale}
            />
          </PortalDropdown>
        )}
      </div>
    </div>
  );
}
