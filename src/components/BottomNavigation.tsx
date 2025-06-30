
import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useSnapModal } from '@/hooks/useSnapModal';
import SnapModal from '@/components/snap/SnapModal';
import SnapComposerModal from '@/components/snap/SnapComposerModal';
import SnapToast from '@/components/snap/SnapToast';
import NavigationBar from './bottom-navigation/NavigationBar';
import { useNavigationHandlers } from './bottom-navigation/useNavigationHandlers';
import { useMediaHandlers } from './bottom-navigation/useMediaHandlers';
import { usePostHandlers } from './bottom-navigation/usePostHandlers';

const BottomNavigation = () => {
  const { user } = useSupabaseSession();
  const { activeTab, handleTabClick } = useNavigationHandlers();
  
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

  const { handleCameraClick, handleImageClick, handleVideoClick } = useMediaHandlers(
    closeSnapModal,
    openComposer
  );

  const { handleCaptionInput, selectMention, handleSubmitPost } = usePostHandlers();

  const onTabClick = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    handleTabClick(tab, user, openSnapModal);
  };

  const onCaptionInput = (e: React.FormEvent<HTMLDivElement>) => {
    handleCaptionInput(
      e,
      caption,
      setCaption,
      cursorPosition,
      setCursorPosition,
      setShowSuggestions,
      setMentionSuggestions
    );
  };

  const onSelectMention = (entity: any) => {
    selectMention(
      entity,
      caption,
      setCaption,
      cursorPosition,
      selectedTags,
      setSelectedTags,
      captionInputRef,
      setShowSuggestions,
      setMentionSuggestions
    );
  };

  const onSubmitPost = () => {
    handleSubmitPost(
      selectedFile,
      user,
      caption,
      selectedTags,
      selectedCourse,
      closeComposer,
      setIsSubmitting,
      showConfirmationToast
    );
  };

  return (
    <>
      <NavigationBar
        activeTab={activeTab}
        onTabClick={onTabClick}
      />

      <SnapModal
        isOpen={isSnapModalOpen}
        onClose={closeSnapModal}
        onCameraClick={() => handleCameraClick(user)}
        onImageClick={() => handleImageClick(user)}
        onVideoClick={() => handleVideoClick(user)}
      />

      <SnapComposerModal
        isOpen={isComposerOpen}
        onClose={closeComposer}
        selectedFile={selectedFile}
        previewUrl={previewUrl}
        captionInputRef={captionInputRef}
        onCaptionInput={onCaptionInput}
        showSuggestions={showSuggestions}
        mentionSuggestions={mentionSuggestions}
        onSelectMention={onSelectMention}
        onSubmit={onSubmitPost}
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
