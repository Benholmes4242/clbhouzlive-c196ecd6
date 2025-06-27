
import React from 'react';

interface PostMediaPreviewProps {
  file: File | null;
  previewUrl: string;
}

const PostMediaPreview = ({ file, previewUrl }: PostMediaPreviewProps) => {
  if (!file) return null;

  return (
    <div className="media-preview-container">
      <div className="w-full">
        {file.type.startsWith('image/') ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full max-h-64 object-cover rounded-lg"
          />
        ) : file.type.startsWith('video/') ? (
          <video
            src={previewUrl}
            controls
            className="w-full max-h-64 rounded-lg"
          />
        ) : null}
      </div>
    </div>
  );
};

export default PostMediaPreview;
