
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Video, X } from 'lucide-react';
import TagInput from './TagInput';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface PostContentFormProps {
  content: string;
  onContentChange: (content: string) => void;
  mediaFiles: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onTagsChange?: (tags: TaggableEntity[]) => void;
}

const PostContentForm = ({ 
  content, 
  onContentChange, 
  mediaFiles, 
  onFilesSelected, 
  onRemoveFile,
  onTagsChange = () => {}
}: PostContentFormProps) => {
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesSelected(files);
    e.target.value = '';
  };

  const handleTagsChange = (tags: TaggableEntity[]) => {
    setSelectedTags(tags);
    onTagsChange(tags);
  };

  return (
    <div className="space-y-4">
      <TagInput 
        content={content}
        onContentChange={onContentChange}
        onTagsChange={handleTagsChange}
      />

      {/* Media Preview */}
      {mediaFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {mediaFiles.map((file, index) => (
            <div key={index} className="relative rounded-lg overflow-hidden">
              <button
                className="absolute top-2 right-2 z-10 h-6 w-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white hover:text-gray-900 transition-all duration-200 shadow-md"
                onClick={() => onRemoveFile(index)}
              >
                <X className="h-3 w-3" />
              </button>
              
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-full h-32 object-cover"
                />
              ) : (
                <video
                  src={URL.createObjectURL(file)}
                  className="w-full h-32 object-cover"
                  controls={false}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Media Upload Buttons */}
      <div className="flex space-x-2">
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileSelect}
          />
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            Photo
          </Button>
        </div>
        
        <div className="relative">
          <input
            type="file"
            accept="video/*"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileSelect}
          />
          <Button variant="outline" size="sm">
            <Video className="h-4 w-4 mr-2" />
            Video
          </Button>
        </div>
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Tagged:</p>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <div key={tag.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                @{tag.username || tag.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostContentForm;
