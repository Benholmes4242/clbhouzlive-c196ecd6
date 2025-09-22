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
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [modalMode, setModalMode] = useState<'selection' | 'upload'>('selection');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isButtonShaking, setIsButtonShaking] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [aiLoading, setAiLoading] = useState(false);
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

  // AI Caption Generation
  const handleAICaption = async () => {
    try {
      setAiLoading(true);
      const first = files?.[0];
      if (!first) return;

      const body = {
        type: first.type.startsWith('video') ? "video" : "image",
        previewUrl: URL.createObjectURL(first),
        captionContext: caption || "",
      };

      const { data, error } = await supabase.functions.invoke('ai-caption-generator', {
        body
      });
      
      if (error) throw error;
      
      if (data?.caption) {
        setCaption(data.caption);
      } else {
        throw new Error('Failed to generate caption');
      }
    } catch (error) {
      console.error('AI caption error:', error);
      toast({
        title: "Caption Generation Failed",
        description: "Please try writing a caption manually.",
        variant: "destructive"
      });
    } finally {
      setAiLoading(false);
    }
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
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
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
          {/* Semi-transparent background */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={onClose}
          />
          
          {/* Modal - V1 Layout with New Colors */}
          <div 
            className="relative mx-auto w-full max-w-[680px] bg-[var(--cm-surface)] rounded-xl shadow-sm pb-6 max-h-[85vh] overflow-y-auto animate-fade-in animate-scale-in"
            style={{
              '--cm-surface': '#ffffff',
              '--cm-card': '#ffffff', 
              '--cm-border': '#e5e7eb',
              '--cm-text': '#111827',
              '--cm-muted': '#6b7280',
              '--cm-accent': '#f97316',
              '--cm-accent-contrast': '#ffffff'
            } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            {modalMode === 'selection' ? (
              /* Action Selection View */
              <div className="px-4 space-y-6">
                
                {/* Capture Photo or Video - Mobile Only */}
                {isMobile && (
                  <button
                    onClick={handleCaptureClick}
                    className="w-full flex items-center gap-4 p-5 bg-[var(--cm-card)] border border-[var(--cm-border)] hover:bg-gray-50 text-[var(--cm-text)] rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--cm-accent)] focus:ring-offset-2 cursor-pointer shadow-sm"
                    disabled={isSubmitting}
                    aria-label="Open camera to record in real-time"
                    tabIndex={0}
                  >
                    <Camera className="h-6 w-6 text-[var(--cm-text)] flex-shrink-0" />
                    <div className="text-left flex-1">
                      <div className="text-base font-medium">Capture Photo or Video</div>
                    </div>
                  </button>
                )}

                {/* Select Photos */}
                <button
                  onClick={handleSelectPhotos}
                  className="w-full flex items-center gap-4 p-5 bg-[var(--cm-card)] border border-[var(--cm-border)] hover:bg-gray-50 text-[var(--cm-text)] rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--cm-accent)] focus:ring-offset-2 cursor-pointer shadow-sm"
                  disabled={isSubmitting}
                  aria-label="Choose saved images from your gallery"
                  tabIndex={0}
                >
                  <Image className="h-6 w-6 text-[var(--cm-text)] flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="text-base font-medium">Select Photos from Gallery</div>
                  </div>
                </button>

                {/* Select Videos */}
                <button
                  onClick={handleSelectVideos}
                  className="w-full flex items-center gap-4 p-5 bg-[var(--cm-card)] border border-[var(--cm-border)] hover:bg-gray-50 text-[var(--cm-text)] rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--cm-accent)] focus:ring-offset-2 cursor-pointer shadow-sm"
                  disabled={isSubmitting}
                  aria-label="Upload pre-recorded golf clips"
                  tabIndex={0}
                >
                  <Video className="h-6 w-6 text-[var(--cm-text)] flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="text-base font-medium">Select Videos from Gallery</div>
                  </div>
                </button>

                {/* Helper Text */}
                <p className="text-xs text-[var(--cm-muted)] mt-4 px-1 text-center">
                  Select multiple files to create a carousel post with swipeable media.
                </p>

                {/* Cancel Button */}
                <div className="mt-6 pt-4 border-t border-[var(--cm-border)]">
                  <button
                    onClick={onClose}
                    className="w-full text-center py-3 text-[var(--cm-text)] text-base font-medium hover:text-[var(--cm-muted)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--cm-accent)] focus:ring-offset-2 rounded-lg"
                    tabIndex={0}
                    aria-label="Cancel and close modal"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Upload View - V1 Layout Structure */
              <div className="space-y-4 px-4">

                {/* 1. Media Strip with 1/1 Badge */}
                <div className="mb-4">
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
                    className={`focus:outline-none focus:ring-2 focus:ring-[var(--cm-accent)] focus:ring-offset-2 rounded-xl ${validationErrors.media ? 'animate-shake border-red-300' : ''}`}
                  />
                  {/* Validation Error for Media */}
                  {validationErrors.media && (
                    <div className="mt-2 animate-fade-in">
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        ⚠️ {validationErrors.media}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Add a Caption Card */}
                <section className="rounded-xl bg-[var(--cm-card)] border border-[var(--cm-border)] p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-[var(--cm-text)]">
                      Add a caption
                    </label>
                    <button
                      onClick={handleAICaption}
                      disabled={aiLoading || files.length === 0}
                      className="h-8 px-3 rounded-full border border-[var(--cm-border)] text-[var(--cm-text)]/80 hover:text-[var(--cm-text)] transition-colors disabled:opacity-50 text-sm"
                      aria-label="AI Caption"
                    >
                      {aiLoading ? "..." : "AI Caption"}
                    </button>
                  </div>
                  <EnhancedRichTextInput
                    value={caption}
                    onChange={handleCaptionChange}
                    onTagsChange={setSelectedTags}
                    placeholder="Write about your moment..."
                    selectedTags={selectedTags}
                    disabled={isSubmitting}
                    aria-label="Caption input for your moment"
                    className="min-h-[48px]"
                  />
                  
                  {/* Selected Tags Display */}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
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
                </section>

                {/* 3. Tag a Golf Course Card */}
                {onCourseSelect && (
                  <section className="rounded-xl bg-[var(--cm-card)] border border-[var(--cm-border)] p-4 shadow-sm relative z-[300]">
                    <label className="text-sm font-medium text-[var(--cm-text)] mb-3 block">
                      Tag a golf course
                    </label>
                    <div className="relative">
                      <CourseTagInput
                        selectedCourse={selectedCourse || null}
                        onCourseSelect={onCourseSelect}
                        placeholder="Start typing to find a course..."
                      />
                    </div>
                  </section>
                )}

                {/* 4. Background Music Card */}
                <section className="rounded-xl bg-[var(--cm-card)] border border-[var(--cm-border)] p-4 shadow-sm">
                  <BackgroundMusicSelector
                    onMusicSelect={setBackgroundMusic}
                    disabled={isSubmitting}
                    hasVideo={files.some(file => file.type.startsWith('video/'))}
                  />
                </section>

                {/* 5. Visibility Segment Control */}
                <section className="rounded-xl bg-[var(--cm-card)] border border-[var(--cm-border)] p-4 shadow-sm">
                  <div className="rounded-full border border-[var(--cm-border)] p-1 bg-gray-50">
                    <div className="flex">
                      <button
                        onClick={() => setVisibility("public")}
                        className={`flex-1 h-10 rounded-full text-sm font-medium transition-all ${
                          visibility === "public" 
                            ? 'bg-[var(--cm-accent)] text-[var(--cm-accent-contrast)] shadow-sm' 
                            : 'text-[var(--cm-text)]/70 hover:text-[var(--cm-text)]'
                        }`}
                      >
                        Public
                      </button>
                      <button
                        onClick={() => setVisibility("private")}
                        className={`flex-1 h-10 rounded-full text-sm font-medium transition-all ${
                          visibility === "private" 
                            ? 'bg-[var(--cm-accent)] text-[var(--cm-accent-contrast)] shadow-sm' 
                            : 'text-[var(--cm-text)]/70 hover:text-[var(--cm-text)]'
                        }`}
                      >
                        Private Archive
                      </button>
                    </div>
                  </div>
                </section>

                {/* 6. Post Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || (files.length === 0 && existingMediaUrls.length === 0)}
                    aria-label="Post your moment"
                    className="w-full h-14 rounded-xl text-[var(--cm-accent-contrast)] font-semibold transition-all duration-200 disabled:opacity-40"
                    style={{ 
                      backgroundColor: 'var(--cm-accent)'
                    }}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{editMode ? 'Updating...' : 'Posting...'}</span>
                      </div>
                    ) : (
                      <span>
                        {editMode 
                          ? 'Update' 
                          : `Post${files.length > 0 ? ` (${files.length} file${files.length > 1 ? 's' : ''})` : ''}`
                        }
                      </span>
                    )}
                  </button>
                  
                  {/* Error message display */}
                  {submitError && (
                    <div className="mt-2 animate-fade-in">
                      <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                        {submitError}
                      </p>
                    </div>
                  )}
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