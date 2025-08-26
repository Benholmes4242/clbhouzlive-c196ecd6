// Global performance optimizations to be applied across the entire application

// Optimize React rendering
import { StrictMode } from 'react';

// Disable React DevTools in production
if (process.env.NODE_ENV === 'production') {
  if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = () => {};
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = () => {};
  }
}

// Ultra-fast DOM updates
export const scheduleUltraFastUpdate = (callback: () => void) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 16 });
  } else {
    requestAnimationFrame(callback);
  }
};

// Optimize images on load
export const optimizeImageOnLoad = (img: HTMLImageElement) => {
  img.loading = 'lazy';
  img.decoding = 'async';
  
  // Add ultra-fast intersection observer for images
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        // Trigger image optimization
        if (img.src && !img.complete) {
          img.style.transition = 'opacity 0.2s ease-in-out';
          img.style.opacity = '0';
          img.onload = () => {
            img.style.opacity = '1';
          };
        }
        observer.disconnect();
      }
    },
    { rootMargin: '50px' }
  );
  
  observer.observe(img);
};

// Ultra-fast video optimization
export const optimizeVideoOnLoad = (video: HTMLVideoElement) => {
  video.preload = 'none';
  video.playsInline = true;
  
  // Only load when in view
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        video.preload = 'metadata';
        observer.disconnect();
      }
    },
    { rootMargin: '100px' }
  );
  
  observer.observe(video);
};

// Resource hints for critical resources
export const addResourceHints = () => {
  const head = document.head;
  
  // DNS prefetch for external domains
  const dnsHints = [
    'https://media.clbhouz.co.uk',
    'https://ybxkehyomcakqjvuhnna.supabase.co',
    'https://customer-4ah4gni80ytefpck.cloudflarestream.com'
  ];
  
  dnsHints.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    head.appendChild(link);
  });
  
  // Preconnect to critical origins
  const preconnectHints = [
    'https://media.clbhouz.co.uk',
    'https://ybxkehyomcakqjvuhnna.supabase.co'
  ];
  
  preconnectHints.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    head.appendChild(link);
  });
};

// Initialize all global optimizations
export const initializeGlobalOptimizations = () => {
  // Add resource hints
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addResourceHints);
  } else {
    addResourceHints();
  }
  
  // Optimize images globally
  const optimizeAllImages = () => {
    document.querySelectorAll('img').forEach(optimizeImageOnLoad);
  };
  
  // Optimize videos globally
  const optimizeAllVideos = () => {
    document.querySelectorAll('video').forEach(optimizeVideoOnLoad);
  };
  
  // Run optimizations
  scheduleUltraFastUpdate(() => {
    optimizeAllImages();
    optimizeAllVideos();
  });
  
  // Re-optimize on new content
  const observer = new MutationObserver(() => {
    scheduleUltraFastUpdate(() => {
      optimizeAllImages();
      optimizeAllVideos();
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Cleanup function
  return () => {
    observer.disconnect();
  };
};

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeGlobalOptimizations();
}