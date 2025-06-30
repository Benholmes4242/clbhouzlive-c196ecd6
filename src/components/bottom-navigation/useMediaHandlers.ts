
export const useMediaHandlers = (closeSnapModal: () => void, openComposer: (file: File) => void) => {
  const handleCameraClick = (user: any) => {
    if (!user) return;
    console.log('Camera click - closing snap modal');
    closeSnapModal();
    
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
        // Ensure composer opens immediately after file selection
        setTimeout(() => {
          openComposer(file);
        }, 100);
      }
    };
    
    input.click();
  };

  const handleImageClick = (user: any) => {
    if (!user) return;
    console.log('Image click - closing snap modal');
    closeSnapModal();
    
    // Create input for image selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        console.log('Image file selected:', file.name, file.type);
        // Ensure composer opens immediately after file selection
        setTimeout(() => {
          openComposer(file);
        }, 100);
      }
    };
    
    input.click();
  };

  const handleVideoClick = (user: any) => {
    if (!user) return;
    console.log('Video click - closing snap modal');
    closeSnapModal();
    
    // Create input for video selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        console.log('Video file selected:', file.name, file.type);
        // Ensure composer opens immediately after file selection
        setTimeout(() => {
          openComposer(file);
        }, 100);
      }
    };
    
    input.click();
  };

  return {
    handleCameraClick,
    handleImageClick,
    handleVideoClick
  };
};
