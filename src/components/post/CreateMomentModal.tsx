
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [localShowSuggestions, setLocalShowSuggestions] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);
  const { entities, searchEntities } = useTaggableEntities();

  // Determine which files to use - multiple files take precedence
  const mediaFiles = selectedFiles && selectedFiles.length > 0 ? selectedFiles : (selectedFile ? [selectedFile] : []);
  const hasMultipleMedia = mediaFiles.length > 1;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentMediaIndex(0);
      setCaption('');
      setSelectedTags([]);
    }
  }, [isOpen]);

  // Handle caption input with mention detection
  const handleCaptionInput = async (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const text = target.textContent || '';
    setCaption(text);

    console.log('Caption input changed:', text);

    // Check for mentions - look for @ followed by at least 1 character
    const mentionRegex = /@(\w+)$/;
    const words = text.split(' ');
    const lastWord = words[words.length - 1];
    
    console.log('Last word:', lastWord);
    
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const query = lastWord.substring(1);
      console.log('Searching for mentions with query:', query);
      setLocalShowSuggestions(true);
      
      // Search for entities
      try {
        await searchEntities(query);
        console.log('Search completed, entities found:', entities.length);
      } catch (error) {
        console.error('Error searching entities:', error);
      }
    } else {
      setLocalShowSuggestions(false);
    }

    // Also call the original handler
    onCaptionInput(e);
  };

  // Handle mention selection
  const handleSelectMention = (entity: TaggableEntity) => {
    console.log('Selecting mention:', entity);
    
    // Prevent duplicate tags
    if (selectedTags.find(tag => tag.id === entity.id)) {
      setLocalShowSuggestions(false);
      return;
    }
    
    const words = caption.split(' ');
    const lastWordIndex = words.length - 1;
    
    if (words[lastWordIndex].startsWith('@')) {
      // Replace the @partial with @username
      const displayName = entity.username || entity.name;
      words[lastWordIndex] = `@${displayName}`;
      const newCaption = words.join(' ') + ' ';
      
      // Update the contentEditable div
      if (captionInputRef.current) {
        captionInputRef.current.textContent = newCaption;
        setCaption(newCaption);
        
        // Move cursor to end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(captionInputRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      
      // Add to selected tags
      setSelectedTags(prev => [...prev, entity]);
    }
    
    setLocalShowSuggestions(false);
    onSelectMention(entity);
    
    // Focus back to input
    setTimeout(() => {
      if (captionInputRef.current) {
        captionInputRef.current.focus();
      }
    }, 100);
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
        {/* Golf course pin overlay on preview */}
        {selectedCourse && (
          <GolfCoursePin 
            courseName={selectedCourse.name}
            courseRegion={selectedCourse.region}
          />
        )}
        
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
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full text-sm">
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
                  index === currentMediaIndex ? 'bg-black' : 'bg-black/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Properly deduplicate entities - first by entity_id, then by username/name combination
  const allEntities = entities.length > 0 ? entities : mentionSuggestions;
  const deduplicatedEntities = allEntities.reduce((acc, entity) => {
    // Check if we already have this entity by entity_id
    const existingByEntityId = acc.find(item => item.entity_id === entity.entity_id && item.entity_type === entity.entity_type);
    if (existingByEntityId) {
      return acc; // Skip if already exists by entity_id
    }
    
    // Check if we already have this entity by username/name combination
    const displayName = entity.username || entity.name;
    const existingByDisplayName = acc.find(item => {
      const itemDisplayName = item.username || item.name;
      return itemDisplayName === displayName && item.entity_type === entity.entity_type;
    });
    
    if (!existingByDisplayName) {
      acc.push(entity);
    }
    
    return acc;
  }, [] as TaggableEntity[]);
  
  const showActiveSuggestions = localShowSuggestions || showSuggestions;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-full sm:max-w-[640px] mx-auto h-[90vh] sm:h-[85vh] overflow-y-auto rounded-[24px] bg-white shadow-[0_6px_18px_rgba(0,0,0,0.1)] p-6 backdrop-blur-sm"
        style={{
          backdropFilter: 'blur(4px)'
        }}>
        <DialogTitle className="text-center text-lg font-semibold">
          Create a Moment
        </DialogTitle>
        <DialogDescription className="sr-only">
          Add caption and post your media
        </DialogDescription>
        
        <div className="space-y-4">
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
              className="min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-slate-600"
              onInput={handleCaptionInput}
              data-placeholder="Write about your media... Use @ to tag people or businesses"
              suppressContentEditableWarning={true}
              style={{ minHeight: '80px' }}
            />

            {showActiveSuggestions && deduplicatedEntities.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50 mt-1">
                {deduplicatedEntities.map((entity) => (
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

          {/* Show selected tags */}
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
