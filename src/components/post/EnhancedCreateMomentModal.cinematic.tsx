// Thin wrapper for backwards compatibility
// All logic has been moved to src/components/post/create-moment/CreateMomentModal.tsx

import { CreateMomentModal } from "./create-moment";
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import { ActorRef } from "./create-moment/types";

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
  // The modal handles submission internally via enqueuePostUploadWithResilience
  return (
    <CreateMomentModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      mediaItems={props.mediaItems}
      selectedCourse={props.selectedCourse}
      onCourseSelect={props.onCourseSelect}
      onMediaChange={props.onMediaChange}
      initialActorOverride={props.initialActorOverride}
    />
  );
}
