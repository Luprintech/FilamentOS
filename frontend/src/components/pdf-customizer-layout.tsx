/**
 * PdfCustomizerLayout — pure layout component, no Dialog wrapper.
 *
 * Used by:
 *   - /bitacora/:projectId/pdf  (full page)
 *   - PdfCustomizerShell (modal wrapper reuses this internally)
 *
 * Desktop (lg+): two columns — 380px controls | flex-1 preview
 * Mobile/tablet:  tabs — Diseño / [Layout] / Vista previa
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Save, FileDown, Loader2, Eye, Palette, Layout as LayoutIcon, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PdfCustomizerLayoutProps {
  designPanel: React.ReactNode;
  layoutPanel?: React.ReactNode;
  previewPanel: React.ReactNode;

  onRefreshPreview?: () => void;
  isRefreshing?: boolean;

  onBack?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  onGeneratePdf: () => void;
  isGeneratingPdf?: boolean;
  generateLabel?: string;
  guestMode?: boolean;
}

export function PdfCustomizerLayout({
  designPanel,
  layoutPanel,
  previewPanel,
  onRefreshPreview,
  isRefreshing,
  onBack,
  onSave,
  isSaving,
  onGeneratePdf,
  isGeneratingPdf,
  generateLabel,
  guestMode = false,
}: PdfCustomizerLayoutProps) {
  const [mobileTab, setMobileTab] = useState<'design' | 'layout' | 'preview'>('design');

  return (
    <div className="space-y-4">

      {/* ── Desktop: side-by-side ─────────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">

        {/* Left — controls */}
        <div className="border-r border-border/60">
          {layoutPanel ? (
            <Tabs defaultValue="design" className="space-y-4">
              <TabsList className="mx-4 mt-4 shrink-0 grid grid-cols-2">
                <TabsTrigger value="design">
                  <Palette className="mr-1.5 h-3.5 w-3.5" />Diseño
                </TabsTrigger>
                <TabsTrigger value="layout">
                  <LayoutIcon className="mr-1.5 h-3.5 w-3.5" />Layout
                </TabsTrigger>
              </TabsList>
              <TabsContent value="design" className="mt-0 px-4 pb-6">
                {designPanel}
              </TabsContent>
              <TabsContent value="layout" className="mt-0 px-4 pb-6">
                {layoutPanel}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="p-4">
              {designPanel}
            </div>
          )}
        </div>

        {/* Right — preview */}
        <div className="bg-muted/20">
          {/* Preview toolbar */}
          <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background/70 px-4 py-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Vista previa</span>
            </div>
            {onRefreshPreview && (
              <Button size="sm" variant="outline" onClick={onRefreshPreview} disabled={isRefreshing}
                className="h-7 gap-1.5 rounded-full text-xs font-bold">
                {isRefreshing
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <RefreshCw className="h-3.5 w-3.5" />}
                Actualizar
              </Button>
            )}
          </div>
          <div className="p-6">
            {previewPanel}
          </div>
        </div>
      </div>

      {/* ── Mobile / tablet: tabbed ───────────────────────────────────────── */}
      <div className="lg:hidden">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as typeof mobileTab)}
          className="space-y-3"
        >
          <TabsList className={cn(
            'mx-3 mt-3 shrink-0',
            layoutPanel ? 'grid grid-cols-3' : 'grid grid-cols-2',
          )}>
            <TabsTrigger value="design">
              <Palette className="mr-1 h-3.5 w-3.5" />Diseño
            </TabsTrigger>
            {layoutPanel && (
              <TabsTrigger value="layout">
                <LayoutIcon className="mr-1 h-3.5 w-3.5" />Layout
              </TabsTrigger>
            )}
            <TabsTrigger value="preview">
              <Eye className="mr-1 h-3.5 w-3.5" />Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="mt-0 px-3 pb-3">
            {designPanel}
          </TabsContent>

          {layoutPanel && (
            <TabsContent value="layout" className="mt-0 px-3 pb-3">
              {layoutPanel}
            </TabsContent>
          )}

          <TabsContent value="preview" className="mt-0 space-y-0">
            {onRefreshPreview && (
              <div className="flex shrink-0 justify-end border-b border-border/60 px-3 py-2">
                <Button size="sm" variant="outline" onClick={onRefreshPreview} disabled={isRefreshing}
                  className="h-7 gap-1.5 rounded-full text-xs font-bold">
                  {isRefreshing
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <RefreshCw className="h-3.5 w-3.5" />}
                  Actualizar
                </Button>
              </div>
            )}
            <div className="bg-muted/20 p-3">
              {previewPanel}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Sticky footer ────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border/60 bg-background px-4 py-3 sm:px-6">
        {onBack && (
          <Button variant="outline" size="sm" className="mr-auto rounded-full font-bold" onClick={onBack}>
            ← Volver
          </Button>
        )}

        {!guestMode && onSave && (
          <Button variant="outline" size="sm" className="rounded-full font-bold"
            onClick={onSave} disabled={isSaving}>
            {isSaving
              ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Guardar
          </Button>
        )}

        <Button size="sm" className="rounded-full font-extrabold"
          onClick={onGeneratePdf} disabled={isGeneratingPdf}>
          {isGeneratingPdf
            ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            : <FileDown className="mr-1.5 h-4 w-4" />}
          {generateLabel ?? (guestMode ? 'Vista previa' : 'Generar PDF')}
        </Button>
      </div>
    </div>
  );
}
