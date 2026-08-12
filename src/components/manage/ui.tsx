/**
 * Manage Profile - Direction A primitives.
 * Quiet slate labels, no amber kickers, no amber cut-lines.
 * Used by /edit-profile (Profile tab + Settings tab).
 */
import React from 'react';

export const SF_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const INK = '#0F172A';
export const INK_60 = '#475569';
export const INK_45 = '#64748B';
export const INK_30 = '#94A3B8';
export const HAIR = 'rgba(15,23,42,0.08)';
export const PAGE_BG = '#F8FAFC';
export const FIELD_FILL = '#F8FAFC';
export const GREEN = '#059669';
export const DANGER = '#DC2626';

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

/** White card with hairline border, 14 radius. */
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
        background: '#ffffff',
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
  background: FIELD_FILL,
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
