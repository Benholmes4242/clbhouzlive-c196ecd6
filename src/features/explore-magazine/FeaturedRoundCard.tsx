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
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { CourseImageFallback } from '@/components/whs/CourseImageFallback';
import { r as rad } from '@/lib/radius';
import { useFitOneLine } from './useFitOneLine';
import { EXPLORE_END_LABEL_BAND, RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { FeaturedRound } from './useFeaturedRound';
import { goodHoleDots } from './roundTreatment';
import { Skeleton } from '@/components/ui/skeleton';
/** BRIEF_FEATURED_ROUND_PANE_V2 §1 — 290, never less. 210 left no room for the
 *  trace and the text block to coexist. The pane may grow if copy wraps. */
const PANE_H = 290;
/** 52 is the FEED CARD's band (ExploreCard), correct on a 210px card. The
 *  hero's pane is 290, and 52 minus the 13px end-label band leaves height = 39,
 *  so the line had only 19px of vertical range (RoundShape plots between top = 8
 *  and bottom = height − 12). At 72 that becomes 39px, roughly doubling the
 *  swing, and still leaves clear space above the headline. Do not copy this
 *  value back to the feed card — 52 is right there. */
const SHAPE_BAND = 72;
const SHAPE_W = 350;
/** BRIEF_FEATURED_ROUND_SCRIM — the scrim is a FOOT, not a filter. Fully
 *  transparent across the top 46% so the photograph (and the trace over it)
 *  shows at full brightness, exactly as the feed cards do. It ramps only where
 *  text sits: every text line is below the 64% stop (>= 0.55 black), name and
 *  course on >= 0.88. Contrast comes from the dark foot, never from dimming
 *  the picture — do not add a flat layer or anything behind the trace. */
const SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.55) 64%, rgba(0,0,0,0.88) 84%, rgba(0,0,0,0.94) 100%)';
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
}> = ({
  round: r,
  viewerId,
  shape = null,
  onOpen,
  engagement = null,
}) => {
  const { t, i18n } = useTranslation('courses');
  const k = (key: string, opts?: Record<string, unknown>) => t(`courseDetail.featured.${key}`, opts);
  const mine = !!viewerId && r.user_id === viewerId;
  const nameRef = useFitOneLine<HTMLDivElement>(r.course_name ?? '', 13.5, 10.5);

  const image = r.image_url;
  const gross = r.gross == null ? null : `${r.gross}`;
  const par = toPar(r.to_par);

  // §4 THE KICKER CARRIES WHAT THE HEADLINE DOES NOT. No figure in both.
  let parts: (string | null)[];
  let unit: string | null = null;
  if (r.tier === 2) {
    // JOINT_LABEL §1 — the qualifier lives in the label ("Joint course record");
    // the place line carries no joint clause and the co-holder is never named.
    // joint_name stays in the row for future use but is not rendered.
    unit = (r.joint_count ?? 0) > 0 ? k('courseRecordJoint') : k('courseRecord');
    parts = [];
  } else if (r.tier === 3 && r.reason !== 'eagle_brace' && r.reason !== 'stableford_45') {
    parts = [gross]; // headline already showed the to-par
  } else if (r.tier >= 5) {
    parts = [gross, par, r.net_score != null ? k('netFact', { net: r.net_score }) : null];
  } else {
    parts = [gross, par];
  }
  const date = r.play_date
    ? new Date(r.play_date).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })
    : null;
  /* LEAD-HERO PARITY — the card now shares the Courses lead card's design:
     no frame, no footer strip; chip top-left, then figure, member, course name
     and an uppercase fact line over the photograph. */
  const factLine = [...parts, date].filter(Boolean).join(' · ');
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
      <div style={{ position: 'relative', minHeight: PANE_H, borderRadius: rad.lg, overflow: 'hidden', background: A.PANEL, display: 'flex', flexDirection: 'column' }}>
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
            <RoundShape row={traceRow} shape={shape} width={SHAPE_W} height={SHAPE_BAND - EXPLORE_END_LABEL_BAND}
              showMeta={false} showBaseline baselineColor="rgba(255,255,255,0.34)" strokeWidth={2.2}
              exploreLineOnly endLabels exploreGlow exploreDots={dots} underParFill />
          ) : null}
        </div>
        <div style={{ position: 'relative', padding: '0 16px 14px', textShadow: TEXT_SHADOW }}>
          <Headline r={r} unit={unit} />
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            <span style={{ width: 30, height: 30, flex: '0 0 30px', display: 'inline-flex' }}>
              <SquircleAvatar size={30} src={r.photo_url} alt={r.display_name ?? ''} userId={r.user_id} hideRing />
            </span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', color: mine ? A.AMBER : A.INK }}>
              {mine ? t('courseDetail.records.you') : r.display_name}
            </span>
            {engagement ? <Actions engagement={engagement} mine={mine} /> : null}
          </div>
          <div
            ref={nameRef}
            style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, color: 'rgba(255,255,255,0.86)', whiteSpace: 'nowrap', overflow: 'hidden' }}
          >
            {r.course_name ?? ''}
          </div>
          {factLine ? (
            <div
              style={{ marginTop: 4, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...FIG }}
            >
              {factLine}
            </div>
          ) : null}
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

/** Loading silhouette of the Round of the week card: the same rounded 290px
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
