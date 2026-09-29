import React from 'react';
import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from '@/components/whs/CourseImageFallback';
import { A, NUMF, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import { r } from '@/lib/radius';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';

import { courseHeadline } from './courseHeadline';
import { toParLabel } from './exploreCopy';
import { ratingPrintable } from './courseRatingFloor';
import { coursePlaceLine } from './placeLine';
import { useFitOneLine } from './useFitOneLine';
import type { StreamItem } from './streamItem';
import type { CourseQuote } from './useCourseQuotes';
import { RANK_SCOPE_LABEL, useTop100RankIndex, type RankListSlug } from './useTop100RankIndex';
import { RankFlagBadge } from './RankFlagBadge';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { analyticsEvents } from '@/utils/analyticsEvents';

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

function useRank(item: StreamItem): { rank: number; scope: RankListSlug | null } | null {
  const { index } = useTop100RankIndex();
  const courseId = item.subject?.course_id ?? null;
  const standing = courseId ? index?.get(courseId) ?? null : null;
  const rank = standing?.rank ?? item.facts.top100_regional ?? item.facts.top100_world ?? null;
  if (rank == null) return null;
  const factScope = item.facts.top100_scope;
  const scope = standing?.scope ?? (factScope && factScope in RANK_SCOPE_LABEL ? (factScope as RankListSlug) : null);
  return { rank, scope };
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
        {t('amateur.courseCard.fromGolfers', 'From {{n}} golfers', { n: count })}
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
  const openReviewSheet = useReviewSheetStore((st) => st.open);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); }
      }}
      style={{ display: 'block', width: '100%', cursor: 'pointer', fontFamily: SANS, boxSizing: 'border-box' }}
    >
      <div style={{ position: 'relative', height: 168, borderRadius: r.md, overflow: 'hidden', background: A.PANEL }}>
        {subject?.image_url ? (
          <img src={subject.image_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <CourseImageFallback />
        )}
        {rank ? (
          <div style={{ position: 'absolute', top: 10, left: 10, pointerEvents: 'none' }}>
            <RankFlagBadge rank={rank.rank} scope={rank.scope} />
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
        <div
          role="button"
          tabIndex={0}
          onClick={(ev) => {
            ev.stopPropagation();
            analyticsEvents.track('course_card_quote_tapped', { course_id: subject?.course_id ?? null });
            openReviewSheet({
              user: {
                id: quote.userId ?? '',
                name: own ? t('amateur.courseCard.you', 'You') : quote.name ?? t('amateur.courseCard.aMember', 'A member'),
                avatar: quote.avatar,
              },
              courseId: quote.courseId,
              courseName: subject?.course_name ?? '',
              rating: quote.rating,
              reviewId: quote.reviewId,
              courseCountry: subject?.country ?? null,
              courseRegion: subject?.region ?? null,
              courseSubCountry: subject?.sub_country ?? null,
              reviewText: quote.fullText,
              breakdown: quote.breakdown,
            });
          }}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); ev.currentTarget.click(); }
          }}
          style={{ marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${A.BORDER}`, cursor: 'pointer' }}
        >
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
    </div>
  );
}

/** FeaturedRoundCard's scrim, verbatim. A FOOT, not a filter: fully
 *  transparent across the top 46% so the photograph is never dimmed. Do not
 *  substitute SCRIM_STANDOUT, which starts fading at 32% and would grey the
 *  picture. */
const HERO_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.55) 64%, rgba(0,0,0,0.88) 84%, rgba(0,0,0,0.94) 100%)';
const TEXT_SHADOW = '0 1px 2px color-mix(in srgb, black 45%, transparent)';
/** The unit beside the figure. WHITE, not gold — the chip already carries the
 *  gold, and two golds in one corner flatten each other. */
const HERO_UNIT: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase',
  color: A.INK, textShadow: TEXT_SHADOW,
};
const GOLD_FRAME = 'rgba(216,169,60,0.55)';
const GOLD_FRAME_SOFT = 'rgba(216,169,60,0.14)';
const GOLD_STRIP = 'linear-gradient(180deg, rgba(216,169,60,0.16), rgba(216,169,60,0.09))';

/** §B1 THE LEAD — BRIEF_COURSES_LEAD_HERO: figure, member and place over the photograph. */
export function CourseLeadCard({ item, onTap }: { item: StreamItem; onTap: () => void }) {
  const { t } = useTranslation('courses');
  const subject = item.subject;
  const topar = grossToPar(item);
  const count = item.facts.rating_n ?? 0;
  const printable = ratingPrintable(item.facts.rating, count);
  const holder = item.facts.low_by ?? null;
  const place = coursePlaceLine({ region: subject?.region, subCountry: subject?.sub_country, country: subject?.country });
  const event = item.facts.course_event;
  const eventChip =
    event === 'record'
      ? t('amateur.courseLead.chipRecord', 'Course record')
      : event === 'low'
      ? t('amateur.courseLead.chipLow', 'Low round')
      : event === 'ratings'
        ? t('amateur.courseLead.chipRatings', 'New ratings')
        : null;
  const eventUnit =
    event === 'record'
      ? t('amateur.courseLead.unitRecord', 'Course record')
      : t('amateur.courseLead.unitLow', 'Low this month');

  const rounds = item.facts.rounds_tracked ?? 0;
  /* Same keys courseHeadline owns; their sentence tail (" here.") is dropped
     for the one-line place label. */
  const roundsText = (rounds === 1
    ? t('amateur.stream.course.factRoundsOne', '1 round tracked here.')
    : t('amateur.stream.course.factRoundsN', '{{n}} rounds tracked here.', { n: rounds })
  ).replace(/\s*here\.?$/i, '').replace(/\.$/, '');
  const placeLine = [place, rounds > 0 ? roundsText : null].filter(Boolean).join(' \u00B7 ');
  const stripLine = printable
    ? t('amateur.courseLead.stripRated', 'Rated {{rating}} by {{n}} golfers', { rating: (item.facts.rating as number).toFixed(1), n: count })
    : place ?? '';

  const nameRef = useFitOneLine<HTMLDivElement>(subject?.course_name ?? '', 13.5, 10.5);
  const placeRef = useFitOneLine<HTMLDivElement>(placeLine, 9, 7.5);

  return (
    <div style={{ fontFamily: SANS }}>
      <button
        type="button"
        onClick={onTap}
        style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer', boxSizing: 'border-box' }}
      >
        <div
          style={{
            border: `1px solid ${GOLD_FRAME}`,
            borderRadius: r.lg,
            overflow: 'hidden',
            boxShadow: `0 0 0 1px ${GOLD_FRAME_SOFT}, 0 10px 30px rgba(0,0,0,0.5)`,
          }}
        >
          <div style={{ position: 'relative', height: 300, background: A.PANEL }}>
            {subject?.image_url ? (
              <img src={subject.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <CourseImageFallback />
            )}
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: HERO_SCRIM, pointerEvents: 'none' }} />
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

            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
              {topar ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, whiteSpace: 'nowrap', minWidth: 0 }}>
                  <span style={{ ...NUMF, fontSize: 50, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: A.INK, textShadow: TEXT_SHADOW, flex: '0 0 auto' }}>
                    {topar.gross}
                  </span>
                  <span style={{ ...NUMF, fontSize: 19, fontWeight: 700, color: TOPAR_UNDER_DARK, textShadow: TEXT_SHADOW, flex: '0 0 auto' }}>
                    {toParLabel(topar.toPar)}
                  </span>
                  <span style={{ ...HERO_UNIT, marginLeft: 2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {eventUnit}
                  </span>
                </div>
              ) : printable ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, whiteSpace: 'nowrap', minWidth: 0 }}>
                  <span
                    style={{
                      ...NUMF, fontSize: 50, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1,
                      color: courseSubScoreTone(item.facts.rating as number) === A.GREEN ? A.GREEN : A.INK,
                      textShadow: TEXT_SHADOW, flex: '0 0 auto',
                    }}
                  >
                    {(item.facts.rating as number).toFixed(1)}
                  </span>
                  <span style={{ ...HERO_UNIT, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t('amateur.courseLead.fromGolfers', 'from {{n}} golfers', { n: count })}
                  </span>
                </div>
              ) : null}

              {/* MEMBER ROW — only with a gross AND a named holder. A joint
                  record names nobody (low_by null at source). */}
              {topar && holder ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10, minWidth: 0 }}>
                  {item.who?.user_id ? (
                    <SquircleAvatar size={30} src={item.who.photo_url} alt={holder} userId={item.who.user_id} hideRing />
                  ) : null}
                  <span
                    style={{
                      fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK, textShadow: TEXT_SHADOW,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
                    }}
                  >
                    {holder}
                  </span>
                </div>
              ) : null}

              <div
                ref={nameRef}
                style={{
                  marginTop: topar || printable ? 8 : 0, fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, color: 'rgba(255,255,255,0.86)',
                  textShadow: TEXT_SHADOW, whiteSpace: 'nowrap', overflow: 'hidden',
                }}
              >
                {subject?.course_name ?? ''}
              </div>

              {placeLine ? (
                <div
                  ref={placeRef}
                  style={{
                    marginTop: 4, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.62)', textShadow: TEXT_SHADOW, whiteSpace: 'nowrap', overflow: 'hidden',
                  }}
                >
                  {placeLine}
                </div>
              ) : null}
            </div>
          </div>

          {stripLine ? (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                background: GOLD_STRIP, fontSize: 12.5, fontWeight: 600, color: A.INK,
              }}
            >
              {stripLine}
            </div>
          ) : null}
        </div>
      </button>
    </div>
  );
}

export default CourseLedCard;
