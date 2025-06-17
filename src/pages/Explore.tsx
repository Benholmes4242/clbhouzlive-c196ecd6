
import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import SearchResults from '@/components/search/SearchResults';
import { useSearch } from '@/hooks/useSearch';

// Mock data for the explore grid
const mockExploreContent = [
  { id: '1', type: 'image', src: '/lovable-uploads/8ddf7429-4a0e-4c4b-acb4-6d24f3276505.png', title: 'Golf Course View' },
  { id: '2', type: 'video', src: '/lovable-uploads/8ddf7429-4a0e-4c4b-acb4-6d24f3276505.png', title: 'Swing Analysis', duration: '1:23' },
  { id: '3', type: 'image', src: '/lovable-uploads/8ddf7429-4a0e-4c4b-acb4-6d24f3276505.png', title: 'Tournament Highlights' },
  { id: '4', type: 'video', src: '/lovable-uploads/8ddf7429-4a0e-4c4b-acb4-6d24f3276505.png', title: 'Pro Tips', duration: '2:45' },
  { id: '5', type: 'image', src: '/lovable-uploads/8ddf7429-4a0e-4c4b-acb4-6d24f3276505.png', title: 'Equipment Review' },
  { id: '6', type: 'video', src: '/lovable-uploads/8ddf7429-4a0e-4c4b-acb4-6d24f3276505.png', title: 'Course Tour', duration: '3:12' },
  { id: '7', type: 'image', src: '/lovable-uploads/8ddf7429-4a0e-4c4b-acb4-6d24f3276505.png', title: 'Player Profile' },
  { id: '8', type: 'video', src: '/lovable-uploads/8ddf7429-4a0e-4c4b-acb4-6d24f3276505.png', title: 'Training Session', duration: '0:58' },
  { id: '9', type: 'image', src: '/lovable-uploads/8ddf7429-4a0e-4c4b-acb4-6d24f3276505.png', title: 'Club Comparison' },
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

        {/* Explore Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {mockExploreContent.map((content, index) => (
            <div
              key={content.id}
              className={`relative cursor-pointer rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity ${
                index % 7 === 0 ? 'row-span-2' : ''
              }`}
              style={{
                aspectRatio: index % 7 === 0 ? '1/2' : '1/1'
              }}
              onClick={() => handleContentClick(content)}
            >
              <img
                src={content.src}
                alt={content.title}
                className="w-full h-full object-cover"
              />
              
              {/* Video indicator */}
              {content.type === 'video' && (
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {content.duration}
                </div>
              )}
              
              {/* Content overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 text-white text-sm font-medium">
                  {content.title}
                </div>
              </div>
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
