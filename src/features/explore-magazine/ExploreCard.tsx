import React from 'react';
import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { EXPLORE_END_LABEL_BAND, RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { GlassBadge } from '@/components/media/GlassDurationBadge';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Heart, MessageCircle } from 'lucide-react';
import { A, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { storyTime } from '@/features/tourhub/news/storyTime';
import { r } from '@/lib/radius';
import { CHIP_GLASS_CLASS, PHOTO_FIG_GOOD, PHOTO_FIG_SHADOW, PHOTO_FIG_UNDER } from '@/styles/photoScrim';

import { headlineFor, kickerParts, relativeDay, toParLabel } from './exploreCopy';
import type { StreamItem } from './streamItem';
import { calloutFor } from './cardTreatment';
import { RoundStatStrip } from './AchievementCallout';
import { dotsFor, treatmentFor } from './roundTreatment';
import { coursePlaceLine } from './placeLine';
import { RANK_SCOPE_LABEL, useTop100RankIndex, type RankListSlug } from './useTop100RankIndex';


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

function FigureChip({
  figure,
  unit,
  tone,
  unitTone,
  corner,
  inRow,
}: {
  figure: string;
  unit?: string | null;
  tone?: string;
  unitTone?: string;
  corner: 'left' | 'right';
  /** C4: the round chips sit in ONE row, so the row owns the position and the
   *  chip inside it is a plain flex child. Every other chip is unchanged. */
  inRow?: boolean;
}) {
  return (
    <span
      className={CHIP_GLASS_CLASS}
      style={{
        position: inRow ? 'relative' : 'absolute',
        top: inRow ? undefined : 8,
        left: inRow ? undefined : corner === 'left' ? 8 : 'auto',
        right: inRow ? undefined : corner === 'right' ? 8 : 'auto',
        zIndex: 2,
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 4,
        padding: '4px 8px',
        minHeight: 28,
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
        borderRadius: 8,
        color: '#FFFFFF',
        ...FIGS,
      }}
    >
      {/* THE SHADOW IS FOR COLOUR ONLY (§2b fallback). White has the headroom to
          sit on any ground; a hue does not, so a coloured figure — and only a
          coloured figure — takes the tight dark shadow. */}
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: tone ?? '#FFFFFF',
          textShadow: tone && tone !== '#FFFFFF' ? PHOTO_FIG_SHADOW : undefined,
        }}
      >
        {figure}
      </span>
      {unit ? (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: unitTone ?? 'rgba(255,255,255,0.72)',
            textShadow: unitTone ? PHOTO_FIG_SHADOW : undefined,
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
function chipsFor(item: StreamItem, t: (k: string, f?: string) => string) {
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
    out.push(
      <FigureChip
        key="review"
        corner="left"
        figure={facts.rating.toFixed(1)}
        unit={t('amateur.stream.chip.rating', 'rating')}
        tone={facts.rating >= 9 ? PHOTO_FIG_GOOD : '#FFFFFF'}
      />,
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
          tone={facts.rating >= 9 ? PHOTO_FIG_GOOD : '#FFFFFF'}
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
}: {
  item: StreamItem;
  size: CardSize;
  onPhoto: boolean;
  onWhoTap?: () => void;
  engagement?: RoundCardEngagement | null;
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
      {who?.user_id ? (
        <span
          role={onWhoTap ? 'button' : undefined}
          tabIndex={onWhoTap ? 0 : undefined}
          onClick={(event) => {
            if (!onWhoTap) return;
            /* §4g THE WHO-LINE IS A SECOND TARGET. */
            event.stopPropagation();
            onWhoTap();
          }}
          style={{ display: 'inline-flex', flexShrink: 0, cursor: onWhoTap ? 'pointer' : 'default' }}
        >
          <SquircleAvatar
            size={20}
            src={who.photo_url}
            alt={name}
            userId={who.user_id}
            hairlineRing
            hideRing={false}
          />
        </span>
      ) : null}
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
    plainRound: callout != null,
  });
  const chips = chipsFor(item, t as never);
  /* §2 SHAPE IS DECIDED BY KIND, NOTHING ELSE. A REVIEW is text ON the
     photograph at every position; a ROUND is text UNDER it at every position.
     There is no earned treatment and position 0 is not special. */
  const onPhoto = item.kind === 'review' && size !== 'pair';
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
  const headlineLineClamp = size === 'lead' ? 3 : 2;
  const headlineNode = (
    <div
      data-explore-headline="true"
      data-explore-line-clamp={headlineLineClamp}
      style={{
        marginTop: size === 'pair' ? 4 : 6,
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
              style={{ position: 'relative', zIndex: 1, display: 'block', paddingInline: 16 }}
            >
              <span data-explore-hero-kicker="true" style={{ display: 'block' }}>{kicker}</span>
              {headlineNode}
              <WhoLine item={item} size={size} onPhoto onWhoTap={onWhoTap} engagement={engagement} />
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
          coursePar={item.facts.course_par ?? null}
          net={item.facts.net != null && item.facts.course_handicap != null ? item.facts.net : null}
          locale={locale}
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
