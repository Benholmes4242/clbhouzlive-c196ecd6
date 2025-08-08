import { uploadAchievementBadge } from '@/utils/achievementBadgeUpload';

/**
 * IMPORTANT: All achievement badges MUST be uploaded to Cloudflare R2
 * 
 * This guide explains how to properly handle achievement badge uploads:
 * 
 * 1. Use the uploadAchievementBadge function for single badge uploads
 * 2. Store badges in the 'logos' bucket in R2
 * 3. Never store achievement badges in:
 *    - Local public/lovable-uploads folder
 *    - Supabase storage buckets
 *    - Any other location
 * 
 * Usage Examples:
 * 
 * Single badge upload:
 * ```typescript
 * const result = await uploadAchievementBadge(file, 'Century Club');
 * if (result.success) {
 *   console.log('Badge URL:', result.publicUrl);
 * }
 * ```
 * 
 * Multiple badge upload:
 * ```typescript
 * const badges = [
 *   { file: badge1File, name: '20 Club' },
 *   { file: badge2File, name: '50 Club' }
 * ];
 * const results = await uploadMultipleAchievementBadges(badges);
 * ```
 * 
 * When creating new achievement types:
 * 1. Upload the badge image using uploadAchievementBadge
 * 2. Add the R2 URL to the appropriate component mappings
 * 3. Never use local file paths
 * 
 * URL Structure:
 * All achievement badges follow this pattern:
 * https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/{badge-name}-badge.{ext}
 */

export const ACHIEVEMENT_BADGE_GUIDELINES = {
  storage: 'Cloudflare R2 only',
  bucket: 'logos',
  urlPattern: 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/{name}-badge.{ext}',
  forbidden: [
    'public/lovable-uploads/',
    'Supabase storage',
    'Local file system'
  ]
} as const;