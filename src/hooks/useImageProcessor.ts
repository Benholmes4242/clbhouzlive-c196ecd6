// Web Worker for heavy image processing operations
class ImageProcessorWorker {
  private worker: Worker | null = null;

  constructor() {
    if (typeof Worker !== 'undefined') {
      // Create inline worker for image processing
      const workerScript = `
        self.onmessage = function(e) {
          const { type, data } = e.data;
          
          switch (type) {
            case 'compressImage':
              compressImage(data).then(result => {
                self.postMessage({ type: 'compressed', data: result });
              });
              break;
              
            case 'generateBlur':
              const blurData = generateBlurPlaceholder(data);
              self.postMessage({ type: 'blurred', data: blurData });
              break;
          }
        };
        
        async function compressImage({ imageData, quality = 0.8, maxWidth = 1200 }) {
          return new Promise((resolve) => {
            const canvas = new OffscreenCanvas(maxWidth, maxWidth);
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            img.onload = () => {
              const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
              const width = img.width * ratio;
              const height = img.height * ratio;
              
              canvas.width = width;
              canvas.height = height;
              
              ctx.drawImage(img, 0, 0, width, height);
              
              canvas.convertToBlob({ type: 'image/webp', quality }).then(blob => {
                resolve({ blob, width, height });
              });
            };
            img.src = imageData;
          });
        }
        
        function generateBlurPlaceholder({ width = 10, height = 10 }) {
          const canvas = new OffscreenCanvas(width, height);
          const ctx = canvas.getContext('2d');
          
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, '#f3f4f6');
          gradient.addColorStop(1, '#e5e7eb');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
          
          return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.1 });
        }
      `;
      
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
    }
  }

  compressImage(imageData: string, quality = 0.8, maxWidth = 1200): Promise<{ blob: Blob; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Web Workers not supported'));
        return;
      }

      const handleMessage = (e: MessageEvent) => {
        if (e.data.type === 'compressed') {
          this.worker?.removeEventListener('message', handleMessage);
          resolve(e.data.data);
        }
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.postMessage({
        type: 'compressImage',
        data: { imageData, quality, maxWidth }
      });
    });
  }

  generateBlurPlaceholder(width = 10, height = 10): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Web Workers not supported'));
        return;
      }

      const handleMessage = (e: MessageEvent) => {
        if (e.data.type === 'blurred') {
          this.worker?.removeEventListener('message', handleMessage);
          resolve(e.data.data);
        }
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.postMessage({
        type: 'generateBlur',
        data: { width, height }
      });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
let imageProcessor: ImageProcessorWorker | null = null;

export const useImageProcessor = () => {
  if (!imageProcessor) {
    imageProcessor = new ImageProcessorWorker();
  }

  // Cleanup on unmount
  const cleanup = () => {
    if (imageProcessor) {
      imageProcessor.terminate();
      imageProcessor = null;
    }
  };

  return {
    compressImage: imageProcessor.compressImage.bind(imageProcessor),
    generateBlurPlaceholder: imageProcessor.generateBlurPlaceholder.bind(imageProcessor),
    cleanup
  };
};