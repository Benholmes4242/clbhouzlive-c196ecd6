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
 */
function SectionHeaderInner({
  kicker,
  kickerColor = 'amber',
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
            fontSize: 20,
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
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(15,23,42,0.55)',
              margin: '4px 0 0',
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
            fontSize: 12,
            fontWeight: 600,
            // Phase 5b: #c97a10 = canonical "amber on white" CTA colour.
            // It is the AA-contrast pair of brand amber #F7931E (which fails
            // AA on white). Two ambers, two roles, one brand:
            //   #F7931E → fills, accents, kickers (decorative)
            //   #c97a10 → text on white surfaces (legibility)
            color: '#c97a10',
            background: 'transparent',
            border: 'none',
            minHeight: 44,
            padding: '12px 0 12px 16px',
            margin: `${(kicker ? 13 : 2) - 12}px -12px -12px 0`,
            flexShrink: 0,
          }}
        >
          {action.label}
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}

export const SectionHeader = memo(SectionHeaderInner);
