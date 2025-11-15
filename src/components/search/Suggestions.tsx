import React from 'react';
import { User, MapPin, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AvatarSquircle from '@/components/ui/AvatarSquircle';

interface SuggestedCreator {
  id: string;
  type: 'creator' | 'course';
  name: string;
  handle?: string;
  description: string;
  profileImage: string;
  verified?: boolean;
  followers?: number;
  location?: string;
}

interface SuggestionsProps {
  onCreatorClick: (creator: SuggestedCreator) => void;
}

// Mock suggested creators and courses - in real app this would come from backend
const suggestedCreators: SuggestedCreator[] = [
  {
    id: '1',
    type: 'creator',
    name: 'Tiger Woods',
    handle: '@tigerwoods',
    description: 'Professional Golfer & Master Champion',
    profileImage: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=200&h=200&fit=crop&crop=face',
    verified: true,
    followers: 2400000
  },
  {
    id: '2',
    type: 'creator',
    name: 'Michelle Wie',
    handle: '@michellewie',
    description: 'LPGA Tour Professional',
    profileImage: 'https://images.unsplash.com/photo-1501286353178-1ec881214838?w=200&h=200&fit=crop&crop=face',
    verified: true,
    followers: 890000
  },
  {
    id: '3',
    type: 'course',
    name: 'Royal Birkdale',
    description: 'Championship Links Course',
    profileImage: 'https://images.unsplash.com/photo-1485833077593-4278bba3f11f?w=200&h=200&fit=crop&crop=center',
    location: 'Southport, England'
  },
  {
    id: '4',
    type: 'course',
    name: 'Pebble Beach',
    description: 'Iconic Oceanside Golf Course',
    profileImage: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=200&h=200&fit=crop&crop=center',
    location: 'California, USA'
  }
];

const Suggestions: React.FC<SuggestionsProps> = ({ onCreatorClick }) => {
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">Suggestions</h3>
      </div>
      
      <div className="space-y-3">
        {suggestedCreators.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-xl hover:from-gray-50 hover:to-gray-100 transition-all duration-200"
          >
            {/* Profile Image */}
            <div className="relative flex-shrink-0">
              {item.type === 'creator' ? (
                <AvatarSquircle
                  src={item.profileImage}
                  alt={item.name}
                  size={48}
                  fallback={item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden">
                  <img
                    src={item.profileImage}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Verified Badge */}
              {item.verified && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 text-white fill-current" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h4>
                {item.type === 'creator' && (
                  <User className="w-3 h-3 text-gray-400" />
                )}
                {item.type === 'course' && (
                  <MapPin className="w-3 h-3 text-gray-400" />
                )}
              </div>
              
              {item.handle && (
                <p className="text-xs text-gray-500 mb-1">{item.handle}</p>
              )}
              
              <p className="text-xs text-gray-600 truncate">{item.description}</p>
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-1">
                {item.followers && (
                  <span className="text-xs text-gray-500">
                    {formatFollowers(item.followers)} followers
                  </span>
                )}
                {item.location && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.location}
                  </span>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <Button
              variant="gradient"
              size="sm"
              onClick={() => onCreatorClick(item)}
              className="flex-shrink-0 text-xs px-3 py-1 h-7"
            >
              {item.type === 'creator' ? (
                <>
                  <User className="w-3 h-3 mr-1" />
                  View Profile
                </>
              ) : (
                <>
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Explore
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suggestions;