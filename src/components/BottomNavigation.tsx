
import React from 'react';
import { usePostFlow } from '@/hooks/usePostFlow';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import GalleryPicker from '@/components/post/GalleryPicker';
import SnapToast from '@/components/snap/SnapToast';
import NavigationBar from './bottom-navigation/NavigationBar';
import PostSubmissionHandler from './bottom-navigation/PostSubmissionHandler';
import { useNavigationHandlers } from '@/hooks/useNavigationHandlers';
import { usePostSubmissionHandlers } from './bottom-navigation/usePostSubmissionHandlers';

const BottomNavigation = () => {
  const { activeTab, handleTabClick } = useNavigationHandlers();
  const isDesktop = useIsDesktop();
  
  console.log('BottomNavigation rendered - isDesktop:', isDesktop, 'activeTab:', activeTab);
  
  const {
    captionInputRef,
    isGalleryOpen,
    isComposerOpen,
    selectedFile,
    selectedFiles,
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
    hideToast,
    resetState
  } = usePostFlow();

  // State for tags handled in CreateMomentModal
  const [localSelectedTags, setLocalSelectedTags] = React.useState<any[]>([]);

  const {
    onTabClick,
    handleFileSelected,
    handleMultipleFilesSelected,
    onCaptionInput,
    onSelectMention
  } = usePostSubmissionHandlers(
    captionInputRef,
    caption,
    setCaption,
    cursorPosition,
    setCursorPosition,
    setShowSuggestions,
    setMentionSuggestions,
    selectedTags,
    setSelectedTags,
    localSelectedTags,
    setLocalSelectedTags,
    openComposer,
    closeGallery,
    showConfirmationToast
  );

  const handleCloseComposer = () => {
    closeComposer();
    setLocalSelectedTags([]);
  };

  return (
    <>
      <NavigationBar
        activeTab={activeTab}
        onTabClick={(tab) => {
          console.log('BottomNavigation: onTabClick called with:', tab);
          onTabClick(tab, handleTabClick);
        }}
      />

      <GalleryPicker
        isOpen={isGalleryOpen}
        onClose={closeGallery}
        onFileSelected={handleFileSelected}
        onMultipleFilesSelected={handleMultipleFilesSelected}
      />

      <PostSubmissionHandler
        isComposerOpen={isComposerOpen}
        selectedFiles={selectedFiles}
        selectedFile={selectedFile}
        selectedCourse={selectedCourse}
        onCourseSelect={setSelectedCourse}
        onClose={handleCloseComposer}
        onShowToast={showConfirmationToast}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
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
