/**
 * Returns the tint palette for a nine-total chip (Front 9 / Back 9 / Total)
 * based on delta-vs-par for that nine.
 *
 * Bands:
 *   <0      under par         green   (celebrate)
 *   0..4    even or modest    neutral (a few bogeys is just golf)
 *   5..9    bogey-and-a-bit   amber   (caution)
 *   10+     blow-up nine      red     (something went wrong)
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
  if (delta <= 4) {
    return {
      bgTint: 'rgba(255,255,255,0.04)',
      numColor: 'var(--hcp-t-100)',
      deltaColor: 'var(--hcp-t-100)',
    };
  }
  if (delta <= 9) {
    return {
      bgTint: 'rgba(247,147,30,0.10)',
      numColor: 'var(--hcp-t-100)',
      deltaColor: '#F7931E',
    };
  }
  return {
    bgTint: 'rgba(159,29,29,0.14)',
    numColor: 'var(--hcp-t-100)',
    deltaColor: '#9F1D1D',
  };
}
