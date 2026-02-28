import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';
import { toast } from 'sonner';

const ImageProcessor: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const processUploadedImage = useCallback(async () => {
    try {
      setIsProcessing(true);
      console.log('Starting image processing...');
      
      // Use the uploaded image URL
      const imageUrl = '/lovable-uploads/05bdf179-35ec-4957-af0a-907d2d47b4d6.png';
      
      // Create an image element and load it
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      console.log('Image loaded successfully');
      
      // Remove background
      const processedBlob = await removeBackground(img);
      
      // Create object URL for the processed image
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(processedUrl);
      
      console.log('Background removal completed');
      toast.success('Background removed');
      
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error("Couldn't process image");
      setProcessedImageUrl('/lovable-uploads/05bdf179-35ec-4957-af0a-907d2d47b4d6.png');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return (
    <div className="p-6 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
      <h3 className="text-lg font-semibold text-white mb-4">20 Club Medal Replacement</h3>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-white text-sm mb-2">Original Image</p>
            <img 
              src="/lovable-uploads/05bdf179-35ec-4957-af0a-907d2d47b4d6.png" 
              alt="Original medal" 
              className="w-24 h-24 object-contain border border-white/30 rounded"
            />
          </div>
          
          {processedImageUrl && (
            <div className="text-center">
              <p className="text-white text-sm mb-2">Processed (Background Removed)</p>
              <img 
                src={processedImageUrl} 
                alt="Processed medal" 
                className="w-24 h-24 object-contain border border-white/30 rounded"
              />
            </div>
          )}
        </div>
        
        <Button 
          onClick={processUploadedImage}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Remove Background & Use as 20 Club Medal'}
        </Button>
        
        {processedImageUrl && (
          <p className="text-green-300 text-sm">
            ✓ Image processed! The new medal will be used for the 20 Club achievement.
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageProcessor;