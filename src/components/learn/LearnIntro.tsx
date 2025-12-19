import React from 'react';

/**
 * LearnIntro - Orientation component for Learn tab
 * Sets calm tone and reduces anxiety for golfers seeking improvement
 */
export const LearnIntro: React.FC = () => {
  return (
    <div className="px-5 pt-8 pb-6">
      <p className="text-secondary text-body-md leading-relaxed max-w-md">
        Learn at your own pace. Trusted advice, tailored to where your game is today.
      </p>
    </div>
  );
};

export default LearnIntro;
