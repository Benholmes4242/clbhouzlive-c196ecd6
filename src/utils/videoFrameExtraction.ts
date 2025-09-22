// Video frame extraction utilities for swing analysis

export interface ExtractedFrame {
  index: number;
  t: number;
  url: string;
  width: number;
  height: number;
  hash: string;
}

const once = (element: HTMLElement, event: string): Promise<Event> => {
  return new Promise((resolve) => {
    const handler = (e: Event) => {
      element.removeEventListener(event, handler);
      resolve(e);
    };
    element.addEventListener(event, handler);
  });
};

export const extractFramesFromVideo = async (
  videoFile: File, 
  frameCount: number = 20
): Promise<ExtractedFrame[]> => {
  console.log(`Starting frame extraction for ${frameCount} frames...`);
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    video.onloadedmetadata = async () => {
      try {
        // Set canvas dimensions based on video
        const aspectRatio = video.videoHeight / video.videoWidth;
        canvas.width = 1280;
        canvas.height = Math.round(1280 * aspectRatio);
        
        console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}, Canvas: ${canvas.width}x${canvas.height}`);
        
        const frames: ExtractedFrame[] = [];
        const duration = video.duration;
        
        // Generate time ratios for evenly spaced frames
        const timeRatios = Array.from({ length: frameCount }, (_, i) => 
          i / (frameCount - 1)
        );
        
        for (let i = 0; i < timeRatios.length; i++) {
          const ratio = timeRatios[i];
          const targetTime = ratio * duration;
          
          video.currentTime = targetTime;
          await once(video, 'seeked');
          
          // Draw current frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          frames.push({
            index: i + 1,
            t: targetTime,
            url: dataUrl,
            width: canvas.width,
            height: canvas.height,
            hash: `frame-${i + 1}-${Date.now()}`
          });
          
          console.log(`Extracted frame ${i + 1}/${frameCount} at ${targetTime.toFixed(2)}s`);
        }
        
        console.log(`Successfully extracted ${frames.length} frames`);
        resolve(frames);
        
      } catch (error) {
        console.error('Error during frame extraction:', error);
        reject(error);
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
    
    video.onloadstart = () => {
      console.log('Video loading started...');
    };
    
    // Set video source
    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
};

export const isPlaceholderUrl = (url: string): boolean => {
  return url.includes('example.com') || url.startsWith('https://example.com');
};

export const validateFrame = async (url: string): Promise<boolean> => {
  if (isPlaceholderUrl(url)) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};