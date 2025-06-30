
import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useSnapModal } from '@/hooks/useSnapModal';
import { usePostSubmission } from '@/hooks/usePostSubmission';
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
  const { submitPost } = usePostSubmission();
  
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

  const { handleCaptionInput, selectMention } = usePostHandlers();

  const handleSubmitPost = async () => {
    if (!user) {
      console.error('No user found for post submission');
      showConfirmationToast('You must be logged in to post.');
      return;
    }

    setIsSubmitting(true);
    
    console.log('Starting post submission with:', {
      hasFile: !!selectedFile,
      caption,
      tagCount: selectedTags.length,
      course: selectedCourse?.name
    });

    // Convert single file to array for submission
    const mediaFiles = selectedFile ? [selectedFile] : [];

    try {
      await submitPost({
        user,
        content: caption,
        mediaFiles,
        selectedTags,
        onSuccess: () => {
          console.log('Post submission successful');
          closeComposer();
          showConfirmationToast('Post shared successfully!');
        },
        onError: () => {
          console.error('Post submission failed');
          showConfirmationToast('Failed to share post. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error in handleSubmitPost:', error);
      showConfirmationToast('Failed to share post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
