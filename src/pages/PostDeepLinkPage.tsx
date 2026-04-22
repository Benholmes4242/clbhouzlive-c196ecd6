import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Loader2, MapPin } from 'lucide-react';

interface PostPreview {
  id: string;
  caption: string | null;
  media_urls: string[] | null;
  post_type: string | null;
  created_at: string;
  user_profiles: {
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
  const { user, loading: authLoading } = useSupabaseSession();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [post, setPost] = useState<PostPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadPost() {
      if (!postId) { setNotFound(true); setIsLoading(false); return; }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          caption,
          media_urls,
          post_type,
          created_at,
          user_profiles!inner (
            username,
            display_name,
            avatar_url
          ),
          golf_courses (
            name,
            country
          )
        `)
        .eq('id', postId)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPost(data as unknown as PostPreview);
      }
      setIsLoading(false);
    }

    loadPost();
  }, [postId]);

  // Logged-in users: go to Clubhouse and open the post's comments sheet
  useEffect(() => {
    if (!authLoading && user && !isLoading && postId) {
      navigate('/', {
        replace: true,
        state: {
          deepLinkPostId: postId,
          openComments: true,
        },
      });
    }
  }, [authLoading, user, isLoading, navigate, postId]);

  // --- Loading ---
  if (isLoading || authLoading) {
    return (
      <div className="fixed inset-0 bg-[#0D0F11] flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  // --- Not found ---
  if (notFound || !post) {
    return (
      <div className="fixed inset-0 bg-[#0D0F11] flex flex-col items-center justify-center z-50 px-6">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-2xl">⛳</span>
        </div>
        <p className="text-white text-[17px] font-semibold">This post isn't available</p>
        <button
          onClick={() => navigate('/auth')}
          className="mt-4 px-5 py-2.5 rounded-full text-[14px] font-medium text-white/80"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Go to Clbhouz
        </button>
      </div>
    );
  }

  // --- Full-screen post viewer (unauthenticated) ---
  const profile = post.user_profiles;
  const course = post.golf_courses;
  const mediaUrl = post.media_urls?.[0] ?? null;
  const gradient = GRADIENTS[post.id.charCodeAt(0) % GRADIENTS.length];
  const displayName = profile?.display_name || profile?.username || 'Clbhouz Member';
  const username = profile?.username || '';
  const isVideo = mediaUrl ? isVideoUrl(mediaUrl) : false;

  return (
    <div className="fixed inset-0 bg-[#0D0F11] z-50 flex flex-col">
      {/* Full-screen media */}
      <div className="absolute inset-0" style={{ background: gradient }}>
        {mediaUrl && isVideo && (
          <video
            ref={videoRef}
            src={mediaUrl}
            autoPlay
            loop
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
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
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-[13px] font-semibold">
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
            <p className="text-white/80 text-[13px] leading-[1.45] line-clamp-3">
              {post.caption}
            </p>
          )}
        </div>

        {/* Guest action bar */}
        <div
          className="px-4 pt-4 pb-[max(env(safe-area-inset-bottom,0px),16px)]"
          style={{
            background: 'linear-gradient(to top, rgba(13,15,17,0.95) 0%, rgba(13,15,17,0.8) 100%)',
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
            className="w-full h-[48px] rounded-xl font-semibold text-[14px] text-[#0D0F11] active:scale-[0.98] transition-all"
            style={{
              background: 'white',
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
