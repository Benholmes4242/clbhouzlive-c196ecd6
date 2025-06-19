
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import MediaFileHandler from './MediaFileHandler';
import MediaPreview from './MediaPreview';

interface PostContentFormProps {
  content: string;
  onContentChange: (content: string) => void;
  mediaFiles: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
}

const PostContentForm = ({
  content,
  onContentChange,
  mediaFiles,
  onFilesSelected,
  onRemoveFile
}: PostContentFormProps) => {
  const handleFilesSelected = (newFiles: File[]) => {
    onFilesSelected(newFiles);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="content">What's on your mind?</Label>
        <Textarea
          id="content"
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div>
        <Label>Add Photos or Videos</Label>
        <div className="mt-2">
          <MediaFileHandler onFilesSelected={handleFilesSelected} />
        </div>
      </div>

      <MediaPreview 
        mediaFiles={mediaFiles} 
        onRemoveFile={onRemoveFile} 
      />
    </div>
  );
};

export default PostContentForm;
