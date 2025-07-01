import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Camera, Image, Video } from 'lucide-react';

interface SimpleMobileGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
  onMultipleFilesSelected?: (files: File[]) => void;
}

const SimpleMobileGallery = ({ isOpen, onClose, onFileSelected, onMultipleFilesSelected }: SimpleMobileGalleryProps) => {
  
  const handlePhotoClick = () => {
    console.log('📸 SIMPLE PHOTO BUTTON CLICKED');
    localStorage.setItem('simple_debug', JSON.stringify({
      step: 'button_clicked',
      timestamp: Date.now()
    }));
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
    input.multiple = true;
    
    input.onchange = (e) => {
      console.log('📸 SIMPLE PHOTO INPUT CHANGE');
      localStorage.setItem('simple_debug', JSON.stringify({
        step: 'files_selected',
        timestamp: Date.now()
      }));
      
      const target = e.target as HTMLInputElement;
      const files = target.files;
      
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        console.log('📸 Selected files:', fileArray.length);
        
        if (fileArray.length === 1) {
          console.log('📸 Calling onFileSelected');
          onFileSelected(fileArray[0]);
        } else if (onMultipleFilesSelected) {
          console.log('📸 Calling onMultipleFilesSelected');
          onMultipleFilesSelected(fileArray);
        } else {
          console.log('📸 Fallback to first file');
          onFileSelected(fileArray[0]);
        }
        onClose();
      }
    };
    
    console.log('📸 Triggering click');
    input.click();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto p-6 rounded-t-2xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-center text-xl font-semibold">
            Create a Moment
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4">
          <button
            onClick={() => {
              alert('Simple button works!');
              console.log('SIMPLE BUTTON CLICKED');
              handlePhotoClick();
            }}
            style={{ 
              width: '100%',
              height: 'auto',
              padding: '16px',
              backgroundColor: '#b66b41',
              border: 'none',
              color: 'white',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            <Image className="h-6 w-6" />
            Select Photos
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SimpleMobileGallery;