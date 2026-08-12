import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFriendsLatestRounds, type FriendRoundRow } from '@/hooks/gam/useFriendsLatestRounds';
import {
  IndexMovement,
  toParFor,
  buildInsightMap,
  InsightGlyph,
  INSIGHT_FONT_SIZE,
  INSIGHT_LINE_HEIGHT,
  INSIGHT_TWO_LINE_RESERVE,
  INSIGHT_CLAMP,
} from '../friendRoundParts';
import { CourseImageFallback } from './CourseImageFallback';
import { relativeDay } from './discoverWhen';

import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { useContentReactions, type ReactionTarget } from './hooks/useContentReactions';
import { ReactionAction, ReactionSlot } from './ReactionAction';
import { countNewSince, isNewSince, useReportNewCount } from './newSince';
import { FriendsRail as FriendsRailShell } from './DiscoverCourseLedSkeleton';

import {
  A,
  FIGS,
  CARD_SHELL,
  Eyebrow,
  NEW_CARD_RING,
  ImageChip,
  InkAction,
  NUMF,
  SANS,
  
} from './tokens';

/**
 * Section 1 — WHERE YOUR FRIENDS PLAYED (BRIEF, section 1).
 *
 * A horizontal rail: a week of heavy play grows sideways, never down. One card
 * per friend-round, newest first, capped at ten. The card is the course; the
 * body row carries the friend, the canonical feat chips and the gross.
 *
 * A hole in one puts the GOLD ring on the when-chip — the only gold on the card.
 * No friends or no rounds: the section does not render at all.
 */

const RAIL_CAP = 10;

/** Rail scrim — SCRIM_SOFT's hue, stop pulled in for the shorter 88px photo. */
const RAIL_SCRIM =
  'linear-gradient(0deg, rgba(10,14,10,0.57) 0%, rgba(10,14,10,0) 55%)';


interface Props {
  userId: string | undefined;
  /** Last-seen stamp for the new-since markers; null marks nothing. */
  lastSeen?: number | null;
  onCardPress: (row: FriendRoundRow) => void;
  onSeeAll: () => void;
}

/* relativeDay now lives in ./discoverWhen so the one-thing row reads the same
   wording for the same age. Behaviour here is unchanged ('short' weekday). */


export function FriendsPlayedRail({ userId, lastSeen = null, onCardPress, onSeeAll }: Props) {
  const { t } = useTranslation('courses');
  const roundsQuery = useFriendsLatestRounds(userId, {
    limit: RAIL_CAP,
    allowMultiplePerFriend: true,
  });
  const rounds = roundsQuery.data;

  const rows = useMemo(() => (rounds ?? []).slice(0, RAIL_CAP), [rounds]);
  const courseIds = useMemo(
    () => rows.map((r) => r.course_id).filter((v): v is string => !!v),
    [rows],
  );
  const metaQuery = useCourseCardMeta(courseIds);
  const meta = metaQuery.data;

  // UNRESOLVED IS NOT ABSENT (BRIEF_DISCOVER_LOADING_STATES).
  // The rounds query is DISABLED without a userId — signed out is SETTLED-EMPTY,
  // never pending, so nobody stares at a shell forever. The meta query is
  // disabled on an empty id list, which is likewise settled.
  const roundsPending = !!userId && roundsQuery.isPending;
  const metaPending = courseIds.length > 0 && metaQuery.isPending;
  const pending = roundsPending || metaPending;

  // REACTIONS (BRIEF_DISCOVER_REACTIONS): one read for the whole rail, keyed by
  // the round's whs_score id. A round with no score id carries no control.
  const reactionTargets = useMemo<ReactionTarget[]>(
    () =>
      rows
        .filter((r) => !!r.score_id)
        .map((r) => ({ type: 'round' as const, id: r.score_id as string })),
    [rows],
  );
  const reactions = useContentReactions(reactionTargets);

  // THE INSIGHT SET (BRIEF_FRIENDS_INSIGHT_SET): resolved for the rail as a
  // whole, not per card, so the repetition cap can see its neighbours.
  const insights = useMemo(() => buildInsightMap(rows, t as never), [rows, t]);



  // NEW SINCE: the rail already orders by play_date, so play_date is the
  // arrival stamp this section compares. Not computed before settle — a ring
  // on a skeleton is meaningless.
  const newCount = pending ? 0 : countNewSince(rows, (r) => r.play_date, lastSeen);
  useReportNewCount('friends', newCount);

  if (pending) return <FriendsRailShell />;
  if (rows.length === 0) return null;


  return (
    <section>
      <Eyebrow
        dot={newCount > 0}
        aside={<InkAction onClick={onSeeAll}>{t('discover.seeAll', 'See all')}</InkAction>}
      >
        {t('discover.friendsPlayed', 'Where your friends played')}
      </Eyebrow>

      <div
        className="scrollbar-hide"
        style={{ display: 'flex', alignItems: 'stretch', gap: 10, overflowX: 'auto' }}
      >
        {rows.map((r) => {
          const m = r.course_id ? meta?.get(r.course_id) : undefined;
          const hasAce = r.feats.some((f) => f.key === 'holes_in_one');
          const isNew = isNewSince(r.play_date, lastSeen);
          return (
            <button
              key={r.round_id}
              type="button"
              onClick={() => onCardPress(r)}
              style={{
                ...CARD_SHELL,
                ...(isNew ? NEW_CARD_RING : null),
                width: 224,
                flexShrink: 0,
                // THE PHOTO STARTS AT THE TOP OF EVERY CARD
                // (BRIEF_FRIENDS_CARD_HEIGHT_AND_ROW). A stretched button
                // centres its content by default, which pushed a white band
                // above the photo on the shorter cards.
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                padding: 0,
                textAlign: 'left',
                fontFamily: SANS,
                cursor: 'pointer',
              }}
            >
              <CourseImageFallback
                courseId={r.course_id}
                courseName={m?.name ?? r.course_name}
                imageUrl={m?.imageUrl}
                style={{ height: 88, flexShrink: 0 }}
              >
                {/* A SHORTER PHOTO NEEDS A SHORTER SCRIM, or the course name
                    sits in a band of darkness. Same hue, stop pulled in. */}
                <div style={{ position: 'absolute', inset: 0, background: RAIL_SCRIM }} />

                <ImageChip gold={hasAce}>{relativeDay(r.play_date, t)}</ImageChip>
                <div
                  style={{
                    position: 'absolute',
                    left: 10,
                    right: 10,
                    bottom: 7,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '-0.015em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m?.name ?? r.course_name ?? t('discover.unknownCourse', 'Course')}
                  </span>
                </div>
              </CourseImageFallback>


              {(() => {
                const toPar = toParFor(r);
                const insight = insights.get(r.round_id)?.text ?? null;
                return (
                  <div style={{ padding: '9px 11px 10px' }}>
                    {/* LINE 1 — the gross with its reference point. */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ ...NUMF, fontSize: 27, letterSpacing: '-0.035em', color: A.INK, lineHeight: 0.92 }}>
                        {r.gross ?? '\u2014'}
                      </span>
                      {toPar && (
                        <span style={{ ...NUMF, fontSize: 14, letterSpacing: '-0.02em', color: toPar.tone, lineHeight: 1 }}>
                          {toPar.text}
                        </span>
                      )}
                      {r.course_par != null && (
                        <span
                          style={{
                            fontSize: 6.5,

                            fontWeight: 700,
                            letterSpacing: '0.13em',
                            textTransform: 'uppercase',
                            color: A.DIM,
                          }}
                        >
                          {t('discover.friendsRail.par', { defaultValue: 'Par {{par}}', par: r.course_par })}
                        </span>
                      )}
                      {/* THE INDEX MOVEMENT SITS WITH THE FIGURES, not on the
                          name row: it is a number about the round, so it holds
                          the right edge of the score line. */}
                      <span style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        <IndexMovement row={r} />
                      </span>
                    </div>

                    {/* LINE 2 — who played it, how their index moved, and the
                        reaction. The heart lives on the NAME ROW now: it is an
                        act aimed at a person, so it sits beside the person, and
                        the card loses a whole row of height. The slot is still
                        reserved on every card so the row's right edge is
                        identical whether or not a control renders. */}
                    <div
                      style={{
                        marginTop: 7,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: A.BODY,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.display_name}
                      </span>
                      <span
                        style={{
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <ReactionSlot>
                          {(() => {
                            const st = reactions.stateFor('round', r.score_id);
                            return (
                              <ReactionAction
                                hidden={!r.score_id || !reactions.viewerId || reactions.unavailable}
                                readOnly={!!reactions.viewerId && r.user_id === reactions.viewerId}
                                count={st.count}
                                reacted={st.mine}
                                onToggle={() => reactions.toggle('round', r.score_id)}
                                label={t('discover.reactions.action', 'Like this round')}
                              />
                            );
                          })()}
                        </ReactionSlot>
                      </span>
                    </div>

                    {/* LINE 3 — the insight. TWO LINES OF HEIGHT ARE RESERVED
                        ON EVERY CARD, including cards with no insight at all,
                        so the rail holds one height and every photo sits at the
                        same y. A one-line insight sits at the TOP of the box. */}
                    {/* NO RULE INSIDE THE CARD — separation is a panel edge or
                        whitespace, never a hairline drawn inside a panel. */}
                    <div
                      style={{
                        marginTop: 12,
                        minHeight: INSIGHT_TWO_LINE_RESERVE,
                      }}

                    >
                      {insight && (
                        <div
                          style={{
                            ...FIGS,
                            fontSize: INSIGHT_FONT_SIZE,
                            lineHeight: INSIGHT_LINE_HEIGHT,
                            fontWeight: 600,
                            color: A.MUTE,
                            ...INSIGHT_CLAMP,
                          }}
                        >
                          <span style={{ display: 'inline' }}>
                            <InsightGlyph />
                            {insight}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}

            </button>
          );
        })}
      </div>
    </section>
  );
}

export default FriendsPlayedRail;
