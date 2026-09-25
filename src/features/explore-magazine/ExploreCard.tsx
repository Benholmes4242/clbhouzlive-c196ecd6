import React from 'react';
import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { EXPLORE_END_LABEL_BAND, RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { GlassBadge } from '@/components/media/GlassDurationBadge';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MessageCircle } from 'lucide-react';
import { LikedByRow } from '@/components/likes/LikedByRow';
import { CALLOUT_SUBTEXT } from './AchievementCallout';
import ClapIcon from '@/components/icons/ClapIcon';
import { CELEBRATE_GLYPH_SIZE, celebrateFigureSize } from '@/lib/reactionKind';
import { A, DISCOVER_FACT, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { ReviewVideoLayer } from './ReviewVideoLayer';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { storyTime } from '@/features/tourhub/news/storyTime';
import { r } from '@/lib/radius';
import {
  CHIP_GLASS_CLASS,
  PHOTO_FIG_SHADOW,
  PHOTO_REVIEW_LABEL,
} from '@/styles/photoScrim';
import { courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';

import { headlineFor, kickerParts, playDateFull, relativeDay, toParLabel } from './exploreCopy';
import type { StreamItem } from './streamItem';
import { calloutFor, rendersOnPhoto } from './cardTreatment';
import { FigureCell, RoundStatStrip, vsHandicapLabel } from './AchievementCallout';
import { dotsFor, treatmentFor } from './roundTreatment';
import { coursePlaceLine } from './placeLine';
import { RANK_SCOPE_LABEL, useTop100RankIndex, type RankListSlug } from './useTop100RankIndex';
import { getScoreTier } from '@/utils/getScoreTier';
import { handicapPairDisplay } from './circleHandicap';
import { NUMF } from '@/components/explore-tab-new/courseled/tokens';
import type { ReviewBreakdown } from './useReviewPageEnrichment';


/**
 * THE UNIT (BRIEF_EXPLORE_MAGAZINE §4).
 *
 * ONE component renders every content type at three sizes. There are no
 * per-type card components and there must not be: if a type does not fit, the
 * unit changes.
 *
 * WHAT MAKES IT A MAGAZINE is the headline — the consequence for the viewer,
 * the story's headline — not the photograph. A round card whose headline is a
 * course name and a number is the page this replaces.
 *
 * ONE DELIBERATE EXCEPTION, AND IT REVERSES THAT PRINCIPLE FOR ONE KIND
 * (BRIEF_EXPLORE_REVIEW_TILE_C5 §0). A LEAD REVIEW no longer carries the
 * review's own words. It is an INSTRUMENT: the member's identity at the top,
 * their OWN PHOTOGRAPH or VIDEO as the ground (the course thumbnail is now the
 * fallback — §1), the score as a 40px figure and the four areas as a stat
 * strip. The words live on the review page, which the tap opens. This was
 * decided with the alternatives in front of us; it is not an oversight, and the
 * principle above still governs every other kind at every size.
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
  /** THE SCORE ID, under source 'round'. Never post.postId (the comments id). */
  reactionSubjectId?: string | null;
  /** The round owner's FIRST name, as the card's who-line shows it. */
  ownerName?: string | null;
  /** The viewer owns this round -> "your round". */
  isOwnRound?: boolean;
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
/** C5 §3.1 — THE REVIEW'S FULL-TILE GROUND. The instrument puts identity at the
 *  TOP of the frame, which the copy-anchored HERO_COPY_SCRIM does not reach, so
 *  a lead review adds this ramp across the whole tile: ground at the top, the
 *  photograph reading through the middle, and NOTHING added at the foot — the
 *  foot is still HERO_COPY_SCRIM's, whose value and every other use are
 *  unchanged. Stacking two dark feet would double-darken the score. */
const HERO_REVIEW_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.34), rgba(0,0,0,0.04) 38%, rgba(0,0,0,0.04))';

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
function chipsFor(
  item: StreamItem,
  t: (k: string, f?: string | Record<string, unknown>) => string,
  locale: string,
  size: CardSize,
) {
  const out: React.ReactNode[] = [];
  const { facts, kind } = item;
  /* C5 §4.1/§4.2 — THE LEAD REVIEW CARRIES NEITHER CHIP any more: the score is
     the 40px figure in the foot, and the photo count is gone. Reviews at std and
     pair are untouched, so the gate is the SIZE, not the kind. */
  const leadReviewChips = kind === 'review' && size === 'lead';

  if (kind === 'round' && facts.gross != null) {
    const toPar = toParLabel(facts.to_par);
    const under = (facts.to_par ?? 0) < 0;
    out.push(
      <FigureChip key="round" corner="left" figure={String(facts.gross)} unit={toPar ?? undefined}
        tone="#FFFFFF" unitTone={under ? A.RED : undefined} />,
    );
  }

  if (kind === 'review' && !leadReviewChips && facts.rating != null) {
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

  if (kind === 'review' && !leadReviewChips && (facts.photoCount ?? 0) > 1) {
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

/**
 * §4.1 — the count badge's stacked-layers glyph, 11px, inline stroke, currentColor
 * so it inherits GlassBadge's white. Never an emoji.
 */
function StackedLayersGlyph() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden
      style={{ alignSelf: 'center', flexShrink: 0 }}>
      <rect x="8" y="3" width="13" height="13" rx="2" />
      <path d="M16 19.5A1.5 1.5 0 0 1 14.5 21H5a2 2 0 0 1-2-2V8.5A1.5 1.5 0 0 1 4.5 7" />
    </svg>
  );
}

function WhoLine({
  item,
  size,
  onPhoto,
  onWhoTap,
  engagement,
  reviewIdentity,
  roundIdentity,
}: {
  item: StreamItem;
  size: CardSize;
  onPhoto: boolean;
  onWhoTap?: () => void;
  engagement?: RoundCardEngagement | null;
  reviewIdentity?: { course: string | null; scope: string | null; date: string | null };
  roundIdentity?: { course: string | null; date: string | null; net: number | null; par: number | null; handicapIndex?: number | null; deltaIndex?: number | null };
}) {
  const { t } = useTranslation('courses');
  /* AN OBJECT IS NOT AN IDENTITY. get_explore_stream builds its `who`
     with jsonb_build_object on every branch, but only rounds and
     reviews select a display_name — a course and a story arrive as an
     object of nulls, which is truthy, which rendered "A member" under
     a card that has no member. A who without a user_id or a name is
     absent, whatever shape it arrived in. */
  const rawWho = item.who;
  const who = rawWho && (rawWho.user_id || rawWho.display_name?.trim())
    ? rawWho
    : null;
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
    fontSize: pair ? 11 : celebrateFigureSize(CELEBRATE_GLYPH_SIZE),
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums lining-nums',
    lineHeight: 1,
  };
  const stop = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const reactions = showActions ? (
    <span
      data-round-reactions={pair ? 'counts' : 'controls'}
      style={{
        marginLeft: pair ? 'auto' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        gap: pair ? 8 : 14,
        flex: '0 0 auto',
        whiteSpace: 'nowrap',
      }}
    >
      {engagement?.likeAvailable && (!pair || showPairLike) ? (
        pair ? (
          <span aria-label={engagement.liked ? t('discover.reactions.celebrated', 'Celebrated') : t('discover.reactions.action', 'Celebrate this round')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: engagement.liked ? A.AMBER : subColor }}>
            <ClapIcon size={14} aria-hidden />
            <span style={countStyle}>{engagement.likeCount}</span>
          </span>
        ) : (
          <span role="button" tabIndex={0} aria-pressed={engagement.liked} aria-label={engagement.liked ? t('discover.reactions.celebrated', 'Celebrated') : t('discover.reactions.action', 'Celebrate this round')}
            onClick={(event) => { stop(event); engagement.onToggleLike?.(); }}
            onKeyDown={(event) => { if (event.key !== 'Enter' && event.key !== ' ') return; stop(event); engagement.onToggleLike?.(); }}
            style={{ minWidth: 44, height: 44, margin: '-6px 0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: engagement.liked ? A.AMBER : subColor, cursor: 'pointer' }}>
            <ClapIcon size={CELEBRATE_GLYPH_SIZE} aria-hidden />
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
          <span role="button" tabIndex={0} aria-label={`Comments, ${engagement.commentCount}`}
            onClick={(event) => { stop(event); engagement.onOpenComments?.(); }}
            onKeyDown={(event) => { if (event.key !== 'Enter' && event.key !== ' ') return; stop(event); engagement.onOpenComments?.(); }}
            style={{ minWidth: 44, height: 44, margin: '-6px 0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: subColor, cursor: 'pointer' }}>
            <MessageCircle size={CELEBRATE_GLYPH_SIZE} strokeWidth={2} aria-hidden />
            {engagement.commentCount > 0 ? <span style={countStyle}>{engagement.commentCount}</span> : null}
          </span>
        )
      ) : null}
    </span>
  ) : null;

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

  if (roundIdentity && !pair) {
    const hasFigures = roundIdentity.net != null && roundIdentity.par != null;
    const under = hasFigures && roundIdentity.net < roundIdentity.par;
    // Server already gated; format only. Absent pair = no line, no gap.
    const hcpPair = handicapPairDisplay({ handicapIndex: roundIdentity.handicapIndex, deltaIndex: roundIdentity.deltaIndex });
    return (
      <div data-round-under-tile="true" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div data-round-identity-row="true" style={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: 8 }}>
          {avatar}
          <span style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minWidth: 0, gap: 3 }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: nameColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
            {roundIdentity.course ? <span data-round-identity-course="true" style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, color: A.MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{roundIdentity.course}</span> : null}
            {roundIdentity.date ? <span data-round-identity-date="true" style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, color: A.MUTE, whiteSpace: 'nowrap' }}>{roundIdentity.date}</span> : null}
            {hcpPair ? (
              <span data-round-identity-hcp="true" style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', lineHeight: 1, color: A.DIM, textTransform: 'uppercase' }}>
                  {t('friendsRail.index', 'HCP')} {hcpPair.index}
                </span>
                {hcpPair.delta ? (
                  <span style={{ ...NUMF, marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 9, fontWeight: 700, lineHeight: 1, color: hcpPair.delta.tone }}>
                    <span aria-hidden>{hcpPair.delta.arrow}</span>
                    <span>{hcpPair.delta.text}</span>
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>
          {hasFigures ? (
            <span data-round-identity-figures="true" style={{ display: 'flex', flex: '0 0 auto', alignItems: 'center', justifyContent: 'flex-end', gap: 18 }}>
              <FigureCell label={t('amateur.stream.stat.net', 'NET')} value={String(roundIdentity.net)} />
              <FigureCell label={t('amateur.stream.stat.vsHcp', 'VS HCP')} value={vsHandicapLabel(roundIdentity.net, roundIdentity.par)} under={under} />
            </span>
          ) : null}
        </div>
        {reactions ? <div data-round-reactions-row="true" style={{ display: 'flex', alignItems: 'center', minHeight: 32, marginTop: 4 }}>{reactions}</div> : null}
        {/* Names line: lead/std only, same x as the clap (the footer's own left edge). */}
        {!pair && engagement?.reactionSubjectId && engagement.likeCount > 0 ? (
          <LikedByRow
            postId={engagement.reactionSubjectId}
            count={engagement.likeCount}
            source="round"
            kind="celebrate"
            ownerName={engagement.ownerName ?? null}
            isOwnRound={engagement.isOwnRound ?? false}
            style={{ marginTop: 8 }}
            /* Matched to AchievementCallout's subtext line (CALLOUT_SUBTEXT). */
            fontSize={CALLOUT_SUBTEXT.fontSize}
            fontWeight={CALLOUT_SUBTEXT.fontWeight}
          />
        ) : null}
      </div>
    );
  }

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
      {reactions}
    </div>
  );
}

const REVIEW_BREAKDOWN_AREAS = [
  ['design', 'design'],
  ['conditions', 'condition'],
  ['clubhouse', 'clubhouse'],
  ['facilities', 'facilities'],
] as const;

/**
 * C5 §3.3 GROUP TWO — THE STAT STRIP, and it is NOT A NEW SHAPE: it is the
 * object the round card already draws for NET / VS HCP (RoundStatStrip's
 * FigureCell), in the on-photo palette this card needs. Only the bars are gone.
 *
 * The all-or-none guard, the label keys and the aria-labels carry over from the
 * retired breakdown rail unchanged (§3.4, §4.4): the numerals are visible now,
 * but each item's label still carries the unit.
 */
function ReviewStatStrip({ breakdown }: { breakdown: ReviewBreakdown | undefined }) {
  const { t } = useTranslation('courses');
  if (!breakdown || REVIEW_BREAKDOWN_AREAS.some(([field]) => breakdown[field] == null)) return null;

  return (
    <ul
      data-review-stat-strip="true"
      style={{
        listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 0, margin: 0, marginTop: 11, padding: '11px 0 0',
        borderTop: '1px solid rgba(255,255,255,0.20)',
      }}
    >
      {REVIEW_BREAKDOWN_AREAS.map(([field, labelKey], index) => {
        const score = breakdown[field] as number;
        const label = t(`review.subscore.${labelKey}`);
        const outOfTen = t('statBrowse.reviews.outOfTen');
        /* ONE HOME FOR THE 9.0 THRESHOLD (§5): the helper decides, never this
           card. Below it the numeral takes the on-photo light ink, because
           A.MUTE is a dark-canvas token and this sits on a photograph. */
        const tone = courseSubScoreTone(score) === A.GREEN ? A.GREEN : 'rgba(255,255,255,0.92)';
        return (
          <li
            key={field}
            aria-label={`${label} ${score.toFixed(1)} ${outOfTen}`}
            style={{
              minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              borderLeft: index === 0 ? undefined : '1px solid rgba(255,255,255,0.16)',
            }}
          >
            <span
              aria-hidden="true"
              title={label}
              style={{
                display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: PHOTO_REVIEW_LABEL, fontFamily: SANS, fontSize: 8, fontWeight: 700,
                letterSpacing: '0.10em', textTransform: 'uppercase', textShadow: HERO_TEXT_SHADOW,
              }}
            >
              {label}
            </span>
            <span
              aria-hidden="true"
              data-review-stat-value={field}
              style={{
                fontFamily: SANS, fontSize: 17, fontWeight: 800, lineHeight: 1, color: tone,
                fontVariantNumeric: 'tabular-nums lining-nums',
                fontFeatureSettings: '"tnum" 1, "zero" 1',
                textShadow: HERO_TEXT_SHADOW,
              }}
            >
              {score.toFixed(1)}
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
  const chips = chipsFor(item, t as never, locale, size);
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
  /* THE STANDFIRST (BRIEF_EXPLORE_STORY_TILE_RESTORE_STANDFIRST §1). Dropped
     from the render on 22 Sep while the RPC and StreamFacts kept carrying it;
     restored to the Tour hero's treatment (NewsTab LeadStory: 13 / 1.45 /
     INK_MUTE). A.MUTE is this surface's name for the same ink value. Clamped
     to two lines like the other multi-line copy here. ABSENT RENDERS
     NOTHING — no element, no reserved height (the StreamFacts contract). */
  const standfirstText = item.kind === 'story' ? (item.facts.standfirst ?? '').trim() : '';
  const standfirstNode = standfirstText ? (
    <div
      data-explore-story-standfirst="true"
      style={{
        marginTop: 6,
        fontFamily: SANS,
        fontSize: 13,
        lineHeight: 1.45,
        color: A.MUTE,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        overflowWrap: 'break-word',
        minWidth: 0,
      }}
    >
      {standfirstText}
    </div>
  ) : null;
  /* THE SECTION LABEL IS FIXED. It names the section, not the story, so
     it no longer falls back out of the story's own kicker: the kicker
     now has its own slot above the headline and a card must
     never print the same string twice. */
  const storySectionLabel = item.kind === 'story'
    ? t('amateurNews.label', 'Amateur News')
    : null;
  /* THE EVENT. Absent renders NOTHING — no empty line, no reserved
     space — so a story published without a kicker simply leads with its
     headline and the tile height is unchanged. */
  const storyEyebrow = item.kind === 'story'
    ? item.facts.source?.trim() || null
    : null;
  const storyAge = item.kind === 'story'
    ? storyTime(item.facts.published_at ?? item.facts.arrived_at ?? null)
    : null;
  /* TWO PARTS ON ONE LINE: the section label takes the space and
     truncates, the age is pinned right and never shrinks. Still one
     line, still inside the 48px chip lane a story never otherwise uses,
     so the column geometry and the 340px tile height are unchanged. It
     must never wrap: a second line changes the lane height and pushes
     the photograph down. */
  const storyMetaNode = item.kind === 'story' ? (
    <span
      data-explore-story-meta="true"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        padding: '13px 16px 0',
        color: HERO_STORY_META_COLOR,
        fontFamily: SANS,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.16em',
        lineHeight: 1.2,
        textTransform: 'uppercase',
        textShadow: HERO_TEXT_SHADOW,
        minWidth: 0,
      }}
    >
      <span
        data-explore-story-section="true"
        style={{ flex: '1 1 auto', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {storySectionLabel}
      </span>
      {storyAge ? (
        <span
          data-explore-story-age="true"
          style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}
        >
          {storyAge}
        </span>
      ) : null}
    </span>
  ) : null;
  /* THE EVENT, ABOVE THE HEADLINE. It is WHITE, not amber. The colour
     law on this surface (courseled/tokens.tsx) is that amber means
     is_viewer and nothing else, so an amber eyebrow on a news story
     would read as "yours" to anyone who has learned the pattern. Full
     white against the meta row's 0.82 is the separation, the same way
     data-explore-kicker-course is white against a 0.62 scope line.
     One line, truncating: a wrapped eyebrow steals a headline line. */
  const storyEyebrowNode = storyEyebrow ? (
    <span
      data-explore-story-eyebrow="true"
      style={{
        display: 'block',
        marginBottom: 7,
        fontFamily: SANS,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.19em',
        textTransform: 'uppercase',
        lineHeight: 1.2,
        color: '#FFFFFF',
        textShadow: HERO_TEXT_SHADOW,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        minWidth: 0,
      }}
    >
      {storyEyebrow}
    </span>
  ) : null;
  /* C5 §1 — THE MEMBER'S OWN MEDIA IS THE GROUND, the course thumbnail the
     fallback. The order (video with a poster, then image, then course photo) is
     resolved ONCE in useReviewPageEnrichment; this card takes one answer. */
  const reviewMedia = leadReview ? item.facts.reviewMedia ?? null : null;
  const reviewGround = reviewMedia
    ? (reviewMedia.kind === 'video' ? reviewMedia.posterUrl : reviewMedia.url)
    : null;
  const reviewName = item.who?.is_viewer
    ? t('amateur.stream.you', 'You')
    : item.who?.display_name?.trim() || t('amateur.stream.aMember', 'A member');
  const reviewRegion = leadReview
    ? coursePlaceLine({
        region: item.subject?.region,
        subCountry: item.subject?.sub_country,
        country: item.subject?.country,
      })
    : null;
  /* §3.2 THE TOP LINE — identity, which the instrument layout would otherwise
     lose. It REPLACES the who-line at the foot: a review does not carry its
     identity twice. It sits in the 48px lane at top 12, inset 14. */
  const reviewTopLine = leadReview ? (
    <span
      data-review-top-line="true"
      style={{
        display: 'flex', alignItems: 'center', gap: 7, minWidth: 0,
        padding: '12px 14px 0',
      }}
    >
      {item.who?.user_id ? (
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
          <SquircleAvatar size={26} src={item.who.photo_url} alt={reviewName} userId={item.who.user_id} hairlineRing hideRing={false} />
        </span>
      ) : null}
      <span
        data-review-member-name="true"
        style={{
          flex: '0 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: SANS, fontSize: 13, fontWeight: 700,
          color: item.who?.is_viewer ? A.AMBER : '#FFFFFF', textShadow: HERO_TEXT_SHADOW,
        }}
      >
        {reviewName}
      </span>
      {kickerDate ? (
        <span
          data-review-date="true"
          style={{
            marginLeft: 'auto', flex: '0 0 auto', whiteSpace: 'nowrap', fontFamily: SANS,
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.72)', textShadow: HERO_TEXT_SHADOW,
          }}
        >
          {kickerDate}
        </span>
      ) : null}
    </span>
  ) : null;
  /* §3.3 GROUP ONE — the score as a figure with its verdict, and the course with
     its region, on ONE row. The 9.0 threshold is the helper's, never this
     card's; below it the figure takes on-photo light ink because A.MUTE is a
     dark-canvas token and this sits on a photograph. */
  const reviewScoreTone = item.facts.rating != null && courseSubScoreTone(item.facts.rating) === A.GREEN
    ? A.GREEN
    : 'rgba(255,255,255,0.94)';
  const reviewFoot = leadReview ? (
    <span data-review-instrument="true" style={{ display: 'block', minWidth: 0 }}>
      <span style={{ display: 'flex', alignItems: 'flex-end', gap: 12, minWidth: 0 }}>
        {item.facts.rating != null ? (
          <span style={{ display: 'flex', flexDirection: 'column', flex: '0 0 auto' }}>
            <span
              data-review-score="true"
              style={{
                fontFamily: SANS, fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1,
                color: reviewScoreTone, textShadow: HERO_TEXT_SHADOW,
                fontVariantNumeric: 'tabular-nums lining-nums',
                fontFeatureSettings: '"tnum" 1, "zero" 1',
              }}
            >
              {item.facts.rating.toFixed(1)}
            </span>
            <span
              data-review-verdict="true"
              style={{
                marginTop: 3, fontFamily: SANS, fontSize: 8, fontWeight: 800, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: reviewScoreTone, textShadow: HERO_TEXT_SHADOW,
                whiteSpace: 'nowrap',
              }}
            >
              {getScoreTier(item.facts.rating).label}
            </span>
          </span>
        ) : null}
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 'auto', minWidth: 0, textAlign: 'right' }}>
          {kickerPartsValue.course ? (
            <span
              data-review-course-name="true"
              style={{
                maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: SANS, fontSize: 16, fontWeight: 700, color: '#FFFFFF', textShadow: HERO_TEXT_SHADOW,
              }}
            >
              {kickerPartsValue.course}
            </span>
          ) : null}
          {reviewRegion ? (
            <span
              data-review-region="true"
              style={{
                marginTop: 3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.62)', textShadow: HERO_TEXT_SHADOW,
              }}
            >
              {reviewRegion}
            </span>
          ) : null}
        </span>
      </span>
      <ReviewStatStrip breakdown={item.facts.breakdown} />
    </span>
  ) : null;

  const photo = (
    <CourseImageFallback
      courseId={item.subject?.course_id ?? null}
      courseName={item.subject?.course_name ?? null}
      imageUrl={reviewGround ?? item.subject?.image_url ?? null}
      pending={!!item.subject?.pending}
      flatWhenEmpty={onPhoto}
      initialsSize={size === 'pair' ? 18 : 26}
      style={onPhoto
        ? { minHeight: PHOTO_H[size], borderRadius: RADIUS[size], width: '100%' }
        : { height: PHOTO_H[size], borderRadius: RADIUS[size], width: '100%' }}
    >
      {chips}
      {leadReview ? (
        <span
          aria-hidden
          data-explore-review-scrim="true"
          style={{ position: 'absolute', inset: 0, background: HERO_REVIEW_SCRIM, zIndex: 1 }}
        />
      ) : null}
      {/* BRIEF_EXPLORE_REVIEW_TILE_VIDEO §3 — A REVIEW VIDEO AUTOPLAYS, muted and
          looping, elected by the page's ONE existing budget. This reverses the
          previous brief's no-autoplay line; it was Ben's call, not a drift.
          §3.5 there is NO play glyph in any state: a tap opens the review, and
          the duration badge alone says "this is a video".
          ONE BADGE SLOT, TOP RIGHT (§4): a video shows its duration; otherwise
          more than one photo shows a bare count; one photo or the course
          fallback shows nothing. Dots are deliberately absent — the card does
          not swipe. */}
      {reviewMedia?.kind === 'video' ? (
        <ReviewVideoLayer
          hlsUrl={reviewMedia.url}
          posterUrl={reviewMedia.posterUrl}
          durationS={reviewMedia.durationS}
        />
      ) : leadReview && (item.facts.photoCount ?? 0) > 1 ? (
        <GlassBadge style={{ position: 'absolute', top: 8, right: 8, left: 'auto', bottom: 'auto', zIndex: 3 }}>
          <StackedLayersGlyph />
          {/* §4.1 THE FIGURE ONLY — the wordy "3 photos" chip was removed on
              purpose; this is the quiet form of the same fact. */}
          <span data-review-photo-figure="true">{item.facts.photoCount}</span>
        </GlassBadge>
      ) : null}
      {onPhoto && item.kind === 'story' ? (
        <span
          aria-hidden
          data-explore-story-scrim="true"
          style={{ position: 'absolute', inset: 0, background: HERO_STORY_SCRIM, zIndex: 1 }}
        />
      ) : null}
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
          <span
            aria-hidden={item.kind !== 'story' && !leadReview}
            style={{ flex: `0 0 ${HERO_CHIP_LANE}px`, minWidth: 0, overflow: 'hidden' }}
          >
            {item.kind === 'story' ? storyMetaNode : leadReview ? reviewTopLine : null}
          </span>
          <span style={{ flex: '1 1 auto', minHeight: 0 }} />
          <span style={{ position: 'relative', display: 'block' }}>
            {item.kind === 'story' ? null : (
              <span
                aria-hidden
                data-explore-copy-scrim="true"
                style={{ position: 'absolute', inset: 0, background: HERO_COPY_SCRIM, zIndex: 0 }}
              />
            )}
            <span
              data-explore-hero-copy="true"
              style={leadReview
                ? { position: 'relative', zIndex: 1, display: 'block', padding: '0 16px 16px' }
                : { position: 'relative', zIndex: 1, display: 'block', paddingInline: 16 }}
            >
               {leadReview ? null : item.kind === 'story' ? storyEyebrowNode : (
                <span data-explore-hero-kicker="true" style={{ display: 'block' }}>{kicker}</span>
              )}
              {/* §4.3 THE QUOTE IS GONE for a lead review — the words live on the
                  review page. Every other kind keeps its headline. */}
              {leadReview ? null : headlineNode}
              {standfirstNode}
              {reviewFoot}
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
          locale={locale}
          ownerDisplayName={item.who?.display_name ?? null}
        />
      ) : null}
      {!onPhoto ? (
        /* §3d text inside a card's caption area is inset a further 4px. */
        <span style={{ display: 'block', paddingInline: 4, marginTop: item.kind === 'round' && size !== 'pair' && callout ? 0 : 8 }}>
          {item.kind === 'round' && size !== 'pair' ? null : kicker}
          {item.kind === 'round' && size !== 'pair' ? null : headlineNode}
          {standfirstNode}
          <WhoLine
            item={item}
            size={size}
            onPhoto={false}
            onWhoTap={onWhoTap}
            engagement={engagement}
            roundIdentity={item.kind === 'round' && size !== 'pair'
              ? { course: kickerPartsValue.course, date: playDateFull(item.facts.play_date ?? item.facts.arrived_at), net: item.facts.net ?? null, par: item.facts.course_par ?? null, handicapIndex: item.facts.current_handicap_index ?? null, deltaIndex: item.facts.delta_index ?? null }
              : undefined}
          />
        </span>
      ) : null}
    </button>
  );
}

export default ExploreCard;
