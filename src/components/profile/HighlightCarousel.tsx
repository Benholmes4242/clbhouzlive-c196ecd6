import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HighlightCarouselProps {
  userId: string;
}

const HighlightCarousel: React.FC<HighlightCarouselProps> = ({ userId }) => {
  // Mock highlight data
  const highlights = [
    {
      id: '1',
      type: 'activity',
      image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=300&fit=crop',
      title: 'Activity'
    },
    {
      id: '2',
      type: 'handicap',
      image: 'https://images.unsplash.com/photo-1559267200-f29d6297a4ac?w=300&h=300&fit=crop',
      title: 'Handicap'
    },
    {
      id: '3',
      type: 'scottie',
      image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cec4689?w=300&h=300&fit=crop',
      title: 'Scottie'
    }
  ];

  return (
    <div className="px-4 py-6">
      <div className="relative">
        {/* Scroll Container */}
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {highlights.map((highlight) => (
            <div
              key={highlight.id}
              className="flex-shrink-0 w-48 h-32 relative rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform"
            >
              <img
                src={highlight.image}
                alt={highlight.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="text-white font-semibold text-lg">
                  {highlight.title}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation Arrows - Desktop */}
        <button className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full items-center justify-center text-white hover:bg-black/70 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full items-center justify-center text-white hover:bg-black/70 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default HighlightCarousel;