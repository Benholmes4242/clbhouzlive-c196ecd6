
import React, { useState, useRef, useEffect } from 'react';
import { Search, Play } from 'lucide-react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import SearchResults from '@/components/search/SearchResults';
import { useSearch } from '@/hooks/useSearch';

// Mock data for golf content with more items
const mockGolfContent = [
  { id: '1', type: 'video', src: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=400&fit=crop', title: 'Perfect Drive Technique', duration: '2:15' },
  { id: '2', type: 'image', src: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop', title: 'Augusta National' },
  { id: '3', type: 'video', src: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=400&h=400&fit=crop', title: 'Putting Tips', duration: '1:30' },
  { id: '4', type: 'image', src: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop', title: 'Golf Course Sunrise' },
  { id: '5', type: 'video', src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', title: 'Swing Analysis', duration: '3:45' },
  { id: '6', type: 'image', src: 'https://images.unsplash.com/photo-1596727362302-b8d891c42ab8?w=400&h=400&fit=crop', title: 'Golf Equipment' },
  { id: '7', type: 'video', src: 'https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=400&h=400&fit=crop', title: 'Course Tour', duration: '4:20' },
  { id: '8', type: 'image', src: 'https://images.unsplash.com/photo-1556909114-6c3bd9b1b689?w=400&h=400&fit=crop', title: 'Golf Ball Detail' },
  { id: '9', type: 'video', src: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=400&h=400&fit=crop', title: 'Chip Shot Master', duration: '2:05' },
  { id: '10', type: 'image', src: 'https://images.unsplash.com/photo-1626947486515-b2ba1bb53365?w=400&h=400&fit=crop', title: 'Golfer Silhouette' },
  { id: '11', type: 'video', src: 'https://images.unsplash.com/photo-1574767653875-3ed9ed8efe43?w=400&h=400&fit=crop', title: 'Bunker Technique', duration: '1:50' },
  { id: '12', type: 'image', src: 'https://images.unsplash.com/photo-1593111773297-6bd04c24c30a?w=400&h=400&fit=crop', title: 'Golf Club Set' },
  { id: '13', type: 'video', src: 'https://images.unsplash.com/photo-1556909114-f6e34c7aec6b?w=400&h=400&fit=crop', title: 'Pro Tournament', duration: '5:30' },
  { id: '14', type: 'image', src: 'https://images.unsplash.com/photo-1529438706095-16dd30c78c3e?w=400&h=400&fit=crop', title: 'Golf Cart Path' },
  { id: '15', type: 'video', src: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=400&h=400&fit=crop', title: 'Iron Play Tips', duration: '2:40' },
  { id: '16', type: 'image', src: 'https://images.unsplash.com/photo-1520637836862-4d197d17c43a?w=400&h=400&fit=crop', title: 'Golf Course Aerial' },
];

const Explore = () => {
  const { query, setQuery, results, loading } = useSearch();
  const [showResults, setShowResults] = useState(false);
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

  const handleContentClick = (content: any) => {
    console.log('Content clicked:', content);
    // Handle navigation to content details
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Search Bar */}
        <div className="mb-6" ref={searchRef}>
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

        {/* Golf Content Grid - Uniform Square Thumbnails */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
          {mockGolfContent.map((content) => (
            <div
              key={content.id}
              className="relative cursor-pointer rounded overflow-hidden bg-muted hover:opacity-90 transition-opacity aspect-square"
              onClick={() => handleContentClick(content)}
            >
              <img
                src={content.src}
                alt={content.title}
                className="w-full h-full object-cover"
              />
              
              {/* Video indicator */}
              {content.type === 'video' && (
                <>
                  <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded text-[10px]">
                    {content.duration}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-2">
                      <Play className="h-4 w-4 text-white fill-current" />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Load more indicator */}
        <div className="mt-8 text-center">
          <div className="text-muted-foreground text-sm">
            Scroll to see more content
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Explore;
