import React from 'react';
import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from '@/components/whs/CourseImageFallback';
import { A, GOLD, NUMF, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import { r } from '@/lib/radius';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import { RANK_PILL_BG, SCRIM_STANDOUT } from '@/styles/photoScrim';

import { courseHeadline } from './courseHeadline';
import { toParLabel } from './exploreCopy';
import { ratingPrintable } from './courseRatingFloor';
import { coursePlaceLine } from './placeLine';
import type { StreamItem } from './streamItem';
import type { CourseQuote } from './useCourseQuotes';
import { RANK_SCOPE_LABEL, useTop100RankIndex, type RankListSlug } from './useTop100RankIndex';

/**
 * THE COURSE-LED CARD (BRIEF_COURSES_DISCOVERY §A2).
 *
 * The course is the subject; one member's review is evidence beneath it. The
 * card NEVER carries a reviewer's four sub-scores — that is one person's
 * breakdown, not the course's (ReviewStatStrip stays for the review sheet).
 */

export interface CourseViewerChips {
  club: boolean;
  played: boolean;
  best: number | null;
  onList: boolean;
}

const LEAD_LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  lineHeight: 1.3,
  color: A.MUTE,
};

const PLACE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: A.DIM,
};

/** BRIEF_COURSE_EVENT_TOPAR: only 'record' and 'low' print a gross, so only
 *  they carry a to-par. No course_par → nothing (no fallback, no "E"). */
function grossToPar(item: StreamItem): { gross: number; toPar: number } | null {
  const f = item.facts;
  if (f.course_event !== 'record' && f.course_event !== 'low') return null;
  if (f.low_gross == null || f.course_par == null) return null;
  return { gross: f.low_gross, toPar: f.low_gross - f.course_par };
}

/** The event sentence, with its figures at 700 and tabular (§A2). The sentence
 *  itself always comes from courseHeadline.ts. The first figure equal to the
 *  gross takes ", " (sentence colour) then the to-par at the sentence's own
 *  size (BRIEF_COURSES_LEAD_FOOT §2-3): under = TOPAR_UNDER_DARK,
 *  over = ink, level "E" muted. Sign via toParLabel (true minus). */
function EventSentence({ text, size, topar }: { text: string; size: number; topar?: { gross: number; toPar: number } | null }) {
  const parts = text.split(/(\d[\d,.]*\d|\d)/g);
  const grossIdx = topar ? parts.findIndex((p) => p === String(topar.gross)) : -1;
  const label = topar ? toParLabel(topar.toPar) : null;
  const tone = topar ? (topar.toPar < 0 ? TOPAR_UNDER_DARK : topar.toPar === 0 ? A.MUTE : A.INK) : A.INK;
  return (
    <p style={{ margin: 0, fontSize: size, fontWeight: 500, lineHeight: 1.4, color: A.BODY }}>
      {parts.map((part, i) =>
        /\d/.test(part) ? (
          <React.Fragment key={i}>
            <span style={{ ...NUMF, fontWeight: 700, color: A.INK }}>{part}</span>
            {i === grossIdx && label ? (
<>
                {', '}
                <span style={{ ...NUMF, fontWeight: 700, color: tone }}>{label}</span>
              </>
            ) : null}
          </React.Fragment>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </p>
  );
}

function useRank(item: StreamItem): { rank: number; label: string | null } | null {
  const { index } = useTop100RankIndex();
  const courseId = item.subject?.course_id ?? null;
  const standing = courseId ? index?.get(courseId) ?? null : null;
  const rank = standing?.rank ?? item.facts.top100_regional ?? item.facts.top100_world ?? null;
  if (rank == null) return null;
  const factScope = item.facts.top100_scope;
  const scope = standing?.scope ?? (factScope && factScope in RANK_SCOPE_LABEL ? (factScope as RankListSlug) : null);
  return { rank, label: scope ? RANK_SCOPE_LABEL[scope] : null };
}

export function RankPill({ rank, label }: { rank: number; label: string | null }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: r.pill,
        background: RANK_PILL_BG,
        color: GOLD,
        fontSize: 11,
        ...NUMF,
      }}
    >
      {'\u2605'} #{rank}{label ? ` ${label}` : ''}
    </span>
  );
}

function Figure({ rating, count, size }: { rating: number; count: number; size: number }) {
  const { t } = useTranslation('courses');
  /* Green is reserved for the standout signal: the threshold lives only in
   * courseSubScoreTone (9.0+), and the figure reads it rather than carrying
   * its own gate. Below it the figure is plain ink. */
  return (
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div
        style={{
          ...NUMF,
          fontSize: size,
          fontWeight: 800,
          lineHeight: 1,
          color: courseSubScoreTone(rating) === A.GREEN ? A.GREEN : A.INK,
        }}
      >
        {rating.toFixed(1)}
      </div>
      <div style={{ ...PLACE, marginTop: 4 }}>
        {t('amateur.courseCard.fromRatings', 'From {{count}} ratings', { count })}
      </div>
    </div>
  );
}

function headlineFacts(item: StreamItem) {
  const f = item.facts;
  const count = f.rating_n ?? 0;
  /* The floor applies inside the sentence too: "rated 10.0 from 1" is the same
     unearned figure in different words. */
  const rating = ratingPrintable(f.rating, count) ? f.rating : null;
  return {
    event: f.course_event ?? null,
    burstCount: f.ratings_burst_n ?? null,
    burstMean: f.ratings_burst_mean ?? null,
    lowGross: f.low_gross ?? null,
    lowBy: f.low_by ?? null,
    rounds: f.rounds_tracked ?? null,
    rating,
    ratingCount: rating != null ? count : 0,
  };
}

export function CourseLedCard({
  item,
  quote,
  chips,
  viewerId,
  onTap,
}: {
  item: StreamItem;
  quote: CourseQuote | null;
  chips: CourseViewerChips;
  viewerId: string | null | undefined;
  onTap: () => void;
}) {
  const { t } = useTranslation('courses');
  const subject = item.subject;
  const rank = useRank(item);
  const count = item.facts.rating_n ?? 0;
  const printable = ratingPrintable(item.facts.rating, count);
  const place = coursePlaceLine({ region: subject?.region, subCountry: subject?.sub_country, country: subject?.country });
  const sentence = courseHeadline(t, headlineFacts(item));
  const chipLabels: string[] = [];
  if (chips.club) chipLabels.push(t('amateur.courseCard.yourClub', 'Your club'));
  if (chips.best != null) chipLabels.push(t('amateur.courseCard.yourBest', 'Your best {{gross}}', { gross: chips.best }));
  else if (chips.played) chipLabels.push(t('amateur.courseCard.played', 'Played'));
  if (chips.onList) chipLabels.push(t('amateur.courseCard.onList', 'On your list'));
  const own = !!quote && !!viewerId && quote.userId === viewerId;

  return (
    <button
      type="button"
      onClick={onTap}
      style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer', fontFamily: SANS, boxSizing: 'border-box' }}
    >
      <div style={{ position: 'relative', height: 168, borderRadius: r.md, overflow: 'hidden', background: A.PANEL }}>
        {subject?.image_url ? (
          <img src={subject.image_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <CourseImageFallback />
        )}
        {rank ? (
          <div style={{ position: 'absolute', top: 10, left: 10, pointerEvents: 'none' }}>
            <RankPill rank={rank.rank} label={rank.label} />
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK, lineHeight: 1.2 }}>
            {subject?.course_name ?? ''}
          </div>
          {place ? <div style={{ ...PLACE, marginTop: 4 }}>{place}</div> : null}
        </div>
        {printable ? <Figure rating={item.facts.rating as number} count={count} size={30} /> : null}
      </div>

      {chipLabels.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {chipLabels.map((label) => (
            <span
              key={label}
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: A.AMBER,
                border: `1px solid ${A.AMBER}`,
                borderRadius: r.pill,
                padding: '3px 8px',
                ...{ fontVariantNumeric: 'tabular-nums' },
              }}
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}

      {sentence ? <div style={{ marginTop: 10 }}><EventSentence text={sentence} size={13} topar={grossToPar(item)} /></div> : null}

      {quote ? (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${A.BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SquircleAvatar size={26} src={quote.avatar} alt={quote.name ?? ''} userId={quote.userId} hairlineRing hideRing={false} />
            <span style={{ fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 700, color: own ? A.AMBER : A.INK }}>
                {own ? t('amateur.courseCard.you', 'You') : quote.name ?? t('amateur.courseCard.aMember', 'A member')}
              </span>
              <span style={{ fontWeight: 500, color: A.MUTE }}> {t('amateur.courseCard.ratedIt', 'rated it')} </span>
              <span style={{ ...NUMF, color: courseSubScoreTone(quote.rating) }}>{quote.rating.toFixed(1)}</span>
            </span>
          </div>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 13,
              fontStyle: 'italic',
              lineHeight: 1.45,
              color: A.MUTE,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {quote.text}
          </p>
        </div>
      ) : null}
    </button>
  );
}

/** §B1 THE LEAD — same content, bigger, no quote. */
export function CourseLeadCard({ item, onTap }: { item: StreamItem; onTap: () => void }) {
  const { t } = useTranslation('courses');
  const subject = item.subject;
  const count = item.facts.rating_n ?? 0;
  const printable = ratingPrintable(item.facts.rating, count);
  const place = coursePlaceLine({ region: subject?.region, subCountry: subject?.sub_country, country: subject?.country });
  const sentence = courseHeadline(t, headlineFacts(item));
  const event = item.facts.course_event;
  const eventChip =
    event === 'record'
      ? t('amateur.courseLead.chipRecord', 'Course record')
      : event === 'low'
      ? t('amateur.courseLead.chipLow', 'Low round')
      : event === 'ratings'
        ? t('amateur.courseLead.chipRatings', 'New ratings')
        : null;

  return (
    <div style={{ fontFamily: SANS }}>
      <button
        type="button"
        onClick={onTap}
        style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer', boxSizing: 'border-box' }}
      >
        <div style={{ position: 'relative', height: 300, borderRadius: r.lg, overflow: 'hidden', background: A.PANEL }}>
          {subject?.image_url ? (
            <img src={subject.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <CourseImageFallback />
          )}
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT, pointerEvents: 'none' }} />
          {eventChip ? (
            <span
              className="standout-figure-chip"
              style={{
                position: 'absolute', top: 12, left: 12, color: A.INK, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 10px', borderRadius: r.pill,
              }}
            >
              {eventChip}
            </span>
          ) : null}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK, lineHeight: 1.15 }}>
            {subject?.course_name ?? ''}
          </div>
          {place ? <div style={{ ...PLACE, marginTop: 5 }}>{place}</div> : null}
          {/* BRIEF_COURSES_LEAD_FOOT §1: the 66px rating column is present only
              when there is a figure to put in it; unrated leads give the sentence full width. */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 12 }}>
            {printable ? (
              <div style={{ flex: '0 0 66px' }}>
                <div
                  style={{
                    ...NUMF, fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1,
                    color: courseSubScoreTone(item.facts.rating as number) === A.GREEN ? A.GREEN : A.INK,
                  }}
                >
                  {(item.facts.rating as number).toFixed(1)}
                </div>
                <div style={{ ...LEAD_LABEL, marginTop: 4 }}>
                  {t('amateur.courseLead.fromRatings', 'from {{count}} ratings', { count })}
                </div>
              </div>
            ) : null}
            {sentence ? <div style={{ minWidth: 0, flex: 1, marginTop: 2 }}><EventSentence text={sentence} size={13} topar={grossToPar(item)} /></div> : null}
          </div>
        </div>
      </button>
    </div>
  );
}

export default CourseLedCard;
