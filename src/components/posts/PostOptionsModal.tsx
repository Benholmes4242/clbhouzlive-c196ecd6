
import React from 'react';
import { Camera, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraClick: () => void;
  onLibraryClick: () => void;
}

const PostOptionsModal = ({ isOpen, onClose, onCameraClick, onLibraryClick }: PostOptionsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-[1001]">
      <div className="bg-white rounded-t-lg p-6 w-full max-w-sm mb-0 animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create Post</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={onCameraClick}
            className="w-full flex items-center gap-3 justify-start h-12"
            variant="outline"
          >
            <Camera className="h-5 w-5" />
            Take Photo/Video
          </Button>
          
          <Button
            onClick={onLibraryClick}
            className="w-full flex items-center gap-3 justify-start h-12"
            variant="outline"
          >
            <Image className="h-5 w-5" />
            Choose from Library
          </Button>
        </div>
      </div>

      <style>{`
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PostOptionsModal;
