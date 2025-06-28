
// Define proper types for different content items
export interface BaseContentItem {
  id: string;
  type: string;
}

export interface MediaContentItem extends BaseContentItem {
  type: 'video' | 'image';
  src: string;
  title: string;
  duration?: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  likes: number;
  comments: number;
  shares: number;
  label?: string;
  isFollowing: boolean;
}

export type ExploreContentItem = MediaContentItem;

export const filterOptions = ['Trending', 'Pros', 'Tips', 'Videos', 'Photos'];
