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
import { Trans, useTranslation } from 'react-i18next';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { formatMonthShort } from '@/i18n/format';
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

const VIOLET = '#7C3AED';
const VIOLET_TINT = 'rgba(124,58,237,0.10)';
const AMBER_WASH = 'rgba(247,147,30,0.05)';

function shortDay(iso: string): string {
  return String(parseInt(iso.slice(8, 10), 10));
}
function shortMonth(iso: string): string {
  // Route through Wave-1 wrapper; upper-case at call site (matches player-v2,
  // ComingUp). Legacy MONTHS_SHORT (JAN..DEC) was locale-dependent copy that
  // ESLint's no-literal-string doesn't fire on (words excluded); byte-identical
  // to Intl('en', {month:'short'}).toUpperCase() for all 12 months.
  return formatMonthShort(new Date(iso)).toUpperCase();
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
  const { t } = useTranslation('tourhub');
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
              fontSize: 9,
              fontWeight: 800,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {event.tourSlug && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
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
                fontSize: 11,
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
                  <>
                    {' · '}
                    <Trans
                      i18nKey="schedule.champion.defendsSuffix"
                      ns="tourhub"
                      values={{ name: event.defendingChampion.name }}
                    />
                  </>
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
          {isDone && <Chevron />}
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

/* eslint-disable i18next/no-literal-string -- typography glyph: chevron affordance, aria-hidden */
const Chevron: React.FC = () => (
  <span
    style={{ fontSize: 15, color: INK_FAINT, fontWeight: 300, lineHeight: 1 }}
    aria-hidden
  >
    ›
  </span>
);
/* eslint-enable i18next/no-literal-string */


const MajorChip: React.FC = () => {
  const { t } = useTranslation('tourhub');
  return (
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
      {t('schedule.badge.major')}
    </span>
  );
};

const PlayoffChip: React.FC = () => {
  const { t } = useTranslation('tourhub');
  return (
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
      {t('schedule.badge.playoffs')}
    </span>
  );
};

const LivePill: React.FC = () => {
  const { t } = useTranslation('tourhub');
  return (
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
      {t('status.live')}
    </span>
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
        {t('schedule.rail.daysUnit', { count: daysAway })}
      </span>
    </div>
  );
};


const ChampionStrip: React.FC<{
  name: string;
  scoreText: string;
  photoCandidates: string[];
}> = ({ name, scoreText, photoCandidates }) => {
  const { t } = useTranslation('tourhub');
  return (
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
        size={20}
        srcCandidates={photoCandidates}
        alt={name}
        hairlineRing
        ringColor={LIGHT_HAIRLINE}
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
        {t('schedule.badge.champion')}
      </span>
    </div>
  );
};

const LeaderStrip: React.FC<{
  name: string;
  totalText: string;
  photoCandidates: string[];
}> = ({ name, totalText, photoCandidates }) => {
  const { t } = useTranslation('tourhub');
  return (
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
        size={20}
        srcCandidates={photoCandidates}
        alt={name}
        hairlineRing
        ringColor={LIGHT_HAIRLINE}
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
        {t('schedule.leader.suffix')}
      </span>
    </div>
  );
};

export default SeasonRow;
