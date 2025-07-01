
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Image, Video, X, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface GalleryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
  onMultipleFilesSelected?: (files: File[]) => void;
}

const GalleryPicker = ({ isOpen, onClose, onFileSelected, onMultipleFilesSelected }: GalleryPickerProps) => {
  const isMobile = useIsMobile();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Debug logging for component state
  console.log('🟡 GalleryPicker render:', {
    isOpen,
    isMobile,
    isMultiSelectMode,
    selectedFilesCount: selectedFiles.length,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'undefined',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'undefined'
  });

  // Force mobile detection based on multiple factors
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 1024; // Increase breakpoint
  const isMobileUserAgent = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent);
  const isActuallyMobile = isMobile || isTouchDevice || isSmallScreen || isMobileUserAgent;
  
  console.log('🟡 Enhanced mobile detection:', {
    isMobile,
    isTouchDevice,
    isSmallScreen,
    isMobileUserAgent,
    isActuallyMobile,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'N/A',
    maxTouchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 'N/A',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'
  });

  const handleCameraClick = () => {
    console.log('🎥 CAMERA BUTTON CLICKED - mobile camera capture starting', { isMobile });
    
    // Create input for camera capture with high quality settings
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    
    // For mobile devices, add capture attribute
    if (isMobile) {
      input.capture = 'environment';
      input.setAttribute('capture', 'camera');
    }
    
    console.log('🎥 Camera input created with attributes:', {
      type: input.type,
      accept: input.accept,
      capture: input.capture,
      hasOnChange: !!input.onchange
    });
    
    input.onchange = (e) => {
      console.log('🎥 CAMERA INPUT CHANGE EVENT TRIGGERED');
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      console.log('🎥 Camera input change event triggered', { 
        hasFile: !!file, 
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'N/A'
      });
      
      if (file) {
        console.log('🎥 Calling onFileSelected with camera file:', file.name);
        onFileSelected(file);
        console.log('🎥 Closing gallery after camera selection');
        onClose();
      } else {
        console.warn('🎥 No file selected from camera input');
      }
    };
    
    console.log('🎥 About to trigger camera input click');
    input.click();
    console.log('🎥 Camera input click triggered');
  };

  const handlePhotoClick = () => {
    console.log('📸 PHOTO BUTTON CLICKED');
    
    // Store to localStorage for persistent tracking
    localStorage.setItem('photo_flow_debug', JSON.stringify({
      step: 'button_clicked',
      timestamp: Date.now()
    }));
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp'; // Specific formats only
    input.multiple = true;
    input.setAttribute('data-source', 'library'); // Hint for photo library
    
    console.log('📸 Photo input created with attributes:', {
      type: input.type,
      accept: input.accept,
      multiple: input.multiple
    });
    
    localStorage.setItem('photo_flow_debug', JSON.stringify({
      step: 'input_created',
      timestamp: Date.now()
    }));
    
    input.onchange = (e) => {
      console.log('📸 PHOTO INPUT CHANGE EVENT TRIGGERED');
      localStorage.setItem('photo_flow_debug', JSON.stringify({
        step: 'change_event_triggered',
        timestamp: Date.now()
      }));
      
      const target = e.target as HTMLInputElement;
      const files = target.files;
      console.log('📸 Photo input change event triggered', { 
        hasFiles: !!files, 
        fileCount: files?.length || 0,
        filesDetails: files ? Array.from(files).map(f => ({ name: f.name, type: f.type, size: `${(f.size / 1024 / 1024).toFixed(2)}MB` })) : []
      });
      
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        console.log('📸 Photo files selected:', fileArray.length, 'files');
        localStorage.setItem('photo_flow_debug', JSON.stringify({
          step: 'files_selected',
          fileCount: fileArray.length,
          timestamp: Date.now()
        }));
        
        if (fileArray.length === 1) {
          console.log('📸 Single photo selected, calling onFileSelected with:', fileArray[0].name);
          onFileSelected(fileArray[0]);
          console.log('📸 Closing gallery after single photo selection');
          onClose();
        } else {
          console.log('📸 Multiple photos selected, entering multi-select mode');
          // Multiple files selected - enter multi-select mode
          setSelectedFiles(fileArray);
          const urls = fileArray.map(file => URL.createObjectURL(file));
          setPreviewUrls(urls);
          setIsMultiSelectMode(true);
        }
      } else {
        console.warn('📸 No files selected from photo input');
        localStorage.setItem('photo_flow_debug', JSON.stringify({
          step: 'no_files_selected',
          timestamp: Date.now()
        }));
      }
    };
    
    console.log('📸 About to trigger photo input click');
    input.click();
    console.log('📸 Photo input click triggered');
    
    localStorage.setItem('photo_flow_debug', JSON.stringify({
      step: 'click_triggered',
      timestamp: Date.now()
    }));
  };

  const handleVideoClick = () => {
    console.log('🎬 VIDEO BUTTON CLICKED');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = true;
    
    console.log('🎬 Video input created with attributes:', {
      type: input.type,
      accept: input.accept,
      multiple: input.multiple
    });
    
    input.onchange = (e) => {
      console.log('🎬 VIDEO INPUT CHANGE EVENT TRIGGERED');
      const target = e.target as HTMLInputElement;
      const files = target.files;
      console.log('🎬 Video input change event triggered', { 
        hasFiles: !!files, 
        fileCount: files?.length || 0,
        filesDetails: files ? Array.from(files).map(f => ({ name: f.name, type: f.type, size: `${(f.size / 1024 / 1024).toFixed(2)}MB` })) : []
      });
      
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        console.log('🎬 Video files selected:', fileArray.length, 'files');
        
        if (fileArray.length === 1) {
          console.log('🎬 Single video selected, calling onFileSelected with:', fileArray[0].name);
          onFileSelected(fileArray[0]);
          console.log('🎬 Closing gallery after single video selection');
          onClose();
        } else {
          console.log('🎬 Multiple videos selected, entering multi-select mode');
          // Multiple files selected
          setSelectedFiles(fileArray);
          const urls = fileArray.map(file => URL.createObjectURL(file));
          setPreviewUrls(urls);
          setIsMultiSelectMode(true);
        }
      } else {
        console.warn('🎬 No files selected from video input');
      }
    };
    
    console.log('🎬 About to trigger video input click');
    input.click();
    console.log('🎬 Video input click triggered');
  };

  const handleFileRemove = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Clean up removed URL
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
    
    if (newFiles.length === 0) {
      setIsMultiSelectMode(false);
    }
  };

  const handleConfirmSelection = () => {
    console.log('✅ CONFIRM SELECTION BUTTON CLICKED');
    console.log('✅ selectedFiles count:', selectedFiles.length);
    console.log('✅ selectedFiles details:', selectedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
    console.log('✅ onMultipleFilesSelected function exists:', !!onMultipleFilesSelected);
    console.log('✅ onFileSelected function exists:', !!onFileSelected);
    
    if (selectedFiles.length > 0) {
      if (onMultipleFilesSelected) {
        console.log('✅ Calling onMultipleFilesSelected with', selectedFiles.length, 'files');
        onMultipleFilesSelected(selectedFiles);
        console.log('✅ onMultipleFilesSelected call completed');
      } else {
        console.log('✅ onMultipleFilesSelected not available, falling back to onFileSelected with first file:', selectedFiles[0].name);
        // Fallback to single file if multiple not supported
        onFileSelected(selectedFiles[0]);
        console.log('✅ onFileSelected fallback call completed');
      }
      
      console.log('✅ Cleaning up preview URLs and closing gallery');
      // Clean up
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setIsMultiSelectMode(false);
      onClose();
      console.log('✅ Gallery cleanup and close completed');
    } else {
      console.warn('✅ handleConfirmSelection called but no files selected');
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setIsMultiSelectMode(false);
    onClose();
  };

  // Multi-select preview component
  const MultiSelectPreview = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Selected Media ({selectedFiles.length})</h3>
        <p className="text-sm text-gray-500">Review your selection below</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
        {previewUrls.map((url, index) => {
          const file = selectedFiles[index];
          const isVideo = file.type.startsWith('video/');
          
          return (
            <div key={index} className="relative group">
              {isVideo ? (
                <video 
                  src={url} 
                  className="w-full h-24 object-cover rounded-lg"
                  muted
                />
              ) : (
                <img 
                  src={url} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
              )}
              <button
                onClick={() => handleFileRemove(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="flex gap-2">
        <Button onClick={handleClose} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleConfirmSelection} className="flex-1 bg-[#b66b41] hover:bg-[#a55a3a] text-white">
          <Check size={16} className="mr-2" />
          Use Selected ({selectedFiles.length})
        </Button>
      </div>
    </div>
  );

  // Mobile Version - Bottom Sheet  
  if (true) { // Force mobile version for debugging
    console.log('🟡 Rendering MOBILE version with Sheet');
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-auto p-6 rounded-t-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-center text-xl font-semibold">
              {isMultiSelectMode ? 'Selected Media' : 'Create a Moment'}
            </SheetTitle>
          </SheetHeader>
          
          {isMultiSelectMode ? (
            <MultiSelectPreview />
          ) : (
            <div className="space-y-4" style={{ backgroundColor: 'lightblue', padding: '10px', border: '2px solid red' }}>
              <div className="bg-yellow-200 p-2 text-xs rounded">
                🟡 DEBUG: Mobile sheet content rendering - buttons should appear below
              </div>
              
              <div className="bg-green-200 p-2 text-xs rounded">
                🟢 DEBUG: Button container - {isMultiSelectMode ? 'MULTI-SELECT MODE' : 'NORMAL MODE'}
              </div>
              
              {/* Test div to ensure content shows */}
              <div className="bg-red-200 p-4 text-center font-bold">
                🔴 TEST: Can you see this red box? If yes, buttons should render below.
              </div>
              
              {/* Capture Button */}
              <div className="bg-purple-200 p-2 text-xs rounded">
                🟣 DEBUG: About to render CAPTURE button
              </div>
              
              {/* Simple test button first */}
              <button
                onClick={() => {
                  console.log('🟢 SIMPLE TEST BUTTON CLICKED!');
                  alert('TEST BUTTON WORKS!');
                }}
                style={{ 
                  width: '100%',
                  height: '60px',
                  backgroundColor: 'lime',
                  border: '3px solid black',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                🟢 TAP HERE - TEST BUTTON
              </button>
              
              <button
                onClick={() => {
                  console.log('🔴 MOBILE CAPTURE BUTTON CLICKED - Event triggered');
                  handleCameraClick();
                }}
                style={{ 
                  width: '100%',
                  height: 'auto',
                  padding: '16px',
                  backgroundColor: 'white',
                  border: '2px solid #b66b41',
                  color: '#b66b41',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  cursor: 'pointer'
                }}
              >
                <Camera className="h-6 w-6 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-base">Capture Photo or Video</div>
                  <div className="text-sm opacity-70 font-normal">High quality camera</div>
                </div>
              </button>
              
              <div className="bg-purple-200 p-2 text-xs rounded">
                🟣 DEBUG: CAPTURE button rendered - PHOTO button coming next
              </div>

              {/* Post Photo Button */}
              <button
                onTouchStart={() => console.log('🟢 TOUCH START on Photo Button')}
                onTouchEnd={() => console.log('🟢 TOUCH END on Photo Button')} 
                onMouseDown={() => console.log('🟢 MOUSE DOWN on Photo Button')}
                onMouseUp={() => console.log('🟢 MOUSE UP on Photo Button')}
                onPointerDown={() => console.log('🟢 POINTER DOWN on Photo Button')}
                onPointerUp={() => console.log('🟢 POINTER UP on Photo Button')}
                onClick={() => {
                  console.log('🔴 MOBILE PHOTO BUTTON CLICKED - Event triggered');
                  handlePhotoClick();
                }}
                style={{ 
                  width: '100%',
                  height: 'auto',
                  padding: '16px',
                  backgroundColor: 'red', // Make it very obvious
                  border: '2px solid #b66b41',
                  color: 'white',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  zIndex: 9999,
                  position: 'relative'
                }}
              >
                <Image className="h-6 w-6 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-base">Select Photos</div>
                  <div className="text-sm opacity-70 font-normal">Single or multiple selection</div>
                </div>
              </button>

              {/* Post Video Button */}
              <button
                onClick={() => {
                  console.log('🔴 MOBILE VIDEO BUTTON CLICKED - Event triggered');
                  handleVideoClick();
                }}
                style={{ 
                  width: '100%',
                  height: 'auto',
                  padding: '16px',
                  backgroundColor: 'white',
                  border: '2px solid #b66b41',
                  color: '#b66b41',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  cursor: 'pointer'
                }}
              >
                <Video className="h-6 w-6 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-base">Select Videos</div>
                  <div className="text-sm opacity-70 font-normal">Single or multiple selection</div>
                </div>
              </button>

              <p className="text-center text-sm text-gray-500 mt-6 px-4">
                Select multiple files to create a carousel post with swipeable media.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop Version - Dialog Modal
  console.log('🟡 Rendering DESKTOP version with Dialog');
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto p-8 rounded-2xl shadow-2xl animate-scale-in">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-center text-2xl font-semibold">
            {isMultiSelectMode ? 'Selected Media' : 'Create a Moment'}
          </DialogTitle>
        </DialogHeader>
        
        {isMultiSelectMode ? (
          <MultiSelectPreview />
        ) : (
          <div className="space-y-6">
            <button
              onTouchStart={(e) => {
                console.log('🔴 DESKTOP PHOTO BUTTON TOUCH START');
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                console.log('🔴 DESKTOP PHOTO BUTTON CLICKED');
                e.preventDefault();
                e.stopPropagation();
                handlePhotoClick();
              }}
              className="w-full h-20 bg-white border-2 border-[#b66b41] text-[#b66b41] hover:bg-[#b66b41] hover:text-white transition-all duration-200 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold cursor-pointer touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Image className="h-6 w-6" />
              Select Photos
            </button>

            <button
              onTouchStart={(e) => {
                console.log('🔴 DESKTOP VIDEO BUTTON TOUCH START');
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                console.log('🔴 DESKTOP VIDEO BUTTON CLICKED');
                e.preventDefault();
                e.stopPropagation();
                handleVideoClick();
              }}
              className="w-full h-20 bg-white border-2 border-[#b66b41] text-[#b66b41] hover:bg-[#b66b41] hover:text-white transition-all duration-200 rounded-xl flex items-center justify-center gap-3 text-lg font-semibold cursor-pointer touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Video className="h-6 w-6" />
              Select Videos
            </button>

            <p className="text-center text-sm text-gray-500 mt-8 px-2">
              Select multiple files to create carousel posts with swipeable media.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GalleryPicker;
