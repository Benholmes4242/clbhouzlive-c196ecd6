import { supabase } from '@/integrations/supabase/client';
import { useImageUploadSafeguard } from '@/hooks/useImageUploadSafeguard';

export interface MigrationResult {
  totalFiles: number;
  processedFiles: number;
  migratedFiles: number;
  errors: string[];
  bucketResults: Record<string, any>;
  success: boolean;
}

/**
 * Trigger migration of all images from Supabase storage to Cloudflare R2
 */
export const triggerImageMigrationToR2 = async (): Promise<MigrationResult> => {
  try {
    console.log('🚀 Starting migration of all images from Supabase to Cloudflare R2...');
    
    // Call the migration edge function
    const { data, error } = await supabase.functions.invoke('migrate-all-images-to-r2');
    
    if (error) {
      console.error('Migration error:', error);
      throw new Error(error.message);
    }
    
    const result: MigrationResult = {
      ...data,
      success: true
    };
    
    console.log('✅ Migration completed:', result);
    
    // Activate safeguards after successful migration
    useImageUploadSafeguard();
    
    return result;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      totalFiles: 0,
      processedFiles: 0,
      migratedFiles: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      bucketResults: {},
      success: false
    };
  }
};

/**
 * Get migration status and statistics
 */
export const getMigrationStatus = async () => {
  try {
    // Check for any remaining Supabase storage URLs in the database
    const checkQueries = [
      supabase.from('user_profiles').select('profile_photo_url, header_photo_url, cover_photo_url, logo_url').not('profile_photo_url', 'is', null),
      supabase.from('profile_media').select('media_url').limit(100),
      supabase.from('post_media').select('media_url').limit(100),
      supabase.from('golf_courses').select('thumbnail_image').not('thumbnail_image', 'is', null),
    ];
    
    const results = await Promise.allSettled(checkQueries);
    
    let supabaseStorageUrls = 0;
    let r2Urls = 0;
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.data) {
        result.value.data.forEach((row: any) => {
          Object.values(row).forEach((url: any) => {
            if (typeof url === 'string' && url.includes('http')) {
              if (url.includes('supabase') && url.includes('storage')) {
                supabaseStorageUrls++;
              } else if (url.includes('r2') || url.includes('cloudflare')) {
                r2Urls++;
              }
            }
          });
        });
      }
    });
    
    return {
      supabaseStorageUrls,
      r2Urls,
      migrationNeeded: supabaseStorageUrls > 0,
      migrationProgress: r2Urls / (supabaseStorageUrls + r2Urls) * 100
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      supabaseStorageUrls: 0,
      r2Urls: 0,
      migrationNeeded: false,
      migrationProgress: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};