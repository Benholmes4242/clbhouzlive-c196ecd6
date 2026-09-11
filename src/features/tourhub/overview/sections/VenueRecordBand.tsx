/**
 * VenueRecordBand — THE TOUR VENUE, CARRYING THIS APP'S OWN MEMBERS' RATINGS.
 *
 * BRIEF_TOUR_OVERVIEW_STRUCTURAL section D: PLACEMENT AND PROMINENCE ONLY.
 * This is the one section on the Tour Hub overview that no other golf app can
 * produce — a tournament venue reported through the ratings of the members who
 * have played it. It spent its life as a thin strip inside the hero cohesion
 * unit. It is the bridge between the tour and the member's own game, and after
 * the venue backfill it is the page's distinctive asset, so it now stands as a
 * full section of its own: the page's SECOND section, directly beneath the hero
 * (which on a live tournament means directly beneath the board band, the hero's
 * last band).
 *
 * THE LOGIC IS BUILT AND VERIFIED — DO NOT REBUILD IT. The rating floor, the
 * rate action, the rated-or-ranked predicate and the too-few line are unchanged
 * from the strip; only the anatomy around them changed. If you find yourself
 * rewriting the gate, stop: something has been misread.
 *
 * THE BAND STATES ITS SAMPLE. A rating figure NEVER renders without its count.
 * Below RATING_FLOOR the FIGURE DOES NOT RENDER AT ALL — the section still
 * shows, carrying the course name and the Top 100 rank, because a published
 * rank is a fact that needs no sample, and it says plainly that too few members
 * have rated the venue. At or above the floor: figure plus basis line, and NO
 * TIER WORD — a tier word is a verdict, and twelve ratings is not enough to
 * hand one down about Wentworth.
 *
 * TWO FIGURES, BOTH TRUE. get_tournament_venue_record returns (course_id,
 * course_name, course_place, rating, review_count, list_rank, list_label) —
 * verified against pg_get_function_result — so it carries NO played count, and
 * one is NOT computed client-side here. PLAYED IT comes from the already-live
 * get_course_field_sizes, which answers exactly this question with the same
 * mapping filter and the same deleted-connection filter as
 * get_course_hole_field (verified 17 = 17). Adding a column to the venue
 * function would require DROP and recreate — discarding five grants and the
 * pinned search_path on a live function for one figure — so it was not done.
 *
 * ONE EXTRA CALL FOR THE WHOLE SECTION. The band shows a single course, so the
 * batched function is asked for exactly one id, once.
 *
 * IF THE PLAYED READ FAILS, PLAYED IT DOES NOT RENDER and MEMBERS' RATING
 * stands alone. A zero is never printed from a failed read: "0" would say
 * nobody has played Wentworth.
 *
 * NO ROW AT ALL: the section does not render. Absent, not empty.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { OVERVIEW_GUTTER as GUT } from '../tokens';
import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';
import { useTournamentVenueRecord } from '../data/useTournamentVenueRecord';

/* Minimum ratings before the clubhouse figure may render at all. */
const RATING_FLOOR = 3;

/** The section kicker: 9/700/0.19em uppercase, above the heading. */
const SECTION_KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
  color: A.DIM,
  fontFamily: SANS,
};

/** A figure kicker on the section's one stat: 9/700/0.12em, per the brief. */
const FIGURE_KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: A.DIM,
  fontFamily: SANS,
};

function TerminalRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 0 0',
        marginTop: 12,
        background: 'transparent',
        border: 'none',
        borderTop: `1px solid ${A.BORDER}`,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: SANS,
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
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: A.MUTE }} aria-hidden>
        &rsaquo;
      </span>
    </button>
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

  /* "#57 GB&I" — the published rank, on the heading baseline. */
  const meta = hasRank
    ? `#${data.listRank}${data.listLabel ? ` ${data.listLabel}` : ''}`
    : null;

  return (
    <section style={{ padding: `0 ${GUT}px`, fontFamily: SANS }}>
      <div style={{ marginBottom: 6 }}>
        <span style={SECTION_KICKER}>{t('overview.venueRecord.sectionKicker')}</span>
      </div>

      <DiscoverSectionHeading title={data.courseName} right={meta} />

      {data.coursePlace ? (
        <div style={{ marginTop: -4, marginBottom: 2 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: A.MUTE }}>{data.coursePlace}</span>
        </div>
      ) : null}

      {hasRating ? (
        <>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span
              className="tabular-nums lining-nums"
              style={{ fontSize: 21, fontWeight: 700, color: A.INK, letterSpacing: '-0.03em', ...FIGS }}
            >
              {Number(data.rating).toFixed(1)}
            </span>
            <span style={FIGURE_KICKER}>{t('overview.venueRecord.ratingLabel')}</span>
          </div>

          <div
            className="tabular-nums lining-nums"
            style={{ marginTop: 8, fontSize: 13, fontWeight: 600, lineHeight: '18px', color: A.BODY }}
          >
            {t('overview.venueRecord.basis', { count })}
          </div>

          <TerminalRow
            label={t('overview.venueRecord.seeAction')}
            onPress={() => navigate(`/course/${data.courseId}`)}
          />
        </>
      ) : (
        <>
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, lineHeight: '18px', color: A.MUTE }}>
            {t('overview.venueRecord.tooFewRatings')}
          </div>

          {/* THE BELOW-FLOOR STATE CARRIES AN ACTION. A tour venue in the week
              it is on television, telling a member nobody has rated it, is the
              strongest prompt to rate a course this app has — so it is a
              control, not a dead sentence. Verified before building: rating
              requires no played round (submit_course_review_v2 is SECURITY
              DEFINER and checks only auth and value ranges), so any signed-in
              member can complete it. At or above the floor there is NO ask — a
              rated course does not need one. Routes to the existing composer;
              no new entry point. */}
          <TerminalRow
            label={t('overview.venueRecord.rateAction')}
            onPress={() => navigate(`/courses/${data.courseId}/rate`)}
          />
        </>
      )}
    </section>
  );
}

export default VenueRecordBand;
