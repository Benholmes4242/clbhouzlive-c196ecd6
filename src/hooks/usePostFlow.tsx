
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

interface AchievementData {
  achievementId: string;
  name: string;
  description: string;
  category: string;
  points: number;
}

export const usePostFlow = () => {
  const captionInputRef = useRef<HTMLDivElement>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<TaggableEntity[]>([]);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const [achievementData, setAchievementData] = useState<AchievementData | null>(null);

  // Clean up preview URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrl, previewUrls]);

  const openGallery = () => {
    console.log('Opening gallery picker');
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    console.log('Closing gallery picker');
    setIsGalleryOpen(false);
  };

  const resetState = () => {
    console.log('Resetting post flow state');
    
    // Clean up existing preview URLs
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    // Reset all state
    setSelectedFile(null);
    setSelectedFiles([]);
    setPreviewUrl('');
    setPreviewUrls([]);
    setCaption('');
    setSelectedTags([]);
    setSelectedCourse(null);
    setShowSuggestions(false);
    setIsSubmitting(false);
    
    // Clear caption input
    if (captionInputRef.current) {
      captionInputRef.current.textContent = '';
    }
  };

  const openComposer = (file?: File, additionalFiles: File[] = []) => {
    console.log('usePostFlow: openComposer called with file:', file?.name, file?.type);
    if (file) {
      console.log('usePostFlow openComposer called with file:', file.name, file.type);
      console.log('Additional files count:', additionalFiles.length);
      
      // Close gallery first
      console.log('Closing gallery in openComposer');
      setIsGalleryOpen(false);
      
      // Clean previous state
      if (previewUrl && previewUrl !== URL.createObjectURL(file)) {
        URL.revokeObjectURL(previewUrl);
      }
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Set new files and previews
      const allFiles = [file, ...additionalFiles];
      console.log('Setting selectedFile to:', file.name);
      setSelectedFile(file);
      console.log('Setting selectedFiles to array of length:', allFiles.length);
      setSelectedFiles(allFiles);
      
      const mainUrl = URL.createObjectURL(file);
      const allUrls = allFiles.map(f => URL.createObjectURL(f));
      
      console.log('Creating preview URLs - main:', mainUrl);
      console.log('Creating preview URLs - all count:', allUrls.length);
      setPreviewUrl(mainUrl);
      setPreviewUrls(allUrls);
    } else {
      // Desktop direct access - open without initial files
      console.log('usePostFlow openComposer called without files (desktop direct access)');
      setIsGalleryOpen(false);
      resetState(); // Clean any existing state
    }
    
    // Open composer with a small delay to ensure gallery is closed
    setTimeout(() => {
      console.log('usePostFlow - Opening composer modal now, isComposerOpen will be set to true');
      setIsComposerOpen(true);
      console.log('usePostFlow - isComposerOpen set to true');
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
    selectedFiles,
    previewUrl,
    previewUrls,
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
    achievementData,
    setAchievementData,
    openGallery,
    closeGallery,
    openComposer,
    closeComposer,
    showConfirmationToast,
    hideToast,
    resetState
  };
};
