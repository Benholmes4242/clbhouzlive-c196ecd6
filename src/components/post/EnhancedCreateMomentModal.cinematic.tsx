// Thin wrapper for backwards compatibility
// All logic has been moved to src/components/post/create-moment/CreateMomentModal.tsx

import { CreateMomentModal } from "./create-moment";
import { ComposerMediaItem } from "@/hooks/useSnapModal";

type Props = { 
  theme?: "dark" | "light";
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialFiles?: File[];
  mediaItems?: ComposerMediaItem[];
  selectedCourse?: any;
  onCourseSelect?: (course: any) => void;
  onMediaChange?: (items: ComposerMediaItem[]) => void;
};

export default function EnhancedCreateMomentModalCinematic(props: Props) {
  return (
    <CreateMomentModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
      isSubmitting={props.isSubmitting}
      mediaItems={props.mediaItems}
      selectedCourse={props.selectedCourse}
      onCourseSelect={props.onCourseSelect}
      onMediaChange={props.onMediaChange}
    />
  );
}
