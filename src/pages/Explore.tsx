
import React, { useState, useRef, useEffect } from 'react';
import { Search, Heart, MessageCircle, Share, UserPlus, Play, Plus, Filter } from 'lucide-react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import SearchResults from '@/components/search/SearchResults';
import VideoPreview from '@/components/posts/VideoPreview';
import { useSearch } from '@/hooks/useSearch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Masonry from 'react-masonry-css';

// Define proper types for different content items
interface BaseContentItem {
  id: string;
  type: string;
}

interface MediaContentItem extends BaseContentItem {
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

interface CTAContentItem extends BaseContentItem {
  type: 'cta';
  title: string;
  description: string;
}

type ExploreContentItem = MediaContentItem | CTAContentItem;

// Enhanced mock data with more variety and engagement metrics
const mockExploreContent: ExploreContentItem[] = [
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
    type: 'cta',
    title: 'Share Your Golf Moment',
    description: 'Post your best shots and connect with golfers worldwide'
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
  }
];

const filterOptions = ['All', 'Pros', 'Clubs', 'Tips', 'Trending', 'New', 'Photos', 'Videos'];

const Explore = () => {
  const { query, setQuery, results, loading } = useSearch();
  const [showResults, setShowResults] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [content, setContent] = useState<ExploreContentItem[]>(mockExploreContent);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleResultClick = () => {
    setQuery('');
    setShowResults(false);
  };

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Infinite scroll implementation
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight * 0.8) {
        if (!isLoading) {
          setIsLoading(true);
          // Simulate loading more content
          setTimeout(() => {
            setContent(prev => [...prev, ...mockExploreContent.slice(0, 4)]);
            setIsLoading(false);
          }, 1000);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  const handleLike = (contentId: string) => {
    setContent(prev => prev.map(item => {
      if (item.id === contentId && item.type !== 'cta') {
        return { ...item, likes: item.likes + 1 };
      }
      return item;
    }));
  };

  const handleFollow = (contentId: string) => {
    setContent(prev => prev.map(item => {
      if (item.id === contentId && item.type !== 'cta') {
        return { ...item, isFollowing: !item.isFollowing };
      }
      return item;
    }));
  };

  const filteredContent = content.filter(item => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Videos') return item.type === 'video';
    if (activeFilter === 'Photos') return item.type === 'image';
    if (activeFilter === 'Pros' && item.type !== 'cta') return item.user?.verified;
    if (activeFilter === 'Tips' && item.type !== 'cta') return item.label === 'Pro Tip';
    if (activeFilter === 'Trending' && item.type !== 'cta') return item.label === 'Trending';
    if (activeFilter === 'Clubs' && item.type !== 'cta') return item.label === 'From Clubhouse';
    return true;
  });

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 2
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Search Bar */}
        <div className="mb-4" ref={searchRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search members, clubs, courses, posts..."
              className="w-full pl-10 pr-4 py-3 bg-muted rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 text-base"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
            />
            {showResults && (
              <SearchResults
                results={results}
                onResultClick={handleResultClick}
                loading={loading}
                query={query}
              />
            )}
          </div>
        </div>

        {/* Sticky Filter Bar */}
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border pb-3 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {filterOptions.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap ${
                  activeFilter === filter 
                    ? 'bg-[#2a2626] text-white hover:bg-[#2a2626]/90' 
                    : 'hover:bg-muted'
                }`}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Masonry Grid */}
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex w-auto -ml-2"
          columnClassName="pl-2 bg-clip-padding"
        >
          {filteredContent.map((item) => (
            <div key={item.id} className="mb-4">
              {item.type === 'cta' ? (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-dashed border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
                  <Plus className="h-8 w-8 mx-auto mb-3 text-amber-600" />
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                  <Button size="sm" className="bg-[#2a2626] text-white hover:bg-[#2a2626]/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                </div>
              ) : (
                <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow">
                  {/* Content */}
                  <div className="relative">
                    {item.type === 'video' ? (
                      <div className="relative">
                        <VideoPreview
                          src={item.src}
                          videoId={item.id}
                          className="w-full"
                        />
                        {item.duration && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {item.duration}
                          </div>
                        )}
                      </div>
                    ) : (
                      <img
                        src={item.src}
                        alt={item.title}
                        className="w-full object-cover"
                        loading="lazy"
                      />
                    )}
                    
                    {/* Label Badge */}
                    {item.label && (
                      <div className="absolute top-2 left-2">
                        <Badge 
                          variant={item.label === 'Pro Tip' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.label}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* User Info & Actions */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <img
                          src={item.user.avatar}
                          alt={item.user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center space-x-1">
                            <p className="text-sm font-medium">{item.user.name}</p>
                            {item.user.verified && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">@{item.user.username}</p>
                        </div>
                      </div>
                      
                      {!item.isFollowing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFollow(item.id)}
                          className="h-7 px-3 text-xs"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Follow
                        </Button>
                      )}
                    </div>

                    {/* Engagement Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLike(item.id)}
                          className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                        >
                          <Heart className="h-4 w-4" />
                          <span className="text-sm">{item.likes.toLocaleString()}</span>
                        </button>
                        
                        <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-sm">{item.comments}</span>
                        </button>
                        
                        <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                          <Share className="h-4 w-4" />
                          <span className="text-sm">{item.shares}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Masonry>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2a2626] border-t-transparent"></div>
          </div>
        )}
      </main>
      
      <BottomNavigation />

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Explore;
