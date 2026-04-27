import React, { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ImageUploadProps {
  imagePreview: string | null;
  isProcessing: boolean;
  error: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  
  label: string;
  optionalLabel?: string;
  dragPrompt: string;
  dropPrompt: string;
  changeBtn: string;
  uploadBtn: string;
  hint: string;
  processingLabel: string;
  
  accept?: string;
  previewClassName?: string;
}

export function ImageUpload({
  imagePreview,
  isProcessing,
  error,
  onFileSelect,
  onClear,
  label,
  optionalLabel,
  dragPrompt,
  dropPrompt,
  changeBtn,
  uploadBtn,
  hint,
  processingLabel,
  accept = 'image/jpeg,image/png,image/webp',
  previewClassName = 'h-20 w-20',
}: ImageUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragActive(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      setIsDragActive(false);
      return;
    }
    onFileSelect(file);
    setIsDragActive(false);
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label} {optionalLabel && <span className="normal-case font-normal">{optionalLabel}</span>}
      </Label>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'rounded-[18px] border-2 border-dashed p-4 transition-colors',
          isDragActive ? 'border-primary bg-primary/5 cursor-copy' : 'border-white/[0.10] bg-white/[0.02]',
          isProcessing && 'pointer-events-none opacity-80',
        )}
      >
        {!imagePreview ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center py-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {isDragActive ? dropPrompt : dragPrompt}
              </p>
              <p className="text-[0.75rem] text-muted-foreground">{hint}</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="rounded-full text-xs font-bold" onClick={() => fileInputRef.current?.click()}>
              {uploadBtn}
            </Button>
            {isProcessing && (
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground mt-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{processingLabel}</span>
              </div>
            )}
            {error && <p className="text-xs font-semibold text-destructive mt-1">{error}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative w-full overflow-hidden rounded-[14px] border border-white/[0.12] bg-black/20">
              <img src={imagePreview} alt={t('cf_image_preview', 'Preview')} className="max-h-56 w-full object-contain" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-full text-xs font-bold" onClick={() => fileInputRef.current?.click()}>
                {changeBtn}
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-full text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10" onClick={onClear}>
                {t('delete', 'Eliminar')}
              </Button>
            </div>
            {isProcessing && (
              <div className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{processingLabel}</span>
              </div>
            )}
            {error && <p className="text-xs text-center font-semibold text-destructive">{error}</p>}
          </div>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={handleFileChange} />
    </div>
  );
}
