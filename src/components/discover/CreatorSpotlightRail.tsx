import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import '@/styles/discover-light.css';

interface SpotlightCreator {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
}

interface CreatorSpotlightRailProps {
  creators: SpotlightCreator[];
  isLoading?: boolean;
  className?: string;
}

const CreatorSpotlightRail: React.FC<CreatorSpotlightRailProps> = ({
  creators,
  isLoading,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleCreatorClick = (creator: SpotlightCreator) => {
    navigate(`/u/${creator.username}`);
  };

  if (isLoading) {
    return (
      <div className={`creator-spotlight-rail ${className}`}>
        <div className="creator-spotlight-rail__header">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="creator-spotlight-rail__scroll">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="creator-spotlight-card animate-pulse">
              <div className="w-14 h-14 rounded-full bg-gray-200 mx-auto mb-3" />
              <div className="h-4 w-20 bg-gray-200 rounded mx-auto mb-1" />
              <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!creators || creators.length === 0) {
    return null;
  }

  return (
    <div className={`creator-spotlight-rail ${className}`}>
      <div className="creator-spotlight-rail__header">
        <h3 className="creator-spotlight-rail__title">Creators to Watch</h3>
      </div>
      
      <div className="creator-spotlight-rail__scroll">
        {creators.slice(0, 5).map((creator) => (
          <button
            key={creator.id}
            className="creator-spotlight-card"
            onClick={() => handleCreatorClick(creator)}
          >
            <Avatar className="creator-spotlight-card__avatar">
              <AvatarImage src={creator.avatarUrl} alt={creator.name} />
              <AvatarFallback>
                {creator.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="creator-spotlight-card__name">{creator.name}</div>
            <div className="creator-spotlight-card__handle">@{creator.username}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CreatorSpotlightRail;

// Hook to fetch spotlight creators
export function useSpotlightCreators() {
  const [creators, setCreators] = React.useState<SpotlightCreator[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCreators = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Placeholder data - will be replaced with real API
      setCreators([
        {
          id: '1',
          name: 'Golf Tips Pro',
          username: 'golftipspro',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        },
        {
          id: '2',
          name: 'Swing Coach',
          username: 'swingcoach',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        },
        {
          id: '3',
          name: 'Par3Master',
          username: 'par3master',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        },
        {
          id: '4',
          name: 'Fairway Fun',
          username: 'fairwayfun',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
        },
      ]);
      
      setIsLoading(false);
    };

    fetchCreators();
  }, []);

  return { creators, isLoading };
}
