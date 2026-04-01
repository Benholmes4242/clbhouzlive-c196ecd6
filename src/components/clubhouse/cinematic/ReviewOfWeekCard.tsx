import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, ThumbsUp, Share2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/utils/haptics';
import type { ReviewOfWeekCardFeedPost } from '@/components/media-system/types/media';
import type { FeedPost } from '@/components/media-system/types/media';

const AMBER = '#F7931E';

interface ReviewOfWeekCardProps {
  post: ReviewOfWeekCardFeedPost;
  onComment: () => void;
  onLike: () => void;
  getLikeState?: (post: FeedPost) => { isLiked: boolean; count: number };
  getCommentCount?: (post: FeedPost) => number;
  currentUserId?: string;
}

function BreakdownBar({ label, score }: { label: string; score: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 64, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${(score / 10) * 100}%`, height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${AMBER}, #FFB347)` }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', width: 24, textAlign: 'right' }}>{score.toFixed(1)}</span>
    </div>
  );
}

export const ReviewOfWeekCard: React.FC<ReviewOfWeekCardProps> = ({
  post, onComment, onLike, getLikeState, getCommentCount, currentUserId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const card = post.cardData;
  const [expanded, setExpanded] = useState(false);

  // ── Like state (reuses editorial_card_likes) ──
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
    haptic('light');
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
    } catch { setOptimisticLike(null); }
  }, [currentUserId, optimisticLike, likeData, card.cardId, queryClient]);

  // ── Helpful vote ──
  const [helpfulOptimistic, setHelpfulOptimistic] = useState<{ isHelpful: boolean; count: number } | null>(null);
  const { data: helpfulData } = useQuery({
    queryKey: ['review-helpful', card.reviewId, currentUserId],
    queryFn: async () => {
      const { data: rating } = await supabase
        .from('course_ratings')
        .select('helpful_count')
        .eq('id', card.reviewId)
        .single();
      let isHelpful = false;
      if (currentUserId) {
        const { data: vote } = await supabase
          .from('course_review_votes')
          .select('vote_type')
          .eq('rating_id', card.reviewId)
          .eq('user_id', currentUserId)
          .maybeSingle();
        isHelpful = vote?.vote_type === 'helpful';
      }
      return { count: rating?.helpful_count ?? card.helpfulCount, isHelpful };
    },
    staleTime: 30_000,
  });

  const handleHelpful = useCallback(async () => {
    if (!currentUserId) return;
    haptic('light');
    const current = helpfulOptimistic ?? { isHelpful: helpfulData?.isHelpful ?? false, count: helpfulData?.count ?? card.helpfulCount };
    const newHelpful = !current.isHelpful;
    setHelpfulOptimistic({ isHelpful: newHelpful, count: current.count + (newHelpful ? 1 : -1) });
    try {
      if (newHelpful) {
        await supabase.from('course_review_votes').upsert(
          { rating_id: card.reviewId, user_id: currentUserId, vote_type: 'helpful' },
          { onConflict: 'rating_id,user_id' }
        );
      } else {
        await supabase.from('course_review_votes').delete().eq('rating_id', card.reviewId).eq('user_id', currentUserId);
      }
      queryClient.invalidateQueries({ queryKey: ['review-helpful', card.reviewId, currentUserId] });
    } catch { setHelpfulOptimistic(null); }
  }, [currentUserId, helpfulOptimistic, helpfulData, card.reviewId, card.helpfulCount, queryClient]);

  const isLiked = optimisticLike?.isLiked ?? likeData?.hasLiked ?? false;
  const likeCount = optimisticLike?.count ?? likeData?.count ?? 0;
  const isHelpful = helpfulOptimistic?.isHelpful ?? helpfulData?.isHelpful ?? false;
  const helpfulCount = helpfulOptimistic?.count ?? helpfulData?.count ?? card.helpfulCount;

  const truncated = card.reviewText.length > 220 && !expanded;
  const displayText = truncated ? card.reviewText.slice(0, 220) + '…' : card.reviewText;

  const breakdowns = [
    { label: 'Design', score: card.designScore },
    { label: 'Condition', score: card.conditionScore },
    { label: 'Clubhouse', score: card.clubhouseScore },
    { label: 'Facilities', score: card.facilitiesScore },
  ].filter(b => b.score != null) as { label: string; score: number }[];

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className="absolute inset-0 overflow-y-auto scrollbar-hide"
      style={{ background: '#0d0f0e' }}
    >
      {/* ── Hero ── */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', overflow: 'hidden' }}>
        {card.course.thumbnailImage && (
          <img
            src={card.course.thumbnailImage}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(13,15,14,0.95) 90%, #0d0f0e 100%)' }} />

        {/* Trophy badge */}
        <div style={{ position: 'absolute', top: 'max(env(safe-area-inset-top, 47px), 47px)', left: 16, paddingTop: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(247,147,30,0.12)', border: '1px solid rgba(247,147,30,0.3)',
            borderRadius: 20, padding: '5px 12px',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          }}>
            <span style={{ fontSize: 14 }}>🏆</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: AMBER, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Review of the Week
            </span>
          </div>
          <div style={{ marginTop: 4, paddingLeft: 4, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
            {card.weekLabel}
          </div>
        </div>

        {/* Course name */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
          {card.course.globalRank && (
            <span style={{ fontSize: 10, color: AMBER, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              🌍 #{card.course.globalRank} World Ranking
            </span>
          )}
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {card.course.name}
          </h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2, display: 'block' }}>
            {card.course.subCountry ?? card.course.country}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '0 16px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
        {/* Reviewer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {card.reviewer.avatarUrl ? (
              <img
                src={card.reviewer.avatarUrl}
                alt=""
                style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(247,147,30,0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: AMBER,
              }}>
                {getInitials(card.reviewer.displayName)}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => navigate(`/u/${card.reviewer.username ?? card.reviewer.userId}`)}
                  style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.92)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', letterSpacing: '-0.01em' }}
                >
                  {card.reviewer.displayName}
                </button>
                {card.reviewer.isVerified && (
                  <img src="/images/brand/clubhouz-mark-white.svg" alt="Verified" style={{ width: 12, height: 12, opacity: 0.7 }} />
                )}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'flex', gap: 4, alignItems: 'center', marginTop: 1 }}>
                {card.reviewer.handicap != null && <span>HCP {card.reviewer.handicap.toFixed(1)}</span>}
                {card.reviewer.handicap != null && <span>·</span>}
                <span>{card.reviewer.reviewCount} reviews</span>
                {card.playedDate && <><span>·</span><span>{card.playedDate}</span></>}
              </div>
            </div>
          </div>

          {/* Score pill */}
          <div style={{
            background: `linear-gradient(135deg, ${AMBER}, #E8820E)`,
            borderRadius: 12, padding: '6px 12px', display: 'flex',
            alignItems: 'center', gap: 4, boxShadow: '0 4px 16px rgba(247,147,30,0.3)',
          }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'white', lineHeight: 1 }}>{card.rating.toFixed(1)}</span>
            <img src="/images/brand/clubhouz-mark-white.svg" alt="" style={{ width: 14, height: 14 }} />
          </div>
        </div>

        {/* Review text */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,0.82)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {displayText}
          </p>
          {card.reviewText.length > 220 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: AMBER, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Breakdowns */}
        {breakdowns.length > 0 && (
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
            {breakdowns.map(b => <BreakdownBar key={b.label} label={b.label} score={b.score} />)}
          </div>
        )}

        {/* Photos */}
        {card.photoUrls.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, borderRadius: 12, overflow: 'hidden' }}>
              {card.photoUrls.slice(0, 4).map((url, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  {i === 3 && card.photoUrls.length > 4 && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, color: 'white',
                    }}>
                      +{card.photoUrls.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course link */}
        <button
          onClick={() => navigate(`/courses/${card.course.id}`)}
          style={{
            width: '100%', background: 'rgba(247,147,30,0.08)', border: '1px solid rgba(247,147,30,0.2)',
            borderRadius: 13, padding: '11px 14px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', cursor: 'pointer', marginBottom: 14,
          }}
          className="active:scale-[0.98] transition-transform"
        >
          <div>
            <span style={{ fontSize: 10, color: AMBER, fontWeight: 600, display: 'block' }}>View course on Clbhouz</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'white', display: 'block', marginTop: 1 }}>{card.course.name}</span>
          </div>
          <span style={{ fontSize: 12, color: AMBER, fontWeight: 600 }}>View →</span>
        </button>
      </div>

      {/* ── Action rail ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '10px 16px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
        background: 'rgba(13,15,14,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Like */}
        <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px' }}>
          <Heart
            size={20}
            fill={isLiked ? AMBER : 'none'}
            color={isLiked ? AMBER : 'rgba(255,255,255,0.6)'}
          />
          {likeCount > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: isLiked ? AMBER : 'rgba(255,255,255,0.5)' }}>{likeCount}</span>}
        </button>

        {/* Helpful */}
        <button onClick={handleHelpful} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px' }}>
          <ThumbsUp
            size={18}
            fill={isHelpful ? '#10b981' : 'none'}
            color={isHelpful ? '#10b981' : 'rgba(255,255,255,0.6)'}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: isHelpful ? '#10b981' : 'rgba(255,255,255,0.5)' }}>
            Helpful{helpfulCount > 0 ? ` · ${helpfulCount}` : ''}
          </span>
        </button>

        {/* Comment */}
        <button onClick={onComment} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px' }}>
          <MessageCircle size={20} color="rgba(255,255,255,0.6)" />
        </button>

        {/* Share */}
        <button onClick={onLike} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px' }}>
          <Share2 size={18} color="rgba(255,255,255,0.6)" />
        </button>
      </div>
    </div>
  );
};

export default ReviewOfWeekCard;
