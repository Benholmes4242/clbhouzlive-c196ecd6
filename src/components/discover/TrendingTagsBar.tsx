import React from 'react';
import { X } from 'lucide-react';
import { useTrendingTags } from '@/hooks/useTrendingTags';
import { discoverAnalytics } from '@/utils/discoverAnalytics';

interface TrendingTagsBarProps {
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

const TrendingTagsBar: React.FC<TrendingTagsBarProps> = ({ onTagsChange, className = '' }) => {
  const { tags, loading, selectedTags, toggleTag, clearTags } = useTrendingTags();

  const handleTagToggle = (tag: string) => {
    const wasSelected = selectedTags.includes(tag);
    toggleTag(tag);
    // Analytics for hashtag interaction
    discoverAnalytics.hashtagClicked(tag, !wasSelected);
  };

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
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide md:flex-wrap md:max-h-[60px] md:overflow-y-hidden">
      {/* Clear all button - only show when tags are selected */}
      {selectedTags.length > 0 && (
        <button
          onClick={clearTags}
          className="pill pill--sm pill--active flex items-center gap-1 text-xs font-medium transition-colors flex-shrink-0 focus:outline-none focus:ring-2"
          style={{ backgroundColor: 'hsl(var(--discover-orange))', borderColor: 'hsl(var(--discover-orange))', color: 'white' }}
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
            onClick={() => handleTagToggle(tag.tag)}
            className={`
              pill pill--sm ${isSelected ? 'pill--active' : ''}
              flex items-center gap-1.5 text-xs font-medium transition-all duration-200 flex-shrink-0 focus:outline-none focus:ring-2
            `}
            style={isSelected ? { backgroundColor: 'hsl(var(--discover-orange))', borderColor: 'hsl(var(--discover-orange))', color: 'white' } : {}}
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
  );
};

export default TrendingTagsBar;