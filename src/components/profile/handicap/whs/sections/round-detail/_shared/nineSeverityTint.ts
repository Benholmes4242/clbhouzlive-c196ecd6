/**
 * Returns the tint palette for a nine-total chip (Front 9 / Back 9 / Total)
 * based on delta-vs-par for that nine.
 *
 * Bands (3-band):
 *   <0   under par   green   (celebrate)
 *   ==0  even        neutral
 *   >0   over par    red
 */
export interface SeverityPalette {
  bgTint: string;
  numColor: string;
  deltaColor: string;
  border?: string;
}

export function nineSeverityTint(delta: number): SeverityPalette {
  if (delta < 0) {
    return {
      bgTint: 'rgba(5,150,105,0.14)',
      numColor: 'var(--hcp-t-100)',
      deltaColor: '#059669',
    };
  }
  if (delta === 0) {
    return {
      bgTint: 'rgba(255,255,255,0.04)',
      numColor: 'var(--hcp-t-100)',
      deltaColor: 'var(--hcp-t-100)',
    };
  }
  return {
    bgTint: 'rgba(220,38,38,0.12)',
    numColor: 'var(--hcp-t-100)',
    deltaColor: '#DC2626',
  };
}
