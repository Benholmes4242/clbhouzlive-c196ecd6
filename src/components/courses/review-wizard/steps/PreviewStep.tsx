/**
 * Preview Step - Shows review preview with share prompt after submission
 * Appears between Step 4 (Confirm) and Success Screen for new reviews
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewPostViewer } from '@/components/posts/ReviewPostViewer';
import { formatCourseLocation } from '@/utils/courseLocation';
import type { ReviewWizardCourse, ReviewBreakdowns, ReviewMediaItem } from '../types';
import type { ReviewMediaItem as ViewerMediaItem } from '@/components/posts/FullscreenReviewPost';

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
  onSkip: () => void;
  onShare: () => void;
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
  onSkip,
  onShare,
  isSharing,
}: PreviewStepProps) {
  // Transform media to viewer format
  const viewerMedia: ViewerMediaItem[] = media
    .filter(m => m.uploadedUrl || m.status === 'existing')
    .map(m => ({
      id: m.id,
      media_type: m.type,
      media_url: m.uploadedUrl || m.previewUrl,
      poster_url: m.posterUrl || null,
    }));

  const courseLocation = course 
    ? formatCourseLocation({
        country: course.country || null,
        sub_country: course.sub_country || null,
        region: course.region || null,
      })
    : '';

  // If we have media, show the full preview
  const hasMedia = viewerMedia.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col min-h-0"
    >
      {hasMedia ? (
        // Full-bleed preview with media
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
            {/* CTA overlay at bottom */}
            <PreviewCTA 
              onSkip={onSkip} 
              onShare={onShare} 
              isSharing={isSharing} 
            />
          </ReviewPostViewer>
        </div>
      ) : (
        // No media - show compact preview
        <div className="flex-1 flex flex-col px-4 pb-4">
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
              
              {/* Rating display */}
              <div className="p-4 text-center border-b border-border/20">
                <div className="inline-flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
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
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={onSkip}
                disabled={isSharing}
              >
                Skip for Now
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl gap-2"
                onClick={onShare}
                disabled={isSharing}
              >
                <Share2 className="h-4 w-4" />
                {isSharing ? 'Sharing...' : 'Share to Clubhouse'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * CTA overlay for full-bleed preview mode
 */
function PreviewCTA({ 
  onSkip, 
  onShare, 
  isSharing 
}: { 
  onSkip: () => void; 
  onShare: () => void; 
  isSharing: boolean;
}) {
  return (
    <div className="absolute bottom-0 inset-x-0 pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 px-4">
      <div className="space-y-3 pb-4">
        {/* Prompt text */}
        <div className="text-center text-white">
          <h3 className="text-lg font-semibold">
            Share this review to your Clubhouse feed?
          </h3>
          <p className="text-sm text-white/70 mt-1">
            Your review has been saved. Share it as a post for others to see.
          </p>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-full border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20"
            onClick={onSkip}
            disabled={isSharing}
          >
            Skip for Now
          </Button>
          <Button
            className="flex-1 h-12 rounded-full bg-white text-black font-semibold hover:bg-white/90 gap-2"
            onClick={onShare}
            disabled={isSharing}
          >
            <Share2 className="h-4 w-4" />
            {isSharing ? 'Sharing...' : 'Share to Clubhouse'}
          </Button>
        </div>
      </div>
    </div>
  );
}
