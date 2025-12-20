import React from 'react';

/**
 * VideosIntro - Orientation component for Videos tab
 * Long-form content only (≥3 min) - sets calm tone for deliberate improvement
 */
export const VideosIntro: React.FC = () => {
  return (
    <div className="px-5 pt-6 pb-4">
      <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
        Long-form videos to help you improve. Trusted advice, tailored to your game.
      </p>
    </div>
  );
};

export default VideosIntro;
