
import React from 'react';
import { User, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'user' | 'course';
  title: string;
  subtitle: string;
  image?: string;
  username?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  loading: boolean;
  query: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onResultClick,
  loading,
  query
}) => {
  // Debug logging
  console.log('Search results:', results);
  console.log('Search query:', query);
  
  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md mt-1 shadow-lg z-50">
        <div className="p-4 text-center text-muted-foreground">
          Searching...
        </div>
      </div>
    );
  }

  if (!query.trim()) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md mt-1 shadow-lg z-50">
        <div className="p-4 text-center text-muted-foreground">
          No results found for "{query}"
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md mt-1 shadow-lg z-50 max-h-96 overflow-y-auto">
      {results.map((result) => (
        <div
          key={`${result.type}-${result.id}`}
          className="flex items-center p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
          onClick={() => onResultClick(result)}
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
            {result.type === 'user' ? (
              <User className="w-5 h-5 text-muted-foreground" />
            ) : (
              <MapPin className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{result.title}</p>
            <p className="text-xs text-muted-foreground">{result.subtitle}</p>
          </div>
          <div className="text-xs text-muted-foreground capitalize">
            {result.type}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
