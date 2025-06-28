
import { usePostCreationModal } from '@/hooks/usePostCreationModal';

export const useCameraHandlers = () => {
  const { fileInputRef, openModal } = usePostCreationModal();

  const handleDirectUpload = (user: any) => {
    if (!user) return;
    
    // Directly trigger the file picker without any intermediary modal
    fileInputRef.current?.click();
  };

  const handleCameraClick = (user: any, setShowNativeSheet: (show: boolean) => void) => {
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

  const handleLibraryClick = (user: any, setShowNativeSheet: (show: boolean) => void) => {
    if (!user) return;
    // Close the sheet immediately for faster UX
    setShowNativeSheet(false);
    
    // Small delay to allow sheet to close smoothly, then trigger file picker
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleFileClick = (user: any, setShowNativeSheet: (show: boolean) => void, openModal: (file: File) => void) => {
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

  return {
    handleDirectUpload,
    handleCameraClick,
    handleLibraryClick,
    handleFileClick
  };
};
