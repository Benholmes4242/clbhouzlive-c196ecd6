import { useSnapModal } from "@/hooks/useSnapModal";

export const useMediaHandlers = (closeSnapModal: () => void, openComposer: (file: File) => void) => {
  const { openComposerWithFiles } = useSnapModal();

  // Helper function for web file picker
  const pickWeb = (accept: string[], multiple: boolean, onPicked: (files: File[]) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept.join(",");
    input.multiple = multiple;
    input.onchange = () => {
      const files = Array.from(input.files || []);
      if (files.length) onPicked(files);
    };
    input.click();
  };

  const handleCameraClick = (user: any) => {
    if (!user) return;
    console.log('Camera click - closing snap modal');
    closeSnapModal();
    
    // Small delay to ensure modal closes
    setTimeout(() => {
      // Create input for camera capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.capture = 'environment';
      
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          console.log('Camera file selected:', file.name, file.type);
          openComposer(file);
        }
      };
      
      input.click();
    }, 150);
  };

  const handleImageClick = (user?: any) => {
    console.log('Image click - closing snap modal');
    pickWeb(["image/*"], false, (files) => openComposer(files[0]));
  };

  const handleVideoClick = (user?: any) => {
    console.log('Video click - closing snap modal');
    pickWeb(["video/*"], false, (files) => openComposer(files[0]));
  };

  // NEW: mixed + multi-select handler
  const handleMixedMediaClick = () => {
    console.log('Mixed media click - opening multi-select picker');
    pickWeb(["image/*", "video/*"], true, (files) => {
      console.log('Mixed media files selected:', files.length);
      openComposerWithFiles(files);
    });
  };

  return {
    handleCameraClick,
    handleImageClick,
    handleVideoClick,
    handleMixedMediaClick // NEW
  };
};