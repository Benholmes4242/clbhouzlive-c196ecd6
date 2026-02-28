import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { X, ImagePlus, Loader2 } from 'lucide-react';
import MediaFileHandler from './MediaFileHandler';
import TagInput from './TagInput';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface PostContentFormProps {
  onSubmit: (content: string, mediaFiles: File[], selectedTags: TaggableEntity[]) => void;
  isSubmitting?: boolean;
}

const PostContentForm = ({ onSubmit, isSubmitting = false }: PostContentFormProps) => {
  const { user } = useSupabaseSession();
  
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  const handleRemoveMedia = (indexToRemove: number) => {
    setMediaFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    
    // No file size validation - users can upload files of any size

    const hasVideos = mediaFiles.some(file => file.type.startsWith('video/'));
    
    if (hasVideos && mediaFiles.length > 1) {
      toast.error("Multiple files with video", { description: "For best performance, please share videos one at a time." });
      return;
    }

    onSubmit(content, mediaFiles, selectedTags);
    
    // Clear form after submission
    setContent('');
    setMediaFiles([]);
    setSelectedTags([]);
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) {
      const hasVideos = mediaFiles.some(file => file.type.startsWith('video/'));
      if (hasVideos) return 'Processing...';
      if (mediaFiles.length > 0) return 'Uploading...';
      return 'Sharing...';
    }
    return 'Share';
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="postContent">Post Content</Label>
        <Textarea
          id="postContent"
          placeholder="Write something..."
          value={content}
          onChange={handleContentChange}
          rows={3}
        />
      </div>

      {mediaFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {mediaFiles.map((file, index) => (
            <div key={index} className="relative">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full aspect-square object-cover rounded-md"
                />
              ) : (
                <video
                  src={URL.createObjectURL(file)}
                  className="w-full aspect-square object-cover rounded-md"
                  controls
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 text-white bg-black/50 hover:bg-black/80"
                onClick={() => handleRemoveMedia(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center">
        <TagInput
          onTagsChange={setSelectedTags}
          selectedTags={selectedTags}
        />
        
        <div className="flex items-center space-x-2">
          <MediaFileHandler onFilesSelected={setMediaFiles} />
          <Button 
            onClick={handleSubmit}
            disabled={(!content.trim() && mediaFiles.length === 0) || isSubmitting}
            className="min-w-[80px]"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {getSubmitButtonText()}
          </Button>
        </div>
      </div>
      
      {mediaFiles.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <p>No file size limits - upload photos and videos of any size</p>
          {mediaFiles.some(file => file.type.startsWith('video/')) && (
            <p>Large videos may take longer to process</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PostContentForm;
