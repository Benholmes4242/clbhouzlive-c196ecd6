
export const updateTitleMeta = (title: string) => {
  console.log('Updating title meta to:', title);
  // Update the title meta tag in the head
  const titleElement = document.querySelector('title');
  if (titleElement) {
    titleElement.textContent = title;
  }
  
  // Also update meta title for SEO
  let metaTitleElement = document.querySelector('meta[property="og:title"]');
  if (!metaTitleElement) {
    metaTitleElement = document.createElement('meta');
    metaTitleElement.setAttribute('property', 'og:title');
    document.head.appendChild(metaTitleElement);
  }
  metaTitleElement.setAttribute('content', title);
};

export const updateFaviconInHead = (url: string, addCacheBuster = false) => {
  console.log('Updating favicon to:', url);
  
  // Add cache busting parameter to force refresh
  const finalUrl = addCacheBuster ? `${url}?v=${Date.now()}&cb=${Math.random()}` : url;
  
  // Remove ALL existing favicon and icon links
  const existingLinks = document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]');
  existingLinks.forEach(link => {
    console.log('Removing existing favicon link:', link.getAttribute('href'));
    link.remove();
  });

  // Wait a moment before adding new ones to ensure removal is complete
  setTimeout(() => {
    // Create comprehensive favicon formats for maximum compatibility
    const faviconFormats = [
      { rel: 'icon', type: 'image/x-icon', sizes: undefined },
      { rel: 'icon', type: 'image/png', sizes: '16x16' },
      { rel: 'icon', type: 'image/png', sizes: '32x32' },
      { rel: 'icon', type: 'image/png', sizes: '96x96' },
      { rel: 'apple-touch-icon', type: 'image/png', sizes: '180x180' },
      { rel: 'apple-touch-icon', type: 'image/png', sizes: '152x152' },
      { rel: 'apple-touch-icon', type: 'image/png', sizes: '144x144' },
      { rel: 'shortcut icon', type: 'image/x-icon', sizes: undefined }
    ];

    faviconFormats.forEach((format, index) => {
      setTimeout(() => {
        const link = document.createElement('link');
        link.rel = format.rel;
        link.href = finalUrl;
        if (format.type) link.type = format.type;
        if (format.sizes) link.setAttribute('sizes', format.sizes);
        
        // Add to head
        document.head.appendChild(link);
        console.log(`Added favicon link ${index + 1}:`, format.rel, format.sizes || 'default');
      }, index * 50); // Stagger the additions slightly
    });

    // Force browser refresh with multiple techniques
    setTimeout(() => {
      // Method 1: Temporary empty favicon
      const tempLink = document.createElement('link');
      tempLink.rel = 'icon';
      tempLink.href = 'data:image/x-icon;base64,';
      document.head.appendChild(tempLink);
      
      setTimeout(() => {
        document.head.removeChild(tempLink);
        
        // Method 2: Force a page refresh indication to browser
        const refreshLink = document.createElement('link');
        refreshLink.rel = 'icon';
        refreshLink.href = finalUrl;
        refreshLink.type = 'image/png';
        document.head.appendChild(refreshLink);
        
        console.log('Favicon update complete with cache busting');
      }, 200);
    }, 500);
  }, 100);
};

// Function to verify favicon is loaded
export const verifyFaviconLoaded = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      console.log('Favicon verified as loadable:', url);
      resolve(true);
    };
    img.onerror = () => {
      console.log('Favicon failed to load:', url);
      resolve(false);
    };
    img.src = url;
  });
};
