import { uploadToCloudflareR2 } from '@/utils/cloudflareUpload';
import { uploadAchievementBadge } from '@/utils/achievementBadgeUpload';

interface BadgeImage {
  localPath: string;
  fileName: string;
  description: string;
}

const ACHIEVEMENT_BADGES: BadgeImage[] = [
  { localPath: '/lovable-uploads/a33df9b4-0089-43ca-913d-132fc5b11cc3.png', fileName: '20-club-badge.png', description: '20 Club Badge' },
  { localPath: '/lovable-uploads/c1ba04e8-7aed-40e6-948b-0b65fdc932b2.png', fileName: '50-club-badge.png', description: '50 Club Badge' },
  { localPath: '/lovable-uploads/91e26115-098d-4b21-9b29-7e1800fe52bd.png', fileName: '100-club-badge.png', description: '100 Club Badge' },
  { localPath: '/lovable-uploads/04ae4807-845e-412c-9233-d90ed7ed0a9e.png', fileName: '200-club-badge.png', description: '200 Club Badge' },
  { localPath: '/lovable-uploads/bc2bb48a-2505-442f-8d02-2623c7b391ad.png', fileName: '300-club-badge.png', description: '300 Club Badge' },
  { localPath: '/lovable-uploads/24422ab1-3322-4f51-801b-8ae8e80c95d7.png', fileName: 'eu-explorer-badge.png', description: 'EU Explorer Badge' },
  { localPath: '/lovable-uploads/54fecf12-83df-48be-b433-d227be70278d.png', fileName: 'uk-ireland-explorer-badge.png', description: 'UK Ireland Explorer Badge' },
  { localPath: '/lovable-uploads/ad7f9c0b-b395-4b96-b059-63ebab11bd4f.png', fileName: 'usa-explorer-badge.png', description: 'USA Explorer Badge' },
  { localPath: '/lovable-uploads/5b02f0bf-9891-4439-971c-4d3cb7a37355.png', fileName: 'world-explorer-badge.png', description: 'World Explorer Badge' },
  { localPath: '/lovable-uploads/393019eb-611a-4e4e-8661-9fac00b24ecc.png', fileName: 'gb-ireland-flag.png', description: 'GB Ireland Flag' },
  { localPath: '/lovable-uploads/eba4c2ff-fb9a-4720-aadf-b892ce5f66ef.png', fileName: 'europe-flag.png', description: 'Europe Flag' },
];

export const migrateAchievementBadgesToR2 = async (): Promise<Record<string, string>> => {
  const urlMappings: Record<string, string> = {};
  const uploadPromises = ACHIEVEMENT_BADGES.map(async (badge) => {
    try {
      // Fetch the local image
      const response = await fetch(badge.localPath);
      if (!response.ok) {
        console.warn(`Failed to fetch ${badge.localPath}`);
        return;
      }
      
      const blob = await response.blob();
      const file = new File([blob], badge.fileName, { type: 'image/png' });
      
      // Upload to R2
      const result = await uploadToCloudflareR2(file, 'clbhouz-club-logos', badge.fileName);
      
      if (result.success && result.publicUrl) {
        urlMappings[badge.localPath] = result.publicUrl;
        console.log(`Uploaded ${badge.description}: ${result.publicUrl}`);
      } else {
        console.error(`Failed to upload ${badge.description}:`, result.error);
      }
    } catch (error) {
      console.error(`Error uploading ${badge.description}:`, error);
    }
  });
  
  await Promise.all(uploadPromises);
  return urlMappings;
};

// R2 URLs for achievement badges (will be populated after migration)
export const ACHIEVEMENT_BADGE_R2_URLS = {
  '20-club': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/clbhouz-club-logos/20-club-badge.png',
  '50-club': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/clbhouz-club-logos/50-club-badge.png',
  '100-club': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/clbhouz-club-logos/100-club-badge.png',
  '200-club': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/clbhouz-club-logos/200-club-badge.png',
  '300-club': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/clbhouz-club-logos/300-club-badge.png',
  'eu-explorer': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/clbhouz-club-logos/eu-explorer-badge.png',
  'uk-ireland-explorer': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/clbhouz-club-logos/uk-ireland-explorer-badge.png',
  'usa-explorer': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/clbhouz-club-logos/usa-explorer-badge.png',
  'world-explorer': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/clbhouz-club-logos/world-explorer-badge.png',
  'gb-ireland-flag': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/clbhouz-club-logos/gb-ireland-flag.png',
  'europe-flag': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/clbhouz-club-logos/europe-flag.png',
};