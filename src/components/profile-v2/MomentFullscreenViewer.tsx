/**
 * MomentFullscreenViewer - Fullscreen post viewer with swipe navigation
 * 
 * UNIFIED WITH CLUBHOUSE: Uses direct visibility-based autoplay pattern
 */

import React, { useState, useCallback } from 'react';
import { useSetChromeSuppressed } from '@/features/chrome-v2/leftOverride';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { MomentPost } from './types';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useSwipeable } from 'react-swipeable';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

interface MomentFullscreenViewerProps {
  moments: MomentPost[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
}

export const MomentFullscreenViewer: React.FC<MomentFullscreenViewerProps> = ({
  moments,
  currentIndex,
  open,
  onOpenChange,
  onIndexChange,
}) => {
  // The profile moments viewer sits below the chrome island z-layer;
  // suppress the island while this fullscreen takeover is mounted.
  useSetChromeSuppressed(true);

  const currentMoment = moments[currentIndex];

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onIndexChange]);

  const goToNext = useCallback(() => {
    if (currentIndex < moments.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  }, [currentIndex, moments.length, onIndexChange]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrev,
    trackMouse: false,
  });

  if (!currentMoment) return null;

  // Poster-only chassis: derive a still frame for video moments.
  const isVideo = currentMoment.mediaType === 'video';
  const streamId = isVideo ? uidFromNode({ src: currentMoment.mediaUrl }) : null;
  const posterUrl = streamId
    ? generateStreamThumbnailUrl(streamId, { height: 1080 })
    : (isVideo ? undefined : currentMoment.mediaUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-none w-screen h-screen p-0 border-0"
        style={{ background: 'var(--dgp-bg-primary)' }}
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>View moment</DialogTitle>
        </VisuallyHidden>
        <div {...swipeHandlers} className="relative w-full h-full">
          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
              background: 'var(--dgp-glass-surface)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <X className="w-5 h-5" style={{ color: 'var(--dgp-text-primary)' }} />
          </button>

          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--dgp-glass-surface)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: 'var(--dgp-text-primary)' }} />
            </button>
          )}

          {currentIndex < moments.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--dgp-glass-surface)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--dgp-text-primary)' }} />
            </button>
          )}

          {/* Media — poster-only chassis (playback severed) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isVideo ? (
              posterUrl ? (
                <img
                  src={posterUrl}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 bg-black" />
              )
            ) : (
              <img
                src={currentMoment.mediaUrl}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            )}
            
            {/* Text overlays from studioEdits */}
            {currentMoment.studioEdits?.textOverlays?.length ? (
              <TextOverlayRenderer
                textOverlays={currentMoment.studioEdits.textOverlays}
                isEditable={false}
              />
            ) : null}
          </div>

          {/* Bottom Info Overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            }}
          >
            {/* Course Tag */}
            {currentMoment.courseName && (
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4" style={{ color: 'var(--dgp-accent-green)' }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--dgp-text-primary)' }}
                >
                  {currentMoment.courseName}
                </span>
              </div>
            )}

            {/* Caption */}
            {currentMoment.caption && (
              <p
                className="text-sm mb-3 line-clamp-3"
                style={{ color: 'var(--dgp-text-secondary)' }}
              >
                {currentMoment.caption}
              </p>
            )}

            {/* Meta Row */}
            <div className="flex items-center justify-between">
              <span
                className="text-xs"
                style={{ color: 'var(--dgp-text-muted)' }}
              >
                {format(new Date(currentMoment.date), 'MMM d, yyyy')}
              </span>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" style={{ color: 'var(--dgp-text-secondary)' }} />
                  <span
                    className="text-sm"
                    style={{ color: 'var(--dgp-text-secondary)' }}
                  >
                    {currentMoment.likesCount}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" style={{ color: 'var(--dgp-text-secondary)' }} />
                  <span
                    className="text-sm"
                    style={{ color: 'var(--dgp-text-secondary)' }}
                  >
                    {currentMoment.commentsCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-4 pointer-events-auto">
              {moments.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onIndexChange(index);
                  }}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{
                    background: index === currentIndex
                      ? 'var(--dgp-text-primary)'
                      : 'var(--dgp-glass-surface)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MomentFullscreenViewer;
