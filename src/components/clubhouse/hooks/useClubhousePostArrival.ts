/** Clubhouse arrival owns the one-shot URL target and optional pinned card. It uses
 * the shared published-post reader, never changes ranked pages, and leaves normal
 * CardFeed impression ownership intact. Keep pins viewer-scoped on keep-alive mounts. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { FeedPost } from '@/components/media-system/types/media';
import { loadPublishedPost, mapPublishedPost, type PostViewerIdentity } from '@/lib/publishedPostViewer';

export interface FeedPostArrival { id: string; key: string; pinned: boolean }

export function useClubhousePostArrival({ posts, isFetched, ready, viewer }: {
  posts: FeedPost[]; isFetched: boolean; ready: boolean; viewer: PostViewerIdentity;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname === '/' || location.pathname === '/clubhouse';
  const postId = active ? new URLSearchParams(location.search).get('post') : null;
  const [pin, setPin] = useState<{ post: FeedPost; viewerId: string | undefined } | null>(null);
  const [arrival, setArrival] = useState<FeedPostArrival | null>(null);
  const handled = useRef<string | null>(null);
  const latest = useRef({ location, posts });
  latest.current = { location, posts };
  const key = `${location.key}:${postId ?? ''}:${viewer.userId ?? ''}`;

  const removeParam = useCallback(() => {
    const loc = latest.current.location;
    const params = new URLSearchParams(loc.search);
    params.delete('post');
    const search = params.toString();
    navigate({ pathname: loc.pathname, search: search ? `?${search}` : '', hash: loc.hash }, { replace: true, state: loc.state });
  }, [navigate]);

  useEffect(() => {
    if (!postId || !ready || !isFetched || handled.current === key) return;
    handled.current = key;
    let cancelled = false;
    if (latest.current.posts.some(post => post.id === postId)) {
      setArrival({ id: postId, key, pinned: false });
    } else {
      void (async () => {
        try {
          const { data, error } = await loadPublishedPost(postId, viewer.userId);
          if (cancelled) return;
          const post = !error && data ? await mapPublishedPost(data, viewer) : null;
          if (cancelled) return;
          if (post) {
            setPin({ post, viewerId: viewer.userId });
            setArrival({ id: postId, key, pinned: true });
          } else {
            setArrival(null);
            removeParam();
          }
        } catch {
          if (!cancelled) { setArrival(null); removeParam(); }
        }
      })();
    }
    return () => { cancelled = true; if (handled.current === key) handled.current = null; };
  }, [postId, key, ready, isFetched, viewer.userId, viewer.actorId, viewer.actorType, removeParam]);

  const pinnedPost = pin && pin.viewerId === viewer.userId ? pin.post : null;
  const displayPosts = useMemo(() => pinnedPost
    ? [pinnedPost, ...posts.filter(post => post.id !== pinnedPost.id)] : posts, [posts, pinnedPost]);
  const onPlaced = useCallback((placedKey: string) => {
    if (placedKey !== key || !postId) return;
    setArrival(null);
    removeParam();
  }, [key, postId, removeParam]);
  return { posts: displayPosts, arrival: active && postId ? arrival : null, hasTarget: !!postId, onPlaced };
}