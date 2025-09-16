import { useState, useRef } from 'react';
import { normalizeFilesToMediaItems, revokeMediaItemUrls } from '@/lib/mediaUtils';

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

// Types for composer media items
export type ComposerMediaType = "image" | "video";

export interface ComposerMediaItem {
  id: string;
  type: ComposerMediaType;
  file: File;
  previewUrl: string; // blob URL
  duration?: number;  // optional for video
}

type SnapState = {
  isSnapModalOpen: boolean;
  isComposerOpen: boolean;
  mediaItems: ComposerMediaItem[];  // NEW - replaces selectedFile
  caption: string;
  selectedCourse: GolfCourse | null;
  visibility: "public" | "private";
  
  // Legacy support for single file (backward compatibility)
  selectedFile: File | null;
  previewUrl: string;
  
  // Other state
  isSubmitting: boolean;
  showSuggestions: boolean;
  mentionSuggestions: TaggableEntity[];
  selectedTags: TaggableEntity[];
  cursorPosition: number;
  showToast: boolean;
  toastMessage: string;
  captionInputRef: React.RefObject<HTMLDivElement>;
};

export const useSnapModal = () => {
  const captionInputRef = useRef<HTMLDivElement>(null);
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  
  // New multi-media state
  const [mediaItems, setMediaItems] = useState<ComposerMediaItem[]>([]);
  
  // Legacy single file state for backward compatibility
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
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const openSnapModal = () => {
    console.log('Opening snap modal');
    setIsSnapModalOpen(true);
  };

  const closeSnapModal = () => {
    console.log('Closing snap modal');
    setIsSnapModalOpen(false);
  };

  // Legacy single file opener (backward compatibility)
  const openComposer = async (file: File) => {
    console.log('OpenComposer called with single file:', file.name, file.type);
    await openComposerWithFiles([file]);
  };

  // NEW: Multi-file opener
  const openComposerWithFiles = async (files: File[]): Promise<void> => {
    console.log('OpenComposerWithFiles called with files:', files.length);
    console.log('Files:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    // Close snap modal first
    setIsSnapModalOpen(false);
    
    // Clean previous state
    cleanupPreviousMedia();
    
    try {
      // Normalize files to media items
      const items = await normalizeFilesToMediaItems(files);
      setMediaItems(items);
      
      // Set legacy state for first file (backward compatibility)
      if (items.length > 0) {
        setSelectedFile(items[0].file);
        setPreviewUrl(items[0].previewUrl);
      }
      
      // Open composer with a small delay to ensure snap modal is closed
      setTimeout(() => {
        console.log('Opening composer modal now with', items.length, 'items');
        setIsComposerOpen(true);
      }, 100);
    } catch (error) {
      console.error('Failed to process files for composer:', error);
    }
  };

  const cleanupPreviousMedia = () => {
    // Revoke previous media URLs to prevent memory leaks
    if (mediaItems.length > 0) {
      revokeMediaItemUrls(mediaItems);
    }
    
    // Clean legacy preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const closeComposer = () => {
    console.log('Closing composer');
    setIsComposerOpen(false);
    
    // Clean up media
    cleanupPreviousMedia();
    
    // Reset state
    setMediaItems([]);
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    setSelectedTags([]);
    setSelectedCourse(null);
    setShowSuggestions(false);
    setIsSubmitting(false);
    setVisibility("public");
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
    // Core state
    captionInputRef,
    isSnapModalOpen,
    isComposerOpen,
    mediaItems,
    caption,
    setCaption,
    selectedCourse,
    setSelectedCourse,
    visibility,
    setVisibility,
    
    // Legacy state (backward compatibility)
    selectedFile,
    previewUrl,
    
    // UI state
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
    
    // Actions
    openSnapModal,
    closeSnapModal,
    openComposer,
    openComposerWithFiles, // NEW
    closeComposer,
    showConfirmationToast,
    hideToast
  };
};
