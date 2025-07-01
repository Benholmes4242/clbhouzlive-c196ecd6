
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

  const handleCameraClick = () => {
    console.log('Camera click - mobile camera capture starting', { isMobile });
    
    // Create input for camera capture with high quality settings
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    
    // For mobile devices, add capture attribute
    if (isMobile) {
      input.capture = 'environment';
      input.setAttribute('capture', 'camera');
    }
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      console.log('Camera input change event triggered', { 
        hasFile: !!file, 
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'N/A'
      });
      
      if (file) {
        console.log('Calling onFileSelected with camera file:', file.name);
        onFileSelected(file);
        console.log('Closing gallery after camera selection');
        onClose();
      } else {
        console.warn('No file selected from camera input');
      }
    };
    
    console.log('Triggering camera input click');
    input.click();
  };

  const handlePhotoClick = () => {
    console.log('Photo selection clicked');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      console.log('Photo input change event triggered', { 
        hasFiles: !!files, 
        fileCount: files?.length || 0,
        filesDetails: files ? Array.from(files).map(f => ({ name: f.name, type: f.type, size: `${(f.size / 1024 / 1024).toFixed(2)}MB` })) : []
      });
      
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        console.log('Photo files selected:', fileArray.length, 'files');
        
        if (fileArray.length === 1) {
          console.log('Single photo selected, calling onFileSelected with:', fileArray[0].name);
          onFileSelected(fileArray[0]);
          console.log('Closing gallery after single photo selection');
          onClose();
        } else {
          console.log('Multiple photos selected, entering multi-select mode');
          // Multiple files selected - enter multi-select mode
          setSelectedFiles(fileArray);
          const urls = fileArray.map(file => URL.createObjectURL(file));
          setPreviewUrls(urls);
          setIsMultiSelectMode(true);
        }
      } else {
        console.warn('No files selected from photo input');
      }
    };
    
    console.log('Triggering photo input click');
    input.click();
  };

  const handleVideoClick = () => {
    console.log('Video selection clicked');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = true;
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      console.log('Video input change event triggered', { 
        hasFiles: !!files, 
        fileCount: files?.length || 0,
        filesDetails: files ? Array.from(files).map(f => ({ name: f.name, type: f.type, size: `${(f.size / 1024 / 1024).toFixed(2)}MB` })) : []
      });
      
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        console.log('Video files selected:', fileArray.length, 'files');
        
        if (fileArray.length === 1) {
          console.log('Single video selected, calling onFileSelected with:', fileArray[0].name);
          onFileSelected(fileArray[0]);
          console.log('Closing gallery after single video selection');
          onClose();
        } else {
          console.log('Multiple videos selected, entering multi-select mode');
          // Multiple files selected
          setSelectedFiles(fileArray);
          const urls = fileArray.map(file => URL.createObjectURL(file));
          setPreviewUrls(urls);
          setIsMultiSelectMode(true);
        }
      } else {
        console.warn('No files selected from video input');
      }
    };
    
    console.log('Triggering video input click');
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
    console.log('handleConfirmSelection called with selectedFiles count:', selectedFiles.length);
    console.log('selectedFiles details:', selectedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
    console.log('onMultipleFilesSelected function exists:', !!onMultipleFilesSelected);
    console.log('onFileSelected function exists:', !!onFileSelected);
    
    if (selectedFiles.length > 0) {
      if (onMultipleFilesSelected) {
        console.log('Calling onMultipleFilesSelected with', selectedFiles.length, 'files');
        onMultipleFilesSelected(selectedFiles);
        console.log('onMultipleFilesSelected call completed');
      } else {
        console.log('onMultipleFilesSelected not available, falling back to onFileSelected with first file:', selectedFiles[0].name);
        // Fallback to single file if multiple not supported
        onFileSelected(selectedFiles[0]);
        console.log('onFileSelected fallback call completed');
      }
      
      console.log('Cleaning up preview URLs and closing gallery');
      // Clean up
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setIsMultiSelectMode(false);
      onClose();
      console.log('Gallery cleanup and close completed');
    } else {
      console.warn('handleConfirmSelection called but no files selected');
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

  // Mobile Version - Bottom Sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-auto p-6 rounded-t-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-center text-xl font-semibold">
              {isMultiSelectMode ? 'Selected Media' : 'Create a Moment'}
            </SheetTitle>
          </SheetHeader>
          
          {isMultiSelectMode ? (
            <MultiSelectPreview />
          ) : (
            <div className="space-y-4">
              {/* Capture Button */}
              <Button
                onClick={handleCameraClick}
                className="w-full h-auto p-4 bg-white border-2 border-[#b66b41] text-[#b66b41] hover:bg-[#b66b41] hover:text-white transition-all duration-200 rounded-xl flex items-start gap-4"
                variant="outline"
              >
                <Camera className="h-6 w-6 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-base">Capture Photo or Video</div>
                  <div className="text-sm opacity-70 font-normal">High quality camera</div>
                </div>
              </Button>

              {/* Post Photo Button */}
              <Button
                onClick={handlePhotoClick}
                className="w-full h-auto p-4 bg-white border-2 border-[#b66b41] text-[#b66b41] hover:bg-[#b66b41] hover:text-white transition-all duration-200 rounded-xl flex items-start gap-4"
                variant="outline"
              >
                <Image className="h-6 w-6 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-base">Select Photos</div>
                  <div className="text-sm opacity-70 font-normal">Single or multiple selection</div>
                </div>
              </Button>

              {/* Post Video Button */}
              <Button
                onClick={handleVideoClick}
                className="w-full h-auto p-4 bg-white border-2 border-[#b66b41] text-[#b66b41] hover:bg-[#b66b41] hover:text-white transition-all duration-200 rounded-xl flex items-start gap-4"
                variant="outline"
              >
                <Video className="h-6 w-6 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-base">Select Videos</div>
                  <div className="text-sm opacity-70 font-normal">Single or multiple selection</div>
                </div>
              </Button>

              <p className="text-center text-sm text-gray-500 mt-6 px-4">
                Select multiple files to create a carousel post with swipeable media.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop Version - Dialog Modal
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto p-8 rounded-2xl shadow-2xl animate-scale-in">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-center text-2xl font-semibold">
            {isMultiSelectMode ? 'Selected Media' : 'Create a Moment'}
          </DialogTitle>
        </DialogHeader>
        
        {isMultiSelectMode ? (
          <MultiSelectPreview />
        ) : (
          <div className="space-y-6">
            <Button
              onClick={handlePhotoClick}
              className="w-full h-20 bg-white border-2 border-[#b66b41] text-[#b66b41] hover:bg-[#b66b41] hover:text-white transition-all duration-200 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold"
              variant="outline"
            >
              <Image className="h-6 w-6" />
              Select Photos
            </Button>

            <Button
              onClick={handleVideoClick}
              className="w-full h-20 bg-white border-2 border-[#b66b41] text-[#b66b41] hover:bg-[#b66b41] hover:text-white transition-all duration-200 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold"
              variant="outline"
            >
              <Video className="h-6 w-6" />
              Select Videos
            </Button>

            <p className="text-center text-sm text-gray-500 mt-8 px-2">
              Select multiple files to create carousel posts with swipeable media.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GalleryPicker;
