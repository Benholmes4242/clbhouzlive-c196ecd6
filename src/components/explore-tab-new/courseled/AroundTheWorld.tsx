import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { reviewLabelColor } from '@/components/shared/ReviewGhostScore';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useScorecardOpener } from '../useScorecardOpener';

import { ACTION_DEFAULTS, UNIT_DEFAULTS, type WireEvent } from '../hooks/useDiscoverWire';
import { CourseImageFallback } from './CourseImageFallback';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { AroundTheWorldCard as AroundTheWorldCardShell } from './DiscoverCourseLedSkeleton';
import { useCourseLatestRatings } from './hooks/useCourseLatestRatings';
import { useContentReactions, type ReactionTarget } from './hooks/useContentReactions';
import { ReactionAction, ReactionSlot } from './ReactionAction';

import { CourseNewsSheet, type CourseNewsEntry } from './CourseNewsSheet';
import { ShortlistGlassAction } from './ShortlistGlassAction';

import { countNewSince, isNewSince, useReportNewCount } from './newSince';
import { A, CARD_SHELL, Eyebrow, ImageChip, InkAction, LABEL, NEW_CARD_RING, NEW_ROW_BAR, NUMF, SANS, SCRIM_STRONG } from './tokens';

/**
 * Section 2 — AROUND THE WORLD (BRIEF, section 2).
 *
 * The main feed and the only vertical one. Events are GROUPED BY COURSE: the
 * card is the course, the lines beneath are what happened there, newest first.
 * Five courses, then "Show N more courses" reveals the rest in place.
 *
 * NAMING: every actor is named — the "a member" anonymity rule is retired. The
 * viewing member's own name renders in amber; everyone else in ink. Rows carry
 * NO badges: the detail line carries the feat wording instead.
 */

/** Deep gold: 8px bright gold fails contrast on a light wash. */
const GOLD_TEXT = '#A87718';

const PAGE = 4;

interface CourseGroup {
  courseId: string;
  courseName: string | null;
  courseImage: string | null;
  at: string;
  events: WireEvent[];
}

interface Props {
  events: WireEvent[];
  /**
   * TRUE while the wire read has NOT SETTLED (isPending, not isLoading — a
   * background refetch must never blank a populated section).
   */
  isPending: boolean;
  userId: string | undefined;
  scopeKey: string;
  pills: React.ReactNode;
  onCoursePress: (courseId: string) => void;
  onExpand?: (revealed: number) => void;
  /** Human lens label for the sheet caption ('For you', 'Worldwide'). */
  lensLabel?: string;
  /** Copy for the current lens when its set is empty. */
  emptyCopy?: string;
  /**
   * Relevance rank of a course for the active lens (0 = strongest signal).
   * When supplied it wins over recency for group order.
   */
  priorityFor?: (courseId: string) => number;
  /** Shortlist controls (BRIEF_DISCOVER_RELEVANCE part B). */
  canShortlist?: (courseId: string) => boolean;
  isShortlisted?: (courseId: string) => boolean;
  onToggleShortlist?: (courseId: string) => void;
  /** Last-seen stamp for the new-since markers; null marks nothing. */
  lastSeen?: number | null;
}


function relativeWhen(iso: string, t: (k: string, o?: any) => string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return t('discover.when.today', 'Today');
  if (days === 1) return t('discover.when.yesterday', 'Yesterday');
  if (days < 7) return t('discover.when.daysAgo', { defaultValue: '{{count}} days ago', count: days });
  if (days < 14) return t('discover.when.lastWeek', 'Last week');
  if (days < 60)
    return t('discover.when.weeksAgo', { defaultValue: '{{count}}w ago', count: Math.floor(days / 7) });
  return t('discover.when.monthsAgo', {
    defaultValue: '{{count}}mo ago',
    count: Math.max(1, Math.round(days / 30)),
  });
}

export function AroundTheWorld({
  events,
  isPending,
  userId,
  scopeKey,
  pills,
  onCoursePress,
  onExpand,
  lensLabel,
  emptyCopy,
  priorityFor,
  canShortlist,
  isShortlisted,
  onToggleShortlist,
  lastSeen = null,
}: Props) {
  const { t } = useTranslation('courses');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const opener = useScorecardOpener();
  const openReview = useReviewSheetStore((st) => st.open);

  const groups = useMemo<CourseGroup[]>(() => {
    const byCourse = new Map<string, CourseGroup>();
    for (const e of events) {
      if (!e.courseId) continue;
      const g = byCourse.get(e.courseId);
      if (g) {
        if (g.events.length < 3) g.events.push(e);
        if (e.at > g.at) g.at = e.at;
      } else {
        byCourse.set(e.courseId, {
          courseId: e.courseId,
          courseName: e.courseName,
          courseImage: e.courseImage,
          at: e.at,
          events: [e],
        });
      }
    }
    // Relevance first when the lens supplies a rank, recency as the tie-break.
    return [...byCourse.values()].sort((a, b) => {
      if (priorityFor) {
        const d = priorityFor(a.courseId) - priorityFor(b.courseId);
        if (d !== 0) return d;
      }
      return a.at < b.at ? 1 : -1;
    });
  }, [events, priorityFor]);


  // NEW SINCE: the event stamp the section already sorts by (play_date today;
  // an arrival stamp would be inherited automatically). A group is new when any
  // of its events is.
  const newGroupCount = countNewSince(groups, (g) => g.at, lastSeen);
  useReportNewCount('world', newGroupCount);

  const shown = groups.slice(0, PAGE);
  const courseIds = useMemo(() => shown.map((g) => g.courseId), [shown]);
  const metaQuery = useCourseCardMeta(courseIds);
  const meta = metaQuery.data;
  const { data: ratings } = useCourseLatestRatings(courseIds);

  // REACTIONS (BRIEF_DISCOVER_REACTIONS): ONE read for the visible cards. Feat
  // rows react as 'round' on their score id; ANY rating row with a reviewId
  // carries a control — a score with no prose is still likeable (the trigger
  // wording says "liked your rating" in that case). Only a rating with no
  // reviewId at all has nothing to target.
  const reactionTargets = useMemo<ReactionTarget[]>(() => {
    const out: ReactionTarget[] = [];
    for (const g of shown) {
      for (const e of g.events) if (e.scoreId) out.push({ type: 'round', id: e.scoreId });
      const rating = ratings?.get(g.courseId);
      if (rating?.reviewId) out.push({ type: 'review', id: rating.reviewId });
    }
    return out;
  }, [shown, ratings]);
  const reactions = useContentReactions(reactionTargets);


  /** Notability of a course's headline feat — drives the sheet's order. */
  const notability = (e: WireEvent): number => {
    if (e.kind === 'ace' || e.kind === 'albatross') return 0;
    if (e.kind === 'crown') return 1;
    if (e.kind === 'eagle') return 2;
    if (e.kind === 'birdie_haul') return 3;
    return 4;
  };

  /** Tier colour for the right-hand figure (BRIEF: green / ink / gold). */
  const toneFor = (kind: WireEvent['kind'] | 'rating'): string => {
    if (kind === 'ace' || kind === 'albatross') return GOLD_TEXT;
    if (kind === 'crown') return A.GREEN;
    return A.INK;
  };

  /**
   * Actor name. NEVER falls back to "You" — a missing name returns '' and the
   * row renders the feat wording alone (see the row renderer). Attribution is
   * only ever "You" when the payload carries a user_id that strictly equals
   * the signed-in member's id.
   */
  const nameFor = (e: WireEvent): string => e.actorName?.trim() ?? '';

  /**
   * The detail line carries the feat wording — there are no badges here.
   * `compact` returns the shortened form the news sheet cards use (2-line
   * clamp). Ordinals arrive already formatted on the payload; nothing is
   * concatenated inside a locale string, and missing hole/par degrades to the
   * short form rather than printing an empty bracket.
   */
  const detailFor = (e: WireEvent, compact = false): string => {
    const hole = e.actionParams?.hole ? String(e.actionParams.hole) : '';
    const par = e.holePar;

    if (e.kind === 'ace' || e.kind === 'albatross') {
      const isAce = e.kind === 'ace';
      if (!hole)
        return isAce
          ? t('discover.row.aceNoHole', 'Hole in one')
          : t('discover.row.albatrossNoHole', 'Albatross');
      if (compact)
        return t(isAce ? 'discover.row.compactAce' : 'discover.row.compactAlbatross', {
          defaultValue: isAce ? 'Hole in one - {{hole}}' : 'Albatross - {{hole}}',
          hole,
        });
      if (par == null)
        return isAce
          ? t('discover.row.aceNoHole', 'Hole in one')
          : t('discover.row.albatrossNoHole', 'Albatross');
      return t(isAce ? 'discover.row.ace' : 'discover.row.albatross', {
        defaultValue: isAce
          ? 'Hole in one - the {{hole}}, par {{par}}'
          : 'Albatross - the {{hole}}, par {{par}}',
        hole,
        par,
      });
    }

    if (e.kind === 'eagle') {
      if (!hole) return t('discover.row.eagleNoHole', 'Eagle');
      if (compact)
        return t('discover.row.compactEagle', { defaultValue: 'Eagle - {{hole}}', hole });
      if (par == null) return t('discover.row.eagle', 'Eagle');
      return t('discover.row.eaglePar', {
        defaultValue: 'Eagle - {{hole}} hole, par {{par}}',
        hole,
        par,
      });
    }

    if (e.kind === 'birdie_haul') {
      const count = Number(e.actionParams?.count ?? 0);
      return compact
        ? t('discover.row.compactBirdieHaul', { defaultValue: 'Birdie haul - {{count}}', count })
        : t('discover.row.birdieHaul', {
            defaultValue: 'Birdie haul - {{count}} in a round',
            count,
          });
    }

    if (e.kind === 'crown') {
      const slug = String(e.actionParams?.categorySlug ?? '');
      if (!slug || slug === 'lowest_gross')
        return t('discover.row.crownCourseRecord', 'New course record');
      const category = String(e.actionParams?.category ?? slug.replace(/_/g, ' ')).toLowerCase();
      return t('discover.row.crown', {
        defaultValue: 'New {{category}} record',
        category,
      });
    }

    return t(e.actionKey, {
      defaultValue: ACTION_DEFAULTS[e.actionKey] ?? '',
      ...(e.actionParams ?? {}),
    });
  };


  const figLabelFor = (e: WireEvent): string => {
    if (e.figureSubKey)
      return t(e.figureSubKey, {
        defaultValue: UNIT_DEFAULTS[e.figureSubKey] ?? '',
        ...(e.figureSubParams ?? {}),
      }).toUpperCase();
    return t('discover.row.labelScore', 'SCORE');
  };

  /** Complete list for the sheet, notability first, newest as the tie-break. */
  const newsEntries = useMemo<CourseNewsEntry[]>(() => {
    return groups
      .map((g) => {
        const top = [...g.events].sort(
          (a, b) => notability(a) - notability(b) || (a.at < b.at ? 1 : -1),
        )[0];
        const actor =
          top && userId && top.userId && top.userId === userId
            ? t('discover.wire.you', 'You')
            : (top?.actorName?.trim() ?? '');
        const feat = top ? detailFor(top, true) : '';
        const rating = ratings?.get(g.courseId);
        const useRating = !top?.figure && !!rating;

        let figure: string | null = null;
        let figureUnit: string | null = null;
        let onPress: (() => void) | undefined;

        if (useRating && rating) {
          figure = rating.rating.toFixed(1);
          figureUnit = t('discover.row.labelRating', 'RATING');
          if (rating.reviewId) {
            onPress = () => {
              analyticsEvents.track('discover_world_row_tap', { kind: 'rating' });
              openReview({
                user: {
                  id: rating.userId ?? '',
                  name: rating.actorName?.trim() || '',
                  avatar: rating.actorAvatar ?? undefined,
                },
                courseId: g.courseId,
                courseName: g.courseName ?? '',
                rating: rating.rating,
                reviewId: rating.reviewId,
                reviewText: rating.reviewText,
              });
            };
          }
        } else if (top) {
          figure = top.figure ?? null;
          figureUnit = top.figure ? figLabelFor(top) : null;
          if (top.scoreId) {
            const scoreId = top.scoreId;
            const ownerId = top.userId;
            onPress = () => {
              analyticsEvents.track('discover_world_row_tap', { kind: 'feat' });
              opener.openByScore(scoreId, null, ownerId);
            };
          }
        }

        const ratingLine =
          useRating && rating
            ? `${
                userId && rating.userId && rating.userId === userId
                  ? t('discover.wire.you', 'You')
                  : (rating.actorName?.trim() ?? '')
              }`
            : '';

        const line = useRating
          ? ratingLine
            ? `${ratingLine} \u00B7 ${t('discover.row.rated', 'Rated this course')}`
            : t('discover.row.rated', 'Rated this course')
          : actor
            ? `${actor} \u00B7 ${feat}`
            : feat;

        return {
          courseId: g.courseId,
          courseName: g.courseName,
          courseImage: g.courseImage,
          at: g.at,
          topLine: line,
          figure,
          figureUnit,
          onPress,
          rank: top ? notability(top) : 5,
        };
      })
      .sort((a, b) => {
        if (priorityFor) {
          const d = priorityFor(a.courseId) - priorityFor(b.courseId);
          if (d !== 0) return d;
        }
        return a.rank - b.rank || (a.at < b.at ? 1 : -1);
      })
      .map(({ rank: _rank, ...rest }) => rest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, ratings, userId, t, priorityFor]);



  // WHOLE-CARD HOLD (layer 2a): course meta feeds each card's NAME and IMAGE,
  // so a card cannot be drawn from the wire rows alone without rewriting itself
  // a moment later. The shared shell holds the slot; the pills stay live so the
  // lens row never disappears under the reader's thumb.
  if (isPending || (courseIds.length > 0 && metaQuery.isPending)) {
    return <AroundTheWorldCardShell pills={pills} />;
  }

  return (
    <>
    <section>
      <Eyebrow
        dot={newGroupCount > 0}
        aside={<span style={LABEL}>{t('discover.last90', 'Last 90 days')}</span>}
      >
        {t('discover.aroundTheWorld', 'Around the world')}
      </Eyebrow>

      {pills}

      {groups.length === 0 ? (
        <div style={{ ...CARD_SHELL, padding: '18px 16px' }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45, color: A.MUTE }}>
            {emptyCopy ??
              t('discover.emptyPool', 'Nothing logged anywhere in the last 90 days.')}
          </p>

        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shown.map((g) => {
            const m = meta?.get(g.courseId);
            const rating = ratings?.get(g.courseId);
            const rows: Array<{
              key: string;
              name: string;
              isOwn: boolean;
              avatar: string | null;
              userId: string | null;
              detail: string;
              fig: string | null;
              figLabel: string;
              tone: string;
              isNew: boolean;
              onPress?: () => void;
              reactTo?: { type: 'round' | 'review'; id: string };
            }> = g.events.map((e) => ({
              key: e.id,
              isNew: isNewSince(e.at, lastSeen),
              name: nameFor(e),
              isOwn: !!userId && !!e.userId && e.userId === userId,
              avatar: e.actorAvatar,
              userId: e.userId,
              detail: detailFor(e),
              fig: e.figure ?? null,
              figLabel: figLabelFor(e),
              tone: toneFor(e.kind),
              reactTo: e.scoreId ? { type: 'round', id: e.scoreId } : undefined,
              onPress: e.scoreId
                ? () => {
                    analyticsEvents.track('discover_world_row_tap', { kind: 'feat' });
                    opener.openByScore(e.scoreId, null, e.userId);
                  }
                : undefined,
            }));

            if (rating) {
              rows.push({
                key: `rating:${g.courseId}`,
                isNew: false,
                name: rating.actorName?.trim() ?? '',
                isOwn: !!userId && !!rating.userId && rating.userId === userId,
                avatar: rating.actorAvatar,
                userId: rating.userId,
                detail: t('discover.row.rated', 'Rated this course'),
                fig: rating.rating.toFixed(1),
                figLabel: t('discover.row.labelRating', 'RATING'),
                tone: reviewLabelColor(rating.rating, 'light'),
                reactTo:
                  // LIKEABLE whenever there is a review row to target, prose or
                  // not. Deliberately BROADER than the tap rule below.
                  rating.reviewId ? { type: 'review', id: rating.reviewId } : undefined,

                // TAP opens the sheet ONLY when there is prose to read. A
                // score-only rating is inert to tap while still being likeable
                // — that asymmetry is intentional, not a bug to "fix".
                onPress:
                  rating.reviewId && (rating.reviewText ?? '').trim()
                  ? () => {
                      analyticsEvents.track('discover_world_row_tap', { kind: 'rating' });
                      openReview({
                        user: {
                          id: rating.userId ?? '',
                          name: rating.actorName?.trim() || '',
                          avatar: rating.actorAvatar ?? undefined,
                        },
                        courseId: g.courseId,
                        courseName: m?.name ?? g.courseName ?? '',
                        rating: rating.rating,
                        reviewId: rating.reviewId,
                        reviewText: rating.reviewText,
                      });
                    }
                  : undefined,
              });
            }

            const showShortlist = !!onToggleShortlist && !!canShortlist?.(g.courseId);

            return (
              <button
                key={g.courseId}
                type="button"
                onClick={() => onCoursePress(g.courseId)}
                style={{
                  ...CARD_SHELL,
                  ...(isNewSince(g.at, lastSeen) ? NEW_CARD_RING : null),
                  padding: 0,
                  textAlign: 'left',
                  fontFamily: SANS,
                  cursor: 'pointer',
                }}
              >
                <CourseImageFallback
                  courseId={g.courseId}
                  courseName={m?.name ?? g.courseName}
                  imageUrl={m?.imageUrl ?? g.courseImage}
                  initialsSize={30}
                  style={{ height: 128 }}
                >
                  <div style={{ position: 'absolute', inset: 0, background: SCRIM_STRONG }} />
                  <ImageChip>{relativeWhen(g.at, t)}</ImageChip>
                  {showShortlist && (
                    <ShortlistGlassAction
                      shortlisted={!!isShortlisted?.(g.courseId)}
                      onToggle={() => onToggleShortlist?.(g.courseId)}
                      label={t('discover.shortlist.action', 'Add to your list')}
                    />
                  )}
                  {/* Name keeps clear of the bottom-right glass action at 320dp. */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 14,
                      right: showShortlist ? 46 : 14,
                      bottom: 10,
                    }}
                  >

                    <div
                      style={{
                        fontSize: 16.5,
                        fontWeight: 800,
                        color: '#fff',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {m?.name ?? g.courseName ?? t('discover.unknownCourse', 'Course')}
                    </div>
                    {m?.region && (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.78)',
                          marginTop: 2,
                        }}
                      >
                        {m.region}
                      </div>
                    )}
                  </div>
                </CourseImageFallback>

                <div style={{ padding: '3px 16px 5px' }}>
                  {rows.map((r, i) => (
                    <div
                      key={r.key}
                      role={r.onPress ? 'button' : undefined}
                      tabIndex={r.onPress ? 0 : undefined}
                      onClick={
                        r.onPress
                          ? (ev) => {
                              ev.stopPropagation();
                              r.onPress?.();
                            }
                          : undefined
                      }
                      onPointerDown={r.onPress ? () => setPressed(r.key) : undefined}
                      onPointerUp={r.onPress ? () => setPressed(null) : undefined}
                      onPointerLeave={r.onPress ? () => setPressed(null) : undefined}
                      onPointerCancel={r.onPress ? () => setPressed(null) : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 0',
                        borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${A.BORDER}`,
                        cursor: r.onPress ? 'pointer' : 'default',
                        opacity: r.onPress && pressed === r.key ? 0.62 : 1,
                        transition: 'opacity 120ms ease',
                      }}
                    >
                      {r.isNew && <span aria-hidden style={NEW_ROW_BAR} />}
                      <SquircleAvatar
                        size={30}
                        src={r.avatar}
                        alt={r.name}
                        userId={r.userId}
                        hairlineRing
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {r.name ? (
                          <>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: '-0.005em',
                                color: r.isOwn ? A.AMBER_DEEP : A.INK,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {r.isOwn ? t('discover.wire.you', 'You') : r.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                lineHeight: 1.35,
                                color: A.BODY,
                                marginTop: 1.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {r.detail}
                            </div>
                          </>
                        ) : (
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              letterSpacing: '-0.005em',
                              color: A.INK,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {r.detail}
                          </div>
                        )}
                      </div>
                      {/* FIGURE BLOCK — fixed min-width so 72 / 6 / 8.9 all sit
                          on one axis regardless of digit count. */}
                      {r.fig && (
                        <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 46 }}>
                          <div style={{ ...NUMF, fontSize: 17, color: r.tone, lineHeight: 1.05 }}>
                            {r.fig}
                          </div>
                          <div
                            style={{
                              fontSize: 8,
                              fontWeight: 800,
                              letterSpacing: '0.13em',
                              textTransform: 'uppercase',
                              color: A.DIM,
                              marginTop: 2,
                            }}
                          >
                            {r.figLabel}
                          </div>
                        </div>
                      )}
                      {/* TRAILING SLOT — reserved on EVERY row, control or not. */}
                      <ReactionSlot>
                        {r.reactTo
                          ? (() => {
                              const st = reactions.stateFor(r.reactTo.type, r.reactTo.id);
                              return (
                                <ReactionAction
                                  hidden={!reactions.viewerId || reactions.unavailable}
                                  readOnly={r.isOwn}
                                  count={st.count}
                                  reacted={st.mine}
                                  onToggle={() =>
                                    reactions.toggle(r.reactTo!.type, r.reactTo!.id)
                                  }
                                  label={
                                    r.reactTo.type === 'round'
                                      ? t('discover.reactions.action', 'Like this round')
                                      : t('discover.reactions.actionReview', 'Like this review')
                                  }
                                />
                              );
                            })()
                          : null}
                      </ReactionSlot>

                    </div>
                  ))}
                </div>
              </button>
            );
          })}

          {groups.length > PAGE && (
            <div style={{ textAlign: 'center', paddingTop: 4 }}>
              <InkAction
                onClick={() => {
                  analyticsEvents.track('discover_world_sheet_open', {
                    courses: groups.length,
                  });
                  setSheetOpen(true);
                  onExpand?.(groups.length - PAGE);
                }}
              >
                {t('discover.seeAllCourses', {
                  defaultValue: 'See all {{count}} courses',
                  count: groups.length,
                })}
              </InkAction>
            </div>
          )}
        </div>
      )}
    </section>

      <CourseNewsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        entries={newsEntries}
        lensLabel={lensLabel ?? t('discover.lens.worldwide', 'Worldwide')}
        whenLabel={(iso) => relativeWhen(iso, t)}
        onCoursePress={onCoursePress}
        canShortlist={canShortlist}
        isShortlisted={isShortlisted}
        onToggleShortlist={onToggleShortlist}

      />

      <RoundDetailSheet
        open={!!opener.target}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </>
  );
}

export default AroundTheWorld;
