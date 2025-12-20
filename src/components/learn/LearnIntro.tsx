import React from 'react';

/**
 * VideosIntro - Orientation component for Videos tab
 * Long-form content only (≥3 min) - sets calm tone for deliberate improvement
 */
export const LearnIntro: React.FC = () => {
  return (
    <div className="px-5 pt-8 pb-6">
      <p className="text-secondary text-body-md leading-relaxed max-w-md">
        Long-form videos to help you improve. Trusted advice, tailored to your game.
      </p>
    </div>
  );
};

export default LearnIntro;
