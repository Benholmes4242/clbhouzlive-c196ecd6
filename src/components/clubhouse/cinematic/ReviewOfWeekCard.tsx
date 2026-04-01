import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/utils/haptics';
import type { ReviewOfWeekCardFeedPost } from '@/components/media-system/types/media';
import type { FeedPost } from '@/components/media-system/types/media';

const AMBER = '#F7931E';

// ── Inline SVG Icons ──

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 3h14v5a7 7 0 01-14 0V3zm-2 2a3 3 0 003 3V5H3zm18 0h-2v3a3 3 0 003-3zM12 15v3m-3 3h6m-5-3h4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

const VerifiedIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="10" fill={AMBER} />
    <path d="M6 10.5l2.5 2.5L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StarIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg className={className} viewBox="0 0 12 12" fill={filled ? AMBER : 'none'} stroke={AMBER} strokeWidth="1" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 1l1.545 3.13L11 4.635 8.5 7.07l.59 3.43L6 8.885 2.91 10.5l.59-3.43L1 4.635l3.455-.505L6 1z" />
  </svg>
);

const HeartIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill={filled ? AMBER : 'none'} stroke={filled ? AMBER : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const ThumbsUpIcon = ({ className, active }: { className?: string; active?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill={active ? '#10b981' : 'none'} stroke={active ? '#10b981' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
  </svg>
);

const CommentIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

// ── Skeleton ──

function ReviewOfWeekSkeleton() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: '#0d0f0e', fontFamily: "'DM Sans', -apple-system, sans-serif" }}
    >
      <div className="max-w-[500px] mx-auto w-full h-full">
        {/* Hero skeleton */}
        <div className="w-full animate-shimmer rounded-none" style={{ height: 'clamp(180px, 28vw, 240px)', background: 'rgba(255,255,255,0.06)' }} />

        {/* Course meta skeleton */}
        <div className="px-4 sm:px-5 mt-4 space-y-2">
          <div className="h-3 w-24 rounded-full animate-shimmer" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-5 w-48 rounded-full animate-shimmer" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-3 w-32 rounded-full animate-shimmer" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Reviewer row skeleton */}
        <div className="px-4 sm:px-5 mt-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] animate-shimmer" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 rounded-full animate-shimmer" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-2.5 w-40 rounded-full animate-shimmer" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div className="w-14 h-9 rounded-xl animate-shimmer" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Text skeleton */}
        <div className="px-4 sm:px-5 mt-4 space-y-2">
          <div className="h-3 w-full rounded-full animate-shimmer" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-3 w-[90%] rounded-full animate-shimmer" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-3 w-[70%] rounded-full animate-shimmer" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-3 w-[50%] rounded-full animate-shimmer" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Breakdown skeleton */}
        <div className="px-4 sm:px-5 mt-4 space-y-2">
          {[75, 85, 90, 90].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-2.5 w-[68px] rounded-full animate-shimmer" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-1 flex-1 rounded-full animate-shimmer" style={{ background: 'rgba(255,255,255,0.06)', width: `${w}%` }} />
              <div className="h-2.5 w-6 rounded-full animate-shimmer" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          ))}
        </div>

        {/* Photo grid skeleton */}
        <div className="px-4 sm:px-5 mt-4 grid grid-cols-4 gap-1 rounded-xl overflow-hidden">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="aspect-square animate-shimmer rounded-sm" style={{ background: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>

        {/* Course link skeleton */}
        <div className="px-4 sm:px-5 mt-4">
          <div className="h-12 w-full rounded-xl animate-shimmer" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Action rail skeleton */}
        <div className="px-4 sm:px-5 mt-4 grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-10 rounded-lg animate-shimmer" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Breakdown Bar ──

function BreakdownBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
      <span className="w-[68px] shrink-0 text-[11px] text-white/50">{label}</span>
      <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${(score / 10) * 100}%`, background: `linear-gradient(90deg, ${AMBER}, #FFB347)` }}
        />
      </div>
      <span className="text-[11px] font-bold text-white/70 w-6 text-right">{score.toFixed(1)}</span>
    </div>
  );
}

// ── Main Component ──

interface ReviewOfWeekCardProps {
  post: ReviewOfWeekCardFeedPost;
  onComment: () => void;
  onLike: () => void;
  getLikeState?: (post: FeedPost) => { isLiked: boolean; count: number };
  getCommentCount?: (post: FeedPost) => number;
  currentUserId?: string;
  isLoading?: boolean;
}

export const ReviewOfWeekCard: React.FC<ReviewOfWeekCardProps> = ({
  post, onComment, onLike, getLikeState, getCommentCount, currentUserId, isLoading,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const card = post?.cardData;
  const [expanded, setExpanded] = useState(false);
  const [optimisticLike, setOptimisticLike] = useState<{ isLiked: boolean; count: number } | null>(null);
  const [helpfulOptimistic, setHelpfulOptimistic] = useState<{ isHelpful: boolean; count: number } | null>(null);

  const cardId = card?.cardId ?? '';
  const reviewId = card?.reviewId ?? '';
  const cardHelpfulCount = card?.helpfulCount ?? 0;

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

  const truncatedText = card.reviewText.slice(0, 220);
  const displayText = expanded ? card.reviewText : truncatedText;

  const breakdowns = [
    { label: 'Design', score: card.designScore },
    { label: 'Condition', score: card.conditionScore },
    { label: 'Clubhouse', score: card.clubhouseScore },
    { label: 'Facilities', score: card.facilitiesScore },
  ].filter(b => b.score != null) as { label: string; score: number }[];

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const starsFull = Math.floor(card.rating / 2);
  const starsHalf = (card.rating / 2 - starsFull) >= 0.5;

  return (
    <div
      className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide"
      style={{ background: '#0d0f0e', fontFamily: "'DM Sans', -apple-system, sans-serif" }}
    >
      <div className="max-w-[500px] mx-auto w-full">

        {/* ── Hero zone ── */}
        <div className="relative w-full overflow-hidden" style={{ height: 'clamp(180px, 28vw, 240px)' }}>
          {card.course.thumbnailImage ? (
            <img
              src={card.course.thumbnailImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a1d1a 0%, #0d0f0e 100%)' }} />
          )}

          {/* Dark fade overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(13,15,14,0.92) 85%, #0d0f0e 100%)' }} />

          {/* Trophy badge — top-left */}
          <div className="absolute left-4 sm:left-5" style={{ top: 'max(env(safe-area-inset-top, 47px), 47px)', paddingTop: 12 }}>
            <div
              className="flex items-center gap-1.5 backdrop-blur-xl"
              style={{
                background: 'rgba(247,147,30,0.12)',
                border: '1px solid rgba(247,147,30,0.3)',
                borderRadius: 20,
                padding: '5px 12px',
              }}
            >
              <TrophyIcon className="w-3.5 h-3.5 text-[#F7931E]" />
              <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: AMBER }}>
                Review of the Week
              </span>
            </div>
            <div className="mt-1 pl-1 text-[10px] font-medium text-white/40">
              {card.weekLabel}
            </div>
          </div>
        </div>

        {/* ── Course meta ── */}
        <div className="px-4 sm:px-5 -mt-10 relative z-10">
          {card.course.globalRank && (
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] font-semibold" style={{ color: AMBER }}>
                World Rank #{card.course.globalRank}
              </span>
            </div>
          )}
          <h2
            className="font-extrabold text-white m-0 leading-tight"
            style={{ fontSize: 'clamp(19px, 5vw, 24px)', letterSpacing: '-0.02em' }}
          >
            {card.course.name}
          </h2>
          <span className="text-[12px] text-white/50 mt-0.5 block">
            {card.course.subCountry ?? card.course.country}
          </span>
        </div>

        {/* ── Reviewer row ── */}
        <div className="px-4 sm:px-5 mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Squircle avatar */}
            <div className="w-9 h-9 shrink-0 overflow-hidden" style={{ borderRadius: '34%' }}>
              {card.reviewer.avatarUrl ? (
                <img src={card.reviewer.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-[13px] font-bold"
                  style={{ background: 'rgba(247,147,30,0.15)', color: AMBER }}
                >
                  {getInitials(card.reviewer.displayName)}
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate(`/u/${card.reviewer.username ?? card.reviewer.userId}`)}
                  className="text-[13px] font-bold text-white/90 bg-transparent border-none p-0 cursor-pointer"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {card.reviewer.displayName}
                </button>
                {card.reviewer.isVerified && <VerifiedIcon className="w-3 h-3" />}
              </div>
              <div className="text-[10px] text-white/40 flex gap-1 items-center mt-px">
                {card.reviewer.handicap != null && <span>HCP {card.reviewer.handicap.toFixed(1)}</span>}
                {card.reviewer.handicap != null && <span>·</span>}
                <span>{card.reviewer.reviewCount} reviews</span>
                {card.playedDate && <><span>·</span><span>{card.playedDate}</span></>}
              </div>
            </div>
          </div>

          {/* Score pill */}
          <div
            className="flex items-center gap-1 shrink-0"
            style={{
              background: `linear-gradient(135deg, ${AMBER}, #E8820E)`,
              borderRadius: 12,
              padding: '6px 12px',
              boxShadow: '0 4px 16px rgba(247,147,30,0.3)',
            }}
          >
            <span className="text-[20px] font-extrabold text-white leading-none">{card.rating.toFixed(1)}</span>
            <div className="flex gap-px">
              {[1, 2, 3, 4, 5].map(i => (
                <StarIcon key={i} className="w-2.5 h-2.5" filled={i <= starsFull || (i === starsFull + 1 && starsHalf)} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Review text ── */}
        <div className="px-4 sm:px-5 mt-4">
          <p className="text-[14px] leading-relaxed text-white/80 m-0 whitespace-pre-wrap">
            {displayText}
            {!expanded && card.reviewText.length > 220 && '…'}
          </p>
          {card.reviewText.length > 220 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-[13.5px] font-semibold mt-[5px] active:scale-[0.97] bg-transparent border-none p-0 cursor-pointer"
              style={{ color: AMBER }}
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* ── Breakdown bars ── */}
        {breakdowns.length > 0 && (
          <div
            className="mx-4 sm:mx-5 mt-4 rounded-xl"
            style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {breakdowns.map(b => <BreakdownBar key={b.label} label={b.label} score={b.score} />)}
          </div>
        )}

        {/* ── Photo grid ── */}
        {card.photoUrls.length > 0 && (
          <div className="px-4 sm:px-5 mt-4">
            <div className="grid grid-cols-4 gap-1 rounded-xl overflow-hidden">
              {card.photoUrls.slice(0, 4).map((url, i) => (
                <div key={i} className="relative aspect-square overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  {i === 3 && card.photoUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[18px] font-bold text-white">
                      +{card.photoUrls.length - 4}
                    </div>
                  )}
                </div>
              ))}
              {/* Empty placeholders if fewer than 4 */}
              {Array.from({ length: Math.max(0, 4 - card.photoUrls.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Course link button ── */}
        <div className="px-4 sm:px-5 mt-4">
          <button
            onClick={() => navigate(`/courses/${card.course.id}`)}
            className="w-full flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform h-12"
            style={{
              background: 'rgba(247,147,30,0.08)',
              border: '1px solid rgba(247,147,30,0.2)',
              borderRadius: 13,
              padding: '0 14px',
            }}
          >
            <span className="text-[13px] font-bold text-white truncate">
              View {card.course.name}
            </span>
            <span className="text-[12px] font-semibold shrink-0 ml-2" style={{ color: AMBER }}>
              View →
            </span>
          </button>
        </div>

        {/* Bottom spacer for fixed action rail */}
        <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }} />
      </div>

      {/* ── Action rail (fixed) ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 flex items-center backdrop-blur-2xl max-w-[480px] mx-auto"
        style={{
          padding: '10px 16px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
          background: 'rgba(13,15,14,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="grid grid-cols-4 w-full">
          {/* Like */}
          <button onClick={handleLike} className="flex items-center justify-center gap-1.5 bg-transparent border-none cursor-pointer h-12 px-1">
            <HeartIcon className="w-5 h-5 text-white/60" filled={isLiked} />
            <span className="text-[12px] font-semibold" style={{ color: isLiked ? AMBER : 'rgba(255,255,255,0.5)' }}>
              {likeCount > 0 ? `Like · ${likeCount}` : 'Like'}
            </span>
          </button>

          {/* Helpful */}
          <button onClick={handleHelpful} className="flex items-center justify-center gap-1.5 bg-transparent border-none cursor-pointer h-12 px-1">
            <ThumbsUpIcon className="w-[18px] h-[18px] text-white/60" active={isHelpful} />
            <span className="text-[12px] font-semibold" style={{ color: isHelpful ? '#10b981' : 'rgba(255,255,255,0.5)' }}>
              {helpfulCount > 0 ? `${helpfulCount}` : ''}
            </span>
          </button>

          {/* Comment */}
          <button onClick={onComment} className="flex items-center justify-center gap-1.5 bg-transparent border-none cursor-pointer h-12 px-1">
            <CommentIcon className="w-5 h-5 text-white/60" />
            <span className="text-[12px] font-semibold text-white/50">Comment</span>
          </button>

          {/* Share */}
          <button onClick={onLike} className="flex items-center justify-center gap-1.5 bg-transparent border-none cursor-pointer h-12 px-1">
            <ShareIcon className="w-[18px] h-[18px] text-white/60" />
            <span className="text-[12px] font-semibold text-white/50">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewOfWeekCard;
