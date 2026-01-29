// Thin wrapper for backwards compatibility
// Uses the new PostWizard component

import { PostWizard } from "./post-wizard";
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import { ActorRef } from "./post-wizard/types";

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
  // Note: onSubmit and isSubmitting are intentionally not passed through
  // The wizard handles submission internally via enqueuePostUploadWithResilience
  return (
    <PostWizard
      isOpen={props.isOpen}
      onClose={props.onClose}
      initialMedia={props.mediaItems}
      initialCourses={props.selectedCourse ? [props.selectedCourse] : undefined}
      initialActorOverride={props.initialActorOverride}
    />
  );
}
