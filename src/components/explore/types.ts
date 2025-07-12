
export interface ExploreContentItem {
  id: string;
  type: 'video' | 'image' | 'cta';
  src: string;
  title: string;
  likes: number;
  comments?: number;
  shares?: number;
  duration?: string;
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
  golfCourse?: {
    id: string;
    name: string;
    country: string;
  };
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
  'Videos', 
  'Hack Shack'
];
