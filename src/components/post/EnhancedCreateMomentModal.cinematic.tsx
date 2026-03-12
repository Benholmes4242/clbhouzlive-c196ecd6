// Thin wrapper for backwards compatibility
// Uses the new PostWizard component

import { useState, useCallback, useRef, useEffect } from "react";
import { PostWizard } from "./post-wizard";
import { ReviewWizard } from "@/components/courses/review-wizard";
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import { ActorRef } from "./post-wizard/types";
import type { GolfCourse } from "./create-moment/types";
import type { ReviewWizardCourse } from "@/components/courses/review-wizard/types";

type Props = { 
  theme?: "dark" | "light";
  isOpen: boolean;
  onClose: () => void;
  // Legacy props - kept for backwards compatibility but no longer used
  onSubmit?: (data: any) => void;
  isSubmitting?: boolean;
  initialFiles?: File[];
  mediaItems?: ComposerMediaItem[];
  selectedCourse?: any;
  onCourseSelect?: (course: any) => void;
  onMediaChange?: (items: ComposerMediaItem[]) => void;
  /** One-time actor override - applies on mount without persisting */
  initialActorOverride?: ActorRef;
};

export default function EnhancedCreateMomentModalCinematic(props: Props) {
  // Review Wizard bridge state
  const [reviewCourse, setReviewCourse] = useState<ReviewWizardCourse | null>(null);
  const [reviewMediaFiles, setReviewMediaFiles] = useState<File[]>([]);
  const [showReviewWizard, setShowReviewWizard] = useState(false);

  // Bridge handoff guard — keeps modal mounted during the 300ms gap
  const [showPostWizard, setShowPostWizard] = useState(true);
  const reviewHandoffInProgress = useRef(false);

  // Reset showPostWizard when modal re-opens
  useEffect(() => {
    if (props.isOpen) {
      setShowPostWizard(true);
    }
  }, [props.isOpen]);

  const handleClose = useCallback(() => {
    if (reviewHandoffInProgress.current) {
      // Don't close the modal — just hide the PostWizard visually
      setShowPostWizard(false);
      return;
    }
    // Normal close — pass through to parent
    props.onClose();
  }, [props.onClose]);

  const handleRequestReview = useCallback((course: GolfCourse, mediaFiles: File[]) => {
    reviewHandoffInProgress.current = true;

    setReviewCourse({
      id: course.id,
      name: course.name,
      country: course.country,
      region: course.region,
    });
    setReviewMediaFiles(mediaFiles);
    setTimeout(() => setShowReviewWizard(true), 300);
  }, []);

  const handleReviewClose = useCallback(() => {
    setShowReviewWizard(false);
    setReviewCourse(null);
    setReviewMediaFiles([]);
    reviewHandoffInProgress.current = false;
    // NOW close the modal
    props.onClose();
  }, [props.onClose]);

  return (
    <>
      <PostWizard
        isOpen={showPostWizard && props.isOpen}
        onClose={handleClose}
        initialMedia={props.mediaItems}
        initialCourses={props.selectedCourse ? [props.selectedCourse] : undefined}
        initialActorOverride={props.initialActorOverride}
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
    </>
  );
}
