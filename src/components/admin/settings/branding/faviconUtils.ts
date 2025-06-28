
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
  const finalUrl = addCacheBuster ? `${url}?v=${Date.now()}` : url;
  
  // Remove existing favicon links
  const existingFavicons = document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]');
  existingFavicons.forEach(link => link.remove());

  // Create multiple favicon formats for better compatibility
  const faviconFormats = [
    { rel: 'icon', type: 'image/x-icon', sizes: undefined },
    { rel: 'icon', type: 'image/png', sizes: '32x32' },
    { rel: 'icon', type: 'image/png', sizes: '16x16' },
    { rel: 'apple-touch-icon', type: 'image/png', sizes: '180x180' },
    { rel: 'shortcut icon', type: 'image/x-icon', sizes: undefined }
  ];

  faviconFormats.forEach(format => {
    const link = document.createElement('link');
    link.rel = format.rel;
    link.href = finalUrl;
    if (format.type) link.type = format.type;
    if (format.sizes) link.setAttribute('sizes', format.sizes);
    document.head.appendChild(link);
  });

  // Force browser to refresh favicon by temporarily adding and removing a link
  const tempLink = document.createElement('link');
  tempLink.rel = 'icon';
  tempLink.href = 'data:,';
  document.head.appendChild(tempLink);
  setTimeout(() => {
    document.head.removeChild(tempLink);
  }, 100);
};
