
import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface PostMediaPreviewProps {
  file: File | null;
  previewUrl: string;
}

const PostMediaPreview = ({ file, previewUrl }: PostMediaPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!file) return null;

  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  return (
    <div className="media-preview-container">
      <div className="w-full relative">
        {isImage ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full max-h-64 object-cover rounded-lg"
          />
        ) : isVideo ? (
          <div className="relative">
            <video
              src={previewUrl}
              className="w-full max-h-64 object-cover rounded-lg"
              controls={isPlaying}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onEnded={handleVideoPause}
              poster={previewUrl}
              preload="metadata"
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                <button
                  onClick={handleVideoPlay}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all duration-200 shadow-lg"
                >
                  <Play className="h-6 w-6 text-gray-800 ml-1" fill="currentColor" />
                </button>
              </div>
            )}
          </div>
        ) : (
          // Fallback for unsupported file types
          <div className="w-full max-h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-sm">File preview not available</p>
              <p className="text-xs">{file.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostMediaPreview;
