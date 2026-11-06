import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getAvatarFallbackGradient } from '@/lib/avatarFallback';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { Loader2, MapPin } from 'lucide-react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { recordPostViewOnce } from '@/hooks/usePostViewTracker';
import { mapActivityPostToFeedPost } from '@/lib/activityPostMapper';
import { loadPublishedPost, mapPublishedPost } from '@/lib/publishedPostViewer';
import { MentionText } from '@/components/mentions/MentionText';
import { INK_ON_LIGHT, POST_DEEP_LINK_CANVAS, surfaceWithAlpha } from '@/lib/tokens/surfaces';

interface PostPreview {
  id: string;
  caption: string | null;
  media_urls: string[] | null;
  post_type: string | null;
  created_at: string;
  user_profiles: {
    /** Author's user id — keys the avatar fallback hue. */
    id: string | null;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  golf_courses: {
    name: string;
    country: string | null;
  } | null;
}

const GRADIENTS = [
  'linear-gradient(135deg, #1e3d2a 0%, #2d5e3a 60%, #1a3228 100%)',
  'linear-gradient(135deg, #1a2a4a 0%, #253d60 60%, #1a3050 100%)',
  'linear-gradient(135deg, #3a2510 0%, #5a3d1a 60%, #3a2e18 100%)',
];

const isVideoUrl = (url: string) => {
  const lower = url.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.m3u8') || lower.includes('stream');
};

const PostDeepLinkPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as { openComments?: boolean; initialCommentId?: string; closeTo?: string } | null;
  const closeTo = typeof navState?.closeTo === 'string' ? navState.closeTo : null;
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const activeActorType: 'personal' | 'business' = activeActor?.type === 'business' ? 'business' : 'personal';
  const activeActorId: string | null = activeActor?.id ?? user?.id ?? null;
  // videoRef removed — poster-only chassis per BRIEF_VIDEO_TEARDOWN.md.

  const [post, setPost] = useState<PostPreview | null>(null);
  const [feedPost, setFeedPost] = useState<ReturnType<typeof mapActivityPostToFeedPost> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const hasOpenedFullscreen = useRef(false);

  useEffect(() => {
    // MICRO_BRIEF_ROUND_LINK_FLASH S2.2 — DO NOT DECIDE BEFORE AUTH SETTLES.
    // loadPost's behaviour DEPENDS on whether there is a viewer: a media-less
    // post is a REDIRECT for a member and a GUEST PREVIEW for a visitor. When
    // this ran while useSupabaseSession was still resolving, a member got the
    // guest path first — the fullscreen store refused the media-less post and
    // the unavailable state flashed before the second pass redirected. Gated on
    // `authLoading` (the hook's own resolved flag), NOT on `user` being truthy,
    // which would never fire for genuine guests. While unresolved the render
    // path below holds the loading state.
    if (authLoading) return;
    async function loadPost() {

      setLoadError(false);
      setNotFound(false);
      setIsLoading(true);
      if (!postId) { setNotFound(true); setIsLoading(false); return; }

      const { data, error } = await loadPublishedPost(postId, user?.id);
      if (error) { setLoadError(true); setIsLoading(false); return; }
      if (!data) {
        if (closeTo && user?.id) { navigate(closeTo, { replace: true }); return; }
        setNotFound(true); setIsLoading(false); return;
      }

      const row = data as any;
      const profileRow = row.user_profiles ?? {};
      const courseRow = row.golf_courses ?? null;
      const ratingRow = row.course_ratings ?? null;

      // ── LEGACY PATH (added Aug 2026) — DELETE ONCE PRE-AUG-2026
      // NOTIFICATIONS HAVE AGED OUT OF THE INBOX.
      // Round notifications are now routed to the scorecard sheet at LINK time
      // (activityLinks.ts, `new_post` case) because the trigger writes
      // is_round / whs_score_id onto the notification row. Notifications
      // written BEFORE that change carry only post_id, so they still land here.
      // fullscreenFeedStore.open() filters on media presence and returns
      // SILENTLY for a media-less post, which is what left this page sitting on
      // its black scrim. So a media-less post is redirected, never opened:
      // a round goes to its scorecard, anything else to its author.

      const mediaCount = Array.isArray(row.post_media)
        ? row.post_media.filter((m: any) => m.media_url || m.stream_id).length
        : 0;

      // A ROUND IS REDIRECTED FOR EVERYONE, SIGNED IN OR NOT, and BEFORE the
      // guest share-preview shape is built below. A round carries no media and
      // no caption, so the logged-out preview could only ever render an empty
      // card. /round/:id is a public ROUTE; RoundPage itself asks a guest to
      // sign in (a scorecard is a member's own data under RLS), which is a real
      // destination with a way forward instead of a blank card. There is no
      // public round surface to send them to instead.
      const roundScoreId = row.whs_score_id ?? null;
      if (roundScoreId && mediaCount === 0) {
        navigate(`/round/${encodeURIComponent(roundScoreId)}`, { replace: true });
        return;
      }

      // Guests are never redirected past this point — they keep the logged-out
      // preview below.
      if (user?.id && mediaCount === 0) {
        if (closeTo) { navigate(closeTo, { replace: true }); return; }
        // A text-only post has no viewer of its own; the author's profile is
        // the nearest true surface (its feed carries the post).
        const authorRoute = row.actor_type === 'business' && row.actor_id
          ? `/business/${row.actor_id}`
          : row.user_id
            ? `/profile/${row.user_id}`
            : null;
        if (authorRoute) {
          navigate(authorRoute, { replace: true });
          return;
        }
        setNotFound(true);
        setIsLoading(false);
        return;
      }


      // Lightweight preview shape used by the guest viewer
      setPost({
        id: row.id,
        caption: row.content ?? null,
        media_urls: Array.isArray(row.post_media)
          ? row.post_media
              .slice()
              .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
              .map((m: any) => m.media_url)
              .filter(Boolean)
          : null,
        post_type: row.post_type ?? null,
        created_at: row.created_at,
        user_profiles: profileRow ? {
          id: row.user_id ?? null,
          username: profileRow.username,
          display_name: profileRow.display_name,
          avatar_url: profileRow.profile_photo_url ?? null,
        } : null,
        golf_courses: courseRow ? { name: courseRow.name, country: courseRow.country } : null,
      });

      setFeedPost(await mapPublishedPost(row, { userId: user?.id, actorId: activeActorId, actorType: activeActorType }));
      setIsLoading(false);

    }

    // Nothing in loadPost may strand the page on the scrim: any throw (mapper,
    // network, RPC) resolves to the actionable load-error state.
    loadPost().catch((err) => {
      console.error('[PostDeepLink] loadPost threw', err);
      setLoadError(true);
      setIsLoading(false);
    });

    if (postId) recordPostViewOnce(postId);
  }, [postId, user?.id, retryTick, authLoading, activeActorType, activeActorId, closeTo]);

  // Logged-in users: open the global fullscreen viewer with the loaded post
  // and the comments sheet open. Closing the viewer navigates back.
  useEffect(() => {
    if (authLoading || !user || isLoading || !feedPost) return;
    if (hasOpenedFullscreen.current) return;
    hasOpenedFullscreen.current = true;

    if (closeTo && feedPost.mediaItems?.length && feedPost.mediaItems.every(item => item.isProcessing)) {
      navigate(closeTo, { replace: true });
      return;
    }

    const shouldOpenComments = navState?.openComments === true || searchParams.get('openComments') === '1';

    useFullscreenFeedStore.getState().open([feedPost], 0, {
      openCommentsInitially: shouldOpenComments,
      initialCommentId: navState?.initialCommentId ?? null,
      openedFrom: 'post-deep-link',
      onClose: (info) => {
        // A close with reason 'navigating' means the viewer is stepping aside
        // for a destination navigation already in flight (profile / course).
        // Popping history here would land the member back on Activity and
        // cancel that jump — so do nothing and let this page unmount.
        if (info?.reason === 'navigating') return;
        if (closeTo) { navigate(closeTo, { replace: true }); return; }
        // Go back if there's history; otherwise land on Clubhouse.
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/', { replace: true });
        }
      },
    });

    // open() can refuse (its media guard returns silently). If it did, the
    // scrim below would be the whole screen — show the actionable state
    // instead. Belt-and-braces: the media-less case is already redirected above.
    if (!useFullscreenFeedStore.getState().isOpen) {
      if (closeTo) { navigate(closeTo, { replace: true }); return; }
      console.error('[PostDeepLink] fullscreen open() refused the post', feedPost.id);
      setNotFound(true);
    }



  }, [authLoading, user, isLoading, feedPost, navigate, navState, searchParams, closeTo]);

  // --- Loading ---
  if (isLoading || authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: POST_DEEP_LINK_CANVAS }}>
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  // --- Load error (network/query failure) ---
  if (loadError) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6" style={{ backgroundColor: POST_DEEP_LINK_CANVAS }}>
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-white text-[17px] font-semibold">Couldn't load this post</p>
        <p className="text-white/50 text-[13px] mt-1">Check your connection and try again.</p>
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => setRetryTick((t) => t + 1)}
            className="px-5 py-2.5 rounded-full text-[14px] font-semibold text-[#0F172A]"
            style={{ background: '#F7931E' }}
          >
            Retry
          </button>
          <button
            onClick={() => navigate('/clubhouse')}
            className="px-5 py-2.5 rounded-full text-[14px] font-medium text-white/80"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Go to Clubhouse
          </button>
        </div>
      </div>
    );
  }

  // --- Not found ---
  // A signed-in member with no feedPost can NEVER fall through to the scrim:
  // the scrim is only correct while the overlay is genuinely about to mount.
  if (notFound || !post || (user && !feedPost)) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6" style={{ backgroundColor: POST_DEEP_LINK_CANVAS }}>
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-2xl">⛳</span>
        </div>
        <p className="text-white text-[17px] font-semibold">This post isn't available</p>
        <button
          onClick={() => navigate('/auth')}
          className="mt-4 px-5 py-2.5 rounded-full text-[14px] font-medium text-white/80"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Go to clbhouz
        </button>
      </div>
    );
  }

  // --- Logged-in: the global FullscreenFeedOverlay renders above everything.
  //     Render a black scrim so we don't flash the guest viewer behind it. ---
  if (user) {
    return <div className="fixed inset-0 bg-black z-40" aria-hidden="true" />;
  }

  // --- Full-screen post viewer (unauthenticated guest) ---
  const profile = post.user_profiles;
  const course = post.golf_courses;
  const mediaUrl = post.media_urls?.[0] ?? null;
  const gradient = GRADIENTS[post.id.charCodeAt(0) % GRADIENTS.length];
  const displayName = profile?.display_name || profile?.username || 'Clbhouz Member';
  const username = profile?.username || '';
  const isVideo = mediaUrl ? isVideoUrl(mediaUrl) : false;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: POST_DEEP_LINK_CANVAS }}>
      {/* Full-screen media */}
      <div className="absolute inset-0" style={{ background: gradient }}>
        {mediaUrl && isVideo && (
          <img
            src={mediaUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        {mediaUrl && !isVideo && (
          <img
            src={mediaUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {/* Bottom gradient scrim */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)' }}
        />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top logo bar */}
        <div className="flex items-center justify-center pt-[max(env(safe-area-inset-top,0px),12px)] pb-2">
          <span className="text-white/60 font-bold text-[14px] tracking-tight">clbhouz</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Author + caption overlay */}
        <div className="px-4 pb-3">
          {/* Course tag */}
          {course && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-white/90 mb-3"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
            >
              <MapPin className="w-3 h-3" />
              {course.name}
            </div>
          )}

          {/* Author row */}
          <div className="flex items-center gap-2.5 mb-2">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-9 h-9 rounded-full object-cover border border-white/10"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold"
                style={{
                  /* Shared hue — the same tile as the feed and the profile. */
                  background: getAvatarFallbackGradient(profile?.id || displayName),
                  color: 'rgba(248,250,252,0.82)',
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-white text-[14px] font-semibold leading-tight">{displayName}</span>
              {username && (
                <span className="text-white/40 text-[12px] leading-tight">@{username}</span>
              )}
            </div>
          </div>

          {/* Caption */}
          {post.caption && (
            <div className="text-white/80 text-[13px] leading-[1.45] line-clamp-3">
              <MentionText text={post.caption} />
            </div>
          )}
        </div>

        {/* Guest action bar */}
        <div
          className="px-4 pt-4 pb-[max(env(safe-area-inset-bottom,0px),16px)]"
          style={{
            background: `linear-gradient(to top, ${surfaceWithAlpha(POST_DEEP_LINK_CANVAS, 0.95)} 0%, ${surfaceWithAlpha(POST_DEEP_LINK_CANVAS, 0.8)} 100%)`,
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="mb-1">
            <span className="text-white text-[15px] font-semibold">
              Join golf's digital clubhouse
            </span>
          </div>
          <div className="mb-3">
            <span className="text-white/50 text-[12px]">
              Create a free account to like, comment and share
            </span>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="w-full h-[48px] rounded-xl font-semibold text-[14px] active:scale-[0.98] transition-all"
            style={{
              background: 'white',
              color: INK_ON_LIGHT,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            Create free account
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostDeepLinkPage;
