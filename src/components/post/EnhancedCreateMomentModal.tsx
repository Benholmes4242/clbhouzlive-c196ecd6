import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Camera, Image, Video } from 'lucide-react';
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
  existingMediaUrls = []
}) => {
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { entities, searchEntities } = useTaggableEntities();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [modalMode, setModalMode] = useState<'selection' | 'upload'>('selection');
  const isMobile = useIsMobile();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (editMode) {
        setCaption(initialCaption);
        setSelectedTags(initialTags);
        setFiles(initialFiles);
        setModalMode('upload'); // Skip selection for edit mode
      } else {
        setCaption('');
        setSelectedTags([]);
        setFiles(initialFiles);
        const mode = initialFiles.length > 0 ? 'upload' : 'selection';
        setModalMode(mode);
      }
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
      setModalMode('selection');
    }
  }, [isOpen, editMode, initialCaption, initialTags, initialFiles, isInitialized]);

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

  const handleSubmit = () => {
    if (files.length === 0 && existingMediaUrls.length === 0) return;

    onSubmit({
      caption,
      files,
      tags: selectedTags,
      course: selectedCourse
    });
  };

  const handleCancel = () => {
    setCaption('');
    setFiles([]);
    setSelectedTags([]);
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

            {(() => {
              console.log('Rendering modal content, modalMode:', modalMode);
              console.log('Rendering modal overlay, isOpen:', isOpen);
              return null;
            })()}

            {modalMode === 'selection' ? (
              /* Action Selection View */
              <div className="space-y-3">
                {(() => {
                  console.log('Rendering selection buttons, isMobile:', isMobile);
                  return null;
                })()}
                
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
              /* Upload View */
              <div className="space-y-6">

                {/* Enhanced Media Upload Section */}
                <div>
                  <EnhancedMediaUpload
                    onFilesChange={setFiles}
                    maxFiles={10}
                    initialFiles={files}
                    existingMediaUrls={editMode ? existingMediaUrls : []}
                    acceptedTypes={['image/*', 'video/*']}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Caption Input */}
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

                {/* Selected Tags */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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

                {/* Golf Course Selection */}
                {onCourseSelect && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Golf Course (Optional)
                    </label>
                    <CourseTagInput
                      selectedCourse={selectedCourse || null}
                      onCourseSelect={onCourseSelect}
                      placeholder="Start typing to find a course..."
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSubmit}
                    disabled={isSubmitting || (files.length === 0 && existingMediaUrls.length === 0)}
                    className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                  >
                    {isSubmitting 
                      ? (editMode ? 'Updating...' : 'Posting...') 
                      : (editMode ? 'Update' : 'Post')
                    }
                  </Button>
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