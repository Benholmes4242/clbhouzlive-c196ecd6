/**
 * BRIEF_VERIFICATION_UI — the grouped-list primitives for the verification
 * surface, built ONLY from src/components/manage/ui.tsx tokens.
 *
 * The rules encoded here so no caller can break them:
 *   - 600 is the maximum font weight on this surface.
 *   - a footnote belongs BENEATH its group, never above it.
 *   - a row gets a chevron only when it leads somewhere.
 *   - status colour carries information only: GREEN confirmed, amber waiting,
 *     INK_30 absent.
 */
import React from 'react';
import { ChevronRight, Check } from 'lucide-react';
import {
  SF_STACK,
  INK,
  INK_60,
  INK_45,
  INK_30,
  HAIR,
  GREEN,
  ManageCard,
} from '@/components/manage/ui';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { getAvatarFallbackColor, getInitialsFromName } from '@/lib/avatarFallback';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

/** The one amber on this surface: waiting. Brand amber, as used app-wide. */
export const WAITING = '#F7931E';

export type RowTone = 'confirmed' | 'waiting' | 'absent' | 'neutral';

const TONE_COLOUR: Record<RowTone, string> = {
  confirmed: GREEN,
  waiting: WAITING,
  absent: INK_30,
  neutral: INK_45,
};

/** 15.5/400 intro paragraph. The page's opening sentence — not a title. */
export function Intro({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: SF_STACK,
        fontSize: 15.5,
        fontWeight: 400,
        lineHeight: 1.45,
        color: INK_60,
        margin: '0 0 20px',
        maxWidth: '32em',
      }}
    >
      {children}
    </p>
  );
}

/** 13/600 uppercase group header, sitting ABOVE its card. */
export function GroupHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SF_STACK,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: INK_45,
        padding: '0 4px',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

/** 13/400 INK_45 footnote. ALWAYS rendered beneath the group it explains. */
export function Footnote({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: SF_STACK,
        fontSize: 13,
        fontWeight: 400,
        lineHeight: 1.45,
        color: INK_45,
        margin: '8px 4px 0',
      }}
    >
      {children}
    </p>
  );
}

/** header + card + footnote, in that order. */
export function Group({
  header,
  footnote,
  children,
  style,
}: {
  header?: React.ReactNode;
  footnote?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section style={{ marginBottom: 20, ...style }}>
      {header ? <GroupHeader>{header}</GroupHeader> : null}
      <ManageCard padding={0}>{children}</ManageCard>
      {footnote ? <Footnote>{footnote}</Footnote> : null}
    </section>
  );
}

const ROW_BASE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  minHeight: 44,
  padding: '11px 14px',
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  fontFamily: SF_STACK,
};

/** A tick, a waiting dot, or nothing. Information only. */
export function StatusGlyph({ tone }: { tone: RowTone }) {
  if (tone === 'confirmed') {
    return <Check size={15} strokeWidth={2.5} style={{ color: GREEN, flexShrink: 0 }} aria-hidden />;
  }
  if (tone === 'waiting') {
    return (
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: WAITING,
          flexShrink: 0,
          marginLeft: 3,
          marginRight: 4,
        }}
      />
    );
  }
  if (tone === 'absent') {
    return (
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          border: `1.5px solid ${INK_30}`,
          flexShrink: 0,
          marginLeft: 3,
          marginRight: 4,
        }}
      />
    );
  }
  return null;
}

export interface RowProps {
  label: React.ReactNode;
  /** Secondary line under the label, 13/400 INK_45. */
  sub?: React.ReactNode;
  /** Right-aligned value, 15.5/400. Coloured by `tone` when given. */
  value?: React.ReactNode;
  tone?: RowTone;
  /** Leading status glyph. Defaults to none. */
  glyph?: RowTone;
  /** Rows lead somewhere -> chevron. Rows that do not -> no chevron. */
  onClick?: () => void;
  /** Dim the whole row (a signal that was not provided). */
  dim?: boolean;
  last?: boolean;
}

export function Row({ label, sub, value, tone = 'neutral', glyph, onClick, dim, last }: RowProps) {
  const inner = (
    <>
      {glyph ? <StatusGlyph tone={glyph} /> : null}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 17,
            fontWeight: 400,
            lineHeight: 1.25,
            color: dim ? INK_30 : INK,
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </span>
        {sub ? (
          <span
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 400,
              lineHeight: 1.35,
              color: dim ? INK_30 : INK_45,
              marginTop: 2,
            }}
          >
            {sub}
          </span>
        ) : null}
      </span>
      {value ? (
        <span
          style={{
            fontSize: 15.5,
            fontWeight: 400,
            color: dim ? INK_30 : TONE_COLOUR[tone],
            flexShrink: 0,
            textAlign: 'right',
          }}
        >
          {value}
        </span>
      ) : null}
      {onClick ? (
        <ChevronRight size={18} strokeWidth={2} style={{ color: INK_30, flexShrink: 0 }} aria-hidden />
      ) : null}
    </>
  );

  const style: React.CSSProperties = {
    ...ROW_BASE,
    borderTop: last === undefined ? undefined : undefined,
  };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={{ ...style, cursor: 'pointer' }} className="active:opacity-60">
        {inner}
      </button>
    );
  }
  return <div style={style}>{inner}</div>;
}

/** Hairline between rows inside a card. */
export function RowDivider() {
  return <div style={{ height: 1, background: HAIR, marginLeft: 14 }} />;
}

/** Lays out rows with hairlines between them. */
export function RowList({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <RowDivider /> : null}
          {child}
        </React.Fragment>
      ))}
    </>
  );
}

/** THE ONE filled button per screen. INK, never amber. */
export function FilledButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full active:opacity-90 transition-opacity"
      style={{
        minHeight: 50,
        borderRadius: 12,
        background: INK,
        /* INK is A.INK (near-white): the label takes CANVAS, not white. */
        color: A.CANVAS,
        fontFamily: SF_STACK,
        fontSize: 16,
        fontWeight: 600,
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

/** Everything that is not the one filled button. */
export function PlainButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full active:opacity-60 transition-opacity"
      style={{
        minHeight: 50,
        borderRadius: 12,
        background: 'transparent',
        border: `1px solid ${HAIR}`,
        color: INK,
        fontFamily: SF_STACK,
        fontSize: 16,
        fontWeight: 400,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/**
 * §4.2 THE BUSINESS ROW — their own logo, resolved exactly as
 * BusinessProfileHero does: logoUrl, falling back to initials on
 * getAvatarFallbackColor(fallbackKey || name). No placeholder, no stock image.
 */
export function BusinessRow({
  name,
  logoUrl,
  fallbackKey,
  secondary,
  verified,
}: {
  name: string;
  logoUrl?: string | null;
  fallbackKey?: string | null;
  secondary?: string | null;
  verified?: boolean;
}) {
  const initials = getInitialsFromName(name) || 'B';
  return (
    <div style={{ ...ROW_BASE, minHeight: 64, padding: '12px 14px' }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '34%',
          overflow: 'hidden',
          flexShrink: 0,
          border: `1px solid ${HAIR}`,
          background: logoUrl ? '#E9ECF2' : getAvatarFallbackColor(fallbackKey || name),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span
            aria-hidden
            style={{
              fontFamily: SF_STACK,
              fontSize: 16,
              fontWeight: 600,
              color: '#FFFFFF',
              letterSpacing: '0.01em',
            }}
          >
            {initials}
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            className="truncate"
            style={{ fontSize: 17, fontWeight: 600, color: INK, letterSpacing: '-0.01em' }}
          >
            {name}
          </span>
          {verified ? <VerifiedBadge size="sm" /> : null}
        </div>
        {secondary ? (
          <div style={{ fontSize: 13, fontWeight: 400, color: INK_45, marginTop: 2 }} className="truncate">
            {secondary}
          </div>
        ) : null}
      </div>
    </div>
  );
}
