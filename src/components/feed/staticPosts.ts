
import { VideoPost } from './types';

export const staticPosts: VideoPost[] = [
  {
    id: '1',
    type: 'post',
    user: {
      name: 'Tiger Woods',
      username: '@tigerwoods',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      verified: true,
    },
    content: {
      type: 'video',
      description: 'Perfect your putting technique with this simple drill 🏌️‍♂️',
      thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600&h=400&fit=crop',
      duration: '2:45',
    },
    stats: {
      likes: 12500,
      comments: 450,
      shares: 230,
    },
    timeAgo: '2h',
  },
  {
    id: '2',
    type: 'post',
    user: {
      name: 'Golf Digest',
      username: '@golfdigest',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      verified: true,
    },
    content: {
      type: 'image',
      description: 'Stunning sunrise at Augusta National 🌅 The course is looking magnificent for the upcoming tournament!',
      image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop',
    },
    stats: {
      likes: 8900,
      comments: 230,
      shares: 156,
    },
    timeAgo: '4h',
  },
];
