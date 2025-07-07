
import React from 'react';
import { User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
  const navigate = useNavigate();

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'user' && result.username) {
      // Navigate to user profile using their username
      navigate(`/profile/${result.username}`);
    } else if (result.type === 'course') {
      navigate(`/courses/${result.id}`);
    }
    onResultClick(result);
  };

  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md mt-1 shadow-lg z-[9999] pointer-events-auto">
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
      <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md mt-1 shadow-lg z-[9999] pointer-events-auto">
        <div className="p-4 text-center text-muted-foreground">
          No results found for "{query}"
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md mt-1 shadow-lg z-[9999] max-h-96 overflow-y-auto pointer-events-auto">
      {results.map((result) => (
        <div
          key={`${result.type}-${result.id}`}
          className="flex items-center p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
          onClick={() => handleResultClick(result)}
        >
          <div className="mr-3">
            {result.type === 'user' ? (
              <Avatar className="w-10 h-10">
                <AvatarImage src={result.image} alt={result.title} />
                <AvatarFallback>
                  <User className="w-5 h-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                {result.image ? (
                  <img
                    src={result.image}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
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
