
import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostFlow } from '@/hooks/usePostFlow';
// Import removed - optimistic post submission disabled
import GalleryPicker from '@/components/post/GalleryPicker';
// Enhanced create moment modal removed
import SnapToast from '@/components/snap/SnapToast';
import NavigationBar from './bottom-navigation/NavigationBar';
import { useNavigationHandlers } from '@/hooks/useNavigationHandlers';
// Post handlers temporarily disabled

// Hook to detect desktop (≥1024px)
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  return isDesktop;
};

const BottomNavigation = () => {
  const { user } = useSupabaseSession();
  const { activeTab, handleTabClick } = useNavigationHandlers();
  // Optimistic post submission temporarily disabled
  const submitPost = async () => {};
  // Post handlers temporarily disabled
  const handleCaptionInput = () => {};
  const selectMention = () => {};
  const isDesktop = useIsDesktop();
  
  const {
    captionInputRef,
    isGalleryOpen,
    isComposerOpen,
    selectedFile,
    selectedFiles,
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
    hideToast,
    resetState
  } = usePostFlow();

  // State for tags handled in CreateMomentModal
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
      course: selectedCourse ? {
        id: selectedCourse.id,
        name: selectedCourse.name,
        country: selectedCourse.country
      } : null
    });

    // Use multiple files if available, otherwise use single file
    const mediaFiles = selectedFiles.length > 0 ? selectedFiles : (selectedFile ? [selectedFile] : []);

    // Create tags array - this will be handled by the post submission hook
    let finalTags = [...localSelectedTags];

    // Add golf course information to be handled by post submission
    const courseInfo = selectedCourse ? {
      id: selectedCourse.id,
      name: selectedCourse.name,
      country: selectedCourse.country
    } : null;

    console.log('Final tags to submit:', finalTags);
    console.log('Course info to submit:', courseInfo);

    try {
      await submitPost();
      // Post submission logic temporarily disabled
      console.log('Post submission successful');
      closeComposer();
      setLocalSelectedTags([]);
      showConfirmationToast('Post shared successfully!');
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
      
      // Both mobile and desktop now use the new EnhancedCreateMomentModal
      console.log('Post tab clicked, opening Create a Moment modal directly');
      setLocalSelectedTags([]);
      // Open composer directly without files - modal will handle file upload UI
      openComposer();
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
    console.log('Setting local selected tags to empty array');
    setLocalSelectedTags([]);
    console.log('Closing gallery and opening composer with file:', file.name);
    closeGallery(); // Ensure gallery is closed before opening composer
    openComposer(file);
    console.log('openComposer call completed');
  };

  const handleMultipleFilesSelected = (files: File[]) => {
    console.log('BottomNavigation handleMultipleFilesSelected called with:', {
      count: files.length,
      files: files.map(f => ({ name: f.name, type: f.type, size: f.size }))
    });
    
    if (files.length === 0) {
      console.error('No files received in handleMultipleFilesSelected');
      showConfirmationToast('No files were selected. Please try again.');
      return;
    }
    
    setLocalSelectedTags([]);
    // Pass the first file as main file and the rest as additional files
    openComposer(files[0], files.slice(1));
  };

  const onCaptionInput = (e: React.FormEvent<HTMLDivElement>) => {
    // Caption input handling temporarily disabled
    handleCaptionInput();
  };

  const onSelectMention = (entity: any) => {
    // Add to local selected tags
    if (!localSelectedTags.find(tag => tag.id === entity.id)) {
      setLocalSelectedTags(prev => [...prev, entity]);
    }

    // Mention selection temporarily disabled
    selectMention();
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

      {/* Enhanced create moment modal temporarily disabled */}
      {isComposerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Create Post</h2>
            <p className="text-muted-foreground mb-4">
              Post creation features are being updated.
            </p>
            <button 
              onClick={() => {
                closeComposer();
                setLocalSelectedTags([]);
              }}
              className="w-full bg-primary text-white rounded-md py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <SnapToast
        message={toastMessage}
        isVisible={showToast}
        onHide={hideToast}
      />
    </>
  );
};

export default BottomNavigation;
