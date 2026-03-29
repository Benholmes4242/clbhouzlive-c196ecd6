import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DebateCardFeedPost, DebateCardData } from '@/components/media-system/types/media';

interface WeeklyDebateCardProps {
  post: DebateCardFeedPost;
  onComment?: () => void;
  currentUserId?: string;
}

export const WeeklyDebateCard: React.FC<WeeklyDebateCardProps> = ({ post, onComment, currentUserId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const card = post.cardData;

  const [localVote, setLocalVote] = useState<'a' | 'b' | null>(card.myVote);
  const [localVotesA, setLocalVotesA] = useState(card.votesA);
  const [localVotesB, setLocalVotesB] = useState(card.votesB);

  const total = localVotesA + localVotesB;
  const pctA = total > 0 ? Math.round((localVotesA / total) * 100) : 50;
  const pctB = total > 0 ? Math.round((localVotesB / total) * 100) : 50;
  const leading = localVotesA >= localVotesB ? 'a' : 'b';

  const handleVote = async (option: 'a' | 'b') => {
    if (localVote || !currentUserId) return;

    setLocalVote(option);
    if (option === 'a') setLocalVotesA(v => v + 1);
    else setLocalVotesB(v => v + 1);

    try {
      const { error } = await supabase
        .from('editorial_debate_votes')
        .insert({ card_id: card.cardId, user_id: currentUserId, option });

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['editorial-cards', currentUserId] });
    } catch {
      // Revert
      setLocalVote(null);
      if (option === 'a') setLocalVotesA(v => v - 1);
      else setLocalVotesB(v => v - 1);
      toast.error("Couldn't save your vote");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share?.({ title: card.title, url: window.location.href });
    } catch {}
  };

  const closesDate = new Date(card.activeUntil).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      className="absolute inset-0 flex flex-col justify-center px-6"
      style={{ background: 'linear-gradient(145deg, #080812, #0d0d0d)' }}
    >
      {/* Atmospheric overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(167,139,250,0.06), transparent 60%)',
        }}
      />

      <div className="relative z-10 space-y-5" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Header */}
        <span
          className="text-[10px] font-extrabold tracking-[0.12em] uppercase"
          style={{ color: 'rgba(167,139,250,0.9)' }}
        >
          ⚡ THE WEEKLY DEBATE
        </span>

        {/* Question */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
          {card.title}
        </h2>

        {/* Vote count */}
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {localVote
            ? `${total} golfers have voted · Closes ${closesDate}`
            : `${total} golfers have voted · Vote to see results`}
        </p>

        {/* Vote buttons */}
        <div className="space-y-3">
          <VoteButton
            label={card.optionA}
            option="a"
            myVote={localVote}
            pct={pctA}
            isLeading={leading === 'a'}
            onVote={handleVote}
          />
          <VoteButton
            label={card.optionB}
            option="b"
            myVote={localVote}
            pct={pctB}
            isLeading={leading === 'b'}
            onVote={handleVote}
          />
        </div>

        {/* Course compare row */}
        {(card.linkedCourseA || card.linkedCourseB) && (
          <div className="flex gap-2">
            {[card.linkedCourseA, card.linkedCourseB].filter(Boolean).map((c) => (
              <button
                key={c!.id}
                onClick={() => navigate(`/courses/${c!.id}`)}
                className="flex-1 px-3 py-2 rounded-[10px] text-left active:scale-[0.97] transition-transform"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span className="text-[12px] font-semibold text-white block truncate">{c!.name}</span>
                {c!.communityRating && (
                  <span className="text-[11px]" style={{ color: 'rgba(247,147,30,0.8)' }}>
                    ★ {c!.communityRating.toFixed(1)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

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

// ── Vote Button Sub-component ──
interface VoteButtonProps {
  label: string;
  option: 'a' | 'b';
  myVote: 'a' | 'b' | null;
  pct: number;
  isLeading: boolean;
  onVote: (option: 'a' | 'b') => void;
}

const VoteButton: React.FC<VoteButtonProps> = ({ label, option, myVote, pct, isLeading, onVote }) => {
  const hasVoted = myVote !== null;
  const isMyPick = myVote === option;

  return (
    <button
      onClick={() => onVote(option)}
      disabled={hasVoted}
      className="relative w-full text-left rounded-[14px] p-4 overflow-hidden transition-all"
      style={{
        background: isMyPick ? 'rgba(99,102,241,0.12)' : '#1C1C1E',
        border: `1px solid ${isMyPick ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)'}`,
        cursor: hasVoted ? 'default' : 'pointer',
      }}
    >
      {/* Fill bar (after vote) */}
      {hasVoted && (
        <div
          className="absolute left-0 top-0 bottom-0 rounded-[14px]"
          style={{
            width: `${pct}%`,
            background: isMyPick
              ? 'rgba(167,139,250,0.12)'
              : 'rgba(255,255,255,0.04)',
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[15px] font-semibold text-white">{label}</span>
        <div className="flex items-center gap-2">
          {hasVoted && (
            <span className="text-[15px] font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {pct}%
            </span>
          )}
          {isMyPick && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(167,139,250,0.2)', color: 'rgba(167,139,250,0.9)' }}
            >
              Your pick
            </span>
          )}
          {hasVoted && isLeading && !isMyPick && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
            >
              Leading
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default WeeklyDebateCard;
