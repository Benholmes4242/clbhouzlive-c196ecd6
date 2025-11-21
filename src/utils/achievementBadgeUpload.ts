import { uploadToCloudflareR2, CloudflareUploadResult } from '@/utils/cloudflareUpload';

/**
 * Upload achievement badge images to Cloudflare R2
 * All achievement badges should be stored in R2, not local storage or Supabase
 */
export const uploadAchievementBadge = async (
  file: File,
  badgeName: string
): Promise<CloudflareUploadResult> => {
  try {
    // Sanitize badge name for filename
    const sanitizedName = badgeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const fileName = `${sanitizedName}-badge.${file.name.split('.').pop()}`;
    
    // Upload to R2 club logos bucket (where all achievement badges are stored)
    const result = await uploadToCloudflareR2(file, 'clbhouz-club-logos', fileName);
    
    if (result.success) {
      console.log(`Achievement badge uploaded successfully: ${result.publicUrl}`);
    } else {
      console.error(`Failed to upload achievement badge: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error uploading achievement badge:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Batch upload multiple achievement badges to R2
 */
export const uploadMultipleAchievementBadges = async (
  badges: Array<{ file: File; name: string }>
): Promise<Array<{ name: string; result: CloudflareUploadResult }>> => {
  const uploadPromises = badges.map(async (badge) => ({
    name: badge.name,
    result: await uploadAchievementBadge(badge.file, badge.name)
  }));
  
  return Promise.all(uploadPromises);
};

/**
 * Get the R2 URL pattern for achievement badges
 * All achievement badges follow this URL structure
 */
export const getAchievementBadgeUrl = (fileName: string): string => {
  const baseUrl = 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/clbhouz-club-logos';
  return `${baseUrl}/${fileName}`;
};

/**
 * Generate consistent filenames for achievement badges
 */
export const generateAchievementBadgeFileName = (badgeName: string, fileExtension: string = 'png'): string => {
  const sanitizedName = badgeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${sanitizedName}-badge.${fileExtension}`;
};