import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration
 * 
 * IMPORTANT: For production/TestFlight builds, do NOT include server.url
 * The server.url is ONLY for development hot-reload and causes the app
 * to detect as "web" instead of "ios", breaking all native features.
 * 
 * Development with hot-reload:
 *   Uncomment the server block below, then run: npx cap sync ios
 * 
 * Production/TestFlight builds:
 *   Keep server block commented out, then run: npm run build && npx cap sync ios
 */

const config: CapacitorConfig = {
  appId: 'app.lovable.74d6ba70bf1d4665bd9aaff281e4c1df',
  appName: 'clbhouzlive',
  webDir: 'dist',
  
  // COMMENTED OUT FOR PRODUCTION - Uncomment for development hot-reload only
  // server: {
  //   url: 'https://74d6ba70-bf1d-4665-bd9a-aff281e4c1df.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  
  plugins: {
    Camera: {
      presentationStyle: 'fullScreen',
    },
  },
};

export default config;
