/**
 * SeasonRow — one row in the schedule-v2 open ledger.
 *
 * States: completed (champion strip), live (leader strip + green LIVE mark),
 * upcoming (days-away rail + defends strip). No hairlines, no row wash, no
 * opacity dim: the column grid and whitespace carry the structure.
 *
 * Scores follow golf convention through the canonical getScoreColor helper:
 * under par RED, even par MUTED, over par INK.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { formatMonthShort } from '@/i18n/format';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import { getScoreColor } from '../_shared/scoreColor';
import { formatPurse } from '../_shared/formatPurse';
import type { SeasonEvent } from './useSeasonTimeline';
import { TOUR_LABEL } from '../_shared/tourOrder';
import {
import { FIGS } from '@/lib/tokens/type';
  AMBER,
  FONT,
  GOLD,
  GOLD_DEEP,
  INK,
  INK_FAINT,
  INK_MUTE,
  LIVE_DOT,
} from '../_shared/tokens';

const VIOLET = '#7C3AED';
const VIOLET_TINT = 'rgba(124,58,237,0.10)';

function shortDay(iso: string): string {
  return String(parseInt(iso.slice(8, 10), 10));
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
  onSelect: (event: SeasonEvent) => void;
}

export const SeasonRow: React.FC<SeasonRowProps> = ({
  event,
  anchorRef,
  isAnchor = false,
  onSelect,
}) => {
  const isLive = event.state === 'live';
  const isDone = event.state === 'completed';

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'stretch',
    gap: 12,
    padding: '13px 16px',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: FONT,
    width: '100%',
    textAlign: 'left',
    border: 'none',
  };

  const venueLine = [
    event.venueName,
    event.venueCity,
    event.purse ? formatPurse(event.purse) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div ref={anchorRef}>
      <button type="button" onClick={() => onSelect(event)} style={rowStyle}>
        {/* Date block ─ 34px column */}
        <div
          style={{
            width: 34,
            flex: '0 0 34px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 2,
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 200,
              lineHeight: 1,
              // AMBER ON THIS PAGE MEANS THE ANCHOR ROW - the live event, else this
              // week, else the next event up. There is no viewing member on a tour
              // surface, so the app-wide "amber means you" rule does not apply here.
              // This is the only amber figure on the schedule. Do not extend it.
              color: isAnchor ? AMBER : INK,
              fontVariantNumeric: 'tabular-nums lining',
              letterSpacing: '-0.01em',
            }}
          >
            {shortDay(event.startDate)}
          </span>
          <span
            style={{
              marginTop: 4,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: INK_MUTE,
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            {shortMonth(event.startDate)}
          </span>
        </div>

        {/* Identity column ─ flex */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'nowrap',
              minWidth: 0,
            }}
          >
            {event.tourSlug && (
              <span
                style={{
                  flex: 'none',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  color: INK_MUTE,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(15,23,42,0.05)',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {TOUR_LABEL[event.tourSlug] ?? event.tourSlug}
              </span>
            )}
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 13,
                fontWeight: 700,
                color: INK,
                letterSpacing: '-0.005em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {event.name}
            </span>
            {event.isMajor && <MajorChip />}
            {event.isPlayoff && !event.isMajor && <PlayoffChip />}
          </div>

          {venueLine && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: INK_MUTE,
                letterSpacing: '0.01em',
                lineHeight: 1.3,
                ...FIGS,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {venueLine}
            </div>
          )}

          {isDone && event.champion && (
            <ChampionStrip
              name={event.champion.displayName || event.champion.name}
              scoreText={event.champion.scoreText}
              score={event.champion.score}
              photoCandidates={resolvePlayerAvatarCandidates({
                name: event.champion.name,
                photoUrl: event.champion.photoUrl,
                tourSlug: event.champion.tourCode,
              })}
            />
          )}

          {isLive && event.leader && (
            <LeaderStrip
              name={event.leader.displayName || event.leader.name}
              totalText={event.leader.totalText}
              score={event.leader.score}
              tiedCount={event.leader.tiedCount}
              photoCandidates={resolvePlayerAvatarCandidates({
                name: event.leader.name,
                photoUrl: event.leader.photoUrl,
                tourSlug: event.leader.tourCode,
              })}
            />
          )}

          {event.state === 'upcoming' && event.defendingChampion?.name && (
            <DefendsStrip
              name={event.defendingChampion.name}
              photoCandidates={resolvePlayerAvatarCandidates({
                name: event.defendingChampion.name,
                photoUrl: event.defendingChampion.photoUrl,
                tourSlug: event.tourSlug ?? null,
              })}
            />
          )}
        </div>

        {/* Right rail */}
        <div
          style={{
            width: 52,
            flex: '0 0 52px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          {isLive && <LiveMark />}
          {event.state === 'upcoming' && event.daysAway !== null && (
            <UpcomingRail daysAway={event.daysAway} highlight={false} />
          )}
        </div>
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
        fontSize: 9,
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
        fontSize: 9,
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

const LiveMark: React.FC = () => {
  const { t } = useTranslation('tourhub');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: LIVE_DOT,
          display: 'inline-block',
        }}
      />
      <span
        style={{
          marginTop: 4,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: LIVE_DOT,
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        {t('status.live')}
      </span>
    </div>
  );
};

const UpcomingRail: React.FC<{ daysAway: number; highlight: boolean }> = ({
  daysAway,
  highlight,
}) => {
  const { t } = useTranslation('tourhub');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span
        style={{
          fontSize: 16,
          fontWeight: 200,
          color: highlight ? GOLD : INK_MUTE,
          fontVariantNumeric: 'tabular-nums lining',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {daysAway}
      </span>
      <span
        style={{
          marginTop: 3,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: INK_FAINT,
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        {t('schedule.rail.daysUnit', { count: daysAway })}
      </span>
    </div>
  );
};

const stripStyle: React.CSSProperties = {
  marginTop: 2,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 0,
};

const nameStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: INK,
  letterSpacing: '-0.005em',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '48%',
  lineHeight: 1.2,
};

const ChampionStrip: React.FC<{
  name: string;
  scoreText: string;
  score: number | null;
  photoCandidates: string[];
}> = ({ name, scoreText, score, photoCandidates }) => {
  const { t } = useTranslation('tourhub');
  return (
    <div style={stripStyle}>
      <SquircleAvatar
        size={20}
        srcCandidates={photoCandidates}
        alt={name}
        hairlineRing
        ringColor={LIGHT_HAIRLINE}
      />
      <span style={nameStyle}>{name}</span>
      {scoreText && (
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: getScoreColor(score, 'light'),
            fontVariantNumeric: 'tabular-nums lining',
            lineHeight: 1.2,
          }}
        >
          {scoreText}
        </span>
      )}
      <span
        style={{
          marginLeft: 'auto',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: GOLD_DEEP,
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        {t('schedule.badge.champion')}
      </span>
    </div>
  );
};

const LeaderStrip: React.FC<{
  name: string;
  totalText: string;
  score: number | null;
  tiedCount: number;
  photoCandidates: string[];
}> = ({ name, totalText, score, tiedCount, photoCandidates }) => {
  const { t } = useTranslation('tourhub');
  const tied = tiedCount > 1;
  return (
    <div style={stripStyle}>
      {!tied && (
        <SquircleAvatar
          size={20}
          srcCandidates={photoCandidates}
          alt={name}
          hairlineRing
          ringColor={LIGHT_HAIRLINE}
        />
      )}
      <span style={nameStyle}>
        {tied ? t('schedule.leader.tied', { count: tiedCount }) : name}
      </span>
      {totalText && (
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: getScoreColor(score, 'light'),
            fontVariantNumeric: 'tabular-nums lining',
            lineHeight: 1.2,
          }}
        >
          {totalText}
        </span>
      )}
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: INK_MUTE,
          lineHeight: 1.2,
        }}
      >
        {t('schedule.leader.suffix')}
      </span>
    </div>
  );
};

const DefendsStrip: React.FC<{ name: string; photoCandidates: string[] }> = ({
  name,
  photoCandidates,
}) => {
  const { t } = useTranslation('tourhub');
  return (
    <div style={stripStyle}>
      <SquircleAvatar
        size={20}
        srcCandidates={photoCandidates}
        alt={name}
        hairlineRing
        ringColor={LIGHT_HAIRLINE}
      />
      <span style={nameStyle}>{name}</span>
      <span
        style={{
          marginLeft: 'auto',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: INK_FAINT,
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        {t('schedule.badge.defends')}
      </span>
    </div>
  );
};

export default SeasonRow;
