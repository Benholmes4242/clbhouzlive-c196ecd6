import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import CourseTagInput from '../posts/CourseTagInput';
import GolfCoursePin from '../posts/GolfCoursePin';
import EnhancedMediaUpload from '../posts/EnhancedMediaUpload';
import { useTaggableEntities } from '@/hooks/useTaggableEntities';

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
  const [isInitialized, setIsInitialized] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (editMode) {
        setCaption(initialCaption);
        setSelectedTags(initialTags);
        setFiles(initialFiles);
      } else {
        setCaption('');
        setSelectedTags([]);
        setFiles(initialFiles);
      }
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, editMode, initialCaption, initialTags, initialFiles, isInitialized]);

  // Handle caption input with mention detection
  const handleCaptionChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('handleCaptionChange called with:', JSON.stringify(e.target.value)); // Debug log
    const text = e.target.value;
    setCaption(text);

    // Check for mentions - look for @ followed by at least 1 character
    // Use regex to find the last @ mention in the text
    const mentionRegex = /@(\w+)$/;
    const match = text.match(mentionRegex);
    
    console.log('Text for regex:', JSON.stringify(text)); // Debug log
    console.log('Regex match:', match); // Debug log
    
    if (match && match[1].length >= 1) {
      const query = match[1];
      console.log('Mention detected! Searching for:', query); // Debug log
      setShowSuggestions(true);
      
      try {
        await searchEntities(query);
        console.log('Search completed. Entities found:', entities.length); // Debug log
      } catch (error) {
        console.error('Error searching entities:', error);
      }
    } else {
      console.log('No mention detected, hiding suggestions'); // Debug log
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
    
    const words = caption.split(' ');
    const lastWordIndex = words.length - 1;
    
    if (words[lastWordIndex].startsWith('@')) {
      // Replace the @partial with @username
      const displayName = entity.username || entity.name;
      words[lastWordIndex] = `@${displayName}`;
      const newCaption = words.join(' ') + ' ';
      
      setCaption(newCaption);
      setSelectedTags(prev => [...prev, entity]);
    }
    
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
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-center text-lg font-semibold">
          {editMode ? 'Edit Moment' : 'Create a Moment'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {editMode ? 'Edit your moment details and media' : 'Upload media files, add caption and post your moment'}
        </DialogDescription>
        
        <div className="space-y-6">
          {/* Enhanced Media Upload Section */}
          <div>
            <EnhancedMediaUpload
              onFilesChange={setFiles}
              maxFiles={10}
              initialFiles={initialFiles}
              existingMediaUrls={editMode ? existingMediaUrls : []}
              acceptedTypes={['image/*', 'video/*']}
              disabled={isSubmitting}
            />
          </div>

          {/* Caption Input */}
          <div className="relative">
            <textarea
              value={caption}
              onChange={handleCaptionChange}
              placeholder="Write about your moment... Use @ to tag people or businesses"
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isSubmitting}
              rows={4}
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

            {/* Debug Info - Remove this after fixing */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 bg-red-100 border border-red-200 rounded-md p-2 z-40 mt-12 text-xs">
                <p>Debug: showSuggestions={showSuggestions.toString()}, entities.length={entities.length}</p>
                <p>Entities: {JSON.stringify(entities.map(e => e.name), null, 2)}</p>
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
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCreateMomentModal;