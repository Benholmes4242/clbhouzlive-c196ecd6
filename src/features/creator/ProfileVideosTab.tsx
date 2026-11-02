/** CR2 videos remain a profile surface; Watch adapter/player own fullscreen playback. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toFeedPosts } from '@/features/watch-v2/utils/toFeedPost';
import { posterFor } from '@/features/explore-magazine/watch/videoUnit';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { shortCourseName } from '@/lib/shortCourseName';
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
    <div className="profile-video-chips">{([{ kind: 'all', label: 'All', count: summary.videos }, { kind: 'short', label: 'Shorts', count: summary.shorts }, { kind: 'long', label: 'Long form', count: summary.long_form }] as const).map(c => <Button key={c.kind} variant="ghost" className="profile-video-chip" aria-pressed={kind === c.kind} onClick={() => { setKind(c.kind); analyticsEvents.track('profile_videos_chip_changed', { kind: c.kind }); }}>{c.label}<span>{c.count}</span></Button>)}</div>
    {query.isPending ? <CreatorContentSkeleton /> : query.isError ? <Button variant="ghost" onClick={() => void query.refetch()}>Try again</Button> : rows.length === 0 ? <p className="profile-video-empty">{kind === 'short' ? 'No shorts yet.' : kind === 'long' ? 'No long-form videos yet.' : self ? 'Your videos will show here.' : 'No videos yet.'}</p> : <div className="profile-video-grid">{rows.map((r, index) => <Button key={`${r.post_id}:${r.stream_id}`} variant="ghost" className="profile-video-tile" aria-label={`Play video ${index + 1}`} onClick={() => { analyticsEvents.track('profile_video_tapped', { kind, position: index, self }); openWithOrigin({ posts, index, originEl: null, posterUrl: r.poster_url ?? null, openedFrom: 'profile-videos', forceStartAtZero: true }); }}>
      {posterFor(r, 344) && <img src={posterFor(r, 344) ?? undefined} alt="" loading="lazy" />}<span className="profile-video-shade" />{creatorDuration(r.duration_seconds) && <span className="profile-video-duration">{creatorDuration(r.duration_seconds)}</span>}{r.course_name && <span className="profile-video-course">{shortCourseName(r.course_name)}</span>}
    </Button>)}</div>}
    <div ref={sentinel} />{query.isFetchingNextPage && <CreatorContentSkeleton />}
  </div>;
}
