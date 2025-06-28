import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostSubmission } from '@/hooks/usePostSubmission';
import { useTaggableEntities } from '@/hooks/useTaggableEntities';
import { usePostCreationModal } from '@/hooks/usePostCreationModal';
import NativeCameraSheet from './NativeCameraSheet';
import PostCreationModal from './PostCreationModal';

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
  const [showNativeSheet, setShowNativeSheet] = useState(false);
  
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
    setShowNativeSheet(true);
  };

  const handleCameraClick = () => {
    if (!user) return;
    // Close the sheet immediately for faster UX
    setShowNativeSheet(false);
    
    // Small delay to allow sheet to close smoothly, then trigger camera
    setTimeout(() => {
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
    }, 100);
  };

  const handleLibraryClick = () => {
    if (!user) return;
    // Close the sheet immediately for faster UX
    setShowNativeSheet(false);
    
    // Small delay to allow sheet to close smoothly, then trigger file picker
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleFileClick = () => {
    if (!user) return;
    // Close the sheet immediately for faster UX
    setShowNativeSheet(false);
    
    // Small delay to allow sheet to close smoothly, then trigger file picker
    setTimeout(() => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          openModal(file);
        }
      };
      input.click();
    }, 100);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    openModal(file);
    event.target.value = '';
  };

  const handleCaptionInput = async (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const text = target.innerText;
    setCaption(text);

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setCursorPosition(selection.getRangeAt(0).startOffset);
    }

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
    
    if (!selectedTags.find(tag => tag.id === entity.id)) {
      setSelectedTags(prev => [...prev, entity]);
    }

    const words = caption.split(/(\s+)/);
    let currentPosition = 0;
    
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

  const shouldHideButton = showNativeSheet || isModalOpen;

  return (
    <>
      <div className={`post-button-container ${shouldHideButton ? 'hide-post-button' : ''}`}>
        <button 
          className="post-button"
          onClick={handleButtonClick}
          aria-label="Create post"
        >
          <Camera className="h-5 w-5" />
        </button>
      </div>

      <NativeCameraSheet
        isOpen={showNativeSheet}
        onClose={() => setShowNativeSheet(false)}
        onCameraClick={handleCameraClick}
        onLibraryClick={handleLibraryClick}
        onFileClick={handleFileClick}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <PostCreationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedFile={selectedFile}
        previewUrl={previewUrl}
        captionInputRef={captionInputRef}
        onCaptionInput={handleCaptionInput}
        showSuggestions={showSuggestions}
        mentionSuggestions={mentionSuggestions}
        onSelectMention={selectMention}
        onSubmit={handleSubmitPost}
        isSubmitting={isSubmitting}
      />

      <style>{`
        .post-button-container {
          position: fixed;
          bottom: 60px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 900;
        }

        .post-button {
          width: 52px;
          height: 52px;
          background-color: #2a2626;
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .post-button:hover {
          transform: scale(1.05);
        }

        .hide-post-button .post-button-container {
          display: none !important;
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
