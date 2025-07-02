export interface GalleryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
  onMultipleFilesSelected?: (files: File[]) => void;
}

export interface MultiSelectPreviewProps {
  selectedFiles: File[];
  previewUrls: string[];
  onFileRemove: (index: number) => void;
  onConfirmSelection: () => void;
  onClose: () => void;
}

export interface PickerContentProps {
  isMultiSelectMode: boolean;
  isMobile: boolean;
  onCameraClick: () => void;
  onPhotoClick: () => void;
  onVideoClick: () => void;
  multiSelectPreview: React.ReactNode;
}