
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PostMediaPreview from './PostMediaPreview';
import CaptionInput from './CaptionInput';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface PostCreationModalProps {
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
}

const PostCreationModal = ({
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
  isSubmitting
}: PostCreationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <PostMediaPreview file={selectedFile} previewUrl={previewUrl} />

          <CaptionInput
            captionInputRef={captionInputRef}
            onInput={onCaptionInput}
            showSuggestions={showSuggestions}
            mentionSuggestions={mentionSuggestions}
            onSelectMention={onSelectMention}
          />

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

export default PostCreationModal;
