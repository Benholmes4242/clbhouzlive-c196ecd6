import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Flag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseOfWeekCardFeedPost } from '@/components/media-system/types/media';

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

  const displayCount = likeCountData ?? localCount;

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
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 999,
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.4)',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: '#22C55E',
            textTransform: 'uppercase' as const,
          }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#22C55E',
              animation: 'pulse 2s infinite',
            }}
          />
          COURSE OF THE WEEK
        </span>
      </div>

      {/* Top right rank */}
      {course.globalRank && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 52px)',
            right: 16,
            zIndex: 2,
          }}
        >
          <span
            style={{
              padding: '5px 10px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)',
              fontSize: 12,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            🌍 #{course.globalRank}
          </span>
        </div>
      )}

      {/* Bottom content */}
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: `0 20px calc(env(safe-area-inset-bottom, 0px) + 90px) 20px`,
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
        {course.friendsWhoPlayed.length > 0 && (
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
              {(() => {
                const ratings = course.friendsWhoPlayed.filter(f => f.rating != null).map(f => f.rating!);
                if (ratings.length === 0) return null;
                const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
                return <span style={{ fontSize: 13, fontWeight: 700, color: '#F7931E' }}>{avg.toFixed(1)}</span>;
              })()}
            </div>
          </div>
        )}

        {/* Editorial blurb */}
        {(card.editorialBlurb || card.body) && (
          <p
            style={{
              fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6,
              marginTop: 14,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
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
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{stat.value}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
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
            onClick={() => navigate(`/courses/${course.id}/rate`)}
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
            <Flag size={16} />
            Mark as Played
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
              background: localLiked ? 'rgba(247,147,30,0.15)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${localLiked ? 'rgba(247,147,30,0.4)' : 'rgba(255,255,255,0.12)'}`,
            }}
          >
            <Heart
              size={17}
              fill={localLiked ? '#F7931E' : 'none'}
              style={{ color: localLiked ? '#F7931E' : 'rgba(255,255,255,0.5)' }}
            />
            {localCount > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: localLiked ? '#F7931E' : 'rgba(255,255,255,0.5)' }}>
                {localCount}
              </span>
            )}
          </button>
          <button
            onClick={onComment}
            className="active:scale-[0.95] transition-transform"
            style={{
              flex: 1, height: 48, borderRadius: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <MessageCircle size={17} style={{ color: 'rgba(255,255,255,0.6)' }} />
            {(getCommentCount?.(post) ?? card.commentCount ?? 0) > 0 && (
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                {getCommentCount?.(post) ?? card.commentCount ?? 0}
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
