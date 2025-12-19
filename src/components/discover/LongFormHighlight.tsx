import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getStreamPoster, getStreamIdFromUrl } from '@/utils/stream';
import '@/styles/discover-light.css';

interface LongFormItem {
  id: string;
  title: string;
  creatorName: string;
  thumbnailUrl: string;
  videoUrl?: string;
  durationSeconds: number;
  postId: string;
}

interface LongFormHighlightProps {
  items: LongFormItem[];
  isLoading?: boolean;
  className?: string;
}

// Format duration as "X:XX" or "X:XX:XX"
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

const LongFormHighlight: React.FC<LongFormHighlightProps> = ({
  items,
  isLoading,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleItemClick = (item: LongFormItem) => {
    navigate(`/clubhouse/post/${item.postId}`);
  };

  if (isLoading) {
    return (
      <div className={`longform-highlight ${className}`}>
        <div className="longform-highlight__header">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="longform-highlight__grid">
          {[1, 2].map((i) => (
            <div key={i} className="longform-card animate-pulse">
              <div className="longform-card__media bg-gray-200" />
              <div className="longform-card__content">
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={`longform-highlight ${className}`}>
      <div className="longform-highlight__header">
        <span className="longform-highlight__label">Worth Watching</span>
      </div>
      
      <div className="longform-highlight__grid">
        {items.slice(0, 2).map((item) => (
          <button
            key={item.id}
            className="longform-card"
            onClick={() => handleItemClick(item)}
          >
            <div className="longform-card__media">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                loading="lazy"
              />
              <span className="longform-card__duration">
                {formatDuration(item.durationSeconds)}
              </span>
            </div>
            <div className="longform-card__content">
              <h4 className="longform-card__title">{item.title}</h4>
              <p className="longform-card__creator">{item.creatorName}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LongFormHighlight;

// Hook to fetch long-form content
export function useLongFormHighlights() {
  const [items, setItems] = React.useState<LongFormItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Placeholder data - will be replaced with real API
      setItems([
        {
          id: '1',
          title: 'Breaking Down the Perfect Swing',
          creatorName: 'Golf Academy',
          thumbnailUrl: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800&h=450&fit=crop',
          durationSeconds: 845,
          postId: 'placeholder-1',
        },
        {
          id: '2',
          title: 'Course Vlog: St Andrews Old Course',
          creatorName: 'Links Lover',
          thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=450&fit=crop',
          durationSeconds: 1230,
          postId: 'placeholder-2',
        },
      ]);
      
      setIsLoading(false);
    };

    fetchItems();
  }, []);

  return { items, isLoading };
}
