
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
      <DialogContent className="max-w-sm mx-auto">
        <DialogTitle className="text-center text-lg font-semibold mb-4">
          Create Snap
        </DialogTitle>
        <DialogDescription className="sr-only">
          Choose how to create your snap
        </DialogDescription>
        
        <div className="space-y-3">
          <Button
            onClick={onCameraClick}
            className="w-full flex items-center gap-3 justify-start h-14 bg-white border hover:bg-gray-50 text-gray-900"
            variant="outline"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
              <Camera className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Camera</div>
              <div className="text-sm text-gray-500">Take a photo or record a video</div>
            </div>
          </Button>
          
          <Button
            onClick={onImageClick}
            className="w-full flex items-center gap-3 justify-start h-14 bg-white border hover:bg-gray-50 text-gray-900"
            variant="outline"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
              <Image className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Image</div>
              <div className="text-sm text-gray-500">Select from photo gallery</div>
            </div>
          </Button>
          
          <Button
            onClick={onVideoClick}
            className="w-full flex items-center gap-3 justify-start h-14 bg-white border hover:bg-gray-50 text-gray-900"
            variant="outline"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
              <Video className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Video</div>
              <div className="text-sm text-gray-500">Select from photo gallery</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SnapModal;
