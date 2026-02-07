/**
 * Preview Step - Shows review preview with share prompt after submission
 * Appears between Step 4 (Confirm) and Success Screen for new reviews
 * 
 * IMPORTANT: Uses LOCAL blob URLs from wizard state for immediate preview display.
 * Database fetch is only used when sharing (to get real uploaded URLs).
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Share2, X, Globe, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewPostViewer } from '@/components/posts/ReviewPostViewer';
import { formatCourseLocation } from '@/utils/courseLocation';
import type { ReviewWizardCourse, ReviewBreakdowns, ReviewMediaItem } from '../types';
import type { ReviewMediaItem as ViewerMediaItem } from '@/components/posts/FullscreenReviewPost';
import type { ReviewVisibility } from '../ReviewPostingOptionsSheet';

interface PreviewStepProps {
  course: ReviewWizardCourse | null;
  reviewId: string;
  rating: number | null;
  breakdowns: ReviewBreakdowns;
  title: string;
  review: string;
  media: ReviewMediaItem[];
  coverMediaId: string | null;
  creator: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  visibility?: ReviewVisibility;
  onSkip: () => void;
  onShare: () => void;
  onClose: () => void;
  isSharing: boolean;
}

export function PreviewStep({
  course,
  reviewId,
  rating,
  breakdowns,
  title,
  review,
  media,
  coverMediaId,
  creator,
  visibility = 'anyone',
  onSkip,
  onShare,
  onClose,
  isSharing,
}: PreviewStepProps) {
  // Use LOCAL media from wizard state for preview display (blob URLs work immediately)
  // This ensures fullscreen preview shows instantly without waiting for DB uploads
  const viewerMedia: ViewerMediaItem[] = useMemo(() => {
    if (!media || media.length === 0) return [];
    
    return media
      .filter(m => {
        // Include if we have any displayable URL
        return m.previewUrl || m.uploadedUrl;
      })
      .map((m, index) => {
        // Prefer previewUrl (blob), then uploadedUrl
        const url = m.previewUrl || m.uploadedUrl || '';
        
        return {
          id: m.id || `media-${index}`,
          media_type: m.type,
          media_url: url,
          poster_url: m.posterUrl || null,
          stream_id: m.streamId || null,
        };
      })
      .filter(m => m.media_url); // Only include items with valid URLs
  }, [media]);

  const courseLocation = course 
    ? formatCourseLocation({
        country: course.country || null,
        sub_country: course.sub_country || null,
        region: course.region || null,
      })
    : '';

  // Always use fullscreen preview if we have ANY local media
  const hasMedia = viewerMedia.length > 0;

  // Log for debugging if no media found
  if (!hasMedia && media.length > 0) {
    console.warn('[PreviewStep] Local media exists but no displayable URLs found:', media);
  }

  // Visibility label and icon
  const visibilityConfig = {
    anyone: { label: 'Visible to everyone', icon: Globe },
    followers: { label: 'Followers only', icon: Users },
    private: { label: 'Private', icon: Lock },
  };
  const visInfo = visibilityConfig[visibility];
  const VisIcon = visInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col min-h-0"
    >
      {hasMedia ? (
        // Full-bleed preview with media - ALWAYS show this when we have media
        <div className="flex-1 relative bg-black min-h-0">
          <ReviewPostViewer
            mode="preview"
            courseId={course?.id || ''}
            courseName={course?.name || ''}
            heroSubtitle={courseLocation}
            rating={rating || 0}
            reviewText={review}
            media={viewerMedia}
            initialIndex={0}
            sourceReviewId={reviewId}
            creator={creator}
            showReviewCapsule={false}
          >
            {/* X close button — top-left, glass treatment, safe-area aware */}
            <button
              onClick={onClose}
              className="absolute z-50 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all active:scale-95"
              style={{
                top: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 47px) + 12px)',
                left: '16px',
              }}
              aria-label="Close"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Photo counter badge — top-right */}
            {viewerMedia.length > 1 && (
              <PhotoCounterBadge 
                current={1} 
                total={viewerMedia.length} 
              />
            )}

            {/* CTA overlay at bottom */}
            <PreviewCTA 
              onSkip={onSkip} 
              onShare={onShare} 
              isSharing={isSharing}
              title={title}
              visibility={visibility}
            />
          </ReviewPostViewer>
        </div>
      ) : (
        // No media fallback - compact card preview (should rarely appear)
        <div className="flex-1 flex flex-col px-4 pb-4 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-0 right-0 z-50 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {/* Preview card */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-sm bg-white rounded-2xl border border-border/40 overflow-hidden shadow-sm">
              {/* Course header */}
              {course && (
                <div className="flex items-center gap-3 p-4 border-b border-border/20">
                  {course.thumbnail_image && (
                    <img
                      src={course.thumbnail_image}
                      alt={course.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{course.name}</h3>
                    {courseLocation && (
                      <p className="text-sm text-muted-foreground">{courseLocation}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Rating display - uses 9.0 threshold colors */}
              <div className="p-4 text-center border-b border-border/20">
                <div className="inline-flex items-baseline gap-1">
                  <span 
                    className="text-4xl font-bold"
                    style={{ color: (rating ?? 0) >= 9.0 ? '#f59e0b' : '#6b7280' }}
                  >
                    {rating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-lg text-muted-foreground">/10</span>
                </div>
              </div>
              
              {/* Review text */}
              {(title || review) && (
                <div className="p-4">
                  {title && (
                    <h4 className="font-medium text-foreground mb-1">{title}</h4>
                  )}
                  {review && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{review}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Prompt and buttons */}
          <div className="mt-6 text-center space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Share this review to your Clubhouse feed?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your review has been saved. Share it as a post for others to see.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 pt-2 max-w-xs mx-auto w-full">
              {/* Primary action — brand primary */}
              <Button
                className="w-full h-12 rounded-full gap-2 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 active:scale-[0.97] transition-all duration-200"
                onClick={onShare}
                disabled={isSharing}
              >
                <Share2 className="h-5 w-5" />
                {isSharing ? 'Sharing...' : 'Share to Clubhouse'}
              </Button>
              {/* Visibility reminder */}
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground/50">
                <VisIcon className="w-3 h-3" />
                <span className="text-[11px]">{visInfo.label}</span>
              </div>
              {/* Secondary action - ghost */}
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={onSkip}
                disabled={isSharing}
              >
                Skip for Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Photo counter badge — top-right, glass pill
 */
function PhotoCounterBadge({ current, total }: { current: number; total: number }) {
  return (
    <div 
      className="absolute z-40 bg-black/60 backdrop-blur-xl text-white text-xs font-medium rounded-full px-2.5 py-1"
      style={{
        top: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 47px) + 14px)',
        right: '16px',
      }}
    >
      {current}/{total}
    </div>
  );
}

/**
 * CTA overlay for full-bleed preview mode
 */
function PreviewCTA({ 
  onSkip, 
  onShare, 
  isSharing,
  title,
  visibility = 'anyone',
}: { 
  onSkip: () => void; 
  onShare: () => void; 
  isSharing: boolean;
  title?: string;
  visibility?: ReviewVisibility;
}) {
  const visibilityConfig = {
    anyone: { label: 'Visible to everyone', icon: Globe },
    followers: { label: 'Followers only', icon: Users },
    private: { label: 'Private', icon: Lock },
  };
  const visInfo = visibilityConfig[visibility];
  const VisIcon = visInfo.icon;

  return (
    <div 
      className="absolute bottom-0 inset-x-0 pb-[env(safe-area-inset-bottom)] px-4 pointer-events-auto z-30"
      style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 25%, rgba(0,0,0,0.3) 50%, transparent 100%)',
        paddingTop: '5rem',
      }}
    >
      <div className="space-y-3 pb-4">
        {/* P6: Verdict text preview — truncated summary title */}
        {title && (
          <p className="text-white/90 text-base font-medium line-clamp-2 text-center max-w-xs mx-auto">
            "{title}"
          </p>
        )}

        {/* Prompt text */}
        <div className="text-center text-white">
          <h3 className="text-lg font-semibold">
            Share this review to your Clubhouse feed?
          </h3>
          <p className="text-sm text-white/70 mt-1">
            Your review has been saved. Share it as a post for others to see.
          </p>
        </div>
        
        {/* Buttons - stacked with primary action first */}
        <div className="flex flex-col gap-2 max-w-xs mx-auto w-full">
          {/* Primary action — brand primary (emerald) */}
          <Button
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 gap-2 active:scale-[0.97] transition-all duration-200"
            onClick={onShare}
            disabled={isSharing}
          >
            <Share2 className="h-5 w-5" />
            {isSharing ? 'Sharing...' : 'Share to Clubhouse'}
          </Button>
          {/* P8: Visibility reminder */}
          <div className="flex items-center justify-center gap-1.5 text-white/50">
            <VisIcon className="w-3 h-3" />
            <span className="text-[11px]">{visInfo.label}</span>
          </div>
          {/* Secondary action - subtle */}
          <Button
            variant="ghost"
            className="w-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
            onClick={onSkip}
            disabled={isSharing}
          >
            Skip for Now
          </Button>
        </div>
      </div>
    </div>
  );
}
