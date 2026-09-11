import React from 'react';
import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { GlassBadge } from '@/components/media/GlassDurationBadge';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { A, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { r } from '@/lib/radius';
import { CHIP_GLASS_CLASS } from '@/styles/photoScrim';

import { headlineFor, kickerParts, relativeDay, toParLabel } from './exploreCopy';
import type { StreamItem } from './streamItem';

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

const PHOTO_H: Record<CardSize, number> = { lead: 340, std: 210, pair: 124 };
const RADIUS: Record<CardSize, number> = { lead: r.lg, std: r.md, pair: r.md };
/** The trace width the lead and std pass. New widths, not new behaviour. */
const SHAPE_W: Record<CardSize, number> = { lead: 350, std: 350, pair: 0 };
/** The band the trace occupies at the foot of the photograph. */
const SHAPE_BAND: Record<CardSize, number> = { lead: 56, std: 52, pair: 0 };

/** §4f THE SCRIM IS A FUNCTION OF THE TEXT. It exists on the lead because a
 *  three-line headline sits on the photograph; std and pair carry their text
 *  BENEATH the photograph and therefore carry no scrim at all. */
const LEAD_SCRIM =
  'linear-gradient(to bottom, rgba(0,0,0,0) 34%, rgba(0,0,0,0.42) 68%, rgba(0,0,0,0.82) 100%)';

function FigureChip({
  figure,
  unit,
  tone,
  corner,
}: {
  figure: string;
  unit?: string | null;
  tone?: string;
  corner: 'left' | 'right';
}) {
  return (
    <span
      className={CHIP_GLASS_CLASS}
      style={{
        position: 'absolute',
        top: 8,
        left: corner === 'left' ? 8 : 'auto',
        right: corner === 'right' ? 8 : 'auto',
        zIndex: 2,
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 8,
        color: '#FFFFFF',
        ...FIGS,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700, color: tone ?? '#FFFFFF' }}>{figure}</span>
      {unit ? (
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>{unit}</span>
      ) : null}
    </span>
  );
}

/** §4b, by type. A story carries none; a moment carries none. */
function chipsFor(item: StreamItem, t: (k: string, f?: string) => string) {
  const out: React.ReactNode[] = [];
  const { facts, kind } = item;

  if (kind === 'round' && facts.gross != null) {
    const toPar = toParLabel(facts.to_par);
    const under = (facts.to_par ?? 0) < 0;
    out.push(
      <FigureChip
        key="round"
        corner="left"
        figure={String(facts.gross)}
        unit={toPar ?? undefined}
        tone={under ? A.RED : '#FFFFFF'}
      />,
    );
  }

  if (kind === 'review' && facts.rating != null) {
    out.push(
      <FigureChip
        key="review"
        corner="left"
        figure={facts.rating.toFixed(1)}
        unit={t('amateur.stream.chip.rating', 'rating')}
        tone={facts.rating >= 9 ? A.GREEN : '#FFFFFF'}
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
          unit={facts.rating_n != null ? `${facts.rating_n}` : undefined}
          tone={facts.rating >= 9 ? A.GREEN : '#FFFFFF'}
        />,
      );
    }
    /* NEVER BOTH RANKS. World outranks regional. */
    const world = facts.top100_world;
    const regional = facts.top100_regional;
    if (world != null || regional != null) {
      out.push(
        <FigureChip
          key="course-rank"
          corner="right"
          figure={`#${world ?? regional}`}
          unit={world != null ? t('amateur.stream.chip.world', 'world') : t('amateur.stream.chip.gbi', 'GB&I')}
        />,
      );
    }
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
  onWhoTap,
}: {
  item: StreamItem;
  size: CardSize;
  onWhoTap?: () => void;
}) {
  const { t } = useTranslation('courses');
  const who = item.who;
  const onPhoto = size === 'lead';
  const nameColor = who?.is_viewer ? A.AMBER : onPhoto ? 'rgba(255,255,255,0.72)' : A.MUTE;
  const subColor = onPhoto ? 'rgba(255,255,255,0.62)' : A.DIM;

  const name = who?.is_viewer
    ? t('amateur.stream.you', 'You')
    : who?.display_name?.trim() || t('amateur.stream.aMember', 'A member');

  const sub = (() => {
    if (item.kind === 'review' || item.kind === 'round') return relativeDay(item.facts.play_date ?? item.facts.arrived_at);
    if (item.kind === 'story') return relativeDay(item.facts.published_at);
    if (item.kind === 'clip' || item.kind === 'watch') {
      const label = item.facts.duration_s ? formatDuration(item.facts.duration_s) : null;
      return label;
    }
    if (item.kind === 'moment' || item.kind === 'course') return item.subject?.region ?? null;
    return null;
  })();

  if (!who && !sub) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: size === 'pair' ? 5 : 7, minWidth: 0 }}>
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
        }}
      >
        {who ? name : null}
        {who && sub ? <span style={{ color: subColor }}> {'\u00B7'} {sub}</span> : null}
        {!who && sub ? <span style={{ color: subColor }}>{sub}</span> : null}
      </span>
    </div>
  );
}

export function ExploreCard({
  item,
  size,
  shape = null,
  onTap,
  onWhoTap,
}: {
  item: StreamItem;
  size: CardSize;
  /** Rounds only. A pair never draws a shape: at 124px it cannot be read. */
  shape?: HoleShape | null;
  onTap: () => void;
  onWhoTap?: () => void;
}) {
  const { t } = useTranslation('courses');
  const parts = kickerParts(item, t as never);
  const headline = headlineFor(item, t as never);
  const chips = chipsFor(item, t as never);
  const onPhoto = size === 'lead';

  const showShape =
    item.kind === 'round' && size !== 'pair' && !!item.payload.round && (!!shape || !!item.facts.to_par);
  const band = showShape ? SHAPE_BAND[size] : 0;

  const kicker = (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.19em',
        textTransform: 'uppercase',
        color: onPhoto ? 'rgba(255,255,255,0.66)' : A.DIM,
        display: 'flex',
        gap: 5,
        minWidth: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {parts.map((part, index) => (
        <span key={`${index}:${part}`} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {index > 0 ? <span style={{ marginRight: 5 }}>{'\u00B7'}</span> : null}
          {part}
        </span>
      ))}
    </div>
  );

  const headlineNode = (
    <div
      style={{
        marginTop: size === 'pair' ? 4 : 6,
        fontFamily: SANS,
        fontSize: size === 'lead' ? 22 : size === 'std' ? 16 : 13,
        fontWeight: 700,
        letterSpacing: size === 'lead' ? '-0.02em' : size === 'std' ? '-0.01em' : '-0.005em',
        lineHeight: size === 'lead' ? 1.12 : 1.24,
        color: onPhoto ? '#FFFFFF' : A.INK,
        fontStyle: item.kind === 'review' ? 'italic' : 'normal',
        display: '-webkit-box',
        WebkitLineClamp: size === 'lead' ? 3 : 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
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
      flatWhenEmpty={size === 'lead'}
      initialsSize={size === 'pair' ? 18 : 26}
      style={{ height: PHOTO_H[size], borderRadius: RADIUS[size], width: '100%' }}
    >
      {onPhoto ? (
        <span aria-hidden style={{ position: 'absolute', inset: 0, background: LEAD_SCRIM, zIndex: 1 }} />
      ) : null}
      {chips}
      {showShape ? (
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
          <RoundShape
            row={item.payload.round!}
            shape={shape}
            width={SHAPE_W[size]}
            height={band}
            showMeta={false}
            showBaseline={(item.facts.to_par ?? 0) < 0}
            baselineColor="rgba(255,255,255,0.34)"
          />
        </span>
      ) : null}
      {onPhoto ? (
        <span
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: showShape ? 68 : 14,
            zIndex: 2,
            display: 'block',
          }}
        >
          {kicker}
          {headlineNode}
          <WhoLine item={item} size={size} onWhoTap={onWhoTap} />
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
      {!onPhoto ? (
        /* §3d text inside a card's caption area is inset a further 4px. */
        <span style={{ display: 'block', paddingInline: 4, marginTop: 8 }}>
          {kicker}
          {headlineNode}
          <WhoLine item={item} size={size} onWhoTap={onWhoTap} />
        </span>
      ) : null}
    </button>
  );
}

export default ExploreCard;
