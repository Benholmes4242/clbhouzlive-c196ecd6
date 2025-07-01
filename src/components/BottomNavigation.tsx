
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

  // State for multiple files and selected tags
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [localSelectedTags, setLocalSelectedTags] = React.useState<any[]>([]);

  const handleSubmitPost = async () => {
    if (!user) {
      console.error('No user found for post submission');
      showConfirmationToast('You must be logged in to post.');
      return;
    }

    setIsSubmitting(true);
    
    console.log('Starting post submission with:', {
      hasFile: !!selectedFile,
      hasMultipleFiles: selectedFiles.length > 0,
      caption,
      tagCount: localSelectedTags.length,
      course: selectedCourse?.name
    });

    // Use multiple files if available, otherwise use single file
    const mediaFiles = selectedFiles.length > 0 ? selectedFiles : (selectedFile ? [selectedFile] : []);

    try {
      await submitPost({
        user,
        content: caption,
        mediaFiles,
        selectedTags: localSelectedTags,
        onSuccess: () => {
          console.log('Post submission successful');
          closeComposer();
          setSelectedFiles([]);
          setLocalSelectedTags([]);
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
      console.log('Post tab clicked, opening gallery');
      openGallery();
    } else {
      handleTabClick(tab, user, () => {});
    }
  };

  const handleFileSelected = (file: File) => {
    console.log('BottomNavigation handleFileSelected called with:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    setSelectedFiles([]); // Clear multiple files when single file selected
    setLocalSelectedTags([]); // Reset tags
    openComposer(file);
  };

  const handleMultipleFilesSelected = (files: File[]) => {
    console.log('BottomNavigation handleMultipleFilesSelected called with:', {
      count: files.length,
      files: files.map(f => ({ name: f.name, type: f.type, size: f.size }))
    });
    setSelectedFiles(files);
    setLocalSelectedTags([]); // Reset tags
    // Use the first file for the composer preview
    openComposer(files[0]);
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
    // Add to local selected tags
    if (!localSelectedTags.find(tag => tag.id === entity.id)) {
      setLocalSelectedTags(prev => [...prev, entity]);
    }

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
        onFileSelected={handleFileSelected}
        onMultipleFilesSelected={handleMultipleFilesSelected}
      />

      <CreateMomentModal
        isOpen={isComposerOpen}
        onClose={() => {
          closeComposer();
          setLocalSelectedTags([]);
        }}
        selectedFile={selectedFile}
        selectedFiles={selectedFiles}
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
