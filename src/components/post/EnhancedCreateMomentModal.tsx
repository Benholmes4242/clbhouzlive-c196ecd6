import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Camera, Image, Video, Loader2 } from 'lucide-react';
import CourseTagInput from '../posts/CourseTagInput';
import GolfCoursePin from '../posts/GolfCoursePin';
import EnhancedMediaUpload from '../posts/EnhancedMediaUpload';
import EnhancedRichTextInput from '../posts/EnhancedRichTextInput';
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
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { entities, searchEntities } = useTaggableEntities();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [modalMode, setModalMode] = useState<'selection' | 'upload'>('selection');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isButtonShaking, setIsButtonShaking] = useState(false);
  const isMobile = useIsMobile();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (editMode) {
        setCaption(initialCaption);
        setSelectedTags(initialTags);
        setFiles(initialFiles);
        setIsPrivate(initialIsPrivate);
        setModalMode('upload'); // Skip selection for edit mode
      } else {
        setCaption('');
        setSelectedTags([]);
        setFiles(initialFiles);
        setIsPrivate(false); // Default to public
        const mode = initialFiles.length > 0 ? 'upload' : 'selection';
        setModalMode(mode);
      }
      setSubmitError(null); // Clear any previous errors
      setIsButtonShaking(false);
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
      setModalMode('selection');
      setSubmitError(null);
      setIsButtonShaking(false);
    }
  }, [isOpen, editMode, initialCaption, initialTags, initialFiles, initialIsPrivate, isInitialized]);

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
    if (files.length === 0 && existingMediaUrls.length === 0) return;

    try {
      setSubmitError(null); // Clear any previous errors
      
      // Call the submit handler (which handles success feedback)
      onSubmit({
        caption,
        files,
        tags: selectedTags,
        course: selectedCourse,
        isPrivate
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
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Semi-transparent background */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={onClose}
          />
          
          {/* Bottom Sheet Modal */}
          <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 animate-slide-in-up max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              {modalMode === 'upload' && (
                <button
                  onClick={handleBackToSelection}
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              )}
              {modalMode === 'selection' && <div className="w-8 h-8" />}
              <h2 className="text-lg font-semibold text-gray-900 flex-1 text-center">
                {editMode ? 'Edit Moment' : 'Create a Moment'}
              </h2>
              <div className="w-8 h-8" />
            </div>

            {modalMode === 'selection' ? (
              /* Action Selection View */
              <div className="space-y-3">
                
                {/* Capture Photo or Video - Mobile Only */}
                {isMobile && (
                  <button
                    onClick={handleCaptureClick}
                    className="w-full flex items-center gap-4 p-3 bg-gray-50 hover:bg-orange-50 rounded-xl transition-colors"
                    disabled={isSubmitting}
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Camera className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-gray-800 font-medium">Capture Photo or Video</span>
                  </button>
                )}

                {/* Select Photos */}
                <button
                  onClick={handleSelectPhotos}
                  className="w-full flex items-center gap-4 p-3 bg-gray-50 hover:bg-orange-50 rounded-xl transition-colors"
                  disabled={isSubmitting}
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Image className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-gray-800 font-medium">Select Photos</span>
                </button>

                {/* Select Videos */}
                <button
                  onClick={handleSelectVideos}
                  className="w-full flex items-center gap-4 p-3 bg-gray-50 hover:bg-orange-50 rounded-xl transition-colors"
                  disabled={isSubmitting}
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-gray-800 font-medium">Select Videos</span>
                </button>

                {/* Helper Text */}
                <p className="text-xs text-gray-500 mt-2 px-1 text-center">
                  Select multiple files to create a carousel post with swipeable media.
                </p>
              </div>
            ) : (
              /* Upload View - Reorganized with better hierarchy and spacing */
              <div className="space-y-6">

                {/* 1. Selected Media Preview */}
                <div className="mb-6">
                  <EnhancedMediaUpload
                    onFilesChange={setFiles}
                    maxFiles={10}
                    initialFiles={files}
                    existingMediaUrls={editMode ? existingMediaUrls : []}
                    acceptedTypes={['image/*', 'video/*']}
                    disabled={isSubmitting}
                    autoUpload={true}
                  />
                </div>

                {/* Divider Line */}
                <div className="border-t border-gray-100 -mx-6" />

                {/* 2. Caption Field - with proper spacing and label */}
                <div className="space-y-4 pt-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Add a caption
                    </label>
                    <div className="relative">
                      <EnhancedRichTextInput
                        value={caption}
                        onChange={handleCaptionChange}
                        onTagsChange={setSelectedTags}
                        placeholder="Write about your moment..."
                        selectedTags={selectedTags}
                        disabled={isSubmitting}
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

                {/* 3. Golf Course Field - with proper spacing */}
                {onCourseSelect && (
                  <div className="space-y-4 pt-6">
                    <label className="block text-sm font-medium text-gray-700">
                      Tag a golf course
                      <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                    </label>
                    <div className="max-w-full">
                      <CourseTagInput
                        selectedCourse={selectedCourse || null}
                        onCourseSelect={onCourseSelect}
                        placeholder="Start typing to find a course..."
                      />
                    </div>
                  </div>
                )}

                {/* 4. Post Visibility Toggle */}
                <div className="space-y-4 pt-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Post Visibility
                  </label>
                  <div className="space-y-3">
                    {/* Segmented Control */}
                    <div className="flex bg-gray-100 rounded-xl p-1 w-full">
                      <button
                        type="button"
                        onClick={() => setIsPrivate(false)}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                          !isPrivate
                            ? 'text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        style={{
                          backgroundColor: !isPrivate ? '#6e9277' : 'transparent'
                        }}
                        disabled={isSubmitting}
                      >
                        🟢 Public
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPrivate(true)}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isPrivate
                            ? 'text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        style={{
                          backgroundColor: isPrivate ? '#6e9277' : 'transparent'
                        }}
                        disabled={isSubmitting}
                      >
                        👁️ Private Archive
                      </button>
                    </div>
                    
                    {/* Subtext */}
                    <p className="text-xs text-gray-500">
                      {isPrivate 
                        ? "Private posts are visible only to you." 
                        : "Public posts are visible on feed and profile."
                      }
                    </p>
                  </div>
                </div>

                {/* 5. Tag Field (Placeholder for future implementation) */}
                <div className="space-y-4 pt-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Add tags
                    <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                  </label>
                  <div className="p-3.5 w-full border border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-sm">
                    Tag functionality coming soon...
                  </div>
                </div>

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
                  
                  {/* Enhanced Post Button with animations */}
                  <div className="relative">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || (files.length === 0 && existingMediaUrls.length === 0)}
                      className={`
                        px-6 py-3 text-sm font-medium rounded-xl
                        bg-[#6e9277] hover:bg-[#5a7c64] text-white
                        transition-all duration-200 ease-out
                        hover:scale-105 active:scale-95
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                        ${isButtonShaking ? 'animate-shake' : ''}
                        ${isSubmitting ? 'animate-pulse' : ''}
                      `}
                      style={{
                        background: isSubmitting ? '#6e9277' : undefined,
                        minWidth: '140px' // Prevent button width changes
                      }}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
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
                    </Button>
                    
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
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedCreateMomentModal;