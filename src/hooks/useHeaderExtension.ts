import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExtensionResult {
  success: boolean;
  extendedImage?: string;
  fallback?: string;
  error?: string;
}

interface UseHeaderExtensionReturn {
  extendHeader: (file: File, extensionHeight?: number, customPrompt?: string) => Promise<string>;
  isProcessing: boolean;
  progress: string;
}

export const useHeaderExtension = (): UseHeaderExtensionReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const { toast } = useToast();

  const createFallbackExtension = useCallback((canvas: HTMLCanvasElement, originalImage: HTMLImageElement, extensionHeight: number): string => {
    console.log('Creating fallback extension using stretch+blur method');
    setProgress('Creating fallback extension...');
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const originalWidth = originalImage.naturalWidth;
    const originalHeight = originalImage.naturalHeight;
    const newHeight = originalHeight + extensionHeight;

    // Set canvas dimensions
    canvas.width = originalWidth;
    canvas.height = newHeight;

    // Draw the original image at the bottom
    ctx.drawImage(originalImage, 0, extensionHeight, originalWidth, originalHeight);

    // Create the extended top section by stretching and blurring the top slice
    const topSliceHeight = Math.min(50, originalHeight * 0.1); // Top 10% or 50px max
    
    // Create a temporary canvas for the top slice
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalWidth;
    tempCanvas.height = topSliceHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      // Extract top slice
      tempCtx.drawImage(
        originalImage, 
        0, 0, originalWidth, topSliceHeight,
        0, 0, originalWidth, topSliceHeight
      );
      
      // Apply blur filter
      ctx.filter = 'blur(12px) saturate(1.1)';
      
      // Stretch the top slice to fill the extension area
      ctx.drawImage(
        tempCanvas,
        0, 0, originalWidth, topSliceHeight,
        0, 0, originalWidth, extensionHeight
      );
      
      // Reset filter
      ctx.filter = 'none';
    }

    // Add feathering at the join (8-16px blend area)
    const featherHeight = 16;
    const gradient = ctx.createLinearGradient(0, extensionHeight - featherHeight, 0, extensionHeight + featherHeight);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, extensionHeight - featherHeight, originalWidth, featherHeight * 2);
    ctx.globalCompositeOperation = 'source-over';

    // Add subtle noise layer (1-2% opacity)
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = originalWidth;
    noiseCanvas.height = newHeight;
    const noiseCtx = noiseCanvas.getContext('2d');
    
    if (noiseCtx) {
      const imageData = noiseCtx.createImageData(originalWidth, newHeight);
      const data = imageData.data;
      
      // Generate monochrome noise
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255;
        data[i] = noise;     // R
        data[i + 1] = noise; // G
        data[i + 2] = noise; // B
        data[i + 3] = 5;     // A (1-2% opacity)
      }
      
      noiseCtx.putImageData(imageData, 0, 0);
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.02;
      ctx.drawImage(noiseCanvas, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  }, []);

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const extendHeader = useCallback(async (
    file: File, 
    extensionHeight: number = 200, 
    customPrompt?: string
  ): Promise<string> => {
    setIsProcessing(true);
    setProgress('Preparing image...');

    try {
      // Convert file to base64
      const imageBase64 = await fileToBase64(file);
      const originalImage = await loadImage(imageBase64);

      // Validate image dimensions
      if (originalImage.naturalWidth < 512 || originalImage.naturalHeight < 512) {
        throw new Error('Image too small. Minimum size is 512x512 pixels.');
      }

      setProgress('Requesting AI extension...');

      try {
        // Try AI extension first
        const { data } = await supabase.functions.invoke('extend-header', {
          body: {
            imageBase64,
            extensionHeight,
            prompt: customPrompt
          }
        });

        if (data?.success && data?.extendedImage) {
          setProgress('AI extension completed');
          toast({
            title: "Header Extended Successfully",
            description: "AI-powered header extension completed with seamless blending.",
          });
          return data.extendedImage;
        }

        // If AI fails, fall back to stretch+blur method
        console.log('AI extension failed, using fallback method:', data?.error);
        setProgress('AI extension failed, using fallback method...');
        
      } catch (aiError) {
        console.log('AI extension error, using fallback method:', aiError);
        setProgress('Using fallback extension method...');
      }

      // Fallback to stretch+blur method
      const canvas = document.createElement('canvas');
      const extendedImage = createFallbackExtension(canvas, originalImage, extensionHeight);
      
      toast({
        title: "Header Extended",
        description: "Header extended using fallback method. For best results, try again with a clearer background image.",
        variant: "default"
      });

      return extendedImage;

    } catch (error) {
      console.error('Header extension error:', error);
      toast({
        title: "Extension Failed",
        description: error instanceof Error ? error.message : "Failed to extend header",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  }, [fileToBase64, loadImage, createFallbackExtension, toast]);

  return {
    extendHeader,
    isProcessing,
    progress
  };
};