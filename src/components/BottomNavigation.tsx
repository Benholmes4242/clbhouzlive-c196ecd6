import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTaggableEntities } from '@/hooks/useTaggableEntities';
import { usePostSubmission } from '@/hooks/usePostSubmission';
import { useSnapModal } from '@/hooks/useSnapModal';
import SnapModal from '@/components/snap/SnapModal';
import SnapComposerModal from '@/components/snap/SnapComposerModal';
import SnapToast from '@/components/snap/SnapToast';
import { navigationTabs } from './bottom-navigation/navigationTabs';

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

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const { entities, searchEntities } = useTaggableEntities();
  const { submitPost } = usePostSubmission();
  const [activeTab, setActiveTab] = useState('home');

  const {
    captionInputRef,
    isSnapModalOpen,
    isComposerOpen,
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
    showToast,
    toastMessage,
    selectedCourse,
    setSelectedCourse,
    openSnapModal,
    closeSnapModal,
    openComposer,
    closeComposer,
    showConfirmationToast,
    hideToast
  } = useSnapModal();

  useEffect(() => {
    const currentTab = navigationTabs.find(tab => tab.path === location.pathname);
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else if (location.pathname === '/') {
      setActiveTab('home');
    }
  }, [location.pathname]);

  const handleTabClick = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.isAction && tab.id === 'snap') {
      if (!user) return;
      openSnapModal();
    } else if (tab.path) {
      setActiveTab(tab.id);
      navigate(tab.path);
      
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }, 50);
    }
  };

  const handleCameraClick = () => {
    if (!user) return;
    console.log('Camera click - closing snap modal');
    closeSnapModal();
    
    // Create input for camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.capture = 'environment';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        console.log('Camera file selected:', file.name, file.type);
        // Ensure composer opens immediately after file selection
        setTimeout(() => {
          openComposer(file);
        }, 100);
      }
    };
    
    input.click();
  };

  const handleImageClick = () => {
    if (!user) return;
    console.log('Image click - closing snap modal');
    closeSnapModal();
    
    // Create input for image selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        console.log('Image file selected:', file.name, file.type);
        // Ensure composer opens immediately after file selection
        setTimeout(() => {
          openComposer(file);
        }, 100);
      }
    };
    
    input.click();
  };

  const handleVideoClick = () => {
    if (!user) return;
    console.log('Video click - closing snap modal');
    closeSnapModal();
    
    // Create input for video selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        console.log('Video file selected:', file.name, file.type);
        // Ensure composer opens immediately after file selection
        setTimeout(() => {
          openComposer(file);
        }, 100);
      }
    };
    
    input.click();
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
      setSelectedTags([...selectedTags, entity]);
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
    if (!selectedFile || !user) {
      console.log('Cannot submit: missing file or user', { selectedFile: !!selectedFile, user: !!user });
      return;
    }

    console.log('Starting post submission...', { 
      fileName: selectedFile.name, 
      fileType: selectedFile.type,
      caption: caption,
      selectedTags: selectedTags,
      selectedCourse: selectedCourse
    });

    setIsSubmitting(true);
    
    try {
      // Add course as a tag if selected
      let tagsToSubmit = [...selectedTags];
      if (selectedCourse) {
        // Create a course entity for tagging
        const courseEntity: TaggableEntity = {
          id: selectedCourse.id,
          entity_type: 'golf_club',
          entity_id: selectedCourse.id,
          name: selectedCourse.name,
          username: null
        };
        tagsToSubmit.push(courseEntity);
      }

      await submitPost({
        user,
        content: caption,
        mediaFiles: [selectedFile],
        selectedTags: tagsToSubmit,
        onSuccess: () => {
          console.log('Post submission successful');
          closeComposer();
          showConfirmationToast("Your post is out there!");
        },
        onError: () => {
          console.log('Post submission failed');
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      console.error('Error submitting post:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around h-16 relative">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`flex flex-col items-center justify-center space-y-1 transition-colors relative focus:outline-none ${
                    isActive
                      ? 'text-[#2a2626]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon 
                    className="h-5 w-5" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth={2}
                  />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <SnapModal
        isOpen={isSnapModalOpen}
        onClose={closeSnapModal}
        onCameraClick={handleCameraClick}
        onImageClick={handleImageClick}
        onVideoClick={handleVideoClick}
      />

      <SnapComposerModal
        isOpen={isComposerOpen}
        onClose={closeComposer}
        selectedFile={selectedFile}
        previewUrl={previewUrl}
        captionInputRef={captionInputRef}
        onCaptionInput={handleCaptionInput}
        showSuggestions={showSuggestions}
        mentionSuggestions={mentionSuggestions}
        onSelectMention={selectMention}
        onSubmit={handleSubmitPost}
        isSubmitting={isSubmitting}
        selectedCourse={selectedCourse}
        onCourseSelect={setSelectedCourse}
      />

      <SnapToast
        message={toastMessage}
        isVisible={showToast}
        onHide={hideToast}
      />
    </>
  );
};

export default BottomNavigation;
