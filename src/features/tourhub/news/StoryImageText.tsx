import React from 'react';
import { INK, INK_SOFT } from '../_shared/tokens';

export function StoryImageKicker({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK_SOFT }}>
      {children}
    </div>
  );
}

export function StoryImageHeadline({ children, feed = false }: { children: React.ReactNode; feed?: boolean }) {
  return (
    <div style={{ fontSize: feed ? 19 : 20, fontWeight: 700, lineHeight: 1.15, letterSpacing: feed ? '-0.02em' : '-0.015em', color: INK }}>
      {children}
    </div>
  );
}