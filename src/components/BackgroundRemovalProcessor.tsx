import React, { useEffect } from 'react';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';

interface BackgroundRemovalProcessorProps {
  imageUrl: string;
  onProcessed: (processedImageUrl: string) => void;
}

const BackgroundRemovalProcessor: React.FC<BackgroundRemovalProcessorProps> = ({
  imageUrl,
  onProcessed
}) => {
  useEffect(() => {
    const processImage = async () => {
      try {
        console.log('Processing image:', imageUrl);
        
        // Fetch the image and convert to blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Load image element
        const imageElement = await loadImage(blob);
        
        // Remove background
        const processedBlob = await removeBackground(imageElement);
        
        // Create object URL for the processed image
        const processedImageUrl = URL.createObjectURL(processedBlob);
        
        console.log('Background removal completed');
        onProcessed(processedImageUrl);
        
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback to original image if processing fails
        onProcessed(imageUrl);
      }
    };

    processImage();
  }, [imageUrl, onProcessed]);

  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <span className="ml-2 text-white">Processing image...</span>
    </div>
  );
};

export default BackgroundRemovalProcessor;