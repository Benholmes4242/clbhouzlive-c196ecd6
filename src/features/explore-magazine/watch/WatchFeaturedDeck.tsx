/** FW1 owns only the featured slot. Top-card playback shares WatchLead's
 * coordinator/HLS/preview lifecycle. Fullscreen uses the complete ordered list.
 * Ben ruled 260ms handover within the 320ms exit. No swipe mutates engagement.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReactionGlyph, AMBER } from '@/lib/reactionKind';
import { HeartBurst } from '@/components/feed/HeartBurst';
import { MessageSquare, Share, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useClubhouseLikes } from '@/components/clubhouse/hooks/useClubhouseLikes';
import { useClubhouseShare } from '@/components/clubhouse/hooks/useClubhouseShare';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { supabase } from '@/integrations/supabase/client';
import { registerRailVideo } from '@/components/explore-tab-new/courseled/mediaRailAutoplay';
import { attachTileHls } from '@/components/explore-tab-new/courseled/tileHlsPlayer';
import { autoplayBlocked } from '@/components/explore-tab-new/courseled/reviewVideoAutoplay';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { getThumbnailUrl } from '@/utils/thumbnail';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { toFeedPosts } from '@/features/watch-v2/utils/toFeedPost';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { numberWord } from '@/lib/text/numbers';
import { WatchLead } from './WatchLead';
import { shortAge, toHubRow, type WatchVideoRow } from './watchMiddle';
import { attachPosterPreview } from './posterPreview';
import { useWatchFeatured, type WatchFeaturedRow } from './useWatchFeatured';
import { featuredSwipe, FEATURED_MIN, FEATURED_ADVANCE_MS, FEATURED_EXIT_MS, FEATURED_CROSSFADE_MS, FEATURED_TAP_MS } from './featuredRules';
import './featured.css';

type SlotProps = { userId: string | undefined; onDepart: () => void; onOpenComments?: (id: string) => void; selectShorts: () => void };

export function WatchFeaturedSlot(props: SlotProps) {
  const featured = useWatchFeatured(props.userId);
  const fallbackReason = featured.isError ? 'error' : featured.isFetched && (featured.data?.length ?? 0) < FEATURED_MIN ? 'too_few' : null;
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (props.userId && fallbackReason && reported.current !== fallbackReason) {
      reported.current = fallbackReason;
      analyticsEvents.track('watch_featured_fallback', { reason: fallbackReason });
    }
  }, [fallbackReason, props.userId]);
  if (!props.userId) return <WatchLead userId={props.userId} onDepart={props.onDepart} />;
  // Featured and the lead share ONE slot: one skeleton while pending, then the
  // deck or the fallback lead in that same slot, so nothing else moves.
  if (!featured.isFetched && !featured.isError) return <div data-watch-lead="skeleton" aria-hidden style={{ margin:'22px 16px 0', height:440, borderRadius:20, background:'var(--explore-top-panel)' }} />;
  if (fallbackReason) return <WatchLead userId={props.userId} onDepart={props.onDepart} />;
  return <WatchFeaturedDeck {...props} rows={featured.data ?? []} />;
}

const posterFor = (row: WatchFeaturedRow) => row.poster_url ?? (row.stream_id ? getThumbnailUrl({ streamId:row.stream_id, height:720 }) : null);
// Captions share the Watch rows' mention path: stored markup never renders raw.
const captionFor = (row: WatchFeaturedRow) => (row.caption ? stripMentionMarkup(String(row.caption)).trim() : '') || row.course_name || '';

// Playback owns the sound/duration group so only mounted videos expose sound;
// the group isolates its input from the card's tap and swipe lifecycle.
function FeaturedPlayback({ row, duration }: { row: WatchFeaturedRow; duration: string }) {
  const reduced = usePrefersReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const poster = posterFor(row);
  const hls = row.hls_url ?? (row.stream_id ? generateStreamHlsUrl(row.stream_id) : null);
  const mount = !!hls && !failed && !autoplayBlocked(reduced);
  useEffect(() => {
    if (mount && host.current) return registerRailVideo(host.current, setActive);
  }, [mount]);
  useEffect(() => {
    const el = video.current;
    if (!active || !el || !hls) return;
    el.muted = true;
    const preview = attachPosterPreview(el, poster, setPlaying);
    const attachment = attachTileHls(el, hls, () => setFailed(true));
    return () => { preview(); el.pause(); attachment.detach(); };
  }, [active, hls, poster]);
  return <>
    <div ref={host} className="featured-media">
      {mount ? <video ref={video} className="featured-media featured-video" data-playing={playing} poster={poster ?? undefined} muted={muted} playsInline preload="none" disableRemotePlayback tabIndex={-1} onError={e => { if (e.currentTarget.getAttribute('src')) setFailed(true); }} /> : null}
    </div>
    {playing ? <span className="featured-playing" aria-hidden><i /><i /><i /></span> : null}
    <div className="featured-topright">
      {mount ? <Button variant="ghost" className="featured-mute" aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={!muted} onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); const next = !muted; if (video.current) video.current.muted = next; setMuted(next); }}>{muted ? <VolumeX /> : <Volume2 />}</Button> : null}
      <span className="featured-duration">{duration}</span>
    </div>
  </>;
}

export function WatchFeaturedDeck({ rows, userId, onDepart, onOpenComments, selectShorts }: SlotProps & { rows: WatchFeaturedRow[] }) {
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [exiting, setExiting] = useState<null | number>(null);
  const [heart, setHeart] = useState(0);
  const clearHeart = useCallback(() => setHeart(0), []);
  const [small, setSmall] = useState(() => window.matchMedia('(max-width: 340px)').matches);
  const reduced = usePrefersReducedMotion();
  const drag = useRef<{ x:number; y:number; dx:number; dy:number } | null>(null);
  const tap = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLElement>(null);
  const viewed = useRef(false);
  const { activeActor } = useActiveActor();
  const { handleLike, getActiveLikeState } = useClubhouseLikes({ userId, activeActor });
  const { handleShare } = useClubhouseShare(userId);
  const posts = useMemo(() => toFeedPosts(rows.map(row => ({ ...toHubRow(row as unknown as WatchVideoRow), comment_count:row.comment_count, is_liked_by_me:row.is_liked_by_me }))), [rows]);
  const end = index >= rows.length;
  const row = rows[index];
  const rawPost = posts[index];
  // Featured's lead columns have no viewer flag. Resolve it via the existing
  // actor-aware reader, never assume false and accidentally remove a like.
  const likedRead = useQuery({
    queryKey:['post-engagement', row?.post_id, 'featured', activeActor?.type, activeActor?.id],
    enabled:!!row && !!userId && !!activeActor,
    retry:false,
    queryFn:async () => {
      if (!row || !activeActor) return { isLikedByMe:false };
      const { data, error } = await supabase.rpc('viewer_liked_post', { p_post_id:row.post_id, p_viewer:activeActor.id, p_actor_type:activeActor.type });
      if (error) throw error;
      return { isLikedByMe:!!data };
    },
  });
  const post = rawPost ? { ...rawPost, isLikedByMe:likedRead.data?.isLikedByMe ?? rawPost.isLikedByMe } : null;
  const likes = getActiveLikeState(post);
  const likeAvailable = !!userId && !!activeActor && (likedRead.isSuccess || row?.is_liked_by_me !== undefined);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 340px)');
    const changed = () => setSmall(mq.matches);
    mq.addEventListener('change', changed);
    return () => mq.removeEventListener('change', changed);
  }, []);
  useEffect(() => () => { if (tap.current) clearTimeout(tap.current); if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);
  useEffect(() => {
    if (!root.current || viewed.current) return;
    const obs = new IntersectionObserver(entries => {
      if (!viewed.current && entries.some(entry => entry.isIntersecting)) { viewed.current = true; analyticsEvents.track('watch_featured_viewed', { count:rows.length }); obs.disconnect(); }
    }, { threshold:0.5 });
    obs.observe(root.current);
    return () => obs.disconnect();
  }, [rows.length]);
  const clearTap = () => { if (tap.current) clearTimeout(tap.current); tap.current = null; };
  const like = (via:'button' | 'double_tap') => {
    if (!likeAvailable || !post) return;
    if (via === 'button' || !likes.isLiked) {
      handleLike({ ...post, isLikedByMe:likes.isLiked, likeCount:likes.count });
      analyticsEvents.track('watch_featured_liked', { via });
    }
    if (via === 'double_tap' || !likes.isLiked) { setHeart(value => value + 1); }
  };
  const open = () => { if (!row) return; onDepart(); openWithOrigin({ posts, index, originEl:null, posterUrl:posterFor(row), openedFrom:'amateur-watch', forceStartAtZero:true }); };
  const singleTap = () => {
    if (tap.current) { clearTap(); like('double_tap'); }
    else tap.current = setTimeout(() => { tap.current = null; open(); }, FEATURED_TAP_MS);
  };
  const move = (direction:number, back = false) => {
    if (exiting !== null) return;
    clearTap(); setExiting(direction);
    const to = back ? rows.length - 1 : index + 1;
    analyticsEvents.track('watch_featured_swiped', { from:Math.min(index+1,rows.length), to:to+1, direction:direction > 0 ? 'right' : 'left' });
    advanceTimer.current = setTimeout(() => { setIndex(to); setDx(0); setExiting(null); if (to === rows.length) analyticsEvents.track('watch_featured_completed'); }, reduced ? FEATURED_CROSSFADE_MS : FEATURED_ADVANCE_MS);
  };
  const down = (e:PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || exiting !== null) return;
    drag.current = { x:e.clientX,y:e.clientY,dx:0,dy:0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const pointerMove = (e:PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current.dx = e.clientX - drag.current.x; drag.current.dy = e.clientY - drag.current.y;
    if (Math.abs(drag.current.dx) > Math.abs(drag.current.dy)) setDx(drag.current.dx);
  };
  const up = () => {
    const value = drag.current; drag.current = null;
    if (!value) return;
    if (Math.abs(value.dy) > Math.abs(value.dx) && Math.abs(value.dy) >= 6) { setDx(0); clearTap(); return; }
    const action = featuredSwipe(value.dx,end);
    if (action !== 'stay') { move(value.dx > 0 ? 1 : -1, action === 'back'); return; }
    setDx(0);
    if (!end && Math.abs(value.dx) < 6 && Math.abs(value.dy) < 6) singleTap();
  };
  const transform = reduced ? 'none' : exiting !== null ? `translateX(${exiting*480}px) rotate(${exiting*18}deg)` : `translateX(${dx}px) rotate(${dx/22}deg)`;
  const topStyle = { transform, opacity:exiting === null ? 1 : 0, transition:drag.current ? 'none' : exiting !== null ? reduced ? 'opacity 150ms linear' : `transform ${FEATURED_EXIT_MS}ms cubic-bezier(.2,.8,.2,1), opacity ${FEATURED_EXIT_MS}ms` : 'transform 350ms cubic-bezier(.2,.8,.2,1)' };
  const gestures = { onPointerDown:down,onPointerMove:pointerMove,onPointerUp:up,onPointerCancel:() => { drag.current = null; setDx(0); clearTap(); } };
  return <section ref={root} className="watch-featured" data-watch-featured>
    <header className="featured-head"><div><div className="featured-kicker">FEATURED THIS WEEK</div><h2 className="featured-title">The week's best</h2></div><span className="featured-counter">{Math.min(index+1,rows.length)} / {rows.length}</span></header>
    <div className="featured-deck">
      {end ? <div className="featured-card featured-end" data-featured-end style={topStyle} {...gestures}><h3>That's this week's {numberWord(rows.length,false)}</h3><p>The deck refreshes as new videos come in. Swipe back to see one again.</p><div className="featured-end-actions"><Button variant="ghost" className="featured-end-button featured-restart" onClick={() => { clearTap(); setIndex(0); }}>Start again</Button><Button variant="ghost" className="featured-end-button" onClick={selectShorts}>All shorts</Button></div></div> : rows.slice(index,index+3).map((item,depth) => <div key={item.post_id} className="featured-card" data-featured-card={item.post_id} data-depth={depth} data-top={depth===0} aria-hidden={depth > 0 ? true : undefined} role={depth===0 ? 'button' : undefined} tabIndex={depth===0 ? 0 : -1} aria-label={depth===0 ? captionFor(item) || item.display_name : undefined} style={depth===0 ? topStyle : undefined} {...(depth===0 ? gestures : {})} onKeyDown={depth===0 ? e => { if (e.target!==e.currentTarget) return; if (e.key==='ArrowLeft' || e.key==='ArrowRight') { e.preventDefault(); move(e.key==='ArrowRight' ? 1 : -1); } if (e.key==='Enter' || e.key===' ') { e.preventDefault(); singleTap(); } } : undefined}>
        {posterFor(item) ? <img className="featured-media" src={posterFor(item) ?? undefined} alt="" decoding="async" /> : null}
        {depth===0 ? <><FeaturedPlayback key={item.post_id} row={item} duration={formatDuration(item.duration_seconds)} /><span className="featured-shade" /><span className="featured-badge">FEATURED · {index+1} OF {rows.length}</span><div className="featured-foot"><div className="featured-who"><span className="featured-avatar">{item.avatar_url ? <img src={item.avatar_url} alt="" /> : <PlayerSilhouette />}</span><span>{item.display_name}</span></div><p className="featured-caption">{captionFor(item)}</p><div className="featured-meta">{likes.count} likes · {item.comment_count} comments · {shortAge(item.created_at)}</div></div>{heart > 0 ? <HeartBurst key={heart} onDone={clearHeart} /> : null}</> : null}
      </div>)}
    </div>
    <div className="featured-bar">{!end ? <><Button variant="ghost" className="featured-action" aria-label="Like video" aria-pressed={likes.isLiked} disabled={!likeAvailable} onClick={() => like('button')}><ReactionGlyph reacted={likes.isLiked} size={17} tone="panel" /><span data-featured-like-count style={likes.isLiked ? { color: AMBER } : undefined}>{likes.count}</span></Button><Button variant="ghost" className="featured-action" aria-label="Open comments" onClick={() => { if (!row) return; analyticsEvents.track('watch_featured_comment_opened'); onOpenComments?.(row.post_id); }}><MessageSquare />{row?.comment_count}</Button><Button variant="ghost" className="featured-action" aria-label="Share video" onClick={() => { if (!post) return; analyticsEvents.track('watch_featured_shared'); handleShare(post); }}><Share /></Button></> : null}{!small ? <div className="featured-dots" aria-hidden>{rows.map((item,i) => <i key={item.post_id} data-current={i===Math.min(index,rows.length-1)} />)}</div> : null}</div>
  </section>;
}