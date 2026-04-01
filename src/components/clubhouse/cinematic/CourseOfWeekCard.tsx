import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Flag } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseOfWeekCardFeedPost } from '@/components/media-system/types/media';
import CourseRankBadges from '@/components/courses/CourseRankBadges';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { EchoContextualButton } from '@/components/echo/EchoContextualButton';

interface CourseOfWeekCardProps {
  post: CourseOfWeekCardFeedPost;
  onComment: () => void;
  onLike?: () => void;
  getLikeState?: (post: any) => { isLiked: boolean; count: number };
  getCommentCount?: (post: any) => number;
  currentUserId?: string;
}

export const CourseOfWeekCard: React.FC<CourseOfWeekCardProps> = ({
  post,
  onComment,
  onLike,
  getLikeState,
  getCommentCount,
  currentUserId,
}) => {
  const navigate = useNavigate();
  
  const card = post.cardData;
  const course = card.course;

  const [localLiked, setLocalLiked] = useState(false);
  const [localCount, setLocalCount] = useState(card.reactionCount ?? 0);
  const [hasPlayed, setHasPlayed] = useState(false);

  const { data: commentCount } = useQuery({
    queryKey: ['editorial-card-comments-count', card.cardId],
    queryFn: async () => {
      const { count } = await supabase
        .from('editorial_card_comments')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', card.cardId)
        .is('deleted_at', null);
      return count ?? 0;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!currentUserId) return;
    supabase
      .from('editorial_card_likes')
      .select('id')
      .eq('card_id', card.cardId)
      .eq('user_id', currentUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setLocalLiked(true);
      });
  }, [card.cardId, currentUserId]);

  const checkHasPlayed = useCallback(async () => {
    if (!currentUserId || !course.id) return;
    const { data } = await supabase
      .from('course_ratings')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('course_id', course.id)
      .maybeSingle();
    setHasPlayed(!!data);
  }, [currentUserId, course.id]);

  useEffect(() => {
    checkHasPlayed();
  }, [checkHasPlayed]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkHasPlayed();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkHasPlayed]);

  const { data: likeCountData } = useQuery({
    queryKey: ['editorial-card-likes-count', card.cardId],
    queryFn: async () => {
      const { count } = await supabase
        .from('editorial_card_likes')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', card.cardId);
      return count ?? 0;
    },
    staleTime: 30_000,
  });

  const queryClient = useQueryClient();

  // Use likeCountData only to seed the initial count on mount
  // After that, localCount is the source of truth for optimistic updates
  useEffect(() => {
    if (likeCountData !== undefined && likeCountData !== null) {
      setLocalCount(likeCountData);
    }
  }, [likeCountData]);

  const displayCount = localCount;

  const handleLike = async () => {
    if (!currentUserId) return;
    const newIsLiked = !localLiked;
    setLocalLiked(newIsLiked);
    setLocalCount(c => newIsLiked ? c + 1 : c - 1);
    try {
      if (newIsLiked) {
        await supabase
          .from('editorial_card_likes')
          .upsert(
            { card_id: card.cardId, user_id: currentUserId },
            { onConflict: 'card_id,user_id' }
          );
      } else {
        await supabase
          .from('editorial_card_likes')
          .delete()
          .eq('card_id', card.cardId)
          .eq('user_id', currentUserId);
      }
      // Invalidate both query keys so CommentsSheet and count stay in sync
      queryClient.invalidateQueries({ queryKey: ['editorial-card-likes-count', card.cardId] });
      queryClient.invalidateQueries({ queryKey: ['post-likes', card.cardId, 'editorial'] });
    } catch {
      setLocalLiked(!newIsLiked);
      setLocalCount(c => newIsLiked ? c - 1 : c + 1);
    }
  };

  const heroSrc = course.thumbnailImage;

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* Hero image */}
      {heroSrc ? (
        <img
          src={heroSrc}
          alt={course.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          draggable={false}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #0a1f0a, #0d0d0d)' }} />
      )}

      {/* Top gradient */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%)',
          pointerEvents: 'none',
        }}
      />
      {/* Bottom gradient */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top left badge */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 52px)',
          left: 16,
          zIndex: 2,
        }}
      >
        <span className="glass-badge-tight" style={{ width: 'auto', minWidth: 'auto', padding: '3px 10px', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#fff' }}>
          COURSE OF THE WEEK
        </span>
      </div>

      {/* Top right rank */}
      {(course.globalRank || course.regionalRank || course.usaRank) && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 52px)',
            right: 16,
            zIndex: 2,
          }}
        >
          <CourseRankBadges
            globalRank={course.globalRank ?? null}
            regionalRank={course.regionalRank ?? null}
            usaRank={course.usaRank ?? null}
            country={course.country ?? ''}
            positioning="inline"
            showAverageRating={false}
            showUserRating={false}
          />
        </div>
      )}

      {/* Bottom content */}
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: `0 16px calc(env(safe-area-inset-bottom, 0px) + 24px) 16px`,
          zIndex: 2,
        }}
      >
        {/* Course name & location */}
        <h2
          style={{
            fontSize: 28, fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em', lineHeight: 1.1,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            margin: 0,
          }}
        >
          {course.name}
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
          {[course.country, course.subCountry].filter(Boolean).join(' · ')}
        </p>

        {/* Friends strip */}
        {course.friendsWhoPlayed.length > 0 && (() => {
          const ratedFriends = course.friendsWhoPlayed.filter(f => f.rating);
          const avgRating = ratedFriends.length > 0
            ? (ratedFriends.reduce((sum, f) => sum + (f.rating ?? 0), 0) / ratedFriends.length).toFixed(1)
            : null;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <div style={{ display: 'flex' }}>
                {course.friendsWhoPlayed.slice(0, 3).map((f, i) => (
                  <div
                    key={f.userId}
                    style={{
                      width: 28, height: 28, borderRadius: '34%',
                      border: '0.5px solid #000', overflow: 'hidden',
                      background: 'rgba(255,255,255,0.1)',
                      marginLeft: i > 0 ? -8 : 0,
                    }}
                  >
                    {f.avatarUrl ? (
                      <img src={f.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                        {f.displayName?.[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                  {course.friendsWhoPlayed.map(f => f.displayName.split(' ')[0]).slice(0, 2).join(', ')}
                  {course.friendsWhoPlayed.length > 2 && ` & ${course.friendsWhoPlayed.length - 2} others`} have played here
                </span>
                {avgRating && (
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#F7931E' }}>
                    {avgRating}
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Editorial blurb */}
        {(card.editorialBlurb || card.body) && (
          <p
            style={{
              fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6,
              marginTop: 14,
              display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
            }}
          >
            {card.editorialBlurb || card.body}
          </p>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {[
            { label: 'Rating', value: course.communityRating?.toFixed(1) ?? '—' },
            { label: 'Reviews', value: String(course.reviewCount) },
            { label: 'Friends', value: String(course.friendsWhoPlayed.length) },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 12, textAlign: 'center' as const,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {stat.label === 'Rating' && <ClubhouseLogo size="sm" />}
                {stat.value}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Echo — course contextual */}
        <div style={{ marginTop: 12 }}>
          <EchoContextualButton
            prompt={`Tell me about ${course.name}${course.subCountry ? ` in ${course.subCountry}` : ''}${course.country ? `, ${course.country}` : ''} — what's it like to play, best holes, and any tips?`}
            label={`Ask Echo about ${course.name}`}
            sublabel="Playing tips · best holes · local knowledge"
            source="course_of_week"
          />
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            onClick={() => navigate(`/courses/${course.id}`)}
            className="active:scale-[0.97] transition-transform"
            style={{
              flex: 1, height: 48, borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #F7931E, #e07010)',
              color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(247,147,30,0.35)',
            }}
          >
            View Course
          </button>
          <button
            onClick={() => {
              if (hasPlayed) {
                navigate(`/courses/${course.id}`);
              } else {
                setHasPlayed(true);
                navigate(`/courses/${course.id}/rate`);
              }
            }}
            className="active:scale-[0.97] transition-transform"
            style={{
              flex: 1, height: 48, borderRadius: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 14, fontWeight: 700,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
            }}
          >
            {hasPlayed ? <><span>⛳</span><span>Played</span></> : <><span>⛳</span><span>Mark as Played</span></>}
          </button>
        </div>

        {/* Engagement row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            onClick={handleLike}
            className="active:scale-[0.95] transition-transform"
            style={{
              flex: 1, height: 48, borderRadius: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: localLiked ? 'rgba(247,147,30,0.15)' : 'rgba(0,0,0,0.45)',
              border: `1px solid ${localLiked ? 'rgba(247,147,30,0.4)' : 'rgba(255,255,255,0.2)'}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <Heart
              size={17}
              fill={localLiked ? '#F7931E' : 'none'}
              style={{ color: localLiked ? '#F7931E' : 'rgba(255,255,255,0.5)' }}
            />
            {displayCount > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: localLiked ? '#F7931E' : 'rgba(255,255,255,0.5)' }}>
                {displayCount}
              </span>
            )}
          </button>
          <button
            onClick={onComment}
            className="active:scale-[0.95] transition-transform"
            style={{
              flex: 1, height: 48, borderRadius: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <MessageCircle size={17} style={{ color: 'rgba(255,255,255,0.6)' }} />
            {(commentCount ?? 0) > 0 && (
              <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                {commentCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default CourseOfWeekCard;
