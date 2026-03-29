import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Share2, Bookmark, BookmarkCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CourseOfWeekCardFeedPost } from '@/components/media-system/types/media';

interface CourseOfWeekCardProps {
  post: CourseOfWeekCardFeedPost;
  onComment?: () => void;
  currentUserId?: string;
}

export const CourseOfWeekCard: React.FC<CourseOfWeekCardProps> = ({ post, onComment, currentUserId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const card = post.cardData;
  const course = card.course;
  const [wantToPlay, setWantToPlay] = useState(course.isOnMyWantToPlay);

  const handleWantToPlay = async () => {
    if (!currentUserId) {
      toast.error('Sign in to save courses');
      return;
    }

    const prev = wantToPlay;
    setWantToPlay(!prev);

    try {
      if (prev) {
        await (supabase
          .from('user_courses')
          .delete()
          .eq('user_id', currentUserId)
          .eq('course_id', course.id)
          .eq('status', 'want_to_play') as any);
      } else {
        await (supabase
          .from('user_courses')
          .upsert({
            user_id: currentUserId,
            course_id: course.id,
            status: 'want_to_play',
          } as any, { onConflict: 'user_id,course_id' }) as any);
      }
      queryClient.invalidateQueries({ queryKey: ['editorial-cards'] });
    } catch {
      setWantToPlay(prev);
      toast.error("Couldn't save — try again");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share?.({ title: course.name, url: `${window.location.origin}/courses/${course.id}` });
    } catch {}
  };

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: 'linear-gradient(145deg, #001a10, #0d0d0d)' }}
    >
      {/* Atmospheric overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.08), transparent 60%)',
        }}
      />

      {/* Hero image section */}
      <div
        className="relative w-full flex-shrink-0"
        style={{
          height: 200,
          background: course.thumbnailImage
            ? `url(${course.thumbnailImage}) center/cover`
            : 'linear-gradient(135deg, rgba(34,197,94,0.2), transparent)',
        }}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,26,16,0.3) 0%, rgba(0,26,16,0.95) 100%)',
          }}
        />
        {/* Top left badge */}
        <div className="absolute top-4 left-4 z-10">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide"
            style={{
              background: 'rgba(34,197,94,0.2)',
              color: '#22C55E',
              border: '1px solid rgba(34,197,94,0.3)',
            }}
          >
            ● COURSE OF THE WEEK
          </span>
        </div>
        {/* Top right rank */}
        {course.globalRank && (
          <div className="absolute top-4 right-4 z-10">
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{
                background: 'rgba(0,0,0,0.6)',
                color: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
              }}
            >
              🌍 #{course.globalRank}
            </span>
          </div>
        )}
        {/* Bottom left: name + location */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
            {course.name}
          </h2>
          <p className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {[course.country, course.subCountry].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* Content area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Rating', value: course.communityRating?.toFixed(1) ?? '—' },
            { label: 'Reviews', value: String(course.reviewCount) },
            { label: 'Friends', value: String(course.friendsWhoPlayed.length) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center rounded-[10px] py-2.5"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="text-[16px] font-bold text-white">{stat.value}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Editorial blurb */}
        {(card.editorialBlurb || card.body) && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
            {card.editorialBlurb || card.body}
          </p>
        )}

        {/* Friends strip */}
        {course.friendsWhoPlayed.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {course.friendsWhoPlayed.slice(0, 3).map((f) => (
                <div
                  key={f.userId}
                  className="w-7 h-7 rounded-full border-2 overflow-hidden"
                  style={{ borderColor: '#0d0d0d', background: 'rgba(255,255,255,0.1)' }}
                >
                  {f.avatarUrl ? (
                    <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/50">
                      {f.displayName?.[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {course.friendsWhoPlayed.map(f => f.displayName.split(' ')[0]).slice(0, 2).join(', ')}
              {course.friendsWhoPlayed.length > 2 && ` & ${course.friendsWhoPlayed.length - 2} others`} have played here
            </span>
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/courses/${course.id}`)}
            className="flex-1 py-3 rounded-xl text-[14px] font-bold text-white active:scale-[0.97] transition-transform"
            style={{
              background: 'linear-gradient(135deg, #F7931E, #e67e00)',
            }}
          >
            View Course
          </button>
          <button
            onClick={handleWantToPlay}
            className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl text-[14px] font-semibold active:scale-[0.97] transition-transform"
            style={{
              background: wantToPlay ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${wantToPlay ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: wantToPlay ? '#22C55E' : 'rgba(255,255,255,0.7)',
            }}
          >
            {wantToPlay ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {wantToPlay ? 'Saved' : 'Want to Play'}
          </button>
        </div>

        {/* Engagement row */}
        <div className="flex items-center gap-5 pt-1">
          <button
            onClick={onComment}
            className="flex items-center gap-1.5 active:scale-[0.95] transition-transform"
          >
            <MessageCircle className="w-[18px] h-[18px]" style={{ color: 'rgba(255,255,255,0.5)' }} />
            <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {card.commentCount || 0}
            </span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 active:scale-[0.95] transition-transform"
          >
            <Share2 className="w-[18px] h-[18px]" style={{ color: 'rgba(255,255,255,0.5)' }} />
            <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseOfWeekCard;
