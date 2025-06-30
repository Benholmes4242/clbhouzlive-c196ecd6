
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Image, Video } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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

  const handlePhotoClick = () => {
    console.log('Photo selection clicked');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        console.log('Photo file selected:', file.name, file.type);
        onFileSelected(file);
      }
    };
    
    input.click();
  };

  const handleVideoClick = () => {
    console.log('Video selection clicked');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = false;
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        console.log('Video file selected:', file.name, file.type);
        onFileSelected(file);
      }
    };
    
    input.click();
  };

  // Mobile Version - Bottom Sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-auto p-6 rounded-t-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-center text-xl font-semibold">
              Create a Moment
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4">
            {/* Capture Button */}
            <Button
              onClick={handleCameraClick}
              className="w-full h-auto p-4 bg-white border-2 border-[#b66b41] text-[#b66b41] hover:bg-[#b66b41] hover:text-white transition-all duration-200 rounded-xl flex items-start gap-4"
              variant="outline"
            >
              <Camera className="h-6 w-6 mt-1 flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold text-base">Capture a Photo or Video</div>
                <div className="text-sm opacity-70 font-normal">Use your device camera</div>
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
                <div className="font-bold text-base">Post a Photo</div>
                <div className="text-sm opacity-70 font-normal">Select from gallery</div>
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
                <div className="font-bold text-base">Post a Video</div>
                <div className="text-sm opacity-70 font-normal">Select from gallery</div>
              </div>
            </Button>

            {/* Helper Text */}
            <p className="text-center text-sm text-gray-500 mt-6 px-4">
              After selection, you'll be able to write a caption, tag a golf club, and post.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop Version - Dialog Modal
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-8 rounded-2xl shadow-2xl animate-scale-in">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-center text-2xl font-semibold">
            Create a Moment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Post Photo Button */}
          <Button
            onClick={handlePhotoClick}
            className="w-full h-20 bg-white border-2 border-[#b66b41] text-[#b66b41] hover:bg-[#b66b41] hover:text-white transition-all duration-200 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold"
            variant="outline"
          >
            <Image className="h-6 w-6" />
            Post a Photo
          </Button>

          {/* Post Video Button */}
          <Button
            onClick={handleVideoClick}
            className="w-full h-20 bg-white border-2 border-[#b66b41] text-[#b66b41] hover:bg-[#b66b41] hover:text-white transition-all duration-200 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold"
            variant="outline"
          >
            <Video className="h-6 w-6" />
            Post a Video
          </Button>

          {/* Helper Text */}
          <p className="text-center text-sm text-gray-500 mt-8 px-2">
            You'll be able to write a caption and tag friends or clubs after selecting your media.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryPicker;
