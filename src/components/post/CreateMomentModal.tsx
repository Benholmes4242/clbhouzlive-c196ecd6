
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import CourseTagInput from '../posts/CourseTagInput';
import CoursePostBadge from '../posts/CoursePostBadge';
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

interface CreateMomentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFile: File | null;
  selectedFiles?: File[];
  previewUrl: string;
  captionInputRef: React.RefObject<HTMLDivElement>;
  onCaptionInput: (e: React.FormEvent<HTMLDivElement>) => void;
  showSuggestions: boolean;
  mentionSuggestions: TaggableEntity[];
  onSelectMention: (entity: TaggableEntity) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  selectedCourse?: GolfCourse | null;
  onCourseSelect?: (course: GolfCourse | null) => void;
}

const CreateMomentModal = ({
  isOpen,
  onClose,
  selectedFile,
  selectedFiles,
  previewUrl,
  captionInputRef,
  onCaptionInput,
  showSuggestions,
  mentionSuggestions,
  onSelectMention,
  onSubmit,
  isSubmitting,
  selectedCourse,
  onCourseSelect
}: CreateMomentModalProps) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [localShowSuggestions, setLocalShowSuggestions] = useState(false);
  const [localMentionSuggestions, setLocalMentionSuggestions] = useState<TaggableEntity[]>([]);
  const { searchEntities } = useTaggableEntities();

  // Determine which files to use - multiple files take precedence
  const mediaFiles = selectedFiles && selectedFiles.length > 0 ? selectedFiles : (selectedFile ? [selectedFile] : []);
  const hasMultipleMedia = mediaFiles.length > 1;

  // Handle caption input with mention detection
  const handleCaptionInput = async (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const text = target.textContent || '';
    setCaption(text);

    // Get cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      setCursorPosition(range.startOffset);
    }

    // Check for mentions
    const words = text.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const query = lastWord.substring(1);
      setLocalShowSuggestions(true);
      
      // Search for entities
      try {
        await searchEntities(query);
      } catch (error) {
        console.error('Error searching entities:', error);
      }
    } else {
      setLocalShowSuggestions(false);
      setLocalMentionSuggestions([]);
    }

    // Also call the original handler
    onCaptionInput(e);
  };

  // Handle mention selection
  const handleSelectMention = (entity: TaggableEntity) => {
    const words = caption.split(' ');
    const lastWordIndex = words.length - 1;
    
    if (words[lastWordIndex].startsWith('@')) {
      words[lastWordIndex] = `@${entity.username || entity.name}`;
      const newCaption = words.join(' ') + ' ';
      
      // Update the contentEditable div
      if (captionInputRef.current) {
        captionInputRef.current.textContent = newCaption;
        setCaption(newCaption);
      }
    }
    
    setLocalShowSuggestions(false);
    setLocalMentionSuggestions([]);
    onSelectMention(entity);
    
    // Focus back to input
    if (captionInputRef.current) {
      captionInputRef.current.focus();
    }
  };

  const handlePrevious = () => {
    setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : mediaFiles.length - 1);
  };

  const handleNext = () => {
    setCurrentMediaIndex(prev => prev < mediaFiles.length - 1 ? prev + 1 : 0);
  };

  const getCurrentMediaPreview = () => {
    if (mediaFiles.length === 0) return null;
    
    const currentFile = mediaFiles[currentMediaIndex];
    const isVideo = currentFile.type.startsWith('video/');
    const currentUrl = URL.createObjectURL(currentFile);
    
    return (
      <div className="relative">
        {isVideo ? (
          <video
            src={currentUrl}
            className="w-full max-h-80 object-contain rounded-lg"
            controls
            muted
          />
        ) : (
          <img
            src={currentUrl}
            alt={`Preview ${currentMediaIndex + 1}`}
            className="w-full max-h-80 object-contain rounded-lg"
          />
        )}
        
        {/* Navigation arrows for multiple media */}
        {hasMultipleMedia && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            
            {/* Media counter */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-sm">
              {currentMediaIndex + 1} / {mediaFiles.length}
            </div>
          </>
        )}
        
        {/* Dots indicator */}
        {hasMultipleMedia && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {mediaFiles.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMediaIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Use local suggestions or fallback to props
  const activeSuggestions = localMentionSuggestions.length > 0 ? localMentionSuggestions : mentionSuggestions;
  const showActiveSuggestions = localShowSuggestions || showSuggestions;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-center text-lg font-semibold">
          Create a Moment
        </DialogTitle>
        <DialogDescription className="sr-only">
          Add caption and post your media
        </DialogDescription>
        
        <div className="space-y-4">
          {/* Course badge appears above media when course is selected */}
          {selectedCourse && (
            <CoursePostBadge course={selectedCourse} />
          )}

          {/* Media Preview */}
          {getCurrentMediaPreview()}
          
          {/* Multiple media indicator */}
          {hasMultipleMedia && (
            <p className="text-sm text-center text-muted-foreground">
              {mediaFiles.length} media files selected
            </p>
          )}

          <div className="relative">
            <div
              ref={captionInputRef}
              contentEditable
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onInput={handleCaptionInput}
              data-placeholder="Write about your media... Use @ to tag people or businesses"
              suppressContentEditableWarning={true}
              style={{ minHeight: '80px' }}
            />

            {showActiveSuggestions && activeSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50 mt-1">
                {activeSuggestions.map((entity) => (
                  <div
                    key={entity.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={() => handleSelectMention(entity)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-blue-600">@{entity.username || entity.name}</span>
                      <span className="text-xs text-gray-500 capitalize">
                        {entity.entity_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {onCourseSelect && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Golf Course?
              </label>
              <CourseTagInput
                selectedCourse={selectedCourse || null}
                onCourseSelect={onCourseSelect}
                placeholder="Start typing to find a course..."
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || mediaFiles.length === 0}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMomentModal;
