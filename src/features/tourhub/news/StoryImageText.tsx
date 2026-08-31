import React from 'react';
import { storyTime } from './storyTime';
import { INK, INK_MUTE, INK_SOFT } from '../_shared/tokens';

export function StoryImageKicker({ children, color = INK_SOFT }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.16em', textTransform: 'uppercase', color }}>
      {children}
    </span>
  );
}

export function StoryRelativeTime({ at }: { at: string | null | undefined }) {
  const label = storyTime(at);
  if (!label) return null;
  return <time dateTime={at ?? undefined} style={{ color: INK_MUTE, fontSize: 9, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{label}</time>;
}

export function StoryImageHeadline({ children, feed = false }: { children: React.ReactNode; feed?: boolean }) {
  return (
    <div style={{ fontSize: feed ? 19 : 20, fontWeight: 700, lineHeight: 1.15, letterSpacing: feed ? '-0.02em' : '-0.015em', color: INK }}>
      {children}
    </div>
  );
}