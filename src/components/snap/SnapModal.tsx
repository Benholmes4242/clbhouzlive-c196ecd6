
import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.2)] w-full max-w-[420px] md:max-w-[480px] py-6 px-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-center flex-1">Create a Moment</h2>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Options */}
          <div className="space-y-6">
            {isMobile && (
              <Button
                onClick={onCameraClick}
                className="w-full flex items-center gap-4 justify-start h-16 bg-white border-2 border-[#b66b41] hover:bg-orange-50 text-gray-900 rounded-xl transition-colors duration-200"
                variant="outline"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-orange-50 rounded-lg">
                  <Camera className="h-6 w-6 text-[#b66b41]" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-base">Capture Photo or Video</div>
                  <div className="text-sm text-gray-500">Use your device camera</div>
                </div>
              </Button>
            )}
            
            <Button
              onClick={onVideoClick}
              className="w-full flex items-center gap-4 justify-start h-16 bg-white border-2 border-[#b66b41] hover:bg-orange-50 text-gray-900 rounded-xl transition-colors duration-200"
              variant="outline"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-orange-50 rounded-lg">
                <Video className="h-6 w-6 text-[#b66b41]" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Post a Video</div>
                <div className="text-sm text-gray-500">Select from gallery</div>
              </div>
            </Button>
            
            <Button
              onClick={onImageClick}
              className="w-full flex items-center gap-4 justify-start h-16 bg-white border-2 border-[#b66b41] hover:bg-orange-50 text-gray-900 rounded-xl transition-colors duration-200"
              variant="outline"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-orange-50 rounded-lg">
                <Image className="h-6 w-6 text-[#b66b41]" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">Post a Photo</div>
                <div className="text-sm text-gray-500">Select from gallery</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnapModal;
