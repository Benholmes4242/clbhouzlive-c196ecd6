
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostCreationModal } from '@/hooks/usePostCreationModal';
import NativeCameraSheet from '@/components/posts/NativeCameraSheet';
import PostCreationModal from '@/components/posts/PostCreationModal';
import { navigationTabs } from './bottom-navigation/navigationTabs';
import { useCameraHandlers } from './bottom-navigation/useCameraHandlers';
import { usePostHandlers } from './bottom-navigation/usePostHandlers';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const [activeTab, setActiveTab] = useState('home');
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

  const { handleDirectUpload, handleCameraClick, handleLibraryClick, handleFileClick } = useCameraHandlers();
  const { handleCaptionInput, selectMention, handleSubmitPost } = usePostHandlers();

  useEffect(() => {
    const currentTab = navigationTabs.find(tab => tab.path === location.pathname);
    if (currentTab) {
      setActiveTab(currentTab.id);
    } else if (location.pathname === '/') {
      setActiveTab('home');
    }
  }, [location.pathname]);

  const handleTabClick = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    if (tab.isAction && tab.id === 'share') {
      if (!user) return;
      // Directly trigger file upload without showing native sheet
      handleDirectUpload(user);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    openModal(file);
    event.target.value = '';
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

      <NativeCameraSheet
        isOpen={showNativeSheet}
        onClose={() => setShowNativeSheet(false)}
        onCameraClick={() => handleCameraClick(user, setShowNativeSheet)}
        onLibraryClick={() => handleLibraryClick(user, setShowNativeSheet)}
        onFileClick={() => handleFileClick(user, setShowNativeSheet, openModal)}
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
        onCaptionInput={(e) => handleCaptionInput(
          e, caption, setCaption, cursorPosition, setCursorPosition, 
          setShowSuggestions, setMentionSuggestions
        )}
        showSuggestions={showSuggestions}
        mentionSuggestions={mentionSuggestions}
        onSelectMention={(entity) => selectMention(
          entity, caption, setCaption, cursorPosition, selectedTags, 
          setSelectedTags, captionInputRef, setShowSuggestions, setMentionSuggestions
        )}
        onSubmit={() => handleSubmitPost(
          selectedFile, user, caption, selectedTags, closeModal, setIsSubmitting
        )}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default BottomNavigation;
