import React from 'react';
import { storyTime } from './storyTime';
import { INK, INK_MUTE, INK_SOFT } from '../_shared/tokens';

export function StoryImageKicker({ children, color = INK_SOFT, compact = false }: { children: React.ReactNode; color?: string; compact?: boolean }) {
  return (
    <span style={{ fontSize: compact ? 9.5 : 9, fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.16em', textTransform: 'uppercase', color }}>
      {children}
    </span>
  );
}

export function StoryRelativeTime({ at }: { at: string | null | undefined }) {
  const label = storyTime(at);
  if (!label) return null;
  /* Meta lines are uniformly caps app-wide. Cased in CSS, never on the string,
     so locale files and aria labels keep the underlying sentence case. */
  return <time dateTime={at ?? undefined} style={{ color: INK_MUTE, fontSize: 9, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{label}</time>;
}

export function StoryImageHeadline({ children, feed = false, compact = false }: { children: React.ReactNode; feed?: boolean; compact?: boolean }) {
  const size = compact ? 19 : feed ? 19 : 20;
  const tracking = compact ? '-0.02em' : feed ? '-0.02em' : '-0.015em';
  return (
    <div style={{ fontSize: size, fontWeight: 700, lineHeight: 1.15, letterSpacing: tracking, color: INK }}>
      {children}
    </div>
  );
}