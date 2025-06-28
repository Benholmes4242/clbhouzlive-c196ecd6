
export interface ExploreContentItem {
  id: string;
  type: 'video' | 'image' | 'cta';
  src: string;
  title: string;
  likes: number;
  user?: {
    id: string;
    name: string;
    avatar: string;
    verified?: boolean;
  };
  label?: string;
  isFollowing?: boolean;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButton?: string;
}
