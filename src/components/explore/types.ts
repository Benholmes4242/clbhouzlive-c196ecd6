
export interface ExploreContentItem {
  id: string;
  type: 'video' | 'image' | 'cta';
  src: string;
  title: string;
  likes: number;
  user?: {
    id: string;
    name: string;
    username?: string;
    avatar: string;
    verified?: boolean;
  };
  label?: string;
  isFollowing?: boolean;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButton?: string;
}

export interface CTAContentItem {
  id: string;
  type: 'cta';
  title: string;
  description: string;
  src: string;
  likes: number;
}

export const filterOptions = [
  'All',
  'Videos', 
  'Photos',
  'Pros',
  'Tips',
  'Trending',
  'Clubs'
];
