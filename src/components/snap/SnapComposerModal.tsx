import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PostMediaPreview from '../posts/PostMediaPreview';
import CaptionInput from '../posts/CaptionInput';
import CourseTagInput from '../posts/CourseTagInput';
import CoursePostBadge from '../posts/CoursePostBadge';

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

interface SnapComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFile: File | null;
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

const SnapComposerModal = ({
  isOpen,
  onClose,
  selectedFile,
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
}: SnapComposerModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogTitle className="text-center text-lg font-semibold">
          Create a Moment
        </DialogTitle>
        <DialogDescription className="sr-only">
          Add caption and post your snap
        </DialogDescription>
        
        <div className="space-y-4">
          {/* Course badge appears above media when course is selected */}
          {selectedCourse && (
            <CoursePostBadge course={selectedCourse} />
          )}

          <PostMediaPreview file={selectedFile} previewUrl={previewUrl} />

          <div className="relative">
            <div
              ref={captionInputRef}
              contentEditable
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onInput={onCaptionInput}
              data-placeholder="Write about your photo or video..."
              suppressContentEditableWarning={true}
              style={{ minHeight: '80px' }}
            />

            {showSuggestions && mentionSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50 mt-1">
                {mentionSuggestions.map((entity) => (
                  <div
                    key={entity.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={() => onSelectMention(entity)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-blue-600">@{entity.username || entity.name}</span>
                      <span className="text-xs text-gray-500 capitalize">{entity.entity_type}</span>
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
              disabled={isSubmitting || !selectedFile}
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

export default SnapComposerModal;
