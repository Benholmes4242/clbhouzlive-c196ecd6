import { memo, type ReactNode } from 'react';
import { Kicker } from './Kicker';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  kicker?: string;
  kickerColor?: 'amber' | 'emerald' | 'slate';
  title: string;
  sub?: string;
  action?: { label: string; onClick: () => void };
  paddingTop?: number;
  /** Optional left-aligned section mark (icon/glyph), e.g. ClipsMark, VideosMark. */
  mark?: ReactNode;
}

/**
 * Pro Shop primitive — editorial section header with kicker, title, optional
 * subhead and action CTA. Used at the top of every rail in the Watch tab.
 *
 * Phase 1 warmth pass: larger title (22/800), tighter tracking, more
 * vertical rhythm (default paddingTop 34), and an optional `mark` slot
 * for bespoke section identity glyphs.
 */
function SectionHeaderInner({
  kicker,
  kickerColor = 'slate',
  title,
  sub,
  action,
  paddingTop = 34,
  mark,
}: SectionHeaderProps) {
  const textColumn = (
    <div style={{ minWidth: 0, flex: 1 }}>
      {kicker ? <Kicker color={kickerColor}>{kicker}</Kicker> : null}
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: '#0F172A',
          margin: 0,
        }}
      >
        {title}
      </h2>
      {sub ? (
        <p
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: '#64748B',
            margin: '4px 0 0',
            lineHeight: 1.4,
          }}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        padding: `${paddingTop}px 16px 12px`,
      }}
    >
      {mark ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            minWidth: 0,
            flex: 1,
          }}
        >
          <div style={{ flexShrink: 0 }}>{mark}</div>
          {textColumn}
        </div>
      ) : (
        textColumn
      )}

      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="active:scale-[0.97] transition-transform"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '-0.005em',
            color: '#0F172A',
            background: 'transparent',
            border: 'none',
            minHeight: 44,
            padding: '12px 0 12px 16px',
            margin: `${(kicker ? 13 : 2) - 12}px -12px -12px 0`,
            flexShrink: 0,
          }}
        >
          {action.label}
          <ChevronRight size={12} strokeWidth={2.4} />
        </button>
      ) : null}
    </div>
  );
}

export const SectionHeader = memo(SectionHeaderInner);
