import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoSearchBarProps {
  onSearch?: (query: string) => void;
  className?: string;
}

/**
 * VideoSearchBar - Search entry for Videos tab
 * Placeholder: "Search videos"
 */
export const VideoSearchBar: React.FC<VideoSearchBarProps> = ({
  onSearch,
  className,
}) => {
  const [query, setQuery] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("px-5", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos"
          className="w-full h-10 pl-10 pr-4 bg-muted/50 border border-border/50 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
        />
      </div>
    </form>
  );
};

export default VideoSearchBar;
