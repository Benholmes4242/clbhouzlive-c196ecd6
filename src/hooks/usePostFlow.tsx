
import { useState, useRef, useEffect } from 'react';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

export const usePostFlow = () => {
  const captionInputRef = useRef<HTMLDivElement>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<TaggableEntity[]>([]);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const openGallery = () => {
    console.log('Opening gallery picker');
    // Reset state when opening gallery
    resetState();
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    console.log('Closing gallery picker');
    setIsGalleryOpen(false);
    // Don't reset state here - allow user to try again
  };

  const resetState = () => {
    console.log('Resetting post flow state');
    // Clean up existing preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    setSelectedTags([]);
    setSelectedCourse(null);
    setShowSuggestions(false);
    setIsSubmitting(false);
  };

  const openComposer = (file: File) => {
    console.log('Opening composer with file:', file.name, file.type);
    
    // Close gallery first
    setIsGalleryOpen(false);
    
    // Clean previous state
    if (previewUrl && previewUrl !== URL.createObjectURL(file)) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Set new file and preview
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Open composer with a small delay to ensure gallery is closed
    setTimeout(() => {
      console.log('Opening composer modal now');
      setIsComposerOpen(true);
    }, 100);
  };

  const closeComposer = () => {
    console.log('Closing composer');
    setIsComposerOpen(false);
    resetState();
  };

  const showConfirmationToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const hideToast = () => {
    setShowToast(false);
    setToastMessage('');
  };

  return {
    captionInputRef,
    isGalleryOpen,
    isComposerOpen,
    selectedFile,
    previewUrl,
    caption,
    setCaption,
    isSubmitting,
    setIsSubmitting,
    showSuggestions,
    setShowSuggestions,
    mentionSuggestions,
    setMentionSuggestions,
    selectedTags,
    setSelectedTags,
    cursorPosition,
    setCursorPosition,
    showToast,
    toastMessage,
    selectedCourse,
    setSelectedCourse,
    openGallery,
    closeGallery,
    openComposer,
    closeComposer,
    showConfirmationToast,
    hideToast,
    resetState
  };
};
