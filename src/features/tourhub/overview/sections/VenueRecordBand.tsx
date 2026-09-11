/**
 * VenueRecordBand — the clubhouse record for the venue currently in view on
 * the hero. Sits inside the hero cohesion unit, under the live rail.
 *
 * Anatomy (analytical panel): kicker "THE RECORD BOOK", venue name + place,
 * then a centred three-up stat row — clubhouse rating, review count, Top 100
 * placement. Whole panel deep-links to the course page.
 *
 * Self-hides only when the tournament has no linked course, or when the venue
 * is neither rated nor ranked (the RPC returns no row in that case).
 *
 * THE BAND STATES ITS SAMPLE. A rating figure NEVER renders without its count:
 * "8.7" alone invites a member to read one person's opinion as a verdict on a
 * golf course. Below RATING_FLOOR ratings the FIGURE DOES NOT RENDER AT ALL —
 * the band still shows, carrying the course name and the Top 100 rank, because
 * a published rank is a fact that needs no sample, and it says plainly that too
 * few members have rated the venue. At or above the floor: figure plus count,
 * and NO TIER WORD — a tier word is a verdict, and twelve ratings is not enough
 * to hand one down about Wentworth. Same rule as the course pages: show the
 * figure, withhold the label, state the sample.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { A, KICKER, LABEL, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { OVERVIEW_GUTTER as GUT } from '../tokens';
import { useTournamentVenueRecord } from '../data/useTournamentVenueRecord';

/* Minimum ratings before the clubhouse figure may render at all. */
const RATING_FLOOR = 3;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: 17, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em', ...FIGS }}>
        {value}
      </span>
      <span style={{ ...LABEL, color: A.DIM }}>{label}</span>
    </div>
  );
}

export function VenueRecordBand({ tournamentId }: { tournamentId: string | undefined }) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { data } = useTournamentVenueRecord(tournamentId);

  if (!data) return null;
  const count = data.reviewCount ?? 0;
  /* A figure is only shown with a real count behind it. */
  const hasRating = data.rating != null && count >= RATING_FLOOR;
  const hasRank = data.listRank != null;
  const belowFloor = data.rating != null && count < RATING_FLOOR;
  if (!hasRating && !hasRank && !belowFloor) return null;

  return (
    <div style={{ padding: `0 ${GUT}px` }}>
      <button
        type="button"
        onClick={() => navigate(`/course/${data.courseId}`)}
        /* FLAT — no panel fill, no border, no radius (structural brief section
           A). The band is bounded by space and its own hairline rule, and its
           content runs to the page gutter. */
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          padding: '0 0 2px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={KICKER}>{t('overview.venueRecord.kicker')}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em' }}>
            {data.courseName}
          </span>
          {data.coursePlace ? (
            <span style={{ fontSize: 12.5, fontWeight: 600, color: A.MUTE }}>{data.coursePlace}</span>
          ) : null}
        </div>

        <div style={{ height: 1, background: A.BORDER }} />

        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {hasRating ? (
            <Stat
              label={t('overview.venueRecord.ratingFrom', { count })}
              value={Number(data.rating).toFixed(1)}
            />
          ) : null}
          {hasRank ? (
            <Stat
              label={data.listLabel ?? t('overview.venueRecord.top100')}
              value={`#${data.listRank}`}
            />
          ) : null}
        </div>

        {hasRating ? null : (
          <span style={{ fontSize: 12, fontWeight: 600, color: A.DIM }}>
            {t('overview.venueRecord.tooFewRatings')}
          </span>
        )}
      </button>

      {/* THE BELOW-FLOOR STATE CARRIES AN ACTION. A tour venue in the week it
          is on television, telling a member nobody has rated it, is the
          strongest prompt to rate a course this app has — so it is a control,
          not a dead sentence. Verified before building: rating requires no
          played round (submit_course_review_v2 is SECURITY DEFINER and checks
          only auth and value ranges), so any signed-in member can complete it.
          At or above the floor there is NO ask — a rated course does not need
          one. Routes to the existing composer; no new entry point. Sits outside
          the panel button because a button may not nest inside a button. */}
      {hasRating ? null : (
        <button
          type="button"
          onClick={() => navigate(`/courses/${data.courseId}/rate`)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 0',
            background: 'transparent',
            border: 'none',
            borderTop: `1px solid ${A.BORDER}`,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: A.INK,
            }}
          >
            {t('overview.venueRecord.rateAction')}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: A.MUTE }} aria-hidden>
            &rsaquo;
          </span>
        </button>
      )}
    </div>
  );
}

export default VenueRecordBand;
