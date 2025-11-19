import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostHandlers } from '@/hooks/usePostHandlers';
import { useLocation } from 'react-router-dom';

export const usePostSubmissionHandlers = (
  captionInputRef: React.RefObject<HTMLDivElement>,
  caption: string,
  setCaption: (caption: string) => void,
  cursorPosition: number,
  setCursorPosition: (position: number) => void,
  setShowSuggestions: (show: boolean) => void,
  setMentionSuggestions: (suggestions: any[]) => void,
  selectedTags: any[],
  setSelectedTags: (tags: any[]) => void,
  localSelectedTags: any[],
  setLocalSelectedTags: (tags: any[]) => void,
  openComposer: (file?: File, additionalFiles?: File[]) => void,
  closeGallery: () => void,
  showConfirmationToast: (message: string) => void
) => {
  const { user } = useSupabaseSession();
  const location = useLocation();
  const { handleCaptionInput, selectMention } = usePostHandlers();

  const onTabClick = (tab: { id: string; path: string | null; isAction?: boolean }, handleTabClick: Function) => {
    console.log('usePostSubmissionHandlers: onTabClick called with:', tab);
    if (tab.isAction && tab.id === 'post') {
      console.log('usePostSubmissionHandlers: Post tab detected, user:', user);
      
      if (!user) {
        console.log('usePostSubmissionHandlers: No user found, returning');
        return;
      }
      
      // Navigate to the create post page
      console.log('usePostSubmissionHandlers: Opening composer...');
      setLocalSelectedTags([]);
      // Open composer - will navigate to /create-moment page
      openComposer();
      console.log('usePostSubmissionHandlers: openComposer called');
    } else {
      console.log('usePostSubmissionHandlers: Not a post action, calling handleTabClick');
      
      // Special case: if clicking home/clubhouse while already on clubhouse page, scroll to top
      if (tab.id === 'clubhouse' && (location.pathname === '/clubhouse' || location.pathname === '/')) {
        console.log('usePostSubmissionHandlers: Scrolling to top of clubhouse page');
        
        // Find the ClubhouseVerticalFeed scroll container
        const scrollContainer = document.querySelector('.fixed.inset-0.z-10.bg-black.overflow-hidden .h-full.w-full.overflow-y-auto');
        
        if (scrollContainer) {
          console.log('Found clubhouse scroll container, scrolling to top');
          scrollContainer.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
        } else {
          console.log('Clubhouse scroll container not found, trying window scroll');
          // Fallback to multiple scroll methods
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          window.scrollTo(0, 0);
        }
        
        return;
      }
      
      handleTabClick(tab);
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
      setLocalSelectedTags([...localSelectedTags, entity]);
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

  return {
    onTabClick,
    handleFileSelected,
    handleMultipleFilesSelected,
    onCaptionInput,
    onSelectMention
  };
};