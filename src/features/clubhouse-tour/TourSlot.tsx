/** One slab, three states. The visit is owned by Clubhouse so virtualization
 * cannot rotate its tournament or repeat shown analytics. Post controls and
 * counters use the existing post path; failed upsert hides only those doors. */
import React, { useEffect, useMemo, useRef } from 'react';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { writeStoredTour } from '@/features/tourhub/hooks/useTourSelection';
import { useOurPickRecord } from '@/features/tourhub/hooks/usePickInsights';
import { useBatchCourseImages } from '@/features/tourhub/hooks/useBatchCourseImages';
import { PhotoBandFade } from '@/features/tourhub/components/overview-v3/HybridHeroBands/photoBandMaterial';
import { COURSE_GRADIENT } from '@/features/tourhub/components/overview-v3/HybridHero.constants';
import { tournamentHeadline } from '@/features/tourhub/overview/magazineCopy';
import { roundsFromSchedule } from '@/features/tourhub/components/overview-v3/HybridHero.utils';
import type { HeroTournament } from '@/features/tourhub/hooks/useHeroCarouselData';
import { scheduleTag, formatPurseShort } from '@/features/tourhub/schedule-v2/scheduleRules';
import { getContextLabel } from '@/features/tourhub/utils/tournamentClassification';
import { stripEventSponsorClause } from '@/features/tourhub/_shared/eventName';
import { surnameOf } from '@/features/tourhub/_shared/playerName';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import { fmtScore } from '@/features/tourhub/utils/fmtScore';
import { INK, INK_SOFT, INK_MUTE, INK_FAINT, AMBER, TOUR_LIVE_GREEN } from '@/features/tourhub/_shared/tokens';
import { FEED_CARD_SURFACE, MEMBER_CELL } from '@/lib/tokens/surfaces';
import { HERO_PHOTO_HEIGHT } from '@/lib/heroHeights';
import { countInWords } from '@/features/tourhub/components/overview-v3/overviewTokens';
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
import { TOUR_DISPLAY, slotPosition, pickScore, recordLine, bestOfThree, chaserSentence, type SlotSelection, type SlotPick } from './tourSlotRules';

const ellipsis: React.CSSProperties = { minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const numeric: React.CSSProperties = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };
const caps: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase' };
const dateLabel = (date: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${date.slice(0,10)}T12:00:00Z`)).replace(',', '');
const weekday = (date: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/London' }).format(new Date(`${date.slice(0,10)}T12:00:00Z`));
export interface TourSlotViewProps { selection: SlotSelection; picks: readonly SlotPick[]; board: BoardEntry[]; image: string | null; record: string | null; sentence: string | null; chase: string | null; actions?: React.ReactNode; comment?: React.ReactNode; onOpen: () => void }

export function TourSlotView({ selection, picks, board, image, record, sentence, chase, actions, comment, onOpen }: TourSlotViewProps) {
  const { t } = useTranslation('tourhub');
  const { tournament: event, tour, state } = selection;
  const rows = board.filter(row => row.position != null).sort((a,b) => (a.position ?? Infinity) - (b.position ?? Infinity));
  const leader = rows[0];
  const leaders = rows.filter(row => row.position === leader?.position);
  const leaderName = surnameOf(leader?.player?.full_name ?? leader?.team?.display_name ?? '');
  const round = event.current_round ?? 1;
  const classification = getContextLabel({ name: event.name, tourName: tour });
  const tag = scheduleTag({ name: event.name, isMajor: classification === 'MAJOR CHAMPIONSHIP', isPlayoff: classification === 'PLAYOFF EVENT', eventType: event.event_type });
  const tags = { major: 'Major', seasonFinale: 'Season finale', playoffs: 'Playoffs', team: 'Preview' };
  const title = state === 'result' && leaderName ? `${leaderName} wins${event.venue_city ? ` in ${event.venue_city}` : ''}` : stripEventSponsorClause(event.name);
  const venue = state === 'preview' ? [event.venue_name, event.venue_city] : state === 'live' ? [event.venue_name, formatOverviewDateRange(event.start_date, event.end_date)] : [stripEventSponsorClause(event.name), event.venue_name];
  const rightLabel = leaders.length > 1 ? `${countInWords(leaders.length, t)} tied` : leaderName;
  const facts = [{ value: event.purse == null ? null : formatPurseShort(event.purse), label: 'Purse' },
    { value: event.venue_par == null ? null : `Par ${event.venue_par}`, label: event.venue_yardage == null ? '' : `${event.venue_yardage.toLocaleString('en-GB')} yds` },
    { value: event.defending_champion ? surnameOf(event.defending_champion) : null, label: 'Defending' }].filter(f => f.value != null);
  const scoreStyle = (score: number | null): React.CSSProperties => ({ ...numeric, color: score != null && score > 0 ? INK : getScoreColor(score, 'dark'), fontSize: 15, fontWeight: 800, textAlign: 'right' });
  return <>
    <article data-tour-slot={state} data-tour-slot-id={event.id} onClick={onOpen} style={{ background: FEED_CARD_SURFACE, color: INK, width: '100%', minWidth: 0, cursor: 'pointer' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px 12px' }}>
        <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: '34%', background: MEMBER_CELL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trophy size={22} strokeWidth={1.8} /></div>
        <div style={{ minWidth: 0 }}><div style={{ ...ellipsis, fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{TOUR_DISPLAY[tour]}</div>
          <div style={{ ...ellipsis, fontSize: 14, color: INK_MUTE, marginTop: 3 }}>{state === 'live' ? <><span style={{ color: TOUR_LIVE_GREEN, fontSize: 11, fontWeight: 800, letterSpacing: '.14em' }}>● LIVE</span>{'  '}Round {round}</> : state === 'preview' ? `Starts ${dateLabel(event.start_date)}` : `Final · ${dateLabel(event.end_date)}`}</div>
        </div>
      </header>
      <div data-tour-slot-photo style={{ position: 'relative', height: HERO_PHOTO_HEIGHT, width: '100%', background: COURSE_GRADIENT }}>
        {image && <img src={image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />}
        <PhotoBandFade canvas={FEED_CARD_SURFACE} />
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 6, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ ...caps, color: AMBER }}>{TOUR_DISPLAY[tour]} · {state === 'live' ? `Round ${round}` : state === 'result' ? 'Final' : tag ? tags[tag] : 'Preview'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-.01em', marginTop: 5, overflowWrap: 'anywhere' }}>{title}</div>
            <div style={{ fontSize: 12.5, color: INK_SOFT, marginTop: 5, overflowWrap: 'anywhere' }}>{venue.filter(Boolean).join(' · ')}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, maxWidth: 104 }}><div style={{ ...numeric, fontSize: state === 'preview' ? 22 : 28, fontWeight: 800, lineHeight: 1, color: state === 'preview' ? INK : leader?.score != null && leader.score > 0 ? INK : getScoreColor(leader?.score, 'dark') }}>{state === 'preview' ? weekday(event.start_date) : leader?.score == null ? '' : fmtScore(leader.score)}</div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', color: INK_MUTE, marginTop: 5, textTransform: 'uppercase', overflowWrap: 'anywhere' }}>{state === 'preview' ? 'First tee' : rightLabel}</div>
          </div>
        </div>
      </div>
      {actions && <div data-tour-slot-actions onClick={e => e.stopPropagation()}>{actions}</div>}
      {state === 'preview' && <div style={{ display: 'flex', gap: 26, padding: '10px 16px 0', minWidth: 0 }}>{facts.map(f => <div key={f.label} style={{ minWidth: 0, flex: '0 1 auto' }}><div style={{ ...ellipsis, fontSize: 16, fontWeight: 800 }}>{f.value}</div><div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em', color: INK_FAINT, textTransform: 'uppercase', marginTop: 3 }}>{f.label}</div></div>)}</div>}
      {state === 'live' && sentence && <p style={{ fontSize: 15, lineHeight: 1.45, color: INK_SOFT, padding: '8px 16px 0', margin: 0 }}><strong style={{ color: INK, fontWeight: 700 }}>{sentence}</strong>{chase ? ` ${chase}` : ''}</p>}
      {state !== 'preview' && <div data-tour-slot-board style={{ padding: '8px 16px 0' }}>{rows.slice(0,3).map((row,i) => <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '32px minmax(0,1fr) auto', alignItems: 'center', gap: 8, height: 30 }}>
        <span style={{ ...numeric, color: INK, fontSize: 13, fontWeight: 700 }}>{i > 0 && rows[i-1].position === row.position ? '' : `${row.position_tied || rows.filter(r => r.position === row.position).length > 1 ? 'T' : ''}${row.position}`}</span>
        <span style={{ ...ellipsis, fontSize: 14.5, fontWeight: 600 }}>{row.player?.full_name ?? row.team?.display_name ?? ''}</span><span style={scoreStyle(row.score)}>{row.score == null ? '' : fmtScore(row.score)}</span>
      </div>)}</div>}
      <div style={{ ...caps, color: INK_FAINT, padding: '16px 16px 0' }}>Our picks</div>
      <div data-tour-slot-picks style={{ padding: '8px 16px 0' }}>{picks.map(pick => {
        const row = board.find(row => row.player?.id === pick.playerId);
        const score = state === 'preview' ? null : pickScore(row);
        return <div key={pick.playerId} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto 44px', gap: 8, alignItems: 'center', height: 30 }}><span style={{ ...ellipsis, fontSize: 14.5, fontWeight: 600 }}>{pick.playerName}</span><span data-tour-slot-position style={{ ...numeric, fontSize: 13, fontWeight: 700, color: INK, textAlign: 'right' }}>{state === 'preview' ? '' : slotPosition(row)}</span><span style={scoreStyle(score)}>{score == null ? '' : fmtScore(score)}</span></div>;
      })}</div>
      {record && <div style={{ fontSize: 12.5, color: INK_FAINT, padding: '8px 16px 0' }}>{record}</div>}
      {comment && <div data-tour-slot-comment onClick={e => e.stopPropagation()}>{comment}</div>}
      {!comment && <div style={{ height: 16 }} />}
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
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { selectedTourSlug, selectTour } = useTourSelection();
  const { selection, payload } = useTourSlotData(visit, selectedTourSlug);
  const event = selection?.tournament;
  const { user } = useSupabaseSession();
  const { activeActor, availableActors, setActiveActor } = useActiveActor();
  const imagesInput = useMemo(() => event ? [{ id: event.id, venue_name: event.venue_name, venue_course_name: event.venue_course_name, venue_city: event.venue_city, venue_state: event.venue_state, venue_country: event.venue_country }] : [], [event]);
  const images = useBatchCourseImages(imagesInput);
  const record = useOurPickRecord(selection?.tour ?? '', event?.season.year ?? null);
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
  const settled = !!event && (images.isFetched || images.isError) && (record.isFetched || record.isError) && (postIdQuery.isFetched || postIdQuery.isError) && (!postId || engagement.isFetched || engagement.isError);
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
    const picks = payload.predictions.get(event.id) ?? [];
    const data = engagement.data;
    const post: FeedPost | null = postId && data ? { id: postId, userId: data.userId, actorId: data.userId, actorType: 'system', username: 'clbhouz', displayName: TOUR_DISPLAY[selection.tour], avatarUrl: '', isVerified: false, creatorRelation: 'system', caption: event.name, mediaItems: [], createdAt: data.createdAt, likeCount: data.likeCount, commentCount: data.commentCount, shareCount: 0, review: null, isReview: false, isLikedByMe: data.isLikedByMe, isFollowedByMe: false, postType: 'tournament_live' } : null;
    const likes = getActiveLikeState(post);
    const guest = (action: 'like' | 'comment' | 'share', fn: () => void) => { if (!gateGuestActionNow(action, { postKind: 'post' })) fn(); };
    const open = (source: CommentOpenSource) => { if (post) guest('comment', () => onComment(post, source)); };
    const heroTournament = { ...event, name: event.name, startDate: event.start_date, endDate: event.end_date } as unknown as HeroTournament;
    lastView.current = { selection, picks, board, image: images.data?.get(event.id) ?? null,
      record: selection.state === 'result' ? bestOfThree(picks, board) : recordLine(selection.tour, record.isError ? null : record.data),
      sentence: selection.state === 'live' ? tournamentHeadline({ tournament: heroTournament, state: { kind: 'live', round: event.current_round ?? 1, totalRounds: roundsFromSchedule(event.start_date, event.end_date) }, leaderboard: board, t }) : null,
      chase: chaserSentence(board, t),
      actions: post ? <><FeedPostActions actor={activeActor} onActorChange={setActiveActor} liked={likes.isLiked} likeCount={likes.count} commentCount={post.commentCount} padding="14px 16px 4px" gap={26} onLike={() => guest('like', () => handleLike(post))} onComment={() => open('footer_glyph')} onShare={() => guest('share', () => handleShare(post))} /><LikedByRow postId={post.id} count={likes.count} source="post" kind="like" surfaceColor={FEED_CARD_SURFACE} style={{ padding: '0 16px' }} /></> : null,
      comment: post ? <FeedAddComment currentUserId={user?.id} actor={activeActor} multipleActors={availableActors.length > 1} onActorChange={setActiveActor} onComment={() => open('add_comment_row')} padding="14px 16px 16px" /> : null,
      onOpen: () => { selectTour(selection.tour, { tournamentId: event.id }); writeStoredTour(selection.tour); analyticsEvents.track('tour_slot_tapped', { state: selection.state, tour: selection.tour, tournament_id: event.id }); navigate('/tourhub'); },
    };
  }
  return lastView.current ? <div ref={node => { root.current = node; visit.el = node; }}><TourSlotView {...lastView.current} /></div> : null;
}