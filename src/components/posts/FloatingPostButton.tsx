
import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostSubmission } from './PostSubmissionHandler';

const FloatingPostButton = () => {
  const { user } = useSupabaseSession();
  const { submitPost } = usePostSubmission();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (!user) return;
    // Directly open file picker like mobile apps
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    const mediaFiles = Array.from(files);
    
    // Submit post with just the files (no text content required)
    await submitPost({
      user,
      content: '', // Empty content, just media
      mediaFiles,
      selectedTags: [],
      onSuccess: () => {
        window.location.reload();
      },
      onError: () => {
        // Handle error if needed
      }
    });

    // Reset file input
    event.target.value = '';
  };

  if (!user) return null;

  return (
    <>
      <div className="floating-post-button">
        <button 
          className="post-btn"
          onClick={handleButtonClick}
          aria-label="Create post"
        >
          <div className="plus-icon">
            <Camera className="h-5 w-5" />
          </div>
          <div className="post-label">Post</div>
        </button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <style>{`
        .floating-post-button {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
        }

        .post-btn {
          background-color: #000;
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 43.5px;
          height: 43.5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          position: relative;
          transition: transform 0.2s ease;
        }

        .post-btn:hover {
          transform: scale(1.05);
        }

        .plus-icon {
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .post-label {
          font-size: 8px;
          margin-top: 1px;
          color: #fff;
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          font-weight: 500;
        }
      `}</style>
    </>
  );
};

export default FloatingPostButton;
