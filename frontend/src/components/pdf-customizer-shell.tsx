/**
 * PdfCustomizerShell — modal wrapper around PdfCustomizerLayout.
 * Used for guest mode in filament-tracker (where we can't navigate away).
 */

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PdfCustomizerLayout, type PdfCustomizerLayoutProps } from '@/components/pdf-customizer-layout';

export interface PdfCustomizerShellProps extends PdfCustomizerLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
}

export function PdfCustomizerShell({
  open,
  onOpenChange,
  title,
  subtitle,
  ...layoutProps
}: PdfCustomizerShellProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm
            data-[state=open]:animate-in data-[state=open]:fade-in-0
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        />

        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-[min(96vw,1100px)] h-[min(90dvh,800px)]',
            'flex flex-col',
            'overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl',
            'duration-200',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          )}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="truncate text-base font-bold text-foreground">
                {title}
              </DialogPrimitive.Title>
              {subtitle && (
                <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* Layout — fills remaining height */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <PdfCustomizerLayout
              {...layoutProps}
              onBack={() => onOpenChange(false)}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
