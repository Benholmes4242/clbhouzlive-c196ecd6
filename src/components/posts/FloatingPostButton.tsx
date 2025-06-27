
import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostSubmission } from '@/hooks/usePostSubmission';
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
  const captionInputRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<TaggableEntity[]>([]);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleButtonClick = () => {
    if (!user) return;
    // Immediately open camera roll/file picker
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

  const handleCaptionInput = async (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const text = target.innerText;
    setCaption(text);

    // Get cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setCursorPosition(selection.getRangeAt(0).startOffset);
    }

    // Find the word at cursor position that starts with @
    const words = text.split(/(\s+)/);
    let currentPosition = 0;
    let mentionWord = '';
    
    for (const word of words) {
      if (currentPosition <= cursorPosition && cursorPosition <= currentPosition + word.length) {
        if (word.startsWith('@') && word.length > 1) {
          mentionWord = word;
          break;
        }
      }
      currentPosition += word.length;
    }

    if (mentionWord && mentionWord.length > 1) {
      const query = mentionWord.slice(1);
      await searchEntities(query);
      
      // Deduplicate entities
      const uniqueEntities = entities.reduce((acc, entity) => {
        const identifier = `${entity.entity_type}-${entity.entity_id}-${entity.username || entity.name}`;
        if (!acc.find(item => 
          `${item.entity_type}-${item.entity_id}-${item.username || item.name}` === identifier
        )) {
          acc.push(entity);
        }
        return acc;
      }, [] as TaggableEntity[]);
      
      setMentionSuggestions(uniqueEntities);
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

    // Replace the @ mention in the caption with styled version
    const words = caption.split(/(\s+)/);
    let currentPosition = 0;
    let replacedText = '';
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (currentPosition <= cursorPosition && cursorPosition <= currentPosition + word.length) {
        if (word.startsWith('@')) {
          words[i] = `@${displayName}`;
          break;
        }
      }
      currentPosition += word.length;
    }
    
    const newCaption = words.join('');
    setCaption(newCaption);
    
    // Update the contentEditable div
    if (captionInputRef.current) {
      captionInputRef.current.innerText = newCaption;
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
          <Camera className="h-5 w-5" />
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
                ref={captionInputRef}
                contentEditable
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onInput={handleCaptionInput}
                data-placeholder="Write your caption and tag friends with @..."
                suppressContentEditableWarning={true}
                style={{
                  minHeight: '80px',
                }}
              />

              {/* Mention Suggestions Dropdown */}
              {showSuggestions && mentionSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50 mt-1">
                  {mentionSuggestions.map((entity) => (
                    <div
                      key={entity.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
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
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .post-btn:hover {
          transform: scale(1.05);
        }

        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </>
  );
};

export default FloatingPostButton;
