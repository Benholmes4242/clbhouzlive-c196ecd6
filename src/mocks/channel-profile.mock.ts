// Toggle from env ONLY - disabled in production builds
// Set VITE_CHANNELS_USE_MOCKS=true in .env.local for development testing
export const isMockChannelsEnabled =
  import.meta.env.VITE_CHANNELS_USE_MOCKS === 'true';

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const n = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const banners = Array.from({ length: 6 }).map((_, i) => `/images/mocks/channels/banners/banner-0${i+1}.jpg`);
const avatars = Array.from({ length: 8 }).map((_, i) => `/images/mocks/avatars/avatar-0${i+1}.png`);

const names = [
  'Golf with Aimee','Links Life','Scratch Society','Fore Play UK',
  'Tee Time Tips','Clubhouse Stories','Drive & Thrive','UK Golf Daily'
];

export type MockChannel = {
  slug: string;
  name: string;
  avatar: string;
  banner: string;
  verified: boolean;
  subscribers: number;
  description: string;
  location?: string;
  createdAt?: string;
  links?: { label: string; url: string }[];
  videos: Array<{
    id: string;
    title: string;
    duration_seconds: number; // long form (>= 180)
    views: number;
    created_at: string;
    thumbnailUrl: string;
    courseTag?: string;
  }>;
};

export function getMockChannel(slug: string): MockChannel {
  const name = rand(names);
  const now = new Date();

  const videos = Array.from({ length: 24 }).map((_, i) => ({
    id: `v-${slug}-${i}`,
    title: rand([
      'Royal County Down – Front 9 w/ Caddie Tips',
      'Fix Your Slice (3 Drills That Actually Work)',
      '3-Club Challenge at St Andrews',
      'Breaking 80 at Royal Portrush',
      'How Rory Flights a 6-Iron (Deep Dive)'
    ]),
    duration_seconds: n(480, 3600), // 8–60 min
    views: n(5_000, 500_000),
    created_at: new Date(now.getTime() - n(2, 400) * 86400000).toISOString(),
    thumbnailUrl: `/images/mocks/thumbnails/golf-${n(1,15)}.jpg`,
    courseTag: rand(['Royal County Down','St Andrews','Royal Portrush','Turnberry','Tralee'])
  }));

  return {
    slug,
    name,
    avatar: rand(avatars),
    banner: rand(banners),
    verified: Math.random() > 0.6,
    subscribers: n(2_500, 350_000),
    description:
      'Weekly course vlogs, practice routines, and on-course strategy. New videos every Sunday.',
    location: 'United Kingdom',
    createdAt: 'Joined 2022',
    links: [
      { label: 'Website', url: '#' },
      { label: 'Instagram', url: '#' },
      { label: 'X', url: '#' }
    ],
    videos
  };
}
