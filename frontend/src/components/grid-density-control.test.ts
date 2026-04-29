import { describe, expect, it } from 'vitest';
import {
  calculateGridColumns,
  calculateGridPageSize,
  getResponsiveGridStyle,
} from './grid-density-control';

describe('grid-density-control helpers', () => {
  it('calcula columnas según ancho disponible y densidad', () => {
    expect(calculateGridColumns(1000, 'compact')).toBe(4);
    expect(calculateGridColumns(1000, 'medium')).toBe(3);
    expect(calculateGridColumns(1000, 'large')).toBe(2);
  });

  it('calcula page size responsive en grid y respeta el page size de lista', () => {
    expect(calculateGridPageSize(1000, 'compact', 'grid')).toBe(12);
    expect(calculateGridPageSize(1000, 'medium', 'grid')).toBe(9);
    expect(calculateGridPageSize(1000, 'large', 'grid')).toBe(6);
    expect(calculateGridPageSize(1000, 'compact', 'list', 9)).toBe(9);
  });

  it('genera un grid auto-fit basado en el ancho mínimo de tarjeta', () => {
    expect(getResponsiveGridStyle('medium')).toEqual({
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
    });
  });
});
