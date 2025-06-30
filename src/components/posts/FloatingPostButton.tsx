
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useSnapModal } from '@/hooks/useSnapModal';
import NativeCameraSheet from './NativeCameraSheet';

const FloatingPostButton = () => {
  const { user } = useSupabaseSession();
  const { openComposer } = useSnapModal();
  const [showNativeSheet, setShowNativeSheet] = useState(false);

  const handleDirectUpload = (user: any) => {
    if (!user) return;
    
    console.log('Direct upload triggered');
    
    // Create input for file selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        console.log('File selected via direct upload:', file.name, file.type);
        // Open composer immediately without delay
        openComposer(file);
      }
    };
    
    input.click();
  };

  const handleCameraClick = (user: any, setShowNativeSheet: (show: boolean) => void) => {
    if (!user) return;
    console.log('Camera click triggered - closing sheet');
    setShowNativeSheet(false);
    
    // Small delay to ensure sheet closes first
    setTimeout(() => {
      // Create input for camera capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.capture = 'environment';
      
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          console.log('Camera file selected:', file.name, file.type);
          openComposer(file);
        }
      };
      
      input.click();
    }, 100);
  };

  const handleLibraryClick = (user: any, setShowNativeSheet: (show: boolean) => void) => {
    if (!user) return;
    console.log('Library click triggered - closing sheet');
    setShowNativeSheet(false);
    
    // Small delay to ensure sheet closes first
    setTimeout(() => {
      // Create input for library selection
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          console.log('Library file selected:', file.name, file.type);
          openComposer(file);
        }
      };
      
      input.click();
    }, 100);
  };

  const handleFileClick = (user: any, setShowNativeSheet: (show: boolean) => void) => {
    if (!user) return;
    console.log('File click triggered');
    setShowNativeSheet(false);
    
    // Small delay then trigger direct upload
    setTimeout(() => {
      handleDirectUpload(user);
    }, 100);
  };

  const handleButtonClick = () => {
    if (!user) return;
    console.log('Floating button clicked - showing native sheet');
    setShowNativeSheet(true);
  };

  if (!user) return null;

  const shouldHideButton = showNativeSheet;

  return (
    <>
      <div className={`post-button-container ${shouldHideButton ? 'hide-post-button' : ''}`}>
        <button 
          className="post-button"
          onClick={handleButtonClick}
          aria-label="Create post"
        >
          <Camera className="h-5 w-5" />
        </button>
      </div>

      <NativeCameraSheet
        isOpen={showNativeSheet}
        onClose={() => setShowNativeSheet(false)}
        onCameraClick={() => handleCameraClick(user, setShowNativeSheet)}
        onLibraryClick={() => handleLibraryClick(user, setShowNativeSheet)}
        onFileClick={() => handleFileClick(user, setShowNativeSheet)}
      />

      <style>{`
        .post-button-container {
          position: fixed;
          bottom: 60px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 900;
        }

        .post-button {
          width: 52px;
          height: 52px;
          background-color: #2a2626;
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .post-button:hover {
          transform: scale(1.05);
        }

        .hide-post-button .post-button-container {
          display: none !important;
        }
      `}</style>
    </>
  );
};

export default FloatingPostButton;
