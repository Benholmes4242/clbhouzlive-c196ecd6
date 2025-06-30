
import React from 'react';
import { usePhotoGallery } from '@/hooks/usePhotoGallery';
import MediaPreviewSection from './MediaPreviewSection';
import MediaActionButtons from './MediaActionButtons';
import MediaGrid from './MediaGrid';

interface PhotoGalleryProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
}

const PhotoGallery = ({ onFilesSelected, selectedFiles }: PhotoGalleryProps) => {
  const {
    selectedImages,
    previewUrls,
    fileInputRef,
    handleFileUpload,
    handlePhotoUpload,
    handleVideoUpload,
    handleImageClick,
    handleSelectImages,
    clearSelection
  } = usePhotoGallery(onFilesSelected);

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Selected image preview */}
      <MediaPreviewSection
        previewUrls={previewUrls}
        selectedImages={selectedImages}
        onFileUpload={() => handleFileUpload()}
        onImageClick={handleImageClick}
      />

      {/* Bottom section */}
      <div className="flex-1 bg-white">
        {/* Action buttons */}
        <MediaActionButtons
          selectedImages={selectedImages}
          onPhotoUpload={handlePhotoUpload}
          onVideoUpload={handleVideoUpload}
          onClearSelection={clearSelection}
        />

        {/* File grid or empty state */}
        <MediaGrid
          previewUrls={previewUrls}
          selectedImages={selectedImages}
          onImageClick={handleImageClick}
          onPhotoUpload={handlePhotoUpload}
          onVideoUpload={handleVideoUpload}
          onSelectImages={handleSelectImages}
        />

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={() => {}} // Handled by dynamic inputs above
          className="hidden"
        />
      </div>
    </div>
  );
};

export default PhotoGallery;
