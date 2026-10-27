/** Shared About/Visiting social URL construction; do not invent platforms or handles. */
import type React from 'react';
import { SiInstagram, SiX, SiFacebook, SiTiktok, SiYoutube } from 'react-icons/si';
import type { BusinessProfile } from '@/hooks/useBusinessProfile';

export function ensureProtocol(url: string): string {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export const SOCIAL_CONFIG: {
  key: keyof NonNullable<BusinessProfile['social_links']>;
  Icon: React.ElementType;
  label: string;
  buildUrl: (value: string) => string;
}[] = [
  { key: 'instagram', Icon: SiInstagram, label: 'Instagram', buildUrl: (h) => `https://instagram.com/${h.replace(/^@/, '')}` },
  { key: 'twitter', Icon: SiX, label: 'X', buildUrl: (h) => `https://x.com/${h.replace(/^@/, '')}` },
  { key: 'facebook', Icon: SiFacebook, label: 'Facebook', buildUrl: ensureProtocol },
  { key: 'tiktok', Icon: SiTiktok, label: 'TikTok', buildUrl: (h) => `https://tiktok.com/@${h.replace(/^@/, '')}` },
  { key: 'youtube', Icon: SiYoutube, label: 'YouTube', buildUrl: ensureProtocol },
];