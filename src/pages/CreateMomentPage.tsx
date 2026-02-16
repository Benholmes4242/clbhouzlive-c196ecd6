import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PostWizard } from '@/components/post/post-wizard';
import { ReviewWizard } from '@/components/courses/review-wizard';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { useChromeState } from '@/hooks/useChromeState';
import AccessControl from '@/components/AccessControl';
import type { GolfCourse } from '@/components/post/create-moment/types';
import type { ReviewWizardCourse } from '@/components/courses/review-wizard/types';

export default function CreateMomentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get state from navigation (media items, course, etc.)
  const navState = location.state as any;
  const mediaItems = navState?.mediaItems || [];
  const selectedCourse = navState?.selectedCourse;
  const initialActorOverride = navState?.initialActorOverride;

  // Force hide chrome (header, footer, HUD) while this page is open
  useChromeState({ forceHidden: true });

  // Review Wizard bridge state
  const [reviewCourse, setReviewCourse] = useState<ReviewWizardCourse | null>(null);
  const [reviewMediaFiles, setReviewMediaFiles] = useState<File[]>([]);
  const [showReviewWizard, setShowReviewWizard] = useState(false);

  const handleClose = useCallback(() => {
    // Navigate back to previous location or clubhouse
    const backgroundLocation = (location.state as any)?.backgroundLocation;
    if (backgroundLocation) {
      navigate(backgroundLocation.pathname + backgroundLocation.search, { replace: true });
    } else {
      navigate('/clubhouse', { replace: true });
    }
  }, [location.state, navigate]);

  // Post-to-Review bridge: receive course + media from PostWizard success screen
  const handleRequestReview = useCallback((course: GolfCourse, mediaFiles: File[]) => {
    const reviewCourseData: ReviewWizardCourse = {
      id: course.id,
      name: course.name,
      country: course.country,
      region: course.region,
    };
    
    setReviewCourse(reviewCourseData);
    setReviewMediaFiles(mediaFiles);
    
    // Small delay to let Post Wizard close animation complete
    setTimeout(() => {
      setShowReviewWizard(true);
    }, 300);
  }, []);

  const handleReviewClose = useCallback(() => {
    setShowReviewWizard(false);
    setReviewCourse(null);
    setReviewMediaFiles([]);
    // Navigate away after review wizard closes
    handleClose();
  }, [handleClose]);

  return (
    <AccessControl requireAuth={true}>
      <PostWizard
        isOpen={true}
        onClose={handleClose}
        initialMedia={mediaItems}
        initialCourses={selectedCourse ? [selectedCourse] : undefined}
        initialActorOverride={initialActorOverride}
        onRequestReview={handleRequestReview}
      />
      {reviewCourse && (
        <ReviewWizard
          course={reviewCourse}
          isOpen={showReviewWizard}
          onClose={handleReviewClose}
          initialMediaFiles={reviewMediaFiles}
        />
      )}
    </AccessControl>
  );
}
