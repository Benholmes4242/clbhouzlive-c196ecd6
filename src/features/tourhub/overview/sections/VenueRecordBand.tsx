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
import { ChevronRight } from 'lucide-react';
import { FONT, INK, INK_MUTE } from '../../_shared/tokens';
import { useBatchCourseImages } from '../../hooks/useBatchCourseImages';
import type { TourTournament } from '../../hooks/useTourHubData';
import { useTournamentVenueRecord } from '../data/useTournamentVenueRecord';

/* Minimum ratings before the clubhouse figure may render at all. */
const RATING_FLOOR = 3;

/**
 * NOBODY IS EXCLUDED, DELIBERATELY. get_course_field_sizes was written for the
 * trophy room, where the crown HOLDER must be excluded from the field they hold
 * a record against, so it takes p_exclude_user_id. Here the question is
 * different: how many members have played this venue, all of them. The function
 * compares with IS DISTINCT FROM, so a nil uuid matches no member and excludes
 * nobody, which makes course_players a complete count. THIS IS NOT AN UNFILLED
 * PLACEHOLDER — do not substitute the viewing member's id.
 */
export function shouldShowVenueRecord(data: { rating: number | null; reviewCount: number | null; listRank: number | null } | null | undefined): boolean {
  if (!data) return false;
  const count = data.reviewCount ?? 0;
  return (data.rating != null && count >= RATING_FLOOR) || data.listRank != null;
}

export function VenueRecordBand({ tournamentId, venueName }: { tournamentId: string | undefined; venueName?: string | null }) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { data } = useTournamentVenueRecord(tournamentId);
  const venueAdapter: TourTournament[] = venueName ? [{ venue_name: venueName } as TourTournament] : [];
  const { data: imageMap } = useBatchCourseImages(venueAdapter);
  const imageUrl = venueName ? imageMap?.get(venueName) ?? null : null;

  /**
   * THE LINK IS THE GATE. A row means we KNOW the course, so the section
   * renders. No row means we do NOT know the course, so it is absent. Nothing
   * else decides WHETHER this section appears. UNRATED IS NOT UNKNOWN.
   *
   * C10 keeps the presentation gate narrower than the link gate: the RPC may
   * return a linked course with no member fact, but this overview block renders
   * only when it can add a sufficiently sampled rating or a published rank.
   */
  if (!data || !shouldShowVenueRecord(data)) return null;
  const count = data.reviewCount ?? 0;
  /* A figure is only shown with a real count behind it. */
  const hasRating = data.rating != null && count >= RATING_FLOOR;
  const hasRank = data.listRank != null;
  /* Below the floor is simply NOT hasRating — count < RATING_FLOOR, whether the
     rating is null (nobody has rated it) or present but under-sampled. The old
     third flag existed only to gate the whole section and is gone with it. */

  /* "#57 GB&I" — the published rank, on the heading baseline. */
  const rank = hasRank ? `#${data.listRank}${data.listLabel ? ` ${data.listLabel}` : ''}` : null;
  const rating = hasRating ? `${Number(data.rating).toFixed(1)} from ${count} ratings` : null;
  const facts = [rank, rating].filter(Boolean).join(' · ');
  const target = `/course/${data.courseId}`;

  return (
    <section data-overview-venue-block style={{ margin: '18px 24px 0', fontFamily: FONT }}>
      <button type="button" onClick={() => navigate(target)} style={{ width: '100%', minHeight: 76, padding: 0, display: 'flex', alignItems: 'center', gap: 13, border: 0, borderRadius: 0, background: 'transparent', color: INK, textAlign: 'left', cursor: 'pointer' }}>
        {imageUrl ? <img data-overview-venue-image src={imageUrl} alt="" style={{ width: 76, height: 76, flex: '0 0 76px', borderRadius: 13, objectFit: 'cover' }} /> : null}
        <span style={{ minWidth: 0, flex: '1 1 auto' }}>
          <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', color: INK_MUTE }}>{t('overview.venueRecord.sectionKicker')}</span>
          <span style={{ display: 'block', marginTop: 5, fontSize: 17, lineHeight: 1.15, fontWeight: 700 }}>{data.courseName}</span>
          <span style={{ display: 'block', marginTop: 4, fontSize: 12, lineHeight: 1.3, color: INK_MUTE }}>{facts}</span>
        </span>
        <ChevronRight size={17} aria-hidden style={{ flex: 'none' }} />
      </button>
    </section>
  );
}

export default VenueRecordBand;
