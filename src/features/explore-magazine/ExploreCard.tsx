import React from 'react';
import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { EXPLORE_END_LABEL_BAND, RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { GlassBadge } from '@/components/media/GlassDurationBadge';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Heart, MessageCircle } from 'lucide-react';
import { A, DISCOVER_FACT, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { storyTime } from '@/features/tourhub/news/storyTime';
import { r } from '@/lib/radius';
import {
  CHIP_GLASS_CLASS,
  PHOTO_FIG_SHADOW,
  PHOTO_FIG_UNDER,
  PHOTO_REVIEW_FILL,
  PHOTO_REVIEW_LABEL,
  PHOTO_REVIEW_TRACK,
} from '@/styles/photoScrim';
import { courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';

import { headlineFor, kickerParts, relativeDay, toParLabel } from './exploreCopy';
import type { StreamItem } from './streamItem';
import { calloutFor, rendersOnPhoto } from './cardTreatment';
import { RoundStatStrip } from './AchievementCallout';
import { dotsFor, treatmentFor } from './roundTreatment';
import { coursePlaceLine } from './placeLine';
import { RANK_SCOPE_LABEL, useTop100RankIndex, type RankListSlug } from './useTop100RankIndex';
import { getScoreTier } from '@/utils/getScoreTier';
import type { ReviewBreakdown } from './useReviewPageEnrichment';


/**
 * THE UNIT (BRIEF_EXPLORE_MAGAZINE §4).
 *
 * ONE component renders every content type at three sizes. There are no
 * per-type card components and there must not be: if a type does not fit, the
 * unit changes.
 *
 * WHAT MAKES IT A MAGAZINE is the headline — the consequence for the viewer,
 * the review's own words, the story's headline — not the photograph. A round
 * card whose headline is a course name and a number is the page this replaces.
 *
 * TWO DEPARTURES FROM THE MOCK, both because the live app wins on shared
 * treatments (§0):
 *   1. THE FIGURE CHIP is the canonical glass chip class, not the mock's inline
 *      rgba(15,23,42,0.5) + blur(10). The real chip blurs through
 *      `.standout-figure-chip`, and an inline fill can only ever express that
 *      rule's no-backdrop-filter FALLBACK — which is exactly how chips came to
 *      look flat on busy photographs once before.
 *   2. RADII come from the radius canon (r.lg 18 on the lead, r.md 14 on std and
 *      pair), not from hand-typed numbers.
 */

export type CardSize = 'lead' | 'std' | 'pair';

export interface RoundCardEngagement {
  likeCount: number;
  liked: boolean;
  likeAvailable: boolean;
  commentCount: number;
  commentAvailable: boolean;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
}

const PHOTO_H: Record<CardSize, number> = { lead: 340, std: 210, pair: 124 };
/** The radius canon is a CSS length, not a number: r.lg '18px', r.md '14px'. */
const RADIUS: Record<CardSize, string> = { lead: r.lg, std: r.md, pair: r.md };
/** The trace width the lead and std pass. New widths, not new behaviour. */
const SHAPE_W: Record<CardSize, number> = { lead: 350, std: 350, pair: 0 };
/** The band the trace occupies at the foot of the photograph. */
const SHAPE_BAND: Record<CardSize, number> = { lead: 56, std: 52, pair: 0 };

/** The chip is 28px high at the canonical padding. 8 + 28 + 12 reserves the
 *  ruled clearance before any hero copy, whether or not a chip is present. */
const HERO_CHIP_LANE = 48;
const HERO_TEXT_SHADOW = '0 1px 2px rgba(0,0,0,0.45)';
/** Anchored to the copy rather than the variable-height photograph: clear at
 *  the kicker, dark through the headline/who-line, and carried behind trace. */
const HERO_COPY_SCRIM =
  'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 32%, rgba(0,0,0,0.70) 66%, rgba(0,0,0,0.82) 100%)';
/** THE STORY SCRIM (BRIEF_EXPLORE_STORY_TILE_MATCH_THE_TOUR_HERO §1) — the tour
 *  overview hero's ramp, applied to the WHOLE tile rather than the copy block,
 *  because a story's meta line sits at the top of the frame and needs ground.
 *  Three stops, each doing a job: 0.30 is that ground, 0.05 at 34% is where the
 *  photograph reads through, 0.86 at the foot carries the headline. A story's
 *  copy wrapper therefore renders NO scrim of its own — stacking the two would
 *  double-darken the foot. HERO_COPY_SCRIM stays exactly as it is: the review
 *  card's scrim is deliberately anchored to its copy. */
const HERO_STORY_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.30), rgba(0,0,0,0.05) 34%, rgba(0,0,0,0.86))';
/** The story meta's own colour. NOT PHOTO_REVIEW_LABEL — the review card's
 *  identity line and breakdown rail read that token and must not shift. */
const HERO_STORY_META_COLOR = 'rgba(248,250,252,0.82)';

function FigureChip({
  figure,
  unit,
  tone,
  unitTone,
  corner,
  inRow,
  stacked,
  locale,
}: {
  figure: string;
  unit?: string | null;
  tone?: string;
  unitTone?: string;
  corner: 'left' | 'right';
  /** C4: the round chips sit in ONE row, so the row owns the position and the
   *  chip inside it is a plain flex child. Every other chip is unchanged. */
  inRow?: boolean;
  /** Review ratings alone stack the verdict beneath the figure. */
  stacked?: boolean;
  locale?: string;
}) {
  const cjkUnit = locale?.toLowerCase().startsWith('ja') || locale?.toLowerCase().startsWith('ko');
  return (
    <span
      className={CHIP_GLASS_CLASS}
      data-figure-chip={stacked ? 'review-stacked' : 'inline'}
      style={{
        position: inRow ? 'relative' : 'absolute',
        top: inRow ? undefined : 8,
        left: inRow ? undefined : corner === 'left' ? 8 : 'auto',
        right: inRow ? undefined : corner === 'right' ? 8 : 'auto',
        zIndex: 2,
        display: 'inline-flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: stacked ? 'center' : 'baseline',
        gap: stacked ? 1 : 4,
        padding: stacked ? '5px 9px' : '4px 8px',
        minHeight: 28,
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
        borderRadius: 8,
        color: '#FFFFFF',
        ...FIGS,
      }}
    >
      {/* THE SHADOW IS FOR COLOUR ONLY (§2b fallback). White has the headroom to
          sit on any ground; a hue does not, so a coloured figure or unit takes
          the tight dark shadow. */}
      <span
        data-figure-chip-figure="true"
        style={{
          fontSize: stacked ? 19 : 15,
          fontWeight: 700,
          color: tone ?? '#FFFFFF',
          textShadow: tone && tone !== '#FFFFFF' ? PHOTO_FIG_SHADOW : undefined,
        }}
      >
        {figure}
      </span>
      {unit ? (
        <span
          data-figure-chip-unit="true"
          style={{
            fontSize: stacked ? 8.5 : 10,
            fontWeight: stacked ? 800 : 700,
            letterSpacing: stacked ? (cjkUnit ? 0 : '0.12em') : undefined,
            textTransform: stacked ? (cjkUnit ? 'none' : 'uppercase') : undefined,
            color: unitTone ?? 'rgba(255,255,255,0.72)',
            textShadow: unitTone && unitTone !== '#FFFFFF' ? PHOTO_FIG_SHADOW : undefined,
          }}
        >
          {unit}
        </span>
      ) : null}
    </span>
  );
}

/**
 * THE RANK CHIP NAMES THE LIST THE RANK CAME FROM.
 *
 * It used to read `world != null ? 'world' : 'GB&I'`, which labelled every
 * non-world course GB&I — Pine Valley, New Jersey, read "#1 GB&I" — and left the
 * Continental Europe list with no way to be expressed at all. The scope is now
 * READ from course_top100_memberships (regional first, global as the fallback).
 * When it cannot be resolved the rank shows with NO scope label.
 */
function CourseRankChip({ item }: { item: StreamItem }) {
  const { index } = useTop100RankIndex();
  const courseId = item.subject.course_id ?? null;
  const standing = courseId ? index?.get(courseId) ?? null : null;
  const fallbackRank = item.facts.top100_world ?? item.facts.top100_regional ?? null;
  const factScope = item.facts.top100_scope;

  const rank = standing?.rank ?? fallbackRank;
  if (rank == null) return null;
  const scope =
    standing?.scope ??
    (factScope && factScope in RANK_SCOPE_LABEL ? (factScope as RankListSlug) : null);

  return <FigureChip corner="right" figure={`#${rank}`} unit={scope ? RANK_SCOPE_LABEL[scope] : undefined} />;
}

/** §4b, by type. A story carries none; a moment carries none. */
function chipsFor(item: StreamItem, t: (k: string, f?: string | Record<string, unknown>) => string, locale: string) {
  const out: React.ReactNode[] = [];
  const { facts, kind } = item;

  if (kind === 'round' && facts.gross != null) {
    const toPar = toParLabel(facts.to_par);
    const under = (facts.to_par ?? 0) < 0;
    out.push(
      <FigureChip key="round" corner="left" figure={String(facts.gross)} unit={toPar ?? undefined}
        tone="#FFFFFF" unitTone={under ? PHOTO_FIG_UNDER : undefined} />,
    );
  }

  if (kind === 'review' && facts.rating != null) {
    const tier = getScoreTier(facts.rating);
    /* Tier owns the Exceptional gate; the analytical helper owns colour. Both
       intentionally meet at the canonical 9.0 threshold. */
    const exceptionalTone = tier.isExceptional ? courseSubScoreTone(facts.rating) : undefined;
    out.push(
      <FigureChip
        key="review"
        corner="left"
        figure={facts.rating.toFixed(1)}
        unit={tier.isExceptional ? tier.label : undefined}
        unitTone={exceptionalTone}
        /* Neutral stays white because this figure sits on variable photography. */
        tone={exceptionalTone ?? '#FFFFFF'}
        stacked
        locale={locale}
      />,
    );
  }

  if (kind === 'review' && (facts.photoCount ?? 0) > 1) {
    out.push(
      <span
        key="review-photos"
        className={CHIP_GLASS_CLASS}
        data-review-photo-count="true"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: 28,
          padding: '4px 8px',
          boxSizing: 'border-box',
          borderRadius: 8,
          color: DISCOVER_FACT,
          fontFamily: SANS,
          fontSize: 10,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {t('amateur.stream.enrichment.photos', { count: facts.photoCount })}
      </span>,
    );
  }

  if (kind === 'course') {
    if (facts.rating != null) {
      out.push(
        <FigureChip
          key="course-rating"
          corner="left"
          figure={facts.rating.toFixed(1)}
          /* RATING + LABEL, never the count — a bare "2" reads as a second
             score, and the count already lives in the headline. */
          unit={t('amateur.stream.chip.rating', 'rating')}
          /* Neutral stays white because this figure sits on variable photography. */
          tone={facts.rating >= 9 ? courseSubScoreTone(facts.rating) : '#FFFFFF'}
        />,
      );
    }
    /* ONE RANK, AND IT NAMES ITS OWN LIST (see CourseRankChip). */
    out.push(<CourseRankChip key="course-rank" item={item} />);
  }

  if ((kind === 'clip' || kind === 'watch') && facts.duration_s) {
    const label = formatDuration(facts.duration_s);
    if (label) {
      out.push(
        <GlassBadge key="duration" style={{ position: 'absolute', top: 8, right: 8, left: 'auto', bottom: 'auto' }}>
          {label}
        </GlassBadge>,
      );
    }
  }

  return out;
}

function WhoLine({
  item,
  size,
  onPhoto,
  onWhoTap,
  engagement,
  reviewIdentity,
}: {
  item: StreamItem;
  size: CardSize;
  onPhoto: boolean;
  onWhoTap?: () => void;
  engagement?: RoundCardEngagement | null;
  reviewIdentity?: { course: string | null; scope: string | null; date: string | null };
}) {
  const { t } = useTranslation('courses');
  const who = item.who;
  /* THE THREE TEXT SLOTS SHARE ONE PALETTE whether they sit on the photograph
     or the canvas. Only the photograph adds a shadow. */
  const nameColor = who?.is_viewer ? A.AMBER : '#FFFFFF';
  const subColor = 'rgba(255,255,255,0.85)';

  const name = who?.is_viewer
    ? t('amateur.stream.you', 'You')
    : who?.display_name?.trim() || t('amateur.stream.aMember', 'A member');

  const sub = (() => {
    /* ROUND AND REVIEW DATES LIVE IN THE KICKER ROW. Keeping them here created
       a loose second text group between the player and the reaction controls. */
    if (item.kind === 'review' || item.kind === 'round') return null;
    if (item.kind === 'story') return storyTime(item.facts.published_at);
    if (item.kind === 'clip' || item.kind === 'watch') {
      const label = item.facts.duration_s ? formatDuration(item.facts.duration_s) : null;
      return label;
    }
    /* THE PLACE LINE IS REGION + NATION — 'Kerry, Ireland', never 'Kerry'. */
    if (item.kind === 'moment' || item.kind === 'course') {
      return coursePlaceLine({
        region: item.subject?.region,
        subCountry: item.subject?.sub_country,
        country: item.subject?.country,
      });
    }
    return null;
  })();

  if (!who && !sub && !engagement) return null;

  const pair = size === 'pair';
  const showPairLike = pair && !!engagement?.likeAvailable && engagement.likeCount > 0;
  const showPairComment = pair && !!engagement?.commentAvailable && engagement.commentCount > 0;
  const showActions = pair
    ? showPairLike || showPairComment
    : !!engagement && (engagement.likeAvailable || engagement.commentAvailable);
  const countStyle: React.CSSProperties = {
    fontFamily: SANS,
    fontSize: pair ? 11 : 13,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums lining-nums',
    lineHeight: 1,
  };
  const stop = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const avatar = who?.user_id ? (
    <span
      role={onWhoTap ? 'button' : undefined}
      tabIndex={onWhoTap ? 0 : undefined}
      onClick={(event) => {
        if (!onWhoTap) return;
        event.stopPropagation();
        onWhoTap();
      }}
      onKeyDown={(event) => {
        if (!onWhoTap || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        event.stopPropagation();
        onWhoTap();
      }}
      style={{ display: 'inline-flex', flexShrink: 0, cursor: onWhoTap ? 'pointer' : 'default' }}
    >
      <SquircleAvatar size={20} src={who.photo_url} alt={name} userId={who.user_id} hairlineRing hideRing={false} />
    </span>
  ) : null;

  if (reviewIdentity) {
    const right = [reviewIdentity.scope, reviewIdentity.date].filter(Boolean).join(' · ');
    return (
      <div
        className="explore-who-line"
        data-review-identity="true"
        style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}
      >
        {avatar}
        <span
          data-review-member-name="true"
          style={{
            flex: '0 1 auto', maxWidth: '28%', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: SANS, fontSize: 12, fontWeight: 600, color: nameColor, textShadow: HERO_TEXT_SHADOW,
          }}
        >
          {name}
        </span>
        {who && reviewIdentity.course ? <span aria-hidden style={{ flex: '0 0 auto', color: subColor }}>·</span> : null}
        {reviewIdentity.course ? (
          <span
            data-review-course-name="true"
            style={{
              flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: SANS, fontSize: 12,
              fontWeight: 600, color: subColor, textShadow: HERO_TEXT_SHADOW,
            }}
          >
            {reviewIdentity.course}
          </span>
        ) : null}
        {right ? (
          <span
            data-review-identity-right="true"
            style={{
              marginLeft: 'auto', flex: '0 0 auto', whiteSpace: 'nowrap', fontFamily: SANS,
              fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase',
              color: PHOTO_REVIEW_LABEL, textShadow: HERO_TEXT_SHADOW,
            }}
          >
            {right}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="explore-who-line"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: size === 'pair' ? 5 : 7,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {avatar}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
          minWidth: 0,
          overflow: 'hidden',
          flex: '1 1 auto',
        }}
      >
        {who ? (
          <span
            style={{
              fontFamily: SANS,
              fontSize: size === 'pair' ? 11 : 12,
              fontWeight: 600,
              color: nameColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
              flex: '1 1 auto',
               textShadow: onPhoto ? HERO_TEXT_SHADOW : undefined,
            }}
          >
            {name}
          </span>
        ) : null}
        {sub ? (
          <span
            style={{
              fontFamily: SANS,
              fontSize: size === 'pair' ? 11 : 12,
              fontWeight: 600,
              color: subColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
              flex: '0 1 auto',
               textShadow: onPhoto ? HERO_TEXT_SHADOW : undefined,
            }}
          >
            {who ? `\u00B7 ${sub}` : sub}
          </span>
        ) : null}
      </div>
      {showActions ? (
        <span
          data-round-reactions={pair ? 'counts' : 'controls'}
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: pair ? 8 : 14,
            flex: '0 0 auto',
            whiteSpace: 'nowrap',
          }}
        >
          {engagement?.likeAvailable && (!pair || showPairLike) ? (
            pair ? (
              <span aria-label={`Like, ${engagement.likeCount} likes`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: engagement.liked ? A.AMBER : subColor }}>
                <Heart size={14} strokeWidth={2} fill={engagement.liked ? A.AMBER : 'none'} aria-hidden />
                <span style={countStyle}>{engagement.likeCount}</span>
              </span>
            ) : (
              <span
                role="button"
                tabIndex={0}
                aria-pressed={engagement.liked}
                aria-label={`Like, ${engagement.likeCount} likes`}
                onClick={(event) => { stop(event); engagement.onToggleLike?.(); }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  stop(event);
                  engagement.onToggleLike?.();
                }}
                style={{ minWidth: 40, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: engagement.liked ? A.AMBER : subColor, cursor: 'pointer' }}
              >
                <Heart size={18} strokeWidth={2} fill={engagement.liked ? A.AMBER : 'none'} aria-hidden />
                {engagement.likeCount > 0 ? <span style={countStyle}>{engagement.likeCount}</span> : null}
              </span>
            )
          ) : null}
          {engagement?.commentAvailable && (!pair || showPairComment) ? (
            pair ? (
              <span aria-label={`Comments, ${engagement.commentCount}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: subColor }}>
                <MessageCircle size={14} strokeWidth={2} aria-hidden />
                <span style={countStyle}>{engagement.commentCount}</span>
              </span>
            ) : (
              <span
                role="button"
                tabIndex={0}
                aria-label={`Comments, ${engagement.commentCount}`}
                onClick={(event) => { stop(event); engagement.onOpenComments?.(); }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  stop(event);
                  engagement.onOpenComments?.();
                }}
                style={{ minWidth: 40, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: subColor, cursor: 'pointer' }}
              >
                <MessageCircle size={18} strokeWidth={2} aria-hidden />
                {engagement.commentCount > 0 ? <span style={countStyle}>{engagement.commentCount}</span> : null}
              </span>
            )
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

const REVIEW_BREAKDOWN_AREAS = [
  ['design', 'design'],
  ['conditions', 'condition'],
  ['clubhouse', 'clubhouse'],
  ['facilities', 'facilities'],
] as const;

function ReviewBreakdownRail({ breakdown }: { breakdown: ReviewBreakdown | undefined }) {
  const { t } = useTranslation('courses');
  if (!breakdown || REVIEW_BREAKDOWN_AREAS.some(([field]) => breakdown[field] == null)) return null;

  return (
    <ul
      data-review-breakdown-rail="true"
      style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, margin: 0, padding: 0 }}
    >
      {REVIEW_BREAKDOWN_AREAS.map(([field, labelKey]) => {
        const score = breakdown[field] as number;
        const label = t(`review.subscore.${labelKey}`);
        const outOfTen = t('statBrowse.reviews.outOfTen');
        const tone = courseSubScoreTone(score);
        return (
          <li key={field} aria-label={`${label} ${score.toFixed(1)} ${outOfTen}`} style={{ minWidth: 0 }}>
            <span
              aria-hidden="true"
              title={label}
              style={{
                display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: PHOTO_REVIEW_LABEL, fontFamily: SANS, fontSize: 8, fontWeight: 700,
                letterSpacing: '0.10em', textTransform: 'uppercase', textShadow: HERO_TEXT_SHADOW,
              }}
            >
              {label}
            </span>
            <span aria-hidden style={{ display: 'block', height: 3, marginTop: 5, borderRadius: 2, background: PHOTO_REVIEW_TRACK }}>
              <span
                data-review-breakdown-fill={field}
                style={{ display: 'block', width: `${Math.max(0, Math.min(100, score * 10))}%`, height: '100%', borderRadius: 2, background: tone === A.GREEN ? A.GREEN : PHOTO_REVIEW_FILL }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function ExploreCard({
  item,
  size,
  shape,
  viewerBest,
  viewerBestSince,
  onTap,
  onWhoTap,
  engagement,
}: {
  item: StreamItem;
  size: CardSize;
  /** Rounds only. A pair never draws a shape: at 124px it cannot be read. */
  /** undefined = unresolved; null = settled without usable hole detail. */
  shape?: HoleShape | null;
  /** The viewer's own best gross at this course, and the month it was set, both
   *  from the viewer's own rounds. Absent = the sentence drops the comparison
   *  rather than inventing one. */
  viewerBest?: number | null;
  viewerBestSince?: string | null;
  onTap: () => void;
  onWhoTap?: () => void;
  engagement?: RoundCardEngagement | null;
}) {
  const { t, i18n } = useTranslation('courses');
  const locale = i18n.language || 'en';
  const kickerPartsValue = kickerParts(item, t as never);
  /* §5 ROUNDS ONLY, and the callout is decided BEFORE the headline so §6 can
     hand the headline its plain form. A pair is 124px of tile: no panel fits, so
     a paired round carries none — pairs only ever hold PLAIN rounds anyway. */
  const callout = size === 'pair' ? null : calloutFor(item, shape?.holes);
  const headline = headlineFor(item, t as never, locale, {
    holes: shape?.holes,
    viewerBest,
    viewerBestSince,
    /* Record/rank panels own their event copy. A feat panel does not suppress
       the richer multi-feat sentence: rarer rounds must never say less. */
    plainRound: callout?.kind === 'record' || callout?.kind === 'net_record' || callout?.kind === 'rank_up',
  });
  const chips = chipsFor(item, t as never, locale);
  /* §2 SHAPE IS DECIDED BY KIND, NOTHING ELSE. A REVIEW and an ILLUSTRATED
     STORY are text ON the photograph at every position; a ROUND is text UNDER
     it at every position. There is no earned treatment and position 0 is not
     special. The predicate lives in cardTreatment.ts because ExploreMagazine
     sizes the card from the same answer. */
  const onPhoto = rendersOnPhoto(item, size);
  const isOwnRound = item.kind === 'round' && item.who?.is_viewer === true;
  const kickerDate = item.kind === 'review' || item.kind === 'round'
    ? relativeDay(item.facts.play_date ?? item.facts.arrived_at)
    : null;

  /* ONE VISUAL: THE TREND LINE, with gold / red dots on the good holes. The
     ticks row and the distribution bar are retired — see roundTreatment.ts. */
  const treatment = item.kind === 'round' && size !== 'pair' ? treatmentFor(item, shape) : 'none';
  const hasVisual = treatment === 'line' && shape != null && item.payload.round != null;
  const dots = hasVisual ? dotsFor(item, shape) : [];
  const band = hasVisual ? SHAPE_BAND[size] + EXPLORE_END_LABEL_BAND : 0;


  const showScope = size !== 'pair' && kickerPartsValue.scope != null;
  const showCourseRow = kickerPartsValue.course != null || kickerDate != null || (size === 'pair' && kickerPartsValue.scope != null);
  const kicker = (
    <div
      data-explore-kicker="true"
      style={{
        fontFamily: SANS,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.19em',
        textTransform: 'uppercase',
        color: '#FFFFFF',
        textShadow: onPhoto ? HERO_TEXT_SHADOW : undefined,
        display: 'block',
        minWidth: 0,
      }}
    >
      {showScope ? (
        <span
          data-explore-kicker-scope="true"
          data-explore-kicker-part="primary"
          style={{
            display: 'block',
            whiteSpace: 'nowrap',
            color: isOwnRound ? A.AMBER : 'rgba(248,250,252,0.62)',
          }}
        >
          {kickerPartsValue.scope}
        </span>
      ) : null}
      {showCourseRow ? (
        <span
          data-explore-kicker-row="true"
          style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0, marginTop: showScope ? 4 : 0 }}
        >
        {kickerPartsValue.course ? (
          <span
            data-explore-kicker-course="true"
            style={{ display: 'block', flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#FFFFFF' }}
          >
            {kickerPartsValue.course}
          </span>
        ) : null}
        {!kickerPartsValue.course && kickerPartsValue.scope && size === 'pair' ? (
          <span
            data-explore-kicker-course="true"
            style={{ display: 'block', flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#FFFFFF' }}
          >
            {kickerPartsValue.scope}
          </span>
        ) : null}
        {kickerDate ? (
          <span
            data-explore-kicker-date="true"
            style={{ flex: '0 0 auto', whiteSpace: 'nowrap', color: '#FFFFFF', textShadow: onPhoto ? HERO_TEXT_SHADOW : undefined }}
          >
            {kickerDate}
          </span>
        ) : null}
        </span>
      ) : null}
    </div>
  );

  const leadReview = size === 'lead' && item.kind === 'review';
  /* §3 A STORY CLAMPS AT FOUR, like the tour hero. Every other branch is
     untouched: the review stays at 2, other leads at 3. */
  const headlineLineClamp = leadReview
    ? 2
    : size === 'lead'
      ? (item.kind === 'story' ? 4 : 3)
      : 2;
  const headlineNode = (
    <div
      data-explore-headline="true"
      data-explore-line-clamp={headlineLineClamp}
      style={{
        marginTop: leadReview ? 0 : size === 'pair' ? 4 : 6,
        fontFamily: SANS,
        fontSize: leadReview ? 20 : size === 'lead' ? 22 : size === 'std' ? 16 : 13,
        fontWeight: 700,
        letterSpacing: size === 'lead' ? '-0.02em' : size === 'std' ? '-0.01em' : '-0.005em',
        lineHeight: size === 'lead' ? 1.12 : 1.24,
        color: onPhoto ? '#FFFFFF' : A.INK,
         textShadow: onPhoto ? HERO_TEXT_SHADOW : undefined,
        fontStyle: item.kind === 'review' ? 'italic' : 'normal',
        display: '-webkit-box',
        WebkitLineClamp: headlineLineClamp,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        /* §4a a long unbroken token WRAPS at the card edge — it never pushes
            the card wider. */
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        minWidth: 0,
      }}
    >
      {headline}
    </div>
  );
  /* §3 THE STANDFIRST, IN THE CARD'S OWN PALETTE, not the tour's. It sits on a
     photograph, so it takes the same shadow the headline does. Absent renders
     NOTHING: no empty paragraph and no reserved space, so the tile is 340
     either way. */
  const storyStandfirst = item.kind === 'story' ? item.facts.standfirst?.trim() || null : null;
  const storySource = item.kind === 'story'
    ? item.facts.source?.trim() || t('amateurNews.label', 'Amateur News')
    : null;
  const storyAge = item.kind === 'story'
    ? storyTime(item.facts.published_at ?? item.facts.arrived_at ?? null)
    : null;
  /* §2 ONE LINE AT THE TOP OF THE FRAME, not a split row inside the copy. One
     string — the separator exists only when there is an age — rendered inside
     the 48px chip lane a story never uses, so the column geometry is unchanged.
     It truncates; it never wraps, because a second line would change the lane
     height and push the photograph down. */
  const storyMetaNode = item.kind === 'story' ? (
    <span
      data-explore-story-meta="true"
      style={{
        display: 'block',
        padding: '13px 16px 0',
        color: HERO_STORY_META_COLOR,
        fontFamily: SANS,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.16em',
        lineHeight: 1.2,
        textTransform: 'uppercase',
        textShadow: HERO_TEXT_SHADOW,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {`${storySource}${storyAge ? ` · ${storyAge}` : ''}`}
    </span>
  ) : null;
  const standfirstNode = storyStandfirst ? (
    <div
      data-explore-standfirst="true"
      style={{
        marginTop: 8,
        fontFamily: SANS,
        fontSize: 13.5,
        lineHeight: 1.48,
        color: 'rgba(248,250,252,0.80)',
        textShadow: onPhoto ? HERO_TEXT_SHADOW : undefined,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        minWidth: 0,
      }}
    >
      {storyStandfirst}
    </div>
  ) : null;
  const reviewIdentity = leadReview
    ? { course: kickerPartsValue.course, scope: kickerPartsValue.scope, date: kickerDate }
    : null;

  const photo = (
    <CourseImageFallback
      courseId={item.subject?.course_id ?? null}
      courseName={item.subject?.course_name ?? null}
      imageUrl={item.subject?.image_url ?? null}
      pending={!!item.subject?.pending}
      flatWhenEmpty={onPhoto}
      initialsSize={size === 'pair' ? 18 : 26}
      style={onPhoto
        ? { minHeight: PHOTO_H[size], borderRadius: RADIUS[size], width: '100%' }
        : { height: PHOTO_H[size], borderRadius: RADIUS[size], width: '100%' }}
    >
      {chips}
      {onPhoto ? (
        <span
          data-explore-hero="true"
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            minHeight: PHOTO_H[size],
          }}
        >
          <span aria-hidden style={{ flex: `0 0 ${HERO_CHIP_LANE}px` }} />
          <span style={{ flex: '1 1 auto', minHeight: 0 }} />
          <span style={{ position: 'relative', display: 'block' }}>
            <span
              aria-hidden
              style={{ position: 'absolute', inset: 0, background: HERO_COPY_SCRIM, zIndex: 0 }}
            />
            <span
              data-explore-hero-copy="true"
              style={leadReview
                ? { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px 16px' }
                : { position: 'relative', zIndex: 1, display: 'block', paddingInline: 16 }}
            >
               {leadReview ? (
                <WhoLine item={item} size={size} onPhoto onWhoTap={onWhoTap} reviewIdentity={reviewIdentity ?? undefined} />
               ) : item.kind === 'story' ? (
                 storyMetaNode
              ) : (
                <span data-explore-hero-kicker="true" style={{ display: 'block' }}>{kicker}</span>
              )}
              {headlineNode}
              {standfirstNode}
              {leadReview ? <ReviewBreakdownRail breakdown={item.facts.breakdown} /> : null}
               {!leadReview && item.kind !== 'story' ? <WhoLine item={item} size={size} onPhoto onWhoTap={onWhoTap} engagement={engagement} /> : null}
            </span>
            {/* §3 THE BOTTOM LANE IS 16px AND CARRIES NO TRACE. On-photo is now
                the REVIEW shape, and a review has no round shape to draw; the
                trace branch stays only because the lane is shared code. */}
            <span
              data-explore-hero-bottom-lane="true"
              aria-hidden
              style={{
                position: 'relative',
                zIndex: 1,
                height: hasVisual ? band + 12 : 16,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {hasVisual ? (
                <RoundShape row={item.payload.round} shape={shape} width={SHAPE_W[size]}
                  height={band - EXPLORE_END_LABEL_BAND} showMeta={false} showBaseline
                  baselineColor="rgba(255,255,255,0.34)" strokeWidth={2.2} exploreLineOnly endLabels exploreGlow
                  exploreDots={dots} underParFill />
              ) : null}
            </span>
          </span>
        </span>
      ) : hasVisual ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: band,
            zIndex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <RoundShape row={item.payload.round} shape={shape} width={SHAPE_W[size]}
            height={band - EXPLORE_END_LABEL_BAND} showMeta={false} showBaseline
            baselineColor="rgba(255,255,255,0.34)" strokeWidth={2.2} exploreLineOnly endLabels exploreGlow
            exploreDots={dots} underParFill />
        </span>
      ) : null}
    </CourseImageFallback>
  );

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        display: 'block',
        width: '100%',
        padding: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        color: A.INK,
        fontFamily: SANS,
        ...FIGS,
      }}
    >
      <span style={{ position: 'relative', display: 'block' }}>{photo}</span>
      {!onPhoto && item.kind === 'round' && size !== 'pair' ? (
        <RoundStatStrip
          callout={callout}
          scoreId={item.facts.score_id ?? null}
          featCounts={{
            aces: item.facts.holes_in_one ?? null,
            albatrosses: item.facts.albatrosses ?? null,
            eagles: item.facts.eagles ?? null,
          }}
          coursePar={item.facts.course_par ?? null}
          net={item.facts.net != null && item.facts.course_handicap != null ? item.facts.net : null}
          locale={locale}
          ownerDisplayName={item.who?.display_name ?? null}
        />
      ) : null}
      {!onPhoto ? (
        /* §3d text inside a card's caption area is inset a further 4px. */
        <span style={{ display: 'block', paddingInline: 4, marginTop: item.kind === 'round' && size !== 'pair' && (callout || (item.facts.net != null && item.facts.course_handicap != null && item.facts.course_par != null)) ? 0 : 8 }}>
          {kicker}
           {headlineNode}
            <WhoLine item={item} size={size} onPhoto={false} onWhoTap={onWhoTap} engagement={engagement} />
        </span>
      ) : null}
    </button>
  );
}

export default ExploreCard;
