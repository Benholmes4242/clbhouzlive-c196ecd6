/**
 * SeasonRow — one event row in the rebuilt Tour Schedule
 * (BRIEF_TOUR_SCHEDULE_REBUILT §4/§5, schedule-signed-off.html).
 *
 * Grid 40px | minmax(0,1fr) | 104px. Left: two-digit start day over the
 * weekday. Middle: tour label + one neutral tag, two-line name, venue·city,
 * date span, then the member's amber lines. Right: DEFENDS+PURSE / LEADS /
 * LEAD tied / WON with a 22px SquircleAvatar headshot; scores through the
 * canonical getScoreColor. Tags are neutral outlines — never amber; the old
 * amber CHAMPION label and the venue-line LIVE word are gone.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatWeekdayShortGB } from '@/i18n/format';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import { getScoreColor } from '../_shared/scoreColor';
import type { SeasonEvent } from './useSeasonTimeline';
import {
  ROW_TOUR_LABEL,
  dateSpanLabel,
  rightColumn,
  scheduleTag,
  venueLine,
  type RightColumn,
} from './scheduleRules';
import {
  AMBER,
  FONT,
  INK,
  INK_FAINT,
  INK_MUTE,
  WHITE_ALPHA_06,
} from '../_shared/tokens';

const LIVE_GREEN = '#3DDC97';
const TAG_BORDER = 'rgba(255,255,255,0.24)';

export interface SeasonRowYou {
  /** Followed leader/winner player id — the who line turns amber with ★. */
  followedPlayerId?: string | null;
  /** Followed players in the field, as display surnames (field order). */
  fieldNames: string[];
  /** The member has a round at this event's linked course. */
  playedHere: boolean;
}

export interface SeasonRowProps {
  event: SeasonEvent;
  you?: SeasonRowYou;
  anchorRef?: React.Ref<HTMLDivElement>;
  isAnchor?: boolean;
  last?: boolean;
  onSelect: (event: SeasonEvent) => void;
}

function startDay(iso: string): string {
  return iso.slice(8, 10);
}
function startWeekday(iso: string): string {
  return formatWeekdayShortGB(new Date(`${iso.slice(0, 10)}T12:00:00Z`)).toUpperCase();
}

const Headshot: React.FC<{
  name: string;
  photoUrl: string | null;
  tourCode: string | null;
}> = ({ name, photoUrl, tourCode }) => (
  <SquircleAvatar
    size={22}
    alt={name}
    hideRing
    srcCandidates={resolvePlayerAvatarCandidates({
      name,
      photoUrl,
      tourSlug: tourCode,
    })}
  />
);

export const SeasonRow: React.FC<SeasonRowProps> = ({
  event,
  you,
  anchorRef,
  last = false,
  onSelect,
}) => {
  const { t } = useTranslation('tourhub');
  const tag = scheduleTag(event);
  const rc = rightColumn(event);
  const venue = venueLine(event);
  const tourLabel = event.tourSlug
    ? ROW_TOUR_LABEL[event.tourSlug] ?? event.tourSlug
    : null;
  const followedId = you?.followedPlayerId ?? null;
  const fieldNames = you?.fieldNames ?? [];

  const fieldLine =
    fieldNames.length === 1
      ? t('schedule.you.inFieldOne', { name: fieldNames[0] })
      : fieldNames.length === 2
        ? t('schedule.you.inFieldTwo', { a: fieldNames[0], b: fieldNames[1] })
        : fieldNames.length > 2
          ? t('schedule.you.inFieldMany', {
              a: fieldNames[0],
              b: fieldNames[1],
              count: fieldNames.length - 2,
            })
          : null;

  return (
    <div ref={anchorRef}>
      <button
        type="button"
        onClick={() => onSelect(event)}
        style={{
          display: 'grid',
          gridTemplateColumns: '40px minmax(0,1fr) 104px',
          gap: 12,
          alignItems: 'start',
          width: '100%',
          padding: '14px 24px',
          border: 0,
          borderBottom: last ? 'none' : `1px solid ${WHITE_ALPHA_06}`,
          background: 'transparent',
          color: INK,
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: FONT,
        }}
      >
        {/* Date block */}
        <span style={{ textAlign: 'center', paddingTop: 2 }}>
          <span
            className="num"
            style={{ display: 'block', fontSize: 20, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
          >
            {startDay(event.startDate)}
          </span>
          <span
            style={{
              display: 'block',
              marginTop: 4,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: INK_FAINT,
            }}
          >
            {startWeekday(event.startDate)}
          </span>
        </span>

        {/* Middle */}
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: INK_MUTE,
            }}
          >
            <span>{tourLabel}</span>
            {tag ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 16,
                  padding: '0 5px',
                  borderRadius: 5,
                  border: `1px solid ${TAG_BORDER}`,
                  color: INK,
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  whiteSpace: 'nowrap',
                }}
              >
                {t(`schedule.tag.${tag}`)}
              </span>
            ) : null}
          </span>
          <span
            style={{
              display: '-webkit-box',
              marginTop: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            {event.name}
          </span>
          {venue ? (
            <span
              style={{
                display: 'block',
                marginTop: 3,
                fontSize: 12,
                color: INK_MUTE,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {venue}
            </span>
          ) : null}
          <span
            className="num"
            style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: INK_FAINT, fontVariantNumeric: 'tabular-nums' }}
          >
            {dateSpanLabel(event.startDate, event.endDate)}
          </span>
          {fieldLine ? (
            <span style={{ display: 'block', marginTop: 7, fontSize: 12, fontWeight: 600, color: AMBER }}>
              {fieldLine}
            </span>
          ) : null}
          {you?.playedHere ? (
            <span style={{ display: 'block', marginTop: fieldLine ? 3 : 7, fontSize: 12, fontWeight: 600, color: AMBER }}>
              {t('schedule.you.playedHere')}
            </span>
          ) : null}
        </span>

        {/* Right column */}
        <RightStack rc={rc} followedId={followedId} />
      </button>
    </div>
  );
};

const RightStack: React.FC<{ rc: RightColumn; followedId: string | null }> = ({
  rc,
  followedId,
}) => {
  const { t } = useTranslation('tourhub');
  if (rc.kind === 'none') return <span />;

  const labelStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.12em',
    color: INK_FAINT,
  };

  if (rc.kind === 'purse') {
    return (
      <span style={{ textAlign: 'right', paddingTop: 1 }}>
        <span style={labelStyle}>{t('schedule.row.purse')}</span>
        <span
          className="num"
          style={{ display: 'block', marginTop: 5, fontSize: 12, fontWeight: 600, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}
        >
          {rc.purse}
        </span>
      </span>
    );
  }

  if (rc.kind === 'defends') {
    return (
      <span style={{ textAlign: 'right', paddingTop: 1 }}>
        <span style={labelStyle}>{t('schedule.row.defends')}</span>
        <span
          style={{
            marginTop: 5,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <Headshot name={rc.fullName} photoUrl={rc.photoUrl} tourCode={null} />
          {rc.name}
        </span>
        {rc.purse ? (
          <span
            className="num"
            style={{ display: 'block', marginTop: 3, fontSize: 12, fontWeight: 600, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}
          >
            {rc.purse}
          </span>
        ) : null}
      </span>
    );
  }

  // won / leads / tied
  const isLive = rc.kind === 'leads' || rc.kind === 'tied';
  const followed =
    followedId !== null && 'playerId' in rc && rc.playerId !== null && rc.playerId === followedId;
  const label =
    rc.kind === 'won'
      ? t('schedule.row.won')
      : rc.kind === 'leads'
        ? t('schedule.row.leads', { round: rc.round ?? 1 })
        : t('schedule.row.lead', { round: rc.round ?? 1 });

  return (
    <span style={{ textAlign: 'right', paddingTop: 1 }}>
      <span style={{ ...labelStyle, color: isLive ? LIVE_GREEN : INK_FAINT }}>
        {isLive ? (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: LIVE_GREEN,
              boxShadow: '0 0 0 3px rgba(61,220,151,0.16)',
              display: 'inline-block',
            }}
          />
        ) : null}
        {label}
      </span>
      {rc.kind === 'tied' ? (
        <span
          className="num"
          style={{
            marginTop: 5,
            display: 'block',
            whiteSpace: 'nowrap',
            fontSize: 13,
            fontWeight: 600,
            color: INK_MUTE,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {t('schedule.row.tied', { count: rc.tiedCount })}
        </span>
      ) : (
        <span
          style={{
            marginTop: 5,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: followed ? AMBER : INK,
          }}
        >
          <Headshot name={rc.fullName} photoUrl={rc.photoUrl} tourCode={rc.tourCode} />
          {followed ? `★ ${rc.name}` : rc.name}
        </span>
      )}
      <span
        className="num"
        style={{
          display: 'block',
          marginTop: 3,
          fontSize: 16,
          fontWeight: 800,
          color: getScoreColor(rc.score, 'dark'),
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {rc.scoreText}
      </span>
    </span>
  );
};

export default SeasonRow;
