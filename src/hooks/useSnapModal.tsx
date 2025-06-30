
import { useState, useRef } from 'react';

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

export const useSnapModal = () => {
  const captionInputRef = useRef<HTMLDivElement>(null);
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);
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

  const openSnapModal = () => {
    console.log('Opening snap modal');
    setIsSnapModalOpen(true);
  };

  const closeSnapModal = () => {
    console.log('Closing snap modal');
    setIsSnapModalOpen(false);
  };

  const openComposer = (file: File) => {
    console.log('OpenComposer called with file:', file.name, file.type);
    
    // Clear any existing state first
    setSelectedFile(null);
    setPreviewUrl('');
    
    // Set new file and preview
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Force close snap modal immediately
    setIsSnapModalOpen(false);
    
    // Force open composer with a slight delay to ensure state is clean
    setTimeout(() => {
      console.log('Opening composer modal now');
      setIsComposerOpen(true);
    }, 50);
  };

  const closeComposer = () => {
    console.log('Closing composer');
    setIsComposerOpen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    setSelectedTags([]);
    setSelectedCourse(null);
    setShowSuggestions(false);
    setIsSubmitting(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
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
    isSnapModalOpen,
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
    openSnapModal,
    closeSnapModal,
    openComposer,
    closeComposer,
    showConfirmationToast,
    hideToast
  };
};
