
import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import SearchResults from '@/components/search/SearchResults';
import { useSearch } from '@/hooks/useSearch';
import ExploreFilters from '@/components/explore/ExploreFilters';
import ExploreGrid from '@/components/explore/ExploreGrid';
import { ExploreContentItem } from '@/components/explore/types';
import { mockExploreContent } from '@/components/explore/mockData';

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
        <ExploreFilters 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />

        {/* Masonry Grid */}
        <ExploreGrid 
          content={filteredContent}
          onLike={handleLike}
          onFollow={handleFollow}
          isLoading={isLoading}
        />
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
