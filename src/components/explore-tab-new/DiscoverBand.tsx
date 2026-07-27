import type { CSSProperties, ReactNode } from 'react';
import { SPACE } from '@/lib/spacing';

/**
 * DiscoverBand - canonical containment for VERTICAL LISTS on Discover.
 *
 * THE RULE: cards are for discrete objects in a horizontal rail; rules are
 * for rows in a vertical list. Do not generalise beyond that.
 *
 * A band is a full-width white surface with a 1px top and bottom rule and no
 * radius, border or shadow. Rows inside it are separated by 1px rules.
 * Horizontal rails (crown rail, attack/defend cards, photo tiles) keep cards.
 */

export const BAND_RULE = 'rgba(15,23,42,0.08)';

export function DiscoverBand({
  children,
  style,
  marginTop = SPACE.sectionSection,
}: {
  children: ReactNode;
  style?: CSSProperties;
  marginTop?: number;
}) {
  return (
    <section
      style={{
        marginTop,
        background: '#FFFFFF',
        borderTop: `1px solid ${BAND_RULE}`,
        borderBottom: `1px solid ${BAND_RULE}`,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export default DiscoverBand;
