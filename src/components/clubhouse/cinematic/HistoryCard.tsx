import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Share2 } from 'lucide-react';
import type { HistoryCardFeedPost } from '@/components/media-system/types/media';

interface HistoryCardProps {
  post: HistoryCardFeedPost;
  onComment?: () => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ post, onComment }) => {
  const navigate = useNavigate();
  const card = post.cardData;
  const [expanded, setExpanded] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.share?.({ title: card.title, url: window.location.href });
    } catch {}
  };

  return (
    <div
      className="absolute inset-0 flex flex-col justify-center px-6"
      style={{
        background: 'linear-gradient(145deg, #0f0c00, #0d0d0d)',
      }}
    >
      {/* Atmospheric overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 0%, rgba(255,215,0,0.07), transparent 60%)',
        }}
      />

      <div className="relative z-10 space-y-5" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-extrabold tracking-[0.12em] uppercase"
            style={{ color: 'rgba(255,215,0,0.8)' }}
          >
            📜 THIS WEEK IN HISTORY
          </span>
          {card.historyDate && (
            <span
              className="text-[12px] font-semibold"
              style={{ color: 'rgba(255,215,0,0.5)' }}
            >
              {card.historyDate}
            </span>
          )}
        </div>

        {/* Year watermark */}
        {card.historyYear > 0 && (
          <div
            className="select-none"
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: 'rgba(255,215,0,0.12)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {card.historyYear}
          </div>
        )}

        {/* Headline */}
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
          }}
        >
          {card.title}
        </h2>

        {/* Body */}
        {card.body && (
          <div>
            <p
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
              }}
            >
              {expanded && card.bodyExtended ? card.bodyExtended : card.body}
            </p>
            {card.bodyExtended && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="mt-1 text-[13px] font-semibold"
                style={{ color: 'rgba(255,215,0,0.8)' }}
              >
                Read more
              </button>
            )}
          </div>
        )}

        {/* Linked course */}
        {card.linkedCourse && (
          <button
            onClick={() => navigate(`/courses/${card.linkedCourse!.id}`)}
            className="w-full text-left rounded-[14px] p-4 active:scale-[0.97] transition-transform"
            style={{
              background: 'rgba(247,147,30,0.12)',
              border: '1px solid rgba(247,147,30,0.25)',
            }}
          >
            <span
              className="text-[10px] font-extrabold tracking-[0.12em] uppercase block mb-1.5"
              style={{ color: 'rgba(247,147,30,0.8)' }}
            >
              COURSE ON CLBHOUZ
            </span>
            <span className="text-[15px] font-bold text-white block">
              {card.linkedCourse.name}
            </span>
            <span className="text-[12px] block mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              🌍 {card.linkedCourse.globalRank ? `#${card.linkedCourse.globalRank}` : '—'} · {card.linkedCourse.reviewCount} reviews
            </span>
            <span
              className="inline-block mt-2 text-[13px] font-semibold"
              style={{ color: 'rgba(247,147,30,0.9)' }}
            >
              View →
            </span>
          </button>
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
            <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Share
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryCard;
