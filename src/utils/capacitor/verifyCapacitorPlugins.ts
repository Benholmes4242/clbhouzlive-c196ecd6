/**
 * Verification utility for Capacitor plugins
 * Run this to confirm Camera, Media, and heic2any are properly loaded
 */

import { Camera } from '@capacitor/camera';
import { Media } from '@capacitor-community/media';
import heic2any from 'heic2any';
import { Capacitor } from '@capacitor/core';

export interface CapacitorVerificationResult {
  cameraAvailable: boolean;
  mediaAvailable: boolean;
  heicConverterAvailable: boolean;
  isNativePlatform: boolean;
  platform: string;
}

export async function verifyCapacitorPlugins(): Promise<CapacitorVerificationResult> {
  const isNativePlatform = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  let cameraAvailable = false;
  let mediaAvailable = false;
  let heicConverterAvailable = false;
  
  // Check Camera plugin
  try {
    await Camera.checkPermissions();
    cameraAvailable = true;
  } catch (e) {
    // Camera plugin available but may need permissions
    cameraAvailable = !!Camera && typeof Camera.getPhoto === 'function';
  }
  
  // Check Media plugin (for direct library access)
  try {
    if (isNativePlatform) {
      await Media.getAlbums();
      mediaAvailable = true;
    } else {
      // On web, just check if the plugin is imported
      mediaAvailable = !!Media && typeof Media.getMedias === 'function';
    }
  } catch (e) {
    // Media plugin may not work on web or need permissions
    mediaAvailable = !!Media && typeof Media.getMedias === 'function';
  }
  
  // Check heic2any
  try {
    heicConverterAvailable = typeof heic2any === 'function';
  } catch (e) {
    heicConverterAvailable = false;
  }
  
  if (import.meta.env.DEV) {
    console.log('[Capacitor] Verification Results:');
    console.log('  - Camera plugin loaded:', cameraAvailable);
    console.log('  - Media plugin loaded:', mediaAvailable);
    console.log('  - heic2any loaded:', heicConverterAvailable);
    console.log('  - Is native platform:', isNativePlatform);
    console.log('  - Platform:', platform);
  }
  
  return {
    cameraAvailable,
    mediaAvailable,
    heicConverterAvailable,
    isNativePlatform,
    platform,
  };
}

// Auto-run verification in development
if (import.meta.env.DEV) {
  verifyCapacitorPlugins();
}
