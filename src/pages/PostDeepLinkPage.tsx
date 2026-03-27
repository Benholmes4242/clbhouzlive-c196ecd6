import React, { useEffect, useState } from 'react';
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

const PostDeepLinkPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();

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

  // Once auth resolves, logged-in users go straight to Clubhouse
  useEffect(() => {
    if (!authLoading && user && !isLoading) {
      navigate('/clubhouse', { replace: true });
    }
  }, [authLoading, user, isLoading, navigate]);

  // --- Loading state ---
  if (isLoading || authLoading) {
    return (
      <div className="fixed inset-0 bg-[#0D0F11] flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  // --- Not found state ---
  if (notFound || !post) {
    return (
      <div className="fixed inset-0 bg-[#0D0F11] flex flex-col items-center justify-center z-50 px-6">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-2xl">⛳</span>
        </div>
        <p className="text-white text-[17px] font-semibold">This post isn't available</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-5 py-2.5 rounded-full text-[14px] font-medium text-white/80"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Go to Clbhouz
        </button>
      </div>
    );
  }

  // --- Post preview (unauthenticated) ---
  const profile = post.user_profiles;
  const course = post.golf_courses;
  const thumbUrl = post.media_urls?.[0] ?? null;
  const gradient = GRADIENTS[post.id.charCodeAt(0) % GRADIENTS.length];
  const displayName = profile?.display_name || profile?.username || 'Clbhouz Member';
  const username = profile?.username || '';

  return (
    <div className="fixed inset-0 bg-[#0D0F11] z-50 flex flex-col overflow-y-auto">
      {/* Logo bar */}
      <div className="flex items-center justify-center py-5">
        <span className="text-white font-bold text-[18px] tracking-tight">clbhouz</span>
      </div>

      {/* Post card */}
      <div className="flex-1 flex flex-col items-center px-4 pb-4">
        <div
          className="w-full max-w-[420px] rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Media thumbnail */}
          <div className="relative w-full aspect-[4/5] overflow-hidden" style={{ background: gradient }}>
            {thumbUrl && (
              <img
                src={thumbUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            {/* Gradient scrim */}
            <div
              className="absolute inset-x-0 bottom-0 h-1/3"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
            />
            {/* Course tag */}
            {course && (
              <div
                className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-white/90"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
              >
                <MapPin className="w-3 h-3" />
                {course.name}
              </div>
            )}
          </div>

          {/* Author + caption */}
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-2.5 mb-2">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover"
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
            {post.caption && (
              <p className="text-white/70 text-[13px] leading-[1.45] line-clamp-4">
                {post.caption}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="px-5 pb-5 pt-2 flex flex-col gap-3 w-full max-w-[420px] mx-auto">
        {/* Primary — open in app */}
        <a
          href={`clbhouz://post/${postId}`}
          className="w-full h-[52px] flex items-center justify-center rounded-full font-semibold text-[15px] text-[#0D0F11] transition-all active:scale-[0.98]"
          style={{
            background: 'white',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          Open in Clbhouz
        </a>

        {/* Secondary — sign up */}
        <button
          onClick={() => navigate('/auth')}
          className="w-full h-[52px] flex items-center justify-center rounded-full text-[14px] font-medium transition-all active:scale-[0.98]"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          Join Clbhouz
        </button>
      </div>

      {/* Footer */}
      <div className="py-4 flex items-center justify-center">
        <span className="text-white/25 text-[11px]">clbhouz · golf's digital clubhouse</span>
      </div>
    </div>
  );
};

export default PostDeepLinkPage;
