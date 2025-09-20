import React from 'react';
import { X } from 'lucide-react';
import { useTrendingTags } from '@/hooks/useTrendingTags';

interface TrendingTagsBarProps {
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

const TrendingTagsBar: React.FC<TrendingTagsBarProps> = ({ onTagsChange, className = '' }) => {
  const { tags, loading, selectedTags, toggleTag, clearTags } = useTrendingTags();

  React.useEffect(() => {
    onTagsChange(selectedTags);
  }, [selectedTags, onTagsChange]);

  if (loading) {
    return (
      <div className={`px-4 md:container md:mx-auto md:px-6 ${className}`}>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {Array.from({ length: 8 }).map((_, index) => (
            <div 
              key={index}
              className="h-8 bg-muted rounded-full animate-pulse flex-shrink-0"
              style={{ width: `${Math.random() * 40 + 60}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="mt-2 pb-2">{/* Static positioning - no longer sticky */}
      <div className="px-4 md:container md:mx-auto md:px-6">{/* Container with proper spacing */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {/* Clear all button - only show when tags are selected */}
          {selectedTags.length > 0 && (
            <button
              onClick={clearTags}
              className="flex items-center gap-1 px-3 py-1.5 bg-discover-orange text-white text-xs font-medium rounded-full hover:bg-discover-orange-dark transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-discover-orange/50"
              aria-label="Clear all selected tags"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
          
          {/* Trending tags */}
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.tag);
            
            return (
              <button
                key={tag.tag}
                onClick={() => toggleTag(tag.tag)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 flex-shrink-0 border min-h-[44px] focus:outline-none focus:ring-2
                  ${isSelected 
                    ? 'bg-discover-orange text-white border-discover-orange shadow-sm focus:ring-discover-orange/50' 
                    : 'bg-white/70 backdrop-blur-sm text-foreground border-border hover:border-discover-orange/30 hover:bg-discover-orange/5 focus:ring-discover-orange/30'
                  }
                `}
                aria-label={`${isSelected ? 'Remove' : 'Add'} ${tag.tag} tag filter`}
              >
                <span className="font-medium">#{tag.tag}</span>
                <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {formatCount(tag.uses)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrendingTagsBar;