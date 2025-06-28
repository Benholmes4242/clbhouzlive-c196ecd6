
import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SnapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraClick: () => void;
  onImageClick: () => void;
  onVideoClick: () => void;
}

const SnapModal = ({ 
  isOpen, 
  onClose, 
  onCameraClick, 
  onImageClick, 
  onVideoClick 
}: SnapModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogTitle className="text-center text-lg font-semibold mb-6">
          Create Snap
        </DialogTitle>
        <DialogDescription className="sr-only">
          Choose how to create your snap
        </DialogDescription>
        
        <div className="space-y-4 px-2">
          <Button
            onClick={onCameraClick}
            className="w-full flex items-center gap-4 justify-start h-16 bg-white border-2 border-[#ff6b00] hover:bg-orange-50 text-gray-900 rounded-xl transition-colors duration-200"
            variant="outline"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-orange-50 rounded-lg">
              <Camera className="h-6 w-6 text-[#ff6b00]" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-base">Capture Photo or Video</div>
              <div className="text-sm text-gray-500">Use your device camera</div>
            </div>
          </Button>
          
          <Button
            onClick={onVideoClick}
            className="w-full flex items-center gap-4 justify-start h-16 bg-white border-2 border-[#ff6b00] hover:bg-orange-50 text-gray-900 rounded-xl transition-colors duration-200"
            variant="outline"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-orange-50 rounded-lg">
              <Video className="h-6 w-6 text-[#ff6b00]" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-base">Post a Video</div>
              <div className="text-sm text-gray-500">Select from gallery</div>
            </div>
          </Button>
          
          <Button
            onClick={onImageClick}
            className="w-full flex items-center gap-4 justify-start h-16 bg-white border-2 border-[#ff6b00] hover:bg-orange-50 text-gray-900 rounded-xl transition-colors duration-200"
            variant="outline"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-orange-50 rounded-lg">
              <Image className="h-6 w-6 text-[#ff6b00]" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-base">Post a Photo</div>
              <div className="text-sm text-gray-500">Select from gallery</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SnapModal;
