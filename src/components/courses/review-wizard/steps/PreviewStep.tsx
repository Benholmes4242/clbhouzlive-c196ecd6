/**
 * Preview Step - Shows review preview with share prompt after submission
 * Amber-themed CTA buttons matching Post Wizard
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
  const viewerMedia: ViewerMediaItem[] = useMemo(() => {
    if (!media || media.length === 0) return [];
    return media
      .filter(m => m.previewUrl || m.uploadedUrl)
      .map((m, index) => ({
        id: m.id || `media-${index}`,
        media_type: m.type,
        media_url: m.previewUrl || m.uploadedUrl || '',
        poster_url: m.posterUrl || null,
        stream_id: m.streamId || null,
      }))
      .filter(m => m.media_url);
  }, [media]);

  const courseLocation = course 
    ? formatCourseLocation({ country: course.country || null, sub_country: course.sub_country || null, region: course.region || null })
    : '';

  const hasMedia = viewerMedia.length > 0;

  if (!hasMedia && media.length > 0) {
    console.warn('[PreviewStep] Local media exists but no displayable URLs found:', media);
  }

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
            {/* Close button removed — Skip CTA handles exit */}

            {viewerMedia.length > 1 && (
              <PhotoCounterBadge current={1} total={viewerMedia.length} />
            )}

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
        <div className="flex-1 flex flex-col px-4 pb-4 relative">
          <button
            onClick={onClose}
            className="absolute top-0 right-0 z-50 w-11 h-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors active:scale-[0.97]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-sm bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              {course && (
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  {course.thumbnail_image && (
                    <img src={course.thumbnail_image} alt={course.name} className="w-14 h-14 rounded-xl object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{course.name}</h3>
                    {courseLocation && <p className="text-sm text-muted-foreground">{courseLocation}</p>}
                  </div>
                </div>
              )}
              <div className="p-4 text-center border-b border-border">
                <div className="inline-flex items-baseline gap-1">
                  <span className="text-4xl font-bold" style={{ color: (rating ?? 0) >= 9.0 ? '#f59e0b' : '#6b7280' }}>
                    {rating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-lg text-muted-foreground">/10</span>
                </div>
              </div>
              {(title || review) && (
                <div className="p-4">
                  {title && <h4 className="font-semibold text-foreground mb-1">{title}</h4>}
                  {review && <p className="text-sm text-muted-foreground line-clamp-3">{review}</p>}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-center space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Share this review to your Clubhouse feed?</h3>
              <p className="text-sm text-muted-foreground mt-1">Your review has been saved. Share it as a post for others to see.</p>
            </div>
            <div className="flex flex-col gap-3 pt-2 max-w-xs mx-auto w-full">
              <button
                className="w-full h-12 rounded-full gap-2 text-white font-semibold active:scale-[0.97] transition-all duration-200 flex items-center justify-center disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                onClick={onShare}
                disabled={isSharing}
              >
                <Share2 className="h-5 w-5" />
                {isSharing ? 'Sharing...' : 'Share to Clubhouse'}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                <VisIcon className="w-3 h-3" />
                <span className="text-[11px]">{visInfo.label}</span>
              </div>
              <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={onSkip} disabled={isSharing}>
                Skip for Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function PhotoCounterBadge({ current, total }: { current: number; total: number }) {
  return (
    <div 
      className="absolute z-40 bg-black/60 backdrop-blur-xl text-white text-xs font-medium rounded-full px-2.5 py-1"
      style={{ top: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 47px) + 14px)', right: '16px' }}
    >
      {current}/{total}
    </div>
  );
}

function PreviewCTA({ onSkip, onShare, isSharing, title, visibility = 'anyone' }: { 
  onSkip: () => void; onShare: () => void; isSharing: boolean; title?: string; visibility?: ReviewVisibility;
}) {
  const visibilityConfig = {
    anyone: { label: 'Visible to everyone', icon: Globe },
    followers: { label: 'Followers only', icon: Users },
    private: { label: 'Private', icon: Lock },
  };
  const visInfo = visibilityConfig[visibility];
  const VisIcon = visInfo.icon;

  return (
    <>
      {/* Top: Share prompt + button */}
      <div 
        className="absolute inset-x-0 px-4 pointer-events-auto z-30"
        style={{ 
          top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 42px)',
        }}
      >
        <div className="space-y-3">
          <div className="text-center text-white">
            <h3 className="text-lg font-semibold drop-shadow-md">Share this review to your Clubhouse feed?</h3>
            <p className="text-sm text-white/70 mt-1 drop-shadow-sm">Your review has been saved. Share it as a post for others to see.</p>
          </div>
          <div className="flex flex-col gap-2 max-w-xs mx-auto w-full">
            <button
              className="w-full h-12 rounded-full text-white font-semibold gap-2 active:scale-[0.97] transition-all duration-200 flex items-center justify-center shadow-md disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
              onClick={onShare}
              disabled={isSharing}
            >
              <Share2 className="h-5 w-5" />
              {isSharing ? 'Sharing...' : 'Share to Clubhouse'}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-white/50">
              <VisIcon className="w-3 h-3" />
              <span className="text-[11px]">{visInfo.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Skip for Now */}
      <div 
        className="absolute inset-x-0 px-4 pointer-events-auto z-30 flex justify-center"
        style={{ 
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        }}
      >
        <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={onSkip} disabled={isSharing}>
          Skip for Now
        </Button>
      </div>
    </>
  );
}
