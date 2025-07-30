import React, { useEffect } from 'react';

interface ProfileImagePreloaderProps {
  profilePhotoUrl?: string | null;
  priority?: boolean;
}

const ProfileImagePreloader: React.FC<ProfileImagePreloaderProps> = ({ 
  profilePhotoUrl, 
  priority = true 
}) => {
  useEffect(() => {
    if (!profilePhotoUrl) return;

    // Create optimized URLs for different sizes
    const sizes = [
      { width: 256, height: 256, purpose: 'large-avatar' },
      { width: 128, height: 128, purpose: 'medium-avatar' },
      { width: 800, height: 600, purpose: 'background' }
    ];

    const preloadPromises = sizes.map(({ width, height, purpose }) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        // Add size parameters for optimization
        const optimizedUrl = new URL(profilePhotoUrl);
        optimizedUrl.searchParams.set('w', width.toString());
        optimizedUrl.searchParams.set('h', height.toString());
        optimizedUrl.searchParams.set('fit', 'cover');
        optimizedUrl.searchParams.set('q', '85'); // Good quality, smaller size
        
        img.onload = () => {
          console.log(`✓ Preloaded ${purpose} image (${width}x${height})`);
          resolve(img);
        };
        
        img.onerror = () => {
          console.warn(`✗ Failed to preload ${purpose} image`);
          reject();
        };
        
        // Set loading priority
        if (priority) {
          img.fetchPriority = 'high';
        }
        
        img.src = optimizedUrl.toString();
      });
    });

    // Preload all sizes
    Promise.allSettled(preloadPromises).then((results) => {
      const successful = results.filter(r => r.status === 'fulfilled').length;
      console.log(`Profile image preloading: ${successful}/${sizes.length} images loaded`);
    });

    // Also preload the original for fallback
    if (priority) {
      const originalImg = new Image();
      originalImg.fetchPriority = 'high';
      originalImg.src = profilePhotoUrl;
    }
  }, [profilePhotoUrl, priority]);

  return null; // This component doesn't render anything
};

export default ProfileImagePreloader;