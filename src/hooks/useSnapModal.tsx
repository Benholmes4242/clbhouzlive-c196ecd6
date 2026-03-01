import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useModalContext } from '@/contexts/ModalContext';
import { normalizeFilesToMediaItems, revokeMediaItemUrls, generateVideoPoster } from '@/lib/mediaUtils';

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

// Upload status for individual media items
export type MediaUploadStatus = 'pending' | 'uploading' | 'complete' | 'failed';

export interface ComposerMediaItem {
  id: string;
  type: ComposerMediaType;
  file?: File;  // Optional for compiled videos (server-generated) or restored drafts
  previewUrl: string; // blob URL or remote URL for restored drafts
  thumbnailUrl?: string; // for videos: a generated poster image blob URL
  duration?: number;  // optional for video
  // Dimensions (optional, populated from file metadata or draft)
  width?: number;
  height?: number;
  aspectRatio?: number;
  // For server-compiled videos (Smart Compilation)
  compiledVideo?: {
    streamId: string;
    playbackUrl: string;
    posterUrl: string;
    duration: number;
  };
  // For restored drafts - indicates media was loaded from storage
  isRestored?: boolean;
  restoredMediaUrl?: string; // The permanent URL for restored media
  restoredStreamId?: string; // For restored videos
  // Upload progress tracking
  uploadStatus?: MediaUploadStatus;
  uploadProgress?: number; // 0-100 for chunked uploads
  // Trim range (video only)
  trimStart?: number | null;
  trimEnd?: number | null;
  // Poster frame timestamp (video only)
  posterTimestamp?: number | null;
}

type SnapState = {
  isComposerOpen: boolean;
  mode: 'create' | 'edit';  // NEW - track if creating new or editing existing
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
  const originRef = useRef<string | null>(null);
  const { setCreateMomentModalOpen } = useModalContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  
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


  // Legacy single file opener (backward compatibility)
  const openComposer = async (file: File) => {
    console.log('OpenComposer called with single file:', file.name, file.type);
    await openComposerWithFiles([file]);
  };

  // NEW: Multi-file opener
  const openComposerWithFiles = async (files: File[], composerMode: 'create' | 'edit' = 'create'): Promise<void> => {
    console.log('[composer] received files:', files?.length, 'mode:', composerMode);
    
    // Capture origin route before opening
    originRef.current = location.pathname + location.search;
    
    // Set mode first
    setMode(composerMode);

    // Clean previous state
    cleanupPreviousMedia();

    try {
      console.time('[composer] normalize');
      const result = await normalizeFilesToMediaItems(files);
      console.timeEnd('[composer] normalize');
      console.log('[composer] normalized items:', result.validItems?.length, 'errors:', result.errors?.length);

      // Log any validation errors (toast would require importing toast here)
      if (result.errors?.length > 0) {
        result.errors.forEach(err => {
          console.warn(`[composer] File rejected: ${err.fileName} - ${err.error}`);
        });
      }

      const items = result.validItems;
      setMediaItems(items);

      // Legacy state for first file (backward compatibility)
      if (items.length > 0) {
        setSelectedFile(items[0].file);
        setPreviewUrl(items[0].previewUrl);
      }

      // Ensure items land first, then open modal
      setTimeout(() => {
        console.log('[composer] setting isComposerOpen to true');
        setIsComposerOpen(true);
        setCreateMomentModalOpen(true); // Update modal context
      }, 0);
    } catch (error) {
      console.error('[composer] normalize failed:', error);
      // Fallback: open with minimal items so user isn't blocked
      try {
        const minimal: ComposerMediaItem[] = await Promise.all(files.map(async (f, i) => {
          const url = URL.createObjectURL(f);
          const isVideo = f.type.startsWith('video');
          let thumbnailUrl = url;
          
          // Try to generate a thumbnail for videos
          if (isVideo) {
            try {
              thumbnailUrl = await generateVideoPoster(f);
            } catch {
              thumbnailUrl = url; // fallback to video blob URL
            }
          }
          
          return {
            id: `${Date.now()}-${i}`,
            type: isVideo ? 'video' : 'image',
            file: f,
            previewUrl: url,
            thumbnailUrl,
          } as ComposerMediaItem;
        }));
        setMediaItems(minimal);
        if (minimal.length > 0) {
          setSelectedFile(minimal[0].file);
          setPreviewUrl(minimal[0].previewUrl);
        }
        console.log('[composer] opening with minimal items');
        setIsComposerOpen(true);
        setCreateMomentModalOpen(true); // Update modal context
        console.warn('[composer] opened with minimal items due to normalize error');
      } catch (e2) {
        console.error('[composer] fallback failed:', e2);
      }
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

  // Reset all transient composer state to defaults
  const resetComposerState = () => {
    console.log('Resetting composer state to defaults');
    setMediaItems([]);
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    setSelectedTags([]);
    setSelectedCourse(null);
    setShowSuggestions(false);
    setMentionSuggestions([]);
    setCursorPosition(0);
    setIsSubmitting(false);
    setVisibility("public");
    setMode('create'); // Reset mode to 'create' for next session
  };

  const closeComposer = () => {
    console.log('Closing composer, returning to:', originRef.current);
    
    // Clean up media before clearing state (so we have mediaItems to cleanup)
    cleanupPreviousMedia();
    
    setIsComposerOpen(false);
    setCreateMomentModalOpen(false); // Update modal context
    
    // Navigate back to origin (if we have one and it's not the current route)
    const origin = originRef.current;
    originRef.current = null; // Clear for next open
    
    // Only navigate if origin exists and is different from current
    if (origin && origin !== location.pathname + location.search) {
      navigate(origin, { replace: true });
    }
    
    // Reset all transient state
    resetComposerState();
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
    isComposerOpen,
    mode,
    mediaItems,
    setMediaItems,
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
    openComposer,
    openComposerWithFiles, // NEW
    closeComposer,
    resetComposerState, // Exposed for manual reset if needed
    showConfirmationToast,
    hideToast
  };
};
