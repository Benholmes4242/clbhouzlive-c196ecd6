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

    // Apply Content Security Policy
    const setCSPMeta = () => {
      let meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]') as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('http-equiv', 'Content-Security-Policy');
        document.head.appendChild(meta);
      }
      meta.content = RECOMMENDED_CSP;
    };
    setCSPMeta();
    
    // Referrer Policy
    setMetaTag('referrer', 'strict-origin-when-cross-origin');
    
    // Permissions Policy - Allow camera and microphone for same-origin content
    setMetaTag('permissions-policy', 'geolocation=(), microphone=(self), camera=(self)');
    
    // X-Content-Type-Options
    setMetaTag('x-content-type-options', 'nosniff');
    
    // X-Frame-Options - Use SAMEORIGIN for Lovable compatibility
    setMetaTag('x-frame-options', 'SAMEORIGIN');
    
    // Strict Transport Security (HSTS) - note in meta for reference
    setMetaTag('security-note', 'HSTS should be configured at server level');
    
    // X-XSS-Protection (legacy but still useful)
    setMetaTag('x-xss-protection', '1; mode=block');
  }, []);

  return null;
};

// Recommended CSP for production (configure at hosting/server level)
export const RECOMMENDED_CSP = `
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net https://esm.sh;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  media-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'sameorigin';
  upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim();