/**
 * MomentsTimeline - Large cinematic cards feed
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { MomentCard } from './MomentCard';
import { MomentPost } from './types';
import { MomentFullscreenViewer } from './MomentFullscreenViewer';

interface MomentsTimelineProps {
  moments: MomentPost[];
  className?: string;
}

export const MomentsTimeline: React.FC<MomentsTimelineProps> = ({
  moments,
  className,
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleMomentClick = (index: number) => {
    setCurrentIndex(index);
    setViewerOpen(true);
  };

  if (moments.length === 0) {
    return (
      <section className={cn('px-5 py-6', className)}>
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--dgp-text-primary)' }}
        >
          Moments
        </h2>
        <div
          className="dgp-glass-card rounded-2xl p-8 text-center"
        >
          <p style={{ color: 'var(--dgp-text-muted)' }}>
            No moments yet
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={cn('px-5 py-6', className)}>
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--dgp-text-primary)' }}
        >
          Moments
        </h2>

        <div className="space-y-4">
          {moments.map((moment, index) => (
            <MomentCard
              key={moment.id}
              moment={moment}
              onClick={() => handleMomentClick(index)}
            />
          ))}
        </div>
      </section>

      <MomentFullscreenViewer
        moments={moments}
        currentIndex={currentIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        onIndexChange={setCurrentIndex}
      />
    </>
  );
};

export default MomentsTimeline;
