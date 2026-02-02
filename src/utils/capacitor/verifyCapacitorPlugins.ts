/**
 * Verification utility for Capacitor plugins
 * Run this to confirm Camera and heic2any are properly loaded
 */

import { Camera } from '@capacitor/camera';
import heic2any from 'heic2any';
import { Capacitor } from '@capacitor/core';

export function verifyCapacitorPlugins(): {
  cameraAvailable: boolean;
  heicConverterAvailable: boolean;
  isNativePlatform: boolean;
  platform: string;
} {
  const isNativePlatform = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  const cameraAvailable = !!Camera && typeof Camera.getPhoto === 'function';
  const heicConverterAvailable = typeof heic2any === 'function';
  
  console.log('[Capacitor] Verification Results:');
  console.log('  - Camera plugin loaded:', cameraAvailable);
  console.log('  - heic2any loaded:', heicConverterAvailable);
  console.log('  - Is native platform:', isNativePlatform);
  console.log('  - Platform:', platform);
  
  return {
    cameraAvailable,
    heicConverterAvailable,
    isNativePlatform,
    platform,
  };
}

// Auto-run verification in development
if (import.meta.env.DEV) {
  verifyCapacitorPlugins();
}
