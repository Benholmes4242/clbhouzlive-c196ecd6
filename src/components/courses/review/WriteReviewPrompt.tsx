import React from 'react';

interface WriteReviewPromptProps {
  onRateClick: () => void;
}

/**
 * "Write a review" prompt card shown to users who haven't left a review yet.
 * Placed after filters and before first review card.
 */
export const WriteReviewPrompt: React.FC<WriteReviewPromptProps> = ({
  onRateClick,
}) => {
  return (
    <div
      className="flex items-center gap-3.5 p-4 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(247,147,30,0.06), rgba(247,147,30,0.02))',
        border: '1.5px solid rgba(247,147,30,0.15)',
      }}
    >
      {/* Amber gradient icon square */}
      <div
        className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #F7931E, #FBBC2E)' }}
      >
        <span style={{ fontSize: 20 }}>⭐</span>
      </div>

      {/* Copy */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-foreground">Played here?</p>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Your rating helps golfers worldwide
        </p>
      </div>

      {/* Amber pill CTA */}
      <button
        type="button"
        onClick={onRateClick}
        className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-bold text-white active:scale-[0.97] transition-all"
        style={{
          background: '#F7931E',
          boxShadow: '0 4px 14px rgba(247,147,30,0.3)',
        }}
      >
        Rate
      </button>
    </div>
  );
};
