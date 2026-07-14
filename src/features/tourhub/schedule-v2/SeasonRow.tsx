/**
 * SeasonRow — one row in the schedule-v2 open ledger.
 *
 * States: completed (opacity 0.78, champion strip), live (amber wash,
 * leader strip, LIVE pill), upcoming (days-away rail).
 *
 * Overview grammar: amber eyebrow, thin numerals for date + days-away,
 * PlayerAvatar via SquircleAvatar+resolvePlayerAvatarCandidates, gold
 * reserved for majors only.
 */
import React from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import type { SeasonEvent } from './useSeasonTimeline';
import { TOUR_LABEL } from '../_shared/tourOrder';
import {
  AMBER,
  FONT,
  GOLD,
  GOLD_DEEP,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  LIVE_DOT,
  LIVE_INK,
  TOPAR_UNDER_LIGHT,
} from '../_shared/tokens';

const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const VIOLET = '#7C3AED';
const VIOLET_TINT = 'rgba(124,58,237,0.10)';
const AMBER_WASH = 'rgba(247,147,30,0.05)';

function shortDay(iso: string): string {
  return String(parseInt(iso.slice(8, 10), 10));
}
function shortMonth(iso: string): string {
  const idx = Math.max(0, Math.min(11, parseInt(iso.slice(5, 7), 10) - 1));
  return MONTHS_SHORT[idx];
}

export interface SeasonRowProps {
  event: SeasonEvent;
  anchorRef?: React.Ref<HTMLDivElement>;
  onSelect: (event: SeasonEvent) => void;
}

export const SeasonRow: React.FC<SeasonRowProps> = ({
  event,
  anchorRef,
  onSelect,
}) => {
  const isLive = event.state === 'live';
  const isDone = event.state === 'completed';

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'stretch',
    gap: 12,
    padding: '12px 16px',
    background: isLive ? AMBER_WASH : 'transparent',
    borderRadius: isLive ? 12 : 0,
    borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
    cursor: 'pointer',
    opacity: isDone ? 0.78 : 1,
    fontFamily: FONT,
    width: '100%',
    textAlign: 'left',
    border: isLive ? undefined : 'none',
  };

  return (
    <div ref={anchorRef} style={{ padding: isLive ? '0 4px' : 0 }}>
      <button
        type="button"
        onClick={() => onSelect(event)}
        style={rowStyle}
      >
        {/* Date block ─ 34px column */}
        <div
          style={{
            width: 34,
            flex: '0 0 auto',
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
              color: event.isMajor ? GOLD_DEEP : INK,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
            }}
          >
            {shortDay(event.startDate)}
          </span>
          <span
            style={{
              marginTop: 4,
              fontSize: 7.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: INK_MUTE,
              textTransform: 'uppercase',
            }}
          >
            {shortMonth(event.startDate)}
          </span>
        </div>

        {/* Identity column ─ flex */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: INK,
                letterSpacing: '-0.005em',
                lineHeight: 1.2,
              }}
            >
              {event.name}
            </span>
            {event.isMajor && <MajorChip />}
            {event.isPlayoff && !event.isMajor && <PlayoffChip />}
          </div>

          {(event.venueName || event.venueCity) && (
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 500,
                color: INK_MUTE,
                letterSpacing: '0.01em',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {[event.venueName, event.venueCity].filter(Boolean).join(' · ')}
              {event.state === 'upcoming' &&
                event.isMajor &&
                event.defendingChampion?.name && (
                  <> · {event.defendingChampion.name} defends</>
                )}
            </div>
          )}

          {isDone && event.champion && (
            <ChampionStrip
              name={event.champion.displayName || event.champion.name}
              scoreText={event.champion.scoreText}
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
              photoCandidates={resolvePlayerAvatarCandidates({
                name: event.leader.name,
                photoUrl: event.leader.photoUrl,
                tourSlug: event.leader.tourCode,
              })}
            />
          )}
        </div>

        {/* Right rail */}
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            minWidth: 44,
          }}
        >
          {isLive && <LivePill />}
          {isDone && (
            <span
              style={{
                fontSize: 15,
                color: INK_FAINT,
                fontWeight: 300,
                lineHeight: 1,
              }}
              aria-hidden
            >
              ›
            </span>
          )}
          {event.state === 'upcoming' && event.daysAway !== null && (
            <UpcomingRail
              daysAway={event.daysAway}
              highlight={event.isMajor && event.daysAway <= 7}
            />
          )}
        </div>
      </button>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────

const MajorChip: React.FC = () => (
  <span
    style={{
      fontSize: 8.5,
      fontWeight: 800,
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
    MAJOR
  </span>
);

const PlayoffChip: React.FC = () => (
  <span
    style={{
      fontSize: 8.5,
      fontWeight: 800,
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
    PLAYOFFS
  </span>
);

const LivePill: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 7px 3px 6px',
      borderRadius: 999,
      background: LIVE_INK,
      color: '#FFFFFF',
      fontSize: 8.5,
      fontWeight: 800,
      letterSpacing: '0.14em',
      lineHeight: 1,
    }}
  >
    <span
      style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: '#FFFFFF',
        display: 'inline-block',
      }}
    />
    LIVE
  </span>
);

const UpcomingRail: React.FC<{ daysAway: number; highlight: boolean }> = ({
  daysAway,
  highlight,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
    <span
      style={{
        fontSize: 16,
        fontWeight: 200,
        color: highlight ? GOLD : INK_MUTE,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}
    >
      {daysAway}
    </span>
    <span
      style={{
        marginTop: 3,
        fontSize: 7,
        fontWeight: 800,
        letterSpacing: '0.14em',
        color: INK_FAINT,
        textTransform: 'uppercase',
      }}
    >
      DAYS
    </span>
  </div>
);

const ChampionStrip: React.FC<{
  name: string;
  scoreText: string;
  photoCandidates: string[];
}> = ({ name, scoreText, photoCandidates }) => (
  <div
    style={{
      marginTop: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
    }}
  >
    <SquircleAvatar
      size={16}
      srcCandidates={photoCandidates}
      alt={name}
    />
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: INK,
        letterSpacing: '-0.005em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '48%',
      }}
    >
      {name}
    </span>
    {scoreText && (
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: TOPAR_UNDER_LIGHT,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {scoreText}
      </span>
    )}
    <span
      style={{
        marginLeft: 'auto',
        fontSize: 7.5,
        fontWeight: 800,
        letterSpacing: '0.14em',
        color: GOLD_DEEP,
        textTransform: 'uppercase',
      }}
    >
      CHAMPION
    </span>
  </div>
);

const LeaderStrip: React.FC<{
  name: string;
  totalText: string;
  photoCandidates: string[];
}> = ({ name, totalText, photoCandidates }) => (
  <div
    style={{
      marginTop: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
    }}
  >
    <SquircleAvatar
      size={16}
      srcCandidates={photoCandidates}
      alt={name}
      
    />
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: INK,
        letterSpacing: '-0.005em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '50%',
      }}
    >
      {name}
    </span>
    {totalText && (
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: AMBER,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {totalText}
      </span>
    )}
    <span
      style={{
        fontSize: 9.5,
        fontWeight: 600,
        color: INK_MUTE,
      }}
    >
      leads
    </span>
  </div>
);

export default SeasonRow;
