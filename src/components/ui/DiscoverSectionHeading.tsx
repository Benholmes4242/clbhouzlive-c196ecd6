import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { formatNumber } from '@/i18n/format';

/**
 * ONE SECTION HEADING FOR DISCOVER (BRIEF_DISCOVER_SECTION_HEADS_SENTENCE_CASE).
 *
 * Scores, News and Watch each had their own treatment; this is the single one.
 * A sports app sets its section heads as HEADINGS — 16 / 700 / sentence case —
 * rather than tracked-out small caps, which read as instrument panel.
 *
 * It lives in components/ui because all three Discover tabs plus the SHARED
 * StoryChipRail (which also serves Tour Hub) must reach it, so it cannot sit
 * inside any one tab's directory.
 *
 * RULES: no weight above 700, no textTransform, never amber. The right slot is
 * genuinely absent when no string is passed — News renders no empty space.
 */

/** Groups every digit run through the app's one number formatter, so "3520 rounds" reads "3,520 rounds". */
function withSeparators(text: string): string {
  return text.replace(/\d+/g, (digits) => formatNumber(Number(digits)));
}

interface DiscoverSectionHeadingProps {
  title: string;
  /** Optional right-hand string — "See all 104", "3,520 rounds". Omit for no slot. */
  right?: string | null;
  /** When present the right slot is a button. */
  onRightPress?: () => void;
  id?: string;
}

export function DiscoverSectionHeading({ title, right, onRightPress, id }: DiscoverSectionHeadingProps) {
  const rightText = right ? withSeparators(right) : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 10,
        fontFamily: SANS,
      }}
    >
      <h2
        id={id}
        style={{
          minWidth: 0,
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          color: A.INK,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </h2>
      {rightText ? (
        onRightPress ? (
          <button
            type="button"
            onClick={onRightPress}
            className="tabular-nums lining-nums"
            style={{
              flexShrink: 0,
              padding: 0,
              border: 0,
              background: 'transparent',
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 700,
              color: A.MUTE,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {rightText}
          </button>
        ) : (
          <span
            className="tabular-nums lining-nums"
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 700,
              color: A.MUTE,
              whiteSpace: 'nowrap',
            }}
          >
            {rightText}
          </span>
        )
      ) : null}
    </div>
  );
}
