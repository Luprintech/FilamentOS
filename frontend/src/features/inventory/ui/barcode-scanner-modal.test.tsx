import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        scan_title: 'Escáner de filamento',
        scan_subtitle: 'Apunta la cámara al código QR o de barras de tu bobina.',
        scan_start: 'Activar cámara',
        scan_stop: 'Detener cámara',
        scan_scanning: 'Buscando...',
        scan_fill: 'Rellenar formulario',
        scan_brand: 'Marca',
        scan_name: 'Nombre',
        scan_material: 'Material',
        scan_color: 'Color',
        scan_weight: 'Peso',
        scan_error: 'Error al buscar el filamento.',
        scan_ios_hint: 'Necesitás HTTPS y permisos de cámara para escanear.',
        scan_camera_error: 'No se pudo iniciar la cámara.',
        scan_source_manual: 'Sin datos registrados',
        scan_source_spoolman: 'Spoolman',
        'inventory.scanner.spoolmanDetected': 'Etiqueta de Spoolman detectada. Podés crear una bobina nueva o vincularla con una existente.',
        'inventory.scanner.notLinked': 'Código comercial sin vínculo en tu inventario.',
      };
      return translations[key] ?? key;
    },
  }),
}));

const scannerStart = vi.fn();
const scannerStop = vi.fn().mockResolvedValue(undefined);
let scannerStartImpl: ((onSuccess: (code: string) => void) => void | Promise<void>) | null = null;

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: class Html5Qrcode {
    isScanning = false;
    constructor() {}
    async start(_cameraConfig: unknown, _config: unknown, onSuccess: (code: string) => void) {
      this.isScanning = true;
      scannerStart(onSuccess);
      if (scannerStartImpl) {
        await scannerStartImpl(onSuccess);
        return;
      }
      onSuccess('mock-scanned-code');
    }
    async stop() {
      this.isScanning = false;
      await scannerStop();
    }
  },
}));

import { BarcodeScannerModal } from './barcode-scanner-modal';

describe('BarcodeScannerModal Spoolman lookup UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scannerStartImpl = null;
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('distingue una etiqueta QR de Spoolman y muestra el mensaje de vínculo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        found: true,
        source: 'spoolman',
        linked: false,
        data: {
          brand: 'Polymaker',
          name: 'PolyLite PLA Pro',
          material: 'PLA',
          color: 'Orange',
          colorHex: '#ff8800',
          weightGrams: 1000,
          diameter: null,
          printTempMin: null,
          printTempMax: null,
          bedTempMin: null,
          bedTempMax: null,
          price: 31,
          spoolmanId: 77,
        },
      }),
    }));

    render(<BarcodeScannerModal open onClose={vi.fn()} onFill={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar cámara' }));

    await waitFor(() => expect(screen.getByText('Polymaker')).toBeInTheDocument());
    expect(screen.getByText('Etiqueta de Spoolman detectada. Podés crear una bobina nueva o vincularla con una existente.')).toBeInTheDocument();
  });

  it('muestra fallback manual cuando el código comercial no está vinculado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        found: false,
        source: 'manual',
        linked: false,
        data: {
          brand: null,
          name: null,
          material: null,
          color: null,
          colorHex: null,
          weightGrams: null,
          diameter: null,
          printTempMin: null,
          printTempMax: null,
          bedTempMin: null,
          bedTempMax: null,
          price: null,
        },
      }),
    }));

    render(<BarcodeScannerModal open onClose={vi.fn()} onFill={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar cámara' }));

    await waitFor(() => expect(screen.getAllByText('Sin datos registrados').length).toBeGreaterThan(0));
    expect(screen.getByText('Código comercial sin vínculo en tu inventario.')).toBeInTheDocument();
    expect(screen.queryByText('Spoolman')).not.toBeInTheDocument();
  });

  it('muestra un error de cámara cuando el contexto no es seguro', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });

    render(<BarcodeScannerModal open onClose={vi.fn()} onFill={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar cámara' }));

    await waitFor(() => {
      expect(screen.getByText('Necesitás HTTPS y permisos de cámara para escanear.')).toBeInTheDocument();
    });
    expect(scannerStart).not.toHaveBeenCalled();
  });

  it('muestra el error de búsqueda cuando falla la consulta del código', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));

    render(<BarcodeScannerModal open onClose={vi.fn()} onFill={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar cámara' }));

    await waitFor(() => {
      expect(screen.getByText('Error al buscar el filamento.')).toBeInTheDocument();
    });
  });

  it('rellena el formulario con los datos detectados por Spoolman', async () => {
    const onFill = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        found: true,
        source: 'spoolman',
        linked: true,
        data: {
          brand: 'Polymaker',
          name: 'PolyLite PLA Pro',
          material: 'PLA',
          color: 'Orange',
          colorHex: '#ff8800',
          weightGrams: 1000,
          diameter: null,
          printTempMin: null,
          printTempMax: null,
          bedTempMin: null,
          bedTempMax: null,
          price: 31,
        },
      }),
    }));

    render(<BarcodeScannerModal open onClose={vi.fn()} onFill={onFill} />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar cámara' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Rellenar formulario' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Rellenar formulario' }));

    expect(onFill).toHaveBeenCalledWith({
      brand: 'Polymaker',
      material: 'PLA',
      color: 'Orange',
      colorHex: '#ff8800',
      totalGrams: 1000,
      remainingG: 1000,
      price: 31,
      notes: 'PolyLite PLA Pro',
      rawCode: 'mock-scanned-code',
      source: 'spoolman',
    });
  });

  it('permite detener manualmente la cámara antes de recibir resultados', async () => {
    scannerStartImpl = async () => {};

    render(<BarcodeScannerModal open onClose={vi.fn()} onFill={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar cámara' }));

    const stopButton = await screen.findByRole('button', { name: 'Detener cámara' });
    fireEvent.click(stopButton);

    await waitFor(() => expect(scannerStop).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Activar cámara' })).toBeInTheDocument();
  });

  it('cierra el modal al pedir el cierre desde el diálogo', () => {
    const onClose = vi.fn();

    render(<BarcodeScannerModal open onClose={onClose} onFill={vi.fn()} />);

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    fireEvent.pointerDown(document.body);

    expect(onClose).toHaveBeenCalled();
  });

  it('reinicia un nuevo escaneo desde el resultado y vuelve a consultar el código', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        found: true,
        source: 'spoolman',
        linked: true,
        data: {
          brand: 'Polymaker',
          name: 'PolyLite PLA Pro',
          material: 'PLA',
          color: 'Orange',
          colorHex: '#ff8800',
          weightGrams: 1000,
          diameter: null,
          printTempMin: null,
          printTempMax: null,
          bedTempMin: null,
          bedTempMax: null,
          price: 31,
        },
      }),
    }));

    render(<BarcodeScannerModal open onClose={vi.fn()} onFill={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar cámara' }));
    await screen.findByRole('button', { name: 'Rellenar formulario' });

    fireEvent.click(screen.getAllByRole('button', { name: 'Activar cámara' })[0]);

    await waitFor(() => expect(scannerStart).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it('usa valores por defecto al rellenar cuando el lookup manual no trae metadata', async () => {
    const onFill = vi.fn();
    const onClose = vi.fn();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        found: false,
        source: 'manual',
        linked: false,
        data: {
          brand: null,
          name: null,
          material: null,
          color: null,
          colorHex: null,
          weightGrams: null,
          diameter: null,
          printTempMin: null,
          printTempMax: null,
          bedTempMin: null,
          bedTempMax: null,
          price: null,
        },
      }),
    }));

    render(<BarcodeScannerModal open onClose={onClose} onFill={onFill} />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar cámara' }));
    await screen.findByRole('button', { name: 'Rellenar formulario' });

    fireEvent.click(screen.getByRole('button', { name: 'Rellenar formulario' }));

    expect(onFill).toHaveBeenCalledWith({
      brand: '',
      material: '',
      color: '',
      colorHex: '#cccccc',
      totalGrams: 1000,
      remainingG: 1000,
      price: 0,
      notes: '',
      rawCode: 'mock-scanned-code',
      source: 'manual',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('muestra un error específico cuando no hay cámara disponible', async () => {
    scannerStartImpl = async () => {
      throw new Error('camera not found');
    };

    render(<BarcodeScannerModal open onClose={vi.fn()} onFill={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Activar cámara' }));

    await waitFor(() => {
      expect(screen.getByText('No se encontró ninguna cámara en este dispositivo.')).toBeInTheDocument();
    });
  });
});
