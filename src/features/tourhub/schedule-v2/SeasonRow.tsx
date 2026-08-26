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
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { formatMonthShort } from '@/i18n/format';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import { getScoreColor } from '../_shared/scoreColor';
import { formatPurse } from '../_shared/formatPurse';
import type { SeasonEvent } from './useSeasonTimeline';
import { TOUR_LABEL } from '../_shared/tourOrder';
import {
  FONT,
  GOLD_DEEP,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  LIVE_DOT,
} from '../_shared/tokens';

import { FIGS } from '@/lib/tokens/type';

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
  const { t } = useTranslation('tourhub');
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

  /* VENUE LINE CARRIES NO MONEY. The purse used to be the LAST member of this
     join on a nowrap+ellipsis line, so a long venue put the ellipsis inside the
     figure ("$3...."). A truncated venue is still recognisable; a truncated
     number is a WRONG number. The purse now renders as its own flex:'none'
     element beside this line. */
  const venueLine = [event.venueName, event.venueCity].filter(Boolean).join(' · ');
  const purseText = event.purse ? formatPurse(event.purse) : null;
  const countdown =
    event.state === 'upcoming' && event.daysAway !== null
      ? event.daysAway === 0
        ? t('schedule.floating.today')
        : t('schedule.row.countdownIn', { n: event.daysAway })
      : null;

  return (
    <div ref={anchorRef}>
      <button type="button" onClick={() => onSelect(event)} style={rowStyle}>
        {/* Date block ─ 42px column. WIDENED FROM 34: the three-digit countdown
            ("IN 107D" today, "IN 214D" next season) measures 40.9px at 10/700 with
            0.06em tracking, so neither 34 nor the brief's 38 held it. 42 does. */}
        <div
          style={{
            width: 42,
            flex: '0 0 42px',
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
              // THE AMBER ANCHOR NUMERAL WAS REMOVED. It used to be
              // `isAnchor ? AMBER : INK`: amber marked the anchor row — the live
              // event, else this week, else the next event up. The argument for it
              // was that the app-wide "amber means the viewing member" rule has no
              // force on a tour surface, where there is no viewing member. That
              // held, but it is not why it failed: amber read as a HIGHLIGHT whose
              // meaning no member could infer from the row itself. A colour that
              // says "look here" and nothing more is noise. Do not reintroduce it.
              // The anchor is still derived and still scrolled to (ScheduleTab) —
              // it is simply no longer coloured.
              color: INK,
              fontVariantNumeric: 'tabular-nums lining-nums',
              letterSpacing: '-0.01em',
            }}
          >
            {shortDay(event.startDate)}
          </span>
          <span
            style={{
              marginTop: 4,
              // AXIS 10: the month abbreviation is a date coordinate, not language.
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: INK_MUTE,
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            {shortMonth(event.startDate)}
          </span>
          {/* THE COUNTDOWN LIVES HERE NOW, under the date it counts to. It was a
              right-hand rail, which stated the same fact at the opposite end of
              the row, squeezed the name from both sides, and sat permanently
              under the back-to-top FAB. Upcoming rows only — nothing renders and
              no space is reserved on live or completed rows. */}
          {countdown && (
            <span
              style={{
                marginTop: 7,
                paddingTop: 6,
                borderTop: `0.5px solid ${HAIRLINE_INK_10}`,
                alignSelf: 'stretch',
                textAlign: 'center',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: INK_FAINT,
                textTransform: 'uppercase',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {countdown}
            </span>
          )}
        </div>

        {/* Identity column ─ flex */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              display: 'flex',
              // flex-start, not center: the chip group must sit on the FIRST
              // line of a two-line name, not centre against the block.
              alignItems: 'flex-start',
              gap: 8,
              flexWrap: 'nowrap',
              minWidth: 0,
            }}
          >
            {/* THE NAME TAKES THE WIDTH AND WRAPS TO TWO LINES. It used to be
                nowrap+ellipsis with the tour badge to its LEFT, so the one thing
                being cut was the event's identity. */}
            <span
              style={{
                flex: '1 1 auto',
                minWidth: 0,
                fontSize: 13.5,
                fontWeight: 700,
                color: INK,
                letterSpacing: '-0.005em',
                lineHeight: 1.22,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                overflow: 'hidden',
              }}
            >
              {event.name}
            </span>
            {/* ONE flex:'none' group so the tour badge is always the same
                distance from the row's right edge. Order matches ComingUp:
                badge immediately outside the name, major/playoff outermost. */}
            <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, paddingTop: 1 }}>
              {event.tourSlug && (
                <span
                  style={{
                    flex: 'none',
                    // AXIS 10: tour code marker (PGA / DPWT), not a word.
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.16em',
                    color: INK_MUTE,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.06)',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {TOUR_LABEL[event.tourSlug] ?? event.tourSlug}
                </span>
              )}
              {event.isMajor && <MajorChip />}
              {event.isPlayoff && !event.isMajor && <PlayoffChip />}
            </div>
          </div>

          {(venueLine || purseText) && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
              {venueLine && (
                <span
                  style={{
                    flex: '1 1 auto',
                    minWidth: 0,
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
                </span>
              )}
              {purseText && (
                <span
                  style={{
                    flex: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    color: INK_MUTE,
                    lineHeight: 1.3,
                    ...FIGS,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {purseText}
                </span>
              )}
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

        {/* Right rail — LIVE mark only. The upcoming countdown rail is gone; no
            column is reserved for it, which is where the name's width came from. */}
        {isLive && (
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
            <LiveMark />
          </div>
        )}

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
          // READ 11: LIVE is a word a member reads.
          fontSize: 11,
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

/* UpcomingRail DELETED (BRIEF_SCHEDULE_ROW_ONE_TIME_COLUMN). The countdown now
   renders as a third line inside the date block. It had no other caller. */


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
        ringColor={DARK_HAIRLINE}
      />
      <span style={nameStyle}>{name}</span>
      {scoreText && (
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: getScoreColor(score, 'dark'),
            fontVariantNumeric: 'tabular-nums lining-nums',
            lineHeight: 1.2,
          }}
        >
          {scoreText}
        </span>
      )}
      <span
        style={{
          marginLeft: 'auto',
          // AXIS 10: CHAMPION is a marker on the strip.
          fontSize: 10,
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
          ringColor={DARK_HAIRLINE}
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
            color: getScoreColor(score, 'dark'),
            fontVariantNumeric: 'tabular-nums lining-nums',
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
        ringColor={DARK_HAIRLINE}
      />
      <span style={nameStyle}>{name}</span>
      <span
        style={{
          marginLeft: 'auto',
          // AXIS 10: DEFENDS is a marker on the strip.
          fontSize: 10,
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
