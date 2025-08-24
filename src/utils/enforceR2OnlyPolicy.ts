/**
 * Global policy enforcement to ensure all image uploads go to Cloudflare R2
 * This file should be imported at the app level to prevent any Supabase storage usage
 */
import { uploadToR2Only } from './r2OnlyUpload';

// Override console methods to warn about Supabase storage usage
const originalError = console.error;
const originalWarn = console.warn;

export const enforceR2GlobalPolicy = () => {
  // Intercept any potential Supabase storage calls
  if (typeof window !== 'undefined') {
    // Block any direct storage API calls
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Block Supabase storage uploads
      if (url.includes('/storage/v1/object') && init?.method === 'POST') {
        console.error('🚫 BLOCKED: Direct Supabase storage upload. Use uploadToR2Only() instead.');
        throw new Error('Supabase storage uploads are not allowed. Use uploadToR2Only() instead.');
      }
      
      return originalFetch(input, init);
    };
    
    console.log('🔒 R2-Only Policy Enforced: All image uploads must use Cloudflare R2');
  }
};

// Auto-enforce when imported
enforceR2GlobalPolicy();

export { uploadToR2Only };