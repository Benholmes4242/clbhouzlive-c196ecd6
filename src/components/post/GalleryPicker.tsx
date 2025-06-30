
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Camera, Image, Video } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import PhotoGallery from '@/components/posts/PhotoGallery';

interface GalleryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
}

const GalleryPicker = ({ isOpen, onClose, onFileSelected }: GalleryPickerProps) => {
  const isMobile = useIsMobile();

  const handleCameraClick = () => {
    if (!isMobile) return;
    
    console.log('Camera click - opening camera');
    
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
        onFileSelected(file);
      }
    };
    
    input.click();
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      console.log('Gallery file selected:', files[0].name, files[0].type);
      onFileSelected(files[0]);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-center">Select Media</SheetTitle>
          
          {/* Camera button for mobile only */}
          {isMobile && (
            <div className="flex justify-center pt-2">
              <Button
                onClick={handleCameraClick}
                className="flex items-center gap-2 bg-[#b66b41] hover:bg-[#a55a36] text-white"
              >
                <Camera className="h-4 w-4" />
                Take Photo or Video
              </Button>
            </div>
          )}
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <PhotoGallery 
            onFilesSelected={handleFilesSelected}
            selectedFiles={[]}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GalleryPicker;
