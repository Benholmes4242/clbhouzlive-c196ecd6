import { VideoItem, ChannelLite } from '../types';

// Mock data generator for development/testing
export const mockVideos: VideoItem[] = [
  {
    id: '1',
    title: 'Breaking Down Tiger Woods Perfect Swing in 4K - Every Detail Explained',
    poster: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationSec: 847,
    views: 124500,
    timeAgo: '2 days ago',
    user: { id: 'u1', name: 'Michael Campbell', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80', verified: true },
    echoes: 82,
    tag: 'Tips',
    course: 'Augusta National',
  },
  {
    id: '2',
    title: 'Royal Birkdale Full Round - Championship Course Walkthrough',
    poster: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80',
    durationSec: 1243,
    views: 67200,
    timeAgo: '5 days ago',
    user: { id: 'u2', name: 'Sarah Mitchell', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', verified: true },
    echoes: 45,
    tag: 'Course Vlog',
    course: 'Royal Birkdale',
  },
  {
    id: '3',
    title: 'The Most Embarrassing Golf Moments Caught on Camera',
    poster: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&q=80',
    durationSec: 423,
    views: 234100,
    timeAgo: '1 week ago',
    user: { id: 'u3', name: 'Tom Harris', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80' },
    echoes: 156,
    tag: 'Funny',
  },
  {
    id: '4',
    title: 'Driver Fitting Secrets - How to Add 20 Yards to Your Drive',
    poster: 'https://images.unsplash.com/photo-1561119997-3e2e7cf4c9b7?w=800&q=80',
    durationSec: 654,
    views: 89300,
    timeAgo: '3 days ago',
    user: { id: 'u1', name: 'Michael Campbell', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80', verified: true },
    echoes: 67,
    tag: 'Gear',
  },
  {
    id: '5',
    title: 'PGA Championship Highlights - Final Round Drama',
    poster: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80',
    durationSec: 912,
    views: 456700,
    timeAgo: '2 weeks ago',
    user: { id: 'u4', name: 'Golf Digest', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80', verified: true },
    echoes: 289,
    tag: 'Highlights',
    course: 'Kiawah Island',
  },
  {
    id: '6',
    title: 'St Andrews Old Course - A Golfer\'s Pilgrimage',
    poster: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
    durationSec: 1456,
    views: 123400,
    timeAgo: '4 days ago',
    user: { id: 'u2', name: 'Sarah Mitchell', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', verified: true },
    echoes: 91,
    tag: 'Course Vlog',
    course: 'St Andrews',
  },
];

export const mockChannels: ChannelLite[] = [
  { id: 'c1', name: 'Michael Campbell', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80', verified: true, subscribed: false },
  { id: 'c2', name: 'Sarah Mitchell', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', verified: true, subscribed: true },
  { id: 'c3', name: 'Golf Digest', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80', verified: true, subscribed: false },
  { id: 'c4', name: 'Tom Harris', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', verified: false, subscribed: false },
];

export function generateMockFeed(count: number = 20) {
  const items: any[] = [];
  let videoIndex = 0;
  
  for (let i = 0; i < count; i++) {
    const patternIndex = i % 8;
    
    if (patternIndex === 0) {
      // Wide card
      items.push({
        type: 'wide',
        video: { ...mockVideos[videoIndex % mockVideos.length], id: `vid-${i}` }
      });
      videoIndex++;
    } else if (patternIndex === 1) {
      // Pair of cards
      items.push({
        type: 'pair',
        videos: [
          { ...mockVideos[videoIndex % mockVideos.length], id: `vid-${i}-a` },
          { ...mockVideos[(videoIndex + 1) % mockVideos.length], id: `vid-${i}-b` }
        ]
      });
      videoIndex += 2;
    } else if (patternIndex === 5) {
      // Suggested channels
      items.push({
        type: 'channels',
        channels: mockChannels
      });
    } else if (patternIndex === 7) {
      // Shorts carousel
      items.push({
        type: 'shorts',
        videos: mockVideos.slice(0, 4).map((v, idx) => ({ ...v, id: `short-${i}-${idx}` }))
      });
    } else {
      // Wide card (default)
      items.push({
        type: 'wide',
        video: { ...mockVideos[videoIndex % mockVideos.length], id: `vid-${i}` }
      });
      videoIndex++;
    }
  }
  
  return items;
}
