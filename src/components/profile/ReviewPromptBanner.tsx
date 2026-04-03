import React from 'react';

interface ReviewPromptBannerProps {
  unratedCoursesCount: number;
  onAddReviewClick: () => void;
  isVisible: boolean;
}

const ReviewPromptBanner: React.FC<ReviewPromptBannerProps> = ({
  unratedCoursesCount,
  onAddReviewClick,
  isVisible,
}) => {
  if (!isVisible || unratedCoursesCount === 0) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-3.5 p-4 rounded-2xl mb-4"
      style={{
        background: 'rgba(247,147,30,0.05)',
        border: '1.5px solid rgba(247,147,30,0.12)',
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
        <p className="text-[14px] font-bold text-foreground">
          {unratedCoursesCount} course{unratedCoursesCount > 1 ? 's' : ''} to review
        </p>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Add your verdict and help golfers worldwide
        </p>
      </div>

      {/* Amber pill CTA */}
      <button
        type="button"
        onClick={onAddReviewClick}
        className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-bold text-white active:scale-[0.97] transition-all whitespace-nowrap"
        style={{
          background: '#F7931E',
          boxShadow: '0 4px 14px rgba(247,147,30,0.3)',
        }}
      >
        Add Reviews
      </button>
    </div>
  );
};

export default ReviewPromptBanner;
