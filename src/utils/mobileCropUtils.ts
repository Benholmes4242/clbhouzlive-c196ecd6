// Utility functions for mobile crop positioning

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProfileCropData {
  mobile_crop_x?: number;
  mobile_crop_y?: number;
  mobile_crop_width?: number;
  mobile_crop_height?: number;
  desktop_crop_x?: number;
  desktop_crop_y?: number;
  desktop_crop_width?: number;
  desktop_crop_height?: number;
}

/**
 * Calculate CSS object-position for mobile crop
 * Returns centered fill if no mobile crop is set
 */
export const getMobileCropPosition = (profile: ProfileCropData | null): string => {
  if (!profile) return 'center';
  
  const { mobile_crop_x, mobile_crop_y, mobile_crop_width, mobile_crop_height } = profile;
  
  // If no mobile crop is set, center the image and fill the header area (no letterboxing)
  if (
    mobile_crop_x === null || mobile_crop_x === undefined ||
    mobile_crop_y === null || mobile_crop_y === undefined ||
    mobile_crop_width === null || mobile_crop_width === undefined ||
    mobile_crop_height === null || mobile_crop_height === undefined
  ) {
    return 'center'; // Default: center and fill, crop equally from opposite edges as needed
  }
  
  // Calculate the center of the crop rectangle
  const centerX = mobile_crop_x + (mobile_crop_width / 2);
  const centerY = mobile_crop_y + (mobile_crop_height / 2);
  
  // Ensure minimum zoom so header area is always fully covered
  // Enforce bounds to prevent extreme crops
  const boundedCenterX = Math.max(10, Math.min(90, centerX));
  const boundedCenterY = Math.max(10, Math.min(90, centerY));
  
  return `${boundedCenterX}% ${boundedCenterY}%`;
};

/**
 * Calculate CSS object-position for desktop crop
 * Returns centered fit if no desktop crop is set
 */
export const getDesktopCropPosition = (profile: ProfileCropData | null): string => {
  if (!profile) return 'center';
  
  const { desktop_crop_x, desktop_crop_y, desktop_crop_width, desktop_crop_height } = profile;
  
  // If no desktop crop is set, return centered fit
  if (
    desktop_crop_x === null || desktop_crop_x === undefined ||
    desktop_crop_y === null || desktop_crop_y === undefined ||
    desktop_crop_width === null || desktop_crop_width === undefined ||
    desktop_crop_height === null || desktop_crop_height === undefined
  ) {
    return 'center';
  }
  
  // Calculate the center of the crop rectangle
  const centerX = desktop_crop_x + (desktop_crop_width / 2);
  const centerY = desktop_crop_y + (desktop_crop_height / 2);
  
  return `${centerX}% ${centerY}%`;
};

/**
 * Generate auto-derived desktop crop from centered fit
 * This is used when no desktop crop exists yet
 */
export const generateDefaultDesktopCrop = (): CropData => {
  return {
    x: 12.5, // 12.5% from left (for 16:9 to 4:3 crop)
    y: 0,    // 0% from top
    width: 75, // 75% width (crops sides for portrait)
    height: 100 // 100% height
  };
};

/**
 * Generate default mobile crop for centered fill
 * This is used when no mobile crop exists yet
 */
export const generateDefaultMobileCrop = (): CropData => {
  return {
    x: 0,    // 0% from left
    y: 12.5, // 12.5% from top (crops top/bottom for landscape)
    width: 100, // 100% width
    height: 75  // 75% height
  };
};

/**
 * Validate crop data to ensure it's within bounds
 */
export const validateCropData = (crop: CropData): boolean => {
  const { x, y, width, height } = crop;
  
  // Check bounds
  if (x < 0 || x > 100) return false;
  if (y < 0 || y > 100) return false;
  if (width <= 0 || width > 100) return false;
  if (height <= 0 || height > 100) return false;
  
  // Check if crop rectangle fits within image
  if (x + width > 100) return false;
  if (y + height > 100) return false;
  
  return true;
};

/**
 * Save mobile crop data to profile
 */
export const saveMobileCrop = async (
  userId: string, 
  cropData: CropData,
  supabase: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!validateCropData(cropData)) {
      return { success: false, error: 'Invalid crop data' };
    }
    
    const { error } = await supabase
      .from('user_profiles')
      .update({
        mobile_crop_x: cropData.x,
        mobile_crop_y: cropData.y,
        mobile_crop_width: cropData.width,
        mobile_crop_height: cropData.height,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to save mobile crop' };
  }
};

/**
 * Save desktop crop data to profile
 */
export const saveDesktopCrop = async (
  userId: string, 
  cropData: CropData,
  supabase: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!validateCropData(cropData)) {
      return { success: false, error: 'Invalid crop data' };
    }
    
    const { error } = await supabase
      .from('user_profiles')
      .update({
        desktop_crop_x: cropData.x,
        desktop_crop_y: cropData.y,
        desktop_crop_width: cropData.width,
        desktop_crop_height: cropData.height,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to save desktop crop' };
  }
};