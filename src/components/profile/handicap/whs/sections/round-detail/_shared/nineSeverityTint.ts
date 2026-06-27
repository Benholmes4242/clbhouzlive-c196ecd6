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
      bgTint: 'rgba(47,107,79,0.14)',
      numColor: 'var(--hcp-t-100)',
      deltaColor: '#2F6B4F', // refined pine — under par
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
    bgTint: 'rgba(181,112,60,0.14)',
    numColor: 'var(--hcp-t-100)',
    deltaColor: '#B5703C', // muted clay — over par
  };
}
