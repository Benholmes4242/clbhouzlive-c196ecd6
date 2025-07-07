import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Camera, Image, Video } from 'lucide-react';
import CourseTagInput from '../posts/CourseTagInput';
import GolfCoursePin from '../posts/GolfCoursePin';
import EnhancedMediaUpload from '../posts/EnhancedMediaUpload';
import RichTextInput from '../posts/RichTextInput';
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
  
  // Mobile debugging state
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (editMode) {
        addDebugInfo('Initializing in edit mode');
        setCaption(initialCaption);
        setSelectedTags(initialTags);
        setFiles(initialFiles);
        setModalMode('upload'); // Skip selection for edit mode
      } else {
        addDebugInfo('Initializing in create mode');
        setCaption('');
        setSelectedTags([]);
        setFiles(initialFiles);
        const mode = initialFiles.length > 0 ? 'upload' : 'selection';
        addDebugInfo(`Setting modal mode to: ${mode}`);
        setModalMode(mode);
      }
      setIsInitialized(true);
    } else if (!isOpen) {
      addDebugInfo('Modal closed, resetting state');
      setIsInitialized(false);
      setModalMode('selection');
      setDebugInfo([]); // Clear debug info when modal closes
    }
  }, [isOpen, editMode, initialCaption, initialTags, initialFiles, isInitialized]);

  // Handle caption input with mention detection
  const handleCaptionChange = async (text: string) => {
    setCaption(text);

    // Check for mentions - look for @ followed by at least 1 character
    // Use regex to find the last @ mention in the text
    const mentionRegex = /@(\w+)$/;
    const match = text.match(mentionRegex);
    
    if (match && match[1].length >= 1) {
      const query = match[1];
      setShowSuggestions(true);
      
      try {
        await searchEntities(query);
      } catch (error) {
        console.error('Error searching entities:', error);
      }
    } else {
      setShowSuggestions(false);
    }
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
    addDebugInfo('Mobile capture clicked');
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
      addDebugInfo('Camera input changed');
      const selectedFiles = Array.from((event.target as HTMLInputElement).files || []);
      addDebugInfo(`Selected files from camera: ${selectedFiles.length}`);
      
      // Clean up
      document.body.removeChild(input);
      
      if (selectedFiles.length > 0) {
        addDebugInfo('Setting files and switching to upload mode');
        setFiles(selectedFiles);
        setModalMode('upload');
      }
    };
    
    // Add error handling
    input.onerror = () => {
      addDebugInfo('Camera input error occurred');
      document.body.removeChild(input);
    };
    
    input.click();
  };

  const handleSelectPhotos = () => {
    addDebugInfo('Select photos clicked');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    // Add specific iOS attributes
    input.setAttribute('capture', 'camera');
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    
    // Add to DOM temporarily for iOS compatibility
    document.body.appendChild(input);
    
    input.onchange = (event) => {
      addDebugInfo('Photo input changed');
      const selectedFiles = Array.from((event.target as HTMLInputElement).files || []);
      addDebugInfo(`Selected photo files: ${selectedFiles.length}`);
      
      // Clean up
      document.body.removeChild(input);
      
      if (selectedFiles.length > 0) {
        addDebugInfo('Setting photo files and switching to upload mode');
        setFiles(selectedFiles);
        setModalMode('upload');
      } else {
        addDebugInfo('No photo files selected');
      }
    };
    
    // Add error handling
    input.onerror = () => {
      addDebugInfo('Photo input error occurred');
      document.body.removeChild(input);
    };
    
    input.click();
  };

  const handleSelectVideos = () => {
    addDebugInfo('Select videos clicked');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = true;
    // Add specific iOS attributes
    input.setAttribute('capture', 'camcorder');
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    
    // Add to DOM temporarily for iOS compatibility
    document.body.appendChild(input);
    
    input.onchange = (event) => {
      addDebugInfo('Video input changed');
      const selectedFiles = Array.from((event.target as HTMLInputElement).files || []);
      addDebugInfo(`Selected video files: ${selectedFiles.length}`);
      
      // Clean up
      document.body.removeChild(input);
      
      if (selectedFiles.length > 0) {
        addDebugInfo('Setting video files and switching to upload mode');
        setFiles(selectedFiles);
        setModalMode('upload');
      } else {
        addDebugInfo('No video files selected');
      }
    };
    
    // Add error handling
    input.onerror = () => {
      addDebugInfo('Video input error occurred');
      document.body.removeChild(input);
    };
    
    input.click();
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
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-4 animate-slide-in-up max-h-[90vh] overflow-y-auto">
            {/* Drag indicator */}
            <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editMode ? 'Edit Moment' : 'Create a Moment'}
              </h2>
              
              {/* Debug Info Panel - Only show on mobile */}
              {isMobile && debugInfo.length > 0 && (
                <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-left">
                  <div className="font-medium text-blue-800 mb-1">Debug Info:</div>
                  {debugInfo.map((info, index) => (
                    <div key={index} className="text-blue-600">{info}</div>
                  ))}
                </div>
              )}
              
              {/* Mobile Info Display */}
              {isMobile && (
                <div className="mt-2 text-xs text-gray-500">
                  Mode: {modalMode} | Mobile: {isMobile ? 'Yes' : 'No'} | Files: {files.length}
                </div>
              )}
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
                    onClick={() => {
                      addDebugInfo('Capture button clicked on mobile');
                      handleCaptureClick();
                    }}
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
                  onClick={() => {
                    addDebugInfo('Select photos button clicked');
                    handleSelectPhotos();
                  }}
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
                  onClick={() => {
                    addDebugInfo('Select videos button clicked');
                    handleSelectVideos();
                  }}
                  className="w-full flex items-center gap-4 p-3 bg-gray-50 hover:bg-orange-50 rounded-xl transition-colors"
                  disabled={isSubmitting}
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-gray-800 font-medium">Select Videos</span>
                </button>

                {/* Helper Text */}
                <p className="text-xs text-gray-500 mt-2 px-1">
                  Select multiple files to create a carousel post with swipeable media.
                </p>
              </div>
            ) : (
              /* Upload View */
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={handleBackToSelection}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm">Back to options</span>
                </button>

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
                  <RichTextInput
                    value={caption}
                    onChange={handleCaptionChange}
                    placeholder="Write about your moment... Use @ to tag people or businesses"
                    selectedTags={selectedTags}
                    disabled={isSubmitting}
                  />

                  {/* Mention Suggestions */}
                  {showSuggestions && entities.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50 mt-1">
                      {entities.map((entity) => (
                        <div
                          key={`${entity.entity_type}-${entity.entity_id}-${entity.id}`}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 transition-colors"
                          onClick={() => handleSelectMention(entity)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-blue-600">
                              @{entity.username || entity.name}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              {entity.entity_type.replace('_', ' ')} • {entity.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                    onClick={handleSubmit}
                    disabled={isSubmitting || (files.length === 0 && existingMediaUrls.length === 0)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isSubmitting 
                      ? (editMode ? 'Updating...' : 'Posting...') 
                      : (editMode ? 'Update' : `Post ${files.length > 0 ? `(${files.length} file${files.length > 1 ? 's' : ''})` : ''}`)
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