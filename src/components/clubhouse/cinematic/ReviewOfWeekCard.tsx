import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/utils/haptics';
import type { ReviewOfWeekCardFeedPost } from '@/components/media-system/types/media';

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

// ── Skeleton ──

function ReviewOfWeekSkeleton() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: '#0d0f0e', fontFamily: "'DM Sans', -apple-system, sans-serif" }}
    >
      <div className="max-w-[500px] mx-auto w-full h-full">
        <div className="w-full animate-pulse rounded-none" style={{ height: 'clamp(180px, 28vw, 240px)', background: 'rgba(255,255,255,0.06)' }} />
        <div className="px-4 sm:px-5 mt-4 space-y-2">
          <div className="h-3 w-24 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-5 w-48 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-3 w-32 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div className="px-4 sm:px-5 mt-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-2.5 w-40 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div className="w-14 h-9 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div className="px-4 sm:px-5 mt-4 space-y-2">
          <div className="h-3 w-full rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-3 w-[90%] rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-3 w-[70%] rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div className="px-4 sm:px-5 mt-4 space-y-2">
          {[75, 85, 90, 90].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-2.5 w-[68px] rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-1 flex-1 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-2.5 w-6 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          ))}
        </div>
        <div className="px-4 sm:px-5 mt-4 grid grid-cols-4 gap-1 rounded-xl overflow-hidden">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="aspect-square animate-pulse rounded-sm" style={{ background: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Breakdown Bar ──

function BreakdownBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2" style={{ marginBottom: 'clamp(2px, 0.6vh, 6px)' }}>
      <span className="w-[68px] shrink-0 text-white/50" style={{ fontSize: 'clamp(9px, 1.4vh, 11px)' }}>{label}</span>
      <div className="flex-1 rounded-full" style={{ height: 'clamp(2px, 0.4vh, 4px)', background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${(score / 10) * 100}%`, background: `linear-gradient(90deg, ${AMBER}, #FFB347)` }}
        />
      </div>
      <span className="font-bold text-white/70 w-6 text-right" style={{ fontSize: 'clamp(9px, 1.4vh, 11px)' }}>{score.toFixed(1)}</span>
    </div>
  );
}

// ── Main Component ──

interface ReviewOfWeekCardProps {
  post: ReviewOfWeekCardFeedPost;
  onComment: () => void;
  onLike: () => void;
  onShare?: () => void;
  currentUserId?: string;
  isLoading?: boolean;
}

export const ReviewOfWeekCard: React.FC<ReviewOfWeekCardProps> = ({
  post, onComment, onLike, onShare, currentUserId, isLoading,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const card = post?.cardData;
  const [optimisticLike, setOptimisticLike] = useState<{ isLiked: boolean; count: number } | null>(null);

  const cardId = card?.cardId ?? '';

  // ── Like state ──
  const { data: likeData } = useQuery({
    queryKey: ['editorial-card-likes', cardId, currentUserId],
    queryFn: async () => {
      const { count } = await supabase
        .from('editorial_card_likes')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', cardId);
      let hasLiked = false;
      if (currentUserId) {
        const { data } = await supabase
          .from('editorial_card_likes')
          .select('id')
          .eq('card_id', cardId)
          .eq('user_id', currentUserId)
          .maybeSingle();
        hasLiked = !!data;
      }
      return { count: count ?? 0, hasLiked };
    },
    staleTime: 30_000,
    enabled: !!cardId,
  });

  const handleLike = useCallback(async () => {
    if (!currentUserId || !cardId) return;
    haptic('light');
    const current = optimisticLike ?? { isLiked: likeData?.hasLiked ?? false, count: likeData?.count ?? 0 };
    const newLiked = !current.isLiked;
    setOptimisticLike({ isLiked: newLiked, count: current.count + (newLiked ? 1 : -1) });
    try {
      if (newLiked) {
        await supabase.from('editorial_card_likes').insert({ card_id: cardId, user_id: currentUserId });
      } else {
        await supabase.from('editorial_card_likes').delete().eq('card_id', cardId).eq('user_id', currentUserId);
      }
      queryClient.invalidateQueries({ queryKey: ['editorial-card-likes', cardId, currentUserId] });
    } catch { setOptimisticLike(null); }
  }, [currentUserId, optimisticLike, likeData, cardId, queryClient]);

  // ── Skeleton gate (after all hooks) ──
  if (isLoading || !card) {
    return <ReviewOfWeekSkeleton />;
  }

  const isLiked = optimisticLike?.isLiked ?? likeData?.hasLiked ?? false;
  const likeCount = optimisticLike?.count ?? likeData?.count ?? 0;

  const fullText = [(card as any).reviewTitle, card.reviewText].filter(Boolean).join(' ');

  const breakdowns = [
    { label: 'Design', score: card.designScore },
    { label: 'Condition', score: card.conditionScore },
    { label: 'Clubhouse', score: card.clubhouseScore },
    { label: 'Facilities', score: card.facilitiesScore },
  ].filter(b => b.score != null) as { label: string; score: number }[];

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const hasPhotos = card.photoUrls.length > 0;

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: '#0d0f0e', fontFamily: "'DM Sans', -apple-system, sans-serif" }}
    >
      {/* ── Hero zone — fixed proportion ── */}
      <div
        className="relative w-full shrink-0 overflow-hidden"
        style={{ flex: '0 0 clamp(140px, 24vh, 240px)' }}
      >
        <div className="max-w-[500px] mx-auto w-full h-full relative">
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
          </div>
        </div>
      </div>

      {/* ── Content zone — fills remaining space, justify to spread evenly ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
        <div className="max-w-[500px] mx-auto w-full flex-1 flex flex-col justify-between overflow-hidden" style={{ minHeight: 0 }}>

          {/* ── World rank ── */}
          {card.course.globalRank && (
            <p className="font-semibold tracking-[0.06em] text-[#F7931E] uppercase px-4 m-0 shrink-0"
               style={{ fontSize: 'clamp(9px, 1.3vh, 11px)', paddingTop: 'clamp(6px, 1.2vh, 16px)', marginBottom: 'clamp(1px, 0.3vh, 4px)' }}>
              World Rank #{card.course.globalRank}
            </p>
          )}

          {/* ── Course name + country ── */}
          <div className={`px-4 sm:px-5 shrink-0 ${card.course.globalRank ? '' : ''}`}
               style={{ paddingTop: card.course.globalRank ? 0 : 'clamp(6px, 1.2vh, 12px)' }}>
            <h2
              className="font-extrabold text-white m-0 leading-tight truncate"
              style={{ fontSize: 'clamp(17px, 3vh, 24px)', letterSpacing: '-0.02em' }}
            >
              {card.course.name}
            </h2>
            <span className="text-white/50 block truncate" style={{ fontSize: 'clamp(10px, 1.5vh, 12px)', marginTop: 1 }}>
              {card.course.subCountry ?? card.course.country}
            </span>
          </div>

          {/* ── Reviewer row ── */}
          <div className="px-4 sm:px-5 flex items-center justify-between shrink-0"
               style={{ marginTop: 'clamp(8px, 1.5vh, 16px)' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Squircle avatar */}
              <div className="shrink-0 overflow-hidden"
                   style={{ width: 'clamp(28px, 4.5vh, 36px)', height: 'clamp(28px, 4.5vh, 36px)', borderRadius: '34%' }}>
                {card.reviewer.avatarUrl ? (
                  <img src={card.reviewer.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-bold"
                    style={{ background: 'rgba(247,147,30,0.15)', color: AMBER, fontSize: 'clamp(10px, 1.6vh, 13px)' }}
                  >
                    {getInitials(card.reviewer.displayName)}
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/u/${card.reviewer.username ?? card.reviewer.userId}`)}
                    className="font-bold text-white/90 bg-transparent border-none p-0 cursor-pointer truncate"
                    style={{ fontSize: 'clamp(11px, 1.6vh, 13px)', letterSpacing: '-0.01em' }}
                  >
                    {card.reviewer.displayName}
                  </button>
                  {card.reviewer.isVerified && <VerifiedIcon className="w-3 h-3 shrink-0" />}
                </div>
                <div className="text-white/40 flex gap-1 items-center" style={{ fontSize: 'clamp(8px, 1.2vh, 10px)', marginTop: 1 }}>
                  {card.reviewer.handicap != null && <span>HCP {card.reviewer.handicap.toFixed(1)}</span>}
                  {card.reviewer.handicap != null && <span>·</span>}
                  <span>{card.reviewer.reviewCount} reviews</span>
                  {card.playedDate && <><span>·</span><span>{card.playedDate}</span></>}
                </div>
              </div>
            </div>

            {/* Score pill */}
            <div className="flex flex-col items-center shrink-0" style={{
              background: `linear-gradient(135deg, ${AMBER}, #E8820E)`,
              borderRadius: 'clamp(10px, 1.6vh, 14px)',
              padding: 'clamp(6px, 1vh, 9px) clamp(10px, 1.5vh, 13px)',
              boxShadow: '0 4px 16px rgba(247,147,30,0.3)',
            }}>
              <span className="font-bold text-white leading-none" style={{ fontSize: 'clamp(16px, 2.5vh, 20px)' }}>
                {card.rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* ── Review text — fluid clamp ── */}
          <div className="px-4 sm:px-5 shrink-0" style={{ paddingTop: 'clamp(6px, 1vh, 12px)' }}>
            <p className="text-[rgba(255,255,255,0.78)] font-normal m-0"
               style={{
                 fontSize: 'clamp(11px, 1.6vh, 13.5px)',
                 lineHeight: 1.55,
                 display: '-webkit-box',
                 WebkitLineClamp: 3,
                 WebkitBoxOrient: 'vertical',
                 overflow: 'hidden',
               }}>
              {fullText}
            </p>
          </div>

          {/* ── Breakdown bars ── */}
          {breakdowns.length > 0 && (
            <div
              className="mx-4 sm:mx-5 shrink-0"
              style={{
                marginTop: 'clamp(6px, 1vh, 12px)',
                padding: 'clamp(6px, 1vh, 12px) clamp(10px, 1.5vh, 14px)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 'clamp(8px, 1.2vh, 12px)',
              }}
            >
              {breakdowns.map(b => <BreakdownBar key={b.label} label={b.label} score={b.score} />)}
            </div>
          )}

          {/* ── Photo grid — grows to absorb remaining space ── */}
          {hasPhotos && (
            <div className="mx-4 sm:mx-5 overflow-hidden"
                 style={{
                   flex: '1 1 0',
                   marginTop: 'clamp(6px, 1vh, 12px)',
                   minHeight: 'clamp(48px, 8vh, 64px)',
                   borderRadius: 'clamp(8px, 1.2vh, 12px)',
                 }}>
              <div className="grid grid-cols-4 gap-[3px] h-full overflow-hidden" style={{ borderRadius: 'inherit' }}>
                {card.photoUrls.slice(0, 4).map((url, i) => (
                  <div key={i} className="relative overflow-hidden bg-[rgba(255,255,255,0.06)]">
                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    {i === 3 && card.photoUrls.length > 4 && (
                      <div className="absolute inset-0 bg-[rgba(13,15,14,0.6)] flex items-center justify-center">
                        <span className="text-[15px] font-bold text-white">+{card.photoUrls.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* When no photos, use a flex spacer to push content down */}
          {!hasPhotos && <div style={{ flex: '1 1 0' }} />}

          {/* ── Course link button ── */}
          <div className="px-4 sm:px-5 shrink-0" style={{ marginTop: 'clamp(6px, 1vh, 12px)', marginBottom: 'clamp(4px, 0.8vh, 8px)' }}>
            <button
              onClick={() => navigate(`/courses/${card.course.id}`)}
              className="w-full flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
              style={{
                height: 'clamp(36px, 5.5vh, 48px)',
                background: 'rgba(247,147,30,0.08)',
                border: '1px solid rgba(247,147,30,0.2)',
                borderRadius: 'clamp(9px, 1.4vh, 13px)',
                padding: '0 14px',
              }}
            >
              <span className="font-bold text-white truncate" style={{ fontSize: 'clamp(11px, 1.6vh, 13px)' }}>
                View {card.course.name}
              </span>
              <span className="font-semibold shrink-0 ml-2" style={{ color: AMBER, fontSize: 'clamp(10px, 1.4vh, 12px)' }}>
                View →
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Action rail (pinned bottom, 3 cols) ── */}
      <div
        className="shrink-0 grid grid-cols-3 gap-2 px-3"
        style={{
          background: '#0d0f0e',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: 'clamp(6px, 1vh, 12px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + clamp(6px, 1vh, 14px))',
        }}
      >
        {/* Like */}
        <button
          onClick={handleLike}
          className="rounded-2xl flex items-center justify-center gap-[6px] font-semibold active:scale-[0.97] transition-transform"
          style={{
            height: 'clamp(36px, 5.5vh, 48px)',
            fontSize: 'clamp(10px, 1.4vh, 12px)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: isLiked ? '#e05555' : 'rgba(255,255,255,0.45)',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M12 21C12 21 3 14.5 3 8.5C3 5.46 5.46 3 8.5 3C10.24 3 11.8 3.84 12 5C12.2 3.84 13.76 3 15.5 3C18.54 3 21 5.46 21 8.5C21 14.5 12 21 12 21Z"
              fill={isLiked ? '#e05555' : 'none'}
              stroke={isLiked ? '#e05555' : 'rgba(255,255,255,0.55)'}
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{likeCount > 0 ? `Like · ${likeCount}` : 'Like'}</span>
        </button>

        {/* Comment */}
        <button
          onClick={onComment}
          className="rounded-2xl flex items-center justify-center gap-[6px] font-semibold active:scale-[0.97] transition-transform"
          style={{
            height: 'clamp(36px, 5.5vh, 48px)',
            fontSize: 'clamp(10px, 1.4vh, 12px)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
              stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Comment</span>
        </button>

        {/* Share */}
        <button
          onClick={() => {
            haptic('light');
            if (onShare) {
              onShare();
            } else if (navigator.share) {
              navigator.share({
                title: `${card.reviewer.displayName}'s review of ${card.course.name}`,
                text: card.reviewText.slice(0, 120),
                url: `${window.location.origin}/courses/${card.course.id}`,
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(`${window.location.origin}/courses/${card.course.id}`);
            }
          }}
          className="rounded-2xl flex items-center justify-center gap-[6px] font-semibold active:scale-[0.97] transition-transform"
          style={{
            height: 'clamp(36px, 5.5vh, 48px)',
            fontSize: 'clamp(10px, 1.4vh, 12px)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.45)',
          }}
          aria-label="Share this review"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
              stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewOfWeekCard;
