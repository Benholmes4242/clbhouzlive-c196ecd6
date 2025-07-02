import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Image, Video, X, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface GalleryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
  onMultipleFilesSelected?: (files: File[]) => void;
}

const GalleryPicker = ({ isOpen, onClose, onFileSelected, onMultipleFilesSelected }: GalleryPickerProps) => {
  const isMobile = useIsMobile();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const createFileInput = (accept: string, multiple: boolean = true, capture?: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    if (capture && isMobile) {
      input.setAttribute('capture', capture);
    }
    return input;
  };

  const handleFileSelection = (files: FileList | null) => {
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    const fileArray = Array.from(files);
    console.log(`GalleryPicker handleFileSelection: ${fileArray.length} files selected`, {
      files: fileArray.map(f => ({ name: f.name, type: f.type, size: f.size }))
    });
    
    if (fileArray.length === 1) {
      console.log('Single file selected, calling onFileSelected and closing');
      onFileSelected(fileArray[0]);
      onClose();
    } else {
      console.log('Multiple files selected, entering multi-select mode');
      // Multiple files - enter multi-select mode
      setSelectedFiles(fileArray);
      const urls = fileArray.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
      setIsMultiSelectMode(true);
    }
  };

  const handleCameraClick = () => {
    console.log('Camera button clicked');
    const input = createFileInput('image/*,video/*', false, 'environment');
    input.onchange = (e) => handleFileSelection((e.target as HTMLInputElement).files);
    input.click();
  };

  const handlePhotoClick = () => {
    console.log('Photo gallery button clicked (allows multiple)');
    const input = createFileInput('image/jpeg,image/jpg,image/png,image/gif,image/webp');
    input.onchange = (e) => handleFileSelection((e.target as HTMLInputElement).files);
    input.click();
  };

  const handleVideoClick = () => {
    console.log('Video gallery button clicked (allows multiple)');
    const input = createFileInput('video/*');
    input.onchange = (e) => handleFileSelection((e.target as HTMLInputElement).files);
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

  // Multi-select preview component
  const MultiSelectPreview = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Selected Media ({selectedFiles.length})</h3>
        <p className="text-sm text-gray-500">Review your selection below</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
        {previewUrls.map((url, index) => {
          const file = selectedFiles[index];
          const isVideo = file.type.startsWith('video/');
          
          return (
            <div key={index} className="relative group">
              {isVideo ? (
                <video 
                  src={url} 
                  className="w-full h-24 object-cover rounded-lg"
                  muted
                />
              ) : (
                <img 
                  src={url} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
              )}
              <button
                onClick={() => handleFileRemove(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="flex gap-2">
        <Button onClick={handleClose} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleConfirmSelection} className="flex-1 bg-[#b66b41] hover:bg-[#a55a3a] text-white">
          <Check size={16} className="mr-2" />
          Use Selected ({selectedFiles.length})
        </Button>
      </div>
    </div>
  );

  const PickerContent = () => (
    <>
      {isMultiSelectMode ? (
        <MultiSelectPreview />
      ) : (
        <div className="space-y-3">
          {isMobile && (
            <Button
              onClick={handleCameraClick}
              className="w-full h-12 px-4 bg-white border border-gray-300 text-gray-700 hover:border-gray-400 transition-all duration-200 rounded-lg flex items-center gap-3 cursor-pointer text-sm font-medium"
            >
              Capture Photo or Video
            </Button>
          )}

          <Button
            onClick={handlePhotoClick}
            className="w-full h-12 px-4 bg-white border border-gray-300 text-gray-700 hover:border-gray-400 transition-all duration-200 rounded-lg flex items-center gap-3 cursor-pointer text-sm font-medium"
          >
            Select Photos
          </Button>

          <Button
            onClick={handleVideoClick}
            className="w-full h-12 px-4 bg-white border border-gray-300 text-gray-700 hover:border-gray-400 transition-all duration-200 rounded-lg flex items-center gap-3 cursor-pointer text-sm font-medium"
          >
            Select Videos
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4 px-2 leading-relaxed">
            Select multiple files to create a carousel post with swipeable media.
          </p>
        </div>
      )}
    </>
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
          
          <div className="p-3 pt-4">
            <SheetHeader className="mb-3">
              <SheetTitle className="text-center text-lg font-semibold">
                {isMultiSelectMode ? 'Selected Media' : 'Create a Moment'}
              </SheetTitle>
            </SheetHeader>
            <PickerContent />
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
        
        <div className="p-3 pt-4">
          <DialogHeader className="mb-3">
            <DialogTitle className="text-center text-lg font-semibold">
              {isMultiSelectMode ? 'Selected Media' : 'Create a Moment'}
            </DialogTitle>
          </DialogHeader>
          <PickerContent />
        </div>
        
        {/* Bottom accent bar */}
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6e9277] rounded-b-xl" />
      </DialogContent>
    </Dialog>
  );
};

export default GalleryPicker;