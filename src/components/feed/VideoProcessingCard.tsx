/**
 * VideoProcessingCard — shared "encoding in progress" surface.
 *
 * Rendered when a MediaItem carries isProcessing=true (feedMapper sets this
 * for freshly-uploaded videos that have no hlsUrl / thumbnailUrl yet — both
 * arrive post-encode from Cloudflare). Used by both InlineVideo (feed card)
 * and FeedSlide (fullscreen) so the two surfaces cannot drift.
 */
import React from 'react';
import { InlineSpinner } from '@/components/ui/InlineSpinner';

interface Props {
  /** Optional dim/overlay mode — sits over a poster in fullscreen. */
  overlay?: boolean;
}

export const VideoProcessingCard: React.FC<Props> = ({ overlay = false }) => {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        // A STATE WASH, not a chip — excluded from CHIP_GLASS.
        background: overlay ? 'rgba(0,0,0,0.45)' : '#0A0E14',
        zIndex: overlay ? 2 : undefined,
      }}
      aria-live="polite"
    >
      <InlineSpinner size="lg" className="mb-3" />
      <span className="text-white text-sm font-semibold tracking-tight">Processing</span>
      <span className="text-white/70 text-xs mt-1">This video will be ready shortly</span>
    </div>
  );
};

VideoProcessingCard.displayName = 'VideoProcessingCard';
