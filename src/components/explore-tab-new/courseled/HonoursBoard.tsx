import { useTranslation } from 'react-i18next';

import { formatOrdinal, formatYearNumeric } from '@/i18n/format';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { WireEvent } from '../hooks/useDiscoverWire';
import { A, InkAction, LABEL, SANS } from './tokens';
import { GOLD_INK, GOLD_HAIR, HONOURS_SHELL } from './honoursTokens';
import { HonoursPanel as HonoursPanelShell } from './DiscoverCourseLedSkeleton';

/**
 * Section 6 — THE HONOURS BOARD (light mode; no dark values on this page).
 *
 * Every ace and albatross on the platform, never windowed, dated by YEAR.
 * The only gold-bordered panel on Discover — that is its distinction.
 * Ordering: RARITY GROUP then RECENCY (aces grouped, albatrosses grouped,
 * newest first inside each group).
 *
 * THE ROW LEADS WITH THE HOLDER, not a numeral. The old 30x30 gold ring drew
 * the score on the hole — a "1" on every ace, restating the feat line beside
 * it. The same 30px now says WHO, which is the only thing a hall of fame is
 * about.
 *
 * AMBER DISCIPLINE: amber/gold means the viewing member. The year keeps gold
 * (the board's own chronology, and the row's only figure); the feat line is
 * body ink. On a row the member is in, THEIR NAME is the only amber text.
 */

export { GOLD_INK, GOLD_HAIR, GOLD_BORDER, HONOURS_WASH, HONOURS_SHELL } from './honoursTokens';

/**
 * The holder, 30x30. Canonical squircle geometry with the canonical 1px traced
 * hairline — NO gold border: the tile is the person, not an ornament. With no
 * photo, SquircleAvatar renders the member's initials on a deterministic
 * neutral fill; it never falls back to the old numeral ring.
 */
function HolderAvatar({ event: e }: { event: WireEvent }) {
  return (
    <span style={{ flex: '0 0 auto', display: 'block' }}>
      <SquircleAvatar
        size={34}
        src={e.actorAvatar}
        alt={e.actorName}
        userId={e.userId}
        hairlineRing
      />
    </span>
  );
}



export function sortHonours(events: WireEvent[]): WireEvent[] {
  const groupRank = (e: WireEvent) => (e.kind === 'ace' ? 0 : 1);
  return [...events].sort(
    (a, b) =>
      groupRank(a) - groupRank(b) || new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

export function HonoursRow({
  event: e,
  last,
  onPress,
}: {
  event: WireEvent;
  last: boolean;
  onPress?: (event: WireEvent) => void;
}) {
  const { t } = useTranslation('courses');
  const isAce = e.kind === 'ace';
  const tappable = !!onPress && !!e.scoreId;

  const feat =
    e.holeNo != null
      ? t(
          isAce ? 'discover.row.aceTight' : 'discover.row.albatrossTight',
          isAce ? 'Hole in one, {{hole}} hole' : 'Albatross, {{hole}} hole',
          { hole: formatOrdinal(e.holeNo) },
        )
      : t(
          isAce ? 'discover.row.aceNoHole' : 'discover.row.albatrossNoHole',
          isAce ? 'Hole in one' : 'Albatross',
        );


  const who = e.isOwn ? t('discover.wire.you', 'You') : e.actorName;

  return (
    <button
      type="button"
      onClick={
        tappable
          ? (ev) => {
              ev.stopPropagation();
              onPress?.(e);
            }
          : undefined
      }
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        width: '100%',
        padding: '11px 0',
        border: 'none',
        background: 'transparent',
        borderBottom: last ? 'none' : `1px solid ${GOLD_HAIR}`,
        textAlign: 'left',
        fontFamily: SANS,
        cursor: tappable ? 'pointer' : 'default',
      }}
    >
      <HolderAvatar event={e} />

      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 13.5,
            fontWeight: 700,
            color: A.INK,
            letterSpacing: '-0.015em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {e.courseName ?? t('discover.unknownCourse', 'Course')}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: A.MUTE,
            lineHeight: 1.32,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {feat}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 11.5,
            fontWeight: e.isOwn ? 700 : 600,
            lineHeight: 1.32,
            color: e.isOwn ? A.AMBER_DEEP : A.BODY,
            marginTop: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {who}
        </span>
      </span>

      {/* THE YEAR ANCHORS THE CHRONOLOGY, it no longer leads the row. */}
      <span
        style={{
          ...LABEL,
          fontSize: 9,
          color: GOLD_INK,
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums lining',
        }}
      >
        {formatYearNumeric(e.at)}
      </span>

    </button>
  );
}

interface Props {
  events: WireEvent[];
  /** Cap on the page panel. The sheet passes the full length. */
  limit?: number;
  /** TRUE while the wire read has not settled — the gold shell holds the slot. */
  isPending?: boolean;
  showHeader?: boolean;
  onRowPress?: (event: WireEvent) => void;
  onSeeAll?: () => void;
}

export function HonoursBoard({
  events,
  limit = 5,
  isPending = false,
  showHeader = true,
  onRowPress,
  onSeeAll,
}: Props) {
  const { t } = useTranslation('courses');
  if (isPending) return <HonoursPanelShell />;
  if (events.length === 0) return null;


  const ordered = sortHonours(events);
  const shown = ordered.slice(0, limit);
  const overflow = ordered.length > shown.length;

  return (
    <section>
      <div style={{ ...HONOURS_SHELL, padding: '4px 14px', fontFamily: SANS }}>
        {showHeader ? (
          <div
            style={{
              padding: '14px 0 12px',
              borderBottom: `1px solid ${GOLD_HAIR}`,
            }}
          >
            {/* SECTION GRAMMAR: eyebrow left, sample size right. The COUNT is
                the whole board (`events`), never `shown` — the page caps at 5
                and the sheet holds the rest. */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: GOLD_INK,
                }}
              >
                {t('discover.honoursTitle', 'The honours board')}
              </div>
              <div
                style={{
                  ...LABEL,
                  fontSize: 9,
                  color: A.DIM,
                  marginLeft: 'auto',
                  fontVariantNumeric: 'tabular-nums lining',
                }}
              >
                {t('discover.honoursOnTheBoard', '{{count}} on the board', {
                  count: events.length,
                })}
              </div>
            </div>
            <div
              style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.35, color: A.MUTE, marginTop: 5 }}
            >
              {t(
                'discover.honoursWhatItIs',
                'Every ace and albatross in clbhouz history',
              )}
            </div>
          </div>
        ) : null}


        {shown.map((e, i) => (
          <HonoursRow
            key={e.id}
            event={e}
            last={i === shown.length - 1 && !(overflow && onSeeAll)}
            onPress={onRowPress}
          />
        ))}

        {overflow && onSeeAll ? (
          <div style={{ padding: '11px 0 13px' }}>
            <InkAction onClick={onSeeAll}>
              {t('discover.honoursSeeAll', 'See all {{count}}', { count: ordered.length })}
            </InkAction>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default HonoursBoard;
