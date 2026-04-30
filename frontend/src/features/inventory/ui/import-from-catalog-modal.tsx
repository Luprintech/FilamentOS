import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CatalogItem {
  id: string;
  brand: string;
  material: string;
  color: string;
  colorHex: string | null;
  purchaseUrl: string | null;
}

interface ImportFromCatalogModalProps {
  item: CatalogItem;
  onClose: () => void;
  onConfirm: (data: {
    catalogFilamentId: string;
    totalGrams: number;
    remainingG: number;
    price: number;
    notes: string;
    shopUrl: string;
  }) => Promise<void>;
}

export function ImportFromCatalogModal({ item, onClose, onConfirm }: ImportFromCatalogModalProps) {
  const [totalGrams, setTotalGrams] = useState('1000');
  const [remainingG, setRemainingG] = useState('1000');
  const [price, setPrice] = useState('25');
  const [notes, setNotes] = useState('');
  const [shopUrl, setShopUrl] = useState(item.purchaseUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const tg = Number(totalGrams);
    const rg = Number(remainingG);
    const pr = Number(price);

    if (isNaN(tg) || tg <= 0) {
      setError('Total gramos debe ser mayor a 0');
      return;
    }
    if (isNaN(rg) || rg < 0) {
      setError('Gramos restantes no puede ser negativo');
      return;
    }
    if (rg > tg) {
      setError('Gramos restantes no puede exceder el total');
      return;
    }
    if (isNaN(pr) || pr < 0) {
      setError('Precio no puede ser negativo');
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        catalogFilamentId: item.id,
        totalGrams: tg,
        remainingG: rg,
        price: pr,
        notes,
        shopUrl,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al importar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-y-auto rounded-[24px] border border-border/60 bg-card p-6 shadow-2xl max-h-[90vh]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground">Importar a mi inventario</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-muted/40">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-border/50 bg-muted/20 p-3">
          <p className="text-sm font-bold text-foreground">{item.brand}</p>
          <p className="text-xs text-muted-foreground">
            {item.material} · {item.color}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: item.colorHex || '#888888' }}
            />
            <span className="text-xs text-muted-foreground">{item.colorHex || '#888888'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total (gramos)</label>
            <Input
              type="number"
              step="1"
              min="1"
              value={totalGrams}
              onChange={(e) => setTotalGrams(e.target.value)}
              placeholder="1000"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Restante (gramos)</label>
            <Input
              type="number"
              step="1"
              min="0"
              value={remainingG}
              onChange={(e) => setRemainingG(e.target.value)}
              placeholder="1000"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Precio (€)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="25.00"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL de compra (opcional)</label>
            <Input
              type="url"
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notas (opcional)</label>
            <textarea
              className="min-h-[60px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añade notas sobre esta bobina..."
            />
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-full font-bold" disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
