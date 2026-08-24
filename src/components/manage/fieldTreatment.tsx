/**
 * THE ONE FIELD VOCABULARY for both profile editors.
 *
 * Replaces business/editor/editorStyles.ts (deleted) and the ad-hoc field
 * classes that were repeated inside ManageProfile. Personal and business
 * already share their shell (SectionCard); they now share their fields too.
 *
 * Type scale is the lighter business scale from BRIEF_BUSINESS_INSIGHTS:
 * nothing here renders at weight 800, and focus is INK, never amber.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { A, BIZ_LABEL } from '@/features/courses/components/holes/analytical/tokens';

/** Field label: LABEL caps 8px DIM above the input. */
export const FIELD_LABEL: React.CSSProperties = { ...BIZ_LABEL };

/** Counter: LABEL caps 7.5px tabular, right-aligned on the label row. */
export const FIELD_COUNTER: React.CSSProperties = {
  ...BIZ_LABEL,
  fontSize: 7.5,
  fontVariantNumeric: 'tabular-nums',
};

/** Hint: LABEL caps 7.5px beneath the input. */
export const FIELD_HINT: React.CSSProperties = {
  ...BIZ_LABEL,
  fontSize: 7.5,
  lineHeight: 1.5,
  marginTop: 6,
};

/**
 * Input treatment. DARK-ONLY. The literal hexes/alphas mirror A.BORDER and the
 * manage FIELD_FILL - Tailwind arbitrary values cannot be interpolated at
 * build time. Focus ring is white-alpha, never amber.
 */
export const FIELD_INPUT_CLASS =
  'w-full rounded-[11px] focus:outline-none focus:ring-1 focus:ring-[rgba(255,255,255,0.34)] focus:border-[rgba(255,255,255,0.22)] border border-[rgba(255,255,255,0.10)] transition-colors';

export const FIELD_INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  padding: '12px 13px',
  fontSize: 14,
  fontWeight: 400,
  color: A.INK,
  borderRadius: 11,
};

/** Placeholder is CHROME at the 0.62 quiet floor; filled text is INK. */
export const FIELD_PLACEHOLDER_CLASS = 'placeholder:text-[rgba(248,250,252,0.62)]';

/** Error state: red hairline + red hint, no fill change. */
export const FIELD_ERROR_CLASS =
  'w-full rounded-[11px] focus:outline-none focus:ring-1 focus:ring-[#FF5A5A] border border-[#FF5A5A] transition-colors';

/** Disabled: reads as present but inert. */
export const FIELD_DISABLED_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(248,250,252,0.62)',
};

/** LOCKED: the quiet inset, NO border. Its explanation lives in the hint slot. */
export const LOCKED_CLASS = 'flex items-center gap-2 rounded-[11px]';
export const LOCKED_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: 'none',
  borderRadius: 11,
  padding: '12px 13px',
  fontSize: 14,
  fontWeight: 400,
  color: A.MUTE,
};

/** Class-name equivalents, for sections that style with Tailwind. */
export const LABEL_CLASS = 'text-[8px] font-bold uppercase tracking-[0.16em] text-[rgba(248,250,252,0.62)]';
export const HINT_CLASS = 'text-[7.5px] font-bold uppercase tracking-[0.16em] text-[rgba(248,250,252,0.62)] mt-1.5';

/** Label row with an optional right slot (counter, quiet action). */
export function FieldLabel({
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
      <span style={FIELD_LABEL}>{children}</span>
      {right ? <span style={{ display: 'inline-flex', alignItems: 'center' }}>{right}</span> : null}
    </div>
  );
}

/**
 * THE quiet action in this treatment: LABEL caps with a chevron.
 * Replaces every mid-sentence underline on both editors.
 */
export function QuietAction({
  children,
  onClick,
  as = 'button',
  href,
  center,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  as?: 'button' | 'a';
  href?: string;
  center?: boolean;
}) {
  const style: React.CSSProperties = {
    ...BIZ_LABEL,
    color: A.INK,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    minHeight: 44,
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
  const inner = (
    <>
      {children}
      <ChevronRight size={9} strokeWidth={3} />
    </>
  );
  if (as === 'a') {
    return (
      <a href={href} style={style}>
        {inner}
      </a>
    );
  }
  return (
    <div style={center ? { display: 'flex', justifyContent: 'center' } : undefined}>
      <button type="button" onClick={onClick} style={style}>
        {inner}
      </button>
    </div>
  );
}
