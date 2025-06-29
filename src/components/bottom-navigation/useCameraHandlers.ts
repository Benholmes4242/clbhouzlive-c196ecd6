
import { useSnapModal } from '@/hooks/useSnapModal';

export const useCameraHandlers = () => {
  const { openComposer } = useSnapModal();

  const handleDirectUpload = (user: any) => {
    if (!user) return;
    
    // Directly trigger the file picker without any intermediary modal
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        openComposer(file);
      }
    };
    input.click();
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
          openComposer(file);
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
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          openComposer(file);
        }
      };
      input.click();
    }, 100);
  };

  const handleFileClick = (user: any, setShowNativeSheet: (show: boolean) => void) => {
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
          openComposer(file);
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
