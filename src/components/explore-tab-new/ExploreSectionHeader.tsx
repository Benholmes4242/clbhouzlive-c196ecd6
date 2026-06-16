import { memo } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { AMBER, INK, INK_MUTE } from '@/features/courses/_shared/tokens';

interface ExploreSectionHeaderProps {
  /** Optional uppercase kicker above the title (e.g. "FROM YOUR FRIENDS"). */
  kicker?: string;
  /** Kicker tone — defaults to canonical slate. Use 'amber' or 'emerald' for intentional emphasis. */
  kickerColor?: 'slate' | 'amber' | 'emerald';
  /** Section title. */
  title: string;
  /** Optional icon rendered as a mark tile to the left of the title. */
  icon?: LucideIcon;
  /** Mark tile tone — defaults to amber. Use 'ink' for "serious data / browse-everything" sections. */
  iconTone?: 'amber' | 'ink';
  /** Optional second-line subhead. */
  sub?: string;
  /** Optional right-side action affordance ("See all", etc.). */
  action?: { label: string; onClick: () => void };
  /** Padding above the header. Defaults to 32px (Explore editorial rhythm). */
  paddingTop?: number;
  /** Padding to the left/right. Defaults to 16px. */
  paddingX?: number;
}

const KICKER_COLOR_MAP: Record<NonNullable<ExploreSectionHeaderProps['kickerColor']>, string> = {
  slate: INK_MUTE,
  amber: '#c97a10', // AA-safe amber on white surfaces
  emerald: '#006747',
};

/**
 * Canonical section header for the Courses → Discover sub-tab (also shared by
 * Explore/Passport/Community/Reviews).
 *
 * Phase 1 warmth pass: titles are ALWAYS 22/800 headlines (no more icon-shrink),
 * the `icon` prop renders as a small mark tile beside the text column, and the
 * amber kicker uses an AA-safe tone. Mirror the Watch primitive's shape — do
 * NOT import across surfaces.
 */
function ExploreSectionHeaderInner({
  kicker,
  kickerColor = 'slate',
  title,
  icon: Icon,
  iconTone = 'amber',
  sub,
  action,
  paddingTop = 32,
  paddingX = 16,
}: ExploreSectionHeaderProps) {
  const markBg =
    iconTone === 'ink'
      ? 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)'
      : AMBER;
  const markShadow =
    iconTone === 'ink'
      ? '0 4px 10px -2px rgba(15,23,42,0.30)'
      : '0 4px 10px -2px rgba(247,147,30,0.40)';

  const textColumn = (
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
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          color: INK,
          margin: `${kicker ? 5 : 0}px 0 0`,
          textTransform: 'none',
        }}
      >
        {title}
      </h2>
      {sub ? (
        <p
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: INK_MUTE,
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
        gap: 12,
        padding: `${paddingTop}px ${paddingX}px 12px`,
      }}
    >
      {Icon ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 30,
              height: 30,
              borderRadius: 8,
              background: markBg,
              boxShadow: markShadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: kicker ? 2 : 0,
            }}
          >
            <Icon size={15} strokeWidth={2.4} color="#FFFFFF" />
          </div>
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
            marginTop: kicker ? 6 : 2,
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
