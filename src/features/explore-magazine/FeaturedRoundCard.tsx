import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
/**
 * FEATURED ROUND — OPTION B: one gold hairline/kicker marks the normal score
 * post. Figure feats opt into ScorePostBody's fourth cell; words and under-par
 * feats leave AWARDS alone. Home's FeedCard owns the shared footer and batched
 * played-with sheet; standalone rail/Explore hosts retain their own actions.
 * One useFeaturedRoundNet read remains the authority for all NET facts. No
 * trigger, follow, competition, medal or scorecard-navigation reads live here.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { ReactionAction } from '@/components/explore-tab-new/courseled/ReactionAction';
import { celebrateFigureSize } from '@/lib/reactionKind';
import { FIGS } from '@/components/explore-tab-new/courseled/tokens';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { MINUS } from './exploreCopy';
import { railCaptionDate } from './exploreCopy';
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

const GOLD = 'var(--featured-round-gold)';
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `${MINUS}${Math.abs(n)}` : `${n}`);

/** Presentation only; round qualification and NET authority stay with callers. */
function featuredFeat(r: FeaturedRound, k: (key: string, opts?: Record<string, unknown>) => string): { name: string; cell?: { value: string; label: string } } {
  const cell = (value: number | null, label: string) => value == null ? undefined : { value: String(value), label };
  switch (r.tier) {
    case 1:
      return { name: k(r.reason === 'feed_albatross' ? 'albatross' : (r.holes_in_one ?? 0) > 0 || r.reason === 'hole_in_one' ? 'holeInOne' : 'albatross') };
    case 2:
      return { name: k((r.joint_count ?? 0) > 0 ? 'courseRecordJoint' : 'courseRecord'), cell: cell(r.gross, k((r.joint_count ?? 0) > 0 ? 'jointRecordCell' : 'recordCell', { defaultValue: (r.joint_count ?? 0) > 0 ? 'Joint record' : 'Record' })) };
    case 3:
      if (r.reason === 'birdie_run') return { name: k('birdieRun', { count: r.birdie_run }) };
      if (r.reason === 'eagle_brace') return { name: k('eagleBrace', { count: r.eagles }) };
      if (r.reason !== 'stableford_45') return { name: k('underPar') };
      return { name: k('pointsFeat', { count: r.stableford, defaultValue: '{{count}} points' }), cell: cell(r.stableford, k('stablefordPoints')) };
    case 4:
      if (r.reason === 'stableford_40') return { name: k('pointsFeat', { count: r.stableford, defaultValue: '{{count}} points' }), cell: cell(r.stableford, k('stablefordPoints')) };
      return { name: r.reason === 'birdie_haul' ? k(r.birdies === 1 ? 'birdieHaul_one' : 'birdieHaul_other', { count: r.birdies }) : k('cleanCard') };
    default: {
      const value = r.vs_hcp == null ? null : signed(r.vs_hcp);
      return { name: value == null ? k('vsHandicap') : k('vsHandicapFeat', { signed: value, defaultValue: '{{signed}} vs handicap' }), cell: value == null ? undefined : { value, label: k('vsHandicapCell', { defaultValue: 'Vs hcp' }) } };
    }
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
  /** Same host-owned pieces as the normal round; the featured byline leads with date. */
  playedWithFaces?: React.ReactNode;
  renderPlayedWithByline?: (date: React.ReactNode) => React.ReactNode;
  onWhoTap?: () => void;
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
  playedWithFaces,
  renderPlayedWithByline,
  onWhoTap,
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
  const received = feedStrokesReceived(shape, courseHcp);
  const dateLine = railCaptionDate(r.play_date);
  const feat = featuredFeat(r, k);

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        all: 'unset', display: 'block', width: '100%', boxSizing: 'border-box', cursor: 'pointer',
      }}
    >
      <div data-featured-card="true" style={{ borderRadius: square ? 0 : rad.lg, overflow: 'hidden', background: A.PANEL }}>
        <div data-featured-hairline style={{ height: 2, background: 'var(--featured-round-rule)' }} />
        <div data-featured-champ="true">
          <div data-featured-kicker style={{ padding: '12px 14px 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD }}>
            <span>{pillLabel ?? k('label')}</span>{' · '}<span data-featured-feat-name>{feat.name}</span>
          </div>
          <div data-round-author-row="true" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px 4px', minWidth: 0 }}>
            <span data-round-author-avatar="true" role={onWhoTap ? 'button' : undefined} tabIndex={onWhoTap ? 0 : undefined}
              onClick={event => { if (onWhoTap) { event.stopPropagation(); event.preventDefault(); onWhoTap(); } }}
              onKeyDown={event => { if (onWhoTap && (event.key === 'Enter' || event.key === ' ')) { event.stopPropagation(); event.preventDefault(); onWhoTap(); } }}
              style={{ display: 'inline-flex', flexShrink: 0 }}>
              <SquircleAvatar size={34} src={r.photo_url} alt={r.display_name ?? ''} userId={r.user_id} ringColor={GOLD} ringWidth={1.5} />
            </span>
            {/* The date-line's identity/follow wrapper preserves canonical tap isolation. */}
            <span data-featured-date-line style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', columnGap: 8, flex: '1 1 auto', minWidth: 0 }}>
              <span style={{ display: 'contents', color: A.MUTE }}>
                <span style={{ gridColumn: 1, gridRow: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                  <span data-featured-name style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 15, fontWeight: 700, lineHeight: 1.25, color: mine ? A.AMBER : A.INK, minWidth: 0 }}>
                    <InlineProMemberName userId={r.user_id}>{mine ? t('courseDetail.records.you') : r.display_name}</InlineProMemberName>
                  </span>
                  {isCompetition === true ? <CompetitionMark data-featured-competition="true" style={{ marginLeft: 9 }} /> : null}
                </span>
                {dateLine || renderPlayedWithByline ? (
                  <span data-featured-byline style={{ gridColumn: '1 / -1', gridRow: 2, display: 'block', marginTop: 2, fontSize: 12, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                    {dateLine ? <span data-round-identity-date="true">{dateLine}</span> : null}
                    {renderPlayedWithByline ? <>{dateLine ? ' · ' : null}{playedWithFaces ? <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 6 }}>{playedWithFaces}</span> : null}{renderPlayedWithByline(null)}</> : null}
                  </span>
                ) : null}
              </span>
              {onFollow && !mine ? (
                <span data-round-follow="true" style={{ gridColumn: 2, gridRow: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, padding: '0 12px', margin: '-13px -12px', boxSizing: 'border-box' }} onClickCapture={event => event.preventDefault()} onClick={event => { event.stopPropagation(); event.preventDefault(); }}>
                  <FeedFollowPill isFollowed={!!isFollowed} onFollow={onFollow} />
                </span>
              ) : null}
            </span>
          </div>
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
          featCell={feat.cell}
        />
        {engagement ? (
          <div data-featured-engagement style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 16px 14px' }}>
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

/** Loading silhouette: one kicker, name/date identity and shared score body. */
export const FeaturedRoundSkeleton: React.FC = () => {
  const bar = (w: number | string, h: number, extra?: React.CSSProperties) => (
    <Skeleton style={{ width: w, height: h, borderRadius: 6, ...extra }} />
  );
  return (
    <div aria-hidden="true" style={{ borderRadius: rad.lg, overflow: 'hidden', background: A.PANEL, padding: '16px 16px 14px' }}>
      {bar('70%', 10)}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
        {bar(34, 34, { borderRadius: '34%', flex: '0 0 auto' })}
        <div style={{ flex: 1, minWidth: 0 }}>
          {bar(140, 15)}
          <div style={{ marginTop: 6 }}>{bar(110, 12)}</div>
        </div>
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
