
import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostSubmission } from './PostSubmissionHandler';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTaggableEntities } from '@/hooks/useTaggableEntities';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

const FloatingPostButton = () => {
  const { user } = useSupabaseSession();
  const { submitPost } = usePostSubmission();
  const { entities, loading, searchEntities } = useTaggableEntities();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<TaggableEntity[]>([]);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);

  const handleButtonClick = () => {
    if (!user) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsModalOpen(true);

    // Reset file input
    event.target.value = '';
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    setSelectedTags([]);
    setShowSuggestions(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleCaptionChange = async (e: React.ChangeEvent<HTMLDivElement>) => {
    const text = e.target.innerText;
    setCaption(text);

    // Check for @ mentions
    const words = text.split(' ');
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const query = lastWord.slice(1);
      await searchEntities(query);
      setMentionSuggestions(entities);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionSuggestions([]);
    }
  };

  const selectMention = (entity: TaggableEntity) => {
    const displayName = entity.username || entity.name;
    
    // Add to selected tags if not already present
    if (!selectedTags.find(tag => tag.id === entity.id)) {
      setSelectedTags(prev => [...prev, entity]);
    }

    // Replace the @ mention in the caption
    const words = caption.split(' ');
    const lastWordIndex = words.length - 1;
    if (words[lastWordIndex].startsWith('@')) {
      words[lastWordIndex] = `@${displayName}`;
      setCaption(words.join(' '));
    }

    setShowSuggestions(false);
    setMentionSuggestions([]);
  };

  const handleSubmitPost = async () => {
    if (!selectedFile || !user) return;

    setIsSubmitting(true);
    
    try {
      await submitPost({
        user,
        content: caption,
        mediaFiles: [selectedFile],
        selectedTags,
        onSuccess: () => {
          handleCloseModal();
        },
        onError: () => {
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      console.error('Error submitting post:', error);
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="floating-post-button">
        <button 
          className="post-btn"
          onClick={handleButtonClick}
          aria-label="Create post"
        >
          <div className="plus-icon">
            <Camera className="h-5 w-5" />
          </div>
        </button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Media Preview */}
            <div className="media-preview-container">
              {selectedFile && (
                <div className="w-full">
                  {selectedFile.type.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                  ) : selectedFile.type.startsWith('video/') ? (
                    <video
                      src={previewUrl}
                      controls
                      className="w-full max-h-64 rounded-lg"
                    />
                  ) : null}
                </div>
              )}
            </div>

            {/* Caption Input with Mention Support */}
            <div className="relative">
              <div
                contentEditable
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onInput={handleCaptionChange}
                data-placeholder="Write your caption and tag friends with @..."
                suppressContentEditableWarning={true}
                style={{
                  minHeight: '80px',
                }}
              />

              {/* Mention Suggestions Dropdown */}
              {showSuggestions && mentionSuggestions.length > 0 && (
                <div className="suggestion-dropdown absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50 mt-1">
                  {mentionSuggestions.map((entity) => (
                    <div
                      key={entity.id}
                      className="suggestion-item px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      onClick={() => selectMention(entity)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">@{entity.username || entity.name}</span>
                        <span className="text-xs text-gray-500 capitalize">{entity.entity_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    @{tag.username || tag.name}
                    <button
                      onClick={() => setSelectedTags(prev => prev.filter(t => t.id !== tag.id))}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitPost}
                disabled={isSubmitting || !selectedFile}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .floating-post-button {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
        }

        .post-btn {
          background-color: #000;
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 43.5px;
          height: 43.5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          position: relative;
          transition: transform 0.2s ease;
        }

        .post-btn:hover {
          transform: scale(1.05);
        }

        .plus-icon {
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        .mention-link {
          color: #007aff;
          font-weight: 500;
          text-decoration: none;
        }

        .suggestion-dropdown {
          background: white;
          border: 1px solid #ddd;
          max-height: 150px;
          overflow-y: auto;
          position: absolute;
          z-index: 1000;
        }

        .suggestion-item {
          padding: 8px;
          cursor: pointer;
        }

        .suggestion-item:hover {
          background: #f0f0f0;
        }
      `}</style>
    </>
  );
};

export default FloatingPostButton;
