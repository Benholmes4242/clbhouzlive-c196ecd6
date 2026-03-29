import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HistoryCardFeedPost } from '@/components/media-system/types/media';
import type { FeedPost } from '@/components/media-system/types/media';

interface HistoryCardProps {
  post: HistoryCardFeedPost;
  onComment: () => void;
  onLike: () => void;
  getLikeState?: (post: FeedPost) => { isLiked: boolean; count: number };
  getCommentCount?: (post: FeedPost) => number;
  currentUserId?: string;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  post,
  onComment,
  onLike,
  getLikeState,
  getCommentCount,
  currentUserId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const card = post.cardData;
  const linkedCourse = card.linkedCourse;
  const [expanded, setExpanded] = useState(false);

  const hasHeroImage = !!linkedCourse?.thumbnailImage;

  // ── Like state ──
  const { data: likeData } = useQuery({
    queryKey: ['editorial-card-likes', card.cardId, currentUserId],
    queryFn: async () => {
      const { count } = await supabase
        .from('editorial_card_likes')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', card.cardId);

      let hasLiked = false;
      if (currentUserId) {
        const { data } = await supabase
          .from('editorial_card_likes')
          .select('id')
          .eq('card_id', card.cardId)
          .eq('user_id', currentUserId)
          .maybeSingle();
        hasLiked = !!data;
      }
      return { count: count ?? 0, hasLiked };
    },
    staleTime: 30_000,
  });

  const [optimisticLike, setOptimisticLike] = useState<{ isLiked: boolean; count: number } | null>(null);

  const handleLike = useCallback(async () => {
    if (!currentUserId) return;
    const current = optimisticLike ?? { isLiked: likeData?.hasLiked ?? false, count: likeData?.count ?? 0 };
    const newLiked = !current.isLiked;
    setOptimisticLike({ isLiked: newLiked, count: current.count + (newLiked ? 1 : -1) });

    try {
      if (newLiked) {
        await supabase.from('editorial_card_likes').insert({ card_id: card.cardId, user_id: currentUserId });
      } else {
        await supabase.from('editorial_card_likes').delete().eq('card_id', card.cardId).eq('user_id', currentUserId);
      }
      queryClient.invalidateQueries({ queryKey: ['editorial-card-likes', card.cardId, currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['editorial-card-likes-count', card.cardId] });
    } catch {
      setOptimisticLike(null);
    }
  }, [currentUserId, optimisticLike, likeData, card.cardId, queryClient]);

  const isLiked = optimisticLike?.isLiked ?? likeData?.hasLiked ?? false;
  const likeCount = optimisticLike?.count ?? likeData?.count ?? 0;

  // ── Comment count ──
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

  return (
    <div className="absolute inset-0" style={{ background: '#080600' }}>
      {/* ── Background ── */}
      {hasHeroImage ? (
        <>
          <img
            src={linkedCourse!.thumbnailImage!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          {/* Top gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 35%)' }}
          />
          {/* Bottom gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.2) 75%, transparent 100%)' }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(145deg, #0f0c00, #080600, #0d0d0d)' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 30% 10%, rgba(255,215,0,0.09), transparent 60%)' }}
          />
        </>
      )}

      {/* ── Top left: eyebrow label ── */}
      <div
        className="absolute"
        style={{
          top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 5px)',
          left: 16,
          zIndex: 10,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(255,215,0,0.12)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 999,
            padding: '5px 12px',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            color: 'rgba(255,215,0,0.9)',
          }}
        >
          📜 THIS WEEK IN HISTORY
        </span>
      </div>

      {/* ── Top right: date ── */}
      {card.historyDate && (
        <div
          className="absolute"
          style={{
            top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 10px)',
            right: 16,
            zIndex: 10,
            fontSize: 13,
            fontWeight: 700,
            color: 'rgba(255,215,0,0.7)',
          }}
        >
          {card.historyDate}
        </div>
      )}

      {/* ── Bottom content stack ── */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '45%',
          bottom: 0,
          padding: '0 20px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        {/* Year watermark */}
        {card.historyYear > 0 && (
          <div
            className="select-none"
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: 'rgba(255,215,0,0.12)',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              marginBottom: -4,
            }}
          >
            {card.historyYear}
          </div>
        )}

        {/* Headline */}
        <h2
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            marginBottom: 10,
            textShadow: '0 2px 16px rgba(0,0,0,0.6)',
          }}
        >
          {card.title}
        </h2>

        {/* Body text */}
        {card.body && (
          <div style={{ marginBottom: 14 }}>
            <p
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.6,
                ...(!expanded ? {
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                } : {}),
              }}
            >
              {expanded && card.bodyExtended ? card.bodyExtended : card.body}
            </p>
            {card.bodyExtended && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255,215,0,0.8)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                Read more
              </button>
            )}
          </div>
        )}

        {/* Course link card */}
        {linkedCourse && (
          <button
            onClick={() => navigate(`/courses/${linkedCourse.id}`)}
            className="w-full text-left active:scale-[0.97] transition-transform"
            style={{
              padding: '12px 14px',
              background: 'rgba(247,147,30,0.12)',
              border: '1px solid rgba(247,147,30,0.25)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              cursor: 'pointer',
            }}
          >
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#F7931E',
                  textTransform: 'uppercase' as const,
                  marginBottom: 3,
                }}
              >
                COURSE ON CLBHOUZ
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {linkedCourse.name}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: 2,
                }}
              >
                {linkedCourse.globalRank ? `🌍 #${linkedCourse.globalRank} · ` : ''}{linkedCourse.reviewCount} reviews
              </span>
            </div>
            <span
              style={{
                background: '#F7931E',
                color: '#000',
                fontSize: 12,
                fontWeight: 800,
                padding: '8px 14px',
                borderRadius: 10,
                flexShrink: 0,
              }}
            >
              View →
            </span>
          </button>
        )}

        {/* Engagement row */}
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Like button */}
          <button
            onClick={handleLike}
            className="active:scale-[0.95] transition-transform"
            style={{
              flex: 1,
              height: 48,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: isLiked ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.08)',
              border: isLiked ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
            }}
          >
            <Heart
              style={{
                width: 17,
                height: 17,
                color: isLiked ? '#FFD700' : 'rgba(255,255,255,0.5)',
                fill: isLiked ? '#FFD700' : 'none',
              }}
            />
            {likeCount > 0 && (
              <span style={{ fontSize: 14, fontWeight: 700, color: isLiked ? '#FFD700' : 'rgba(255,255,255,0.7)' }}>
                {likeCount}
              </span>
            )}
          </button>

          {/* Comment button */}
          <button
            onClick={onComment}
            className="active:scale-[0.95] transition-transform"
            style={{
              flex: 1,
              height: 48,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
            }}
          >
            <MessageCircle style={{ width: 17, height: 17, color: 'rgba(255,255,255,0.6)' }} />
            {(commentCount ?? 0) > 0 && (
              <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                {commentCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryCard;
