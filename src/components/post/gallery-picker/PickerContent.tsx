import React from 'react';
import { Button } from '@/components/ui/button';
import { PickerContentProps } from './types';

const PickerContent: React.FC<PickerContentProps> = ({
  isMultiSelectMode,
  isMobile,
  onCameraClick,
  onPhotoClick,
  onVideoClick,
  multiSelectPreview
}) => {
  if (isMultiSelectMode) {
    return <>{multiSelectPreview}</>;
  }

  return (
    <div className="space-y-1">
      {isMobile && (
        <Button
          onClick={onCameraClick}
          className="w-full h-8 px-3 bg-white border border-gray-300 text-gray-700 hover:border-gray-400 transition-all duration-200 rounded-lg flex items-center gap-2 cursor-pointer text-xs font-medium"
        >
          Capture Photo or Video
        </Button>
      )}

      <Button
        onClick={onPhotoClick}
        className="w-full h-8 px-3 bg-white border border-gray-300 text-gray-700 hover:border-gray-400 transition-all duration-200 rounded-lg flex items-center gap-2 cursor-pointer text-xs font-medium"
      >
        Select Photos
      </Button>

      <Button
        onClick={onVideoClick}
        className="w-full h-8 px-3 bg-white border border-gray-300 text-gray-700 hover:border-gray-400 transition-all duration-200 rounded-lg flex items-center gap-2 cursor-pointer text-xs font-medium"
      >
        Select Videos
      </Button>

      <p className="text-center text-xs text-gray-500 mt-2 px-2 leading-relaxed">
        Select multiple files to create a carousel post with swipeable media.
      </p>
    </div>
  );
};

export default PickerContent;