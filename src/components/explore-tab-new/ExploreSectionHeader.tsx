import { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { AMBER, INK, INK_MUTE } from '@/features/courses/_shared/tokens';

interface ExploreSectionHeaderProps {
  /** Optional uppercase kicker above the title (e.g. "FROM YOUR FRIENDS"). */
  kicker?: string;
  /** Kicker tone — defaults to canonical slate. Use 'amber' or 'emerald' for intentional emphasis. */
  kickerColor?: 'slate' | 'amber' | 'emerald';
  /** Section title. */
  title: string;
  /** Optional second-line subhead. */
  sub?: string;
  /** Optional right-side action affordance ("See all", etc.). */
  action?: { label: string; onClick: () => void };
  /** Padding above the header. Defaults to 24px (Explore editorial rhythm). */
  paddingTop?: number;
  /** Padding to the left/right. Defaults to 16px. */
  paddingX?: number;
}

const KICKER_COLOR_MAP: Record<NonNullable<ExploreSectionHeaderProps['kickerColor']>, string> = {
  slate: '#64748B',
  amber: '#F7931E',
  emerald: '#006747',
};

const INK = '#0F172A';
const SUB = '#64748B';

/**
 * Canonical section header for the Explore tab.
 *
 * Tokens align with Tour Hub: 18/800 title, slate-500 kicker at 0.16em,
 * slate-500 sub, ink-bold action with chevron. Same visual identity as
 * the rest of the analytical surfaces (handicap, Profile, Friends, etc.).
 *
 * Replaces the 12 duplicate inline `fontSize: 18, fontWeight: 900` section
 * header declarations that were scattered across the Explore tab files.
 */
function ExploreSectionHeaderInner({
  kicker,
  kickerColor = 'slate',
  title,
  sub,
  action,
  paddingTop = 24,
  paddingX = 16,
}: ExploreSectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
        padding: `${paddingTop}px ${paddingX}px 12px`,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        {kicker ? (
          <p
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: KICKER_COLOR_MAP[kickerColor],
              margin: 0,
              lineHeight: 1,
            }}
          >
            {kicker}
          </p>
        ) : null}
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-0.015em',
            lineHeight: 1.2,
            color: INK,
            margin: `${kicker ? 6 : 0}px 0 0`,
          }}
        >
          {title}
        </h2>
        {sub ? (
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: SUB,
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
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            minHeight: 32,
            padding: '4px 0 4px 8px',
            background: 'transparent',
            border: 'none',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '-0.005em',
            color: INK,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {action.label}
          <ChevronRight size={12} strokeWidth={2.4} color={INK} />
        </button>
      ) : null}
    </div>
  );
}

export const ExploreSectionHeader = memo(ExploreSectionHeaderInner);
