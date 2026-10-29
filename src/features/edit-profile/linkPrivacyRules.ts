/** EP4 presentation mappings; persisted values remain the existing personal-profile schema. */
import type { ProfileFormData } from '@/components/profile/profile-wizard/types';
import type { VisibilityValue } from '@/components/profile/edit-v2/VisibilityDropdown';

export const PERSONAL_SOCIALS = [
  { key: 'instagramHandle', label: 'Instagram', placeholder: 'Instagram username', icon: 'instagram' },
  { key: 'twitterHandle', label: 'X', placeholder: 'X username', icon: 'twitter' },
  { key: 'tiktokHandle', label: 'TikTok', placeholder: 'TikTok username', icon: 'tiktok' },
  { key: 'youtubeHandle', label: 'YouTube', placeholder: 'YouTube channel', icon: 'youtube' },
] as const;
export const PROFILE_VISIBILITY_OPTIONS: { value: VisibilityValue; label: string }[] = [
  { value: 'public', label: 'Everyone' }, { value: 'followers', label: 'Followers & Friends' },
  { value: 'friends', label: 'Friends only' }, { value: 'private', label: 'Only me' },
];
export const HANDICAP_VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Everyone' }, { value: 'friends', label: 'Friends' }, { value: 'private', label: 'Only me' },
] as const;
export const websiteDisplay = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
export const socialsDisplay = (form: Pick<ProfileFormData, typeof PERSONAL_SOCIALS[number]['key']>) => PERSONAL_SOCIALS.filter(s => form[s.key].trim()).map(s => s.label).join(', ');
export const profileVisibilityLabel = (value: string) => PROFILE_VISIBILITY_OPTIONS.find(o => o.value === value)?.label ?? 'Everyone';
export const handicapVisibilityLabel = (value: string) => HANDICAP_VISIBILITY_OPTIONS.find(o => o.value === value)?.label ?? 'Everyone';