/**
 * FEATURED ROUND / ROUND OF THE WEEK — OPTION A (signed-off mock
 * featured-round-signed-off.html). The one enlarged round, mounted only in
 * the slot above the All feed, Home's Round of the week rail and the Home
 * feed hero. AchievementCallout's "a special round is MARKED, NEVER ENLARGED"
 * still governs the FEED; this hero is the one agreed exception (Ben).
 *
 * The card is the STANDARD NEW SCORE POST BODY (the shared ScorePostBody,
 * the same component ExploreCard's scoreLed score post renders) with a
 * champion-block header on top, in the Tour completed state's grammar: a
 * gold wash over the top of the card, the member's avatar with a 1.5px gold
 * ring, the surface label in gold ("Round of the week" on Home, "Featured"
 * on Explore), the member's name, date and canonical inline FeedFollowPill
 * (hidden on own rounds, with the host's follow handler), and the FEAT on the
 * right as a gold figure with its unit label. NO photograph, wash, gold
 * frame, pill or static RoundShape trace — all removed by this build.
 *
 * GOLD, NEVER AMBER, ON THE HEADER. Gold means a rare achievement. Amber
 * means the viewing member, so on the viewer's own round only the NAME turns
 * amber and reads "You".
 *
 * ROUND SCORES §3 (ruling) — the body is on NET everywhere it renders: the
 * big figure is NET with its to-par, the line is the FN1 net line or is not
 * drawn, and the stat cells are FN1.5 (NET with to-par, GROSS with to-par,
 * HANDICAP, AWARDS). Net facts come from one single-row gam_round_net read
 * (useFeaturedRoundNet); no row = no NET cell, no line. Figure, line end and
 * NET cell agree by construction.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { ReactionAction } from '@/components/explore-tab-new/courseled/ReactionAction';
import { celebrateFigureSize } from '@/lib/reactionKind';
import { FIGS } from '@/components/explore-tab-new/courseled/tokens';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { MINUS } from './exploreCopy';
import { fmtDateLong } from '@/i18n/format';
import { CompetitionMark } from '@/components/explore-tab-new/courseled/CompetitionMark';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { r as rad } from '@/lib/radius';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import type { FeaturedRound } from './useFeaturedRound';
import { useFeaturedRoundNet } from './useFeaturedRound';
import { feedStrokesReceived } from '@/components/feed/roundTilePlot';
import { ScorePostBody } from '@/components/feed/ScorePostBody';
import { FeedFollowPill } from '@/components/feed/FeedFollowPill';
import { Skeleton } from '@/components/ui/skeleton';

/** The champion-block gold. */
const GOLD = '#FBBC2E';
/** The gold wash over the top of the card — the Tour champion block's
 *  treatment: 11% gold fading through 3% at 150px to the panel by 260px. */
const GOLD_WASH = `linear-gradient(180deg, rgba(251,188,46,.11) 0, rgba(251,188,46,.03) 150px, ${A.PANEL} 260px)`;
const FIG: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `${MINUS}${Math.abs(n)}` : `${n}`);
const toPar = (n: number | null) => (n == null ? null : n === 0 ? 'E' : signed(n));

/** The feat on the right of the header: a gold figure with its unit label
 *  beneath, or pure words alone in gold at 20px with no unit. */
function Feat({ r, netToPar }: { r: FeaturedRound; netToPar: number | null }) {
  const { t } = useTranslation('courses');
  const k = (key: string, opts?: Record<string, unknown>) => t(`courseDetail.featured.${key}`, opts);
  const words = (text: string) => (
    <span data-featured-feat-words="true" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1, color: GOLD, textAlign: 'right', ...FIG }}>{text}</span>
  );
  const figure = (value: React.ReactNode, unit: string | null) => (
    <span data-featured-feat-figure="true" style={{ textAlign: 'right' }}>
      <span style={{ display: 'block', fontSize: 34, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.01em', color: GOLD, ...FIG }}>{value}</span>
      {unit ? (
        <span style={{ display: 'block', marginTop: 5, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.INK }}>{unit}</span>
      ) : null}
    </span>
  );
  const points = (n: number) => figure(n, k('stablefordPoints'));
  switch (r.tier) {
    case 1:
      // Home feed hero: albatross headlines first even beside an ace.
      if (r.reason === 'feed_albatross') return words(k('albatross'));
      return words((r.holes_in_one ?? 0) > 0 || r.reason === 'hole_in_one' ? k('holeInOne') : k('albatross'));
    case 2:
      // JOINT_LABEL §1 — the qualifier lives in the label; the co-holder is never named.
      return figure(r.gross, (r.joint_count ?? 0) > 0 ? k('courseRecordJoint') : k('courseRecord'));
    case 3:
      if (r.reason === 'birdie_run') return words(k('birdieRun', { count: r.birdie_run }));
      if (r.reason === 'eagle_brace') return words(k('eagleBrace', { count: r.eagles }));
      if (r.reason === 'stableford_45') return points(r.stableford);
      /* Round scores §3 — the figure is NET to par; no net row, no figure
         (never the gross to-par). */
      return netToPar != null ? figure(toPar(netToPar), null) : null;
    case 4:
      if (r.reason === 'stableford_40') return points(r.stableford);
      if (r.reason === 'birdie_haul')
        return words(k(r.birdies === 1 ? 'birdieHaul_one' : 'birdieHaul_other', { count: r.birdies }));
      return words(k('cleanCard'));
    default:
      return figure(r.vs_hcp == null ? null : signed(r.vs_hcp), k('vsHandicap'));
  }
}

export const FeaturedRoundCard: React.FC<{
  round: FeaturedRound;
  viewerId?: string;
  /** Host-owned canonical follow state and score-post handler. */
  isFollowed?: boolean;
  onFollow?: () => void;
  shape?: HoleShape | null;
  onOpen: () => void;
  /** Clap + comment at the foot of the card. Optional: null/absent renders
   *  no actions row. */
  engagement?: FeaturedRoundEngagement | null;
  /** From the feed's batched award read. undefined = unresolved (empty cell). */
  medals?: import('./useBatchRoundMedals').RoundMedalCounts | null;
  /** From the feed's batched competition read. Explicit true only shows the
   *  shared COMP mark after the member's name. */
  isCompetition?: boolean;
  /** Home only: square corners, edge to edge like its feed neighbours. */
  square?: boolean;
  /** Header label. Absent = the existing "Round of the week" label. */
  pillLabel?: string;
}> = ({
  round: r,
  viewerId,
  isFollowed,
  onFollow,
  shape = null,
  onOpen,
  engagement = null,
  medals,
  isCompetition,
  square = false,
  pillLabel,
}) => {
  const { t } = useTranslation('courses');
  const k = (key: string, opts?: Record<string, unknown>) => t(`courseDetail.featured.${key}`, opts);
  const mine = !!viewerId && r.user_id === viewerId;
  /* Round scores §3 — FN1 net facts from gam_round_net (one single-row read
     keyed on whs_score_id). No row = no NET cell, no line; GROSS, HANDICAP
     (if known) and AWARDS still show. Never gross for net. */
  const netRow = useFeaturedRoundNet(r.whs_score_id).data;
  const netScore = netRow?.netScore ?? null;
  const courseHcp = netRow?.courseHandicap ?? null;
  const nettable = netScore != null && courseHcp != null && r.course_par != null;
  const netToPar = nettable && netScore != null && r.course_par != null ? netScore - r.course_par : null;
  const received = feedStrokesReceived(shape, courseHcp);
  const dateLine = fmtDateLong(r.play_date);

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        all: 'unset', display: 'block', width: '100%', boxSizing: 'border-box', cursor: 'pointer', fontFamily: SANS,
      }}
    >
      <div style={{ borderRadius: square ? 0 : rad.lg, overflow: 'hidden', background: A.PANEL, backgroundImage: GOLD_WASH }}>
        {/* CHAMPION-BLOCK HEADER — gold ring, gold label, name, date and
            inline Follow pill; the feat on the right. The name ellipsises first, so
            the figure and the name never collide. */}
        <div data-featured-champ="true" style={{ display: 'grid', gridTemplateColumns: '42px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 12, padding: '16px 16px 0' }}>
          <span style={{ gridColumn: 1, gridRow: '1 / 4', display: 'inline-flex' }}>
            <SquircleAvatar size={42} src={r.photo_url} alt={r.display_name ?? ''} userId={r.user_id} ringColor={GOLD} ringWidth={1.5} />
          </span>
          <span style={{ display: 'contents' }}>
            <span style={{ gridColumn: 2, gridRow: 1, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: GOLD }}>
              {pillLabel ?? k('label')}
            </span>
            <span style={{ gridColumn: 2, gridRow: 2, display: 'flex', alignItems: 'center', minWidth: 0, marginTop: 2 }}>
              <span data-featured-name style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 17, fontWeight: 800, color: mine ? A.AMBER : A.INK, minWidth: 0 }}>
                {mine ? t('courseDetail.records.you') : r.display_name}
              </span>
              {/* The shared CompetitionMark, 9px after the name; the name
                  truncates before the mark does. */}
              {isCompetition === true ? <CompetitionMark style={{ marginLeft: 9 }} /> : null}
            </span>
            {dateLine || (onFollow && !mine) ? (
              <span data-featured-date-line style={{ gridColumn: '2 / 4', gridRow: 3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'nowrap' }}>
                {/* A.SOFT is a hairline colour, never a text colour. */}
                <span style={{ fontSize: 13, color: A.MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{dateLine}</span>
                {onFollow && !mine ? (
                  <span data-round-follow="true" style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, padding: '0 12px', margin: '-13px -12px', boxSizing: 'border-box' }} onClickCapture={event => event.preventDefault()} onClick={event => { event.stopPropagation(); event.preventDefault(); }}>
                    <FeedFollowPill isFollowed={!!isFollowed} onFollow={onFollow} />
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>
          <span style={{ gridColumn: 3, gridRow: '1 / 3' }}>
            <Feat r={r} netToPar={netToPar} />
          </span>
        </div>
        {/* THE STANDARD SCORE POST BODY — the shared component, adapted data:
            the featured round's own gross/to-par/par plus the FN1 net row. */}
        <ScorePostBody
          net={netScore}
          gross={r.gross ?? null}
          coursePar={r.course_par ?? null}
          courseHandicap={courseHcp}
          grossToPar={r.to_par ?? null}
          shape={shape}
          received={received}
          scoreId={r.whs_score_id}
          medals={medals}
          course={r.course_name ?? null}
          surfaceColor={A.PANEL}
        />
        {engagement ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 16px 14px' }}>
            <Actions engagement={engagement} mine={mine} />
          </div>
        ) : null}
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

/** Loading silhouette of the Round of the week card: the champion header
 *  (avatar, label, name, feat figure) over score-post body bars. */
export const FeaturedRoundSkeleton: React.FC = () => {
  const bar = (w: number | string, h: number, extra?: React.CSSProperties) => (
    <Skeleton style={{ width: w, height: h, borderRadius: 6, ...extra }} />
  );
  return (
    <div aria-hidden="true" style={{ borderRadius: rad.lg, overflow: 'hidden', background: A.PANEL, padding: '16px 16px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {bar(42, 42, { borderRadius: '34%', flex: '0 0 auto' })}
        <div style={{ flex: 1, minWidth: 0 }}>
          {bar(96, 11)}
          <div style={{ marginTop: 6 }}>{bar(140, 17)}</div>
          <div style={{ marginTop: 6 }}>{bar(110, 13)}</div>
        </div>
        {bar(56, 34, { flex: '0 0 auto' })}
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {bar(72, 46)}
        {bar(120, 24)}
      </div>
      <div style={{ marginTop: 12 }}>{bar('60%', 14)}</div>
      <div style={{ marginTop: 10 }}>{bar('100%', 80)}</div>
    </div>
  );
};
