/**
 * SeasonRow — one row in the schedule-v2 open ledger.
 *
 * States: completed, live, and upcoming share the overview's flat row grammar.
 * Edge-to-edge hairlines and whitespace carry the structure; each row has one
 * centred figure stack at most.
 *
 * Scores follow golf convention through the canonical getScoreColor helper:
 * under par RED, even par MUTED, over par INK.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatMonthShort } from '@/i18n/format';
import { getScoreColor } from '../_shared/scoreColor';
import type { SeasonEvent } from './useSeasonTimeline';
import { TOUR_LABEL } from '../_shared/tourOrder';
import {
  FONT,
  AMBER,
  GOLD_DEEP,
  INK,
  INK_MUTE,
  TREND_UP,
  WHITE_ALPHA_06,
} from '../_shared/tokens';

/* PLAYOFFS VIOLET. These were Tailwind violet-600 (#7C3AED), which is not the
   playoffs token. Pinned to the documented V4 playoffs identity and its DARK
   tint rather than imported, because V4 is still the LIGHT overview ramp until
   BRIEF_TOUR_OVERVIEW_FULL_DARK Part B shipped. THAT BRIEF HAS SINCE LANDED and
   V4 now carries exactly these two values (V4.violet '#5E4DA8',
   V4.violetSoft 'rgba(94,77,168,0.22)'), so these pins are no longer an interim —
   they are duplicates. Converging them on V4 is a no-op in value and is left for
   whoever next touches the playoffs identity. */
const VIOLET = '#5E4DA8';
const VIOLET_TINT = 'rgba(94,77,168,0.22)';

function dayMonth(iso: string): string {
  return `${iso.slice(8, 10)} ${shortMonth(iso)}`;
}
function shortMonth(iso: string): string {
  // Route through Wave-1 wrapper; upper-case at call site (matches player-v2,
  // ComingUp).
  return formatMonthShort(new Date(iso)).toUpperCase();
}

export interface SeasonRowProps {
  event: SeasonEvent;
  anchorRef?: React.Ref<HTMLDivElement>;
  isAnchor?: boolean;
  last?: boolean;
  onSelect: (event: SeasonEvent) => void;
}

export const SeasonRow: React.FC<SeasonRowProps> = ({
  event,
  anchorRef,
  last = false,
  onSelect,
}) => {
  const { t } = useTranslation('tourhub');
  const isLive = event.state === 'live';
  const isDone = event.state === 'completed';


  const championName = event.champion?.displayName || event.champion?.name || null;
  const leaderName = event.leader
    ? event.leader.tiedCount > 1
      ? t('schedule.leader.tied', { count: event.leader.tiedCount })
      : event.leader.displayName || event.leader.name
    : null;
  const figure = isDone && event.champion
    ? { label: event.champion.scoreText, name: championName, score: event.champion.score, kind: 'score' as const }
    : isLive && event.leader
      ? { label: event.leader.totalText, name: leaderName, score: event.leader.score, kind: 'score' as const }
      : event.state === 'upcoming' && event.defendingChampion?.name
        ? { label: t('schedule.badge.defends'), name: event.defendingChampion.name, score: null, kind: 'defends' as const }
        : null;

  const rowStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 76,
    padding: '13px 24px',
    display: 'grid',
    gridTemplateColumns: figure ? 'minmax(0,1fr) auto' : 'minmax(0,1fr)',
    alignItems: 'center',
    columnGap: 12,
    border: 0,
    borderBottom: last ? 'none' : `1px solid ${WHITE_ALPHA_06}`,
    background: 'transparent',
    color: INK,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: FONT,
  };

  const venueLine = [event.venueName, event.venueCity].filter(Boolean).join(' · ');
  const tourLabel = event.tourSlug ? (TOUR_LABEL[event.tourSlug] ?? event.tourSlug) : null;

  return (
    <div ref={anchorRef}>
      <button type="button" onClick={() => onSelect(event)} style={rowStyle}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 5, overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 9.5, lineHeight: 1.2, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK_MUTE }}>
            <span>{[tourLabel, dayMonth(event.startDate)].filter(Boolean).join(' · ')}</span>
            {isDone && event.champion ? <span style={{ color: AMBER }}>· {t('schedule.badge.champion')}</span> : null}
            {event.isMajor ? <MajorChip /> : null}
            {event.isPlayoff && !event.isMajor ? <PlayoffChip /> : null}
          </span>
          <span style={{ display: '-webkit-box', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, fontSize: 14, fontWeight: 700, lineHeight: 1.28 }}>
            {event.name}
          </span>
          {(isLive || venueLine) ? (
            <span style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginTop: 3, fontSize: 12, color: INK_MUTE }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {isLive ? <><span style={{ color: TREND_UP, fontWeight: 700 }}>{t('status.live')}</span>{venueLine ? ' · ' : ''}</> : null}
                {venueLine}
              </span>
            </span>
          ) : null}
        </span>
        {figure ? (
          <span style={{ flex: 'none', textAlign: 'right' }}>
            <span style={{ display: 'block', whiteSpace: 'nowrap', fontSize: figure.kind === 'defends' ? 9.5 : 16, lineHeight: 1.2, fontWeight: 800, letterSpacing: figure.kind === 'defends' ? '0.1em' : undefined, textTransform: figure.kind === 'defends' ? 'uppercase' : undefined, color: figure.kind === 'score' ? getScoreColor(figure.score, 'dark') : INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>{figure.label}</span>
            <span style={{ display: 'block', marginTop: 2, whiteSpace: 'nowrap', fontSize: 12, color: INK_MUTE }}>{figure.name}</span>
          </span>
        ) : null}
      </button>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────

const MajorChip: React.FC = () => {
  const { t } = useTranslation('tourhub');
  return (
    <span
      style={{
        flex: 'none',
        // AXIS 10: MAJOR is a marker on the row, not a sentence.
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.16em',
        color: GOLD_DEEP,
        padding: '2px 6px',
        borderRadius: 4,
        background: 'linear-gradient(135deg, rgba(255,184,0,0.18), rgba(255,184,0,0.06))',
        textTransform: 'uppercase',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {t('schedule.badge.major')}
    </span>
  );
};

const PlayoffChip: React.FC = () => {
  const { t } = useTranslation('tourhub');
  return (
    <span
      style={{
        flex: 'none',
        // AXIS 10: PLAYOFFS is a marker on the row, not a sentence.
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.16em',
        color: VIOLET,
        padding: '2px 6px',
        borderRadius: 4,
        background: VIOLET_TINT,
        textTransform: 'uppercase',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {t('schedule.badge.playoffs')}
    </span>
  );
};

export default SeasonRow;
