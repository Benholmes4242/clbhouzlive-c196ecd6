import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Camera, Image, Video, Loader2 } from 'lucide-react';
import CourseTagInput from '../posts/CourseTagInput';
import GolfCoursePin from '../posts/GolfCoursePin';
import EnhancedMediaUpload from '../posts/EnhancedMediaUpload';
import EnhancedRichTextInput from '../posts/EnhancedRichTextInput';
import { supabase } from '@/integrations/supabase/client';

import BackgroundMusicSelector from '../posts/BackgroundMusicSelector';
import { useTaggableEntities } from '@/hooks/useTaggableEntities';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface EnhancedCreateMomentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    caption: string;
    files: File[];
    tags: TaggableEntity[];
    course?: GolfCourse | null;
    isPrivate?: boolean;
    backgroundMusic?: {
      track: string;
      audioUrl: string;
      replaceOriginalAudio: boolean;
    } | null;
  }) => void;
  isSubmitting: boolean;
  initialFiles?: File[];
  selectedCourse?: GolfCourse | null;
  onCourseSelect?: (course: GolfCourse | null) => void;
  // Edit mode props
  editMode?: boolean;
  initialCaption?: string;
  initialTags?: TaggableEntity[];
  existingMediaUrls?: string[];
  initialIsPrivate?: boolean;
}

const EnhancedCreateMomentModal: React.FC<EnhancedCreateMomentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialFiles = [],
  selectedCourse,
  onCourseSelect,
  editMode = false,
  initialCaption = '',
  initialTags = [],
  existingMediaUrls = [],
  initialIsPrivate = false
}) => {
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [backgroundMusic, setBackgroundMusic] = useState<{
    track: string;
    audioUrl: string;
    replaceOriginalAudio: boolean;
  } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { entities, searchEntities } = useTaggableEntities();
  
  const [modalMode, setModalMode] = useState<'selection' | 'upload'>('selection');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isButtonShaking, setIsButtonShaking] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const isMobile = useIsMobile();
  const previouslyOpenRef = useRef(false);

  // Validation function
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Check for media requirement
    if (files.length === 0 && existingMediaUrls.length === 0) {
      errors.media = "Please upload at least one photo or video";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Auto-focus on first invalid field
  const focusFirstInvalidField = () => {
    if (validationErrors.media) {
      // Focus on media upload area
      const mediaUpload = document.querySelector('[data-testid="media-upload"]') as HTMLElement;
      if (mediaUpload) {
        mediaUpload.focus();
        mediaUpload.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Initialize modal state when it opens
  useEffect(() => {
    if (isOpen && !previouslyOpenRef.current) {
      // Initialize state based on mode
      if (editMode) {
        setCaption(initialCaption);
        setSelectedTags([...initialTags]);
        setFiles([...initialFiles]);
        setIsPrivate(initialIsPrivate);
        setVisibility(initialIsPrivate ? "private" : "public");
        setModalMode('upload'); // Skip selection for edit mode
      } else {
        setCaption('');
        setSelectedTags([]);
        setFiles([...initialFiles]);
        setIsPrivate(false); // Default to public
        setVisibility("public");
        const mode = initialFiles.length > 0 ? 'upload' : 'selection';
        setModalMode(mode);
      }
      setSubmitError(null);
      setValidationErrors({});
      setIsButtonShaking(false);
      previouslyOpenRef.current = true;
    } else if (!isOpen && previouslyOpenRef.current) {
      // Reset when modal closes
      previouslyOpenRef.current = false;
      setModalMode('selection');
      setSubmitError(null);
      setValidationErrors({});
      setIsButtonShaking(false);
    }
  }, [isOpen]); // Only depend on isOpen to avoid infinite loops

  // Handle caption input with mention detection
  const handleCaptionChange = async (text: string) => {
    setCaption(text);
  };

  // Handle mention selection
  const handleSelectMention = (entity: TaggableEntity) => {
    // Prevent duplicate tags
    if (selectedTags.find(tag => tag.id === entity.id)) {
      setShowSuggestions(false);
      return;
    }
    
    // Use regex to replace the last @ mention
    const mentionRegex = /@(\w+)$/;
    const displayName = entity.username || entity.name;
    const newCaption = caption.replace(mentionRegex, `@${displayName} `);
    
    setCaption(newCaption);
    setSelectedTags(prev => [...prev, entity]);
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    // Validate form first
    if (!validateForm()) {
      // Shake button animation for validation errors
      setIsButtonShaking(true);
      setTimeout(() => setIsButtonShaking(false), 600);
      
      // Focus first invalid field
      setTimeout(() => focusFirstInvalidField(), 100);
      return;
    }

    try {
      setSubmitError(null); // Clear any previous errors
      setValidationErrors({}); // Clear validation errors
      
      // Call the submit handler (which handles success feedback)
      onSubmit({
        caption,
        files,
        tags: selectedTags,
        course: selectedCourse,
        isPrivate: visibility === "private",
        backgroundMusic
      });
      
    } catch (error) {
      // Error handling for immediate submission failures
      const errorMessage = error instanceof Error ? error.message : "Upload failed. Please try again.";
      setSubmitError(errorMessage);
      
      // Shake button animation
      setIsButtonShaking(true);
      setTimeout(() => setIsButtonShaking(false), 600);
      
      toast.error("Upload failed", { description: errorMessage });
    }
  };

  const handleCancel = () => {
    setCaption('');
    setFiles([]);
    setSelectedTags([]);
    setIsPrivate(false);
    setVisibility("public");
    setModalMode('selection');
    onClose();
  };

  // Action button handlers
  const handleCaptureClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.setAttribute('capture', 'environment'); // Use rear camera
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    
    // Add to DOM temporarily for iOS compatibility
    document.body.appendChild(input);
    
    input.onchange = (event) => {
      const selectedFiles = Array.from((event.target as HTMLInputElement).files || []);
      
      // Clean up
      document.body.removeChild(input);
      
      if (selectedFiles.length > 0) {
        setFiles(selectedFiles);
        setModalMode('upload');
      }
    };
    
    // Add error handling
    input.onerror = () => {
      document.body.removeChild(input);
    };
    
    input.click();
  };

  const handleSelectPhotos = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic';
    input.multiple = true;
    
    input.onchange = (event) => {
      const selectedFiles = Array.from((event.target as HTMLInputElement).files || []);
      
      if (selectedFiles.length > 0) {
        setFiles(selectedFiles);
        setModalMode('upload');
      }
    };
    
    input.click();
  };

  const handleSelectVideos = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = true;
    
    // iOS compatibility: add to DOM temporarily
    input.style.position = 'fixed';
    input.style.top = '-1000px';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    
    input.onchange = (event) => {
      const selectedFiles = Array.from((event.target as HTMLInputElement).files || []);
      
      // Clean up DOM
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
      
      if (selectedFiles.length > 0) {
        setFiles(selectedFiles);
        setModalMode('upload');
      }
    };
    
    input.onerror = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    input.oncancel = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    // Add timeout cleanup as fallback
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 30000);
    
    // Try click with a small delay for iOS
    setTimeout(() => {
      input.click();
    }, 50);
  };

  const handleBackToSelection = () => {
    setFiles([]);
    setCaption('');
    setSelectedTags([]);
    setModalMode('selection');
  };

  return (
    <>
      {/* Bottom Sheet Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Solid backdrop */}
          <div 
            className="absolute inset-0 bg-black"
            onClick={onClose}
          />
          
          {/* Modal - solid black */}
          <div 
            className="relative w-full max-w-[420px] md:max-w-[480px] bg-black border border-white/10 rounded-3xl py-6 px-5 max-h-[85vh] overflow-y-auto animate-fade-in animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              {modalMode === 'upload' && (
                <button
                  onClick={handleBackToSelection}
                  className="flex items-center justify-center w-6 h-6 text-white/60 hover:text-white transition-colors"
                  aria-label="Back to selection"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {modalMode === 'selection' && <div className="w-6 h-6" />}
              <h2 className="text-lg font-bold text-center flex-1 text-white">
                {editMode ? 'Edit Moment' : 'Create a Moment'}
              </h2>
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalMode === 'selection' ? (
              /* Action Selection View */
              <div className="space-y-6">
                
                {/* Capture Photo or Video - Mobile Only */}
                {isMobile && (
                  <button
                    onClick={handleCaptureClick}
                    className="w-full flex items-center gap-4 p-5 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-black cursor-pointer transform active:scale-[0.98]"
                    disabled={isSubmitting}
                    aria-label="Open camera to record in real-time"
                    tabIndex={0}
                  >
                    <Camera className="h-6 w-6 text-white flex-shrink-0" />
                    <div className="text-left flex-1">
                      <div className="text-base font-medium">Capture Photo or Video</div>
                    </div>
                  </button>
                )}

                {/* Select Photos */}
                <button
                  onClick={handleSelectPhotos}
                  className="w-full flex items-center gap-4 p-5 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-black cursor-pointer transform active:scale-[0.98]"
                  disabled={isSubmitting}
                  aria-label="Choose saved images from your gallery"
                  tabIndex={0}
                >
                  <Image className="h-6 w-6 text-white flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="text-base font-medium">Select Photos from Gallery</div>
                  </div>
                </button>

                {/* Select Videos */}
                <button
                  onClick={handleSelectVideos}
                  className="w-full flex items-center gap-4 p-5 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-black cursor-pointer transform active:scale-[0.98]"
                  disabled={isSubmitting}
                  aria-label="Upload pre-recorded golf clips"
                  tabIndex={0}
                >
                  <Video className="h-6 w-6 text-white flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="text-base font-medium">Select Videos from Gallery</div>
                  </div>
                </button>

                {/* Helper Text */}
                <p className="text-xs text-white/50 mt-4 px-1 text-center">
                  Select multiple files to create a carousel post with swipeable media.
                </p>

                {/* Cancel Button */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <button
                    onClick={onClose}
                    className="w-full text-center py-3 text-white text-base font-medium hover:text-white/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-black rounded-lg"
                    tabIndex={0}
                    aria-label="Cancel and close modal"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Upload View - Reorganized with better hierarchy and spacing */
              <div className="space-y-6">

                {/* 1. Selected Media Preview - Taller Header */}
                <div className="mb-6">
                  {/* Media Header Container - Taller and Better Proportions */}
                  <div className="relative h-[58vh] max-h-[720px] min-h-[360px] bg-black rounded-xl overflow-hidden mb-4">
                    {files.length > 0 && (
                      <>
                        {files[0].type.startsWith('video') ? (
                          <video 
                            src={URL.createObjectURL(files[0])} 
                            className="h-full w-full object-cover" 
                            muted 
                            loop 
                            autoPlay 
                          />
                        ) : (
                          <img 
                            src={URL.createObjectURL(files[0])} 
                            alt="" 
                            className="h-full w-full object-cover" 
                          />
                        )}
                        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
                      </>
                    )}
                  </div>
                  
                  <EnhancedMediaUpload
                    onFilesChange={setFiles}
                    maxFiles={10}
                    initialFiles={files}
                    existingMediaUrls={editMode ? existingMediaUrls : []}
                    acceptedTypes={['image/*', 'video/*']}
                    disabled={isSubmitting}
                    autoUpload={true}
                    data-testid="media-upload"
                    aria-label="Upload media files"
                    className={`focus:outline-none focus:ring-2 focus:ring-[#6e9277] focus:ring-offset-2 rounded-xl ${validationErrors.media ? 'animate-shake border-red-300' : ''}`}
                  />
                  {/* Validation Error for Media */}
                  {validationErrors.media && (
                    <div className="mt-2 animate-fade-in">
                      <p className="text-sm text-[#d9534f] flex items-center gap-1">
                        ⚠️ {validationErrors.media}
                      </p>
                    </div>
                  )}
                </div>

                {/* Floating card stack wrapper (reduce overlap) */}
                <div className="space-y-3 p-4 -mt-4">

                {/* Divider Line */}
                <div className="border-t border-gray-100 -mx-6" />

                {/* 2. Caption Field - with AI assistant and proper spacing */}
                <div className="space-y-4 pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Add a caption
                      </label>
                    </div>
                    <div className="relative">
                      <EnhancedRichTextInput
                        value={caption}
                        onChange={handleCaptionChange}
                        onTagsChange={setSelectedTags}
                        placeholder="Write about your moment..."
                        selectedTags={selectedTags}
                        disabled={isSubmitting}
                        aria-label="Caption input for your moment"
                        className=""
                      />
                    </div>
                  </div>

                  {/* Selected Tags Display */}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedTags.map((tag) => (
                        <div
                          key={tag.id}
                          className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                        >
                          <span>@{tag.username || tag.name}</span>
                          <button
                            onClick={() => setSelectedTags(prev => prev.filter(t => t.id !== tag.id))}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Golf Course Field - with centered pin and proper z-index */}
                {onCourseSelect && (
                  <div className="space-y-4 pt-6 relative z-[300]">
                    <label className="block text-sm font-medium text-gray-700">
                      Tag a golf course
                      <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                    </label>
                    <div className="max-w-full overflow-visible">
                      <CourseTagInput
                        selectedCourse={selectedCourse || null}
                        onCourseSelect={onCourseSelect}
                        placeholder="Start typing to find a course..."
                      />
                    </div>
                  </div>
                )}

                {/* 3.7. Background Music Selector */}
                <BackgroundMusicSelector
                  onMusicSelect={setBackgroundMusic}
                  disabled={isSubmitting}
                  hasVideo={files.some(file => file.type.startsWith('video/'))}
                />


                {/* Divider Line before buttons */}
                <div className="border-t border-gray-100 -mx-6 mt-8" />

                {/* 5. Action Buttons - with enhanced styling and animations */}
                <div className="flex gap-3 justify-end pt-6">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 text-sm font-medium hover-scale"
                  >
                    Cancel
                  </Button>
                  
                  {/* Enhanced Post Button with Echo Gradient */}
                  <div className="relative">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || (files.length === 0 && existingMediaUrls.length === 0)}
                      aria-label="Post your moment"
                      className="relative w-full h-12 rounded-2xl text-white overflow-hidden disabled:opacity-50 transition-all duration-200 ease-out hover:scale-105 active:scale-95 disabled:hover:scale-100"
                      style={{ 
                        background: 'linear-gradient(135deg, var(--echo-from), var(--echo-to))',
                        minWidth: '140px'
                      }}
                    >
                      {/* Shimmer animation while submitting */}
                      {isSubmitting && (
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                            animation: 'shimmer 1.1s ease linear infinite',
                            backgroundSize: '200% 100%'
                          }}
                        />
                      )}
                      
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{editMode ? 'Updating...' : 'Posting...'}</span>
                        </div>
                      ) : (
                        <span className="transition-all duration-200">
                          {editMode 
                            ? 'Update' 
                            : `Post${files.length > 0 ? ` (${files.length} file${files.length > 1 ? 's' : ''})` : ''}`
                          }
                        </span>
                      )}
                    </button>
                    
                    {/* Error message display */}
                    {submitError && (
                      <div className="absolute top-full left-0 right-0 mt-2 animate-fade-in">
                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                          {submitError}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedCreateMomentModal;