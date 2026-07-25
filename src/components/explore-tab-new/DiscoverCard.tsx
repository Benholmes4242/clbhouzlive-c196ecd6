import type { CSSProperties, ReactNode } from 'react';
import { SPACE } from '@/lib/spacing';

/**
 * Canonical Discover containment card.
 * Reference: FriendsRoundsSection (white surface, hairline border, radius 16).
 * Row lists get this card; horizontal rails stay free on the page background.
 */
export function DiscoverCard({
  children,
  style,
  marginTop = SPACE.sectionSection,
}: {
  children: ReactNode;
  style?: CSSProperties;
  marginTop?: number;
}) {
  return (
    <section style={{ padding: '0 16px', marginTop, ...style }}>
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(15,23,42,0.08)',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </section>
  );
}

export default DiscoverCard;
