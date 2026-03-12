import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PostWizard } from '@/components/post/post-wizard';
import { ReviewWizard } from '@/components/courses/review-wizard';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { useChromeState } from '@/hooks/useChromeState';
import AccessControl from '@/components/AccessControl';
import type { GolfCourse } from '@/components/post/create-moment/types';
import type { ReviewWizardCourse } from '@/components/courses/review-wizard/types';
import { fetchPostForEdit, type PostForEdit } from '@/lib/fetchPostForEdit';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export default function CreateMomentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();

  // Get state from navigation (media items, course, edit post ID, etc.)
  const navState = location.state as any;
  const mediaItems = navState?.mediaItems || [];
  const selectedCourse = navState?.selectedCourse;
  const initialActorOverride = navState?.initialActorOverride;
  const editPostId = navState?.editPostId as string | undefined;

  // Force hide chrome (header, footer, HUD) while this page is open
  useChromeState({ forceHidden: true });

  // Post Wizard open state
  const [showPostWizard, setShowPostWizard] = useState(true);

  // Edit mode: fetched post data
  const [editPostData, setEditPostData] = useState<PostForEdit | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Fetch post data for edit mode
  useEffect(() => {
    if (!editPostId || !user?.id) return;
    let cancelled = false;
    setEditLoading(true);
    fetchPostForEdit(editPostId, user.id).then(data => {
      if (cancelled) return;
      if (data) {
        setEditPostData(data);
      } else {
        // Ownership check failed or post not found
        navigate('/clubhouse', { replace: true });
      }
      setEditLoading(false);
    });
    return () => { cancelled = true; };
  }, [editPostId, user?.id, navigate]);

  // Review Wizard bridge state
  const [reviewCourse, setReviewCourse] = useState<ReviewWizardCourse | null>(null);
  const [reviewMediaFiles, setReviewMediaFiles] = useState<File[]>([]);
  const [showReviewWizard, setShowReviewWizard] = useState(false);
  const reviewHandoffInProgress = useRef(false);

  const handleClose = useCallback(() => {
    if (reviewHandoffInProgress.current) {
      setShowPostWizard(false);
      return;
    }
    const backgroundLocation = (location.state as any)?.backgroundLocation;
    if (backgroundLocation) {
      navigate(backgroundLocation.pathname + backgroundLocation.search, { replace: true });
    } else {
      navigate('/clubhouse', { replace: true });
    }
  }, [location.state, navigate]);

  const handleRequestReview = useCallback((course: GolfCourse, mediaFiles: File[]) => {
    reviewHandoffInProgress.current = true;
    const reviewCourseData: ReviewWizardCourse = {
      id: course.id,
      name: course.name,
      country: course.country,
      region: course.region,
    };
    setReviewCourse(reviewCourseData);
    setReviewMediaFiles(mediaFiles);
    setTimeout(() => {
      setShowReviewWizard(true);
    }, 300);
  }, []);

  const handleReviewClose = useCallback(() => {
    setShowReviewWizard(false);
    setReviewCourse(null);
    setReviewMediaFiles([]);
    reviewHandoffInProgress.current = false;
    const backgroundLocation = (location.state as any)?.backgroundLocation;
    if (backgroundLocation) {
      navigate(backgroundLocation.pathname + backgroundLocation.search, { replace: true });
    } else {
      navigate('/clubhouse', { replace: true });
    }
  }, [location.state, navigate]);

  // Don't render wizard until edit data is loaded
  if (editPostId && (editLoading || !editPostData)) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AccessControl requireAuth={true}>
      <PostWizard
        isOpen={showPostWizard}
        onClose={handleClose}
        initialMedia={mediaItems}
        initialCourses={selectedCourse ? [selectedCourse] : undefined}
        initialActorOverride={initialActorOverride}
        onRequestReview={handleRequestReview}
        editPostData={editPostData || undefined}
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
