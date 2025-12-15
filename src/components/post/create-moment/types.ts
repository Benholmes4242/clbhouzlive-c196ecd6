// Types for Create Moment modal components
import { ComposerMediaItem } from "@/hooks/useSnapModal";

export interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

export interface CreateMomentProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMomentSubmitData) => void;
  isSubmitting: boolean;
  mediaItems?: ComposerMediaItem[];
  selectedCourse?: GolfCourse | null;
  onCourseSelect?: (course: GolfCourse | null) => void;
  onMediaChange?: (items: ComposerMediaItem[]) => void;
}

export interface CreateMomentSubmitData {
  caption: string;
  files: File[];
  mediaItems: ComposerMediaItem[];
  selectedCourse: GolfCourse | null;
  visibility: "public" | "private";
  isPrivate: boolean;
  backgroundMusic: null;
  coverIndex: number;
  studioEditsByMediaId: Record<string, { filter: string }>;
}

// Extended media item with order for reordering
export interface OrderedMediaItem extends ComposerMediaItem {
  order: number;
}

// Draft state for localStorage persistence
export interface CreateMomentDraft {
  caption: string;
  actorType: 'personal' | 'business';
  actorId?: string;
  courseId?: string;
  courseName?: string;
  courseCountry?: string;
  visibility: "public" | "private";
  savedAt: number;
}

// Upload progress state
export interface UploadProgressState {
  status: 'idle' | 'uploading' | 'success' | 'failed';
  uploadedFiles: number;
  totalFiles: number;
  error?: string;
}
