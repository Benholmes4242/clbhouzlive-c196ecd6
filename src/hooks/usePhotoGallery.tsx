
import { useState, useRef, useEffect } from 'react';

export const usePhotoGallery = (onFilesSelected: (files: File[]) => void) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (acceptType: string = 'image/*,video/*') => {
    console.log('handleFileUpload called with acceptType:', acceptType);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptType;
    input.multiple = true;
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      console.log('Files selected:', files);
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        console.log('File array:', fileArray.map(f => ({ name: f.name, type: f.type, size: f.size })));
        
        // Create preview URLs
        const urls = fileArray.map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);
        setSelectedImages(fileArray);
        
        // If single file selected, immediately use it
        if (fileArray.length === 1) {
          console.log('Single file selected, calling onFilesSelected with:', fileArray[0]);
          onFilesSelected(fileArray);
        }
      }
    };
    
    input.click();
  };

  const handlePhotoUpload = () => {
    console.log('handlePhotoUpload called');
    handleFileUpload('image/*');
  };

  const handleVideoUpload = () => {
    console.log('handleVideoUpload called');
    handleFileUpload('video/*');
  };

  const handleImageClick = (index: number) => {
    console.log('handleImageClick called with index:', index);
    console.log('Selected image:', selectedImages[index]);
    if (isMultiSelect) {
      // Handle multi-select logic if needed
    } else {
      // Single select - use the clicked file
      console.log('Calling onFilesSelected with clicked file:', selectedImages[index]);
      onFilesSelected([selectedImages[index]]);
    }
  };

  const handleSelectImages = () => {
    console.log('handleSelectImages called with:', selectedImages);
    if (selectedImages.length > 0) {
      onFilesSelected(selectedImages);
    }
  };

  const clearSelection = () => {
    console.log('clearSelection called');
    // Clean up preview URLs to prevent memory leaks
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setSelectedImages([]);
  };

  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return {
    selectedImages,
    previewUrls,
    isMultiSelect,
    fileInputRef,
    photoInputRef,
    videoInputRef,
    handleFileUpload,
    handlePhotoUpload,
    handleVideoUpload,
    handleImageClick,
    handleSelectImages,
    clearSelection
  };
};
