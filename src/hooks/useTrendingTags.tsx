import { useState, useEffect } from 'react';

export interface TrendingTag {
  tag: string;
  uses: number;
}

// Mock API call for trending tags
const mockFetchTrendingTags = async (): Promise<TrendingTag[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return [
    { tag: 'Birdie', uses: 1247 },
    { tag: 'ChipShot', uses: 892 },
    { tag: 'EagleWatch', uses: 634 },
    { tag: 'GolfLife', uses: 2156 },
    { tag: 'ProTips', uses: 445 },
    { tag: 'CourseReview', uses: 783 },
    { tag: 'Weekend', uses: 1534 },
    { tag: 'PuttPutt', uses: 321 },
    { tag: 'Sunset', uses: 987 },
    { tag: 'TournamentDay', uses: 567 },
    { tag: 'Practice', uses: 834 },
    { tag: 'NewClubs', uses: 267 },
    { tag: 'BeautifulCourse', uses: 445 },
    { tag: 'Hole19', uses: 189 },
    { tag: 'GolfBuddy', uses: 312 }
  ];
};

export function useTrendingTags() {
  const [tags, setTags] = useState<TrendingTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const trendingTags = await mockFetchTrendingTags();
        // Sort by usage and take top 15
        const sortedTags = trendingTags
          .sort((a, b) => b.uses - a.uses)
          .slice(0, 15);
        setTags(sortedTags);
      } catch (error) {
        console.error('Failed to fetch trending tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearTags = () => {
    setSelectedTags([]);
  };

  return {
    tags,
    loading,
    selectedTags,
    toggleTag,
    clearTags
  };
}