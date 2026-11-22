/** One slab, three states. The visit is owned by Clubhouse so virtualization
 * cannot rotate its tournament or repeat shown analytics. Post controls and
 * counters use the existing post path; failed upsert hides only those doors. */
import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { writeStoredTour } from '@/features/tourhub/hooks/useTourSelection';
import { useBatchCourseImages } from '@/features/tourhub/hooks/useBatchCourseImages';
import { COURSE_GRADIENT } from '@/features/tourhub/components/overview-v3/HybridHero.constants';
import { roundsFromSchedule } from '@/features/tourhub/components/overview-v3/HybridHero.utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';
import { scheduleTag, formatPurseShort } from '@/features/tourhub/schedule-v2/scheduleRules';
import { getContextLabel } from '@/features/tourhub/utils/tournamentClassification';
import { stripEventSponsorClause } from '@/features/tourhub/_shared/eventName';
import { surnameOf } from '@/features/tourhub/_shared/playerName';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import { formatOverviewDateRange } from '@/features/tourhub/components/overview-v3/HybridHero';
import { FeedPostActions, FeedAddComment } from '@/components/feed/FeedPostControls';
import { LikedByRow } from '@/components/likes/LikedByRow';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { gateGuestActionNow } from '@/features/guest/useGuestActionGate';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { FeedPost } from '@/components/media-system/types/media';
import type { CommentOpenSource } from '@/types/commentOpenSource';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { useTourSlotData, type TourSlotVisit } from './useTourSlotData';
import { TOUR_DISPLAY, type SlotSelection } from './tourSlotRules';
import { SlotBoard, SlotLastYearBoard, slotBoardRows } from './SlotBoard';
import { FEED_CARD_SURFACE } from '@/lib/tokens/surfaces';
import { slotLead, slotPlayedRound, slotPlayerName, slotPositionedRows } from './slotLeadRules';
import './tourSlot.css';

/** Feed presentation only: loaded board/schedule in, no new reads. Design B's
 * local grid and round bar never alter the shared hero board or RoundSpine. */
export interface TourSlotViewProps { selection: SlotSelection; board: BoardEntry[]; image: string | null; lastYear?: React.ReactNode; actions?: React.ReactNode; comment?: React.ReactNode; onOpen: () => void }

export function TourSlotView({ selection, board, image, lastYear, actions, comment, onOpen }: TourSlotViewProps) {
  const { t } = useTranslation('tourhub');
  const { tournament: event, tour, state } = selection;
  const rows = slotPositionedRows(board);
  const leaderName = surnameOf(rows[0] ? slotPlayerName(rows[0]) : '');
  const round = event.current_round ?? 1;
  const classification = getContextLabel({ name: event.name, tourName: tour });
  const tag = scheduleTag({ name: event.name, isMajor: classification === 'MAJOR CHAMPIONSHIP', isPlayoff: classification === 'PLAYOFF EVENT', eventType: event.event_type });
  const tags = { major: 'Major', seasonFinale: 'Season finale', playoffs: 'Playoffs', team: 'Preview' };
  const title = state === 'result' && leaderName ? `${leaderName} wins${event.venue_city ? ` in ${event.venue_city}` : ''}` : stripEventSponsorClause(event.name);
  const venue = state === 'preview' ? [event.venue_name, event.venue_city] : state === 'live' ? [event.venue_name, formatOverviewDateRange(event.start_date, event.end_date)] : [stripEventSponsorClause(event.name), event.venue_name];
  const facts = [{ value: event.purse == null ? null : formatPurseShort(event.purse), label: 'Purse' },
    { value: event.venue_par == null ? null : `Par ${event.venue_par}`, label: event.venue_yardage == null ? '' : `${event.venue_yardage.toLocaleString('en-GB')} yds` },
    { value: event.defending_champion ? surnameOf(event.defending_champion) : null, label: 'Defending' }].filter(f => f.value != null);
  const totalRounds = roundsFromSchedule(event.start_date, event.end_date);
  const movementRound = state === 'result' ? slotPlayedRound(board, round) : round;
  const lead = slotLead(selection, board, t);
  return <>
    <article className="tour-slot" data-tour-slot={state} data-tour-slot-id={event.id} onClick={onOpen}>
      <div className="tour-slot-photo" data-tour-slot-photo style={{ background: COURSE_GRADIENT }}>
        {image && <img src={image} alt="" />}
        <div className="tour-slot-fade" aria-hidden />
        <div className="tour-slot-photo-copy">
          <div className="tour-slot-kicker" data-tour-slot-kicker>
            {state === 'live' && <><span className="tour-slot-live">● LIVE</span>{'\u00a0 '}</>}
            {TOUR_DISPLAY[tour]} · {state === 'live' ? round === totalRounds ? t('overview.hero.finalRound') : `Round ${round}` : state === 'result' ? 'Final' : tag ? tags[tag] : 'Preview'}
          </div>
          <div className="tour-slot-title">{title}</div>
          <div className="tour-slot-sub">{venue.filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      {lead && <div className="tour-slot-lead" data-tour-slot-lead data-tour-slot-lead-kind={lead.kind}>
        {lead.avatars.length > 0 && <div className="tour-slot-avatars">{lead.avatars.map(row => <SquircleAvatar key={row.id}
          className={`tour-slot-avatar${lead.kind === 'joint' ? ' tour-slot-joint-avatar' : ''}`} size={lead.kind === 'joint' ? 40 : 46} hairlineRing
          srcCandidates={resolvePlayerAvatarCandidates({ name: slotPlayerName(row), photoUrl: row.player?.photo_url, tourSlug: tour })}
          alt={slotPlayerName(row)} userId={row.player?.id ?? row.id} />)}</div>}
        <div className="tour-slot-lead-middle">
          <div className="tour-slot-lead-heading">{lead.heading}</div>
          <div className="tour-slot-lead-name">{lead.name}</div>
          {lead.detail && <div className="tour-slot-lead-detail">{lead.detail}</div>}
        </div>
        <div className="tour-slot-figure">
          <div className={`tour-slot-figure-value${lead.today ? ' is-today' : ''}`} style={state === 'preview' ? undefined : { color: getScoreColor(lead.score, 'dark') }}>{lead.figure}</div>
          {lead.figureLabel && <div className="tour-slot-figure-label">{lead.figureLabel}</div>}
        </div>
      </div>}
      {state === 'live' && <div className="tour-slot-round-bar" data-overview-round-spine>{Array.from({ length: totalRounds }, (_, i) => i + 1).map(n =>
        <div key={n} className="tour-slot-round-node" data-round-node={n < round ? 'done' : n === round ? 'live' : 'next'}><i aria-hidden /><span>R{n}</span></div>)}</div>}
      {state === 'preview' && <>
        {facts.length > 0 && <div className="tour-slot-facts" data-tour-slot-facts style={{ '--slot-fact-count': facts.length } as React.CSSProperties}>{facts.map(f =>
          <div className="tour-slot-fact" key={f.label}><div className="tour-slot-fact-value">{f.value}</div><div className="tour-slot-fact-label">{f.label}</div></div>)}</div>}
        {lastYear}
      </>}
      {state !== 'preview' && <SlotBoard kind={state} board={board} rows={slotBoardRows(board)} round={movementRound} />}
      {actions && <div data-tour-slot-actions onClick={e => e.stopPropagation()}>{actions}</div>}
      {comment && <div data-tour-slot-comment onClick={e => e.stopPropagation()}>{comment}</div>}
      {!comment && <div style={{ height: 12 }} />}
    </article><div aria-hidden style={{ height: 8 }} />
  </>;
}

export function useTournamentSlotPost(id: string | null, name: string | null) {
  return useQuery({ queryKey: ['tournament-slot-post', id], enabled: !!id, staleTime: Infinity, retry: false,
    queryFn: async (): Promise<string | null> => {
      if (!id) return null;
      const { data, error } = await supabase.functions.invoke('upsert-live-tournament-post', { body: { tournamentId: id, tournamentName: name } });
      if (error) throw error;
      return typeof data?.postId === 'string' ? data.postId : null;
    } });
}

export function TourSlot({ visit, onComment }: { visit: TourSlotVisit; onComment: (post: FeedPost, source: CommentOpenSource) => void }) {
  const navigate = useNavigate();
  const { selectedTourSlug, selectTour } = useTourSelection();
  const { selection, payload } = useTourSlotData(visit, selectedTourSlug);
  const event = selection?.tournament;
  const { user } = useSupabaseSession();
  const { activeActor, availableActors, setActiveActor } = useActiveActor();
  const imagesInput = useMemo(() => event ? [{ id: event.id, venue_name: event.venue_name, venue_course_name: event.venue_course_name, venue_city: event.venue_city, venue_state: event.venue_state, venue_country: event.venue_country }] : [], [event]);
  const images = useBatchCourseImages(imagesInput);
  const postIdQuery = useTournamentSlotPost(event?.id ?? null, event?.name ?? null);
  const postId = postIdQuery.data ?? null;
  const engagement = useQuery({ queryKey: ['post-engagement', postId, 'tour-slot', activeActor?.type, activeActor?.id], enabled: !!postId,
    staleTime: 30_000, retry: false,
    queryFn: async () => {
      if (!postId) return null;
      const [post, liked] = await Promise.all([
        supabase.from('posts').select('user_id, created_at, like_count, comment_count').eq('id', postId).maybeSingle(),
        activeActor ? supabase.rpc('viewer_liked_post', { p_post_id: postId, p_viewer: activeActor.id, p_actor_type: activeActor.type }) : Promise.resolve({ data: false, error: null }),
      ]);
      if (post.error) throw post.error;
      if (liked.error) throw liked.error;
      if (!post.data) return null;
      return { userId: post.data.user_id, createdAt: post.data.created_at, likeCount: post.data.like_count ?? 0, commentCount: post.data.comment_count ?? 0, isLikedByMe: liked.data === true };
    } });
  const { handleLike, getActiveLikeState } = useClubhouseLikes({ userId: user?.id, activeActor });
  const { handleShare } = useClubhouseShare(user?.id);
  const lastView = useRef<TourSlotViewProps | null>(null);
  const settled = !!event && (images.isFetched || images.isError) && (postIdQuery.isFetched || postIdQuery.isError) && (!postId || engagement.isFetched || engagement.isError);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!settled || !event || !selection || !root.current || visit.shown.has(event.id)) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting) || visit.shown.has(event.id)) return;
      visit.shown.add(event.id);
      analyticsEvents.track('tour_slot_shown', { state: selection.state, tour: selection.tour, tournament_id: event.id });
      observer.disconnect();
    });
    observer.observe(root.current); return () => observer.disconnect();
  }, [settled, event, selection, visit]);
  if (settled && selection && event && payload) {
    const board = payload.boards.get(event.id) ?? [];
    const data = engagement.data;
    const post: FeedPost | null = postId && data ? { id: postId, userId: data.userId, actorId: data.userId, actorType: 'system', username: 'clbhouz', displayName: TOUR_DISPLAY[selection.tour], avatarUrl: '', isVerified: false, creatorRelation: 'system', caption: event.name, mediaItems: [], createdAt: data.createdAt, likeCount: data.likeCount, commentCount: data.commentCount, shareCount: 0, review: null, isReview: false, isLikedByMe: data.isLikedByMe, isFollowedByMe: false, postType: 'tournament_live' } : null;
    const likes = getActiveLikeState(post);
    const guest = (action: 'like' | 'comment' | 'share', fn: () => void) => { if (!gateGuestActionNow(action, { postKind: 'post' })) fn(); };
    const open = (source: CommentOpenSource) => { if (post) guest('comment', () => onComment(post, source)); };
    lastView.current = { selection, board, image: images.data?.get(event.id) ?? null,
      lastYear: selection.state === 'preview' ? <SlotLastYearBoard event={event} /> : null,
      actions: post ? <><FeedPostActions actor={activeActor} onActorChange={setActiveActor} liked={likes.isLiked} likeCount={likes.count} commentCount={post.commentCount} padding="12px 16px 2px" gap={24} onLike={() => guest('like', () => handleLike(post))} onComment={() => open('footer_glyph')} onShare={() => guest('share', () => handleShare(post))} /><LikedByRow postId={post.id} count={likes.count} source="post" kind="like" surfaceColor={FEED_CARD_SURFACE} style={{ padding: '6px 16px 0' }} /></> : null,
      comment: post ? <FeedAddComment currentUserId={user?.id} actor={activeActor} multipleActors={availableActors.length > 1} onActorChange={setActiveActor} onComment={() => open('add_comment_row')} padding="10px 16px 14px" /> : null,
      onOpen: () => { selectTour(selection.tour, { tournamentId: event.id }); writeStoredTour(selection.tour); analyticsEvents.track('tour_slot_tapped', { state: selection.state, tour: selection.tour, tournament_id: event.id }); navigate('/tourhub'); },
    };
  }
  return lastView.current ? <div ref={node => { root.current = node; visit.el = node; }}><TourSlotView {...lastView.current} /></div> : null;
}