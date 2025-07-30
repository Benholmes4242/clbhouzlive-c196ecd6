import React, { useState, useEffect } from 'react';
import { Play, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedCreator {
  id: string;
  displayName: string;
  handle: string;
  profileImage: string;
  tagline: string;
  isVerified?: boolean;
}

interface FeaturedCreatorProps {
  onCreatorClick: (creator: FeaturedCreator) => void;
}

// Mock featured creators data - in real app this would come from backend
const featuredCreators: FeaturedCreator[] = [
  {
    id: '1',
    displayName: 'Tiger Woods',
    handle: '@tigerwoods',
    profileImage: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=200&h=200&fit=crop&crop=face',
    tagline: 'Master of the Game',
    isVerified: true
  },
  {
    id: '2',
    displayName: 'Michelle Wie',
    handle: '@michellewie',
    profileImage: 'https://images.unsplash.com/photo-1501286353178-1ec881214838?w=200&h=200&fit=crop&crop=face',
    tagline: 'Creator of the Week',
    isVerified: true
  },
  {
    id: '3',
    displayName: 'Jordan Spieth',
    handle: '@jordanspieth',
    profileImage: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=200&h=200&fit=crop&crop=face',
    tagline: 'Watch Their Best Shot',
    isVerified: false
  },
  {
    id: '4',
    displayName: 'Lexi Thompson',
    handle: '@lexithompson',
    profileImage: 'https://images.unsplash.com/photo-1485833077593-4278bba3f11f?w=200&h=200&fit=crop&crop=face',
    tagline: 'Pro Tips & Insights',
    isVerified: true
  },
  {
    id: '5',
    displayName: 'Bryson DeChambeau',
    handle: '@brysondechambeau',
    profileImage: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=200&h=200&fit=crop&crop=face',
    tagline: 'Science of Golf',
    isVerified: false
  }
];

const FeaturedCreator: React.FC<FeaturedCreatorProps> = ({ onCreatorClick }) => {
  const [currentCreatorIndex, setCurrentCreatorIndex] = useState(0);
  const [currentCreator, setCurrentCreator] = useState(featuredCreators[0]);

  // Rotate featured creator every 6 hours (or on component mount for demo)
  useEffect(() => {
    const rotateCreator = () => {
      const randomIndex = Math.floor(Math.random() * featuredCreators.length);
      setCurrentCreatorIndex(randomIndex);
      setCurrentCreator(featuredCreators[randomIndex]);
    };

    // Set initial random creator
    rotateCreator();

    // Rotate every 6 hours (21600000 ms) - for demo, using 30 seconds
    const interval = setInterval(rotateCreator, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleTileClick = () => {
    onCreatorClick(currentCreator);
  };

  return (
    <div className="px-4 pt-3 pb-4">
      <div 
        onClick={handleTileClick}
        className={cn(
          "relative overflow-hidden rounded-xl p-4 cursor-pointer",
          "bg-gradient-to-r from-emerald-50 to-green-50",
          "border border-emerald-100/50",
          "shadow-sm hover:shadow-md transition-all duration-300",
          "hover:scale-[1.02] active:scale-[0.98]",
          "min-h-[130px] flex items-center"
        )}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-emerald-100/20" />
        
        {/* Content Container */}
        <div className="relative z-10 flex items-center w-full gap-4">
          
          {/* Left Side - Profile Image (40%) */}
          <div className="flex-shrink-0 relative">
            <div className="relative">
              <img
                src={currentCreator.profileImage}
                alt={currentCreator.displayName}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
              />
              
              {/* Verified Badge */}
              {currentCreator.isVerified && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Star className="w-3 h-3 text-white fill-current" />
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Creator Info (60%) */}
          <div className="flex-1 min-w-0">
            <div className="space-y-1">
              {/* Display Name */}
              <h3 className="font-semibold text-foreground text-base leading-tight truncate">
                {currentCreator.displayName}
              </h3>
              
              {/* Handle */}
              <p className="text-sm text-muted-foreground truncate">
                {currentCreator.handle}
              </p>
              
              {/* Tagline */}
              <p className="text-sm text-emerald-700 font-medium">
                {currentCreator.tagline}
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex-shrink-0">
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
              "bg-gradient-to-b from-white to-gray-50 border border-gray-200",
              "hover:from-gray-50 hover:to-gray-100 active:from-gray-100 active:to-gray-200"
            )}>
              <Play className="w-4 h-4 text-gray-700 fill-current" />
              <span className="text-sm font-semibold text-gray-700">View</span>
            </div>
          </div>
        </div>

        {/* Highlight Accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-green-500" />
      </div>
    </div>
  );
};

export default FeaturedCreator;
export type { FeaturedCreator as FeaturedCreatorType };