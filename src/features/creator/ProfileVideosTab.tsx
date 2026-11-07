/** CR2 videos remain a profile surface; Watch adapter/player own fullscreen playback.
 * Video filters reuse RailChips' Top 100 sm choice treatment, so chip geometry and counts cannot drift. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RailChips } from '@/components/ui/RailChips';
import { Skeleton } from '@/components/ui/skeleton';
import { toFeedPosts } from '@/features/watch-v2/utils/toFeedPost';
import { posterFor } from '@/features/explore-magazine/watch/videoUnit';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import { getDocumentScrollParent } from '@/lib/getScrollParent';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { creatorDuration, creatorFeedRow, useProfileVideos, type CreatorSummary, type VideoKind } from './profileCreator';
import './profile-creator.css';
export function CreatorContentSkeleton() { return <div className="profile-video-grid" aria-busy="true">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="profile-video-loading" />)}</div>; }
export function ProfileVideosTab({ userId, viewerId, summary }: { userId: string; viewerId?: string; summary: CreatorSummary }) {
  const [kind, setKind] = useState<VideoKind>('all');
  const query = useProfileVideos(userId, kind, !!viewerId);
  const rows = useMemo(() => (query.data?.pages ?? []).flat(), [query.data]);
  const posts = useMemo(() => toFeedPosts(rows.map(creatorFeedRow)), [rows]);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current; if (!el || !query.hasNextPage || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting) && !query.isFetchingNextPage) void query.fetchNextPage(); }, { root: getDocumentScrollParent(), rootMargin: '300px' });
    observer.observe(el); return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);
  const self = userId === viewerId;
  return <div className="profile-videos">
    <div className="px-4 py-3"><RailChips size="sm" align="center-when-fit" ariaLabel="Video type" options={[{ id: 'all', label: 'All', value: summary.videos }, { id: 'short', label: 'Shorts', value: summary.shorts }, { id: 'long', label: 'Long form', value: summary.long_form }]} value={kind} onChange={next => { if (next !== 'all' && next !== 'short' && next !== 'long') return; setKind(next); analyticsEvents.track('profile_videos_chip_changed', { kind: next }); }} /></div>
    {query.isPending ? <CreatorContentSkeleton /> : query.isError ? <Button variant="ghost" onClick={() => void query.refetch()}>Try again</Button> : rows.length === 0 ? <p className="profile-video-empty">{kind === 'short' ? 'No shorts yet.' : kind === 'long' ? 'No long-form videos yet.' : self ? 'Your videos will show here.' : 'No videos yet.'}</p> : <div className="profile-video-grid">{rows.map((r, index) => <Button key={`${r.post_id}:${r.stream_id}`} variant="ghost" className="profile-video-tile" aria-label={`Play video ${index + 1}`} onClick={() => { analyticsEvents.track('profile_video_tapped', { kind, position: index, self }); openWithOrigin({ posts, index, originEl: null, posterUrl: r.poster_url ?? null, openedFrom: 'profile-videos', forceStartAtZero: true }); }}>
      {posterFor(r, 344) && <img src={posterFor(r, 344) ?? undefined} alt="" loading="lazy" />}<span className="profile-video-shade" />{creatorDuration(r.duration_seconds) && <span className="profile-video-duration">{creatorDuration(r.duration_seconds)}</span>}{r.course_name && <span className="profile-video-course">{shortCourseName(r.course_name)}</span>}
    </Button>)}</div>}
    <div ref={sentinel} />{query.isFetchingNextPage && <CreatorContentSkeleton />}
  </div>;
}
