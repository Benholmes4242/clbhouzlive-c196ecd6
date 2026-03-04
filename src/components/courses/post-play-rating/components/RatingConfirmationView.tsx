import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { getScoreTier } from '@/utils/getScoreTier';
import { FullscreenReviewPost, type ReviewMediaItem } from '@/components/posts/FullscreenReviewPost';
import { ReviewBottomPanel } from '@/components/posts/ReviewBottomPanel';
import { PreviewCTAButtons } from '@/components/ratings/PreviewCTAButtons';
import type { RatingConfirmationViewProps, ExistingMedia, ShareState } from '../types';

const RatingConfirmationView = React.memo(function RatingConfirmationView(props: RatingConfirmationViewProps) {
  const navigate = useNavigate();
  
  const { user } = useSupabaseSession();
  const { data: userProfile } = useUserProfile(user?.id);
  
  const {
    mode,
    courseName,
    courseId,
    ratingId,
    userRating,
    reviewText,
    breakdown = [],
    communityScore = null,
    submittedMedia = [],
    heroImageUrl,
    heroSubtitle,
    onBack,
    onShareReview,
  } = props;
  
  // CTA state machine
  const [shareState, setShareState] = useState<ShareState>('idle');
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  
  // Handle share with state machine
  const handleShare = async () => {
    if (shareState !== 'idle') return;
    
    setShareState('posting');
    try {
      const result = await onShareReview();
      if (result && typeof result === 'object' && (result.success || result.alreadyShared)) {
        setShareState('shared');
        if (result.postId) {
          setSharedPostId(result.postId);
        }
      } else if (result === undefined) {
        setShareState('shared');
      } else {
        setShareState('idle');
      }
    } catch {
      setShareState('idle');
    }
  };
  
  // Navigate to Clubhouse with deep link to specific post
  const handleViewInClubhouse = () => {
    if (sharedPostId) {
      navigate(`/clubhouse?focusPostId=${sharedPostId}`);
    } else {
      navigate('/clubhouse');
    }
  };

  const isEdit = mode === 'updated';
  const isNewReview = !isEdit;

  // Track confirmation view
  useEffect(() => {
    analyticsEvents.ratings.confirmationViewed({
      courseId,
      courseName,
      isNewReview,
      overallRating: userRating,
    });
  }, [courseId, courseName, isNewReview, userRating]);

  // Handle back to course with analytics + toast
  const handleBackToCourse = () => {
    analyticsEvents.ratings.flowCompleted({
      courseId,
      courseName,
      isNewReview,
    });
    
    if (shareState !== 'shared') {
      toast.success('Rating saved');
    }
    
    onBack();
  };

  // Convert submittedMedia to the format expected by FullscreenReviewPost
  const previewMedia = submittedMedia.map((item, index) => ({
    id: item.id,
    media_type: item.media_type as 'image' | 'video',
    media_url: item.media_url,
    poster_url: item.poster_url,
    stream_id: item.stream_id,
    display_order: index,
  }));

  return (
    <div className="relative flex flex-col h-screen bg-black">
      {/* Fullscreen Preview */}
      <div className="flex-1 relative overflow-hidden">
        <FullscreenReviewPost
          mode="preview"
          courseId={courseId}
          courseName={courseName}
          heroSubtitle={heroSubtitle}
          rating={userRating}
          reviewText={reviewText}
          media={previewMedia}
          onBack={onBack}
          dotsBottomOffset={80}
        >
          {/* Bottom panel */}
          <ReviewBottomPanel
            user={{ 
              id: userProfile?.id || user?.id || 'me', 
              name: userProfile?.display_name || userProfile?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || 'You',
              username: userProfile?.username || user?.user_metadata?.username,
              avatar: userProfile?.profile_photo_url ?? user?.user_metadata?.avatar_url,
            }}
            courseId={courseId}
            rating={userRating}
          />
          
          {/* CTA buttons */}
          <PreviewCTAButtons
            shareState={shareState}
            onShare={handleShare}
            onNotNow={handleBackToCourse}
            onViewInClubhouse={handleViewInClubhouse}
          />
        </FullscreenReviewPost>
      </div>
    </div>
  );
});

export default RatingConfirmationView;
