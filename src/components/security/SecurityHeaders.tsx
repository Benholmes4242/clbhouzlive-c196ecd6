import { useEffect } from 'react';

// Security headers configuration for the application
export const SecurityHeaders = () => {
  useEffect(() => {
    // Set security headers via meta tags where possible
    // Note: These are best configured at the hosting/server level
    const setMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Content Security Policy recommendations
    setMetaTag('security-policy', 'Content Security Policy should be configured at server level');
    
    // Referrer Policy
    setMetaTag('referrer', 'strict-origin-when-cross-origin');
    
    // Permissions Policy - Allow camera and microphone for same-origin content
    setMetaTag('permissions-policy', 'geolocation=(), microphone=(self), camera=(self)');
    
    // X-Content-Type-Options
    setMetaTag('x-content-type-options', 'nosniff');
    
    // X-Frame-Options
    setMetaTag('x-frame-options', 'DENY');
  }, []);

  return null;
};

// Recommended CSP for production (configure at hosting level)
export const RECOMMENDED_CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://esm.sh;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  media-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim();