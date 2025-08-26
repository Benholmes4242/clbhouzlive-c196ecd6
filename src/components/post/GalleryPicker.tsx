import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MultiSelectPreview from './gallery-picker/MultiSelectPreview';
import PickerContent from './gallery-picker/PickerContent';
import { createFileInput, handleFileSelection } from './gallery-picker/fileHandling';
import { GalleryPickerProps } from './gallery-picker/types';

const GalleryPicker = ({ isOpen, onClose, onFileSelected, onMultipleFilesSelected }: GalleryPickerProps) => {
  
  const isMobile = useIsMobile();
  const pickerRef = useRef<HTMLDivElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Handle close function
  const handleClose = () => {
    // Clean up preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setIsMultiSelectMode(false);
    onClose();
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMultipleFiles = (files: File[], urls: string[]) => {
    setSelectedFiles(files);
    setPreviewUrls(urls);
    setIsMultiSelectMode(true);
  };

  const handleFileSelectionWrapper = (files: FileList | null) => {
    handleFileSelection(files, onFileSelected, handleMultipleFiles, onClose);
  };

  const handleCameraClick = () => {
    console.log('Camera button clicked - mobile device:', isMobile);
    const input = createFileInput('image/*,video/*', false, 'environment', isMobile);
    input.onchange = (e) => {
      console.log('Camera input change event fired');
      handleFileSelectionWrapper((e.target as HTMLInputElement).files);
    };
    input.onerror = (e) => {
      console.error('Camera input error:', e);
    };
    console.log('About to trigger input.click()');
    input.click();
  };

  const handlePhotoClick = () => {
    console.log('Photo gallery button clicked (allows multiple) - mobile device:', isMobile);
    const input = createFileInput('image/jpeg,image/jpg,image/png,image/gif,image/webp');
    input.onchange = (e) => {
      console.log('Photo input change event fired');
      handleFileSelectionWrapper((e.target as HTMLInputElement).files);
    };
    input.onerror = (e) => {
      console.error('Photo input error:', e);
    };
    console.log('About to trigger photo input.click()');
    input.click();
  };

  const handleVideoClick = () => {
    console.log('Video gallery button clicked (allows multiple) - mobile device:', isMobile);
    const input = createFileInput('video/*');
    input.onchange = (e) => {
      console.log('Video input change event fired');
      handleFileSelectionWrapper((e.target as HTMLInputElement).files);
    };
    input.onerror = (e) => {
      console.error('Video input error:', e);
    };
    console.log('About to trigger video input.click()');
    input.click();
  };

  const handleFileRemove = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Clean up removed URL
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
    
    if (newFiles.length === 0) {
      setIsMultiSelectMode(false);
    }
  };

  const handleConfirmSelection = () => {
    console.log(`GalleryPicker handleConfirmSelection: ${selectedFiles.length} files to confirm`);
    
    if (selectedFiles.length > 0) {
      if (onMultipleFilesSelected) {
        console.log('Calling onMultipleFilesSelected with files:', selectedFiles.map(f => f.name));
        onMultipleFilesSelected(selectedFiles);
      } else {
        console.log('onMultipleFilesSelected not available, falling back to single file');
        onFileSelected(selectedFiles[0]);
      }
      
      // Clean up
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setIsMultiSelectMode(false);
      onClose();
    } else {
      console.log('No files to confirm selection');
    }
  };

  // Remove the old handleClose function since it's now defined above

  const multiSelectPreview = (
    <MultiSelectPreview
      selectedFiles={selectedFiles}
      previewUrls={previewUrls}
      onFileRemove={handleFileRemove}
      onConfirmSelection={handleConfirmSelection}
      onClose={handleClose}
    />
  );

  // Single slide-down container for both mobile and desktop
  return (
    <div 
      ref={pickerRef}
      className={`fixed left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
        isOpen 
          ? 'bottom-20 opacity-100 translate-y-0' 
          : 'bottom-16 opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 relative overflow-hidden min-w-[280px] max-w-[320px]">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-[#6e9277]" />
        
        <div className="px-3 pt-3 pb-2">
          <h3 className="text-center text-sm font-semibold mb-2">
            {isMultiSelectMode ? 'Selected Media' : 'Create a Moment'}
          </h3>
          
          <PickerContent
            isMultiSelectMode={isMultiSelectMode}
            isMobile={isMobile}
            onCameraClick={handleCameraClick}
            onPhotoClick={handlePhotoClick}
            onVideoClick={handleVideoClick}
            multiSelectPreview={multiSelectPreview}
          />
        </div>
        
        {/* Bottom accent bar */}
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6e9277]" />
      </div>
    </div>
  );
};

export default GalleryPicker;