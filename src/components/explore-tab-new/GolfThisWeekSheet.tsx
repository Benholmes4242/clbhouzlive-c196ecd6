import { useMemo, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { buildInsightMap, referenceLine } from './friendRoundParts';
import { relativeDay } from './courseled/discoverWhen';
import { useRoundHoleShapes, type HoleShape } from './courseled/hooks/useRoundHoleShapes';
import {
  DEFAULT_WEEK_SCOPE,
  GOLF_WEEK_DAYS,
  orderForWeek,
  usePlayedCourseIds,
  useGolfThisWeek,
  useWeekScopeCourses,
  type WeekScope,
} from './courseled/hooks/useGolfThisWeek';
import { useCourseCardMeta } from './courseled/hooks/useCourseCardMeta';
import {
  useContentReactions,
  type ReactionTarget,
} from './courseled/hooks/useContentReactions';
import {
  useWeekRegionCounts,
  type RegionSelection,
} from './courseled/hooks/useWeekRegionCounts';
import { WeekScopePills } from './courseled/WeekFilters';
import { RoundShape } from './courseled/RoundShape';
import { selectMoment } from './courseled/roundMoment';
import { ReactionAction, ReactionSlot } from './courseled/ReactionAction';
import { CommentAction } from './courseled/CommentAction';
import { useRoundPostComments } from './courseled/hooks/useRoundPostComments';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import { A, FIGS, TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';


/**
 * GOLF THIS WEEK — SEE ALL (BRIEF_GOLF_THIS_WEEK §5.2).
 *
 * THE FRIENDS RAIL'S SHEET, not a third pattern: same BottomSheet presentation,
 * same dismissal, same header treatment, same sticky day headers and the same
 * FriendRoundRow. The only additions the brief asks for are the scope pills,
 * which carry through so the lens can be changed inside the sheet.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  /** THE SHEET INHERITS THE RAIL'S SCOPE AND AREA — never its own filter state. */
  scope?: WeekScope;
  onScopeChange?: (scope: WeekScope) => void;
  region?: RegionSelection | null;
  onRowPress: (scoreId: string | null, userId: string) => void;
}

const ROW_HEIGHT = 64;
const AVATAR_SIZE = 30;
const SHAPE_WIDTH = 62;
const SHAPE_HEIGHT = 26;
const SCORE_WIDTH = 40;

interface CompactRoundRowProps {
  row: CircleRoundRow;
  reason: string | null;
  shape: HoleShape | null;
  reaction: {
    count: number;
    mine: boolean;
    hidden: boolean;
    readOnly: boolean;
    label: string;
    onToggle: () => void;
  };
  /** BRIEF_ROUND_COMMENTS_EVERYWHERE §S2.3 — null when the round has no post. */
  comment: { count: number; label: string; onOpen: () => void } | null;
  isLast: boolean;
  onPress: () => void;
}

function CompactRoundRow({
  row,
  reason,
  shape,
  reaction,
  comment,
  isLast,
  onPress,
}: CompactRoundRowProps) {
  const moment = useMemo(
    () => selectMoment(shape?.holes ?? [], row.course_record_fact),
    [row.course_record_fact, shape],
  );
  const showShape = moment.kind !== 'plain';
  const toPar = row.gross != null && row.course_par != null ? row.gross - row.course_par : null;
  const toParText = toPar == null ? '' : toPar < 0 ? `\u2212${Math.abs(toPar)}` : toPar > 0 ? `+${toPar}` : 'E';
  const toParTone = toPar != null && toPar < 0 ? TOPAR_RED : A.MUTE;

  const activate = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onPress();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-round-row="true"
      data-moment-kind={moment.kind}
      onClick={onPress}
      onKeyDown={activate}
      style={{
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateColumns: `${AVATAR_SIZE}px minmax(0, 1fr) ${SHAPE_WIDTH}px ${SCORE_WIDTH}px 34px 42px`,
        alignItems: 'center',
        columnGap: 6,
        width: '100%',
        height: ROW_HEIGHT,
        padding: '8px 16px',
        background: 'transparent',
        borderBottom: isLast ? 'none' : `1px solid ${A.BORDER}`,
        cursor: 'pointer',
      }}
    >
      <SquircleAvatar
        size={AVATAR_SIZE}
        srcCandidates={row.profile_photo_url ? [row.profile_photo_url] : []}
        alt={row.display_name}
        fallback={getInitialsFromName(row.display_name)}
        userId={row.user_id ?? undefined}
        hairlineRing
      />

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: A.INK,
            fontSize: 12.5,
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          {row.display_name}
        </div>
        <div
          style={{
            minWidth: 0,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: A.MUTE,
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.15,
          }}
        >
          {row.course_name ?? ''}
        </div>
        <div
          style={{
            minWidth: 0,
            minHeight: 12,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: A.DIM,
            fontSize: 10.5,
            fontWeight: 600,
            lineHeight: 1.15,
          }}
        >
          {reason ?? ''}
        </div>
      </div>

      <div
        data-round-shape={showShape ? 'visible' : 'reserved'}
        style={{ width: SHAPE_WIDTH, height: SHAPE_HEIGHT, display: 'flex', alignItems: 'center' }}
      >
        {showShape && (
          <RoundShape
            row={row}
            shape={shape}
            width={SHAPE_WIDTH}
            height={SHAPE_HEIGHT}
            showMeta={false}
            strokeWidth={1.6}
          />
        )}
      </div>

      <div style={{ width: SCORE_WIDTH, minWidth: 0, textAlign: 'right' }}>
        <div
          className="tabular-nums"
          style={{ ...FIGS, color: A.INK, fontSize: 17, fontWeight: 800, lineHeight: 1 }}
        >
          {row.gross ?? '\u2014'}
        </div>
        <div
          className="tabular-nums"
          style={{
            ...FIGS,
            minHeight: 12,
            marginTop: 4,
            color: toParTone,
            fontSize: 11.5,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {toParText}
        </div>
      </div>

      {/* THE COMMENT COLUMN. Fixed width whether or not it renders, so the
          hearts stay on one x down the list and ROW_HEIGHT never moves. */}
      <div style={{ width: 34, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        {comment && (
          <CommentAction
            count={comment.count}
            onOpen={comment.onOpen}
            label={comment.label}
            reserveCount
          />
        )}
      </div>

      <ReactionSlot>
        <span style={{ width: 42, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          {!reaction.hidden && (reaction.readOnly ? (
            <span
              aria-label={reaction.label}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Heart size={15} strokeWidth={2} color={A.MUTE} fill="none" aria-hidden />
              {reaction.count > 0 && (
                <span
                  className="tabular-nums"
                  style={{ ...FIGS, color: A.MUTE, fontSize: 11.5, fontWeight: 700, lineHeight: 1 }}
                >
                  {reaction.count}
                </span>
              )}
            </span>
          ) : (
            <ReactionAction
              count={reaction.count}
              reacted={reaction.mine}
              onToggle={reaction.onToggle}
              label={reaction.label}
              reserveCount
            />
          ))}
        </span>
      </ReactionSlot>
    </div>
  );
}

export function GolfThisWeekSheet({
  open,
  onClose,
  userId,
  scope = DEFAULT_WEEK_SCOPE,
  onScopeChange,
  region = null,
  onRowPress,
}: Props) {
  const { t } = useTranslation('courses');
  const scopeCourses = useWeekScopeCourses(userId, scope);
  const roundsQuery = useGolfThisWeek(userId, scope, scopeCourses.courseIds);
  const all = useMemo(() => roundsQuery.data ?? [], [roundsQuery.data]);
  const courseIds = useMemo(
    () => all.map((r) => r.course_id).filter((v): v is string => !!v),
    [all],
  );
  const played = usePlayedCourseIds(userId);
  const playedSet = useMemo(() => new Set(played.ids), [played.ids]);
  const meta = useCourseCardMeta(courseIds).data;
  const regions = useWeekRegionCounts(all, meta);
  const rounds = useMemo(
    () => orderForWeek(all.filter((r) => regions.matches(r, region)), playedSet),
    [all, regions, region, playedSet],
  );
  const total = rounds.length;
  const courseTotal = useMemo(() => {
    const keys = new Set<string>();
    for (const round of rounds) {
      const key = round.course_id ?? round.course_name?.trim().toLocaleLowerCase();
      if (key) keys.add(key);
    }
    return keys.size;
  }, [rounds]);

  const insights = useMemo(() => buildInsightMap(rounds, t as never), [rounds, t]);
  const scoreIds = useMemo(() => rounds.map((r) => r.score_id), [rounds]);
  const holeShapes = useRoundHoleShapes(scoreIds);

  /* REACTIONS (BRIEF_DISCOVER_LOOSE_ENDS §S2). The sheet is the rail's "see all"
     destination, so a round cannot carry a heart there and none here. ONE batched
     read for the whole list, keyed on the same whs_score ids the rows already
     hold, exactly as FriendsPlayedRail does — which is also why a tap here moves
     the rail behind the sheet: the hook patches every cache window holding the id. */
  const reactionTargets = useMemo<ReactionTarget[]>(
    () =>
      scoreIds
        .filter((id): id is string => !!id)
        .map((id) => ({ type: 'round' as const, id })),
    [scoreIds],
  );
  /* ONE post-id resolution for the whole sheet (§S1.5). */
  const roundPosts = useRoundPostComments(scoreIds);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const reactions = useContentReactions(reactionTargets, {
    postIdFor: (id) => roundPosts.infoFor(id)?.postId ?? null,
  });

  const days = useMemo(() => {
    const map = new Map<string, CircleRoundRow[]>();
    for (const r of rounds) {
      const key = String(r.play_date ?? '').slice(0, 10);
      const list = map.get(key);
      if (list) list.push(r);
      else map.set(key, [r]);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0));
  }, [rounds]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="golf-this-week-title"
      variant="dark"
      surfaceColor={A.CANVAS}
      style={{
        height: 'auto',
        maxHeight: '85dvh',
        display: 'flex',
        flexDirection: 'column',
        background: A.CANVAS,
      }}
    >
      <div
        style={{
          padding: '10px 16px 12px',
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <div
          style={{
            fontSize: 19,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: A.INK,
            lineHeight: 1.05,
          }}
          id="golf-this-week-title"
        >
          {t('discover.golfThisWeek.heading', 'Recent rounds')}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 12 }}>
          {[
            { figure: total, label: t('discover.golfThisWeek.board.railRounds', 'ROUNDS') },
            { figure: courseTotal, label: t('discover.golfThisWeek.board.railCourses', 'COURSES') },
            { figure: GOLF_WEEK_DAYS, label: t('discover.golfThisWeek.board.railDays', 'DAYS') },
          ].map((pair) => (
            <div key={pair.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                className="tabular-nums"
                style={{ ...FIGS, color: A.INK, fontSize: 13.5, fontWeight: 700, lineHeight: 1 }}
              >
                {pair.figure}
              </span>
              <span
                style={{
                  color: A.DIM,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  lineHeight: 1,
                }}
              >
                {pair.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* THE LENS CARRIES THROUGH (§5.2). Wrapper keeps the pill row flush to
          the sheet edges and prevents the first pill being clipped by a
          non-stretching flex item. */}
      <div
        style={{
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <WeekScopePills
          scope={scope}
          onChange={(s) => onScopeChange?.(s)}
          userId={userId}
          style={{ padding: '12px 16px', width: '100%', boxSizing: 'border-box' }}
        />
      </div>


      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: A.CANVAS,
        }}
      >
        {days.map(([key, list], dayIdx) => (
          <div key={key || `day-${dayIdx}`}>
            <div
              data-round-day-header="true"
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 16px 7px',
                background: A.CANVAS,
                borderBottom: `1px solid ${A.BORDER}`,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ color: A.MUTE }}>
                {key ? relativeDay(key, t as never, 'long') : ''}
              </span>
              <span className="tabular-nums" style={{ color: A.MUTE }}>
                {list.length}{' '}
                {list.length === 1
                  ? t('discover.friendsRounds.entrySingular', 'ROUND')
                  : t('discover.friendsRounds.entryPlural', 'ROUNDS')}
              </span>
            </div>

            {list.map((r, i) => (
              <CompactRoundRow
                key={r.round_id}
                row={r}
                reason={insights.get(r.round_id)?.text ?? referenceLine(r, t)}
                shape={holeShapes?.get(r.score_id ?? '') ?? null}
                reaction={{
                  ...reactions.stateFor('round', r.score_id),
                  hidden: !r.score_id || !reactions.viewerId || reactions.unavailable,
                  readOnly: !!reactions.viewerId && r.user_id === reactions.viewerId,
                  label: t('discover.reactions.action', 'Like this round'),
                  onToggle: () => reactions.toggle('round', r.score_id),
                }}
                comment={(() => {
                  const info = roundPosts.infoFor(r.score_id);
                  if (!info) return null;
                  return {
                    count: info.commentCount,
                    label: t('discover.comments.action', 'Comment on this round'),
                    onOpen: () => setCommentsPostId(info.postId),
                  };
                })()}
                isLast={i === list.length - 1}
                onPress={() => onRowPress(r.score_id, r.user_id)}
              />
            ))}
          </div>
        ))}
      </div>

      {commentsPostId && (
        <CommentsSheetV2
          isOpen
          onClose={() => setCommentsPostId(null)}
          targetType="post"
          targetId={commentsPostId}
        />
      )}
    </BottomSheet>
  );
}

export default GolfThisWeekSheet;
