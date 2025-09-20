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
      {/* Background Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Semi-translucent blurred background */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-black/60 via-gray-800/70 to-black/80 backdrop-blur-lg transition-opacity"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div 
            className="relative w-full max-w-[420px] md:max-w-[480px] bg-gray-800/20 backdrop-blur-xl border border-white/10 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 max-h-[90vh] overflow-y-auto animate-fade-in animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-6">
              <div className="w-6 h-6" />
              <h2 className="text-xl font-bold text-center flex-1 text-white">
                {editMode ? 'Edit Moment' : 'Create a Moment'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white/90 transition-colors rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMode === 'selection' ? (
              /* Action Selection View */
              <div className="space-y-6">
                
                {/* Capture Photo or Video - Mobile Only */}
                {isMobile && (
                  <button
                    onClick={handleCaptureClick}
                    className="w-full flex items-center gap-4 p-5 bg-[#f9f9f9] hover:bg-[#f0f0f0] active:bg-[#e8e8e8] text-[#222222] rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 cursor-pointer shadow-sm hover:shadow-md transform active:scale-[0.98]"
                    disabled={isSubmitting}
                    aria-label="Open camera to record in real-time"
                    tabIndex={0}
                  >
                    <Camera className="h-6 w-6 text-[#222222] flex-shrink-0" />
                    <div className="text-left flex-1">
                      <div className="text-base font-medium">Capture Photo or Video</div>
                    </div>
                  </button>
                )}

                {/* Select Photos */}
                <button
                  onClick={handleSelectPhotos}
                  className="w-full flex items-center gap-4 p-5 bg-[#f9f9f9] hover:bg-[#f0f0f0] active:bg-[#e8e8e8] text-[#222222] rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 cursor-pointer shadow-sm hover:shadow-md transform active:scale-[0.98]"
                  disabled={isSubmitting}
                  aria-label="Choose saved images from your gallery"
                  tabIndex={0}
                >
                  <Image className="h-6 w-6 text-[#222222] flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="text-base font-medium">Select Photos from Gallery</div>
                  </div>
                </button>

                {/* Select Videos */}
                <button
                  onClick={handleSelectVideos}
                  className="w-full flex items-center gap-4 p-5 bg-[#f9f9f9] hover:bg-[#f0f0f0] active:bg-[#e8e8e8] text-[#222222] rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 cursor-pointer shadow-sm hover:shadow-md transform active:scale-[0.98]"
                  disabled={isSubmitting}
                  aria-label="Upload pre-recorded golf clips"
                  tabIndex={0}
                >
                  <Video className="h-6 w-6 text-[#222222] flex-shrink-0" />
                  <div className="text-left flex-1">
                    <div className="text-base font-medium">Select Videos from Gallery</div>
                  </div>
                </button>

                {/* Helper Text */}
                <p className="text-xs text-gray-500 mt-4 px-1 text-center">
                  Select multiple files to create a carousel post with swipeable media.
                </p>

                {/* Cancel Button */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={onClose}
                    className="w-full text-center py-3 text-black text-base font-medium hover:text-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded-lg"
                    tabIndex={0}
                    aria-label="Cancel and close modal"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Upload View - Old Layout with Snap Modal Colors */
              <div className="space-y-5">

                {/* Media Preview */}
                <div className="relative h-[280px] bg-black rounded-xl overflow-hidden">
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
                          alt="Selected media" 
                          className="h-full w-full object-cover" 
                        />
                      )}
                    </>
                  )}
                  
                  {/* Multi-file indicator */}
                  {files.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                      {files.length} files
                    </div>
                  )}
                </div>

                {/* Caption Section */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  <h3 className="text-white text-lg font-medium mb-3">Add a caption</h3>
                  <div className="relative">
                    <textarea
                      value={caption}
                      onChange={(e) => handleCaptionChange(e.target.value)}
                      placeholder="Write a caption..."
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:border-orange-400/50 min-h-[80px]"
                      rows={3}
                    />
                    
                    {/* AI Caption Button */}
                    <div className="absolute bottom-3 right-3">
                      <button
                        onClick={handleAICaption}
                        disabled={files.length === 0 || aiLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none border border-white/20"
                      >
                        {aiLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        )}
                        AI Caption
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tag Golf Course Section */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  <h3 className="text-white text-lg font-medium mb-3">Tag a golf course</h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Start typing to find a course..."
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-orange-400/50"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  {selectedCourse && (
                    <div className="mt-3">
                      <GolfCoursePin 
                        courseName={selectedCourse.name}
                        courseRegion={selectedCourse.region}
                      />
                    </div>
                  )}
                </div>

                {/* Background Music Section */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  <h3 className="text-white text-lg font-medium mb-3">Background music</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">Popular golf tracks today</span>
                    <div className="flex items-center gap-3">
                      <button className="text-orange-400 hover:text-orange-300 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                      <button className="text-orange-400 hover:text-orange-300 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Privacy Toggle Section */}
                <div className="flex bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none flex items-center justify-center gap-2 ${
                      visibility === "public"
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none flex items-center justify-center gap-2 ${
                      visibility === "private"
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Private Archive
                  </button>
                </div>

                {/* Error Display */}
                {(submitError || Object.keys(validationErrors).length > 0) && (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 space-y-2">
                    {submitError && (
                      <p className="text-sm text-red-200 font-medium">{submitError}</p>
                    )}
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <p key={field} className="text-sm text-red-200">{error}</p>
                    ))}
                  </div>
                )}

                {/* Post Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || files.length === 0}
                  className={`w-full px-6 py-4 bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 hover:from-blue-600 hover:via-teal-600 hover:to-green-600 disabled:from-gray-500 disabled:via-gray-600 disabled:to-gray-700 disabled:text-gray-300 text-white rounded-xl font-semibold text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-transparent ${
                    isButtonShaking ? 'animate-shake' : ''
                  } ${
                    isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {editMode ? 'Updating...' : 'Posting...'}
                    </div>
                  ) : (
                    editMode ? 'Update' : 'Post'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedCreateMomentModal;