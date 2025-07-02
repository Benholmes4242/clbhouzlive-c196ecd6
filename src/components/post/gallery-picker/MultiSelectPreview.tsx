import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';
import { MultiSelectPreviewProps } from './types';

const MultiSelectPreview: React.FC<MultiSelectPreviewProps> = ({
  selectedFiles,
  previewUrls,
  onFileRemove,
  onConfirmSelection,
  onClose
}) => {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-base font-semibold mb-1">Selected Media ({selectedFiles.length})</h3>
        <p className="text-xs text-gray-500">Review your selection below</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
        {previewUrls.map((url, index) => {
          const file = selectedFiles[index];
          const isVideo = file.type.startsWith('video/');
          
          return (
            <div key={index} className="relative group">
              {isVideo ? (
                <video 
                  src={url} 
                  className="w-full h-20 object-cover rounded-lg"
                  muted
                />
              ) : (
                <img 
                  src={url} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
              )}
              <button
                onClick={() => onFileRemove(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="flex gap-2">
        <Button onClick={onClose} variant="outline" className="flex-1 h-8 text-xs">
          Cancel
        </Button>
        <Button onClick={onConfirmSelection} className="flex-1 h-8 text-xs bg-[#b66b41] hover:bg-[#a55a3a] text-white">
          <Check size={12} className="mr-1" />
          Use Selected ({selectedFiles.length})
        </Button>
      </div>
    </div>
  );
};

export default MultiSelectPreview;