import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.74d6ba70bf1d4665bd9aaff281e4c1df',
  appName: 'clbhouzlive',
  webDir: 'dist',
  server: {
    url: 'https://74d6ba70-bf1d-4665-bd9a-aff281e4c1df.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    Camera: {
      // iOS requires photo library permissions
      presentationStyle: 'fullScreen',
    },
  },
};

export default config;
