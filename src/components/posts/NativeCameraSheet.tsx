
import React from 'react';
import { Camera, Image, Folder } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface NativeCameraSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraClick: () => void;
  onLibraryClick: () => void;
  onFileClick: () => void;
}

const NativeCameraSheet = ({ 
  isOpen, 
  onClose, 
  onCameraClick, 
  onLibraryClick, 
  onFileClick 
}: NativeCameraSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="bg-gray-800 border-gray-700 text-white rounded-t-xl p-0"
      >
        <div className="p-6 space-y-1">
          <button
            onClick={onLibraryClick}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Image className="h-6 w-6" />
            </div>
            <span className="text-lg font-medium">Photo Library</span>
          </button>

          <button
            onClick={onCameraClick}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Camera className="h-6 w-6" />
            </div>
            <span className="text-lg font-medium">Take Photo or Video</span>
          </button>

          <button
            onClick={onFileClick}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Folder className="h-6 w-6" />
            </div>
            <span className="text-lg font-medium">Choose File</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NativeCameraSheet;
