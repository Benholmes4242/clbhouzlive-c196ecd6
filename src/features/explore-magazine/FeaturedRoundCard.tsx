/**
 * BRIEF_SCORES_FEATURED_ROUND — THE ONE ENLARGED ROUND.
 *
 * AchievementCallout's "a special round is MARKED, NEVER ENLARGED" still governs
 * the FEED. This hero is the one agreed exception (Ben), mounted only in the
 * slot above the All feed. No feed card changes. BRIEF_FEATURED_ROUND_FIXES:
 * the pane is the feed card's photographic treatment (course image_url, the
 * same RoundShape trace) plus a gold frame, a pill and a headline.
 *
 * GOLD, NEVER AMBER, ON THE FRAME. Gold means a rare achievement (eagle chips,
 * ace ring). Amber means the viewing member, so on the viewer's own round only
 * the NAME turns amber and reads "You".
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { ReactionAction } from '@/components/explore-tab-new/courseled/ReactionAction';
import { celebrateFigureSize } from '@/lib/reactionKind';
import { FIGS } from '@/components/explore-tab-new/courseled/tokens';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import { MINUS } from './exploreCopy';
import { FigureCell } from './AchievementCallout';
import { AwardCluster } from './AwardCluster';
import type { RoundMedalCounts } from './useBatchRoundMedals';
import { fmtDateLong } from '@/i18n/format';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { CourseImageFallback } from '@/components/whs/CourseImageFallback';
import { r as rad } from '@/lib/radius';
import { EXPLORE_END_LABEL_BAND, RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { FeaturedRound } from './useFeaturedRound';
import { goodHoleDots, SCORE_TRACE_PLOT_HEIGHT } from './roundTreatment';
import { Skeleton } from '@/components/ui/skeleton';
/** Matches the Courses-tab lead course-record tile. 210 left no room for the
 *  trace and the text block to coexist. The pane may grow if copy wraps. */
const PANE_H = 300;
/** 52 is the FEED CARD's band (ExploreCard), correct on a 210px card. The
 *  hero's pane is 300, and 52 minus the 13px end-label band leaves height = 39,
 *  so the line had only 19px of vertical range (RoundShape plots between top = 8
 *  and bottom = height − 12). At 72 that becomes 39px, roughly doubling the
 *  swing, and still leaves clear space above the headline. Do not copy this
 *  value back to the feed card — 52 is right there. */
const SHAPE_BAND = SCORE_TRACE_PLOT_HEIGHT + EXPLORE_END_LABEL_BAND;
const SHAPE_W = 350;
/** THE WASH (EXPLORE_FEATURED_ROUND_GETS_A_BAND §2). Only the headline block —
 *  gross, to-par and reason line — still sits on the photograph; the member,
 *  course, date, reactions and figures live in the band below the pane. That
 *  block carries TEXT_SHADOW, so the foot only needs a light ramp to seat it:
 *  transparent to 40%, then up to 0.30 black at the base. A ramp, not a flat
 *  layer, and nothing behind the trace — the picture stays bright. */
const SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.30) 100%)';
/** V2 §4 — the unit label beside the figure, on its baseline. */
const UNIT: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase', color: A.INK };
const TEXT_SHADOW = '0 1px 2px color-mix(in srgb, black 45%, transparent)';
const FIG: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };
const BIG: React.CSSProperties = { fontSize: 50, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: A.INK, ...FIG };
/** HEADLINE_FIT §1 — pure-word headlines (hole in one, albatross, clean card)
 *  at 34 so they hold one line at 375; numeric and count-led stay at BIG. */
const BIG_WORD: React.CSSProperties = { ...BIG, fontSize: 34 };
/** §3 — the headline row never wraps; the unit label ellipsises instead. */
const ROW: React.CSSProperties = { display: 'flex', alignItems: 'baseline', minWidth: 0, flexWrap: 'nowrap', whiteSpace: 'nowrap' };
const UNIT_FIT: React.CSSProperties = { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `${MINUS}${Math.abs(n)}` : `${n}`);
const toPar = (n: number | null) => (n == null ? null : n === 0 ? 'E' : signed(n));

function Headline({ r, unit }: { r: FeaturedRound; unit?: string | null }) {
  const { t } = useTranslation('courses');
  const k = (key: string, opts?: Record<string, unknown>) => t(`courseDetail.featured.${key}`, opts);
  const feat = (text: string) => <span style={BIG_WORD}>{text}</span>;
  const points = (n: number) => (
    <span style={{ ...ROW, gap: 6 }}>
      <span style={{ ...BIG, flex: '0 0 auto' }}>{n}</span>
      <span style={{ ...UNIT_FIT, fontSize: 17, fontWeight: 600, color: A.INK }}>{k('stablefordPoints')}</span>
    </span>
  );
  switch (r.tier) {
    case 1:
      return feat((r.holes_in_one ?? 0) > 0 || r.reason === 'hole_in_one' ? k('holeInOne') : k('albatross'));
    case 2:
      return (
        <span style={{ ...ROW, gap: 8 }}>
          <span style={{ ...BIG, flex: '0 0 auto' }}>{r.gross}</span>
          {r.to_par != null && r.to_par < 0 ? (
            <span style={{ flex: '0 0 auto', fontSize: 19, fontWeight: 700, color: TOPAR_UNDER_DARK, ...FIG }}>{toPar(r.to_par)}</span>
          ) : null}
          {unit ? <span style={{ ...UNIT, ...UNIT_FIT, marginLeft: 2 }}>{unit}</span> : null}
        </span>
      );
    case 3:
      if (r.reason === 'eagle_brace') return <span style={BIG}>{k('eagleBrace', { count: r.eagles })}</span>;
      if (r.reason === 'stableford_45') return points(r.stableford);
      return <span style={{ ...BIG, color: TOPAR_UNDER_DARK }}>{toPar(r.to_par)}</span>;
    case 4:
      if (r.reason === 'stableford_40') return points(r.stableford);
      if (r.reason === 'birdie_haul')
        return <span style={BIG}>{k(r.birdies === 1 ? 'birdieHaul_one' : 'birdieHaul_other', { count: r.birdies })}</span>;
      return <span style={BIG_WORD}>{k('cleanCard')}</span>;
    default:
      return (
        <span style={{ ...ROW, gap: 10 }}>
          <span style={{ ...BIG, flex: '0 0 auto' }}>{r.vs_hcp == null ? null : signed(r.vs_hcp)}</span>
          <span style={{ ...UNIT, ...UNIT_FIT }}>{k('vsHandicap')}</span>
        </span>
      );
  }
}

export const FeaturedRoundCard: React.FC<{
  round: FeaturedRound;
  viewerId?: string;
  shape?: HoleShape | null;
  onOpen: () => void;
  /** Clap + comment in the gold strip (BRIEF_FEATURED_ROUND_ACTIONS). Optional:
   *  null/absent renders the strapline alone. */
  engagement?: FeaturedRoundEngagement | null;
  /** From the feed's batched award read. undefined = unresolved (empty cell). */
  medals?: RoundMedalCounts | null;
}> = ({
  round: r,
  viewerId,
  shape = null,
  onOpen,
  engagement = null,
  medals,
}) => {
  const { t, i18n } = useTranslation('courses');
  const k = (key: string, opts?: Record<string, unknown>) => t(`courseDetail.featured.${key}`, opts);
  const mine = !!viewerId && r.user_id === viewerId;
  const image = r.image_url;
  let unit: string | null = null;
  if (r.tier === 2) {
    // JOINT_LABEL §1 — the qualifier lives in the label; the co-holder is never named.
    unit = (r.joint_count ?? 0) > 0 ? k('courseRecordJoint') : k('courseRecord');
  }
  const placeLine = [r.course_name, fmtDateLong(r.play_date)].filter(Boolean).join(' · ');
  const tp = toPar(r.to_par);
  const grossSuffix = tp
    ? <span style={{ ...FIG, color: (r.to_par ?? 0) < 0 ? TOPAR_UNDER_DARK : A.MUTE }}>{tp}</span>
    : null;
  const vsHcp = r.vs_hcp == null ? '' : r.vs_hcp === 0 ? 'Level' : signed(r.vs_hcp);
  const mGold = medals?.gold ?? 0, mSilver = medals?.silver ?? 0, mBronze = medals?.bronze ?? 0;
  const traceRow = { round_id: r.whs_score_id, front_nine_to_par: null, back_nine_to_par: null } as unknown as CircleRoundRow;
  const dots = goodHoleDots(shape);

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        all: 'unset', display: 'block', width: '100%', boxSizing: 'border-box', cursor: 'pointer', fontFamily: SANS,
      }}
    >
      <div style={{ borderRadius: rad.lg, overflow: 'hidden', background: A.PANEL }}>
      <div style={{ position: 'relative', minHeight: PANE_H, background: A.PANEL, display: 'flex', flexDirection: 'column' }}>
        {image ? (
          <img src={image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <CourseImageFallback />
        )}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: SCRIM, pointerEvents: 'none' }} />
        <span
          className="standout-figure-chip"
          style={{
            position: 'absolute', top: 12, left: 12, zIndex: 1, color: A.INK, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 10px', borderRadius: rad.pill,
          }}
        >
          {k('label')}
        </span>
        <div style={{ flex: '0 0 44px' }} />
        <div aria-hidden="true" style={{ position: 'relative', flex: '1 1 auto', minHeight: shape ? SHAPE_BAND + 36 : 24, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0 18px' }}>
          {shape ? (
            <RoundShape row={traceRow} shape={shape} width={SHAPE_W} height={SCORE_TRACE_PLOT_HEIGHT}
              showMeta={false} showBaseline baselineColor="rgba(255,255,255,0.34)" strokeWidth={2.2}
              exploreLineOnly endLabels exploreGlow exploreDots={dots} underParFill />
          ) : null}
        </div>
        <div style={{ position: 'relative', padding: '0 16px 16px', textShadow: TEXT_SHADOW }}>
          <Headline r={r} unit={unit} />
        </div>
      </div>
      <div data-featured-band="true" style={{ background: A.PANEL, padding: '13px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <span style={{ width: 20, height: 20, flex: '0 0 20px', display: 'inline-flex' }}>
            <SquircleAvatar size={20} src={r.photo_url} alt={r.display_name ?? ''} userId={r.user_id} hideRing />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: 1 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14.5, fontWeight: 700, color: mine ? A.AMBER : A.INK }}>
              {mine ? t('courseDetail.records.you') : r.display_name}
            </span>
            {placeLine ? (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5, color: A.MUTE }}>{placeLine}</span>
            ) : null}
          </span>
          {engagement ? <Actions engagement={engagement} mine={mine} /> : null}
        </div>
        <div style={{ marginTop: 11, paddingTop: 11, borderTop: `1px solid ${A.SOFT}`, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          <FigureCell minHeight={34} label={t('amateur.stream.stat.gross', 'GROSS')} value={r.gross != null ? String(r.gross) : ''} suffix={grossSuffix} />
          <FigureCell minHeight={34} label={t('amateur.stream.stat.net', 'NET')} value={r.net_score != null ? String(r.net_score) : ''} />
          <FigureCell minHeight={34} label={t('amateur.stream.stat.vsHcp', 'VS HCP')} value={vsHcp} under={(r.vs_hcp ?? 0) < 0} />
          {mGold + mSilver + mBronze > 0 ? (
            <FigureCell minHeight={34} label={t('amateur.stream.stat.awards', 'AWARDS')}
              value={<AwardCluster gold={mGold} silver={mSilver} bronze={mBronze} scale="row" surfaceColor={A.PANEL} />} />
          ) : <span />}
        </div>
      </div>
      </div>
    </button>
  );
};

function Actions({ engagement, mine }: { engagement: FeaturedRoundEngagement; mine: boolean }) {
  const { t } = useTranslation('courses');
  const open = (ev: React.SyntheticEvent) => {
    ev.stopPropagation();
    ev.preventDefault();
    engagement.onOpenComments();
  };
  return (
    <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 24, textShadow: 'none' }}>
      <ReactionAction
        kind="celebrate"
        tone="ink"
        size={20}
        figureSize={celebrateFigureSize(20)}
        count={engagement.likeCount}
        reacted={engagement.liked}
        readOnly={mine}
        hidden={!engagement.likeAvailable || !engagement.onToggleLike}
        onToggle={() => engagement.onToggleLike?.()}
        label={engagement.liked ? t('amateur.round.celebrated', 'Celebrated') : t('amateur.round.celebrate', 'Celebrate this round')}
      />
      <span
        role="button"
        tabIndex={0}
        aria-label={`Comments, ${engagement.commentCount}`}
        onClick={open}
        onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') open(ev); }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: A.INK, cursor: 'pointer', padding: '13px 12px', margin: '-13px -12px', WebkitTapHighlightColor: 'transparent' }}
      >
        <MessageCircle size={20} strokeWidth={2} color={A.INK} aria-hidden />
        {engagement.commentCount > 0 ? (
          <span className="tabular-nums" style={{ ...FIGS, fontSize: celebrateFigureSize(20), fontWeight: 700, lineHeight: 1, color: A.INK }}>
            {engagement.commentCount}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export interface FeaturedRoundEngagement {
  likeCount: number;
  liked: boolean;
  likeAvailable: boolean;
  commentCount: number;
  onToggleLike?: () => void;
  onOpenComments: () => void;
}

/** Loading silhouette of the Round of the week card: the same rounded 300px
 *  photo pane, chip top-left, then figure, member, course and fact lines. */
export const FeaturedRoundSkeleton: React.FC = () => {
  const bar = (w: number | string, h: number, extra?: React.CSSProperties) => (
    <Skeleton style={{ width: w, height: h, borderRadius: 6, ...extra }} />
  );
  return (
    <div aria-hidden="true" style={{ position: 'relative', height: PANE_H, borderRadius: rad.lg, overflow: 'hidden', background: A.PANEL }}>
      <div style={{ position: 'absolute', top: 12, left: 12 }}>{bar(112, 22, { borderRadius: rad.pill })}</div>
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
        {bar(96, 44)}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 9 }}>
          {bar(30, 30, { borderRadius: '34%' })}
          {bar(140, 18)}
        </div>
        <div style={{ marginTop: 8 }}>{bar('60%', 13)}</div>
        <div style={{ marginTop: 6 }}>{bar('40%', 9)}</div>
      </div>
    </div>
  );
};
