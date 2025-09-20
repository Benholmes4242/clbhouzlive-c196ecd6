import { useState, useEffect } from 'react';

export interface CreatorHighlight {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  heroImage: string;
  followerGrowth: number; // percentage growth
  followerCount: number;
  verified?: boolean;
  specialties: string[];
}

// Mock API call for creator highlights
const mockFetchCreatorHighlights = async (): Promise<CreatorHighlight[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  return [
    {
      id: 'creator-1',
      name: 'Tiger Woods',
      username: 'tigerwoods',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      heroImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=250&fit=crop',
      followerGrowth: 15.4,
      followerCount: 2400000,
      verified: true,
      specialties: ['Pro Tips', 'Tournament']
    },
    {
      id: 'creator-2',
      name: 'Michelle Wie',
      username: 'michellewie',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b634?w=150&h=150&fit=crop&crop=face',
      heroImage: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=250&fit=crop',
      followerGrowth: 23.1,
      followerCount: 850000,
      verified: true,
      specialties: ['Women\'s Golf', 'Inspiration']
    },
    {
      id: 'creator-3',
      name: 'Golf Galaxy Pro',
      username: 'golfgalaxypro',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      heroImage: 'https://images.unsplash.com/photo-1596727216035-ba33a8ddaa38?w=400&h=250&fit=crop',
      followerGrowth: 42.8,
      followerCount: 127000,
      verified: false,
      specialties: ['Equipment', 'Reviews']
    },
    {
      id: 'creator-4',
      name: 'Sarah Chen',
      username: 'sarahchengolf',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      heroImage: 'https://images.unsplash.com/photo-1587174486073-ae5e5cec4ae1?w=400&h=250&fit=crop',
      followerGrowth: 18.6,
      followerCount: 95000,
      verified: false,
      specialties: ['Beginner Tips', 'Course Reviews']
    },
    {
      id: 'creator-5',
      name: 'Golf Digest',
      username: 'golfdigest',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
      heroImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=250&fit=crop',
      followerGrowth: 8.2,
      followerCount: 1800000,
      verified: true,
      specialties: ['News', 'Analysis']
    }
  ];
};

export function useCreatorHighlights() {
  const [highlights, setHighlights] = useState<CreatorHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setLoading(true);
        const creatorHighlights = await mockFetchCreatorHighlights();
        // Shuffle and take a random selection
        const shuffled = [...creatorHighlights].sort(() => Math.random() - 0.5);
        setHighlights(shuffled);
      } catch (error) {
        console.error('Failed to fetch creator highlights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, []);

  return {
    highlights,
    loading
  };
}