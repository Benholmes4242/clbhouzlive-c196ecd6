
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useSnapModal } from '@/hooks/useSnapModal';
import { useCameraHandlers } from '@/components/bottom-navigation/useCameraHandlers';
import NativeCameraSheet from './NativeCameraSheet';

const FloatingPostButton = () => {
  const { user } = useSupabaseSession();
  const { openComposer } = useSnapModal();
  const { handleDirectUpload, handleCameraClick, handleLibraryClick, handleFileClick } = useCameraHandlers();
  const [showNativeSheet, setShowNativeSheet] = useState(false);

  const handleButtonClick = () => {
    if (!user) return;
    // Directly trigger file picker and open composer
    handleDirectUpload(user);
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
