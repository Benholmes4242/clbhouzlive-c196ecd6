// Thin wrapper for backwards compatibility
// Uses the new PostWizard component

import { useState, useCallback } from "react";
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

  const handleRequestReview = useCallback((course: GolfCourse, mediaFiles: File[]) => {
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
    props.onClose();
  }, [props.onClose]);

  return (
    <>
      <PostWizard
        isOpen={props.isOpen}
        onClose={props.onClose}
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
