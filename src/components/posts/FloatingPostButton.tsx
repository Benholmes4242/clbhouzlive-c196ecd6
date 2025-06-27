
import React, { useState } from 'react';
import { Camera, Image, Video, X } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostSubmission } from '@/hooks/usePostSubmission';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTaggableEntities } from '@/hooks/useTaggableEntities';
import { usePostCreationModal } from '@/hooks/usePostCreationModal';
import PostMediaPreview from './PostMediaPreview';
import CaptionInput from './CaptionInput';

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
  const { entities, searchEntities } = useTaggableEntities();
  const [showOptions, setShowOptions] = useState(false);
  
  const {
    fileInputRef,
    captionInputRef,
    isModalOpen,
    selectedFile,
    previewUrl,
    caption,
    setCaption,
    isSubmitting,
    setIsSubmitting,
    showSuggestions,
    setShowSuggestions,
    mentionSuggestions,
    setMentionSuggestions,
    selectedTags,
    setSelectedTags,
    cursorPosition,
    setCursorPosition,
    openModal,
    closeModal
  } = usePostCreationModal();

  const handleButtonClick = () => {
    if (!user) return;
    setShowOptions(true);
  };

  const handleCameraClick = () => {
    if (!user) return;
    // Create a new file input for camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        openModal(file);
      }
    };
    input.click();
    setShowOptions(false);
  };

  const handleLibraryClick = () => {
    if (!user) return;
    // Use existing file input ref for library selection
    fileInputRef.current?.click();
    setShowOptions(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    openModal(file);

    // Reset file input
    event.target.value = '';
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
          closeModal();
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

      {/* Options overlay */}
      {showOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-[1001]">
          <div className="bg-white rounded-t-lg p-6 w-full max-w-sm mb-0 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create Post</h3>
              <button
                onClick={() => setShowOptions(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleCameraClick}
                className="w-full flex items-center gap-3 justify-start h-12"
                variant="outline"
              >
                <Camera className="h-5 w-5" />
                Take Photo/Video
              </Button>
              
              <Button
                onClick={handleLibraryClick}
                className="w-full flex items-center gap-3 justify-start h-12"
                variant="outline"
              >
                <Image className="h-5 w-5" />
                Choose from Library
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <PostMediaPreview file={selectedFile} previewUrl={previewUrl} />

            <CaptionInput
              captionInputRef={captionInputRef}
              onInput={handleCaptionInput}
              showSuggestions={showSuggestions}
              mentionSuggestions={mentionSuggestions}
              onSelectMention={selectMention}
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={closeModal}
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

        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default FloatingPostButton;
