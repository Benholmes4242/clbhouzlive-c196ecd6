/**
 * Manage Profile - Direction A primitives.
 * Quiet slate labels, no amber kickers, no amber cut-lines.
 * Used by /edit-profile (Profile tab + Settings tab).
 */
import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { FIELD_REST_BG } from '@/lib/tokens/field';

export const SF_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
/**
 * DARK-ONLY (BRIEF_SETTINGS_AND_MANAGE_DARK). Values are the analytical ramp,
 * sourced from the already-converted Settings rows (settings/ui/rowParts.tsx).
 *
 * PAGE_BG (canvas) and a raised surface MUST stay distinguishable: on light
 * a field matching the page read as inset; on dark that would erase the field.
 */
export const INK = A.INK;
export const INK_60 = A.BODY;
export const INK_45 = A.MUTE;
export const INK_30 = A.DIM;
export const HAIR = A.BORDER;
export const PAGE_BG = A.CANVAS;
export const CARD_BG = A.PANEL;
/**
 * A button or row surface raised above CARD_BG so it never disappears into its
 * card. NOT a field: it must never follow the field canon's alphas.
 *
 * Declared locally on purpose. Same value as the canon's rest fill today,
 * different meaning, and it must be free to move independently.
 */
export const SURFACE_RAISED = 'rgba(255,255,255,0.06)';
export const GREEN = A.GREEN;
/** Bespoke destructive red. NOT the under-par red — different meaning. */
export const DANGER = '#FF5A5A';
export const DANGER_SOFT = 'rgba(255,90,90,0.14)';

/** Quiet slate field label. No kicker, no cut-line. */
export function Label({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 6,
      }}
    >
      <span
        style={{
          fontFamily: SF_STACK,
          fontSize: 13,
          fontWeight: 600,
          color: INK_60,
          letterSpacing: '-0.005em',
        }}
      >
        {children}
      </span>
      {right ? <span style={{ display: 'inline-flex', alignItems: 'center' }}>{right}</span> : null}
    </div>
  );
}

/** Raised panel card with hairline border, 14 radius. */
export function ManageCard({
  children,
  padding = 16,
  className,
  style,
}: {
  children: React.ReactNode;
  padding?: number | 0;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: CARD_BG,
        border: `1px solid ${HAIR}`,
        borderRadius: 14,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Section group label (Settings tab). Uppercase slate, no cut-line. */
export function GroupLabel({
  children,
  tone = 'slate',
  style,
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'danger';
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        marginTop: 4,
        marginBottom: 8,
        padding: '0 4px',
        fontFamily: SF_STACK,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: tone === 'danger' ? DANGER : INK_45,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Shared input/textarea/select inline style. */
export const FIELD_STYLE: React.CSSProperties = {
  width: '100%',
  background: FIELD_REST_BG,
  border: `1px solid ${HAIR}`,
  borderRadius: 10,
  padding: '11px 13px',
  fontSize: 15,
  color: INK,
  fontFamily: SF_STACK,
  outline: 'none',
};

/** Quiet slate helper nudge (icon + text), NOT amber. */
export function Nudge({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <p
      style={{
        marginTop: 8,
        marginLeft: 4,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: SF_STACK,
        fontSize: 12,
        color: INK_45,
      }}
    >
      {icon}
      <span>{children}</span>
    </p>
  );
}
