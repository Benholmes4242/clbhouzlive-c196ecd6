import React from 'react';
import { FIGURE } from '@/lib/tokens/type';
import { A } from '@/features/courses/components/holes/analytical/tokens';

/**
 * THE ONE ROW VOCABULARY for the settings list. No tinted tile, no rule
 * between rows: the glyph renders inline, and the card's own hairline is the
 * only edge on the page.
 *
 * Row padding is vertical only - the card carries the 16px gutter, so a row
 * that wraps to three lines still reads flush with the one above it.
 */
export const SETTINGS_ROW: React.CSSProperties = {
  padding: '13px 0',
  minHeight: 44,
};

/** Panel padding: the card supplies the horizontal gutter for every row. */
export const SETTINGS_PANEL_PADDING = '4px 16px';

/** 15px inline glyph, MUTE or RED, never tiled. */
export function SettingsGlyph({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        color,
        flexShrink: 0,
        marginTop: 1,
        width: 15,
        height: 15,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </span>
  );
}

/**
 * Titles WRAP. A setting's name is one of the two things that must never be
 * cut - "Post my rounds automatically" means nothing without "automatically".
 */
export function SettingsTitle({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <span
      style={{
        fontSize: 13.5,
        fontWeight: 600,
        lineHeight: 1.3,
        color: danger ? A.RED : A.INK,
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </span>
  );
}

export function SettingsSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12.5, fontWeight: 400, lineHeight: 1.45, color: A.MUTE, marginTop: 3 }}>
      {children}
    </p>
  );
}

/** A count is a FIGURE, not a label. */
export function SettingsValue({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12.5,
        fontWeight: 400,
        color: A.MUTE,
        textAlign: 'right',
        maxWidth: 160,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function SettingsFigure({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        ...FIGURE,
        fontSize: 14,
        letterSpacing: '-0.02em',
        color: A.INK,
      }}
    >
      {children}
    </span>
  );
}
