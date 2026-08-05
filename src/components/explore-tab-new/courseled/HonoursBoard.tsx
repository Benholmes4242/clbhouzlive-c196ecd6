import { useTranslation } from 'react-i18next';

import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { formatOrdinal, formatYearNumeric } from '@/i18n/format';
import type { WireEvent } from '../hooks/useDiscoverWire';
import { A, InkAction, SANS, NUMF } from './tokens';

/**
 * Section 6 — THE HONOURS BOARD (light mode; no dark values on this page).
 *
 * Every ace and albatross on the platform, never windowed, dated by YEAR.
 * The only gold-bordered panel on Discover — that is its distinction.
 * Ordering: RARITY GROUP then RECENCY (aces grouped, albatrosses grouped,
 * newest first inside each group).
 */

export const GOLD_INK = '#A87718';
export const GOLD_HAIR = 'rgba(216,169,60,0.22)';
export const GOLD_BORDER = 'rgba(216,169,60,0.35)';
export const HONOURS_WASH = '#FDFBF5';

export const HONOURS_SHELL: React.CSSProperties = {
  background: HONOURS_WASH,
  border: `1px solid ${GOLD_BORDER}`,
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
};

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
  const par = e.holePar ?? (isAce ? 3 : 5);
  const strokes = isAce ? 1 : Math.max(1, par - 3);
  const tappable = !!onPress && !!e.scoreId;

  const feat =
    e.holeNo != null
      ? t(
          isAce ? 'discover.row.ace' : 'discover.row.albatross',
          isAce
            ? 'Hole in one - the {{hole}}, par {{par}}'
            : 'Albatross - the {{hole}}, par {{par}}',
          { hole: formatOrdinal(e.holeNo), par },
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
      <ScoreMark strokes={strokes} par={par} size={34} />

      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 13.5,
            fontWeight: 800,
            color: A.INK,
            letterSpacing: '-0.01em',
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
            fontSize: 11,
            fontWeight: 600,
            color: GOLD_INK,
            lineHeight: 1.35,
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
            fontSize: 11,
            fontWeight: e.isOwn ? 700 : 500,
            color: e.isOwn ? A.AMBER_DEEP : A.MUTE,
            marginTop: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {who}
        </span>
      </span>

      <span style={{ ...NUMF, fontSize: 16, color: GOLD_INK, flexShrink: 0 }}>
        {formatYearNumeric(e.at)}
      </span>
    </button>
  );
}

interface Props {
  events: WireEvent[];
  /** Cap on the page panel. The sheet passes the full length. */
  limit?: number;
  showHeader?: boolean;
  onRowPress?: (event: WireEvent) => void;
  onSeeAll?: () => void;
}

export function HonoursBoard({
  events,
  limit = 5,
  showHeader = true,
  onRowPress,
  onSeeAll,
}: Props) {
  const { t } = useTranslation('courses');
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
              textAlign: 'center',
              borderBottom: `1px solid ${GOLD_HAIR}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: GOLD_INK,
              }}
            >
              {t('discover.honoursTitle', 'The honours board')}
            </div>
            <div style={{ fontSize: 10.5, color: A.MUTE, marginTop: 5 }}>
              {t('discover.honoursCaption', 'Every ace and albatross in clbhouz history')}
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
