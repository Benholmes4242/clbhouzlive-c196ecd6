
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
        className="bg-white border-t-2 border-[#d37e4c] text-gray-900 rounded-t-xl p-0 shadow-xl"
      >
        <div className="p-6 space-y-2">
          {/* Header */}
          <div className="text-center pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900">Share Content</h3>
          </div>

          {/* Photo Library Option */}
          <button
            onClick={onLibraryClick}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#d37e4c] bg-opacity-10 rounded-lg">
              <Image className="h-5 w-5 text-[#d37e4c]" />
            </div>
            <div className="text-left">
              <span className="text-base font-medium text-gray-900 block">Photo Library</span>
              <span className="text-sm text-gray-500">Choose from your photos</span>
            </div>
          </button>

          {/* Camera Option */}
          <button
            onClick={onCameraClick}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#d37e4c] bg-opacity-10 rounded-lg">
              <Camera className="h-5 w-5 text-[#d37e4c]" />
            </div>
            <div className="text-left">
              <span className="text-base font-medium text-gray-900 block">Take Photo or Video</span>
              <span className="text-sm text-gray-500">Use your camera</span>
            </div>
          </button>

          {/* File Option */}
          <button
            onClick={onFileClick}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#d37e4c] bg-opacity-10 rounded-lg">
              <Folder className="h-5 w-5 text-[#d37e4c]" />
            </div>
            <div className="text-left">
              <span className="text-base font-medium text-gray-900 block">Choose File</span>
              <span className="text-sm text-gray-500">Browse all files</span>
            </div>
          </button>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full mt-4 p-3 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NativeCameraSheet;
