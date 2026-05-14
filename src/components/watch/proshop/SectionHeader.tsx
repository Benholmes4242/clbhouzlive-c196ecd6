import { memo } from 'react';
import { Kicker } from './Kicker';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  kicker?: string;
  kickerColor?: 'amber' | 'emerald' | 'slate';
  title: string;
  sub?: string;
  action?: { label: string; onClick: () => void };
  paddingTop?: number;
}

/**
 * Pro Shop primitive — editorial section header with kicker, title, optional
 * subhead and action CTA. Used at the top of every rail in the Watch tab.
 *
 * Canonical alignment phase: tokens now match Tour Hub section headers (slate
 * kicker default, 18/800 title, slate-500 sub, ink-bold action). API is
 * unchanged; consumers inherit the new look automatically.
 */
function SectionHeaderInner({
  kicker,
  kickerColor = 'slate',
  title,
  sub,
  action,
  paddingTop = 24,
}: SectionHeaderProps) {
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
      <div style={{ minWidth: 0, flex: 1 }}>
        {kicker ? <Kicker color={kickerColor}>{kicker}</Kicker> : null}
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
            color: '#0F172A',
            margin: 0,
          }}
        >
          {title}
        </h2>
        {sub ? (
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#64748B',
              margin: '3px 0 0',
              lineHeight: 1.35,
            }}
          >
            {sub}
          </p>
        ) : null}
      </div>

      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="active:scale-[0.97] transition-transform"
          style={{
            // Phase 5b: 44px iOS-minimum touch target via invisible padding
            // (negative margin keeps the visual baseline aligned with the
            // header text above). Visual size unchanged — only hit area grows.
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '-0.005em',
            // Canonical action affordance: ink-bold + chevron. Matches the
            // pattern used across handicap, Tour Hub, Profile, Search, etc.
            // The chevron carries the "click me" affordance; the ink colour
            // ensures AA contrast on white without needing accent text.
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
