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

  // Single centered cinematic modal wrapper
  return (
    <div
      className={`fixed inset-0 z-[1100] transition-opacity duration-200 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Centered Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={pickerRef}
          className="w-full max-w-[480px] bg-black/55 backdrop-blur-xl ring-1 ring-white/10 text-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
        >
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              {isMultiSelectMode ? 'Selected Media' : 'Create a Moment'}
            </h3>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/10 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-4 pb-5">
            <PickerContent
              isMultiSelectMode={isMultiSelectMode}
              isMobile={isMobile}
              onCameraClick={handleCameraClick}
              onPhotoClick={handlePhotoClick}
              onVideoClick={handleVideoClick}
              multiSelectPreview={multiSelectPreview}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryPicker;