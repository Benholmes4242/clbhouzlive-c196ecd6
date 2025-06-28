
import { ExploreContentItem } from './types';

// Enhanced mock data with more variety and engagement metrics
export const mockExploreContent: ExploreContentItem[] = [
  {
    id: '1',
    type: 'video',
    src: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=600&fit=crop',
    title: 'Perfect Drive Technique',
    duration: '2:15',
    user: { name: 'Tiger Woods', username: 'tigerwoods', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', verified: true },
    likes: 1248,
    comments: 89,
    shares: 156,
    label: 'Pro Tip',
    isFollowing: false
  },
  {
    id: '2',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop',
    title: 'Augusta National 12th Hole',
    user: { name: 'Golf Digest', username: 'golfdigest', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=40&h=40&fit=crop&crop=face', verified: true },
    likes: 892,
    comments: 45,
    shares: 78,
    label: 'Editor\'s Pick',
    isFollowing: true
  },
  {
    id: '3',
    type: 'video',
    src: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=400&h=500&fit=crop',
    title: 'Putting Masterclass',
    duration: '1:30',
    user: { name: 'Jordan Spieth', username: 'jordanspieth', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face', verified: true },
    likes: 567,
    comments: 34,
    shares: 89,
    label: 'Trending',
    isFollowing: false
  },
  {
    id: '4',
    type: 'video',
    src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=550&fit=crop',
    title: 'Viral Golf Trick Shot',
    duration: '0:45',
    user: { name: 'Golf Tricks Pro', username: 'golftricks', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face', verified: true },
    likes: 2156,
    comments: 234,
    shares: 445,
    label: 'Trending',
    isFollowing: false
  },
  {
    id: '5',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop',
    title: 'Sunrise at Pebble Beach',
    user: { name: 'Sarah Johnson', username: 'sarahgolf', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=40&h=40&fit=crop&crop=face', verified: false },
    likes: 234,
    comments: 12,
    shares: 23,
    isFollowing: false
  },
  {
    id: '6',
    type: 'video',
    src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=700&fit=crop',
    title: 'Swing Analysis Breakdown',
    duration: '3:45',
    user: { name: 'Golf Academy Pro', username: 'golfacademy', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', verified: true },  
    likes: 445,
    comments: 67,
    shares: 34,
    label: 'Pro Tip',
    isFollowing: true
  },
  {
    id: '7',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1596727362302-b8d891c42ab8?w=400&h=350&fit=crop',
    title: 'New Driver Setup',
    user: { name: 'Club Pro Mike', username: 'clubpromike', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face', verified: false },
    likes: 123,
    comments: 8,
    shares: 15,
    label: 'From Clubhouse',
    isFollowing: false
  },
  {
    id: '8',
    type: 'video',
    src: 'https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=400&h=600&fit=crop',
    title: 'Course Tour: St. Andrews',
    duration: '4:20',
    user: { name: 'Golf Travel', username: 'golftravel', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=40&h=40&fit=crop&crop=face', verified: true },
    likes: 789,
    comments: 45,
    shares: 123,
    label: 'Trending',
    isFollowing: false
  },
  {
    id: '9',
    type: 'video',
    src: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=550&fit=crop',
    title: 'Epic Golf Course Flyover',
    duration: '2:30',
    user: { name: 'Drone Golf Pro', username: 'dronegolfpro', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', verified: true },
    likes: 1567,
    comments: 89,
    shares: 234,
    label: 'Trending',
    isFollowing: false
  }
];
