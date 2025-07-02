import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import MultiSelectPreview from './gallery-picker/MultiSelectPreview';
import PickerContent from './gallery-picker/PickerContent';
import { createFileInput, handleFileSelection } from './gallery-picker/fileHandling';
import { GalleryPickerProps } from './gallery-picker/types';

const GalleryPicker = ({ isOpen, onClose, onFileSelected, onMultipleFilesSelected }: GalleryPickerProps) => {
  const isMobile = useIsMobile();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const handleMultipleFiles = (files: File[], urls: string[]) => {
    setSelectedFiles(files);
    setPreviewUrls(urls);
    setIsMultiSelectMode(true);
  };

  const handleFileSelectionWrapper = (files: FileList | null) => {
    handleFileSelection(files, onFileSelected, handleMultipleFiles, onClose);
  };

  const handleCameraClick = () => {
    console.log('Camera button clicked');
    const input = createFileInput('image/*,video/*', false, 'environment', isMobile);
    input.onchange = (e) => handleFileSelectionWrapper((e.target as HTMLInputElement).files);
    input.click();
  };

  const handlePhotoClick = () => {
    console.log('Photo gallery button clicked (allows multiple)');
    const input = createFileInput('image/jpeg,image/jpg,image/png,image/gif,image/webp');
    input.onchange = (e) => handleFileSelectionWrapper((e.target as HTMLInputElement).files);
    input.click();
  };

  const handleVideoClick = () => {
    console.log('Video gallery button clicked (allows multiple)');
    const input = createFileInput('video/*');
    input.onchange = (e) => handleFileSelectionWrapper((e.target as HTMLInputElement).files);
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

  const handleClose = () => {
    // Clean up preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setIsMultiSelectMode(false);
    onClose();
  };

  const multiSelectPreview = (
    <MultiSelectPreview
      selectedFiles={selectedFiles}
      previewUrls={previewUrls}
      onFileRemove={handleFileRemove}
      onConfirmSelection={handleConfirmSelection}
      onClose={handleClose}
    />
  );

  // Mobile Version - Bottom Sheet  
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent 
          side="bottom" 
          className="h-auto p-0 rounded-t-xl border-t-4 border-t-[#6e9277] bg-white relative"
          style={{
            transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-[#6e9277] rounded-t-xl" />
          
          <div className="px-3 pt-4 pb-4">
            <SheetHeader className="mb-3">
              <SheetTitle className="text-center text-lg font-semibold">
                {isMultiSelectMode ? 'Selected Media' : 'Create a Moment'}
              </SheetTitle>
            </SheetHeader>
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
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6e9277] rounded-b-xl" />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop Version - Dialog Modal
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-sm mx-auto p-0 rounded-xl shadow-2xl animate-scale-in bg-white border-0 relative"
        style={{
          position: 'fixed',
          bottom: '120px', // Rise from nav bar area
          left: '50%',
          transform: 'translateX(-50%)',
          margin: 0
        }}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-[#6e9277] rounded-t-xl" />
        
        <div className="px-3 pt-4 pb-4">
          <DialogHeader className="mb-3">
            <DialogTitle className="text-center text-lg font-semibold">
              {isMultiSelectMode ? 'Selected Media' : 'Create a Moment'}
            </DialogTitle>
          </DialogHeader>
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
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6e9277] rounded-b-xl" />
      </DialogContent>
    </Dialog>
  );
};

export default GalleryPicker;