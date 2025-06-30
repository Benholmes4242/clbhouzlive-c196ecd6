
import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostFlow } from '@/hooks/usePostFlow';
import { usePostSubmission } from '@/hooks/usePostSubmission';
import GalleryPicker from '@/components/post/GalleryPicker';
import CreateMomentModal from '@/components/post/CreateMomentModal';
import SnapToast from '@/components/snap/SnapToast';
import NavigationBar from './bottom-navigation/NavigationBar';
import { useNavigationHandlers } from './bottom-navigation/useNavigationHandlers';
import { usePostHandlers } from './bottom-navigation/usePostHandlers';

const BottomNavigation = () => {
  const { user } = useSupabaseSession();
  const { activeTab, handleTabClick } = useNavigationHandlers();
  const { submitPost } = usePostSubmission();
  const { handleCaptionInput, selectMention } = usePostHandlers();
  
  const {
    captionInputRef,
    isGalleryOpen,
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
    openGallery,
    closeGallery,
    openComposer,
    closeComposer,
    showConfirmationToast,
    hideToast
  } = usePostFlow();

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
    if (tab.isAction && tab.id === 'post') {
      if (!user) return;
      openGallery();
    } else {
      handleTabClick(tab, user, () => {});
    }
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

      <GalleryPicker
        isOpen={isGalleryOpen}
        onClose={closeGallery}
        onFileSelected={openComposer}
      />

      <CreateMomentModal
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
